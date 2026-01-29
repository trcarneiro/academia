
import { prisma } from '../src/utils/database';

async function testCreate() {
    try {
        console.log('🧪 Testing Technique creation with prerequisites...');
        const tech = await prisma.technique.create({
            data: {
                name: "Test Technique " + Date.now(),
                prerequisites: [],
                objectives: [],
                resources: [],
                assessmentCriteria: [],
                risksMitigation: [],
                tags: [],
                references: [],
                instructions: [],
                stepByStep: [],
                bnccCompetencies: []
            } as any
        });
        console.log('✅ Success!', tech.id);
    } catch (error: any) {
        console.log('❌ Error Info:');
        console.log(error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testCreate();
