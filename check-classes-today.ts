// Script para verificar aulas cadastradas para hoje (Class E TurmaLesson)
import { PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';

const prisma = new PrismaClient();

async function checkClassesToday() {
  // ===== VERIFICAR TURMA LESSON PRIMEIRO =====
  const today = dayjs();
  const startOfDay = today.startOf('day').toDate();
  const endOfDay = today.endOf('day').toDate();

  console.log('\n🔍 VERIFICANDO TURMALESSON (aulas de Turmas)...');
  const turmaLessons = await prisma.turmaLesson.findMany({
    where: {
      scheduledDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
      isActive: true,
    },
    include: {
      turma: {
        select: {
          id: true,
          name: true,
          courseId: true,
        },
      },
    },
    orderBy: {
      scheduledDate: 'asc',
    },
  });

  console.log('📊 Total de TurmaLesson encontradas:', turmaLessons.length);
  if (turmaLessons.length > 0) {
    console.log('\n✅ TurmaLesson para hoje:\n');
    turmaLessons.forEach((l, i) => {
      console.log(`${i + 1}. ${l.title}`);
      console.log(`   ID: ${l.id}`);
      console.log(`   Turma: ${l.turma.name} (${l.turma.id})`);
      console.log(`   CourseId: ${l.turma.courseId}`);
      console.log(`   ScheduledDate: ${l.scheduledDate.toISOString()}`);
      console.log(`   Status: ${l.status}\n`);
    });
  }

  // ===== VERIFICAR CLASS DEPOIS =====
  console.log('\n🔍 VERIFICANDO CLASS (aulas avulsas)...');
  console.log('📅 Hoje:', today.format('DD/MM/YYYY HH:mm:ss'));
  console.log('🕐 Start of day:', startOfDay.toISOString());
  console.log('🕐 End of day:', endOfDay.toISOString());

  // Buscar aulas para hoje
  const classes = await prisma.class.findMany({
    where: {
      OR: [
        { date: { gte: startOfDay, lte: endOfDay } },
        { startTime: { gte: startOfDay, lte: endOfDay } },
        { endTime: { gte: startOfDay, lte: endOfDay } },
      ],
    },
    select: {
      id: true,
      title: true,
      date: true,
      startTime: true,
      endTime: true,
      status: true,
      courseId: true,
      course: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      startTime: 'asc',
    },
  });

  console.log('\n📊 Total de aulas encontradas:', classes.length);

  if (classes.length === 0) {
    console.log('❌ NENHUMA aula cadastrada para hoje!');
    console.log('\n🔍 Buscando próximas aulas (próximos 7 dias)...\n');

    const nextWeek = today.add(7, 'days').endOf('day').toDate();
    const upcomingClasses = await prisma.class.findMany({
      where: {
        OR: [
          { date: { gte: startOfDay, lte: nextWeek } },
          { startTime: { gte: startOfDay, lte: nextWeek } },
        ],
      },
      select: {
        id: true,
        title: true,
        date: true,
        startTime: true,
        status: true,
        courseId: true,
      },
      orderBy: {
        startTime: 'asc',
      },
      take: 10,
    });

    console.log('📅 Próximas aulas (próximos 7 dias):', upcomingClasses.length);
    upcomingClasses.forEach((c, i) => {
      console.log(`\n${i + 1}. ${c.title}`);
      console.log(`   ID: ${c.id}`);
      console.log(`   Date: ${c.date?.toISOString()}`);
      console.log(`   StartTime: ${c.startTime?.toISOString()}`);
      console.log(`   Status: ${c.status}`);
      console.log(`   CourseId: ${c.courseId}`);
    });
  } else {
    console.log('\n✅ Aulas encontradas para hoje:\n');
    classes.forEach((c, i) => {
      console.log(`${i + 1}. ${c.title}`);
      console.log(`   ID: ${c.id}`);
      console.log(`   Date: ${c.date?.toISOString()}`);
      console.log(`   StartTime: ${c.startTime?.toISOString()}`);
      console.log(`   EndTime: ${c.endTime?.toISOString()}`);
      console.log(`   Status: ${c.status}`);
      console.log(`   CourseId: ${c.courseId}`);
      console.log(`   Course: ${c.course?.name}\n`);
    });
  }

  await prisma.$disconnect();
}

checkClassesToday().catch(console.error);
