import { Responsavel } from "../../../core/entities/Responsavel";

export const mapToResponsavel = (row: any): Responsavel => {
    return {
        id: row.id,
        nome: row.nome,
        sincronizado: row.sincronizado === 1,
        atualizado_em: row.atualizado_em,
        deletado_em: row.deletado_em
    };
}