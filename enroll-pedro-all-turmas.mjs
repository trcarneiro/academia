import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const PEDRO_ID = 'dc9c17ff-582c-45c6-bc46-7eee1cee4564';
const ORG_ID = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';

console.log('🎓 Matriculando Pedro em TODAS as turmas...\n');

try {
  // 1. Get all active turmas
  const turmas = await prisma.turma.findMany({
    where: {
      organizationId: ORG_ID,
      isActive: true
    },
    select: {
      id: true,
      name: true
    }
  });

  console.log(`📚 Turmas encontradas: ${turmas.length}\n`);

  let enrolled = 0;
  let alreadyEnrolled = 0;
  let errors = 0;

  for (const turma of turmas) {
    try {
      await prisma.turmaStudent.create({
        data: {
          turmaId: turma.id,
          studentId: PEDRO_ID,
          enrolledAt: new Date(),
          status: 'ACTIVE'
        }
      });
      
      enrolled++;
      console.log(`✅ ${turma.name}`);
      
    } catch (error) {
      if (error.code === 'P2002') {
        // Already enrolled
        alreadyEnrolled++;
        console.log(`⚠️ ${turma.name} - Já matriculado`);
      } else {
        errors++;
        console.log(`❌ ${turma.name} - Erro: ${error.message}`);
      }
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RESUMO');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Novas matrículas: ${enrolled}`);
  console.log(`⚠️ Já matriculado: ${alreadyEnrolled}`);
  console.log(`❌ Erros: ${errors}`);
  console.log(`📚 Total de turmas: ${enrolled + alreadyEnrolled}`);
  console.log('');
  console.log('🎯 Pedro agora está matriculado em TODAS as turmas!');
  console.log('');
  console.log('🧪 PRÓXIMO PASSO:');
  console.log('   1. Recarregue o frontend do Check-in Kiosk (F5)');
  console.log('   2. Digite "Pedro Teste"');
  console.log('   3. Todas as turmas devem aparecer agora!');
  console.log('');

} catch (error) {
  console.error('❌ Erro fatal:', error);
} finally {
  await prisma.$disconnect();
}
