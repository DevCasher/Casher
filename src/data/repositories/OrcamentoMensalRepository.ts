import { OrcamentoMensal } from "../../core/entities/OrcamentoMensal";
import { IOrcamentoMensalRepository } from "../../core/repositories/IOrcamentoMensalRepository";
import { mapToOrcamentoMensal } from "./mapper/OrcamentoMensalMapper";
import { getDB } from "../local/database";

export class OrcamentoMensalRepository implements IOrcamentoMensalRepository {

  async create(orcamento: OrcamentoMensal): Promise<void> {
    const db = getDB();
    await db.runAsync(
      `INSERT INTO orcamento_mensal (id, categoria_id, data, valor_disponivel, sincronizado, atualizado_em)
      VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)`,
      [orcamento.id, orcamento.categoria_id, orcamento.data, orcamento.valor_disponivel]
    );
  }

  async getAll(): Promise<OrcamentoMensal[]> {
    const db = getDB();
    const result = await db.getAllAsync<any>(
      `SELECT * FROM orcamento_mensal WHERE deletado_em IS NULL ORDER BY data DESC`
    );

    return result.map(mapToOrcamentoMensal);
  }

  async getAllAtual(): Promise<OrcamentoMensal[]> {
    const db = getDB();
    const result = await db.getAllAsync<any>(
      `SELECT o.*, c.nome as cat_nome, c.peso_porcentagem as cat_peso
      FROM orcamento_mensal o
      JOIN categoria c ON o.categoria_id = c.id
      WHERE o.deletado_em IS NULL
      AND o.data <= date('now', 'start of month', '+1 month', '-1 day')
      ORDER BY o.data DESC`
    );
    return result.map(mapToOrcamentoMensal);
  }

  async getById(id: string): Promise<OrcamentoMensal | null> {
    const db = getDB();
    const result = await db.getFirstAsync<any>(
      `SELECT * FROM orcamento_mensal WHERE id = ? AND deletado_em IS NULL`,
      [id]
    );

    if (!result) return null;

    return result ? mapToOrcamentoMensal(result) : null;
  }

  async getAtualByCategoria(categoria_id: string): Promise<OrcamentoMensal | null> {
    const db = getDB();
    const result = await db.getFirstAsync<any>(
      `SELECT o.*, c.nome as cat_nome, c.peso_porcentagem as cat_peso
      FROM orcamento_mensal o
      WHERE o.categoria_id = ? AND o.deletado_em IS NULL
      ORDER BY o.data DESC
      LIMIT 1`,
      [categoria_id]
    );

    return result ? mapToOrcamentoMensal(result) : null;
  }

  async getPorPeriodo(dataInicio: string, dataFim: string): Promise<OrcamentoMensal[]> {
    const db = getDB();
    const result = await db.getAllAsync<any>(
      `SELECT o.*, c.nome as cat_nome
      FROM orcamento_mensal o
      WHERE o.data BETWEEN ? AND ? 
      AND o.deletado_em IS NULL
      ORDER BY o.data DESC`,
      [dataInicio, dataFim]
    );

    return result.map(mapToOrcamentoMensal);
  }

  async update(orcamento: OrcamentoMensal): Promise<void> {
    const db = getDB();
    await db.runAsync(
      `UPDATE orcamento_mensal 
      SET categoria_id = ?, data = ?, valor_disponivel = ?, sincronizado = 0, atualizado_em = CURRENT_TIMESTAMP 
      WHERE id = ?`,
      [orcamento.categoria_id, orcamento.data, orcamento.valor_disponivel, orcamento.id]
    );
  }

  async delete(id: string): Promise<void> {
    const db = getDB();
    await db.runAsync(
      `UPDATE orcamento_mensal 
      SET deletado_em = CURRENT_TIMESTAMP, sincronizado = 0, atualizado_em = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [id]
    );
  }
}