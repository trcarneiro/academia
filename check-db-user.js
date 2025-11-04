const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function confirmUserInDatabase() {
  try {
    console.log('🔍 Procurando usuário trcampos@gmail.com no banco...\n');

    // Verificar se existe algum registro relacionado ao auth do Supabase
    // O Supabase armazena dados de auth em tabelas separadas, mas vamos verificar se há alguma tabela de usuários

    const users = await prisma.user.findMany({
      where: {
        email: 'trcampos@gmail.com'
      }
    });

    console.log('📋 Usuários encontrados no banco local:', users.length);

    users.forEach(user => {
      console.log(`- ${user.email} (ID: ${user.id}, Role: ${user.role})`);
    });

    if (users.length > 0) {
      console.log('\n✅ Usuário existe no banco local!');
      console.log('💡 O problema é que o Supabase Auth requer confirmação de email');
      console.log('🔧 Soluções possíveis:');
      console.log('1. Confirmar email no painel do Supabase');
      console.log('2. Desabilitar confirmação de email no projeto Supabase');
      console.log('3. Usar uma conta Gmail para teste');
      console.log('4. Modificar frontend para desenvolvimento');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

confirmUserInDatabase();