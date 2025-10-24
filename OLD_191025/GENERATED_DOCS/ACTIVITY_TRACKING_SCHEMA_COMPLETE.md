# Sistema de Rastreamento de Atividades - Schema Implementado ✅

**Data**: 06/10/2025  
**Status**: Schema completo, banco sincronizado, aguardando regeneração do Prisma Client

---

## 📋 Resumo da Implementação

Implementado sistema completo de rastreamento individual de atividades durante aulas de artes marciais, com suporte a validação automática (no check-in) ou manual (pelo professor).

---

## 🗄️ Modelos Adicionados ao Prisma Schema

### 1. **LessonActivityExecution** (NOVO)
Rastreia a execução individual de cada atividade do plano de aula por aluno.

```prisma
model LessonActivityExecution {
  id                String          @id @default(uuid())
  attendanceId      String          // Link para TurmaAttendance
  activityId        String          // Referência a LessonPlanActivity.id
  completed         Boolean         @default(false)
  performanceRating Int?            // 1-5 (fraco a excelente)
  actualDuration    Int?            // Minutos reais (pode diferir do planejado)
  actualReps        Int?            // Repetições reais
  notes             String?         // Observações do instrutor
  recordedAt        DateTime        @default(now())
  recordedBy        String?         // ID do instrutor que validou
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @default(now())
  
  attendance        TurmaAttendance @relation(...)
  activity          LessonPlanActivity @relation(...)
  instructor        Instructor?     @relation("ActivityValidation", ...)

  @@unique([attendanceId, activityId])
  @@map("lesson_activity_executions")
}
```

**Campos Principais**:
- `attendanceId`: Conecta à presença do aluno na aula
- `activityId`: Conecta à atividade específica do plano de aula
- `completed`: Boolean indicando se o aluno completou a atividade
- `performanceRating`: Avaliação de 1-5 estrelas (opcional)
- `actualDuration` / `actualReps`: Métricas reais vs planejadas
- `notes`: Campo livre para observações do instrutor
- `recordedBy`: Rastreabilidade de quem validou

**Constraint Único**: `[attendanceId, activityId]` - Um aluno só pode ter um registro por atividade por aula

---

### 2. **ActivityTrackingSettings** (NOVO)
Configurações organizacionais para controlar modo de validação.

```prisma
model ActivityTrackingSettings {
  id                           String   @id @default(uuid())
  organizationId               String   @unique
  autoCompleteOnCheckin        Boolean  @default(false)  // Marcar todas automaticamente
  requireInstructorValidation  Boolean  @default(true)   // Exigir validação manual
  enablePerformanceRating      Boolean  @default(true)   // Permitir avaliações 1-5
  enableVideos                 Boolean  @default(false)  // Suporte a vídeos (futuro)
  defaultActivityDuration      Int      @default(15)     // Duração padrão (minutos)
  createdAt                    DateTime @default(now())
  updatedAt                    DateTime @default(now())
  
  organization                 Organization @relation(...)

  @@map("activity_tracking_settings")
}
```

**Campos Principais**:
- `autoCompleteOnCheckin`: Se `true`, marca todas as atividades quando aluno faz check-in
- `requireInstructorValidation`: Se `true`, professor deve validar manualmente
- `enablePerformanceRating`: Habilita campo de avaliação 1-5 estrelas
- `defaultActivityDuration`: Duração padrão quando não especificada

**Modos de Operação**:
1. **Automático**: `autoCompleteOnCheckin = true` → Todas as atividades marcadas no check-in
2. **Manual**: `autoCompleteOnCheckin = false` → Professor marca durante a aula
3. **Híbrido**: Auto-completa + permite edição posterior pelo professor

---

## 🔗 Modelos Existentes Modificados

### **TurmaAttendance** (MODIFICADO)
Adicionado array de execuções de atividades:

