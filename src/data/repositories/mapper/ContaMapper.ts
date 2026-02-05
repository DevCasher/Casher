import { Conta } from "../../../core/entities/Conta";

export const mapToConta = (row: any): Conta => {
    return {
        id: row.id,
        nome: row.nome,
        tipo: row.tipo,
        saldo: row.saldo,
        sincronizado: row.sincronizado === 1,
        atualizado_em: row.atualizado_em,
        deletado_em: row.deletado_em
    };
}