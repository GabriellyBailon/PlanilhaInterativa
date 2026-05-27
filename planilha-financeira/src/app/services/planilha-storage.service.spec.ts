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
