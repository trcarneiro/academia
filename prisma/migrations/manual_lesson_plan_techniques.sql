-- Migration: Ensure LessonPlanTechniques table exists with correct structure
-- Date: 2025-10-03
-- Purpose: Fix lesson plan techniques functionality

-- Check if table exists, if not create it
CREATE TABLE IF NOT EXISTS lesson_plan_techniques (
    "lessonPlanId" TEXT NOT NULL,
    "techniqueId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "allocationMinutes" INTEGER NOT NULL DEFAULT 0,
    "objectiveMapping" TEXT[] NOT NULL DEFAULT '{}',
    
    CONSTRAINT lesson_plan_techniques_pkey PRIMARY KEY ("lessonPlanId", "techniqueId"),
    CONSTRAINT lesson_plan_techniques_lessonPlanId_fkey FOREIGN KEY ("lessonPlanId") 
        REFERENCES lesson_plans(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT lesson_plan_techniques_techniqueId_fkey FOREIGN KEY ("techniqueId") 
        REFERENCES techniques(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS lesson_plan_techniques_lessonPlanId_idx ON lesson_plan_techniques("lessonPlanId");
CREATE INDEX IF NOT EXISTS lesson_plan_techniques_techniqueId_idx ON lesson_plan_techniques("techniqueId");

-- Display current count
SELECT 
    COUNT(*) as total_links,
    COUNT(DISTINCT "lessonPlanId") as lesson_plans_with_techniques,
    COUNT(DISTINCT "techniqueId") as unique_techniques_linked
FROM lesson_plan_techniques;
