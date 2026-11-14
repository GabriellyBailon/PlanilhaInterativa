import {
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
  EdicaoAtiva,
  LancamentoCategoriaComponent,
  NovoLancamento,
} from '../components/lancamento-categoria/lancamento-categoria.component';
import { categoriasLancamentoConfig, paletaGraficoPadrao } from '../planilha-ui.config';
import {
  calcularFracao,
  obterDadosGrafico,
  somarLancamentos,
} from '../domain/planilha-calculos';
import {
  DadosGrafico,
  LancamentoPersistido,
  TipoLancamento,
} from '../domain/planilha.model';
import { PlanilhaCsvService } from '../data-access/planilha-csv.service';
import { PlanilhaLancamentoService } from '../data-access/planilha-lancamento.service';
import { PlanilhaStorageService } from '../data-access/planilha-storage.service';
import { PlanilhaUiService } from '../data-access/planilha-ui.service';

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
  private readonly lancamentoService = inject(PlanilhaLancamentoService);
  private readonly uiService = inject(PlanilhaUiService);

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

  entradas: LancamentoPersistido[] = [];
  saidas: LancamentoPersistido[] = [];
  economias: LancamentoPersistido[] = [];

  readonly categorias = categoriasLancamentoConfig;

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
  mensagemConfirmacao = '';
  private acaoConfirmada: (() => void) | null = null;

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

  fecharAvisos(): void {
    this.csvErro = '';
    this.erroPersistencia = '';
  }

  apagarCategoria(tipo: TipoLancamento): void {
    this.solicitarConfirmacao(this.uiService.confirmacaoCategoria(tipo), () => {
      this.atribuirLista(tipo, []);
      if (this.editando?.tipo === tipo) {
        this.cancelarEdicao();
      }
      this.persistir();
    });
  }

  limparTudo(): void {
    this.solicitarConfirmacao(this.uiService.confirmacaoLimparTudo(), () => {
      this.entradas = [];
      this.saidas = [];
      this.economias = [];
      this.nomePagina = '';
      this.nextId = 1;
      this.cancelarEdicao();
      this.versaoResetFormularios += 1;
      this.persistir();
    });
  }

  confirmarAcao(): void {
    const acao = this.acaoConfirmada;
    this.cancelarConfirmacao();
    if (acao) {
      acao();
    }
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

    this.uiService.baixarCsv(this.gerarCsv(), this.nomeArquivoExportacao);
    this.csvErro = '';
  }

  aoSelecionarArquivoCsv(event: Event): void {
    const input = event.target as HTMLInputElement;
    const arquivo = input.files?.[0];
    input.value = '';

    if (!arquivo) {
      return;
    }

    if (!this.uiService.arquivoCsvValido(arquivo)) {
      this.mostrarErroCsv('Selecione um arquivo .csv para importar os dados.');
      return;
    }

    this.solicitarConfirmacao(this.uiService.confirmacaoImportacao(), () => {
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
    });
  }

  abrirSeletorCsv(): void {
    this.uiService.abrirSeletorCsv('arquivo-csv-importacao');
  }

  alternarResumoPercentuais(): void {
    this.mostrarResumoPercentuais = !this.mostrarResumoPercentuais;
    this.persistir();
  }

  adicionarLancamento(tipo: TipoLancamento, novo: NovoLancamento): void {
    if (!this.lancamentoService.validarNovoLancamento(novo.descricao, novo.valor)) {
      return;
    }

    const lista = this.obterLista(tipo);
    lista.push(
      this.lancamentoService.criarLancamento(novo.descricao, novo.valor, this.nextId),
    );
    this.nextId += 1;
    this.persistir();
  }

  iniciarEdicao(tipo: TipoLancamento, item: LancamentoPersistido): void {
    this.editando = { tipo, id: item.id };
    this.editDescricao = item.descricao;
    this.editValor = item.valor;
    this.editDataHora = this.lancamentoService.formatarDataHoraParaEdicao(item.criadoEm);
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

    if (!this.lancamentoService.validarNovoLancamento(this.editDescricao, this.editValor)) {
      return;
    }

    const criadoEm = this.lancamentoService.converterDataHoraLocalParaIso(this.editDataHora);
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
    item.valor = this.lancamentoService.asNumero(this.editValor);
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
      : 'Não foi possível salvar seus dados neste navegador. Baixe uma cópia para evitar perder suas alterações.';
  }

  gerarCsv(): string {
    return this.csvService.gerarCsv({
      nomePagina: this.nomePagina,
      entradas: this.entradas,
      saidas: this.saidas,
      economias: this.economias,
    });
  }

  private mostrarErroCsv(mensagem: string): void {
    this.csvErro = mensagem;
  }

  private solicitarConfirmacao(mensagem: string, acao: () => void): void {
    this.mensagemConfirmacao = mensagem;
    this.acaoConfirmada = acao;
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

  get dadosGrafico(): DadosGrafico {
    if (this.dadosGraficoEmCache === null) {
      this.dadosGraficoEmCache = obterDadosGrafico(
        this.entradas,
        this.economias ?? [],
        this.saidas,
        paletaGraficoPadrao,
      );
    }
    return this.dadosGraficoEmCache;
  }
}
