import { Injectable } from '@angular/core';
import { LancamentoPersistido } from '../domain/planilha.model';

@Injectable({ providedIn: 'root' })
export class PlanilhaLancamentoService {
  validarNovoLancamento(descricao: string, valor: number): boolean {
    return descricao.trim().length > 0 && this.asNumero(valor) > 0;
  }

  asNumero(valor: unknown): number {
    const numero = typeof valor === 'number' ? valor : Number(valor);
    return Number.isFinite(numero) && numero >= 0 ? numero : 0;
  }

  criarLancamento(descricao: string, valor: unknown, nextId: number): LancamentoPersistido {
    return {
      id: nextId,
      descricao: descricao.trim(),
      valor: this.asNumero(valor),
      criadoEm: new Date().toISOString(),
    };
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

  converterDataHoraLocalParaIso(valor: string): string | null {
    const correspondencia = valor.match(
      /^((\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?)$/,
    );
    if (!correspondencia) {
      return null;
    }

    const [, , anoTexto, mesTexto, diaTexto, horaTexto, minutoTexto, segundoTexto = '0'] =
      correspondencia;
    const partes = [anoTexto, mesTexto, diaTexto, horaTexto, minutoTexto, segundoTexto].map(
      Number,
    );
    const data = new Date(
      partes[0],
      partes[1] - 1,
      partes[2],
      partes[3],
      partes[4],
      partes[5],
    );

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
