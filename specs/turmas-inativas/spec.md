# Especificação: Sistema de Turmas Inativas e Sugestões de Horários

**Versão**: 1.0  
**Data**: 29/11/2025  
**Status**: ⏸️ SUSPENSO - Implementação Adiada  
**Fonte**: AGENTS.md v2.2.2  
**Última Revisão**: 29/11/2025

---

## 🚫 NOTA DE SUSPENSÃO

Esta feature está **suspensa** e aguardando priorização futura. As especificações abaixo estão **completas e revisadas**, prontas para implementação quando decidido.

**Dependências identificadas**:
- Configurações de organização (quórum mínimo, limite de sugestões)
- Sistema de gamificação do curso (para badges)
- Sistema de notificações multi-canal

---

## ✅ DECISÕES TOMADAS (29/11/2025)

| # | Questão | Decisão |
|---|---------|---------|
| 1 | Quórum mínimo | Configurável por organização (não fixo em 5) |
| 2 | inactiveReason | Valores atuais OK: LOW_ENROLLMENT, TEMPORARILY_SUSPENDED, INSTRUCTOR_UNAVAILABLE, SEASONAL |
| 3 | Tipos de aula | DEFESA_PESSOAL, COMBATE, KIDS, FEMININO, OPERACIONAL, JIU_JITSU_GI, JIU_JITSU_NO_GI, BOXE |
| 4 | Limite sugestões | Configurável por organização |
| 5 | Expiração sugestões | 30 dias |
| 6 | UI turmas inativas | Seção separada + botão CTA para sugerir |
| 7 | Privacidade | Mostrar primeiro nome dos interessados |
| 8 | Notificações | Todos canais: Email, Push, SMS, In-app |
| 9 | Verificação quórum | Imediata + Cron job (ambos) |
| 10 | Gamificação v1 | Sim, mas depende de finalizar estrutura de gamificação do curso |
| 11 | Turmas piloto | Sim, relevante para operação |

---

## 📋 ÍNDICE

