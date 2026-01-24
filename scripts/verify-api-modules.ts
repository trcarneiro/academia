import axios from 'axios';

// Credentials provided by user
const EMAIL = 'trcampos@gmail.com';
const PASSWORD = 'Academia123!';
const BASE_URL = 'http://localhost:3000/api';

async function verifyModules() {
    console.log('🚀 Starting API Verification for Global Audit...');

    try {

        // 1. Login (using dev-auth to bypass Supabase JWT issues)
        console.log('\n🔐 Authenticating via Dev-Auth...');

        // Use dev-auth endpoint which signs tokens locally
        let loginResponse;
        try {
            loginResponse = await axios.post(`${BASE_URL}/dev-auth/auto-login`, {});
        } catch (authError: any) {
            console.error('❌ Dev-Auth Request Failed!');
            console.error('Status:', authError.response?.status);
            console.error('Data:', JSON.stringify(authError.response?.data, null, 2));
            throw authError;
        }

        // console.log('DEBUG: Login Response Status:', loginResponse.status);
        // console.log('DEBUG: FULL RESPONSE:', JSON.stringify(loginResponse.data, null, 2));

        const responseData = loginResponse.data.data;
        const token = responseData.token;
        const user = responseData.user;

        if (!token || !user) {
            throw new Error('Dev-Auth failed: Missing token or user');
        }

        const organizationId = user.organizationId;
        const tenantId = user.tenantId; // Might be undefined but okay for now

        console.log(`✅ Dev-Auth successful! User: ${user.email}`);
        console.log(`✅ OrganizationId: ${organizationId}`);

        const headers = {
            'Authorization': `Bearer ${token}`,
            'x-organization-id': organizationId,
        };
        if (tenantId) headers['x-tenant-id'] = tenantId;

        // 2. Frequência (Attendance)
        console.log('\n📅 Verifying Frequência (Attendance)...');
        try {
            const attendanceRes = await axios.get(`${BASE_URL}/attendance/history`, {
                headers,
                params: { limit: 5 }
            });
            console.log(`✅ Attendance History Status: ${attendanceRes.status}`);
            console.log(`   Items found: ${attendanceRes.data.data.items?.length || 0}`);
        } catch (e: any) {
            console.error(`❌ Attendance check failed: ${e.message}`, e.response?.data);
        }

        // 3. Graduação (Graduation)
        console.log('\n🎓 Verifying Graduação (Graduation)...');
        try {
            const graduationRes = await axios.get(`${BASE_URL}/graduation/students`, {
                headers,
                params: { organizationId, limit: 5 }
            });
            console.log(`✅ Graduation Status: ${graduationRes.status}`);
            // Assuming response structure, might need adjustment based on controller
            const students = Array.isArray(graduationRes.data.data) ? graduationRes.data.data : (graduationRes.data.data?.results || []);
            console.log(`   Students with progress found: ${students.length}`);
        } catch (e: any) {
            console.error(`❌ Graduation check failed: ${e.message}`, e.response?.data);
        }

        // 4. Financeiro (Plans)
        console.log('\n💰 Verifying Financeiro (Billing Plans)...');
        try {
            // Endpoint identified as /api/billing-plans
            const plansRes = await axios.get(`${BASE_URL}/billing-plans`, { headers });
            console.log(`✅ Billing Plans Status: ${plansRes.status}`);
            const plans = Array.isArray(plansRes.data.data) ? plansRes.data.data : [];
            console.log(`   Plans found: ${plans.length}`);
            if (plans.length > 0) {
                console.log(`   Sample Plan: ${plans[0].name} - ${plans[0].price}`);
            }
        } catch (e: any) {
            console.error(`❌ Financial check failed: ${e.message}`, e.response?.data);
        }

        // 5. Pedagógico (Courses & Classes)
        console.log('\n📚 Verifying Pedagógico (Courses & Classes)...');
        try {
            // Courses
            const coursesRes = await axios.get(`${BASE_URL}/courses`, { headers });
            console.log(`✅ Courses Status: ${coursesRes.status}`);
            const courses = Array.isArray(coursesRes.data.data) ? coursesRes.data.data : (coursesRes.data.data?.items || []);
            console.log(`   Courses found: ${courses.length}`);

            // Classes
            const classesRes = await axios.get(`${BASE_URL}/classes`, { headers });
            console.log(`✅ Classes Status: ${classesRes.status}`);
            const classes = Array.isArray(classesRes.data.data) ? classesRes.data.data : (classesRes.data.data?.items || []);
            console.log(`   Classes found: ${classes.length}`);
        } catch (e: any) {
            console.error(`❌ Pedagogical check failed: ${e.message}`, e.response?.data);
        }

        console.log('\n✅ Verification Complete!');

    } catch (error: any) {
        console.error('\n❌ Fatal Verification Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
        process.exit(1);
    }
}

verifyModules();
