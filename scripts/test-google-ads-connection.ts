import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import GoogleAdsService from '@/services/googleAdsService';

/**
 * Script de teste para Google Ads Connection
 * Executa testes sequenciais para diagnosticar problemas
 */

async function testGoogleAdsConnection() {
    const organizationId = '452c0b35-1822-4890-851e-922356c812fb';
    
    console.log('\n' + '='.repeat(80));
    console.log('🧪 TESTE DE CONEXÃO GOOGLE ADS');
    console.log('='.repeat(80) + '\n');
    
    try {
        // ========================================================================
        // STEP 1: Verificar credenciais no banco
        // ========================================================================
        console.log('📋 STEP 1: Verificando credenciais no banco de dados...\n');
        
        const settings = await prisma.crmSettings.findUnique({
            where: { organizationId }
        });
        
        if (!settings) {
            console.error('❌ ERRO: Configurações não encontradas para organizationId:', organizationId);
            process.exit(1);
        }
        
        console.log('✅ Configurações encontradas:');
        console.log('   • Connected:', settings.googleAdsConnected);
        console.log('   • Client ID:', settings.googleAdsClientId?.substring(0, 20) + '...');
        console.log('   • Developer Token:', settings.googleAdsDeveloperToken?.substring(0, 10) + '...');
        console.log('   • Customer ID:', settings.googleAdsCustomerId);
        console.log('   • Refresh Token Length:', settings.googleAdsRefreshToken?.length, 'chars');
        
        if (!settings.googleAdsConnected) {
            console.error('\n❌ ERRO: Google Ads não está conectado!');
            console.log('🔧 Ação: Clique em "Conectar Google Ads" no módulo CRM\n');
            process.exit(1);
        }
        
        // ========================================================================
        // STEP 2: Inicializar serviço
        // ========================================================================
        console.log('\n📋 STEP 2: Inicializando GoogleAdsService...\n');
        
        const service = new GoogleAdsService(organizationId);
        console.log('✅ Serviço criado\n');
        
        // ========================================================================
        // STEP 3: Testar conexão
        // ========================================================================
        console.log('📋 STEP 3: Testando conexão com Google Ads API...\n');
        
        const result = await service.testConnection();
        
        if (result.success) {
            console.log('✅ CONEXÃO ESTABELECIDA COM SUCESSO!');
            console.log('   • Customer ID:', result.customerId, '\n');
        } else {
            console.error('❌ ERRO NA CONEXÃO:');
            console.error('   • ' + result.error, '\n');
            process.exit(1);
        }
        
        // ========================================================================
        // STEP 4: Sincronizar campanhas
        // ========================================================================
        console.log('📋 STEP 4: Sincronizando campanhas do Google Ads...\n');
        
        const campaignCount = await service.syncCampaigns();
        console.log(`✅ CAMPANHAS SINCRONIZADAS COM SUCESSO!`);
        console.log(`   • Total de campanhas: ${campaignCount}\n`);
        
        // ========================================================================
        // STEP 5: Listar campanhas
        // ========================================================================
        console.log('📋 STEP 5: Listando campanhas sincronizadas...\n');
        
        const campaigns = await prisma.googleAdsCampaign.findMany({
            where: { organizationId },
            orderBy: { cost: 'desc' },
            take: 5
        });
        
        if (campaigns.length === 0) {
            console.log('⚠️  Nenhuma campanha encontrada no banco de dados\n');
        } else {
            console.log(`✅ Mostrando top 5 campanhas:\n`);
            campaigns.forEach((campaign, index) => {
                console.log(`${index + 1}. ${campaign.name}`);
                console.log(`   • ID: ${campaign.googleAdsId}`);
                console.log(`   • Status: ${campaign.status}`);
                console.log(`   • Impressões: ${campaign.impressions}`);
                console.log(`   • Cliques: ${campaign.clicks}`);
                console.log(`   • Custo: R$ ${(campaign.cost / 100).toFixed(2)}`);
                console.log(`   • Conversões: ${campaign.conversions}\n`);
            });
        }
        
        // ========================================================================
        // SUCCESS
        // ========================================================================
        console.log('='.repeat(80));
        console.log('✅ TODOS OS TESTES PASSARAM COM SUCESSO!');
        console.log('='.repeat(80) + '\n');
        
        process.exit(0);
        
    } catch (error: any) {
        console.error('\n' + '='.repeat(80));
        console.error('❌ ERRO DURANTE OS TESTES:');
        console.error('='.repeat(80) + '\n');
        console.error('Mensagem:', error.message);
        console.error('\nStack Trace:');
        console.error(error.stack);
        console.error('\n' + '='.repeat(80) + '\n');
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Executar testes
testGoogleAdsConnection();
