# Tasks: Atualizar deploy do servidor

**Input**: Design documents from `/specs/001-deploy-server-update/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Not explicitly requested; include integration checks only where valuable.
**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Constitution Compliance Checklist

| Phase | Principles Affected | Verification |
|-------|---------------------|--------------|
| API/Backend | I, VI | Endpoints follow `{ success, data, message }`, preserve organization data isolation |
| Deploy Scripts | VII | Minimal scripts, reuse existing build tooling |
| API Integration | III | Existing API client unchanged; new ops endpoints follow API format |
| UI | IV, V | No UI changes in scope |

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare deploy documentation and folder scaffolding.

- [ ] T001 Create deploy operations README outlining env/data safety boundaries in scripts/deploy/README.md
- [ ] T002 Document production SSH target/staging paths and prerequisites in specs/001-deploy-server-update/quickstart.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Ensure build pipeline resolves aliases before packaging.

- [ ] T003 Add npm script `build:alias` chaining `npm run build` with tsc-alias in package.json
- [ ] T004 [P] Update README-DEPLOY.md to mandate `npm run build:alias` for any production artifact

**Checkpoint**: Foundation ready; user story work can begin.

---

## Phase 3: User Story 1 - Deploy seguro da versão atual (Priority: P1) 🎯 MVP

**Goal**: Publish latest local build to production without overwriting `.env`/`.venv` or data, and restore availability.
**Independent Test**: Run packaging + transfer + activation; confirm `/` responds 200 within 5 minutes and server env/data remain unchanged.

### Implementation

- [ ] T005 [US1] Create packaging script with build+alias resolution and tarball generation excluding `.env`, `.venv`, uploads in scripts/deploy/package-artifact.ps1
- [ ] T006 [US1] Emit artifact manifest (hash, size, contents, source version) to scripts/deploy/artifact-manifest.json as part of packaging
- [ ] T007 [US1] Add activation/rollback script to swap artifact symlink and restart supervisor without deleting previous build in scripts/deploy/activate-artifact.sh
- [ ] T008 [US1] Document packaging, transfer, activation, and rollback workflow referencing new scripts in specs/001-deploy-server-update/quickstart.md

**Checkpoint**: US1 delivers deployable artifact, safe activation, and doc’d path; service responds 200.

---

## Phase 4: User Story 2 - Verificação de saúde pós-deploy (Priority: P2)

**Goal**: Automatically validate health and stability after restart, preventing crash loops.
**Independent Test**: Monitor deploy with health script; pass when `/` returns 200 ≤5 minutes and zero restarts/alias errors over 30 minutes; fail otherwise.

### Implementation

- [ ] T009 [US2] Implement health probe script polling `/` with 5-minute timeout and latency capture in scripts/deploy/monitor-health.sh
- [ ] T010 [US2] Extend monitoring to watch supervisor restarts/logs for 30 minutes and flag alias/import errors, outputting summary to scripts/deploy/monitor-health.log
- [ ] T011 [US2] Document pass/fail criteria and rollback triggers for monitoring flow in specs/001-deploy-server-update/quickstart.md

**Checkpoint**: US2 provides automated post-deploy validation with clear failure criteria.

---

## Phase 5: User Story 3 - Evidência de entrega (Priority: P3)

**Goal**: Persist deploy session, health results, and rollback actions for auditability.
**Independent Test**: Create deploy session, append health result and log entries via API, then retrieve session showing timestamps, version/hash, and health outcome.

### Implementation

- [ ] T012 [US3] Add DeployArtifact, DeploySession, HealthCheck, and DeployLog models with enums/relations to prisma/schema.prisma
- [ ] T013 [US3] Generate migration for deploy logging and regenerate Prisma client in prisma/migrations/
- [ ] T014 [US3] Implement deploy operations service (session create/log/health/rollback) in src/services/deployOpsService.ts
- [ ] T015 [US3] Add Fastify routes for deploy ops per contracts/operations.md in src/routes/ops/deploySessions.ts and register in src/server.ts
- [ ] T016 [US3] Add contract/integration tests for deploy ops endpoints in tests/contract/ops.deploy.test.ts

**Checkpoint**: US3 yields auditable deploy records retrievable via API.

---

## Phase N: Polish & Cross-Cutting Concerns

- [ ] T017 [P] Consolidate deploy/rollback runbook in docs/deploy/rollback.md referencing scripts and ops endpoints
- [ ] T018 [P] Add sample env-safe deploy config and cross-links between scripts/deploy/README.md and specs/001-deploy-server-update/quickstart.md

---

## Dependencies & Execution Order

- **Phase order**: Setup → Foundational → US1 (MVP) → US2 → US3 → Polish.
- **Story dependencies**: US1 must complete before US2/US3 to ensure deployable artifact exists; US2 can run in parallel with US3 after US1 completion if teams separate.
- **Task dependencies**:
  - T005 depends on T003.
  - T006 depends on T005.
  - T007 depends on T005.
  - T009 depends on T005/T007 (artifact and activation workflow present).
  - T010 depends on T009.
  - T012 precedes T013; T013 precedes T014/T015/T016.

## Parallel Opportunities

- Within Setup: T001, T002 in parallel.
- Foundational: T004 can run parallel to T003.
- Post-US1 completion: US2 tasks can run parallel to US3 tasks if different owners.
- Polish tasks T017, T018 can run parallel after user stories.

## Implementation Strategy

- **MVP Scope**: Complete through US1 to restore deploy capability and availability.
- **Incremental**: Add US2 for automated health validation; add US3 for audit/rollback evidence.
- **Delivery**: After each story’s checkpoint, validate independently before proceeding.
