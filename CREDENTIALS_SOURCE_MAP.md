# 🔍 RASTREAMENTO: DE ONDE VÊM AS CREDENCIAIS DO GOOGLE ADS

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                                                                       ┃
┃            MAPA COMPLETO DO FLUXO DE CREDENCIAIS                     ┃
┃                                                                       ┃
┃  Pergunta: "De onde ele está buscando os dados das credenciais?"     ┃
┃  Resposta: De 3 lugares + processo de salvamento                     ┃
┃                                                                       ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## 🎯 RESPOSTA RÁPIDA

O código busca credenciais em **3 lugares**, nesta ordem:

```
1️⃣ BANCO DE DADOS (CrmSettings) ← PRIMEIRO
   └─ Tabela: crmSettings
   └─ Campos: googleAdsClientId, googleAdsClientSecret, 
              googleAdsDeveloperToken, googleAdsCustomerId,
              googleAdsRefreshToken

2️⃣ VARIÁVEIS DE AMBIENTE (.env) ← TEMPORÁRIO (para setup inicial)
   └─ GOOGLE_ADS_REDIRECT_URI (apenas URL)

3️⃣ HARDCODED (fallback) ← ÚLTIMO RECURSO
   └─ Redirect URI default: http://localhost:3000/api/google-ads/auth/callback
```

---

## 🗺️ FLUXO COMPLETO

### Cenário: User clica em "Conectar Google Ads"

