# Contexto do projeto — Planilha Interativa

> **Para agentes de IA:** leia este arquivo antes de alterar o código.  
> **Obrigatório:** ao concluir qualquer feature nova ou ajuste de comportamento, atualize as seções relevantes (especialmente **Histórico de funcionalidades**, **Funcionalidades atuais** e **Arquivos-chave**). Registre data (`AAAA-MM-DD`), o que mudou e quais arquivos foram tocados.

**Última atualização:** 2026-05-27

---

## Visão geral

Aplicação web **Planejador de Finanças** para registrar **entradas (ganhos)** e **saídas (gastos)**, exibir saldo e um **gráfico de pizza** por categorias. Interface em português (pt-BR), valores em Real (R$).

| Item | Valor |
|------|--------|
| Workspace | `PlanilhaInterativa/` |
| App Angular | `planilha-financeira/` |
| Framework | Angular 19 (standalone components) |
| Gráficos | Chart.js 4 (`chart.js/auto`) |
| Persistência | Nenhuma (estado só em memória; recarregar a página zera os dados) |

---

## Como executar

```bash
cd planilha-financeira
npm install
npm start          # http://localhost:4200
npm test           # testes unitários (Karma + Jasmine)
npm run build      # build de produção
```

---

## Estrutura de pastas

```
PlanilhaInterativa/
├── CONTEXTO.md                 ← este arquivo (manter atualizado)
├── planilha-financeira/
│   ├── src/
│   │   ├── app/
│   │   │   ├── app.component.ts/html/css   ← tela principal + gráfico
│   │   │   ├── app.config.ts
│   │   │   ├── directives/brl-currency.directive.ts
│   │   │   └── pipes/brl.pipe.ts
│   │   ├── main.ts
│   │   └── styles.css
│   ├── angular.json
│   └── package.json
└── .cursor/rules/              ← regras para agentes (Cursor)
```

---

## Modelo de dados

```typescript
interface Lancamento {
  id: number;        // incremental em memória (nextId)
  descricao: string;
  valor: number;     // sempre >= 0
}
```

- **entradas:** lista de ganhos  
- **saidas:** lista de gastos  
- Descrição vazia ao salvar vira `"Entrada"` ou `"Saída"`

---

## Funcionalidades atuais

### Lançamentos

- Duas colunas: entradas e saídas, com formulário (descrição + valor) e lista com botão remover (×).
- Valores monetários via diretiva `appBrlCurrency` e pipe `brl` (formato pt-BR, 2 casas decimais).
- Não aceita valores ≤ 0 ao adicionar.

### Saldo

- `saldo = totalEntradas - totalSaidas`
- Classes CSS no header:
  - `saldo-negativo`: saldo &lt; 0 (vermelho)
  - `saldo-alerta`: 0 ≤ saldo ≤ 100 (amarelo)
  - `saldo-positivo`: saldo &gt; 100 (verde)

### Gráfico de pizza (`app.component.ts`)

- Título na UI: **"Distribuição por categoria"**
- **Agrupamento:** lançamentos com o **mesmo nome** (descrição, case-insensitive) são somados em uma fatia.
- **Ganhos** (entradas): fatias em tons de **verde** (`coresGanhos`).
- **Gastos** (saídas): fatias com paleta variada (`coresGastos`).
- Ordem das fatias: categorias de ganho (A–Z, `pt-BR`), depois categorias de gasto (A–Z).
- Atualiza ao adicionar/remover lançamento; tooltip mostra `Nome: R$ valor`.
- Canvas: `#pieChart` em `app.component.html`.

---

## Arquivos-chave

| Arquivo | Responsabilidade |
|---------|------------------|
| `planilha-financeira/src/app/app.component.ts` | Estado, CRUD de lançamentos, agrupamento, Chart.js |
| `planilha-financeira/src/app/app.component.html` | Layout, formulários, listas, canvas |
| `planilha-financeira/src/app/app.component.css` | Estilos (saldo, colunas, gráfico) |
| `planilha-financeira/src/app/directives/brl-currency.directive.ts` | Máscara/input BRL |
| `planilha-financeira/src/app/pipes/brl.pipe.ts` | Exibição BRL nas listas |
| `planilha-financeira/src/app/app.component.spec.ts` | Testes (saldo, agrupamento no gráfico) |

### Métodos privados importantes (gráfico)

- `agruparPorCategoria(lancamentos, nomePadrao)` — agrupa por descrição normalizada (`toLowerCase()`).
- `obterDadosGrafico()` — monta `labels`, `dados`, `cores` para o Chart.js.
- `criarGrafico()` / `atualizarGrafico()` — ciclo de vida do gráfico.

---

## Convenções para contribuições

- Manter UI e textos em **português (Brasil)**.
- Preferir mudanças mínimas; reutilizar `agruparPorCategoria`, `brl`, `appBrlCurrency`.
- Novos comportamentos do gráfico: ajustar `obterDadosGrafico()` e testes em `app.component.spec.ts`.
- Não commitar `node_modules/`, `dist/`, `.angular/cache/`.
- Após mudanças de comportamento: **atualizar este `CONTEXTO.md`** e manter `planilha-financeira/README.md` alinhado (visão do usuário).

---

## Histórico de funcionalidades

Registre aqui cada feature ou ajuste relevante (mais recente no topo).

| Data | Tipo | Descrição | Arquivos principais |
|------|------|-----------|---------------------|
| 2026-05-27 | Docs | README alinhado com gráfico por categoria e agrupamento de ganhos/gastos | `planilha-financeira/README.md` |
| 2026-05-27 | Feature | Gráfico agrupa **gastos** por nome; cada categoria com cor distinta | `app.component.ts`, `app.component.html` |
| 2026-05-27 | Feature | Mesmo agrupamento por categoria aplicado aos **ganhos**; paleta verde para ganhos | `app.component.ts`, `app.component.spec.ts` |
| 2026-05-27 | Docs | Criação do arquivo de contexto para agentes | `CONTEXTO.md`, `.cursor/rules/atualizar-contexto.mdc` |

---

## Pendências / ideias (não implementado)

- Persistência (localStorage, API, etc.)
- Edição de lançamento existente
- Filtro por período no gráfico
- Separar gráficos de ganhos e gastos

---

## Checklist do agente (ao finalizar uma tarefa)

- [ ] Código compila e testes passam (`npm test` em `planilha-financeira/`)
- [ ] **Histórico de funcionalidades** atualizado com data e resumo
- [ ] **Funcionalidades atuais** / **Arquivos-chave** revisados se o comportamento mudou
- [ ] Campo **Última atualização** no topo deste arquivo atualizado