1. [Visão Geral](#1-visão-geral)
2. [Parte 1: Turmas Inativas por Falta de Quórum](#2-parte-1-turmas-inativas-por-falta-de-quórum)
3. [Parte 2: Sistema de Sugestão de Horários](#3-parte-2-sistema-de-sugestão-de-horários)
4. [Integração entre Funcionalidades](#4-integração-entre-funcionalidades)
5. [Features Adicionais (Opcional)](#5-features-adicionais-opcional)
6. [Roadmap de Implementação](#6-roadmap-de-implementação)
7. [Questões para Revisão](#7-questões-para-revisão)

---

## 1. Visão Geral

### 1.1 Problema a Resolver

Atualmente, turmas só existem quando estão ativas. Isso significa que:
- Alunos não sabem que podem existir outras opções de horário
- A academia não tem visibilidade da demanda reprimida
- Oportunidades de novos horários são perdidas por falta de informação

### 1.2 Solução Proposta

Sistema em duas partes:
1. **Turmas Inativas**: Turmas que existem com instrutor disponível, mas aguardam quórum mínimo de alunos
2. **Sugestões de Horários**: Alunos podem sugerir novos horários e votar em sugestões existentes

### 1.3 Benefícios Esperados

- **Engajamento**: Alunos se sentem ouvidos
- **Otimização**: Criar turmas com demanda comprovada
- **Retenção**: Mais opções de horário = menos desistências
- **Receita**: Turmas cheias = mais receita
- **Dados**: Insights sobre preferências dos alunos

---

## 2. Parte 1: Turmas Inativas por Falta de Quórum

### 2.1 Conceito

Turmas que existem com instrutor disponível, mas estão inativas por falta de alunos suficientes. O objetivo é:
- Mostrar ao aluno que existe a possibilidade daquela turma
- Permitir que o aluno demonstre interesse
- Quando atingir quórum mínimo, ativar a turma automaticamente

### 2.2 Modelo de Dados (Prisma)

```prisma
model Turma {
  // ... campos existentes ...
  
  // Novos campos para turmas inativas
  isActive            Boolean   @default(true)
  inactiveReason      String?   // 'LOW_ENROLLMENT', 'TEMPORARILY_SUSPENDED', etc.
  minimumStudents     Int       @default(5)    // Quórum mínimo
  interestedStudents  String[]  // IDs dos alunos interessados (deprecated - usar TurmaInterest)
  activationDate      DateTime? // Data prevista para ativação
  
  // Relação com interessados
  interests           TurmaInterest[] @relation("TurmaInterests")
}

model TurmaInterest {
  id              String    @id @default(uuid())
  turmaId         String
  studentId       String
  createdAt       DateTime  @default(now())
  notified        Boolean   @default(false)  // Se já foi notificado sobre ativação
  
  turma           Turma     @relation("TurmaInterests", fields: [turmaId], references: [id])
  student         Student   @relation(fields: [studentId], references: [id])
  
  @@unique([turmaId, studentId])
  @@map("turma_interests")
}
```

#### 📝 QUESTÃO: Valores do inactiveReason

Sugeridos:
- `LOW_ENROLLMENT` - Falta de quórum
- `TEMPORARILY_SUSPENDED` - Suspensa temporariamente (férias, reformas)
- `INSTRUCTOR_UNAVAILABLE` - Instrutor indisponível
- `SEASONAL` - Turma sazonal (verão, etc)

**→ Você quer adicionar ou modificar algum motivo?**

---

### 2.3 Estados Visuais da Turma

| Estado | Ícone | Cor | Descrição |
|--------|-------|-----|-----------|
| **Ativa** | ✅ | Verde | Pode matricular imediatamente |
| **Inativa** | ⏸️ | Laranja | Mostra quórum necessário |
| **Quase Ativa** | 🔔 | Amarelo pulsante | 80%+ do quórum, incentiva matrícula |

---

### 2.4 UI/UX - Dashboard do Aluno

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

#### 📝 QUESTÃO: Onde exibir turmas inativas?

Opções:
1. **Na mesma listagem de turmas** (com badge de status)
2. **Em seção separada** ("Turmas aguardando quórum")
3. **Tab dedicada** na página de turmas
4. **Widget no dashboard** do aluno

**→ Qual abordagem você prefere?**

---

### 2.5 API Endpoints

```typescript
// Demonstrar interesse em uma turma inativa
POST /api/turmas/:id/interest
Body: { studentId: 'uuid' }
Response: { 
  success: true, 
  currentInterests: 4, 
  minimumNeeded: 5,
  message: 'Interesse registrado! Falta apenas 1 aluno para ativar a turma.'
}

// Remover interesse
DELETE /api/turmas/:id/interest/:studentId
Response: { success: true }

// Listar turmas com status de ativação
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
      interestedStudents: ['uuid1', 'uuid2', 'uuid3'],
      percentageFilled: 60,
      status: 'INACTIVE' | 'ALMOST_ACTIVE' | 'ACTIVE'
    }
  ]
}

// Ativar turma manualmente (admin)
POST /api/turmas/:id/activate
Response: { success: true, turma: {...} }

// Desativar turma (admin)
POST /api/turmas/:id/deactivate
Body: { reason: 'LOW_ENROLLMENT' }
```

---

### 2.6 Lógica de Ativação Automática

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
        activationDate: new Date(),
        inactiveReason: null
      }
    });
    
    // Notificar todos interessados
    await notifyInterestedStudents(turma.interests);
    
    return { activated: true, turma };
  }
  
  return { activated: false, currentCount: totalInterested, needed: turma.minimumStudents };
}
```

#### 📝 QUESTÃO: Quando rodar a verificação?

Opções:
1. **Imediatamente** após cada novo interesse
2. **Cron Job** (ex: a cada hora)
3. **Ambos** (imediato + cron de fallback)

**→ Qual abordagem?**

---

### 2.7 Notificações Automáticas

| Evento | Notificação |
|--------|-------------|
| Turma atinge 80% do quórum | "A turma de Segunda 19h precisa de apenas 1 aluno! 🔥" |
| Turma ativada | "A turma de Segunda 19h está ativa! Garanta sua vaga." |
| Novo interessado (para quem já demonstrou interesse) | "Mais 1 pessoa interessada na turma de Segunda 19h (4/5)" |

---

## 3. Parte 2: Sistema de Sugestão de Horários

### 3.1 Conceito

Permitir que alunos sugiram novos horários quando não encontram opções adequadas. A academia pode avaliar demanda e criar turmas baseadas nas sugestões mais populares.

### 3.2 Modelo de Dados (Prisma)

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
  status          String          @default("PENDING") 
                                  // PENDING, APPROVED, REJECTED, FULFILLED
  votes           Int             @default(1)  // Contagem de votos (incluindo criador)
  createdAt       DateTime        @default(now())
  reviewedAt      DateTime?
  reviewedBy      String?         // ID do admin que revisou
  rejectionReason String?         // Motivo da rejeição
  
  // Relações
  student         Student         @relation(fields: [studentId], references: [id])
  organization    Organization    @relation(fields: [organizationId], references: [id])
  supporters      HorarioSupporter[] @relation("HorarioSupporters")
  createdTurma    Turma?          @relation("CreatedFromSuggestion", fields: [createdTurmaId], references: [id])
  createdTurmaId  String?
  
  @@index([organizationId, status])
  @@index([dayOfWeek, startTime])
  @@map("horarios_sugeridos")
}

model HorarioSupporter {
  id              String          @id @default(uuid())
  horarioId       String
  studentId       String
  createdAt       DateTime        @default(now())
  
  horario         HorarioSugerido @relation("HorarioSupporters", fields: [horarioId], references: [id])
  student         Student         @relation(fields: [studentId], references: [id])
  
  @@unique([horarioId, studentId])
  @@map("horario_supporters")
}
```

#### 📝 QUESTÃO: Níveis e Tipos de Aula

Sugeridos para `level`:
- `INICIANTE`
- `INTERMEDIARIO`
- `AVANCADO`
- `TODOS` (qualquer nível)

Sugeridos para `courseType`:
- `DEFESA_PESSOAL`
- `COMBATE`
- `KIDS`
- `FEMININO`
- `OPERACIONAL` (forças de segurança)

**→ Esses valores estão corretos para sua academia? Precisa adicionar/remover?**

---

### 3.3 UI/UX - Dashboard do Aluno

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

---

### 3.4 Formulário de Sugestão

```
┌──────────────────────────────────────┐
│ 💡 Sugerir Novo Horário              │
├──────────────────────────────────────┤
│ Dia da Semana: *                     │
│ [▼ Segunda-feira]                    │
│                                      │
│ Horário: *                           │
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

---

### 3.5 API Endpoints - Aluno

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
Response: { success: true, suggestion: {...} }

// Apoiar sugestão
POST /api/horarios-sugeridos/:id/support
Body: { studentId: 'uuid' }
Response: { success: true, newVoteCount: 13 }

// Remover apoio
DELETE /api/horarios-sugeridos/:id/support
Response: { success: true }

// Listar sugestões (aluno)
GET /api/horarios-sugeridos?status=PENDING&orderBy=votes
Response: { 
  success: true, 
  suggestions: [...],
  mySuggestions: [...],
  mySupports: [...] 
}
```

---

### 3.6 Dashboard Admin - Painel de Sugestões

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

---

### 3.7 API Endpoints - Admin

```typescript
// Listar sugestões (admin - com mais detalhes)
GET /api/admin/horarios-sugeridos?status=PENDING
// Com filtros: dayOfWeek, courseType, minimumVotes
Response: { 
  suggestions: [...],
  stats: {
    pending: 12,
    approved: 8,
    rejected: 3,
    fulfilled: 5
  }
}

// Aprovar sugestão
POST /api/admin/horarios-sugeridos/:id/approve
Body: { 
  createTurma: true,        // Criar turma automaticamente?
  instructorId: 'uuid',     // Se criando turma
  startActive: false        // Começar como inativa (aguardar quórum)?
}
Response: { success: true, turma: {...} }

// Rejeitar sugestão
POST /api/admin/horarios-sugeridos/:id/reject
Body: { reason: 'Instrutor indisponível no horário' }
Response: { success: true }
```

---

### 3.8 Workflow de Aprovação

```typescript
// Admin aprova sugestão e cria turma
async function approveSuggestion(
  suggestionId: string, 
  adminId: string,
  options: { createTurma: boolean, instructorId?: string, startActive?: boolean }
) {
  const suggestion = await prisma.horarioSugerido.findUnique({
    where: { id: suggestionId },
    include: { supporters: true }
  });
  
  let turma = null;
  
  if (options.createTurma) {
    // Decidir se começa ativa ou inativa
    const shouldActivate = options.startActive ?? (suggestion.votes >= 10);
    
    turma = await prisma.turma.create({
      data: {
        name: `${suggestion.courseType} - ${getDayName(suggestion.dayOfWeek)}`,
        dayOfWeek: suggestion.dayOfWeek,
        startTime: suggestion.startTime,
        endTime: suggestion.endTime,
        isActive: shouldActivate,
        minimumStudents: 5,
        organizationId: suggestion.organizationId,
        instructorId: options.instructorId,
        // ... outros campos
      }
    });
  }
  
  // Atualizar sugestão
  await prisma.horarioSugerido.update({
    where: { id: suggestionId },
    data: {
      status: options.createTurma ? 'FULFILLED' : 'APPROVED',
      reviewedAt: new Date(),
      reviewedBy: adminId,
      createdTurmaId: turma?.id
    }
  });
  
  // Notificar todos que apoiaram
  const supporters = suggestion.supporters.map(s => s.studentId);
  await notifyStudents(supporters, {
    title: 'Sua sugestão foi aprovada! 🎉',
    body: turma 
      ? `A turma de ${getDayName(suggestion.dayOfWeek)} às ${suggestion.startTime} foi criada!`
      : 'A academia está avaliando a criação desta turma.',
    link: turma ? `/turmas/${turma.id}` : '/sugestoes'
  });
  
  return { suggestion, turma };
}
```

---

## 4. Integração entre Funcionalidades

### 4.1 Fluxo Completo

```
1. Aluno sugere horário 
   ↓
2. Outros alunos apoiam (votos aumentam)
   ↓
3. Admin aprova sugestão 
   ↓
4. Sistema cria turma INATIVA (minimumStudents: 5)
   ↓
5. Alunos demonstram interesse (TurmaInterest)
   ↓
6. Quórum atingido → Sistema ATIVA turma automaticamente
   ↓
7. Notificações enviadas para todos interessados
   ↓
8. Matrícula liberada → Alunos podem se inscrever
```

### 4.2 Métricas para Admin

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

## 5. Features Adicionais (Opcional)

### 5.1 Gamificação

**Badges de Contribuição**:
- 🌟 "Pioneiro" - Primeira sugestão aprovada
- 🚀 "Influencer" - 5+ sugestões com 10+ votos
- 🎯 "Ativador" - Sugestão que virou turma ativa
- 💡 "Idealizador" - 10+ sugestões enviadas

**Sistema de Pontos**:
- +10 pontos: Sugestão enviada
- +50 pontos: Sugestão aprovada
- +100 pontos: Turma ativada e com matrícula completa

#### 📝 QUESTÃO: Implementar gamificação?

**→ Quer incluir gamificação na primeira versão ou deixar para depois?**

---

### 5.2 Turmas Piloto

**Conceito**: Turmas experimentais temporárias (4 semanas) com:
- Desconto para "testadores"
- Feedback obrigatório ao final
- Se sucesso (>80% presença), vira permanente

```prisma
model Turma {
  // ... campos existentes ...
  
  isPilot         Boolean   @default(false)
  pilotStartDate  DateTime?
  pilotEndDate    DateTime?
  pilotFeedback   PilotFeedback[]
}

model PilotFeedback {
  id            String    @id @default(uuid())
  turmaId       String
  studentId     String
  rating        Int       // 1-5 estrelas
  comments      String?
  wouldContinue Boolean
  createdAt     DateTime  @default(now())
}
```

#### 📝 QUESTÃO: Implementar turmas piloto?

**→ Isso é relevante para sua operação?**

---

### 5.3 IA Preditiva

**Conceito**: IA para prever quais horários terão sucesso

**Dados Analisados**:
- Histórico de sugestões
- Padrões de matrícula
- Horários de check-in mais comuns
- Localização dos alunos
- Faixa etária e perfil

**→ Deixar para fase posterior (já temos integração com Gemini no projeto)**

---

## 6. Roadmap de Implementação

### Fase 1: Turmas Inativas (1-2 semanas)
- [ ] Migração Prisma (isActive, minimumStudents, TurmaInterest)
- [ ] API endpoints (interesse, ativação)
- [ ] UI badges de status na listagem de turmas
- [ ] Lógica de ativação automática
- [ ] Notificações básicas (email)

### Fase 2: Sugestões de Horários (2-3 semanas)
- [ ] Modelo HorarioSugerido + HorarioSupporter
- [ ] API CRUD de sugestões
- [ ] UI formulário de sugestão (full-screen, não modal!)
- [ ] Sistema de votos
- [ ] Dashboard admin de aprovação

### Fase 3: Features Avançadas (opcional)
- [ ] Gamificação (badges e pontos)
- [ ] Turmas piloto
- [ ] Chat em tempo real (WebSocket)
- [ ] IA preditiva (integração Gemini)

---

## 7. Decisões Consolidadas

> **⏸️ SPEC SUSPENSA** - Todas as decisões foram tomadas. Quando retomar, iniciar pela Fase 1.

### 7.1 Configurações de Organização (NOVO)

Adicionar em **Configurações da Organização > Turmas**:

```typescript
interface TurmaSettings {
  // Turmas Inativas
  enableInactiveTurmas: boolean;      // Habilitar funcionalidade
  minimumStudentsDefault: number;     // Quórum mínimo padrão (ex: 5)
  
  // Sugestões de Horários  
  enableSuggestions: boolean;         // Habilitar sugestões
  maxSuggestionsPerStudent: number;   // Limite de sugestões por aluno
  suggestionExpirationDays: number;   // Dias até expirar (30)
}
```

### 7.2 Tipos de Aula Atualizados

```typescript
enum CourseType {
  DEFESA_PESSOAL = 'DEFESA_PESSOAL',
  COMBATE = 'COMBATE',
  KIDS = 'KIDS',
  FEMININO = 'FEMININO',
  OPERACIONAL = 'OPERACIONAL',
  JIU_JITSU_GI = 'JIU_JITSU_GI',
  JIU_JITSU_NO_GI = 'JIU_JITSU_NO_GI',
  BOXE = 'BOXE'
}
```

### 7.3 Resumo das Fases

| Fase | Escopo | Dependências | Estimativa |
|------|--------|--------------|------------|
| 1 | Turmas Inativas | Config. organização | 1-2 semanas |
| 2 | Sugestões de Horários | Fase 1 | 2-3 semanas |
| 3 | Gamificação | Estrutura gamificação curso | 1 semana |
| 4 | Turmas Piloto | Fase 1 | 1 semana |
| 5 | IA Preditiva | Todas anteriores | 2 semanas |

---

**Documento revisado e aprovado em**: 29/11/2025  
**Status**: ⏸️ SUSPENSO - Aguardando priorização
