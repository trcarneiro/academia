const fetch = require('node-fetch');

async function testKMA0001CheckIn() {
  const baseUrl = 'http://localhost:3000';
  
  try {
    console.log('🧪 Testing KMA0001 check-in validation...');
    
    // Test attendance validation
    const response = await fetch(`${baseUrl}/api/attendance/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        matricula: 'KMA0001',
        courseId: 'course-id-placeholder'
      })
    });
    
    const result = await response.json();
    
    console.log('📊 Validation result:', result);
    
    if (result.success) {
      console.log('✅ SUCCESS: KMA0001 can now check-in!');
    } else {
      console.log('❌ FAILED: Check-in still blocked');
      console.log('📝 Reason:', result.reason || result.message);
    }
    
  } catch (error) {
    console.error('🔗 Server not running or API error:', error.message);
    console.log('💡 Please start the server first with: npm start');
  }
}

testKMA0001CheckIn();
