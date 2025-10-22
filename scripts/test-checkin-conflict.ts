/**
 * Script de Teste: Check-in com Conflito de Horários
 * 
 * Cria várias turmas e aulas para hoje em sequência e testa check-in
 * para validar detecção de conflito de horários.
 */

import { PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando teste de check-in com conflito de horários...\n');

  // 1. Buscar organização e aluno de teste
  const organization = await prisma.organization.findFirst({
    where: { isActive: true },
  });

  if (!organization) {
    throw new Error('❌ Nenhuma organização encontrada');
  }

  console.log(`✅ Organização: ${organization.name} (${organization.id})\n`);

  // 2. Buscar ou criar aluno de teste
  let student = await prisma.student.findFirst({
    where: { 
      organizationId: organization.id,
      isActive: true 
    },
    include: { user: true },
  });

  if (!student) {
    console.log('⚠️ Criando aluno de teste...');
    const user = await prisma.user.create({
      data: {
        firstName: 'Teste',
        lastName: 'Check-in',
        email: `teste-checkin-${Date.now()}@example.com`,
        role: 'STUDENT',
        organizationId: organization.id,
      },
    });

    student = await prisma.student.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        registrationNumber: `TEST-${Date.now()}`,
        isActive: true,
      },
      include: { user: true },
    });
  }

  console.log(`✅ Aluno: ${student.user.firstName} ${student.user.lastName} (${student.id})\n`);

  // 3. Buscar ou criar curso
  let course = await prisma.course.findFirst({
    where: { 
      organizationId: organization.id,
      isActive: true 
    },
  });

  if (!course) {
    console.log('⚠️ Criando curso de teste...');
    course = await prisma.course.create({
      data: {
        name: 'Krav Maga - Teste Check-in',
        description: 'Curso para testar check-in com conflitos',
        level: 'BEGINNER',
        organizationId: organization.id,
        isActive: true,
      },
    });
  }

  console.log(`✅ Curso: ${course.name} (${course.id})\n`);

  // 4. Buscar ou criar instrutor
  let instructor = await prisma.instructor.findFirst({
    where: { 
      organizationId: organization.id,
      isActive: true 
    },
  });

  if (!instructor) {
    console.log('⚠️ Criando instrutor de teste...');
    const instructorUser = await prisma.user.create({
      data: {
        firstName: 'Instrutor',
        lastName: 'Teste',
        email: `instrutor-teste-${Date.now()}@example.com`,
        role: 'INSTRUCTOR',
        organizationId: organization.id,
      },
    });

    instructor = await prisma.instructor.create({
      data: {
        userId: instructorUser.id,
        organizationId: organization.id,
        isActive: true,
      },
    });
  }

  console.log(`✅ Instrutor: ${instructor.id}\n`);

  // 5. Criar 5 turmas com aulas em sequência HOJE
  const today = dayjs();
  const turmas = [];
  const lessons = [];

  console.log('📅 Criando turmas e aulas para HOJE...\n');

  const schedules = [
    { name: 'Turma Manhã 1', hour: 8, duration: 60 },   // 08:00 - 09:00
    { name: 'Turma Manhã 2', hour: 9, duration: 60 },   // 09:00 - 10:00 (OVERLAP com anterior!)
    { name: 'Turma Manhã 3', hour: 10, duration: 60 },  // 10:00 - 11:00
    { name: 'Turma Tarde 1', hour: 14, duration: 90 },  // 14:00 - 15:30
    { name: 'Turma Tarde 2', hour: 15, duration: 60 },  // 15:00 - 16:00 (OVERLAP com anterior!)
  ];

  for (const schedule of schedules) {
    // Criar Turma
    const turma = await prisma.turma.create({
      data: {
        name: schedule.name,
        courseId: course.id,
        instructorId: instructor.id,
        organizationId: organization.id,
        startDate: today.toDate(),
        endDate: today.add(3, 'month').toDate(),
        status: 'ACTIVE',
        isActive: true,
      },
    });

    turmas.push(turma);

    // Criar TurmaLesson para HOJE
    const scheduledDate = today.hour(schedule.hour).minute(0).second(0).toDate();
    const lesson = await prisma.turmaLesson.create({
      data: {
        turmaId: turma.id,
        lessonNumber: 1,
        title: `Aula de ${schedule.name}`,
        scheduledDate: scheduledDate,
        duration: schedule.duration,
        status: 'SCHEDULED',
        isActive: true,
      },
    });

    lessons.push(lesson);

    const endTime = dayjs(scheduledDate).add(schedule.duration, 'minute');
    console.log(`  ✅ ${schedule.name}`);
    console.log(`     Horário: ${dayjs(scheduledDate).format('HH:mm')} - ${endTime.format('HH:mm')} (${schedule.duration} min)`);
    console.log(`     Lesson ID: ${lesson.id}\n`);
  }

  // 6. Criar TurmaStudent para o aluno poder fazer check-in
  console.log('👥 Matriculando aluno em todas as turmas...\n');
  
  for (const turma of turmas) {
    await prisma.turmaStudent.create({
      data: {
        turmaId: turma.id,
        studentId: student.id,
        enrolledAt: new Date(),
        isActive: true,
      },
    });
    console.log(`  ✅ Matriculado em: ${turma.name}`);
  }

  // 7. Resumo
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DO TESTE');
  console.log('='.repeat(60));
  console.log(`Aluno: ${student.user.firstName} ${student.user.lastName}`);
  console.log(`Student ID: ${student.id}`);
  console.log(`\nAulas criadas para HOJE (${today.format('DD/MM/YYYY')}):\n`);

  lessons.forEach((lesson, index) => {
    const schedule = schedules[index];
    const startTime = dayjs(lesson.scheduledDate);
    const endTime = startTime.add(schedule.duration, 'minute');
    console.log(`${index + 1}. ${schedule.name}`);
    console.log(`   ID: ${lesson.id}`);
    console.log(`   Horário: ${startTime.format('HH:mm')} - ${endTime.format('HH:mm')}`);
    console.log(`   Status: SCHEDULED`);
    console.log('');
  });

  console.log('='.repeat(60));
  console.log('\n🧪 TESTE DE CHECK-IN:\n');
  console.log('Para testar via Kiosk:');
  console.log(`1. Acesse: http://localhost:3000/views/checkin-kiosk.html`);
  console.log(`2. Use Student ID: ${student.id}`);
  console.log(`3. Tente fazer check-in na Turma Manhã 1 (08:00-09:00)`);
  console.log(`4. Depois tente na Turma Manhã 2 (09:00-10:00) ✅ Deve funcionar`);
  console.log(`5. Depois tente na Turma Tarde 2 (15:00-16:00) durante Tarde 1 (14:00-15:30)`);
  console.log(`   ❌ Deve mostrar erro: "Conflito de horário"`);
  
  console.log('\n📡 Teste via API (curl):');
  console.log('\n# Check-in Turma Manhã 1 (08:00-09:00)');
  console.log(`curl -X POST http://localhost:3000/api/attendance/checkin \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{"studentId":"${student.id}","classId":"${lessons[0].id}","method":"MANUAL"}'`);
  
  console.log('\n# Check-in Turma Manhã 2 (09:00-10:00) - SEM CONFLITO');
  console.log(`curl -X POST http://localhost:3000/api/attendance/checkin \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{"studentId":"${student.id}","classId":"${lessons[1].id}","method":"MANUAL"}'`);

  console.log('\n# Check-in Turma Tarde 2 (15:00-16:00) - COM CONFLITO (overlap com Tarde 1)');
  console.log(`curl -X POST http://localhost:3000/api/attendance/checkin \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{"studentId":"${student.id}","classId":"${lessons[4].id}","method":"MANUAL"}'`);

  console.log('\n✅ Setup completo! Pronto para testes.\n');
}

main()
  .catch((error) => {
    console.error('❌ Erro:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
