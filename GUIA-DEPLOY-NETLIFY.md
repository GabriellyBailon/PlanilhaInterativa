# Guia de Deploy no Netlify

## Pré-requisitos

- Conta no [Netlify](https://netlify.com) (gratuita)
- Repositório Git (GitHub, GitLab ou Bitbucket) com o código
- Node.js 18+ e npm instalados localmente

## Opção 1: Deploy via Git (Recomendado)

### 1. Push do código para repositório remoto
```bash
git init
git add .
git commit -m "Initial commit com configurações do Netlify"
git branch -M main
git remote add origin https://github.com/seu-usuario/seu-repositorio.git
git push -u origin main
```

### 2. Conectar no Netlify
- Acesse [netlify.com](https://netlify.com) e faça login
- Clique em **"Add new site" → "Import an existing project"**
- Selecione seu Git provider (GitHub, GitLab, Bitbucket)
- Escolha o repositório `PlanilhaInterativa` (ou o nome que deu)

### 3. Configurar settings de build
- **Base directory**: `planilha-financeira`
- **Build command**: `npm run build`
- **Publish directory**: `dist/planilha-financeira/browser`
- Clique em **"Deploy site"**

O Netlify construirá e publicará automaticamente a cada push na branch `main`.

**Nota**: As configurações estão automatizadas no arquivo `netlify.toml` - não é necessário configurar manualmente.

---

## Opção 2: Deploy Manual (sem Git)

### 1. Build localmente
```bash
cd planilha-financeira
npm install
npm run build
```

### 2. Arrastar pasta para Netlify
- Acesse [app.netlify.com](https://app.netlify.com)
- Arraste a pasta `dist/planilha-financeira` para a seção de deploy
- Ou use o comando via CLI (veja abaixo)

---

## Opção 3: Deploy via Netlify CLI

### 1. Instalar Netlify CLI
```bash
npm install -g netlify-cli
```

### 2. Autenticar
```bash
netlify login
```

### 3. Build e Deploy
```bash
cd planilha-financeira
npm run build
netlify deploy --prod --dir=dist/planilha-financeira
```

---

## Verificar o Deploy

- O site estará disponível em uma URL como `https://seu-site.netlify.app`
- Acesse a URL e teste as funcionalidades:
  - Registrar entradas/saídas
  - Verificar se o gráfico carrega
  - Testar persistência de dados (localStorage)
  - Validar formatação monetária em Real (R$)

---

## Troubleshooting

### 404 ao recarregar página
✅ **Resolvido**: O arquivo `netlify.toml` já redireciona `/* → /index.html` para o Angular router funcionar.

### Dados desaparecem ao fazer deploy
✅ **Normal**: Dados em `localStorage` são específicos do navegador/domínio. Ao trocar domínio, dados antigos não aparecem. Usuários podem exportar dados antes de trocar.

### Build falha por timeout
- Aumentar o tempo no Netlify: **Site settings → Build & deploy → Timeout**
- Usar cache de build: Netlify cacheia dependências automaticamente

### Variáveis de ambiente
Se precisar de variáveis (API keys, etc):
1. No Netlify dashboard: **Site settings → Build & deploy → Environment**
2. Adicionar variáveis `VAR_NAME=value`
3. No build, usar `process.env.VAR_NAME` (Angular com SSR) ou injetar no `index.html`

---

## Domínio customizado

1. **Site settings → Domain management**
2. **Add custom domain**
3. Seguir instruções de DNS do seu provedor
4. Certificado SSL é automático (Let's Encrypt)

---

## Otimizações de Performance ⚡

O arquivo `netlify.toml` já contém configurações otimizadas:

### Cache Headers
- **Assets estáticos** (`/assets/*`): Cache de 1 ano (arquivos com hash imutável)
- **Bundles JavaScript** (`*.bundle.js`): Cache de 1 ano
- **index.html**: Cache de 1 hora (permite atualizações sem hard refresh)

### Security Headers
- **X-Frame-Options**: Previne clickjacking
- **X-Content-Type-Options**: Bloqueia MIME sniffing
- **X-XSS-Protection**: Proteção contra XSS
- **Referrer-Policy**: Controla informações de referência

### Versão Node.js
- Node.js 18.20.0 (LTS estável e compatível com Angular 19)
- npm 10.5.0

---

## Próximos passos

- Ativar **branch deploys** em **Site settings** para testar PRs
- Configurar **redirects** customizadas se precisar de rotas específicas
- Habilitar **built-in Analytics** para monitorar uso