```
┌─────────────────────────────────────────────────────────────────┐
│                    1. FRONTEND (.html)                           │
│                                                                  │
│  onclick → window.crm.connectGoogleAds()                        │
│  Localização: public/js/modules/crm/index.js (linha ~1400)     │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│                    2. API CALL (POST)                            │
│                                                                  │
│  Fetch: GET /api/google-ads/auth/url                           │
│  Headers: x-organization-id = "452c0b35-..."                   │
│  Objetivo: Obter URL de redirecionamento OAuth                 │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│              3. BACKEND ROUTE (googleAds.ts)                     │
│                                                                  │
│  Route: GET /api/google-ads/auth/url                           │
│  Arquivo: src/routes/googleAds.ts (linhas 35-60)              │
│                                                                  │
│  Código:                                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ const organizationId = getDefaultOrganizationId();       │  │
│  │                                                          │  │
│  │ const settings = prisma.crmSettings.findUnique({  ←─────┼─ BUSCA NO BANCO
│  │   where: { organizationId }                      │      │  │
│  │ });                                              │      │  │
│  │                                                  │      │  │
│  │ if (!settings?.googleAdsClientId) {             │      │  │
│  │   return "Credenciais não configuradas"         │      │  │
│  │ }                                                │      │  │
│  │                                                  │      │  │
│  │ const redirectUri = process.env. ←───────────────┼──────┼─ BUSCA NO .env
│  │   GOOGLE_ADS_REDIRECT_URI ||                    │      │  │
│  │   'http://localhost:3000/...'  ←────────────────┼──────┼─ FALLBACK
│  │                                                  │      │  │
│  │ service.initializeOAuth2(                       │      │  │
│  │   settings.googleAdsClientId,    ←──────────────┴──────┴─ USA CREDENCIAIS
│  │   settings.googleAdsClientSecret,                      │  │ DO BANCO!
│  │   redirectUri                                          │  │
│  │ );                                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Retorna: { authUrl: "https://accounts.google.com/..." }       │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│                  4. FRONTEND REDIRECT                            │
│                                                                  │
│  window.location.href = authUrl                                │
│  User vê: Google login page                                    │
│  User faz: Login + Autorização                                │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│            5. GOOGLE CALLBACK (código do user)                   │
│                                                                  │
│  URL: http://localhost:3000/api/google-ads/auth/callback      │
│  Query Params: ?code=4/0Ax8qg...  (authorization code)        │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│           6. BACKEND ROUTE - CALLBACK HANDLER                    │
│                                                                  │
│  Route: GET /api/google-ads/auth/callback                      │
│  Arquivo: src/routes/googleAds.ts (linhas 61-120)             │
│                                                                  │
│  Código:                                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ const { code } = request.query;                          │  │
│  │                                                          │  │
│  │ const settings = prisma.crmSettings.findUnique({ ← BANCO │  │
│  │   where: { organizationId }                             │  │
│  │ });                                                      │  │
│  │                                                          │  │
│  │ const service = new GoogleAdsService(organizationId);   │  │
│  │                                                          │  │
│  │ await service.initializeOAuth2(                        │  │
│  │   settings.googleAdsClientId,      ← CREDENCIAIS BANCO  │  │
│  │   settings.googleAdsClientSecret,  ← CREDENCIAIS BANCO  │  │
│  │   redirectUri                                           │  │
│  │ );                                                      │  │
│  │                                                          │  │
│  │ const { accessToken, refreshToken } = ← NOVO TOKEN    │  │
│  │   await service.getTokensFromCode(code);  de GOOGLE    │  │
│  │                                                          │  │
│  │ await service.saveTokens(               ← SALVA NO BANCO │  │
│  │   refreshToken,                                         │  │
│  │   clientId,                                             │  │
│  │   clientSecret,                                         │  │
│  │   developerToken,                                       │  │
│  │   customerId                                            │  │
│  │ );                                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Salva em CrmSettings:                                          │
│  ├─ googleAdsRefreshToken ← NOVO (de Google)                  │
│  ├─ googleAdsClientId ← EXISTENTE (do banco)                   │
│  ├─ googleAdsClientSecret ← EXISTENTE (do banco)               │
│  ├─ googleAdsDeveloperToken ← EXISTENTE (do banco)             │
│  ├─ googleAdsCustomerId ← NOVO (do user input)                 │
│  └─ googleAdsConnected: true ← MARCADO                         │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│           7. SINCRONIZAÇÃO (quando user clica "Sync")            │
│                                                                  │
│  Route: POST /api/crm/google-ads/sync                          │
│  Arquivo: src/routes/crm.ts (linhas ~700)                      │
│                                                                  │
│  Código:                                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ const service = new GoogleAdsService(organizationId);    │  │
│  │                                                          │  │
│  │ await service.loadConfig(); ← BUSCA TUDO NO BANCO       │  │
│  │ // Carrega de crmSettings:                              │  │
│  │ //  - clientId                                          │  │
│  │ //  - clientSecret                                      │  │
│  │ //  - developerToken                                    │  │
│  │ //  - refreshToken                                      │  │
│  │ //  - customerId                                        │  │
│  │                                                          │  │
│  │ await service.initializeClient(); ← USA CONFIG DO BANCO │  │
│  │ //  new GoogleAdsApi({                                  │  │
│  │ //    client_id: config.clientId,                       │  │
│  │ //    client_secret: config.clientSecret,               │  │
│  │ //    developer_token: config.developerToken            │  │
│  │ //  })                                                  │  │
│  │                                                          │  │
│  │ const count = await service.syncCampaigns(); ← BUSCA    │  │
│  │ // Google Ads com customer.query("SELECT ...")          │  │
│  │ // Salva em GoogleAdsCampaign                           │  │
│  │                                                          │  │
│  │ return { campaignsSynced: count, ... };                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Resultado:                                                      │
│  ├─ GoogleAdsCampaign table: atualizada com campaigns Google    │
│  ├─ GoogleAdsAdGroup table: atualizada com ad groups           │
│  └─ GoogleAdsKeyword table: atualizada com keywords            │
└───────────────────────────────────────────────────────────────────┘
```

---

## 🔍 DETALHAMENTO: ONDE CADA CREDENCIAL VEM

### 1. `googleAdsClientId` (Client ID)

