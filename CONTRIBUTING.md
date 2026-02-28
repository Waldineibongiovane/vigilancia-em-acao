# Guia de Contribuição - Vigilância em Ação

Obrigado por querer contribuir com o projeto! Este guia explica como fazer isso.

---

## 🎯 Como Contribuir

### 1. Fork e Clone
```bash
git clone https://github.com/seu-usuario/vigilancia-em-acao.git
cd vigilancia-em-acao
```

### 2. Criar uma Branch
```bash
git checkout -b feature/sua-feature
# ou
git checkout -b fix/seu-bug
```

### 3. Fazer Mudanças
- Edite os arquivos necessários
- Siga os padrões de código do projeto
- Adicione testes para novas funcionalidades

### 4. Testar Localmente
```bash
pnpm install
pnpm dev          # Servidor de desenvolvimento
pnpm test         # Executar testes
pnpm build        # Build production
```

### 5. Commit e Push
```bash
git add .
git commit -m "Descrição clara da mudança"
git push origin feature/sua-feature
```

### 6. Abrir Pull Request
- Vá para GitHub e clique em "New Pull Request"
- Descreva o que foi mudado e por quê
- Aguarde revisão

---

## 📝 Padrões de Código

### TypeScript
- Use tipos explícitos sempre que possível
- Evite `any`
- Prefira interfaces sobre types para objetos

### React
- Use functional components
- Prefira hooks ao invés de classes
- Mantenha componentes pequenos e focados

### Testes
- Escreva testes para funcionalidades críticas
- Use Vitest para testes unitários
- Mantenha cobertura acima de 80%

### Commits
- Use mensagens claras em português
- Exemplo: `feat: adicionar filtro de datas ao dashboard`
- Tipos: `feat`, `fix`, `docs`, `style`, `refactor`, `test`

---

## 🗂️ Estrutura de Pastas

```
client/src/
├── pages/          # Páginas (rotas)
├── components/     # Componentes reutilizáveis
├── lib/            # Utilitários
├── contexts/       # React contexts
└── hooks/          # Custom hooks

server/
├── routers.ts      # Endpoints tRPC
├── db.ts           # Query helpers
└── _core/          # Framework interno
```

---

## 🔄 Workflow de Desenvolvimento

### Adicionar Nova Funcionalidade

1. **Criar tabela no banco** (se necessário)
   - Edite `drizzle/schema.ts`
   - Execute `pnpm db:push`

2. **Criar query helper** em `server/db.ts`
   - Exemplo: `async function getComplaintsByNeighborhood(id: number)`

3. **Criar router** em `server/routers.ts`
   - Use `publicProcedure` ou `adminProcedure`
   - Valide inputs com Zod

4. **Criar componente** em `client/src/components/`
   - Use shadcn/ui quando possível
   - Importe com `@/components/...`

5. **Criar página** em `client/src/pages/`
   - Registre a rota em `App.tsx`
   - Use `trpc.*.useQuery/useMutation`

6. **Escrever testes** em `server/*.test.ts`
   - Teste casos de sucesso e erro
   - Execute `pnpm test`

7. **Commit e Push**
   - Mensagem clara: `feat: adicionar filtro por bairro`

---

## 🧪 Testando

### Executar Todos os Testes
```bash
pnpm test
```

### Executar Teste Específico
```bash
pnpm test -- server/routers.test.ts
```

### Modo Watch
```bash
pnpm test -- --watch
```

---

## 📚 Recursos

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [tRPC Documentation](https://trpc.io)
- [Drizzle ORM](https://orm.drizzle.team)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)

---

## ⚠️ Regras Importantes

- **Nunca** faça commit de `.env` ou dados sensíveis
- **Sempre** escreva testes para código crítico
- **Sempre** atualize documentação se mudar comportamento
- **Sempre** execute `pnpm test` antes de fazer push
- **Nunca** use `console.log` em produção (use `console.error` para logs)

---

## 🐛 Reportando Bugs

Se encontrar um bug:

1. Verifique se já não foi reportado
2. Abra uma issue com:
   - Descrição clara do problema
   - Passos para reproduzir
   - Comportamento esperado vs atual
   - Screenshots (se aplicável)

---

## 💡 Sugestões de Melhorias

Ideias para contribuir:

- [ ] Adicionar suporte a múltiplos idiomas
- [ ] Melhorar performance do mapa
- [ ] Adicionar gráficos mais avançados
- [ ] Integração com sistemas de saúde externos
- [ ] App mobile (React Native)
- [ ] Documentação em vídeo
- [ ] Testes E2E (Cypress/Playwright)

---

## 📞 Dúvidas?

- Abra uma issue no GitHub
- Pergunte em discussões do projeto
- Entre em contato com os mantenedores

---

**Obrigado por contribuir! 🙏**
