import { TransacaoFiltroDTO } from "../entities/dto/TransacaoFiltroDTO";
import { Transacao } from "../entities/Transacao";

export interface ITransacaoRepository {
    create(transacao: Transacao): Promise<void>;
    getAll(): Promise<Transacao[]>;
    getById(id: string): Promise<Transacao | null>;
    getFiltered(filtro: TransacaoFiltroDTO): Promise<Transacao[]>;
    update(transacao: Transacao): Promise<void>;
    delete(id: string): Promise<void>;
}