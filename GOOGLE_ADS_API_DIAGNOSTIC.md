# 🔍 DIAGNÓSTICO: APIS DO GOOGLE ADS

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                                                                       ┃
┃  ❌ GOOGLE ADS APIs - NÃO CONFIGURADAS                              ┃
┃                                                                       ┃
┃  Status: Credenciais ausentes no .env e no banco                    ┃
┃  Data: 16/10/2025                                                   ┃
┃                                                                       ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## 📊 STATUS ATUAL

### ❌ Configuração no .env

```
❌ GOOGLE_ADS_CLIENT_ID          = NÃO CONFIGURADO
❌ GOOGLE_ADS_CLIENT_SECRET      = NÃO CONFIGURADO
❌ GOOGLE_ADS_DEVELOPER_TOKEN    = NÃO CONFIGURADO
❌ GOOGLE_ADS_CUSTOMER_ID        = NÃO CONFIGURADO
❌ GOOGLE_ADS_REFRESH_TOKEN      = NÃO CONFIGURADO
```

### ❌ Configuração no Banco de Dados

```
CrmSettings (Google Ads config):
├─ Total de registros: 0 ❌
├─ googleAdsCustomerId: NÃO EXISTE
├─ googleAdsDeveloperToken: NÃO EXISTE
├─ syncEnabled: NÃO EXISTE
└─ autoSyncEnabled: NÃO EXISTE

GoogleAdsCampaigns:
├─ Total no banco: 0 ❌
└─ Status: VAZIO

GoogleAdsAdGroups:
├─ Total no banco: 0 ❌
└─ Status: VAZIO

GoogleAdsKeywords:
├─ Total no banco: 0 ❌
└─ Status: VAZIO
```

### ✅ O Que ESTÁ Configurado

```
✅ GEMINI_API_KEY              = CONFIGURADO
✅ OPENROUTER_API_KEY          = CONFIGURADO
✅ ASAAS_API_KEY               = CONFIGURADO
✅ SUPABASE_*                  = CONFIGURADO
✅ Database Connection         = OK
```

---

## 🎯 RESULTADO

### Pergunta: "As APIs do Google estão respondendo com as credenciais que temos no banco?"

**Resposta**: 
```
❌ NÃO, porque:

1. ❌ Nenhuma credencial Google Ads no .env
2. ❌ Nenhuma configuração CrmSettings no banco
3. ❌ Nenhum campaign/adgroup/keyword sincronizado
4. ❌ OAuth flow não pode iniciar sem Client ID/Secret
5. ❌ Google Ads API não pode ser chamada sem Developer Token
```

**Conclusão**: 
```
As APIs do Google Ads estão OFFLINE porque:
├─ Credenciais ausentes
├─ Configuração não feita no banco
├─ OAuth não foi validado
└─ Nenhuma sincronização foi executada
```

---

## 🔧 O QUE FALTA FAZER

### PASSO 1: Adicionar Credenciais no .env

```bash
# Abrir: .env
# Adicionar após a linha de KIOSK_PORT=3001:

# Google Ads Configuration
GOOGLE_ADS_CLIENT_ID="YOUR_CLIENT_ID.apps.googleusercontent.com"
GOOGLE_ADS_CLIENT_SECRET="YOUR_CLIENT_SECRET"
GOOGLE_ADS_DEVELOPER_TOKEN="YOUR_DEVELOPER_TOKEN"
GOOGLE_ADS_CUSTOMER_ID="YOUR_CUSTOMER_ID"
GOOGLE_ADS_REFRESH_TOKEN="" # Será preenchido após OAuth flow
```

**De onde pegar**:
- Guia completo: `GOOGLE_ADS_OAUTH_SETUP_GUIDE.md`
- Google Cloud Console: https://console.cloud.google.com
- Google Ads Account: https://ads.google.com

### PASSO 2: Validar OAuth Flow

```bash
# 1. Iniciar servidor:
npm run dev

# 2. Acessar:
http://localhost:3000/#/crm/settings

# 3. Clicar em: "Conectar Google Ads" (botão azul)

# 4. Fazer login com sua conta Google

# 5. Autorizar acesso

# 6. Será redirecionado para callback: /api/google-ads/auth/callback

# 7. REFRESH_TOKEN será salvo no banco automaticamente
```

### PASSO 3: Testar APIs

```bash
# Depois que OAuth foi validado:

# 1. Clicar "Sincronizar Agora" no CRM Settings
#    Deve buscar campaigns, adgroups, keywords de sua conta

# 2. Verificar logs:
#    [info] ✅ Sincronizando campanhas do Google Ads...
#    [info] ✅ X campanhas importadas
#    [info] ✅ Y keywords importadas

# 3. Verificar banco:
#    node scripts/check-google-ads-config.js
#    Deve mostrar campaigns, adgroups, keywords
```

