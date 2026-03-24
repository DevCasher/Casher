import { ParcelaRepository } from '../../src/data/repositories/ParcelaRepository';
import { Parcela } from '../../src/core/entities/Parcela';
import { getDB } from '../../src/data/local/database';

jest.mock('../../src/data/local/database', () => ({
  getDB: jest.fn(),
}));

jest.mock('../../src/data/repositories/mapper/ParcelaMapper', () => ({
  mapToParcela: jest.fn((row: any) => ({
    ...row,
    sincronizado: row.sincronizado === 1
  }))
}));

describe('ParcelaRepository', () => {
  let repository: ParcelaRepository;
  
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

    repository = new ParcelaRepository();
  });

  const mockParcela: Parcela = {
    id: 'parc-123e4567',
    transacao_id: 'trans-89b-12d3',
    valor: 250.75,
    data_vencimento: '2023-11-10',
    sincronizado: false,
    atualizado_em: '2023-10-01T10:00:00Z',
    deletado_em: ''
  };

  const mockDbRow = {
    id: 'parc-123e4567',
    transacao_id: 'trans-89b-12d3',
    valor: 250.75,
    data_vencimento: '2023-11-10',
    sincronizado: 0,
    atualizado_em: '2023-10-01T10:00:00Z',
    deletado_em: null
  };

  describe('create', () => {
    it('deve inserir uma nova parcela corretamente', async () => {
      await repository.create(mockParcela);

      expect(getDB).toHaveBeenCalled();
      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO parcela'),
        [
          mockParcela.id, 
          mockParcela.transacao_id, 
          mockParcela.valor, 
          mockParcela.data_vencimento
        ]
      );
    });
  });

  describe('getAll', () => {
    it('deve retornar uma lista de parcelas mapeadas', async () => {
      mockGetAllAsync.mockResolvedValueOnce([mockDbRow]);

      const result = await repository.getAll();

      expect(mockGetAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM parcela WHERE deletado_em IS NULL ORDER BY data_vencimento ASC')
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockParcela.id);
      expect(result[0].valor).toBe(mockParcela.valor);
      expect(result[0].sincronizado).toBe(false);
    });

    it('deve retornar um array vazio se não houver parcelas', async () => {
      mockGetAllAsync.mockResolvedValueOnce([]);

      const result = await repository.getAll();

      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('deve retornar uma parcela mapeada se o ID existir', async () => {
      mockGetFirstAsync.mockResolvedValueOnce(mockDbRow);

      const result = await repository.getById(mockParcela.id);

      expect(mockGetFirstAsync).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM parcela WHERE id = ? AND deletado_em IS NULL'),
        [mockParcela.id]
      );
      expect(result).not.toBeNull();
      expect(result?.transacao_id).toBe(mockParcela.transacao_id);
    });

    it('deve retornar null se o ID não existir', async () => {
      mockGetFirstAsync.mockResolvedValueOnce(null);

      const result = await repository.getById('id-inexistente');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('deve atualizar uma parcela existente', async () => {
      await repository.update(mockParcela);

      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE parcela'),
        [
          mockParcela.transacao_id,
          mockParcela.valor,
          mockParcela.data_vencimento,
          mockParcela.id
        ]
      );
    });
  });

  describe('delete', () => {
    it('deve realizar um soft delete (atualizar deletado_em) na parcela', async () => {
      await repository.delete(mockParcela.id);

      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE parcela'),
        expect.arrayContaining([mockParcela.id])
      );
      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('SET deletado_em = CURRENT_TIMESTAMP'),
        [mockParcela.id]
      );
    });
  });
});