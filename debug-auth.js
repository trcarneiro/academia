const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkUserStatus() {
  try {
    console.log('🔍 Verificando usuários no Supabase Auth...\n');

    // Tentar listar usuários (usando service key se disponível)
    const serviceSupabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);

    try {
      const { data: users, error } = await serviceSupabase.auth.admin.listUsers();

      if (error) {
        console.log('❌ Não foi possível listar usuários (precisa chave de serviço)');
        console.log('Erro:', error.message);
      } else {
        console.log('📋 Usuários encontrados:', users.users.length);
        users.users.forEach((user, index) => {
          console.log(`${index + 1}. ${user.email} - Confirmado: ${user.email_confirmed_at ? '✅' : '❌'} - ID: ${user.id}`);
        });
      }
    } catch (err) {
      console.log('❌ Erro ao listar usuários:', err.message);
    }

    console.log('\n🔐 Testando login com trcampos@gmail.com...');

    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'trcampos@gmail.com',
      password: 'admin123'
    });

    if (error) {
      console.log('❌ Erro no login:', error.message);
      console.log('💡 Possíveis causas:');
      console.log('1. Usuário não existe');
      console.log('2. Email não confirmado');
      console.log('3. Senha incorreta');
      console.log('4. Conta desabilitada');
    } else {
      console.log('✅ Login realizado com sucesso!');
      console.log('📧 Email:', data.user.email);
      console.log('🆔 ID:', data.user.id);
      console.log('📅 Criado em:', new Date(data.user.created_at).toLocaleString('pt-BR'));
    }

  } catch (err) {
    console.error('❌ Erro inesperado:', err.message);
  }
}

checkUserStatus();