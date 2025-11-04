const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Usar a chave anônima para operações básicas
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function recreateTrcamposUser() {
  try {
    const email = 'trcampos@gmail.com';
    const password = 'admin123';

    console.log(`🗑️  Tentando deletar usuário existente ${email}...`);

    // Primeiro tentar deletar se existir (usando service key se disponível)
    try {
      const adminSupabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
      const { data: users } = await adminSupabase.auth.admin.listUsers();
      const user = users?.users?.find(u => u.email === email);

      if (user) {
        console.log('👤 Usuário encontrado, deletando...');
        await adminSupabase.auth.admin.deleteUser(user.id);
        console.log('✅ Usuário deletado com sucesso!');
      }
    } catch (error) {
      console.log('⚠️  Não foi possível deletar via admin API, continuando...');
    }

    console.log(`👤 Criando novo usuário ${email}...`);

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password
    });

    if (error) {
      console.log('❌ Erro ao criar usuário:', error.message);
      return;
    }

    console.log('✅ Usuário criado com sucesso!');
    console.log('📧 Email:', data.user.email);
    console.log('🆔 ID:', data.user.id);
    console.log('🔑 Senha:', password);
    console.log('');
    console.log('🔄 Agora você pode fazer login com essas credenciais!');

  } catch (err) {
    console.error('❌ Erro inesperado:', err.message);
  }
}

recreateTrcamposUser();