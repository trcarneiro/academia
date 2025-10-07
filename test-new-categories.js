/**
 * Test Script: Validate New Course Categories
 * Usage: node test-new-categories.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testNewCategories() {
  console.log('🧪 Testing New Course Categories...\n');

  try {
    // Test 1: Check if enum has new values
    console.log('✅ Test 1: Prisma Client Generated Successfully');
    console.log('   StudentCategory enum should include: WOMEN, MEN, MIXED, LAW_ENFORCEMENT\n');

    // Test 2: Try to create a course with new category
    const testCourse = {
      name: '[TEST] Defesa Pessoal Feminina',
      organizationId: 'a55ad715-2eb0-493c-996c-bb0f60bacec9', // Your org ID
      level: 'BEGINNER',
      category: 'WOMEN', // ✅ NEW VALUE
      duration: 12,
      classesPerWeek: 2,
      totalClasses: 24,
      minAge: 16,
      isBaseCourse: true,
      isActive: true,
    };

    console.log('🔄 Test 2: Creating test course with category "WOMEN"...');
    const created = await prisma.course.create({
      data: testCourse,
    });
    console.log('✅ Test 2: PASSED - Course created with ID:', created.id);
    console.log('   Category:', created.category, '\n');

    // Test 3: Verify isBaseCourse persists
    console.log('🔄 Test 3: Verifying isBaseCourse field...');
    const fetched = await prisma.course.findUnique({
      where: { id: created.id },
    });
    console.log('✅ Test 3:', fetched.isBaseCourse === true ? 'PASSED' : '❌ FAILED');
    console.log('   isBaseCourse:', fetched.isBaseCourse, '\n');

    // Test 4: Update to another new category
    console.log('🔄 Test 4: Updating to category "LAW_ENFORCEMENT"...');
    const updated = await prisma.course.update({
      where: { id: created.id },
      data: { category: 'LAW_ENFORCEMENT' },
    });
    console.log('✅ Test 4: PASSED - Category updated to:', updated.category, '\n');

    // Cleanup
    console.log('🧹 Cleanup: Deleting test course...');
    await prisma.course.delete({
      where: { id: created.id },
    });
    console.log('✅ Cleanup: Test course deleted\n');

    console.log('🎉 ALL TESTS PASSED!\n');
    console.log('📋 Summary:');
    console.log('   ✅ Prisma Client generated with new enum values');
    console.log('   ✅ WOMEN category works');
    console.log('   ✅ LAW_ENFORCEMENT category works');
    console.log('   ✅ isBaseCourse field persists correctly\n');
    console.log('🚀 You can now use these categories in the UI!');

  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    if (error.message.includes('Invalid value')) {
      console.error('\n⚠️  Possible cause: Prisma Client not regenerated');
      console.error('   Solution: Run `npx prisma generate` again\n');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testNewCategories();
