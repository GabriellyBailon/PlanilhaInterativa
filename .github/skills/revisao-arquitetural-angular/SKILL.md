---
name: revisao-arquitetural-angular
description: Revisar arquitetura, segurança, performance e qualidade de um projeto Angular com base no código e nas versões reais. Use para auditorias técnicas sem implementar correções.
argument-hint: "[escopo opcional, como feature ou projeto inteiro]"
---

# Revisão arquitetural e de qualidade Angular

Use esta skill para produzir um diagnóstico técnico baseado no repositório. A revisão é somente leitura: não altere código, testes, documentação, dependências ou configurações, não execute refatorações e não instale pacotes. Aguarde aprovação explícita antes de implementar qualquer recomendação.

## Processo

1. **Defina o escopo e preserve o workspace.**
   - Identifique se a revisão cobre uma feature ou o projeto inteiro. Se o pedido indicar o projeto inteiro, revise todas as áreas relevantes sem presumir que a estrutura inicial exibida está completa.
   - Verifique o estado do repositório e preserve quaisquer alterações preexistentes.
   - Não delegue uma auditoria cujo conjunto de evidências possa ser lido diretamente em uma única revisão.
   - Se o escopo ou uma decisão necessária estiver ambígua, pergunte antes de assumir.
2. **Identifique a plataforma e as versões antes de recomendar mudanças.**
   - Leia `package.json` e o lockfile para distinguir faixas declaradas de versões efetivamente fixadas.
   - Registre versões de Angular, TypeScript, RxJS e bibliotecas relevantes; examine `angular.json`, configurações TypeScript, scripts e alvos de build/teste.
   - Inspecione a estrutura real da aplicação, entrada, configuração, rotas, features e padrões existentes.
   - Considere a compatibilidade das APIs e recomendações com a versão instalada. Priorize a documentação oficial em <https://angular.dev/>. Não proponha atualização de versão como substituto para diagnóstico.
3. **Siga os fluxos relevantes pelo código.** Consulte testes e documentação como evidências auxiliares, mas confirme o comportamento no código. Use buscas direcionadas e referências precisas de arquivo/localização. Avalie, conforme aplicável:
   - **Organização:** isolamento por feature, responsabilidades de `core`, `shared` e domínio, dependências entre features, duplicação e capacidade de crescimento. A estrutura de referência não é obrigatória; não recomende pastas vazias.
   - **Responsabilidades:** composição de páginas, comportamento dos componentes, coordenação de estado, acesso a APIs/persistência, validação e transformação de dados. Facades, interfaces e camadas adicionais são opcionais quando a complexidade não as justificar.
   - **Segurança:** autenticação e autorização, guards e limites da autorização no frontend, validação no backend quando aplicável, armazenamento de tokens/dados sensíveis, secrets/configuração, sinks de XSS, sanitização, manipulação do DOM, tratamento de erros e headers de HTTPS/CSP.
   - **Estado:** sinais/estado local e compartilhado, duplicação, subscrições, ciclo de vida, vazamentos e uso proporcional de RxJS ou bibliotecas de estado.
   - **Performance e evolução:** standalone, lazy loading, `@defer`, volume de listas, paginação, chamadas HTTP/cache, cálculos em templates, atualizações repetidas e tamanho/responsabilidades dos componentes. Só recomende otimizações justificadas pelo fluxo ou pelo volume observado.
   - **Testabilidade e qualidade:** testes existentes e lacunas de comportamento, cobertura configurada ou efetivamente medida, strict mode, uso de `any` em código de produção, lint, formatação, nomenclatura e acessibilidade.
4. **Diferencie riscos demonstrados de melhorias condicionais.**
   - Não trate ausência de OAuth, guards, backend, roteamento, Signals, Facades ou NgRx como problema quando o produto e o fluxo não os exigem.
   - Não considere automaticamente o uso de `localStorage` uma vulnerabilidade: descreva o dado armazenado, a expectativa de privacidade e o risco de acesso por scripts da mesma origem.
   - Não alegue cobertura, conformidade de headers, comportamento de deploy ou resultado de testes sem evidência. Distinga inspeção estática de verificações executadas.
   - Não classifique preferências pessoais como violações. Prefira poucas constatações concretas a listas especulativas.
5. **Classifique e sustente cada apontamento.**
   - **CRÍTICO:** vulnerabilidade grave, exposição de informação sensível ou falha que comprometa diretamente a segurança.
   - **ALTO:** problema relevante de arquitetura, manutenção, escalabilidade ou qualidade.
   - **MÉDIO:** risco ou inconsistência com impacto demonstrável, incluindo problemas de integridade e confiabilidade.
   - **BAIXO:** melhoria pontual de padronização, legibilidade, acessibilidade ou defesa em profundidade.
   - Para cada problema, informe arquivo/localização, descrição, motivo técnico, impacto e recomendação. Só inclua exemplo de implementação se ele esclarecer a recomendação; não aplique a mudança.
6. **Mantenha a revisão não destrutiva.**
   - Não modifique arquivos, não instale dependências, não atualize versões, não altere configurações e não exclua arquivos.
   - Não execute comandos que alterem o workspace. Builds ou testes podem gerar artefatos; só os execute se forem necessários, seguros no projeto e compatíveis com o pedido. Informe exatamente o que foi ou não executado.
   - Não exponha valores de secrets encontrados. Informe apenas o tipo de exposição e o local, redigindo o conteúdo sensível.
7. **Entregue o relatório e aguarde aprovação.**
   - Use o formato abaixo, cobrindo cada categoria mesmo que a conclusão seja “não aplicável” ou “sem problema relevante identificado”.
   - Termine confirmando se houve alterações (nenhuma nesta skill), quais verificações foram executadas e que a implementação aguarda aprovação.

## Formato do relatório

### A. Diagnóstico geral
Resuma a arquitetura atual, compatibilidade das versões e qualidade observada. Diferencie o estado atual de qualquer comparação antes/depois que não possa ser comprovada.

### B. Pontos positivos
Liste decisões sustentadas pelo código que devem ser mantidas.

### C. Problemas identificados
Use uma tabela com as colunas:

| Gravidade | Arquivo e localização | Problema | Impacto | Recomendação |
|---|---|---|---|---|

Use links Markdown para arquivos do workspace, com caminho absoluto e linha quando disponível. Registre explicitamente quando não houver problemas críticos ou altos.

### D. Análise por categoria
Avalie organização, separação de responsabilidades, segurança, estado, performance, testabilidade e padronização/acessibilidade. Explique quando uma categoria não se aplicar ao projeto.

### E. Melhorias recomendadas
Ordene as ações por impacto e urgência. Separe correções necessárias de opções condicionais; justifique cada item sem propor refatoração ampla sem benefício comprovado.

### F. Parecer arquitetural
Conclua se a arquitetura é adequada, quais riscos precisam de correção, quais mudanças são opcionais e se há evidência suficiente para afirmar que a aplicação pode evoluir. Não afirme que uma refatoração prévia atingiu seus objetivos sem uma referência comparativa.

### G. Plano de ação
Apresente uma sequência incremental de correções, iniciando pelos riscos mais relevantes. Não execute esse plano durante a revisão.
