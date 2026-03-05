import { CategoriaRepository } from '../../src/data/repositories/CategoriaRepository';
import { Categoria } from '../../src/core/entities/Categoria';
import { getDB } from '../../src/data/local/database';

jest.mock('../../src/data/local/database', () => ({
  getDB: jest.fn(),
}));

describe('CategoriaRepository', () => {
  let repository: CategoriaRepository;
  
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

    repository = new CategoriaRepository();
  });

  const mockCategoria: Categoria = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    nome: 'Alimentação',
    peso_porcentagem: 30,
    sincronizado: false,
    atualizado_em: '2023-10-01T10:00:00Z',
    deletado_em: ''
  };

  const mockDbRow = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    nome: 'Alimentação',
    peso_porcentagem: 30,
    sincronizado: 0,
    atualizado_em: '2023-10-01T10:00:00Z',
    deletado_em: null
  };

  describe('create', () => {
    it('deve inserir uma nova categoria corretamente', async () => {
      await repository.create(mockCategoria);

      expect(getDB).toHaveBeenCalled();
      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO categoria'),
        [mockCategoria.id, mockCategoria.nome, mockCategoria.peso_porcentagem]
      );
    });
  });

  describe('getAll', () => {
    it('deve retornar uma lista de categorias mapeadas', async () => {
      mockGetAllAsync.mockResolvedValueOnce([mockDbRow]);

      const result = await repository.getAll();

      expect(mockGetAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM categoria WHERE deletado_em  IS NULL')
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockCategoria.id);
      expect(result[0].nome).toBe(mockCategoria.nome);
      expect(result[0].sincronizado).toBe(false);
    });

    it('deve retornar um array vazio se não houver categorias', async () => {
      mockGetAllAsync.mockResolvedValueOnce([]);

      const result = await repository.getAll();

      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('deve retornar uma categoria mapeada se o ID existir', async () => {
      mockGetFirstAsync.mockResolvedValueOnce(mockDbRow);

      const result = await repository.getById(mockCategoria.id);

      expect(mockGetFirstAsync).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM categoria WHERE id = ?'),
        [mockCategoria.id]
      );
      expect(result).not.toBeNull();
      expect(result?.nome).toBe(mockCategoria.nome);
    });

    it('deve retornar null se o ID não existir', async () => {
      mockGetFirstAsync.mockResolvedValueOnce(null);

      const result = await repository.getById('id-inexistente');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('deve atualizar uma categoria existente', async () => {
      await repository.update(mockCategoria);

      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE categoria'),
        [
          mockCategoria.nome,
          mockCategoria.peso_porcentagem,
          mockCategoria.id
        ]
      );
    });
  });

  describe('delete', () => {
    it('deve realizar um soft delete (atualizar deletado_em) na categoria', async () => {
      await repository.delete(mockCategoria.id);

      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('SET deletado_em = CURRENT_TIMESTAMP'),
        [mockCategoria.id]
      );
    });
  });
});
