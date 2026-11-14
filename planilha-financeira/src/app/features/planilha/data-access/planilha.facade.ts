import { Injectable, inject } from '@angular/core';
import {
  calcularFracao,
  obterDadosGrafico,
  somarLancamentos,
} from '../domain/planilha-calculos';
import {
  DadosGrafico,
  EdicaoAtiva,
  LancamentoPersistido,
  NovoLancamento,
  PaletaGrafico,
  TipoLancamento,
} from '../domain/planilha.model';
import { PlanilhaStorageService } from './planilha-storage.service';

@Injectable()
export class PlanilhaFacade {
  private readonly storage = inject(PlanilhaStorageService);

  entradas: LancamentoPersistido[] = [];
  saidas: LancamentoPersistido[] = [];
  economias: LancamentoPersistido[] = [];
  nomePagina = '';
  mostrarResumoPercentuais = true;
  erroPersistencia = '';

  nextId = 1;
  private dadosGraficoEmCache: DadosGrafico | null = null;

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
    return this.nomePagina.trim() || 'Planejador de Finanças';
  }

  get temDadosParaExportar(): boolean {
    return this.totalMovimentado > 0;
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
    return calcularFracao(this.totalSaidas, this.totalEntradas);
  }

  get fracaoEconomiasDosGanhos(): number {
    return calcularFracao(this.totalEconomias, this.totalEntradas);
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
        this.economias,
        this.saidas,
        paleta,
      );
    }
    return this.dadosGraficoEmCache;
  }

  carregarDados(): void {
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

  persistir(): void {
    this.dadosGraficoEmCache = null;
    const salvo = this.storage.salvar({
      entradas: this.entradas,
      saidas: this.saidas,
      economias: this.economias,
      nextId: this.nextId,
      nomePagina: this.nomePagina.trim() || undefined,
      ...(this.mostrarResumoPercentuais ? {} : { mostrarResumoPercentuais: false }),
    });
    this.erroPersistencia = salvo
      ? ''
      : 'Não foi possível salvar seus dados neste navegador. Baixe uma cópia para evitar perder suas alterações.';
  }

  alternarResumoPercentuais(): void {
    this.mostrarResumoPercentuais = !this.mostrarResumoPercentuais;
    this.persistir();
  }

  adicionarLancamento(tipo: TipoLancamento, novo: NovoLancamento): void {
    if (!this.podeAdicionar(novo.descricao, novo.valor)) {
      return;
    }

    this.atribuirLista(tipo, [
      ...this.obterLista(tipo),
      this.novoLancamento(novo.descricao, novo.valor),
    ]);
    this.persistir();
  }

  salvarEdicao(
    tipo: TipoLancamento,
    edicao: EdicaoAtiva | null,
    descricao: string,
    valor: number,
    dataHora: string,
  ): boolean {
    if (!edicao || edicao.tipo !== tipo || !this.podeAdicionar(descricao, valor)) {
      return false;
    }

    const criadoEm = this.converterDataHoraLocalParaIso(dataHora);
    if (!criadoEm) {
      return false;
    }

    const lista = this.obterLista(tipo);
    if (!lista.some((item) => item.id === edicao.id)) {
      return false;
    }

    this.atribuirLista(
      tipo,
      lista.map((item) =>
        item.id === edicao.id
          ? {
              ...item,
              descricao: descricao.trim(),
              valor: this.asNumero(valor),
              criadoEm,
            }
          : item,
      ),
    );
    this.persistir();
    return true;
  }

  removerLancamento(tipo: TipoLancamento, id: number): void {
    this.atribuirLista(
      tipo,
      this.obterLista(tipo).filter((item) => item.id !== id),
    );
    this.persistir();
  }

  temLancamento(tipo: TipoLancamento, id: number): boolean {
    return this.obterLista(tipo).some((item) => item.id === id);
  }

  apagarCategoria(tipo: TipoLancamento): void {
    this.atribuirLista(tipo, []);
    this.persistir();
  }

  limparTudo(): void {
    this.entradas = [];
    this.saidas = [];
    this.economias = [];
    this.nomePagina = '';
    this.nextId = 1;
    this.persistir();
  }

  importarEstado(estado: {
    entradas: LancamentoPersistido[];
    saidas: LancamentoPersistido[];
    economias: LancamentoPersistido[];
    nomePagina?: string;
    nextId: number;
  }): void {
    this.entradas = estado.entradas;
    this.saidas = estado.saidas;
    this.economias = estado.economias;
    this.nomePagina = estado.nomePagina ?? '';
    this.nextId = estado.nextId;
    this.persistir();
  }

  obterLancamentos(tipo: TipoLancamento): LancamentoPersistido[] {
    return this.obterLista(tipo);
  }

  totalDaCategoria(tipo: TipoLancamento): number {
    return somarLancamentos(this.obterLista(tipo));
  }

  formatarPercentual(fracao: number): string {
    const pct = fracao * 100;
    return `${pct.toLocaleString('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    })}%`;
  }

  formatarDataHoraParaEdicao(data?: string): string {
    const valor = data ? new Date(data) : new Date();
    if (Number.isNaN(valor.getTime())) {
      return '';
    }

    return [
      `${String(valor.getFullYear()).padStart(4, '0')}-${String(valor.getMonth() + 1).padStart(2, '0')}-${String(valor.getDate()).padStart(2, '0')}`,
      `${String(valor.getHours()).padStart(2, '0')}:${String(valor.getMinutes()).padStart(2, '0')}:${String(valor.getSeconds()).padStart(2, '0')}`,
    ].join('T');
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
}
