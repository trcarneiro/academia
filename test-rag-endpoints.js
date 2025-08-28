// Script simples para testar endpoints RAG
const http = require('http');

function testEndpoint(path, callback) {
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: `/api/rag${path}`,
        method: 'GET'
    };

    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        res.on('end', () => {
            callback(null, {
                status: res.statusCode,
                headers: res.headers,
                body: data
            });
        });
    });

    req.on('error', (err) => {
        callback(err);
    });

    req.end();
}

// Testar endpoints principais
console.log('Testando endpoints RAG...\n');

const endpoints = ['/health', '/stats', '/documents'];

let completed = 0;
endpoints.forEach((endpoint, index) => {
    setTimeout(() => {
        testEndpoint(endpoint, (err, result) => {
            if (err) {
                console.log(`❌ ${endpoint}: ERRO - ${err.message}`);
            } else {
                console.log(`✅ ${endpoint}: Status ${result.status}`);
                if (result.status === 200) {
                    console.log(`   Resposta: ${result.body.substring(0, 100)}...`);
                }
            }
            
            completed++;
            if (completed === endpoints.length) {
                console.log('\n✨ Teste concluído!');
                process.exit(0);
            }
        });
    }, index * 1000);
});
