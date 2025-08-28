/**
 * Script de teste para verificar integração com Gemini AI
 */

import { config } from 'dotenv';

// Carregar variáveis de ambiente
config();

// Debug: verificar se as variáveis estão sendo carregadas
console.log('🔧 Debug - Variáveis de ambiente:');
console.log('   GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'CONFIGURADA' : 'NÃO ENCONTRADA');
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('');

import { GeminiService, initializeGemini } from './src/services/geminiService';

async function testGeminiIntegration() {
    console.log('🔍 Testando integração com Gemini AI...\n');
    
    try {
        // 1. Testar inicialização
        console.log('1. Verificando inicialização do Gemini...');
        const isInitialized = await initializeGemini();
        console.log(`   Status: ${isInitialized ? '✅ Inicializado' : '❌ Falha na inicialização'}\n`);
        
        if (!isInitialized) {
            console.log('❌ Não foi possível prosseguir com os testes');
            console.log('💡 Verifique se a GEMINI_API_KEY está definida no arquivo .env');
            return;
        }
        
        // 2. Testar geração de resposta RAG
        console.log('2. Testando geração de resposta RAG...');
        const ragResponse = await GeminiService.generateRAGResponse(
            'Como executar um soco direto no Krav Maga?',
            ['O soco direto é a técnica fundamental do Krav Maga. Deve ser executado com o punho fechado, mantendo o pulso reto e utilizando o movimento do quadril para gerar potência.']
        );
        console.log(`   ✅ Resposta gerada: ${ragResponse.substring(0, 100)}...\n`);
        
        // 3. Testar geração de técnica
        console.log('3. Testando geração de técnica...');
        const technique = await GeminiService.generateTechnique({
            level: 'iniciante',
            type: 'defesa',
            context: 'Defesa contra Agarramento',
            category: 'defesa'
        });
        console.log(`   ✅ Técnica gerada: ${technique.name}`);
        console.log(`   Descrição: ${technique.description.substring(0, 80)}...\n`);
        
        console.log('🎉 Gemini AI está funcionando perfeitamente!');
        console.log('✅ Sistema RAG pronto para uso em produção');
        
    } catch (error) {
        console.error('❌ Erro durante os testes:', error.message);
        
        if (error.message.includes('API key')) {
            console.log('\n💡 Dica: Verifique se a GEMINI_API_KEY está correta no arquivo .env');
        }
        
        if (error.message.includes('network') || error.message.includes('fetch')) {
            console.log('\n💡 Dica: Verifique sua conexão com a internet');
        }
        
        console.log('\n🔄 O sistema continuará funcionando com respostas de fallback');
    }
}

// Executar teste
testGeminiIntegration();
