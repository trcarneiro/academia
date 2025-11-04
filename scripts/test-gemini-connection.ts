import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Carregar variáveis de ambiente
dotenv.config({ path: resolve(__dirname, '../.env') });

async function testGeminiConnection() {
    console.log('🔍 ===== TESTE DE CONEXÃO GEMINI API =====\n');

    const apiKey = process.env.GEMINI_API_KEY;
    
    console.log('1️⃣ Verificando API Key...');
    if (!apiKey) {
        console.error('❌ GEMINI_API_KEY não encontrada no .env');
        process.exit(1);
    }
    console.log(`✅ API Key encontrada: ${apiKey.substring(0, 20)}...${apiKey.substring(apiKey.length - 10)}`);
    console.log(`   Tamanho: ${apiKey.length} caracteres\n`);

    try {
        console.log('2️⃣ Inicializando Google Generative AI...');
        const genAI = new GoogleGenerativeAI(apiKey);
        console.log('✅ Cliente inicializado\n');

        console.log('3️⃣ Testando modelo gemini-2.0-flash-exp...');
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
        console.log('✅ Modelo obtido\n');

        console.log('4️⃣ Enviando prompt de teste...');
        const startTime = Date.now();
        
        const result = await model.generateContent({
            contents: [{
                role: 'user',
                parts: [{ text: 'Responda apenas com a palavra "OK" se você está funcionando corretamente.' }]
            }]
        });
        
        const elapsedTime = Date.now() - startTime;
        console.log(`✅ Resposta recebida em ${elapsedTime}ms\n`);

        const response = result.response;
        const text = response.text();

        console.log('5️⃣ Analisando resposta...');
        console.log('📊 Detalhes da resposta:');
        console.log('   - Texto:', text);
        console.log('   - Tamanho:', text.length, 'caracteres');
        console.log('   - Finish Reason:', response.candidates?.[0]?.finishReason);
        console.log('   - Safety Ratings:', JSON.stringify(response.candidates?.[0]?.safetyRatings || []));
        
        if (response.usageMetadata) {
            console.log('   - Tokens Prompt:', response.usageMetadata.promptTokenCount);
            console.log('   - Tokens Resposta:', response.usageMetadata.candidatesTokenCount);
            console.log('   - Tokens Total:', response.usageMetadata.totalTokenCount);
        }

        console.log('\n✅ ===== TESTE CONCLUÍDO COM SUCESSO =====');
        console.log('🎉 A conexão com Gemini API está funcionando perfeitamente!\n');

    } catch (error: any) {
        console.error('\n❌ ===== ERRO NO TESTE =====');
        console.error('Tipo:', error?.constructor?.name);
        console.error('Mensagem:', error?.message);
        console.error('Código:', error?.code);
        console.error('Status:', error?.status || error?.statusCode);
        console.error('Status Text:', error?.statusText);
        console.error('\n📋 Stack Trace:');
        console.error(error?.stack);
        console.error('\n📦 Objeto de Erro Completo:');
        console.error(JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        console.error('\n❌ ===== FIM DO ERRO =====\n');
        process.exit(1);
    }
}

testGeminiConnection();
