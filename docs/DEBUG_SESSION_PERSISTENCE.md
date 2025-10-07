# 🔧 DEBUG: Credenciais Não Salvam Após F5

**Data**: 03/10/2025  
**Problema**: Mesmo com `persistSession: true`, as credenciais não persistem

---

## 🧪 PASSO A PASSO DE DIAGNÓSTICO

### **PASSO 1: Testar LocalStorage Básico** (2 minutos)

Abra: http://localhost:3000/test-auth.html

✅ **Deve mostrar**:
- ✅ LocalStorage está FUNCIONANDO
- ✅ Supabase client está inicializado
- ℹ️ Nenhuma sessão ativa (se nunca fez login)

❌ **Se der erro aqui**: LocalStorage está bloqueado no navegador

**Solução se bloqueado:**
1. Chrome: `chrome://settings/content/cookies`
2. Permitir cookies e dados de sites
3. Ou teste em janela anônima

---

### **PASSO 2: Fazer Login e Verificar Logs** (3 minutos)

1. Abra http://localhost:3000
2. Abra DevTools (F12) → Console
3. Faça login com email/senha

**Logs esperados:**
```
🔐 [LOGIN] Attempting login with email: seu@email.com
🔐 ✅ Login successful!
🔐 [DEBUG] Session data: { userId: '...', email: '...', hasAccessToken: true }
🔐 ✅ Token saved to localStorage
🔐 [DEBUG] Token verification: ✅ Saved
🔐 ⚡ [AUTH STATE CHANGE] SIGNED_IN with session
🔐 ✅ User signed in or token refreshed!
🔐 ✅ Token saved to localStorage: eyJhbGc...
🔐 [DEBUG] Token verification: ✅ Saved successfully
```

❌ **Se NÃO ver esses logs**: O problema está no código

---

### **PASSO 3: Verificar LocalStorage Após Login** (1 minuto)

1. Após login, abra DevTools → Application → Local Storage
2. Procure por `http://localhost:3000`

**Deve ter:**
```
✅ token: eyJhbGc...
✅ sb-yawfuymgwukericlhgxh-auth-token: {...}
✅ sb-yawfuymgwukericlhgxh-auth-token-code-verifier: ...
```

❌ **Se NÃO tiver `sb-yawfuymgwukericlhgxh-auth-token`**:
- Supabase não está salvando a sessão
- `persistSession: true` não está funcionando

---

### **PASSO 4: Testar F5 (Refresh)** (1 minuto)

1. Após login bem-sucedido, pressione **F5**
2. Observe os logs no console

**Logs esperados:**
```
🔐 [DEBUG] Checking session...
🔐 [DEBUG] Session check result: { hasSession: true, hasError: false }
🔐 ✅ Existing session found!
🔐 [DEBUG] Session details: { userId: '...', email: '...', expiresAt: '...' }
🔐 ✅ Token saved to localStorage
🔐 User already logged in, redirecting to dashboard...
```

❌ **Se mostrar `hasSession: false`**: Supabase perdeu a sessão

---

## 🐛 CAUSAS COMUNS

### **Causa 1: LocalStorage Bloqueado**
**Sintomas:**
- Erro ao salvar em localStorage
- `test-auth.html` mostra erro

**Solução:**
```javascript
// Teste no console:
try {
    localStorage.setItem('test', '123');
    console.log('✅ localStorage funciona');
} catch (e) {
    console.error('❌ localStorage bloqueado:', e);
}
```

---

### **Causa 2: Supabase Client Sem Persistência**
**Sintomas:**
- Login funciona mas F5 perde sessão
- Logs mostram "No existing session"

**Verificar:**
```javascript
// No console, após carregar a página:
console.log('Supabase storage:', window.supabaseClient?.auth._storage);
// Deve mostrar: SupabaseAuthClient { ... }
```

**Corrigir:**
```javascript
// Deve estar assim em public/js/modules/auth/index.js
supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,      // ⭐ CRUCIAL
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: window.localStorage // ⭐ CRUCIAL
  }
});
```

