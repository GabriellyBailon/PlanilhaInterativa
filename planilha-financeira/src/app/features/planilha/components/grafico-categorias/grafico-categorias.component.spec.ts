import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Chart } from 'chart.js/auto';
import { GraficoCategoriasComponent } from './grafico-categorias.component';

describe('Gráfico de categorias', () => {
  let fixture: ComponentFixture<GraficoCategoriasComponent>;

  afterEach(() => {
    fixture?.destroy();
  });

  it('cria o gráfico, atualiza os dados e o destrói ao encerrar o componente', async () => {
    const atualizar = spyOn(Chart.prototype, 'update').and.callThrough();
    const redimensionar = spyOn(Chart.prototype, 'resize').and.callThrough();
    const destruir = spyOn(Chart.prototype, 'destroy').and.callThrough();
    await TestBed.configureTestingModule({
      imports: [GraficoCategoriasComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GraficoCategoriasComponent);
    fixture.componentRef.setInput('dados', {
      labels: ['Ganho: Salário'],
      dados: [500],
      cores: ['#22c55e'],
    });
    fixture.detectChanges();
    await fixture.whenStable();

    const canvas = fixture.nativeElement.querySelector('canvas') as HTMLCanvasElement;
    const grafico = Chart.getChart(canvas);
    expect(grafico).toBeDefined();
    expect(grafico?.data.labels).toEqual(['Ganho: Salário']);
    expect(grafico?.data.datasets[0].data).toEqual([500]);
    expect(redimensionar).toHaveBeenCalled();

    const formatarRotulo = grafico?.options.plugins?.tooltip?.callbacks?.label;
    expect(formatarRotulo).toBeDefined();
    if (grafico && formatarRotulo) {
      const contextoComValor = {
        chart: grafico,
        label: 'Ganho: Salário',
        parsed: 123.45,
        raw: 123.45,
        formattedValue: '123,45',
        dataset: grafico.data.datasets[0],
        datasetIndex: 0,
        dataIndex: 0,
        element: grafico.getDatasetMeta(0).data[0],
      } as Parameters<typeof formatarRotulo>[0];
      expect(formatarRotulo.call(grafico.tooltip!, contextoComValor)).toBe(
        'Ganho: Salário: R$\u00a0123,45',
      );

      const contextoSemValor = {
        ...contextoComValor,
        label: undefined,
        parsed: null,
        raw: 'inválido',
      } as unknown as Parameters<typeof formatarRotulo>[0];
      expect(formatarRotulo.call(grafico.tooltip!, contextoSemValor)).toBe('R$\u00a00,00');
    }

    fixture.componentRef.setInput('dados', {
      labels: ['Gasto: Aluguel'],
      dados: [200],
      cores: ['#ef4444'],
    });
    fixture.detectChanges();

    expect(grafico?.data.labels).toEqual(['Gasto: Aluguel']);
    expect(grafico?.data.datasets[0].data).toEqual([200]);
    expect(atualizar).toHaveBeenCalled();

    fixture.destroy();
    expect(destruir).toHaveBeenCalled();
    expect(Chart.getChart(canvas)).toBeUndefined();
  });

  it('ignora alterações quando a referência do gráfico ainda não existe', async () => {
    await TestBed.configureTestingModule({
      imports: [GraficoCategoriasComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(GraficoCategoriasComponent);

    expect(() => fixture.componentInstance.ngOnChanges()).not.toThrow();
    expect(() => fixture.componentInstance.ngOnDestroy()).not.toThrow();
  });

  it('não cria o gráfico quando o elemento não fornece contexto de desenho', async () => {
    spyOn(HTMLCanvasElement.prototype, 'getContext').and.returnValue(null);
    await TestBed.configureTestingModule({
      imports: [GraficoCategoriasComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(GraficoCategoriasComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(Chart.getChart(fixture.nativeElement.querySelector('canvas'))).toBeUndefined();
  });

  it('não tenta criar o gráfico antes de a referência do elemento estar disponível', async () => {
    TestBed.overrideComponent(GraficoCategoriasComponent, {
      set: { template: '' },
    });
    await TestBed.configureTestingModule({
      imports: [GraficoCategoriasComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(GraficoCategoriasComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('canvas')).toBeNull();
  });
});
