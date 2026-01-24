
const mysql = require('mysql2/promise');

async function testConnection() {
    const config = {
        host: '67.205.159.161',
        user: '-WBA-Carneiro',
        password: 'Ojqemjeowt*a1',
        database: 'academia',
        port: 3306,
        connectTimeout: 5000
    };

    console.log(`Connecting to MySQL at ${config.host} as ${config.user}...`);

    try {
        const connection = await mysql.createConnection(config);
        console.log('✅ Connection Successful!');

        const [rows] = await connection.execute('SHOW TABLES');
        console.log(`\n📚 Found ${rows.length} Tables in 'academia':`);
        // Log first 10
        rows.slice(0, 10).forEach(row => console.log(Object.values(row)[0]));

        await connection.end();
    } catch (err) {
        console.error('❌ Connection Failed:', err.message);
    }
}

testConnection();
