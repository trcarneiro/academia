const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Usar a chave anônima para operações básicas
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testTrcamposLogin() {
  try {
    const email = 'trcampos@gmail.com';
    const password = 'admin123';

    console.log(`🔐 Testando login para ${email}...`);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      console.log('❌ Erro no login:', error.message);
      console.log('🔍 Código do erro:', error.status);

      if (error.message.includes('Invalid login credentials')) {
        console.log('💡 Solução: A senha pode estar incorreta ou o usuário precisa confirmar o email');
        console.log('🔗 Acesse: https://supabase.com/dashboard/project/yawfuymgwukericlhgxh/auth/users');
        console.log('👤 Procure o usuário trcampos@gmail.com e clique em "Reset Password"');
      }

      return;
    }

    console.log('✅ Login realizado com sucesso!');
    console.log('📧 Email:', data.user.email);
    console.log('🆔 ID:', data.user.id);
    console.log('🔑 Token gerado:', !!data.session?.access_token);

  } catch (err) {
    console.error('❌ Erro inesperado:', err.message);
  }
}

testTrcamposLogin();