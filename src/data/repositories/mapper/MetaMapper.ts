import { Meta } from "../../../core/entities/Meta";

export const mapToMeta = (row: any): Meta => {
    return {
        id: row.id,
        categoria_id: row.categoria_id,
        nome: row.nome,
        valor_objetivo: row.valor_objetivo,
        valor_atual: row.valor_atual,
        peso_porcentagem: row.peso_porcentagem,
        status: row.status,
        sincronizado: row.sincronizado === 1,
        atualizado_em: row.atualizado_em,
        deletado_em: row.deletado_em
    };
}