---

### **Causa 3: Domínio Incorreto**
**Sintomas:**
- Login funciona em `localhost:3000`
- Mas perde sessão em `127.0.0.1:3000`

**Causa:**
- LocalStorage é separado por domínio
- `localhost` ≠ `127.0.0.1`

**Solução:**
- Use sempre o MESMO domínio (prefira `localhost:3000`)

---

### **Causa 4: Cookies de Terceiros Bloqueados**
**Sintomas:**
- Google OAuth não funciona
- Erro de CORS

**Solução:**
1. Chrome: Configurações → Privacidade e segurança
2. Permitir cookies de terceiros temporariamente
3. Ou adicionar exceção para Supabase

---

### **Causa 5: Cache do Navegador**
**Sintomas:**
- Mudanças no código não aparecem

**Solução:**
```
Ctrl + Shift + Delete → Limpar cache
ou
Usar DevTools → Network → Disable cache (checkbox)
```

---

## 🔬 TESTES AVANÇADOS

### **Teste 1: Verificar Supabase Storage no Backend**

```bash
# Verificar configuração do backend
cd h:\projetos\academia
grep -n "persistSession" src/utils/supabase.ts
```

**Deve mostrar:**
```typescript
persistSession: true,
```

---

### **Teste 2: Forçar Salvamento Manual**

Adicione no final de `handleLogin()`:

```javascript
// Forçar salvamento Supabase
await supabaseClient.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token
});

console.log('🔐 [DEBUG] Session forcefully set');
```

---

### **Teste 3: Verificar Supabase Dashboard**

1. Acesse: https://app.supabase.com/
2. Projeto: `yawfuymgwukericlhgxh`
3. Navegue: Authentication → Users
4. Verifique se o usuário está criado
5. Navegue: Authentication → Providers → Google
6. Verifique se está ATIVADO

---

## ✅ CHECKLIST DE VALIDAÇÃO

Execute **NA ORDEM**:

- [ ] **1.** `test-auth.html` mostra localStorage funcionando
- [ ] **2.** Login mostra logs `✅ Token saved to localStorage`
- [ ] **3.** DevTools → Application → Local Storage tem `sb-...auth-token`
- [ ] **4.** F5 mostra `🔐 ✅ Existing session found!`
- [ ] **5.** Continua logado após F5 (não volta para login)

Se **TODOS** passarem: ✅ Problema resolvido!

Se **ALGUM** falhar: Veja a seção correspondente acima.

---

## 📊 MATRIZ DE DIAGNÓSTICO

| Sintoma | Causa Provável | Solução |
|---------|----------------|---------|
| localStorage bloqueado | Configurações navegador | Permitir cookies/dados |
| Login funciona mas F5 perde | `persistSession: false` | Ativar em frontend/backend |
| Google OAuth não funciona | redirect_uri não configurado | Adicionar URIs no Google Console |
| Logs mostram erro CORS | Cookies terceiros bloqueados | Permitir Supabase |
| Mudanças código não aparecem | Cache navegador | Limpar cache |
| Sessão expira rápido | `autoRefreshToken: false` | Ativar renovação automática |

---

## 🚨 ÚLTIMO RECURSO

Se **NADA** funcionar:

```bash
# 1. Parar servidor
Ctrl + C

# 2. Limpar TUDO
cd h:\projetos\academia
rm -rf node_modules
rm package-lock.json
npm cache clean --force

# 3. Reinstalar
npm install

# 4. Rebuild
npm run build

# 5. Restart
npm run dev
```

Depois:
1. Abra janela anônima
2. Limpe localStorage: `localStorage.clear()`
3. Teste novamente

---

## 📞 PRÓXIMOS PASSOS

1. ✅ Execute os testes acima NA ORDEM
2. ✅ Compartilhe os logs do console
3. ✅ Informe qual teste falhou primeiro

**Isso ajudará a identificar o problema exato!**
