# PLANO DE SPRINT - Correções Pré-Produção
**Academia Krav Maga v2.0**
**Data Início**: 21/10/2025 (segunda-feira)
**Data Fim Prevista**: 28/10/2025 (segunda-feira)
**Duração**: 5-6 dias úteis

---

## 📅 CRONOGRAMA DETALHADO

### **SPRINT 1: Correções Críticas (P1)**
**Duração**: 3 dias úteis (21-23/10)
**Objetivo**: Eliminar todos os 19 problemas P1

#### DIA 1 - 21/10 (Segunda-feira) - 8h
**Foco**: Backend Error Handling (4.5h) + Início Frontend (3.5h)

**Manhã (4h)**:
- [ ] 08:00-09:00: Reunião de planejamento + divisão de tasks
- [ ] 09:00-10:00: **[BACKEND]** Adicionar try-catch em `activities.ts`, `activityExecutions.ts`
- [ ] 10:00-11:00: **[BACKEND]** Adicionar try-catch em `attendance.ts`, `auth.ts`
- [ ] 11:00-12:00: **[BACKEND]** Adicionar try-catch em `biometric.ts`, `graduation.ts`

**Tarde (4h)**:
- [ ] 13:00-13:30: **[BACKEND]** Adicionar try-catch em `hybrid-agenda.ts`, `studentCourses.ts`, `turmas.ts`
- [ ] 13:30-14:00: **[BACKEND]** Testar rotas corrigidas via Postman/Insomnia
- [ ] 14:00-17:00: **[FRONTEND]** Migrar módulos `ai.js`, `ai-dashboard.js` para API Client
- [ ] 17:00-18:00: Commit + Push do dia

**Entregável Dia 1**: 9 rotas backend corrigidas + 2 módulos frontend migrados

---

#### DIA 2 - 22/10 (Terça-feira) - 8h
**Foco**: Frontend API Client Migration (8h)

**Manhã (4h)**:
- [ ] 08:00-10:00: **[FRONTEND]** Migrar `auth.js`, `import.js` para API Client
- [ ] 10:00-12:00: **[FRONTEND]** Migrar `instructors.js`, `lesson-plans.js` para API Client

**Tarde (4h)**:
- [ ] 13:00-15:00: **[FRONTEND]** Migrar `organizations.js`, `units.js` para API Client
- [ ] 15:00-16:30: **[FRONTEND]** Testar estados UI (loading/empty/error) em todos os módulos
- [ ] 16:30-17:30: Ajustes de CSS isolado (`.module-isolated-*`)
- [ ] 17:30-18:00: Commit + Push do dia

**Entregável Dia 2**: 6 módulos frontend migrados (total 8/8 completo)

---

#### DIA 3 - 23/10 (Quarta-feira) - 6.5h
**Foco**: Frontend AcademyApp Integration (2h) + Validação Sprint 1 (4.5h)

**Manhã (3.5h)**:
- [ ] 08:00-09:00: **[FRONTEND]** Integrar `activities.js` ao AcademyApp
- [ ] 09:00-10:00: **[FRONTEND]** Integrar `ai-dashboard.js` ao AcademyApp
- [ ] 10:00-11:30: **[VALIDAÇÃO]** Rodar `quick-audit.ps1` → esperar 0 problemas P1
- [ ] 11:30-12:00: Documentar correções realizadas

**Tarde (3h)**:
- [ ] 13:00-15:00: **[TESTES]** Testar manualmente todos os 8 módulos corrigidos
- [ ] 15:00-16:00: **[TESTES]** Testar rotas backend via Postman/Swagger
- [ ] 16:00-17:00: Fix de bugs encontrados + Commit final Sprint 1

**Entregável Dia 3**: Sprint 1 completo (19 problemas P1 resolvidos)

---

### **SPRINT 2: Melhorias de Qualidade (P2)**
**Duração**: 2 dias úteis (24-25/10)
**Objetivo**: Resolver 18 problemas P2

#### DIA 4 - 24/10 (Quinta-feira) - 8h
**Foco**: Backend Response Format Standardization (8h)

**Manhã (4h)**:
- [ ] 08:00-09:00: **[BACKEND]** Criar utility `ResponseHelper.ts`
- [ ] 09:00-11:00: **[BACKEND]** Padronizar `activities.ts`, `activityExecutions.ts`, `lessonPlans.ts`, `packages-simple.ts`
- [ ] 11:00-12:00: **[BACKEND]** Padronizar `packages.ts`, `pedagogical.ts`, `progress.ts`, `subscriptions.ts`

**Tarde (4h)**:
- [ ] 13:00-15:00: **[BACKEND]** Padronizar `attendance.ts`, `auth.ts`, `biometric.ts`, `graduation.ts`
- [ ] 15:00-17:00: **[BACKEND]** Padronizar `hybrid-agenda.ts`, `studentCourses.ts`, `turmas.ts`, `user.ts`
- [ ] 17:00-18:00: Testar endpoints + Commit do dia

**Entregável Dia 4**: 16 rotas backend padronizadas

---

#### DIA 5 - 25/10 (Sexta-feira) - 2h
**Foco**: Frontend Estados UI + Validação Sprint 2

**Manhã (2h)**:
- [ ] 08:00-09:00: **[FRONTEND]** Implementar estados UI completos em `ai-dashboard.js`
- [ ] 09:00-10:00: **[VALIDAÇÃO]** Rodar `quick-audit.ps1` → esperar < 5 problemas P2

**Entregável Dia 5**: Sprint 2 completo (18 problemas P2 resolvidos)

---

### **SPRINT 3: Otimizações de Performance (P3)**
**Duração**: 1 dia útil (28/10)
**Objetivo**: Resolver 11 problemas P3 (paginação)

