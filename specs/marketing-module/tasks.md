# Tasks: Marketing Module - Landing Pages

**Data**: 30/11/2025  
**Input**: `AGENTS.md`, `dev/LANDING_PAGE_BUILDER_ARCHITECTURE.md`, `prisma/schema.prisma`  
**Status**: Em implementação parcial

---

## Constitution Compliance Checklist

| Phase | Principles Affected | Verification |
|-------|---------------------|--------------|
| API/Backend | I, VI | Endpoints com organizationId obrigatório |
| Module Setup | II, VII | Módulo isolado single-file (marketing/index.js) |
| API Integration | III | `createModuleAPI()` + `fetchWithStates()` |
| UI Implementation | IV, V | No modals, premium CSS classes, tabs |

---

## Resumo do Estado Atual

### ✅ Já Implementado
- Prisma Schema: `LandingPage`, `LandingForm`, `LandingPageView` (modelos completos)
- CSS: `public/css/modules/marketing.css` (estilos do módulo)
- Frontend parcial: `public/js/modules/marketing/index.js` (1145 linhas - precisa ajustes)

### ⏳ Pendente
- API Routes: `src/routes/marketing.ts` (tem erros de compilação)
- Rotas públicas: `src/routes/landing-public.ts` (não existe)
- Registro no SPA Router
- Registro no server.ts
- Migração do Prisma
- Integração com AI Agent para edição via chat

---

## Phase 1: Setup (Infraestrutura)

**Purpose**: Corrigir erros e finalizar infraestrutura base

- [ ] T001 Executar migração Prisma para criar tabelas `landing_pages`, `landing_forms`, `landing_page_views` via `npx prisma db push`
- [ ] T002 Gerar cliente Prisma atualizado via `npx prisma generate`
- [ ] T003 Corrigir arquivo `src/routes/marketing.ts` para usar modelos corretos do schema Prisma
- [ ] T004 [P] Criar arquivo `src/routes/landing-public.ts` para rotas públicas (sem auth)
- [ ] T005 Registrar rotas de marketing em `src/server.ts`
- [ ] T006 Adicionar rota `/marketing` no SPA router `public/js/dashboard/spa-router.js`
- [ ] T007 [P] Adicionar link "Marketing" no menu lateral `public/index.html`
- [ ] T008 [P] Adicionar script tag do CSS em `public/index.html`

---

## Phase 2: Foundational (Backend API)

**Purpose**: API CRUD completa para Landing Pages

**⚠️ CRITICAL**: Rotas devem estar funcionando antes do frontend

### API Landing Pages

- [ ] T009 [P] Implementar `GET /api/marketing/landing-pages` - Listar landing pages da organização
- [ ] T010 [P] Implementar `GET /api/marketing/landing-pages/:id` - Detalhes de uma página
- [ ] T011 [P] Implementar `POST /api/marketing/landing-pages` - Criar nova landing page
- [ ] T012 [P] Implementar `PUT /api/marketing/landing-pages/:id` - Atualizar landing page
- [ ] T013 [P] Implementar `DELETE /api/marketing/landing-pages/:id` - Excluir landing page
- [ ] T014 Implementar `POST /api/marketing/landing-pages/:id/publish` - Publicar página
- [ ] T015 Implementar `POST /api/marketing/landing-pages/:id/unpublish` - Despublicar
- [ ] T016 Implementar `POST /api/marketing/landing-pages/:id/duplicate` - Duplicar página

### API Landing Forms

- [ ] T017 [P] Implementar `GET /api/marketing/landing-pages/:pageId/forms` - Listar forms
- [ ] T018 [P] Implementar `POST /api/marketing/landing-pages/:pageId/forms` - Criar form
- [ ] T019 Implementar `PUT /api/marketing/forms/:id` - Atualizar form
- [ ] T020 Implementar `DELETE /api/marketing/forms/:id` - Excluir form

### API Analytics

- [ ] T021 Implementar `GET /api/marketing/landing-pages/:id/analytics` - Métricas da página
- [ ] T022 Implementar `GET /api/marketing/analytics/summary` - Resumo geral do marketing

**Checkpoint**: API Backend completa e testável via Swagger/Postman

---

## Phase 3: User Story 1 - Gestão de Landing Pages (Priority: P1) 🎯 MVP

**Goal**: Admin pode criar, editar, listar e excluir landing pages

