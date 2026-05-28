# Contexto do projeto — Planilha Interativa

> **Para agentes de IA:** leia este arquivo antes de alterar o código.  
> **Obrigatório:** ao concluir qualquer feature nova ou ajuste de comportamento, atualize as seções relevantes (especialmente **Histórico de funcionalidades**, **Funcionalidades atuais** e **Arquivos-chave**). Registre data (`AAAA-MM-DD`), o que mudou e quais arquivos foram tocados.

**Última atualização:** 2026-05-27

---

## Visão geral

Aplicação web **Planejador de Finanças** para registrar **entradas (ganhos)**, **economias** e **saídas (gastos)**, exibir saldo e um **gráfico de pizza** por categorias. Interface em português (pt-BR), valores em Real (R$).

| Item | Valor |
|------|--------|
| Workspace | `PlanilhaInterativa/` |
| App Angular | `planilha-financeira/` |
| Framework | Angular 19 (standalone components) |
| Gráficos | Chart.js 4 (`chart.js/auto`) |
| Persistência | `localStorage` (chave `planilha-financeira:v1`) via `PlanilhaStorageService` |

---

## Como executar

### Desenvolvimento local

```bash
cd planilha-financeira
npm install
npm start          # http://localhost:4200
npm test           # testes unitários (Karma + Jasmine)
npm run build      # build de produção
```

### Deploy no Netlify

**Rápido:** Veja [GUIA-DEPLOY-NETLIFY.md](GUIA-DEPLOY-NETLIFY.md) para instruções completas.

```bash
# Opção 1: Deploy via Git (push automático)
# Push para main → Netlify faz build e deploy automaticamente

# Opção 2: Deploy manual
cd planilha-financeira
npm run build
# Arrastar dist/planilha-financeira para Netlify ou usar CLI
netlify deploy --prod --dir=dist/planilha-financeira
```

---

## Estrutura de pastas

```
PlanilhaInterativa/
├── CONTEXTO.md                      ← este arquivo (manter atualizado)
├── GUIA-DEPLOY-NETLIFY.md          ← instruções para publicação
├── docs/
│   └── aprendizados-grafico-chartjs.md  ← fixes e armadilhas Chart.js + Angular
├── planilha-financeira/
│   ├── netlify.toml                 ← configuração de build e headers
│   ├── .netlifyignore               ← arquivos a ignorar no deploy
│   ├── _redirects                   ← redireciona 404 para SPA
│   ├── src/
│   │   ├── app/
│   │   │   ├── app.component.ts/html/css   ← tela principal + gráfico
│   │   │   ├── app.config.ts
│   │   │   ├── directives/brl-currency.directive.ts
│   │   │   ├── pipes/brl.pipe.ts
│   │   │   └── services/planilha-storage.service.ts
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
  valor: number;     // sempre > 0 ao adicionar
  criadoEm?: string; // ISO 8601 — horário local no momento do lançamento (opcional em dados antigos)
}

interface EstadoPlanilha {
  entradas: Lancamento[];
  saidas: Lancamento[];
  economias: Lancamento[];
  nextId: number;
  nomePagina?: string;  // opcional, até 80 caracteres (ex.: "Maio 2026")
  mostrarResumoPercentuais?: boolean;  // false = usuário ocultou o resumo percentual
}
```

- **entradas:** lista de ganhos  
- **economias:** lista de valores guardados (descontam do saldo como gastos)  
- **saidas:** lista de gastos  
- **nomePagina:** título personalizado da planilha; vazio exibe **"Planejador de Finanças"**

---

## Funcionalidades atuais

### Cabeçalho

- Campo **Nome da planilha** no topo (ex.: `Maio 2026`); salvo em `localStorage` ao sair do campo (`blur`). Placeholder padrão: **Planejador de Finanças**.

### Lançamentos

