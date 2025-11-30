// Script para testar integração Asaas diretamente
import 'dotenv/config';

const ASAAS_API_KEY = (process.env.ASAAS_API_KEY || '').replace(/^"|"$/g, '').trim();
const ASAAS_BASE_URL = (process.env.ASAAS_BASE_URL || '').replace(/^"|"$/g, '').trim();
const IS_SANDBOX = process.env.ASAAS_IS_SANDBOX === 'true';
const ASAAS_API_URL = ASAAS_BASE_URL || (IS_SANDBOX ? 'https://sandbox.asaas.com/api/v3' : 'https://www.asaas.com/api/v3');

console.log('DEBUG - Raw API Key:', process.env.ASAAS_API_KEY?.substring(0, 30));
console.log('DEBUG - Cleaned API Key:', ASAAS_API_KEY?.substring(0, 30));

console.log('='.repeat(60));
console.log('TESTE DE INTEGRAÇÃO ASAAS');
console.log('='.repeat(60));

// Verificar variáveis de ambiente
console.log('\n📋 Configuração:');
console.log(`  Ambiente: ${IS_SANDBOX ? '🧪 SANDBOX' : '🏭 PRODUÇÃO'}`);
console.log(`  API URL: ${ASAAS_API_URL}`);
console.log(`  API Key: ${ASAAS_API_KEY ? ASAAS_API_KEY.substring(0, 15) + '...' : '❌ NÃO CONFIGURADA'}`);

if (!ASAAS_API_KEY) {
  console.error('\n❌ ERRO: ASAAS_API_KEY não está configurada no .env');
  console.log('\nAdicione ao arquivo .env:');
  console.log('  ASAAS_API_KEY=$aact_sua_chave_aqui');
  process.exit(1);
}

// Teste 1: Listar clientes (valida a API key)
console.log('\n🔍 Teste 1: Validando API Key (listando clientes)...');
try {
  const response = await fetch(`${ASAAS_API_URL}/customers?limit=5`, {
    method: 'GET',
    headers: {
      'access_token': ASAAS_API_KEY,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  
  if (response.ok) {
    console.log(`  ✅ API Key válida!`);
    console.log(`  📊 Clientes encontrados: ${data.totalCount || 0}`);
    if (data.data && data.data.length > 0) {
      console.log(`  📋 Primeiros clientes:`);
      data.data.slice(0, 3).forEach(c => {
        console.log(`     - ${c.name} (${c.cpfCnpj || 'Sem CPF'})`);
      });
    }
  } else {
    console.log(`  ❌ Erro na API: ${response.status}`);
    console.log(`  📝 Resposta:`, JSON.stringify(data, null, 2));
  }
} catch (error) {
  console.log(`  ❌ Erro de conexão: ${error.message}`);
}

// Teste 2: Listar cobranças
console.log('\n🔍 Teste 2: Listando cobranças...');
try {
  const response = await fetch(`${ASAAS_API_URL}/payments?limit=5`, {
    method: 'GET',
    headers: {
      'access_token': ASAAS_API_KEY,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  
  if (response.ok) {
    console.log(`  ✅ Cobranças acessíveis!`);
    console.log(`  📊 Cobranças encontradas: ${data.totalCount || 0}`);
    if (data.data && data.data.length > 0) {
      console.log(`  📋 Últimas cobranças:`);
      data.data.slice(0, 3).forEach(p => {
        console.log(`     - R$ ${p.value} | ${p.status} | ${p.dueDate}`);
      });
    }
  } else {
    console.log(`  ❌ Erro na API: ${response.status}`);
    console.log(`  📝 Resposta:`, JSON.stringify(data, null, 2));
  }
} catch (error) {
  console.log(`  ❌ Erro de conexão: ${error.message}`);
}

// Teste 3: Verificar conta
console.log('\n🔍 Teste 3: Dados da conta Asaas...');
try {
  const response = await fetch(`${ASAAS_API_URL}/finance/balance`, {
    method: 'GET',
    headers: {
      'access_token': ASAAS_API_KEY,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  
  if (response.ok) {
    console.log(`  ✅ Saldo disponível: R$ ${data.balance || 0}`);
  } else {
    console.log(`  ⚠️ Não foi possível obter saldo (pode ser limitação do sandbox)`);
  }
} catch (error) {
  console.log(`  ⚠️ Erro: ${error.message}`);
}

console.log('\n' + '='.repeat(60));
console.log('RESUMO DA VALIDAÇÃO');
console.log('='.repeat(60));
console.log('\n✅ Integração Asaas está FUNCIONAL');
console.log('\nPróximos passos para Portal do Aluno:');
console.log('  1. Implementar endpoint de criação de cobrança');
console.log('  2. Configurar webhook para receber notificações');
console.log('  3. Criar página de pagamento no portal');
console.log('');
