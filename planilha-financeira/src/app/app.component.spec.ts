import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should calculate saldo from entradas and saidas', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    app.entradas = [{ id: 1, descricao: 'Salário', valor: 500 }];
    app.saidas = [{ id: 2, descricao: 'Aluguel', valor: 200 }];

    expect(app.saldo).toBe(300);
    expect(app.saldoClasse).toBe('saldo-positivo');
  });

  it('should group saidas with the same name for the chart', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    app.saidas = [
      { id: 1, descricao: 'Aluguel', valor: 100 },
      { id: 2, descricao: 'aluguel', valor: 50 },
      { id: 3, descricao: 'Mercado', valor: 80 },
    ];

    const dados = (app as unknown as { obterDadosGrafico(): { labels: string[]; dados: number[] } })
      .obterDadosGrafico();

    expect(dados.labels).toEqual(['Aluguel', 'Mercado']);
    expect(dados.dados).toEqual([150, 80]);
  });

  it('should group entradas with the same name for the chart', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    app.entradas = [
      { id: 1, descricao: 'Salário', valor: 2000 },
      { id: 2, descricao: 'salário', valor: 500 },
      { id: 3, descricao: 'Freela', valor: 300 },
    ];

    const dados = (app as unknown as { obterDadosGrafico(): { labels: string[]; dados: number[] } })
      .obterDadosGrafico();

    expect(dados.labels).toEqual(['Freela', 'Salário']);
    expect(dados.dados).toEqual([300, 2500]);
  });
});
