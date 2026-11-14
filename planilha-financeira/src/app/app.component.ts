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

type TipoLancamento = 'entrada' | 'saida' | 'economia';

interface EdicaoAtiva {
  tipo: TipoLancamento;
  id: number;
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
  mostrarResumoPercentuais = true;
  descricaoEntrada = '';
  valorEntrada = 0;
  descricaoSaida = '';
  valorSaida = 0;
  descricaoEconomia = '';
  valorEconomia = 0;

  editando: EdicaoAtiva | null = null;
  editDescricao = '';
  editValor = 0;
  editDataHora = '';

  private nextId = 1;
  private chart?: Chart;
  csvErro = '';

  private readonly cabecalhoCsv = ['Area', 'Descricao', 'Valor', 'DataAlteracao'];

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

  get temDadosParaExportar(): boolean {
    return this.totalMovimentado > 0;
  }

  get nomeArquivoExportacao(): string {
    const nomeBase = this.nomePagina.trim() || 'planilha-financeira';
    const nomeSanitizado = nomeBase.replace(/[^a-zA-Z0-9_\- ]/g, '').trim() || 'planilha-financeira';
    const agora = new Date();
    const dataHora = [
      String(agora.getDate()).padStart(2, '0'),
      String(agora.getMonth() + 1).padStart(2, '0'),
      String(agora.getFullYear()),
      String(agora.getHours()).padStart(2, '0'),
      String(agora.getMinutes()).padStart(2, '0'),
      String(agora.getSeconds()).padStart(2, '0'),
    ].join('-');
    return `${nomeSanitizado}_${dataHora}.csv`;
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

  get totalMovimentado(): number {
    return this.totalEntradas + this.totalSaidas + this.totalEconomias;
  }

  get fracaoGastosDosGanhos(): number {
    return this.fracaoDosGanhos(this.totalSaidas);
  }

  get fracaoEconomiasDosGanhos(): number {
    return this.fracaoDosGanhos(this.totalEconomias);
  }

  private fracaoDosGanhos(valor: number): number {
    const ganhos = this.totalEntradas;
    return ganhos > 0 ? valor / ganhos : 0;
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

  exportarCsv(): void {
    if (!this.temDadosParaExportar) {
      return;
    }

    const csv = this.gerarCsv();
    const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = this.nomeArquivoExportacao;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    this.csvErro = '';
  }

  aoSelecionarArquivoCsv(event: Event): void {
    const input = event.target as HTMLInputElement;
    const arquivo = input.files?.[0];
    input.value = '';

    if (!arquivo) {
      return;
    }

    if (!this.aceitarArquivoCsv(arquivo)) {
      this.mostrarErroCsv(this.formatarErroCsv('a', 1));
      return;
    }

    const confirmar = window.confirm(
      'Ao importar uma planilha, os dados atuais do site serão substituídos. Deseja continuar?',
    );
    if (!confirmar) {
      return;
    }

    arquivo
      .text()
      .then((conteudo) => {
        this.importarCsvTexto(conteudo);
        this.csvErro = '';
      })
      .catch(() => {
        this.mostrarErroCsv(this.formatarErroCsv('a', 1));
      });
  }

  abrirSeletorCsv(): void {
    const input = document.getElementById('arquivo-csv-importacao') as HTMLInputElement | null;
    input?.click();
  }

  alternarResumoPercentuais(): void {
    this.mostrarResumoPercentuais = !this.mostrarResumoPercentuais;
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

  iniciarEdicao(tipo: TipoLancamento, item: LancamentoPersistido): void {
    this.editando = { tipo, id: item.id };
    this.editDescricao = item.descricao;
    this.editValor = item.valor;
    this.editDataHora = this.formatarDataHoraParaEdicao(item.criadoEm);
  }

  cancelarEdicao(): void {
    this.editando = null;
    this.editDescricao = '';
    this.editValor = 0;
    this.editDataHora = '';
  }

  estaEditando(tipo: TipoLancamento, id: number): boolean {
    return this.editando?.tipo === tipo && this.editando.id === id;
  }

  salvarEdicao(tipo: TipoLancamento): void {
    if (!this.editando || this.editando.tipo !== tipo) {
      return;
    }

    if (!this.podeAdicionar(this.editDescricao, this.editValor)) {
      return;
    }

    const criadoEm = this.converterDataHoraLocalParaIso(this.editDataHora);
    if (!criadoEm) {
      return;
    }

    const lista = this.obterLista(tipo);
    const item = lista.find((l) => l.id === this.editando!.id);
    if (!item) {
      this.cancelarEdicao();
      return;
    }

    item.descricao = this.editDescricao.trim();
    item.valor = this.asNumero(this.editValor);
    item.criadoEm = criadoEm;
    this.cancelarEdicao();
    this.persistir();
    this.atualizarGrafico();
  }

  removerEntrada(id: number): void {
    if (this.estaEditando('entrada', id)) {
      this.cancelarEdicao();
    }
    this.entradas = this.entradas.filter((item) => item.id !== id);
    this.persistir();
    this.atualizarGrafico();
  }

  removerSaida(id: number): void {
    if (this.estaEditando('saida', id)) {
      this.cancelarEdicao();
    }
    this.saidas = this.saidas.filter((item) => item.id !== id);
    this.persistir();
    this.atualizarGrafico();
  }

  removerEconomia(id: number): void {
    if (this.estaEditando('economia', id)) {
      this.cancelarEdicao();
    }
    this.economias = this.economias.filter((item) => item.id !== id);
    this.persistir();
    this.atualizarGrafico();
  }

  private obterLista(tipo: TipoLancamento): LancamentoPersistido[] {
    switch (tipo) {
      case 'entrada':
        return this.entradas;
      case 'saida':
        return this.saidas;
      case 'economia':
        return this.economias;
    }
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
    this.mostrarResumoPercentuais = estado.mostrarResumoPercentuais !== false;
  }

  private persistir(): void {
    const nome = this.nomePagina.trim();
    this.storage.salvar({
      entradas: this.entradas,
      saidas: this.saidas,
      economias: this.economias,
      nextId: this.nextId,
      nomePagina: nome || undefined,
      ...(this.mostrarResumoPercentuais ? {} : { mostrarResumoPercentuais: false }),
    });
  }

  gerarCsv(): string {
    const totalColunas = 12;
    const secaoBase = { entradas: 1, saidas: 5, economias: 9 };
    const secoes = [
      { chave: 'entradas', label: 'Entradas', items: this.entradas, base: secaoBase.entradas },
      { chave: 'saidas', label: 'Saídas', items: this.saidas, base: secaoBase.saidas },
      { chave: 'economias', label: 'Economias', items: this.economias, base: secaoBase.economias },
    ] as const;

    const linhas: string[][] = [
      [
        this.nomePagina.trim()
          ? `="${this.nomePagina.trim().replace(/"/g, '""')}"`
          : '',
        ...Array(totalColunas - 1).fill(''),
      ],
      ['', 'Entradas', '', '', '', 'Saídas', '', '', '', 'Economias', '', ''],
      [
        '',
        'Descrição',
        'Valor',
        'Data de alteração',
        '',
        'Descrição',
        'Valor',
        'Data de alteração',
        '',
        'Descrição',
        'Valor',
        'Data de alteração',
      ],
    ];

    const maiorQuantidade = Math.max(...secoes.map((secao) => secao.items.length), 0);

    for (let indice = 0; indice < maiorQuantidade; indice++) {
      const linha = Array(totalColunas).fill('');

      secoes.forEach((secao) => {
        const item = secao.items[indice];
        if (!item) {
          return;
        }

        linha[secao.base] = item.descricao;
        linha[secao.base + 1] = this.formatarValorCsv(item.valor);
        linha[secao.base + 2] = this.formatarDataCsv(item.criadoEm ?? new Date().toISOString());
      });

      linhas.push(linha);
    }

    return linhas
      .map((linha) => linha.map((valor) => this.escaparCsv(String(valor))).join(';'))
      .join('\n');
  }

  private aceitarArquivoCsv(arquivo: File): boolean {
    return arquivo && arquivo.name.toLowerCase().endsWith('.csv');
  }

  private mostrarErroCsv(mensagem: string): void {
    this.csvErro = mensagem;
  }

  private importarCsvTexto(texto: string): void {
    const linhas = this.parsearCsv(texto);
    if (linhas.length < 2) {
      throw new Error(this.formatarErroCsv('a', 1));
    }

    if (this.ehFormatoAgrupado(linhas)) {
      this.importarCsvAgrupado(linhas);
      return;
    }

    const cabecalho = linhas[0].map((valor) => this.normalizarCampo(valor));
    const cabecalhoEsperado = this.cabecalhoCsv.map((valor) => this.normalizarCampo(valor));

    if (
      cabecalho.length !== cabecalhoEsperado.length ||
      cabecalho.some((valor, indice) => valor !== cabecalhoEsperado[indice])
    ) {
      throw new Error(this.formatarErroCsv('a', 1));
    }

    const entradas: LancamentoPersistido[] = [];
    const saidas: LancamentoPersistido[] = [];
    const economias: LancamentoPersistido[] = [];

    for (let indice = 1; indice < linhas.length; indice++) {
      const linha = linhas[indice];
      if (linha.length === 0 || linha.every((coluna) => this.normalizarCampo(coluna).trim() === '')) {
        continue;
      }
      if (linha.length < 4) {
        throw new Error(this.formatarErroCsv('C', indice + 1));
      }

      const [area, descricao, valor, dataAlteracao] = linha;
      const areaNormalizada = this.normalizarCampo(area).toLowerCase();
      const descricaoNormalizada = this.normalizarCampo(descricao).trim();
      const valorNumerico = this.parsearValorCsv(valor, indice + 1);
      const criadoEm = this.parsearDataAlteracao(dataAlteracao, indice + 1);

      if (!descricaoNormalizada) {
        throw new Error(this.formatarErroCsv('B', indice + 1));
      }

      const registro: LancamentoPersistido = {
        id: this.nextId++,
        descricao: descricaoNormalizada,
        valor: valorNumerico,
        criadoEm,
      };

      switch (areaNormalizada) {
        case 'entradas':
        case 'ganhos':
          entradas.push(registro);
          break;
        case 'saidas':
        case 'gastos':
          saidas.push(registro);
          break;
        case 'economias':
          economias.push(registro);
          break;
        default:
          throw new Error(this.formatarErroCsv('A', indice + 1));
      }
    }

    this.entradas = entradas;
    this.saidas = saidas;
    this.economias = economias;
    this.persistir();
    this.atualizarGrafico();
  }

  private parsearCsv(texto: string): string[][] {
    texto = texto.replace(/^\uFEFF/, '');
    const delimitador = this.determinarSeparadorCsv(texto);
    const linhas: string[][] = [];
    let linhaAtual: string[] = [];
    let valorAtual = '';
    let dentroAspas = false;

    for (let indice = 0; indice < texto.length; indice++) {
      const caractere = texto[indice];

      if (caractere === '"') {
        if (dentroAspas && texto[indice + 1] === '"') {
          valorAtual += '"';
          indice += 1;
        } else {
          dentroAspas = !dentroAspas;
        }
        continue;
      }

      if (caractere === delimitador && !dentroAspas) {
        linhaAtual.push(valorAtual);
        valorAtual = '';
        continue;
      }

      if ((caractere === '\n' || caractere === '\r') && !dentroAspas) {
        if (caractere === '\r' && texto[indice + 1] === '\n') {
          indice += 1;
        }
        linhaAtual.push(valorAtual);
        if (linhaAtual.some((coluna) => coluna.trim() !== '')) {
          linhas.push(linhaAtual);
        }
        linhaAtual = [];
        valorAtual = '';
        continue;
      }

      valorAtual += caractere;
    }

    if (valorAtual || linhaAtual.length > 0) {
      linhaAtual.push(valorAtual);
      if (linhaAtual.some((coluna) => coluna.trim() !== '')) {
        linhas.push(linhaAtual);
      }
    }

    return linhas;
  }

  private escaparCsv(valor: string): string {
    const texto = valor.replace(/"/g, '""');
    return /[";\n]/.test(texto) ? `"${texto}"` : texto;
  }

  private formatarValorCsv(valor: number): string {
    return `R$ ${valor.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  private formatarDataCsv(data: string): string {
    const valor = new Date(data);
    if (Number.isNaN(valor.getTime())) {
      return '';
    }

    const dataLocal = [
      String(valor.getDate()).padStart(2, '0'),
      String(valor.getMonth() + 1).padStart(2, '0'),
      String(valor.getFullYear()),
    ].join('/');
    const horaLocal = [
      String(valor.getHours()).padStart(2, '0'),
      String(valor.getMinutes()).padStart(2, '0'),
      String(valor.getSeconds()).padStart(2, '0'),
    ].join(':');

    return `${dataLocal} ${horaLocal}`;
  }

  private formatarDataHoraParaEdicao(data?: string): string {
    const valor = data ? new Date(data) : new Date();
    if (Number.isNaN(valor.getTime())) {
      return '';
    }

    return [
      `${String(valor.getFullYear()).padStart(4, '0')}-${String(valor.getMonth() + 1).padStart(2, '0')}-${String(valor.getDate()).padStart(2, '0')}`,
      `${String(valor.getHours()).padStart(2, '0')}:${String(valor.getMinutes()).padStart(2, '0')}:${String(valor.getSeconds()).padStart(2, '0')}`,
    ].join('T');
  }

  private converterDataHoraLocalParaIso(valor: string): string | null {
    const correspondencia = valor.match(
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/,
    );
    if (!correspondencia) {
      return null;
    }

    const [, anoTexto, mesTexto, diaTexto, horaTexto, minutoTexto, segundoTexto = '0'] = correspondencia;
    const partes = [anoTexto, mesTexto, diaTexto, horaTexto, minutoTexto, segundoTexto].map(Number);
    const data = new Date(partes[0], partes[1] - 1, partes[2], partes[3], partes[4], partes[5]);

    if (
      data.getFullYear() !== partes[0] ||
      data.getMonth() !== partes[1] - 1 ||
      data.getDate() !== partes[2] ||
      data.getHours() !== partes[3] ||
      data.getMinutes() !== partes[4] ||
      data.getSeconds() !== partes[5]
    ) {
      return null;
    }

    return data.toISOString();
  }

  private determinarSeparadorCsv(texto: string): ';' | ',' {
    const linhas = texto
      .split(/\r?\n/)
      .map((linha) => linha.trim())
      .filter((linha) => linha.length > 0);

    if (linhas.length === 0) {
      return ';';
    }

    const quantidadePontosVirgula = linhas.reduce(
      (total, linha) => total + (linha.split(';').length - 1),
      0,
    );
    const quantidadeVirgulas = linhas.reduce(
      (total, linha) => total + (linha.split(',').length - 1),
      0,
    );

    return quantidadePontosVirgula >= quantidadeVirgulas ? ';' : ',';
  }

  private ehFormatoAgrupado(linhas: string[][]): boolean {
    if (linhas.length < 3) {
      return false;
    }

    return Object.keys(this.obterIndicesSecoes(linhas[1])).length >= 3;
  }

  private importarCsvAgrupado(linhas: string[][]): void {
    const indicesSecoes = this.obterIndicesSecoes(linhas[1]);
    const entradas: LancamentoPersistido[] = [];
    const saidas: LancamentoPersistido[] = [];
    const economias: LancamentoPersistido[] = [];

    for (let indice = 3; indice < linhas.length; indice++) {
      const linha = linhas[indice];
      if (linha.every((coluna) => this.normalizarCampo(coluna).trim() === '')) {
        continue;
      }

      const dadosPorSecao = [
        { tipo: 'entradas' as const, indice: indicesSecoes['entradas'] ?? -1 },
        { tipo: 'saidas' as const, indice: indicesSecoes['saidas'] ?? -1 },
        { tipo: 'economias' as const, indice: indicesSecoes['economias'] ?? -1 },
      ];

      for (const secao of dadosPorSecao) {
        if (secao.indice < 0) {
          continue;
        }

        const descricao = this.normalizarCampo(linha[secao.indice]);
        const valor = this.normalizarCampo(linha[secao.indice + 1]);
        const data = this.normalizarCampo(linha[secao.indice + 2]);

        if (!descricao && !valor && !data) {
          continue;
        }

        if (!descricao) {
          throw new Error(this.formatarErroCsv(this.indiceParaColuna(secao.indice), indice + 1));
        }

        const registro: LancamentoPersistido = {
          id: this.nextId++,
          descricao,
          valor: this.parsearValorCsv(valor, indice + 1),
          criadoEm: this.parsearDataAlteracao(data, indice + 1),
        };

        if (secao.tipo === 'entradas') {
          entradas.push(registro);
        } else if (secao.tipo === 'saidas') {
          saidas.push(registro);
        } else {
          economias.push(registro);
        }
      }
    }

    this.entradas = entradas;
    this.saidas = saidas;
    this.economias = economias;
    this.persistir();
    this.atualizarGrafico();
  }

  private obterIndicesSecoes(linha: string[]): Record<'entradas' | 'saidas' | 'economias', number> {
    const indices: Record<'entradas' | 'saidas' | 'economias', number> = {
      entradas: -1,
      saidas: -1,
      economias: -1,
    };

    for (let indice = 0; indice < linha.length; indice++) {
      const valor = this.normalizarTextoCsv(linha[indice]);

      if (valor.includes('entradas')) {
        indices['entradas'] = indice;
      } else if (valor.includes('saidas') || valor.includes('gastos')) {
        indices['saidas'] = indice;
      } else if (valor.includes('economias')) {
        indices['economias'] = indice;
      }
    }

    return indices;
  }

  private indiceParaColuna(indice: number): string {
    let restante = indice;
    let letras = '';

    while (restante >= 0) {
      letras = String.fromCharCode(65 + (restante % 26)) + letras;
      restante = Math.floor(restante / 26) - 1;
    }

    return letras || 'a';
  }

  private normalizarTextoCsv(valor: string | undefined): string {
    return this.normalizarCampo(valor)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private normalizarCampo(valor: string | undefined): string {
    return (valor ?? '').replace(/\r/g, '').trim();
  }

  private parsearValorCsv(valor: string | undefined, linha: number): number {
    const valorNormalizado = this.normalizarCampo(valor)
      .replace(/R\$/gi, '')
      .replace(/\s+/g, '')
      .replace(/\./g, '')
      .replace(',', '.');

    if (!valorNormalizado) {
      throw new Error(this.formatarErroCsv('C', linha));
    }

    const convertido = Number(valorNormalizado);
    if (!Number.isFinite(convertido) || convertido <= 0) {
      throw new Error(this.formatarErroCsv('C', linha));
    }

    return convertido;
  }

  private parsearDataAlteracao(valor: string | undefined, linha: number): string {
    const texto = this.normalizarCampo(valor);
    const data = this.parsearDataTexto(texto);
    if (!data) {
      throw new Error(this.formatarErroCsv('D', linha));
    }
    return data.toISOString();
  }

  private parsearDataTexto(texto: string): Date | null {
    if (!texto) {
      return null;
    }

    const iso = new Date(texto);
    if (!Number.isNaN(iso.getTime())) {
      return iso;
    }

    const formatoBrasileiro = /^\d{2}\/\d{2}\/\d{4}(?:\s+\d{2}:\d{2}(:\d{2})?)?$/;
    if (!formatoBrasileiro.test(texto)) {
      return null;
    }

    const [data, horario = '00:00:00'] = texto.split(' ');
    const [dia, mes, ano] = data.split('/').map(Number);
    const [horaText, minutoText, segundoText = '00'] = horario.split(':');
    const hora = Number(horaText ?? 0);
    const minuto = Number(minutoText ?? 0);
    const segundo = Number(segundoText ?? 0);
    const dataDate = new Date(ano, mes - 1, dia, hora, minuto, segundo);
    return Number.isNaN(dataDate.getTime()) ? null : dataDate;
  }

  private formatarErroCsv(coluna: string, linha: number): string {
    return `Ops! Os dados da planilha estão em formato incorreto. Verifique a célula ${coluna.toLowerCase()}${linha}`;
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
