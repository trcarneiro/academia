# Plano de Implementação: Integração com Supabase Auth

Este arquivo serve como cronograma vivo para implementação da integração Supabase Auth, conforme discutido. Cada tarefa é granular (1 a 1), sequencial, com status inicial "Pending". Atualize manualmente ou via tool calls em sessões futuras (ex.: mark as "In Progress" when starting, "Completed" when done). Alinhado com AGENTS.md (API-First, modularidade). Timeline total estimada: 3 dias (setup + backend + frontend). Dependências: Conta Supabase gratuita (free tier OK). Após, deploy staging e test.

## Status Geral
- **Timeline Total:** 3 dias (1 dev full-stack).
- **Dependências Iniciais:** Criar projeto Supabase (5 min).
- **Riscos:** Downtime Supabase (use fallbacks); migration users (backup Prisma).
- **Success Metrics:** 100% users linked to org; login <5s; RLS enforced.

## Tarefas Granulares (Sequencial, 1 a 1)

### Preparação (Dia 1 - 0.5 dia)
1. **Criar Projeto Supabase e Configurar Auth (Pending)**  
   - Descrição: Criar project em supabase.com; enable email/password + social (Google/GitHub); set custom claims { orgId: string, role: string }. Add env vars SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY.  
   - Responsável: Backend. Estimativa: 0.5h. Dependências: None.  
   - Test: Manual signup via Supabase dashboard.  
   - Status: Pending.  
   - Success: Auth server up, email verification enabled.

2. **Instalar Supabase JS Client no Frontend (Pending)**  
   - Descrição: Adicionar @supabase/supabase-js via npm (se não, yarn add @supabase/supabase-js); criar utils/supabase-client.ts com client init.  
   - Responsável: Frontend. Estimativa: 0.5h. Dependências: Tarefa 1.  
   - Test: Console.log client in browser.  
   - Status: Pending.  
   - Success: Client loads without errors.

### Backend Sync (Dia 1-2 - 1 dia)
3. **Atualizar Schema e Migration para Sync Users (Pending)**  
   - Descrição: Mapear Prisma User to Supabase users (add fields if needed); create migration for existing users (admin SDK batch). Update src/routes/auth.ts to use Supabase signUp/signIn.  
   - Responsável: Backend. Estimativa: 0.5 dia. Dependências: Tarefa 2.  
   - Test: Migrate 1 user, verify JWT claims { orgId }.  
   - Status: Pending.  
   - Success: Migration 100%; no orphans.

4. **Implementar Middleware para Supabase JWT (Pending)**  
   - Descrição: Replace jwtVerify in src/middlewares/auth.ts with Supabase verify; extract orgId from claims. Add RLS policies in Supabase (ex.: students where orgId = auth.jwt() -> orgId).  
   - Responsável: Backend. Estimativa: 0.5 dia. Dependências: Tarefa 3.  
   - Test: Unauthorized cross-org denied.  
   - Status: Pending.  
   - Success: Auth bypass 0%; RLS blocks invalid access.

5. **Criar Edge Function para Sync User/Org (Pending)**  
   - Descrição: Trigger on Supabase signup to create/link Prisma User with orgId (via metadata). Handle org creation if admin.  
   - Responsável: Backend. Estimativa: 0.5 dia. Dependências: Tarefa 4.  
   - Test: Signup new user, check Prisma sync.  
   - Status: Pending.  
   - Success: 100% registros linked.

### Frontend Integration (Dia 2 - 1 dia)
6. **Criar Módulo Auth Single-File (Pending)**  
   - Descrição: New public/js/modules/auth/index.js (template instructors per AGENTS.md); form with email/password + org select. Use Supabase client for signUp/signIn. On success, store token, redirect dashboard. Add states (loading/empty/error).  
   - Responsável: Frontend. Estimativa: 1 dia. Dependências: Tarefa 5.  
   - Test: Login success, token stored.  
   - Status: Pending.  
   - Success: Login <5s; UI states 100%.

7. **Atualizar Fluxo de Login e Org Linking (Pending)**  
   - Descrição: Modify index.html login to use Supabase; fetch org data on success. Update app.js to check claims.orgId for access (redirect if mismatch). Add org switcher for multi-org users.  
   - Responsável: Frontend. Estimativa: 0.5 dia. Dependências: Tarefa 6.  
   - Test: Multi-org login, isolation.  
   - Status: Pending.  
   - Success: Seamless auth; no 401 errors.

### Testing e Deploy (Dia 3 - 0.5 dia)
8. **Test Full Auth Flow (Pending)**  
   - Descrição: Vitest for auth routes; smoke test login/org access/social login. Manual: Multi-org scenarios.  
   - Responsável: QA/Full-stack. Estimativa: 0.5 dia. Dependências: Tarefas 1-7.  
   - Test: 100% success; RLS enforced.  
   - Status: Pending.  
   - Success: Zero P1 bugs.

9. **Deploy Staging e Cleanup (Pending)**  
   - Descrição: Deploy to staging; remove old JWT routes if stable. Update AGENTS.md with Supabase standards.  
   - Responsável: DevOps. Estimativa: 0.5 dia. Dependências: Tarefa 8.  
   - Test: End-to-end user flow.  
   - Status: Pending.  
   - Success: System SaaS-ready.

## Notas
- **Por Que Supabase?** Escalável, built-in auth (email/social), RLS para multi-org, realtime sync, free tier para dev.
- **Vantagem Mercado:** Supabase handles scale/auth, libera foco em core features; pronto para multi-academy SaaS (vencer sim, com monetização via Supabase Pro ~$25/mês).
- **Próximos Passos:** Aprovar este plano; switch to "code" mode para tarefa 1. Atualize este arquivo após cada tarefa (ex.: change "Pending" to "Completed" when done).

Última Atualização: 2025-09-27 (Início do Projeto).