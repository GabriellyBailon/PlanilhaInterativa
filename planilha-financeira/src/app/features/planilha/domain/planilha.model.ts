export interface LancamentoPersistido {
  id: number;
  descricao: string;
  valor: number;
  criadoEm?: string;
}

export interface EstadoPlanilha {
  entradas: LancamentoPersistido[];
  saidas: LancamentoPersistido[];
  economias: LancamentoPersistido[];
  nextId: number;
  nomePagina?: string;
  mostrarResumoPercentuais?: boolean;
}

export interface CategoriaGrafico {
  label: string;
  valor: number;
}

export interface DadosGrafico {
  labels: string[];
  dados: number[];
  cores: string[];
}

export interface PaletaGrafico {
  ganhos: string[];
  gastos: string[];
  economias: string[];
}

export type TipoLancamento = 'entrada' | 'saida' | 'economia';

export interface EdicaoAtiva {
  tipo: TipoLancamento;
  id: number;
}

export interface NovoLancamento {
  descricao: string;
  valor: number;
}
