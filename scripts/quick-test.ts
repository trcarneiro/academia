import { PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';

const prisma = new PrismaClient();

async function main() {
  console.log(' Teste de Check-in...\n');

  const turma = await prisma.turma.findFirst({ where: { isActive: true }, include: { course: true } });
  const student = await prisma.student.findFirst({ where: { isActive: true }, include: { user: true } });

  if (!turma || !student) {
    console.error(' Turma ou aluno não encontrado');
    process.exit(1);
  }

  console.log( Turma: );
  console.log( Aluno: \n);

  const existing = await prisma.turmaStudent.findFirst({ where: { turmaId: turma.id, studentId: student.id } });
  if (!existing) {
    await prisma.turmaStudent.create({ data: { turmaId: turma.id, studentId: student.id, enrolledAt: new Date(), isActive: true } });
  }

  const lastLesson = await prisma.turmaLesson.findFirst({ where: { turmaId: turma.id }, orderBy: { lessonNumber: 'desc' } });
  const startNum = (lastLesson?.lessonNumber || 0) + 1;

  const today = dayjs();
  const schedules = [
    { hour: 8, duration: 60, title: 'Manhã 1' },
    { hour: 9, duration: 60, title: 'Manhã 2' },
    { hour: 10, duration: 60, title: 'Manhã 3' },
    { hour: 14, duration: 90, title: 'Tarde 1' },
    { hour: 15, duration: 60, title: 'Tarde 2' },
  ];

  console.log(' Criando aulas...\n');

  const lessons = [];
  for (let i = 0; i < schedules.length; i++) {
    const s = schedules[i];
    const date = today.hour(s.hour).minute(0).second(0).millisecond(0).toDate();
    const lesson = await prisma.turmaLesson.create({
      data: { turmaId: turma.id, lessonNumber: startNum + i, title: s.title, scheduledDate: date, duration: s.duration, status: 'SCHEDULED', isActive: true },
    });
    lessons.push(lesson);
    const end = dayjs(date).add(s.duration, 'minute');
    console.log(   : -);
  }

  console.log('\n Check-ins...\n');

  for (let i = 0; i < lessons.length; i++) {
    console.log([/5] );
    try {
      const att = await prisma.turmaAttendance.create({
        data: { turmaId: turma.id, turmaLessonId: lessons[i].id, studentId: student.id, present: true, late: false, notes: 'Teste', checkedAt: new Date() },
      });
      console.log( OK ()\n);
    } catch (error: any) {
      console.log( \n);
    }
  }

  const atts = await prisma.turmaAttendance.findMany({
    where: { studentId: student.id, createdAt: { gte: today.startOf('day').toDate() } },
    include: { lesson: true },
    orderBy: { createdAt: 'asc' },
  });

  console.log(\n Check-ins HOJE: \n);
  atts.forEach((a, i) => {
    const start = dayjs(a.lesson?.scheduledDate);
    const end = start.add(a.lesson?.duration || 60, 'minute');
    console.log(${i+1}. : -);
  });

  console.log('\n Completo!\n');
}

main().catch(console.error).finally(() => prisma.\$disconnect\());
