import { ITransacaoRepository } from "../../core/repositories/ITransacaoRepository";
import { Transacao } from "../../core/entities/Transacao";
import { TransacaoFiltroDTO } from "../../core/entities/dto/TransacaoFiltroDTO";
import { mapToTransacao } from "../repositories/mapper/TransacaoMapper";
import { getDB } from "../local/database";

export class TransacaoRepository implements ITransacaoRepository {

    async create(transacao: Transacao): Promise<void> {
        const db = getDB();
        await db.runAsync(
            `INSERT INTO transacao (id, conta_id, responsavel_id, categoria_id, meta_id, valor, tipo, status, data, sincronizado, atualizado_em)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)`,
            [
                transacao.id, 
                transacao.conta_id, 
                transacao.responsavel_id, 
                transacao.categoria_id, 
                transacao.meta_id || null, 
                transacao.valor, 
                transacao.tipo, 
                transacao.data
            ]
        );
    }

    async getAll(): Promise<Transacao[]> {
        const db = getDB();
        const result = await db.getAllAsync<any>(
            `SELECT * FROM transacao WHERE deletado_em IS NULL ORDER BY data DESC`
        );
        return result.map(mapToTransacao);
    }

    async getById(id: string): Promise<Transacao | null> {
        const db = getDB();
        const result = await db.getFirstAsync<any>(
            `SELECT * FROM transacao WHERE id = ? AND deletado_em IS NULL`,
            [id]
        );

        return result ? mapToTransacao(result) : null;
    }

    async getFiltered(filtro: TransacaoFiltroDTO): Promise<Transacao[]> {
        const db = getDB();
        let query = `SELECT * FROM transacao WHERE deletado_em IS NULL`;
        const params: any[] = [];

        if (filtro.dataInicio) {
            query += ` AND data >= ?`;
            params.push(filtro.dataInicio);
        }

        if (filtro.dataFim) {
            query += ` AND data <= ?`;
            params.push(filtro.dataFim);
        }

        if (filtro.categoriaId) {
            query += ` AND categoria_id = ?`;
            params.push(filtro.categoriaId);
        }

        if (filtro.metaId) {
            query += ` AND meta_id = ?`;
            params.push(filtro.metaId);
        }

        if (filtro.tipo) {
            query += ` AND tipo = ?`;
            params.push(filtro.tipo);
        }

        const result = await db.getAllAsync<any>(query, params);
        return result.map(mapToTransacao);
    }

    async update(transacao: Transacao): Promise<void> {
        const db = getDB();
        await db.runAsync(
            `UPDATE transacao
            SET conta_id = ?, responsavel_id = ?, categoria_id = ?, meta_id = ?, valor = ?, tipo = ?, status = ?, data = ?, sincronizado = 0, atualizado_em = CURRENT_TIMESTAMP
            WHERE id = ?`,
            [
                transacao.conta_id,
                transacao.responsavel_id,
                transacao.categoria_id,
                transacao.meta_id || null,
                transacao.valor,
                transacao.tipo,
                transacao.data,
                transacao.id
            ]
        );
    }

    async delete(id: string): Promise<void> {
        const db = getDB();
        await db.runAsync(
            `UPDATE transacao
            SET deletado_em = CURRENT_TIMESTAMP, sincronizado = 0, atualizado_em = CURRENT_TIMESTAMP
            WHERE id = ?`,
            [id]
        );
    }
}