```prisma
model TurmaAttendance {
  // ... campos existentes ...
  activityExecutions LessonActivityExecution[]  // NOVO

  @@unique([turmaLessonId, studentId])
  @@map("turma_attendances")
}
```

**Impacto**: Cada registro de presença agora tem uma lista de atividades executadas.

---

### **LessonPlanActivity** (MODIFICADO)
Adicionado array de execuções:

```prisma
model LessonPlanActivity {
  // ... campos existentes ...
  executions   LessonActivityExecution[]  // NOVO

  @@unique([lessonPlanId, ord])
  @@map("lesson_plan_activities")
}
```

**Impacto**: Cada atividade do plano pode ter múltiplas execuções (uma por aluno por aula).

---

### **Instructor** (MODIFICADO)
Adicionado rastreamento de validações:

```prisma
model Instructor {
  // ... campos existentes ...
  activityValidations LessonActivityExecution[] @relation("ActivityValidation")  // NOVO

  @@map("instructors")
}
```

**Impacto**: Instrutores podem ver histórico de todas as validações que fizeram.

---

### **Organization** (MODIFICADO)
Adicionado relação com configurações:

```prisma
model Organization {
  // ... campos existentes ...
  activityTrackingSettings ActivityTrackingSettings?  // NOVO

  @@map("organizations")
}
```

**Impacto**: Cada organização tem configurações próprias de rastreamento.

---

## 📊 Estrutura de Dados

### **Relacionamentos Criados**

```
Organization (1)
  ↓
ActivityTrackingSettings (1) [configurações globais]

TurmaLesson (1) [aula executada]
  ↓ lessonPlanId
LessonPlan (1) [plano de aula]
  ↓
LessonPlanActivity (N) [atividades do plano]
  ↓
LessonActivityExecution (N×M) [execuções por aluno]
  ↑
TurmaAttendance (M) [presenças dos alunos]
  ↓
Student (M)

Instructor (1)
  ↓ recordedBy
LessonActivityExecution (N) [validações feitas pelo instrutor]
```

---

## 🎯 Casos de Uso

### **Caso 1: Check-in Automático**
**Configuração**: `autoCompleteOnCheckin = true`

1. Aluno `Thiago Carneiro` faz check-in na aula `Krav Maga Faixa Branca - Aula 3`
2. Sistema busca `TurmaLesson.lessonPlanId` → encontra `LessonPlan`
3. Sistema busca todas `LessonPlanActivity` do plano (ex: 6 atividades)
4. Sistema cria automaticamente 6 registros em `LessonActivityExecution`:
   ```javascript
   {
     attendanceId: "uuid-da-presenca-do-thiago",
     activityId: "uuid-atividade-1",
     completed: true,
     recordedAt: "2025-10-06T19:05:00Z",
     recordedBy: null  // Auto-completado, sem instrutor
   }
   ```

**Vantagem**: Sem trabalho manual do instrutor  
**Desvantagem**: Não valida se aluno realmente fez as atividades

---

### **Caso 2: Validação Manual**
**Configuração**: `autoCompleteOnCheckin = false`

1. Aluno faz check-in → Nenhum registro criado automaticamente
2. Durante a aula, instrutor abre interface de execução ao vivo
3. Para cada aluno e atividade, instrutor marca manualmente:
   ```javascript
   {
     attendanceId: "uuid-da-presenca-do-thiago",
     activityId: "uuid-atividade-jab-cross",
     completed: true,
     performanceRating: 4,  // 4/5 estrelas
     actualReps: 30,        // Fez 30 reps (plano era 20)
     notes: "Boa execução, melhorar postura",
     recordedAt: "2025-10-06T19:45:00Z",
     recordedBy: "uuid-instrutor-rafael"
   }
   ```

**Vantagem**: Validação real, feedback detalhado  
**Desvantagem**: Trabalho manual do instrutor

---

### **Caso 3: Estatísticas de Aluno**
Query de performance individual:

