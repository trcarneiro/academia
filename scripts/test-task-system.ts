/**
 * Script de teste do sistema de tasks
 * Cria uma task de exemplo e verifica se foi salva corretamente
 */

import { prisma } from '../src/utils/database';

async function testTaskSystem() {
  console.log('🧪 [TEST] Iniciando teste do sistema de tasks...\n');

  try {
    // 1. Criar task de teste
    console.log('📝 [STEP 1] Criando task de teste...');
    const task = await prisma.agentTask.create({
      data: {
        organizationId: '452c0b35-1822-4890-851e-922356c812fb',
        agentId: 'ecb685a1-d50a-4fe2-a3e2-7ec6efb5693a',
        title: 'Teste: Notificar aluno com plano vencendo',
        description: 'Aluno João Silva tem plano vencendo em 3 dias. Enviar WhatsApp automático.',
        category: 'WHATSAPP_MESSAGE',
        actionType: 'SEND_NOTIFICATION',
        targetEntity: 'STUDENT',
        actionPayload: {
          studentId: 'abc123',
          studentName: 'João Silva',
          phone: '+5511999998888',
          message: 'Olá João! Seu plano vence em 3 dias. Renove agora!'
        },
        reasoning: {
          insights: ['Plano expira em 72h', 'Cliente fiel (12 meses)'],
          expectedImpact: 'Evitar cancelamento',
          risks: ['Cliente pode já ter decidido não renovar'],
          dataSupport: ['Histórico de 12 check-ins mensais']
        },
        requiresApproval: true,
        autoExecute: false,
        automationLevel: 'SEMI_AUTO',
        approvalStatus: 'PENDING',
        status: 'PENDING',
        priority: 'MEDIUM',
      },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            specialization: true
          }
        }
      }
    });

    console.log('✅ [SUCCESS] Task criada com sucesso!');
    console.log(`   ID: ${task.id}`);
    console.log(`   Title: ${task.title}`);
    console.log(`   Category: ${task.category}`);
    console.log(`   Priority: ${task.priority}`);
    console.log(`   Status: ${task.status}`);
    console.log(`   Agent: ${task.agent?.name || 'N/A'}\n`);

    // 2. Verificar se task aparece em pending
    console.log('📊 [STEP 2] Verificando tasks pendentes...');
    const pendingCount = await prisma.agentTask.count({
      where: {
        organizationId: '452c0b35-1822-4890-851e-922356c812fb',
        approvalStatus: 'PENDING'
      }
    });
    console.log(`✅ [SUCCESS] Total de tasks pendentes: ${pendingCount}\n`);

    // 3. Listar todas as tasks pendentes
    console.log('📋 [STEP 3] Listando tasks pendentes...');
    const pendingTasks = await prisma.agentTask.findMany({
      where: {
        organizationId: '452c0b35-1822-4890-851e-922356c812fb',
        approvalStatus: 'PENDING'
      },
      include: {
        agent: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    pendingTasks.forEach((task, index) => {
      console.log(`   ${index + 1}. ${task.title}`);
      console.log(`      Agent: ${task.agent?.name || 'Unknown'}`);
      console.log(`      Category: ${task.category}`);
      console.log(`      Priority: ${task.priority}`);
      console.log(`      Created: ${task.createdAt.toLocaleString()}\n`);
    });

    console.log('🎉 [COMPLETE] Teste concluído com sucesso!');
    console.log('\n📝 Próximos passos:');
    console.log('   1. Iniciar servidor: npm run dev');
    console.log('   2. Abrir dashboard: http://localhost:3000/#dashboard');
    console.log('   3. Verificar widget de tasks');
    console.log('   4. Aprovar ou rejeitar a task criada');

  } catch (error) {
    console.error('❌ [ERROR] Erro durante teste:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar teste
testTaskSystem()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('FATAL:', error);
    process.exit(1);
  });
