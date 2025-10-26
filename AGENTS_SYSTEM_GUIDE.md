# 🤖 Sistema de Agentes Autônomos - Guia Completo

**Data:** 24/10/2025  
**Arquitetura:** MCP (Model Context Protocol) + Gemini + Prisma Database

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Tipos de Agentes](#tipos-de-agentes)
4. [Permissões de Database](#permissões-de-database)
5. [Como Criar Agentes](#como-criar-agentes)
6. [Exemplos Práticos](#exemplos-práticos)
7. [API Reference](#api-reference)
8. [MCP Tools Disponíveis](#mcp-tools-disponíveis)
9. [Automação e Triggers](#automação-e-triggers)
10. [Monitoramento e Analytics](#monitoramento-e-analytics)

---

## 🎯 VISÃO GERAL

Este sistema permite criar **agentes de IA autônomos** que podem:

- ✅ **Acessar o banco de dados** via Prisma (com permissões RBAC)
- ✅ **Executar tarefas automaticamente** (triggers, schedules)
- ✅ **Integrar com APIs externas** (WhatsApp, Google Ads, Asaas, etc.)
- ✅ **Sugerir novos agentes** baseado nas necessidades do negócio
- ✅ **Aprender com execuções anteriores** (histórico no banco)

---

## 🏗️ ARQUITETURA DO SISTEMA

```
┌─────────────────────────────────────────────────────────┐
│              AGENT ORCHESTRATOR                         │
│   - Agente mestre que gerencia outros agentes          │
│   - Sugere novos agentes baseado no negócio            │
│   - Monitora performance e logs                        │
│   - Acesso total ao banco de dados                     │
└─────────────────────────────────────────────────────────┘
                         │
           ┌─────────────┼─────────────┬─────────────┐
           ▼             ▼             ▼             ▼
    ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐
    │ Marketing │  │ Comercial │  │Pedagógico │  │Financeiro │
    │   Agent   │  │   Agent   │  │   Agent   │  │   Agent   │
    ├───────────┤  ├───────────┤  ├───────────┤  ├───────────┤
    │ Google Ads│  │ WhatsApp  │  │ Criar     │  │ Cobrança  │
    │ Email Mkt │  │ CRM       │  │ Cursos    │  │ Asaas API │
    │ Redes     │  │ Vendas    │  │ Análise   │  │ Inad      │
    └───────────┘  └───────────┘  └───────────┘  └───────────┘
           │             │             │             │
           └─────────────┼─────────────┴─────────────┘
                         ▼
                 ┌───────────────┐
                 │   DATABASE    │
                 │   (Prisma)    │
                 │   - Students  │
                 │   - Leads     │
                 │   - Courses   │
                 │   - Payments  │
                 └───────────────┘
```

---

## 🔧 TIPOS DE AGENTES

### 1. **ORCHESTRATOR** (Mestre)
- **Função:** Cria e gerencia outros agentes
- **Permissões:** Acesso total ao banco (READ, WRITE, DELETE, CREATE)
- **Uso:** Sistema interno, não exposto para usuários finais

### 2. **MARKETING**
- **Função:** Campanhas Google Ads, Email Marketing, Redes Sociais
- **Tabelas:** Student, Lead, Campaign, Analytics
- **Permissões:** READ, WRITE
- **Integrações:** Google Ads API, Mailchimp, Instagram Graph API

### 3. **COMERCIAL**
- **Função:** WhatsApp Business, CRM, Follow-up de Vendas
- **Tabelas:** Student, Lead, Subscription, BillingPlan, FinancialResponsible
- **Permissões:** READ, WRITE, CREATE
- **Integrações:** WhatsApp Business API, Twilio, HubSpot

### 4. **PEDAGÓGICO**
- **Função:** Criação de Cursos, Planos de Aula, Análise de Progresso
- **Tabelas:** Student, Course, LessonPlan, Activity, TurmaAttendance, StudentCourse
- **Permissões:** READ, WRITE, CREATE
- **Integrações:** Sistema interno (RAG para sugestões)

### 5. **FINANCEIRO**
- **Função:** Pagamentos, Cobranças, Detecção de Inadimplência
- **Tabelas:** Subscription, BillingPlan, FinancialResponsible, Student
- **Permissões:** READ, WRITE
- **Integrações:** Asaas API, Stripe, PagSeguro

### 6. **ATENDIMENTO**
- **Função:** Chatbot 24/7, FAQ, Suporte
- **Tabelas:** Student, Lead, Course, LessonPlan
- **Permissões:** READ (somente leitura)
- **Integrações:** Website Chat, Facebook Messenger

---

## 🔐 PERMISSÕES DE DATABASE

Cada agente tem acesso controlado ao banco via **RBAC (Role-Based Access Control)**:

```typescript
const AGENT_PERMISSIONS = {
    MARKETING: {
        tables: ['Student', 'Lead', 'Campaign', 'Analytics'],
        operations: ['READ', 'WRITE']
    },
    COMERCIAL: {
        tables: ['Student', 'Lead', 'Subscription', 'BillingPlan'],
        operations: ['READ', 'WRITE', 'CREATE']
    },
    // ... outros tipos
};
```

**Exemplo de Validação:**
```typescript
// ❌ Agente de Marketing tenta deletar um aluno
agent.delete('Student', id) // ERRO: Operação não permitida

// ✅ Agente de Marketing atualiza status de Lead
agent.update('Lead', id, { status: 'contacted' }) // OK
```

---

## 🚀 COMO CRIAR AGENTES

### Método 1: Sugestão Automática (Recomendado)

**Passo 1:** Peça para o Orchestrator sugerir agentes

```bash
POST /api/agents/orchestrator/suggest
Headers: x-organization-id: <uuid>
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "organizationStats": {
      "students": 127,
      "courses": 5,
      "leads": 43,
      "subscriptions": 98
    },
    "suggestedAgents": [
      {
        "name": "Agente de Cobrança Inteligente",
        "type": "financeiro",
        "description": "Você tem 29 alunos com pagamentos atrasados. Este agente pode automatizar cobranças via Asaas.",
        "justificativa": "Alta taxa de inadimplência detectada",
        "tools": ["asaas_api", "email_sender", "sms_sender"],
        "automationRules": [
          {
            "trigger": "payment_overdue",
            "action": "send_payment_reminder"
          }
        ]
      },
      {
        "name": "Agente de Conversão de Leads",
        "type": "comercial",
        "description": "Você tem 43 leads não contatados. Este agente pode enviar mensagens via WhatsApp Business.",
        "justificativa": "Alto volume de leads sem follow-up",
        "tools": ["whatsapp_business_api", "crm_api"],
        "automationRules": [
          {
            "trigger": "new_lead_created",
            "action": "send_welcome_message"
          }
        ]
      }
    ]
  }
}
```

**Passo 2:** Criar o agente sugerido

```bash
POST /api/agents/orchestrator/create
Headers: x-organization-id: <uuid>
Body: {
  "name": "Agente de Cobrança Inteligente",
  "type": "financeiro",
  "description": "Automatiza cobranças de pagamentos atrasados",
  "systemPrompt": "Você gerencia cobranças. Seja gentil mas firme. Ofereça parcelamento quando necessário.",
  "tools": ["asaas_api", "email_sender", "sms_sender"],
  "automationRules": [
    {
      "trigger": "payment_overdue",
      "action": "send_payment_reminder"
    },
    {
      "trigger": "cron:0 10 * * *",
      "action": "check_overdue_payments"
    }
  ],
  "isActive": true
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": "agent-uuid-123",
    "name": "Agente de Cobrança Inteligente",
    "type": "financeiro",
    "isActive": true,
    "createdAt": "2025-10-24T13:00:00.000Z"
  }
}
```

### Método 2: Templates Pré-configurados

```bash
GET /api/agents/orchestrator/templates
```

**Resposta:** 5 templates prontos para usar (Marketing, Comercial, Pedagógico, Financeiro, Atendimento)

**Passo 1:** Escolha um template  
**Passo 2:** Personalize (nome, systemPrompt)  
**Passo 3:** Crie via `POST /api/agents/orchestrator/create`

---

## 💡 EXEMPLOS PRÁTICOS

### Exemplo 1: Agente de Marketing Criando Campanha Google Ads

**Cenário:** Você tem baixa captação de leads este mês.

**Executar Agente:**
```bash
POST /api/agents/orchestrator/execute/agent-marketing-123
Body: {
  "task": "Crie uma campanha no Google Ads para atrair novos alunos. Budget: R$ 500. Público-alvo: Homens e mulheres 18-35 anos, interessados em artes marciais e defesa pessoal.",
  "context": {
    "currentLeads": 12,
    "targetLeads": 50,
    "budget": 500,
    "location": "São Paulo, SP"
  }
}
```

**Resposta do Agente:**
```json
{
  "success": true,
  "agentName": "Agente de Marketing",
  "action": "create_google_ads_campaign",
  "data": {
    "campaignId": "123456789",
    "campaignName": "Krav Maga - Defesa Pessoal SP",
    "budget": 500,
    "keywords": ["krav maga", "defesa pessoal", "artes marciais sp"],
    "adCopy": {
      "headline": "Aprenda Krav Maga - Aula Grátis",
      "description": "Defesa pessoal eficaz. Aula experimental sem compromisso. 127 alunos satisfeitos."
    },
    "targetAudience": {
      "age": "18-35",
      "gender": "all",
      "location": "São Paulo, 50km radius"
    },
    "status": "active"
  },
  "executionTime": 3420,
  "databaseOperations": [
    {
      "table": "Campaign",
      "operation": "CREATE",
      "recordsAffected": 1
    }
  ]
}
```

### Exemplo 2: Agente Comercial Respondendo Leads via WhatsApp

**Trigger Automático:** Novo lead criado via site

**Ação do Agente:**
```javascript
// Sistema detecta novo lead
const lead = { 
  name: "João Silva", 
  phone: "+5511999887766",
  source: "google_ads"
};

// Agente Comercial é disparado automaticamente
agent.executeAutomationRule('new_lead_created', lead);
```

**Mensagem Enviada (WhatsApp):**
```
Olá João! 👋

Vi que você se interessou pelas aulas de Krav Maga. 

Nossa academia oferece:
✅ Aula experimental GRÁTIS
✅ Horários flexíveis (manhã, tarde, noite)
✅ Instrutores certificados
✅ 127 alunos satisfeitos

Gostaria de agendar sua aula grátis? Temos vagas para amanhã às 19h. 😊

Qual o melhor horário para você?
```

### Exemplo 3: Agente Pedagógico Criando Plano de Aula

**Executar Agente:**
```bash
POST /api/agents/orchestrator/execute/agent-pedagogico-456
Body: {
  "task": "Crie um plano de aula de 60 minutos para alunos de nível intermediário. Foco: defesa contra agarramentos.",
  "context": {
    "courseId": "course-uuid-789",
    "level": "intermediate",
    "duration": 60,
    "focus": "grappling defense"
  }
}
```

**Resposta do Agente:**
```json
{
  "success": true,
  "agentName": "Agente Pedagógico",
  "action": "create_lesson_plan",
  "data": {
    "lessonPlanId": "lesson-uuid-101",
    "title": "Defesa Contra Agarramentos - Nível Intermediário",
    "duration": 60,
    "structure": {
      "warmup": {
        "duration": 10,
        "activities": ["Corrida estática", "Alongamento dinâmico", "Sombra de golpes"]
      },
      "technique_practice": {
        "duration": 30,
        "techniques": [
          {
            "name": "Defesa contra abraço por trás",
            "repetitions": 20,
            "intensity": "medium"
          },
          {
            "name": "Escape de gravata frontal",
            "repetitions": 15,
            "intensity": "high"
          },
          {
            "name": "Contra-ataque pós escape",
            "repetitions": 10,
            "intensity": "high"
          }
        ]
      },
      "drills": {
        "duration": 15,
        "description": "Sparring controlado com foco em escapes"
      },
      "cooldown": {
        "duration": 5,
        "activities": ["Alongamento estático", "Respiração"]
      }
    },
    "materials": ["Kimonos", "Protetor bucal", "Tatame"]
  },
  "executionTime": 2150,
  "databaseOperations": [
    {
      "table": "LessonPlan",
      "operation": "CREATE",
      "recordsAffected": 1
    },
    {
      "table": "LessonPlanActivity",
      "operation": "CREATE",
      "recordsAffected": 3
    }
  ]
}
```

---

## 📡 API REFERENCE

### **1. Sugerir Agentes**
```http
POST /api/agents/orchestrator/suggest
Headers: x-organization-id: <uuid>
Response: { success: true, data: { suggestedAgents: [...] } }
```

### **2. Criar Agente**
```http
POST /api/agents/orchestrator/create
Headers: x-organization-id: <uuid>
Body: { name, type, description, systemPrompt, tools, automationRules, isActive }
Response: { success: true, data: { id, name, type, ... } }
```

### **3. Listar Agentes**
```http
GET /api/agents/orchestrator/list
Headers: x-organization-id: <uuid>
Response: { success: true, data: [agents...] }
```

### **4. Executar Agente**
```http
POST /api/agents/orchestrator/execute/:agentId
Body: { task: string, context?: object }
Response: { success: true, data: {...}, executionTime: number }
```

### **5. Monitorar Performance**
```http
GET /api/agents/orchestrator/monitor
Headers: x-organization-id: <uuid>
Response: { 
  success: true, 
  data: { 
    totalAgents: 5, 
    activeAgents: 4, 
    metrics: [...]
  } 
}
```

### **6. Obter Templates**
```http
GET /api/agents/orchestrator/templates
Response: { success: true, data: [templates...] }
```

---

## 🛠️ MCP TOOLS DISPONÍVEIS

Cada agente pode usar ferramentas MCP específicas:

| Tool | Descrição | Agentes Permitidos |
|------|-----------|-------------------|
| `database_read` | Ler dados do banco | Todos |
| `database_write` | Escrever no banco | Comercial, Pedagógico, Financeiro |
| `database_create` | Criar registros | Comercial, Pedagógico |
| `google_ads_api` | Criar/gerenciar campanhas | Marketing |
| `email_sender` | Enviar emails | Marketing, Financeiro, Atendimento |
| `sms_sender` | Enviar SMS | Marketing, Financeiro |
| `whatsapp_business_api` | Enviar mensagens WhatsApp | Comercial, Atendimento |
| `asaas_api` | Gerenciar pagamentos/cobranças | Financeiro |
| `crm_api` | Integrar com CRM externo | Comercial |
| `social_media_poster` | Postar em redes sociais | Marketing |
| `calendar_api` | Agendar eventos | Comercial |
| `knowledge_base_search` | Buscar em base de conhecimento (RAG) | Atendimento, Pedagógico |
| `lesson_generator` | Gerar planos de aula | Pedagógico |

---

## ⚡ AUTOMAÇÃO E TRIGGERS

### Tipos de Triggers

#### 1. **Event-Based** (Baseado em Eventos)
Agente é disparado quando algo acontece no sistema.

**Exemplos:**
- `new_lead_created` → Agente Comercial envia WhatsApp
- `payment_overdue` → Agente Financeiro envia cobrança
- `student_attendance_low` → Agente Pedagógico analisa engajamento

#### 2. **Schedule-Based** (Baseado em Horário - Cron)
Agente executa em horários específicos.

**Exemplos:**
- `cron:0 9 * * 1` → Toda segunda às 9h (relatório semanal)
- `cron:0 10 * * *` → Todo dia às 10h (verificar inadimplência)
- `cron:0 0 1 * *` → Todo dia 1 do mês (enviar relatório mensal)

#### 3. **Condition-Based** (Baseado em Condições)
Agente verifica uma condição e age.

**Exemplos:**
- `if leads < 20 then create_google_ads_campaign`
- `if attendance_rate < 70% then send_engagement_email`
- `if overdue_payments > 10 then send_bulk_reminder`

### Configuração de Automação

```typescript
const automationRules = [
    {
        trigger: 'new_lead_created',
        action: 'send_welcome_message'
    },
    {
        trigger: 'cron:0 10 * * *',
        action: 'check_overdue_payments'
    },
    {
        trigger: 'student_attendance_low',
        action: 'analyze_and_suggest_engagement',
        condition: 'attendance_rate < 70%'
    }
];
```

---

## 📊 MONITORAMENTO E ANALYTICS

### Dashboard de Monitoramento

```bash
GET /api/agents/orchestrator/monitor
```

**Métricas Disponíveis:**

1. **Total de Agentes:** Quantos agentes existem
2. **Agentes Ativos:** Quantos estão em execução
3. **Total de Execuções (24h):** Quantas tarefas foram executadas
4. **Tempo Médio de Execução:** Performance média
5. **Taxa de Sucesso:** % de execuções bem-sucedidas
6. **Última Execução:** Timestamp da última atividade

**Exemplo de Resposta:**
```json
{
  "success": true,
  "data": {
    "totalAgents": 5,
    "activeAgents": 4,
    "metrics": [
      {
        "agentId": "agent-uuid-123",
        "name": "Agente de Marketing",
        "type": "marketing",
        "isActive": true,
        "totalExecutions": 42,
        "avgExecutionTime": 2340,
        "successRate": 0.95,
        "lastExecution": "2025-10-24T12:30:00.000Z"
      },
      {
        "agentId": "agent-uuid-456",
        "name": "Agente Comercial WhatsApp",
        "type": "comercial",
        "isActive": true,
        "totalExecutions": 127,
        "avgExecutionTime": 890,
        "successRate": 0.98,
        "lastExecution": "2025-10-24T13:15:00.000Z"
      }
    ]
  }
}
```

---

## 🔥 PRÓXIMOS PASSOS

### Fase 1: Backend Completo ✅
- [x] Schema Prisma (Agent, AgentExecution)
- [x] Service (AgentOrchestratorService)
- [x] Routes (6 endpoints)
- [x] Integração Gemini

### Fase 2: Frontend (Interface Web)
- [ ] Módulo de Agentes no menu lateral
- [ ] Dashboard de agentes (listar, criar, editar)
- [ ] Monitor de performance (gráficos)
- [ ] Logs de execução em tempo real

### Fase 3: Integrações Externas
- [ ] WhatsApp Business API
- [ ] Google Ads API
- [ ] Asaas API (já existe, integrar)
- [ ] Mailchimp/SendGrid

### Fase 4: Inteligência Avançada
- [ ] Aprendizado com execuções anteriores
- [ ] Auto-otimização de prompts
- [ ] Detecção de anomalias
- [ ] Sugestões proativas

---

## 🎓 RESUMO EXECUTIVO

**O que você acabou de ganhar:**

1. ✅ **5 tipos de agentes** prontos para criar (Marketing, Comercial, Pedagógico, Financeiro, Atendimento)
2. ✅ **6 endpoints de API** para gerenciar agentes
3. ✅ **Acesso controlado ao banco** via RBAC
4. ✅ **Automação completa** (eventos, schedules, condições)
5. ✅ **Sugestão inteligente** de agentes baseada no negócio
6. ✅ **Monitoramento e analytics** em tempo real

**Como começar:**

```bash
# 1. Migrar o banco de dados
npx prisma migrate dev --name add_agents_system

# 2. Reiniciar o servidor
npm run dev

# 3. Sugerir agentes para sua academia
POST http://localhost:3000/api/agents/orchestrator/suggest
Headers: x-organization-id: <seu-uuid>

# 4. Criar o primeiro agente
POST http://localhost:3000/api/agents/orchestrator/create
Body: { ... dados do agente sugerido ... }

# 5. Executar o agente
POST http://localhost:3000/api/agents/orchestrator/execute/<agent-id>
Body: { task: "Sua tarefa aqui" }
```

**Próximo:** Criar a interface web para gerenciar os agentes visualmente! 🚀

---

**Criado por:** AI Agent Orchestrator  
**Versão:** 1.0  
**Data:** 24/10/2025
