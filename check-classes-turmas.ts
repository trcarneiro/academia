import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkClassesAndTurmas() {
  try {
    console.log('=== TURMAS ===');
    const turmas = await prisma.turma.findMany();
    
    console.log(`Total de turmas: ${turmas.length}`);
    turmas.forEach((turma, index) => {
      console.log(`${index + 1}. ${turma.name}`);
      console.log(`   Status: ${turma.status}`);
      console.log(`   Schedule: ${JSON.stringify(turma.schedule, null, 2)}`);
      console.log('---');
    });
    
    console.log('=== CLASSES ===');
    const classes = await prisma.class.findMany({
      orderBy: {
        date: 'asc'
      }
    });
    
    console.log(`Total de classes: ${classes.length}`);
    if (classes.length === 0) {
      console.log('❌ Nenhuma classe encontrada! As turmas precisam gerar classes individuais.');
      console.log('💡 Solução: Implementar geração automática de classes a partir das turmas.');
    } else {
      classes.forEach((classe, index) => {
        console.log(`${index + 1}. ${classe.title || 'Sem título'}`);
        console.log(`   Data: ${classe.date}`);
        console.log(`   Horário: ${classe.startTime} - ${classe.endTime}`);
        console.log(`   Status: ${classe.status}`);
        console.log('---');
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkClassesAndTurmas();
