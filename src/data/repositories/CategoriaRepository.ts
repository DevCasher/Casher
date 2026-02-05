import { ICategoriaRepository } from "../../core/repositories/ICategoriaRepository";
import { Categoria } from "../../core/entities/Categoria";
import { mapToCategoria } from "../repositories/mapper/CategoriaMapper";
import { getDB } from "../local/database";

export class CategoriaRepository implements ICategoriaRepository {

    async create(categoria: Categoria): Promise<void> {
        const db = getDB();
        await db.runAsync(
            `INSERT INTO categoria (id, nome, peso_porcentagem, sincronizado, atualizado_em, deletado_em)
            VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [categoria.id, categoria.nome, categoria.peso_porcentagem]
        );
    }

    async getAll(): Promise<Categoria[]> {
        const db = getDB();
        const result = await db.getAllAsync<any>(`SELECT * FROM categoria WHERE deletado_em  IS NULL ORDER BY nome ASC`);

        return result.map(mapToCategoria);
    }

    async getById(id: string): Promise<Categoria | null> {
        const db = getDB();
        const result = await db.getFirstAsync<any>(
            `SELECT * FROM categoria WHERE id = ? AND deletado_em IS NULL`,
            [id]
        );

        if (!result) return null;

        return result ? mapToCategoria(result) : null;
    }

    async update(categoria: Categoria): Promise<void> {
        const db = getDB();
        await db.runAsync(
            `UPDATE categoria
                SET nome = ?, peso_porcentagem = ?, sincronizado = 0, atualizado_em = CURRENT_TIMESTAMP, deletado_em = ?
                WHERE id = ?`,
            [categoria.nome, categoria.peso_porcentagem, categoria.deletado_em, categoria.id]
        );
    }

    async delete(id: string): Promise<void> {
        const db = getDB();
        await db.runAsync(
            `UPDATE categoria
            SET deletado_em = CURRENT_TIMESTAMP, sincronizado = 0, atualizado_em = CURRENT_TIMESTAMP
            WHERE id = ?`,
            [id]
        );
    }
}