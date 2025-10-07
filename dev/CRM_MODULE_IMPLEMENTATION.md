# CRM Module Implementation Progress
**Data**: 02/10/2025  
**Status**: Em Desenvolvimento - Fase Backend

---

## ✅ Completado

### 1. Schema Prisma (Database Models)
**Arquivo**: `prisma/schema.prisma`

#### Models Criados:
- ✅ **Lead** - Gerenciamento completo de leads com rastreamento de conversão
  - Dados pessoais (name, email, phone, cpf, birthDate)
  - Origem marketing (Google Ads tracking: gclid, campaign, adGroup, keyword, UTM params)
  - Pipeline (stage, status, temperature, priority, assignedTo)
  - Conversão (timestamps de cada etapa, timeToContact, timeToEnrollment)
  - Financeiro (CPA, CPC, CPL, estimated LTV, actual revenue)
  - Relacionamentos (Organization, User assigned, Student converted, Activities, Notes)

- ✅ **LeadActivity** - Histórico de atividades com leads
  - Tipos: CALL, EMAIL, WHATSAPP, SMS, MEETING, TRIAL_CLASS, FOLLOW_UP, etc.
  - Outcome tracking, next actions, duração
  - Relacionamento com User (quem fez) e Lead

- ✅ **LeadNote** - Notas e anotações sobre leads
  - Conteúdo, isPinned
  - Relacionamento com User e Lead

- ✅ **GoogleAdsCampaign** - Sync de campanhas Google Ads
  - Métricas: impressions, clicks, cost, conversions, conversionValue
  - Métricas calculadas: CTR, CPC, conversion rate, cost per conversion, ROI
  - Auto-sync periódico

- ✅ **GoogleAdsAdGroup** - Grupos de anúncios
  - Métricas por ad group
  - Relacionamento com Campaign e Keywords

- ✅ **GoogleAdsKeyword** - Palavras-chave
  - Métricas individuais por keyword
  - Quality Score tracking
  - Match type (EXACT, PHRASE, BROAD)

- ✅ **CrmSettings** - Configurações do CRM
  - Google Ads API credentials (Customer ID, tokens)
  - Conversion tracking config
  - Auto-assignment, notifications, automations

#### Enums Criados:
- ✅ **LeadStage**: NEW, CONTACTED, QUALIFIED, TRIAL_SCHEDULED, TRIAL_ATTENDED, NEGOTIATION, CONVERTED, LOST
- ✅ **LeadStatus**: ACTIVE, INACTIVE, ARCHIVED
- ✅ **LeadTemperature**: HOT, WARM, COLD
- ✅ **LeadActivityType**: CALL, EMAIL, WHATSAPP, SMS, MEETING, TRIAL_CLASS, FOLLOW_UP, NOTE, STATUS_CHANGE, DOCUMENT_SENT, PAYMENT_RECEIVED

#### Relacionamentos Adicionados:
- ✅ Organization → leads, googleAdsCampaigns, crmSettings
- ✅ User → assignedLeads, leadActivities, leadNotes
- ✅ Student → convertedFromLead (relação 1:1 com Lead)

---

### 2. Backend API Routes
**Arquivo**: `src/routes/crm.ts` (785 linhas)

#### Endpoints Implementados:

##### **Leads Management**
- ✅ `GET /api/crm/leads` - List leads com filtros avançados
  - Filtros: stage, status, temperature, assignedToId, search
  - Paginação: page, limit
  - Ordenação: sortBy, sortOrder
  - Includes: assignedTo, convertedStudent, activity counts

- ✅ `GET /api/crm/leads/:id` - Get single lead com detalhes completos
  - Includes: assignedTo, convertedStudent, activities (50 últimas), notes

- ✅ `POST /api/crm/leads` - Create new lead (webhook de formulários)
  - Auto-calcula timeToContact
  - Defaults: stage=NEW, status=ACTIVE, temperature=COLD

- ✅ `PUT /api/crm/leads/:id` - Update lead
  
- ✅ `DELETE /api/crm/leads/:id` - Delete lead

##### **Pipeline Management**
- ✅ `GET /api/crm/pipeline` - Get pipeline statistics
  - Leads por estágio (count + percentage)
  - Métricas: total leads, converted leads, conversion rate
  - Tempos médios: time to contact, time to enrollment

- ✅ `POST /api/crm/leads/:id/move` - Move lead to different stage
  - Auto-atualiza timestamps baseado no stage
  - Cria atividade automática de STATUS_CHANGE

- ✅ `POST /api/crm/leads/:id/convert` - Convert lead → student
  - **Transaction segura** (user + student + lead update + activity)
  - Cria User com password temporária
  - Cria Student linkado
  - Atualiza Lead com convertedStudentId

