# Contexto do projeto — Planilha Interativa

> **Para agentes de IA:** leia este arquivo antes de alterar o código.  
> **Obrigatório:** ao concluir qualquer feature nova ou ajuste de comportamento, atualize as seções relevantes (especialmente **Histórico de funcionalidades**, **Funcionalidades atuais** e **Arquivos-chave**). Registre data (`AAAA-MM-DD`), o que mudou e quais arquivos foram tocados.

**Última atualização:** 2026-11-14

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
│   ├── docs/
│   │   ├── arquitetura.md              ← camadas, responsabilidades e fluxos de dados
│   │   ├── padroes-de-testes.md        ← cobertura mínima e idioma dos testes
│   │   └── exemplo-planilha.csv        ← exemplo de importação/exportação
│   ├── netlify.toml                 ← configuração de build e headers
│   ├── .netlifyignore               ← arquivos a ignorar no deploy
│   ├── _redirects                   ← redireciona 404 para SPA
│   ├── src/
│   │   ├── app/
│   │   │   ├── app.component.ts/html       ← shell da aplicação
│   │   │   ├── app.config.ts
│   │   │   ├── features/planilha/
│   │   │   │   ├── pages/                  ← composição da tela + estilos por área
│   │   │   │   ├── components/             ← gráfico e seção reutilizável de categoria
│   │   │   │   ├── domain/                 ← modelos e cálculos puros
│   │   │   │   └── data-access/            ← localStorage e CSV
│   │   │   └── shared/                     ← diretiva monetária e pipes reutilizáveis
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

- Campo **Nome da planilha** no topo (ex.: `Maio 2026`), limitado a 80 caracteres e salvo em `localStorage` ao sair do campo (`blur`). Placeholder padrão: **Planejador de Finanças**.

### Lançamentos

- Três colunas: entradas, economias e saídas, cada uma com formulário (descrição + valor) e lista com botões **editar** (✎) e **remover** (×).
- **Edição inline:** ao clicar em editar, descrição, valor e data/hora viram campos editáveis; exige descrição não vazia, valor &gt; 0 e data/hora local válida. **Salvar** persiste e atualiza gráfico/saldo; **Cancelar** descarta. Apenas um lançamento em edição por vez. A data/hora original é mantida se não for alterada.
- Cada lançamento na lista exibe **data e hora locais** ao lado do valor (ex.: `27/05/2026 20:56`), gravadas em `criadoEm` (ISO) ao adicionar. Lançamentos antigos sem data não mostram horário.
- **Validações dos formulários:** descrição obrigatória após remover espaços em branco e valor finito maior que zero; o botão fica desabilitado quando algum desses critérios falha. A edição também exige data/hora local válida (datas impossíveis, como 31 de fevereiro, não são salvas).
- Valores monetários via diretiva `appBrlCurrency` e pipe `brl` (formato pt-BR, 2 casas decimais); a entrada considera os dígitos como centavos, remove outros caracteres e bloqueia a tecla de sinal negativo.
- Cada coluna tem ação para apagar seus lançamentos, com confirmação. **Limpar tudo** remove lançamentos e nome da planilha, também após confirmação.
- **Persistência local:** lançamentos, nome, próximo ID e preferência de exibição do resumo são salvos em `localStorage`. Ao abrir a página, os dados são restaurados automaticamente. O estado é validado (listas, IDs inteiros positivos, descrições textuais, valores finitos positivos e datas válidas quando presentes); JSON inválido ou corrompido é ignorado. Dados antigos sem `economias` carregam com lista vazia.

### Importação e exportação CSV

- Exporta as três áreas no formato agrupado usado pela planilha, mantém a data/hora de cada lançamento e inclui BOM UTF-8. É necessário ter dados e informar um nome para exportar; o nome é sanitizado para compor o arquivo.
- Importa o formato agrupado e o tabular com cabeçalho exato e ordenado `Area;Descricao;Valor;DataAlteracao`. A extensão `.csv` é verificada sem distinção entre maiúsculas e minúsculas, e a substituição exige confirmação.
- No tabular, `Area` aceita `Entradas`/`Ganhos`, `Saídas`/`Gastos` ou `Economias` (normalização de caixa e acentos); descrição e data são obrigatórias e o valor deve ser positivo. O valor remove `R$` e espaços, trata ponto como separador de milhar e vírgula como decimal.
- Datas de importação aceitam ISO reconhecido por `Date` e `dd/mm/aaaa`, com horário opcional `HH:mm` ou `HH:mm:ss`; sem horário, usa meia-noite. O formato agrupado usa a primeira linha para o nome e a segunda para identificar as áreas.
- `PlanilhaCsvService` valida antes da substituição e informa uma referência de célula. No tabular, A/B/C/D correspondem a área/descrição/valor/data. No agrupado, falha de descrição vazia aponta para a coluna da descrição; erros de valor/data usam as referências padrão C/D, que podem não corresponder à seção em que ocorreu o problema. O nome da planilha é lido apenas no formato agrupado.

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

### Gráfico de pizza (`features/planilha/components/grafico-categorias/`)

- Título na UI: **"Distribuição por categoria"**
- **Agrupamento:** lançamentos com o **mesmo nome** (descrição, case-insensitive) são somados em uma fatia. No gráfico, cada fatia é prefixada por tipo (`Ganho:`, `Economia:`, `Gasto:`) para evitar conflito entre categorias homônimas.
- **Ganhos** (entradas): fatias em tons de **verde** (`coresGanhos`).
- **Economias:** fatias com paleta **vibrante** (`coresEconomias` — magenta, ciano, amarelo elétrico, etc.).
- **Gastos** (saídas): fatias com paleta variada (`coresGastos`).
- Ordem das fatias: ganhos (A–Z), economias (A–Z), gastos (A–Z), todos com `pt-BR`.
- Atualiza ao adicionar/remover lançamento; tooltip mostra `Nome: R$ valor`.
- Canvas: componente `GraficoCategoriasComponent`, incluído pela página da planilha.

