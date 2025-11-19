import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkInstructorsTable() {
  const result = await prisma.$queryRaw<any[]>`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'instructors' 
    AND column_name IN ('id')
  `;
  
  console.log('Instructors table ID column:');
  console.log(JSON.stringify(result, null, 2));
  
  const coursesResult = await prisma.$queryRaw<any[]>`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'courses' 
    AND column_name IN ('id')
  `;
  
  console.log('\nCourses table ID column:');
  console.log(JSON.stringify(coursesResult, null, 2));
  
  await prisma.$disconnect();
}

checkInstructorsTable();
