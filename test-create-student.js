const fetch = require('node-fetch');

async function testCreateStudent() {
    const studentData = {
        firstName: "Teste",
        lastName: "Usuario",
        email: "teste@gmail.com"
    };

    try {
        console.log('🧪 Testando criação de estudante...');
        console.log('📤 Dados sendo enviados:', studentData);
        
        const response = await fetch('http://localhost:3000/api/students', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(studentData)
        });

        const result = await response.json();
        
        console.log('📊 Status da resposta:', response.status);
        console.log('📥 Resposta da API:', result);
        
        if (response.ok) {
            console.log('✅ Estudante criado com sucesso!');
        } else {
            console.log('❌ Erro ao criar estudante:', result);
        }
        
    } catch (error) {
        console.error('💥 Erro na requisição:', error);
    }
}

testCreateStudent();
