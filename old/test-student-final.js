const axios = require('axios');

async function testStudentCreation() {
  try {
    console.log('🧪 Testando criação de aluno após correções...');
    
    const studentData = {
      firstName: 'Teste',
      lastName: 'Final',
      email: 'teste.final@academia.com',
      phone: '(11) 99999-9999'
    };

    console.log('📤 Enviando dados:', studentData);
    
    const response = await axios.post('http://localhost:3000/api/students', studentData, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('✅ SUCESSO!');
    console.log('📊 Status:', response.status);
    console.log('📋 Response:', response.data);
    
    // Testar busca do estudante criado
    if (response.data.success && response.data.data.id) {
      console.log('\n🔍 Testando busca do estudante criado...');
      const getResponse = await axios.get(`http://localhost:3000/api/students/${response.data.data.id}`);
      
      console.log('✅ BUSCA FUNCIONANDO!');
      console.log('👤 Nome:', getResponse.data.data.user?.firstName, getResponse.data.data.user?.lastName);
      console.log('📧 Email:', getResponse.data.data.user?.email);
    }
    
  } catch (error) {
    console.log('❌ ERRO:');
    console.log('📊 Status:', error.response?.status);
    console.log('📋 Data:', error.response?.data);
    console.log('🔍 Message:', error.message);
  }
}

testStudentCreation();
