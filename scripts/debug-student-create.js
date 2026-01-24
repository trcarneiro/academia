const http = require('http');

const data = JSON.stringify({
    firstName: "Debug",
    lastName: "User",
    email: "debug.user." + Date.now() + "@example.com",
    phone: "11999999999",
    organizationId: "ff5ee00e-d8a3-4291-9428-d28b852fb472" // Make sure this exists or let it duplicate logic
    // sending minimal required fields
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/students',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log('Response:', body);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
