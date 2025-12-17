# ✅ CHECKLIST DE CORREÇÕES E TESTES
**Data**: 17 de dezembro de 2025  
**Build Status**: 🔴 145 erros TypeScript  
**Test Coverage**: ~15% (estimado)

---

## 🔥 PRIORIDADE CRÍTICA (P1) - Bloqueadores Imediatos

### Backend - Serviços Ausentes
- [ ] **GraduationService.ts** - Criar arquivo completo
  - [ ] Implementar `listStudentsWithProgress()`
  - [ ] Implementar `calculateStudentStats()`
  - [ ] Implementar `upsertStudentProgress()`
  - [ ] Implementar `addQualitativeAssessment()`
  - [ ] Implementar `getCourseRequirements()`
  - [ ] Implementar `getStudentDetailedProgress()`
  - [ ] Implementar `updateStudentActivity()`
  - [ ] Implementar `calculateProgression()`
  - [ ] Implementar `recordDegreeAchievement()`
  - [ ] Implementar `approveGraduation()`
  - [ ] Implementar `getEligibleStudents()`
  - [ ] Implementar `checkAndRecordDegrees()`

- [ ] **CurriculumMCPTools.ts** - Verificar se existe ou remover imports
  - [ ] Arquivo: `src/routes/curriculum-agent.ts` linhas 245, 284
  - [ ] Opção 1: Criar o arquivo faltante
  - [ ] Opção 2: Remover imports não utilizados

### Database - Schema Drift
- [ ] **Setup Local Postgres**
  - [ ] Rodar `docker-compose -f docker-compose.dev.yml up postgres-dev`
  - [ ] Atualizar `.env` com `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/krav_academy_db`
  - [ ] Testar conexão: `psql $DATABASE_URL`

- [ ] **Aplicar Migrations**
  - [ ] Rodar `npx prisma migrate dev --name deploy_ops_logging`
  - [ ] Rodar `npx prisma migrate dev --name fix_schema_drift`
  - [ ] Rodar `npx prisma generate`
  - [ ] Verificar: `npx prisma studio`

- [ ] **Fix Enums no Schema**
  - [ ] StudentCategory: `HERO_1` → `HEROI1`, `HERO_2` → `HEROI2`, `HERO_3` → `HEROI3`
    - Arquivo: `prisma/schema.prisma`
    - Impacto: `src/routes/pedagogical.ts` linha 139
  - [ ] SubscriptionStatus: Validar valores aceitos
    - Arquivo: `prisma/schema.prisma`
    - Impacto: `src/routes/subscriptions.ts` linhas 272, 402, 490

### Type Errors - OrganizationId
- [ ] **Fix "Type 'string' is not assignable to type 'never'"** (15+ arquivos)
  - [ ] `src/routes/pedagogical.ts` (linhas 570, 618)
  - [ ] `src/routes/jobs.ts` (linha 213)
  - [ ] `src/routes/trainingAreas.ts` (linha 208)
  - [ ] `src/routes/discounts.ts` (linha 40)
  - [ ] `src/services/authService.ts` (linha 100)
  - [ ] `src/services/challengeService.ts` (linha 282)
  - [ ] `src/services/attendanceService.ts` (linha 330)
  - [ ] `src/server-simple.ts` (linha 784)
  - **Root Cause**: Prisma schema unique constraints ou relacionamentos incorretos
  - **Solução**: Verificar schema.prisma e corrigir `@@unique` directives

---

## 🟠 PRIORIDADE ALTA (P2) - Funcionalidades Quebradas

### Routes - Type Issues
- [ ] **AgentOrchestrator** (12 erros)
  - [ ] Linhas 135, 211, 249, 287, 325, 429, 501, 564, 596, 628, 670
    - `Argument of type 'any' is not assignable to parameter of type 'never'`
  - [ ] Linha 529: Fix `ApprovePermissionData` interface
  - [ ] Linha 545: Fix permission approval types
  - **Solução**: Definir interfaces corretas em `src/types/` ou ajustar chamadas

- [ ] **AgentTasks** (4 erros)
  - [ ] Linha 19: Expected 2 arguments, but got 1
  - [ ] Linha 89: Expected 2 arguments, but got 1
  - [ ] Linha 103: Expected 3 arguments, but got 2
  - [ ] Linha 115: Expected 4 arguments, but got 3
  - **Solução**: Verificar assinaturas dos métodos chamados

