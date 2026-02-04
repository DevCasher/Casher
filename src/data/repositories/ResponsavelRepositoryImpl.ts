import { IResponsavelRepository } from "../../core/repositories/IResponsavelRepository";
import { Responsavel } from "../../core/entities/Responsavel";
import { getDB } from "../local/database";

export class ResponsavelRepository implements IResponsavelRepository {
  
  async create(responsavel: Responsavel): Promise<void> {
    const db = getDB();
    await db.runAsync(
      `INSERT INTO responsavel (id, nome, sincronizado, atualizado_em)
       VALUES (?, ?, 0, CURRENT_TIMESTAMP)`,
      [responsavel.id, responsavel.nome]
    );
  }

  async getAll(): Promise<Responsavel[]> {
    const db = getDB();
    const result = await db.getAllAsync<any>(
      `SELECT * FROM responsavel WHERE deletado_em IS NULL ORDER BY nome ASC`
    );

    return result.map(row => ({
      id: row.id,
      nome: row.nome,
      sincronizado: row.sincronizado === 1,
      atualizado_em: row.atualizado_em,
      deletado_em: row.deletado_em
    }));
  }

  async getById(id: string): Promise<Responsavel | null> {
    const db = getDB();
    const result = await db.getFirstAsync<any>(
      `SELECT * FROM responsavel WHERE id = ? AND deletado_em IS NULL`,
      [id]
    );

    if (!result) return null;

    return {
      id: result.id,
      nome: result.nome,
      sincronizado: result.sincronizado === 1,
      atualizado_em: result.atualizado_em,
      deletado_em: result.deletado_em
    };
  }

  async update(responsavel: Responsavel): Promise<void> {
    const db = getDB();
    await db.runAsync(
      `UPDATE responsavel 
       SET nome = ?, sincronizado = 0, atualizado_em = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [responsavel.nome, responsavel.id]
    );
  }

  async delete(id: string): Promise<void> {
    const db = getDB();
    await db.runAsync(
      `UPDATE responsavel 
       SET deletado_em = CURRENT_TIMESTAMP, sincronizado = 0, atualizado_em = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [id]
    );
  }
}