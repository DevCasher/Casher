import { ProcessarEntradaUC } from '../../../src/core/usecases/transacao/ProcessarEntradaUC';
import { Conta } from '../../../src/core/entities/Conta';
import { Categoria } from '../../../src/core/entities/Categoria';
import { Meta } from '../../../src/core/entities/Meta';
import { OrcamentoMensal } from '../../../src/core/entities/OrcamentoMensal';

describe('ProcessarEntradaUC', () => {
  let processarEntradaUC: ProcessarEntradaUC;

  const mockContaRepo = {
    updateSaldo: jest.fn(),
  };
  const mockCategoriaRepo = {
    getAll: jest.fn(),
  };
  const mockMetaRepo = {
    getAllAtivas: jest.fn(),
    updateValorAtual: jest.fn(),
  };
  const mockOrcamentoRepo = {
    getAtualByCategoria: jest.fn(),
    update: jest.fn(),
  };

  const mockConta: Conta = {
    id: 'conta-123',
    nome: 'Conta Corrente',
    tipo: 'Corrente',
    saldo: 1000,
    sincronizado: false,
    atualizado_em: '2023-10-01',
    deletado_em: null
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    processarEntradaUC = new ProcessarEntradaUC(
      mockContaRepo as any,
      mockCategoriaRepo as any,
      mockMetaRepo as any,
      mockOrcamentoRepo as any
    );
  });

  it('deve atualizar o saldo da conta e distribuir o valor proporcionalmente entre categorias e metas', async () => {
    const valorEntrada = 1000;
    
    const mockCategorias: Categoria[] = [
      { id: 'cat-1', nome: 'Lazer', peso_porcentagem: 60, sincronizado: false, atualizado_em: '', deletado_em: null }
    ];
    const mockMetas: Meta[] = [
      { id: 'meta-1', categoria_id: 'cat-2', nome: 'Viagem', valor_objetivo: 5000, valor_atual: 0, peso_porcentagem: 40, status: 'Andamento', sincronizado: false, atualizado_em: '', deletado_em: null }
    ];
    
    const mockOrcamento: OrcamentoMensal = {
      id: 'orc-1', categoria_id: 'cat-1', data: '2023-10-01', valor_disponivel: 500
    };

    mockCategoriaRepo.getAll.mockResolvedValue(mockCategorias);
    mockMetaRepo.getAllAtivas.mockResolvedValue(mockMetas);
    mockOrcamentoRepo.getAtualByCategoria.mockResolvedValue(mockOrcamento);

    await processarEntradaUC.execute(valorEntrada, mockConta, '2023-10-15T10:00:00Z');

    expect(mockContaRepo.updateSaldo).toHaveBeenCalledWith(mockConta.id, 2000);

    expect(mockOrcamentoRepo.getAtualByCategoria).toHaveBeenCalledWith('cat-1');
    expect(mockOrcamentoRepo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'orc-1',
        valor_disponivel: 1100
      })
    );

    expect(mockMetaRepo.updateValorAtual).toHaveBeenCalledWith('meta-1', 400);
  });

  it('deve atualizar apenas o saldo da conta se a soma dos pesos for igual a zero', async () => {
    const valorEntrada = 500;
    
    mockCategoriaRepo.getAll.mockResolvedValue([
      { id: 'cat-1', nome: 'Lazer', peso_porcentagem: 0, sincronizado: false, atualizado_em: '', deletado_em: null }
    ]);
    mockMetaRepo.getAllAtivas.mockResolvedValue([]);

    await processarEntradaUC.execute(valorEntrada, mockConta, '2023-10-15T10:00:00Z');

    expect(mockContaRepo.updateSaldo).toHaveBeenCalledWith(mockConta.id, 1500);

    expect(mockOrcamentoRepo.update).not.toHaveBeenCalled();
    expect(mockMetaRepo.updateValorAtual).not.toHaveBeenCalled();
  });

  it('deve ignorar categorias e metas que tenham peso igual a zero na distribuição', async () => {
    const valorEntrada = 100;
    
    const mockCategorias: Categoria[] = [
      { id: 'cat-1', nome: 'Lazer', peso_porcentagem: 100, sincronizado: false, atualizado_em: '', deletado_em: null },
      { id: 'cat-zero', nome: 'Sem peso', peso_porcentagem: 0, sincronizado: false, atualizado_em: '', deletado_em: null }
    ];
    
    const mockMetas: Meta[] = [
      { id: 'meta-zero', categoria_id: 'cat-2', nome: 'Viagem', valor_objetivo: 5000, valor_atual: 0, peso_porcentagem: 0, status: 'Andamento', sincronizado: false, atualizado_em: '', deletado_em: null }
    ];

    mockCategoriaRepo.getAll.mockResolvedValue(mockCategorias);
    mockMetaRepo.getAllAtivas.mockResolvedValue(mockMetas);
    mockOrcamentoRepo.getAtualByCategoria.mockResolvedValue({
      id: 'orc-1', categoria_id: 'cat-1', data: '2023-10-01', valor_disponivel: 0
    });

    await processarEntradaUC.execute(valorEntrada, mockConta, '2023-10-15T10:00:00Z');

    expect(mockOrcamentoRepo.getAtualByCategoria).toHaveBeenCalledWith('cat-1');
    expect(mockOrcamentoRepo.getAtualByCategoria).not.toHaveBeenCalledWith('cat-zero');
    
    expect(mockMetaRepo.updateValorAtual).not.toHaveBeenCalled();
  });
});