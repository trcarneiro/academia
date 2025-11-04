// Script para corrigir modelo do agente de matrículas
import { prisma } from '../src/utils/database';

async function fixAgentModel() {
    const agentId = 'ecb685a1-d50a-4fe2-a3e2-7ec6efb5693a';
    
    try {
        // Ver configuração atual
        const agent = await prisma.aIAgent.findUnique({
            where: { id: agentId },
            select: { id: true, name: true, model: true, specialization: true }
        });
        
        console.log('📋 Configuração atual:');
        console.log(JSON.stringify(agent, null, 2));
        
        // Atualizar para modelo válido
        const updated = await prisma.aIAgent.update({
            where: { id: agentId },
            data: {
                model: 'gemini-2.0-flash-exp', // Modelo experimental mais recente
                temperature: 0.7,
                maxTokens: 2048
            }
        });
        
        console.log('\n✅ Modelo atualizado:');
        console.log(`   Model: ${updated.model}`);
        console.log(`   Temperature: ${updated.temperature}`);
        console.log(`   MaxTokens: ${updated.maxTokens}`);
        
    } catch (error: any) {
        console.error('❌ Erro:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

fixAgentModel();
