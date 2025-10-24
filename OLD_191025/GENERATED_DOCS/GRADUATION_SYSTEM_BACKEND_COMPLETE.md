# 🎓 Sistema de Graduação Automática - Backend Completo

**Data:** 08/10/2025  
**Status:** ✅ FASES 1-3 COMPLETAS (Backend 100%)

---

## 📊 Progresso Geral

```
FASE 1: Schema Prisma                    ✅ COMPLETO
FASE 2: ActivityExecutionService          ✅ COMPLETO  
FASE 3: GraduationService + Endpoints     ✅ COMPLETO
FASE 4-8: Frontend + Features Avançadas   ⏳ PENDENTE
```

---

## 🗄️ FASE 1: Database Schema (COMPLETO ✅)

### Novos Modelos Criados (5)

#### 1. **ActivityCategory** (Categorias de Técnicas)
```prisma
model ActivityCategory {
  id                     String     @id @default(uuid())
  name                   String     // "Posturas", "Socos", "Chutes", etc
  description            String?
  color                  String     // Hex color para UI
  icon                   String?    // Emoji ou ícone
  order                  Int        @default(0)
  minimumForGraduation   Int        @default(50) // Reps mínimas para graduar
  activities             Activity[]
}
```

**Uso:** Organizar técnicas em 6 categorias visuais no frontend

---

#### 2. **LessonActivityExecution** (Rastreamento de Execuções)
```prisma
model LessonActivityExecution {
  id                 String          @id @default(uuid())
  studentId          String
  activityId         String
  attendanceId       String          // TurmaAttendance específica
  turmaLessonId      String
  
  // Execução
  repetitionsCount   Int             // repetitionsPerClass × intensityMultiplier
  durationMinutes    Int?
  intensityApplied   Float           @default(1.0)
  
  // Validação do Instrutor
  performanceRating  Int?            // 1-5 estrelas
  instructorNotes    String?
  validatedBy        String?         // Instrutor que validou
  validatedAt        DateTime?
  
  createdAt          DateTime        @default(now())
  
  student            Student         @relation(...)
  activity           Activity        @relation(...)
  attendance         TurmaAttendance @relation(...)
  turmaLesson        TurmaLesson     @relation(...)
  instructor         Instructor?     @relation(...)
  
  @@unique([attendanceId, activityId])
}
```

**Uso:** Auto-criado no check-in, rastreia cada execução individual

---

#### 3. **CourseGraduationLevel** (Regras de Graduação)
```prisma
model CourseGraduationLevel {
  id                         String   @id @default(uuid())
  courseId                   String
  currentBelt                String   // "Faixa Branca"
  nextBelt                   String   // "Faixa Amarela"
  
  // Estrutura de Graus
  totalDegrees               Int      @default(4)       // 4 graus
  degreePercentageIncrement  Int      @default(20)      // 20% cada
  
  // Requisitos Mínimos
  minimumAttendanceRate      Float    @default(80.0)    // 80%
  minimumQualityRating       Float    @default(3.0)     // 3.0/5.0 estrelas
  minimumRepetitionsTotal    Int      @default(500)     // 500 repetições
  minimumMonthsEnrolled      Int      @default(3)       // 3 meses
  
  course                     Course   @relation(...)
  
  @@unique([courseId, currentBelt])
}
```

**Uso:** Define critérios de graduação por faixa

---

#### 4. **StudentDegreeHistory** (Histórico de Graus)
```prisma
model StudentDegreeHistory {
  id                  String   @id @default(uuid())
  studentId           String
  courseId            String
  
  // Grau Conquistado
  degree              Int      // 1, 2, 3, 4
  degreePercentage    Int      // 20%, 40%, 60%, 80%
  belt                String   // "Faixa Branca"
  achievedAt          DateTime @default(now())
  completedLessons    Int      // Aulas completadas até aqui
  
  // Métricas no Momento do Grau
  totalRepetitions    Int      @default(0)
  averageQuality      Float    @default(0.0)
  attendanceRate      Float    @default(0.0)
  
  student             Student  @relation(...)
  course              Course   @relation(...)
  
  @@index([studentId, courseId])
}
```

**Uso:** Timeline de conquistas de graus (1º⭐ → 2º⭐⭐ → ...)

---

