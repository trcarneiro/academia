import { prisma } from '@/utils/database';
import { AuthorizationService } from '@/services/authorizationService';

async function main() {
    const authService = new AuthorizationService();
    const adminUser = await prisma.user.findFirst({
        where: { email: 'admin@smartdefence.com.br' },
        select: { id: true, email: true, firstName: true, lastName: true }
    });

    if (!adminUser) {
        console.error('Admin user not found. Run prisma/seed-smart-defence.ts first.');
        process.exit(1);
    }

    const permission = await authService.canCreateAgent(adminUser.id);
    console.log('User:', adminUser);
    console.log('canCreateAgent:', permission);
    if (!permission.allowed) {
        throw new Error(`Expected admin to create agents, but got: ${permission.reason}`);
    }
}

main()
    .catch((error) => {
        console.error('Verification failed:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
