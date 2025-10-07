import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTrainingAreas() {
    console.log('🏃 Creating sample training areas...');

    // First, get a unit to associate with the training areas
    const unit = await prisma.unit.findFirst();
    if (!unit) {
        throw new Error('No unit found. Please create a unit first.');
    }

    console.log(`📍 Using unit: ${unit.name} (ID: ${unit.id})`);

    const trainingAreas = [
        {
            unitId: unit.id,
            name: 'Área Principal',
            description: 'Área principal de treinamento com tatame',
            capacity: 20,
            areaType: 'TRAINING',
            equipment: ['Tatame', 'Espelhos', 'Sistema de Som'],
            flooring: 'Tatame',
            isActive: true
        },
        {
            unitId: unit.id,
            name: 'Sala de Musculação',
            description: 'Sala com equipamentos de musculação',
            capacity: 15,
            areaType: 'GYM',
            equipment: ['Halteres', 'Máquinas', 'Barras'],
            flooring: 'Emborrachado',
            isActive: true
        },
        {
            unitId: unit.id,
            name: 'Área Externa',
            description: 'Área externa para treinamentos ao ar livre',
            capacity: 25,
            areaType: 'OUTDOOR',
            equipment: ['Aparelhos de Calistenia', 'Pista de Corrida'],
            flooring: 'Grama Sintética',
            isActive: true
        },
        {
            unitId: unit.id,
            name: 'Sala de Condicionamento',
            description: 'Sala específica para condicionamento físico',
            capacity: 12,
            areaType: 'FITNESS',
            equipment: ['Cordas', 'Medicine Balls', 'Kettlebells'],
            flooring: 'Emborrachado',
            isActive: true
        }
    ];

    try {
        // Create training areas
        for (const area of trainingAreas) {
            const existingArea = await prisma.trainingArea.findFirst({
                where: { name: area.name }
            });

            if (!existingArea) {
                const created = await prisma.trainingArea.create({
                    data: area
                });
                console.log(`✅ Created training area: ${created.name} (ID: ${created.id})`);
            } else {
                console.log(`⚠️  Training area already exists: ${area.name}`);
            }
        }

        // List all training areas
        const allAreas = await prisma.trainingArea.findMany({
            orderBy: { name: 'asc' }
        });

        console.log('\n📍 All Training Areas:');
        allAreas.forEach(area => {
            console.log(`- ${area.name} (Capacity: ${area.capacity}, Active: ${area.isActive})`);
        });

        console.log(`\n🎉 Process completed! Total areas: ${allAreas.length}`);

    } catch (error) {
        console.error('❌ Error creating training areas:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createTrainingAreas();