
import { prisma } from '@/utils/database';
import { GamificationService } from '@/services/gamificationService';

async function main() {
    console.log('🌱 Seeding Gamification Achievements...');

    const orgs = await prisma.organization.findMany();
    console.log(`Found ${orgs.length} organizations.`);

    for (const org of orgs) {
        console.log(`Processing org: ${org.name} (${org.id})`);
        try {
            await GamificationService.createDefaultAchievements(org.id);
            console.log(`✅ Seeded achievements for ${org.name}`);
        } catch (e) {
            console.error(`❌ Failed for ${org.name}:`, e);
        }
    }

    console.log('Done.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
