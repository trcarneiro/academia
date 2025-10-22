# 🔧 Google Ads Customer ID Format Fix - COMPLETE

**Data**: 17/10/2025 14:06  
**Status**: ✅ IMPLEMENTADO - Pronto para testar  
**Problema**: Erro `Cannot read properties of undefined (reading 'get')` ao sincronizar campanhas

---

## 📋 Diagnóstico Completo

### Erro Original
```
TypeError: Cannot read properties of undefined (reading 'get')
at Customer.getGoogleAdsError (node_modules/google-ads-api/build/src/service.js:102:49)
at Customer.querier (node_modules/google-ads-api/build/src/customer.js:286:41)
at Customer.query (node_modules/google-ads-api/build/src/customer.js:26:30)
```

### Causa Raiz Identificada
1. **Customer ID com formato incorreto**: `"411-893-6474"` (com hífens)
2. **API Google Ads espera**: `"4118936474"` (sem hífens)
3. **Efeito colateral**: API retorna erro, mas biblioteca não consegue processar objeto de erro undefined

### Config Status (Antes da Fix)
```json
{
  "hasClient": true,
  "hasCustomerId": true,
  "hasRefreshToken": true,
  "customerId": "411-893-6474"  ← FORMATO ERRADO
}
```

---

## 🔧 Mudanças Implementadas

### 1. Remoção de Hífens no Customer ID

**Arquivo**: `src/services/googleAdsService.ts`  
**Método**: `syncCampaigns()` - Linha ~225

#### Antes:
```typescript
const customer = this.client.Customer({
    customer_id: this.config.customerId,  // "411-893-6474" ❌
    refresh_token: this.config.refreshToken,
});
```

#### Depois:
```typescript
// Remove hyphens from customer ID (API expects format: 1234567890)
const cleanCustomerId = this.config.customerId.replace(/-/g, '');

logger.info('🔄 Creating Google Ads customer instance', {
    customerId: cleanCustomerId,  // "4118936474" ✅
    hasRefreshToken: !!this.config.refreshToken
});

const customer = this.client.Customer({
    customer_id: cleanCustomerId,
    refresh_token: this.config.refreshToken,
});
```

**Efeito**: Customer ID agora está no formato correto esperado pela API

---

### 2. Mensagens de Erro Específicas

**Arquivo**: `src/services/googleAdsService.ts`  
**Método**: `syncCampaigns()` catch block - Linha ~290

#### Antes:
```typescript
catch (error) {
    logger.error('❌ Error syncing campaigns', errorDetails);
    throw error;  // Erro genérico ❌
}
```

#### Depois:
```typescript
catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Log detalhado para diagnóstico
    logger.error('❌ Error syncing campaigns from Google Ads', errorDetails);
    console.error('[GOOGLE ADS SYNC ERROR]', JSON.stringify(errorDetails, null, 2));
    
    // Detectar tipos específicos de erro e fornecer mensagens acionáveis
    if (errorMessage.includes('Cannot read properties of undefined')) {
        throw new Error(
            '❌ Google Ads authentication failed. The refresh token may be expired or invalid. ' +
            'Please re-authorize the integration in CRM Settings.'
        );
    }
    
    if (errorMessage.includes('invalid_grant') || errorMessage.includes('Token expired')) {
        throw new Error(
            '❌ Google Ads refresh token is expired. Please re-authorize the integration in CRM Settings.'
        );
    }
    
    if (errorMessage.includes('Customer not found') || errorMessage.includes('Invalid customer')) {
        throw new Error(
            `❌ Google Ads Customer ID "${this.config?.customerId}" not found. ` +
            'Please verify the Customer ID in your Google Ads account.'
        );
    }
    
    throw error;  // Outros erros passam direto
}
```

**Efeito**: Usuário recebe mensagem clara e acionável em vez de erro técnico

---

## 🧪 Como Testar

### 1. Recarregue a Página
```
F5 no navegador → Limpa cache e recarrega JavaScript
```

### 2. Abra o Console do Navegador
```
F12 → Aba "Console"
```

### 3. Navegue até CRM Settings
```
Menu Lateral → "Configurações CRM" → Google Ads
```

### 4. Clique em "Sincronizar Campanhas"

---

## 📊 Cenários Possíveis

### Cenário A - Sucesso ✅ (Customer ID era o problema)
**Console Backend**:
```
🔄 Creating Google Ads customer instance
  customerId: "4118936474"
  hasRefreshToken: true
✅ Synced X campaigns from Google Ads
```

**Console Frontend**:
- Sem erros
- Notificação de sucesso aparece

**Próximo Passo**: Verificar se campanhas foram salvas no banco

---

### Cenário B - Refresh Token Expirado 🔑 (problema real)
**Console Backend**:
```
[GOOGLE ADS SYNC ERROR] {
  "message": "Cannot read properties of undefined (reading 'get')",
  ...
}
```

**Console Frontend**:
```
❌ Error syncing campaigns: 
Google Ads authentication failed. The refresh token may be expired or invalid.
Please re-authorize the integration in CRM Settings.
```

