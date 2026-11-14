import { DataHoraLocalPipe } from './data-hora-local.pipe';

describe('DataHoraLocalPipe', () => {
  const pipe = new DataHoraLocalPipe();

  it('should format ISO date in pt-BR local time', () => {
    const texto = pipe.transform('2026-05-27T20:56:00');
    expect(texto).toMatch(/27\/05\/2026\s+20:56/);
  });

  it('should return empty string for invalid input', () => {
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('invalido')).toBe('');
  });
});