**Independent Test**: 
1. Acessar /marketing no browser
2. Ver lista de landing pages (vazia inicialmente)
3. Criar nova landing page com nome e slug
4. Ver landing page na lista
5. Editar dados da landing page
6. Excluir landing page

### Implementation for User Story 1

- [ ] T023 [US1] Ajustar `public/js/modules/marketing/index.js` - Tab "Landing Pages" com lista funcional
- [ ] T024 [US1] Implementar `renderLandingPagesList()` com chamada real à API
- [ ] T025 [US1] Implementar modal de criação (full-screen page) para nova landing page
- [ ] T026 [US1] Implementar página de edição de landing page (full-screen)
- [ ] T027 [US1] Implementar confirmação de exclusão
- [ ] T028 [US1] Adicionar feedback visual (toasts) para ações CRUD
- [ ] T029 [US1] Implementar estados loading/empty/error em todas as views

**Checkpoint**: CRUD completo de Landing Pages funcionando no frontend

---

## Phase 4: User Story 2 - Publicação e Preview (Priority: P2)

**Goal**: Admin pode publicar/despublicar páginas e visualizar preview

**Independent Test**:
1. Criar uma landing page com conteúdo HTML
2. Clicar em "Publicar"
3. Ver status mudar para "Publicado"
4. Acessar URL pública da landing page
5. Ver conteúdo renderizado
6. Despublicar página
7. URL pública retorna 404

### Routes Públicas

- [ ] T030 [US2] Criar `src/routes/landing-public.ts` com rota `GET /lp/:orgSlug/:pageSlug`
- [ ] T031 [US2] Implementar renderização HTML da landing page publicada
- [ ] T032 [US2] Implementar `POST /lp/:pageId/view` - Registrar pageview (analytics)
- [ ] T033 [US2] Implementar `POST /lp/:pageId/submit` - Submeter formulário (criar Lead)

### Frontend Publishing

- [ ] T034 [US2] Adicionar botões Publicar/Despublicar na lista e detalhe
- [ ] T035 [US2] Implementar preview iframe na página de edição
- [ ] T036 [US2] Mostrar URL pública da página publicada
- [ ] T037 [US2] Implementar "Copiar URL" com feedback

**Checkpoint**: Landing pages podem ser publicadas e acessadas publicamente

---

## Phase 5: User Story 3 - Edição via AI Agent Chat (Priority: P3)

**Goal**: Marketing Agent pode editar conteúdo da landing page via chat

**Independent Test**:
1. Abrir chat com Marketing Agent
2. Enviar prompt "Crie uma landing page para academia de Krav Maga"
3. Agent cria/atualiza landing page com conteúdo HTML
4. Ver preview atualizado
5. Enviar prompt "Altere a cor principal para azul"
6. Ver alteração refletida

### Integração AI Agent

- [ ] T038 [US3] Criar endpoint `POST /api/marketing/landing-pages/:id/generate` - Gerar conteúdo via AI
- [ ] T039 [US3] Integrar com `aiService.ts` para prompts de geração de HTML
- [ ] T040 [US3] Definir prompts base para Marketing Agent no `prisma/schema.prisma` (AgentPrompt)
- [ ] T041 [US3] Adicionar seção "Editar com IA" na página de edição
- [ ] T042 [US3] Implementar chat inline para edição rápida
- [ ] T043 [US3] Implementar sugestões de prompts (chips clicáveis)

**Checkpoint**: Landing pages podem ser criadas/editadas via chat com AI

---

## Phase 6: User Story 4 - Formulários e Leads (Priority: P4)

**Goal**: Formulários nas landing pages capturam leads para CRM

**Independent Test**:
1. Adicionar formulário a uma landing page
2. Publicar a página
3. Acessar página pública
4. Preencher e submeter formulário
5. Ver lead criado no CRM com source "LANDING_PAGE"

### Implementation

- [ ] T044 [US4] Implementar CRUD de formulários no frontend
- [ ] T045 [US4] Criar editor de campos de formulário (nome, email, telefone, etc.)
- [ ] T046 [US4] Implementar renderização de form no HTML da landing page
- [ ] T047 [US4] Integrar submissão de form com criação de Lead no CRM
- [ ] T048 [US4] Adicionar tags automáticas ao lead baseado no form

**Checkpoint**: Formulários funcionam e criam leads automaticamente

---

