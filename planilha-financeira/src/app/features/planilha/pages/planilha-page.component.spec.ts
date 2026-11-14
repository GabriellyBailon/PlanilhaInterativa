import { TestBed } from '@angular/core/testing';
import { PlanilhaPageComponent } from './planilha-page.component';
import { obterDadosGrafico } from '../domain/planilha-calculos';
import { PlanilhaStorageService } from '../data-access/planilha-storage.service';
import { PlanilhaFacade } from '../data-access/planilha.facade';

const paletaGrafico = {
  ganhos: ['green'],
  gastos: ['red'],
  economias: ['purple'],
};

describe('Página da planilha financeira', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [PlanilhaPageComponent],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('cria a página da planilha', () => {
    const fixture = TestBed.createComponent(PlanilhaPageComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('exibe rótulos claros para importar e exportar a planilha', () => {
    const fixture = TestBed.createComponent(PlanilhaPageComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.btn-exportar').textContent).toContain(
      'Baixar planilha',
    );
    expect(fixture.nativeElement.querySelector('.btn-importar').textContent).toContain(
      'Importar planilha',
    );
    expect(fixture.nativeElement.querySelector('.info-csv').textContent).toContain(
      'planilha compatível (.csv)',
    );
  });

  it('distingue as ações de edição e remoção de cada lançamento', () => {
    const fixture = TestBed.createComponent(PlanilhaPageComponent);
    fixture.componentInstance.entradas = [
      { id: 1, descricao: 'Salário', valor: 500 },
      { id: 2, descricao: 'Salário', valor: 600 },
    ];
    fixture.detectChanges();

    const editButtons = fixture.nativeElement.querySelectorAll(
      '.coluna-entrada .editar',
    ) as NodeListOf<HTMLButtonElement>;
    const removeButtons = fixture.nativeElement.querySelectorAll(
      '.coluna-entrada .remover',
    ) as NodeListOf<HTMLButtonElement>;
    const editLabels = Array.from(editButtons, (button) =>
      button.getAttribute('aria-label'),
    );
    const removeLabels = Array.from(removeButtons, (button) =>
      button.getAttribute('aria-label'),
    );

    expect(editLabels[0]).toContain('Salário');
    expect(editLabels[0]).not.toBe(editLabels[1]);
    expect(removeLabels[0]).toContain('Salário');
    expect(removeLabels[0]).not.toBe(removeLabels[1]);
  });

  it('atualiza a lista e apresenta rótulos acessíveis durante a edição', () => {
    const fixture = TestBed.createComponent(PlanilhaPageComponent);
    const app = fixture.componentInstance;
    fixture.detectChanges();

    app.adicionarLancamento('entrada', { descricao: 'Salário', valor: 500 });
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.coluna-entrada .item-descricao').textContent,
    ).toContain('Salário');

    app.iniciarEdicao('entrada', app.entradas[0]);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('label[for="edit-desc-entrada-1"]').textContent,
    ).toContain('Descrição');
    expect(
      fixture.nativeElement.querySelector('.item-edicao[role="group"]')
        .getAttribute('aria-label'),
    ).toContain('Salário');

    app.editDescricao = 'Salário atualizado';
    app.editValor = 600;
    app.salvarEdicao('entrada');
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('.coluna-entrada .item-descricao').textContent,
    ).toContain('Salário atualizado');
  });

  it('exibe um aviso quando não é possível salvar as alterações', () => {
    const fixture = TestBed.createComponent(PlanilhaPageComponent);
    const app = fixture.componentInstance;
    spyOn(TestBed.inject(PlanilhaStorageService), 'salvar').and.returnValue(false);

    app.adicionarLancamento('entrada', { descricao: 'Salário', valor: 500 });
    fixture.detectChanges();

    expect(app.erroPersistencia).toContain('Não foi possível salvar seus dados');
    expect(fixture.nativeElement.querySelector('[role="alertdialog"]')).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('.mensagem-erro-persistencia').textContent,
    ).toContain('Baixe uma cópia');

    fixture.nativeElement.querySelector('.btn-fechar-aviso').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alertdialog"]')).toBeNull();
    expect(app.erroPersistencia).toBe('');
  });

  it('calcula o saldo a partir das entradas e saídas', () => {
    const fixture = TestBed.createComponent(PlanilhaPageComponent);
    const app = fixture.componentInstance;

    app.entradas = [{ id: 1, descricao: 'Salário', valor: 500 }];
    app.saidas = [{ id: 2, descricao: 'Aluguel', valor: 200 }];

    expect(app.saldo).toBe(300);
    expect(app.saldoClasse).toBe('saldo-positivo');
  });

  it('reutiliza os dados do gráfico até que uma alteração os invalide', () => {
    const fixture = TestBed.createComponent(PlanilhaPageComponent);
    const app = fixture.componentInstance;
    const dadosIniciais = app.dadosGrafico;

    expect(app.dadosGrafico).toBe(dadosIniciais);

    app.adicionarLancamento('entrada', { descricao: 'Salário', valor: 500 });
    const dadosAtualizados = app.dadosGrafico;

    expect(dadosAtualizados).not.toBe(dadosIniciais);
    expect(dadosAtualizados.dados).toEqual([500]);
    expect(app.dadosGrafico).toBe(dadosAtualizados);
  });

  it('agrupa saídas com a mesma descrição no gráfico', () => {
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

  it('agrupa entradas com a mesma descrição no gráfico', () => {
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

  it('calcula os percentuais de gastos e economias sobre os ganhos', () => {
    const fixture = TestBed.createComponent(PlanilhaPageComponent);
    const app = fixture.componentInstance;

    app.entradas = [{ id: 1, descricao: 'Salário', valor: 5000 }];
    app.saidas = [{ id: 2, descricao: 'Aluguel', valor: 3000 }];
    app.economias = [{ id: 3, descricao: 'Reserva', valor: 2000 }];

    expect(app.fracaoGastosDosGanhos).toBe(0.6);
    expect(app.fracaoEconomiasDosGanhos).toBe(0.4);
    expect(app.formatarPercentual(0.6)).toBe('60%');
  });

  it('retorna frações iguais a zero quando não há ganhos', () => {
    const fixture = TestBed.createComponent(PlanilhaPageComponent);
    const app = fixture.componentInstance;

    app.saidas = [{ id: 1, descricao: 'Aluguel', valor: 100 }];
    expect(app.fracaoGastosDosGanhos).toBe(0);
    expect(app.fracaoEconomiasDosGanhos).toBe(0);
  });

  it('subtrai as economias do saldo assim como as saídas', () => {
    const fixture = TestBed.createComponent(PlanilhaPageComponent);
    const app = fixture.componentInstance;

    app.entradas = [{ id: 1, descricao: 'Salário', valor: 1000 }];
    app.saidas = [{ id: 2, descricao: 'Aluguel', valor: 300 }];
    app.economias = [{ id: 3, descricao: 'Reserva', valor: 200 }];

    expect(app.saldo).toBe(500);
  });

  it('agrupa economias com a mesma descrição no gráfico', () => {
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

  it('não adiciona entradas sem descrição ou com valor não positivo', () => {
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

  it('alterna e persiste a visibilidade dos percentuais', () => {
    const fixture1 = TestBed.createComponent(PlanilhaPageComponent);
    const app1 = fixture1.componentInstance;
    fixture1.detectChanges();

    expect(app1.mostrarResumoPercentuais).toBe(true);
    app1.alternarResumoPercentuais();
    expect(app1.mostrarResumoPercentuais).toBe(false);
    app1.mostrarResumoPercentuais = true;
    expect(app1.mostrarResumoPercentuais).toBeTrue();
    app1.mostrarResumoPercentuais = false;

    const fixture2 = TestBed.createComponent(PlanilhaPageComponent);
    fixture2.detectChanges();
    expect(fixture2.componentInstance.mostrarResumoPercentuais).toBe(false);
  });

  it('persiste e restaura o nome personalizado da página', () => {
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

  it('usa o título padrão quando o nome da página está vazio', () => {
    const fixture = TestBed.createComponent(PlanilhaPageComponent);
    const app = fixture.componentInstance;
    expect(app.tituloPagina).toBe('Planejador de Finanças');
  });

  it('apaga uma categoria somente após a confirmação', () => {
    const fixture = TestBed.createComponent(PlanilhaPageComponent);
    const app = fixture.componentInstance;
    app.entradas = [{ id: 1, descricao: 'Salário', valor: 500 }];
    app.saidas = [{ id: 2, descricao: 'Mercado', valor: 50 }];
    app.economias = [{ id: 3, descricao: 'Reserva', valor: 100 }];
    app.salvarNomePagina();

    app.apagarCategoria('saida');
    fixture.detectChanges();
    expect(app.saidas.length).toBe(1);
    expect(fixture.nativeElement.querySelector('[role="alertdialog"]')).toBeTruthy();

    fixture.nativeElement.querySelector('.btn-cancelar-confirmacao').click();
    fixture.detectChanges();
    expect(app.saidas.length).toBe(1);

    app.apagarCategoria('saida');
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.btn-confirmar-confirmacao').click();
    fixture.detectChanges();
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

  it('limpa os registros e o nome da planilha somente após confirmação', () => {
    const fixture = TestBed.createComponent(PlanilhaPageComponent);
    const app = fixture.componentInstance;
    app.nomePagina = 'Meu orçamento';
    app.entradas = [{ id: 1, descricao: 'Salário', valor: 500 }];
    app.saidas = [{ id: 2, descricao: 'Mercado', valor: 50 }];
    app.economias = [{ id: 3, descricao: 'Reserva', valor: 100 }];
    app.salvarNomePagina();

    app.limparTudo();
    fixture.detectChanges();
    expect(app.nomePagina).toBe('Meu orçamento');
    expect(app.totalMovimentado).toBe(650);

    fixture.nativeElement.querySelector('.btn-cancelar-confirmacao').click();
    fixture.detectChanges();
    expect(app.nomePagina).toBe('Meu orçamento');

    app.limparTudo();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.btn-confirmar-confirmacao').click();
    fixture.detectChanges();
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

  it('atualiza um lançamento ao salvar e preserva sua data de criação', () => {
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

  it('permite alterar a data e a hora de um lançamento importado', () => {
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

  it('não salva uma edição sem descrição ou com valor zero', () => {
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

  it('cancela a edição sem alterar o lançamento', () => {
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

  it('persiste o lançamento editado no armazenamento local', () => {
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

  it('persiste os lançamentos e os restaura ao iniciar', () => {
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

  it('exporta as três categorias quando existem dados para exportação', () => {
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

  it('solicita o nome da planilha antes de exportar', () => {
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
      'Dê um nome à planilha antes de baixar a cópia.',
    );
    expect(fixture.nativeElement.querySelector('[role="alertdialog"]')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain(app.csvErro);
  });

  it('importa o CSV somente após confirmação na janela', async () => {
    const fixture = TestBed.createComponent(PlanilhaPageComponent);
    const app = fixture.componentInstance;
    app.entradas = [{ id: 1, descricao: 'Existente', valor: 100 }];
    fixture.detectChanges();

    const csv = [
      'Maio 2026;;;;;;;;;;',
      ';Entradas;;;;Saídas;;;;Economias;',
      'Descrição;Valor;Data de alteração;;Descrição;Valor;Data de alteração;;Descrição;Valor;Data de alteração',
      ';Freela;R$ 150,00;15/11/2026 09:30:45;;Supermercado;R$ 45,00;16/11/2026 18:20:10;;Reserva;R$ 50,00;17/11/2026 07:05:30',
    ].join('\n');
    const arquivo = new File([csv], 'backup.csv', { type: 'text/csv' });
    const arquivos = new DataTransfer();
    arquivos.items.add(arquivo);
    const input = fixture.nativeElement.querySelector(
      '#arquivo-csv-importacao',
    ) as HTMLInputElement;

    input.files = arquivos.files;
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alertdialog"]')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain(
      'substituirá todos os dados atuais desta planilha',
    );
    expect(app.entradas[0].descricao).toBe('Existente');

    fixture.nativeElement.querySelector('.btn-confirmar-confirmacao').click();
    fixture.detectChanges();
    await arquivo.text();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(app.entradas[0].descricao).toBe('Freela');
    expect(app.entradas[0].valor).toBe(150);
  });

  it('rejeita CSV inválido e indica a célula com erro', () => {
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
      'Não foi possível importar os dados. Confira a célula C5 e tente novamente.',
    );
  });

  it('preserva os dados atuais e os identificadores quando o CSV é inválido', () => {
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

  it('importa CSV agrupado válido e substitui os dados atuais', () => {
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

  it('gera um nome de arquivo seguro e baixa o CSV quando há dados', () => {
    const fixture = TestBed.createComponent(PlanilhaPageComponent);
    const app = fixture.componentInstance;
    app.nomePagina = 'Meu orçamento / 2026!';
    app.entradas = [{ id: 1, descricao: 'Salário', valor: 500 }];
    fixture.detectChanges();

    expect(app.nomeArquivoExportacao).toMatch(/^Meu oramento  2026_\d{2}-\d{2}-\d{4}-\d{2}-\d{2}-\d{2}\.csv$/);

    const criarUrl = spyOn(URL, 'createObjectURL').and.returnValue('blob:planilha');
    const revogarUrl = spyOn(URL, 'revokeObjectURL');
    const clicar = spyOn(HTMLAnchorElement.prototype, 'click');
    app.exportarCsv();

    expect(criarUrl).toHaveBeenCalled();
    expect(clicar).toHaveBeenCalled();
    expect(revogarUrl).toHaveBeenCalledOnceWith('blob:planilha');
    expect(app.csvErro).toBe('');
  });

  it('não baixa CSV sem dados e usa um nome padrão quando a planilha não tem nome', () => {
    const fixture = TestBed.createComponent(PlanilhaPageComponent);
    const app = fixture.componentInstance;
    fixture.detectChanges();
    const criarUrl = spyOn(URL, 'createObjectURL');

    expect(app.nomeArquivoExportacao).toMatch(/^planilha-financeira_\d{2}-\d{2}-\d{4}-\d{2}-\d{2}-\d{2}\.csv$/);
    app.nomePagina = '!!!';
    expect(app.nomeArquivoExportacao).toMatch(/^planilha-financeira_\d{2}-\d{2}-\d{4}-\d{2}-\d{2}-\d{2}\.csv$/);

    app.nomePagina = 'Sem dados';
    app.exportarCsv();
    expect(criarUrl).not.toHaveBeenCalled();
  });

  it('limpa avisos, encaminha ações do seletor e ignora arquivo ausente', () => {
    const fixture = TestBed.createComponent(PlanilhaPageComponent);
    const app = fixture.componentInstance;
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector(
      '#arquivo-csv-importacao',
    ) as HTMLInputElement;
    const clicar = spyOn(input, 'click');
    app.abrirSeletorCsv();
    expect(clicar).toHaveBeenCalled();

    spyOn(document, 'getElementById').and.returnValue(null);
    expect(() => app.abrirSeletorCsv()).not.toThrow();

    const evento = { target: { files: [], value: 'arquivo.csv' } } as unknown as Event;
    app.aoSelecionarArquivoCsv(evento);
    expect((evento.target as HTMLInputElement).value).toBe('');
    expect(app.csvErro).toBe('');

    app.csvErro = 'Erro CSV';
    fixture.debugElement.injector.get(PlanilhaFacade).erroPersistencia = 'Erro ao salvar';
    app.fecharAvisos();
    expect(app.csvErro).toBe('');
    expect(app.erroPersistencia).toBe('');
  });

  it('rejeita extensões diferentes de CSV e permite fechar o aviso', () => {
    const fixture = TestBed.createComponent(PlanilhaPageComponent);
    const app = fixture.componentInstance;
    fixture.detectChanges();
    const arquivo = new File(['conteúdo'], 'dados.txt', { type: 'text/plain' });
    const evento = { target: { files: [arquivo], value: 'dados.txt' } } as unknown as Event;

    app.aoSelecionarArquivoCsv(evento);

    expect(app.csvErro).toBe('Selecione um arquivo .csv para importar os dados.');
    expect(app.mensagemConfirmacao).toBe('');
    app.fecharAvisos();
    expect(app.csvErro).toBe('');
  });

  it('exibe o erro de leitura retornado pelo arquivo CSV', async () => {
    const fixture = TestBed.createComponent(PlanilhaPageComponent);
    const app = fixture.componentInstance;
    fixture.detectChanges();
    const arquivo = new File(['conteúdo'], 'dados.csv', { type: 'text/csv' });
    spyOn(arquivo, 'text').and.returnValue(Promise.reject(new Error('Falha ao ler arquivo')));
    const arquivos = new DataTransfer();
    arquivos.items.add(arquivo);
    const input = fixture.nativeElement.querySelector(
      '#arquivo-csv-importacao',
    ) as HTMLInputElement;
    input.files = arquivos.files;
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.btn-confirmar-confirmacao').click();

    await fixture.whenStable();
    fixture.detectChanges();

    expect(app.csvErro).toBe('Falha ao ler arquivo');
  });

  it('usa uma mensagem padrão quando a leitura do arquivo falha sem um objeto de erro', async () => {
    const fixture = TestBed.createComponent(PlanilhaPageComponent);
    const app = fixture.componentInstance;
    fixture.detectChanges();
    const arquivo = new File(['conteúdo'], 'dados.csv', { type: 'text/csv' });
    spyOn(arquivo, 'text').and.returnValue(Promise.reject('falha desconhecida'));
    const arquivos = new DataTransfer();
    arquivos.items.add(arquivo);
    const input = fixture.nativeElement.querySelector(
      '#arquivo-csv-importacao',
    ) as HTMLInputElement;
    input.files = arquivos.files;
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.btn-confirmar-confirmacao').click();

    await fixture.whenStable();
    fixture.detectChanges();

    expect(app.csvErro).toBe(
      'Não foi possível importar os dados. Confira a célula A1 e tente novamente.',
    );
  });

  it('cancela edições ao remover o lançamento correspondente ou limpar a categoria', () => {
    const fixture = TestBed.createComponent(PlanilhaPageComponent);
    const app = fixture.componentInstance;
    app.entradas = [{ id: 1, descricao: 'Salário', valor: 500 }];
    app.saidas = [{ id: 2, descricao: 'Aluguel', valor: 200 }];

    app.iniciarEdicao('entrada', app.entradas[0]);
    app.removerLancamento('entrada', 1);
    expect(app.editando).toBeNull();
    expect(app.entradas).toEqual([]);

    app.iniciarEdicao('saida', app.saidas[0]);
    app.apagarCategoria('entrada');
    app.confirmarAcao();
    expect(app.editando?.tipo).toBe('saida');

    app.apagarCategoria('saida');
    app.confirmarAcao();
    expect(app.editando).toBeNull();
    expect(app.saidas).toEqual([]);
  });

  it('cancela uma edição inválida removida antes de salvar e ignora ações incompatíveis', () => {
    const fixture = TestBed.createComponent(PlanilhaPageComponent);
    const app = fixture.componentInstance;
    const fachada = fixture.debugElement.injector.get(PlanilhaFacade);
    app.entradas = [{ id: 1, descricao: 'Salário', valor: 500 }];

    app.salvarEdicao('entrada');
    app.iniciarEdicao('entrada', app.entradas[0]);
    app.salvarEdicao('saida');
    expect(app.editando?.id).toBe(1);

    spyOn(fachada, 'salvarEdicao').and.returnValue(false);
    spyOn(fachada, 'temLancamento').and.returnValue(false);
    app.editDescricao = 'Salário';
    app.editValor = 600;
    app.salvarEdicao('entrada');
    expect(app.editando).toBeNull();
  });

  it('cancela a confirmação sem executar a ação pendente', () => {
    const fixture = TestBed.createComponent(PlanilhaPageComponent);
    const app = fixture.componentInstance;
    app.entradas = [{ id: 1, descricao: 'Salário', valor: 500 }];

    app.apagarCategoria('entrada');
    app.cancelarConfirmacao();

    expect(app.entradas.length).toBe(1);
    expect(app.mensagemConfirmacao).toBe('');
  });
});
