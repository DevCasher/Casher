export interface Responsavel {
  id: string;
  nome: string;
  sincronizado?: boolean;
  atualizado_em?: string;
  deletado_em?: string | null;
}