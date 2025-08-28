const { spawn } = require('child_process');

console.log('🚀 Iniciando servidor...');

const server = spawn('npx', ['tsx', 'src/server.ts'], {
    cwd: 'h:/projetos/academia',
    env: { ...process.env, NODE_OPTIONS: '-r tsconfig-paths/register' },
    stdio: 'pipe'
});

server.stdout.on('data', (data) => {
    console.log(`✅ STDOUT: ${data}`);
});

server.stderr.on('data', (data) => {
    console.log(`❌ STDERR: ${data}`);
});

server.on('close', (code) => {
    console.log(`🔄 Processo finalizado com código: ${code}`);
});

// Aguardar 5 segundos e testar endpoints
setTimeout(async () => {
    try {
        const http = require('http');
        
        console.log('🧪 Testando endpoints...');
        
        const testEndpoint = (path) => {
            return new Promise((resolve) => {
                const req = http.request({
                    hostname: 'localhost',
                    port: 3000,
                    path: path,
                    method: 'GET'
                }, (res) => {
                    console.log(`📡 ${path}: Status ${res.statusCode}`);
                    resolve(res.statusCode);
                });
                
                req.on('error', (err) => {
                    console.log(`❌ ${path}: ERRO - ${err.message}`);
                    resolve(null);
                });
                
                req.end();
            });
        };
        
        await testEndpoint('/api/rag/health');
        await testEndpoint('/api/rag/stats');
        await testEndpoint('/health');
        
    } catch (error) {
        console.log('❌ Erro nos testes:', error.message);
    }
}, 5000);
