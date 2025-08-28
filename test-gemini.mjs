/**
 * Script de teste para verificar integração com Gemini AI
 */

import { config } from 'dotenv';
import { GeminiService, initializeGemini } from '../src/services/geminiService.js';

// Carregar variáveis de ambiente
config();

async function testGeminiIntegration() {
    console.log('🔍 Testando integração com Gemini AI...\n');
    
    try {
        // 1. Testar inicialização
        console.log('1. Verificando inicialização do Gemini...');
        const isInitialized = await initializeGemini();
        console.log(`   Status: ${isInitialized ? '✅ Inicializado' : '❌ Falha na inicialização'}\n`);
        
        if (!isInitialized) {
            console.log('❌ Não foi possível prosseguir com os testes');
            return;
        }
        
        // 2. Testar geração de resposta RAG
        console.log('2. Testando geração de resposta RAG...');
        const ragResponse = await GeminiService.generateRAGResponse(
            'Como executar um soco direto no Krav Maga?',
            'O soco direto é a técnica fundamental do Krav Maga. Deve ser executado com o punho fechado, mantendo o pulso reto e utilizando o movimento do quadril para gerar potência.'
        );
        console.log(`   Resposta: ${ragResponse.substring(0, 100)}...\n`);
        
        // 3. Testar geração de técnica
        console.log('3. Testando geração de técnica...');
        const technique = await GeminiService.generateTechnique({
            name: 'Defesa contra Agarramento',
            level: 'iniciante',
            category: 'defesa'
        });
        console.log(`   Técnica gerada: ${technique.name}`);
        console.log(`   Descrição: ${technique.description.substring(0, 80)}...\n`);
        
        // 4. Testar geração de plano de aula
        console.log('4. Testando geração de plano de aula...');
        const lessonPlan = await GeminiService.generateLessonPlan({
            title: 'Fundamentos Básicos',
            duration: 60,
            level: 'iniciante',
            focus: 'técnicas básicas'
        });
        console.log(`   Plano: ${lessonPlan.title}`);
        console.log(`   Duração: ${lessonPlan.duration} minutos\n`);
        
        console.log('✅ Todos os testes passaram! Gemini AI está funcionando corretamente.');
        
    } catch (error) {
        console.error('❌ Erro durante os testes:', error.message);
        
        if (error.message.includes('API key')) {
            console.log('\n💡 Dica: Verifique se a GEMINI_API_KEY está correta no arquivo .env');
        }
        
        if (error.message.includes('network') || error.message.includes('fetch')) {
            console.log('\n💡 Dica: Verifique sua conexão com a internet');
        }
    }
}

// Executar teste
testGeminiIntegration();
