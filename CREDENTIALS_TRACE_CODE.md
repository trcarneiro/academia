# 🎯 RASTREAMENTO NO CÓDIGO: PASSO-A-PASSO

```
Pergunta: "De onde ele está buscando os dados das credenciais?"

Resposta: Seguindo este caminho:

  🖥️ USER CLICA
        ↓
  📁 public/js/modules/crm/index.js
        ↓
  🌐 GET /api/google-ads/auth/url
        ↓
  📁 src/routes/googleAds.ts
        ↓
  💾 prisma.crmSettings.findUnique() ← AQUI!
        ↓
  🔌 Nova GoogleAdsApi({...})
        ↓
  🌍 Google Ads API
```

---

## 🔍 RASTREAMENTO COMPLETO DO CÓDIGO

### 1️⃣ FRONTEND (public/js/modules/crm/index.js)

**Linhas ~1400**: User clica botão

```javascript
// public/js/modules/crm/index.js - método connectGoogleAds()

async connectGoogleAds() {
    try {
        const response = await this.moduleAPI.request(
            '/api/google-ads/auth/url',  ← CHAMA ESTE ENDPOINT
            { method: 'GET' }
        );
        
        if (response.success && response.data.authUrl) {
            window.location.href = response.data.authUrl;  ← REDIRECIONA
        }
    } catch (error) {
        this.showError('Erro ao conectar Google Ads');
    }
}
```

**O que faz**:
- ✅ Faz GET request para backend
- ✅ Backend retorna URL OAuth
- ✅ Frontend redireciona user para Google

---

### 2️⃣ BACKEND ROUTE (src/routes/googleAds.ts)

**Linhas 35-60**: Endpoint `/api/google-ads/auth/url`

```typescript
// src/routes/googleAds.ts - linha 35

fastify.get('/auth/url', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const organizationId = getDefaultOrganizationId();
        
        // 🎯 AQUI BUSCA NO BANCO!
        const settings = await prisma.crmSettings.findUnique({
            where: { organizationId }
        });
        
        // ❌ SE VAZIO = ERRO
        if (!settings?.googleAdsClientId || !settings?.googleAdsClientSecret) {
            return reply.code(400).send({
                success: false,
                message: 'Google Ads credentials not configured. Please save credentials first in Settings.'
            });
        }
        
        // ✅ SE PREENCHIDO = USA AS CREDENCIAIS
        const redirectUri = process.env.GOOGLE_ADS_REDIRECT_URI || 
                           'http://localhost:3000/api/google-ads/auth/callback';
        
        const service = new GoogleAdsService(organizationId);
        
        await service.initializeOAuth2(
            settings.googleAdsClientId,      ← DO BANCO (linha 42)
            settings.googleAdsClientSecret,  ← DO BANCO (linha 42)
            redirectUri                      ← DO .env ou hardcoded
        );
        
        const authUrl = service.getAuthorizationUrl(redirectUri);
        
        return reply.send({
            success: true,
            data: { authUrl }
        });
        
    } catch (error: any) {
        logger.error('Error generating auth URL:', error);
        return reply.code(500).send({
            success: false,
            message: 'Failed to generate authorization URL',
            error: error.message
        });
    }
});
```

**Fluxo**:
```
1. getDefaultOrganizationId() → "452c0b35-1822-4890-851e-922356c812fb"
2. prisma.crmSettings.findUnique({where: {organizationId}}) ← BUSCA NO BANCO
3. Se encontrou e tem clientId/Secret:
   ├─ settings.googleAdsClientId ← PEGA VALOR
   ├─ settings.googleAdsClientSecret ← PEGA VALOR
   └─ Cria service e inicializa OAuth
4. Se não encontrou ou está vazio:
   └─ Retorna erro 400: "credentials not configured"
5. Se OK:
   └─ Retorna authUrl para frontend
```

---

### 3️⃣ SERVICE (src/services/googleAdsService.ts)

**Linhas 50-73**: initializeOAuth2()

```typescript
// src/services/googleAdsService.ts - linha 50

async initializeOAuth2(clientId: string, clientSecret: string, redirectUri: string) {
    this.oauth2Client = new google.auth.OAuth2(
        clientId,              ← RECEBE DO BANCO (via routes)
        clientSecret,          ← RECEBE DO BANCO (via routes)
        redirectUri            ← RECEBE DO .env
    );

    return this.oauth2Client;
}
```

**Depois chama**:

```typescript
// src/services/googleAdsService.ts - linha 72

getAuthorizationUrl(redirectUri: string): string {
    if (!this.oauth2Client) {
        throw new Error('OAuth2 client not initialized');
    }

    const scopes = ['https://www.googleapis.com/auth/adwords'];

    return this.oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent',
    });
    // Retorna algo como:
    // https://accounts.google.com/o/oauth2/v2/auth?
    //   client_id=XXX&
    //   redirect_uri=http://localhost:3000/...&
    //   scope=...
}
```

