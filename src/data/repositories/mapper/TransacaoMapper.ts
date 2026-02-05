import { Transacao } from "../../../core/entities/Transacao";

export const mapToTransacao = (row: any): Transacao => {
    return {
        id: row.id,
        conta_id: row.conta_id,
        responsavel_id: row.responsavel_id,
        categoria_id: row.categoria_id,
        meta_id: row.meta_id || undefined,
        valor_total: row.valor_total,
        tipo: row.tipo,
        data: row.data,
        sincronizado: row.sincronizado === 1,
        atualizado_em: row.atualizado_em,
        deletado_em: row.deletado_em,
    };
}