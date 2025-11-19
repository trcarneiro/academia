const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const orgId = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';

async function main() {
  try {
    console.log('🔍 Buscando instrutor...');
    
    // Buscar instrutor (Thiago Carneiro)
    const instructor = await prisma.instructor.findFirst({
      where: {
        organizationId: orgId,
        user: {
          email: 'trcampos@gmail.com'
        }
      },
      include: { user: true }
    });

    if (!instructor) {
      console.error('❌ Instrutor não encontrado');
      process.exit(1);
    }

    console.log(`✅ Instrutor encontrado: ${instructor.user.firstName} ${instructor.user.lastName}`);
    console.log(`   User ID: ${instructor.user.id}`);
    console.log(`   Instructor ID: ${instructor.id}`);

    // Buscar curso de Krav Maga (Defesa Pessoal)
    const course = await prisma.course.findFirst({
      where: {
        id: 'krav-maga-faixa-branca-2025'
      }
    });

    if (!course) {
      console.error('❌ Curso não encontrado');
      process.exit(1);
    }

    console.log(`✅ Curso encontrado: ${course.name}`);

    // Turmas de Defesa Pessoal Adulto baseadas nos horários fornecidos
    const turmas = [
      // Segunda e Quarta
      {
        name: 'Defesa Pessoal Adulto - Seg/Qua 19:00',
        schedule: {
          days: ['Segunda', 'Quarta'],
          dayNumbers: [1, 3],
          startTime: '19:00',
          endTime: '20:00'
        },
        location: 'Tatame 2',
        level: 'INTERMEDIARY',
        maxStudents: 20
      },
      {
        name: 'Defesa Pessoal Adulto - Seg/Qua 20:00',
        schedule: {
          days: ['Segunda', 'Quarta'],
          dayNumbers: [1, 3],
          startTime: '20:00',
          endTime: '21:00'
        },
        location: 'Tatame 2',
        level: 'INTERMEDIARY',
        maxStudents: 20
      },
      
      // Terça e Quinta
      {
        name: 'Defesa Pessoal Adulto - Ter/Qui 07:00',
        schedule: {
          days: ['Terça', 'Quinta'],
          dayNumbers: [2, 4],
          startTime: '07:00',
          endTime: '08:00'
        },
        location: 'Tatame 2',
        level: 'INTERMEDIARY',
        maxStudents: 15
      },
      {
        name: 'Defesa Pessoal Adulto - Ter/Qui 12:00',
        schedule: {
          days: ['Terça', 'Quinta'],
          dayNumbers: [2, 4],
          startTime: '12:00',
          endTime: '13:00'
        },
        location: 'Tatame 2',
        level: 'INTERMEDIARY',
        maxStudents: 15
      },
      {
        name: 'Defesa Pessoal Adulto - Ter/Qui 18:00',
        schedule: {
          days: ['Terça', 'Quinta'],
          dayNumbers: [2, 4],
          startTime: '18:00',
          endTime: '19:00'
        },
        location: 'Tatame 2',
        level: 'INTERMEDIARY',
        maxStudents: 20
      },
      
      // Sábado
      {
        name: 'Defesa Pessoal Adulto - Sáb 10:30',
        schedule: {
          days: ['Sábado'],
          dayNumbers: [6],
          startTime: '10:30',
          endTime: '11:30'
        },
        location: 'Tatame 2',
        level: 'INTERMEDIARY',
        maxStudents: 20
      }
    ];

    console.log('\n📚 Criando turmas de Defesa Pessoal Adulto...\n');

    const startDate = new Date(); // Data de início das turmas (hoje)

    const created = [];
    for (const turmaData of turmas) {
      try {
        const turma = await prisma.turma.create({
          data: {
            organizationId: orgId,
            courseId: course.id,
            instructorId: instructor.user.id, // User ID, não Instructor ID
            name: turmaData.name,
            description: `Aulas de Defesa Pessoal (Krav Maga) para adultos - ${turmaData.location}`,
            schedule: turmaData.schedule,
            startDate: startDate,
            room: turmaData.location,
            maxStudents: turmaData.maxStudents,
            isActive: true,
            status: 'ACTIVE'
          }
        });

        console.log(`✅ Criada: ${turma.name}`);
        created.push(turma);
      } catch (error) {
        console.error(`❌ Erro ao criar ${turmaData.name}:`, error.message);
      }
    }

    console.log(`\n🎉 Total criado: ${created.length} turmas`);
    console.log('\n📋 Resumo das turmas criadas:');
    created.forEach(t => {
      console.log(`  - ${t.name}`);
      console.log(`    Horário: ${t.schedule.days.join(' e ')} ${t.schedule.startTime}-${t.schedule.endTime}`);
      console.log(`    Local: ${t.room || 'N/A'}`);
      console.log(`    Vagas: ${t.maxStudents}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