---

### 4️⃣ CALLBACK ROUTE (src/routes/googleAds.ts)

**Linhas 61-120**: Endpoint `/api/google-ads/auth/callback`

```typescript
fastify.get('/auth/callback', async (request: FastifyRequest<{
    Querystring: {
        code: string;
        state?: string;
    };
}>, reply: FastifyReply) => {
    try {
        const { code } = request.query;  ← GOOGLE RETORNA ISSO
        
        if (!code) {
            return reply.code(400).send({
                success: false,
                message: 'Authorization code not provided'
            });
        }
        
        const organizationId = getDefaultOrganizationId();
        
        // 🎯 BUSCA NO BANCO NOVAMENTE!
        const settings = await prisma.crmSettings.findUnique({
            where: { organizationId }
        });
        
        if (!settings?.googleAdsClientId || !settings?.googleAdsClientSecret) {
            return reply.code(400).send({
                success: false,
                message: 'Credentials not found'
            });
        }
        
        const redirectUri = process.env.GOOGLE_ADS_REDIRECT_URI || 
                           'http://localhost:3000/api/google-ads/auth/callback';
        
        const service = new GoogleAdsService(organizationId);
        
        // USA AS MESMAS CREDENCIAIS DO BANCO
        await service.initializeOAuth2(
            settings.googleAdsClientId,      ← DO BANCO NOVAMENTE
            settings.googleAdsClientSecret,  ← DO BANCO NOVAMENTE
            redirectUri
        );
        
        // TROCA O CODE POR TOKENS
        const { accessToken, refreshToken } = 
            await service.getTokensFromCode(code);
        
        // SALVA OS NOVOS TOKENS DE VOLTA NO BANCO
        await service.saveTokens(
            refreshToken,                    ← NOVO (de Google)
            settings.googleAdsClientId,      ← EXISTENTE (do banco)
            settings.googleAdsClientSecret,  ← EXISTENTE (do banco)
            settings.googleAdsDeveloperToken, ← EXISTENTE (do banco)
            settings.googleAdsCustomerId     ← NOVO (user input)
        );
        
        // REDIRECIONA DE VOLTA PRA INTERFACE
        return reply.redirect('/');
        
    } catch (error: any) {
        logger.error('Error in OAuth callback:', error);
        return reply.code(500).send({
            success: false,
            message: 'OAuth callback failed',
            error: error.message
        });
    }
});
```

---

### 5️⃣ SYNC ROUTE (src/routes/crm.ts)

**Linhas ~700**: Endpoint `POST /api/crm/google-ads/sync`

```typescript
// src/routes/crm.ts - quando user clica "Sincronizar Agora"

fastify.post('/google-ads/sync', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const organizationId = getDefaultOrganizationId();
        
        // 🎯 CARREGA SERVICE
        const service = new GoogleAdsService(organizationId);
        
        // 🎯 CHAMA loadConfig() QUE BUSCA NO BANCO
        await service.loadConfig();
        
        // 🎯 INICIALIZA CLIENTE COM CREDENCIAIS DO BANCO
        await service.initializeClient();
        
        // 🎯 SINCRONIZA CAMPANHAS
        const campaignCount = await service.syncCampaigns();
        
        return reply.send({
            success: true,
            data: { campaignsSynced: campaignCount }
        });
    } catch (error) {
        return reply.code(500).send({
            success: false,
            message: error.message
        });
    }
});
```

**Importante**: Aqui é onde `loadConfig()` é chamado:

```typescript
// src/services/googleAdsService.ts - linha 142

async loadConfig(): Promise<GoogleAdsConfig> {
    // 🎯 BUSCA TUDO NO BANCO
    const settings = await prisma.crmSettings.findUnique({
        where: { organizationId: this.organizationId },
    });

    if (!settings || !settings.googleAdsConnected) {
        throw new Error('Google Ads not connected for this organization');
    }

    // 🎯 CARREGA TUDO EM MEMÓRIA
    this.config = {
        clientId: settings.googleAdsClientId!,           ← BANCO
        clientSecret: settings.googleAdsClientSecret!,   ← BANCO
        developerToken: settings.googleAdsDeveloperToken!, ← BANCO
        refreshToken: settings.googleAdsRefreshToken!,   ← BANCO
        customerId: settings.googleAdsCustomerId!,       ← BANCO
    };

    return this.config;
}
```

---

## 🗺️ MAPA DE REFERÊNCIAS

