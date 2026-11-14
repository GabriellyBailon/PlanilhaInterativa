import { CategoriaLancamentoConfig } from './components/lancamento-categoria/lancamento-categoria.component';
import { PaletaGrafico } from './domain/planilha.model';

export const categoriasLancamentoConfig: CategoriaLancamentoConfig[] = [
  {
    tipo: 'entrada',
    titulo: 'Ganhos',
    rotulo: 'entrada',
    acaoAdicionar: 'Adicionar ganho',
    placeholderDescricao: 'Ex.: Salário',
    mensagemVazia: 'Nenhuma entrada registrada.',
    rotuloTotal: 'Total de ganhos',
    acaoLimpar: 'Limpar todos os ganhos',
  },
  {
    tipo: 'saida',
    titulo: 'Gastos',
    rotulo: 'saída',
    acaoAdicionar: 'Adicionar gasto',
    placeholderDescricao: 'Ex.: Aluguel',
    mensagemVazia: 'Nenhuma saída registrada.',
    rotuloTotal: 'Total de gastos',
    acaoLimpar: 'Limpar todos os gastos',
  },
  {
    tipo: 'economia',
    titulo: 'Economias',
    rotulo: 'economia',
    acaoAdicionar: 'Adicionar economia',
    placeholderDescricao: 'Ex.: Reserva de emergência',
    mensagemVazia: 'Nenhuma economia registrada.',
    rotuloTotal: 'Total de economias',
    acaoLimpar: 'Limpar todas as economias',
  },
];

export const paletaGraficoPadrao: PaletaGrafico = {
  ganhos: ['#22c55e', '#16a34a', '#4ade80', '#15803d', '#86efac', '#14532d', '#a3e635', '#65a30d'],
  gastos: ['#ef4444', '#f97316', '#eab308', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6', '#a855f7', '#f43f5e', '#64748b', '#0ea5e9', '#84cc16'],
  economias: ['#ff00ff', '#00e5ff', '#ff1744', '#ffea00', '#d500f9', '#00e676', '#ff6d00', '#304ffe', '#f50057', '#76ff03'],
};
