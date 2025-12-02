/**
 * Teste direto da API Gemini
 */

import { config } from 'dotenv';
config(); // Carregar .env

import { GoogleGenerativeAI } from '@google/generative-ai';

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  console.log('═══════════════════════════════════════════════');
  console.log('        🔑 TESTE DIRETO DA API GEMINI         ');
  console.log('═══════════════════════════════════════════════');
  
  console.log('\n📋 Verificando configuração:');
  console.log(`   GEMINI_API_KEY: ${apiKey ? apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 5) : '❌ NÃO ENCONTRADA'}`);
  console.log(`   RAG_MODEL: ${process.env.RAG_MODEL || 'não definido'}`);
  console.log(`   AI_PROVIDER: ${process.env.AI_PROVIDER || 'não definido'}`);
  
  if (!apiKey) {
    console.error('\n❌ GEMINI_API_KEY não encontrada no ambiente!');
    console.log('   Verifique se o arquivo .env está na raiz do projeto.');
    process.exit(1);
  }
  
  try {
    console.log('\n🚀 Iniciando teste com Gemini API...');
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    console.log('   ✅ Cliente Gemini inicializado');
    
    const prompt = `Você é um assistente de uma academia de Krav Maga.
    
Contexto:
- A academia tem 96 alunos ativos
- 11 turmas em funcionamento
- 1 curso de faixa branca
- Taxa de frequência média: 75%

Tarefa: Forneça 3 ações prioritárias para melhorar a retenção de alunos. Seja conciso.`;

    console.log('   📤 Enviando prompt para Gemini...');
    console.log('   ⏳ Aguardando resposta (pode demorar até 30s)...\n');
    
    const startTime = Date.now();
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const elapsed = Date.now() - startTime;
    
    console.log('═══════════════════════════════════════════════');
    console.log('        ✅ RESPOSTA DA API GEMINI             ');
    console.log('═══════════════════════════════════════════════');
    console.log(`⏱️ Tempo de resposta: ${elapsed}ms`);
    console.log('\n📩 Resposta:');
    console.log('-------------------------------------------');
    console.log(response);
    console.log('-------------------------------------------');
    
    console.log('\n🎉 Teste concluído com sucesso!');
    
  } catch (error: any) {
    console.error('\n❌ ERRO na chamada da API Gemini:');
    console.error(`   Mensagem: ${error.message}`);
    console.error(`   Código: ${error.code || 'N/A'}`);
    console.error(`   Status: ${error.status || 'N/A'}`);
    
    if (error.message?.includes('API_KEY_INVALID')) {
      console.error('\n⚠️ A API key parece ser inválida. Verifique em:');
      console.error('   https://aistudio.google.com/app/apikey');
    }
    
    process.exit(1);
  }
}

main();
