import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupTurmasKids() {
  const orgId = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';
  const courseId = 'krav-maga-faixa-branca-2025'; // Krav Maga - Faixa Branca
  const instructorId = 'cbe69948-5bc7-4877-afa8-b895e7752cbe'; // Thiago Carneiro
  
  console.log('🗑️ Removendo TODAS as turmas existentes...');
  
  // Primeiro, remover relacionamentos dependentes
  await prisma.turmaStudent.deleteMany({ where: { turma: { organizationId: orgId } } });
  await prisma.turmaLesson.deleteMany({ where: { turma: { organizationId: orgId } } });
  await prisma.turmaCourse.deleteMany({ where: { turma: { organizationId: orgId } } });
  await prisma.turmaAttendance.deleteMany({ where: { turma: { organizationId: orgId } } });
  await prisma.turmaInterest.deleteMany({ where: { turma: { organizationId: orgId } } });
  
  // Agora deletar todas as turmas
  const deleted = await prisma.turma.deleteMany({ where: { organizationId: orgId } });
  console.log(`✅ ${deleted.count} turmas removidas`);
  
  console.log('\n📚 Criando turmas Kids Smart Defence...\n');
  
  // Turmas a criar baseadas na tabela do usuário
  const turmasKids = [
    // Seg & Qua - Defesa Pessoal (Krav Maga)
    {
      name: 'Defesa Pessoal Kids 1 - Seg/Qua 16:30',
      description: 'Krav Maga para crianças de 4 a 6 anos (Kids 1)',
      schedule: { days: ['monday', 'wednesday'], time: '16:30', duration: 30 },
      room: 'Tatame 1',
      classType: 'COLLECTIVE',
      maxStudents: 15,
    },
    {
      name: 'Defesa Pessoal Kids 2-3 - Seg/Qua 18:15',
      description: 'Krav Maga para crianças de 7 a 13 anos (Kids 2-3)',
      schedule: { days: ['monday', 'wednesday'], time: '18:15', duration: 45 },
      room: 'Tatame 1',
      classType: 'COLLECTIVE',
      maxStudents: 20,
    },
    // Sábado - Defesa Pessoal (Krav Maga)
    {
      name: 'Defesa Pessoal Kids 1 - Sáb 09:15',
      description: 'Krav Maga para crianças de 4 a 6 anos (Kids 1)',
      schedule: { days: ['saturday'], time: '09:15', duration: 30 },
      room: 'Tatame 1',
      classType: 'COLLECTIVE',
      maxStudents: 15,
    },
    {
      name: 'Defesa Pessoal Kids 2-3 - Sáb 09:45',
      description: 'Krav Maga para crianças de 7 a 13 anos (Kids 2-3)',
      schedule: { days: ['saturday'], time: '09:45', duration: 45 },
      room: 'Tatame 1',
      classType: 'COLLECTIVE',
      maxStudents: 20,
    },
  ];
  
  for (const turma of turmasKids) {
    const created = await prisma.turma.create({
      data: {
        organizationId: orgId,
        courseId: courseId,
        instructorId: instructorId,
        name: turma.name,
        description: turma.description,
        schedule: turma.schedule,
        room: turma.room,
        classType: turma.classType,
        maxStudents: turma.maxStudents,
        status: 'ACTIVE',
        isActive: true,
        startDate: new Date(),
      }
    });
    console.log(`✅ Criada: ${created.name}`);
  }
  
  console.log('\n📋 Turmas finais:');
  const turmas = await prisma.turma.findMany({
    where: { organizationId: orgId },
    orderBy: { name: 'asc' }
  });
  
  turmas.forEach((t, i) => {
    const sched = t.schedule as any;
    console.log(`${i+1}. ${t.name} | ${sched?.days?.join(',')} ${sched?.time} | ${t.room}`);
  });
  
  console.log(`\n✅ Total: ${turmas.length} turmas Kids configuradas!`);
  
  await prisma.$disconnect();
}

setupTurmasKids().catch(console.error);
