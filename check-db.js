const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    // Count techniques and activities
    const techniqueCount = await prisma.technique.count();
    const activityCount = await prisma.activity.count();
    const activitiesWithTechnique = await prisma.activity.count({
      where: { refTechniqueId: { not: null } }
    });
    
    console.log('📊 Database Statistics:');
    console.log('• Total Techniques:', techniqueCount);
    console.log('• Total Activities:', activityCount);
    console.log('• Activities linked to Techniques:', activitiesWithTechnique);
    console.log('• Activities without Technique link:', activityCount - activitiesWithTechnique);
    
    // Sample activities
    const activities = await prisma.activity.findMany({
      take: 5,
      select: {
        id: true,
        title: true,
        refTechniqueId: true,
        type: true
      }
    });
    
    console.log('\n🔍 Sample Activities:');
    activities.forEach(act => {
      console.log(`• ${act.title} (Type: ${act.type}, RefTechnique: ${act.refTechniqueId || 'none'})`);
    });
    
    // Try to find any techniques
    if (techniqueCount > 0) {
      const techniques = await prisma.technique.findMany({
        take: 5,
        select: {
          id: true,
          name: true,
          category: true
        }
      });
      
      console.log('\n🔍 Sample Techniques:');
      techniques.forEach(tech => {
        console.log(`• ${tech.name} (ID: ${tech.id}, Category: ${tech.category})`);
      });
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkDatabase();