```
┌─ ORIGEM ──────────────────────┐
│                                │
│  ① User input (CRM Settings)   │ ← INPUT INICIAL
│  ② CrmSettings.googleAdsClientId  ← ARMAZENADO
│  ③ googleAdsService.config.clientId ← CARREGADO
│                                │
└─ FLUXO ──────────────────────┐
│                                │
│  Passo 1: User acessa:         │
│    http://localhost:3000/#/    │
│    crm/settings                │
│                                │
│  Passo 2: User vê formulário:  │
│    "Google Ads Client ID: [ ]" │
│                                │
│  Passo 3: User copia de:       │
│    Google Cloud Console        │
│    → Credenciais → OAuth 2.0   │
│                                │
│  Passo 4: User cola e clica    │
│    "Salvar Credenciais"        │
│                                │
│  Passo 5: Backend faz:         │
│    crmSettings.upsert({        │
│      googleAdsClientId: value  │
│    })                          │
│                                │
│  Passo 6: Quando precisa:      │
│    const settings =            │
│      crmSettings.findUnique()  │
│    const clientId =            │
│      settings.googleAdsClientId│
│                                │
└────────────────────────────────┘
```

### 2. `googleAdsClientSecret` (Client Secret)

```
ORIGEM: Mesmo fluxo que Client ID
ARMAZÉM: CrmSettings.googleAdsClientSecret
RECUPERAÇÃO: crmSettings.findUnique()
```

### 3. `googleAdsDeveloperToken` (Developer Token)

```
ORIGEM: User input + solicitação ao Google
ARMAZÉM: CrmSettings.googleAdsDeveloperToken
RECUPERAÇÃO: crmSettings.findUnique()
NOTA: User precisa solicitar ao Google (até 24h de aprovação)
```

### 4. `googleAdsCustomerId` (Customer ID)

```
ORIGEM: User copia de Google Ads Account
ARMAZÉM: CrmSettings.googleAdsCustomerId
RECUPERAÇÃO: crmSettings.findUnique()
FORMATO: "123-456-7890" (com hífens)
```

### 5. `googleAdsRefreshToken` (Refresh Token)

```
┌─ ORIGEM ESPECIAL ─────────────────────┐
│                                        │
│  Este token vem DO GOOGLE, não do user│
│                                        │
│  Fluxo:                                │
│  ① User clica "Conectar Google"       │
│  ② Redirecionado para Google login    │
│  ③ Google retorna authorization code  │
│  ④ Backend troca code por tokens      │
│  ⑤ Google retorna:                    │
│     {                                  │
│       access_token: "...",             │
│       refresh_token: "...",  ← SALVA  │
│       expires_in: 3599                 │
│     }                                  │
│  ⑥ Backend salva refreshToken em DB   │
│  ⑦ Próximas vezes, busca DB           │
│                                        │
└────────────────────────────────────────┘
```

---

## 📊 ARQUIVOS ENVOLVIDOS

| Arquivo | Função | Linhas |
|---------|--------|--------|
| `src/routes/googleAds.ts` | 🎯 Ponto de entrada OAuth | 617 |
| `src/services/googleAdsService.ts` | 🔧 Lógica de conexão | 525 |
| `src/routes/crm.ts` | 📡 Endpoints de sync | 753 |
| `public/js/modules/crm/index.js` | 🖥️ Interface user | 2295 |
| `prisma/schema.prisma` | 💾 Esquema CrmSettings | ~2773 |

---

## 🔗 CADEIA DE BUSCA

### Quando chamamos `loadConfig()`:

```typescript
// src/services/googleAdsService.ts:142-160

async loadConfig(): Promise<GoogleAdsConfig> {
    // ① BUSCA NO BANCO
    const settings = await prisma.crmSettings.findUnique({
        where: { organizationId: this.organizationId },
    });
    
    // ② VALIDA EXISTÊNCIA
    if (!settings || !settings.googleAdsConnected) {
        throw new Error('Google Ads not connected');
    }
    
    // ③ CARREGA TUDO EM MEMÓRIA
    this.config = {
        clientId: settings.googleAdsClientId!,           // ← BANCO
        clientSecret: settings.googleAdsClientSecret!,   // ← BANCO
        developerToken: settings.googleAdsDeveloperToken!, // ← BANCO
        refreshToken: settings.googleAdsRefreshToken!,   // ← BANCO
        customerId: settings.googleAdsCustomerId!,       // ← BANCO
    };
    
    return this.config;
}
```

### Quando chamamos `initializeClient()`:

