export interface Transacao {
    id: string;
    conta_id: string;
    responsavel_id: string;
    categoria_id: string;
    meta_id?: string;
    descricao: string;
    valor: number;
    tipo: 'Entrada' | 'Saida' | 'Investimento' | 'Juros';
    data: string;
    sincronizado: boolean;
    atualizado_em: string;
    deletado_em: string | null;
}