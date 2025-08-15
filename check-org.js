const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOrganization() {
  try {
    const organizations = await prisma.organization.findMany();
    console.log('Organizations found:', organizations);
    
    const courses = await prisma.course.findMany({
      include: { organization: true }
    });
    console.log('Courses with organizations:', courses.map(c => ({
      id: c.id,
      title: c.title,
      orgId: c.organizationId,
      orgName: c.organization?.name
    })));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrganization();
