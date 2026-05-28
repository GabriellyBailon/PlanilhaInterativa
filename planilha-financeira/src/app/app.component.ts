import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  afterNextRender,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { Chart, ChartConfiguration } from 'chart.js/auto';
import { BrlCurrencyDirective } from './directives/brl-currency.directive';
import { BrlPipe } from './pipes/brl.pipe';
import { DataHoraLocalPipe } from './pipes/data-hora-local.pipe';
import {
  LancamentoPersistido,
  PlanilhaStorageService,
} from './services/planilha-storage.service';

interface CategoriaGrafico {
  label: string;
  valor: number;
}

@Component({
  selector: 'app-root',
  imports: [
    FormsModule,
    NgIf,
    NgFor,
    BrlCurrencyDirective,
    BrlPipe,
    DataHoraLocalPipe,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild('pieChart') pieChartRef!: ElementRef<HTMLCanvasElement>;

  private readonly storage = inject(PlanilhaStorageService);
  private graficoInicializado = false;

  entradas: LancamentoPersistido[] = [];
  saidas: LancamentoPersistido[] = [];
  economias: LancamentoPersistido[] = [];

  nomePagina = '';
  descricaoEntrada = '';
  valorEntrada = 0;
  descricaoSaida = '';
  valorSaida = 0;
  descricaoEconomia = '';
  valorEconomia = 0;

  private nextId = 1;
  private chart?: Chart;

  private readonly coresGanhos = [
    '#22c55e',
    '#16a34a',
    '#4ade80',
    '#15803d',
    '#86efac',
    '#14532d',
    '#a3e635',
    '#65a30d',
  ];
  private readonly coresGastos = [
    '#ef4444',
    '#f97316',
    '#eab308',
    '#8b5cf6',
    '#06b6d4',
    '#ec4899',
    '#14b8a6',
    '#a855f7',
    '#f43f5e',
    '#64748b',
    '#0ea5e9',
    '#84cc16',
  ];
  private readonly coresEconomias = [
    '#ff00ff',
    '#00e5ff',
    '#ff1744',
    '#ffea00',
    '#d500f9',
    '#00e676',
    '#ff6d00',
    '#304ffe',
    '#f50057',
    '#76ff03',
  ];

  get totalEntradas(): number {
    return this.entradas.reduce((sum, item) => sum + item.valor, 0);
  }

  get totalSaidas(): number {
    return this.saidas.reduce((sum, item) => sum + item.valor, 0);
  }

  get totalEconomias(): number {
    return this.economias.reduce((sum, item) => sum + item.valor, 0);
  }

  get saldo(): number {
    return this.totalEntradas - this.totalSaidas - this.totalEconomias;
  }

  get tituloPagina(): string {
    const nome = this.nomePagina.trim();
    return nome || 'Planejador de Finanças';
  }

  get saldoClasse(): string {
    if (this.saldo < 0) {
      return 'saldo-negativo';
    }
    if (this.saldo > 100) {
      return 'saldo-positivo';
    }
    return 'saldo-alerta';
  }

  /** Soma de ganhos, gastos e economias — mesma base do gráfico de pizza. */
  get totalMovimentado(): number {
    return this.totalEntradas + this.totalSaidas + this.totalEconomias;
  }

  get fracaoGanhosNoTotal(): number {
    return this.fracaoDoTotal(this.totalEntradas);
  }

  get fracaoGastosNoTotal(): number {
    return this.fracaoDoTotal(this.totalSaidas);
  }

  get fracaoEconomiasNoTotal(): number {
    return this.fracaoDoTotal(this.totalEconomias);
  }

  private fracaoDoTotal(valor: number): number {
    const total = this.totalMovimentado;
    return total > 0 ? valor / total : 0;
  }

  formatarPercentual(fracao: number): string {
    const pct = fracao * 100;
    return `${pct.toLocaleString('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    })}%`;
  }

  constructor() {
    afterNextRender(() => {
      this.inicializarGrafico();
    });
  }

  ngOnInit(): void {
    this.carregarDados();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
    this.chart = undefined;
  }

  salvarNomePagina(): void {
    this.persistir();
  }

  adicionarEntrada(): void {
    if (!this.podeAdicionar(this.descricaoEntrada, this.valorEntrada)) {
      return;
    }

    this.entradas.push(this.novoLancamento(this.descricaoEntrada, this.valorEntrada));

    this.descricaoEntrada = '';
    this.valorEntrada = 0;
    this.persistir();
    this.atualizarGrafico();
  }

  adicionarSaida(): void {
    if (!this.podeAdicionar(this.descricaoSaida, this.valorSaida)) {
      return;
    }

    this.saidas.push(this.novoLancamento(this.descricaoSaida, this.valorSaida));

    this.descricaoSaida = '';
    this.valorSaida = 0;
    this.persistir();
    this.atualizarGrafico();
  }

  adicionarEconomia(): void {
    if (!this.podeAdicionar(this.descricaoEconomia, this.valorEconomia)) {
      return;
    }

    this.economias.push(
      this.novoLancamento(this.descricaoEconomia, this.valorEconomia),
    );

    this.descricaoEconomia = '';
    this.valorEconomia = 0;
    this.persistir();
    this.atualizarGrafico();
  }

  removerEntrada(id: number): void {
    this.entradas = this.entradas.filter((item) => item.id !== id);
    this.persistir();
    this.atualizarGrafico();
  }

  removerSaida(id: number): void {
    this.saidas = this.saidas.filter((item) => item.id !== id);
    this.persistir();
    this.atualizarGrafico();
  }

  removerEconomia(id: number): void {
    this.economias = this.economias.filter((item) => item.id !== id);
    this.persistir();
    this.atualizarGrafico();
  }

  private carregarDados(): void {
    const estado = this.storage.carregar();
    if (!estado) {
      return;
    }

    this.entradas = estado.entradas;
    this.saidas = estado.saidas;
    this.economias = estado.economias ?? [];
    this.nextId = estado.nextId;
    this.nomePagina = estado.nomePagina ?? '';
  }

  private persistir(): void {
    const nome = this.nomePagina.trim();
    this.storage.salvar({
      entradas: this.entradas,
      saidas: this.saidas,
      economias: this.economias,
      nextId: this.nextId,
      nomePagina: nome || undefined,
    });
  }

  private podeAdicionar(descricao: string, valor: number): boolean {
    return descricao.trim().length > 0 && this.asNumero(valor) > 0;
  }

  private asNumero(valor: unknown): number {
    const numero = typeof valor === 'number' ? valor : Number(valor);
    return Number.isFinite(numero) && numero >= 0 ? numero : 0;
  }

  private novoLancamento(descricao: string, valor: unknown): LancamentoPersistido {
    return {
      id: this.nextId++,
      descricao: descricao.trim(),
      valor: this.asNumero(valor),
      criadoEm: new Date().toISOString(),
    };
  }

  private agruparPorCategoria(
    lancamentos: LancamentoPersistido[],
    nomePadrao: string,
    prefixoLabel: string,
  ): CategoriaGrafico[] {
    const mapa = new Map<string, CategoriaGrafico>();

    for (const lancamento of lancamentos) {
      const nome = lancamento.descricao.trim() || nomePadrao;
      const chave = nome.toLowerCase();
      const existente = mapa.get(chave);

      if (existente) {
        existente.valor += lancamento.valor;
      } else {
        mapa.set(chave, {
          label: `${prefixoLabel}${nome}`,
          valor: lancamento.valor,
        });
      }
    }

    return Array.from(mapa.values()).sort((a, b) =>
      a.label.localeCompare(b.label, 'pt-BR'),
    );
  }

  private obterDadosGrafico(): {
    labels: string[];
    dados: number[];
    cores: string[];
  } {
    const ganhos = this.agruparPorCategoria(this.entradas, 'Entrada', 'Ganho: ');
    const economias = this.agruparPorCategoria(
      this.economias ?? [],
      'Economia',
      'Economia: ',
    );
    const gastos = this.agruparPorCategoria(this.saidas, 'Saída', 'Gasto: ');
    const fatias = [...ganhos, ...economias, ...gastos];

    const coresGanhos = ganhos.map(
      (_, i) => this.coresGanhos[i % this.coresGanhos.length],
    );
    const coresEconomias = economias.map(
      (_, i) => this.coresEconomias[i % this.coresEconomias.length],
    );
    const coresGastos = gastos.map(
      (_, i) => this.coresGastos[i % this.coresGastos.length],
    );

    return {
      labels: fatias.map((f) => f.label),
      dados: fatias.map((f) => f.valor),
      cores: [...coresGanhos, ...coresEconomias, ...coresGastos],
    };
  }

  private inicializarGrafico(): void {
    if (this.graficoInicializado || !this.pieChartRef?.nativeElement) {
      return;
    }

    this.graficoInicializado = true;
    this.criarGrafico();
    this.atualizarGrafico();
  }

  private criarGrafico(): void {
    if (!this.pieChartRef?.nativeElement) {
      return;
    }

    this.chart?.destroy();
    this.chart = undefined;

    const ctx = this.pieChartRef.nativeElement.getContext('2d');
    if (!ctx) {
      return;
    }

    const { labels, dados, cores } = this.obterDadosGrafico();

    const config: ChartConfiguration<'pie'> = {
      type: 'pie',
      data: {
        labels,
        datasets: [
          {
            data: dados,
            backgroundColor: cores,
            borderColor: '#ffffff',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const valorBruto = context.parsed ?? context.raw;
                const valor =
                  typeof valorBruto === 'number' && Number.isFinite(valorBruto)
                    ? valorBruto
                    : 0;
                const texto = valor.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                });
                const nome = context.label ?? '';
                return nome ? `${nome}: ${texto}` : texto;
              },
            },
          },
        },
      },
    };

    this.chart = new Chart(ctx, config);
    this.chart.resize();
  }

  private atualizarGrafico(): void {
    if (!this.pieChartRef?.nativeElement) {
      return;
    }

    if (!this.chart) {
      this.criarGrafico();
      return;
    }

    const { labels, dados, cores } = this.obterDadosGrafico();

    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = dados;
    this.chart.data.datasets[0].backgroundColor = cores;
    this.chart.update();
    this.chart.resize();
  }
}
