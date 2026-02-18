import { Meta } from '../../core/entities/Meta';
import { IMetaRepository } from '../../core/repositories/IMetaRepository';
import { getDB } from '../local/database';
import { mapToMeta } from './mapper/MetaMapper';

export class MetaRepository implements IMetaRepository {

    async create(meta: Meta): Promise<void> {
        const db = getDB();
        await db.runAsync(
            `INSERT INTO meta (id, categoria_id, nome, valor_objetivo, valor_atual, peso_porcentagem, status, sincronizado, atualizado_em)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)`,
            [meta.id, meta.categoria_id, meta.nome, meta.valor_objetivo, meta.valor_atual, meta.peso_porcentagem, meta.status]
        );
    }

    async getAll(): Promise<Meta[]> {
        const db = getDB();
        const result = await db.getAllAsync<any>(
            `SELECT * FROM meta WHERE deletado_em IS NULL ORDER BY atualizado_em DESC`
        );
        return result.map(mapToMeta);
    }

    async getAllAtivas(): Promise<Meta[]> {
        const db = getDB();
        const result = await db.getAllAsync<any>(
            `SELECT * FROM meta WHERE deletado_em IS NULL AND status != 'Finalizada' ORDER BY atualizado_em DESC`
        );
        return result.map(mapToMeta);
    }

    async getById(id: string): Promise<Meta | null> {
        const db = getDB();
        const result = await db.getFirstAsync<any>(
            `SELECT * FROM meta WHERE id = ? AND deletado_em IS NULL`,
            [id]
        );
        return result ? mapToMeta(result) : null;
    }

    async update(meta: Meta): Promise<void> {
        const db = getDB();
        await db.runAsync(
            `UPDATE meta SET categoria_id = ?, nome = ?, valor_objetivo = ?, valor_atual = ?, peso_porcentagem = ?, status = ?, sincronizado = 0, atualizado_em = CURRENT_TIMESTAMP`,
            [meta.categoria_id, meta.nome, meta.valor_objetivo, meta.valor_atual, meta.peso_porcentagem, meta.status, meta.id]
        );
    }

    async updateValorAtual(id: string, valorAtual: number): Promise<void> {
        const db = getDB();
        await db.runAsync(
            `UPDATE meta SET valor_atual = ?, sincronizado = 0, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?`,
            [valorAtual, id]
        );
    }


    async delete(id: string): Promise<void> {
        const db = getDB();
        await db.runAsync(
            `UPDATE meta SET deletado_em = CURRENT_TIMESTAMP, sincronizado = 0 WHERE id = ?`,
            [id]
        );
    }
}