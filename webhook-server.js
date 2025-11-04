/**
 * GitHub Webhook Listener
 * Academia Krav Maga v2.0
 * 
 * Escuta webhooks do GitHub e executa deploy automático quando houver push no branch main
 * 
 * Setup no servidor:
 *   1. npm install -g github-webhook-handler
 *   2. pm2 start webhook-server.js --name webhook
 *   3. pm2 save
 * 
 * Setup no GitHub:
 *   1. Ir em Settings > Webhooks > Add webhook
 *   2. Payload URL: http://64.227.28.147:7777/webhook
 *   3. Content type: application/json
 *   4. Secret: [mesma string definida abaixo]
 *   5. Events: Just the push event
 */

const http = require('http');
const createHandler = require('github-webhook-handler');
const { exec } = require('child_process');
const path = require('path');

// ⚠️ IMPORTANTE: Gerar secret forte com: openssl rand -hex 32
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'CHANGE_ME_IN_PRODUCTION';
const WEBHOOK_PATH = '/webhook';
const PORT = 7777;
const DEPLOY_SCRIPT = '/var/www/academia/deploy.sh';

// Criar handler
const handler = createHandler({ 
  path: WEBHOOK_PATH, 
  secret: WEBHOOK_SECRET 
});

// Criar servidor HTTP
http.createServer((req, res) => {
  handler(req, res, (err) => {
    if (err) {
      console.error('❌ Erro no webhook handler:', err.message);
      res.statusCode = 500;
      res.end('Internal server error');
    } else {
      res.statusCode = 404;
      res.end('Not found');
    }
  });
}).listen(PORT);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎣 GitHub Webhook Listener ATIVO');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📡 Porta: ${PORT}`);
console.log(`🔗 URL: http://64.227.28.147:${PORT}${WEBHOOK_PATH}`);
console.log(`🔐 Secret: ${WEBHOOK_SECRET === 'CHANGE_ME_IN_PRODUCTION' ? '⚠️ NÃO CONFIGURADO!' : '✅ Configurado'}`);
console.log(`📜 Script de deploy: ${DEPLOY_SCRIPT}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');

// Handler de erros
handler.on('error', (err) => {
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('❌ Erro no webhook listener:');
  console.error(err.message);
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

// Handler de push
handler.on('push', (event) => {
  const branch = event.payload.ref.replace('refs/heads/', '');
  const repo = event.payload.repository.full_name;
  const pusher = event.payload.pusher.name;
  const commitMsg = event.payload.head_commit?.message || 'No message';
  const commitSha = event.payload.head_commit?.id.substring(0, 7) || 'unknown';
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📥 Push recebido:');
  console.log(`   Repositório: ${repo}`);
  console.log(`   Branch: ${branch}`);
  console.log(`   Autor: ${pusher}`);
  console.log(`   Commit: ${commitSha} - "${commitMsg}"`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Apenas deploy em push para main
  if (branch !== 'main') {
    console.log(`⏭️ Ignorando push no branch '${branch}' (apenas 'main' faz deploy)`);
    console.log('');
    return;
  }
  
  console.log('🚀 Iniciando deploy automático...');
  console.log('');
  
  // Executar script de deploy
  const deployProcess = exec(DEPLOY_SCRIPT, (error, stdout, stderr) => {
    if (error) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ ERRO NO DEPLOY:');
      console.error(`   Exit code: ${error.code}`);
      console.error(`   Signal: ${error.signal}`);
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error(stderr);
      return;
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ DEPLOY CONCLUÍDO COM SUCESSO!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    
    if (stderr) {
      console.warn('⚠️ Avisos durante o deploy:');
      console.warn(stderr);
      console.log('');
    }
  });
  
  // Stream logs do deploy em tempo real
  deployProcess.stdout.on('data', (data) => {
    process.stdout.write(data);
  });
  
  deployProcess.stderr.on('data', (data) => {
    process.stderr.write(data);
  });
});

// Handler de ping (teste de webhook)
handler.on('ping', (event) => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🏓 Ping recebido do GitHub!');
  console.log(`   Hook ID: ${event.payload.hook_id}`);
  console.log(`   Zen: ${event.payload.zen}`);
  console.log('   ✅ Webhook configurado corretamente!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👋 Webhook listener encerrado');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👋 Webhook listener encerrado (SIGTERM)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  process.exit(0);
});
