import { Transacao } from "../entities/Transacao";

export interface ITransacaoRepository {
    create(transacao: Transacao): Promise<void>;
    getAll(): Promise<Transacao[]>;
    getById(id: string): Promise<Transacao | null>;
    getFiltered(inicio?: string, fim?: string, categoriaId?: string): Promise<Transacao[]>;
    update(transacao: Transacao): Promise<void>;
    delete(id: string): Promise<void>;
}