---

## Arquivos-chave

| Arquivo | Responsabilidade |
|---------|------------------|
| `planilha-financeira/src/app/app.component.ts` | Shell standalone que monta a página da planilha |
| `planilha-financeira/src/app/features/planilha/pages/planilha-page.component.ts` | Estado da tela, ações, edição e coordenação de persistência |
| `planilha-financeira/src/app/features/planilha/pages/planilha-page.component.html` | Cabeçalho, resumo financeiro e composição dos componentes |
| `planilha-financeira/src/app/features/planilha/pages/styles/` | Estilos da página divididos por área e responsividade |
| `planilha-financeira/src/app/features/planilha/components/lancamento-categoria/` | Formulário, lista, edição e ações reutilizados nas três categorias |
| `planilha-financeira/src/app/features/planilha/components/grafico-categorias/` | Ciclo de vida e apresentação Chart.js |
| `planilha-financeira/src/app/features/planilha/domain/planilha.model.ts` | Modelos de lançamento e estado persistido |
| `planilha-financeira/src/app/features/planilha/domain/planilha-calculos.ts` | Totais, frações e agrupamento puro para o gráfico |
| `planilha-financeira/src/app/features/planilha/data-access/planilha-storage.service.ts` | Leitura/gravação e validação do estado em `localStorage` |
| `planilha-financeira/src/app/features/planilha/data-access/planilha-csv.service.ts` | Serialização e parsing dos formatos CSV aceitos |
| `planilha-financeira/src/app/shared/directives/brl-currency.directive.ts` | Máscara/input BRL |
| `planilha-financeira/src/app/shared/pipes/brl.pipe.ts` | Exibição de valores em BRL |
| `planilha-financeira/src/app/shared/pipes/data-hora-local.pipe.ts` | Formata `criadoEm` para `dd/MM/aaaa HH:mm` (pt-BR, fuso local) |
| `planilha-financeira/docs/padroes-de-testes.md` | Cobertura mínima, idioma e revisão final dos testes |
| `planilha-financeira/src/app/features/planilha/pages/planilha-page.component.spec.ts` | Testes da tela e dos fluxos da planilha |

### Cálculos do gráfico

- `obterDadosGrafico()` em `domain/planilha-calculos.ts` — agrupa descrições e monta `labels`, `dados` e `cores`.
- `GraficoCategoriasComponent` — cria, atualiza e destrói a instância Chart.js.
- `LancamentoCategoriaComponent` — mantém um único template para entradas, saídas e economias.

---

## Convenções para contribuições

- Manter UI e textos em **português (Brasil)**.
- Preferir mudanças mínimas; reutilizar `obterDadosGrafico()`, `brl` e `appBrlCurrency`.
- Regras financeiras e agrupamentos devem permanecer em funções puras de `domain/`; acesso a `localStorage` e arquivos fica em `data-access/`.
- Novos comportamentos do gráfico: ajustar `domain/planilha-calculos.ts` e seus testes. Consultar **`docs/aprendizados-grafico-chartjs.md`** antes de alterar ciclo de vida do Chart.js ou persistência.
- Os testes devem seguir **`planilha-financeira/docs/padroes-de-testes.md`**: cobertura mínima de 90% em cada métrica e nomes de suítes/casos em português do Brasil. Leia esse guia ao concluir implementações e quando solicitado.
- Não commitar `node_modules/`, `dist/`, `.angular/cache/`.
- Após mudanças de comportamento: **atualizar este `CONTEXTO.md`** e manter `planilha-financeira/README.md` alinhado (visão do usuário).

---

## Histórico de funcionalidades

Registre aqui cada feature ou ajuste relevante (mais recente no topo).

| Data | Tipo | Descrição | Arquivos principais |
|------|------|-----------|---------------------|
| 2026-11-14 | Testes/Docs | Ampliação da suíte para 103 testes; cobertura registrada em 99,4% de instruções, 95,37% de ramificações, 100% de funções e 99,38% de linhas; definição de mínimo de 90% por métrica e testes em pt-BR | `planilha-financeira/docs/padroes-de-testes.md`, `src/app/**/*.spec.ts`, `planilha-financeira/README.md`, `CONTEXTO.md` |
| 2026-11-14 | Docs | Criação da documentação de arquitetura com camadas, responsabilidades, fluxos de dados, persistência, CSV e gráfico | `planilha-financeira/docs/arquitetura.md`, `planilha-financeira/README.md`, `CONTEXTO.md` |
| 2026-11-14 | Docs | README e contexto técnico alinhados às funcionalidades atuais e às validações dos formulários e CSV; correção da regra de edição da data/hora | `planilha-financeira/README.md`, `CONTEXTO.md` |
| 2026-11-14 | Refactor | Separação da página da planilha, componentes por responsabilidade, domínio, acesso a dados e estilos; importação CSV tabular passou a ser reconhecida e a validação não altera IDs/dados parcialmente | `src/app/app.component.ts/html/spec.ts`, `src/app/features/planilha/`, `src/app/shared/`, `README.md`, `CONTEXTO.md` |
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
- [x] Ler `planilha-financeira/docs/padroes-de-testes.md`; confirmar idioma pt-BR e cobertura mínima de 90% em cada métrica
- [x] Campo **Última atualização** no topo deste arquivo atualizado
