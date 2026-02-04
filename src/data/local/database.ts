import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('casher.db');

export const initDatabase = () => {
  try {
    db.execSync('PRAGMA foreign_keys = ON;');

    db.withTransactionSync(() => {
      
      db.execSync(`
        CREATE TABLE IF NOT EXISTS responsavel (
          id TEXT PRIMARY KEY NOT NULL,
          nome TEXT NOT NULL,
          sincronizado INTEGER DEFAULT 0,
          atualizado_em TEXT DEFAULT CURRENT_TIMESTAMP,
          deletado_em TEXT DEFAULT NULL
        );
      `);

      db.execSync(`
        CREATE TABLE IF NOT EXISTS conta (
          id TEXT PRIMARY KEY NOT NULL,
          nome TEXT NOT NULL,
          tipo TEXT CHECK (tipo IN ('Investimento', 'Corrente')),
          saldo REAL DEFAULT 0.00,
          sincronizado INTEGER DEFAULT 0,
          atualizado_em TEXT DEFAULT CURRENT_TIMESTAMP,
          deletado_em TEXT DEFAULT NULL
        );
      `);

      db.execSync(`
        CREATE TABLE IF NOT EXISTS categoria (
          id TEXT PRIMARY KEY NOT NULL,
          nome TEXT NOT NULL,
          peso_porcentagem REAL DEFAULT 0.0,
          sincronizado INTEGER DEFAULT 0,
          atualizado_em TEXT DEFAULT CURRENT_TIMESTAMP,
          deletado_em TEXT DEFAULT NULL
        );
      `);

      db.execSync(`
        CREATE TABLE IF NOT EXISTS orcamento_mensal (
          id TEXT PRIMARY KEY NOT NULL,
          categoria_id TEXT,
          mes TEXT NOT NULL,
          valor_disponivel REAL DEFAULT 0.00,
          sincronizado INTEGER DEFAULT 0,
          atualizado_em TEXT DEFAULT CURRENT_TIMESTAMP,
          deletado_em TEXT DEFAULT NULL,
          FOREIGN KEY (categoria_id) REFERENCES categoria(id) ON DELETE CASCADE
        );
      `);

      db.execSync(`
        CREATE TABLE IF NOT EXISTS meta (
          id TEXT PRIMARY KEY NOT NULL,
          categoria_id TEXT,
          nome TEXT NOT NULL,
          valor_objetivo REAL NOT NULL,
          valor_atual REAL DEFAULT 0.00,
          peso_porcentagem REAL DEFAULT 0.0,
          status TEXT CHECK (status IN ('Andamento', 'Concluida', 'Finalizada')) DEFAULT 'Andamento',
          sincronizado INTEGER DEFAULT 0,
          atualizado_em TEXT DEFAULT CURRENT_TIMESTAMP,
          deletado_em TEXT DEFAULT NULL,
          FOREIGN KEY (categoria_id) REFERENCES categoria(id)
        );
      `);

      db.execSync(`
        CREATE TABLE IF NOT EXISTS transacao (
          id TEXT PRIMARY KEY NOT NULL,
          conta_id TEXT,
          responsavel_id TEXT,
          categoria_id TEXT,
          meta_id TEXT,
          valor REAL NOT NULL,
          tipo TEXT CHECK (tipo IN ('Entrada', 'Saida', 'Investimento', 'Juros')),
          status TEXT CHECK (status IN ('Efetivado', 'Cancelado')) DEFAULT 'Efetivado',
          data TEXT DEFAULT CURRENT_DATE,
          sincronizado INTEGER DEFAULT 0,
          atualizado_em TEXT DEFAULT CURRENT_TIMESTAMP,
          deletado_em TEXT DEFAULT NULL,
          FOREIGN KEY (conta_id) REFERENCES conta(id),
          FOREIGN KEY (responsavel_id) REFERENCES responsavel(id),
          FOREIGN KEY (categoria_id) REFERENCES categoria(id),
          FOREIGN KEY (meta_id) REFERENCES meta(id)
        );
      `);

      db.execSync(`
        CREATE TABLE IF NOT EXISTS parcela (
          id TEXT PRIMARY KEY NOT NULL,
          transacao_id TEXT,
          valor REAL NOT NULL,
          data_vencimento TEXT NOT NULL,
          sincronizado INTEGER DEFAULT 0,
          atualizado_em TEXT DEFAULT CURRENT_TIMESTAMP,
          deletado_em TEXT DEFAULT NULL,
          FOREIGN KEY (transacao_id) REFERENCES transacao(id) ON DELETE CASCADE
        );
      `);
    });

    console.log("Banco de dados SQLite (Casher) sincronizado com a estrutura do Supabase!");
  } catch (error) {
    console.error("Erro fatal ao criar tabelas no SQLite:", error);
  }
};

export const getDB = () => db;