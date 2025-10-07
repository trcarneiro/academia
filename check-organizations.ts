import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkOrganizations() {
  try {
    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        slug: true
      }
    });
    
    console.log('Organizations in database:');
    organizations.forEach((org, index) => {
      console.log(`${index + 1}. ID: ${org.id} | Name: ${org.name} | Slug: ${org.slug}`);
    });
    
    if (organizations.length === 0) {
      console.log('No organizations found in database!');
    }
  } catch (error) {
    console.error('Error checking organizations:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrganizations();
