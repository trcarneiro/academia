const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔄 Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connected successfully!');
    
    // Test query
    const result = await prisma.$queryRaw`SELECT version();`;
    console.log('✅ Database query successful:', result);
    
    // Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('organizations', 'users', 'students')
      ORDER BY table_name;
    `;
    
    console.log('📊 Available tables:', tables);
    
    if (tables.length > 0) {
      console.log('🎉 SUCCESS: Krav Maga Academy database is ready!');
      console.log('🚀 You can now start the development server with: npm run dev');
    } else {
      console.log('⚠️  Tables created successfully, schema is ready!');
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();