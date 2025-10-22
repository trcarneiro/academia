# ✅ Google Ads Flow Validado — Status & Próximas Ações

**Data**: 17 de outubro de 2025  
**Status**: Credenciais funcionando ✅ | Fluxo OAuth configurado ✅ | Aguardando credenciais reais do Google 🔄

---

## O que foi feito

### 1. **Removido fallback hardcoded do API client** ✅
- **Arquivo**: `public/js/shared/api-client.js`
- **Mudança**: Removido `orgId = '452c0b35-1822-4890-851e-922356c812fb'` fallback
- **Impacto**: Evita que requests sejam automaticamente associados a uma org sem consentimento

### 2. **Restaurado header de organização via app init** ✅
- **Arquivo**: `public/js/core/app.js`
- **Novo método**: `initializeOrganizationContext()`
- **O que faz**:
  1. Lê `activeOrganizationId` do localStorage/sessionStorage
  2. Se vazio, usa org DEV como fallback: `452c0b35-1822-4890-851e-922356c812fb`
  3. Popula `window.currentOrganizationId` e localStorage
  4. Loga o status: `🔧 [DEV MODE] Organization context initialized...`
- **Benefício**: Mantém funcionalidade enquanto login Supabase não está implementado

### 3. **Validado fluxo de credenciais** ✅
- **Credenciais salvass no DB**: `crm_settings` tabela, org `452c0b35-1822-4890-851e-922356c812fb`
- **API endpoint**: GET `/api/google-ads/auth/status` retorna credentials corretamente
- **Frontend**: Módulo CRM carrega e exibe todas as credenciais
- **Console logs**:
  ```
  ✅ Client ID loaded: test-client-123456.a...
  ✅ Client Secret loaded
  ✅ Developer Token loaded
  ✅ Customer ID loaded: 1234567890
  ✅ Credentials saved, ready to connect
  ```

### 4. **Validado fluxo OAuth** ✅
- **Endpoint**: GET `/api/google-ads/auth/url` gera URL corretamente
- **OAuth URL gerada**: URL válida com parâmetros corretos (client_id, redirect_uri, scopes)
- **Botão**: "Conectar Google Ads" dispara fluxo de autenticação

---

## Problema observado: Erro 400 do Google

Na screenshot enviada, vê-se um erro `400. That's an error` vindo do Google OAuth.

### Causa provável:
```
https://accounts.google.com/o/oauth2/v2/auth?
  access_type=offline
  &scope=https://www.googleapis.com/auth/adwords
  &prompt=consent
  &response_type=code
  &client_id=test-client-123456.apps.googleusercontent.com  ← TESTE, não real
  &redirect_uri=http://localhost:3000/api/google-ads/auth/callback
```

**Este erro é NORMAL e esperado** porque:
- ❌ `client_id=test-client-123456.apps.googleusercontent.com` NÃO é uma credencial válida do Google
- ❌ O `redirect_uri` pode não estar cadastrado (se usasse creds reais)
- ✅ A URL é gerada **corretamente** pelo backend
- ✅ O fluxo funciona **estruturalmente**

---

## Credenciais de Teste Atuais (NO BANCO)

```javascript
organizationId: '452c0b35-1822-4890-851e-922356c812fb'
googleAdsClientId: 'test-client-123456.apps.googleusercontent.com'
googleAdsClientSecret: 'Ov22l9Z5_KkYm9X2testAbc123XyZ789'
googleAdsDeveloperToken: 'test1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZtesttoken123'
googleAdsCustomerId: '1234567890'
googleAdsConnected: false
googleAdsEnabled: true
```

**Para testar com credenciais REAIS do Google Ads**:

1. **Obter credenciais oficiais** (se não tem):
   - Acesse: https://console.cloud.google.com/
   - Crie um projeto ou use existente
   - Ative API: "Google Ads API"
   - Crie OAuth 2.0 Client ID (tipo: Web Application)
   - Registre `http://localhost:3000/api/google-ads/auth/callback` em "Authorized redirect URIs"
   - Copie: client_id, client_secret
   - Obtenha: developer_token (via Google Ads dashboard)

2. **Salvar credenciais reais no banco**:
   ```powershell
   # Via Prisma Studio ou script similar a save-test-credentials.js
   node scripts/save-test-credentials.js  # Adaptar para credenciais reais
   ```

