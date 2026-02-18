export interface TransacaoFiltroDTO {
    dataInicio?: string;
    dataFim?: string;
    categoriaId?: string;
    metaId?: string;
    tipo?: 'Entrada' | 'Saida' | 'Investimento' | 'Juros';
}