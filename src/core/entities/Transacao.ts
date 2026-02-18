export interface Transacao {
    id: string;
    conta_id: string;
    responsavel_id: string;
    categoria_id: string;
    meta_id?: string;
<<<<<<< HEAD
    descricao: string;
    valor: number;
=======
    valor_total: number;
>>>>>>> 493d5c4 (:sparkles: feat: CRUD Transação)
    tipo: 'Entrada' | 'Saida' | 'Investimento' | 'Juros';
    data: string;
    sincronizado: boolean;
    atualizado_em: string;
    deletado_em: string | null;
}