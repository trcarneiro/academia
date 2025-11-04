/**
 * Script de Teste - Dashboard de Insights
 * 
 * OBJETIVO: Verificar se há insights salvos no banco e testar carregamento
 * 
 * USO: npx tsx scripts/test-insights-dashboard.ts
 */

import { prisma } from '../src/utils/database';

async function main() {
    console.log('🔍 [Test] Iniciando teste do Dashboard de Insights\n');
    
    try {
        // 1. Contar insights no banco
        const totalInsights = await prisma.agentInsight.count();
        console.log(`📊 Total de insights no banco: ${totalInsights}`);
        
        if (totalInsights === 0) {
            console.log('\n⚠️  BANCO VAZIO - Nenhum insight encontrado!');
            console.log('📝 Para testar o dashboard, você precisa:');
            console.log('   1. Criar um agente com "Auto-salvar Insights" ativado');
            console.log('   2. Executar o agente');
            console.log('   3. Insights serão salvos automaticamente\n');
            return;
        }
        
        // 2. Buscar insights recentes (últimos 10)
        console.log('\n📋 Últimos 10 insights salvos:\n');
        
        const recentInsights = await prisma.agentInsight.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                agent: {
                    select: { name: true, specialization: true }
                }
            }
        });
        
        recentInsights.forEach((insight, index) => {
            console.log(`${index + 1}. [${insight.type}] ${insight.title}`);
            console.log(`   Agente: ${insight.agent.name} (${insight.agent.specialization})`);
            console.log(`   Categoria: ${insight.category} | Prioridade: ${insight.priority}`);
            console.log(`   Status: ${insight.status} | Fixado: ${insight.isPinned ? '📌 Sim' : 'Não'}`);
            console.log(`   Criado: ${new Date(insight.createdAt).toLocaleString('pt-BR')}`);
            console.log('');
        });
        
        // 3. Estatísticas por tipo
        console.log('\n📊 Estatísticas por Tipo:');
        const byType = await prisma.agentInsight.groupBy({
            by: ['type'],
            _count: true
        });
        
        byType.forEach(stat => {
            console.log(`   ${stat.type}: ${stat._count} insights`);
        });
        
        // 4. Estatísticas por categoria
        console.log('\n📊 Estatísticas por Categoria:');
        const byCategory = await prisma.agentInsight.groupBy({
            by: ['category'],
            _count: true
        });
        
        byCategory.forEach(stat => {
            console.log(`   ${stat.category}: ${stat._count} insights`);
        });
        
        // 5. Insights por status
        console.log('\n📊 Estatísticas por Status:');
        const byStatus = await prisma.agentInsight.groupBy({
            by: ['status'],
            _count: true
        });
        
        byStatus.forEach(stat => {
            console.log(`   ${stat.status}: ${stat._count} insights`);
        });
        
        // 6. Insights fixados
        const pinnedCount = await prisma.agentInsight.count({
            where: { isPinned: true }
        });
        console.log(`\n📌 Insights fixados: ${pinnedCount}`);
        
        // 7. Insights não lidos
        const unreadCount = await prisma.agentInsight.count({
            where: { isRead: false }
        });
        console.log(`📬 Insights não lidos: ${unreadCount}`);
        
        // 8. Insights arquivados
        const archivedCount = await prisma.agentInsight.count({
            where: { isArchived: true }
        });
        console.log(`🗄️  Insights arquivados: ${archivedCount}`);
        
        console.log('\n✅ [Test] Teste concluído com sucesso!');
        console.log('\n🌐 Para ver no navegador:');
        console.log('   1. Acesse: http://localhost:3000/#agents');
        console.log('   2. Clique no botão "📊 Ver Insights" no topo');
        console.log('   3. Ou clique em "📊 Dashboard" em qualquer agente');
        
    } catch (error) {
        console.error('❌ [Test] Erro ao buscar insights:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main().catch(console.error);
