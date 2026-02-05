import { Categoria } from "../../../core/entities/Categoria";

export const mapToCategoria = (row: any): Categoria => {
    return {
        id: row.id,
        nome: row.nome,
        peso_porcentagem: row.peso_porcentagem,
        sincronizado: row.sincronizado === 1,
        atualizado_em: row.atualizado_em,
        deletado_em: row.deletado_em
    };
}