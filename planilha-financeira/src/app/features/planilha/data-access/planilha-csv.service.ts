import { Injectable } from '@angular/core';
import {
  EstadoPlanilha,
  LancamentoPersistido,
} from '../domain/planilha.model';

type DadosPlanilhaCsv = Pick<
  EstadoPlanilha,
  'entradas' | 'saidas' | 'economias' | 'nomePagina'
>;

export type ResultadoImportacaoCsv = Pick<
  EstadoPlanilha,
  'entradas' | 'saidas' | 'economias' | 'nextId' | 'nomePagina'
>;

interface ContextoImportacao {
  nextId: number;
}

type IndicesSecoes = Record<'entradas' | 'saidas' | 'economias', number>;

@Injectable({ providedIn: 'root' })
export class PlanilhaCsvService {
  private readonly cabecalhoCsv = ['Area', 'Descricao', 'Valor', 'DataAlteracao'];

  gerarCsv(planilha: DadosPlanilhaCsv): string {
    const totalColunas = 12;
    const secoes = [
      { items: planilha.entradas, base: 1 },
      { items: planilha.saidas, base: 5 },
      { items: planilha.economias, base: 9 },
    ];

    const linhas: string[][] = [
      [
        planilha.nomePagina?.trim()
          ? `="${planilha.nomePagina.trim().replace(/"/g, '""')}"`
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
        linha[secao.base + 1] = this.formatarValor(item.valor);
        linha[secao.base + 2] = this.formatarData(item.criadoEm ?? new Date().toISOString());
      });

      linhas.push(linha);
    }

