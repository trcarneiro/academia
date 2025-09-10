const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStudents() {
  try {
    const total = await prisma.student.count();
    const active = await prisma.student.count({ where: { isActive: true } });
    const withUsers = await prisma.student.count({ where: { userId: { not: undefined } } });
    
    console.log('📊 ESTATÍSTICAS DA BASE DE ALUNOS:');
    console.log('=================================');
    console.log('📈 Total de alunos: ' + total);
    console.log('✅ Alunos ativos: ' + active);
    console.log('👥 Alunos com usuário: ' + withUsers);
    
    // Últimos 5 importados
    const recent = await prisma.student.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { user: true }
    });
    
    console.log('');
    console.log('📋 ÚLTIMOS 5 ALUNOS IMPORTADOS:');
    recent.forEach((student, i) => {
      console.log((i + 1) + '. ' + student.user.firstName + ' ' + student.user.lastName + ' (' + student.user.email + ')');
    });
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStudents();
