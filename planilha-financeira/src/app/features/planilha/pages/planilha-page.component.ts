import {
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BrlPipe } from '../../../shared/pipes/brl.pipe';
import { GraficoCategoriasComponent } from '../components/grafico-categorias/grafico-categorias.component';
import {
  CategoriaLancamentoConfig,
  EdicaoAtiva,
  LancamentoCategoriaComponent,
  NovoLancamento,
} from '../components/lancamento-categoria/lancamento-categoria.component';
import {
  calcularFracao,
  obterDadosGrafico,
  somarLancamentos,
} from '../domain/planilha-calculos';
import {
  DadosGrafico,
  LancamentoPersistido,
  PaletaGrafico,
  TipoLancamento,
} from '../domain/planilha.model';
import { PlanilhaCsvService } from '../data-access/planilha-csv.service';
import { PlanilhaStorageService } from '../data-access/planilha-storage.service';

@Component({
  selector: 'app-planilha-page',
  imports: [
    FormsModule,
    NgIf,
    NgFor,
    BrlPipe,
    GraficoCategoriasComponent,
    LancamentoCategoriaComponent,
  ],
  templateUrl: './planilha-page.component.html',
  styleUrls: [
    './styles/planilha-base.css',
    './styles/lancamentos.css',
    './styles/grafico.css',
    './styles/responsivo.css',
  ],
})
export class PlanilhaPageComponent implements OnInit {
  private readonly storage = inject(PlanilhaStorageService);
  private readonly csvService = inject(PlanilhaCsvService);

  entradas: LancamentoPersistido[] = [];
  saidas: LancamentoPersistido[] = [];
  economias: LancamentoPersistido[] = [];

  readonly categorias: CategoriaLancamentoConfig[] = [
    {
      tipo: 'entrada',
      titulo: 'Entradas (Ganhos)',
      rotulo: 'entrada',
      acaoAdicionar: 'Adicionar ganho',
      placeholderDescricao: 'Ex.: Salário',
      mensagemVazia: 'Nenhuma entrada registrada.',
      rotuloTotal: 'Total de ganhos',
      acaoLimpar: 'Limpar todas as Entradas',
    },
    {
      tipo: 'saida',
      titulo: 'Saídas (Gastos)',
      rotulo: 'saída',
      acaoAdicionar: 'Adicionar gasto',
      placeholderDescricao: 'Ex.: Aluguel',
      mensagemVazia: 'Nenhuma saída registrada.',
      rotuloTotal: 'Total de gastos',
      acaoLimpar: 'Limpar todas as Saídas',
    },
    {
      tipo: 'economia',
      titulo: 'Economias',
      rotulo: 'economia',
      acaoAdicionar: 'Adicionar economia',
      placeholderDescricao: 'Ex.: Reserva de emergência',
      mensagemVazia: 'Nenhuma economia registrada.',
      rotuloTotal: 'Total de economias',
      acaoLimpar: 'Limpar todas as Economias',
    },
  ];

  nomePagina = '';
  mostrarResumoPercentuais = true;
  versaoResetFormularios = 0;

  editando: EdicaoAtiva | null = null;
  editDescricao = '';
  editValor = 0;
  editDataHora = '';

