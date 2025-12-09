const http = require('http');

function makeRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });
        req.on('error', reject);
        if (postData) req.write(postData);
        req.end();
    });
}

async function main() {
    try {
        console.log('🔑 Obtendo token via dev-auth...');
        
        // 1. Fazer login via dev-auth
        const loginResponse = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/dev-auth/auto-login',
            method: 'POST',
            headers: { }
        });
        
        if (!loginResponse.data?.success) {
            console.log('❌ Falha no dev-auth:', loginResponse.data);
            return;
        }
        
        const token = loginResponse.data.data.token;
        const user = loginResponse.data.data.user;
        
        console.log('✅ Token obtido para:', user.email);
        console.log('   Role:', user.role);
        console.log('   OrganizationId:', user.organizationId);
        
        // Testar endpoint
        console.log('\n🔍 Testando endpoint /api/auth/permissions...');
        
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/auth/permissions',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('\n=== Resposta do endpoint /api/auth/permissions ===');
        console.log('Status:', response.status);
        
        if (typeof response.data === 'string') {
            console.log('Resposta (raw):', response.data.substring(0, 500));
        } else {
            console.log('Success:', response.data?.success);
            console.log('Role:', response.data?.data?.role);
            console.log('isAdmin:', response.data?.data?.isAdmin);
            console.log('isSuperAdmin:', response.data?.data?.isSuperAdmin);
            console.log('Total permissions:', response.data?.data?.permissions?.length);
            
            if (response.data?.data?.permissions?.length > 0) {
                console.log('\n📋 Primeiras 5 permissões:');
                response.data.data.permissions.slice(0, 5).forEach(p => {
                    console.log(`  - ${p.module}.${p.action} (scope: ${p.scope})`);
                });
            }
            
            if (response.data?.data?.moduleAccess) {
                console.log('\n🔑 Módulos com acesso:');
                Object.keys(response.data.data.moduleAccess).slice(0, 10).forEach(module => {
                    console.log(`  - ${module}:`, response.data.data.moduleAccess[module]);
                });
            }
            
            if (response.data?.error || response.data?.message) {
                console.log('\n⚠️ Mensagem:', response.data?.error || response.data?.message);
            }
        }
        
        console.log('\n✅ Teste concluído!');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        console.error('Stack:', error.stack);
    }
}

main();
