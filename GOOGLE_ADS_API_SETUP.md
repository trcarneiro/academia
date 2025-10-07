# 🔑 Como Obter o Developer Token do Google Ads API

## 📋 Pré-requisitos

Antes de solicitar o Developer Token, você precisa ter:

1. ✅ **Conta do Google Ads ativa** (mesmo que seja de teste)
2. ✅ **Manager Account (MCC)** - Recomendado para acesso à API
3. ✅ **Projeto no Google Cloud Console** com Google Ads API habilitada
4. ✅ **OAuth2 Credentials** configuradas (Client ID + Secret)

---

## 🚀 Passo a Passo Completo

### **Etapa 1: Acessar o Google Ads API Center**

1. Acesse sua conta do Google Ads: https://ads.google.com
2. Clique no ícone de **ferramentas** (🔧) no canto superior direito
3. Vá em **Setup** → **API Center**

**Caminho completo:**
```
Google Ads → Tools & Settings (🔧) → Setup → API Center
```

### **Etapa 2: Solicitar Acesso à API**

No API Center, você verá:

```
┌─────────────────────────────────────────────────────┐
│  Google Ads API                                     │
├─────────────────────────────────────────────────────┤
│  Developer Token: [Request Access]                  │
│  Status: NOT APPLIED                                │
│                                                      │
│  [📝 Apply for Access]                              │
└─────────────────────────────────────────────────────┘
```

Clique em **"Apply for Access"** ou **"Request Developer Token"**

### **Etapa 3: Preencher o Formulário**

O Google pedirá informações sobre:

#### **1. Basic Information**
- **Company Name:** Academia Krav Maga
- **Email:** [seu email de contato]
- **Website:** [site da sua academia]
- **Country:** Brazil

#### **2. Business Model** (copie do documento GOOGLE_ADS_API_APPLICATION.md)
```
Our company operates a martial arts training academy specializing 
in Krav Maga. We manage Google Ads campaigns exclusively for our 
own academy to promote training programs and courses. We do NOT 
manage advertising for third parties.
```

#### **3. Tool Access/Use** (copie do documento)
```
Our tool is used by internal marketing managers and CRM administrators 
to track leads, monitor campaign performance, and upload conversion 
events. The tool includes:
- CRM Dashboard for lead management
- Automated hourly sync of campaign data
- Conversion upload when students enroll
- Performance reports and ROI analytics
```

#### **4. Tool Design** (copie do documento)
```
We pull campaign metrics from the Google Ads API into our PostgreSQL 
database. Our web-based dashboard displays:
- Lead pipeline by campaign source
- Conversion rates and ROI
- Campaign performance over time

Our system uploads offline conversions via GCLID tracking when leads 
become enrolled students.
```

#### **5. API Services Called**
```
- Customer Resource: Pull account performance reports
- GoogleAdsService: Upload offline conversion events
- Campaign/AdGroup Resources: Sync campaign data (read-only)
```

#### **6. Screenshots/Mockups**
Anexe ou descreva o mockup que está no arquivo `GOOGLE_ADS_API_APPLICATION.md`

---

## 📊 Tipos de Developer Token

### **1. Test Account Token** (Aprovação Imediata)
- ✅ Aprovado automaticamente em minutos
- ✅ Funciona com contas de teste
- ⚠️ **Limitado a 15,000 operações/dia**
- ⚠️ Não funciona com contas de produção

**Status no API Center:**
```
Developer Token: abcdefghijklmnopqrstuvwx
Access Level: Test Account
```

### **2. Basic Access Token** (Aprovação em 1-3 dias)
- ✅ Funciona com contas de produção
- ✅ Até 15,000 operações/dia
- ✅ Suficiente para a maioria dos casos

**Status no API Center:**
```
Developer Token: abcdefghijklmnopqrstuvwx
Access Level: Basic
```

### **3. Standard Access Token** (Aprovação em 5-10 dias)
- ✅ Mais de 15,000 operações/dia
- ✅ Para aplicações de grande escala
- ⚠️ Requer documentação detalhada

**Status no API Center:**
```
Developer Token: abcdefghijklmnopqrstuvwx
Access Level: Standard
```

---

## ⏱️ Tempo de Aprovação

| Tipo de Token | Tempo Médio | Requisitos |
|--------------|-------------|------------|
| Test Account | Imediato | Nenhum |
| Basic Access | 1-3 dias úteis | Formulário completo |
| Standard Access | 5-10 dias úteis | Documentação + Volume justificado |

---

## 🔍 Verificar Status da Solicitação

Após solicitar, volte ao API Center:

**Se aprovado:**
```
┌─────────────────────────────────────────────────────┐
│  Developer Token: abcdefghijklmnopqrstuvwx          │
│  Access Level: Basic                                │
│  Status: APPROVED ✅                                │
│                                                      │
│  [📋 Copy Token]                                    │
└─────────────────────────────────────────────────────┘
```

**Se pendente:**
```
┌─────────────────────────────────────────────────────┐
│  Developer Token: Under Review                      │
│  Status: PENDING ⏳                                 │
│                                                      │
│  Your application is being reviewed.                │
│  You will receive an email when approved.           │
└─────────────────────────────────────────────────────┘
```

