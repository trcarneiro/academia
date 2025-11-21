import { prisma } from '../src/utils/database';

async function checkTasksAndInsights() {
  console.log('🔍 Checking Tasks and Insights...\n');

  try {
    // Check Tasks
    const tasks = await prisma.agentTask.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { agent: true }
    });

    console.log(`📋 Found ${tasks.length} tasks:`);
    tasks.forEach((task, i) => {
      console.log(`\n${i + 1}. ${task.title}`);
      console.log(`   Agent: ${task.agent?.name || 'Unknown'}`);
      console.log(`   Priority: ${task.priority}`);
      console.log(`   Status: ${task.approvalStatus}`);
      console.log(`   Created: ${task.createdAt}`);
    });

    // Check Insights
    console.log('\n\n💡 Checking Insights...\n');
    const insights = await prisma.agentInsight.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { agent: true }
    });

    console.log(`💡 Found ${insights.length} insights:`);
    insights.forEach((insight, i) => {
      console.log(`\n${i + 1}. ${insight.title}`);
      console.log(`   Agent: ${insight.agent?.name || 'Unknown'}`);
      console.log(`   Type: ${insight.type}`);
      console.log(`   Priority: ${insight.priority}`);
      console.log(`   Status: ${insight.status}`);
      console.log(`   Created: ${insight.createdAt}`);
    });

    if (insights.length === 0) {
      console.log('\n⚠️  No insights found in database!');
      console.log('   Insights should be created when agents execute with results.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTasksAndInsights();
