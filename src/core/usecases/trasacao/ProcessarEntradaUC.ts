import { Conta } from "../../entities/Conta";
import { IContaRepository } from "../repositories/IContaRepository";
import { ICategoriaRepository } from "../repositories/ICategoriaRepository";
import { IMetaRepository } from "../repositories/IMetaRepository";
import { IOrcamentoRepository } from "../repositories/IOrcamentoRepository";

export class ProcessarEntradaUC {
  constructor(
    private contaRepo: IContaRepository,
    private categoriaRepo: ICategoriaRepository,
    private metaRepo: IMetaRepository,
    private orcamentoRepo: IOrcamentoRepository
  ) {}

  async execute(valor: number, conta: Conta, dataISO: string): Promise<void> {
    await this.contaRepo.updateSaldo(conta.id, conta.saldo_atual + valor);

    const categorias = await this.categoriaRepo.getAll();
    const metas = await this.metaRepo.getAllAtivas();

    const somaPesos = categorias.reduce((sum, c) => sum + (c.peso_porcentagem || 0), 0) + 
      metas.reduce((sum, m) => sum + (m.peso_porcentagem || 0), 0);

    if (somaPesos === 0) return;

    const mesReferencia = dataISO.substring(0, 7);

    for (const cat of categorias) {
      if (cat.peso_porcentagem > 0) {
        const parte = (valor * cat.peso_porcentagem) / somaPesos;
        
        const atual = await this.orcamentoRepo.getByCategoriaMes(cat.id, mesReferencia);
        const novoSaldo = (atual?.valor_disponivel || 0) + parte;
        await this.orcamentoRepo.upsert(cat.id, mesReferencia, novoSaldo);
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