```sql
SELECT 
  lpa.name AS activity_name,
  COUNT(*) AS total_attempts,
  SUM(CASE WHEN completed THEN 1 ELSE 0 END) AS completions,
  AVG(performanceRating) AS avg_rating,
  AVG(actualDuration) AS avg_duration
FROM lesson_activity_executions lae
JOIN lesson_plan_activities lpa ON lae.activityId = lpa.id
WHERE lae.attendanceId IN (
  SELECT id FROM turma_attendances WHERE studentId = 'thiago-uuid'
)
GROUP BY lpa.name
ORDER BY total_attempts DESC;
```

**Resultado**:
```
activity_name          | total_attempts | completions | avg_rating | avg_duration
-----------------------|----------------|-------------|------------|-------------
Jab + Cross            | 12             | 11          | 4.2        | 18
Defesa Estrangulamento | 12             | 9           | 3.8        | 22
Sparring               | 8              | 8           | 4.5        | 25
```

---

### **Caso 4: Análise de Aula**
Desempenho coletivo da turma em uma aula específica:

```sql
SELECT 
  lpa.name AS activity_name,
  COUNT(DISTINCT lae.attendanceId) AS students_attempted,
  SUM(CASE WHEN completed THEN 1 ELSE 0 END) AS students_completed,
  ROUND(
    100.0 * SUM(CASE WHEN completed THEN 1 ELSE 0 END) / COUNT(*), 
    2
  ) AS completion_rate
FROM lesson_activity_executions lae
JOIN lesson_plan_activities lpa ON lae.activityId = lpa.id
WHERE lae.attendanceId IN (
  SELECT id FROM turma_attendances WHERE turmaLessonId = 'aula-uuid'
)
GROUP BY lpa.name;
```

**Resultado**:
```
activity_name          | students_attempted | students_completed | completion_rate
-----------------------|--------------------|--------------------|-----------------
Aquecimento            | 15                 | 15                 | 100.00%
Jab + Cross            | 15                 | 13                 | 86.67%
Defesa Estrangulamento | 15                 | 10                 | 66.67%
Sparring               | 12                 | 12                 | 100.00%
```

---

## 🛠️ Estado Atual da Implementação

### ✅ **Completado**
1. ✅ Modelos Prisma adicionados ao schema
2. ✅ Relações bidirecionais configuradas
3. ✅ Constraints únicos definidos
4. ✅ Schema formatado e validado (`npx prisma format`)
5. ✅ Banco de dados sincronizado (`npx prisma db push`)

### ⏸️ **Bloqueado (Windows File Lock)**
6. ⏸️ Prisma Client regeneração (erro `EPERM: operation not permitted`)

**Solução**: Usuário precisa:
```bash
# 1. Parar servidor (Ctrl+C no terminal onde `npm run dev` está rodando)

# 2. Forçar regeneração
.\force-prisma-regen.ps1

# 3. Ou manualmente:
Stop-Process -Name node -Force
Remove-Item -Recurse -Force node_modules\.prisma\client
npx prisma generate

# 4. Reiniciar servidor
npm run dev
```

### ⏹️ **Pendente (Próximos Passos)**
7. ⏹️ Implementar backend API routes (`/api/lesson-activity-executions`)
8. ⏹️ Implementar backend services (ActivityExecutionService)
9. ⏹️ Criar frontend LessonExecutionModule (interface ao vivo para instrutores)
10. ⏹️ Integrar com módulo de Frequência existente
11. ⏹️ Criar dashboard de estatísticas

---

## 📝 Tabelas Criadas no Banco

