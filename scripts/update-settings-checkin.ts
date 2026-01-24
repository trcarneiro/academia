
import { prisma } from '@/utils/database';

async function main() {
    const orgId = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';

    console.log(`Updating settings for Org: ${orgId}`);

    const settings = await prisma.organizationSettings.upsert({
        where: { organizationId: orgId },
        update: {
            checkinWindowStart: 120, // 2 hours before
            checkinWindowEnd: 120,   // 2 hours after
        },
        create: {
            organizationId: orgId,
            checkinWindowStart: 120,
            checkinWindowEnd: 120,
            enableGamification: true,
            timezone: 'America/Sao_Paulo'
        }
    });

    console.log('✅ Settings updated:', settings);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
