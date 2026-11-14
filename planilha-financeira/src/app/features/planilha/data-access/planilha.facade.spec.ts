import { TestBed } from '@angular/core/testing';
import { PlanilhaFacade } from './planilha.facade';
import { PlanilhaStorageService } from './planilha-storage.service';

describe('Fachada da planilha financeira', () => {
  let fachada: PlanilhaFacade;
  let armazenamento: PlanilhaStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PlanilhaFacade, PlanilhaStorageService],
    });
    fachada = TestBed.inject(PlanilhaFacade);
    armazenamento = TestBed.inject(PlanilhaStorageService);
  });

  it('inicia vazia e calcula totais, saldo, frações e estado de exportação', () => {
    expect(fachada.tituloPagina).toBe('Planejador de Finanças');
    expect(fachada.temDadosParaExportar).toBeFalse();
    expect(fachada.saldoClasse).toBe('saldo-alerta');

    fachada.entradas = [{ id: 1, descricao: 'Salário', valor: 500 }];
    fachada.saidas = [{ id: 2, descricao: 'Aluguel', valor: 200 }];
    fachada.economias = [{ id: 3, descricao: 'Reserva', valor: 100 }];

    expect(fachada.totalEntradas).toBe(500);
    expect(fachada.totalSaidas).toBe(200);
    expect(fachada.totalEconomias).toBe(100);
    expect(fachada.totalMovimentado).toBe(800);
    expect(fachada.saldo).toBe(200);
    expect(fachada.fracaoGastosDosGanhos).toBe(0.4);
    expect(fachada.fracaoEconomiasDosGanhos).toBe(0.2);
    expect(fachada.temDadosParaExportar).toBeTrue();
    expect(fachada.saldoClasse).toBe('saldo-positivo');

    fachada.entradas = [];
    fachada.economias = [];
    expect(fachada.fracaoGastosDosGanhos).toBe(0);
    fachada.saidas = [{ id: 4, descricao: 'Conta', valor: 1 }];
    expect(fachada.saldoClasse).toBe('saldo-negativo');
    fachada.saidas = [{ id: 4, descricao: 'Conta', valor: 0 }];
    expect(fachada.saldoClasse).toBe('saldo-alerta');
  });

  it('carrega o estado salvo e mantém os valores padrão quando não há dados', () => {
    spyOn(armazenamento, 'carregar').and.returnValue(null);
    fachada.carregarDados();
    expect(fachada.entradas).toEqual([]);
    expect(fachada.mostrarResumoPercentuais).toBeTrue();

    (armazenamento.carregar as jasmine.Spy).and.returnValue({
      entradas: [{ id: 2, descricao: 'Salário', valor: 900 }],
      saidas: [],
      economias: [],
      nextId: 3,
      nomePagina: '  Abril  ',
      mostrarResumoPercentuais: false,
    });
    fachada.carregarDados();

    expect(fachada.entradas[0].id).toBe(2);
    expect(fachada.nextId).toBe(3);
    expect(fachada.nomePagina).toBe('  Abril  ');
    expect(fachada.mostrarResumoPercentuais).toBeFalse();
  });

  it('persiste o estado normalizado e informa falha de armazenamento', () => {
    fachada.nomePagina = '  Maio  ';
    const salvar = spyOn(armazenamento, 'salvar').and.returnValue(true);
    fachada.persistir();

    expect(salvar).toHaveBeenCalledWith(
      jasmine.objectContaining({ nomePagina: 'Maio' }),
    );
    expect(fachada.erroPersistencia).toBe('');

    salvar.and.returnValue(false);
    fachada.persistir();
    expect(fachada.erroPersistencia).toContain('Não foi possível salvar');
  });

  it('invalida o cache do gráfico ao persistir e reutiliza os dados até lá', () => {
    fachada.entradas = [{ id: 1, descricao: 'Salário', valor: 100 }];
    const graficoInicial = fachada.dadosGrafico;
    expect(fachada.dadosGrafico).toBe(graficoInicial);

    fachada.entradas = [{ id: 1, descricao: 'Salário', valor: 200 }];
    expect(fachada.dadosGrafico).toBe(graficoInicial);
    fachada.persistir();
    expect(fachada.dadosGrafico).not.toBe(graficoInicial);
    expect(fachada.dadosGrafico.dados).toEqual([200]);
  });

  it('alterna e persiste a visibilidade dos percentuais', () => {
    const salvar = spyOn(armazenamento, 'salvar').and.returnValue(true);
    fachada.alternarResumoPercentuais();
    expect(fachada.mostrarResumoPercentuais).toBeFalse();
    expect(armazenamento.salvar).toHaveBeenCalledWith(
      jasmine.objectContaining({ mostrarResumoPercentuais: false }),
    );

    fachada.alternarResumoPercentuais();
    expect(fachada.mostrarResumoPercentuais).toBeTrue();
    expect(salvar.calls.mostRecent().args[0].mostrarResumoPercentuais).toBeUndefined();
  });

  it('adiciona lançamentos válidos nas três categorias e rejeita dados inválidos', () => {
    spyOn(armazenamento, 'salvar').and.returnValue(true);
    fachada.adicionarLancamento('entrada', { descricao: '  Salário ', valor: 100 });
    fachada.adicionarLancamento('saida', { descricao: 'Aluguel', valor: 50 });
    fachada.adicionarLancamento('economia', { descricao: 'Reserva', valor: 25 });
    fachada.adicionarLancamento('entrada', { descricao: ' ', valor: 10 });
    fachada.adicionarLancamento('entrada', { descricao: 'Inválido', valor: Number.NaN });
    fachada.adicionarLancamento('entrada', { descricao: 'Zero', valor: 0 });

    expect(fachada.entradas[0].descricao).toBe('Salário');
    expect(fachada.entradas[0].id).toBe(1);
    expect(fachada.saidas[0].id).toBe(2);
    expect(fachada.economias[0].id).toBe(3);
    expect(fachada.nextId).toBe(4);
    expect(armazenamento.salvar).toHaveBeenCalledTimes(3);
    expect(Date.parse(fachada.entradas[0].criadoEm!)).not.toBeNaN();
  });

  it('valida a edição e atualiza somente o lançamento selecionado', () => {
    spyOn(armazenamento, 'salvar').and.returnValue(true);
    fachada.entradas = [
      { id: 1, descricao: 'Salário', valor: 100 },
      { id: 2, descricao: 'Freela', valor: 50 },
    ];
    const edicao = { tipo: 'entrada' as const, id: 1 };

    expect(fachada.salvarEdicao('entrada', null, 'Atualizado', 200, '2026-05-01T10:00')).toBeFalse();
    expect(fachada.salvarEdicao('saida', edicao, 'Atualizado', 200, '2026-05-01T10:00')).toBeFalse();
    expect(fachada.salvarEdicao('entrada', edicao, ' ', 200, '2026-05-01T10:00')).toBeFalse();
    expect(fachada.salvarEdicao('entrada', edicao, 'Atualizado', 0, '2026-05-01T10:00')).toBeFalse();
    expect(fachada.salvarEdicao('entrada', edicao, 'Atualizado', 200, 'data inválida')).toBeFalse();
    expect(
      fachada.salvarEdicao('entrada', { tipo: 'entrada', id: 99 }, 'Atualizado', 200, '2026-05-01T10:00'),
    ).toBeFalse();

    expect(fachada.salvarEdicao('entrada', edicao, '  Atualizado  ', 200, '2026-05-01T10:00:30')).toBeTrue();
    expect(fachada.entradas).toEqual([
      {
        id: 1,
        descricao: 'Atualizado',
        valor: 200,
        criadoEm: new Date(2026, 4, 1, 10, 0, 30).toISOString(),
      },
      { id: 2, descricao: 'Freela', valor: 50 },
    ]);

    expect(
      fachada.salvarEdicao('entrada', edicao, 'Data inexistente', 100, '2026-02-31T10:00'),
    ).toBeFalse();
  });

  it('remove lançamentos, limpa categorias e redefine toda a planilha', () => {
    spyOn(armazenamento, 'salvar').and.returnValue(true);
    fachada.entradas = [{ id: 1, descricao: 'Salário', valor: 100 }];
    fachada.saidas = [{ id: 2, descricao: 'Conta', valor: 20 }];
    fachada.economias = [{ id: 3, descricao: 'Reserva', valor: 10 }];

    expect(fachada.obterLancamentos('entrada')).toBe(fachada.entradas);
    expect(fachada.totalDaCategoria('saida')).toBe(20);
    expect(fachada.temLancamento('entrada', 1)).toBeTrue();
    fachada.removerLancamento('entrada', 1);
    expect(fachada.temLancamento('entrada', 1)).toBeFalse();
    fachada.apagarCategoria('saida');
    expect(fachada.saidas).toEqual([]);
    fachada.apagarCategoria('economia');
    expect(fachada.economias).toEqual([]);

    fachada.nomePagina = 'Planilha';
    fachada.nextId = 4;
    fachada.limparTudo();
    expect(fachada.entradas).toEqual([]);
    expect(fachada.nomePagina).toBe('');
    expect(fachada.nextId).toBe(1);

    fachada.importarEstado({
      entradas: [{ id: 8, descricao: 'Importado', valor: 50 }],
      saidas: [],
      economias: [],
      nextId: 9,
    });
    expect(fachada.entradas[0].id).toBe(8);
    expect(fachada.nomePagina).toBe('');
    expect(fachada.nextId).toBe(9);
  });

  it('formata percentuais e datas locais para edição', () => {
    expect(fachada.formatarPercentual(0.125)).toBe('12,5%');
    expect(fachada.formatarPercentual(0.5)).toBe('50%');
    expect(fachada.formatarDataHoraParaEdicao('data inválida')).toBe('');
    expect(fachada.formatarDataHoraParaEdicao('2026-05-27T20:56:00.000Z')).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/,
    );
    expect(fachada.formatarDataHoraParaEdicao()).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/,
    );
  });
});
