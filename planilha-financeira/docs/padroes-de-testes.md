# Padrões de testes

Este guia define os requisitos de testes para implementações e alterações na
Planilha Financeira.

## Cobertura mínima

A cobertura do projeto deve ser de **no mínimo 90% em cada métrica**, avaliada
individualmente:

- Instruções (*Statements*)
- Ramificações (*Branches*)
- Funções (*Functions*)
- Linhas (*Lines*)

Execute a suíte com relatório de cobertura na pasta `planilha-financeira`:

```bash
npm test -- --watch=false --code-coverage
```

Não use a média entre métricas para compensar uma que esteja abaixo de 90%.
Quando uma alteração reduzir a cobertura ou deixar alguma métrica abaixo do
limite, acrescente testes relevantes antes de concluir. Não remova testes,
exclua arquivos da medição ou reduza o limite apenas para fazer o relatório
passar.

## Idioma

Os nomes das suítes (`describe`) e dos casos (`it`) devem ser escritos em
**português do Brasil (pt-BR)**. Descreva o comportamento esperado de forma
clara e mantenha em pt-BR os dados e mensagens criados especificamente para os
testes.

Identificadores de APIs, símbolos importados e termos técnicos podem manter a
grafia usada pelo código ou pela biblioteca testada; não altere nomes de
produção apenas para traduzir os testes.

## Qualidade dos casos

- Teste comportamentos observáveis, regras de negócio, fluxos e casos-limite
  relacionados à alteração.
- Prefira os arquivos de especificação existentes e siga os padrões de Jasmine
  e Angular usados no projeto.
- Evite testes redundantes ou criados apenas para aumentar o percentual.
- Mantenha os testes determinísticos; controle datas, armazenamento, eventos e
  APIs do navegador quando necessário.
- Não altere o comportamento da aplicação apenas para facilitar a cobertura.

## Revisão ao concluir uma implementação

Ao finalizar uma implementação, leia este guia e confira se os novos ou
alterados testes atendem aos padrões de cobertura e idioma. Execute a suíte com
cobertura, confira cada métrica separadamente e informe o resultado. Leia este
guia também sempre que o usuário solicitar os padrões ou uma revisão dos testes.

## Última verificação registrada

Em **14/11/2026**, a suíte executou **103 testes com sucesso** e registrou:

| Métrica | Resultado |
|---|---:|
| Instruções | 99,4% |
| Ramificações | 95,37% |
| Funções | 100% |
| Linhas | 99,38% |
