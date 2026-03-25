import { RegistrarTransacaoUC } from '../../../src/core/usecases/transacao/RegistrarTransacaoUC';
import { TransacaoDTO } from '../../../src/core/entities/dto/TransacaoDTO';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'id-mockado-uuid'),
}));

describe('RegistrarTransacaoUC', () => {
  let registrarTransacaoUC: RegistrarTransacaoUC;

  const mockTransacaoRepo = {
    create: jest.fn(),
    getAll: jest.fn(),
    getById: jest.fn(),
    getFiltered: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  };

  const mockProcessarEntradaUC = {
    execute: jest.fn(),
  };

  const mockProcessarSaidaUC = {
    execute: jest.fn(),
  };

  const mockProcessarInvestimentoUC = {
    execute: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    registrarTransacaoUC = new RegistrarTransacaoUC(
      mockTransacaoRepo as any,
      mockProcessarEntradaUC as any,
      mockProcessarSaidaUC as any,
      mockProcessarInvestimentoUC as any
    );
  });

  const baseTransacaoDTO: TransacaoDTO = {
    responsavel_id: 'resp-123',
    categoria_id: 'cat-123',
    descricao: 'Teste',
    valor: 100,
    tipo: 'Entrada',
    data: '2023-10-15T10:00:00Z'
  };

  it('deve gerar um ID para a transação caso ele não seja fornecido no DTO e salvar no banco', async () => {
    const dto: TransacaoDTO = { ...baseTransacaoDTO, tipo: 'Entrada' };

    await registrarTransacaoUC.execute(dto);

    expect(mockTransacaoRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'id-mockado-uuid',
        valor: dto.valor,
        tipo: dto.tipo
      })
    );
  });

  it('deve acionar o ProcessarEntradaUC caso o tipo da transação seja "Entrada"', async () => {
    const dto: TransacaoDTO = { ...baseTransacaoDTO, tipo: 'Entrada' };

    await registrarTransacaoUC.execute(dto);

    expect(mockProcessarEntradaUC.execute).toHaveBeenCalledWith(dto.valor, dto.data);
    
    expect(mockProcessarSaidaUC.execute).not.toHaveBeenCalled();
    expect(mockProcessarInvestimentoUC.execute).not.toHaveBeenCalled();
  });

  it('deve acionar o ProcessarSaidaUC caso o tipo da transação seja "Saida"', async () => {
    const dto: TransacaoDTO = { ...baseTransacaoDTO, tipo: 'Saida' };

    await registrarTransacaoUC.execute(dto);

    expect(mockProcessarSaidaUC.execute).toHaveBeenCalledWith(dto.valor, dto.categoria_id, dto.data);
    
    expect(mockProcessarEntradaUC.execute).not.toHaveBeenCalled();
    expect(mockProcessarInvestimentoUC.execute).not.toHaveBeenCalled();
  });

  it('deve acionar o ProcessarInvestimentoUC caso o tipo da transação seja "Investimento"', async () => {
    const dto: TransacaoDTO = { ...baseTransacaoDTO, tipo: 'Investimento' };

    await registrarTransacaoUC.execute(dto);

    expect(mockProcessarInvestimentoUC.execute).toHaveBeenCalledWith(dto.valor);
    
    expect(mockProcessarEntradaUC.execute).not.toHaveBeenCalled();
    expect(mockProcessarSaidaUC.execute).not.toHaveBeenCalled();
  });

  it('apenas salva a transação e não aciona processamentos adicionais caso o tipo seja "Juros"', async () => {
    const dto: TransacaoDTO = { ...baseTransacaoDTO, tipo: 'Juros' };

    await registrarTransacaoUC.execute(dto);

    expect(mockTransacaoRepo.create).toHaveBeenCalled();
    
    expect(mockProcessarEntradaUC.execute).not.toHaveBeenCalled();
    expect(mockProcessarSaidaUC.execute).not.toHaveBeenCalled();
    expect(mockProcessarInvestimentoUC.execute).not.toHaveBeenCalled();
  });
});