const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testTechniqueCreation() {
  try {
    console.log('🧪 Testing technique creation...');
    
    // Try to create a simple technique
    const technique = await prisma.technique.create({
      data: {
        id: 'test-technique-001',
        name: 'Test Technique',
        description: 'Test technique description',
        category: 'TECHNIQUE',
        difficulty: 1,
        objectives: [],
        resources: [],
        stepByStep: [],
        assessmentCriteria: [],
        risksMitigation: [],
        bnccCompetencies: [],
        tags: [],
        references: [],
        prerequisites: [],
        instructions: []
      }
    });
    
    console.log('✅ Technique created successfully:', technique);
    
    // Count techniques after creation
    const count = await prisma.technique.count();
    console.log('📊 Total techniques after creation:', count);
    
    // Clean up - delete the test technique
    await prisma.technique.delete({
      where: { id: 'test-technique-001' }
    });
    
    console.log('🧹 Test technique deleted');
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error testing technique creation:', error);
    process.exit(1);
  }
}

testTechniqueCreation();
