const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Usar a chave anônima para operações básicas
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

/**
 * Tenta fazer login com credenciais de teste
 */
async function testLogin(email, password) {
  try {
    console.log(`🔐 Tentando login com: ${email}`);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      console.log(`❌ Erro no login: ${error.message}`);
      return false;
    }

    console.log(`✅ Login bem-sucedido!`);
    console.log(`👤 Usuário: ${data.user.email}`);
    console.log(`🆔 ID: ${data.user.id}`);
    return true;

  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
    return false;
  }
}

/**
 * Tenta diferentes combinações de login
 */
async function testCommonCredentials() {
  const testUsers = [
    { email: 'admin@academia.demo', password: 'admin123' },
    { email: 'admin@academia.demo', password: '123456' },
    { email: 'admin@academia.demo', password: 'password' },
    { email: 'trcampos@gmail.com', password: 'admin123' },
    { email: 'trcampos@gmail.com', password: '123456' },
    { email: 'maria@academia.demo', password: '123456' },
    { email: 'joao@academia.demo', password: '123456' }
  ];

  console.log('🧪 Testando credenciais comuns...\n');

  for (const user of testUsers) {
    await testLogin(user.email, user.password);
    console.log(''); // linha em branco
  }
}

/**
 * Cria um usuário de teste (se possível)
 */
async function createTestUser() {
  try {
    console.log('👤 Tentando criar usuário de teste...');

    const { data, error } = await supabase.auth.signUp({
      email: 'teste@academia.demo',
      password: 'teste123'
    });

    if (error) {
      console.log(`❌ Erro ao criar usuário: ${error.message}`);
      return false;
    }

    console.log(`✅ Usuário criado: ${data.user.email}`);
    console.log('⚠️  IMPORTANTE: Verifique seu email para confirmar a conta!');
    return true;

  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
    return false;
  }
}

// Menu principal
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('📖 Comandos disponíveis:');
    console.log('  node test-login.js test     # Testa credenciais comuns');
    console.log('  node test-login.js create   # Cria usuário de teste');
    console.log('  node test-login.js login <email> <senha>  # Testa login específico');
    return;
  }

  const command = args[0];

  switch (command) {
    case 'test':
      await testCommonCredentials();
      break;

    case 'create':
      await createTestUser();
      break;

    case 'login':
      if (args.length < 3) {
        console.error('❌ Uso: node test-login.js login <email> <senha>');
        return;
      }
      await testLogin(args[1], args[2]);
      break;

    default:
      console.error('❌ Comando desconhecido');
  }
}

main();