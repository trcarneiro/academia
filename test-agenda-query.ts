import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAgendaQuery() {
    console.log('🔍 Testing AgendaItem query...');

    try {
        // Test basic query first
        console.log('1. Testing basic findMany...');
        const basicItems = await prisma.agendaItem.findMany({
            take: 2
        });
        console.log(`✅ Found ${basicItems.length} items`);
        basicItems.forEach(item => {
            console.log(`- ${item.title} (${item.type})`);
        });

        // Test with relations
        console.log('\n2. Testing with instructor relation...');
        const itemsWithInstructor = await prisma.agendaItem.findMany({
            take: 2,
            include: {
                instructor: {
                    select: {
                        firstName: true,
                        lastName: true,
                    }
                }
            }
        });
        console.log(`✅ Found ${itemsWithInstructor.length} items with instructor`);
        itemsWithInstructor.forEach(item => {
            console.log(`- ${item.title}: ${item.instructor.firstName} ${item.instructor.lastName}`);
        });

        // Test count
        console.log('\n3. Testing count...');
        const total = await prisma.agendaItem.count();
        console.log(`✅ Total AgendaItems: ${total}`);

        console.log('\n🎉 All tests passed!');

    } catch (error) {
        console.error('❌ Error:', error);
        if (error instanceof Error) {
            console.error('Message:', error.message);
            console.error('Stack:', error.stack);
        }
    } finally {
        await prisma.$disconnect();
    }
}

testAgendaQuery();