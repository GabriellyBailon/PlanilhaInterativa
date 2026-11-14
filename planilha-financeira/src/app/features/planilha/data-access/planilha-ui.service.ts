import { Injectable } from '@angular/core';
import { TipoLancamento } from '../domain/planilha.model';

@Injectable({ providedIn: 'root' })
export class PlanilhaUiService {
  confirmacaoCategoria(tipo: TipoLancamento): string {
    const mensagens: Record<TipoLancamento, string> = {
      entrada: 'Deseja apagar todos os registros de Entradas? Esta ação não pode ser desfeita.',
      saida: 'Deseja apagar todos os registros de Saídas? Esta ação não pode ser desfeita.',
      economia: 'Deseja apagar todos os registros de Economias? Esta ação não pode ser desfeita.',
    };

    return mensagens[tipo];
  }

  confirmacaoLimparTudo(): string {
    return 'Deseja apagar todos os registros e o nome da planilha? Esta ação não pode ser desfeita.';
  }

  confirmacaoImportacao(): string {
    return 'Importar este arquivo substituirá todos os dados atuais desta planilha. Deseja continuar?';
  }

  arquivoCsvValido(arquivo: File | null | undefined): boolean {
    return !!arquivo && arquivo.name.toLowerCase().endsWith('.csv');
  }

  abrirSeletorCsv(id: string): void {
    const input = document.getElementById(id) as HTMLInputElement | null;
    input?.click();
  }

  baixarCsv(csv: string, nomeArquivo: string): void {
    const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = nomeArquivo;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }
}
