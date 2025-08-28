// Teste direto do banco de dados
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDB() {
  try {
    console.log('🔍 Testando banco de dados...');
    
    // Verificar organização
    const org = await prisma.organization.findFirst();
    console.log('Organização:', org ? `${org.name} (${org.id})` : 'Nenhuma encontrada');
    
    if (!org) {
      console.log('❌ Erro: Nenhuma organização encontrada!');
      return;
    }
    
    // Contar atividades
    const activityCount = await prisma.activity.count({
      where: { organizationId: org.id }
    });
    console.log('Total de atividades:', activityCount);
    
    // Buscar atividades com técnicas
    const activities = await prisma.activity.findMany({
      where: { organizationId: org.id },
      include: {
        refTechnique: {
          select: { id: true, title: true }
        }
      },
      take: 5
    });
    
    console.log('Atividades encontradas:', activities.length);
    activities.forEach((act, i) => {
      console.log(`${i + 1}. ${act.title} (Tipo: ${act.type}${act.refTechnique ? `, Técnica: ${act.refTechnique.title}` : ''})`);
    });
    
    // Verificar técnicas
    const techniqueCount = await prisma.technique.count();
    console.log('Total de técnicas:', techniqueCount);
    
    if (techniqueCount > 0) {
      const techniques = await prisma.technique.findMany({ take: 3 });
      console.log('Algumas técnicas:');
      techniques.forEach((tech, i) => {
        console.log(`${i + 1}. ${tech.title} (${tech.id})`);
      });
    }
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDB();
