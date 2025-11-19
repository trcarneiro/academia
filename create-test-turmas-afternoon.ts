/**
 * Script para criar turmas de teste para check-in à tarde
 * Horários: 14h-18h (horário atual: tarde de 18/11/2025)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const organizationId = 'ff5ee00e-d8a3-4291-9428-d28b852fb472'; // Smart Defence
  
  console.log('🔍 Buscando dados necessários...\n');

  // Buscar instrutores
  const instructors = await prisma.instructor.findMany({
    where: { organizationId },
    include: { user: true },
  });

  if (instructors.length === 0) {
    console.error('❌ Nenhum instrutor encontrado!');
    return;
  }

  console.log(`✅ ${instructors.length} instrutores encontrados`);

  // Buscar curso (Krav Maga)
  const course = await prisma.course.findFirst({
    where: { organizationId },
  });

  if (!course) {
    console.error('❌ Nenhum curso encontrado!');
    return;
  }

  console.log(`✅ Curso: ${course.name}\n`);

  // Buscar unidade
  const unit = await prisma.unit.findFirst({
    where: { organizationId },
  });

  if (!unit) {
    console.error('❌ Nenhuma unidade encontrada!');
    return;
  }

  console.log(`✅ Unidade: ${unit.name}\n`);

  // Data de hoje
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado

  console.log(`📅 Criando turmas para hoje (${today.toLocaleDateString('pt-BR')})`);
  console.log(`📍 Dia da semana: ${dayOfWeek}\n`);

  // Turmas para criar (horários da tarde)
  const turmasToCreate = [
    {
      name: '🥋 Defesa Pessoal - Tarde 14h',
      time: '14:00',
      duration: '60min',
      maxStudents: 20,
    },
    {
      name: '💪 Combate Avançado - Tarde 15h',
      time: '15:00',
      duration: '60min',
      maxStudents: 15,
    },
    {
      name: '🎯 Técnicas Especiais - Tarde 16h',
      time: '16:00',
      duration: '60min',
      maxStudents: 18,
    },
    {
      name: '⚡ Krav Maga Intensivo - Tarde 17h',
      time: '17:00',
      duration: '90min',
      maxStudents: 25,
    },
    {
      name: '🔥 Treino Livre - Tarde 18h',
      time: '18:00',
      duration: '60min',
      maxStudents: 30,
    },
  ];

  console.log('🚀 Criando turmas...\n');

  let created = 0;
  for (const turmaData of turmasToCreate) {
    try {
      const instructor = instructors[Math.floor(Math.random() * instructors.length)];

      const turma = await prisma.turma.create({
        data: {
          name: turmaData.name,
          organizationId: organizationId,
          courseId: course.id,
          instructorId: instructor.userId, // userId, não instructor.id
          unitId: unit.id,
          maxStudents: turmaData.maxStudents,
          startDate: today,
          endDate: null,
          schedule: {
            time: turmaData.time,
            duration: turmaData.duration,
            daysOfWeek: [dayOfWeek],
          },
          classType: 'COLLECTIVE',
          status: 'SCHEDULED',
          isActive: true,
          room: `Sala ${Math.floor(Math.random() * 5) + 1}`,
          requireAttendanceForProgress: false,
        },
      });

      console.log(`✅ ${turmaData.name}`);
      console.log(`   📍 ${turmaData.time} (${turmaData.duration})`);
      console.log(`   👨‍🏫 ${instructor.user.firstName} ${instructor.user.lastName}`);
      console.log(`   👥 ${turmaData.maxStudents} vagas`);
      console.log(`   🏢 ${turma.room}\n`);

      created++;
    } catch (error: any) {
      console.error(`❌ Erro ao criar ${turmaData.name}:`, error.message);
    }
  }

  console.log(`\n🎉 ${created} turmas criadas com sucesso!`);
  console.log(`\n💡 IMPORTANTE:`);
  console.log(`   As turmas ficam disponíveis para check-in 30 minutos antes do horário.`);
  console.log(`   Horário atual do sistema: ${new Date().toLocaleTimeString('pt-BR')}`);
  console.log(`\n🧪 TESTE:`);
  console.log(`   1. Acesse o check-in kiosk`);
  console.log(`   2. Busque por "PEDRO"`);
  console.log(`   3. Selecione Pedro Teste`);
  console.log(`   4. Veja as turmas disponíveis com botão verde "FAZER CHECK-IN"`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
