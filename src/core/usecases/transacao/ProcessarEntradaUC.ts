import { ICategoriaRepository } from "../../repositories/ICategoriaRepository";
import { IMetaRepository } from "../../repositories/IMetaRepository";
import { IOrcamentoMensalRepository } from "../../repositories/IOrcamentoMensalRepository";

export class ProcessarEntradaUC {
  constructor(
    private categoriaRepo: ICategoriaRepository,
    private metaRepo: IMetaRepository,
    private orcamentoRepo: IOrcamentoMensalRepository
  ) {}

  async execute(valor: number, dataISO: string): Promise<void> {
    const categorias = await this.categoriaRepo.getAll();
    const metas = await this.metaRepo.getAllAtivas();

    const somaPesos = categorias.reduce((sum, c) => sum + (c.peso_porcentagem || 0), 0) + 
      metas.reduce((sum, m) => sum + (m.peso_porcentagem || 0), 0);

    if (somaPesos === 0) return;

    for (const cat of categorias) {
      if (cat.peso_porcentagem > 0) {
        const parte = (valor * cat.peso_porcentagem) / somaPesos;
        
        const atual = await this.orcamentoRepo.getAtualByCategoria(cat.id);
        const novoSaldo = (atual?.valor_disponivel || 0) + parte;
        atual!.valor_disponivel = novoSaldo;
        await this.orcamentoRepo.update(atual!);
      }
    }

    for (const meta of metas) {
      if (meta.peso_porcentagem > 0) {
        const parte = (valor * meta.peso_porcentagem) / somaPesos;
        await this.metaRepo.updateValorAtual(meta.id, parte);
      }
    }
  }
}