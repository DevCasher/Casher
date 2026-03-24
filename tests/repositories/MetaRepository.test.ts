import { MetaRepository } from '../../src/data/repositories/MetaRepository';
import { Meta } from '../../src/core/entities/Meta';
import { getDB } from '../../src/data/local/database';

jest.mock('../../src/data/local/database', () => ({
  getDB: jest.fn(),
}));

jest.mock('../../src/data/repositories/mapper/MetaMapper', () => ({
  mapToMeta: jest.fn((row: any) => ({
    ...row,
    sincronizado: row.sincronizado === 1
  }))
}));

describe('MetaRepository', () => {
  let repository: MetaRepository;
  
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

    repository = new MetaRepository();
  });

  const mockMeta: Meta = {
    id: 'meta-123e4567',
    categoria_id: 'cat-89b-12d3',
    nome: 'Comprar Carro',
    valor_objetivo: 50000,
    valor_atual: 10000,
    peso_porcentagem: 50,
    status: 'Andamento',
    sincronizado: false,
    atualizado_em: '2023-10-01T10:00:00Z',
    deletado_em: null
  };

  const mockDbRow = {
    id: 'meta-123e4567',
    categoria_id: 'cat-89b-12d3',
    nome: 'Comprar Carro',
    valor_objetivo: 50000,
    valor_atual: 10000,
    peso_porcentagem: 50,
    status: 'Andamento',
    sincronizado: 0,
    atualizado_em: '2023-10-01T10:00:00Z',
    deletado_em: null
  };

  describe('create', () => {
    it('deve inserir uma nova meta corretamente', async () => {
      await repository.create(mockMeta);

      expect(getDB).toHaveBeenCalled();
      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO meta'),
        [
          mockMeta.id, 
          mockMeta.categoria_id, 
          mockMeta.nome, 
          mockMeta.valor_objetivo, 
          mockMeta.valor_atual, 
          mockMeta.peso_porcentagem, 
          mockMeta.status
        ]
      );
    });
  });

  describe('getAll', () => {
    it('deve retornar uma lista de metas mapeadas', async () => {
      mockGetAllAsync.mockResolvedValueOnce([mockDbRow]);

      const result = await repository.getAll();

      expect(mockGetAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM meta WHERE deletado_em IS NULL ORDER BY atualizado_em DESC')
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockMeta.id);
      expect(result[0].nome).toBe(mockMeta.nome);
      expect(result[0].sincronizado).toBe(false);
    });

    it('deve retornar um array vazio se não houver metas', async () => {
      mockGetAllAsync.mockResolvedValueOnce([]);

      const result = await repository.getAll();

      expect(result).toEqual([]);
    });
  });

  describe('getAllAtivas', () => {
    it('deve retornar apenas as metas com status diferente de Finalizada', async () => {
      mockGetAllAsync.mockResolvedValueOnce([mockDbRow]);

      const result = await repository.getAllAtivas();

      expect(mockGetAllAsync).toHaveBeenCalledWith(
        expect.stringContaining("status != 'Finalizada'")
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockMeta.id);
    });
  });

  describe('getById', () => {
    it('deve retornar uma meta mapeada se o ID existir', async () => {
      mockGetFirstAsync.mockResolvedValueOnce(mockDbRow);

      const result = await repository.getById(mockMeta.id);

      expect(mockGetFirstAsync).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM meta WHERE id = ? AND deletado_em IS NULL'),
        [mockMeta.id]
      );
      expect(result).not.toBeNull();
      expect(result?.nome).toBe(mockMeta.nome);
    });

    it('deve retornar null se o ID não existir', async () => {
      mockGetFirstAsync.mockResolvedValueOnce(null);

      const result = await repository.getById('id-inexistente');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('deve atualizar uma meta existente', async () => {
      await repository.update(mockMeta);

      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE meta SET categoria_id = ?, nome = ?, valor_objetivo = ?, valor_atual = ?, peso_porcentagem = ?, status = ?, sincronizado = 0'),
        [
          mockMeta.categoria_id,
          mockMeta.nome,
          mockMeta.valor_objetivo,
          mockMeta.valor_atual,
          mockMeta.peso_porcentagem,
          mockMeta.status,
          mockMeta.id
        ]
      );
    });
  });

  describe('updateValorAtual', () => {
    it('deve atualizar apenas o valor atual da meta', async () => {
      const novoValorAtual = 15000;
      await repository.updateValorAtual(mockMeta.id, novoValorAtual);

      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE meta SET valor_atual = ?, sincronizado = 0'),
        [
          novoValorAtual,
          mockMeta.id
        ]
      );
    });
  });

  describe('delete', () => {
    it('deve realizar um soft delete (atualizar deletado_em) na meta', async () => {
      await repository.delete(mockMeta.id);

      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE meta SET deletado_em = CURRENT_TIMESTAMP'),
        [mockMeta.id]
      );
    });
  });
});