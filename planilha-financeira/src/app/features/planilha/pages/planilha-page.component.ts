import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BrlPipe } from '../../../shared/pipes/brl.pipe';
import { GraficoCategoriasComponent } from '../components/grafico-categorias/grafico-categorias.component';
import {
  CategoriaLancamentoConfig,
  LancamentoCategoriaComponent,
} from '../components/lancamento-categoria/lancamento-categoria.component';
import {
  DadosGrafico,
  EdicaoAtiva,
  LancamentoPersistido,
  NovoLancamento,
  TipoLancamento,
} from '../domain/planilha.model';
import { PlanilhaCsvService } from '../data-access/planilha-csv.service';
import { PlanilhaFacade } from '../data-access/planilha.facade';

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
  providers: [PlanilhaFacade],
  templateUrl: './planilha-page.component.html',
  styleUrls: [
    './styles/planilha-base.css',
    './styles/lancamentos.css',
    './styles/grafico.css',
    './styles/responsivo.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanilhaPageComponent implements OnInit {
  private readonly facade = inject(PlanilhaFacade);
  private readonly csvService = inject(PlanilhaCsvService);
  private readonly changeDetector = inject(ChangeDetectorRef);

  @ViewChild('modalAviso')
  set modalAviso(dialogo: ElementRef<HTMLDialogElement> | undefined) {
    if (dialogo && !dialogo.nativeElement.open) {
      dialogo.nativeElement.showModal();
    }
  }

  @ViewChild('modalConfirmacao')
  set modalConfirmacao(dialogo: ElementRef<HTMLDialogElement> | undefined) {
    if (dialogo && !dialogo.nativeElement.open) {
      dialogo.nativeElement.showModal();
    }
  }

  readonly categorias: CategoriaLancamentoConfig[] = [
    {
      tipo: 'entrada',
      titulo: 'Ganhos',
      rotulo: 'entrada',
      acaoAdicionar: 'Adicionar ganho',
      placeholderDescricao: 'Ex.: Salário',
      mensagemVazia: 'Nenhuma entrada registrada.',
      rotuloTotal: 'Total de ganhos',
      acaoLimpar: 'Limpar todos os ganhos',
    },
    {
      tipo: 'saida',
      titulo: 'Gastos',
      rotulo: 'saída',
      acaoAdicionar: 'Adicionar gasto',
      placeholderDescricao: 'Ex.: Aluguel',
      mensagemVazia: 'Nenhuma saída registrada.',
      rotuloTotal: 'Total de gastos',
      acaoLimpar: 'Limpar todos os gastos',
    },
    {
      tipo: 'economia',
      titulo: 'Economias',
      rotulo: 'economia',
      acaoAdicionar: 'Adicionar economia',
      placeholderDescricao: 'Ex.: Reserva de emergência',
      mensagemVazia: 'Nenhuma economia registrada.',
      rotuloTotal: 'Total de economias',
      acaoLimpar: 'Limpar todas as economias',
    },
  ];

  editando: EdicaoAtiva | null = null;
  editDescricao = '';
  editValor = 0;
  editDataHora = '';
  versaoResetFormularios = 0;
  csvErro = '';
  mensagemConfirmacao = '';
  private acaoConfirmada: (() => void) | null = null;

  get entradas(): LancamentoPersistido[] {
    return this.facade.entradas;
  }
  set entradas(value: LancamentoPersistido[]) {
    this.facade.entradas = value;
  }

  get saidas(): LancamentoPersistido[] {
    return this.facade.saidas;
  }
  set saidas(value: LancamentoPersistido[]) {
    this.facade.saidas = value;
  }

  get economias(): LancamentoPersistido[] {
    return this.facade.economias;
  }
  set economias(value: LancamentoPersistido[]) {
    this.facade.economias = value;
  }

  get nomePagina(): string {
    return this.facade.nomePagina;
  }
  set nomePagina(value: string) {
    this.facade.nomePagina = value;
  }

  get mostrarResumoPercentuais(): boolean {
    return this.facade.mostrarResumoPercentuais;
  }
  set mostrarResumoPercentuais(value: boolean) {
    this.facade.mostrarResumoPercentuais = value;
  }

  get erroPersistencia(): string {
    return this.facade.erroPersistencia;
  }

  private get nextId(): number {
    return this.facade.nextId;
  }
  private set nextId(value: number) {
    this.facade.nextId = value;
  }

  get totalEntradas(): number {
    return this.facade.totalEntradas;
  }
  get totalSaidas(): number {
    return this.facade.totalSaidas;
  }
  get totalEconomias(): number {
    return this.facade.totalEconomias;
  }
  get saldo(): number {
    return this.facade.saldo;
  }
  get tituloPagina(): string {
    return this.facade.tituloPagina;
  }
  get temDadosParaExportar(): boolean {
    return this.facade.temDadosParaExportar;
  }
  get saldoClasse(): string {
    return this.facade.saldoClasse;
  }
  get totalMovimentado(): number {
    return this.facade.totalMovimentado;
  }
  get fracaoGastosDosGanhos(): number {
    return this.facade.fracaoGastosDosGanhos;
  }
  get fracaoEconomiasDosGanhos(): number {
    return this.facade.fracaoEconomiasDosGanhos;
  }
  get dadosGrafico(): DadosGrafico {
    return this.facade.dadosGrafico;
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

  ngOnInit(): void {
    this.facade.carregarDados();
  }

  salvarNomePagina(): void {
    this.persistir();
  }

  fecharAvisos(): void {
    this.csvErro = '';
    this.facade.erroPersistencia = '';
    this.changeDetector.markForCheck();
  }

  apagarCategoria(tipo: TipoLancamento): void {
    const confirmacoes: Record<TipoLancamento, string> = {
      entrada: 'Deseja apagar todos os registros de Entradas? Esta ação não pode ser desfeita.',
      saida: 'Deseja apagar todos os registros de Saídas? Esta ação não pode ser desfeita.',
      economia: 'Deseja apagar todos os registros de Economias? Esta ação não pode ser desfeita.',
    };

    this.solicitarConfirmacao(confirmacoes[tipo], () => {
      this.facade.apagarCategoria(tipo);
      if (this.editando?.tipo === tipo) {
        this.cancelarEdicao();
      }
    });
  }

  limparTudo(): void {
    this.solicitarConfirmacao(
      'Deseja apagar todos os registros e o nome da planilha? Esta ação não pode ser desfeita.',
      () => {
        this.facade.limparTudo();
        this.cancelarEdicao();
        this.versaoResetFormularios += 1;
      },
    );
  }

  confirmarAcao(): void {
    const acao = this.acaoConfirmada;
    this.cancelarConfirmacao();
    acao?.();
  }

  cancelarConfirmacao(): void {
    this.mensagemConfirmacao = '';
    this.acaoConfirmada = null;
  }

  exportarCsv(): void {
    if (!this.nomePagina.trim()) {
      this.csvErro = 'Dê um nome à planilha antes de baixar a cópia.';
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
      this.mostrarErroCsv('Selecione um arquivo .csv para importar os dados.');
      return;
    }

    this.solicitarConfirmacao(
      'Importar este arquivo substituirá todos os dados atuais desta planilha. Deseja continuar?',
      () => {
        arquivo
          .text()
          .then((conteudo) => {
            this.importarCsvTexto(conteudo);
            this.csvErro = '';
            this.changeDetector.markForCheck();
          })
          .catch((erro: unknown) => {
            this.mostrarErroCsv(
              erro instanceof Error
                ? erro.message
                : this.csvService.formatarErro('a', 1),
            );
            this.changeDetector.markForCheck();
          });
      },
    );
  }

  abrirSeletorCsv(): void {
    const input = document.getElementById('arquivo-csv-importacao') as HTMLInputElement | null;
    input?.click();
  }

  alternarResumoPercentuais(): void {
    this.facade.alternarResumoPercentuais();
    this.changeDetector.markForCheck();
  }

  adicionarLancamento(tipo: TipoLancamento, novo: NovoLancamento): void {
    this.facade.adicionarLancamento(tipo, novo);
    this.changeDetector.markForCheck();
  }

  iniciarEdicao(tipo: TipoLancamento, item: LancamentoPersistido): void {
    this.editando = { tipo, id: item.id };
    this.editDescricao = item.descricao;
    this.editValor = item.valor;
    this.editDataHora = this.facade.formatarDataHoraParaEdicao(item.criadoEm);
    this.changeDetector.markForCheck();
  }

  cancelarEdicao(): void {
    this.editando = null;
    this.editDescricao = '';
    this.editValor = 0;
    this.editDataHora = '';
    this.changeDetector.markForCheck();
  }

  salvarEdicao(tipo: TipoLancamento): void {
    if (!this.editando || this.editando.tipo !== tipo) {
      return;
    }

    if (!this.editDescricao.trim() || !Number.isFinite(this.editValor) || this.editValor <= 0) {
      return;
    }

    if (
      this.facade.salvarEdicao(
        tipo,
        this.editando,
        this.editDescricao,
        this.editValor,
        this.editDataHora,
      )
    ) {
      this.cancelarEdicao();
    } else if (!this.facade.temLancamento(tipo, this.editando.id)) {
      this.cancelarEdicao();
    }
    this.changeDetector.markForCheck();
  }

  removerLancamento(tipo: TipoLancamento, id: number): void {
    if (this.editando?.tipo === tipo && this.editando.id === id) {
      this.cancelarEdicao();
    }
    this.facade.removerLancamento(tipo, id);
    this.changeDetector.markForCheck();
  }

  obterLancamentos(tipo: TipoLancamento): LancamentoPersistido[] {
    return this.facade.obterLancamentos(tipo);
  }

  totalDaCategoria(tipo: TipoLancamento): number {
    return this.facade.totalDaCategoria(tipo);
  }

  trackByCategoria(_index: number, categoria: CategoriaLancamentoConfig): TipoLancamento {
    return categoria.tipo;
  }

  formatarPercentual(fracao: number): string {
    return this.facade.formatarPercentual(fracao);
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
    return arquivo.name.toLowerCase().endsWith('.csv');
  }

  private mostrarErroCsv(mensagem: string): void {
    this.csvErro = mensagem;
  }

  private solicitarConfirmacao(mensagem: string, acao: () => void): void {
    this.mensagemConfirmacao = mensagem;
    this.acaoConfirmada = acao;
    this.changeDetector.markForCheck();
  }

  private importarCsvTexto(texto: string): void {
    const estado = this.csvService.importarCsvTexto(texto, this.nextId);
    this.facade.importarEstado(estado);
  }

  private persistir(): void {
    this.facade.persistir();
    this.changeDetector.markForCheck();
  }
}
