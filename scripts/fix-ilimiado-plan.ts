/**
 * Script para corrigir o curso do plano Ilimiado
 * Troca "Krav Maga Kids" por "Krav Maga - Faixa Branca" (curso base)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixIlimiadoPlan() {
    try {
        console.log('🔧 Iniciando correção do plano Ilimiado...\n');

        // 1. Buscar o plano Ilimiado
        const plan = await prisma.billingPlan.findFirst({
            where: { name: 'Ilimiado' }
        });

        if (!plan) {
            console.log('❌ Plano Ilimiado não encontrado!');
            return;
        }

        console.log('📦 Plano encontrado:', plan.name);
        console.log('   ID:', plan.id);
        console.log('   Features atuais:', JSON.stringify(plan.features, null, 2));

        // 2. Buscar o curso base "Krav Maga - Faixa Branca"
        const baseCourse = await prisma.course.findFirst({
            where: {
                name: 'Krav Maga - Faixa Branca',
                isBaseCourse: true
            }
        });

        if (!baseCourse) {
            console.log('❌ Curso base "Krav Maga - Faixa Branca" não encontrado!');
            return;
        }

        console.log('\n✅ Curso base encontrado:', baseCourse.name);
        console.log('   ID:', baseCourse.id);
        console.log('   isBaseCourse:', baseCourse.isBaseCourse);

        // 3. Atualizar o plano
        const features = plan.features as any;
        const updatedFeatures = {
            ...features,
            courseIds: [baseCourse.id]
        };

        const updated = await prisma.billingPlan.update({
            where: { id: plan.id },
            data: { features: updatedFeatures }
        });

        console.log('\n🎉 Plano atualizado com sucesso!');
        console.log('   Features novas:', JSON.stringify(updated.features, null, 2));

        // 4. Verificar a atualização
        const verification = await prisma.billingPlan.findUnique({
            where: { id: plan.id }
        });

        const verificationFeatures = verification?.features as any;
        const courseId = verificationFeatures?.courseIds?.[0];

        if (courseId === baseCourse.id) {
            console.log('\n✅ VERIFICAÇÃO OK: Plano está correto!');
            console.log('   courseIds[0]:', courseId);
            console.log('   Esperado:', baseCourse.id);
            console.log('\n🎯 Sistema pronto para testar auto-matrícula!');
        } else {
            console.log('\n⚠️ VERIFICAÇÃO FALHOU: Algo deu errado');
            console.log('   courseIds[0]:', courseId);
            console.log('   Esperado:', baseCourse.id);
        }

    } catch (error) {
        console.error('❌ Erro ao corrigir plano:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixIlimiadoPlan();
