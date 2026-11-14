import { TestBed } from '@angular/core/testing';
import { PlanilhaPageComponent } from './planilha-page.component';
import { obterDadosGrafico } from '../domain/planilha-calculos';

const paletaGrafico = {
  ganhos: ['green'],
  gastos: ['red'],
  economias: ['purple'],
};

describe('PlanilhaPageComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [PlanilhaPageComponent],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(PlanilhaPageComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should calculate saldo from entradas and saidas', () => {
    const fixture = TestBed.createComponent(PlanilhaPageComponent);
    const app = fixture.componentInstance;

    app.entradas = [{ id: 1, descricao: 'Salário', valor: 500 }];
    app.saidas = [{ id: 2, descricao: 'Aluguel', valor: 200 }];

    expect(app.saldo).toBe(300);
    expect(app.saldoClasse).toBe('saldo-positivo');
  });

  it('should group saidas with the same name for the chart', () => {
    const fixture = TestBed.createComponent(PlanilhaPageComponent);
    const app = fixture.componentInstance;

    app.saidas = [
      { id: 1, descricao: 'Aluguel', valor: 100 },
      { id: 2, descricao: 'aluguel', valor: 50 },
      { id: 3, descricao: 'Mercado', valor: 80 },
    ];

    const dados = obterDadosGrafico(app.entradas, app.economias, app.saidas, paletaGrafico);

    expect(dados.labels).toEqual(['Gasto: Aluguel', 'Gasto: Mercado']);
    expect(dados.dados).toEqual([150, 80]);
  });

  it('should group entradas with the same name for the chart', () => {
    const fixture = TestBed.createComponent(PlanilhaPageComponent);
    const app = fixture.componentInstance;

    app.entradas = [
      { id: 1, descricao: 'Salário', valor: 2000 },
      { id: 2, descricao: 'salário', valor: 500 },
      { id: 3, descricao: 'Freela', valor: 300 },
    ];

    const dados = obterDadosGrafico(app.entradas, app.economias, app.saidas, paletaGrafico);

    expect(dados.labels).toEqual(['Ganho: Freela', 'Ganho: Salário']);
    expect(dados.dados).toEqual([300, 2500]);
  });

  it('should calculate percentage shares of gastos and economias over ganhos', () => {
    const fixture = TestBed.createComponent(PlanilhaPageComponent);
    const app = fixture.componentInstance;

    app.entradas = [{ id: 1, descricao: 'Salário', valor: 5000 }];
    app.saidas = [{ id: 2, descricao: 'Aluguel', valor: 3000 }];
    app.economias = [{ id: 3, descricao: 'Reserva', valor: 2000 }];

    expect(app.fracaoGastosDosGanhos).toBe(0.6);
    expect(app.fracaoEconomiasDosGanhos).toBe(0.4);
    expect(app.formatarPercentual(0.6)).toBe('60%');
  });

  it('should return zero fractions when there are no ganhos', () => {
    const fixture = TestBed.createComponent(PlanilhaPageComponent);
    const app = fixture.componentInstance;

    app.saidas = [{ id: 1, descricao: 'Aluguel', valor: 100 }];
    expect(app.fracaoGastosDosGanhos).toBe(0);
    expect(app.fracaoEconomiasDosGanhos).toBe(0);
  });

  it('should subtract economias from saldo like saidas', () => {
    const fixture = TestBed.createComponent(PlanilhaPageComponent);
    const app = fixture.componentInstance;

    app.entradas = [{ id: 1, descricao: 'Salário', valor: 1000 }];
    app.saidas = [{ id: 2, descricao: 'Aluguel', valor: 300 }];
    app.economias = [{ id: 3, descricao: 'Reserva', valor: 200 }];

    expect(app.saldo).toBe(500);
  });

  it('should group economias with the same name for the chart', () => {
    const fixture = TestBed.createComponent(PlanilhaPageComponent);
    const app = fixture.componentInstance;

    app.economias = [
      { id: 1, descricao: 'Reserva', valor: 100 },
      { id: 2, descricao: 'reserva', valor: 50 },
      { id: 3, descricao: 'Investimento', valor: 80 },
    ];

    const dados = obterDadosGrafico(app.entradas, app.economias, app.saidas, paletaGrafico);

    expect(dados.labels).toEqual(['Economia: Investimento', 'Economia: Reserva']);
    expect(dados.dados).toEqual([80, 150]);
  });

  it('should not add entrada without description and positive value', () => {
    const fixture = TestBed.createComponent(PlanilhaPageComponent);
    const app = fixture.componentInstance;

    app.adicionarLancamento('entrada', { descricao: '', valor: 100 });
    expect(app.entradas.length).toBe(0);

    app.adicionarLancamento('entrada', { descricao: 'Salário', valor: 0 });
    expect(app.entradas.length).toBe(0);

    app.adicionarLancamento('entrada', { descricao: 'Salário', valor: 500 });
    expect(app.entradas.length).toBe(1);
    expect(app.entradas[0].descricao).toBe('Salário');
    expect(app.entradas[0].criadoEm).toBeDefined();
    expect(Date.parse(app.entradas[0].criadoEm!)).not.toBeNaN();
  });

  it('should toggle and persist resumo percentuais visibility', () => {
    const fixture1 = TestBed.createComponent(PlanilhaPageComponent);
    const app1 = fixture1.componentInstance;
    fixture1.detectChanges();

    expect(app1.mostrarResumoPercentuais).toBe(true);
    app1.alternarResumoPercentuais();
    expect(app1.mostrarResumoPercentuais).toBe(false);

    const fixture2 = TestBed.createComponent(PlanilhaPageComponent);
    fixture2.detectChanges();
    expect(fixture2.componentInstance.mostrarResumoPercentuais).toBe(false);
  });

  it('should persist and restore custom page name', () => {
    const fixture1 = TestBed.createComponent(PlanilhaPageComponent);
    const app1 = fixture1.componentInstance;
    fixture1.detectChanges();

    app1.nomePagina = 'Maio 2026';
    app1.salvarNomePagina();

    const fixture2 = TestBed.createComponent(PlanilhaPageComponent);
    fixture2.detectChanges();
    expect(fixture2.componentInstance.nomePagina).toBe('Maio 2026');
    expect(fixture2.componentInstance.tituloPagina).toBe('Maio 2026');
  });

  it('should use default title when page name is empty', () => {
    const fixture = TestBed.createComponent(PlanilhaPageComponent);
    const app = fixture.componentInstance;
    expect(app.tituloPagina).toBe('Planejador de Finanças');
  });

  it('should only delete a category after confirmation', () => {
    const fixture = TestBed.createComponent(PlanilhaPageComponent);
    const app = fixture.componentInstance;
    app.entradas = [{ id: 1, descricao: 'Salário', valor: 500 }];
    app.saidas = [{ id: 2, descricao: 'Mercado', valor: 50 }];
    app.economias = [{ id: 3, descricao: 'Reserva', valor: 100 }];
    app.salvarNomePagina();

    spyOn(window, 'confirm').and.returnValue(false);
    app.apagarCategoria('saida');
    expect(app.saidas.length).toBe(1);

    (window.confirm as jasmine.Spy).and.returnValue(true);
    app.apagarCategoria('saida');
    expect(app.saidas).toEqual([]);
    expect(app.entradas.length).toBe(1);
    expect(app.economias.length).toBe(1);

    const reloadedFixture = TestBed.createComponent(PlanilhaPageComponent);
    reloadedFixture.detectChanges();
    const reloaded = reloadedFixture.componentInstance;
    expect(reloaded.saidas).toEqual([]);
    expect(reloaded.entradas.length).toBe(1);
    expect(reloaded.economias.length).toBe(1);
  });

  it('should clear all records and the sheet name only after confirmation', () => {
    const fixture = TestBed.createComponent(PlanilhaPageComponent);
    const app = fixture.componentInstance;
    app.nomePagina = 'Meu orçamento';
    app.entradas = [{ id: 1, descricao: 'Salário', valor: 500 }];
    app.saidas = [{ id: 2, descricao: 'Mercado', valor: 50 }];
    app.economias = [{ id: 3, descricao: 'Reserva', valor: 100 }];
    app.salvarNomePagina();

    spyOn(window, 'confirm').and.returnValue(false);
    app.limparTudo();
    expect(app.nomePagina).toBe('Meu orçamento');
    expect(app.totalMovimentado).toBe(650);

    (window.confirm as jasmine.Spy).and.returnValue(true);
    app.limparTudo();
    expect(app.entradas).toEqual([]);
    expect(app.saidas).toEqual([]);
    expect(app.economias).toEqual([]);
    expect(app.nomePagina).toBe('');
    expect(app.tituloPagina).toBe('Planejador de Finanças');
    expect(app.totalMovimentado).toBe(0);

    const reloadedFixture = TestBed.createComponent(PlanilhaPageComponent);
    reloadedFixture.detectChanges();
    const reloaded = reloadedFixture.componentInstance;
    expect(reloaded.entradas).toEqual([]);
    expect(reloaded.saidas).toEqual([]);
    expect(reloaded.economias).toEqual([]);
    expect(reloaded.nomePagina).toBe('');
  });

  it('should update lancamento on save and preserve criadoEm', () => {
    const fixture = TestBed.createComponent(PlanilhaPageComponent);
    const app = fixture.componentInstance;
    const criadoEm = '2026-05-27T10:00:00.000Z';

    app.entradas = [{ id: 1, descricao: 'Salário', valor: 500, criadoEm }];
    app.iniciarEdicao('entrada', app.entradas[0]);
    app.editDescricao = 'Salário ajustado';
    app.editValor = 600;
    app.salvarEdicao('entrada');

    expect(app.editando).toBeNull();
    expect(app.entradas[0].descricao).toBe('Salário ajustado');
    expect(app.entradas[0].valor).toBe(600);
    expect(app.entradas[0].criadoEm).toBe(criadoEm);
    expect(app.totalEntradas).toBe(600);
  });

  it('should allow changing the date and time of an imported lancamento', () => {
    const fixture = TestBed.createComponent(PlanilhaPageComponent);
    const app = fixture.componentInstance;

    app.entradas = [{
      id: 1,
      descricao: 'Salário importado',
      valor: 500,
      criadoEm: '2026-05-27T10:00:00.000Z',
    }];
    app.iniciarEdicao('entrada', app.entradas[0]);
    app.editDataHora = '2026-05-28T14:35:12';
    app.salvarEdicao('entrada');

    expect(app.entradas[0].criadoEm).toBe(
      new Date(2026, 4, 28, 14, 35, 12).toISOString(),
    );

    const reloadedFixture = TestBed.createComponent(PlanilhaPageComponent);
    reloadedFixture.detectChanges();
    expect(reloadedFixture.componentInstance.entradas[0].criadoEm).toBe(
      new Date(2026, 4, 28, 14, 35, 12).toISOString(),
    );
  });

  it('should not save edit with empty description or zero value', () => {
    const fixture = TestBed.createComponent(PlanilhaPageComponent);
    const app = fixture.componentInstance;

    app.saidas = [{ id: 1, descricao: 'Aluguel', valor: 200 }];
    app.iniciarEdicao('saida', app.saidas[0]);
    app.editDescricao = '  ';
    app.editValor = 300;
    app.salvarEdicao('saida');
    expect(app.saidas[0].descricao).toBe('Aluguel');
    expect(app.saidas[0].valor).toBe(200);

    app.editDescricao = 'Condomínio';
    app.editValor = 0;
    app.salvarEdicao('saida');
    expect(app.saidas[0].descricao).toBe('Aluguel');

    app.editValor = 250;
    app.salvarEdicao('saida');
    expect(app.saidas[0].descricao).toBe('Condomínio');
    expect(app.saidas[0].valor).toBe(250);
  });

  it('should cancel edit without changing lancamento', () => {
    const fixture = TestBed.createComponent(PlanilhaPageComponent);
    const app = fixture.componentInstance;

    app.economias = [{ id: 1, descricao: 'Reserva', valor: 100 }];
    app.iniciarEdicao('economia', app.economias[0]);
    app.editDescricao = 'Outro nome';
    app.editValor = 999;
    app.cancelarEdicao();

    expect(app.editando).toBeNull();
    expect(app.economias[0].descricao).toBe('Reserva');
    expect(app.economias[0].valor).toBe(100);
  });

  it('should persist edited lancamento to localStorage', () => {
    const fixture1 = TestBed.createComponent(PlanilhaPageComponent);
    const app1 = fixture1.componentInstance;
    fixture1.detectChanges();

    app1.adicionarLancamento('entrada', { descricao: 'Freela', valor: 100 });
    app1.iniciarEdicao('entrada', app1.entradas[0]);
    app1.editValor = 150;
    app1.salvarEdicao('entrada');

    const fixture2 = TestBed.createComponent(PlanilhaPageComponent);
    fixture2.detectChanges();
    expect(fixture2.componentInstance.entradas[0].valor).toBe(150);
  });

  it('should persist lancamentos to localStorage and restore on init', () => {
    const fixture1 = TestBed.createComponent(PlanilhaPageComponent);
    const app1 = fixture1.componentInstance;
    fixture1.detectChanges();

    app1.adicionarLancamento('entrada', { descricao: 'Freela', valor: 150 });

    app1.adicionarLancamento('saida', { descricao: 'Mercado', valor: 50 });

    const fixture2 = TestBed.createComponent(PlanilhaPageComponent);
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

  it('should export CSV with all three areas and entries only when there is data', () => {
    const fixture = TestBed.createComponent(PlanilhaPageComponent);
    const app = fixture.componentInstance;

    app.nomePagina = 'Orçamento';
    app.entradas = [{ id: 1, descricao: 'Salário', valor: 2000, criadoEm: '2026-11-14T10:00:00.000Z' }];
    app.saidas = [{ id: 2, descricao: 'Aluguel', valor: 900, criadoEm: '2026-11-14T12:30:00.000Z' }];
    app.economias = [{ id: 3, descricao: 'Poupança', valor: 300, criadoEm: '2026-11-14T15:45:00.000Z' }];

    expect(app.temDadosParaExportar).toBeTrue();

    const csv = app.gerarCsv();
    const linhasCsv = csv.split('\n');
    expect(linhasCsv[0]).toContain('"=""Orçamento"""');
    expect(linhasCsv[2]).toBe(
      ';Descrição;Valor;Data de alteração;;Descrição;Valor;Data de alteração;;Descrição;Valor;Data de alteração',
    );
    expect(linhasCsv[3]).toMatch(
      /;Salário;R\$ 2\.000,00;\d{2}\/11\/2026 \d{2}:\d{2}:\d{2};;Aluguel;R\$ 900,00;\d{2}\/11\/2026 \d{2}:\d{2}:\d{2};;Poupança;R\$ 300,00;\d{2}\/11\/2026 \d{2}:\d{2}:\d{2}/,
    );
    expect(csv).toContain('Orçamento');
    expect(csv).toContain('Entradas');
    expect(csv).toContain('Saídas');
    expect(csv).toContain('Economias');
    expect(csv).toContain('Descrição');
    expect(csv).toContain('Data de alteração');
    expect(csv).toContain('R$ 2.000,00');
    expect(csv).toContain('R$ 900,00');
    expect(csv).toContain('R$ 300,00');
    expect(linhasCsv[3]).toMatch(/;Salário;R\$ 2\.000,00;\d{2}\/11\/2026 \d{2}:\d{2}:\d{2};;Aluguel/);
    expect(csv).toContain('Salário');
    expect(csv).toContain('Aluguel');
    expect(csv).toContain('Poupança');
  });

  it('should ask for a page name when exporting without one', () => {
    const fixture = TestBed.createComponent(PlanilhaPageComponent);
    const app = fixture.componentInstance;
    app.entradas = [{ id: 1, descricao: 'Salário', valor: 2000 }];
    fixture.detectChanges();

    const botaoExportar: HTMLButtonElement =
      fixture.nativeElement.querySelector('.btn-exportar');
    expect(botaoExportar.disabled).toBeFalse();

    botaoExportar.click();
    fixture.detectChanges();

    expect(app.csvErro).toBe(
      'Para exportar o arquivo, informe um nome para a Planilha.',
    );
    expect(fixture.nativeElement.textContent).toContain(app.csvErro);
  });

  it('should reject invalid CSV content and point to the offending cell', () => {
    const fixture = TestBed.createComponent(PlanilhaPageComponent);
    const app = fixture.componentInstance;

    const csv = [
      'Maio 2026;;;;;;',
      ';Entradas;;;;Saídas;;;;Economias;',
      'Descrição;Valor;Data de alteração;;Descrição;Valor;Data de alteração;;Descrição;Valor;Data de alteração',
      ';Freela;R$ 200,00;15/10/2026;;Conta de Luz;R$ 150,00;15/10/2026;;Reserva;R$ 50,00;15/10/2026',
      ';Despesas;abc;15/10/2026;;',
    ].join('\n');

    expect(() => (app as any).importarCsvTexto(csv)).toThrowError(
      'Ops! Os dados da planilha estão em formato incorreto. Verifique a célula c5',
    );
  });

  it('should preserve current data and ids when CSV parsing fails', () => {
    const fixture = TestBed.createComponent(PlanilhaPageComponent);
    const app = fixture.componentInstance;
    app.entradas = [{ id: 8, descricao: 'Existente', valor: 100 }];
    (app as any).nextId = 9;
    const csv = [
      'Area;Descricao;Valor;DataAlteracao',
      'Entradas;Importada;R$ 200,00;15/10/2026 09:30:45',
      'Outra;Inválida;R$ 50,00;16/10/2026 10:00:00',
    ].join('\n');

    expect(() => (app as any).importarCsvTexto(csv)).toThrow();
    expect(app.entradas).toEqual([{ id: 8, descricao: 'Existente', valor: 100 }]);
    expect((app as any).nextId).toBe(9);
  });

  it('should import valid grouped CSV and replace current data', () => {
    const fixture = TestBed.createComponent(PlanilhaPageComponent);
    const app = fixture.componentInstance;

    app.nomePagina = 'Planilha anterior';
    app.entradas = [{ id: 9, descricao: 'Antigo', valor: 100, criadoEm: '2026-01-01T00:00:00.000Z' }];
    app.saidas = [{ id: 10, descricao: 'Antigo gasto', valor: 40, criadoEm: '2026-01-02T00:00:00.000Z' }];
    app.economias = [{ id: 11, descricao: 'Antiga reserva', valor: 15, criadoEm: '2026-01-03T00:00:00.000Z' }];

    const csv = [
      'Maio 2026;;;;;;;;;;',
      ';Entradas;;;;Saídas;;;;Economias;',
      'Descrição;Valor;Data de alteração;;Descrição;Valor;Data de alteração;;Descrição;Valor;Data de alteração',
      ';Freela;R$ 150,00;15/11/2026 09:30:45;;Supermercado;R$ 45,00;16/11/2026 18:20:10;;Reserva;R$ 50,00;17/11/2026 07:05:30',
    ].join('\n');

    (app as any).importarCsvTexto(csv);

    expect(app.nomePagina).toBe('Maio 2026');
    expect(app.entradas).toEqual([
      jasmine.objectContaining({
        descricao: 'Freela',
        valor: 150,
        criadoEm: new Date(2026, 10, 15, 9, 30, 45).toISOString(),
      }),
    ]);
    expect(app.saidas).toEqual([
      jasmine.objectContaining({
        descricao: 'Supermercado',
        valor: 45,
        criadoEm: new Date(2026, 10, 16, 18, 20, 10).toISOString(),
      }),
    ]);
    expect(app.economias).toEqual([
      jasmine.objectContaining({
        descricao: 'Reserva',
        valor: 50,
        criadoEm: new Date(2026, 10, 17, 7, 5, 30).toISOString(),
      }),
    ]);
  });
});
