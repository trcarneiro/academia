const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Usar a chave de service role para operações administrativas
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function resetPasswordViaEmail() {
  try {
    const email = 'trcampos@gmail.com';

    console.log(`📧 Enviando email de reset de senha para ${email}...`);

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:3000/reset-password'
    });

    if (error) {
      console.log('❌ Erro ao enviar email:', error.message);
      return;
    }

    console.log('✅ Email de reset enviado com sucesso!');
    console.log('📧 Verifique a caixa de entrada de:', email);
    console.log('🔗 O link de reset irá redirecionar para a aplicação');

  } catch (err) {
    console.error('❌ Erro inesperado:', err.message);
  }
}

resetPasswordViaEmail();