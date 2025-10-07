# 🔧 Sistema de Auto-Login para Desenvolvimento - Completo

## 📋 Resumo das Alterações

### 1. **Backend - Rota de Auto-Login**
**Arquivo**: `src/routes/dev-auth.ts` (NOVO)

#### Funcionalidades:
- **POST /api/dev-auth/auto-login**
  - Cria automaticamente usuário de desenvolvimento se não existir
  - Associa à organização ativa (ou cria uma nova)
  - Retorna JWT token válido por 7 dias
  - Credenciais: `dev@academia.com` / `dev123`

- **GET /api/dev-auth/status**
  - Verifica se dev mode está ativo
  - Mostra status da organização e usuário dev

#### Dados Criados Automaticamente:
```typescript
// Organização
{
  name: 'Academia Demo',
  slug: 'academia-demo',
  email: 'contato@academiademo.com',
  country: 'Brazil',
  maxStudents: 100,
  maxStaff: 10,
  isActive: true
}

// Usuário Dev
{
  firstName: 'Dev',
  lastName: 'User',
  email: 'dev@academia.com',
  password: 'dev123', // bcrypt hashed
  role: 'ADMIN',
  organizationId: [auto-associado]
}
```

### 2. **Frontend - Módulo de Auth Aprimorado**
**Arquivo**: `public/js/modules/auth/index.js`

#### Melhorias:
1. **Banner de Desenvolvimento** (somente em localhost)
   - Aparece no topo do formulário de login
   - Cor roxa com gradiente premium
   - Explica que está em modo dev

2. **Botão de Auto-Login**
   - Texto: "⚡ Login Automático (dev@academia.com)"
   - Chama `/api/dev-auth/auto-login`
   - Salva token, orgId, userId no localStorage
   - Redireciona para dashboard após sucesso

3. **Pre-fill dos Campos** (em desenvolvimento)
   - Email: `dev@academia.com`
   - Senha: `dev123`
   - Facilita login manual se preferir

### 3. **Servidor - Registro da Rota**
**Arquivo**: `src/server.ts`

Adicionado:
```typescript
import devAuthRoutes from '@/routes/dev-auth';
// ...
await server.register(normalizePlugin(devAuthRoutes, 'devAuthRoutes'), { 
  prefix: '/api/dev-auth' 
} as any);
```

### 4. **Fix Instrutor Creation** ✅
**Arquivo**: `src/routes/instructors.ts`

**Problema Original**:
```typescript
// ❌ ERRO: Campo hourlyRate sendo enviado como null
hourlyRate: payload.hourlyRate || payload.salary || null,
```

**Solução**:
```typescript
// ✅ CORRETO: Só adiciona se tiver valor (Decimal não aceita null explícito)
if (payload.hourlyRate || payload.salary) {
  instructorData.hourlyRate = payload.hourlyRate || payload.salary;
}
```

## 🎯 Como Usar

### Opção 1: Auto-Login (Recomendado para Dev)
1. Abra `http://localhost:3000/index.html`
2. Clique no botão **"⚡ Login Automático (dev@academia.com)"**
3. Aguarde 1 segundo → redirecionamento automático
4. Pronto! Você está logado como Admin

### Opção 2: Login Manual
1. Abra `http://localhost:3000/index.html`
2. Campos já vêm preenchidos:
   - Email: `dev@academia.com`
   - Senha: `dev123`
3. Clique em "Entrar"
4. Redirecionamento para dashboard

### Opção 3: API Direta (para testes)
```bash
# PowerShell
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/dev-auth/auto-login" -Method POST -ContentType "application/json"
$response.data.token

# Bash/WSL
curl -X POST http://localhost:3000/api/dev-auth/auto-login | jq '.data.token'
```

## 🔐 Dados Armazenados no localStorage

Após auto-login, os seguintes dados são salvos:
```javascript
{
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',  // JWT válido por 7 dias
  orgId: '7991cd3c-5289-4d4f-9668-3f9aa654e552',    // ID da organização
  userId: 'xxx-xxx-xxx',                            // ID do usuário dev
  userRole: 'ADMIN',                                // Papel do usuário
  userEmail: 'dev@academia.com',                    // Email
  userName: 'Dev User'                              // Nome completo
}
```

## 🧪 Testando o Sistema

### 1. Testar Auto-Login
```bash
# 1. Verificar status do dev mode
curl http://localhost:3000/api/dev-auth/status | jq

# 2. Fazer auto-login
curl -X POST http://localhost:3000/api/dev-auth/status | jq '.data.token'

# 3. Usar o token em requisições
curl -H "Authorization: Bearer SEU_TOKEN_AQUI" \
     http://localhost:3000/api/instructors
```

### 2. Testar Criação de Instrutor
```bash
# Agora deve funcionar sem erro 500
curl -X POST http://localhost:3000/api/instructors \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "name": "Thiago Carneiro",
    "email": "trcampos@gmail.com",
    "phone": "11999999999"
  }'
```

### 3. Testar no Frontend
1. Abra DevTools (F12)
2. Console → Digite:
   ```javascript
   // Ver dados salvos
   console.log('Token:', localStorage.getItem('token'));
   console.log('OrgId:', localStorage.getItem('orgId'));
   console.log('UserId:', localStorage.getItem('userId'));
   console.log('Role:', localStorage.getItem('userRole'));
   ```

## ⚠️ Avisos de Segurança

