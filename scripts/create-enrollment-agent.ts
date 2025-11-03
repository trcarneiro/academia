/**
 * SCRIPT: Criar Agente de Gestão de Matrículas
 * Cria um agente pedagógico especializado em matrículas, planos e cadastros
 */

import { prisma } from '../src/utils/database';

const DEV_ORG_ID = '452c0b35-1822-4890-851e-922356c812fb';

async function createEnrollmentAgent() {
    try {
        console.log('🤖 Criando Agente de Gestão de Matrículas...\n');

        const agent = await (prisma as any).aIAgent.create({
            data: {
                organizationId: DEV_ORG_ID,
                name: 'Agente de Matrículas e Planos',
                description: 'Monitora e gerencia matrículas de alunos, planos ativos, renovações, e validação de cadastros. Sugere ações para otimizar ocupação e evitar desistências.',
                specialization: 'pedagogical',
                systemPrompt: `Você é um agente especializado em gestão de matrículas e planos de alunos em academia de Krav Maga.

**SUAS RESPONSABILIDADES:**
1. Monitorar alunos com plano ativo mas sem matrícula em curso
2. Alertar sobre planos próximos do vencimento (< 7 dias)
3. Sugerir renovações para planos vencidos recentemente (1-7 dias)
4. Validar completude de cadastros (CPF, email, telefone, responsável financeiro)
5. Gerar relatórios de ocupação de turmas e vagas disponíveis
6. Identificar padrões de desistência (plano vencido + sem renovação)

**FERRAMENTAS DISPONÍVEIS:**
- Database (MCP): Consultar Student, Course, StudentCourse, Subscription, BillingPlan
- Notifications (MCP): Enviar alertas para administradores sobre ações necessárias
- Reports (MCP): Gerar relatórios em PDF/CSV de ocupação e renovações

**REGRAS DE PERMISSÃO:**
- Consultas (SELECT): Executar livremente
- Sugestões de matrícula: Criar permissão pendente (aguardar aprovação)
- Envio de notificações: Criar permissão pendente
- Modificações em dados: SEMPRE criar permissão pendente

**FORMATO DE SUGESTÃO:**
{
  "action": "enroll_student" | "renew_plan" | "send_notification" | "complete_registration",
  "student": { "id": "uuid", "name": "string" },
  "course": { "id": "uuid", "name": "string" },
  "reason": "Motivo detalhado da sugestão",
  "priority": "HIGH" | "MEDIUM" | "LOW",
  "expected_impact": "Descrição do impacto positivo"
}

**ANÁLISES AUTOMÁTICAS (DIÁRIAS):**
- 08:00 - Verificar planos vencendo em 7 dias (HIGH)
- 10:00 - Identificar alunos com plano mas sem matrícula (MEDIUM)
- 14:00 - Validar cadastros incompletos (LOW)
- 18:00 - Gerar relatório de ocupação de turmas (INFO)`,
                mcpTools: ['database', 'notifications', 'reports'],
                ragSources: ['students', 'courses', 'subscriptions', 'lesson_plans'],
                isActive: true,
                noCodeMode: true,
                temperature: 0.7,
                maxTokens: 2048,
                model: 'gemini-2.0-flash-exp'
            }
        });

        console.log('✅ Agente criado com sucesso!\n');
        console.log('📋 Detalhes:');
        console.log(`   ID: ${agent.id}`);
        console.log(`   Nome: ${agent.name}`);
        console.log(`   Especialização: ${agent.specialization}`);
        console.log(`   Ativo: ${agent.isActive}`);
        console.log(`   MCP Tools: ${agent.mcpTools.join(', ')}`);
        console.log(`   RAG Sources: ${agent.ragSources.join(', ')}`);
        console.log('\n🎯 Próximos Passos:');
        console.log('   1. Acesse http://localhost:3000/#agents');
        console.log('   2. Veja o agente na lista "Seus Agentes"');
        console.log('   3. Clique em "Executar" para testar análise inicial');
        console.log('   4. Permissões pendentes aparecerão no dashboard');
        console.log('\n💡 Análises Automáticas:');
        console.log('   - 08:00: Planos vencendo em 7 dias');
        console.log('   - 10:00: Alunos sem matrícula');
        console.log('   - 14:00: Cadastros incompletos');
        console.log('   - 18:00: Relatório de ocupação');

    } catch (error) {
        console.error('❌ Erro ao criar agente:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Executar
createEnrollmentAgent()
    .then(() => {
        console.log('\n🎉 Script concluído!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Erro fatal:', error);
        process.exit(1);
    });
