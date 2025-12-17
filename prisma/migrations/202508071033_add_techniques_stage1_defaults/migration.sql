-- Stage 1 safe migration for Techniques module
-- Goal:
--  - Add new columns to existing "techniques" table with safe DEFAULTs (no drops)
--  - Preserve existing data and columns (e.g., description, difficulty, category enum, etc.)
--  - Create pivot tables for educational and lesson plan links
--  - Add indexes and constraints
--  - This stage is reversible and non-destructive

BEGIN;

-- 1) Add new columns to techniques with safe defaults (only if not exists)
-- Note: Some Postgres versions don't support IF NOT EXISTS for ADD COLUMN.
-- We use DO blocks to avoid errors if columns already exist.

-- slug unique, default a temporary uuid-like string to avoid nulls; will be backfilled later
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'techniques' AND column_name = 'slug'
  ) THEN
    ALTER TABLE "techniques" ADD COLUMN "slug" TEXT NOT NULL DEFAULT concat('tech-', floor(random()*1000000000)::text);
  END IF;
END $$;

-- shortDescription
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'techniques' AND column_name = 'shortDescription'
  ) THEN
    ALTER TABLE "techniques" ADD COLUMN "shortDescription" TEXT NOT NULL DEFAULT '';
  END IF;
END $$;

-- taxonomy strings (keep old enum category for now; add new text fields alongside)
-- Do not touch existing enum "category" column here to avoid duplication in shadow DB.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'techniques' AND column_name = 'subcategory'
  ) THEN
    ALTER TABLE "techniques" ADD COLUMN "subcategory" TEXT;
  END IF;
END $$;

-- modality, complexity
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'techniques' AND column_name = 'modality'
  ) THEN
    ALTER TABLE "techniques" ADD COLUMN "modality" TEXT NOT NULL DEFAULT 'PRESENCIAL';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'techniques' AND column_name = 'complexity'
  ) THEN
    ALTER TABLE "techniques" ADD COLUMN "complexity" TEXT NOT NULL DEFAULT 'BASICA';
  END IF;
END $$;

-- numeric ranges
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'techniques' AND column_name = 'durationMin') THEN
    ALTER TABLE "techniques" ADD COLUMN "durationMin" INTEGER NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'techniques' AND column_name = 'durationMax') THEN
    ALTER TABLE "techniques" ADD COLUMN "durationMax" INTEGER NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'techniques' AND column_name = 'groupSizeMin') THEN
    ALTER TABLE "techniques" ADD COLUMN "groupSizeMin" INTEGER NOT NULL DEFAULT 1;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'techniques' AND column_name = 'groupSizeMax') THEN
    ALTER TABLE "techniques" ADD COLUMN "groupSizeMax" INTEGER NOT NULL DEFAULT 1;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'techniques' AND column_name = 'ageRangeMin') THEN
    ALTER TABLE "techniques" ADD COLUMN "ageRangeMin" INTEGER NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'techniques' AND column_name = 'ageRangeMax') THEN
    ALTER TABLE "techniques" ADD COLUMN "ageRangeMax" INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

-- arrays and JSON arrays
-- objectives, resources, assessmentCriteria, risksMitigation, skills, tags, references
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'techniques' AND column_name = 'objectives') THEN
    ALTER TABLE "techniques" ADD COLUMN "objectives" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'techniques' AND column_name = 'resources') THEN
    ALTER TABLE "techniques" ADD COLUMN "resources" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'techniques' AND column_name = 'assessmentCriteria') THEN
    ALTER TABLE "techniques" ADD COLUMN "assessmentCriteria" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'techniques' AND column_name = 'risksMitigation') THEN
    ALTER TABLE "techniques" ADD COLUMN "risksMitigation" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'techniques' AND column_name = 'skills') THEN
    ALTER TABLE "techniques" ADD COLUMN "skills" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'techniques' AND column_name = 'tags') THEN
    ALTER TABLE "techniques" ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'techniques' AND column_name = 'references') THEN
    ALTER TABLE "techniques" ADD COLUMN "references" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
  END IF;
