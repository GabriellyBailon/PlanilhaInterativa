import { ElementRef } from '@angular/core';
import { BrlCurrencyDirective } from './brl-currency.directive';

describe('Diretiva de entrada de valores em reais', () => {
  let campo: HTMLInputElement;
  let diretiva: BrlCurrencyDirective;

  beforeEach(() => {
    campo = document.createElement('input');
    diretiva = new BrlCurrencyDirective(new ElementRef(campo));
  });

  it('impede a digitação do sinal negativo', () => {
    const evento = jasmine.createSpyObj<KeyboardEvent>('KeyboardEvent', ['preventDefault'], {
      key: '-',
    });
    diretiva.onKeyDown(evento);
    expect(evento.preventDefault).toHaveBeenCalled();

    const outroEvento = jasmine.createSpyObj<KeyboardEvent>('KeyboardEvent', ['preventDefault'], {
      key: 'Subtract',
    });
    diretiva.onKeyDown(outroEvento);
    expect(outroEvento.preventDefault).toHaveBeenCalled();
  });

  it('converte os dígitos digitados em valor decimal e formata o campo', () => {
    const alterado = jasmine.createSpy('valor alterado');
    diretiva.registerOnChange(alterado);
    campo.value = 'R$ 1.234,56';

    diretiva.onInput();

    expect(campo.value).toBe('R$\u00a01.234,56');
    expect(alterado).toHaveBeenCalledOnceWith(1234.56);
  });

  it('emite zero e limpa o campo quando não há dígitos', () => {
    const alterado = jasmine.createSpy('valor alterado');
    diretiva.registerOnChange(alterado);
    campo.value = 'R$ ';

    diretiva.onInput();

    expect(campo.value).toBe('');
    expect(alterado).toHaveBeenCalledOnceWith(0);
  });

  it('exibe valores positivos e limpa valores nulos ou não positivos', () => {
    diretiva.writeValue(12.5);
    expect(campo.value).toBe('R$\u00a012,50');

    diretiva.writeValue(null);
    expect(campo.value).toBe('');

    diretiva.writeValue(0);
    expect(campo.value).toBe('');
  });

  it('notifica interação e altera o estado desabilitado', () => {
    const tocado = jasmine.createSpy('campo tocado');
    diretiva.registerOnTouched(tocado);

    diretiva.onBlur();
    diretiva.setDisabledState(true);
    expect(tocado).toHaveBeenCalled();
    expect(campo.disabled).toBeTrue();

    diretiva.setDisabledState(false);
    expect(campo.disabled).toBeFalse();
  });

  it('mantém o campo funcional quando o formulário ainda não registrou retornos', () => {
    campo.value = '';
    expect(() => diretiva.onInput()).not.toThrow();
    expect(() => diretiva.onBlur()).not.toThrow();
  });
});
