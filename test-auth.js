const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testGoogleOAuth() {
  try {
    console.log('🔍 Testando configuração do Google OAuth...\n');

    // Tentar fazer login com Google (isso vai redirecionar)
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000'
      }
    });

    if (error) {
      console.log('❌ Erro no Google OAuth:', error.message);
      console.log('');
      console.log('💡 Possíveis causas:');
      console.log('1. Google OAuth não está configurado no painel do Supabase');
      console.log('2. As credenciais do Google não estão corretas');
      console.log('3. O domínio não está autorizado no Google Console');
      console.log('');
      console.log('🔧 Para configurar:');
      console.log('1. Acesse https://supabase.com/dashboard/project/yawfuymgwukericlhgxh/auth/providers');
      console.log('2. Ative o Google provider');
      console.log('3. Configure as credenciais do Google Console');
      return;
    }

    console.log('✅ Google OAuth configurado corretamente!');
    console.log('🔗 URL de autorização:', data.url);

  } catch (err) {
    console.error('❌ Erro inesperado:', err.message);
  }
}

async function testEmailLogin() {
  try {
    console.log('\n📧 Testando login por email...\n');

    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'trcampos@gmail.com',
      password: 'admin123'
    });

    if (error) {
      console.log('❌ Erro no login por email:', error.message);
      return;
    }

    console.log('✅ Login por email realizado com sucesso!');
    console.log('📧 Email:', data.user.email);
    console.log('🆔 ID:', data.user.id);

  } catch (err) {
    console.error('❌ Erro inesperado:', err.message);
  }
}

async function main() {
  console.log('🚀 Testando autenticação do Supabase...\n');

  await testEmailLogin();
  await testGoogleOAuth();

  console.log('\n📋 Resumo:');
  console.log('- ✅ Login por email: trcampos@gmail.com / admin123');
  console.log('- ⚠️  Google OAuth: Precisa ser configurado no painel do Supabase');
  console.log('\n🔄 Teste o login por email primeiro, depois configure o Google!');
}

main();