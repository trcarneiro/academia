
import axios from 'axios';
import { prisma } from '@/utils/database';

const BASE_URL = 'http://localhost:3000/api';

async function testCheckin() {
    console.log('🧪 Testing Check-in Window...');

    // 1. Auth
    const loginRes = await axios.post(`${BASE_URL}/dev-auth/auto-login`, {});
    const { token, user } = loginRes.data.data;
    const orgId = user.organizationId;
    const headers = { Authorization: `Bearer ${token}`, 'x-organization-id': orgId };

    console.log('✅ Auth success');

    // 2. Find a course to create class for
    const course = await prisma.course.findFirst({ where: { organizationId: orgId } });
    if (!course) throw new Error('No course found');

    const instructor = await prisma.instructor.findFirst({ where: { organizationId: orgId } });
    if (!instructor) throw new Error('No instructor found');

    // 3. Create a class for NOW (so it's within the window)
    const now = new Date();
    const classId = 'test-checkin-' + now.getTime();

    await prisma.class.create({
        data: {
            id: classId,
            organizationId: orgId,
            courseId: course.id,
            instructorId: instructor.id,
            date: now,
            startTime: now,
            endTime: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour duration
            status: 'SCHEDULED',
            maxStudents: 20
        }
    });

    console.log(`✅ Class created: ${classId} for ${now.toISOString()}`);

    try {
        // 4. Ensure user acts as student
        // We need a student profile for the user. Dev user is ADMIN.
        // Let's rely on admin override OR create a student profile for dev user if missing.
        let student = await prisma.student.findUnique({ where: { userId: user.id } });
        if (!student) {
            console.log('Creating student profile for dev user...');
            student = await prisma.student.create({
                data: {
                    userId: user.id,
                    organizationId: orgId,
                    name: 'Dev Student', // field might vary based on schema, but userId is key
                    // schema says User has firstName/lastName, Student links to User.
                    // Student required fields: specialNeeds, preferredDays, preferredTimes encoded as Json
                    specialNeeds: [],
                    preferredDays: [],
                    preferredTimes: []
                }
            });
        }

        // 5. Attempt Check-in
        // Config was set to 120 mins. "Now" is definitely inside.
        const checkinRes = await axios.post(`${BASE_URL}/attendance/check-in`, {
            classId: classId,
            method: 'MANUAL',
            location: 'TEST_SCRIPT'
        }, { headers });

        console.log('✅ Check-in Response:', checkinRes.status, checkinRes.data.message);

    } catch (error: any) {
        console.error('❌ Check-in Failed:', error.response?.data || error.message);
    } finally {
        // Cleanup
        await prisma.class.delete({ where: { id: classId } }).catch(() => { });
        // await prisma.attendance.delete... (cascade from class?)
        console.log('🧹 Cleanup done');
    }
}

testCheckin();
