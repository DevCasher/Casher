import { Conta } from "../../entities/Conta";
import { Categoria } from "../../entities/Categoria";
import { IContaRepository } from "../../repositories/IContaRepository";
import { ICategoriaRepository } from "../../repositories/ICategoriaRepository";
import { IMetaRepository } from "../../repositories/IMetaRepository";
import { IOrcamentoMensalRepository } from "../../repositories/IOrcamentoMensalRepository";

export class ProcessarSaidaUC {
    constructor(
        private contaRepo: IContaRepository,
        private categoriaRepo: ICategoriaRepository,
        private metaRepo: IMetaRepository,
        private orcamentoRepo: IOrcamentoMensalRepository
    ) { }

    async execute(valor: number, conta: Conta, categoriaId: string, dataISO: string): Promise<void> {
        await this.contaRepo.updateSaldo(conta.id, conta.saldo_atual - valor);

        const mesReferencia = dataISO.substring(0, 7);
        const orcamentoPrincipal = await this.orcamentoRepo.getByCategoriaMes(categoriaId, mesReferencia);
        const saldoDisponivel = orcamentoPrincipal ? orcamentoPrincipal.valor_disponivel : 0;

        if (saldoDisponivel >= valor) {
            await this.orcamentoRepo.upsert(categoriaId, mesReferencia, saldoDisponivel - valor);
            return;
        }

        await this.orcamentoRepo.upsert(categoriaId, mesReferencia, 0);

        let prejuizoRestante = valor - saldoDisponivel;

        const categorias = await this.categoriaRepo.getAll();
        const orcamentosDoMes = await this.orcamentoRepo.getAllByMes(mesReferencia);

        let candidatos = categorias
            .filter(c => c.id !== categoriaId)
            .map(cat => ({
                id: cat.id,
                peso: cat.peso_porcentagem,
                saldo: orcamentosDoMes.find(o => o.categoria_id === cat.id)?.valor_disponivel || 0
            }))
            .filter(c => c.saldo > 0 && c.peso > 0);

        prejuizoRestante = await this.drenarProporcionalmente(prejuizoRestante, candidatos, async (id, novoSaldo) => {
            await this.orcamentoRepo.upsert(id, mesReferencia, novoSaldo);
        });

        if (prejuizoRestante > 0.01) {
            const metas = await this.metaRepo.getAllAtivas();
            let candidatosMeta = metas
                .filter(m => m.valor_atual > 0)
                .map(m => ({ id: m.id, peso: m.peso_porcentagem, saldo: m.valor_atual }));

            await this.drenarProporcionalmente(prejuizoRestante, candidatosMeta, async (id, novoSaldo) => {
                const metaOriginal = metas.find(m => m.id === id);
                const delta = novoSaldo - (metaOriginal?.valor_atual || 0);
                await this.metaRepo.updateValorAtual(id, delta);
            });
        }
    }

    private async drenarProporcionalmente(
        dividaTotal: number,
        candidatos: Categoria[],
        salvarCallback: (id: string, novoSaldo: number) => Promise<void>
    ): Promise<number> {

        let divida = dividaTotal;

        while (divida > 0.01 && candidatos.length > 0) {
            const pesoTotal = candidatos.reduce((sum, c) => sum + c.peso, 0);
            if (pesoTotal === 0) break;

            for (const cand of candidatos) {
                const share = (cand.peso / pesoTotal) * divida;
                if (cand.saldo <= share) {
                    cand.toPay = cand.saldo;
                    cand.willZero = true;
                } else {
                    cand.toPay = share;
                    cand.willZero = false;
                }
            }

            let totalDescontadoNestaRodada = 0;
            for (const cand of candidatos) {
                const valorAPagar = cand.toPay || 0;
                cand.saldo -= valorAPagar;
                totalDescontadoNestaRodada += valorAPagar;
            }

            divida -= totalDescontadoNestaRodada;

            for (let i = candidatos.length - 1; i >= 0; i--) {
                if (candidatos[i].willZero) candidatos.splice(i, 1);
            }

            if (totalDescontadoNestaRodada <= 0) break;
        }

        for (const c of candidatos) {
            await salvarCallback(c.id, c.saldo);
        }

        return divida;
    }
}