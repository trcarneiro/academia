// Verificar banco de dados
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('=== VERIFICANDO BANCO DE DADOS ===');
    
    // Verificar técnicas
    const techniques = await prisma.technique.findMany();
    console.log(`\n📚 Técnicas encontradas: ${techniques.length}`);
    techniques.forEach(tech => {
      console.log(`  - ${tech.title} (ID: ${tech.id})`);
    });

    // Verificar atividades
    const activities = await prisma.activity.findMany({
      include: {
        refTechnique: true
      }
    });
    console.log(`\n🏋️ Atividades encontradas: ${activities.length}`);
    activities.forEach(activity => {
      console.log(`  - ${activity.title} (Técnica: ${activity.refTechnique?.title || 'N/A'})`);
    });

    console.log('\n=== VERIFICAÇÃO CONCLUÍDA ===');
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
