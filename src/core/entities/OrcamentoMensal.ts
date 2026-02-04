export interface OrcamentoMensal {
  id: string;
  categoria_id: string;
  mes: string;
  valor_disponivel: number;
  sincronizado?: boolean;
  atualizado_em?: string;
  deletado_em?: string | null;
}