# 🎯 Google Ads Integration Setup Guide

## 📋 Índice
1. [Pré-requisitos](#pré-requisitos)
2. [Configuração no Google Cloud Console](#google-cloud-console)
3. [Configuração no Google Ads](#google-ads)
4. [Configuração no Sistema CRM](#sistema-crm)
5. [Testando a Integração](#testando-a-integração)
6. [Sincronização de Campanhas](#sincronização-de-campanhas)
7. [Upload de Conversões Offline](#upload-de-conversões)
8. [Automação e Webhooks](#automação)
9. [Troubleshooting](#troubleshooting)

---

## 🚀 Pré-requisitos

### O que você precisa:
- ✅ Conta Google Ads ativa com campanhas rodando
- ✅ Acesso administrativo à conta Google Ads
- ✅ Conta Google Cloud Platform (GCP)
- ✅ Sistema CRM configurado e rodando
- ✅ HTTPS configurado (obrigatório para OAuth2 em produção)

### Permissões necessárias:
- **Google Ads**: Admin ou Standard (com permissão de gerenciamento)
- **Google Cloud**: Owner ou Editor do projeto

---

## 🔧 Configuração no Google Cloud Console

### 1. Criar Projeto no Google Cloud

1. Acesse: https://console.cloud.google.com/
2. Clique em "Selecionar Projeto" → "Novo Projeto"
3. Nome: `Academia CRM - Google Ads`
4. Clique em "Criar"

### 2. Habilitar Google Ads API

1. No menu lateral: **APIs & Services** → **Library**
2. Busque: `Google Ads API`
3. Clique em **Enable** (Ativar)

### 3. Criar Credenciais OAuth2

1. Acesse: **APIs & Services** → **Credentials**
2. Clique em **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Se solicitado, configure a tela de consentimento:
   - User Type: **External**
   - App name: `Academia CRM`
   - User support email: seu email
   - Developer contact: seu email
   - Scopes: `https://www.googleapis.com/auth/adwords`
4. Application type: **Web application**
5. Name: `Academia CRM - OAuth2`
6. **Authorized redirect URIs**: Adicione:
   ```
   http://localhost:3000/api/google-ads/auth/callback
   https://seu-dominio.com/api/google-ads/auth/callback
   ```
7. Clique em **Create**
8. **IMPORTANTE**: Copie e salve:
   - ✅ **Client ID**
   - ✅ **Client Secret**

---

## 📊 Configuração no Google Ads

### 1. Obter Customer ID

1. Acesse: https://ads.google.com/
2. No canto superior direito, veja o número da conta (formato: `123-456-7890`)
3. **Remova os hífens**: `1234567890`
4. ✅ Salve este número como **Customer ID**

### 2. Solicitar Developer Token

1. Acesse: https://ads.google.com/aw/apicenter
2. Clique em **Gerenciar tokens de desenvolvedor**
3. Preencha o formulário:
   - Nome da aplicação: `Academia CRM`
   - Tipo de acesso: **Teste** (para desenvolvimento)
   - Descrição: `Integração CRM para rastreamento de conversões`
4. Aceite os termos e clique em **Enviar**
5. ✅ Copie o **Developer Token** (formato: `XXXXXXXXXXXXXXXX`)

**⚠️ IMPORTANTE**: 
- Token de TESTE tem limite de 15.000 operações/dia
- Para produção, solicite token de PRODUÇÃO após aprovação do Google

### 3. Criar Ação de Conversão

1. No Google Ads, vá em: **Ferramentas** → **Medição** → **Conversões**
2. Clique em **+ Nova ação de conversão**
3. Selecione: **Importar** → **Outras fontes de dados** → **Conversões offline**
4. Configure:
   - Nome: `Lead convertido em aluno`
   - Categoria: `Lead`
   - Valor: `Usar valores diferentes para cada conversão`
   - Contagem: `Uma`
   - Janela de conversão: `30 dias`
   - Modelo de atribuição: `Último clique`
5. Clique em **Criar e continuar**
6. ✅ Copie o **Resource Name** da conversão (formato: `customers/1234567890/conversionActions/123456789`)

---

## 🎯 Configuração no Sistema CRM

### 1. Adicionar Variáveis de Ambiente

Edite o arquivo `.env` na raiz do projeto:

```env
# Google Ads Integration
GOOGLE_ADS_CLIENT_ID=seu-client-id-aqui.apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET=seu-client-secret-aqui
GOOGLE_ADS_DEVELOPER_TOKEN=seu-developer-token-aqui
GOOGLE_ADS_CUSTOMER_ID=1234567890
GOOGLE_ADS_CONVERSION_ACTION=customers/1234567890/conversionActions/123456789
GOOGLE_ADS_REDIRECT_URI=http://localhost:3000/api/google-ads/auth/callback
```

### 2. Salvar Credenciais no CRM

**Via Interface (RECOMENDADO):**

1. Acesse: `http://localhost:3000/crm`
2. Clique na aba **⚙️ Configurações**
3. Seção **Google Ads Integration**
4. Preencha:
   - Client ID
   - Client Secret
   - Developer Token
   - Customer ID
   - Conversion Action (Resource Name)
5. Clique em **Salvar Credenciais**

**Via API (cURL):**

```bash
curl -X POST http://localhost:3000/api/google-ads/auth/save-credentials \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "seu-client-id.apps.googleusercontent.com",
    "clientSecret": "seu-client-secret",
    "developerToken": "seu-developer-token",
    "customerId": "1234567890"
  }'
```

### 3. Conectar Conta Google Ads (OAuth2)

**Via Interface:**

1. Na mesma tela de configurações, clique em **Conectar Google Ads**
2. Você será redirecionado para o Google
3. Faça login com a conta que tem acesso ao Google Ads
4. Autorize o acesso à API do Google Ads
5. Após autorização, você será redirecionado de volta ao CRM
6. Verifique se aparece: ✅ **Conectado**

**Via API:**

1. Gerar URL de autorização:
```bash
curl "http://localhost:3000/api/google-ads/auth/url?clientId=SEU_CLIENT_ID&clientSecret=SEU_CLIENT_SECRET&redirectUri=http://localhost:3000/api/google-ads/auth/callback"
```

2. Abra a URL retornada no navegador
3. Autorize o acesso
4. O sistema processará o callback automaticamente

### 4. Testar Conexão

**Via Interface:**
- Clique no botão **Testar Conexão**
- Deve aparecer: ✅ **Conexão bem-sucedida**

**Via API:**
```bash
curl -X POST http://localhost:3000/api/google-ads/auth/test
```

Resposta esperada:
```json
{
  "success": true,
  "data": {
    "success": true,
    "customerId": "1234567890"
  },
  "message": "Connection successful"
}
```

---

## 🔄 Sincronização de Campanhas

### Sincronização Manual

**Via Interface:**
1. CRM → **📊 Analytics** → **Google Ads**
2. Clique em **Sincronizar Campanhas**
3. Aguarde a sincronização (pode levar alguns segundos)
4. Visualize as campanhas importadas

**Via API:**
```bash
curl -X POST http://localhost:3000/api/google-ads/sync/campaigns
```

### Sincronização Automática (Cron Job)

Adicione ao `package.json`:

```json
{
  "scripts": {
    "sync:google-ads": "tsx scripts/sync-google-ads.ts"
  }
}
```

Crie `scripts/sync-google-ads.ts`:

```typescript
import { GoogleAdsService } from '../src/services/googleAdsService';

async function syncGoogleAds() {
  const organizationId = process.env.DEFAULT_ORGANIZATION_ID!;
  const service = new GoogleAdsService(organizationId);
  
  console.log('🔄 Sincronizando campanhas do Google Ads...');
  const count = await service.syncCampaigns();
  console.log(`✅ ${count} campanhas sincronizadas`);
}

syncGoogleAds().catch(console.error);
```

Configure cron (Linux/Mac) ou Task Scheduler (Windows):

```bash
# Sincronizar a cada 6 horas
0 */6 * * * cd /path/to/academia && npm run sync:google-ads
```

---

## 📤 Upload de Conversões Offline

### Como funciona:

1. Lead chega via Google Ads (com GCLID capturado)
2. Lead é convertido em aluno no CRM
3. Sistema envia conversão de volta ao Google Ads
4. Google Ads atribui a conversão à campanha/palavra-chave

### Upload Manual de Uma Conversão

**Via Interface:**
1. Abra o lead convertido
2. Clique em **📤 Enviar conversão ao Google Ads**
3. Confirme o envio

**Via API:**
```bash
curl -X POST http://localhost:3000/api/google-ads/conversions/upload/LEAD_ID
```

### Upload em Lote (Batch)

**Listar conversões pendentes:**
```bash
curl http://localhost:3000/api/google-ads/conversions/pending
```

**Enviar todas:**
```bash
# Crie um script para pegar os IDs e enviar em lote
curl -X POST http://localhost:3000/api/google-ads/conversions/upload-batch \
  -H "Content-Type: application/json" \
  -d '{"leadIds": ["id1", "id2", "id3"]}'
```

### Automação de Upload

Adicione ao hook de conversão em `src/routes/crm.ts`:

```typescript
// Após converter lead em aluno
if (lead.gclid) {
  // Upload assíncrono ao Google Ads
  const service = new GoogleAdsService(organizationId);
  service.uploadConversion(leadId)
    .then(() => logger.info('Conversion uploaded to Google Ads'))
    .catch(err => logger.error('Failed to upload conversion', err));
}
```

---

## 🤖 Automação e Webhooks

### Captura Automática de GCLID

Adicione ao formulário de lead:

```html
<!-- Campos ocultos para capturar parâmetros UTM e GCLID -->
<input type="hidden" name="gclid" id="gclid">
<input type="hidden" name="utm_source" id="utm_source">
<input type="hidden" name="utm_medium" id="utm_medium">
<input type="hidden" name="utm_campaign" id="utm_campaign">

<script>
// Capturar GCLID da URL
const urlParams = new URLSearchParams(window.location.search);
document.getElementById('gclid').value = urlParams.get('gclid') || '';
document.getElementById('utm_source').value = urlParams.get('utm_source') || '';
document.getElementById('utm_medium').value = urlParams.get('utm_medium') || '';
document.getElementById('utm_campaign').value = urlParams.get('utm_campaign') || '';
</script>
```

### Webhook para Conversões

Crie endpoint público para receber leads externos:

```typescript
// src/routes/webhooks.ts
fastify.post('/webhook/lead', async (request, reply) => {
  const { name, email, phone, gclid, utm_source, utm_campaign } = request.body;
  
  const lead = await prisma.lead.create({
    data: {
      name,
      email,
      phone,
      gclid,
      utmSource: utm_source,
      utmCampaign: utm_campaign,
      stage: 'NEW',
      status: 'ACTIVE',
      organizationId: 'xxx',
    }
  });
  
  return reply.send({ success: true, leadId: lead.id });
});
```

---

## 🐛 Troubleshooting

### Erro: "Invalid refresh token"

**Causa**: Token OAuth2 expirado ou revogado

**Solução**:
1. Desconectar conta: `POST /api/google-ads/auth/disconnect`
2. Reconectar via OAuth2
3. Testar conexão novamente

### Erro: "Developer token has status: PENDING"

**Causa**: Developer token ainda não foi aprovado

**Solução**:
1. Acesse https://ads.google.com/aw/apicenter
2. Verifique status do token
3. Aguarde aprovação do Google (pode levar 1-2 dias)
4. Enquanto isso, use token de TESTE (limite de 15k ops/dia)

### Erro: "Customer ID not found"

**Causa**: Customer ID incorreto ou sem acesso

**Solução**:
1. Verifique o Customer ID no Google Ads (sem hífens)
2. Confirme que a conta OAuth2 tem acesso a essa conta
3. Se for conta MCC (gerente), use o ID da subconta, não do MCC

### Erro: "Conversion action not found"

**Causa**: Resource name da ação de conversão incorreto

**Solução**:
1. No Google Ads, vá em Conversões
2. Clique na conversão "Lead convertido em aluno"
3. Copie exatamente o Resource Name (formato: `customers/XXX/conversionActions/YYY`)
4. Atualize em CrmSettings

### Erro: "Missing GCLID for conversion upload"

**Causa**: Lead não tem GCLID capturado

**Solução**:
1. Verifique se o formulário está capturando o GCLID da URL
2. Teste acessando a landing page com `?gclid=teste123`
3. Confirme que o campo está sendo enviado ao criar o lead

### Taxa de conversão muito baixa

**Possíveis causas**:
- GCLID não está sendo capturado corretamente
- Conversões não estão sendo enviadas ao Google Ads
- Janela de conversão muito curta

**Soluções**:
1. Verificar captura de GCLID
2. Conferir logs de upload de conversões
3. Aumentar janela de conversão no Google Ads para 60 ou 90 dias

---

## 📊 Monitoramento e Métricas

### Painel de Analytics no CRM

Acesse: `http://localhost:3000/crm` → **📈 Analytics**

Métricas disponíveis:
- **ROI por Campanha**: Retorno sobre investimento
- **Custo por Lead (CPL)**: Quanto custa cada lead
- **Custo por Aquisição (CPA)**: Quanto custa cada aluno convertido
- **Taxa de Conversão**: % de leads que viram alunos
- **Lifetime Value (LTV)**: Valor médio por aluno

### Verificação de Dados

```bash
# Listar campanhas sincronizadas
curl http://localhost:3000/api/google-ads/campaigns

# Verificar conversões pendentes
curl http://localhost:3000/api/google-ads/conversions/pending

# Status da conexão
curl http://localhost:3000/api/google-ads/auth/status
```

---

## 🎯 Melhores Práticas

### 1. **Captura de GCLID**
- ✅ Sempre use Auto-tagging no Google Ads
- ✅ Capture GCLID em TODOS os formulários
- ✅ Armazene GCLID mesmo que o lead não converta imediatamente

### 2. **Sincronização**
- ✅ Sincronize campanhas diariamente
- ✅ Configure alertas para campanhas com baixo ROI
- ✅ Revise métricas semanalmente

### 3. **Conversões**
- ✅ Envie conversões em até 90 dias após o clique
- ✅ Use valores reais (não estimados) quando possível
- ✅ Configure webhooks para envio automático

### 4. **Segurança**
- ⚠️ NUNCA commite credenciais no Git
- ⚠️ Use HTTPS em produção (obrigatório)
- ⚠️ Renove refresh tokens periodicamente

### 5. **Otimização**
- 📊 Pause campanhas com ROI negativo
- 📊 Aumente budget de campanhas com melhor ROI
- 📊 Teste diferentes palavras-chave e anúncios
- 📊 Use dados do CRM para melhorar segmentação

---

## 📚 Recursos Adicionais

- **Documentação Google Ads API**: https://developers.google.com/google-ads/api/docs/start
- **OAuth2 Google**: https://developers.google.com/identity/protocols/oauth2
- **Conversion Tracking**: https://support.google.com/google-ads/answer/6331304
- **Best Practices**: https://developers.google.com/google-ads/api/docs/best-practices

---

## ✅ Checklist Final

Antes de considerar a integração completa:

- [ ] Conta Google Ads configurada
- [ ] Projeto Google Cloud criado
- [ ] Google Ads API habilitada
- [ ] Credenciais OAuth2 criadas
- [ ] Developer Token obtido
- [ ] Ação de conversão criada
- [ ] Variáveis de ambiente configuradas
- [ ] Credenciais salvas no CRM
- [ ] OAuth2 conectado com sucesso
- [ ] Teste de conexão passou
- [ ] Primeira sincronização de campanhas feita
- [ ] GCLID sendo capturado corretamente
- [ ] Primeira conversão enviada com sucesso
- [ ] Métricas aparecendo no CRM Analytics

---

**Versão**: 1.0.0  
**Data**: 03/10/2025  
**Status**: ✅ Produção (Ambiente de Desenvolvimento)
