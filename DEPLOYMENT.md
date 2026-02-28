# Guia de Publicação - Vigilância em Ação

Este documento explica como publicar a aplicação em diferentes plataformas.

---

## 🌐 Opção 1: Publicar no Manus (Recomendado)

O Manus é a plataforma nativa onde o projeto foi desenvolvido. É a forma mais simples e rápida.

### Passo 1: Abrir o Painel de Gerenciamento
- Clique no ícone de menu no canto superior direito do chat
- Você verá o painel de gerenciamento do projeto à direita

### Passo 2: Clicar em "Publish"
- No topo do painel de gerenciamento, clique no botão **"Publish"**
- O sistema vai gerar um link permanente no formato: `seu-projeto.manus.space`

### Passo 3: (Opcional) Configurar Domínio Personalizado
- Vá para **Settings > Domains**
- Você pode:
  - Comprar um novo domínio (ex: `vigilancia.votuporanga.sp.gov.br`)
  - Vincular um domínio existente
  - Usar o domínio automático do Manus

**Pronto!** Sua aplicação está no ar com um link fixo e permanente.

---

## 🚀 Opção 2: Publicar no Railway

Railway é uma plataforma moderna que suporta aplicações full-stack.

### Passo 1: Fazer Push para GitHub
```bash
git push origin main
```

### Passo 2: Conectar ao Railway
1. Acesse [railway.app](https://railway.app)
2. Clique em "New Project"
3. Selecione "Deploy from GitHub"
4. Escolha o repositório `vigilancia-em-acao`

### Passo 3: Configurar Variáveis de Ambiente
No painel do Railway, vá para **Variables** e adicione:
```
DATABASE_URL=sua-url-mysql
JWT_SECRET=seu-secret
VITE_APP_ID=seu-app-id
OAUTH_SERVER_URL=https://api.manus.im
... (veja .env.example)
```

### Passo 4: Deploy
Railway faz deploy automático quando você faz push para GitHub.

**Link da aplicação**: Railway gera um link automático (ex: `seu-projeto.railway.app`)

---

## 🎯 Opção 3: Publicar no Render

Render também suporta aplicações full-stack com banco de dados.

### Passo 1: Fazer Push para GitHub
```bash
git push origin main
```

### Passo 2: Conectar ao Render
1. Acesse [render.com](https://render.com)
2. Clique em "New +"
3. Selecione "Web Service"
4. Conecte sua conta GitHub
5. Escolha o repositório `vigilancia-em-acao`

### Passo 3: Configurar
- **Build Command**: `pnpm install && pnpm build`
- **Start Command**: `pnpm start`
- **Environment**: Node
- **Plan**: Escolha um plano pago (free tier não suporta banco de dados)

### Passo 4: Adicionar Banco de Dados
1. No Render, crie um novo **MySQL Database**
2. Copie a `DATABASE_URL` gerada
3. Adicione todas as variáveis de ambiente (veja .env.example)

**Link da aplicação**: Render gera um link automático (ex: `seu-projeto.onrender.com`)

---

## 📦 Opção 4: Publicar no Vercel (Não Recomendado)

**Aviso**: Vercel é otimizado para aplicações estáticas/serverless. Como Vigilância em Ação é full-stack com banco de dados, não é o melhor fit, mas é possível com serverless functions.

---

## ✅ Checklist Pré-Publicação

Antes de publicar, verifique:

- [ ] Todos os testes passam: `pnpm test`
- [ ] Sem erros de build: `pnpm build`
- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados criado e migrado
- [ ] Google Maps API key configurada (se usar mapa customizado)
- [ ] S3 credentials configuradas (para upload de fotos)
- [ ] Email SMTP configurado (para notificações)

---

## 🔍 Testando Antes de Publicar

```bash
# Instalar dependências
pnpm install

# Rodar testes
pnpm test

# Build production
pnpm build

# Iniciar servidor (simula production)
pnpm start
```

---

## 🐛 Troubleshooting

### Erro 404 no GitHub Pages
**Causa**: GitHub Pages é apenas para sites estáticos. Vigilância em Ação é full-stack.
**Solução**: Use Manus, Railway, Render ou outro serviço que suporte Node.js + banco de dados.

### Erro de conexão ao banco de dados
**Causa**: `DATABASE_URL` incorrea ou banco não acessível
**Solução**: Verifique a URL, firewall e permissões de acesso

### Erro de variáveis de ambiente não definidas
**Causa**: Faltam variáveis no servidor
**Solução**: Adicione todas as variáveis listadas em `.env.example`

### Aplicação lenta ou timeout
**Causa**: Plano gratuito com recursos limitados
**Solução**: Upgrade para um plano pago ou use Manus (que já está otimizado)

---

## 📞 Suporte

- **Manus**: Suporte integrado no painel
- **Railway**: [railway.app/support](https://railway.app/support)
- **Render**: [render.com/docs](https://render.com/docs)

---

**Recomendação**: Use **Manus** para a publicação inicial. É a forma mais simples, rápida e já está totalmente configurada.
