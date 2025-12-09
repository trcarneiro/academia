# Tasks: Portal do Aluno

**Feature**: Portal do Aluno (Self-Service)
**Status**:  Ready for Implementation
**Based on**: plan.md v1.0, spec.md v1.2

## Phase 1: Setup (Project Initialization)

- [x] T001 Create directory structure for Portal frontend in \public/portal\, \public/js/portal\, \public/css/portal\
- [x] T002 Create directory structure for Portal backend in \src/routes/portal\, \src/services/portal\
- [x] T003 Create \public/portal/manifest.json\ with PWA configuration
- [x] T004 Create \public/portal/sw.js\ with basic service worker caching
- [x] T005 Create \public/portal/index.html\ as SPA shell
- [x] T006 Create \public/css/portal/base.css\ with reset and design tokens
- [x] T007 Create \public/css/portal/layout.css\ for mobile-first grid
- [x] T008 Create \public/css/portal/components.css\ for UI components
- [x] T009 Create \public/js/portal/app.js\ for application initialization
- [x] T010 Create \public/js/portal/router.js\ for hash-based routing
- [x] T011 Create \public/js/portal/api.js\ extending shared API client

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T012 Update \prisma/schema.prisma\ to add \StudentSession\ model
- [x] T013 Update \prisma/schema.prisma\ to add \StudentNotification\ model
- [x] T014 Update \prisma/schema.prisma\ to add \StudentTechniqueProgress\ model
- [x] T015 Update \prisma/schema.prisma\ to add fields to \Student\ (passwordHash, emailVerified, asaasCustomerId)
- [x] T016 Update \prisma/schema.prisma\ to add fields to \Payment\ (Asaas integration fields)
- [x] T017 Run \
px prisma migrate dev --name add_portal_tables\ to apply changes
- [x] T018 Create \src/middlewares/portalAuth.ts\ for JWT authentication
- [x] T019 Create \src/routes/portal/index.ts\ as main router entry point
- [x] T020 Register portal routes in \src/server.ts\ (or main app entry)

## Phase 3: User Story 1 - MVP de Venda (Landing, Register, Payment)

- [x] T021 [US1] Create \src/services/portal/paymentService.ts\ with Asaas integration logic
- [x] T022 [US1] Create \src/routes/portal/auth.ts\ with \
egister\ endpoint
- [x] T023 [US1] Create \src/routes/portal/payments.ts\ with \create\ and \status\ endpoints
- [x] T024 [US1] Create \public/js/portal/pages/landing.js\ for sales page
- [x] T025 [US1] Create \public/css/portal/pages/landing.css\ for landing page styles
- [x] T026 [US1] Create \public/js/portal/pages/register.js\ for student registration form
- [x] T027 [US1] Create \public/js/portal/pages/checkout.js\ for payment selection and PIX display
- [x] T028 [US1] Create \public/js/portal/pages/success.js\ for confirmation page
- [x] T029 [US1] Implement Asaas webhook handler in \src/routes/portal/payments.ts\ (or reuse existing)

## Phase 4: User Story 2 - Dashboard + Login

- [x] T030 [US2] Create \src/services/portal/authService.ts\ for login and magic link logic
- [x] T031 [US2] Update \src/routes/portal/auth.ts\ with \login\, \magic-link\, and \erify-code\ endpoints
- [x] T032 [US2] Create \src/routes/portal/profile.ts\ for fetching and updating student profile
- [x] T033 [US2] Create auth handling for tokens and session - IMPLEMENTED in \public/js/portal/api.js\ (token storage) and \public/js/portal/pages/register.js\ (login flow)
- [x] T034 [US2] Create \public/js/portal/pages/login.js\ with email/password and magic link support
- [x] T035 [US2] Create \public/js/portal/pages/dashboard.js\ for main student view
- [x] T036 [US2] Create \public/js/portal/pages/profile.js\ for editing personal data
- [x] T037 [US2] Create \public/js/portal/components/header.js\ with user info and logout
- [x] T038 [US2] Create \public/js/portal/components/nav-bottom.js\ for mobile navigation

## Phase 5: User Story 3 - Pagamentos + Agenda

- [x] T039 [US3] Create \src/services/portal/scheduleService.ts\ for class management
- [x] T040 [US3] Update \src/routes/portal/payments.ts\ to list invoices and details
- [x] T041 [US3] Create \src/routes/portal/schedule.ts\ for listing classes and booking
- [x] T042 [US3] Create \public/js/portal/pages/payments.js\ to list history and pending invoices
- [x] T043 [US3] Create \public/js/portal/pages/schedule.js\ with calendar view
- [x] T044 [US3] Implement booking logic in \public/js/portal/pages/schedule.js\
- [x] T045 [US3] Create \public/js/portal/components/toast.js\ for feedback messages

## Phase 6: User Story 4 - Cursos + Gamificação

- [x] T046 [US4] Create \src/services/portal/courseService.ts\ for progression logic
- [x] T047 [US4] Create \src/routes/portal/courses.ts\ for journey and techniques
- [x] T048 [US4] Create \public/js/portal/pages/courses.js\ for journey visualization
- [x] T049 [US4] Create \public/js/portal/pages/technique.js\ for video player and details
- [x] T050 [US4] Implement progress tracking UI in \public/js/portal/pages/courses.js\
- [x] T050a [US4] Implement student ranking logic in \src/services/portal/courseService.ts\
- [x] T050b [US4] Create \public/js/portal/pages/ranking.js\ for leaderboard visualization

## Phase 7: User Story 5 - Assistente IA

- [x] T051 [US5] Create \src/services/portal/chatService.ts\ wrapping Gemini API
- [x] T052 [US5] Create \src/routes/portal/chat.ts\ for message handling
- [x] T053 [US5] Create \public/js/portal/pages/chat.js\ for chat interface
- [x] T054 [US5] Implement quick actions in chat interface

## Phase 8: Polish & Cross-Cutting Concerns

- [x] T055 Create \src/routes/portal/notifications.ts\ for system notifications
- [x] T056 Implement notification polling/display in \public/js/portal/app.js\
- [x] T057 Finalize PWA assets (icons) and service worker caching strategy
- [x] T058 Perform E2E test of the full flow (Register -> Pay -> Login -> Dashboard)
- [x] T059 Optimize bundle size and loading performance
- [x] T060 Implement QR Code generation for Totem access in \src/services/portal/authService.ts\
- [x] T061 Add QR Code display to \public/js/portal/pages/dashboard.js\

## Phase 9: Security & Compliance (Analysis Remediation)

- [ ] T062 [SEC] Add organizationId filtering to all portal backend routes (Constitution VI compliance)
- [ ] T063 [SEC] Verify Turma.maxStudents field exists and implement vacancy checking in booking flow
- [ ] T064 [SEC] Implement rate limiting middleware for portal auth endpoints
- [ ] T065 [INFRA] Define video hosting strategy for course techniques (Cloudflare R2 recommended)

## Dependencies

- US1 (MVP) must be completed first to enable sales.
- US2 (Login) is required for US3, US4, US5.
- US3, US4, US5 can be developed in parallel after US2.
- Phase 9 tasks are security/compliance requirements that should be verified before production deployment.

## Implementation Strategy

1. **MVP First**: Focus strictly on T021-T029 to get the sales link working.
2. **Mobile First**: All UI development must be tested on mobile viewport first.
3. **API First**: Implement backend routes before frontend integration.

