
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando limpeza de turmas de teste...');

  const deleteResult = await prisma.turma.deleteMany({
    where: {
      name: 'TURMA TESTE CHECKIN (15min)'
    }
  });

  console.log(`Removidas ${deleteResult.count} turmas de teste e suas aulas associadas.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
