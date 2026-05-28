import { Injectable } from '@angular/core';

export interface LancamentoPersistido {
  id: number;
  descricao: string;
  valor: number;
  /** ISO 8601 — horário local do usuário no momento do lançamento */
  criadoEm?: string;
}

export interface EstadoPlanilha {
  entradas: LancamentoPersistido[];
  saidas: LancamentoPersistido[];
  economias: LancamentoPersistido[];
  nextId: number;
  nomePagina?: string;
}

const STORAGE_KEY = 'planilha-financeira:v1';

@Injectable({ providedIn: 'root' })
export class PlanilhaStorageService {
  carregar(): EstadoPlanilha | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    try {
      const bruto = localStorage.getItem(STORAGE_KEY);
      if (!bruto) {
        return null;
      }

      const parsed = JSON.parse(bruto) as unknown;
      return this.validarEstado(parsed);
    } catch {
      return null;
    }
  }

  salvar(estado: EstadoPlanilha): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
    } catch {
      // quota excedida ou storage indisponível — ignora sem quebrar a UI
    }
  }

  private validarEstado(dados: unknown): EstadoPlanilha | null {
    if (!dados || typeof dados !== 'object') {
      return null;
    }

    const obj = dados as Record<string, unknown>;
    const entradas = this.validarLista(obj['entradas']);
    const saidas = this.validarLista(obj['saidas']);

    if (entradas === null || saidas === null) {
      return null;
    }

    const economiasBruto = obj['economias'];
    const economias =
      economiasBruto === undefined || economiasBruto === null
        ? []
        : this.validarLista(economiasBruto);
    if (economias === null) {
      return null;
    }

    const nextIdBruto = obj['nextId'];
    let nextId =
      typeof nextIdBruto === 'number' && Number.isInteger(nextIdBruto) && nextIdBruto > 0
        ? nextIdBruto
        : 1;

    const maiorId = [...entradas, ...saidas, ...economias].reduce(
      (max, item) => Math.max(max, item.id),
      0,
    );
    if (nextId <= maiorId) {
      nextId = maiorId + 1;
    }

    const nomePagina = this.validarNomePagina(obj['nomePagina']);

    return nomePagina
      ? { entradas, saidas, economias, nextId, nomePagina }
      : { entradas, saidas, economias, nextId };
  }

  private validarNomePagina(valor: unknown): string | undefined {
    if (valor === undefined || valor === null) {
      return undefined;
    }
    if (typeof valor !== 'string') {
      return undefined;
    }
    const nome = valor.trim();
    if (!nome) {
      return undefined;
    }
    return nome.slice(0, 80);
  }

  private validarLista(valor: unknown): LancamentoPersistido[] | null {
    if (!Array.isArray(valor)) {
      return null;
    }

    const lista: LancamentoPersistido[] = [];

    for (const item of valor) {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const registro = item as Record<string, unknown>;
      const id = registro['id'];
      const descricao = registro['descricao'];
      const valorItem = registro['valor'];

      if (
        typeof id !== 'number' ||
        !Number.isInteger(id) ||
        id < 1 ||
        typeof descricao !== 'string' ||
        typeof valorItem !== 'number' ||
        !Number.isFinite(valorItem) ||
        valorItem <= 0
      ) {
        return null;
      }

      const criadoEm = this.validarCriadoEm(registro['criadoEm']);
      if (registro['criadoEm'] !== undefined && registro['criadoEm'] !== null && !criadoEm) {
        return null;
      }

      lista.push({
        id,
        descricao,
        valor: valorItem,
        ...(criadoEm ? { criadoEm } : {}),
      });
    }

    return lista;
  }

  private validarCriadoEm(valor: unknown): string | undefined {
    if (valor === undefined || valor === null) {
      return undefined;
    }
    if (typeof valor !== 'string') {
      return undefined;
    }
    const instante = Date.parse(valor);
    if (!Number.isFinite(instante)) {
      return undefined;
    }
    return valor;
  }
}