END $$;

-- stepByStep JSON[] and bnccCompetencies JSON[], bnccCompetenciesText denormalized
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'techniques' AND column_name = 'stepByStep') THEN
    ALTER TABLE "techniques" ADD COLUMN "stepByStep" JSONB NOT NULL DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'techniques' AND column_name = 'bnccCompetencies') THEN
    ALTER TABLE "techniques" ADD COLUMN "bnccCompetencies" JSONB NOT NULL DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'techniques' AND column_name = 'bnccCompetenciesText') THEN
    ALTER TABLE "techniques" ADD COLUMN "bnccCompetenciesText" TEXT NOT NULL DEFAULT '';
  END IF;
END $$;

-- Unique index for slug (create if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'techniques_slug_key'
  ) THEN
    -- ensure no duplicate slugs before creating constraint
    -- If duplicates exist due to default, optionally you may clean slugs in a backfill script before enforcing uniqueness.
    BEGIN
      ALTER TABLE "techniques" ADD CONSTRAINT "techniques_slug_key" UNIQUE ("slug");
    EXCEPTION WHEN duplicate_table THEN
      -- ignore if already exists
      NULL;
    END;
  END IF;
END $$;

-- 2) Create pivot tables for educational/lesson plan links

-- educational_plan_techniques
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'educational_plan_techniques') THEN
    CREATE TABLE "educational_plan_techniques" (
      "educationalPlanId" TEXT NOT NULL,
      "techniqueId" TEXT NOT NULL,
      "order" INTEGER NOT NULL DEFAULT 0,
      "notes" TEXT,
      CONSTRAINT "educational_plan_techniques_pkey" PRIMARY KEY ("educationalPlanId","techniqueId"),
      CONSTRAINT "educational_plan_techniques_technique_fkey" FOREIGN KEY ("techniqueId") REFERENCES "techniques"("id") ON DELETE CASCADE
      -- FK to educational plan left out if table name differs; add here if available:
      -- , CONSTRAINT "educational_plan_techniques_plan_fkey" FOREIGN KEY ("educationalPlanId") REFERENCES "educational_plans"("id") ON DELETE CASCADE
    );
  END IF;
END $$;

-- lesson_plan_techniques
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lesson_plan_techniques') THEN
    CREATE TABLE "lesson_plan_techniques" (
      "lessonPlanId" TEXT NOT NULL,
      "techniqueId" TEXT NOT NULL,
      "order" INTEGER NOT NULL DEFAULT 0,
      "allocationMinutes" INTEGER NOT NULL DEFAULT 0,
      "objectiveMapping" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
      CONSTRAINT "lesson_plan_techniques_pkey" PRIMARY KEY ("lessonPlanId","techniqueId"),
      CONSTRAINT "lesson_plan_techniques_technique_fkey" FOREIGN KEY ("techniqueId") REFERENCES "techniques"("id") ON DELETE CASCADE,
      CONSTRAINT "lesson_plan_techniques_lesson_fkey" FOREIGN KEY ("lessonPlanId") REFERENCES "lesson_plans"("id") ON DELETE CASCADE
    );
  END IF;
END $$;

-- Optional indexes to help search
-- For enum category (existing), index name may already exist; use IF NOT EXISTS on index catalog safely.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'techniques_category_idx') THEN
    CREATE INDEX "techniques_category_idx" ON "techniques" (category);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'techniques_modality_idx') THEN
    CREATE INDEX "techniques_modality_idx" ON "techniques" (modality);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'techniques_complexity_idx') THEN
    CREATE INDEX "techniques_complexity_idx" ON "techniques" (complexity);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'techniques_bncc_text_idx') THEN
    CREATE INDEX "techniques_bncc_text_idx" ON "techniques" USING GIN (to_tsvector('simple', "bnccCompetenciesText"));
  END IF;
END $$;

COMMIT;