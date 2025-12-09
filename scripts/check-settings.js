const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
    const settings = await p.organizationSettings.findFirst();
    console.log('Settings:', JSON.stringify(settings, null, 2));
    await p.$disconnect();
}

main();
