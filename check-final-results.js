const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkFinalResults() {
  console.log('🔍 Verificando resultados da importação...');
  
  const techniqueCount = await prisma.technique.count();
  const activityCount = await prisma.activity.count();
  const activitiesWithTechnique = await prisma.activity.count({
    where: { refTechniqueId: { not: null } }
  });
  
  console.log('\n🎉 RESULTADO FINAL:');
  console.log(`• Techniques: ${techniqueCount}`);
  console.log(`• Activities: ${activityCount}`);
  console.log(`• Activities com Technique: ${activitiesWithTechnique}`);
  
  // Get latest techniques
  const latestTechniques = await prisma.technique.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, difficulty: true }
  });
  
  console.log('\n🆕 Últimas Técnicas:');
  latestTechniques.forEach(t => console.log(`• ${t.name} (${t.difficulty})`));
  
  await prisma.$disconnect();
}

checkFinalResults().catch(console.error);
