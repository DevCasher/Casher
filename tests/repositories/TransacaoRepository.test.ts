import { TransacaoRepository } from '../../src/data/repositories/TransacaoRepository';
import { Transacao } from '../../src/core/entities/Transacao';
import { TransacaoFiltroDTO } from '../../src/core/entities/dto/TransacaoFiltroDTO';
import { getDB } from '../../src/data/local/database';

jest.mock('../../src/data/local/database', () => ({
  getDB: jest.fn(),
}));

jest.mock('../../src/data/repositories/mapper/TransacaoMapper', () => ({
  mapToTransacao: jest.fn((row: any) => ({
    ...row,
    sincronizado: row.sincronizado === 1
  }))
}));

describe('TransacaoRepository', () => {
  let repository: TransacaoRepository;
  
  const mockRunAsync = jest.fn();
  const mockGetAllAsync = jest.fn();
  const mockGetFirstAsync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    (getDB as jest.Mock).mockReturnValue({
      runAsync: mockRunAsync,
      getAllAsync: mockGetAllAsync,
      getFirstAsync: mockGetFirstAsync,
    });

    repository = new TransacaoRepository();
  });

  const mockTransacao: Transacao = {
    id: 'trans-123e4567',
    conta_id: 'conta-89b-12d3',
    responsavel_id: 'resp-89b-12d3',
    categoria_id: 'cat-89b-12d3',
    meta_id: 'meta-89b-12d3',
    descricao: 'Compra no supermercado',
    valor: 150.50,
    tipo: 'Saida',
    data: '2023-10-15',
    sincronizado: false,
    atualizado_em: '2023-10-15T10:00:00Z',
    deletado_em: null
  };

  const mockDbRow = {
    id: 'trans-123e4567',
    conta_id: 'conta-89b-12d3',
    responsavel_id: 'resp-89b-12d3',
    categoria_id: 'cat-89b-12d3',
    meta_id: 'meta-89b-12d3',
    descricao: 'Compra no supermercado',
    valor: 150.50,
    tipo: 'Saida',
    data: '2023-10-15',
    sincronizado: 0,
    atualizado_em: '2023-10-15T10:00:00Z',
    deletado_em: null
  };

  describe('create', () => {
    it('deve inserir uma nova transação corretamente', async () => {
      await repository.create(mockTransacao);

      expect(getDB).toHaveBeenCalled();
      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO transacao'),
        [
          mockTransacao.id, 
          mockTransacao.conta_id, 
          mockTransacao.responsavel_id, 
          mockTransacao.categoria_id, 
          mockTransacao.meta_id, 
          mockTransacao.valor, 
          mockTransacao.tipo, 
          mockTransacao.data
        ]
      );
    });

    it('deve inserir uma nova transação com meta_id nulo caso não seja fornecido', async () => {
      const transacaoSemMeta = { ...mockTransacao, meta_id: undefined };
      await repository.create(transacaoSemMeta);

      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO transacao'),
        expect.arrayContaining([null])
      );
    });
  });

  describe('getAll', () => {
    it('deve retornar uma lista de transações mapeadas', async () => {
      mockGetAllAsync.mockResolvedValueOnce([mockDbRow]);

      const result = await repository.getAll();

      expect(mockGetAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM transacao WHERE deletado_em IS NULL ORDER BY data DESC')
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockTransacao.id);
      expect(result[0].descricao).toBe(mockTransacao.descricao);
      expect(result[0].sincronizado).toBe(false);
    });

    it('deve retornar um array vazio se não houver transações', async () => {
      mockGetAllAsync.mockResolvedValueOnce([]);

      const result = await repository.getAll();

      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('deve retornar uma transação mapeada se o ID existir', async () => {
      mockGetFirstAsync.mockResolvedValueOnce(mockDbRow);

      const result = await repository.getById(mockTransacao.id);

      expect(mockGetFirstAsync).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM transacao WHERE id = ? AND deletado_em IS NULL'),
        [mockTransacao.id]
      );
      expect(result).not.toBeNull();
      expect(result?.valor).toBe(mockTransacao.valor);
    });

    it('deve retornar null se o ID não existir', async () => {
      mockGetFirstAsync.mockResolvedValueOnce(null);

      const result = await repository.getById('id-inexistente');

      expect(result).toBeNull();
    });
  });

  describe('getFiltered', () => {
    it('deve construir a query correta com base nos filtros aplicados (dataInicio e categoriaId)', async () => {
      mockGetAllAsync.mockResolvedValueOnce([mockDbRow]);
      
      const filtro: TransacaoFiltroDTO = {
        dataInicio: '2023-10-01',
        categoriaId: 'cat-89b-12d3'
      };

      const result = await repository.getFiltered(filtro);

      expect(mockGetAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('AND data >= ?'),
        expect.anything()
      );
      expect(mockGetAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('AND categoria_id = ?'),
        expect.anything()
      );
      
      const args = mockGetAllAsync.mock.calls[0][1];
      expect(args).toEqual([filtro.dataInicio, filtro.categoriaId]);
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockTransacao.id);
    });

    it('deve construir a query correta com filtros dataFim, metaId e tipo', async () => {
      mockGetAllAsync.mockResolvedValueOnce([mockDbRow]);
      
      const filtro: TransacaoFiltroDTO = {
        dataFim: '2023-10-31',
        metaId: 'meta-89b-12d3',
        tipo: 'Saida'
      };

      await repository.getFiltered(filtro);

      const args = mockGetAllAsync.mock.calls[0][1];
      expect(args).toEqual([filtro.dataFim, filtro.metaId, filtro.tipo]);
    });

    it('deve retornar todas as transações (não deletadas) se nenhum filtro for passado', async () => {
      mockGetAllAsync.mockResolvedValueOnce([mockDbRow]);
      
      await repository.getFiltered({});

      expect(mockGetAllAsync).toHaveBeenCalledWith(
        'SELECT * FROM transacao WHERE deletado_em IS NULL',
        []
      );
    });
  });

  describe('update', () => {
    it('deve atualizar uma transação existente', async () => {
      await repository.update(mockTransacao);

      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE transacao'),
        [
          mockTransacao.conta_id,
          mockTransacao.responsavel_id,
          mockTransacao.categoria_id,
          mockTransacao.meta_id,
          mockTransacao.valor,
          mockTransacao.tipo,
          mockTransacao.data,
          mockTransacao.id
        ]
      );
    });
  });

  describe('delete', () => {
    it('deve realizar um soft delete (atualizar deletado_em) na transação', async () => {
      await repository.delete(mockTransacao.id);

      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('SET deletado_em = CURRENT_TIMESTAMP'),
        [mockTransacao.id]
      );
    });
  });
});