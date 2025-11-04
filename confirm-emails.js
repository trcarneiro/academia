const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Usar service key para configurações administrativas
const serviceSupabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function configureAutoConfirm() {
  try {
    console.log('🔧 Configurando auto-confirmação de emails...');

    // Tentar confirmar o usuário existente
    const { data: users, error: listError } = await serviceSupabase.auth.admin.listUsers();

    if (listError) {
      console.log('❌ Não foi possível listar usuários:', listError.message);
      console.log('💡 Solução: Configure manualmente no painel do Supabase');
      console.log('   1. Acesse: https://supabase.com/dashboard/project/yawfuymgwukericlhgxh/auth/settings');
      console.log('   2. Desative "Enable email confirmations"');
      console.log('   3. Salve as configurações');
      return;
    }

    console.log('📋 Usuários encontrados:', users.users.length);

    // Encontrar e confirmar usuários
    const usersToConfirm = ['teste.kravmaga.dev@gmail.com', 'trcampos@gmail.com'];

    for (const email of usersToConfirm) {
      const user = users.users.find(u => u.email === email);

      if (user) {
        console.log(`👤 Usuário encontrado: ${user.email}`);

        if (!user.email_confirmed_at) {
          const { error: confirmError } = await serviceSupabase.auth.admin.updateUserById(user.id, {
            email_confirm: true
          });

          if (confirmError) {
            console.log('❌ Erro ao confirmar email:', confirmError.message);
          } else {
            console.log('✅ Email confirmado com sucesso!');
          }
        } else {
          console.log('✅ Email já estava confirmado');
        }
      } else {
        console.log(`❌ Usuário ${email} não encontrado`);
      }
    }

    // Testar login após confirmação
    console.log('\n🔐 Testando login...');
    const clientSupabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

    const { data: loginData, error: loginError } = await clientSupabase.auth.signInWithPassword({
      email: 'teste.kravmaga.dev@gmail.com',
      password: 'teste123'
    });

    if (loginError) {
      console.log('❌ Erro no login:', loginError.message);
    } else {
      console.log('✅ Login realizado com sucesso!');
      console.log('📧 Email:', loginData.user.email);
    }

  } catch (err) {
    console.error('❌ Erro inesperado:', err.message);
  }
}

configureAutoConfirm();