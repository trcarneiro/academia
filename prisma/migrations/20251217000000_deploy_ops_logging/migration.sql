-- Deploy operations logging
-- Generated manually for deploy ops feature

CREATE TYPE "DeploySessionStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'SUCCESS', 'FAILED', 'ROLLED_BACK');
CREATE TYPE "HealthCheckResult" AS ENUM ('PASS', 'FAIL');
CREATE TYPE "DeployLogLevel" AS ENUM ('INFO', 'WARN', 'ERROR');

CREATE TABLE "deploy_artifacts" (
    "id" TEXT PRIMARY KEY,
    "sourceVersion" TEXT NOT NULL,
    "buildTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aliasesResolved" BOOLEAN NOT NULL DEFAULT TRUE,
    "checksum" TEXT NOT NULL,
    "contents" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "deploy_sessions" (
    "id" TEXT PRIMARY KEY,
    "artifactId" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "targetEnvironment" TEXT NOT NULL,
    "status" "DeploySessionStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "deploy_sessions_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "deploy_artifacts"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "deploy_health_checks" (
    "id" TEXT PRIMARY KEY,
    "sessionId" TEXT NOT NULL UNIQUE,
    "endpoint" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "httpStatus" INTEGER NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "stabilityWindowMinutes" INTEGER NOT NULL DEFAULT 30,
    "restartsObserved" INTEGER NOT NULL DEFAULT 0,
    "result" "HealthCheckResult" NOT NULL,
    "logExcerpt" TEXT,
    CONSTRAINT "deploy_health_checks_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "deploy_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "deploy_logs" (
    "id" TEXT PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "level" "DeployLogLevel" NOT NULL DEFAULT 'INFO',
    "message" TEXT NOT NULL,
    "data" JSONB,
    CONSTRAINT "deploy_logs_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "deploy_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
