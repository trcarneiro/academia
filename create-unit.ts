import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createUnit() {
    console.log('🏢 Creating sample unit...');

    try {
        // First, get the organization
        const organization = await prisma.organization.findFirst();
        if (!organization) {
            throw new Error('No organization found. Please create an organization first.');
        }

        console.log(`🏛️ Using organization: ${organization.name} (ID: ${organization.id})`);

        // Check if unit already exists
        const existingUnit = await prisma.unit.findFirst({
            where: { organizationId: organization.id }
        });

        if (!existingUnit) {
            const unit = await prisma.unit.create({
                data: {
                    organizationId: organization.id,
                    name: 'Unidade Principal',
                    address: 'Rua das Artes Marciais, 123',
                    city: 'São Paulo',
                    state: 'SP',
                    zipCode: '01234-567',
                    phone: '(11) 1234-5678',
                    isActive: true
                }
            });
            console.log(`✅ Created unit: ${unit.name} (ID: ${unit.id})`);
        } else {
            console.log(`⚠️  Unit already exists: ${existingUnit.name} (ID: ${existingUnit.id})`);
        }

        // List all units
        const allUnits = await prisma.unit.findMany({
            include: {
                organization: {
                    select: { name: true }
                }
            }
        });

        console.log('\n🏢 All Units:');
        allUnits.forEach(unit => {
            console.log(`- ${unit.name} (Organization: ${unit.organization.name}, Active: ${unit.isActive})`);
        });

        console.log(`\n🎉 Process completed! Total units: ${allUnits.length}`);

    } catch (error) {
        console.error('❌ Error creating unit:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createUnit();