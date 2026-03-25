import { ProcessarInvestimentoUC } from '../../../src/core/usecases/transacao/ProcessarInvestimentoUC';
import { Meta } from '../../../src/core/entities/Meta';

describe('ProcessarInvestimentoUC', () => {
  let processarInvestimentoUC: ProcessarInvestimentoUC;

  const mockMetaRepo = {
    getAllAtivas: jest.fn(),
    updateValorAtual: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    processarInvestimentoUC = new ProcessarInvestimentoUC(
      mockMetaRepo as any
    );
  });

  it('deve distribuir o valor proporcionalmente entre as metas', async () => {
    const valorInvestimento = 1000;
    
    const mockMetas: Meta[] = [
      { id: 'meta-1', categoria_id: 'cat-1', nome: 'Reserva de Emergência', valor_objetivo: 10000, valor_atual: 1000, peso_porcentagem: 60, status: 'Andamento', sincronizado: false, atualizado_em: '', deletado_em: null },
      { id: 'meta-2', categoria_id: 'cat-2', nome: 'Aposentadoria', valor_objetivo: 50000, valor_atual: 5000, peso_porcentagem: 40, status: 'Andamento', sincronizado: false, atualizado_em: '', deletado_em: null }
    ];

    mockMetaRepo.getAllAtivas.mockResolvedValue(mockMetas);

    await processarInvestimentoUC.execute(valorInvestimento);

    expect(mockMetaRepo.updateValorAtual).toHaveBeenCalledWith('meta-1', 600);

    expect(mockMetaRepo.updateValorAtual).toHaveBeenCalledWith('meta-2', 400);
  });

  it('não deve fazer nada se não houver metas ativas ou se a soma dos pesos for zero', async () => {
    const valorInvestimento = 500;
    
    const mockMetas: Meta[] = [
      { id: 'meta-1', categoria_id: 'cat-1', nome: 'Carro', valor_objetivo: 50000, valor_atual: 0, peso_porcentagem: 0, status: 'Andamento', sincronizado: false, atualizado_em: '', deletado_em: null }
    ];

    mockMetaRepo.getAllAtivas.mockResolvedValue(mockMetas);

    await processarInvestimentoUC.execute(valorInvestimento);

    expect(mockMetaRepo.updateValorAtual).not.toHaveBeenCalled();
  });

  it('deve ignorar metas que tenham peso igual a zero na distribuição', async () => {
    const valorInvestimento = 200;
    
    const mockMetas: Meta[] = [
      { id: 'meta-1', categoria_id: 'cat-1', nome: 'Viagem', valor_objetivo: 5000, valor_atual: 0, peso_porcentagem: 100, status: 'Andamento', sincronizado: false, atualizado_em: '', deletado_em: null },
      { id: 'meta-zero', categoria_id: 'cat-2', nome: 'Sem peso', valor_objetivo: 1000, valor_atual: 0, peso_porcentagem: 0, status: 'Andamento', sincronizado: false, atualizado_em: '', deletado_em: null }
    ];

    mockMetaRepo.getAllAtivas.mockResolvedValue(mockMetas);

    await processarInvestimentoUC.execute(valorInvestimento);

    expect(mockMetaRepo.updateValorAtual).toHaveBeenCalledWith('meta-1', 200);
    
    expect(mockMetaRepo.updateValorAtual).not.toHaveBeenCalledWith('meta-zero', expect.anything());
  });
});