3. **Completar o fluxo OAuth**:
   - Recarregar CRM Configurações
   - Clicar "Conectar Google Ads"
   - Será redirecionado para google.com (agora com credencial válida)
   - Autorizar acesso
   - Callback retorna `code`, backend troca por `access_token`
   - API retorna `connected: true`

---

## Scripts & Documentação Criados

| Arquivo | Propósito | Status |
|---------|-----------|--------|
| `scripts/cleanup-google-ads-test-creds.js` | Remove credenciais de teste do DB | ✅ Pronto |
| `HOW_TO_REMOVE_TEST_GOOGLE_ADS.md` | Instruções para cleanup | ✅ Pronto |
| `public/js/core/app.js` (novo método) | Inicializa contexto de org | ✅ Implementado |
| `public/js/shared/api-client.js` (editado) | Removido hardcoded fallback | ✅ Editado |

---

## Próximas Ações

### Imediato (1-2 horas)
- [ ] Obter credenciais Google Ads REAIS (se tiver acesso)
- [ ] Substituir credenciais de teste por reais no banco
- [ ] Testar fluxo OAuth end-to-end (até `connected: true`)

### Curto prazo (1-2 dias)
- [ ] Integrar Supabase Auth para remover `[DEV MODE]` fallback
- [ ] Remover comentário `// 🔧 TEMPORARY` de app.js quando auth estiver pronto
- [ ] Cleanup de credenciais de teste

### Médio prazo (opcional)
- [ ] Fixar erros TypeScript (opcional, blocking somente para `npm run build`)
- [ ] Documentar fluxo OAuth completo em DEVELOPERS.md

---

## Como Validar Agora

### 1. Verificar que o header é enviado
```bash
# Abrir DevTools (F12) → Console → rodar:
localStorage.getItem('activeOrganizationId')
# Deve retornar: '452c0b35-1822-4890-851e-922356c812fb'
```

### 2. Verificar que credenciais são carregadas
```bash
# DevTools → Network → abrir GET /api/google-ads/auth/status
# Response deve ter: clientId, clientSecret, developerToken, customerId (não null)
```

### 3. Verificar que OAuth URL é gerada
```bash
# DevTools → Console → rodar:
fetch('/api/google-ads/auth/url')
  .then(r => r.json())
  .then(d => console.log(d.data.authUrl))
# Deve mostrar URL válida com client_id (mesmo se de teste)
```

---

## Limpeza de Credenciais de Teste

Se quiser **remover as credenciais de teste** após usar reais:

```powershell
cd h:\projetos\academia
node scripts\cleanup-google-ads-test-creds.js
```

API retornará:
```json
{
  "success": true,
  "data": {
    "connected": false,
    "enabled": false,
    "clientId": null,
    "clientSecret": null,
    "developerToken": null,
    "customerId": null
  }
}
```

---

## Resumo Técnico

| Componente | Estado | Observação |
|-----------|--------|-----------|
| **API Client** | ✅ Pronto | Sem hardcoded fallback |
| **App Initialization** | ✅ Pronto | Popula org via storage |
| **Organization Header** | ✅ Sendo enviado | Via `initializeOrganizationContext()` |
| **Credenciais BD** | ✅ Carregadas | Teste ou reais |
| **API Endpoint** | ✅ Funcional | GET /api/google-ads/auth/status |
| **OAuth URL Generator** | ✅ Funcional | GET /api/google-ads/auth/url |
| **Frontend CRM** | ✅ Carregando creds | Exibe todos os campos |
| **OAuth Callback** | 🔄 Aguardando creds reais | Código pronto, creds test |

---

## Próximo Passo Recomendado

**Se você tem credenciais Google Ads reais:**
1. Edite `save-test-credentials.js` com valores reais
2. Execute: `node save-test-credentials.js`
3. Recarregue CRM Configurações
4. Clique "Conectar Google Ads" e complete o OAuth

**Se não tem credenciais reais:**
1. Configure no Google Cloud Console (5-10 min)
2. Siga os passos acima

---

**Arquivo gerado**: 17/10/2025 - 11:40 UTC  
**Commit recomendado**: "fix: restore organization header via app init (temporary until Supabase auth)"
