import { Conta } from "../../entities/Conta";
import { IContaRepository } from "../../repositories/IContaRepository";
import { IMetaRepository } from "../../repositories/IMetaRepository";

export class ProcessarInvestimentoUC {
  constructor(
    private contaRepo: IContaRepository,
    private metaRepo: IMetaRepository
  ) {}

  async execute(valor: number, conta: Conta ): Promise<void> {
    await this.contaRepo.updateSaldo(conta.id, conta.saldo_atual + valor);

    const metas = await this.metaRepo.getAllAtivas();
    const somaPesos = metas.reduce((sum, m) => sum + (m.peso_porcentagem || 0), 0);

    if (somaPesos > 0) {
      for (const meta of metas) {
        if (meta.peso_porcentagem > 0) {
          const parte = (valor * meta.peso_porcentagem) / somaPesos;
          await this.metaRepo.updateValorAtual(meta.id, parte);
        }
      }
    }
  }
}