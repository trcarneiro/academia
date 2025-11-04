/**
 * Atualizar maxTokens do Agente de Matrículas para 4096
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const agentId = 'ecb685a1-d50a-4fe2-a3e2-7ec6efb5693a';
  
  console.log('🔧 Atualizando maxTokens do Agente de Matrículas...');
  
  const updated = await (prisma as any).aIAgent.update({
    where: { id: agentId },
    data: {
      maxTokens: 4096 // Aumentar de 2048 para 4096
    }
  });
  
  console.log('✅ Agent atualizado:', updated.name);
  console.log('   maxTokens:', updated.maxTokens, '(era 2048)');
  
  await prisma.$disconnect();
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
