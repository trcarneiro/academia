import { prisma } from '../../src/utils/database';
import * as dotenv from 'dotenv';
import path from 'path';

// Force load env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function run() {
    console.log('🧪 Iniciando teste simplificado...');
    try {
        const org = await prisma.organization.findFirst();
        if (!org) {
            console.error('❌ Nenhuma organização encontrada');
            return;
        }
        console.log(`🏢 Org encontrada: ${org.name}`);

        const lead = await prisma.lead.create({
            data: {
                name: `Test Lead ${Date.now()}`,
                email: `test.lead.${Date.now()}@example.com`,
                phone: '11999998888',
                organizationId: org.id,
                stage: 'NEW'
            }
        });
        console.log(`✅ Lead criado com sucesso: ${lead.id}`);
    } catch (e: any) {
        console.error('❌ ERRO:', e.message);
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
run();
