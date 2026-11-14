import { DataHoraLocalPipe } from './data-hora-local.pipe';

describe('Formatação de data e hora locais', () => {
  const pipe = new DataHoraLocalPipe();

  it('formata uma data ISO no horário local brasileiro', () => {
    const texto = pipe.transform('2026-05-27T20:56:00');
    expect(texto).toMatch(/27\/05\/2026\s+20:56/);
  });

  it('retorna texto vazio para valores ausentes ou inválidos', () => {
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('invalido')).toBe('');
  });
});
