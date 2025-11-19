import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

console.log('🔍 Verificando estrutura de schedule nas turmas...\n');

try {
  const turmas = await prisma.turma.findMany({
    where: {
      isActive: true,
      organizationId: 'ff5ee00e-d8a3-4291-9428-d28b852fb472'
    },
    select: {
      id: true,
      name: true,
      schedule: true,
      startDate: true,
      endDate: true
    }
  });

  console.log(`✅ Encontradas ${turmas.length} turmas ativas\n`);

  for (const turma of turmas) {
    console.log(`📋 ${turma.name}`);
    console.log(`   ID: ${turma.id}`);
    console.log(`   Schedule (JSON):`, turma.schedule);
    console.log(`   Start Date: ${turma.startDate}`);
    console.log(`   End Date: ${turma.endDate || 'N/A'}`);
    console.log('');
  }

} catch (error) {
  console.error('❌ Erro:', error);
} finally {
  await prisma.$disconnect();
}