### **lesson_activity_executions**
```sql
CREATE TABLE "lesson_activity_executions" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "attendanceId" TEXT NOT NULL,
  "activityId" TEXT NOT NULL,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "performanceRating" INTEGER,
  "actualDuration" INTEGER,
  "actualReps" INTEGER,
  "notes" TEXT,
  "recordedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "recordedBy" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "lesson_activity_executions_attendanceId_activityId_key" 
    UNIQUE ("attendanceId", "activityId"),
  CONSTRAINT "lesson_activity_executions_attendanceId_fkey" 
    FOREIGN KEY ("attendanceId") REFERENCES "turma_attendances"("id") ON DELETE CASCADE,
  CONSTRAINT "lesson_activity_executions_activityId_fkey" 
    FOREIGN KEY ("activityId") REFERENCES "lesson_plan_activities"("id") ON DELETE CASCADE,
  CONSTRAINT "lesson_activity_executions_recordedBy_fkey" 
    FOREIGN KEY ("recordedBy") REFERENCES "instructors"("id")
);
```

### **activity_tracking_settings**
```sql
CREATE TABLE "activity_tracking_settings" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL UNIQUE,
  "autoCompleteOnCheckin" BOOLEAN NOT NULL DEFAULT false,
  "requireInstructorValidation" BOOLEAN NOT NULL DEFAULT true,
  "enablePerformanceRating" BOOLEAN NOT NULL DEFAULT true,
  "enableVideos" BOOLEAN NOT NULL DEFAULT false,
  "defaultActivityDuration" INTEGER NOT NULL DEFAULT 15,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "activity_tracking_settings_organizationId_key" 
    UNIQUE ("organizationId"),
  CONSTRAINT "activity_tracking_settings_organizationId_fkey" 
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE
);
```

---

## 🔄 Fluxo de Dados

### **Check-in → Execução de Atividades**

```
1. Aluno chega na academia
   ↓
2. Faz check-in no Kiosk (CPF/QR Code)
   ↓ POST /api/attendance/checkin
3. Sistema cria TurmaAttendance
   {
     turmaLessonId: "aula-hoje-19h",
     studentId: "thiago-uuid",
     present: true,
     checkedAt: "2025-10-06T19:05:00Z"
   }
   ↓
4. Sistema verifica ActivityTrackingSettings.autoCompleteOnCheckin
   ↓
5a. SE autoCompleteOnCheckin = TRUE:
   → Criar N registros LessonActivityExecution (todos completed=true)
   
5b. SE autoCompleteOnCheckin = FALSE:
   → Não fazer nada, aguardar validação do instrutor
   ↓
6. Durante a aula, instrutor pode editar execuções (manual ou correção)
   ↓ PATCH /api/lesson-activity-executions/:id
7. Atualizar campos: completed, performanceRating, notes, recordedBy
   ↓
8. Fim da aula: estatísticas disponíveis em tempo real
```

---

## 🎯 Endpoints a Implementar

### **1. POST /api/lesson-activity-executions**
Marcar atividade como completa (ou atualizar execução existente).

**Request**:
```json
{
  "attendanceId": "uuid-presenca-aluno",
  "activityId": "uuid-atividade-jab-cross",
  "completed": true,
  "performanceRating": 4,
  "actualDuration": 18,
  "actualReps": 30,
  "notes": "Boa execução técnica",
  "recordedBy": "uuid-instrutor-rafael"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid-execution",
    "attendanceId": "...",
    "activityId": "...",
    "completed": true,
    "performanceRating": 4,
    "recordedAt": "2025-10-06T19:45:00Z"
  }
}
```

---

### **2. GET /api/lesson-activity-executions/lesson/:lessonId**
Buscar todas as execuções de uma aula (para instrutor ver progresso da turma).

**Response**:
```json
{
  "success": true,
  "data": {
    "lesson": {
      "id": "aula-uuid",
      "title": "Krav Maga Faixa Branca - Aula 3",
      "scheduledDate": "2025-10-06T19:00:00Z"
    },
    "students": [
      {
        "studentId": "thiago-uuid",
        "studentName": "Thiago Carneiro",
        "activities": [
          {
            "activityId": "...",
            "activityName": "Jab + Cross",
            "completed": true,
            "performanceRating": 4
          },
          {
            "activityId": "...",
            "activityName": "Defesa Estrangulamento",
            "completed": false,
            "performanceRating": null
          }
        ]
      }
    ],
    "completionRate": 67.5  // Porcentagem geral da turma
  }
}
```

