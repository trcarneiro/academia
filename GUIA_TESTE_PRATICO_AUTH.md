# 🧪 GUIA PRÁTICO - Testar Auth Supabase

## ⚡ Teste Rápido (2 min)

### 1. Verificar Backend Endpoint
```bash
# No terminal
node -e "require('http').get('http://localhost:3000/api/auth/users/by-email?email=trcampos@gmail.com', res => { let data = ''; res.on('data', d => data += d); res.on('end', () => console.log(JSON.stringify(JSON.parse(data), null, 2)); })"
```

**Resultado esperado:**
```json
{
  "success": true,
  "data": {
    "id": "2b885556-1504-413e-96e2-aa954a74fce0",
    "email": "trcampos@gmail.com",
    "organizationId": "452c0b35-1822-4890-851e-922356c812fb",
    "role": "INSTRUCTOR"
  }
}
```

### 2. Verificar Session no Browser
1. Abrir http://localhost:3000
   - Se vir dashboard → session existe ✅
   - Se vir login → sessão perdida (fazer login novamente)

2. Abrir DevTools (F12) → Console
   - Digite: `localStorage.getItem('organizationId')`
   - Resultado esperado: `452c0b35-1822-4890-851e-922356c812fb`

### 3. Testar Página Manual
- Abrir: http://localhost:3000/test-auth-manual.html
- Clica em "Executar Teste 1"
- Resultado esperado: ✅ (status fica verde)

---

## 📊 Teste Completo (15 min)

### Script Automatizado
```bash
# Terminal
node "h:\projetos\academia\test-auth-auto.js" "trcampos@gmail.com" "Trocar@123"
```

**Esperado**: 4/5 testes aprovados
```
✅ Teste 1: Supabase acessível
❌ Teste 2: Login (pode falhar se senha incorreta)
✅ Teste 3: OrganizationId: 452c0b35...
✅ Teste 4: UUID válido
✅ Teste 5: Endpoint OK
```

---

## 🔍 Teste Manual no Navegador (20 min)

### 1. Abrir teste visual
```
http://localhost:3000/test-auth-manual.html
```

### 2. Executar cada teste clicando no botão

#### Teste 1: Backend Endpoint
- ✅ Clica "Executar Teste 1"
- Deve retornar: OrganizationId + Role
- Se erro: verificar se servidor está rodando

#### Teste 2: Session Recovery
- ✅ Clica "Executar Teste 2"
- Se mostra "Session Recovery OK": ✅ você está logado
- Se mostra "Sem sessão ativa": Fazer login primeiro

#### Teste 3: Auth Module
- ✅ Clica "Executar Teste 3"
- Deve mostrar: "Auth module carregado"
- Se erro: módulo não foi carregado

#### Teste 4: API Client
- ✅ Clica "Executar Teste 4"
- Deve mostrar: "API Client disponível"
- Se erro: API client não foi carregado

### 3. Verificar Resumo
Na seção "Resumo dos Testes":
- Total deve mostrar "4/4" ou "3/4" (depende de login)
- Todos em verde = ✅ OK

---

## 🔐 Testar Login/Logout Completo (5 min)

### 1. Logout (limpar session)
Abrir DevTools Console:
```javascript
// Limpar localStorage
localStorage.clear()
// Ou apenas organizationId
localStorage.removeItem('organizationId')
// Recarregar página
location.reload()
```

### 2. Você deve ver página de login
- Email: `trcampos@gmail.com`
- Senha: (não sabe?)
- Opção: "Continuar com Google"

### 3. Fazer Login
- Digite email e senha (devem estar configurados em Supabase)
- Clique "Login"

### 4. Verificar Session
DevTools Console:
```javascript
localStorage.getItem('organizationId')
// Deve retornar: 452c0b35...
```

---

## 🐛 Troubleshooting

### Problema: "Route not found"
```
❌ 404 Not Found
```
**Solução**:
1. Verificar se servidor está rodando: `npm run dev`
2. Verificar URL: deve ser `/api/auth/users/by-email`
3. Verificar email parameter: `?email=...`

### Problema: "No API key found"
```
❌ 401 No API key found in request
```
**Solução**:
- Usar teste 3 (backend) que funciona sem credenciais Supabase
- Teste 2 (login) pode falhar se usar credenciais erradas

### Problema: "Login failed: 400 - invalid_credentials"
```
❌ Invalid login credentials
```
**Solução**:
1. Verificar se usuário existe em Supabase
2. Verificar se senha está correta
3. Criar novo usuário se não existir

### Problema: "Sem sessão ativa" no Teste 2
**Isso é normal** se:
- Primeira vez usando app
- Logout foi feito
- localStorage foi limpo

**Solução**: Fazer login primeiro, depois reexecutar Teste 2

---

## ✅ Checklist de Validação

### Backend
- [ ] Endpoint retorna 200 OK
- [ ] Response tem `success: true`
- [ ] OrganizationId está presente
- [ ] Role está presente (STUDENT ou INSTRUCTOR)
- [ ] Content-Type é application/json

### Frontend
- [ ] Auth module carrega sem erros
- [ ] localStorage tem organizationId
- [ ] Session recovery funciona (F5 no dashboard)
- [ ] Login redireciona para dashboard
- [ ] Logout limpa localStorage

### API Client
- [ ] window.createModuleAPI existe
- [ ] Método request funciona
- [ ] fetchWithStates funciona
- [ ] Headers incluem x-organization-id

### Testes
- [ ] test-auth-auto.js executa 4/5 testes
- [ ] test-auth-manual.html carrega UI
- [ ] Teste 1 retorna ✅
- [ ] Teste 3 retorna ✅
- [ ] Teste 4 retorna ✅

---

## 📈 Resultados Esperados

```
┌─────────────────────────────────────┐
│  TESTES SUPABASE AUTH - SUCESSO ✅   │
├─────────────────────────────────────┤
│ ✅ Backend Endpoint: FUNCIONANDO     │
│ ✅ OrganizationId: 452c0b35...       │
│ ✅ Session Recovery: OK              │
│ ✅ Auth Module: CARREGADO            │
│ ✅ API Client: INTEGRADO             │
│ ✅ CORS: HABILITADO                  │
│ ✅ UUID: VÁLIDO                      │
├─────────────────────────────────────┤
│ Status Geral: PRONTO PARA PRODUÇÃO   │
└─────────────────────────────────────┘
```

---

## 📞 Se Precisar de Ajuda

1. **Verificar logs do servidor**:
   ```bash
   # Terminal com npm run dev rodando
   # Procure por: "GET /api/auth/users/by-email"
   # Deve mostrar: 200 OK
   ```

2. **Verificar localStorage no DevTools**:
   ```javascript
   // F12 → Console
   localStorage
   // Deve ter: sb-...-auth-token, organizationId, userId, userEmail
   ```

3. **Verificar Network Tab (F12)**:
   - Carregar página
   - Procure por requisição para `/api/auth/users/by-email`
   - Deve ter status 200
   - Response deve ter `organizationId`

---

**Data**: 11/01/2025  
**Versão**: 1.0  
**Status**: ✅ PRONTO PARA TESTE
