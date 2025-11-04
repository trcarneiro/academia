const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Usar a chave de service role para operações administrativas
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_KEY exists:', !!process.env.SUPABASE_SERVICE_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function resetTrcamposPassword() {
  try {
    const email = 'trcampos@gmail.com';
    const newPassword = 'admin123';

    console.log(`🔄 Resetando senha do usuário ${email}...`);

    // Primeiro, buscar o usuário pelo email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.log('❌ Erro ao listar usuários:', listError.message);
      return;
    }

    const user = users.users.find(u => u.email === email);

    if (!user) {
      console.log('❌ Usuário não encontrado');
      return;
    }

    console.log('👤 Usuário encontrado:', user.id);

    // Resetar a senha
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      password: newPassword
    });

    if (error) {
      console.log('❌ Erro ao resetar senha:', error.message);
      return;
    }

    console.log('✅ Senha resetada com sucesso!');
    console.log('📧 Email:', email);
    console.log('🔑 Nova senha:', newPassword);
    console.log('');
    console.log('🔄 Agora você pode fazer login com essas credenciais!');

  } catch (err) {
    console.error('❌ Erro inesperado:', err.message);
  }
}

resetTrcamposPassword();