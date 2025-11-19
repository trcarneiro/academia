-- =====================================================
-- MIGRATION: Create instructor_courses Table
-- Database: Supabase (PostgreSQL)
-- Date: 13/11/2025
-- =====================================================

-- Step 1: Drop table if exists (for clean migration)
DROP TABLE IF EXISTS instructor_courses CASCADE;

-- Step 2: Create instructor_courses table
CREATE TABLE instructor_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instructor_id UUID NOT NULL,
  course_id UUID NOT NULL,
  is_lead BOOLEAN DEFAULT false,
  certified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign Keys
  CONSTRAINT fk_instructor_courses_instructor 
    FOREIGN KEY (instructor_id) 
    REFERENCES instructors(id) 
    ON DELETE CASCADE,
    
  CONSTRAINT fk_instructor_courses_course 
    FOREIGN KEY (course_id) 
    REFERENCES courses(id) 
    ON DELETE CASCADE,
    
  -- Unique Constraint (prevent duplicate assignments)
  CONSTRAINT unique_instructor_course 
    UNIQUE (instructor_id, course_id)
);

-- Step 3: Create indexes for performance
CREATE INDEX idx_instructor_courses_instructor 
  ON instructor_courses(instructor_id);
  
CREATE INDEX idx_instructor_courses_course 
  ON instructor_courses(course_id);

-- Step 4: Create updated_at trigger
CREATE OR REPLACE FUNCTION update_instructor_courses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_instructor_courses_updated_at
  BEFORE UPDATE ON instructor_courses
  FOR EACH ROW
  EXECUTE FUNCTION update_instructor_courses_updated_at();

-- Step 5: Verification
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'instructor_courses'
ORDER BY ordinal_position;

-- Expected result: 9 columns
-- id, instructor_id, course_id, is_lead, certified_at, expires_at, notes, created_at, updated_at

-- Check constraints
SELECT 
  conname AS constraint_name,
  contype AS constraint_type
FROM pg_constraint
WHERE conrelid = 'instructor_courses'::regclass;

-- Expected constraints:
-- - instructor_courses_pkey (PRIMARY KEY)
-- - fk_instructor_courses_instructor (FOREIGN KEY)
-- - fk_instructor_courses_course (FOREIGN KEY)
-- - unique_instructor_course (UNIQUE)

-- Check indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'instructor_courses';

-- Expected indexes:
-- - instructor_courses_pkey
-- - idx_instructor_courses_instructor
-- - idx_instructor_courses_course

-- =====================================================
-- SUCCESS! Table created and ready to use.
-- =====================================================
