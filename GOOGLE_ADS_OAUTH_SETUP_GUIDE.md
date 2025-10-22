# 🔐 Google Ads CRM Integration - Setup & Validation Guide

**Data**: 16/10/2025  
**Objetivo**: Validar OAuth flow + Implementar Phase 1 (Real-time Sync Dashboard)

---

## 📋 CHECKLIST - Credenciais Google Ads

Você precisa obter do Google Cloud Console:

```
☐ GOOGLE_ADS_CLIENT_ID=
   Origem: Google Cloud Console → OAuth Credentials → Web application
   Padrão: "xxxxx.apps.googleusercontent.com"

☐ GOOGLE_ADS_CLIENT_SECRET=
   Origem: Mesmo lugar, copiar "Client secret"

☐ GOOGLE_ADS_DEVELOPER_TOKEN=
   Origem: Google Ads → Settings → API Center
   Nota: Token pessoal ou de gerenciador

☐ GOOGLE_ADS_CUSTOMER_ID=
   Origem: Google Ads → Settings → Account
   Padrão: "1234567890" (sem hífen, só números)

☐ GOOGLE_ADS_CONVERSION_ACTION= (Opcional, pode ser criado depois)
   Origem: Google Ads → Tools → Conversions
   Formato: "customers/1234567890/conversionActions/123456789"
```

---

## 🚀 FASE 1: Setup do Environment

### Passo 1: Adicionar ao `.env`

```env
# Google Ads Integration (CRM Module)
GOOGLE_ADS_CLIENT_ID=seu-client-id.apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET=seu-client-secret
GOOGLE_ADS_DEVELOPER_TOKEN=seu-developer-token
GOOGLE_ADS_CUSTOMER_ID=1234567890
GOOGLE_ADS_REDIRECT_URI=http://localhost:3000/api/google-ads/auth/callback
GOOGLE_ADS_CONVERSION_ACTION=customers/1234567890/conversionActions/123456789
```

### Passo 2: Testar Compilação

```bash
npm run build
npm run dev
```

### Passo 3: Verificar Endpoints no Swagger

```
http://localhost:3000/docs
Procurar por: /api/google-ads/auth/url
```

---

## 🔑 FASE 2: Validar OAuth Flow

### Teste 1: Gerar URL de OAuth

```bash
curl http://localhost:3000/api/google-ads/auth/url
```

**Resposta esperada:**
```json
{
  "success": true,
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?client_id=xxx&redirect_uri=..."
}
```

### Teste 2: Clicar no link da resposta

1. Abrir URL retornada no navegador
2. Autorizar acesso ao Google Ads
3. Ser redirecionado para: `http://localhost:3000/crm?tab=settings&success=google-ads-connected`
4. Verificar no banco se tokens foram salvos:

```sql
SELECT * FROM crm_settings 
WHERE google_ads_connected = true;
```

### Teste 3: Sincronizar Campanhas

```bash
npm run sync:google-ads
```

**Saída esperada:**
```
🚀 Starting Google Ads automatic synchronization...
✅ Connection OK
📊 Syncing campaigns...
✅ Synced 5 campaigns
📊 Syncing ad groups...
✅ Synced 12 ad groups
📊 Syncing keywords...
✅ Synced 45 keywords
✅ Sync completed successfully
```

---

## 📊 FASE 3: Real-time Sync Dashboard (Frontend)

### Arquivo para Editar: `public/js/modules/crm/index.js`

**Adicionar nova vista "settings" com:**

#### 3.1 Sync Status Card
```javascript
renderSyncStatus() {
  // Mostrar:
  // - Last sync time
  // - Campaigns synced count
  // - Keywords synced count
  // - Conversions uploaded count
  // - Status indicator (🟢 synced, 🟡 syncing, 🔴 error)
  // - Button "Sync Now"
}
```

#### 3.2 Campaign Performance Widget
```javascript
renderCampaignPerformance() {
  // Mostrar top 5 campanhas por ROI:
  // Campaign Name | Impressions | Clicks | Cost | Conversions | ROI%
  // Como table com cells coloridas (ROI > 100% = 🟢)
}
```

