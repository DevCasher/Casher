import { IContaRepository } from "../../core/repositories/IContaRepository";
import { Conta } from "../../core/entities/Conta";
import { mapToConta } from "../repositories/mapper/ContaMapper";
import { getDB } from "../local/database";

export class ContaRepository implements IContaRepository {

    async create(conta: Conta): Promise<void> {
        const db = getDB();
        await db.runAsync(
            `INSERT INTO conta (id, nome, tipo, saldo, sincronizado, atualizado_em, deletado_em)
            VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [conta.id, conta.nome, conta.tipo, conta.saldo]
        );
    }

    async getAll(): Promise<Conta[]> {
        const db = getDB();
        const result = await db.getAllAsync<any>(`SELECT * FROM conta WHERE deletado_em  IS NULL ORDER BY nome ASC`);
        
        return result.map(mapToConta);
    }

    async getById(id: string): Promise<Conta | null> {
        const db = getDB();
        const result = await db.getFirstAsync<any>(
            `SELECT * FROM conta WHERE id = ? AND deletado_em IS NULL`,
            [id]
        );

        return result ? mapToConta(result) : null;
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