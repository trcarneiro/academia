// Test database connection
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔄 Testando conexão com banco...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Test query
    const orgsCount = await prisma.organization.count();
    console.log(`📊 Organizações no banco: ${orgsCount}`);
    
    const studentsCount = await prisma.student.count();
    console.log(`👥 Alunos no banco: ${studentsCount}`);
    
    const techniquesCount = await prisma.technique.count();
    console.log(`🥋 Técnicas no banco: ${techniquesCount}`);
    
    console.log('🎯 Banco de dados 100% operacional!');
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();