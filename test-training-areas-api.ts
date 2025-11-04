import fetch from 'node-fetch';

async function testTrainingAreasAPI() {
  try {
    const response = await fetch('http://localhost:3000/api/training-areas');
    const result = await response.json();
    
    console.log('Training Areas API Response:');
    console.log('Status:', response.status);
    console.log('Success:', result.success);
    console.log('Data length:', result.data?.length || 0);
    
    if (result.success && result.data?.length > 0) {
      console.log('Sample training area:');
      console.log(JSON.stringify(result.data[0], null, 2));
    }
  } catch (error) {
    console.error('Error testing training areas API:', error);
  }
}

testTrainingAreasAPI();
