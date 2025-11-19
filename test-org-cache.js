/**
 * Script de Teste - Cache de Organizações
 * Verifica se o cache está reduzindo queries ao banco
 */

const orgId = 'ff5ee00e-d8a3-4291-9428-d28b852fb472'; // Smart Defence

console.log('🧪 Teste de Cache de Organizações');
console.log('='.repeat(60));

async function testCache() {
  console.log('\n📋 Fazendo 10 requisições ao mesmo endpoint...');
  console.log('Esperado: 1 query ao banco + 9 cache hits\n');

  const results = [];

  for (let i = 1; i <= 10; i++) {
    const start = Date.now();
    
    try {
      const response = await fetch(`http://localhost:3000/api/students`, {
        headers: {
          'x-organization-id': orgId,
          'Content-Type': 'application/json'
        }
      });

      const duration = Date.now() - start;
      const data = await response.json();

      results.push({
        request: i,
        status: response.status,
        duration: `${duration}ms`,
        students: data.total || 0,
        success: data.success
      });

      console.log(`${i}. ✅ ${duration}ms - ${data.total || 0} alunos`);
      
      // Pequeno delay entre requests
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`${i}. ❌ Erro:`, error.message);
      results.push({
        request: i,
        error: error.message
      });
    }
  }

  console.log('\n📊 ANÁLISE DOS RESULTADOS:');
  console.log('='.repeat(60));

  const durations = results
    .filter(r => r.duration)
    .map(r => parseInt(r.duration));

  if (durations.length > 0) {
    const firstRequest = durations[0];
    const avgCached = durations.slice(1).reduce((a, b) => a + b, 0) / (durations.length - 1);

    console.log(`\n1ª requisição (cache MISS): ${firstRequest}ms`);
    console.log(`Requisições 2-10 (cache HIT): ${avgCached.toFixed(0)}ms em média`);
    console.log(`\n✅ Melhoria: ${((firstRequest - avgCached) / firstRequest * 100).toFixed(1)}% mais rápido com cache`);

    if (avgCached < firstRequest * 0.5) {
      console.log('\n🎉 CACHE FUNCIONANDO PERFEITAMENTE!');
      console.log('Requisições em cache são 50%+ mais rápidas.');
    } else if (avgCached < firstRequest * 0.8) {
      console.log('\n✅ Cache funcionando, mas pode melhorar.');
    } else {
      console.log('\n⚠️ Cache pode não estar sendo usado.');
      console.log('Verifique se o middleware está cacheando corretamente.');
    }
  }

  console.log('\n📝 DICA: Verifique os logs do servidor');
  console.log('Deve ter apenas 1 query ao banco, não 10.');
}

// Executar teste
testCache().catch(console.error);