- Três colunas: entradas, economias e saídas, cada uma com formulário (descrição + valor) e lista com botões **editar** (✎) e **remover** (×).
- **Edição inline:** ao clicar em editar, descrição e valor viram campos editáveis (mesma validação do formulário: descrição não vazia, valor &gt; 0); **Salvar** persiste e atualiza gráfico/saldo; **Cancelar** descarta. Apenas um lançamento em edição por vez. `criadoEm` não é alterado na edição.
- Cada lançamento na lista exibe **data e hora locais** ao lado do valor (ex.: `27/05/2026 20:56`), gravadas em `criadoEm` (ISO) ao adicionar. Lançamentos antigos sem data não mostram horário.
- **Descrição e valor obrigatórios** (`required` no HTML + validação no componente); botão desabilitado se descrição vazia ou valor ≤ 0.
- Valores monetários via diretiva `appBrlCurrency` e pipe `brl` (formato pt-BR, 2 casas decimais).
- **Persistência local:** ao adicionar ou remover, o estado (`entradas`, `economias`, `saídas`, `nextId`) é salvo em `localStorage`. Ao abrir a página, os dados são restaurados automaticamente. JSON inválido ou corrompido é ignorado (começa vazio). Dados antigos sem `economias` carregam com lista vazia.

### Saldo

- `saldo = totalEntradas - totalSaidas - totalEconomias`
- Classes CSS no header:
  - `saldo-negativo`: saldo &lt; 0 (vermelho)
  - `saldo-alerta`: 0 ≤ saldo ≤ 100 (amarelo)
  - `saldo-positivo`: saldo &gt; 100 (verde)

### Resumo percentual (ao lado do gráfico)

- Seção **"Em relação aos ganhos"** na mesma área do gráfico, **sem alterar** o Chart.js.
- Botão **Mostrar percentuais** / **Ocultar percentuais** no cabeçalho da seção do gráfico; preferência salva em `localStorage` (`mostrarResumoPercentuais: false` quando oculto; padrão visível).
- Base do cálculo: **total de ganhos** (`totalEntradas`).
- Exibe **percentual e valor em R$** apenas para **gastos** e **economias** (quanto representam dos ganhos), com barras de progresso.
- Oculta o resumo quando o usuário desativou a exibição ou quando não há ganhos registrados (mesmo que existam gastos ou economias).

### Gráfico de pizza (`app.component.ts`)

- Título na UI: **"Distribuição por categoria"**
- **Agrupamento:** lançamentos com o **mesmo nome** (descrição, case-insensitive) são somados em uma fatia. No gráfico, cada fatia é prefixada por tipo (`Ganho:`, `Economia:`, `Gasto:`) para evitar conflito entre categorias homônimas.
- **Ganhos** (entradas): fatias em tons de **verde** (`coresGanhos`).
- **Economias:** fatias com paleta **vibrante** (`coresEconomias` — magenta, ciano, amarelo elétrico, etc.).
- **Gastos** (saídas): fatias com paleta variada (`coresGastos`).
- Ordem das fatias: ganhos (A–Z), economias (A–Z), gastos (A–Z), todos com `pt-BR`.
- Atualiza ao adicionar/remover lançamento; tooltip mostra `Nome: R$ valor`.
- Canvas: `#pieChart` em `app.component.html`.

---

## Arquivos-chave

| Arquivo | Responsabilidade |
|---------|------------------|
| `planilha-financeira/src/app/app.component.ts` | Estado, CRUD de lançamentos, persistência, agrupamento, Chart.js |
| `planilha-financeira/src/app/services/planilha-storage.service.ts` | Leitura/gravação e validação do estado em `localStorage` |
| `planilha-financeira/src/app/app.component.html` | Layout, formulários, listas, canvas |
| `planilha-financeira/src/app/app.component.css` | Estilos (saldo, colunas, gráfico) |
| `planilha-financeira/src/app/directives/brl-currency.directive.ts` | Máscara/input BRL |
| `planilha-financeira/src/app/pipes/brl.pipe.ts` | Exibição BRL nas listas |
| `planilha-financeira/src/app/pipes/data-hora-local.pipe.ts` | Formata `criadoEm` para `dd/MM/aaaa HH:mm` (pt-BR, fuso local) |
| `planilha-financeira/src/app/app.component.spec.ts` | Testes (saldo, agrupamento no gráfico) |

### Métodos privados importantes (gráfico)

- `agruparPorCategoria(lancamentos, nomePadrao)` — agrupa por descrição normalizada (`toLowerCase()`).
- `obterDadosGrafico()` — monta `labels`, `dados`, `cores` para o Chart.js.
- `criarGrafico()` / `atualizarGrafico()` — ciclo de vida do gráfico.

---

## Convenções para contribuições

