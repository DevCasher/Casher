import { IContaRepository } from "../../core/repositories/IContaRepository";
import { Conta } from "../../core/entities/Conta";
import { getDB } from "../local/database";

export class ContaRepository implements IContaRepository {

    async create(conta: Conta): Promise<void> {
        const db = getDB();
        await db.runAsync(
            `INSERT INTO conta (id, nome, tipo, saldo, sincronizado, atualizado_em, deletado_em)
            VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
            [conta.id, conta.nome, conta.tipo, conta.saldo]
        );
    }

    async getAll(): Promise<Conta[]> {
        const db = getDB();
        const result = await db.getAllAsync<any>(
            `SELECT * FROM conta WHERE deletado_em  IS NULL ORDER BY nome ASC
    `);
        return result.map(row => ({
            id: row.id,
            nome: row.nome,
            tipo: row.tipo,
            saldo: row.saldo,
            sincronizado: row.sincronizado === 1,
            atualizado_em: row.atualizado_em,
            deletado_em: row.deletado_em
        }));
    }

    async getById(id: string): Promise<Conta | null> {
        const db = getDB();
        const result = await db.getFirstAsync<any>(
            `SELECT * FROM conta WHERE id = ? AND deletado_em IS NULL`,
            [id]
        );

        if (!result) return null;

        return {
            id: result.id,
            nome: result.nome,
            tipo: result.tipo,
            saldo: result.saldo,
            sincronizado: result.sincronizado,
            atualizado_em: result.atualizado_em,
            deletado_em: result.deletado_em
        };
    }

    async update(conta: Conta): Promise<void> {
        const db = getDB();
        await db.runAsync(
            `UPDATE conta
            SET nome = ?, tipo = ?, saldo = ?, sincronizado = 0, atualizado_em = CURRENT_TIMESTAMP, deletado_em = ?
            WHERE id = ?`,
            [conta.nome, conta.tipo, conta.saldo, conta.id]
        )
    }

    async updateSaldo(contaId: string, saldo: number): Promise<void> {
        const db = getDB();
        await db.runAsync(
            `UPDATE conta
            SET saldo = ?, sincronizado = 0, atualizado_em = CURRENT_TIMESTAMP
            WHERE id = ?`,
            [saldo, contaId]
        )
    }

    async delete(id: string): Promise<void> {
        const db = getDB();
        await db.runAsync(
            `UPDATE conta
            SET deletado_em = CURRENT_TIMESTAMP, sincronizado = 0, atualizado_em = CURRENT_TIMESTAMP
            WHERE id = ?`,
            [id]
        );
    }
}