#### 3.3 Connection Status
```javascript
renderConnectionStatus() {
  // Mostrar:
  // ✅ Google Ads Connected
  // 📅 Last sync: 2 hours ago
  // 🔄 Auto-sync: Enabled (every 6 hours)
  // 📊 Metrics: XXX campaigns, YYY keywords, ZZZ conversions
}
```

---

## 🔗 FASE 4: Implementar Webhook Conversion Tracking

### Backend: `src/routes/crm.ts`

**Modificar endpoint**: `POST /api/crm/leads/:id/convert`

```typescript
/**
 * POST /api/crm/leads/:id/convert - Convert lead to student
 * NOVO: Upload conversion to Google Ads automatically
 */
fastify.post('/leads/:id/convert', async (request, reply) => {
  try {
    // ... existing code ...
    
    // NOVO: Upload conversion to Google Ads
    if (lead.gclid && settings?.googleAdsConnected) {
      try {
        const googleAdsService = new GoogleAdsService(organizationId);
        await googleAdsService.uploadConversion(leadId);
        
        // Log audit trail
        await prisma.leadActivity.create({
          data: {
            leadId,
            type: 'CONVERSION_UPLOADED',
            outcome: 'SUCCESS',
            description: `Conversion uploaded to Google Ads (gclid: ${lead.gclid})`
          }
        });
      } catch (error) {
        logger.warn(`Failed to upload conversion to Google Ads: ${error.message}`);
        // Não falhar a conversão, apenas log
      }
    }
    
    // ... rest of response ...
  }
});
```

---

## 🧪 Testes Manual (CRM UI)

1. **Ir para**: http://localhost:3000/#/crm

2. **Clicar na aba**: ⚙️ Configurações

3. **Ver seção**: Google Ads Integration
   - ✅ Status: Connected (verde)
   - 📊 Last sync: 2 hours ago
   - 🔄 Sync now button

4. **Clicar**: "Sync now"
   - Deve mostrar spinner
   - Depois status atualizado

5. **Voltar ao Dashboard CRM**
   - Deve mostrar: "Top 5 Campaigns by ROI"
   - Cards com impressions, conversions, ROI%

---

## 📁 Arquivos a Modificar (Resumo)

| Fase | Arquivo | O Quê | LOC |
|------|---------|-------|-----|
| 1 | `.env` | Adicionar 6 variáveis | 6 |
| 2 | `src/routes/googleAds.ts` | Já pronto! | 0 |
| 3 | `public/js/modules/crm/index.js` | Adicionar 3 métodos de render | ~150 |
| 4 | `src/routes/crm.ts` | Modificar POST /convert | ~15 |
| 5 | `src/services/googleAdsService.ts` | Verificar uploadConversion() | ~20 |

**Total de novos código**: ~200 linhas

---

## 🎯 Próximas Etapas (Sequência)

1. ✅ **Me passa as credenciais**
   - Vou adicionar ao `.env` e fazer build

2. ✅ **Testa OAuth flow**
   - Você clica no link, autoriza, volta ao CRM

3. ✅ **Implementa Dashboard**
   - Criei os métodos de render
   - Você testa no navegador

4. ✅ **Setup Webhook**
   - Quando lead converte, automático upload Google Ads

5. ✅ **Deploy para produção**
   - Testado tudo, sobe pro servidor

---

## 🆘 Troubleshooting

### Erro: "OAuth2 credentials not configured"
**Solução**: Verificar se as 4 variáveis principais estão no `.env`

### Erro: "Redirect URI mismatch"
**Solução**: No Google Cloud Console, adicionar `http://localhost:3000/api/google-ads/auth/callback`

### Erro: "Invalid developer token"
**Solução**: Copiar developer token do Google Ads API Center (Settings → API Center)

### Erro: "Customer ID format invalid"
**Solução**: Remover hífens (usar `1234567890` em vez de `1234-567-890`)

---

**Pronto!** Me passa as credenciais e começamos! 🚀
