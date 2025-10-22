# ⚡ RESPOSTA RÁPIDA: FONTE DAS CREDENCIAIS

```
█████████████████████████████████████████████████████████████
█                                                           █
█  PERGUNTA: De onde ele está buscando as credenciais?     █
█                                                           █
█  RESPOSTA: DO BANCO DE DADOS (CrmSettings)               █
█                                                           █
█████████████████████████████████████████████████████████████
```

---

## 🎯 3 FONTES

```
┌─ PRIORITÁRIO ────────────────────────┐
│ 1. BANCO DE DADOS ← SEMPRE AQUI!     │
│    └─ Tabela: crmSettings            │
│       ├─ googleAdsClientId           │
│       ├─ googleAdsClientSecret       │
│       ├─ googleAdsDeveloperToken     │
│       ├─ googleAdsCustomerId         │
│       └─ googleAdsRefreshToken       │
└──────────────────────────────────────┘

┌─ SECUNDÁRIO ─────────────────────────┐
│ 2. VARIÁVEIS DE AMBIENTE (.env)      │
│    └─ Apenas: GOOGLE_ADS_REDIRECT_URI│
│       (URL de retorno)               │
└──────────────────────────────────────┘

┌─ FALLBACK ───────────────────────────┐
│ 3. HARDCODED NO CÓDIGO               │
│    └─ Redirect URI padrão:           │
│       http://localhost:3000/...      │
└──────────────────────────────────────┘
```

---

## 📍 ARQUIVOS & LINHAS

```
📁 src/routes/googleAds.ts (ONDE BUSCA)
   ├─ Linha 38-42: Busca clientId e clientSecret
   │  const settings = prisma.crmSettings.findUnique()
   │  ↓
   │  if (!settings?.googleAdsClientId) → ERRO se vazio
   │
   ├─ Linha 43: Busca redirectUri
   │  const redirectUri = process.env.GOOGLE_ADS_REDIRECT_URI
   │  || 'http://localhost:3000/...'
   │  ↓
   │  Se não tiver no .env → usa default
   │
   └─ Linha 50-56: Usa credenciais
      service.initializeOAuth2(
        settings.googleAdsClientId,      ← DO BANCO
        settings.googleAdsClientSecret,  ← DO BANCO
        redirectUri                      ← DO .env
      )

📁 src/services/googleAdsService.ts (COMO BUSCA)
   ├─ Método: loadConfig() (linha 142)
   │  await prisma.crmSettings.findUnique({
   │    where: { organizationId }
   │  });
   │  ↓
   │  this.config = {
   │    clientId: settings.googleAdsClientId,
   │    clientSecret: settings.googleAdsClientSecret,
   │    developerToken: settings.googleAdsDeveloperToken,
   │    refreshToken: settings.googleAdsRefreshToken,
   │    customerId: settings.googleAdsCustomerId,
   │  };
   │
   └─ Método: syncCampaigns() (linha 188)
      await service.loadConfig(); ← CARREGA TUDO
      await service.initializeClient(); ← USA CREDENCIAIS
      const campaigns = await customer.query(...) ← CHAMA GOOGLE APIS
```

---

## 🔍 FLUXO VISUAL

```
USER CLICA "Conectar Google Ads"
         ↓
    Frontend: crm.connectGoogleAds()
         ↓
    GET /api/google-ads/auth/url
         ↓
    Backend: googleAds.ts
         ↓
    BUSCA NO BANCO:
    ├─ crmSettings.findUnique({organizationId})
    ├─ settings.googleAdsClientId ← AQUI
    ├─ settings.googleAdsClientSecret ← AQUI
    └─ settings.googleAdsDeveloperToken ← AQUI
         ↓
    SE VAZIO:
    └─ return { error: "Credenciais não configuradas" }
         ↓
    SE PREENCHIDO:
    └─ new GoogleAdsService().initializeOAuth2(
         settings.googleAdsClientId,
         settings.googleAdsClientSecret,
         redirectUri
       )
         ↓
    GERA URL OAuth
         ↓
    Frontend redireciona para Google
```

---

## 💾 BANCO DE DADOS

### Tabela: `crmSettings`

```sql
CREATE TABLE crmSettings (
  id UUID PRIMARY KEY,
  organizationId UUID NOT NULL,
  
  -- Credenciais Google Ads (SALVOS AQUI)
  googleAdsClientId VARCHAR,           ← ✅ BUSCA AQUI
  googleAdsClientSecret VARCHAR,       ← ✅ BUSCA AQUI
  googleAdsDeveloperToken VARCHAR,     ← ✅ BUSCA AQUI
  googleAdsCustomerId VARCHAR,         ← ✅ BUSCA AQUI
  googleAdsRefreshToken VARCHAR,       ← ✅ BUSCA AQUI
  
  -- Status
  googleAdsConnected BOOLEAN,          ← ✅ Verifica se conectado
  syncEnabled BOOLEAN,
  autoSyncEnabled BOOLEAN,
  lastSyncAt TIMESTAMP,
  
  UNIQUE (organizationId)
);
```

**Status Atual**:
```
Total de registros: 0 ❌
googleAdsClientId: NULL ❌
googleAdsClientSecret: NULL ❌
googleAdsDeveloperToken: NULL ❌
googleAdsCustomerId: NULL ❌
googleAdsRefreshToken: NULL ❌
```

---

## 🔐 SEGURANÇA

```
✅ BOM: Credenciais no banco de dados
   └─ Encriptadas (Supabase faz isso)
   └─ Per-organização (multi-tenant safe)
   └─ Acesso via ORM (SQL injection safe)

❌ RUIM: Credenciais no .env
   └─ Exposto em commits acidentais
   └─ Mesmo valor para todas organizações
   └─ Difícil atualizar em produção

✅ NEUTRO: .env para Redirect URI
   └─ Não é credencial
   └─ Pode mudar por ambiente
   └─ É apenas URL de retorno
```

---

## 🎯 PRÓXIMA AÇÃO

```
Você precisa:
1️⃣ Pegar credenciais do Google Cloud Console (30 min)
2️⃣ Adicionar no CRM Settings form (5 min)
   └─ http://localhost:3000/#/crm/settings
3️⃣ Backend salva no banco automaticamente
4️⃣ Próximas vezes, busca direto do banco ✅
```

---

## 📖 LEIA MAIS

- **Detalhado**: `CREDENTIALS_SOURCE_MAP.md`
- **Setup**: `GOOGLE_ADS_OAUTH_SETUP_GUIDE.md`
- **Diagnóstico**: `GOOGLE_ADS_API_DIAGNOSTIC.md`

---

```
TL;DR: O código buscando dados NO BANCO (CrmSettings).
       Banco está vazio porque user ainda não forneceu credenciais.
       Solução: Colocar 4 credenciais no CRM Settings form.
```
