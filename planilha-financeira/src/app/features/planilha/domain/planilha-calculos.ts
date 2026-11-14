import {
  CategoriaGrafico,
  DadosGrafico,
  LancamentoPersistido,
  PaletaGrafico,
} from './planilha.model';

export function somarLancamentos(lancamentos: LancamentoPersistido[]): number {
  return lancamentos.reduce((total, lancamento) => total + lancamento.valor, 0);
}

export function calcularFracao(valor: number, total: number): number {
  return total > 0 ? valor / total : 0;
}

export function obterDadosGrafico(
  entradas: LancamentoPersistido[],
  economias: LancamentoPersistido[],
  saidas: LancamentoPersistido[],
  paleta: PaletaGrafico,
): DadosGrafico {
  const ganhos = agruparPorCategoria(entradas, 'Entrada', 'Ganho: ');
  const categoriasEconomia = agruparPorCategoria(economias, 'Economia', 'Economia: ');
  const gastos = agruparPorCategoria(saidas, 'Saída', 'Gasto: ');
  const fatias = [...ganhos, ...categoriasEconomia, ...gastos];

  return {
    labels: fatias.map((fatia) => fatia.label),
    dados: fatias.map((fatia) => fatia.valor),
    cores: [
      ...obterCores(ganhos, paleta.ganhos),
      ...obterCores(categoriasEconomia, paleta.economias),
      ...obterCores(gastos, paleta.gastos),
    ],
  };
}

function agruparPorCategoria(
  lancamentos: LancamentoPersistido[],
  nomePadrao: string,
  prefixoLabel: string,
): CategoriaGrafico[] {
  const categorias = new Map<string, CategoriaGrafico>();

  for (const lancamento of lancamentos) {
    const nome = lancamento.descricao.trim() || nomePadrao;
    const chave = nome.toLowerCase();
    const existente = categorias.get(chave);

    if (existente) {
      existente.valor += lancamento.valor;
    } else {
      categorias.set(chave, {
        label: `${prefixoLabel}${nome}`,
        valor: lancamento.valor,
      });
    }
  }

  return Array.from(categorias.values()).sort((a, b) =>
    a.label.localeCompare(b.label, 'pt-BR'),
  );
}

function obterCores(categorias: CategoriaGrafico[], paleta: string[]): string[] {
  return categorias.map((_, indice) => paleta[indice % paleta.length]);
}
