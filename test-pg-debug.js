const { Client } = require('pg');

const connectionString = 'postgresql://postgres:C3po007%2Aa12@db.yawfuymgwukericlhgxh.supabase.co:5432/postgres';

const client = new Client({
  connectionString: connectionString,
});

async function main() {
  try {
    await client.connect();
    console.log('Connected to DB');
    
    // Check public.User
    try {
        const res = await client.query('SELECT * FROM "User" LIMIT 1');
        console.log('Public users ("User"):', res.rows);
    } catch (e) {
        console.log('Table "User" not found:', e.message);
    }
    
    // Check auth.users
    const resAuth = await client.query("SELECT * FROM auth.users LIMIT 1");
    console.log('Auth users:', resAuth.rows);
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();
