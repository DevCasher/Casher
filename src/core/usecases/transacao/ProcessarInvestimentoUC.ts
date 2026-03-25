import { IMetaRepository } from "../../repositories/IMetaRepository";

export class ProcessarInvestimentoUC {
  constructor(
    private metaRepo: IMetaRepository
  ) {}

  async execute(valor: number ): Promise<void> {
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