import { ProcessarSaidaUC } from '../../../src/core/usecases/transacao/ProcessarSaidaUC';
import { Conta } from '../../../src/core/entities/Conta';
import { Categoria } from '../../../src/core/entities/Categoria';
import { OrcamentoMensal } from '../../../src/core/entities/OrcamentoMensal';

describe('ProcessarSaidaUC', () => {
  let processarSaidaUC: ProcessarSaidaUC;

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
    getAllAtual: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
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

  const dataISO = '2023-10-15T10:00:00Z';

  beforeEach(() => {
    jest.clearAllMocks();
    
    processarSaidaUC = new ProcessarSaidaUC(
      mockContaRepo as any,
      mockCategoriaRepo as any,
      mockMetaRepo as any,
      mockOrcamentoRepo as any
    );
  });

  it('deve atualizar o saldo da conta e descontar apenas do orçamento da categoria principal se houver saldo suficiente', async () => {
    const valorSaida = 200;
    const categoriaId = 'cat-principal';
    
    const mockOrcamento: OrcamentoMensal = {
      id: 'orc-1', categoria_id: categoriaId, data: '2023-10-01', valor_disponivel: 500
    };

    mockOrcamentoRepo.getAtualByCategoria.mockResolvedValue(mockOrcamento);

    await processarSaidaUC.execute(valorSaida, mockConta, categoriaId, dataISO);

    expect(mockContaRepo.updateSaldo).toHaveBeenCalledWith(mockConta.id, 800);

    expect(mockOrcamentoRepo.getAtualByCategoria).toHaveBeenCalledWith(categoriaId);
    expect(mockOrcamentoRepo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'orc-1',
        valor_disponivel: 300
      })
    );

    expect(mockCategoriaRepo.getAll).not.toHaveBeenCalled();
    expect(mockMetaRepo.getAllAtivas).not.toHaveBeenCalled();
  });

  it('deve zerar o orçamento principal e tentar drenar de outras categorias se o saldo não for suficiente', async () => {
    const valorSaida = 600;
    const categoriaId = 'cat-principal';
    
    const mockOrcamentoPrincipal: OrcamentoMensal = {
      id: 'orc-1', categoria_id: categoriaId, data: '2023-10-01', valor_disponivel: 400
    };

    mockOrcamentoRepo.getAtualByCategoria.mockResolvedValue(mockOrcamentoPrincipal);
    
    mockCategoriaRepo.getAll.mockResolvedValue([]);
    mockOrcamentoRepo.getAllAtual.mockResolvedValue([]);
    mockMetaRepo.getAllAtivas.mockResolvedValue([]);

    await processarSaidaUC.execute(valorSaida, mockConta, categoriaId, dataISO);

    expect(mockContaRepo.updateSaldo).toHaveBeenCalledWith(mockConta.id, 400);

    expect(mockOrcamentoRepo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'orc-1',
        valor_disponivel: 0
      })
    );

    expect(mockCategoriaRepo.getAll).toHaveBeenCalled();
    expect(mockMetaRepo.getAllAtivas).toHaveBeenCalled();
  });

  it('deve acionar o processo de drenagem nas categorias se houver prejuízo restante', async () => {
    const valorSaida = 500;
    const categoriaId = 'cat-principal';
    
    mockOrcamentoRepo.getAtualByCategoria.mockResolvedValue({
      id: 'orc-1', categoria_id: categoriaId, data: '2023-10-01', valor_disponivel: 0
    });

    const spyDrenar = jest.spyOn(processarSaidaUC as any, 'drenarProporcionalmente')
      .mockResolvedValue(0);

    const mockCategorias: Categoria[] = [
      { id: 'cat-secundaria', nome: 'Outra', peso_porcentagem: 50, sincronizado: false, atualizado_em: '', deletado_em: null }
    ];
    
    const mockOrcamentosAtuais: OrcamentoMensal[] = [
      { id: 'orc-2', categoria_id: 'cat-secundaria', data: '2023-10-01', valor_disponivel: 1000 }
    ];

    mockCategoriaRepo.getAll.mockResolvedValue(mockCategorias);
    mockOrcamentoRepo.getAllAtual.mockResolvedValue(mockOrcamentosAtuais);

    await processarSaidaUC.execute(valorSaida, mockConta, categoriaId, dataISO);

    expect(spyDrenar).toHaveBeenCalledWith(
      500,
      expect.arrayContaining([
        expect.objectContaining({ id: 'cat-secundaria', peso: 50, saldo: 1000 })
      ]),
      expect.any(Function)
    );

    expect(mockMetaRepo.getAllAtivas).not.toHaveBeenCalled();
    
    spyDrenar.mockRestore();
  });
});