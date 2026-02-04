export interface Conta {
    id: string;
    nome: string;
    tipo: 'Investimento' | 'Corrente'
    saldo: number;
    sincronizado: boolean;
    atualizado_em: string;
    deletado_em: string;
}