// Test API directly
const fetch = require('node-fetch');

async function testStudentCreation() {
    const payload = {
        name: "Teste Usuario",
        email: "teste@exemplo.com",
        status: "active"
    };
    
    console.log('🧪 Testando POST /api/students');
    console.log('📤 Payload:', JSON.stringify(payload, null, 2));
    
    try {
        const response = await fetch('http://localhost:3000/api/students', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        console.log('📥 Status:', response.status, response.statusText);
        
        const responseText = await response.text();
        console.log('📄 Response body:', responseText);
        
        if (!response.ok) {
            console.error('❌ Erro:', response.status, responseText);
        } else {
            console.log('✅ Sucesso!');
        }
    } catch (error) {
        console.error('❌ Erro na requisição:', error.message);
    }
}

// Check if organizations exist first
async function checkOrganizations() {
    try {
        console.log('🏢 Verificando organizações...');
        const response = await fetch('http://localhost:3000/api/organizations');
        const data = await response.json();
        console.log('📊 Organizações encontradas:', data);
    } catch (error) {
        console.error('❌ Erro ao verificar organizações:', error.message);
    }
}

async function main() {
    await checkOrganizations();
    await testStudentCreation();
}

main();
