import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { BrlCurrencyDirective } from '../../../../shared/directives/brl-currency.directive';
import { BrlPipe } from '../../../../shared/pipes/brl.pipe';
import { DataHoraLocalPipe } from '../../../../shared/pipes/data-hora-local.pipe';
import {
  LancamentoPersistido,
  TipoLancamento,
} from '../../domain/planilha.model';

export interface EdicaoAtiva {
  tipo: TipoLancamento;
  id: number;
}

export interface CategoriaLancamentoConfig {
  tipo: TipoLancamento;
  titulo: string;
  rotulo: string;
  acaoAdicionar: string;
  placeholderDescricao: string;
  mensagemVazia: string;
  rotuloTotal: string;
  acaoLimpar: string;
}

export interface NovoLancamento {
  descricao: string;
  valor: number;
}

@Component({
  selector: 'app-lancamento-categoria',
  imports: [
    FormsModule,
    NgClass,
    NgFor,
    NgIf,
    BrlCurrencyDirective,
    BrlPipe,
    DataHoraLocalPipe,
  ],
  templateUrl: './lancamento-categoria.component.html',
  styleUrls: [
    './lancamento-categoria.component.css',
    './lancamento-categoria.responsive.css',
  ],
})
export class LancamentoCategoriaComponent implements OnChanges {
  @Input({ required: true }) categoria!: CategoriaLancamentoConfig;
  @Input() lancamentos: LancamentoPersistido[] = [];
  @Input() total = 0;
  @Input() resetarFormulario = 0;
  @Input() edicaoAtiva: EdicaoAtiva | null = null;
  @Input() editDescricao = '';
  @Input() editValor = 0;
  @Input() editDataHora = '';

  @Output() adicionar = new EventEmitter<NovoLancamento>();
  @Output() iniciarEdicao = new EventEmitter<LancamentoPersistido>();
  @Output() salvarEdicao = new EventEmitter<TipoLancamento>();
  @Output() cancelarEdicao = new EventEmitter<void>();
  @Output() remover = new EventEmitter<number>();
  @Output() limpar = new EventEmitter<void>();
  @Output() editDescricaoChange = new EventEmitter<string>();
  @Output() editValorChange = new EventEmitter<number>();
  @Output() editDataHoraChange = new EventEmitter<string>();

  descricaoNova = '';
  valorNovo = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['resetarFormulario'] && !changes['resetarFormulario'].firstChange) {
      this.descricaoNova = '';
      this.valorNovo = 0;
    }
  }

  estaEditando(id: number): boolean {
    return this.edicaoAtiva?.tipo === this.categoria.tipo && this.edicaoAtiva.id === id;
  }

  aoAdicionar(): void {
    this.adicionar.emit({
      descricao: this.descricaoNova,
      valor: this.valorNovo,
    });
    this.descricaoNova = '';
    this.valorNovo = 0;
  }
}
