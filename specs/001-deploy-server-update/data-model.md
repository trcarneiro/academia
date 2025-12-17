# Data Model: Atualizar deploy do servidor

## Entities

### DeployArtifact
- **Fields**: id (uuid), sourceVersion (string/git hash), buildTimestamp (datetime), aliasesResolved (boolean), checksum (string), contents (description of packaged folders), location (path/uri), sizeBytes (int)
- **Purpose**: Represents the built package ready to ship to the server, ensuring aliases are already resolved.
- **Validation**: checksum required; aliasesResolved must be true before deploy; sizeBytes > 0.

### DeploySession
- **Fields**: id (uuid), artifactId (fk DeployArtifact), operator (string/user id), targetEnvironment (string), startedAt (datetime), completedAt (datetime?), status (enum: PENDING, IN_PROGRESS, SUCCESS, FAILED, ROLLED_BACK), notes (string?)
- **Purpose**: Tracks a single deploy attempt for a given artifact and environment.
- **Validation**: status transitions allowed: PENDING → IN_PROGRESS → {SUCCESS | FAILED}; SUCCESS → ROLLED_BACK (optional); timestamps monotonic.
- **Relationships**: artifactId → DeployArtifact; links to HealthCheck and DeployLog entries.

### HealthCheck
- **Fields**: id (uuid), sessionId (fk DeploySession), endpoint (string, e.g., "/"), startedAt (datetime), completedAt (datetime), httpStatus (int), latencyMs (int), stabilityWindowMinutes (int, default 30), restartsObserved (int), result (enum: PASS, FAIL), logExcerpt (string?)
- **Purpose**: Records post-restart validation for the deploy (availability + stability window).
- **Validation**: httpStatus must be 200 for PASS; restartsObserved must be 0 for PASS; stabilityWindowMinutes ≥ 30.

### DeployLog
- **Fields**: id (uuid), sessionId (fk DeploySession), timestamp (datetime), level (enum: INFO, WARN, ERROR), message (string), data (json?)
- **Purpose**: Audit entries capturing deploy outcomes, health results, and rollback actions.
- **Validation**: message required; level required; sessionId required.

## Relationships
- DeployArtifact 1→N DeploySession (artifact reused for retries if unchanged).
- DeploySession 1→1 HealthCheck (per deploy execution) and 1→N DeployLog entries.

## State Transitions (DeploySession)
- **PENDING → IN_PROGRESS**: artifact accepted and transfer started.
- **IN_PROGRESS → SUCCESS**: artifact activated, service healthy, health check PASS, stability window satisfied.
- **IN_PROGRESS → FAILED**: health check FAIL or supervisor restarts detected.
- **SUCCESS → ROLLED_BACK**: rollback executed; log must capture rollback reason.
