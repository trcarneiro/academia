# Deploy Operations

## Safety Boundaries
- Do **not** copy or modify server-side `.env`, `.venv`, database files, or uploads during deploy.
- Packages must exclude secrets and data; only ship compiled code, public assets, and required runtime scripts.
- Always keep the previous artifact available for rollback before activating a new build.

## Required Inputs
- Production SSH target (user@host) with write access to the app directory.
- Paths:
  - `PROD_APP_PATH`: directory hosting the live application
  - `PROD_STAGING_PATH`: staging folder for incoming artifacts before activation
  - `PROD_LOG_PATH`: location to append deploy/health logs
- Supervisor command to restart the app (e.g., `pm2 restart <name>` or system service).

## Deploy Flow (overview)
1. Build locally with alias resolution.
2. Package runtime artifacts (exclude `.env`, `.venv`, uploads, db files).
3. Transfer package to `PROD_STAGING_PATH` over SSH.
4. Activate by swapping into `PROD_APP_PATH`, keeping the previous artifact intact.
5. Restart supervisor and run health monitoring.
6. If health fails, roll back to the previous artifact; do not touch env/data.

## Validation
- Health probe: public `/` should return HTTP 200 within 5 minutes post-restart.
- Stability: no supervisor restarts and no alias/import errors for 30 minutes.
- Logging: every deploy and rollback must append to `PROD_LOG_PATH` with timestamp and source version/hash.
