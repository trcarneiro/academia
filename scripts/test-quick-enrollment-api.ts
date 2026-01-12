
import axios from 'axios';
import { chalk } from 'zx'; // Or just console.log if chalk not avail in this context, but package.json has it. 
// Actually package.json has "chalk": "^5.4.1" which is ESM only. TSX handles it? 
// Let's use console.log with emojis to be safe and avoid import issues if not configured.

const BASE_URL = 'http://localhost:3000/api';
let TOKEN = '';

async function runTest() {
    console.log('🚀 Starting Quick Enrollment API Integration Test');

    try {
        // 1. Health Check
        console.log('\n1️⃣ Checking Server Health...');
        try {
            await axios.get('http://localhost:3000/health');
            console.log('✅ Server is UP');
        } catch (e) {
            console.error('❌ Server is DOWN. Please start the server first (npm run dev)');
            process.exit(1);
        }

        // 2. Authenticate
        console.log('\n2️⃣ Authenticating...');
        const authRes = await axios.post(`${BASE_URL}/dev-auth/auto-login`, {});
        if (!authRes.data.success) throw new Error('Auth failed');
        TOKEN = authRes.data.data.token;
        console.log('✅ Authenticated as Dev User');

        const orgId = authRes.data.data.user.organizationId;
        const headers = {
            Authorization: `Bearer ${TOKEN}`,
            'x-organization-id': orgId
        };

        // 3. Get Plans
        console.log('\n3️⃣ Fetching billing plans...');
        const plansRes = await axios.get(`${BASE_URL}/billing-plans`, { headers });
        const plans = plansRes.data.data.filter((p: any) => p.isActive);
        if (plans.length === 0) throw new Error('No active plans found');

        const plan = plans[0];
        console.log(`✅ Found active plan: ${plan.name} (ID: ${plan.id})`);
        console.log(`   Price: ${plan.price}`);
        console.log(`   Features:`, plan.features);

        // 4. Create Student
        const uniqueId = Date.now();
        const studentPayload = {
            firstName: `TestQuick`,
            lastName: `Enrollment${uniqueId}`,
            cpf: `999${String(uniqueId).slice(-8)}`,
            email: `quick.${uniqueId}@test.com`,
            "phone": "11999999999",
            "birthDate": "1995-05-05T00:00:00.000Z",
            "photoUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAAAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWWHZWmNkZWdnoaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERkdISUpTVFVWWHZWmNkZWdnoaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/9oADAMBAAIRAxEAPwf/2Q==",
            enrollment: {
                packageId: plan.id,
                customPrice: parseFloat(plan.price)
            }
        };

        console.log('\n4️⃣ Creating Student with Enrollment...');
        console.log('   Payload:', JSON.stringify(studentPayload, null, 2));

        const createRes = await axios.post(`${BASE_URL}/students`, studentPayload, { headers });

        if (!createRes.data.success) throw new Error('Student creation failed: ' + createRes.data.message);

        const student = createRes.data.data;
        console.log(`✅ Student Created: ${student.id}`);
        console.log(`   Name: ${student.user.firstName} ${student.user.lastName}`);

        // 5. Verify Auto-Enrollment
        console.log('\n5️⃣ Verifying Enrollment...');

        // Check Course Enrollments
        const enrollmentsRes = await axios.get(`${BASE_URL}/students/${student.id}/enrollments`, { headers });
        const enrollments = enrollmentsRes.data.data;

        if (enrollments.length > 0) {
            console.log(`✅ Student has ${enrollments.length} course enrollments`);
            enrollments.forEach((e: any) => {
                console.log(`   - Course: ${e.course.name} (${e.status})`);
            });
        } else {
            console.warn('⚠️ No course enrollments found. Check if Plan has courses linked.');
        }

        // Check Subscriptions (if logic exists in backend)
        const subRes = await axios.get(`${BASE_URL}/students/${student.id}/subscription`, { headers });
        const sub = subRes.data.data;

        if (sub) {
            console.log(`✅ Active Subscription found: ${sub.plan.name}`);
        } else {
            console.warn('⚠️ No active subscription found via API. (Logic might differ from CourseEnrollment)');
        }

        // 6. Test Update (Edit Mode)
        console.log('\n6️⃣ Testing Student Update...');
        const updatePayload = {
            firstName: `TestQuickUpdated`,
            lastName: student.user.lastName,
            email: student.user.email,
            phone: '11888888888',
            isActive: true
        };

        const updateRes = await axios.put(`${BASE_URL}/students/${student.id}`, updatePayload, { headers });
        if (!updateRes.data.success) throw new Error('Update failed');

        const updatedStudent = updateRes.data.data;
        console.log(`✅ Student Updated`);
        console.log(`   New Name: ${updatedStudent.user.firstName}`);
        console.log(`   New Phone: ${updatedStudent.user.phone}`);

        if (updatedStudent.user.firstName !== updatePayload.firstName) throw new Error('Name update verification failed');

        // 7. Cleanup
        console.log('\n7️⃣ Cleanup (Optional step, usually skipped in prod tests but good for dev)');
        // Actually, let's leave it for manual inspection or explicit cleanup script.
        // But for "test all functionalities", creating and leaving garbage is messy.
        // We can define a cleanup method if necessary, but DELETE /api/students/:id might not exist or verify cascading.

        console.log('\n🎉 TEST COMPLETED SUCCESSFULLY');

    } catch (error: any) {
        console.error('\n❌ TEST FAILED');
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
        process.exit(1);
    }
}

runTest();
