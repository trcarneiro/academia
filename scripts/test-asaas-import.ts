import { PrismaClient } from '@prisma/client';
import FinancialResponsibleService from '../src/services/financialResponsibleService';

const prisma = new PrismaClient();

async function testAsaasImport() {
  console.log('🧪 Testing Asaas Customer Import with Mock Data...\n');
  
  try {
    // Get organization ID (from our minimal data)
    const organization = await prisma.organization.findFirst();
    if (!organization) {
      throw new Error('No organization found. Run create-minimal-data script first.');
    }
    
    console.log(`📦 Using organization: ${organization.name}`);
    
    // Initialize the service
    const service = new FinancialResponsibleService(organization.id);
    
    // Mock Asaas customer data (what would normally come from the API)
    const timestamp = Date.now();
    const mockAsaasCustomer = {
      id: `cus_${timestamp}`,
      object: 'customer',
      dateCreated: '2025-06-28',
      name: `João Silva Santos ${timestamp}`,
      email: `joao.silva.${timestamp}@email.com`,
      cpfCnpj: `${timestamp.toString().slice(-11)}`,
      phone: '11987654321',
      mobilePhone: '11987654321',
      address: 'Rua das Flores, 123',
      addressNumber: '123',
      complement: 'Apto 45',
      province: 'Vila Madalena',
      city: 'São Paulo',
      state: 'SP',
      postalCode: '01234-567'
    };
    
    console.log('👤 Mock Asaas Customer Data:');
    console.log(`   Name: ${mockAsaasCustomer.name}`);
    console.log(`   Email: ${mockAsaasCustomer.email}`);
    console.log(`   CPF: ${mockAsaasCustomer.cpfCnpj}`);
    console.log(`   Phone: ${mockAsaasCustomer.phone}`);
    console.log(`   Address: ${mockAsaasCustomer.address}, ${mockAsaasCustomer.addressNumber}`);
    console.log(`   City: ${mockAsaasCustomer.city} - ${mockAsaasCustomer.state}\n`);
    
    // Temporarily override the AsaasService.getCustomer method for testing
    const originalGetCustomer = service['asaasService'].getCustomer;
    service['asaasService'].getCustomer = async (customerId: string) => {
      console.log(`🌐 [MOCK] Fetching customer ${customerId} from Asaas API...`);
      if (customerId === mockAsaasCustomer.id) {
        return mockAsaasCustomer as any;
      }
      throw new Error('Customer not found');
    };
    
    // Test the import functionality
    console.log('📥 Importing customer from Asaas...');
    const importData = {
      asaasCustomerId: mockAsaasCustomer.id,
      relationshipType: 'Responsável Principal'
    };
    
    const result = await service.importAsaasCustomer(importData);
    
    console.log('✅ Import successful!');
    console.log(`   Created Financial Responsible ID: ${result.id}`);
    console.log(`   Name: ${result.name}`);
    console.log(`   Email: ${result.email}`);
    console.log(`   Asaas ID: ${result.asaasId}`);
    
    // Show financial responsibles list
    console.log('\n📋 All Financial Responsibles:');
    const responsibles = await service.listFinancialResponsibles();
    responsibles.forEach((responsible, index) => {
      console.log(`   ${index + 1}. ${responsible.name} (${responsible.email})`);
      console.log(`      CPF: ${responsible.cpfCnpj}`);
      console.log(`      Asaas ID: ${responsible.asaasId || 'N/A'}`);
      console.log(`      Students: ${responsible._count.students}`);
      console.log(`      Subscriptions: ${responsible._count.subscriptions}`);
      console.log('');
    });
    
    console.log('🎯 Test completed successfully!');
    console.log('💡 To use real Asaas data, update the ASAAS_API_KEY in .env with a valid key.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    if (error instanceof Error && error.message.includes('ASAAS_API_KEY')) {
      console.log('\n💡 Note: This error is expected if you don\'t have a valid Asaas API key.');
      console.log('   The mock data import would work fine with a real API key.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testAsaasImport().catch(console.error);