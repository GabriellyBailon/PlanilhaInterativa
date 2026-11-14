import { PlanilhaStorageService } from './planilha-storage.service';

describe('Armazenamento da planilha', () => {
  let service: PlanilhaStorageService;

  beforeEach(() => {
    localStorage.clear();
    service = new PlanilhaStorageService();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('retorna nulo quando o armazenamento está vazio', () => {
    expect(service.carregar()).toBeNull();
  });

  it('salva e carrega o estado da planilha', () => {
    const estado = {
      entradas: [{ id: 1, descricao: 'Salário', valor: 500 }],
      saidas: [{ id: 2, descricao: 'Aluguel', valor: 200 }],
      economias: [{ id: 3, descricao: 'Reserva', valor: 100 }],
      nextId: 4,
    };

    expect(service.salvar(estado)).toBe(true);
    expect(service.carregar()).toEqual(estado);
  });

  it('informa quando não consegue salvar o estado', () => {
    spyOn(localStorage, 'setItem').and.throwError('quota exceeded');

    expect(
      service.salvar({
        entradas: [],
        saidas: [],
        economias: [],
        nextId: 1,
      }),
    ).toBe(false);
  });

  it('trata economias nulas como uma lista vazia', () => {
    localStorage.setItem(
      'planilha-financeira:v1',
      JSON.stringify({
        entradas: [{ id: 1, descricao: 'Salário', valor: 500 }],
        saidas: [],
        economias: null,
        nextId: 2,
      }),
    );

    expect(service.carregar()).toEqual({
      entradas: [{ id: 1, descricao: 'Salário', valor: 500 }],
      saidas: [],
      economias: [],
      nextId: 2,
    });
  });

  it('carrega estados antigos sem economias como uma lista vazia', () => {
    localStorage.setItem(
      'planilha-financeira:v1',
      JSON.stringify({
        entradas: [{ id: 1, descricao: 'Salário', valor: 500 }],
        saidas: [],
        nextId: 2,
      }),
    );

    expect(service.carregar()).toEqual({
      entradas: [{ id: 1, descricao: 'Salário', valor: 500 }],
      saidas: [],
      economias: [],
      nextId: 2,
    });
  });

  it('rejeita conteúdo JSON inválido', () => {
    localStorage.setItem('planilha-financeira:v1', '{invalido');
    expect(service.carregar()).toBeNull();
  });

  it('salva e carrega a opção de ocultar percentuais', () => {
    const estado = {
      entradas: [],
      saidas: [],
      economias: [],
      nextId: 1,
      mostrarResumoPercentuais: false,
    };

    service.salvar(estado);
    expect(service.carregar()).toEqual(estado);
  });

  it('ignora valores inválidos para a opção de percentuais', () => {
    localStorage.setItem(
      'planilha-financeira:v1',
      JSON.stringify({
        entradas: [{ id: 1, descricao: 'Salário', valor: 500 }],
        saidas: [],
        economias: [],
        nextId: 2,
        mostrarResumoPercentuais: 'nao',
      }),
    );

    expect(service.carregar()?.mostrarResumoPercentuais).toBeUndefined();
  });

  it('salva e carrega o nome da página', () => {
    const estado = {
      entradas: [],
      saidas: [],
      economias: [],
      nextId: 1,
      nomePagina: 'Maio 2026',
    };

    service.salvar(estado);
    expect(service.carregar()).toEqual(estado);
  });

  it('ignora um nome de página inválido', () => {
    localStorage.setItem(
      'planilha-financeira:v1',
      JSON.stringify({
        entradas: [{ id: 1, descricao: 'Salário', valor: 500 }],
        saidas: [],
        economias: [],
        nextId: 2,
        nomePagina: 123,
      }),
    );

    expect(service.carregar()?.nomePagina).toBeUndefined();
  });

  it('carrega datas de lançamento válidas e rejeita datas inválidas', () => {
    const iso = '2026-05-27T20:56:00.000Z';
    localStorage.setItem(
      'planilha-financeira:v1',
      JSON.stringify({
        entradas: [{ id: 1, descricao: 'Salário', valor: 500, criadoEm: iso }],
        saidas: [],
        economias: [],
        nextId: 2,
      }),
    );

    expect(service.carregar()?.entradas[0].criadoEm).toBe(iso);

    localStorage.setItem(
      'planilha-financeira:v1',
      JSON.stringify({
        entradas: [{ id: 1, descricao: 'Salário', valor: 500, criadoEm: 'nao-e-data' }],
        saidas: [],
        economias: [],
        nextId: 2,
      }),
    );
    expect(service.carregar()).toBeNull();
  });

  it('carrega lançamentos antigos sem data de criação', () => {
    localStorage.setItem(
      'planilha-financeira:v1',
      JSON.stringify({
        entradas: [{ id: 1, descricao: 'Salário', valor: 500 }],
        saidas: [],
        economias: [],
        nextId: 2,
      }),
    );

    const entrada = service.carregar()?.entradas[0];
    expect(entrada?.criadoEm).toBeUndefined();
  });

  it('rejeita listas com lançamentos inválidos', () => {
    localStorage.setItem(
      'planilha-financeira:v1',
      JSON.stringify({
        entradas: [{ id: 1, descricao: 'Ok', valor: -10 }],
        saidas: [],
        economias: [],
        nextId: 2,
      }),
    );
    expect(service.carregar()).toBeNull();
  });

  it('rejeita estados raiz e listas obrigatórias inválidas', () => {
    for (const dados of [null, 12, [], {}, { entradas: [], saidas: null }]) {
      localStorage.setItem('planilha-financeira:v1', JSON.stringify(dados));
      expect(service.carregar()).toBeNull();
    }

    localStorage.setItem(
      'planilha-financeira:v1',
      JSON.stringify({
        entradas: [],
        saidas: [],
        economias: {},
        nextId: 1,
      }),
    );
    expect(service.carregar()).toBeNull();
  });

  it('rejeita lançamentos com campos, identificadores, valores ou datas inválidos', () => {
    const registros = [
      null,
      { id: 0, descricao: 'Inválido', valor: 10 },
      { id: 1.5, descricao: 'Inválido', valor: 10 },
      { id: 1, descricao: 2, valor: 10 },
      { id: 1, descricao: 'Inválido', valor: 0 },
      { id: 1, descricao: 'Inválido', valor: '10' },
      { id: 1, descricao: 'Inválido', valor: 10, criadoEm: 123 },
    ];

    for (const registro of registros) {
      localStorage.setItem(
        'planilha-financeira:v1',
        JSON.stringify({
          entradas: [registro],
          saidas: [],
          economias: [],
          nextId: 1,
        }),
      );
      expect(service.carregar()).toBeNull();
    }
  });

  it('corrige o próximo identificador e normaliza nome e preferências opcionais', () => {
    localStorage.setItem(
      'planilha-financeira:v1',
      JSON.stringify({
        entradas: [{ id: 4, descricao: 'Salário', valor: 10, criadoEm: null }],
        saidas: [],
        economias: [],
        nextId: 2,
        nomePagina: `  ${'A'.repeat(90)}  `,
        mostrarResumoPercentuais: true,
      }),
    );

    const estado = service.carregar();
    expect(estado?.nextId).toBe(5);
    expect(estado?.nomePagina).toBe('A'.repeat(80));
    expect(estado?.mostrarResumoPercentuais).toBeUndefined();
    expect(estado?.entradas[0].criadoEm).toBeUndefined();

    localStorage.setItem(
      'planilha-financeira:v1',
      JSON.stringify({
        entradas: [],
        saidas: [],
        economias: [],
        nextId: 0,
        nomePagina: '   ',
        mostrarResumoPercentuais: null,
      }),
    );
    expect(service.carregar()).toEqual({
      entradas: [],
      saidas: [],
      economias: [],
      nextId: 1,
    });
  });

  it('retorna nulo quando ocorre falha ao ler o armazenamento', () => {
    spyOn(localStorage, 'getItem').and.throwError('acesso negado');
    expect(service.carregar()).toBeNull();
  });

  it('trata a ausência de armazenamento local como indisponibilidade', () => {
    const armazenamentoLocal = spyOnProperty(window, 'localStorage', 'get').and.returnValue(
      undefined as unknown as Storage,
    );

    try {
      expect(service.carregar()).toBeNull();
      expect(
        service.salvar({
          entradas: [],
          saidas: [],
          economias: [],
          nextId: 1,
        }),
      ).toBeFalse();
    } finally {
      armazenamentoLocal.and.callThrough();
    }
  });
});
