/*
  Safe-reconciled migration:
  - Remove destructive drops and duplicate ADD COLUMNs (handled by stage1 SQL migration 202508071033)
  - Keep only pivots, FKs, and slug index (uniqueness will succeed after backfill)
*/

-- CreateTable (pivot)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'educational_plan_techniques') THEN
    CREATE TABLE "educational_plan_techniques" (
      "educationalPlanId" TEXT NOT NULL,
      "techniqueId" TEXT NOT NULL,
      "order" INTEGER NOT NULL DEFAULT 0,
      "notes" TEXT,
      CONSTRAINT "educational_plan_techniques_pkey" PRIMARY KEY ("educationalPlanId","techniqueId")
    );
  END IF;
END $$;

-- CreateTable (pivot)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lesson_plan_techniques') THEN
    CREATE TABLE "lesson_plan_techniques" (
      "lessonPlanId" TEXT NOT NULL,
      "techniqueId" TEXT NOT NULL,
      "order" INTEGER NOT NULL DEFAULT 0,
      "allocationMinutes" INTEGER NOT NULL DEFAULT 0,
      "objectiveMapping" TEXT[],
      CONSTRAINT "lesson_plan_techniques_pkey" PRIMARY KEY ("lessonPlanId","techniqueId")
    );
  END IF;
END $$;

-- CreateIndex (unique slug) guarded
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'techniques_slug_key'
  ) THEN
    ALTER TABLE "techniques" ADD CONSTRAINT "techniques_slug_key" UNIQUE ("slug");
  END IF;
END $$;

-- Foreign keys guarded
DO $$
BEGIN
  -- educational_plan_techniques -> techniques
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'educational_plan_techniques_techniqueId_fkey'
  ) THEN
    ALTER TABLE "educational_plan_techniques"
      ADD CONSTRAINT "educational_plan_techniques_techniqueId_fkey"
      FOREIGN KEY ("techniqueId") REFERENCES "techniques"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  -- lesson_plan_techniques -> lesson_plans
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'lesson_plan_techniques_lessonPlanId_fkey'
  ) THEN
    ALTER TABLE "lesson_plan_techniques"
      ADD CONSTRAINT "lesson_plan_techniques_lessonPlanId_fkey"
      FOREIGN KEY ("lessonPlanId") REFERENCES "lesson_plans"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  -- lesson_plan_techniques -> techniques
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'lesson_plan_techniques_techniqueId_fkey'
  ) THEN
    ALTER TABLE "lesson_plan_techniques"
      ADD CONSTRAINT "lesson_plan_techniques_techniqueId_fkey"
      FOREIGN KEY ("techniqueId") REFERENCES "techniques"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