```
settings.googleAdsClientId
  ↑
  └─ prisma.crmSettings.findUnique()
      ↑
      └─ Tabela: crmSettings
          ↑
          └─ Coluna: googleAdsClientId
              ↑
              └─ Valor: user forneceu em CRM Settings form

settings.googleAdsClientSecret
  ↑
  └─ prisma.crmSettings.findUnique()
      ↑
      └─ Tabela: crmSettings
          ↑
          └─ Coluna: googleAdsClientSecret
              ↑
              └─ Valor: user forneceu em CRM Settings form

settings.googleAdsDeveloperToken
  ↑
  └─ prisma.crmSettings.findUnique()
      ↑
      └─ Tabela: crmSettings
          ↑
          └─ Coluna: googleAdsDeveloperToken
              ↑
              └─ Valor: user forneceu em CRM Settings form

settings.googleAdsCustomerId
  ↑
  └─ prisma.crmSettings.findUnique()
      ↑
      └─ Tabela: crmSettings
          ↑
          └─ Coluna: googleAdsCustomerId
              ↑
              └─ Valor: user forneceu em CRM Settings form

settings.googleAdsRefreshToken
  ↑
  └─ prisma.crmSettings.findUnique()
      ↑
      └─ Tabela: crmSettings
          ↑
          └─ Coluna: googleAdsRefreshToken
              ↑
              └─ Valor: Google forneceu (no OAuth callback)
```

---

## 🔍 BUSCA NO CÓDIGO

Para encontrar onde busca as credenciais:

```bash
# Buscar por "findUnique" em googleAds context
grep -n "crmSettings.findUnique" src/routes/googleAds.ts
# Resultado: linha 38, 91

# Buscar por "loadConfig" (onde carrega de verdade)
grep -n "loadConfig" src/services/googleAdsService.ts
# Resultado: linha 142, 175

# Buscar por "saveTokens" (onde salva)
grep -n "saveTokens" src/services/googleAdsService.ts
# Resultado: linha 100

# Buscar por "initializeClient" (onde usa credenciais)
grep -n "initializeClient" src/services/googleAdsService.ts
# Resultado: linha 168
```

---

## 📊 SEQUÊNCIA DE BUSCA

```
Tempo:   Ação                              Onde Busca
────────────────────────────────────────────────────
T+0ms    User clica "Conectar"            N/A
T+10ms   GET /api/google-ads/auth/url     ↓
T+20ms   findUnique(crmSettings) ←────── BANCO #1
T+30ms   settings.googleAdsClientId       ↓
T+40ms   settings.googleAdsClientSecret   ↓
T+50ms   Gera OAuth URL                   ↓
T+60ms   Retorna para frontend            ↓
T+70ms   User faz login no Google         (fora da app)
T+80ms   GET /auth/callback?code=XXX      ↓
T+90ms   findUnique(crmSettings) ←────── BANCO #2
T+100ms  settings.googleAdsClientId       ↓
T+110ms  settings.googleAdsClientSecret   ↓
T+120ms  Troca code por refresh_token     (chama Google)
T+130ms  saveTokens() → upsert ←───────── BANCO #3 (salva)
T+140ms  User vê CRM Settings atualizado  ✅

T+150ms  User clica "Sincronizar Agora"  ↓
T+160ms  POST /crm/google-ads/sync        ↓
T+170ms  new GoogleAdsService()           ↓
T+180ms  service.loadConfig()             ↓
T+190ms  findUnique(crmSettings) ←────── BANCO #4
T+200ms  settings.googleAdsClientId       ↓
T+210ms  settings.googleAdsClientSecret   ↓
T+220ms  settings.googleAdsDeveloperToken ↓
T+230ms  settings.googleAdsRefreshToken   ↓
T+240ms  settings.googleAdsCustomerId     ↓
T+250ms  new GoogleAdsApi({...})          ↓
T+260ms  customer.query("SELECT ...")     (chama Google Ads API)
T+500ms  Retorna campanhas                ↓
T+510ms  Salva em GoogleAdsCampaign       (BANCO #5)
```

---

## ✅ CONCLUSÃO

**O código busca as credenciais**:

1. ✅ **Lugar**: Banco de dados (Tabela `crmSettings`)
2. ✅ **Método**: `prisma.crmSettings.findUnique()`
3. ✅ **Quando**: 
   - Quando user clica "Conectar Google Ads"
   - Quando Google redireciona com callback
   - Quando user clica "Sincronizar Agora"
4. ✅ **Frequência**: Múltiplas vezes por operação
5. ✅ **Segurança**: Encriptado no Supabase
6. ✅ **Status Atual**: Tabela vazia (user não forneceu credenciais)

---

**Leia também**: `CREDENTIALS_SOURCE_MAP.md` para diagrama completo
