# Planejador de Finanças

Aplicação Angular para controle de entradas (ganhos) e saídas (gastos), com formatação em Real brasileiro e gráfico de pizza por categoria, atualizado em tempo real a cada lançamento.

## Funcionalidades

- Colunas para **entradas**, **economias** e **saídas**, com lista, **edição** (✎) e remoção de itens
- Valores em **R$** com duas casas decimais (formato pt-BR)
- Bloqueio de valores negativos ou zero nos campos monetários
- **Gráfico de pizza — distribuição por categoria**
  - Lançamentos com o **mesmo nome** (descrição) são **somados** em uma única fatia (ex.: dois "Aluguel" viram uma categoria)
  - A comparação de nomes ignora maiúsculas e minúsculas (`Aluguel` = `aluguel`)
  - **Ganhos:** cada categoria de entrada com cor em tons de verde
  - **Gastos:** cada categoria de saída com cor distinta (paleta variada)
  - Legenda e tooltip com nome da categoria e valor em R$
- **Saldo total** com cores:
  - Verde: saldo positivo maior que R$ 100,00
  - Amarelo: saldo entre R$ 0,00 e R$ 100,00 (inclusive)
  - Vermelho: saldo negativo
- **Exportação e importação em CSV**
  - Exporta todos os registros das áreas de ganhos, gastos e economias
  - Aceita apenas arquivos `.csv`
  - Antes da importação, solicita confirmação para substituir os dados atuais
  - Valida o formato e mostra o erro com a referência da célula, por exemplo: `c2`

> Os lançamentos são **salvos automaticamente no navegador** (`localStorage`). Ao recarregar a página, entradas e saídas são restauradas no mesmo dispositivo.

## Como usar a importação/exportação CSV

A planilha pode exportar e importar dados em formato CSV para backup, migração ou restauração.

### Estrutura do CSV

O arquivo exportado usa este formato:

```csv
Area,Descricao,Valor,DataAlteracao
Entradas,Salario,2500,2026-11-14T10:00:00.000Z
Saidas,Aluguel,1200,2026-11-14T11:30:00.000Z
Economias,Reserva,500,2026-11-14T12:00:00.000Z
```

- `Area` aceita: `Entradas`, `Saidas`, `Economias`
- `Descricao` é o nome do lançamento
- `Valor` deve ser numérico e maior que zero
- `DataAlteracao` aceita datas em ISO 8601 ou no formato brasileiro (`dd/mm/aaaa`)

### Importação

1. Clique em **Importar CSV**
2. Selecione um arquivo `.csv`
3. Confirme a substituição dos dados atuais
4. Caso o arquivo esteja em formato inválido, a aplicação mostra a mensagem:
   `Ops! Os dados da planilha estão em formato incorreto. Verifique a célula c2`

### Exportação

1. Adicione pelo menos um registro em qualquer área
2. Clique em **Exportar CSV**
3. O arquivo será salvo com o nome da planilha e a data/hora atual

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

Contexto técnico e histórico de mudanças para agentes de IA: [`../CONTEXTO.md`](../CONTEXTO.md) (na raiz do workspace).
