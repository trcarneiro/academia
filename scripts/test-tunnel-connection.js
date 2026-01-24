
const mysql = require('mysql2/promise');

async function testConnection() {
    const config = {
        host: '127.0.0.1',  // Connect to local tunnel
        port: 3308,         // Tunnel port
        user: 'root',
        password: 'Ojqemjeowt*a1', // User provided corrected password
        database: 'academia',
        connectTimeout: 5000
    };

    console.log(`Connecting to MySQL via Tunnel at ${config.host}:${config.port}...`);

    try {
        const connection = await mysql.createConnection(config);
        console.log('✅ Connection Successful!');

        const [rows] = await connection.execute('SHOW DATABASES');
        console.log('\n--- Databases ---');
        rows.forEach(row => console.log(row.Database));

        // Check for 'academia' or similar
        const academiaDb = rows.find(r => r.Database.includes('academia') || r.Database.includes('krav'));
        if (academiaDb) {
            console.log(`\n✅ Found likely database: ${academiaDb.Database}`);
        } else {
            console.log(`\n⚠️ 'academia' database not found in list.`);
        }

        await connection.end();
    } catch (err) {
        console.error('❌ Connection Failed:', err.message);
    }
}

testConnection();
