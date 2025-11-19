const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testTurmas() {
  try {
    console.log('\n🔍 Buscando turmas ativas...');
    
    const turmas = await prisma.turma.findMany({
      where: {
        organizationId: 'ff5ee00e-d8a3-4291-9428-d28b852fb472',
        isActive: true
      },
      include: {
        course: true,
        instructor: {
          include: {
            user: true
          }
        },
        unit: true
      }
    });
    
    console.log(`\n✅ TURMAS ENCONTRADAS: ${turmas.length}`);
    
    if (turmas.length > 0) {
      turmas.forEach(t => {
        console.log(`\n📍 Turma: ${t.name || t.course?.name || 'Sem nome'}`);
        console.log(`   Dia: ${t.dayOfWeek} (0=Dom, 1=Seg, ...)`);
        console.log(`   Horário: ${t.startTime} - ${t.endTime}`);
        console.log(`   Instrutor: ${t.instructor?.user?.firstName} ${t.instructor?.user?.lastName}`);
        console.log(`   Unidade: ${t.unit?.name || 'N/A'}`);
      });
    } else {
      console.log('\n❌ Nenhuma turma ativa encontrada para esta organização');
    }
    
  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testTurmas();
