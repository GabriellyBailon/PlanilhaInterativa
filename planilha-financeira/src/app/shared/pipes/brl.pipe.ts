import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'brl',
  standalone: true,
})
export class BrlPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    const numero = typeof value === 'number' && !Number.isNaN(value) ? value : 0;
    return numero.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
}
