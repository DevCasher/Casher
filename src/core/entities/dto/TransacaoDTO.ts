export interface RegistrarTransacaoInput {
  valor: number;
  descricao: string;
  tipo: 'Entrada' | 'Saida' | 'Investimento';
  contaId: string;
  categoriaId: string;
  metaId?: string;
  data: string;
}