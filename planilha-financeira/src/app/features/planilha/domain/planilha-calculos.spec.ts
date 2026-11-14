import { calcularFracao, obterDadosGrafico, somarLancamentos } from './planilha-calculos';
import { LancamentoPersistido, PaletaGrafico } from './planilha.model';

describe('Cálculos da planilha', () => {
  const paleta: PaletaGrafico = {
    ganhos: ['green'],
    gastos: ['red'],
    economias: ['purple'],
  };

  it('soma lançamentos e retorna fração zero quando a base é zero', () => {
    const lancamentos: LancamentoPersistido[] = [
      { id: 1, descricao: 'Salário', valor: 500 },
      { id: 2, descricao: 'Freela', valor: 250 },
    ];

    expect(somarLancamentos(lancamentos)).toBe(750);
    expect(calcularFracao(25, 100)).toBe(0.25);
    expect(calcularFracao(25, 0)).toBe(0);
  });

  it('agrupa descrições iguais e mantém a ordenação e as cores por categoria', () => {
    const dados = obterDadosGrafico(
      [
        { id: 1, descricao: 'salário', valor: 500 },
        { id: 2, descricao: 'Salário', valor: 100 },
      ],
      [{ id: 3, descricao: 'Reserva', valor: 50 }],
      [{ id: 4, descricao: 'Mercado', valor: 30 }],
      paleta,
    );

    expect(dados).toEqual({
      labels: ['Ganho: salário', 'Economia: Reserva', 'Gasto: Mercado'],
      dados: [600, 50, 30],
      cores: ['green', 'purple', 'red'],
    });
  });
});
