const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function recreateTestUser() {
  try {
    console.log('🔄 Recriando usuário de teste...');

    // Primeiro tentar deletar se existir (não funciona com anon key, mas vamos tentar)
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: 'teste.kravmaga.dev@gmail.com',
      password: 'teste123'
    });

    if (signupError) {
      console.log('⚠️  Erro no signup (pode ser que já exista):', signupError.message);
    } else {
      console.log('✅ Usuário criado/rec criado!');
    }

    console.log('');
    console.log('🎯 Agora teste no navegador:');
    console.log('   URL: http://localhost:3000');
    console.log('   Email: teste.kravmaga.dev@gmail.com');
    console.log('   Senha: teste123');
    console.log('');
    console.log('🔍 Abra o console do navegador (F12) para ver os logs detalhados');
    console.log('📋 Procure por mensagens como:');
    console.log('   - "🔵 Iniciando login com Google..."');
    console.log('   - "🔄 Verificando callback de autenticação..."');
    console.log('   - "✅ Login com Google realizado"');

  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

recreateTestUser();