##### **Activities & Notes**
- ✅ `POST /api/crm/leads/:id/activities` - Add activity
- ✅ `POST /api/crm/leads/:id/notes` - Add note

##### **Analytics & Reporting**
- ✅ `GET /api/crm/analytics/roi` - ROI by campaign
  - Group by sourceCampaign
  - Calcula: total cost, total revenue, ROI %
  - Ordenado por ROI (melhor → pior)

- ✅ `GET /api/crm/analytics/funnel` - Conversion funnel
  - Count por cada stage
  - Conversion rate stage → stage

---

## 🔄 Em Progresso

### 3. Integração Server.ts
**Status**: Pendente  
**Ação**: Adicionar `crmRoutes` ao `src/server.ts`

---

## ⏳ Pendente

### 4. Frontend Module
**Arquivo**: `/public/js/modules/crm/index.js`  
**Padrão**: Single-file (como Instructors - 745 linhas)

#### Funcionalidades Planejadas:
- Dashboard CRM (métricas principais)
- Lista de leads (filtros, busca, paginação)
- Detalhes de lead (timeline, atividades, notas)
- Kanban board (arrastar leads entre stages)
- Formulário de criação/edição de lead
- Conversão lead → student (wizard)
- Analytics (ROI, funnel, campanhas)

### 5. CSS Styling
**Arquivo**: `/public/css/modules/crm.css`  
**Padrão**: Classes isoladas `.module-isolated-crm-*`

### 6. Google Ads Service
**Arquivo**: `/src/services/googleAdsService.ts`  
**Dependências**: `npm install google-ads-api`

#### Funcionalidades Planejadas:
- OAuth2 authentication flow
- Sync campaigns, ad groups, keywords
- Upload offline conversions (lead → student)
- Get campaign performance metrics
- Auto-sync scheduler (cron job)

### 7. Registro no AcademyApp
- Adicionar CRM em `loadModules()` array
- Configurar rotas no SPA Router
- Expor `window.crm` global

---

## 📊 Métricas de Código

### Prisma Schema
- **Linhas adicionadas**: ~300
- **Models**: 7 (Lead, LeadActivity, LeadNote, GoogleAdsCampaign, GoogleAdsAdGroup, GoogleAdsKeyword, CrmSettings)
- **Enums**: 4
- **Relacionamentos**: 15+

### Backend Routes
- **Linhas**: 785
- **Endpoints**: 14
- **Métodos HTTP**: GET (7), POST (5), PUT (1), DELETE (1)

### Estimativas Restantes
- **Frontend**: ~800-1000 linhas (single-file)
- **CSS**: ~300-400 linhas
- **Google Ads Service**: ~400-500 linhas
- **Total Estimado**: ~2500-3000 linhas de código

---

## 🎯 Próximos Passos (Ordem de Prioridade)

1. ✅ **[DONE]** Criar schema Prisma
2. ✅ **[DONE]** Implementar rotas backend
3. **[NEXT]** Registrar rotas no server.ts
4. **[NEXT]** Gerar Prisma Client (`npx prisma generate`)
5. **[NEXT]** Criar migration (`npx prisma migrate dev`)
6. Implementar frontend (single-file module)
7. Criar CSS isolado
8. Registrar no AcademyApp
9. Implementar Google Ads Service
10. Testes end-to-end

---

## 🚀 Como Testar (Após Completar Frontend)

### 1. Criar Lead Manual
```bash
curl -X POST http://localhost:3000/api/crm/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@teste.com",
    "phone": "+55 11 98765-4321",
    "sourceCampaign": "Krav Maga - Faixa Branca",
    "gclid": "EAIaIQobChMI...",
    "courseInterest": "Krav Maga - Faixa Branca"
  }'
```

### 2. Listar Leads
```bash
curl http://localhost:3000/api/crm/leads?stage=NEW&limit=10
```

### 3. Ver Pipeline
```bash
curl http://localhost:3000/api/crm/pipeline
```

### 4. Converter Lead → Student
```bash
curl -X POST http://localhost:3000/api/crm/leads/{id}/convert \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-id-do-vendedor",
    "billingPlanId": "billing-plan-id",
    "courseId": "course-id"
  }'
```

---

## 📚 Documentação Adicional Necessária

- [ ] Guia de setup Google Ads API
- [ ] Fluxo de OAuth2 para Google Ads
- [ ] Como configurar conversões offline
- [ ] Como interpretar métricas de ROI
- [ ] Guia de uso do CRM (usuário final)
- [ ] Scripts de seed para dados de teste

---

**Última Atualização**: 02/10/2025 - 03:45  
**Por**: GitHub Copilot  
**Status Geral**: 40% Completo (Backend + Schema prontos, faltam Frontend + Integrações)
