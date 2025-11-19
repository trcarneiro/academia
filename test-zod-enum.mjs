// Direct Zod validation test
import { z } from 'zod';
import { CheckInMethod } from '@prisma/client';

console.log('🧪 Testing Zod enum validation...\n');

// 1. Check enum values
console.log('1. CheckInMethod values:', Object.keys(CheckInMethod));
console.log('   FACIAL_RECOGNITION:', CheckInMethod.FACIAL_RECOGNITION, '\n');

// 2. Create schema with nativeEnum
const schema = z.object({
  method: z.nativeEnum(CheckInMethod)
});

// 3. Test valid value
const testPayload1 = { method: 'FACIAL_RECOGNITION' };
console.log('2. Testing valid string:', testPayload1);
try {
  const result1 = schema.parse(testPayload1);
  console.log('   ✅ SUCCESS:', result1, '\n');
} catch (error) {
  console.log('   ❌ FAILED:', error.message, '\n');
}

// 4. Test with enum value
const testPayload2 = { method: CheckInMethod.FACIAL_RECOGNITION };
console.log('3. Testing enum value:', testPayload2);
try {
  const result2 = schema.parse(testPayload2);
  console.log('   ✅ SUCCESS:', result2, '\n');
} catch (error) {
  console.log('   ❌ FAILED:', error.message, '\n');
}

// 5. Test safeParse with string
console.log('4. Using safeParse with string "FACIAL_RECOGNITION":');
const result3 = schema.safeParse({ method: 'FACIAL_RECOGNITION' });
if (result3.success) {
  console.log('   ✅ SUCCESS:', result3.data);
} else {
  console.log('   ❌ FAILED:', result3.error.errors);
}