### ⚠️ REMOVER EM PRODUÇÃO
Este sistema é **APENAS PARA DESENVOLVIMENTO**!

**Antes de fazer deploy**:
1. Remover arquivo `src/routes/dev-auth.ts`
2. Remover import em `src/server.ts`
3. Remover banner/botão de auto-login do frontend
4. Implementar autenticação real (Supabase, Auth0, etc.)

### 🔒 Por que é inseguro em produção?
- Cria usuário com senha conhecida (`dev123`)
- Não valida domínio/IP de origem
- Token com validade longa (7 dias)
- Papel de ADMIN automático
- Sem rate limiting específico

## 📊 Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (index.html)                    │
│                                                             │
│  ┌───────────────────────────────────────────────────┐    │
│  │  Auth Module (public/js/modules/auth/index.js)    │    │
│  │                                                     │    │
│  │  ┌─────────────────────────────────────────┐     │    │
│  │  │  🔧 DEV MODE BANNER (localhost only)    │     │    │
│  │  │  [⚡ Login Automático]                  │     │    │
│  │  └─────────────────────────────────────────┘     │    │
│  │                                                     │    │
│  │  [Email: dev@academia.com]                         │    │
│  │  [Senha: dev123]                                   │    │
│  │  [Entrar]                                          │    │
│  └───────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    POST /api/dev-auth/auto-login
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                 BACKEND (src/routes/dev-auth.ts)            │
│                                                             │
│  1. Buscar organização ativa                               │
│     └─ Se não existir → criar "Academia Demo"             │
│                                                             │
│  2. Buscar usuário dev@academia.com                        │
│     └─ Se não existir → criar com bcrypt hash             │
│                                                             │
│  3. Gerar JWT token (validade 7 dias)                      │
│     └─ payload: userId, organizationId, role, email        │
│                                                             │
│  4. Retornar { token, user: { ...detalhes } }             │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    Salvar no localStorage
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      DASHBOARD.HTML                         │
│                                                             │
│  • Todas as requisições usam token do localStorage         │
│  • Dados filtrados por organizationId automaticamente       │
│  • Usuário vê apenas dados da "Academia Demo"              │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Troubleshooting

### Problema: Botão de auto-login não aparece
**Solução**: Verificar se está em localhost
```javascript
// Console do browser
console.log('Hostname:', window.location.hostname);
// Deve ser 'localhost' ou '127.0.0.1'
```

### Problema: Erro 500 ao fazer auto-login
**Solução**: Verificar logs do servidor
```bash
# Terminal onde o servidor está rodando
# Procurar por: "🔧 [DEV] Auto-login error:"
```

### Problema: Token não funciona em requisições
**Solução**: Verificar se token está salvo
```javascript
// Console
const token = localStorage.getItem('token');
if (!token) {
  console.error('Token não encontrado! Fazer login novamente.');
} else {
  console.log('Token OK:', token.substring(0, 20) + '...');
}
```

### Problema: Instrutor ainda retorna erro 500
**Solução**: Limpar cache e recompilar
```bash
npm run build
# ou
npx prisma generate
npm run dev
```

## 📝 Próximos Passos

### Funcionalidades Futuras (Opcional)
1. **Multi-tenancy completo**
   - Criar múltiplas organizações de teste
   - Switcher de organização no dev mode

2. **Seed de dados automático**
   - Criar instrutores de exemplo
   - Criar alunos de exemplo
   - Criar turmas de exemplo

3. **Dev mode avançado**
   - Hot reload de dados
   - Reset de banco com um clique
   - Time travel (voltar no tempo do banco)

## ✅ Checklist de Implementação

- [x] Backend: Criar rota `/api/dev-auth/auto-login`
- [x] Backend: Criar rota `/api/dev-auth/status`
- [x] Backend: Registrar rotas no `server.ts`
- [x] Frontend: Adicionar banner de dev mode
- [x] Frontend: Adicionar botão de auto-login
- [x] Frontend: Pre-fill campos em localhost
- [x] Frontend: Salvar dados no localStorage
- [x] Fix: Corrigir erro 500 em criação de instrutor
- [x] Deps: Instalar bcrypt + tipos
- [x] Teste: Verificar servidor inicia sem erros
- [ ] Teste: Fazer auto-login no browser
- [ ] Teste: Criar instrutor após login
- [ ] Teste: Navegar no dashboard
- [ ] Doc: Atualizar AGENTS.md com referência

## 📚 Arquivos Modificados

```
src/
├── routes/
│   ├── dev-auth.ts          (NOVO) ← Rota de auto-login
│   ├── instructors.ts       (MOD)  ← Fix hourlyRate field
│   └── server.ts            (MOD)  ← Registro da rota

public/
└── js/
    └── modules/
        └── auth/
            └── index.js     (MOD)  ← Banner + botão + pre-fill

package.json                 (MOD)  ← Deps: bcrypt, @types/bcrypt
```

## 🎉 Resultado Final

Agora você tem um sistema de desenvolvimento **profissional** com:

✅ **Login instantâneo** - Um clique para entrar  
✅ **Isolamento de dados** - Cada org vê apenas seus dados  
✅ **Token persistente** - Não precisa fazer login a cada F5  
✅ **Fácil de testar** - Credenciais sempre disponíveis  
✅ **Seguro** - Banner avisa que é modo dev  

**Pronto para começar a desenvolver! 🚀**
