# Research Notes: Atualizar deploy do servidor

## Decision 1: Build packaging with alias resolution
- **Decision**: Build locally with `npm run build`, run alias resolution (tsc-alias) over compiled output, and package only runtime artifacts (`dist`, `public`, production config files, necessary scripts), excluding `.env/.venv` to avoid overwrites. Sync artifacts to server via SSH-based transfer.
- **Rationale**: Prior deploy failures stemmed from unresolved `@/` aliases. Local build + alias resolution ensures runtime paths are concrete before reaching the server. Keeping env/data out of the package prevents accidental loss of credentials or tenant data.
- **Alternatives considered**: (a) Build on server after pull — rejected because missing dev dependencies and prior path alias crashes; (b) Run TypeScript directly (ts-node) — rejected because production uses compiled output and needs stable startup time.

## Decision 2: Health check and stability verification
- **Decision**: Use the public root endpoint (`/`) as the primary health probe (expects HTTP 200). After restart, monitor the process supervisor for 30 minutes to confirm no restarts and no alias/import errors in startup logs. Treat any restart or HTTP 5xx during the window as a failed deploy requiring rollback.
- **Rationale**: Root endpoint already exercises routing and asset serving; monitoring supervisor uptime catches crash loops that may not surface immediately. The 30-minute window aligns with User Story 2.
- **Alternatives considered**: (a) Create a new `/health` endpoint — unnecessary given existing root check; (b) Shorter monitoring window — rejected because prior crashes appeared after initial startup.

## Decision 3: Deploy log and rollback safety
- **Decision**: Record each deploy to a persistent log file on the server (timestamp, source version/hash, transfer status, health result). Keep the previous build artifact to enable manual rollback without touching env/data. Rollback path: switch symlink or restore previous artifact and restart the supervisor.
- **Rationale**: Provides auditability (User Story 3) and a clear recovery path without risking configuration loss. Maintaining prior artifact avoids rebuilding under time pressure.
- **Alternatives considered**: (a) Centralized logging service — overkill for current single-node scope; (b) Git-based rollback — rejected because production files may diverge from repo state and env files must stay untouched.

**Outstanding clarifications**: None. Decisions above resolve prior unknowns for this deploy scope.
