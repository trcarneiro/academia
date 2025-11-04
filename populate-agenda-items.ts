/**
 * Script para popular a tabela agenda_items com dados reais
 * baseados em turmas e sessões de personal training existentes
 */

import { PrismaClient, AgendaItemType, AgendaItemStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function populateAgendaItems() {
  console.log('🗓️ Populando AgendaItems com dados reais...');

  try {
    // Limpar agenda items existentes
    await prisma.agendaItem.deleteMany();
    console.log('🧹 AgendaItems existentes removidos');

    // Buscar organization
    const organization = await prisma.organization.findFirst();
    if (!organization) {
      throw new Error('Nenhuma organização encontrada');
    }

    // Buscar turmas existentes usando o nome correto no Prisma Client
    const turmas = await prisma.turma.findMany({
      include: {
        instructor: true,
        course: {
          include: {
            martialArt: true
          }
        }
      }
    });

    console.log(`📚 Encontradas ${turmas.length} turmas`);

    // Criar agenda items para turmas
    for (const turma of turmas) {
      // Criar agenda item para a próxima semana
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      nextWeek.setHours(10, 0, 0, 0); // 10h
      
      const startTime = new Date(nextWeek);
      const endTime = new Date(nextWeek);
      endTime.setHours(11, 0, 0, 0); // 1 hora de duração

      // Inserir usando o Prisma Client
      await prisma.agendaItem.create({
        data: {
          organizationId: organization.id,
          type: AgendaItemType.TURMA,
          referenceId: turma.id,
          title: `${turma.name} - ${turma.course.martialArt?.name || 'Aula'}`,
          description: `Aula de ${turma.course.martialArt?.name || 'Krav Maga'}`,
          startTime,
          endTime,
          instructorId: turma.instructorId,
          status: AgendaItemStatus.SCHEDULED,
          maxStudents: turma.maxStudents,
          actualStudents: 0,
          isRecurring: true,
          recurrenceRule: 'WEEKLY',
          color: '#667eea',
          notes: `Turma regular de ${turma.name}`,
          isVirtual: false,
        }
      });
    }

    // Buscar alguns estudantes para criar personal training sessions de exemplo
    const students = await prisma.student.findMany({
      take: 3,
      include: {
        user: true
      }
    });

    console.log(`🏃 Encontrados ${students.length} estudantes para personal training`);

    // Buscar instrutores disponíveis
    const instructors = await prisma.user.findMany({
      where: {
        role: 'INSTRUCTOR'
      },
      take: 2
    });

    // Criar agenda items para personal training sessions
    for (let i = 0; i < students.length && i < instructors.length; i++) {
      const student = students[i];
      const instructor = instructors[i % instructors.length];
      
      // Criar agenda item para os próximos dias
      const nextSession = new Date();
      nextSession.setDate(nextSession.getDate() + Math.floor(Math.random() * 7) + 1); // Entre 1-7 dias
      nextSession.setHours(14 + Math.floor(Math.random() * 4), 0, 0, 0); // Entre 14h e 18h
      
      const startTime = new Date(nextSession);
      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + 1); // 1 hora de duração

      // Usar um ID único como referenceId para personal sessions
      const personalSessionRef = `personal-${student.id}-${Date.now()}-${i}`;

      // Inserir usando o Prisma Client
      await prisma.agendaItem.create({
        data: {
          organizationId: organization.id,
          type: AgendaItemType.PERSONAL_SESSION,
          referenceId: personalSessionRef,
          title: `Personal Training - ${student.user.firstName} ${student.user.lastName}`,
          description: `Sessão individual com ${student.user.firstName} ${student.user.lastName}`,
          startTime,
          endTime,
          instructorId: instructor.id,
          status: AgendaItemStatus.SCHEDULED,
          maxStudents: null,
          actualStudents: 1,
          isRecurring: false,
          recurrenceRule: null,
          color: '#764ba2',
          notes: 'Personal training session',
          isVirtual: false,
        }
      });
    }

    // Verificar total criado
    const totalAgendaItems = await prisma.agendaItem.count();
    console.log(`✅ ${totalAgendaItems} AgendaItems criados com sucesso!`);

    // Mostrar exemplos usando Prisma
    const samples = await prisma.agendaItem.findMany({
      take: 3,
      include: {
        instructor: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    console.log('\n📋 Exemplos criados:');
    samples.forEach((item, index) => {
      console.log(`${index + 1}. ${item.title} - ${item.startTime.toLocaleString('pt-BR')} (${item.instructor.firstName} ${item.instructor.lastName})`);
    });

  } catch (error) {
    console.error('❌ Erro ao popular AgendaItems:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  populateAgendaItems()
    .then(() => {
      console.log('🎉 Script concluído com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script falhou:', error);
      process.exit(1);
    });
}

export { populateAgendaItems };