# Aprendizados — Gráfico (Chart.js + Angular)

> Documento de consulta para agentes e desenvolvedores. Registra problemas reais encontrados no **Planejador de Finanças** e as correções que funcionaram.

**Contexto:** gráfico de pizza (`Chart.js` 4) em `app.component.ts`, canvas `#pieChart`, dados agrupados de ganhos, economias e gastos.

**Última atualização:** 2026-05-27

---

## Resumo rápido (checklist antes de mexer no gráfico)

- [ ] Destruir instância anterior com `chart?.destroy()` antes de criar outra no mesmo `<canvas>`.
- [ ] Criar o gráfico **depois** do layout (ex.: `afterNextRender`), não só em `ngAfterViewInit` se o container ainda puder ter tamanho 0.
- [ ] Chamar `chart.resize()` após `new Chart(...)` e após `chart.update()` quando o layout mudou (mais colunas, responsivo, etc.).
- [ ] Garantir **labels únicas** no array do gráfico quando o mesmo nome pode existir em tipos diferentes (ganho vs economia vs gasto).
- [ ] Em `atualizarGrafico()`, se `this.chart` não existir, chamar `criarGrafico()` em vez de retornar em silêncio.
- [ ] Validar `localStorage`: campos novos opcionais devem aceitar `undefined` **e** `null` sem invalidar o estado inteiro.
- [ ] Erro `<path> attribute d: Expected number` com trecho `tc0.2,0,0.4-0.2,0` → em geral é **extensão do navegador**, não o Chart.js (ver seção 7).

---

## 1. Canvas já em uso (`Canvas is already in use`)

### Sintoma

- Gráfico em branco após recarregar a página ou após hot reload no dev.
- Erro no console do navegador indicando que o canvas já está associado a um chart.

### Causa

O Chart.js associa uma instância ao elemento `<canvas>`. Se `new Chart(ctx, config)` roda de novo **sem** `chart.destroy()`, a segunda criação falha.

Isso aparece quando:

- `criarGrafico()` é chamado mais de uma vez no ciclo de vida do componente;
- hot reload recria o componente sem destruir o chart anterior;
- navegação/reuso de view (menos comum neste app de página única).

### Correção

```typescript
private criarGrafico(): void {
  this.chart?.destroy();
  this.chart = undefined;

  const ctx = this.pieChartRef?.nativeElement?.getContext('2d');
  if (!ctx) return;

  this.chart = new Chart(ctx, config);
}
```

Em `ngOnDestroy()`:

```typescript
this.chart?.destroy();
this.chart = undefined;
```

### Regra

**Um canvas = no máximo um Chart ativo.** Sempre destruir antes de recriar.

---

## 2. Gráfico criado antes do layout estar pronto

### Sintoma

- Canvas existe no DOM, mas o gráfico não aparece ou fica com tamanho 0.
- Ao redimensionar a janela, às vezes “volta” a funcionar.

### Causa

Com layout responsivo (ex.: grid de 3 colunas), o container `.grafico-container` pode ainda não ter largura/altura estáveis no momento de `ngAfterViewInit`. O Chart.js calcula dimensões na criação; container com tamanho 0 gera chart “invisível”.

### Correção

Usar `afterNextRender` do Angular para a primeira inicialização:

```typescript
constructor() {
  afterNextRender(() => {
    this.inicializarGrafico();
  });
}

private inicializarGrafico(): void {
  if (this.graficoInicializado || !this.pieChartRef?.nativeElement) return;
  this.graficoInicializado = true;
  this.criarGrafico();
  this.atualizarGrafico();
}
```

Chamar `this.chart.resize()` após criar e após atualizar dados:

```typescript
this.chart.update();
this.chart.resize();
```

### Regra

**Chart.js depende do tamanho real do container.** Inicializar após o primeiro paint completo; usar `resize()` quando o layout mudar.

---

## 3. Atualização silenciosa quando o chart não existe

### Sintoma

- Usuário adiciona lançamento, listas atualizam, mas o gráfico nunca aparece.
- Sem erro no console.

### Causa

`atualizarGrafico()` fazia `if (!this.chart) return;` — se a criação inicial falhou (timing, canvas, etc.), todas as atualizações seguintes eram ignoradas.

### Correção

```typescript
private atualizarGrafico(): void {
  if (!this.pieChartRef?.nativeElement) return;

  if (!this.chart) {
    this.criarGrafico();
    return;
  }

  // ... atualizar labels, data, cores
  this.chart.update();
  this.chart.resize();
}
```

### Regra

**Falha na criação não pode bloquear atualizações futuras.** Tentar recriar na primeira atualização válida.

---

## 4. Labels duplicadas entre tipos de lançamento

### Sintoma

- Legenda ou fatias inconsistentes quando a mesma descrição existe em ganhos, economias e gastos (ex.: “Reserva” nos três).
- Comportamento confuso ao clicar na legenda para ocultar fatias.

### Causa

O gráfico usa um único array `labels` para todas as fatias. Nomes iguais em tipos diferentes não são a mesma categoria financeira, mas o Chart.js trata cada índice separadamente — a legenda fica ambígua e a UX parece “quebrada”.

### Correção

Prefixar o tipo no label **apenas no gráfico** (agrupamento interno continua por nome + tipo):