  private nextId = 1;
  private dadosGraficoEmCache: DadosGrafico | null = null;
  csvErro = '';
  erroPersistencia = '';

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
    return somarLancamentos(this.entradas);
  }

  get totalSaidas(): number {
    return somarLancamentos(this.saidas);
  }

  get totalEconomias(): number {
    return somarLancamentos(this.economias);
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
    return calcularFracao(valor, this.totalEntradas);
  }

  formatarPercentual(fracao: number): string {
    const pct = fracao * 100;
    return `${pct.toLocaleString('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    })}%`;
  }

  ngOnInit(): void {
    this.carregarDados();
  }

  salvarNomePagina(): void {
    this.persistir();
  }

  apagarCategoria(tipo: TipoLancamento): void {
    const confirmacoes: Record<TipoLancamento, string> = {
      entrada: 'Deseja apagar todos os registros de Entradas? Esta ação não pode ser desfeita.',
      saida: 'Deseja apagar todos os registros de Saídas? Esta ação não pode ser desfeita.',
      economia: 'Deseja apagar todos os registros de Economias? Esta ação não pode ser desfeita.',
    };

    if (!window.confirm(confirmacoes[tipo])) {
      return;
    }

    this.atribuirLista(tipo, []);
    if (this.editando?.tipo === tipo) {
      this.cancelarEdicao();
    }
    this.persistir();
  }

  limparTudo(): void {
    if (!window.confirm('Deseja apagar todos os registros e o nome da planilha? Esta ação não pode ser desfeita.')) {
      return;
    }

    this.entradas = [];
    this.saidas = [];
    this.economias = [];
    this.nomePagina = '';
    this.nextId = 1;
    this.cancelarEdicao();
    this.versaoResetFormularios += 1;
    this.persistir();
  }

  exportarCsv(): void {
    if (!this.nomePagina.trim()) {
      this.csvErro = 'Para exportar o arquivo, informe um nome para a Planilha.';
      return;
    }

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
      this.mostrarErroCsv(this.csvService.formatarErro('a', 1));
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
      .catch((erro: unknown) => {
        this.mostrarErroCsv(
          erro instanceof Error
            ? erro.message
            : this.csvService.formatarErro('a', 1),
        );
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

  adicionarLancamento(tipo: TipoLancamento, novo: NovoLancamento): void {
    if (!this.podeAdicionar(novo.descricao, novo.valor)) {
      return;
    }

    this.obterLista(tipo).push(this.novoLancamento(novo.descricao, novo.valor));
    this.persistir();
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
  }

  removerLancamento(tipo: TipoLancamento, id: number): void {
    if (this.editando?.tipo === tipo && this.editando.id === id) {
      this.cancelarEdicao();
    }
    this.atribuirLista(
      tipo,
      this.obterLista(tipo).filter((item) => item.id !== id),
    );
    this.persistir();
  }

  obterLancamentos(tipo: TipoLancamento): LancamentoPersistido[] {
    return this.obterLista(tipo);
  }

  totalDaCategoria(tipo: TipoLancamento): number {
    return somarLancamentos(this.obterLista(tipo));
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

  private atribuirLista(tipo: TipoLancamento, lista: LancamentoPersistido[]): void {
    switch (tipo) {
      case 'entrada':
        this.entradas = lista;
        break;
      case 'saida':
        this.saidas = lista;
        break;
      case 'economia':
        this.economias = lista;
        break;
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
    this.dadosGraficoEmCache = null;
    const nome = this.nomePagina.trim();
    const salvo = this.storage.salvar({
      entradas: this.entradas,
      saidas: this.saidas,
      economias: this.economias,
      nextId: this.nextId,
      nomePagina: nome || undefined,
      ...(this.mostrarResumoPercentuais ? {} : { mostrarResumoPercentuais: false }),
    });
    this.erroPersistencia = salvo
      ? ''
      : 'Não foi possível salvar os dados neste navegador. Exporte um CSV para evitar perder suas alterações.';
  }

  gerarCsv(): string {
    return this.csvService.gerarCsv({
      nomePagina: this.nomePagina,
      entradas: this.entradas,
      saidas: this.saidas,
      economias: this.economias,
    });
  }

  private aceitarArquivoCsv(arquivo: File): boolean {
    return arquivo && arquivo.name.toLowerCase().endsWith('.csv');
  }

  private mostrarErroCsv(mensagem: string): void {
    this.csvErro = mensagem;
  }

  private importarCsvTexto(texto: string): void {
    const estado = this.csvService.importarCsvTexto(texto, this.nextId);
    this.entradas = estado.entradas;
    this.saidas = estado.saidas;
    this.economias = estado.economias;
    this.nomePagina = estado.nomePagina ?? '';
    this.nextId = estado.nextId;
    this.persistir();
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

  get dadosGrafico(): DadosGrafico {
    if (this.dadosGraficoEmCache === null) {
      const paleta: PaletaGrafico = {
        ganhos: this.coresGanhos,
        gastos: this.coresGastos,
        economias: this.coresEconomias,
      };
      this.dadosGraficoEmCache = obterDadosGrafico(
        this.entradas,
        this.economias ?? [],
        this.saidas,
        paleta,
      );
    }
    return this.dadosGraficoEmCache;
  }
}
