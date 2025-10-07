#!/usr/bin/env npx tsx

/**
 * 🔄 SCRIPT RESET COMPLETO DOS DADOS DEMO
 * ========================================
 * 
 * Limpa e recria todos os dados demo em uma única operação.
 * Ideal para resetar rapidamente o ambiente de demonstração.
 * 
 * COMO USAR:
 * npm run reset:demo
 */

import { cleanDemoDataSafe } from './clean-demo-safe';
import { seedDemoData } from './seed-demo-data';
import { quickSeed } from './seed-quick-demo';

async function resetDemo() {
  console.log('🔄 RESET COMPLETO DOS DADOS DEMO');
  console.log('=================================\n');
  
  const startTime = Date.now();
  
  try {
    // Perguntar qual tipo de seed fazer
    const args = process.argv.slice(2);
    const useQuick = args.includes('--quick') || args.includes('-q');
    
    // Etapa 1: Limpeza
    console.log('🧹 ETAPA 1: Limpando dados existentes...');
    await cleanDemoDataSafe();
    
    console.log('\n⏳ Aguardando 2 segundos...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Etapa 2: Inserção
    if (useQuick) {
      console.log('⚡ ETAPA 2: Inserindo dados básicos...');
      await quickSeed();
    } else {
      console.log('📊 ETAPA 2: Inserindo dados completos...');
      await seedDemoData();
    }
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    console.log('\n🎉 RESET CONCLUÍDO COM SUCESSO!');
    console.log('===============================');
    console.log(`⏱️  Tempo total: ${duration}s`);
    console.log(`🌐 Aplicação: http://localhost:3000`);
    console.log(`👤 Login demo: joao@academia.demo / demo123`);
    console.log(`📚 Swagger: http://localhost:3000/docs`);
    
  } catch (error) {
    console.error('\n💥 ERRO DURANTE O RESET:', error);
    console.log('\n🔧 POSSÍVEIS SOLUÇÕES:');
    console.log('1. Verificar se o banco está rodando');
    console.log('2. Verificar variáveis de ambiente');
    console.log('3. Executar: npm run db:push');
    console.log('4. Tentar novamente com: npm run reset:demo --quick');
    process.exit(1);
  }
}

// Executar
if (require.main === module) {
  resetDemo();
}

export { resetDemo };
