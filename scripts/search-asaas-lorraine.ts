import 'dotenv/config';

async function searchLorraine() {
  const apiKey = process.env.ASAAS_API_KEY;
  const baseUrl = process.env.ASAAS_BASE_URL || 'https://www.asaas.com/api/v3';
  
  console.log('🔍 Buscando Lorraine no Asaas...\n');
  
  try {
    const response = await fetch(`${baseUrl}/customers?name=Lorraine`, {
      headers: {
        'access_token': apiKey!
      }
    });
    
    const data = await response.json();
    
    console.log('📊 Resultado da busca:');
    console.log('Total:', data.totalCount);
    
    if (data.data && data.data.length > 0) {
      data.data.forEach((c: any) => {
        console.log(`\n👤 ${c.name}`);
        console.log(`   ID: ${c.id}`);
        console.log(`   Email: ${c.email || 'N/A'}`);
        console.log(`   Telefone: ${c.mobilePhone || c.phone || 'N/A'}`);
        console.log(`   CPF: ${c.cpfCnpj || 'N/A'}`);
      });
    } else {
      console.log('❌ Nenhum cliente encontrado com esse nome');
    }
    
  } catch (error) {
    console.error('Erro:', error);
  }
}

searchLorraine();
