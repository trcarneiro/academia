-- Add agent permission columns back to users table
ALTER TABLE "users"
    ADD COLUMN "canApproveAgentTasks" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "canExecuteAgentTasks" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "canCreateAgents" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "canDeleteAgents" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "maxTaskPriority" TEXT NOT NULL DEFAULT 'MEDIUM',
    ADD COLUMN "canApproveCategories" TEXT[] DEFAULT ARRAY[]::TEXT[];
