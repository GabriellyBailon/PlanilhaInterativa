import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { Chart, ChartConfiguration } from 'chart.js/auto';
import { BrlCurrencyDirective } from './directives/brl-currency.directive';
import { BrlPipe } from './pipes/brl.pipe';
import { PlanilhaStorageService } from './services/planilha-storage.service';

interface Lancamento {
  id: number;
  descricao: string;
  valor: number;
}

interface CategoriaGrafico {
  label: string;
  valor: number;
}

@Component({
  selector: 'app-root',
  imports: [FormsModule, NgIf, NgFor, BrlCurrencyDirective, BrlPipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('pieChart') pieChartRef!: ElementRef<HTMLCanvasElement>;

  private readonly storage = inject(PlanilhaStorageService);

  entradas: Lancamento[] = [];
  saidas: Lancamento[] = [];

  descricaoEntrada = '';
  valorEntrada = 0;
  descricaoSaida = '';
  valorSaida = 0;

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

  get totalEntradas(): number {
    return this.entradas.reduce((sum, item) => sum + item.valor, 0);
  }

  get totalSaidas(): number {
    return this.saidas.reduce((sum, item) => sum + item.valor, 0);
  }

  get saldo(): number {
    return this.totalEntradas - this.totalSaidas;
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

  ngOnInit(): void {
    this.carregarDados();
  }

  ngAfterViewInit(): void {
    this.criarGrafico();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  adicionarEntrada(): void {
    if (!this.podeAdicionar(this.valorEntrada)) {
      return;
    }

    this.entradas.push({
      id: this.nextId++,
      descricao: this.descricaoEntrada.trim() || 'Entrada',
      valor: this.asNumero(this.valorEntrada),
    });

    this.descricaoEntrada = '';
    this.valorEntrada = 0;
    this.persistir();
    this.atualizarGrafico();
  }

  adicionarSaida(): void {
    if (!this.podeAdicionar(this.valorSaida)) {
      return;
    }

    this.saidas.push({
      id: this.nextId++,
      descricao: this.descricaoSaida.trim() || 'Saída',
      valor: this.asNumero(this.valorSaida),
    });

    this.descricaoSaida = '';
    this.valorSaida = 0;
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

  private carregarDados(): void {
    const estado = this.storage.carregar();
    if (!estado) {
      return;
    }

    this.entradas = estado.entradas;
    this.saidas = estado.saidas;
    this.nextId = estado.nextId;
  }

  private persistir(): void {
    this.storage.salvar({
      entradas: this.entradas,
      saidas: this.saidas,
      nextId: this.nextId,
    });
  }

  private podeAdicionar(valor: number): boolean {
    return this.asNumero(valor) > 0;
  }

  private asNumero(valor: unknown): number {
    const numero = typeof valor === 'number' ? valor : Number(valor);
    return Number.isFinite(numero) && numero >= 0 ? numero : 0;
  }

  private agruparPorCategoria(
    lancamentos: Lancamento[],
    nomePadrao: string,
  ): CategoriaGrafico[] {
    const mapa = new Map<string, CategoriaGrafico>();

    for (const lancamento of lancamentos) {
      const nome = lancamento.descricao.trim() || nomePadrao;
      const chave = nome.toLowerCase();
      const existente = mapa.get(chave);

      if (existente) {
        existente.valor += lancamento.valor;
      } else {
        mapa.set(chave, { label: nome, valor: lancamento.valor });
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
    const ganhos = this.agruparPorCategoria(this.entradas, 'Entrada');
    const gastos = this.agruparPorCategoria(this.saidas, 'Saída');
    const fatias = [...ganhos, ...gastos];

    const coresGanhos = ganhos.map(
      (_, i) => this.coresGanhos[i % this.coresGanhos.length],
    );
    const coresGastos = gastos.map(
      (_, i) => this.coresGastos[i % this.coresGastos.length],
    );

    return {
      labels: fatias.map((f) => f.label),
      dados: fatias.map((f) => f.valor),
      cores: [...coresGanhos, ...coresGastos],
    };
  }

  private criarGrafico(): void {
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
                const valor = context.parsed ?? 0;
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
  }

  private atualizarGrafico(): void {
    if (!this.chart) {
      return;
    }

    const { labels, dados, cores } = this.obterDadosGrafico();

    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = dados;
    this.chart.data.datasets[0].backgroundColor = cores;
    this.chart.update();
  }
}
