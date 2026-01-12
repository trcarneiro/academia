-- Migration: Add expectedRepetitions field to lesson_plan_techniques
-- This field tracks how many times each technique should be practiced in a lesson

ALTER TABLE "lesson_plan_techniques" 
ADD COLUMN IF NOT EXISTS "expectedRepetitions" INTEGER NOT NULL DEFAULT 1;

-- Add comment to document the field
COMMENT ON COLUMN "lesson_plan_techniques"."expectedRepetitions" IS 'Number of times this technique should be practiced during the lesson';
