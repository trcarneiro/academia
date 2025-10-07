# 🎯 CRM Module - Quick Test Guide

## ✅ Implementação Completa

### 🎉 O que foi criado:

1. **Backend (API)**
   - ✅ 7 modelos Prisma (Lead, LeadActivity, LeadNote, GoogleAds*, CrmSettings)
   - ✅ 4 enums (LeadStage, LeadStatus, LeadTemperature, LeadActivityType)
   - ✅ 14 endpoints REST (/api/crm/*)
   - ✅ Registrado no server.ts

2. **Frontend (UI)**
   - ✅ Módulo single-file (1335 linhas) em `/public/js/modules/crm/index.js`
   - ✅ CSS isolado (800+ linhas) em `/public/css/modules/crm.css`
   - ✅ Registrado no index.html
   - ✅ Rota configurada no SPA Router
   - ✅ Menu sidebar com item "CRM & Leads" 🎯

3. **Database**
   - ✅ Sincronizado via `npx prisma db push`
   - ✅ 7 tabelas criadas no PostgreSQL

---

## 🚀 Como Testar

### 1. Acessar o Módulo CRM

```
http://localhost:3000
```

- Clique no menu lateral em **"🎯 CRM & Leads"**
- Você verá o dashboard com métricas vazias (normal em primeira execução)

### 2. Criar um Lead

**Via Interface:**
1. Clique em "📋 Leads" no menu superior do CRM
2. Clique no botão "+ Novo Lead"
3. Preencha os dados:
   - Nome: João Silva
   - Email: joao@example.com
   - Telefone: (11) 99999-9999
   - Estágio: new (Novo)
   - Temperatura: hot (Quente)

**Via API (cURL):**

```bash
curl -X POST http://localhost:3000/api/crm/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@example.com",
    "phone": "11999999999",
    "stage": "NEW",
    "temperature": "HOT",
    "source": "google_ads",
    "campaign": "Krav Maga - Setembro",
    "gclid": "EAIaIQobChMI...",
    "utmSource": "google",
    "utmMedium": "cpc",
    "utmCampaign": "krav-maga-sp"
  }'
```

### 3. Navegar pelo Módulo

#### **Dashboard (🏠)**
- Total de Leads
- Taxa de Conversão
- Tempo Médio para Primeiro Contato
- Total de Conversões
- Funil de Conversão Visual
- Leads Recentes
- Leads Quentes (Hot Leads)

#### **Lista de Leads (📋)**
- Tabela com todos os leads
- Filtros: Estágio, Status, Temperatura, Busca
- Duplo-clique para ver detalhes

#### **Detalhes do Lead (👤)**
- Informações completas
- Timeline de atividades
- Notas
- Ação de conversão para aluno

#### **Pipeline (Kanban) (📊)**
- Colunas por estágio
- Drag-and-drop entre estágios
- Visualização de pipeline

#### **Analytics (📈)**
- ROI por Campanha
- Funil de Conversão Detalhado
- Drop-off entre estágios

### 4. Testar Conversão Lead → Aluno

1. Abra um lead no modo detalhes
2. Clique no botão "✅ Converter em Aluno"
3. O sistema:
   - Cria um User
   - Cria um Student
   - Atualiza o Lead com convertedAt

### 5. Verificar Endpoints (API)

```bash
# Listar leads
curl http://localhost:3000/api/crm/leads

# Obter pipeline stats
curl http://localhost:3000/api/crm/pipeline

# Obter analytics
curl http://localhost:3000/api/crm/analytics/roi
curl http://localhost:3000/api/crm/analytics/funnel
```

---

## 🔍 Troubleshooting

### ❌ "Module not available: crm"
- **Causa**: Script não carregou
- **Solução**: Verifique console do browser, force refresh (Ctrl+Shift+R)

### ❌ "Cannot POST /api/crm/leads"
- **Causa**: Rotas não registradas
- **Solução**: Verificar se server.ts tem `import crmRoutes from '@/routes/crm'`

### ❌ "Table 'leads' does not exist"
- **Causa**: Migração não executada
- **Solução**: Rodar `npx prisma db push --accept-data-loss`

### ❌ Estilos não aplicados
- **Causa**: CSS não carregado
- **Solução**: Verificar se index.html tem `<link rel="stylesheet" href="css/modules/crm.css">`

### ❌ Erro 500 ao criar lead
- **Causa**: organizationId ou userId inválidos
- **Solução**: Usar IDs do dev config:
  - User: `de5b9ba7-a5a2-4155-9277-35de0ec53fa1`
  - Organization: `a55ad715-2eb0-493c-996c-bb0f60bacec9`

---

## 📊 Estrutura de Dados

### Lead (tabela principal)
```typescript
{
  id: string (UUID)
  name: string
  email?: string
  phone?: string
  stage: LeadStage // NEW, CONTACTED, QUALIFIED, etc.
  status: LeadStatus // ACTIVE, WON, LOST
  temperature: LeadTemperature // HOT, WARM, COLD
  
  // Google Ads Tracking
  gclid?: string
  campaign?: string
  adGroup?: string
  keyword?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  
  // Conversão
  convertedToStudentId?: string
  convertedAt?: DateTime
  
  // Financeiro
  estimatedValue?: number
  actualValue?: number
  costPerAcquisition?: number
  costPerLead?: number
  lifetimeValue?: number
  roi?: number
}
```

### Estágios do Funil (LeadStage)
```
NEW → CONTACTED → QUALIFIED → TRIAL_SCHEDULED → TRIAL_ATTENDED → NEGOTIATION → WON/LOST
```

---

## 📖 Documentação Completa

- **Arquitetura**: `dev/CRM_MODULE_IMPLEMENTATION.md`
- **Endpoints**: Swagger em `http://localhost:3000/docs` (se configurado)
- **Prisma Schema**: `prisma/schema.prisma` (linhas com // CRM)

---

## 🎯 Próximos Passos (Opcional)

### 1. Integração Google Ads (OPCIONAL)
- Instalar `google-ads-api`
- Configurar OAuth2
- Sincronizar campanhas
- Upload de conversões offline

### 2. Webhooks (OPCIONAL)
- Receber leads de formulários externos
- Integrar com landing pages
- Capturar UTMs automaticamente

### 3. Automações (OPCIONAL)
- Email automático para leads quentes
- WhatsApp notifications
- Follow-up reminders

---

## ✅ Checklist de Validação

- [ ] Servidor iniciando sem erros
- [ ] Menu "CRM & Leads" visível no sidebar
- [ ] Dashboard carregando (mesmo vazio)
- [ ] Possível criar lead via interface
- [ ] Possível criar lead via API (cURL)
- [ ] Drag-and-drop funcionando no Kanban
- [ ] Conversão lead → aluno criando User + Student
- [ ] Filtros funcionando na lista de leads
- [ ] Timeline de atividades registrando ações
- [ ] Analytics mostrando ROI e funil

---

## 🐛 Reportar Problemas

Se encontrar bugs ou comportamentos inesperados:

1. Abrir console do browser (F12)
2. Verificar logs do servidor (terminal)
3. Checar requisições na aba Network
4. Consultar `AGENTS.md` e `dev/WORKFLOW.md`

---

## 📞 Suporte

Documentação adicional:
- **AGENTS.md** - Guia master do sistema
- **AUDIT_REPORT.md** - Status de conformidade de módulos
- **dev/MODULE_STANDARDS.md** - Padrões de desenvolvimento

**Versão**: 1.0.0  
**Data**: 03/10/2025  
**Status**: ✅ Produção (Dev Environment)
