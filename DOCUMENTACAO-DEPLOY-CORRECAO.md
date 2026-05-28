# Documentação: Processo de Correção do Deploy Netlify

## Resumo do Problema
O deploy inicial no Netlify falhava com erro **404 - Página não encontrada**, mesmo que o build fosse bem-sucedido localmente.

## Causas Identificadas

### 1. **Arquivo `@angular/cli` não instalado no build**
- **Erro**: `sh: 1: ng: not found`
- **Causa**: O Netlify não estava conseguindo rodar o comando `ng build` porque as dependências não eram instaladas
- **Solução**: Adicionar `npm ci` ao comando de build

### 2. **Diretório de publicação incorreto**
- **Erro**: Configuração apontava para `dist/planilha-financeira/browser`, mas os arquivos estavam em `dist/planilha-financeira/browser/browser`
- **Causa**: Estrutura de output do Angular 19 com a configuração específica do projeto
- **Solução**: Atualizar o caminho no `netlify.toml` para o local correto

### 3. **Falta de configuração de SPA (Single Page Application)**
- **Erro**: Rotas do Angular Router não funcionavam, causando 404 em refresh/navegação direta
- **Causa**: Netlify não sabia que precisava redirecionar todas as rotas para `index.html`
- **Solução**: Criar arquivo `_redirects` em `public/` com regra de redirect

### 4. **Repositório privado**
- **Erro**: Netlify pode não conseguir acessar o código
- **Solução**: Mudar repositório para **público**

## Solução Implementada

### Passo 1: Atualizar `netlify.toml` (na raiz do projeto)

```toml
[build]
command = "cd planilha-financeira && npm ci && npm run build"
publish = "planilha-financeira/dist/planilha-financeira/browser/browser"

[[redirects]]
from = "/*"
to = "/index.html"
status = 200

[context.production.environment]
NODE_VERSION = "18"
```

**O que cada linha faz:**
- `command`: Muda para a pasta do app, instala dependências com `npm ci` (mais seguro para CI/CD) e faz build
- `publish`: Aponta para a pasta correta com os arquivos compilados
- `[[redirects]]`: Redireciona todas as rotas para `index.html` (necessário para Angular SPA)
- `NODE_VERSION`: Especifica versão do Node.js (compatível com Angular 19)

### Passo 2: Criar arquivo `_redirects` em `planilha-financeira/public/`

```
/*    /index.html   200
```

**Por que é necessário:**
- Netlify lê este arquivo durante o build
- Copia o arquivo para o diretório de publicação
- Configura as regras de roteamento no CDN
- Permite que o Angular Router funcione corretamente

### Passo 3: Verificar `package.json` e `package-lock.json`

✅ Confirmado que `@angular/cli` está presente em `devDependencies`
✅ `package-lock.json` commitado no Git

### Passo 4: Deixar repositório público

- Acessar repositório no GitHub
- **Settings → Danger Zone → Change visibility → Public**

## Verificação Local

Antes de fazer push, é importante verificar se o build local funciona corretamente:

```bash
cd planilha-financeira
npm ci
npm run build
```

Verificar se os arquivos foram gerados:
```bash
ls dist/planilha-financeira/browser/browser/
# Deve conter: index.html, _redirects, main-*.js, polyfills-*.js, etc.
```

## Fluxo de Deploy Final

1. **Local**: Fazer changes no código
2. **Git**: Commit e push para branch `main`
   ```bash
   git add .
   git commit -m "sua mensagem"
   git push origin main
   ```
3. **Netlify**: Build automático (acionado pelo webhook do GitHub)
4. **Resultado**: Site disponível em `https://planilha-interativa.netlify.app`

## Estrutura Final de Arquivos Importantes

```
PlanilhaInterativa/
├── netlify.toml                          # Configuração do Netlify (raiz!)
├── planilha-financeira/
│   ├── package.json                      # Dependências
│   ├── package-lock.json                 # Lock de dependências
│   ├── angular.json                      # Config Angular
│   ├── public/
│   │   ├── favicon.ico
│   │   └── _redirects                    # Regra de roteamento SPA
│   ├── src/
│   │   ├── main.ts
│   │   ├── index.html
│   │   ├── styles.css
│   │   └── app/
│   └── dist/
│       └── planilha-financeira/
│           └── browser/
│               └── browser/              # Arquivos publicados aqui
│                   ├── index.html
│                   ├── _redirects        # (copiado automaticamente)
│                   ├── main-*.js
│                   └── ...
```

## Checklist para Futuros Problemas

- [ ] `netlify.toml` está na **raiz** do repositório (não dentro de `planilha-financeira/`)
- [ ] Comando de build inclui `npm ci && npm run build`
- [ ] Diretório `publish` aponta para `browser/browser`
- [ ] `_redirects` existe em `public/`
- [ ] `@angular/cli` está em `devDependencies` do `package.json`
- [ ] `package-lock.json` está commitado
- [ ] Repositório está **público**
- [ ] Node.js version está definida (18+)

## Dicas de Performance

O `netlify.toml` pode ser expandido com headers de cache (opcional):

```toml
[[headers]]
  for = "/index.html"
  [headers.values]
    Cache-Control = "public, max-age=3600, must-revalidate"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

## Referências

- [Documentação do Netlify - SPA](https://answers.netlify.com/t/support-guide-i-ve-deployed-my-site-but-i-still-see-page-not-found/125)
- [Angular - Deployment](https://angular.io/guide/deployment)
- [Netlify Build Configuration](https://docs.netlify.com/configure-builds/overview/)
