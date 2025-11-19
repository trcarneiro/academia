# AGENTS.MD - Guia de Desenvolvimento Academia Krav Maga v2.0

**Última atualização**: 14/11/2025  
**Versão**: 2.2.2

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Features Implementadas](#features-implementadas)
3. [Features Pendentes](#features-pendentes)
4. [Roadmap de Desenvolvimento](#roadmap-de-desenvolvimento)
5. [Arquitetura e Padrões](#arquitetura-e-padrões)

---

## 🎯 VISÃO GERAL

Sistema de gestão multi-tenant para academias de Krav Maga com foco em:
- **API-first**: Backend TypeScript + Fastify + Prisma + PostgreSQL
- **Frontend modular**: Vanilla JavaScript com módulos isolados
- **Design premium**: UI consistente com gradientes e animações
- **Multi-tenant**: Isolamento completo por organização

---

## ✅ FEATURES IMPLEMENTADAS

### 1. Módulo de Instrutores v2.1.1 (COMPLETO)

**Status**: ✅ 100% Implementado (13/11/2025)

**Funcionalidades**:
- ✅ CRUD completo de instrutores
- ✅ Campos profissionais:
  - Especializações (array)
  - Certificações (array)
  - Artes Marciais (array)
  - Experiência (texto livre)
  - Máximo de alunos por aula (número, padrão 20)
  - Valor por hora (decimal)
  - Unidades preferidas (array)
- ✅ Badges visuais na listagem:
  - 🔵 Especializações (azul/roxo)
  - 🟢 Artes Marciais (verde com 🥋)
  - 🟡 Valor/hora (dourado com 💰)
- ✅ Relacionamento instrutor ↔ cursos:
  - Tabela `InstructorCourse` com campos:
    - `isLead` (instrutor principal)
    - `certifiedAt` (data de certificação)
    - `expiresAt` (validade da certificação)
    - `notes` (observações)
  - API completa: GET, POST, PUT, DELETE
  - UI de seleção multi-curso no formulário
  - Cartões visuais com badges e metadados
  - Prevenção de duplicatas (unique constraint)

**Arquivos**:
- Backend: `src/routes/instructors.ts`, `src/routes/instructor-courses.ts`
- Frontend: `public/js/modules/instructors/index.js` (1147 linhas)
- CSS: `public/css/modules/instructors.css`
- Schema: `prisma/schema.prisma` (modelo InstructorCourse)

**Compliance**: 100% com padrões do projeto (API client, organizationId, premium UI)

**Atualizações 14/11/2025**:
- `/api/instructors` agora retorna campos profissionais completos diretamente na listagem, garantindo badges visuais consistentes sem chamadas extras.
- `scripts/create-suggested-agents.ts` cria automaticamente os agentes sugeridos (Assistente Administrativo, Agente Pedagógico e Agente de Marketing) para a organização ativa e executa uma análise inicial via orquestrador.

---

## ⏳ FEATURES PENDENTES

### 2. Integração Asaas v1.0 (EM DESENVOLVIMENTO)

**Status**: 🟡 Em Implementação (13/11/2025)

#### 2.1 Importação de Clientes (COMPLETO ✅)

**Funcionalidades Implementadas**:
- ✅ Módulo frontend `/public/js/modules/asaas-import/index.js`
- ✅ UI premium com stats cards e listagem de clientes
- ✅ Endpoint `/api/asaas/import-customer` (importação individual)
- ✅ Endpoint `/api/asaas/import-batch` (importação em lote)
- ✅ Teste de conexão com API Asaas
- ✅ Filtros por nome, email e status de importação
- ✅ Verificação de clientes já importados
- ✅ Resultados detalhados com erros
- ✅ Verificação de duplicidade respeitando o `organizationId` na importação em lote

**Arquivos**:
- Frontend: `public/js/modules/asaas-import/index.js`
- CSS: `public/css/modules/asaas-import.css`
- Backend: `src/routes/asaas-integration.ts`
- Swagger: Documentado em `/api/asaas/import-customer`

**Próximos Passos**:
1. Testar importação de clientes reais
2. Adicionar link no menu lateral para acesso fácil
3. Implementar log de importações no banco

---

#### 2.2 Envio de Cobranças (PENDENTE ⏳)

**Status**: 🔴 Não Iniciado

**Funcionalidades Planejadas**:
- Criar cobrança no Asaas para mensalidades de alunos
- Sincronizar status de pagamento (pago, vencido, pendente)
- Atualizar automaticamente status financeiro do aluno
- Gerar links de pagamento (PIX, boleto, cartão)
- Webhook para receber notificações de pagamento
- Histórico de cobranças por aluno
- Relatórios financeiros integrados

**Endpoints a Criar**:
```typescript
POST   /api/asaas/create-charge     // Criar cobrança
GET    /api/asaas/charges/:id       // Consultar cobrança
POST   /api/asaas/webhook           // Receber notificações
GET    /api/asaas/payment-history   // Histórico de pagamentos
```

**Modelo de Dados Necessário**:
```prisma
model AsaasCharge {
  id              String    @id @default(uuid())
  asaasChargeId   String    @unique  // ID da cobrança no Asaas
  studentId       String
  amount          Decimal
  dueDate         DateTime
  status          String    // PENDING, CONFIRMED, RECEIVED, OVERDUE
  paymentMethod   String?   // PIX, BOLETO, CREDIT_CARD
  invoiceUrl      String?
  paymentUrl      String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  student         Student   @relation(fields: [studentId], references: [id])
  
  @@map("asaas_charges")
}
```

**Prioridade**: Alta (após validação da importação de clientes)

---

### 3. Sistema de Turmas Inativas e Sugestões de Horários

**Status**: 🟡 Planejamento (13/11/2025)

#### 3.1 Turmas Inativas por Falta de Quórum

**Conceito**:
Turmas que existem com instrutor disponível, mas estão inativas por falta de alunos suficientes. O objetivo é:
- Mostrar ao aluno que existe a possibilidade daquela turma
- Permitir que o aluno demonstre interesse
- Quando atingir quórum mínimo, ativar a turma automaticamente

**Campos Necessários na Tabela `Turma`**:
```prisma
model Turma {
  // ... campos existentes ...
  
  // Novos campos para turmas inativas
  isActive            Boolean   @default(true)
  inactiveReason      String?   // 'LOW_ENROLLMENT', 'TEMPORARILY_SUSPENDED', etc.
  minimumStudents     Int       @default(5)    // Quórum mínimo
  interestedStudents  String[]  // IDs dos alunos interessados
  activationDate      DateTime? // Data prevista para ativação
  
  // Relação com interessados
  interests           TurmaInterest[] @relation("TurmaInterests")
}

model TurmaInterest {
  id              String    @id @default(uuid())
  turmaId         String
  studentId       String
  createdAt       DateTime  @default(now())
  notified        Boolean   @default(false)
  
  turma           Turma     @relation("TurmaInterests", ...)
  student         Student   @relation(...)
  
  @@unique([turmaId, studentId])
}
```

**UI/UX Proposta**:

1. **Dashboard do Aluno**:
   ```
   ┌─────────────────────────────────────┐
   │ 📅 Turmas Disponíveis               │
   ├─────────────────────────────────────┤
   │ ✅ Segunda 19h - Defesa Pessoal     │
   │    👥 15 alunos • Prof. João Silva  │
   │                                     │
   │ ⏸️ Quarta 20h - Combate Avançado    │
   │    ⚠️ TURMA INATIVA (3/5 alunos)   │
   │    👥 3 interessados • Prof. Maria  │
   │    [💡 Demonstrar Interesse]        │
   │                                     │
   │ 🔔 Sexta 18h - Kids Training        │
   │    ⚠️ QUASE ATIVA! (4/5 alunos)    │
   │    [✨ Seja o 5º aluno!]            │
   └─────────────────────────────────────┘
   ```

2. **Estados Visuais**:
   - ✅ **Ativa**: Verde, pode matricular imediatamente
   - ⏸️ **Inativa**: Laranja, mostra quórum necessário
   - 🔔 **Quase Ativa**: Amarelo pulsante, incentiva matrícula

3. **Notificações Automáticas**:
   - Quando turma atinge 80% do quórum → notificar interessados
   - Quando turma ativa → notificar todos interessados
   - Email/SMS/Push: "A turma de Segunda 19h está ativa! Garanta sua vaga."

**API Endpoints Necessários**:
```typescript
// Demonstrar interesse
POST /api/turmas/:id/interest
Body: { studentId: 'uuid' }
Response: { success: true, currentInterests: 4, minimumNeeded: 5 }

// Remover interesse
DELETE /api/turmas/:id/interest/:studentId

// Listar turmas com status
GET /api/turmas?includeInactive=true&organizationId=uuid
Response: {
  active: [...],
  inactive: [
    {
      id: 'uuid',
      name: 'Combate Avançado',
      schedule: 'Quarta 20h',
      instructor: {...},
      currentInterests: 3,
      minimumStudents: 5,
      interestedStudents: ['uuid1', 'uuid2', 'uuid3']
    }
  ]
}

// Ativar turma quando atingir quórum
POST /api/turmas/:id/activate
// Automático quando minimumStudents for atingido
```

**Lógica de Ativação Automática**:
```typescript
// src/services/turmaService.ts
async function checkAndActivateTurma(turmaId: string) {
  const turma = await prisma.turma.findUnique({
    where: { id: turmaId },
    include: { 
      interests: true,
      enrollments: true 
    }
  });
  
  const totalInterested = turma.interests.length + turma.enrollments.length;
  
  if (!turma.isActive && totalInterested >= turma.minimumStudents) {
    // Ativar turma
    await prisma.turma.update({
      where: { id: turmaId },
      data: { 
        isActive: true, 
        activationDate: new Date() 
      }
    });
    
    // Notificar todos interessados
    await notifyInterestedStudents(turma.interests);
  }
}
```

---

#### 2.2 Sistema de Sugestão de Horários pelos Alunos

**Conceito**:
Permitir que alunos sugiram novos horários quando não encontram opções adequadas. A academia pode avaliar demanda e criar turmas baseadas nas sugestões mais populares.

**Modelo de Dados**:
```prisma
model HorarioSugerido {
  id              String          @id @default(uuid())
  studentId       String
  organizationId  String
  
  // Dados da sugestão
  dayOfWeek       Int             // 0-6 (domingo a sábado)
  startTime       String          // "19:00"
  endTime         String          // "20:30"
  courseType      String?         // "DEFESA_PESSOAL", "COMBATE", etc.
  level           String?         // "INICIANTE", "INTERMEDIARIO", "AVANCADO"
  preferredUnit   String?         // ID da unidade preferida
  notes           String?         // Observações do aluno
  
  // Controle
  status          String          @default("PENDING") // PENDING, APPROVED, REJECTED, FULFILLED
  votes           Int             @default(1)         // Outros alunos podem "votar"
  createdAt       DateTime        @default(now())
  reviewedAt      DateTime?
  reviewedBy      String?         // ID do admin que revisou
  
  // Relações
  student         Student         @relation(...)
  organization    Organization    @relation(...)
  supporters      HorarioSupporter[] @relation("HorarioSupporters")
  createdTurma    Turma?          @relation("CreatedFromSuggestion")
  
  @@index([organizationId, status])
  @@index([dayOfWeek, startTime])
}

model HorarioSupporter {
  id              String          @id @default(uuid())
  horarioId       String
  studentId       String
  createdAt       DateTime        @default(now())
  
  horario         HorarioSugerido @relation("HorarioSupporters", ...)
  student         Student         @relation(...)
  
  @@unique([horarioId, studentId])
}
```

**UI/UX - Dashboard do Aluno**:
```
┌─────────────────────────────────────────────┐
│ 🗓️ Não encontrou o horário ideal?          │
├─────────────────────────────────────────────┤
│ [➕ Sugerir Novo Horário]                   │
│                                             │
│ 💡 Sugestões da Comunidade (vote!)         │
├─────────────────────────────────────────────┤
│ 📍 Segunda 18h - Defesa Pessoal            │
│    Unidade Centro • Nível Iniciante        │
│    👥 12 votos • Sugerido por João S.      │
│    [👍 Apoiar esta sugestão]                │
│    Status: ⏳ Em análise                    │
│                                             │
│ 📍 Quinta 21h - Combate Avançado           │
│    Unidade Zona Sul • Nível Avançado       │
│    👥 8 votos • Sugerido por Maria O.      │
│    [👍 Apoiar esta sugestão]                │
│    Status: ✅ Aprovado! Turma em breve     │
└─────────────────────────────────────────────┘
```

**Modal de Sugestão**:
```
┌──────────────────────────────────────┐
│ 💡 Sugerir Novo Horário              │
├──────────────────────────────────────┤
│ Dia da Semana:                       │
│ [▼ Segunda-feira]                    │
│                                      │
│ Horário:                             │
│ [19:00] até [20:30]                  │
│                                      │
│ Tipo de Aula:                        │
│ [▼ Defesa Pessoal]                   │
│                                      │
│ Nível:                               │
│ [▼ Iniciante]                        │
│                                      │
│ Unidade Preferida:                   │
│ [▼ Centro]                           │
│                                      │
│ Observações (opcional):              │
│ [___________________________]        │
│                                      │
│ ℹ️ Sua sugestão será avaliada pela  │
│    academia. Outros alunos poderão  │
│    apoiá-la!                         │
│                                      │
│ [Cancelar]  [✓ Enviar Sugestão]     │
└──────────────────────────────────────┘
```

**API Endpoints**:
```typescript
// Criar sugestão
POST /api/horarios-sugeridos
Body: {
  dayOfWeek: 1,
  startTime: "19:00",
  endTime: "20:30",
  courseType: "DEFESA_PESSOAL",
  level: "INICIANTE",
  preferredUnit: "uuid",
  notes: "Trabalho até às 18h"
}

// Apoiar sugestão
POST /api/horarios-sugeridos/:id/support
Body: { studentId: 'uuid' }

// Remover apoio
DELETE /api/horarios-sugeridos/:id/support

// Listar sugestões (aluno)
GET /api/horarios-sugeridos?status=PENDING&orderBy=votes

// Listar sugestões (admin)
GET /api/admin/horarios-sugeridos?status=PENDING
// Com filtros: dayOfWeek, courseType, minimumVotes

// Aprovar sugestão (admin)
POST /api/admin/horarios-sugeridos/:id/approve
Body: { createTurma: true, instructorId: 'uuid' }

// Rejeitar sugestão (admin)
POST /api/admin/horarios-sugeridos/:id/reject
Body: { reason: 'Instrutor indisponível no horário' }
```

**Dashboard Admin - Painel de Sugestões**:
```
┌──────────────────────────────────────────────────────┐
│ 📊 Sugestões de Horários - Análise                  │
├──────────────────────────────────────────────────────┤
│ Filtros: [Todas] [+10 votos] [Por dia] [Por tipo]  │
│                                                      │
│ 🔥 ALTA DEMANDA (15+ votos)                         │
├──────────────────────────────────────────────────────┤
│ 📍 Segunda 18h - Defesa Pessoal • 23 votos         │
│    Unidade: Centro • Nível: Iniciante              │
│    Sugestão: 5 dias atrás                          │
│    [✅ Criar Turma] [❌ Rejeitar] [💬 Comentar]    │
│                                                      │
│ 📊 DEMANDA MODERADA (5-14 votos)                   │
├──────────────────────────────────────────────────────┤
│ 📍 Quinta 21h - Combate • 8 votos                  │
│    [Instrutor Disponível: João Silva]              │
│    [✅ Criar Turma] [⏸️ Criar Inativa]             │
│                                                      │
│ 📋 BAIXA DEMANDA (1-4 votos)                       │
├──────────────────────────────────────────────────────┤
│ • Quarta 22h - Kids (2 votos)                      │
│ • Sábado 15h - Avançado (1 voto)                   │
└──────────────────────────────────────────────────────┘
```

**Workflow de Aprovação**:
```typescript
// Admin aprova sugestão e cria turma
async function approveSuggestion(suggestionId: string, adminId: string) {
  const suggestion = await prisma.horarioSugerido.findUnique({
    where: { id: suggestionId },
    include: { supporters: true }
  });
  
  // 1. Criar turma (inativa se poucos votos, ativa se muitos)
  const shouldActivate = suggestion.votes >= 10;
  
  const turma = await prisma.turma.create({
    data: {
      name: `${suggestion.courseType} - ${getDayName(suggestion.dayOfWeek)}`,
      dayOfWeek: suggestion.dayOfWeek,
      startTime: suggestion.startTime,
      endTime: suggestion.endTime,
      isActive: shouldActivate,
      minimumStudents: 5,
      organizationId: suggestion.organizationId,
      // ... outros campos
    }
  });
  
  // 2. Atualizar sugestão
  await prisma.horarioSugerido.update({
    where: { id: suggestionId },
    data: {
      status: 'FULFILLED',
      reviewedAt: new Date(),
      reviewedBy: adminId,
      createdTurmaId: turma.id
    }
  });
  
  // 3. Notificar todos que apoiaram
  const supporters = suggestion.supporters.map(s => s.studentId);
  await notifyStudents(supporters, {
    title: 'Sua sugestão foi aprovada! 🎉',
    body: `A turma de ${getDayName(suggestion.dayOfWeek)} às ${suggestion.startTime} está ${shouldActivate ? 'ativa' : 'aguardando quórum'}!`,
    link: `/turmas/${turma.id}`
  });
}
```

---

### 2.3 Integração: Turmas Inativas + Sugestões

**Fluxo Completo**:

1. **Aluno sugere horário** → Sistema registra sugestão
2. **Outros alunos apoiam** → Votes aumentam
3. **Admin aprova sugestão** → Cria turma INATIVA (minimumStudents: 5)
4. **Alunos demonstram interesse** → TurmaInterest aumenta
5. **Quórum atingido** → Sistema ATIVA turma automaticamente
6. **Notificações enviadas** → Todos interessados recebem
7. **Matrícula liberada** → Alunos podem se inscrever

**Métricas para Admin**:
```
┌────────────────────────────────────────┐
│ 📈 Métricas de Engajamento             │
├────────────────────────────────────────┤
│ • 5 sugestões pendentes                │
│ • 3 turmas inativas (aguardando quórum)│
│ • 12 ativações este mês                │
│ • Taxa de sucesso: 75%                 │
│                                        │
│ 🎯 Próximas Ativações Prováveis:      │
│ • Segunda 18h (4/5 alunos) - 80%      │
│ • Quinta 20h (3/5 alunos) - 60%       │
└────────────────────────────────────────┘
```

---

## 🎨 SUGESTÕES ADICIONAIS

### 3. Gamificação do Sistema de Sugestões

**Conceito**: Incentivar participação dos alunos com recompensas

**Implementações**:

1. **Badges de Contribuição**:
   - 🌟 "Pioneiro" - Primeira sugestão aprovada
   - 🚀 "Influencer" - 5+ sugestões com 10+ votos
   - 🎯 "Ativador" - Sugestão que virou turma ativa
   - 💡 "Idealizador" - 10+ sugestões enviadas

2. **Sistema de Pontos**:
   - +10 pontos: Sugestão enviada
   - +50 pontos: Sugestão aprovada
   - +100 pontos: Turma ativada e com matrícula completa
   - Pontos podem virar descontos ou brindes

3. **Ranking Mensal**:
   ```
   🏆 Top Colaboradores - Novembro 2025
   1. João Silva - 250 pontos (3 turmas criadas)
   2. Maria Oliveira - 180 pontos (5 sugestões aprovadas)
   3. Pedro Santos - 120 pontos (15 votos recebidos)
   ```

---

### 4. Chat em Tempo Real para Sugestões

**Conceito**: Permitir que alunos conversem sobre sugestões

**UI Proposta**:
```
┌─────────────────────────────────────────┐
│ 💬 Conversa: Segunda 18h - Defesa      │
├─────────────────────────────────────────┤
│ João Silva (13:45):                    │
│ "Esse horário seria perfeito depois    │
│  do trabalho!"                         │
│                                        │
│ Maria Oliveira (14:20):                │
│ "Apoiado! Moro perto da unidade       │
│  Centro também 👍"                     │
│                                        │
│ [Digite sua mensagem...]               │
└─────────────────────────────────────────┘
```

**Features**:
- WebSocket para mensagens em tempo real
- Notificações quando alguém comenta em sugestão apoiada
- Admin pode participar da conversa
- Histórico de mensagens por sugestão

---

### 5. Análise Preditiva de Demanda

**Conceito**: IA para prever quais horários terão sucesso

**Dados Analisados**:
- Histórico de sugestões
- Padrões de matrícula
- Horários de check-in mais comuns
- Localização dos alunos (preferência por unidade)
- Faixa etária e perfil

**Dashboard Admin - Insights**:
```
┌──────────────────────────────────────────┐
│ 🤖 Insights de IA - Novos Horários      │
├──────────────────────────────────────────┤
│ 🔥 ALTA PROBABILIDADE DE SUCESSO        │
│                                         │
│ 📍 Terça 19h - Defesa Pessoal          │
│    Unidade Centro                       │
│    Previsão: 15-20 alunos em 30 dias   │
│    Motivo: 8 sugestões similares,      │
│            horário pós-trabalho popular │
│    [✨ Criar Turma Piloto]             │
│                                         │
│ ⚠️ MÉDIA PROBABILIDADE                  │
│                                         │
│ 📍 Sábado 10h - Kids                   │
│    Previsão: 8-12 alunos               │
│    [📊 Ver Análise Completa]           │
└──────────────────────────────────────────┘
```

**Modelo de IA**:
- Usar histórico de dados para treinar modelo
- Inputs: dayOfWeek, startTime, courseType, unit, season
- Output: probabilidade de sucesso (0-100%)
- Recomendações: "Criar", "Aguardar mais dados", "Não recomendado"

---

### 6. Programa de Turmas Piloto

**Conceito**: Criar turmas experimentais temporárias

**Features**:
- Turma com duração limitada (ex: 4 semanas)
- Desconto para "testadores"
- Feedback obrigatório ao final
- Se sucesso (>80% presença), vira permanente

**Modelo de Dados**:
```prisma
model Turma {
  // ... campos existentes ...
  
  isPilot         Boolean   @default(false)
  pilotStartDate  DateTime?
  pilotEndDate    DateTime?
  pilotFeedback   PilotFeedback[] @relation("TurmaPilotFeedback")
}

model PilotFeedback {
  id            String    @id @default(uuid())
  turmaId       String
  studentId     String
  rating        Int       // 1-5 estrelas
  comments      String?
  wouldContinue Boolean
  createdAt     DateTime  @default(now())
  
  turma         Turma     @relation("TurmaPilotFeedback", ...)
  student       Student   @relation(...)
}
```

---

### 7. Notificações Inteligentes

**Conceito**: Notificar alunos sobre turmas relevantes

**Tipos de Notificação**:

1. **Turma quase ativa**:
   - "A turma de Segunda 19h precisa de apenas 2 alunos! 🔥"

2. **Nova turma no seu horário preferido**:
   - Baseado em histórico de sugestões/votos

3. **Instrutor favorito em nova turma**:
   - Se aluno já tem aulas com determinado instrutor

4. **Promoção para ativação**:
   - "Seja um dos primeiros 5 alunos e ganhe 20% de desconto!"

**Preferências do Aluno**:
```
┌────────────────────────────────────┐
│ 🔔 Preferências de Notificação    │
├────────────────────────────────────┤
│ ☑️ Turmas inativas próximas de    │
│    ativar                          │
│                                    │
│ ☑️ Sugestões aprovadas que apoiei │
│                                    │
│ ☑️ Novos horários no meu perfil   │
│                                    │
│ ☐ Promoções e descontos           │
│                                    │
│ Canal preferido:                   │
│ • ☑️ Email                         │
│ • ☑️ Push (app/navegador)          │
│ • ☐ SMS                            │
└────────────────────────────────────┘
```

---

## 🗓️ ROADMAP DE IMPLEMENTAÇÃO

### Fase 1: Turmas Inativas (Sprint 1-2 semanas)
- [ ] Migração Prisma (isActive, minimumStudents, TurmaInterest)
- [ ] API endpoints (interesse, ativação)
- [ ] UI badges de status no dashboard
- [ ] Lógica de ativação automática
- [ ] Notificações básicas (email)

### Fase 2: Sugestões de Horários (Sprint 2-3 semanas)
- [ ] Modelo HorarioSugerido + HorarioSupporter
- [ ] API CRUD de sugestões
- [ ] UI modal de sugestão
- [ ] Sistema de votos
- [ ] Dashboard admin de aprovação

### Fase 3: Gamificação (Sprint 1 semana)
- [ ] Sistema de badges
- [ ] Pontos e ranking
- [ ] UI de perfil com conquistas

### Fase 4: Features Avançadas (Sprint 2-3 semanas)
- [ ] Chat em tempo real (WebSocket)
- [ ] IA preditiva (integração Gemini)
- [ ] Turmas piloto
- [ ] Notificações inteligentes

### Fase 5: Refinamento (Sprint 1 semana)
- [ ] Testes end-to-end
- [ ] Documentação completa
- [ ] Treinamento para admins
- [ ] Deploy em produção

**Prazo Total Estimado**: 8-10 semanas

---

## 📚 RECURSOS TÉCNICOS

### Tecnologias a Utilizar

**Backend**:
- Prisma: Modelos e migrações
- Fastify: API endpoints
- Cron Jobs: Verificação automática de quórum
- WebSocket: Notificações em tempo real
- Gemini AI: Análise preditiva
- Scripts utilitários: `scripts/create-suggested-agents.ts` e `scripts/list-organizations.ts` (automatizam a criação de agentes e a inspeção de organizações no ambiente de desenvolvimento)

**Frontend**:
- Módulo dedicado: `/public/js/modules/turmas-sugestoes/`
- API Client: `createModuleAPI('TurmasSugestoes')`
- CSS Premium: Badges, estados visuais
- Notificações: Push API do navegador

**Integrações**:
- Email: NodeMailer ou SendGrid
- SMS: Twilio (opcional)
- Push: Firebase Cloud Messaging

---

## 💡 CONSIDERAÇÕES FINAIS

**Benefícios Esperados**:
1. **Engajamento**: Alunos se sentem ouvidos
2. **Otimização**: Criar turmas com demanda comprovada
3. **Retenção**: Mais opções de horário = menos desistências
4. **Receita**: Turmas cheias = mais receita
5. **Dados**: Insights sobre preferências dos alunos

**Métricas de Sucesso**:
- Taxa de conversão: sugestão → turma ativa > 40%
- Tempo médio de ativação: < 15 dias
- Satisfação dos alunos: > 4.5/5
- Ocupação média das turmas criadas: > 80%

---

**Próxima Revisão**: Após Sprint 1 (Turmas Inativas)  
**Responsável**: Equipe de Desenvolvimento  
**Stakeholders**: Gestores de Academia, Instrutores, Alunos

