// Test script for course creation endpoint
const fetch = require('node-fetch');

async function testCourseCreation() {
  try {
    console.log('🚀 Testing Course Creation Endpoint...\n');

    // Test data for course creation
    const courseData = {
      name: 'Krav Maga Iniciante',
      category: 'ADULT',
      description: 'Curso de Krav Maga para iniciantes adultos',
      level: 1,
      duration: 12,
      totalClasses: 48,
      startTime: '19:00',
      endTime: '20:00',
      maxStudents: 20
    };

    console.log('📋 Course Data:');
    console.log(JSON.stringify(courseData, null, 2));
    console.log('\n📡 Making POST request to /api/courses...\n');

    const response = await fetch('http://localhost:3000/api/courses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(courseData)
    });

    const result = await response.json();

    console.log(`📊 Response Status: ${response.status}`);
    console.log('📋 Response Data:');
    console.log(JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('\n✅ Course creation test PASSED!');
      console.log(`🎯 Course ID: ${result.data?.id}`);
      console.log(`📚 Lesson Plans Created: ${result.preview?.summary?.totalLessonPlans}`);
      console.log(`🏫 Classes Created: ${result.preview?.summary?.totalClasses}`);
      console.log(`🎯 Next Steps: ${result.preview?.nextSteps?.length}`);
      console.log(`💡 Recommendations: ${result.preview?.recommendations?.length}`);
    } else {
      console.log('\n❌ Course creation test FAILED!');
      console.log(`Error: ${result.error}`);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testCourseCreation();
