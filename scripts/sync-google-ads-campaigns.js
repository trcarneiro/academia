#!/usr/bin/env node

/**
 * Script de teste: Sincronizar campanhas do Google Ads
 * Executa POST /api/google-ads/sync/campaigns
 */

const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/google-ads/sync/campaigns',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': 2
    }
};

console.log('\n' + '='.repeat(80));
console.log('🚀 SINCRONIZANDO CAMPANHAS DO GOOGLE ADS');
console.log('='.repeat(80) + '\n');

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('📊 Response Status:', res.statusCode);
        console.log('📝 Response Body:\n');
        
        try {
            const json = JSON.parse(data);
            console.log(JSON.stringify(json, null, 2));
            
            if (json.success) {
                console.log('\n✅ SUCESSO! Campanhas sincronizadas com sucesso!');
                console.log(`   Total: ${json.data.count} campanhas\n`);
            } else {
                console.log('\n❌ ERRO:', json.message || json.error);
                console.log('\n' + '='.repeat(80) + '\n');
                process.exit(1);
            }
        } catch (e) {
            console.log(data);
        }
        
        console.log('='.repeat(80) + '\n');
        process.exit(0);
    });
});

req.on('error', (error) => {
    console.error('❌ ERRO NA REQUISIÇÃO:');
    console.error(error.message);
    console.log('\n' + '='.repeat(80) + '\n');
    process.exit(1);
});

req.write('{}');
req.end();