## Phase 7: User Story 5 - Analytics Dashboard (Priority: P5)

**Goal**: Admin visualiza métricas de performance das landing pages

**Independent Test**:
1. Acessar uma landing page publicada várias vezes
2. Submeter alguns formulários
3. Ver métricas atualizadas: views, submissions, conversion rate
4. Ver gráfico de visitas ao longo do tempo

### Implementation

- [ ] T049 [US5] Implementar tab "Analytics" no módulo de marketing
- [ ] T050 [US5] Criar cards de métricas: Total Views, Unique Visitors, Submissions, Conversion Rate
- [ ] T051 [US5] Implementar gráfico de visitas (últimos 30 dias)
- [ ] T052 [US5] Mostrar top 5 landing pages por performance
- [ ] T053 [US5] Implementar filtros por período (7d, 30d, 90d)

**Checkpoint**: Dashboard de analytics completo e funcional

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Refinamentos e melhorias

- [ ] T054 [P] Adicionar validação Zod para todos os endpoints
- [ ] T055 [P] Implementar rate limiting nas rotas públicas
- [ ] T056 [P] Adicionar logs detalhados para debugging
- [ ] T057 Sanitizar HTML customizado (prevenir XSS)
- [ ] T058 Implementar cache de landing pages publicadas
- [ ] T059 [P] Testes unitários para `marketing.ts` routes
- [ ] T060 Documentar API no Swagger
- [ ] T061 Criar template inicial "SmartDefence" como exemplo

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) ──────────────────────────────────────┐
                                                       │
Phase 2 (Backend API) ◄────────────────────────────────┤
                                                       │
    ┌──────────────────────────────────────────────────┘
    │
    ▼
Phase 3 (US1: CRUD Landing Pages) ──► MVP! ◄── Pode parar aqui
    │
    ▼
Phase 4 (US2: Publicação + Preview)
    │
    ▼
Phase 5 (US3: Edição via AI Agent)
    │
    ▼
Phase 6 (US4: Formulários + Leads)
    │
    ▼
Phase 7 (US5: Analytics Dashboard)
    │
    ▼
Phase 8 (Polish)
```

### Parallel Opportunities

**Phase 1 (Setup)**:
```bash
# Podem rodar em paralelo:
T004: landing-public.ts
T007: Link no menu
T008: Script CSS
```

**Phase 2 (Backend API)**:
```bash
# Podem rodar em paralelo:
T009-T013: CRUD endpoints (arquivos diferentes)
T017-T018: Forms endpoints
```

**Phase 3 (Frontend)**:
```bash
# Dependência sequencial:
T023 → T024 → T025 → T026 → T027 → T028 → T029
```

---

## Implementation Strategy

### MVP First (Phases 1-3)

1. ✅ Phase 1: Setup - Corrigir erros, migrar DB
2. ✅ Phase 2: Backend API - CRUD funcionando
3. ✅ Phase 3: Frontend CRUD - Listar, criar, editar, excluir
4. **STOP**: Testar CRUD completo
5. Deploy se funcional

**Estimativa MVP**: 2-3 dias de trabalho

### Incremental Delivery

| Phase | Entrega | Valor |
|-------|---------|-------|
| 1-3 | CRUD Landing Pages | Admin gerencia páginas |
| 4 | Publicação | Páginas acessíveis publicamente |
| 5 | AI Agent | Edição via chat (diferencial) |
| 6 | Formulários | Captura de leads automática |
| 7 | Analytics | Insights de performance |

---

## Arquivos Principais

| Arquivo | Status | Linhas | Descrição |
|---------|--------|--------|-----------|
| `prisma/schema.prisma` | ✅ Done | ~130 | Modelos LandingPage, LandingForm, LandingPageView |
| `src/routes/marketing.ts` | ⚠️ Erros | ~400 | CRUD routes (precisa correção) |
| `src/routes/landing-public.ts` | ⏳ TODO | ~150 | Rotas públicas |
| `public/js/modules/marketing/index.js` | ✅ Done | 1145 | Módulo frontend |
| `public/css/modules/marketing.css` | ✅ Done | ~500 | Estilos |

---

## Notas

- **[P]** = Pode rodar em paralelo (arquivos diferentes)
- **[USx]** = User Story x
- Cada US é independentemente testável
- Commitar após cada task ou grupo lógico
- Validar schema Prisma antes de qualquer mudança no banco
