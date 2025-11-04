/**
 * Test script for Activity Synchronization System
 * 
 * This script tests the new activity synchronization feature between 
 * lesson plan generation and the activity database.
 */

const fetch = require('node-fetch');

async function testActivitySync() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🚀 Testing Activity Synchronization System...\n');
  
  try {
    // Step 1: Check current activities
    console.log('1️⃣ Checking current activities in database...');
    const activitiesResponse = await fetch(`${baseUrl}/api/activities`);
    const activities = await activitiesResponse.json();
    console.log(`   Found ${activities.data?.length || 0} existing activities\n`);
    
    // Step 2: Test AI lesson plan generation with activity creation
    console.log('2️⃣ Testing lesson plan generation with activity auto-creation...');
    
    const testLessonPlan = {
      courseId: "test-course-123",
      generateCount: 1,
      aiProvider: "gemini"
    };
    
    const lessonPlanResponse = await fetch(`${baseUrl}/api/ai/generate-single-lesson`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testLessonPlan)
    });
    
    const lessonPlanResult = await lessonPlanResponse.json();
    console.log('   Lesson plan generation response:', lessonPlanResult.success ? '✅ SUCCESS' : '❌ FAILED');
    
    if (lessonPlanResult.data) {
      console.log(`   Generated ${lessonPlanResult.data.length} lesson plan(s)`);
      
      // Check for newly created activities
      const newActivitiesResponse = await fetch(`${baseUrl}/api/activities`);
      const newActivities = await newActivitiesResponse.json();
      const newActivityCount = newActivities.data?.length || 0;
      
      console.log(`   Current activity count: ${newActivityCount}`);
      console.log(`   Activities added: ${newActivityCount - (activities.data?.length || 0)}\n`);
    }
    
    // Step 3: Verify activity structure for video preparation
    console.log('3️⃣ Checking activity structure for future video development...');
    if (activities.data && activities.data.length > 0) {
      const sampleActivity = activities.data[0];
      const hasVideoFields = sampleActivity.description && sampleActivity.safety && sampleActivity.adaptations;
      console.log(`   Video-ready documentation: ${hasVideoFields ? '✅ COMPLETE' : '⚠️ PARTIAL'}`);
    }
    
    console.log('\n🎉 Activity Synchronization Test Complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testActivitySync();
}

module.exports = { testActivitySync };