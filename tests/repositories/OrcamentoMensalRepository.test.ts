import { OrcamentoMensalRepository } from '../../src/data/repositories/OrcamentoMensalRepository';
import { OrcamentoMensal } from '../../src/core/entities/OrcamentoMensal';
import { getDB } from '../../src/data/local/database';

jest.mock('../../src/data/local/database', () => ({
  getDB: jest.fn(),
}));

jest.mock('../../src/data/repositories/mapper/OrcamentoMensalMapper', () => ({
  mapToOrcamentoMensal: jest.fn((row: any) => ({
    ...row,
    sincronizado: row.sincronizado === 1
  }))
}));

describe('OrcamentoMensalRepository', () => {
  let repository: OrcamentoMensalRepository;
  
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

    repository = new OrcamentoMensalRepository();
  });

  const mockOrcamentoMensal: OrcamentoMensal = {
    id: 'orc-123e4567',
    categoria_id: 'cat-89b-12d3',
    data: '2023-10-01',
    valor_disponivel: 1500.00,
    sincronizado: false,
    atualizado_em: '2023-10-01T10:00:00Z',
    deletado_em: null
  };

  const mockDbRow = {
    id: 'orc-123e4567',
    categoria_id: 'cat-89b-12d3',
    data: '2023-10-01',
    valor_disponivel: 1500.00,
    sincronizado: 0,
    atualizado_em: '2023-10-01T10:00:00Z',
    deletado_em: null
  };

  describe('create', () => {
    it('deve inserir um novo orçamento mensal corretamente', async () => {
      await repository.create(mockOrcamentoMensal);

      expect(getDB).toHaveBeenCalled();
      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO orcamento_mensal'),
        [
          mockOrcamentoMensal.id, 
          mockOrcamentoMensal.categoria_id, 
          mockOrcamentoMensal.data, 
          mockOrcamentoMensal.valor_disponivel
        ]
      );
    });
  });

  describe('getAll', () => {
    it('deve retornar uma lista de orçamentos mensais mapeados', async () => {
      mockGetAllAsync.mockResolvedValueOnce([mockDbRow]);

      const result = await repository.getAll();

      expect(mockGetAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM orcamento_mensal WHERE deletado_em IS NULL ORDER BY data DESC')
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockOrcamentoMensal.id);
      expect(result[0].valor_disponivel).toBe(mockOrcamentoMensal.valor_disponivel);
      expect(result[0].sincronizado).toBe(false);
    });

    it('deve retornar um array vazio se não houver orçamentos', async () => {
      mockGetAllAsync.mockResolvedValueOnce([]);

      const result = await repository.getAll();

      expect(result).toEqual([]);
    });
  });

  describe('getAllAtual', () => {
    it('deve retornar a lista de orçamentos mensais do mês atual', async () => {
      mockGetAllAsync.mockResolvedValueOnce([mockDbRow]);

      const result = await repository.getAllAtual();

      expect(mockGetAllAsync).toHaveBeenCalledWith(
        expect.stringContaining("o.data <= date('now', 'start of month', '+1 month', '-1 day')")
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockOrcamentoMensal.id);
    });
  });

  describe('getById', () => {
    it('deve retornar um orçamento mensal mapeado se o ID existir', async () => {
      mockGetFirstAsync.mockResolvedValueOnce(mockDbRow);

      const result = await repository.getById(mockOrcamentoMensal.id);

      expect(mockGetFirstAsync).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM orcamento_mensal WHERE id = ? AND deletado_em IS NULL'),
        [mockOrcamentoMensal.id]
      );
      expect(result).not.toBeNull();
      expect(result?.valor_disponivel).toBe(mockOrcamentoMensal.valor_disponivel);
    });

    it('deve retornar null se o ID não existir', async () => {
      mockGetFirstAsync.mockResolvedValueOnce(null);

      const result = await repository.getById('id-inexistente');

      expect(result).toBeNull();
    });
  });

  describe('getAtualByCategoria', () => {
    it('deve retornar o orçamento mensal atual de uma categoria específica', async () => {
      mockGetFirstAsync.mockResolvedValueOnce(mockDbRow);

      const result = await repository.getAtualByCategoria(mockOrcamentoMensal.categoria_id);

      expect(mockGetFirstAsync).toHaveBeenCalledWith(
        expect.stringContaining('WHERE o.categoria_id = ? AND o.deletado_em IS NULL'),
        [mockOrcamentoMensal.categoria_id]
      );
      expect(result).not.toBeNull();
      expect(result?.id).toBe(mockOrcamentoMensal.id);
    });

    it('deve retornar null se a categoria não possuir orçamento atual', async () => {
      mockGetFirstAsync.mockResolvedValueOnce(null);

      const result = await repository.getAtualByCategoria('cat-inexistente');

      expect(result).toBeNull();
    });
  });

  describe('getPorPeriodo', () => {
    it('deve retornar orçamentos mensais filtrados por período', async () => {
      const dataInicio = '2023-01-01';
      const dataFim = '2023-12-31';
      mockGetAllAsync.mockResolvedValueOnce([mockDbRow]);

      const result = await repository.getPorPeriodo(dataInicio, dataFim);

      expect(mockGetAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('WHERE o.data BETWEEN ? AND ?'),
        [dataInicio, dataFim]
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockOrcamentoMensal.id);
    });
  });

  describe('update', () => {
    it('deve atualizar um orçamento mensal existente', async () => {
      await repository.update(mockOrcamentoMensal);

      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE orcamento_mensal'),
        [
          mockOrcamentoMensal.categoria_id,
          mockOrcamentoMensal.data,
          mockOrcamentoMensal.valor_disponivel,
          mockOrcamentoMensal.id
        ]
      );
    });
  });

  describe('delete', () => {
    it('deve realizar um soft delete (atualizar deletado_em) no orçamento mensal', async () => {
      await repository.delete(mockOrcamentoMensal.id);

      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE orcamento_mensal'),
        expect.arrayContaining([mockOrcamentoMensal.id])
      );
      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('SET deletado_em = CURRENT_TIMESTAMP'),
        [mockOrcamentoMensal.id]
      );
    });
  });
});