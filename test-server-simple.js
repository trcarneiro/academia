// Teste simples para verificar se o servidor está respondendo
const http = require('http');

async function testServer() {
    console.log('🧪 Aguardando 3 segundos para servidor iniciar...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('🔍 Testando conexão em http://127.0.0.1:3000/api/students...');
    
    const options = {
        hostname: '127.0.0.1',
        port: 3000,
        path: '/api/students/dc9c17ff-582c-45c6-bc46-7eee1cee4564/course-progress',
        method: 'GET',
        timeout: 5000
    };
    
    const req = http.request(options, (res) => {
        console.log(`✅ Status: ${res.statusCode}`);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                console.log('\n📊 Resposta da API:');
                console.log(`   Success: ${json.success}`);
                console.log(`   Has Course: ${json.data?.hasCourse}`);
                console.log(`   Course: ${json.data?.course?.name}`);
                console.log(`   Progress: ${json.data?.percentage}%`);
                console.log(`   Activities: ${json.data?.completedActivities}/${json.data?.totalActivities}`);
                console.log(`   Average: ${json.data?.averageRating}/10`);
                console.log(`   Graduation: ${json.data?.isEligibleForGraduation ? '✅ PRONTO' : '❌ NÃO PRONTO'}`);
                process.exit(0);
            } catch (e) {
                console.error('❌ Erro ao parsear JSON:', e);
                console.log('Raw data:', data);
                process.exit(1);
            }
        });
    });
    
    req.on('error', (e) => {
        console.error(`❌ Erro na requisição: ${e.message}`);
        console.log('\n💡 Possíveis causas:');
        console.log('   1. Servidor não iniciou completamente');
        console.log('   2. Porta 3001 não está fazendo bind');
        console.log('   3. Firewall bloqueando conexão local');
        console.log('   4. Processo node crashou após log "Server running"');
        process.exit(1);
    });
    
    req.on('timeout', () => {
        console.error('❌ Timeout: servidor não respondeu em 5 segundos');
        req.destroy();
        process.exit(1);
    });
    
    req.end();
}

testServer();
