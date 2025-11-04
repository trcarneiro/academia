const https = require('https');
require('dotenv').config();

async function confirmEmailViaAPI() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      email: 'trcampos@gmail.com',
      password: 'admin123'
    });

    const options = {
      hostname: 'yawfuymgwukericlhgxh.supabase.co',
      port: 443,
      path: '/auth/v1/signup',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
      }
    };

    console.log('🔧 Tentando signup via API REST...');

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('📧 Resposta:', JSON.stringify(response, null, 2));

          if (response.user) {
            console.log('✅ Usuário criado via API!');
            console.log('🆔 ID:', response.user.id);
            console.log('📧 Email confirmado:', response.user.email_confirmed_at ? 'Sim' : 'Não');
          } else if (response.error) {
            console.log('❌ Erro:', response.error.message);
          }

          resolve(response);
        } catch (err) {
          console.error('❌ Erro ao parsear resposta:', err);
          reject(err);
        }
      });
    });

    req.on('error', (err) => {
      console.error('❌ Erro na requisição:', err);
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

async function testLoginAfterSignup() {
  // Aguardar um pouco
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('\n🔐 Testando login após signup...');

  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'trcampos@gmail.com',
    password: 'admin123'
  });

  if (error) {
    console.log('❌ Login falhou:', error.message);
  } else {
    console.log('✅ Login realizado com sucesso!');
    console.log('📧 Email:', data.user.email);
    console.log('🆔 ID:', data.user.id);
  }
}

async function main() {
  try {
    await confirmEmailViaAPI();
    await testLoginAfterSignup();
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

main();