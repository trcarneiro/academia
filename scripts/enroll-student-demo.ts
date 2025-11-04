/**
 * Quick enrollment helper
 * Usage (PowerShell):
 *   npx tsx scripts/enroll-student-demo.ts <studentId> <courseName> [turmaName]
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const [studentId, courseName, turmaNameArg] = process.argv.slice(2);
  if (!studentId || !courseName) {
    console.error('Usage: npx tsx scripts/enroll-student-demo.ts <studentId> <courseName> [turmaName]');
    process.exit(1);
  }

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw new Error('Student not found');

  const course = await prisma.course.findFirst({ where: { name: courseName } });
  if (!course) throw new Error('Course not found');

  // Ensure enrollment
  const existingEnrollment = await prisma.courseEnrollment.findFirst({
    where: { studentId, courseId: course.id, status: 'ACTIVE' },
  });
  if (!existingEnrollment) {
    await prisma.courseEnrollment.create({
      data: {
        studentId,
        courseId: course.id,
        expectedEndDate: new Date(Date.now() + 90 * 24 * 3600 * 1000),
        status: 'ACTIVE',
        gender: 'N/A',
      },
    });
    console.log('Created ACTIVE course enrollment');
  } else {
    console.log('Enrollment already exists');
  }

  // Ensure a turma and link student
  const turmaName = turmaNameArg || `${course.name} - Turma Demo`;
  let turma = await prisma.turma.findFirst({ where: { name: turmaName } });
  if (!turma) {
    // Find any instructor
    const instructor = await prisma.instructor.findFirst({});
    if (!instructor) throw new Error('No instructor found to create turma');

    turma = await prisma.turma.create({
      data: {
        organizationId: student.organizationId,
        courseId: course.id,
        name: turmaName,
        instructorId: instructor.userId,
        startDate: new Date(),
        status: 'SCHEDULED',
        schedule: { days: ['Mon','Wed'], time: '19:00' },
        isActive: true,
      },
    });
    console.log('Created turma:', turma.name);
  } else {
    console.log('Using existing turma:', turma.name);
  }

  // Ensure link turma<->course (TurmaCourse)
  const turmaCourse = await prisma.turmaCourse.findFirst({ where: { turmaId: turma.id, courseId: course.id } });
  if (!turmaCourse) {
    await prisma.turmaCourse.create({ data: { turmaId: turma.id, courseId: course.id } });
    console.log('Linked turma to course');
  }

  // Enroll student into turma
  const turmaStudent = await prisma.turmaStudent.findFirst({ where: { turmaId: turma.id, studentId } });
  if (!turmaStudent) {
    await prisma.turmaStudent.create({ data: { turmaId: turma.id, studentId, status: 'ACTIVE' } });
    console.log('Student added to turma');
  } else {
    console.log('Student already in turma');
  }

  console.log('Done. Reload the kiosk dashboard.');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
