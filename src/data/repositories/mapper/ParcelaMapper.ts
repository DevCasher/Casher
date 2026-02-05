import { Parcela } from "../../../core/entities/Parcela"

export const mapToParcela = (row: any): Parcela => {
    return {
        id: row.id,
        transacao_id: row.transacao_id,
        valor: row.valor,
        data_vencimento: row.data_vencimento,
        sincronizado: row.sincronizado === 1,
        atualizado_em: row.atualizado_em,
        deletado_em: row.deletado_em,
    };
}