- [ ] **AsaasImport** (5 erros)
  - [ ] Linhas 35, 36, 40: `Property 'data'/'hasMore' does not exist on type 'unknown'`
  - [ ] Linha 108: `Argument of type '500' is not assignable to parameter of type '200'`
  - **Solução**: Definir tipos de response do Asaas API

- [ ] **HorariosSugeridos** (1 erro)
  - [ ] Linha 28: `Property 'studentId' is optional but required`
  - **Solução**: Adicionar validação de campos obrigatórios antes de chamar service

### Services - Missing Properties
- [ ] **Progress Service** (2 erros)
  - [ ] Linhas 149, 174: `Property 'completedAt' does not exist`
  - **Solução**: Verificar modelo Progress no schema.prisma

- [ ] **Attendance Service** (3+ erros)
  - [ ] Linha 175: `Property 'lessonId' does not exist` (agora é `turmaLessonId`)
  - [ ] Linha 293: Import `graduationService` faltante
  - [ ] Linha 330: Type mismatch no create
  - **Solução**: Atualizar referências de campos e adicionar import

- [ ] **Activity Exec Service** (8 erros)
  - [ ] Linhas 168, 198, 203, etc: `Property 'lessonPlan' does not exist`
  - [ ] Linha 244: Missing `turma` property
  - [ ] Linha 425: Missing `avgDuration` property
  - **Solução**: Atualizar includes do Prisma

### Pedagogical Module (15+ erros)
- [ ] Linha 332: `Property 'id' does not exist on type 'string | object | Buffer'`
- [ ] Linha 353: Mesmo erro acima
- [ ] Linha 457: Schema drift - ChallengeProgress
- [ ] Linha 523: Typo `techniqueseTested` → `techniquesTested`
- [ ] Linha 530: Property 'id' error
- [ ] Linha 676: AchievementCategory type mismatch
- [ ] Linha 709: Mesmo erro acima
- [ ] Linha 904: Property 'id' error

---

## 🟡 PRIORIDADE MÉDIA (P3) - Melhorias e Testes

### Unit Tests (Faltantes)
- [ ] **tests/unit/graduationService.test.ts**
  - [ ] Test: listStudentsWithProgress
  - [ ] Test: calculateStudentStats
  - [ ] Test: upsertStudentProgress
  - [ ] Test: calculateProgression
  - [ ] Test: approveGraduation

- [ ] **tests/unit/attendanceService.test.ts**
  - [ ] Test: createAttendance
  - [ ] Test: checkIn via QR code
  - [ ] Test: getStudentAttendanceHistory
  - [ ] Test: calculateAttendanceRate

- [ ] **tests/unit/subscriptionService.test.ts**
  - [ ] Test: createSubscription
  - [ ] Test: cancelSubscription
  - [ ] Test: renewSubscription
  - [ ] Test: calculateBilling

- [ ] **tests/unit/agentOrchestratorService.test.ts**
  - [ ] Test: analyzeOrganization
  - [ ] Test: executeAgentTask
  - [ ] Test: aggregateResults

- [ ] **tests/unit/deployOpsService.test.ts**
  - [ ] Test: createSession
  - [ ] Test: appendHealthCheck
  - [ ] Test: appendLog
  - [ ] Test: rollbackSession

### Integration Tests (Expandir)
- [ ] **tests/integration/graduation-flow.test.ts**
  - [ ] Fluxo: Matrícula → Progresso → Aprovação → Graduação

- [ ] **tests/integration/attendance-checkin.test.ts**
  - [ ] Fluxo: QR code scan → Check-in → Validação → XP award

- [ ] **tests/integration/subscription-lifecycle.test.ts**
  - [ ] Fluxo: Criar → Ativar → Renovar → Cancelar

- [ ] **tests/integration/agent-orchestrator.test.ts**
  - [ ] Fluxo: Task criada → Agent executa → Resultado agregado

- [ ] **tests/integration/asaas-import.test.ts**
  - [ ] Fluxo: Fetch customers → Import batch → Sync status

### Schema Fixes (Não Críticos)
- [ ] **FastifySchema 'tags'/'summary' warnings** (12 ocorrências)
  - Arquivos: health.ts, auth.ts, permissions.ts, organizations.ts
  - **Impacto**: Documentação Swagger incompleta
  - **Solução**: Adicionar ao `SchemaObject` ou remover

- [ ] **Financial error code typing** (2 erros)
  - Arquivos: financial.ts linhas 243, 711
  - `Argument of type '500' is not assignable to parameter of type '200'`
  - **Solução**: Usar `reply.code(500).send()` corretamente

---

## ⚪ PRIORIDADE BAIXA (P4) - Otimizações Futuras