---

## 📋 CHECKLIST DE SETUP

### Fase 0: Preparação (Antes de tudo)

```
☐ Ter conta Google (Gmail)
☐ Ter conta Google Ads ativa
☐ Ter acesso a Google Cloud Console
☐ Ter .env editável
```

### Fase 1: Google Cloud Console

```
☐ Criar projeto: "Academia Krav Maga CRM"
☐ Ativar API: Google Ads API v17
☐ Criar credenciais OAuth 2.0 (tipo: Aplicação de Desktop)
☐ Baixar JSON com Client ID e Client Secret
☐ Criar restricted key se necessário
☐ Adicionar redirect URI: http://localhost:3000/api/google-ads/auth/callback
```

### Fase 2: Google Ads Account

```
☐ Acessar: https://ads.google.com/aw/overview
☐ Ir para: Configurações > Detalhes da conta
☐ Copiar: Customer ID (formato: 123-456-7890)
☐ Pedir Developer Token ao Google (se não tiver)
```

### Fase 3: Configurar .env

```
☐ Copiar CLIENT_ID do JSON
☐ Copiar CLIENT_SECRET do JSON
☐ Copiar DEVELOPER_TOKEN
☐ Copiar CUSTOMER_ID
☐ Colar tudo em .env
☐ Salvar .env
☐ Reiniciar: npm run dev
```

### Fase 4: Validar OAuth

```
☐ Iniciar servidor: npm run dev
☐ Acessar: http://localhost:3000/#/crm/settings
☐ Clicar: "Conectar Google Ads"
☐ Fazer login
☐ Autorizar acesso
☐ Aguardar redirecionamento
☐ Verificar banco: REFRESH_TOKEN foi salvo
```

### Fase 5: Sincronizar

```
☐ Clicar: "Sincronizar Agora"
☐ Aguardar fetch de campaigns
☐ Verificar logs: "✅ X campanhas importadas"
☐ Abrir: http://localhost:3000/#/crm/settings
☐ Ver dashboard com métricas de sync
```

---

## 🧪 TESTE MANUAL (via PowerShell)

### Teste 1: Verificar variáveis de ambiente

```powershell
$env:GOOGLE_ADS_CLIENT_ID
# Esperado: seu-client-id.apps.googleusercontent.com

$env:GOOGLE_ADS_DEVELOPER_TOKEN
# Esperado: seu-developer-token
```

### Teste 2: Verificar configuração no banco

```powershell
node scripts/check-google-ads-config.js

# Esperado:
# 📋 Total de CrmSettings: 1
# Organization ID: 452c0b35-1822-4890-851e-922356c812fb
# Google Ads Customer ID: 123-456-7890
# Google Ads Developer Token: ✅ CONFIGURADO
# Last Sync: 16/10/2025 14:30:00
```

### Teste 3: Chamar endpoint GET /api/google-ads/sync-status

```powershell
# Com servidor rodando:
curl -H "x-organization-id: 452c0b35-1822-4890-851e-922356c812fb" `
  http://localhost:3000/api/crm/google-ads/sync-status

# Esperado:
# {
#   "success": true,
#   "data": {
#     "campaignsSynced": 12,
#     "keywordsSynced": 145,
#     "conversionsSynced": 3,
#     "lastSyncTime": "2025-10-16T14:30:00Z",
#     "topCampaigns": [...]
#   }
# }
```

### Teste 4: Chamar endpoint POST /api/google-ads/sync (manual)

```powershell
# Triggar sincronização manualmente:
curl -X POST `
  -H "x-organization-id: 452c0b35-1822-4890-851e-922356c812fb" `
  -H "Content-Type: application/json" `
  http://localhost:3000/api/crm/google-ads/sync

# Esperado:
# {
#   "success": true,
#   "message": "Sincronização iniciada com sucesso",
#   "data": {
#     "campaignsSynced": 12,
#     "keywordsSynced": 145
#   }
# }
```

---

## 🚨 POSSÍVEIS ERROS E SOLUÇÕES

### Erro 1: "400: Bad Request - Invalid credentials"

**Causa**: CLIENT_ID ou CLIENT_SECRET incorreto  
**Solução**: 
```
1. Verificar .env
2. Copiar novamente do Google Cloud Console
3. Remover espaços extras
4. Reiniciar servidor
```

### Erro 2: "403: Forbidden - Developer Token not approved"

