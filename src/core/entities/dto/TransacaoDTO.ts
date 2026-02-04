export interface RegistrarTransacaoInput {
  valor: number;
  descricao: string;
  tipo: 'Entrada' | 'Saida' | 'Investimento' | 'Juros';
  contaId: string;
  categoriaId: string;
  metaId?: string;
  data: string;
}