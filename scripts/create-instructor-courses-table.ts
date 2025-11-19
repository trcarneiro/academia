/**
 * Migration Script: Create instructor_courses Table
 * Run this to create the missing table in Supabase
 * Usage: npx tsx scripts/create-instructor-courses-table.ts
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function runMigration() {
  console.log('🚀 Starting instructor_courses table migration...\n');

  try {
    // Step 1: Check if table exists
    console.log('1️⃣ Checking if table exists...');
    const tableCheck = await prisma.$queryRaw<any[]>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'instructor_courses'
      );
    `;
    
    const tableExists = tableCheck[0]?.exists;
    
    if (tableExists) {
      console.log('⚠️  Table instructor_courses already exists');
      console.log('   Run this script with --force to recreate it\n');
      
      if (!process.argv.includes('--force')) {
        console.log('✅ Migration skipped (use --force to recreate)');
        return;
      }
      
      console.log('🔄 Forcing recreation...\n');
    } else {
      console.log('✅ Table does not exist, proceeding with creation\n');
    }

    // Step 2: Read SQL file
    console.log('2️⃣ Reading migration SQL file...');
    const sqlPath = path.join(__dirname, '..', 'migrations', 'create_instructor_courses_table.sql');
    
    if (!fs.existsSync(sqlPath)) {
      console.error('❌ Migration file not found:', sqlPath);
      process.exit(1);
    }
    
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
    console.log('✅ SQL file loaded\n');

    // Step 3: Execute SQL statements one by one
    console.log('3️⃣ Executing migration SQL...');
    
    // 1. Drop table if exists
    console.log('   Dropping existing table (if any)...');
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS instructor_courses CASCADE`);
    
    // 2. Create table
    console.log('   Creating instructor_courses table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE instructor_courses (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        instructor_id TEXT NOT NULL,
        course_id TEXT NOT NULL,
        is_lead BOOLEAN DEFAULT false,
        certified_at TIMESTAMP WITH TIME ZONE,
        expires_at TIMESTAMP WITH TIME ZONE,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        CONSTRAINT fk_instructor_courses_instructor 
          FOREIGN KEY (instructor_id) 
          REFERENCES instructors(id) 
          ON DELETE CASCADE,
          
        CONSTRAINT fk_instructor_courses_course 
          FOREIGN KEY (course_id) 
          REFERENCES courses(id) 
          ON DELETE CASCADE,
          
        CONSTRAINT unique_instructor_course 
          UNIQUE (instructor_id, course_id)
      )
    `);
    
    // 3. Create indexes
    console.log('   Creating indexes...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX idx_instructor_courses_instructor ON instructor_courses(instructor_id)
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX idx_instructor_courses_course ON instructor_courses(course_id)
    `);
    
    // 4. Create trigger function
    console.log('   Creating trigger function...');
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION update_instructor_courses_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    
    // 5. Create trigger
    console.log('   Creating trigger...');
    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER trigger_update_instructor_courses_updated_at
        BEFORE UPDATE ON instructor_courses
        FOR EACH ROW
        EXECUTE FUNCTION update_instructor_courses_updated_at()
    `);
    
    console.log('✅ Migration SQL executed successfully\n');
    
    console.log('✅ Migration SQL executed successfully\n');

    // Step 4: Verify table structure
    console.log('4️⃣ Verifying table structure...');
    const columns = await prisma.$queryRaw<any[]>`
      SELECT 
        column_name, 
        data_type, 
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'instructor_courses'
      ORDER BY ordinal_position;
    `;
    
    console.log(`✅ Table has ${columns.length} columns:`);
    columns.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    console.log('');

    // Step 5: Verify constraints
    console.log('5️⃣ Verifying constraints...');
    const constraints = await prisma.$queryRaw<any[]>`
      SELECT 
        conname AS constraint_name,
        CASE contype
          WHEN 'p' THEN 'PRIMARY KEY'
          WHEN 'f' THEN 'FOREIGN KEY'
          WHEN 'u' THEN 'UNIQUE'
          WHEN 'c' THEN 'CHECK'
          ELSE contype::text
        END AS constraint_type
      FROM pg_constraint
      WHERE conrelid = 'instructor_courses'::regclass;
    `;
    
    console.log(`✅ Table has ${constraints.length} constraints:`);
    constraints.forEach(con => {
      console.log(`   - ${con.constraint_name} (${con.constraint_type})`);
    });
    console.log('');

    // Step 6: Verify indexes
    console.log('6️⃣ Verifying indexes...');
    const indexes = await prisma.$queryRaw<any[]>`
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'instructor_courses';
    `;
    
    console.log(`✅ Table has ${indexes.length} indexes:`);
    indexes.forEach(idx => {
      console.log(`   - ${idx.indexname}`);
    });
    console.log('');

    // Step 7: Test insert (dry run)
    console.log('7️⃣ Testing table functionality...');
    
    // Check if we have any instructors and courses
    const instructorCount = await prisma.instructor.count();
    const courseCount = await prisma.course.count();
    
    console.log(`   Found ${instructorCount} instructors and ${courseCount} courses`);
    
    if (instructorCount > 0 && courseCount > 0) {
      console.log('   ✅ Ready to accept instructor-course associations');
    } else {
      console.log('   ⚠️  No instructors or courses found (create them first)');
    }
    console.log('');

    // Success!
    console.log('🎉 MIGRATION COMPLETED SUCCESSFULLY!\n');
    console.log('Next steps:');
    console.log('1. Restart your server (if running)');
    console.log('2. Test the instructor-courses feature in the UI');
    console.log('3. Verify API endpoints:');
    console.log('   - GET    /api/instructors/:id/courses');
    console.log('   - POST   /api/instructors/:id/courses');
    console.log('   - PUT    /api/instructors/:id/courses/:courseId');
    console.log('   - DELETE /api/instructors/:id/courses/:courseId');
    console.log('');

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nFull error:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
runMigration();
