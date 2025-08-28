// Teste de conectividade mais robusto
async function testAPI() {
  console.log('🔍 Testando API de atividades...');

  try {
    // Teste básico de conectividade
    const response = await fetch('http://localhost:3000/api/activities');
    console.log('Status:', response.status);
    console.log('Content-Type:', response.headers.get('content-type'));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Resposta recebida com sucesso');
      console.log('Estrutura:', {
        success: data.success,
        count: data.count,
        dataLength: data.data?.length || 0,
        hasData: Array.isArray(data.data),
        totalPages: data.totalPages
      });
      
      if (data.data && data.data.length > 0) {
        console.log('📋 Primeira atividade:', JSON.stringify(data.data[0], null, 2));
      } else {
        console.log('📋 Nenhuma atividade encontrada');
      }
    } else {
      const text = await response.text();
      console.log('❌ Erro na resposta:', text);
    }
  } catch (error) {
    console.error('💥 Erro de conexão:', error.message);
  }
}

testAPI();
