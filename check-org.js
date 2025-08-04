const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const orgs = await prisma.organization.findMany();
  console.log('Organizations:', orgs.length);
  orgs.forEach(org => {
    console.log(`- ${org.name} (${org.id})`);
  });
  
  const courses = await prisma.course.findMany();
  console.log('\nCourses:', courses.length);
  courses.forEach(course => {
    console.log(`- ${course.name} (org: ${course.organizationId})`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
