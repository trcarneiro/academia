const axios = require('axios');

async function testStudentCreation() {
  try {
    console.log('🧪 Testando criação de aluno...');
    
    const response = await axios.post('http://localhost:3000/api/students', {
      firstName: 'Teste',
      lastName: 'Corrigido',
      email: 'teste.corrigido@teste.com',
      phone: '(11) 99999-9999'
    });
    
    console.log('✅ Sucesso!');
    console.log('📊 Response:', response.data);
    
  } catch (error) {
    console.log('❌ Erro:');
    console.log('Status:', error.response?.status);
    console.log('Data:', error.response?.data);
    console.log('Error:', error.message);
  }
}

testStudentCreation();
