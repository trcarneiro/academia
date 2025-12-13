# Tasks: Sistema de Turmas Inativas e Sugestões de Horários

Based on `AGENTS.md` (v2.2.2), this task list covers the implementation of the Inactive Classes and Schedule Suggestions system.

## Phase 1: Setup & Database Modeling
- [ ] T001 Update `Turma` model in `prisma/schema.prisma` with `isActive`, `inactiveReason`, `minimumStudents`, `activationDate`.
- [ ] T002 Create `TurmaInterest` model in `prisma/schema.prisma`.
- [ ] T003 Create `HorarioSugerido` model in `prisma/schema.prisma`.
- [ ] T004 Create `HorarioSupporter` model in `prisma/schema.prisma`.
- [ ] T005 Run database migration (`npx prisma db push`).

## Phase 2: Foundational Backend (Turmas Inativas)
- [ ] T006 [US1] Update `src/routes/turmas.ts` to accept `includeInactive` query parameter.
- [ ] T007 [US1] Implement `POST /api/turmas/:id/interest` endpoint in `src/routes/turmas.ts`.
- [ ] T008 [US1] Implement `DELETE /api/turmas/:id/interest/:studentId` endpoint in `src/routes/turmas.ts`.
- [ ] T009 [US1] Create `src/services/turmaService.ts` with `checkAndActivateTurma` logic.

## Phase 3: User Story 1 - Turmas Inativas (Frontend)
- [ ] T010 [US1] Update `public/js/modules/turmas/index.js` (or list controller) to fetch and display inactive turmas.
- [ ] T011 [US1] Implement UI badges for "Inativa" (Orange) and "Quase Ativa" (Yellow/Pulse) in `public/css/modules/turmas.css`.
- [ ] T012 [US1] Add "Demonstrar Interesse" button logic in `public/js/modules/turmas/controllers/list-controller.js`.
- [ ] T013 [US1] Implement real-time update of interest counter in the UI.

## Phase 4: User Story 2 - Sugestões de Horários (Backend)
- [ ] T014 [US2] Create `src/routes/horarios-sugeridos.ts` with CRUD endpoints.
- [ ] T015 [US2] Implement `POST /api/horarios-sugeridos` (Create suggestion).
- [ ] T016 [US2] Implement `POST /api/horarios-sugeridos/:id/support` (Vote/Support).
- [ ] T017 [US2] Implement `GET /api/horarios-sugeridos` with filters (status, votes).
- [ ] T018 [US2] Register new routes in `src/app.ts`.

## Phase 5: User Story 2 - Sugestões de Horários (Frontend)
- [ ] T019 [US2] Create new module structure `public/js/modules/turmas-sugestoes/`.
- [ ] T020 [US2] Implement `public/js/modules/turmas-sugestoes/index.js` (Entry point).
- [ ] T021 [US2] Create "Sugerir Novo Horário" full-screen view in `public/js/modules/turmas-sugestoes/views/suggestion-form.js` (No Modals).
- [ ] T022 [US2] Implement suggestions list view with voting mechanism in `public/js/modules/turmas-sugestoes/views/list-view.js`.
- [ ] T023 [US2] Add entry to `public/js/core/app.js` to load the new module.

## Phase 6: Gamification (US3)
- [ ] T028 [US3] Update `Student` model to include gamification points/badges if needed.
- [ ] T029 [US3] Implement logic to award points for creating suggestions and having them approved.
- [ ] T030 [US3] Add visual indicators (badges) for top contributors in the suggestions list.

## Phase 7: Admin & Polish
- [ ] T024 [US2] Implement Admin endpoints for approving/rejecting suggestions in `src/routes/horarios-sugeridos.ts`.
- [ ] T025 [US2] Create Admin view for suggestions management (approve -> create turma).
- [ ] T026 [Polish] Implement basic notification logic (mock or email) when a class is activated.
- [ ] T027 [Polish] Verify mobile responsiveness for the new suggestions interface.

## Dependencies
- Phase 1 must be completed before Phase 2 and 4.
- Phase 2 must be completed before Phase 3.
- Phase 4 must be completed before Phase 5.

## Implementation Strategy
- **MVP**: Focus on Phase 1, 2, and 3 first to get "Turmas Inativas" working.
- **Incremental**: Then move to "Sugestões" (Phase 4 & 5).