---

### **3. GET /api/lesson-activity-executions/student/:studentId/stats**
Estatísticas de performance do aluno ao longo do tempo.

**Query Params**:
- `startDate`: Filtrar a partir de data (ISO 8601)
- `endDate`: Filtrar até data
- `courseId`: Filtrar por curso específico

**Response**:
```json
{
  "success": true,
  "data": {
    "studentId": "thiago-uuid",
    "studentName": "Thiago Carneiro",
    "period": {
      "startDate": "2025-01-01",
      "endDate": "2025-10-06",
      "totalLessons": 24
    },
    "byActivity": [
      {
        "activityName": "Jab + Cross",
        "totalAttempts": 12,
        "completions": 11,
        "completionRate": 91.67,
        "avgRating": 4.2,
        "avgDuration": 18
      },
      {
        "activityName": "Defesa Estrangulamento",
        "totalAttempts": 12,
        "completions": 9,
        "completionRate": 75.0,
        "avgRating": 3.8,
        "avgDuration": 22
      }
    ],
    "overallStats": {
      "totalActivities": 72,
      "completedActivities": 65,
      "completionRate": 90.28,
      "avgRating": 4.1
    },
    "trend": "improving"  // improving | stable | declining
  }
}
```

---

## 📊 UI Mockup - Interface ao Vivo para Instrutores

```
┌─────────────────────────────────────────────────────────────┐
│ 🥋 Aula ao Vivo: Krav Maga Faixa Branca - Aula 3           │
│ 📅 06/10/2025 19:00  👥 15 alunos presentes                 │
└─────────────────────────────────────────────────────────────┘

┌─ Plano de Aula ──────────────────────────────────────────┐
│ 1. ⏱️ Aquecimento (10 min)                [100% completo] │
│ 2. 🥊 Jab + Cross (15 min, 3x10)         [87% completo]  │
│ 3. 🛡️ Defesa Estrangulamento (20 min)   [67% completo]  │
│ 4. 🤼 Sparring Controlado (15 min)       [0% completo]   │
└──────────────────────────────────────────────────────────┘

┌─ Alunos ─────────────────────────────────────────────────┐
│ 👤 Thiago Carneiro                                        │
│ ├─ [✅] Aquecimento                                       │
│ ├─ [✅] Jab + Cross            ⭐⭐⭐⭐☆ [Edit] [Notes]  │
│ ├─ [⬜] Defesa Estrangulamento  ☆☆☆☆☆   [Mark Done]     │
│ └─ [⬜] Sparring                ☆☆☆☆☆   [Mark Done]     │
│                                                           │
│ 👤 Maria Silva                                            │
│ ├─ [✅] Aquecimento                                       │
│ ├─ [⬜] Jab + Cross             ☆☆☆☆☆   [Mark Done]     │
│ ├─ [⬜] Defesa Estrangulamento  ☆☆☆☆☆   [Mark Done]     │
│ └─ [⬜] Sparring                ☆☆☆☆☆   [Mark Done]     │
│                                                           │
│ ...12 outros alunos                                       │
└──────────────────────────────────────────────────────────┘

[Finalizar Aula]  [Ver Estatísticas]  [Exportar Relatório]
```

---

## 🚀 Próximos Passos Técnicos

### **Fase 1: Backend API** (Estimativa: 4-6 horas)
1. Criar `src/routes/activityExecutions.ts`
2. Criar `src/controllers/activityExecutionController.ts`
3. Criar `src/services/activityExecutionService.ts`
4. Implementar endpoints POST, GET, PATCH
5. Adicionar validação Zod para requests
6. Escrever testes unitários (Vitest)