| Tipo      | Prefixo no label   |
|-----------|--------------------|
| Entradas  | `Ganho: `          |
| Economias | `Economia: `       |
| Saídas    | `Gasto: `          |

Exemplo: `Ganho: Salário`, `Economia: Reserva`, `Gasto: Reserva`.

Agrupamento case-insensitive permanece **dentro** de cada tipo (`agruparPorCategoria` com lista separada por tipo).

### Regra

**Mesmo nome em tipos diferentes = labels diferentes no chart.** O prefixo desambigua sem mudar a descrição nas listas da UI.

---

## 5. `localStorage`: campo novo rejeitando todo o estado

### Sintoma

- Após adicionar campo `economias` na persistência, app abre “vazia” mesmo com dados antigos no navegador.
- Gráfico e listas sem dados restaurados.

### Causa

Validação tratava `economias: null` como lista inválida (`validarLista(null)` → `null`) e descartava **todo** o JSON, não só economias.

### Correção

Tratar `undefined` e `null` como lista vazia para campos opcionais novos:

```typescript
const economiasBruto = obj['economias'];
const economias =
  economiasBruto === undefined || economiasBruto === null
    ? []
    : this.validarLista(economiasBruto);
```

No componente, defesa extra:

```typescript
this.economias = estado.economias ?? [];
```

### Regra

**Migração de schema no `localStorage`:** campos novos devem ter default seguro; nunca invalidar `entradas`/`saidas` válidos por causa de um campo ausente ou `null`.

---

## 6. Tooltip do Chart.js 4 (pie)

### Observação

No callback de tooltip, preferir valor numérico com fallback:

```typescript
const valorBruto = context.parsed ?? context.raw;
const valor =
  typeof valorBruto === 'number' && Number.isFinite(valorBruto)
    ? valorBruto
    : 0;
```

Evita erro se `parsed` vier em formato inesperado em alguma versão/tipo de gráfico.

---

## 7. Erro de SVG no console (`<path> attribute d`) — falso positivo

> **Não é bug do app.** O Planejador de Finanças desenha o gráfico em **`<canvas>`** (Chart.js). Não há elementos `<svg>` nem `<path>` no código da aplicação.

### Sintoma

No console do Chrome/Edge aparece algo como:

```text
Error: <path> attribute d: Expected number, "…               tc0.2,0,0.4-0.2,0…".
```

O usuário pode associar o aviso ao gráfico de pizza, mas o app **não gera** esse `d`.

### Causa

Extensões do navegador (muito comuns: **tradutor automático de página**, Grammarly, overlays) injetam ícones SVG com `path` malformado. O trecho `tc0.2,0,0.4-0.2,0` indica comandos SVG colados de forma inválida (`t` + `c`), típico de script de extensão — não de Chart.js.

O mesmo padrão de mensagem já foi reportado em outros sites (ex.: extensões que usam `translateContent.js` + jQuery).

### Como confirmar

1. Abrir `http://localhost:4200` em **janela anônima** (extensões costumam ficar desativadas).
2. No DevTools → **Console**, expandir o stack trace do erro:
   - `chrome-extension://...` ou `content.js` → extensão.
   - Apenas arquivos do Angular (`app.component.ts`, etc.) → aí sim investigar dados do gráfico (valores `NaN`, container com altura 0).

### Correção (lado do usuário / ambiente)

- Desativar a extensão suspeita ou configurá-la para **não traduzir** `localhost` e o domínio de produção do app.
- Testar em outro navegador sem extensões.

**Não é necessário alterar** `app.component.ts` nem a config do Chart.js por causa desse aviso, quando o stack aponta para extensão.

### Se o erro persistir sem extensões

Aí vale revisar o gráfico (seções 1–3 deste documento): dados inválidos, canvas em uso, container sem tamanho. Erros reais do Chart.js no canvas raramente aparecem como `<path> attribute d`.

### Regra

**Antes de debugar o gráfico por esse log, olhar o stack trace.** Se for extensão, ignorar para fins de correção do app.

---

## Ordem das fatias no gráfico (comportamento esperado)

1. Categorias de **ganhos** (A–Z, `pt-BR`)
2. Categorias de **economias** (A–Z)
3. Categorias de **gastos** (A–Z)

Paleta: verde (`coresGanhos`), vibrante (`coresEconomias`), variada (`coresGastos`).

---

## Arquivos relacionados

| Arquivo | O que verificar |
|---------|-----------------|
| `planilha-financeira/src/app/app.component.ts` | `criarGrafico`, `atualizarGrafico`, `inicializarGrafico`, `obterDadosGrafico` |
| `planilha-financeira/src/app/app.component.html` | `#pieChart`, `.grafico-container` |
| `planilha-financeira/src/app/app.component.css` | altura/largura do container do gráfico |
| `planilha-financeira/src/app/services/planilha-storage.service.ts` | validação e migração de `economias` |
| `CONTEXTO.md` | visão geral do produto e histórico de mudanças |

---

## Histórico deste documento

| Data | O que foi registrado |
|------|----------------------|
| 2026-05-27 | Seção 7: erro `<path> attribute d` / `tc0.2...` — falso positivo de extensão do navegador, não do Chart.js |
| 2026-05-27 | Fixes após seção Economias: canvas em uso, `afterNextRender`, `resize`, labels prefixadas, `economias: null` no storage |
