import fs from 'fs';

// Teste simples de conectividade
console.log('🔍 Testando servidor...');

try {
  const response = await fetch('http://localhost:3000/api/activities');
  console.log('Status da resposta:', response.status);
  
  if (response.ok) {
    const data = await response.json();
    console.log('Atividades encontradas:', data.length || 0);
    console.log('Dados:', JSON.stringify(data, null, 2));
  } else {
    console.log('Erro na resposta:', await response.text());
  }
} catch (error) {
  console.error('Erro de conexão:', error.message);
}
