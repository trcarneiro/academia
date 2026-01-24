const http = require('http');

async function request(path, method, body) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api' + path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function run() {
    console.log('🚀 Starting Focused Conversion Test...');

    const rand = () => Math.floor(Math.random() * 900) + 100;
    const cpf = `${rand()}.${rand()}.${rand()}-00`;

    // 1. Create Pre-Enrollment
    const payload = {
        firstName: "Test",
        lastName: "Conversion",
        email: `convert.test.${Date.now()}@example.com`,
        cpf: cpf,
        phone: "(11) 97777-6666",
        source: "script_verification"
    };

    console.log('1️⃣ Creating Pre-Enrollment...');
    const createRes = await request('/pre-enrollment', 'POST', payload);

    if (!createRes.data.success) {
        console.error('❌ Creation Failed:', createRes.data);
        process.exit(1);
    }

    const id = createRes.data.data.id;
    console.log(`✅ Created ID: ${id}`);

    // 2. Convert
    console.log('2️⃣ Converting to Student...');
    const convertRes = await request(`/pre-enrollment/${id}/convert`, 'POST', {});

    if (convertRes.data.success) {
        console.log('✅ Conversion Successful!');
        console.log('   Student ID:', convertRes.data.data.student.id);
    } else {
        console.error('❌ Conversion Failed:', convertRes.data);
        console.error('Status:', convertRes.status);
    }
}

run();
