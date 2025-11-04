const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function createTestUser() {
  try {
    // Usar um email de teste válido
    const testEmail = 'teste.kravmaga@gmail.com';
    const password = 'teste123';

    console.log(`👤 Criando usuário ${testEmail}...`);

    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: password
    });

    if (error) {
      console.log('❌ Erro:', error.message);
      console.log('');
      console.log('💡 Possíveis soluções:');
      console.log('1. Verifique as configurações de email no painel do Supabase');
      console.log('2. Use o painel do Supabase para criar usuários manualmente');
      console.log('3. Configure SMTP personalizado no Supabase');
      return;
    }

    console.log('✅ Usuário criado com sucesso!');
    console.log('📧 Email:', data.user.email);
    console.log('🆔 ID:', data.user.id);
    console.log('🔑 Senha:', password);
    console.log('');
    console.log('🔄 Agora teste o login no navegador com essas credenciais!');

  } catch (err) {
    console.error('❌ Erro inesperado:', err.message);
  }
}

createTestUser();