import 'dotenv/config';
import { prisma } from '../src/utils/database.js';

async function check() {
  console.log('🔍 Buscando Lorraine no sistema...\n');
  
  // Buscar por Lorraine no sistema
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { firstName: { contains: 'Lorraine', mode: 'insensitive' } },
        { lastName: { contains: 'Lorraine', mode: 'insensitive' } },
        { email: { contains: 'lorraine', mode: 'insensitive' } }
      ]
    },
    select: { id: true, firstName: true, lastName: true, email: true, organizationId: true }
  });
  
  console.log('📊 Usuários encontrados:', users.length);
  if (users.length > 0) {
    users.forEach(u => console.log(`  - ${u.firstName} ${u.lastName} | ${u.email}`));
  } else {
    console.log('  ❌ Nenhum usuário com "Lorraine" encontrado');
  }
  
  // Buscar por email específico
  console.log('\n🔍 Buscando por email lorrainechrissouza@gmail.com...');
  const byEmail = await prisma.user.findFirst({
    where: { email: 'lorrainechrissouza@gmail.com' }
  });
  
  if (byEmail) {
    console.log('  ✅ Encontrado:', byEmail.firstName, byEmail.lastName);
  } else {
    console.log('  ❌ Email não encontrado no sistema');
  }
  
  await prisma.$disconnect();
}

check().catch(console.error);
