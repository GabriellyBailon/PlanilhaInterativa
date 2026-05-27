import {
  Directive,
  ElementRef,
  HostListener,
  forwardRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Directive({
  selector: '[appBrlCurrency]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BrlCurrencyDirective),
      multi: true,
    },
  ],
})
export class BrlCurrencyDirective implements ControlValueAccessor {
  private onChange: (value: number) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private readonly el: ElementRef<HTMLInputElement>) {}

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === '-' || event.key === 'Subtract') {
      event.preventDefault();
    }
  }

  @HostListener('input')
  onInput(): void {
    const input = this.el.nativeElement;
    const digits = input.value.replace(/\D/g, '');

    if (!digits) {
      input.value = '';
      this.onChange(0);
      return;
    }

    const numeric = parseInt(digits, 10) / 100;
    input.value = this.formatBrl(numeric);
    this.onChange(numeric);
  }

  @HostListener('blur')
  onBlur(): void {
    this.onTouched();
  }

  writeValue(value: number | null): void {
    const numeric = value ?? 0;
    this.el.nativeElement.value = numeric > 0 ? this.formatBrl(numeric) : '';
  }

  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.el.nativeElement.disabled = isDisabled;
  }

  private formatBrl(value: number): string {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
}
