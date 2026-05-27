# Planejador de Finanças

Aplicação Angular para controle de entradas (ganhos) e saídas (gastos), com formatação em Real brasileiro e gráfico de pizza por categoria, atualizado em tempo real a cada lançamento.

## Funcionalidades

- Colunas separadas para **entradas** e **saídas**, com lista e remoção de itens
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

> Os dados ficam apenas em memória; ao recarregar a página, os lançamentos são perdidos.

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
