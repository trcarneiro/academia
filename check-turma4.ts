import { prisma } from './src/utils/database.js';

async function checkTurma4() {
  console.log('🔍 Investigando Turma 4...\n');

  // 1. Buscar todas as turmas
  const allTurmas = await prisma.turma.findMany({
    select: {
      id: true,
      name: true,
      status: true,
      isActive: true,
      courseId: true,
      startDate: true,
      endDate: true,
      _count: {
        select: {
          lessons: true
        }
      }
    },
    orderBy: { name: 'asc' }
  });

  console.log('📊 TODAS AS TURMAS:');
  allTurmas.forEach((turma, idx) => {
    console.log(`${idx + 1}. ${turma.name}`);
    console.log(`   ID: ${turma.id}`);
    console.log(`   Status: ${turma.status}`);
    console.log(`   IsActive: ${turma.isActive}`);
    console.log(`   CourseId: ${turma.courseId}`);
    console.log(`   Aulas: ${turma._count.lessons}`);
    console.log('');
  });

  // 2. Buscar aulas de hoje
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  console.log(`\n📅 AULAS DE HOJE (${today.toLocaleDateString()}):`);
  
  const todayLessons = await prisma.turmaLesson.findMany({
    where: {
      scheduledDate: {
        gte: today,
        lte: endOfDay
      }
    },
    include: {
      turma: {
        select: {
          name: true,
          status: true,
          isActive: true
        }
      }
    },
    orderBy: { scheduledDate: 'asc' }
  });

  console.log(`Total: ${todayLessons.length} aulas\n`);

  todayLessons.forEach((lesson, idx) => {
    const time = lesson.scheduledDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    console.log(`${idx + 1}. ${lesson.title}`);
    console.log(`   ID: ${lesson.id}`);
    console.log(`   Turma: ${lesson.turma.name}`);
    console.log(`   Horário: ${time}`);
    console.log(`   Status Aula: ${lesson.status}`);
    console.log(`   Status Turma: ${lesson.turma.status}`);
    console.log(`   Turma Ativa: ${lesson.turma.isActive}`);
    console.log(`   IsActive Aula: ${lesson.isActive}`);
    console.log('');
  });

  // 3. Verificar filtros do getAvailableClasses
  console.log('\n🔍 SIMULANDO FILTRO getAvailableClasses:');
  console.log('Filtros aplicados:');
  console.log('- scheduledDate: hoje');
  console.log('- isActive: true');
  console.log('- status: SCHEDULED');
  console.log('');

  const filteredLessons = await prisma.turmaLesson.findMany({
    where: {
      scheduledDate: {
        gte: today,
        lte: endOfDay
      },
      isActive: true,
      status: 'SCHEDULED'
    },
    include: {
      turma: {
        select: {
          name: true,
          status: true
        }
      }
    },
    orderBy: { scheduledDate: 'asc' }
  });

  console.log(`✅ Aulas que PASSARAM no filtro: ${filteredLessons.length}`);
  filteredLessons.forEach((lesson, idx) => {
    console.log(`${idx + 1}. ${lesson.turma.name} - ${lesson.title}`);
  });

  console.log(`\n❌ Aulas que FALHARAM no filtro: ${todayLessons.length - filteredLessons.length}`);
  const failedIds = new Set(filteredLessons.map(l => l.id));
  todayLessons
    .filter(l => !failedIds.has(l.id))
    .forEach((lesson, idx) => {
      console.log(`${idx + 1}. ${lesson.turma.name} - ${lesson.title}`);
      console.log(`   Motivo: isActive=${lesson.isActive}, status=${lesson.status}`);
    });

  await prisma.$disconnect();
}

checkTurma4().catch(console.error);
