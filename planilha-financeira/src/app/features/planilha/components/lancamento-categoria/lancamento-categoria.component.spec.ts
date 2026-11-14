import { SimpleChange } from '@angular/core';
import { LancamentoCategoriaComponent } from './lancamento-categoria.component';

describe('Componente de categoria de lançamentos', () => {
  let componente: LancamentoCategoriaComponent;

  beforeEach(() => {
    componente = new LancamentoCategoriaComponent();
    componente.categoria = {
      tipo: 'entrada',
      titulo: 'Ganhos',
      rotulo: 'entrada',
      acaoAdicionar: 'Adicionar ganho',
      placeholderDescricao: 'Ex.: Salário',
      mensagemVazia: 'Nenhuma entrada registrada.',
      rotuloTotal: 'Total de ganhos',
      acaoLimpar: 'Limpar todos os ganhos',
    };
  });

  it('limpa o formulário quando a versão de redefinição é alterada', () => {
    componente.descricaoNova = 'Salário';
    componente.valorNovo = 500;

    componente.ngOnChanges({
      resetarFormulario: new SimpleChange(0, 1, false),
    });

    expect(componente.descricaoNova).toBe('');
    expect(componente.valorNovo).toBe(0);
  });

  it('não redefine o formulário na primeira alteração de entrada', () => {
    componente.descricaoNova = 'Salário';
    componente.valorNovo = 500;

    componente.ngOnChanges({
      resetarFormulario: new SimpleChange(undefined, 1, true),
    });

    expect(componente.descricaoNova).toBe('Salário');
    expect(componente.valorNovo).toBe(500);
  });

  it('identifica se um lançamento da categoria atual está sendo editado', () => {
    componente.lancamentos = [
      { id: 1, descricao: 'Salário', valor: 500 },
      { id: 2, descricao: 'Freela', valor: 200 },
    ];
    componente.edicaoAtiva = { tipo: 'entrada', id: 1 };

    expect(componente.estaEditando(1)).toBeTrue();
    expect(componente.estaEditando(2)).toBeFalse();
    expect(componente.trackByLancamento(0, componente.lancamentos[1])).toBe(2);

    componente.edicaoAtiva = { tipo: 'saida', id: 1 };
    expect(componente.estaEditando(1)).toBeFalse();
    componente.edicaoAtiva = null;
    expect(componente.estaEditando(1)).toBeFalse();
  });

  it('emite os dados ao adicionar e limpa os campos', () => {
    const adicionar = jasmine.createSpy('adicionar');
    componente.adicionar.subscribe(adicionar);
    componente.descricaoNova = '  Salário  ';
    componente.valorNovo = 500;

    componente.aoAdicionar();

    expect(adicionar).toHaveBeenCalledOnceWith({
      descricao: '  Salário  ',
      valor: 500,
    });
    expect(componente.descricaoNova).toBe('');
    expect(componente.valorNovo).toBe(0);
  });
});
