/**
 * Teste automatizado do fluxo OAuth Google Ads
 * Valida se endpoint retorna URL válida
 */

const http = require('http');

console.log('🧪 Teste 1: Google Ads OAuth URL Generation\n');

// Test 1: GET /api/google-ads/auth/url
const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/google-ads/auth/url',
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
};

const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log(`Status Code: ${res.statusCode}`);
        
        try {
            const response = JSON.parse(data);
            console.log('\n📦 Response:');
            console.log(JSON.stringify(response, null, 2));
            
            // Validations
            if (res.statusCode === 200 && response.success) {
                console.log('\n✅ SUCESSO: Endpoint retornou 200 OK');
                
                if (response.data?.authUrl) {
                    console.log('✅ URL de autorização presente');
                    console.log(`📎 URL: ${response.data.authUrl.substring(0, 100)}...`);
                    
                    // Check if URL is valid Google OAuth
                    if (response.data.authUrl.includes('accounts.google.com/o/oauth2')) {
                        console.log('✅ URL é válida do Google OAuth');
                    } else {
                        console.log('❌ URL não parece ser do Google OAuth');
                    }
                } else {
                    console.log('❌ URL de autorização não encontrada');
                }
            } else {
                console.log('\n❌ FALHOU: Endpoint retornou erro');
                console.log(`Mensagem: ${response.message || 'Sem mensagem'}`);
            }
            
        } catch (error) {
            console.error('❌ Erro ao parsear JSON:', error.message);
            console.log('Raw data:', data);
        }
        
        console.log('\n' + '='.repeat(60));
    });
});

req.on('error', (error) => {
    console.error('❌ Erro na requisição:', error.message);
});

req.end();
