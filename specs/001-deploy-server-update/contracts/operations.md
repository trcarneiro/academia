# Contracts: Deploy Operations

All responses follow `{ success: boolean, data?: any, message?: string }`.

## POST /ops/deploy-sessions
- **Purpose**: Register a deploy attempt for a built artifact.
- **Request Body**:
  - `artifactId` (string, required)
  - `operator` (string, required)
  - `targetEnvironment` (string, required)
  - `notes` (string, optional)
- **Response 200**:
  - `data`: `{ sessionId: string, status: "PENDING" }`
- **Error 400/500**: validation or server error message.

## POST /ops/deploy-sessions/{sessionId}/health-checks
- **Purpose**: Record health/stability verification after restart.
- **Request Body**:
  - `endpoint` (string, required, e.g., "/")
  - `httpStatus` (int, required)
  - `latencyMs` (int, required)
  - `stabilityWindowMinutes` (int, default 30)
  - `restartsObserved` (int, required)
  - `result` ("PASS" | "FAIL", required)
  - `logExcerpt` (string, optional)
- **Response 200**:
  - `data`: `{ sessionId: string, result: string }`

## POST /ops/deploy-sessions/{sessionId}/logs
- **Purpose**: Append an audit entry for deploy/rollback actions.
- **Request Body**:
  - `level` ("INFO" | "WARN" | "ERROR", required)
  - `message` (string, required)
  - `data` (object, optional)
- **Response 200**:
  - `data`: `{ sessionId: string, logId: string }`

## POST /ops/deploy-sessions/{sessionId}/rollback
- **Purpose**: Mark a successful deploy as rolled back and append log entry.
- **Request Body**:
  - `reason` (string, required)
- **Response 200**:
  - `data`: `{ sessionId: string, status: "ROLLED_BACK" }`

## GET /ops/deploy-sessions/{sessionId}
- **Purpose**: Retrieve deploy session status and recorded health/logs.
- **Response 200**:
  - `data`: {
    - `session`: DeploySession summary,
    - `healthCheck`: HealthCheck entry,
    - `logs`: DeployLog[]
    }
