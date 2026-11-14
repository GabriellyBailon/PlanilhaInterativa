import {
  afterNextRender,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { Chart, ChartConfiguration } from 'chart.js/auto';
import { DadosGrafico } from '../../domain/planilha.model';

@Component({
  selector: 'app-grafico-categorias',
  templateUrl: './grafico-categorias.component.html',
  styleUrl: './grafico-categorias.component.css',
})
export class GraficoCategoriasComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) dados: DadosGrafico = {
    labels: [],
    dados: [],
    cores: [],
  };

  @ViewChild('pieChart') private pieChartRef?: ElementRef<HTMLCanvasElement>;

  private chart?: Chart;

  constructor() {
    afterNextRender(() => this.criarGrafico());
  }

  ngOnChanges(): void {
    if (!this.pieChartRef?.nativeElement) {
      return;
    }

    if (!this.chart) {
      this.criarGrafico();
      return;
    }

    this.chart.data.labels = this.dados.labels;
    this.chart.data.datasets[0].data = this.dados.dados;
    this.chart.data.datasets[0].backgroundColor = this.dados.cores;
    this.chart.update();
    this.chart.resize();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
    this.chart = undefined;
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

    const config: ChartConfiguration<'pie'> = {
      type: 'pie',
      data: {
        labels: this.dados.labels,
        datasets: [
          {
            data: this.dados.dados,
            backgroundColor: this.dados.cores,
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
}
