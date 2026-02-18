import { Meta } from '../entities/Meta';

export interface IMetaRepository {
    create(meta: Meta): Promise<void>;
    getAll(): Promise<Meta[]>;
    getAllAtivas(): Promise<Meta[]>;
    getById(id: string): Promise<Meta | null>;
    update(meta: Meta): Promise<void>;
    updateValorAtual(id: string, valorAtual: number): Promise<void>;
    delete(id: string): Promise<void>;
}