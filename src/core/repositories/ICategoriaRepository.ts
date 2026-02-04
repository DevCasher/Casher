import { Categoria } from "../entities/Categoria";

export interface ICategoriaRepository {
 create(categoria: Categoria): Promise<void>;
  getAll(): Promise<Categoria[]>;
  getById(id: string): Promise<Categoria | null>;
  update(responsavel: Categoria): Promise<void>;
  delete(id: string): Promise<void>;
}