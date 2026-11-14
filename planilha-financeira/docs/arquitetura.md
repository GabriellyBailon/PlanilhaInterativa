# Arquitetura da aplicação

Este documento descreve como o Planejador de Finanças está organizado hoje e como os principais fluxos atravessam suas camadas. Para funcionalidades e regras visíveis para quem usa o app, consulte o [README](../README.md); para histórico e contexto de desenvolvimento do workspace, consulte [`../../CONTEXTO.md`](../../CONTEXTO.md).

## Visão geral

A aplicação é uma SPA Angular 19 baseada em componentes standalone. O ponto de entrada registra o locale `pt-BR`, configura `LOCALE_ID` e `DEFAULT_CURRENCY_CODE` como `BRL` e monta o componente raiz. O componente raiz delega a tela para a feature de planilha.

```text
main.ts
  └── AppComponent
        └── PlanilhaPageComponent
              ├── LancamentoCategoriaComponent (entradas, economias e saídas)
              └── GraficoCategoriasComponent (Chart.js)
```

O estado da aplicação é mantido na página da planilha. Serviços isolam persistência e CSV; funções puras de domínio calculam totais e dados do gráfico.

## Referência do código

Esta descrição foi conferida com base no último commit que alterou o código da aplicação (`planilha-financeira/src/`) na data da revisão:

