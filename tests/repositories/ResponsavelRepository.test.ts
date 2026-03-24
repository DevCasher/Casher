import { ResponsavelRepository } from '../../src/data/repositories/ResponsavelRepository';
import { Responsavel } from '../../src/core/entities/Responsavel';
import { getDB } from '../../src/data/local/database';

jest.mock('../../src/data/local/database', () => ({
  getDB: jest.fn(),
}));

jest.mock('../../src/data/repositories/mapper/ResponsavelMapper', () => ({
  mapToResponsavel: jest.fn((row: any) => ({
    ...row,
    sincronizado: row.sincronizado === 1
  }))
}));

describe('ResponsavelRepository', () => {
  let repository: ResponsavelRepository;
  
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

    repository = new ResponsavelRepository();
  });

  const mockResponsavel: Responsavel = {
    id: 'resp-123e4567',
    nome: 'João Silva',
    sincronizado: false,
    atualizado_em: '2023-10-01T10:00:00Z',
    deletado_em: null
  };

  const mockDbRow = {
    id: 'resp-123e4567',
    nome: 'João Silva',
    sincronizado: 0,
    atualizado_em: '2023-10-01T10:00:00Z',
    deletado_em: null
  };

  describe('create', () => {
    it('deve inserir um novo responsável corretamente', async () => {
      await repository.create(mockResponsavel);

      expect(getDB).toHaveBeenCalled();
      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO responsavel'),
        [
          mockResponsavel.id, 
          mockResponsavel.nome
        ]
      );
    });
  });

  describe('getAll', () => {
    it('deve retornar uma lista de responsáveis mapeados', async () => {
      mockGetAllAsync.mockResolvedValueOnce([mockDbRow]);

      const result = await repository.getAll();

      expect(mockGetAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM responsavel WHERE deletado_em IS NULL ORDER BY nome ASC')
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockResponsavel.id);
      expect(result[0].nome).toBe(mockResponsavel.nome);
      expect(result[0].sincronizado).toBe(false);
    });

    it('deve retornar um array vazio se não houver responsáveis', async () => {
      mockGetAllAsync.mockResolvedValueOnce([]);

      const result = await repository.getAll();

      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('deve retornar um responsável mapeado se o ID existir', async () => {
      mockGetFirstAsync.mockResolvedValueOnce(mockDbRow);

      const result = await repository.getById(mockResponsavel.id);

      expect(mockGetFirstAsync).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM responsavel WHERE id = ? AND deletado_em IS NULL'),
        [mockResponsavel.id]
      );
      expect(result).not.toBeNull();
      expect(result?.nome).toBe(mockResponsavel.nome);
    });

    it('deve retornar null se o ID não existir', async () => {
      mockGetFirstAsync.mockResolvedValueOnce(null);

      const result = await repository.getById('id-inexistente');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('deve atualizar um responsável existente', async () => {
      await repository.update(mockResponsavel);

      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE responsavel'),
        [
          mockResponsavel.nome,
          mockResponsavel.id
        ]
      );
    });
  });

  describe('delete', () => {
    it('deve realizar um soft delete (atualizar deletado_em) no responsável', async () => {
      await repository.delete(mockResponsavel.id);

      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE responsavel'),
        expect.arrayContaining([mockResponsavel.id])
      );
      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('SET deletado_em = CURRENT_TIMESTAMP'),
        [mockResponsavel.id]
      );
    });
  });
});