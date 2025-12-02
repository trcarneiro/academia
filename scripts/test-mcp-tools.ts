/**
 * Test MCP Database Tool
 */
import 'dotenv/config';
import { DatabaseTool } from '../src/services/mcp/databaseTool';
import { prisma } from '../src/utils/database';

const ORG_ID = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';

async function main() {
  console.log('🔧 Testing DatabaseTool queries...\n');
  
  // Test 1: attendance_rate
  console.log('1. Testing attendance_rate...');
  try {
    const result = await DatabaseTool.executeQuery('attendance_rate', ORG_ID, {});
    console.log('   ✅ Result:', JSON.stringify(result, null, 2));
  } catch (e: any) {
    console.error('   ❌ Error:', e.message);
  }
  
  // Test 2: popular_plans
  console.log('\n2. Testing popular_plans...');
  try {
    const result = await DatabaseTool.executeQuery('popular_plans', ORG_ID, {});
    console.log('   ✅ Result:', JSON.stringify(result, null, 2));
  } catch (e: any) {
    console.error('   ❌ Error:', e.message);
  }
  
  // Test 3: overdue_payments
  console.log('\n3. Testing overdue_payments...');
  try {
    const result = await DatabaseTool.executeQuery('overdue_payments', ORG_ID, {});
    console.log('   ✅ Result:', JSON.stringify(result, null, 2));
  } catch (e: any) {
    console.error('   ❌ Error:', e.message);
  }
  
  // Test 4: inactive_students
  console.log('\n4. Testing inactive_students...');
  try {
    const result = await DatabaseTool.executeQuery('inactive_students', ORG_ID, {});
    console.log('   ✅ Result:', JSON.stringify(result, null, 2));
  } catch (e: any) {
    console.error('   ❌ Error:', e.message);
  }
  
  // Test 5: Basic counts
  console.log('\n5. Testing basic counts...');
  try {
    const [students, turmas, courses, leads] = await Promise.all([
      prisma.student.count({ where: { organizationId: ORG_ID } }),
      prisma.turma.count({ where: { organizationId: ORG_ID } }),
      prisma.course.count({ where: { organizationId: ORG_ID } }),
      prisma.lead.count({ where: { organizationId: ORG_ID } })
    ]);
    console.log(`   ✅ Students: ${students}, Turmas: ${turmas}, Courses: ${courses}, Leads: ${leads}`);
  } catch (e: any) {
    console.error('   ❌ Error:', e.message);
  }
  
  console.log('\n✅ Tests completed!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
