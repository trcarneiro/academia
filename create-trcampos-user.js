const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Usar a chave anônima para operações básicas
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function createUserTrcampos() {
  try {
    const email = 'trcampos@gmail.com';
    const password = 'admin123';

    console.log(`👤 Criando usuário ${email} no Supabase Auth...`);

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password
    });

    if (error) {
      console.log('❌ Erro ao criar usuário:', error.message);

      // Se o usuário já existe, tentar fazer login
      if (error.message.includes('already registered')) {
        console.log('🔄 Usuário já existe, tentando login...');
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password
        });

        if (loginError) {
          console.log('❌ Erro no login:', loginError.message);
          return;
        }

        console.log('✅ Login realizado com sucesso!');
        console.log('📧 Email:', loginData.user.email);
        console.log('🆔 ID:', loginData.user.id);
      }
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

createUserTrcampos();