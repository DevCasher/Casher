export interface Meta {
    id: string;
    categoria_id: string;
    nome: string;
    valor_objetivo: number;
    valor_atual: number;
    peso_porcentagem: number;
    status: 'Andamento' | 'Concluida' | 'Finalizada';
    sincronizado: boolean;
    atualizado_em: string;
    deletado_em: string | null;
}