**Causa**: Developer Token não autorizado pelo Google  
**Solução**:
```
1. Acessar Google Ads
2. Solicitar Developer Token (modo whitelist)
3. Aguardar aprovação do Google (até 24h)
4. Adicionar em .env quando aprovado
```

### Erro 3: "INVALID_LOGIN_CUSTOMER_ID"

**Causa**: Customer ID errado  
**Solução**:
```
1. Acessar https://ads.google.com/aw/overview
2. Copiar corretamente: "123-456-7890" (com hífens)
3. Adicionar em GOOGLE_ADS_CUSTOMER_ID
4. Reiniciar servidor
```

### Erro 4: "redirect_uri_mismatch"

**Causa**: URL de redirecionamento não cadastrada  
**Solução**:
```
1. Google Cloud Console
2. Ir para: Credenciais > OAuth 2.0 Client IDs
3. Editar: URIs autorizados
4. Adicionar: http://localhost:3000/api/google-ads/auth/callback
5. Salvar
```

### Erro 5: "TypeError: Cannot read property 'email' of null"

**Causa**: Usuário não está logado antes de conectar Google Ads  
**Solução**:
```
1. Fazer login: http://localhost:3000
2. Depois acessar CRM Settings
3. Depois clicar "Conectar Google Ads"
```

---

## 📞 PRÓXIMOS PASSOS

```
1️⃣ Coleta de Credenciais (30 min)
   └─ Pegar 4 valores do Google Cloud Console
   └─ Guia: GOOGLE_ADS_OAUTH_SETUP_GUIDE.md

2️⃣ Configuração no .env (5 min)
   └─ Adicionar 5 variáveis de ambiente

3️⃣ Validação OAuth (15 min)
   └─ Iniciar servidor
   └─ Clicar "Conectar Google Ads"
   └─ Fazer login e autorizar

4️⃣ Sincronização (5 min)
   └─ Clicar "Sincronizar Agora"
   └─ Verificar dados importados

5️⃣ Testes (10 min)
   └─ Chamar endpoints
   └─ Verificar banco de dados
   └─ Visualizar dashboard
```

---

## ✅ RESULTADO ESPERADO

```
Quando tudo estiver configurado:

CrmSettings:
├─ Organization: Academia Krav Maga Demo ✅
├─ Customer ID: 123-456-7890 ✅
├─ Developer Token: CONFIGURADO ✅
├─ Sync Enabled: SIM ✅
├─ Last Sync: 16/10/2025 14:30:00 ✅
└─ syncEnabled: true ✅

GoogleAdsCampaigns:
├─ Total: 12 campanhas ✅
├─ Names: Trial, Newbies, Promote, etc. ✅
├─ Status: ENABLED, PAUSED, etc. ✅
└─ Budget: Sincronizado ✅

GoogleAdsKeywords:
├─ Total: 145 palavras-chave ✅
├─ Search volume: Sincronizado ✅
└─ Status: ENABLED, PAUSED, etc. ✅

Dashboard:
├─ 4 Metric Cards: ✅
│  ├─ Campanhas Sincronizadas: 12
│  ├─ Palavras-chave: 145
│  ├─ Conversões Enviadas: 3
│  └─ Última Sincronização: 2h atrás
│
└─ Top 5 Campanhas por ROI: ✅
   ├─ 1. Trial (156% ROI) - Verde
   ├─ 2. Newbies (89% ROI) - Verde
   ├─ 3. Promote (42% ROI) - Amarelo
   ├─ 4. Webinar (18% ROI) - Amarelo
   └─ 5. Partner (-5% ROI) - Vermelho
```

---

## 🎯 RESUMO

```
┌────────────────────────────────────────────────────┐
│                                                    │
│  P: "APIs do Google estão respondendo?"            │
│                                                    │
│  R: ❌ NÃO                                         │
│                                                    │
│  Por quê:                                          │
│  ├─ ❌ Credenciais ausentes no .env               │
│  ├─ ❌ Nenhuma config no banco (CrmSettings)      │
│  ├─ ❌ OAuth não foi validado                     │
│  ├─ ❌ Nenhum campaign sincronizado               │
│  └─ ❌ APIs não têm tokens para autenticar        │
│                                                    │
│  Solução: 5 passos = 65 minutos total            │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

**Data**: 16/10/2025  
**Status**: ❌ GOOGLE ADS NÃO CONFIGURADO  
**Próxima Ação**: Coletar credenciais do Google Cloud Console  

---

*Veja o guia completo em: `GOOGLE_ADS_OAUTH_SETUP_GUIDE.md`*