- Manter UI e textos em **português (Brasil)**.
- Preferir mudanças mínimas; reutilizar `agruparPorCategoria`, `brl`, `appBrlCurrency`.
- Novos comportamentos do gráfico: ajustar `obterDadosGrafico()` e testes em `app.component.spec.ts`. Consultar **`docs/aprendizados-grafico-chartjs.md`** antes de alterar ciclo de vida do Chart.js ou persistência.
- Não commitar `node_modules/`, `dist/`, `.angular/cache/`.
- Após mudanças de comportamento: **atualizar este `CONTEXTO.md`** e manter `planilha-financeira/README.md` alinhado (visão do usuário).

---

## Histórico de funcionalidades

Registre aqui cada feature ou ajuste relevante (mais recente no topo).

| Data | Tipo | Descrição | Arquivos principais |
|------|------|-----------|---------------------|
| 2026-05-27 | Infra | Configuração de publicação via Netlify: netlify.toml, .netlifyignore, _redirects e guia de deploy | `netlify.toml`, `.netlifyignore`, `_redirects`, `GUIA-DEPLOY-NETLIFY.md` |
| 2026-05-27 | Feature | Responsividade completa com media queries para mobile (480px), tablet (768px) e desktop (1024px+); ajustes de padding, font-size, gap e layouts | `app.component.css`, `styles.css` |
| 2026-05-27 | Feature | Edição inline de lançamentos (descrição e valor) nas três colunas, com persistência | `app.component.ts/html/css`, `app.component.spec.ts` |
| 2026-05-27 | Feature | Botão mostrar/ocultar resumo percentual ao lado do gráfico, com persistência | `app.component.ts/html/css`, `planilha-storage.service.ts`, specs |
| 2026-05-27 | Fix | Resumo percentual: gastos e economias calculados sobre o total de ganhos (não sobre movimentação total) | `app.component.ts/html/css`, `app.component.spec.ts` |
| 2026-05-27 | Feature | Resumo percentual de gastos e economias ao lado do gráfico | `app.component.ts/html/css`, `app.component.spec.ts` |
| 2026-05-27 | Feature | Data/hora local em cada lançamento (`criadoEm`), exibida na lista ao lado do valor | `app.component.ts/html/css`, `planilha-storage.service.ts`, `data-hora-local.pipe.ts`, specs |
| 2026-05-27 | Feature | Inputs obrigatórios (descrição + valor); nome personalizado da planilha com persistência | `app.component.ts/html/css`, `planilha-storage.service.ts`, specs |
| 2026-05-27 | Docs | Troubleshooting: erro `<path> attribute d` no console (extensão do navegador, não Chart.js) | `docs/aprendizados-grafico-chartjs.md` |
| 2026-05-27 | Docs | Aprendizados e checklist do gráfico Chart.js + Angular | `docs/aprendizados-grafico-chartjs.md` |
| 2026-05-27 | Fix | Gráfico: init após layout (`afterNextRender`), destroy/recriação do canvas, labels únicas por tipo, `economias: null` no storage | `app.component.ts`, `planilha-storage.service.ts` |
| 2026-05-27 | Feature | Seção **Economias**: CRUD, desconta do saldo, agrupamento no gráfico com cores vibrantes, persistência | `app.component.ts/html/css`, `planilha-storage.service.ts`, specs |
| 2026-05-27 | Feature | Persistência em localStorage para entradas, saídas e nextId | `planilha-storage.service.ts`, `app.component.ts`, specs |
| 2026-05-27 | Docs | README alinhado com gráfico por categoria e agrupamento de ganhos/gastos | `planilha-financeira/README.md` |
| 2026-05-27 | Feature | Gráfico agrupa **gastos** por nome; cada categoria com cor distinta | `app.component.ts`, `app.component.html` |
| 2026-05-27 | Feature | Mesmo agrupamento por categoria aplicado aos **ganhos**; paleta verde para ganhos | `app.component.ts`, `app.component.spec.ts` |
| 2026-05-27 | Docs | Criação do arquivo de contexto para agentes | `CONTEXTO.md`, `.cursor/rules/atualizar-contexto.mdc` |

---

## Pendências / ideias (não implementado)

- Sincronização com API / nuvem
- Filtro por período no gráfico
- Separar gráficos de ganhos e gastos

---

## Checklist do agente (ao finalizar uma tarefa)

- [x] Código compila e testes passam (`npm test` em `planilha-financeira/`)
- [x] **Histórico de funcionalidades** atualizado com data e resumo
- [x] **Funcionalidades atuais** / **Arquivos-chave** revisados se o comportamento mudou
- [x] Campo **Última atualização** no topo deste arquivo atualizado