#### 5. **StudentGraduation** (Mudanças de Faixa)
```prisma
model StudentGraduation {
  id                      String    @id @default(uuid())
  studentId               String
  courseId                String
  
  // Transição de Faixa
  fromBelt                String    // "Faixa Branca"
  toBelt                  String    // "Faixa Amarela"
  
  // Aprovação
  approvedBy              String    // Instrutor ID
  approvedAt              DateTime  @default(now())
  
  // Métricas Finais
  finalAttendanceRate     Float
  finalQualityRating      Float
  totalRepetitions        Int
  totalLessonsCompleted   Int
  
  // Certificado
  certificateGenerated    Boolean   @default(false)
  certificateUrl          String?
  ceremonyDate            DateTime?
  ceremonyNotes           String?
  
  student                 Student   @relation(...)
  course                  Course    @relation(...)
  instructor              Instructor @relation(...)
  
  @@unique([studentId, courseId, toBelt])
}
```

**Uso:** Registro oficial de mudanças de faixa com certificados

---

### Modelos Modificados (6)

1. **Activity** → Adicionado `categoryId` (relação com ActivityCategory)
2. **LessonPlanActivity** → Adicionado `repetitionsPerClass`, `intensityMultiplier`, `minimumForGraduation`
3. **Student** → Adicionado relações: `activityExecutions[]`, `degreeHistory[]`, `graduations[]`
4. **Course** → Adicionado relações: `graduationLevels[]`, `degreeHistory[]`, `graduations[]`
5. **TurmaAttendance** → Já tinha `activityExecutions[]` (mantido)
6. **TurmaLesson** → Adicionado `activityExecutions[]`

---

## ⚙️ FASE 2: ActivityExecutionService (COMPLETO ✅)

### Service Criado
- **Arquivo:** `src/services/activityExecutionService.ts`
- **Métodos:**
  - `createExecution(data)` - Criar execução manual
  - `updateExecution(id, data)` - Editar rating/notas
  - `deleteExecution(id)` - Remover execução
  - `getExecutionsByAttendance(attendanceId)` - Listar por check-in
  - `getExecutionsByStudent(studentId)` - Histórico do aluno

### Auto-complete no Check-in
- **Modificado:** `src/services/attendanceService.ts`
- **Comportamento:** Ao registrar check-in, sistema busca `LessonPlanActivity` da aula e cria automaticamente `LessonActivityExecution` para cada atividade
- **Cálculo:** `repetitionsCount = repetitionsPerClass × intensityMultiplier`

### API Endpoints
```typescript
POST   /api/lesson-activity-executions          // Criar execução manual
PATCH  /api/lesson-activity-executions/:id      // Editar rating/notas
DELETE /api/lesson-activity-executions/:id      // Deletar execução
GET    /api/lesson-activity-executions/attendance/:id  // Por check-in
GET    /api/lesson-activity-executions/student/:id     // Por aluno
```

---

## 📈 FASE 3: GraduationService + Endpoints (COMPLETO ✅)

### Service Principal
- **Arquivo:** `src/services/graduationService.ts` (499 linhas)

### Métodos Implementados

#### 1. `calculateProgression(studentId, courseId)`
**Retorna:**
```typescript
{
  studentId: string,
  courseId: string,
  studentName: string,
  courseName: string,
  currentBelt: string,
  totalLessonsInCourse: number,
  completedLessons: number,
  progressPercentage: number,      // 0-100%
  currentDegree: number,            // 0-4 (floor(percentage / 20))
  nextDegreeAt: number,             // Próximo marco (20%, 40%, 60%, 80%)
  attendanceRate: number,
  averageQuality: number,
  totalRepetitions: number,
  degreeHistory: DegreeRecord[],    // Timeline de graus
  isEligibleForBeltChange: boolean,
  eligibilityDetails: {
    hasAllDegrees: boolean,
    meetsAttendanceRate: boolean,
    meetsQualityRating: boolean,
    meetsRepetitions: boolean,
    meetsMonthsEnrolled: boolean,
    currentAttendanceRate: number,
    currentQualityRating: number,
    totalRepetitions: number,
    monthsEnrolled: number
  }
}
```

