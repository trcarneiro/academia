// Quick test for turma save with correct instructorId
const http = require('http');

function req(method, path, data) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path,
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        
        const request = http.request(options, (response) => {
            let body = '';
            response.on('data', chunk => body += chunk);
            response.on('end', () => {
                try {
                    resolve({ status: response.statusCode, data: JSON.parse(body) });
                } catch (_) {
                    resolve({ status: response.statusCode, data: body });
                }
            });
        });
        
        request.on('error', reject);
        if (data) request.write(JSON.stringify(data));
        request.end();
    });
}

async function testTurmaSave() {
    try {
        console.log('🧪 Testing turma save with correct instructorId...');
        
        const turmaId = '77175835-3a9f-48a6-8ca2-393a5a1a8106';
        
        // First get the turma to see current data
        const getResult = await req('GET', `/api/turmas/${turmaId}`);
        console.log('📋 Current turma instructorId:', getResult.data.data?.instructorId);
        
        // Test with the correct instructorId (ab93b7fc-6076-4995-9740-48779894f480 for Thiago)
        const updateData = {
            name: 'Defesa Pessoal - Sábados 10:30 - Iniciantes e Avançados',
            courseId: 'c599f6dc-9152-4d51-a9ee-e5b7c8b3fb7d',
            type: 'COLLECTIVE',
            instructorId: 'ab93b7fc-6076-4995-9740-48779894f480', // Correct userId
            startDate: '2025-06-01T00:00:00.000Z',
            endDate: null,
            maxStudents: 15,
            organizationId: 'a55ad715-2eb0-493c-996c-bb0f60bacec9',
            unitId: 'bf22cf7d-5821-4226-b39c-45035e68cf40',
            trainingAreaId: 'bca47728-3c99-4f27-bdc7-10e445227301',
            room: null,
            price: null,
            description: 'Turma para iniciantes no período da manhã',
            schedule: {
                daysOfWeek: [6],
                time: '10:30',
                duration: 60
            }
        };
        
        const putResult = await req('PUT', `/api/turmas/${turmaId}`, updateData);
        console.log('📡 PUT result:', putResult.status);
        console.log('💾 Response:', putResult.data.success ? 'SUCCESS' : 'FAILED');
        
        if (!putResult.data.success) {
            console.log('❌ Error:', putResult.data.error);
        } else {
            console.log('✅ Turma updated successfully!');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testTurmaSave();