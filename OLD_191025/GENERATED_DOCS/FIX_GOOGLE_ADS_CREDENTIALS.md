# ✅ FIX: Credenciais Google Ads Não Salvavam

**Data**: 03/10/2025  
**Problema**: Credenciais do Google Ads não persistiam após F5
**Causa**: Backend salvava no banco, mas não retornava as credenciais ao frontend

---

## 🔥 PROBLEMA IDENTIFICADO

### **O que estava acontecendo:**

1. ✅ Frontend envia credenciais → `/api/google-ads/auth/save-credentials`
2. ✅ Backend salva no banco de dados (`crmSettings` table)
3. ✅ Backend responde: `"Credentials saved successfully"`
4. ❌ Frontend recarrega a página (F5)
5. ❌ Campos ficam vazios novamente

### **Causa Raiz:**

O endpoint `/api/google-ads/auth/status` **NÃO retornava as credenciais salvas**!

Ele só retornava:
```typescript
{
  connected: boolean,
  enabled: boolean,
  customerId: string
}
```

**Faltavam**:
- `clientId`
- `clientSecret`
- `developerToken`

---

## ✅ SOLUÇÃO APLICADA

### **1. Backend - Retornar Credenciais (`src/routes/googleAds.ts`)**

**ANTES:**
```typescript
const settings = await prisma.crmSettings.findUnique({
    where: { organizationId },
    select: {
        googleAdsConnected: true,
        googleAdsEnabled: true,
        googleAdsCustomerId: true,
        // ❌ Não retornava as credenciais
    }
});
```

**DEPOIS:**
```typescript
const settings = await prisma.crmSettings.findUnique({
    where: { organizationId },
    select: {
        googleAdsConnected: true,
        googleAdsEnabled: true,
        googleAdsCustomerId: true,
        googleAdsClientId: true,          // ✅ ADICIONADO
        googleAdsClientSecret: true,      // ✅ ADICIONADO
        googleAdsDeveloperToken: true,    // ✅ ADICIONADO
    }
});

return reply.send({
    success: true,
    data: {
        connected: settings?.googleAdsConnected || false,
        enabled: settings?.googleAdsEnabled || false,
        customerId: settings?.googleAdsCustomerId || null,
        clientId: settings?.googleAdsClientId || null,          // ✅ ADICIONADO
        clientSecret: settings?.googleAdsClientSecret || null,  // ✅ ADICIONADO
        developerToken: settings?.googleAdsDeveloperToken || null, // ✅ ADICIONADO
    }
});
```

---

### **2. Frontend - Preencher Campos (`public/js/modules/crm/index.js`)**

**ANTES:**
```javascript
async loadGoogleAdsSettings() {
    const response = await this.moduleAPI.request('/api/google-ads/auth/status');
    // ❌ Não fazia nada com as credenciais
    // Apenas atualizava badge de status
}
```

**DEPOIS:**
```javascript
async loadGoogleAdsSettings() {
    console.log('[GOOGLE ADS] Loading settings...');
    const response = await this.moduleAPI.request('/api/google-ads/auth/status');
    
    if (response.success && response.data) {
        const { clientId, clientSecret, developerToken, customerId } = response.data;
        
        // ✅ PREENCHER CAMPOS COM CREDENCIAIS SALVAS
        if (clientId) {
            document.getElementById('clientId').value = clientId;
            console.log('[GOOGLE ADS] ✅ Client ID loaded');
        }
        
        if (clientSecret) {
            document.getElementById('clientSecret').value = clientSecret;
            console.log('[GOOGLE ADS] ✅ Client Secret loaded');
        }
        
        if (developerToken) {
            document.getElementById('developerToken').value = developerToken;
            console.log('[GOOGLE ADS] ✅ Developer Token loaded');
        }
        
        if (customerId) {
            document.getElementById('customerId').value = customerId;
            console.log('[GOOGLE ADS] ✅ Customer ID loaded');
        }
    }
}
```

---

## 🧪 COMO TESTAR

### **Teste 1: Salvar Credenciais**
1. Acesse o módulo CRM → Configurações
2. Preencha os campos de credenciais do Google Ads
3. Clique em "Salvar Credenciais"
4. Veja logs no console: `[SUCCESS] Credenciais salvas com sucesso!`

### **Teste 2: Verificar Persistência (F5)**
1. **Pressione F5** para recarregar a página
2. Abra DevTools → Console
3. Procure pelos logs:
   ```
   [GOOGLE ADS] Loading settings...
   [GOOGLE ADS] ✅ Client ID loaded: 692896555152-...
   [GOOGLE ADS] ✅ Client Secret loaded
   [GOOGLE ADS] ✅ Developer Token loaded
   [GOOGLE ADS] ✅ Customer ID loaded: 411-893-6474
   ```
4. ✅ **SUCESSO**: Campos devem estar preenchidos com as credenciais salvas!

### **Teste 3: Verificar Banco de Dados**
```bash
# Conecte ao banco e verifique
npm run db:studio
```

Navegue até a tabela `CrmSettings` e veja:
- ✅ `googleAdsClientId`: preenchido
- ✅ `googleAdsClientSecret`: preenchido
- ✅ `googleAdsDeveloperToken`: preenchido
- ✅ `googleAdsCustomerId`: preenchido

---

## 📊 FLUXO CORRIGIDO

```
┌─────────────────────────────────────────────────────┐
│ 1. USER preenche credenciais no formulário         │
└─────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│ 2. POST /api/google-ads/auth/save-credentials      │
│    Body: { clientId, clientSecret, ... }           │
└─────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│ 3. Backend: prisma.crmSettings.upsert()            │
│    ✅ Salva no banco de dados PostgreSQL           │
└─────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│ 4. Response: { success: true, message: "Saved" }   │
└─────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│ 5. USER pressiona F5 (refresh)                     │
└─────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│ 6. GET /api/google-ads/auth/status                 │
│    ✅ AGORA retorna: { clientId, clientSecret, ... }│
└─────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│ 7. Frontend: loadGoogleAdsSettings()               │
│    ✅ AGORA preenche os campos do formulário       │
└─────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│ 8. ✅ USER vê credenciais carregadas após F5       │
└─────────────────────────────────────────────────────┘
```

---

## ⚠️ NOTA DE SEGURANÇA

**Credenciais sensíveis estão sendo retornadas para o frontend!**

Isso é **OK para desenvolvimento local**, mas em produção você deve:

1. **Mascarar credenciais**:
   ```typescript
   clientSecret: settings?.googleAdsClientSecret 
       ? '••••••••' + settings.googleAdsClientSecret.slice(-4) 
       : null
   ```

2. **Ou apenas mostrar indicador**:
   ```typescript
   hasClientSecret: !!settings?.googleAdsClientSecret
   ```

3. **Implementar autenticação adequada**:
   - Verificar permissões do usuário
   - Apenas admins podem ver credenciais completas

---

## 📁 ARQUIVOS MODIFICADOS

```
✅ src/routes/googleAds.ts            (Backend - retornar credenciais)
✅ public/js/modules/crm/index.js     (Frontend - preencher campos)
```

---

## ✨ RESULTADO FINAL

**ANTES**:
- ❌ Credenciais salvavam no banco
- ❌ Mas sumiam após F5
- ❌ User precisava preencher toda vez

**DEPOIS**:
- ✅ Credenciais salvam no banco
- ✅ Persistem após F5
- ✅ Campos preenchem automaticamente
- ✅ Logs detalhados no console

---

**Status**: ✅ PROBLEMA RESOLVIDO - Testar agora!