- **Commit:** [`5c1042c671b9429cce81f27ca958a5aeda3d128e`](https://github.com/GabriellyBailon/PlanilhaInterativa/commit/5c1042c671b9429cce81f27ca958a5aeda3d128e)
- **Data e mensagem:** 2026-11-14 — `Validação, nome obrigatório.`

Esse SHA identifica a referência do código documentado, não uma versão publicada. Para comparar mudanças posteriores no código da aplicação:

```bash
git diff 5c1042c671b9429cce81f27ca958a5aeda3d128e..HEAD -- planilha-financeira/src
```

## Organização do código

| Área | Responsabilidade |
|---|---|
| `src/main.ts` e `src/app/app.config.ts` | Inicialização Angular, locale e configurações globais |
| `src/app/app.component.ts` | Componente raiz; monta a página da planilha |
| `src/app/features/planilha/pages/` | Estado da tela, ações do usuário, validações de fluxo, coordenação de serviços e composição dos componentes |
| `src/app/features/planilha/components/lancamento-categoria/` | Formulário e lista reutilizados para cada tipo de lançamento; mantém valores transitórios do formulário e emite eventos para a página |
| `src/app/features/planilha/components/grafico-categorias/` | Apresentação do gráfico Chart.js e ciclo de vida da instância |
| `src/app/features/planilha/domain/` | Modelos e cálculos independentes da interface, como totais e agrupamento de categorias |
| `src/app/features/planilha/data-access/` | Leitura/gravação no `localStorage` e serialização, parsing e validação de CSV |
| `src/app/shared/` | Diretiva de entrada monetária e pipes reutilizáveis de moeda e data/hora |

Os estilos da tela ficam em `pages/styles/`; cada componente mantém seus próprios estilos e folha responsiva quando aplicável.

## Estado e contratos principais

`EstadoPlanilha` representa o estado persistido: listas de `entradas`, `saidas` e `economias`, `nextId`, nome opcional da página e preferência opcional de exibição dos percentuais. Cada `LancamentoPersistido` contém `id`, `descricao`, `valor` e, opcionalmente, `criadoEm` em formato de data serializável.

`TipoLancamento` restringe as operações da tela a `entrada`, `saida` ou `economia`. A página mantém as três listas e os campos de edição; o componente de categoria não grava dados nem acessa serviços: ele emite ações para a página e recebe os dados atuais por `@Input`.

Totais e saldo são derivados do estado, não persistidos como valores independentes:

```text
saldo = total(entradas) - total(saidas) - total(economias)
```

Os percentuais de gastos e economias usam o total de entradas como base. Quando não há ganhos, a fração calculada é zero e o resumo não é exibido.

## Fluxos de dados

### Lançamentos

1. `LancamentoCategoriaComponent` coleta descrição e valor e emite o evento de inclusão.
2. `PlanilhaPageComponent` rejeita descrição vazia após `trim` ou valor não finito/menor ou igual a zero; a diretiva monetária formata a entrada em BRL.
3. A página cria o identificador e a data/hora, atualiza a lista correspondente e persiste o estado.
4. Edição e remoção seguem o mesmo fluxo centralizado na página. A edição também valida a data/hora local antes de salvar.
5. Os totais, saldo, resumo e dados do gráfico são derivados das listas atualizadas.

### Persistência local

`PlanilhaStorageService` usa a chave `planilha-financeira:v1`. A página carrega o estado na inicialização e o salva após alterações relevantes. O serviço valida o JSON antes de devolvê-lo, incluindo listas, IDs, valores e datas; ajusta `nextId` para ficar acima do maior ID existente. Estados legados sem `economias` são carregados com uma lista vazia.

Se o JSON não puder ser lido ou validado, `carregar()` retorna `null`. `salvar()` retorna `false` se o ambiente não tiver `localStorage` ou a gravação falhar; a página então avisa que as alterações podem não ter sido salvas e recomenda exportar um CSV.

### Importação e exportação CSV

```text
Arquivo selecionado
  → valida extensão .csv e pede confirmação
  → PlanilhaCsvService interpreta e valida o conteúdo
  → somente após sucesso, a página substitui o estado e persiste
```

`PlanilhaCsvService` suporta o formato agrupado exportado pelo app e o formato tabular com cabeçalho `Area;Descricao;Valor;DataAlteracao`. A importação constrói listas e IDs temporários durante a leitura; um erro interrompe o processo sem substituir os dados atuais. Erros de validação são apresentados pela página com uma referência de célula.

Na exportação, a página exige nome e ao menos um lançamento; o serviço serializa as três áreas, e a página baixa o arquivo com BOM UTF-8 e nome sanitizado com data/hora. Regras detalhadas dos campos e formatos aceitos estão no [README](../README.md#estrutura-do-csv).

### Gráfico

`PlanilhaPageComponent` fornece ao gráfico dados calculados por `obterDadosGrafico()` em `domain/planilha-calculos.ts`. As categorias são agrupadas separadamente por tipo, descrições iguais ignorando maiúsculas/minúsculas são somadas e os rótulos recebem prefixos para distinguir ganho, economia e gasto. A página também fornece as paletas de cores.

`GraficoCategoriasComponent` cria e atualiza o gráfico, formata os valores do tooltip em BRL e destrói a instância ao desmontar. A inicialização inicial ocorre após a renderização; atualizações de dados atualizam a instância existente.

## Limites e convenções

- A página coordena estado e efeitos; componentes filhos emitem ações em vez de modificar listas persistidas diretamente.
- Regras financeiras e cálculos derivados pertencem a `domain/`; não devem depender de Angular, DOM ou `localStorage`.
- Acesso a arquivos e persistência ficam em `data-access/`; componentes não devem duplicar parsing de CSV ou lógica de armazenamento.
- Dados do gráfico devem ser derivados das listas, sem armazenar cópias calculadas no estado.
- Mudanças no esquema persistido devem preservar compatibilidade com estados anteriores ou definir como tratá-los.
- Mudanças em validações devem manter interface, importação CSV e validação de armazenamento consistentes quando a mesma regra se aplica.

## Testes

Os testes ficam próximos das unidades que cobrem: funções de domínio, serviços de CSV e armazenamento, pipes e componentes. A suíte é executada com `npm test`; o build de produção, com `npm run build`.

Para mudanças de validação, priorize casos de entrada aceitos e rejeitados e garanta que uma importação inválida não substitua o estado atual. Para mudanças no gráfico, cubra os cálculos de domínio e deixe a integração com Chart.js sob responsabilidade do componente de apresentação.
