# Quickstart: Atualizar deploy do servidor

## Prerequisites
- Access to production server via SSH with write permission to app directory.
- Environment and data already present on server (`.env`, `.venv`, database, uploads).
- Local build succeeds (`npm run build`) and aliases resolved (tsc-alias) before packaging.

## Steps
1. **Build locally**: `npm run build` then run alias resolution to ensure compiled output has concrete paths.
2. **Package artifacts**: Include `dist/`, `public/`, necessary configs/scripts; exclude `.env`, `.venv`, and data volumes.
3. **Transfer package**: Upload to server (e.g., scp/rsync over SSH) into a staging directory.
4. **Activate artifact**: Swap symlink or replace runtime folder with the new package. Keep previous artifact for rollback.
5. **Restart service**: Restart the process supervisor for the app.
6. **Health check**: Probe `/` until HTTP 200 (≤5 minutes). Monitor supervisor for 30 minutes; fail if any restart or import/alias error appears.
7. **Log deploy**: Append deploy log with timestamp, source version/hash, transfer result, and health outcome.
8. **Rollback (if needed)**: Re-point to previous artifact, restart the supervisor, and log rollback reason.

## Success Criteria Checklist
- HTTP 200 from `/` within 5 minutes of restart.
- No supervisor restarts for 30 minutes post-deploy; logs clear of alias/import errors.
- Deploy log entry created with version/hash and health result.
- Env/data on server unchanged.
