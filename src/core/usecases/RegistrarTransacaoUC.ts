import { v4 as uuidv4 } from 'uuid';
import { Transacao } from "../entities/Transacao";
import { ITransacaoRepository } from "../repositories/ITransacaoRepository";
import { IContaRepository } from "../repositories/IContaRepository";
import { ICategoriaRepository } from "../repositories/ICategoriaRepository";
import { IMetaRepository } from "../repositories/IMetaRepository";
import { IOrcamentoRepository } from "../repositories/IOrcamentoRepository";
import { TransacaoDTO } from "../dtos/TransacaoDTO";

export class RegistrarTransacaoUC {
  constructor(
    private transacaoRepo: ITransacaoRepository,
    private contaRepo: IContaRepository,
    private categoriaRepo: ICategoriaRepository,
    private metaRepo: IMetaRepository,
    private orcamentoRepo: IOrcamentoRepository
  ) {}

  async execute(input: TransacaoDTO): Promise<void> {
    const conta = await this.contaRepo.getById(input.contaId);
    if (!conta) throw new Error("Conta não encontrada");

    const novaTransacao: Transacao = {
      id: uuidv4(),
      conta_id: conta.id,
      categoria_id: input.categoriaId,
      meta_id: input.metaId,
      descricao: input.descricao,
      valor: input.valor,
      tipo: input.tipo,
      data: input.data,
      status: 'Efetivado',
      sincronizado: false
    };

    await this.transacaoRepo.create(novaTransacao);

    if (input.tipo === 'Entrada') {
      await this.processarEntrada(input.valor, input.contaId, conta.saldo_atual, input.dataISO);
    } else if (input.tipo === 'Saida') {
      await this.processarSaida(input.valor, input.contaId, conta.saldo_atual, input.categoriaId, input.dataISO);
    } else if (input.tipo === 'Investimento') {
      await this.contaRepo.updateSaldo(input.contaId, conta.saldo_atual + input.valor);
    }
  }

  private async processarEntrada(valor: number, contaId: string, saldoAtual: number, data: string): Promise<void> {
    await this.contaRepo.updateSaldo(contaId, saldoAtual + valor);

    const categorias = await this.categoriaRepo.getAll();
    const metas = await this.metaRepo.getAllAtivas();

    const somaPesosCategorias = categorias.reduce((sum, cat) => sum + (cat.peso_porcentagem || 0), 0);
    const somaPesosMetas = metas.reduce((sum, meta) => sum + (meta.peso_porcentagem || 0), 0);
    const pesoTotal = somaPesosCategorias + somaPesosMetas;

    if (pesoTotal === 0) return;

    const mesReferencia = data.substring(0, 7);
    
    for (const cat of categorias) {
      if (cat.peso_porcentagem > 0) {
        const valorParaCategoria = (valor * cat.peso_porcentagem) / pesoTotal;
        await this.orcamentoRepo.update(cat.id, mesReferencia, valorParaCategoria);
      }
    }

    for (const meta of metas) {
      if (meta.peso_porcentagem > 0) {
        const valorParaMeta = (valor * meta.peso_porcentagem) / pesoTotal;
        await this.metaRepo.updateValorAtual(meta.id, valorParaMeta);
      }
    }
  }

  private async processarSaida(valor: number, contaId: string, saldoAtual: number, categoriaId: string, data: string): Promise<void> {
    await this.contaRepo.updateSaldo(contaId, saldoAtual - valor);

    const mesReferencia = data.substring(0, 7);
    await this.orcamentoRepo.update(categoriaId, mesReferencia, -valor);
  }
}