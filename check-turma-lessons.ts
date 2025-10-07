import { prisma } from './src/utils/database';

async function checkTurmaLessons() {
  console.log('🔍 Checking turmas and their lessons...\n');

  // Check active turmas
  const turmas = await prisma.turma.findMany({
    where: { isActive: true },
    include: {
      course: { select: { name: true } },
      courses: { include: { course: { select: { name: true } } } },
      instructor: { select: { firstName: true, lastName: true } },
      lessons: {
        where: { scheduledDate: { gte: new Date() } },
        orderBy: { scheduledDate: 'asc' },
        take: 5,
      },
    },
  });

  console.log(`Found ${turmas.length} active turmas:\n`);

  for (const turma of turmas) {
    console.log(`📚 Turma: ${turma.name}`);
    console.log(`   Status: ${turma.status}`);
    console.log(`   Schedule: ${JSON.stringify(turma.schedule)}`);
    console.log(`   Course: ${turma.course?.name || 'None'}`);
    console.log(`   Additional Courses: ${turma.courses.map(c => c.course?.name).join(', ') || 'None'}`);
    console.log(`   Instructor: ${turma.instructor?.firstName || 'None'} ${turma.instructor?.lastName || ''}`);
    console.log(`   Upcoming Lessons: ${turma.lessons.length}`);
    
    if (turma.lessons.length > 0) {
      turma.lessons.forEach((lesson, i) => {
        console.log(`      ${i + 1}. ${lesson.scheduledDate.toISOString()} - ${lesson.title || 'Untitled'} (${lesson.status})`);
      });
    }
    console.log('');
  }

  // Check if Ana has any turma enrollments
  console.log('🔍 Checking Ana Santos turma enrollments...\n');
  const anaId = '5d30438f-1326-4fa6-9aad-d90c896384e4';
  
  const anaEnrollments = await prisma.turmaStudent.findMany({
    where: { studentId: anaId },
    include: {
      turma: {
        select: { id: true, name: true, status: true, isActive: true },
      },
    },
  });

  console.log(`Ana has ${anaEnrollments.length} turma enrollments:`);
  anaEnrollments.forEach(enrollment => {
    console.log(`   - ${enrollment.turma.name} (${enrollment.turma.status}, active: ${enrollment.turma.isActive}, enrollment active: ${enrollment.isActive})`);
  });

  // Check Ana's course enrollments
  console.log('\n🔍 Checking Ana Santos course enrollments...\n');
  const anaCourseEnrollments = await prisma.courseEnrollment.findMany({
    where: { studentId: anaId },
    include: {
      course: { select: { name: true } },
    },
  });

  console.log(`Ana has ${anaCourseEnrollments.length} course enrollments:`);
  anaCourseEnrollments.forEach(enrollment => {
    console.log(`   - ${enrollment.course?.name} (status: ${enrollment.status})`);
  });

  await prisma.$disconnect();
}

checkTurmaLessons().catch(console.error);
