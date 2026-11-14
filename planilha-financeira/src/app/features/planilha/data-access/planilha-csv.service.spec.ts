import { PlanilhaCsvService } from './planilha-csv.service';

describe('PlanilhaCsvService', () => {
  let service: PlanilhaCsvService;

  beforeEach(() => {
    service = new PlanilhaCsvService();
  });

  it('imports records grouped by area from a flat CSV', () => {
    const csv = [
      'Area;Descricao;Valor;DataAlteracao',
      'Entradas;Salário;R$ 200,00;15/10/2026 09:30:45',
      'Saídas;Aluguel;R$ 50,00;16/10/2026 10:00:00',
      'Economias;Reserva;R$ 25,00;17/10/2026 11:15:00',
    ].join('\n');

    const resultado = service.importarCsvTexto(csv, 10);

    expect(resultado.entradas).toEqual([
      {
        id: 10,
        descricao: 'Salário',
        valor: 200,
        criadoEm: new Date(2026, 9, 15, 9, 30, 45).toISOString(),
      },
    ]);
    expect(resultado.saidas[0].descricao).toBe('Aluguel');
    expect(resultado.economias[0].descricao).toBe('Reserva');
    expect(resultado.nextId).toBe(13);
  });

  it('preserves the page name when exporting and importing grouped CSV', () => {
    const nomePagina = 'Meu "orçamento"';
    const csv = service.gerarCsv({
      nomePagina,
      entradas: [
        {
          id: 1,
          descricao: 'Salário',
          valor: 200,
          criadoEm: '2026-10-15T12:30:45.000Z',
        },
      ],
      saidas: [],
      economias: [],
    });

    const resultado = service.importarCsvTexto(csv, 10);

    expect(resultado.nomePagina).toBe(nomePagina);
  });

  it('adds a page-name hint to errors in cell A1', () => {
    expect(service.formatarErro('A', 1)).toContain(
      'Confira o nome da Planilha e preencha-o caso esteja vazio',
    );
  });

  it('does not expose a partially parsed result when a later row is invalid', () => {
    const csv = [
      'Area;Descricao;Valor;DataAlteracao',
      'Entradas;Salário;R$ 200,00;15/10/2026 09:30:45',
      'Outra;Inválido;R$ 50,00;16/10/2026 10:00:00',
    ].join('\n');

    expect(() => service.importarCsvTexto(csv, 10)).toThrowError(
      'Ops! Os dados da planilha estão em formato incorreto. Verifique a célula a3',
    );
  });
});
