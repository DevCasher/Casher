import { v4 as uuidv4 } from 'uuid';
import { Transacao } from '../../entities/Transacao';
import { TransacaoDTO } from '../../entities/dto/TransacaoDTO';
import { ITransacaoRepository } from '../../repositories/ITransacaoRepository';
import { IContaRepository } from '../../repositories/IContaRepository';
import { ProcessarEntradaUC } from "./ProcessarEntradaUC";
import { ProcessarSaidaUC } from "./ProcessarSaidaUC";
import { ProcessarInvestimentoUC } from "./ProcessarInvestimentoUC";

export class RegistrarTransacaoUC {
  constructor(
    private transacaoRepo: ITransacaoRepository,
    private contaRepo: IContaRepository,
    private processarEntrada: ProcessarEntradaUC,
    private processarSaida: ProcessarSaidaUC,
    private processarInvestimento: ProcessarInvestimentoUC
  ) {}

  async execute(input: TransacaoDTO): Promise<void> {
    const conta = await this.contaRepo.getById(input.contaId);
    if (!conta) throw new Error("Conta não encontrada");

    const novaTransacao: Transacao = {
      id: uuidv4(),
      conta_id: conta.id,
      responsavel_id: input.responsavelId,
      categoria_id: input.categoriaId,
      meta_id: input.metaId,
      descricao: input.descricao,
      valor: input.valor,
      tipo: input.tipo,
      data: input.data,
      sincronizado: false,
      atualizado_em: new Date().toISOString(),
      deletado_em: null
    };

    await this.transacaoRepo.create(novaTransacao);

    if (input.tipo === 'Saida') {
      await this.processarSaida.execute(input.valor, conta, input.categoriaId, input.data);
      
    } else if (input.tipo === 'Entrada') {
      await this.processarEntrada.execute(input.valor, conta, input.data);

    } else if (input.tipo === 'Investimento') {
      await this.processarInvestimento.execute(input.valor, conta);

    }
  }
}