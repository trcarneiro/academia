// Test script for check-in API
import fetch from 'node-fetch';

const payload = {
  studentId: 'dc9c17ff-582c-45c6-bc46-7eee1cee4564',
  classId: '473c68fc-094d-4f10-94f5-053d0d8b89f5',
  method: 'FACIAL_RECOGNITION',
  location: 'Test Script'
};

console.log('📦 Testing check-in API...');
console.log('Payload:', JSON.stringify(payload, null, 2));

try {
  const response = await fetch('http://localhost:3000/api/attendance/checkin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  console.log('\n📨 Response:');
  console.log('Status:', response.status);
  console.log('Data:', JSON.stringify(data, null, 2));

  if (response.ok) {
    console.log('\n✅ CHECK-IN SUCCESSFUL!');
  } else {
    console.log('\n❌ CHECK-IN FAILED!');
  }
} catch (error) {
  console.error('\n💥 Error:', error.message);
}
