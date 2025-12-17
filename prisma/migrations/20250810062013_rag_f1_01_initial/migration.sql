-- Safe additive migration for RAG foundations (F1-01 / F1-02 / F1-03)
-- This migration intentionally avoids any DROP / ALTER that removes existing columns or indexes.
-- It only ensures pgvector extension and creates new tables, indexes and foreign keys if absent.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS plan_courses (
    "planId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT plan_courses_pkey PRIMARY KEY ("planId","courseId")
);

CREATE TABLE IF NOT EXISTS technique_prerequisite (
    "techniqueId" TEXT NOT NULL,
    "prerequisiteTechniqueId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT technique_prerequisite_pkey PRIMARY KEY ("techniqueId","prerequisiteTechniqueId")
);

CREATE TABLE IF NOT EXISTS mental_modules (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "recommendedPhase" TEXT,
    "durationMin" INTEGER,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT mental_modules_pkey PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS adaptation_snippets (
    "id" TEXT NOT NULL,
    "audienceTag" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT adaptation_snippets_pkey PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS rag_chunks (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "type" TEXT NOT NULL,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "lang" TEXT NOT NULL DEFAULT 'pt-BR',
    "tags" TEXT[],
    "text" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "embedding" BYTEA,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT rag_chunks_pkey PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS rag_embeddings (
    "id" TEXT NOT NULL,
    "chunkId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "dim" INTEGER NOT NULL,
    "vector" vector,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT rag_embeddings_pkey PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS _BillingPlanCourses (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS mental_modules_name_key ON mental_modules("name");
CREATE INDEX IF NOT EXISTS adaptation_snippets_audienceTag_idx ON adaptation_snippets("audienceTag");
CREATE UNIQUE INDEX IF NOT EXISTS rag_chunks_hash_key ON rag_chunks("hash");
CREATE INDEX IF NOT EXISTS rag_chunks_organizationId_type_idx ON rag_chunks("organizationId", "type");
CREATE INDEX IF NOT EXISTS rag_chunks_type_version_idx ON rag_chunks("type", "version");
CREATE UNIQUE INDEX IF NOT EXISTS rag_embeddings_chunkId_key ON rag_embeddings("chunkId");
CREATE UNIQUE INDEX IF NOT EXISTS _BillingPlanCourses_AB_unique ON _BillingPlanCourses("A", "B");
CREATE INDEX IF NOT EXISTS _BillingPlanCourses_B_index ON _BillingPlanCourses("B");

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'plan_courses_planId_fkey') THEN
        ALTER TABLE plan_courses ADD CONSTRAINT plan_courses_planId_fkey FOREIGN KEY ("planId") REFERENCES billing_plans("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'plan_courses_courseId_fkey') THEN
        ALTER TABLE plan_courses ADD CONSTRAINT plan_courses_courseId_fkey FOREIGN KEY ("courseId") REFERENCES courses("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'technique_prerequisite_techniqueId_fkey') THEN
        ALTER TABLE technique_prerequisite ADD CONSTRAINT technique_prerequisite_techniqueId_fkey FOREIGN KEY ("techniqueId") REFERENCES techniques("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'technique_prerequisite_prerequisiteTechniqueId_fkey') THEN
        ALTER TABLE technique_prerequisite ADD CONSTRAINT technique_prerequisite_prerequisiteTechniqueId_fkey FOREIGN KEY ("prerequisiteTechniqueId") REFERENCES techniques("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rag_embeddings_chunkId_fkey') THEN
        ALTER TABLE rag_embeddings ADD CONSTRAINT rag_embeddings_chunkId_fkey FOREIGN KEY ("chunkId") REFERENCES rag_chunks("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_BillingPlanCourses_A_fkey') THEN
        ALTER TABLE _BillingPlanCourses ADD CONSTRAINT _BillingPlanCourses_A_fkey FOREIGN KEY ("A") REFERENCES billing_plans("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_BillingPlanCourses_B_fkey') THEN
        ALTER TABLE _BillingPlanCourses ADD CONSTRAINT _BillingPlanCourses_B_fkey FOREIGN KEY ("B") REFERENCES courses("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END$$;