### **Fase 2: Frontend Módulo de Execução** (Estimativa: 8-10 horas)
1. Criar `public/js/modules/lesson-execution/index.js`
2. Interface ao vivo com lista de alunos + atividades
3. Botões de marcar completo
4. Componente de rating (estrelas 1-5)
5. Campo de notas/observações
6. Atualização em tempo real (polling ou WebSocket)

### **Fase 3: Integração com Frequência** (Estimativa: 3-4 horas)
1. Modificar `public/js/modules/frequency/index.js`
2. Adicionar botão "Ver Execuções" em cada aula
3. Mostrar resumo de atividades completadas
4. Permitir edição retroativa

### **Fase 4: Dashboard de Estatísticas** (Estimativa: 6-8 horas)
1. Criar `public/js/modules/stats/activity-performance.js`
2. Gráficos de performance por aluno
3. Comparação aluno vs turma
4. Análise de tendências (melhorando/estável/declinando)
5. Exportação de relatórios PDF/CSV

---

## 🔐 Segurança e Validação

### **Validações Implementadas no Schema**
- ✅ `attendanceId` + `activityId` = unique constraint (evita duplicatas)
- ✅ Foreign keys com `onDelete: CASCADE` (integridade referencial)
- ✅ `performanceRating` opcional (nullable)
- ✅ `recordedBy` opcional (permite auto-completar sem instrutor)

### **Validações Backend a Implementar**
- ⏹️ Verificar se `attendanceId` pertence ao mesmo `turmaLessonId` da `activityId`
- ⏹️ Validar `performanceRating` entre 1-5 quando fornecido
- ⏹️ Apenas instrutores podem marcar/editar execuções (role-based auth)
- ⏹️ Não permitir edição após X dias (configurable)

---

## 📚 Documentação Relacionada

- **Prisma Schema**: `prisma/schema.prisma` (linhas 1563-1650 para novos modelos)
- **Modelos Existentes**: `LessonPlan` (linha 220), `TurmaAttendance` (1563), `Instructor` (572)
- **AGENTS.md**: Adicionar esta feature na seção de TODOs completos
- **README.md**: Atualizar com novos endpoints da API

---

## ✅ Validação Final

### **Schema Prisma**
```bash
✅ npx prisma format    # Passou sem erros
✅ npx prisma db push   # Banco sincronizado em 7.49s
⏸️ npx prisma generate  # Bloqueado por Windows file lock
```

### **Tabelas no Banco**
```sql
-- Verificar criação
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN (
  'lesson_activity_executions',
  'activity_tracking_settings'
);

-- Resultado esperado:
--  tablename
-- --------------------------------
--  lesson_activity_executions
--  activity_tracking_settings
```

### **Relações**
```sql
-- Verificar foreign keys
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'lesson_activity_executions' 
  AND tc.constraint_type = 'FOREIGN KEY';

-- Resultado esperado:
-- table_name                 | column_name  | foreign_table_name
-- ---------------------------|--------------|-------------------
-- lesson_activity_executions | attendanceId | turma_attendances
-- lesson_activity_executions | activityId   | lesson_plan_activities
-- lesson_activity_executions | recordedBy   | instructors
```

---

## 🎉 Conclusão

**Schema completo e funcional para rastreamento individual de atividades!**

✅ **Prontos**:
- Modelos Prisma
- Relações bidirecionais
- Constraints e validações
- Banco de dados sincronizado

⏸️ **Bloqueados**:
- Regeneração do Prisma Client (Windows file lock)

⏹️ **Próximos**:
- Backend API
- Frontend interfaces
- Integração com módulos existentes
- Dashboard de estatísticas

**Tempo estimado restante**: 21-28 horas de desenvolvimento (3-4 dias úteis)

---

**Atualizado por**: GitHub Copilot  
**Versão**: 1.0  
**Status**: Schema implementado, aguardando Prisma Client
