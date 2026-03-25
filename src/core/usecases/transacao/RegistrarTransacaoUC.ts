import { v4 as uuidv4 } from 'uuid';
import { Transacao } from '../../entities/Transacao';
import { TransacaoDTO } from '../../entities/dto/TransacaoDTO';
import { ITransacaoRepository } from '../../repositories/ITransacaoRepository';
import { ProcessarEntradaUC } from "./ProcessarEntradaUC";
import { ProcessarSaidaUC } from "./ProcessarSaidaUC";
import { ProcessarInvestimentoUC } from "./ProcessarInvestimentoUC";

export class RegistrarTransacaoUC {
  constructor(
    private transacaoRepo: ITransacaoRepository,
    private processarEntrada: ProcessarEntradaUC,
    private processarSaida: ProcessarSaidaUC,
    private processarInvestimento: ProcessarInvestimentoUC
  ) {}

  async execute(input: TransacaoDTO): Promise<void> {
    const novaTransacao: Transacao = {
      id: uuidv4(),
      responsavel_id: input.responsavel_id,
      categoria_id: input.categoria_id,
      meta_id: input.meta_id,
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
      await this.processarSaida.execute(input.valor, input.categoria_id, input.data);
      
    } else if (input.tipo === 'Entrada') {
      await this.processarEntrada.execute(input.valor, input.data);

    } else if (input.tipo === 'Investimento') {
      await this.processarInvestimento.execute(input.valor);

    }
  }
}