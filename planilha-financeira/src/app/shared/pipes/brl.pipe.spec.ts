import { BrlPipe } from './brl.pipe';

describe('Formatação de valores em reais', () => {
  const pipe = new BrlPipe();

  it('formata valores positivos e negativos em reais', () => {
    expect(pipe.transform(1234.5)).toBe('R$\u00a01.234,50');
    expect(pipe.transform(-10)).toBe('-R$\u00a010,00');
  });

  it('usa zero para valores nulos, indefinidos ou NaN', () => {
    expect(pipe.transform(null)).toBe('R$\u00a00,00');
    expect(pipe.transform(undefined)).toBe('R$\u00a00,00');
    expect(pipe.transform(Number.NaN)).toBe('R$\u00a00,00');
  });
});
