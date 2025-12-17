# Implementation Plan: Atualizar deploy do servidor

**Branch**: `001-deploy-server-update` | **Date**: 2025-12-17 | **Spec**: specs/001-deploy-server-update/spec.md
**Input**: Feature specification from `specs/001-deploy-server-update/spec.md`

**Note**: This plan follows the `/speckit.plan` workflow.

## Summary

Deploy a refreshed build to production without overwriting existing environment/data, resolving module aliasing at build time, restarting the service, validating health (HTTP 200) with 30-minute stability monitoring, and recording a deploy log with version and health outcome plus rollback path.

## Technical Context

**Language/Version**: TypeScript targeting Node.js 18+  
**Primary Dependencies**: Fastify (HTTP), Prisma (PostgreSQL ORM), PM2 (process supervisor), tsc/tsc-alias for build, Vanilla JS frontend with shared API client  
**Storage**: PostgreSQL (production data)  
**Testing**: Vitest via `npm run test`; lint via `npm run lint`; CI via `npm run ci`; build via `npm run build` + alias resolution  
**Target Platform**: Linux server (production) with SSH-based deploy and process supervisor  
**Project Type**: Web app (Fastify backend + vanilla JS frontend modules)  
**Performance Goals**: Restore availability; public endpoint responds 200 within 5 minutes post-deploy; maintain 30+ minutes uptime without restarts post-restart  
**Constraints**: Preserve `.env`/`.venv` and persisted data; avoid modals/UI changes; maintain multi-tenant isolation; no downtime beyond restart window; keep design tokens untouched  
**Scale/Scope**: Single production node serving multi-tenant traffic; no new endpoints expected beyond operational logging

## Constitution Check (pre-design)

| Principle | Status | Notes |
|-----------|--------|-------|
| I. API-First Design | ✅ | No new endpoints expected; existing API remains source of truth |
| II. Module Isolation | ✅ | No module code changes planned; deploy only |
| III. API Client Pattern | ✅ | Frontend unchanged; continues to use shared client |
| IV. Full-Screen UI Only | ✅ | No UI modifications in scope |
| V. Premium UI Standards | ✅ | UI untouched; design tokens remain |
| VI. Multi-Tenant Isolation | ✅ | Deploy must preserve org isolation and existing data/config |
| VII. Simplicity & YAGNI | ✅ | Minimal deploy steps; reuse existing build + supervisor |

## Project Structure

### Documentation (this feature)

```text
specs/001-deploy-server-update/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
```

### Source Code (repository root)

```text
src/
├── routes/
├── controllers/
├── services/
├── middlewares/
├── utils/
└── config/

public/
├── js/modules/
├── js/core/
└── css/

tests/
├── unit/
├── integration/
└── contract/

scripts/ (deploy, diagnostics)
dev/ (standards, design system docs)
```

**Structure Decision**: Single repository with Fastify/Prisma backend in `src/`, vanilla JS frontend modules in `public/js/modules/`, and operational scripts in `scripts/` supporting deployment.

## Complexity Tracking

No constitution violations; no complexity exceptions required.

## Phase 0 - Research

- Outputs: specs/001-deploy-server-update/research.md
- Focus: deploy packaging with alias resolution, health/uptime verification flow, rollback/logging approach preserving env/data.

## Phase 1 - Design & Contracts

- Outputs: specs/001-deploy-server-update/data-model.md, specs/001-deploy-server-update/contracts/, specs/001-deploy-server-update/quickstart.md
- Scope: operational data structures (deploy artifact/log/health check), API/contract surface for deploy evidence, operator quickstart for performing/validating deploy.

## Constitution Check (post-design)

| Principle | Status | Notes |
|-----------|--------|-------|
| I. API-First Design | ✅ | No new API; contracts documented for logging endpoints |
| II. Module Isolation | ✅ | No module edits required |
| III. API Client Pattern | ✅ | Unchanged frontend contract |
| IV. Full-Screen UI Only | ✅ | No UI changes |
| V. Premium UI Standards | ✅ | No UI changes |
| VI. Multi-Tenant Isolation | ✅ | Deploy/log operations preserve org data; no cross-tenant exposure |
| VII. Simplicity & YAGNI | ✅ | Minimal operational changes; reuse existing tooling |
