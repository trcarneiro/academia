import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function enableAutoSave() {
  console.log('🔧 Ativando Auto-Save no agente existente...\n');

  try {
    const agentId = 'ecb685a1-d50a-4fe2-a3e2-7ec6efb5693a';

    // Atualizar agente
    const updated = await prisma.aIAgent.update({
      where: { id: agentId },
      data: { autoSaveInsights: true },
      select: {
        id: true,
        name: true,
        specialization: true,
        autoSaveInsights: true,
      },
    });

    console.log('✅ Agente atualizado com sucesso!');
    console.log(`   Nome: ${updated.name}`);
    console.log(`   Auto-Save: ${updated.autoSaveInsights ? '✅ ATIVO' : '❌ INATIVO'}`);
    console.log(`   Especialização: ${updated.specialization}`);
    console.log(`\n🎯 Agora execute o agente para testar o auto-save!\n`);
  } catch (error) {
    console.error('❌ Erro ao atualizar:', error);
  } finally {
    await prisma.$disconnect();
  }
}

enableAutoSave();
