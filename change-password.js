const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('URL:', supabaseUrl);
console.log('Key (start):', supabaseServiceKey ? supabaseServiceKey.substring(0, 10) : 'undefined');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Lista todos os usuários do Supabase Auth
 */
async function listSupabaseUsers() {
  try {
    console.log('🔍 Buscando usuários do Supabase Auth...\n');

    const { data: users, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('❌ Erro ao listar usuários:', error.message);
      return [];
    }

    console.log(`📋 Usuários encontrados: ${users.users.length}\n`);
    users.users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (ID: ${user.id})`);
      console.log(`   Criado em: ${new Date(user.created_at).toLocaleString('pt-BR')}`);
      console.log(`   Último login: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('pt-BR') : 'Nunca'}\n`);
    });

    return users.users;
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    return [];
  }
}

/**
 * Altera a senha de um usuário específico
 */
async function changeUserPassword(email, newPassword) {
  try {
    console.log(`🔄 Alterando senha do usuário: ${email}`);

    // Primeiro, buscar o usuário
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('❌ Erro ao buscar usuários:', listError.message);
      return false;
    }

    const user = users.users.find(u => u.email === email);
    if (!user) {
      console.error(`❌ Usuário ${email} não encontrado no Supabase Auth`);
      return false;
    }

    // Alterar a senha
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: newPassword
    });

    if (updateError) {
      console.error('❌ Erro ao alterar senha:', updateError.message);
      return false;
    }

    console.log(`✅ Senha alterada com sucesso para: ${email}`);
    return true;

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    return false;
  }
}

/**
 * Cria um novo usuário no Supabase Auth
 */
async function createUser(email, password, userData = {}) {
  try {
    console.log(`👤 Criando usuário: ${email}`);

    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Confirma o email automaticamente
      user_metadata: userData
    });

    if (error) {
      console.error('❌ Erro ao criar usuário:', error.message);
      return null;
    }

    console.log(`✅ Usuário criado com sucesso: ${email} (ID: ${data.user.id})`);
    return data.user;

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    return null;
  }
}

// Função principal
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('📖 Uso:');
    console.log('  node change-password.js list                    # Lista todos os usuários');
    console.log('  node change-password.js change <email> <senha> # Altera senha de um usuário');
    console.log('  node change-password.js create <email> <senha> # Cria novo usuário');
    console.log('\n📝 Exemplos:');
    console.log('  node change-password.js change admin@academia.demo 123456');
    console.log('  node change-password.js create novo@exemplo.com senha123');
    return;
  }

  const command = args[0];

  switch (command) {
    case 'list':
      await listSupabaseUsers();
      break;

    case 'change':
      if (args.length < 3) {
        console.error('❌ Uso: node change-password.js change <email> <nova_senha>');
        return;
      }
      const email = args[1];
      const newPassword = args[2];
      await changeUserPassword(email, newPassword);
      break;

    case 'create':
      if (args.length < 3) {
        console.error('❌ Uso: node change-password.js create <email> <senha>');
        return;
      }
      const newEmail = args[1];
      const password = args[2];
      await createUser(newEmail, password);
      break;

    default:
      console.error('❌ Comando desconhecido. Use: list, change, ou create');
  }
}

main();