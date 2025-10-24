# 🔧 Fix Google OAuth - Adicionar Redirect URIs

## ❌ Problema Atual

Erro ao conectar Google Ads:
```
Error 400: redirect_uri_mismatch
Access blocked: Academia's request is invalid
```

**Causa raiz:** Google Cloud Console não tem os URIs de redirect necessários para a API do Google Ads.

---

## ✅ Solução Completa (5 minutos)

### **Passo 1: Acessar Google Cloud Console**

1. Abra: https://console.cloud.google.com/apis/credentials?project=gen-lang-client-0278886051
2. Clique no OAuth 2.0 Client ID: **Cliente Web 1** (ID: `692896555152-1vavst4k3i35hcjbdempgtm59keacp13.apps.googleusercontent.com`)

### **Passo 2: Adicionar URIs de Redirecionamento**

Na seção **"URIs de redirecionamento autorizados"**, adicione estas 2 linhas:

```
http://localhost:3000/api/google-ads/auth/callback
http://127.0.0.1:3000/api/google-ads/auth/callback
```

### **Passo 3: Resultado Final**

Você deve ter **3 URIs no total**:

```
✅ https://yawfuymgwukericlhgxh.supabase.co/auth/v1/callback  (para Supabase Auth)
✅ http://localhost:3000/api/google-ads/auth/callback         (para Google Ads API - localhost)
✅ http://127.0.0.1:3000/api/google-ads/auth/callback         (para Google Ads API - IP)
```

### **Passo 4: Salvar**

1. Clique em **"Salvar"** (botão azul no canto inferior esquerdo)
2. Aguarde 5-10 segundos para propagação
3. Volte para o CRM Module e clique em **"Connect to Google Ads"**

---

## 🧪 Como Testar

### **Teste 1: Verificar URIs Salvos**
1. Volte para a tela de credenciais no Google Cloud Console
2. Clique no Cliente OAuth 2.0
3. Confirme que os 3 URIs estão salvos

### **Teste 2: Conectar Google Ads**
1. No sistema, vá para: **CRM > Google Ads Settings**
2. Clique em **"Connect to Google Ads"**
3. Você deve ser redirecionado para a tela de autorização do Google
4. Após autorizar, você deve voltar para o sistema com conexão estabelecida

### **Teste 3: Verificar Logs**
Procure no console:
```javascript
[CONNECT] Starting Google Ads OAuth connection...
[CONNECT] Auth URL response: {success: true, data: {...}}
```

---

## 📊 Status Atual

### ✅ FUNCIONANDO:
- Credenciais persistem após F5 (Client ID, Secret, Developer Token, Customer ID)
- Backend retorna credenciais salvas do banco de dados
- Frontend popula formulário automaticamente
- Logs `[GOOGLE ADS] ✅` confirmam carregamento

### ❌ BLOQUEADO:
- OAuth flow para conectar Google Ads
- Erro: `redirect_uri_mismatch`
- Causa: Falta adicionar URIs no Google Cloud Console

---

## 🎯 Por Que Dois Sistemas OAuth?

Você tem **2 sistemas OAuth diferentes**:

### **1. Supabase Auth** (login do sistema)
- URI: `https://yawfuymgwukericlhgxh.supabase.co/auth/v1/callback`
- Uso: Autenticar usuários no sistema (email/senha)
- Status: ✅ Funcionando

### **2. Google Ads API** (integração marketing)
- URIs: `http://localhost:3000/api/google-ads/auth/callback`
- Uso: Conectar conta Google Ads para enviar conversões
- Status: ❌ Bloqueado (falta configurar URIs)

**Ambos usam o mesmo OAuth Client ID** do Google, mas com diferentes redirect URIs.

---

## 🔗 Links Úteis

- **Google Cloud Console (Credentials):** https://console.cloud.google.com/apis/credentials?project=gen-lang-client-0278886051
- **OAuth Consent Screen:** https://console.cloud.google.com/apis/credentials/consent?project=gen-lang-client-0278886051
- **Google Ads API Docs:** https://developers.google.com/google-ads/api/docs/oauth/overview

---

## 💡 Resumo para Devs

**Root Cause:** 
OAuth Client ID tinha apenas 1 redirect URI (Supabase), mas Google Ads API precisa de outro URI (localhost callback).

**Fix Applied:**
Adicionar `http://localhost:3000/api/google-ads/auth/callback` aos URIs autorizados no Google Cloud Console.

**Code Context:**
```typescript
// src/routes/googleAds.ts (linha ~50)
const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  'http://localhost:3000/api/google-ads/auth/callback' // ⬅️ Este URI precisa estar no GCP
);
```

**Frontend Trigger:**
```javascript
// public/js/modules/crm/index.js (linha ~1738)
async connectGoogleAds() {
  const response = await moduleAPI.get('/api/google-ads/auth/url');
  window.location.href = response.data.authUrl; // ⬅️ Redireciona para Google OAuth
}
```

---

## ✅ Checklist Final

Antes de testar conexão:
- [ ] Adicionar `http://localhost:3000/api/google-ads/auth/callback` no GCP
- [ ] Adicionar `http://127.0.0.1:3000/api/google-ads/auth/callback` no GCP
- [ ] Salvar alterações no Google Cloud Console
- [ ] Aguardar 5-10 segundos para propagação
- [ ] Clicar em "Connect to Google Ads" no CRM Module
- [ ] Autorizar acesso na tela do Google
- [ ] Verificar redirecionamento de volta ao sistema

---

**Última atualização:** 03/10/2025 - Fix de persistência de credenciais completo, aguardando configuração de URIs no GCP.
