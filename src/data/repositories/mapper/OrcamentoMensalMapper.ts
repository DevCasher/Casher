import { OrcamentoMensal } from "../../../core/entities/OrcamentoMensal";

export const mapToOrcamentoMensal = (row: any): OrcamentoMensal => {
  return {
    id: row.id,
    categoria_id: row.categoria_id,
    mes: row.mes,
    valor_disponivel: row.valor_disponivel,
    sincronizado: row.sincronizado === 1,
    atualizado_em: row.atualizado_em,
    deletado_em: row.deletado_em
  };
}