**Algoritmo:**
```
1. Buscar última graduação do aluno → toBelt = currentBelt
2. Contar total de aulas do curso
3. Buscar presenças confirmadas (TurmaAttendance.present = true)
4. Calcular % = (completedLessons / totalLessons) × 100
5. Calcular grau = floor(% / 20)  // 0-20% = 0, 20-40% = 1, etc
6. Buscar execuções de atividades → totalRepetitions
7. Buscar ratings médios → averageQuality
8. Verificar elegibilidade para mudança de faixa
```

---

#### 2. `registerDegreeAchievement(studentId, courseId, degree)`
**Registra conquista de grau automaticamente**
```typescript
// Chamado automaticamente no check-in quando aluno atinge novo grau
// Cria registro em StudentDegreeHistory com snapshot das métricas
```

---

#### 3. `checkGraduationEligibility(...)` (privado)
**Verifica 5 critérios para mudança de faixa:**
```
✅ hasAllDegrees          → 4º grau completo (80%)
✅ meetsAttendanceRate    → ≥ 80%
✅ meetsQualityRating     → ≥ 3.0/5.0 estrelas
✅ meetsRepetitions       → ≥ 500 repetições
✅ meetsMonthsEnrolled    → ≥ 3 meses matriculado
```

---

#### 4. `approveGraduation(studentId, courseId, data, instructorId)`
**Aprova mudança de faixa**
```typescript
// 1. Verifica elegibilidade
// 2. Busca faixa atual (lastGraduation.toBelt)
// 3. Cria registro em StudentGraduation
// 4. Dispara notificação (futuro)
// 5. Gera certificado (futuro)
```

---

### API Endpoints de Progressão
```typescript
GET  /api/students/:id/progression/:courseId
// Retorna progressão completa (% concluído, grau atual, timeline)

POST /api/students/:id/degree
// Registra novo grau (chamado automaticamente no check-in)

GET  /api/students/:id/graduation-eligibility/:courseId
// Verifica se aluno pode graduar de faixa

POST /api/students/:id/graduation
// Aprova graduação (instrutor)
```

**Registrado em:** `src/server.ts` (linha ~76)
```typescript
await fastify.register(progressionRoutes, { prefix: '/api' });
```

---

## 🔗 Integração com Check-in

### Fluxo Automático
```
1. Aluno faz check-in → TurmaAttendance.present = true
2. AttendanceService busca LessonPlanActivity da aula
3. Cria LessonActivityExecution para cada atividade
4. GraduationService.calculateProgression() verifica novo grau
5. Se atingiu 20%/40%/60%/80% → GraduationService.registerDegreeAchievement()
6. Frontend mostra notificação de novo grau (futuro)
```

---

## 📐 Arquitetura de Dados

### Como a Faixa Atual é Rastreada
```typescript
// StudentCourse NÃO tem campo currentBelt
// Faixa é rastreada via StudentGraduation

const lastGraduation = await prisma.studentGraduation.findFirst({
  where: { studentId, courseId },
  orderBy: { approvedAt: 'desc' }
});

const currentBelt = lastGraduation?.toBelt || 'Faixa Branca';
```

### Estrutura de Graus (4 níveis)
```
Faixa Branca:
├─ 0-19%  → Sem grau
├─ 20-39% → 1º Grau ⭐
├─ 40-59% → 2º Grau ⭐⭐
├─ 60-79% → 3º Grau ⭐⭐⭐
└─ 80%+   → 4º Grau ⭐⭐⭐⭐ (Elegível para Faixa Amarela)
```

---

## 🧪 Próximas Fases (Pendentes)

### FASE 4: Dashboard de Progressão (Frontend)
- Criar `public/js/modules/student-progression/index.js`
- Timeline visual dos graus (1º⭐ → 2º⭐⭐ → 3º⭐⭐⭐ → 4º⭐⭐⭐⭐)
- Barra de progresso percentual animada
- Widget de atividades por categoria (radar chart)
- Próximas aulas checkpoint destacadas

### FASE 5: Lesson Plan Editor - Campos de Rastreamento
- Adicionar campos `repetitionsPerClass`, `intensityMultiplier`, `minimumForGraduation` na UI
- Input number para repetições (obrigatório)
- Slider 0.5x-2.5x para intensidade
- Tooltip explicando multiplicadores

### FASE 6: Sistema de Notificações
- Email: "Parabéns! Você conquistou o 2º Grau na Faixa Branca. 40% do curso completo."
- In-app: Toast notification com emoji de celebração 🎉
- Push notifications (futuro)

