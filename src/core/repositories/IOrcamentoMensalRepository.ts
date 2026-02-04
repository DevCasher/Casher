import { OrcamentoMensal } from "../entities/OrcamentoMensal";

export interface IOrcamentoMensalRepository {
  create(orcamento: OrcamentoMensal): Promise<void>;
  getAll(): Promise<OrcamentoMensal[]>;
  getById(id: string): Promise<OrcamentoMensal | null>;
  getAtualByCategoria(categoria_id: string): Promise<OrcamentoMensal | null>;
  getPorPeriodo(mesInicio: string, mesFim: string): Promise<OrcamentoMensal[]>;
  update(orcamento: OrcamentoMensal): Promise<void>;
  delete(id: string): Promise<void>;
}