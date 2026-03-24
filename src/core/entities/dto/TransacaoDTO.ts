export interface TransacaoDTO {
  valor: number;
  descricao: string;
  tipo: 'Entrada' | 'Saida' | 'Investimento' | 'Juros';
  conta_id: string;
  responsavel_id: string;
  categoria_id: string;
  meta_id?: string;
  data: string;
}