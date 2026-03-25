import { ICategoriaRepository } from "../../repositories/ICategoriaRepository";
import { IMetaRepository } from "../../repositories/IMetaRepository";
import { IOrcamentoMensalRepository } from "../../repositories/IOrcamentoMensalRepository";

interface CandidatoDrenagem {
    id: string;
    peso_porcentagem: number;
    saldo: number;
    toPay?: number;
    willZero?: boolean;
}

export class ProcessarSaidaUC {
    constructor(
        private categoriaRepo: ICategoriaRepository,
        private metaRepo: IMetaRepository,
        private orcamentoRepo: IOrcamentoMensalRepository
    ) { }

    async execute(valor: number, categoriaId: string, dataISO: string): Promise<void> {
        const orcamentoPrincipal = await this.orcamentoRepo.getAtualByCategoria(categoriaId);
        let saldoDisponivel = 0;

        if (orcamentoPrincipal) {
            saldoDisponivel = orcamentoPrincipal.valor_disponivel;

            if (saldoDisponivel >= valor) {
                orcamentoPrincipal.valor_disponivel = saldoDisponivel - valor;
                await this.orcamentoRepo.update(orcamentoPrincipal);
                return;
            } else {
                orcamentoPrincipal.valor_disponivel = 0;
                await this.orcamentoRepo.update(orcamentoPrincipal);
            }
        }

        let prejuizoRestante = valor - saldoDisponivel;

        const categorias = await this.categoriaRepo.getAll();
        const orcamentosDoMes = await this.orcamentoRepo.getAllAtual();

        let candidatos: CandidatoDrenagem[] = categorias
            .filter(c => c.id !== categoriaId)
            .map(cat => ({
                id: cat.id,
                peso_porcentagem: cat.peso_porcentagem,
                saldo: orcamentosDoMes.find(o => o.categoria_id === cat.id)?.valor_disponivel || 0
            }))
            .filter(c => c.saldo > 0 && c.peso_porcentagem > 0);

        prejuizoRestante = await this.drenarProporcionalmente(prejuizoRestante, candidatos, async (id, novoSaldo) => {
            const orcamentoCand = await this.orcamentoRepo.getAtualByCategoria(id);
            if (orcamentoCand) {
                orcamentoCand.valor_disponivel = novoSaldo;
                await this.orcamentoRepo.update(orcamentoCand);
            }
        });

        if (prejuizoRestante > 0.01) {
            const metas = await this.metaRepo.getAllAtivas();
            let candidatosMeta: CandidatoDrenagem[] = metas
                .filter(m => m.valor_atual > 0)
                .map(m => ({ 
                    id: m.id, 
                    peso_porcentagem: m.peso_porcentagem, 
                    saldo: m.valor_atual 
                }));

            await this.drenarProporcionalmente(prejuizoRestante, candidatosMeta, async (id, novoSaldo) => {
                const metaOriginal = metas.find(m => m.id === id);
                if (metaOriginal) {
                    const delta = novoSaldo - metaOriginal.valor_atual;
                    await this.metaRepo.updateValorAtual(id, delta);
                }
            });
        }
    }

    private async drenarProporcionalmente(
        dividaTotal: number,
        candidatos: CandidatoDrenagem[],
        salvarCallback: (id: string, novoSaldo: number) => Promise<void>
    ): Promise<number> {

        let divida = dividaTotal;
        const candidatosParaSalvar = [...candidatos];

        while (divida > 0.01 && candidatos.length > 0) {
            const pesoTotal = candidatos.reduce((sum, c) => sum + c.peso_porcentagem, 0);
            if (pesoTotal === 0) break;

            for (const cand of candidatos) {
                const share = (cand.peso_porcentagem / pesoTotal) * divida;
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

        for (const c of candidatosParaSalvar) {
            await salvarCallback(c.id, c.saldo);
        }

        return divida;
    }
}