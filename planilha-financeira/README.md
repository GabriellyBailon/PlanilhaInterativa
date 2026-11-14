# Planejador de Finanças

Aplicação Angular para controle de entradas (ganhos), economias e saídas (gastos), com formatação em Real brasileiro, saldo e gráfico de pizza por categoria.

## Funcionalidades

- Três áreas — **entradas**, **economias** e **saídas** — para adicionar, editar e remover lançamentos; cada área também pode ser apagada separadamente
- Descrição obrigatória e valor maior que zero. Valores digitados são formatados em **R$**, com duas casas decimais (pt-BR)
- Data e hora local exibidas em cada lançamento; ao editar, também é possível alterar a data e a hora
- **Saldo total** calculado como entradas menos saídas e economias
- **Resumo percentual** de gastos e economias em relação aos ganhos, com valores e barras; pode ser ocultado e sua preferência é salva
- **Gráfico de pizza — distribuição por categoria**
  - Entradas, economias e saídas são agrupadas separadamente por descrição; nomes iguais ignorando maiúsculas/minúsculas são somados
  - **Ganhos:** cada categoria de entrada com cor em tons de verde
  - **Economias:** paleta vibrante
  - **Gastos:** cada categoria de saída com cor distinta (paleta variada)
  - Legenda e tooltip identificam o tipo, a categoria e o valor em R$
- **Saldo total** com cores:
  - Verde: saldo positivo maior que R$ 100,00
  - Amarelo: saldo entre R$ 0,00 e R$ 100,00 (inclusive)
  - Vermelho: saldo negativo
- Ações para **limpar tudo** (lançamentos e nome da planilha), sempre com confirmação
- **Exportação e importação em CSV**
  - Exporta todos os registros das áreas de ganhos, gastos e economias
  - Aceita apenas arquivos `.csv`
  - Antes da importação, solicita confirmação para substituir os dados atuais
  - Valida os dados e mostra o erro com a referência da célula, por exemplo: `c2`

> Lançamentos, nome da planilha e preferência de exibição dos percentuais são salvos automaticamente no navegador (`localStorage`). Ao recarregar a página, os dados são restaurados no mesmo dispositivo.

O nome da planilha aceita até **80 caracteres**. Para exportar, informe um nome e tenha pelo menos um lançamento.

## Como usar a importação/exportação CSV

A planilha pode exportar e importar dados em formato CSV para backup, migração ou restauração.

### Estrutura do CSV

O arquivo exportado usa este formato em colunas agrupadas por área:

```csv
"=""Maio 2026""";;;;;;;;;;;
;Entradas;;;;Saídas;;;;Economias;;
;Descrição;Valor;Data de alteração;;Descrição;Valor;Data de alteração;;Descrição;Valor;Data de alteração
;Freela;R$ 200,00;15/10/2026 09:30:45;;Conta de Luz;R$ 150,00;15/10/2026 18:20:10;;Reserva;R$ 50,00;15/10/2026 07:05:30
```

- A primeira linha pode conter o nome da página; ele é exportado como texto para evitar que o Excel o converta em data
- Há uma seção para `Entradas`, `Saídas` e `Economias` em colunas agrupadas
- A importação também aceita CSV tabular com o cabeçalho, nesta ordem: `Area;Descricao;Valor;DataAlteracao`:

  ```csv
  Area;Descricao;Valor;DataAlteracao
  Entradas;Freela;R$ 200,00;15/10/2026 09:30:45
  Saídas;Conta de Luz;R$ 150,00;15/10/2026 18:20:10
  Economias;Reserva;R$ 50,00;15/10/2026 07:05:30
  ```

- Os arquivos exportados incluem assinatura UTF-8 para preservar acentos ao abrir no Excel
- Descrições que poderiam ser interpretadas como fórmulas por programas de planilha são exportadas como texto e preservadas ao reimportar o CSV no aplicativo
- `Area` aceita `Entradas` ou `Ganhos`, `Saídas` ou `Gastos`, e `Economias` (diferenças de acentuação e maiúsculas/minúsculas são normalizadas)
- `Descrição` é obrigatória e não pode ficar em branco
- `Valor` é obrigatório, deve ser maior que zero e aceita formato brasileiro, com vírgula decimal e prefixo `R$` opcional (por exemplo, `200,00` ou `R$ 200,00`); pontos são tratados como separadores de milhar
- `DataAlteracao` / `Data de alteração` é obrigatória. São aceitas datas ISO e datas brasileiras `dd/mm/aaaa`, com horário opcional (`HH:mm` ou `HH:mm:ss`); sem horário, usa-se meia-noite
- O CSV agrupado usa a primeira linha para o nome da planilha e a segunda para identificar as áreas. No formato tabular, o nome da planilha não é incluído
- A importação valida o arquivo inteiro antes de substituir os dados atuais; em caso de falha, os dados existentes permanecem

### Importação

1. Clique em **Importar CSV**
2. Selecione um arquivo `.csv`
3. Confirme a substituição dos dados atuais
4. Se houver erro, a mensagem indica uma célula a conferir; no CSV tabular, as colunas são `A` área, `B` descrição, `C` valor e `D` data. No agrupado, erros de descrição apontam para a coluna correspondente; referências de valor/data podem não refletir a coluna da seção

### Exportação

1. Informe o nome da planilha e adicione pelo menos um registro em qualquer área
2. Clique em **Exportar CSV**
3. O arquivo será salvo com o nome da planilha e a data/hora atual no formato CSV agrupado

### Arquivo de exemplo

Você pode usar o exemplo em [docs/exemplo-planilha.csv](docs/exemplo-planilha.csv).

## Como executar

```bash
cd planilha-financeira
npm install
npm start
```

Abra [http://localhost:4200](http://localhost:4200) no navegador.

## Testes

```bash
npm test
```

## Build de produção

```bash
npm run build
```

## Documentação para desenvolvedores

- [Arquitetura da aplicação](docs/arquitetura.md): camadas, responsabilidades e principais fluxos de dados.
- [Padrões de testes](docs/padroes-de-testes.md): cobertura mínima de 90% por métrica, idioma pt-BR e revisão ao concluir implementações.
- Contexto técnico e histórico de mudanças para agentes de IA: [`../CONTEXTO.md`](../CONTEXTO.md) (na raiz do workspace).
- Skill para auditar e atualizar a documentação comparando-a com o código: [`../.github/skills/verificar-documentacao/SKILL.md`](../.github/skills/verificar-documentacao/SKILL.md).
