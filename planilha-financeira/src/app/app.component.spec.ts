import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [AppComponent],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
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

    expect(dados.labels).toEqual(['Gasto: Aluguel', 'Gasto: Mercado']);
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

    expect(dados.labels).toEqual(['Ganho: Freela', 'Ganho: Salário']);
    expect(dados.dados).toEqual([300, 2500]);
  });

  it('should calculate percentage shares of gastos and economias over ganhos', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    app.entradas = [{ id: 1, descricao: 'Salário', valor: 5000 }];
    app.saidas = [{ id: 2, descricao: 'Aluguel', valor: 3000 }];
    app.economias = [{ id: 3, descricao: 'Reserva', valor: 2000 }];

    expect(app.fracaoGastosDosGanhos).toBe(0.6);
    expect(app.fracaoEconomiasDosGanhos).toBe(0.4);
    expect(app.formatarPercentual(0.6)).toBe('60%');
  });

  it('should return zero fractions when there are no ganhos', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    app.saidas = [{ id: 1, descricao: 'Aluguel', valor: 100 }];
    expect(app.fracaoGastosDosGanhos).toBe(0);
    expect(app.fracaoEconomiasDosGanhos).toBe(0);
  });

  it('should subtract economias from saldo like saidas', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    app.entradas = [{ id: 1, descricao: 'Salário', valor: 1000 }];
    app.saidas = [{ id: 2, descricao: 'Aluguel', valor: 300 }];
    app.economias = [{ id: 3, descricao: 'Reserva', valor: 200 }];

    expect(app.saldo).toBe(500);
  });

  it('should group economias with the same name for the chart', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    app.economias = [
      { id: 1, descricao: 'Reserva', valor: 100 },
      { id: 2, descricao: 'reserva', valor: 50 },
      { id: 3, descricao: 'Investimento', valor: 80 },
    ];

    const dados = (app as unknown as { obterDadosGrafico(): { labels: string[]; dados: number[] } })
      .obterDadosGrafico();

    expect(dados.labels).toEqual(['Economia: Investimento', 'Economia: Reserva']);
    expect(dados.dados).toEqual([80, 150]);
  });

  it('should not add entrada without description and positive value', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    app.descricaoEntrada = '';
    app.valorEntrada = 100;
    app.adicionarEntrada();
    expect(app.entradas.length).toBe(0);

    app.descricaoEntrada = 'Salário';
    app.valorEntrada = 0;
    app.adicionarEntrada();
    expect(app.entradas.length).toBe(0);

    app.valorEntrada = 500;
    app.adicionarEntrada();
    expect(app.entradas.length).toBe(1);
    expect(app.entradas[0].descricao).toBe('Salário');
    expect(app.entradas[0].criadoEm).toBeDefined();
    expect(Date.parse(app.entradas[0].criadoEm!)).not.toBeNaN();
  });

  it('should toggle and persist resumo percentuais visibility', () => {
    const fixture1 = TestBed.createComponent(AppComponent);
    const app1 = fixture1.componentInstance;
    fixture1.detectChanges();

    expect(app1.mostrarResumoPercentuais).toBe(true);
    app1.alternarResumoPercentuais();
    expect(app1.mostrarResumoPercentuais).toBe(false);

    const fixture2 = TestBed.createComponent(AppComponent);
    fixture2.detectChanges();
    expect(fixture2.componentInstance.mostrarResumoPercentuais).toBe(false);
  });

  it('should persist and restore custom page name', () => {
    const fixture1 = TestBed.createComponent(AppComponent);
    const app1 = fixture1.componentInstance;
    fixture1.detectChanges();

    app1.nomePagina = 'Maio 2026';
    app1.salvarNomePagina();

    const fixture2 = TestBed.createComponent(AppComponent);
    fixture2.detectChanges();
    expect(fixture2.componentInstance.nomePagina).toBe('Maio 2026');
    expect(fixture2.componentInstance.tituloPagina).toBe('Maio 2026');
  });

  it('should use default title when page name is empty', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.tituloPagina).toBe('Planejador de Finanças');
  });

  it('should persist lancamentos to localStorage and restore on init', () => {
    const fixture1 = TestBed.createComponent(AppComponent);
    const app1 = fixture1.componentInstance;
    fixture1.detectChanges();

    app1.valorEntrada = 150;
    app1.descricaoEntrada = 'Freela';
    app1.adicionarEntrada();

    app1.valorSaida = 50;
    app1.descricaoSaida = 'Mercado';
    app1.adicionarSaida();

    const fixture2 = TestBed.createComponent(AppComponent);
    fixture2.detectChanges();
    const app2 = fixture2.componentInstance;

    expect(app2.entradas.length).toBe(1);
    expect(app2.entradas[0].id).toBe(1);
    expect(app2.entradas[0].descricao).toBe('Freela');
    expect(app2.entradas[0].valor).toBe(150);
    expect(app2.entradas[0].criadoEm).toBe(app1.entradas[0].criadoEm);

    expect(app2.saidas.length).toBe(1);
    expect(app2.saidas[0].id).toBe(2);
    expect(app2.saidas[0].descricao).toBe('Mercado');
    expect(app2.saidas[0].valor).toBe(50);
    expect(app2.saidas[0].criadoEm).toBe(app1.saidas[0].criadoEm);
    expect(app2.saldo).toBe(100);
  });
});
