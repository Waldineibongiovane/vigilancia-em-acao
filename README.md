# Vigilância em Ação

**Plataforma de Monitoramento e Combate à Dengue para Votuporanga/SP**

Uma solução moderna e acessível para vigilância epidemiológica colaborativa, permitindo que cidadãos denunciem focos de dengue e gestores acompanhem dados em tempo real com análises geradas por inteligência artificial.

---

## 🎯 Funcionalidades Principais

### Público
- **Dashboard Epidemiológico**: KPIs em tempo real (casos confirmados, óbitos, em investigação, denúncias)
- **Mapa Interativo**: Visualização de focos por bairro com marcadores coloridos por nível de risco
- **Formulário de Denúncias**: Registro de focos com upload de fotos, protocolo único e rastreamento
- **Boletins Epidemiológicos**: Análises semanais geradas por IA com tendências e recomendações
- **Página de Transparência**: Histórico de denúncias resolvidas e estatísticas de resposta

### Administrativo (Protegido por Autenticação)
- **Gestão de Denúncias**: Aprovar, rejeitar, arquivar com notas administrativas
- **Edição de Dados**: Atualizar métricas epidemiológicas manualmente
- **Geração de Boletins**: Criar boletins automáticos ou manuais com análise de IA
- **Configurações**: Gerenciar limites de risco e outras preferências
- **Auditoria**: Rastreamento completo de todas as ações administrativas

---

## 🛠️ Stack Tecnológico

- **Frontend**: React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui
- **Backend**: Express 4 + tRPC 11 + Node.js
- **Banco de Dados**: MySQL/TiDB com Drizzle ORM
- **Mapas**: Google Maps JavaScript API
- **Storage**: AWS S3 (fotos de denúncias)
- **IA**: LLM para classificação de denúncias e geração de boletins
- **Autenticação**: Manus OAuth
- **Testes**: Vitest (21 testes passando)

---

## 📋 Requisitos

- Node.js 22+
- pnpm 10+
- MySQL/TiDB database
- Variáveis de ambiente configuradas (veja `.env.example`)

---

## 🚀 Como Executar Localmente

### 1. Clonar o Repositório
```bash
git clone https://github.com/seu-usuario/vigilancia-em-acao.git
cd vigilancia-em-acao
```

### 2. Instalar Dependências
```bash
pnpm install
```

### 3. Configurar Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz do projeto:
```env
DATABASE_URL=mysql://user:password@localhost:3306/vigilancia
JWT_SECRET=seu-secret-aqui
VITE_APP_ID=seu-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=sua-chave-api
VITE_FRONTEND_FORGE_API_KEY=sua-chave-frontend
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
```

### 4. Executar Migrações do Banco
```bash
pnpm db:push
```

### 5. Iniciar o Servidor de Desenvolvimento
```bash
pnpm dev
```

A aplicação estará disponível em `http://localhost:3000`

---

## 📦 Estrutura do Projeto

```
vigilancia-em-acao/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── pages/            # Páginas (Home, Mapa, Denúncias, etc)
│   │   ├── components/       # Componentes reutilizáveis
│   │   ├── lib/              # Utilitários (tRPC client, etc)
│   │   └── index.css         # Tema global
│   └── index.html
├── server/                    # Backend Node.js
│   ├── routers.ts            # Endpoints tRPC
│   ├── db.ts                 # Query helpers
│   ├── storage.ts            # S3 helpers
│   └── _core/                # Framework interno
├── drizzle/                   # Schema e migrações
│   └── schema.ts
├── shared/                    # Código compartilhado
├── package.json
└── README.md
```

---

## 🧪 Testes

Executar suite completa de testes:
```bash
pnpm test
```

Os testes cobrem:
- Rotas públicas (dashboard, métricas, boletins)
- Controle de acesso administrativo
- Criação e consulta de denúncias
- Rate limiting
- Estatísticas

---

## 🔒 Segurança & LGPD

- **Dados Pessoais**: Ocultos na visualização pública, visíveis apenas no painel administrativo
- **Rate Limiting**: Proteção contra spam no formulário de denúncias (5 requisições/minuto por IP)
- **Autenticação**: Requer login para acessar painel administrativo
- **Auditoria**: Todas as ações administrativas são registradas com timestamp e usuário
- **Upload Seguro**: Fotos armazenadas em S3 com URLs públicas e validação de tipo MIME

---

## 🚢 Publicação

### Opção 1: Manus (Recomendado)
A aplicação já está configurada para rodar no Manus. Clique no botão **"Publish"** no painel de gerenciamento.

### Opção 2: Railway, Render ou Heroku
1. Faça push do código para GitHub
2. Conecte o repositório ao serviço de hosting
3. Configure as variáveis de ambiente
4. Deploy automático será acionado

---

## 📝 Documentação de API

Todas as rotas usam **tRPC** e são tipadas automaticamente. Veja `server/routers.ts` para a lista completa.

### Exemplos Públicos
```typescript
// Dashboard
trpc.dashboard.summary.useQuery()

// Métricas
trpc.metrics.list.useQuery({ limit: 30 })

// Denúncias
trpc.complaints.create.useMutation()
trpc.complaints.lookup.useQuery({ protocol: "VA-2026-XXXXX" })

// Boletins
trpc.bulletins.list.useQuery()
```

### Exemplos Administrativos
```typescript
// Requer autenticação + role admin
trpc.admin.complaints.list.useQuery()
trpc.admin.metrics.create.useMutation()
trpc.admin.bulletins.generate.useMutation()
```

---

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📄 Licença

MIT License - veja LICENSE.md para detalhes

---

## 📞 Suporte

Para dúvidas ou problemas, abra uma issue no GitHub ou entre em contato com a equipe de vigilância sanitária de Votuporanga.

---

**Desenvolvido com ❤️ para a saúde pública de Votuporanga/SP**