### Code Quality
- [ ] Remover `eval()` em evaluationService.ts (strict mode warning)
- [ ] Fix GoogleAds type compatibility warnings
- [ ] Cleanup legacy files (server-simple.ts, server-fixed.ts)
- [ ] Update deprecated Prisma queries

### Testing Infrastructure
- [ ] Setup E2E testing framework (Playwright/Cypress)
- [ ] Add visual regression tests
- [ ] Add accessibility tests (a11y)
- [ ] Performance benchmarks
- [ ] Security vulnerability scanning

### Documentation
- [ ] Atualizar API docs com Swagger completo
- [ ] Criar guia de troubleshooting
- [ ] Documentar padrões de teste
- [ ] Criar exemplos de uso

---

## 📊 MÉTRICAS DE PROGRESSO

### Build Health
- **Status Atual**: 🔴 145 erros TypeScript
- **Meta Semana 1**: 🟡 < 50 erros (65% redução)
- **Meta Semana 2**: 🟢 0 erros (100% clean)

### Test Coverage
- **Status Atual**: ~15% (estimado)
  - Smoke tests: 14/14 módulos ✅
  - Integration tests: 4 arquivos ⚠️
  - Unit tests: 3 services ⚠️
- **Meta Semana 1**: 40% (smoke + integration básico)
- **Meta Semana 2**: 60% (+ unit tests críticos)
- **Meta Mês 1**: 80% (cobertura completa)

### Módulos Funcionais
- **Status Atual**: 35/65 funcionais (54%)
- **Meta Semana 1**: 50/65 funcionais (77%)
- **Meta Semana 2**: 60/65 funcionais (92%)

---

## 🎯 PLANO DE AÇÃO SEMANAL

### Semana 1 (17-21 Dezembro)
**Dia 1-2**: Bloqueadores (GraduationService + Schema Drift)
- Criar GraduationService completo
- Setup local Postgres
- Aplicar migrations pendentes
- Regenerar Prisma client

**Dia 3**: Type Errors (organizationId fixes)
- Corrigir schema.prisma unique constraints
- Atualizar 15+ arquivos com erros de type
- Validar queries afetadas

**Dia 4-5**: Route Fixes (AgentOrchestrator, AgentTasks, AsaasImport)
- Definir interfaces corretas
- Ajustar assinaturas de métodos
- Adicionar validações de tipo

### Semana 2 (24-28 Dezembro)
**Dia 1-2**: Integration Tests
- Graduation flow
- Attendance checkin
- Subscription lifecycle

**Dia 3-4**: Unit Tests
- GraduationService
- AttendanceService
- SubscriptionService

**Dia 5**: Coverage Report
- Rodar `npm run test:coverage`
- Identificar gaps
- Documentar resultados

---

## 📝 COMANDOS ÚTEIS

### Build & Validation
```bash
npm run build 2>&1 | tee build_errors.txt
npm run lint
npm run type-check
npm run ci  # Build + Lint + Test
```

### Testing
```bash
npm run test                    # Todos os testes
npm run test:watch              # Watch mode
npm run test:coverage           # Com coverage
npm run test tests/smoke/       # Só smoke tests
npm run test tests/contract/    # Só contract tests
```

### Database
```bash
docker-compose -f docker-compose.dev.yml up postgres-dev
npx prisma studio               # GUI do banco
npx prisma migrate dev          # Aplicar migrations
npx prisma generate             # Regenerar client
npx prisma migrate reset        # Reset completo (CUIDADO!)
```

### Deploy Ops
```bash
npm run deploy:package          # Gerar artifact
npm run deploy:health           # Check health
npm run deploy:activate         # Ativar artifact
npm run deploy:rollback         # Rollback
```

---

## ✅ CONCLUSÃO

**Status Geral**: 🔴 Sistema com múltiplas falhas críticas

**Próximos Passos Imediatos**:
1. ✅ Revisar este checklist com o time
2. 🔴 URGENTE: Criar GraduationService (bloqueador)
3. 🔴 URGENTE: Resolver Schema Drift
4. 🔴 URGENTE: Fix organizationId type errors
5. 🟡 Implementar testes unitários críticos

**Documentos Relacionados**:
- `MODULE_STATUS_REPORT.md` - Status detalhado de cada módulo
- `tests/README.md` - Guia completo de testes
- `AGENTS.md` - Padrões do projeto
- `build_errors_new.txt` - Lista completa de erros

**Última Atualização**: 17/12/2025  
**Próxima Revisão**: Após correção de bloqueadores P1