#### DIA 6 - 28/10 (Segunda-feira) - 5.5h
**Foco**: Backend Pagination (5.5h)

**Manhã (3h)**:
- [ ] 08:00-09:00: **[BACKEND]** Adicionar paginação em `analytics.ts`, `assessments.ts`
- [ ] 09:00-10:00: **[BACKEND]** Adicionar paginação em `billingPlans.ts`, `credits.ts`
- [ ] 10:00-11:00: **[BACKEND]** Adicionar paginação em `diagnostic.ts`, `feedback.ts`
- [ ] 11:00-12:00: **[BACKEND]** Adicionar paginação em `financial.ts`, `gamification.ts`

**Tarde (2.5h)**:
- [ ] 13:00-14:00: **[BACKEND]** Adicionar paginação em `organizations.ts`, `progress.ts`, `subscriptions.ts`
- [ ] 14:00-15:00: Testar com datasets grandes (1000+ registros)
- [ ] 15:00-15:30: **[VALIDAÇÃO FINAL]** Rodar `quick-audit.ps1` → esperar 0 problemas

**Entregável Dia 6**: Sprint 3 completo (11 problemas P3 resolvidos)

---

## 🎯 ENTREGAS POR SPRINT

| Sprint | Dias | Problemas | Entregas |
|--------|------|-----------|----------|
| **Sprint 1 (P1)** | 3 dias | 19 | 9 rotas backend + 8 módulos frontend + 2 integrações |
| **Sprint 2 (P2)** | 2 dias | 18 | 16 rotas padronizadas + 2 módulos com estados |
| **Sprint 3 (P3)** | 1 dia | 11 | 11 rotas com paginação |
| **TOTAL** | 6 dias | 48 | Projeto pronto para pré-produção |

---

## 👥 DISTRIBUIÇÃO DE TAREFAS (Sugerida)

### Dev Backend
**Carga**: 18h total (4.5h + 8h + 5.5h)
- Sprint 1 Dia 1: Error handling em 9 rotas (4.5h)
- Sprint 2 Dia 4: Padronizar 16 rotas (8h)
- Sprint 3 Dia 6: Paginação em 11 rotas (5.5h)

### Dev Frontend
**Carga**: 20h total (3.5h + 8h + 6.5h + 2h)
- Sprint 1 Dia 1: Migrar 2 módulos (3.5h)
- Sprint 1 Dia 2: Migrar 6 módulos (8h)
- Sprint 1 Dia 3: Integrar 2 módulos + validação (6.5h)
- Sprint 2 Dia 5: Estados UI + validação (2h)

### QA/Tester
**Carga**: 8h total
- Sprint 1 Dia 3 tarde: Testes manuais (3h)
- Sprint 2 Dia 5: Testes de qualidade (2h)
- Sprint 3 Dia 6: Testes de performance (2h)
- Validação contínua: 1h

---

## ✅ CRITÉRIOS DE ACEITAÇÃO

### Sprint 1 (MUST HAVE)
- [ ] `quick-audit.ps1` reporta 0 problemas P1
- [ ] Todos os 8 módulos frontend usam `createModuleAPI()`
- [ ] Todas as 9 rotas backend têm try-catch
- [ ] Navegador console sem erros
- [ ] `npm run build` passa sem erros TypeScript

### Sprint 2 (SHOULD HAVE)
- [ ] `quick-audit.ps1` reporta < 5 problemas P2
- [ ] Todas as rotas retornam `{success, data, message}`
- [ ] Frontend testa manualmente sem falhas

### Sprint 3 (NICE TO HAVE)
- [ ] `quick-audit.ps1` reporta 0 problemas P3
- [ ] Rotas com paginação testadas com 1000+ registros
- [ ] Tempo de resposta < 500ms com paginação

---

## 🚨 PLANO DE CONTINGÊNCIA

### Se atrasar 1 dia (qualquer sprint):
- Trabalhar 2h extra no dia seguinte
- Priorizar problemas P0 e P1 apenas
- Adiar Sprint 3 para pós-deploy

### Se atrasar 2+ dias:
- Reunião de reavaliação
- Dividir entregas em 2 releases:
  - Release 1: Sprint 1 + Sprint 2 crítico
  - Release 2: Sprint 2 completo + Sprint 3

### Se descobrir bug bloqueante:
- Parar sprint atual
- Fix do bloqueador (P0 imediato)
- Retomar sprint após validação

---

## 📊 DAILY STANDUP (Recomendado)

**Horário**: 08:00-08:15 (15 min diários)

**Formato**:
1. O que fiz ontem?
2. O que vou fazer hoje?
3. Há bloqueios?

**Métricas a reportar**:
- Problemas resolvidos (P1/P2/P3)
- Tempo gasto vs estimado
- Bugs encontrados
- Riscos identificados

---

## 🎉 CELEBRAÇÃO DE MARCOS

- ✅ **Sprint 1 completo**: Pizza para equipe 🍕
- ✅ **Sprint 2 completo**: Happy hour virtual 🍻
- ✅ **Sprint 3 completo**: Deploy para pré-produção 🚀

---

## 📈 MÉTRICAS DE SUCESSO

Ao final dos sprints, esperamos:
- ✅ 100% problemas P1 resolvidos (19 de 19)
- ✅ 100% problemas P2 resolvidos (18 de 18)
- ✅ 100% problemas P3 resolvidos (11 de 11)
- ✅ 0 erros TypeScript
- ✅ 0 erros console navegador
- ✅ Todos os módulos testados manualmente
- ✅ Projeto marcado como **PRONTO PRÉ-PRODUÇÃO** ✨

---

**Criado em**: 19/10/2025 19:10
**Próximo checkpoint**: 23/10/2025 (fim Sprint 1)
**Objetivo final**: 28/10/2025 (deploy pré-produção)
