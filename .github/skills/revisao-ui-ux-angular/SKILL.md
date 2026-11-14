---
name: revisao-ui-ux-angular
description: Analisar arquitetura visual, experiência do usuário, acessibilidade, responsividade e qualidade da interface em projetos Angular. Use para diagnóstico de UI/UX sem implementar mudanças.
argument-hint: "[escopo opcional, como feature ou projeto inteiro]"
---

# Revisão de arquitetura visual, UI/UX e experiência do usuário Angular

Use esta skill para produzir um diagnóstico de interface, visual design, UX, acessibilidade e qualidade da experiência em aplicações Angular, com foco no código real e na arquitetura da interface. A revisão é somente leitura: não altere código, testes, documentação, dependências, estilos, configurações ou rotas; não faça refatorações e não instale pacotes. Aguarde aprovação explícita antes de implementar qualquer recomendação.

## Processo

1. **Defina o escopo e preserve o workspace.**
   - Identifique se a análise cobre uma feature, uma página ou o projeto inteiro.
   - Verifique o estado do repositório e preserve alterações existentes.
   - Não delegue uma revisão cujo conjunto de evidências possa ser lido diretamente em uma única leitura.
   - Se o escopo estiver ambíguo, pergunte antes de assumir.

2. **Identifique a plataforma e as versões antes de recomendar mudanças.**
   - Leia `package.json`, lockfile e configurações do Angular.
   - Registre versões de Angular, TypeScript, RxJS e bibliotecas relevantes;
   - Entenda se a app usa standalone components, features, routing, estilos globais, CSS modular ou CSS por página.
   - Considere compatibilidade real com a versão instalada do Angular e da stack atual.
   - Não proponha atualização de biblioteca como substituto para diagnóstico de UX ou design.

3. **Siga os fluxos relevantes pelo código.**
   - Revise a estrutura real da aplicação, entrada, componentes, templates, estilos, lógica de página e regras de persistência/negócio.
   - Consulte testes como evidência auxiliar, mas confirme o comportamento no código.
   - Avalie, conforme aplicável:
     - organização por feature, domínio, shared e core;
     - composições de páginas e componentes;
     - uso de componentes standalone;
     - separação entre apresentação e regra de negócio;
     - reutilização de componentes e consistência visual;
     - organização de serviços, persistência e estado;
     - rotas, lazy loading, estrutura de telas, navegação e contexto do usuário;
     - uso de signals, estado local e padrões modernos do Angular.

4. **Avaliando arquitetura visual e UX.**
   - Verifique identidade visual, paleta, contraste, tipografia, espaçamentos, bordas, sombras, radii e componentes básicos.
   - Identifique se há Design System ou tokens visuais, mesmo que implícitos.
   - Avalie se o layout é intuitivo, se a navegação é clara, se há hierarquia visual e se o usuário consegue identificar onde está e como agir.
   - Observe componentes repetidos em estilos diferentes e oportunidades reais de reutilização.
   - Analise responsividade em diferentes resoluções e o comportamento em telas menores.
   - Avalie acessibilidade segundo WCAG 2.2, incluindo contraste, foco, labels, teclado, semântica, leitores e diálogos.

5. **Diferencie problemas reais de preferências estéticas.**
   - Não trate ausência de Angular Material, PrimeNG ou Design System formalizado como problema obrigatório quando a solução atual funciona e é simples.
   - Não recomende instalar bibliotecas novas apenas por preferência pessoal.
   - Não descreva um componente como “inadequado” sem evidência de impacto real na usabilidade, manutenção ou acessibilidade.
   - Priorize clareza, consistência, facilidade de utilização e manutenção.

6. **Classifique e sustente cada apontamento.**
   - **Crítico:** problema que compromete significativamente a utilização, acessibilidade ou funcionamento da interface.
   - **Alto:** problema importante de usabilidade, consistência, manutenção ou crescimento.
   - **Médio:** problema relevante, mas com impacto menor ou mais específico.
   - **Baixo:** melhoria pontual de padronização, desempenho ou acessibilidade.
   - Para cada problema, informe arquivo/localização, descrição, razão técnica, impacto e recomendação.

7. **Mantenha a revisão não destrutiva.**
   - Não modifique arquivos, não refatore automaticamente, não altere regras de negócio, não instale dependências e não altere configurações.
   - Não execute builds ou testes para gerar transformações; apenas execute verificações quando estritamente necessárias e compatíveis com o pedido.
   - Em qualquer caso, informe exatamente o que foi ou não foi verificado.

8. **Entregue o relatório conforme o formato obrigatório.**
   - Use em português.
   - O relatório deve seguir a estrutura abaixo, cobrindo cada categoria mesmo que a conclusão seja “não aplicável” ou “sem problema relevante identificado”.
   - Termine confirmando que não houve alterações nesta etapa, quais verificações foram executadas e que a implementação aguarda aprovação.

## Formato do relatório

### A. Diagnóstico geral
- Estado atual da arquitetura visual.
- Qualidade geral da interface.
- Principais pontos positivos.
- Principais oportunidades de melhoria.

### B. Análise por categoria
Para cada categoria analisada, apresente:
- Situação encontrada.
- Arquivos e componentes envolvidos.
- Problemas identificados.
- Consequências para a aplicação.
- Recomendação de melhoria.

As categorias incluem, conforme aplicável:
- arquitetura front-end;
- design system;
- componentes visuais;
- layout e navegação;
- UI/UX;
- responsividade;
- acessibilidade;
- bibliotecas e tecnologias;
- qualidade e desempenho.

### C. Problemas classificados por severidade
Classifique cada problema:
- **Crítico:** problemas que comprometem significativamente a utilização, acessibilidade ou funcionamento da interface.
- **Alto:** problemas importantes de usabilidade, consistência ou manutenção.
- **Médio:** problemas com impacto relevante, mas mais localizado.
- **Baixo:** melhorias pontuais de padronização, legibilidade ou micro-UX.

### D. Observações finais
- Resuma o parecer geral da aplicação.
- Diferencie riscos reais de preferências estéticas.
- Informe se a arquitetura atual é adequada ao estágio do projeto e o que deve ser preservado.
- Diga quando a análise sugere pequenos ajustes em vez de grande refatoração.

## Critérios de qualidade esperados

A análise deve:
- basear-se no código real do projeto;
- identificar problemas concretos e sustentados por evidência;
- não inventar requisitos inexistentes;
- apontar melhorias com impacto real e mínima complexidade;
- priorizar clareza, consistência e facilidade de uso;
- preservar a identidade visual quando ela for adequada;
- distinguir problemas de arquitetura visual de preferências pessoais.

## Saída esperada

O resposta final deve ser um relatório técnico em português, objetivo e bem estruturado, com no máximo um nível de detalhe de revisão arquitetural/UX, sem alterar arquivos nem sugerir implementações sem aprovação prévia.