**Próximo Passo**:
1. Ir em CRM Settings → Google Ads
2. Clicar em "Conectar Google Ads"
3. Completar fluxo OAuth
4. Tentar sincronizar novamente

---

### Cenário C - Customer ID Inválido 🆔 (improvável)
**Console Frontend**:
```
❌ Google Ads Customer ID "411-893-6474" not found.
Please verify the Customer ID in your Google Ads account.
```

**Próximo Passo**:
1. Login no Google Ads → https://ads.google.com
2. Copiar Customer ID correto (topo direito, formato: XXX-XXX-XXXX)
3. Atualizar no banco de dados:
   ```sql
   UPDATE "GoogleAdsIntegration"
   SET "customerId" = 'NOVO-CUSTOMER-ID'
   WHERE "organizationId" = '452c0b35-1822-4890-851e-922356c812fb';
   ```

---

## 🔍 Verificação de Sucesso

### Backend Logs (Terminal)
Procure por:
```
✅ Synced X campaigns from Google Ads
  organizationId: "452c0b35-1822-4890-851e-922356c812fb"
```

### Database Check
```sql
SELECT 
    "id",
    "name",
    "status",
    "googleCampaignId",
    "impressions",
    "clicks"
FROM "GoogleAdsCampaign"
WHERE "organizationId" = '452c0b35-1822-4890-851e-922356c812fb'
ORDER BY "updatedAt" DESC;
```

**Esperado**: Campanhas com timestamps recentes

### Frontend
- Modal de sucesso aparece
- Lista de campanhas atualiza automaticamente
- Sem erros no console

---

## 📝 Mudanças nos Arquivos

### `src/services/googleAdsService.ts`

**Linhas ~225-232** - Customer ID formatting:
```typescript
+ // Remove hyphens from customer ID (API expects format: 1234567890)
+ const cleanCustomerId = this.config.customerId.replace(/-/g, '');
+ 
+ logger.info('🔄 Creating Google Ads customer instance', {
+     customerId: cleanCustomerId,
+     hasRefreshToken: !!this.config.refreshToken
+ });

  const customer = this.client.Customer({
-     customer_id: this.config.customerId,
+     customer_id: cleanCustomerId,
      refresh_token: this.config.refreshToken,
  });
```

**Linhas ~290-330** - Enhanced error handling:
```typescript
  catch (error) {
+     const errorMessage = error instanceof Error ? error.message : String(error);
      const errorDetails = {
-         message: error instanceof Error ? error.message : String(error),
+         message: errorMessage,
          ...
      };
      
      logger.error('❌ Error syncing campaigns from Google Ads', errorDetails);
      console.error('[GOOGLE ADS SYNC ERROR]', JSON.stringify(errorDetails, null, 2));
      
+     // Detect specific error types and provide actionable messages
+     if (errorMessage.includes('Cannot read properties of undefined')) {
+         throw new Error('❌ Google Ads authentication failed...');
+     }
+     
+     if (errorMessage.includes('invalid_grant') || errorMessage.includes('Token expired')) {
+         throw new Error('❌ Google Ads refresh token is expired...');
+     }
+     
+     if (errorMessage.includes('Customer not found') || errorMessage.includes('Invalid customer')) {
+         throw new Error(`❌ Google Ads Customer ID "${this.config?.customerId}" not found...`);
+     }
      
      throw error;
  }
```

---

## 🚀 Status

- ✅ Customer ID format fix implementado
- ✅ Error messages específicas adicionadas
- ✅ Logging melhorado para diagnóstico
- ✅ Server reiniciado com sucesso
- ⏳ Aguardando teste do usuário

---

## 📚 Contexto Adicional

### Por que Customer ID tinha hífens?
- Formato de exibição do Google Ads UI: `411-893-6474`
- Formato da API: `4118936474` (sem hífens)
- Causa: Usuário copiou direto da interface e salvou no banco

### Por que erro era obscuro?
- Google Ads API library retorna erro, mas objeto de erro estava undefined
- Library tentou acessar `error.get()` mas `error` era `undefined`
- Resultado: TypeError genérico que não revelava causa raiz

### Solução de longo prazo?
1. Adicionar validação no backend ao salvar Customer ID
2. Adicionar função helper para limpar formato:
   ```typescript
   function sanitizeCustomerId(id: string): string {
       return id.replace(/[^0-9]/g, '');
   }
   ```
3. Validar formato no frontend antes de salvar

---

## 🔗 Documentação Relacionada

- `CONSOLE_LOGS_FIX_COMPLETE.md` - Fix de org context warning
- `GOOGLE_ADS_SYNC_DIAGNOSTIC_UPDATE.md` - Enhanced error logging
- Google Ads API Docs: https://developers.google.com/google-ads/api/docs/start
- Customer ID Format: https://support.google.com/google-ads/answer/1704344

---

**Próximos Passos**:
1. ⏳ Usuário testar sincronização
2. ⏳ Reportar resultado (sucesso ou erro específico)
3. ⏳ Se erro persistir, seguir instruções do Cenário B (re-autorização OAuth)
