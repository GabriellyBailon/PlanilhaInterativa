import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dataHoraLocal',
  standalone: true,
})
export class DataHoraLocalPipe implements PipeTransform {
  transform(valor: string | null | undefined): string {
    if (!valor) {
      return '';
    }

    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) {
      return '';
    }

    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
      .format(data)
      .replace(', ', ' ');
  }
}
