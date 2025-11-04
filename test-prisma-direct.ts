import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testPrismaFields() {
    console.log('🔧 Testando campos do Prisma...');
    
    try {
        // Buscar um plano existente
        console.log('1. Buscando planos existentes...');
        const plans = await prisma.billingPlan.findMany();
        
        if (plans.length === 0) {
            console.log('❌ Nenhum plano encontrado');
            return;
        }
        
        const existingPlan = plans[0];
        console.log('✅ Plano encontrado:', existingPlan.name);
        console.log('Campos atuais:', {
            pricePerClass: existingPlan.pricePerClass,
            creditsValidity: existingPlan.creditsValidity,
            maxClasses: existingPlan.maxClasses
        });
        
        // Tentar atualizar com os novos campos
        console.log('\n2. Tentando atualizar com novos campos...');
        const updateData = {
            name: existingPlan.name,
            description: 'TESTE DIRETO PRISMA - ' + new Date().toISOString(),
            pricePerClass: 99.99,
            creditsValidity: 150,
            maxClasses: 6
        };
        
        console.log('Dados para update:', updateData);
        
        const updatedPlan = await prisma.billingPlan.update({
            where: { id: existingPlan.id },
            data: updateData
        });
        
        console.log('\n✅ SUCESSO! Plano atualizado:');
        console.log('Campos salvos:', {
            pricePerClass: updatedPlan.pricePerClass,
            creditsValidity: updatedPlan.creditsValidity,
            maxClasses: updatedPlan.maxClasses
        });
        
        console.log('\n🎉 Os campos pricePerClass e creditsValidity estão funcionando!');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
        
        if (error.message.includes('Unknown argument')) {
            console.error('🔍 DIAGNÓSTICO: O Prisma ainda não reconhece os novos campos');
            console.error('💡 SOLUÇÃO: Execute novamente `npx prisma generate`');
        }
    } finally {
        await prisma.$disconnect();
    }
}

testPrismaFields();
