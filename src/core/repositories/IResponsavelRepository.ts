import { Responsavel } from "../entities/Responsavel";

export interface IResponsavelRepository {
  create(responsavel: Responsavel): Promise<void>;
  getAll(): Promise<Responsavel[]>;
  getById(id: string): Promise<Responsavel | null>;
  update(responsavel: Responsavel): Promise<void>;
  delete(id: string): Promise<void>;
}