**Se negado:**
```
┌─────────────────────────────────────────────────────┐
│  Status: DENIED ❌                                  │
│                                                      │
│  Reason: [Motivo da recusa]                         │
│  [📝 Submit New Application]                        │
└─────────────────────────────────────────────────────┘
```

---

## 🛠️ Onde Usar o Developer Token

Após obter o token, configure no seu sistema:

### **1. Arquivo .env**
```bash
# Google Ads API Configuration
GOOGLE_ADS_DEVELOPER_TOKEN=abcdefghijklmnopqrstuvwx
GOOGLE_ADS_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET=GOCSPX-your-client-secret
GOOGLE_ADS_CUSTOMER_ID=123-456-7890
```

### **2. Backend (googleAdsService.ts)**
```typescript
import { GoogleAdsApi } from 'google-ads-api';

const client = new GoogleAdsApi({
  client_id: process.env.GOOGLE_ADS_CLIENT_ID,
  client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN, // ← Aqui!
});
```

### **3. Testar Autenticação**
```bash
# Rodar script de teste
npm run test:google-ads-auth

# Ou testar manualmente
curl -X POST http://localhost:3000/api/google-ads/auth/test
```

---

## ✅ Checklist Antes de Solicitar

Marque antes de enviar a solicitação:

- [ ] Tenho uma conta do Google Ads ativa
- [ ] Criei um projeto no Google Cloud Console
- [ ] Habilitei a Google Ads API no projeto
- [ ] Configurei OAuth2 Credentials
- [ ] Preparei o documento de aplicação (GOOGLE_ADS_API_APPLICATION.md)
- [ ] Tenho screenshots ou mockups do sistema
- [ ] Revisei todas as informações (sem erros de digitação)
- [ ] Email de contato está correto

---

## 🚨 Motivos Comuns de Recusa

### **1. Informações Incompletas**
❌ Formulário preenchido superficialmente
✅ Use o documento completo em GOOGLE_ADS_API_APPLICATION.md

### **2. Propósito Vago**
❌ "Vou usar para gerenciar anúncios"
✅ "Sistema CRM com sync horário, upload de conversões via GCLID, dashboard de ROI"

### **3. Sem Mockups/Screenshots**
❌ Apenas texto descrevendo o sistema
✅ Incluir diagramas, mockups ou prints da UI

### **4. Uso para Terceiros**
❌ "Vou gerenciar contas de clientes"
✅ "Uso exclusivo para minhas próprias contas"

### **5. Violação de Políticas**
❌ Web scraping, automação de cliques, dados competitivos
✅ API oficial para métricas próprias e conversões

---

## 💡 Dicas para Aprovação Rápida

1. **Seja Específico:** Descreva exatamente quais endpoints da API você vai usar
2. **Mostre o Sistema:** Anexe prints, mockups ou links (se já tiver em produção)
3. **Justifique o Volume:** Explique por que precisa de mais de 15,000 ops/dia (se for o caso)
4. **Compliance:** Enfatize que você segue todas as políticas do Google
5. **Email Profissional:** Use email corporativo (@suaempresa.com) ao invés de Gmail

---

## 📧 Acompanhamento Pós-Solicitação

O Google enviará emails para:
- ✅ Confirmação de recebimento
- ⏳ Solicitação de informações adicionais (se necessário)
- ✅ Aprovação com o token
- ❌ Recusa com motivos

**Email típico de aprovação:**
```
Subject: Your Google Ads API Developer Token is Approved

Hello,

Your application for Google Ads API access has been approved.

Developer Token: abcdefghijklmnopqrstuvwx
Access Level: Basic
Daily Operations Limit: 15,000

You can now use this token to access the Google Ads API.

Best regards,
Google Ads API Team
```

---

## 🔄 O Que Fazer Após Aprovação

1. **Copiar o Token**
   - Vá para API Center → Copy Token
   - Cole no arquivo `.env`

2. **Testar Autenticação**
   ```bash
   npm run test:google-ads-auth
   ```

3. **Fazer Primeira Chamada**
   ```bash
   curl -X GET http://localhost:3000/api/google-ads/auth/status
   ```

4. **Verificar Logs**
   ```bash
   tail -f api-server.log | grep "google-ads"
   ```

5. **Configurar Monitoramento**
   - Acompanhe quota diária no API Center
   - Configure alertas para erros de autenticação

---

## 📞 Suporte

**Se tiver problemas:**

1. **Google Ads API Forum:**
   https://groups.google.com/g/adwords-api

2. **Stack Overflow:**
   Tag: `google-ads-api`

3. **Documentação Oficial:**
   https://developers.google.com/google-ads/api/docs/start

4. **Reenviar Aplicação:**
   Se recusada, aguarde 7 dias e reenvie com melhorias

---

**Documentos Prontos:**
- ✅ `GOOGLE_ADS_API_APPLICATION.md` - Formulário completo em inglês
- ✅ `GOOGLE_ADS_API_SETUP.md` - Este guia passo a passo
- ✅ `CRON_SETUP.md` - Configuração de automação

**Boa sorte com sua solicitação! 🚀**
