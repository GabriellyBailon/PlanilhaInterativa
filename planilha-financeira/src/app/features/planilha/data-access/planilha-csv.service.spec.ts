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