### FASE 7: Interface de Aprovação de Graduação (Instrutor)
- Lista de alunos elegíveis (4º grau + critérios atendidos)
- Detalhes do aluno: métricas finais, histórico
- Botão "Aprovar Graduação"
- Campo para notas da cerimônia

### FASE 8: Certificados Automáticos
- Integrar `pdfkit` ou `puppeteer`
- Template de certificado profissional
- QR code de verificação
- Upload para storage (Supabase Storage)
- Link em `StudentGraduation.certificateUrl`

---

## 📊 Exemplos de JSON do Curso

### curso-faixa-branca-completo.json
```json
{
  "courseName": "Krav Maga - Faixa Branca P1/P2/P3",
  "totalLessons": 35,
  "categories": [
    { "name": "Posturas e Bases", "color": "#3B82F6", "icon": "🧍", "minimumForGraduation": 50 },
    { "name": "Socos", "color": "#EF4444", "icon": "👊", "minimumForGraduation": 100 },
    { "name": "Chutes", "color": "#10B981", "icon": "🦶", "minimumForGraduation": 80 },
    { "name": "Defesas", "color": "#F59E0B", "icon": "🛡️", "minimumForGraduation": 120 },
    { "name": "Quedas e Rolamentos", "color": "#8B5CF6", "icon": "🤸", "minimumForGraduation": 30 },
    { "name": "Combinações", "color": "#EC4899", "icon": "⚡", "minimumForGraduation": 50 }
  ],
  "lessons": [
    {
      "number": 1,
      "title": "Fundamentos e Primeira Base",
      "activities": [
        {
          "name": "Postura de Combate (Guarda de Luta)",
          "categoryId": "posturas",
          "repetitionsPerClass": 20,
          "intensityMultiplier": 1.0,
          "minimumForGraduation": 50
        }
      ]
    }
  ],
  "checkpoints": [
    { "lesson": 7, "degree": 1, "percentage": 20, "title": "1º Grau ⭐" },
    { "lesson": 14, "degree": 2, "percentage": 40, "title": "2º Grau ⭐⭐" },
    { "lesson": 21, "degree": 3, "percentage": 60, "title": "3º Grau ⭐⭐⭐" },
    { "lesson": 28, "degree": 4, "percentage": 80, "title": "4º Grau ⭐⭐⭐⭐" },
    { "lesson": 35, "degree": 5, "percentage": 100, "title": "Exame Final 🏆" }
  ],
  "totalRepetitionsPlanned": 3850
}
```

---

## ✅ Validação e Testes

### Passos para Testar
```bash
# 1. Verificar schema
npx prisma format
npx prisma db push

# 2. Abrir Prisma Studio
npx prisma studio
# Verificar tabelas: lesson_activity_executions, student_degree_history, student_graduations

# 3. Testar endpoints (via Postman/Thunder Client)
GET http://localhost:3000/api/students/{id}/progression/{courseId}

# 4. Fazer check-in de teste
# Ver se auto-cria execuções de atividades
# Ver se registra grau automaticamente ao atingir 20%/40%/60%/80%
```

---

## 🎯 Métricas de Sucesso

**Backend:** ✅ 100% COMPLETO

- ✅ Database schema validado e migrado
- ✅ 5 novos modelos criados
- ✅ 6 modelos modificados
- ✅ ActivityExecutionService com 5 métodos
- ✅ GraduationService com 4 métodos principais
- ✅ 5 endpoints de API implementados
- ✅ Auto-complete de atividades no check-in
- ✅ Verificação automática de novos graus
- ✅ Sistema de elegibilidade com 5 critérios

**Próximo:** Frontend (FASES 4-8)

---

## 📝 Notas Técnicas

### Decisões de Arquitetura

1. **Faixa atual sem campo no StudentCourse**
   - Rastreada via `StudentGraduation.toBelt` (último registro)
   - Evita inconsistências, única fonte de verdade

2. **Graus calculados dinamicamente**
   - `currentDegree = floor(progressPercentage / 20)`
   - Sem armazenamento redundante

3. **Execuções auto-criadas no check-in**
   - Reduz trabalho manual do instrutor
   - Permite edição posterior de ratings

4. **5 critérios de elegibilidade**
   - Garante qualidade da graduação
   - Previne graduações prematuras

---

**✨ Sistema pronto para Frontend e features avançadas! ✨**
