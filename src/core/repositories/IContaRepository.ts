import { Conta } from "../entities/Conta";

export interface IContaRepository {
  create(conta: Conta): Promise<void>;
  getAll(): Promise<Conta[]>;
  getById(id: string): Promise<Conta | null>;
  update(responsavel: Conta): Promise<void>;
  delete(id: string): Promise<void>;
  updateSaldo(id: string, valor: number): Promise<void>;
}