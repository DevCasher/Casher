import {Parcela} from "../entities/Parcela"

export interface IParcelaRepository {
  create(responsavel: Parcela): Promise<void>;
  getAll(): Promise <Parcela[]>;
  getById(id: string): Promise< Parcela | null>;
  update(parcela: Parcela): Promise<void>;
  delete(id: string): Promise<void>;
}