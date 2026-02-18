import { Parcela } from "../../core/entities/Parcela"; 
import { IParcelaRepository } from "../../core/repositories/IParcelaRepository"; 
import { mapToParcela } from "./mapper/ParcelaMapper";
import { getDB } from "../local/database";

export class ParcelaRepository implements IParcelaRepository {

  async create(parcela: Parcela): Promise<void> {
    const db = getDB();
    await db.runAsync(
      `INSERT INTO parcela (id, transacao_id, valor, data_vencimento, sincronizado, atualizado_em)
      VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)`,
      [parcela.id, parcela.transacao_id, parcela.valor, parcela.data_vencimento]
    );
  }

  async getAll(): Promise<Parcela[]> {
    const db = getDB();
    const result = await db.getAllAsync<any>(
      `SELECT * FROM parcela WHERE deletado_em IS NULL ORDER BY data_vencimento ASC`
    );

    return result.map(mapToParcela);
  }

  async getById(id: string): Promise<Parcela | null> {
    const db = getDB();
    const result = await db.getFirstAsync<any>(
      `SELECT * FROM parcela WHERE id = ? AND deletado_em IS NULL`,
      [id]
    );

    return result ? mapToParcela(result) : null;
  }

  async update(parcela: Parcela): Promise<void> {
    const db = getDB();
    await db.runAsync(
      `UPDATE parcela 
      SET transacao_id = ?, valor = ?, data_vencimento = ?, sincronizado = 0, atualizado_em = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [parcela.transacao_id, parcela.valor, parcela.data_vencimento, parcela.id]
    );
  }

  async delete(id: string): Promise<void> {
    const db = getDB();
    await db.runAsync(
      `UPDATE parcela 
      SET deletado_em = CURRENT_TIMESTAMP, sincronizado = 0, atualizado_em = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [id]
    );
  }
}