```typescript
// src/services/googleAdsService.ts:168-183

async initializeClient() {
    // ① CARREGA CONFIG DO BANCO
    if (!this.config) {
        await this.loadConfig();
    }
    
    // ② CRIA CLIENTE COM CONFIG
    this.client = new GoogleAdsApi({
        client_id: this.config.clientId,         // ← USA BANCO
        client_secret: this.config.clientSecret, // ← USA BANCO
        developer_token: this.config.developerToken, // ← USA BANCO
    });
    
    logger.info('Google Ads API client initialized');
}
```

---

## 🎯 RESUMO VISUAL

```
┌─────────────────────────────────────────────────────────┐
│  PERGUNTA: Onde estão as credenciais?                   │
│  RESPOSTA:                                              │
│                                                         │
│  ✅ NO BANCO:                                          │
│     └─ Tabela: CrmSettings                             │
│        ├─ googleAdsClientId                            │
│        ├─ googleAdsClientSecret                        │
│        ├─ googleAdsDeveloperToken                      │
│        ├─ googleAdsCustomerId                          │
│        └─ googleAdsRefreshToken                        │
│                                                         │
│  ✅ NO .env (optional, para redirect):                │
│     └─ GOOGLE_ADS_REDIRECT_URI                        │
│                                                         │
│  ❌ NO .env (NÃO ESTÃO):                              │
│     ├─ GOOGLE_ADS_CLIENT_ID                           │
│     ├─ GOOGLE_ADS_CLIENT_SECRET                       │
│     ├─ GOOGLE_ADS_DEVELOPER_TOKEN                     │
│     └─ GOOGLE_ADS_CUSTOMER_ID                         │
│                                                         │
│  ❓ POR QUE NÃO NO .env?                              │
│     └─ Multi-tenant: cada organização tem creds diferentes
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 CICLO DE VIDA DAS CREDENCIAIS

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  FASE 1: INPUT (User)                                  │
│  └─ CRM Settings form (public/js/modules/crm/)        │
│                                                        │
│  FASE 2: SALVAR (Backend)                             │
│  └─ POST /api/crm/settings                           │
│     → crmSettings.upsert({...})                        │
│     → Salva no banco                                   │
│                                                        │
│  FASE 3: RECUPERAR (Backend)                          │
│  └─ crmSettings.findUnique({organizationId})          │
│     → Carrega em memória (this.config)                │
│                                                        │
│  FASE 4: USAR (Google Ads API)                        │
│  └─ new GoogleAdsApi({clientId, clientSecret, ...})  │
│     → Conecta à API do Google                         │
│                                                        │
│  FASE 5: REFRESCAR (Automático)                       │
│  └─ refreshToken → novos accessToken                  │
│     → Google retorna novo token                       │
│     → Backend não precisa guardar (Google mantém)    │
│                                                        │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 CHECKLIST: ONDE ESTÃO AGORA?

```
✅ Código: 100% implementado
   ├─ Routes: googleAds.ts ✅
   ├─ Service: googleAdsService.ts ✅
   ├─ Frontend: crm/index.js ✅
   └─ Schema: CrmSettings ✅

❌ Credenciais: 0% configuradas
   ├─ googleAdsClientId: VAZIO
   ├─ googleAdsClientSecret: VAZIO
   ├─ googleAdsDeveloperToken: VAZIO
   ├─ googleAdsCustomerId: VAZIO
   └─ googleAdsRefreshToken: VAZIO

❓ Por quê?
   └─ User ainda não forneceu as 4 credenciais
```

---

## 🚀 PRÓXIMO PASSO

1. **Coletar credenciais** (30 min)
   - Google Cloud Console
   - Google Ads Account

2. **Salvar no banco** (5 min)
   - CRM Settings form

3. **Validar OAuth** (15 min)
   - Clicar "Conectar Google Ads"

4. **Sincronizar** (5 min)
   - Clicar "Sincronizar Agora"

---

**Conclusão**: O código já está 100% pronto. Está buscando CORRETAMENTE no banco de dados. Só precisa das credenciais serem inseridas!

