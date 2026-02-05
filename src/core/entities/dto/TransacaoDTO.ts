export interface TransacaoDTO {
  valor: number;
  descricao: string;
  tipo: 'Entrada' | 'Saida' | 'Investimento' | 'Juros';
  contaId: string;
  responsavelId: string;
  categoriaId: string;
  metaId?: string;
  data: string;
}