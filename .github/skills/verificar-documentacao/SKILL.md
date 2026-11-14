---
name: verificar-documentacao
description: Auditar ou atualizar a documentação de um projeto comparando-a com as funcionalidades, validações, testes e fluxos reais do código. Use quando pedirem para verificar se a documentação está atualizada, encontrar regras ausentes ou corrigir documentação desatualizada.
argument-hint: "[funcionalidade, área ou documento]"
---

# Verificar e atualizar documentação

Use esta skill para conferir documentação contra o comportamento implementado e, quando solicitado, atualizá-la sem alterar código de produção.

## Processo

1. **Defina o escopo e a intenção.** Identifique a funcionalidade, os documentos e se o pedido é apenas uma auditoria ou também uma atualização. Se o escopo impedir uma revisão confiável, pergunte antes de assumir.
2. **Leia os documentos existentes e examine o código atual.** Não trate a documentação como fonte de verdade. Siga os fluxos diretamente entre interface, componentes, domínio, serviços e persistência; consulte os testes para confirmar comportamentos e casos-limite. Não delegue uma revisão simples ou um único fluxo contínuo.
3. **Compare os comportamentos relevantes.** Verifique, conforme aplicável:
   - funcionalidades, ações e restrições visíveis ao usuário;
   - validações de campos, valores aceitos/rejeitados e regras de edição;
   - cálculos, agrupamentos e seus limites;
   - persistência, restauração, compatibilidade e estados padrão;
   - importação/exportação: estrutura, cabeçalhos, formatos, campos obrigatórios, confirmação, erros e preservação dos dados;
   - mensagens, requisitos de configuração e comandos documentados.
4. **Relate lacunas com precisão.** Separe conteúdo correto, conteúdo incompleto, afirmações contraditórias e comportamentos não documentados. Aponte os documentos e as seções relevantes. Não diga que todas as regras foram verificadas se algum fluxo ficou fora do escopo.
5. **Edite somente quando solicitado.** Faça mudanças mínimas nos documentos adequados: README para orientação de usuários, contexto do projeto para manutenção e histórico técnico, documentação de arquitetura quando camadas ou fluxos forem afetados. Preserve alterações existentes e não mude código para fazer a implementação coincidir com a documentação sem autorização.
6. **Valide o resultado.** Revise o diff, execute `git diff --check` e confira links relativos e exemplos modificados. Para alterações exclusivamente documentais, não rode a suíte de testes, salvo se o projeto tiver validação específica de documentação. Se também houver mudanças de código, rode os testes mais direcionados ao comportamento alterado.
7. **Resuma a entrega.** Informe o que estava atualizado, o que faltava ou divergia, quais arquivos foram alterados e quais verificações foram executadas ou não foram necessárias.

## Referências deste repositório

Ao trabalhar neste projeto, considere especialmente:

- `planilha-financeira/README.md` — funcionalidades e instruções para usuários;
- `CONTEXTO.md` — contexto técnico, funcionalidades atuais e histórico;
- `planilha-financeira/docs/arquitetura.md` — camadas, responsabilidades e fluxos;
- `planilha-financeira/docs/exemplo-planilha.csv` — exemplo concreto dos dados CSV.

Use os componentes e templates de `planilha-financeira/src/app/features/planilha/`, os utilitários compartilhados e seus testes como evidência do comportamento. Siga os caminhos de dados até os serviços de CSV e armazenamento quando revisar importação, exportação ou persistência.