    return linhas
      .map((linha) => linha.map((valor) => this.escaparCampo(String(valor))).join(';'))
      .join('\n');
  }

  importarCsvTexto(texto: string, nextId: number): ResultadoImportacaoCsv {
    const linhas = this.parsearCsv(texto);
    if (linhas.length < 2) {
      throw new Error(this.formatarErro('a', 1));
    }

    const contexto: ContextoImportacao = { nextId };
    const formatoAgrupado = this.ehFormatoAgrupado(linhas);
    const dados = formatoAgrupado
      ? this.importarCsvAgrupado(linhas, contexto)
      : this.importarCsvPorRegistro(linhas, contexto);

    return {
      ...dados,
      nomePagina: formatoAgrupado ? this.parsearNomePagina(linhas[0][0]) : '',
      nextId: contexto.nextId,
    };
  }

  private importarCsvPorRegistro(
    linhas: string[][],
    contexto: ContextoImportacao,
  ): Omit<ResultadoImportacaoCsv, 'nextId' | 'nomePagina'> {
    const cabecalho = linhas[0].map((valor) => this.normalizarCampo(valor));
    const cabecalhoEsperado = this.cabecalhoCsv.map((valor) => this.normalizarCampo(valor));

    if (
      cabecalho.length !== cabecalhoEsperado.length ||
      cabecalho.some((valor, indice) => valor !== cabecalhoEsperado[indice])
    ) {
      throw new Error(this.formatarErro('a', 1));
    }

    const entradas: LancamentoPersistido[] = [];
    const saidas: LancamentoPersistido[] = [];
    const economias: LancamentoPersistido[] = [];

    for (let indice = 1; indice < linhas.length; indice++) {
      const linha = linhas[indice];
      if (linha.length === 0 || linha.every((coluna) => this.normalizarCampo(coluna) === '')) {
        continue;
      }
      if (linha.length < 4) {
        throw new Error(this.formatarErro('C', indice + 1));
      }

      const [area, descricao, valor, dataAlteracao] = linha;
      const areaNormalizada = this.normalizarTexto(area);
      const descricaoNormalizada = this.normalizarCampo(descricao);
      const valorNumerico = this.parsearValor(valor, indice + 1);
      const criadoEm = this.parsearDataAlteracao(dataAlteracao, indice + 1);

      if (!descricaoNormalizada) {
        throw new Error(this.formatarErro('B', indice + 1));
      }

      const registro: LancamentoPersistido = {
        id: contexto.nextId++,
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
          throw new Error(this.formatarErro('A', indice + 1));
      }
    }

    return { entradas, saidas, economias };
  }

  private importarCsvAgrupado(
    linhas: string[][],
    contexto: ContextoImportacao,
  ): Omit<ResultadoImportacaoCsv, 'nextId' | 'nomePagina'> {
    const indicesSecoes = this.obterIndicesSecoes(linhas[1]);
    const entradas: LancamentoPersistido[] = [];
    const saidas: LancamentoPersistido[] = [];
    const economias: LancamentoPersistido[] = [];

    for (let indice = 3; indice < linhas.length; indice++) {
      const linha = linhas[indice];
      if (linha.every((coluna) => this.normalizarCampo(coluna) === '')) {
        continue;
      }

      const dadosPorSecao = [
        { tipo: 'entradas' as const, indice: indicesSecoes.entradas },
        { tipo: 'saidas' as const, indice: indicesSecoes.saidas },
        { tipo: 'economias' as const, indice: indicesSecoes.economias },
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
          throw new Error(
            this.formatarErro(this.indiceParaColuna(secao.indice), indice + 1),
          );
        }

        const registro: LancamentoPersistido = {
          id: contexto.nextId++,
          descricao,
          valor: this.parsearValor(valor, indice + 1),
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

    return { entradas, saidas, economias };
  }

  private parsearCsv(texto: string): string[][] {
    texto = texto.replace(/^\uFEFF/, '');
    const delimitador = this.determinarSeparador(texto);
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

  private escaparCampo(valor: string): string {
    const texto = valor.replace(/"/g, '""');
    return /[";\n]/.test(texto) ? `"${texto}"` : texto;
  }

  private formatarValor(valor: number): string {
    return `R$ ${valor.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  private formatarData(data: string): string {
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

  private determinarSeparador(texto: string): ';' | ',' {
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

    return Object.values(this.obterIndicesSecoes(linhas[1])).every(
      (indice) => indice >= 0,
    );
  }

  private obterIndicesSecoes(linha: string[]): IndicesSecoes {
    const indices: IndicesSecoes = {
      entradas: -1,
      saidas: -1,
      economias: -1,
    };

    for (let indice = 0; indice < linha.length; indice++) {
      const valor = this.normalizarTexto(linha[indice]);

      if (valor.includes('entradas')) {
        indices.entradas = indice;
      } else if (valor.includes('saidas') || valor.includes('gastos')) {
        indices.saidas = indice;
      } else if (valor.includes('economias')) {
        indices.economias = indice;
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

  private normalizarTexto(valor: string | undefined): string {
    return this.normalizarCampo(valor)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private normalizarCampo(valor: string | undefined): string {
    return (valor ?? '').replace(/\r/g, '').trim();
  }

  private parsearNomePagina(valor: string | undefined): string {
    const nome = this.normalizarCampo(valor);
    const formula = nome.match(/^="([\s\S]*)"$/);
    return (formula ? formula[1].replace(/""/g, '"') : nome).trim();
  }

  private parsearValor(valor: string | undefined, linha: number): number {
    const valorNormalizado = this.normalizarCampo(valor)
      .replace(/R\$/gi, '')
      .replace(/\s+/g, '')
      .replace(/\./g, '')
      .replace(',', '.');

    if (!valorNormalizado) {
      throw new Error(this.formatarErro('C', linha));
    }

    const convertido = Number(valorNormalizado);
    if (!Number.isFinite(convertido) || convertido <= 0) {
      throw new Error(this.formatarErro('C', linha));
    }

    return convertido;
  }

  private parsearDataAlteracao(valor: string | undefined, linha: number): string {
    const data = this.parsearDataTexto(this.normalizarCampo(valor));
    if (!data) {
      throw new Error(this.formatarErro('D', linha));
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

  formatarErro(coluna: string, linha: number): string {
    const mensagem = `Ops! Os dados da planilha estão em formato incorreto. Verifique a célula ${coluna.toLowerCase()}${linha}`;
    return coluna.toLowerCase() === 'a' && linha === 1
      ? `${mensagem}. Confira o nome da Planilha e preencha-o caso esteja vazio.`
      : mensagem;
  }
}
