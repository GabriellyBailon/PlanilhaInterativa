import { PlanilhaStorageService } from './planilha-storage.service';

describe('PlanilhaStorageService', () => {
  let service: PlanilhaStorageService;

  beforeEach(() => {
    localStorage.clear();
    service = new PlanilhaStorageService();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should return null when storage is empty', () => {
    expect(service.carregar()).toBeNull();
  });

  it('should save and load estado', () => {
    const estado = {
      entradas: [{ id: 1, descricao: 'Salário', valor: 500 }],
      saidas: [{ id: 2, descricao: 'Aluguel', valor: 200 }],
      economias: [{ id: 3, descricao: 'Reserva', valor: 100 }],
      nextId: 4,
    };

    service.salvar(estado);
    expect(service.carregar()).toEqual(estado);
  });

  it('should treat economias null as empty list', () => {
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

  it('should load legacy estado without economias as empty list', () => {
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

  it('should reject invalid JSON payload', () => {
    localStorage.setItem('planilha-financeira:v1', '{invalido');
    expect(service.carregar()).toBeNull();
  });

  it('should save and load nomePagina', () => {
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

  it('should ignore invalid nomePagina', () => {
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

  it('should load lancamentos with criadoEm and reject invalid criadoEm', () => {
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

  it('should load legacy lancamentos without criadoEm', () => {
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

  it('should reject lists with invalid lancamentos', () => {
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
});
