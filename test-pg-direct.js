const { Client } = require('pg');

const connectionString = 'postgresql://postgres:C3po007%2Aa12@db.yawfuymgwukericlhgxh.supabase.co:5432/postgres';

const client = new Client({
  connectionString: connectionString,
});

async function main() {
  try {
    await client.connect();
    console.log('Connected to DB');
    
    const res = await client.query("SELECT id, email, encrypted_password FROM auth.users WHERE email = 'trcampos@Gmail.com'");
    console.log('User found:', res.rows);
    
    if (res.rows.length > 0) {
        // We found the user! Now we can update the password.
        // We need to generate a bcrypt hash.
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash('Academia123!', salt);
        
        console.log('Updating password...');
        await client.query("UPDATE auth.users SET encrypted_password = $1 WHERE email = 'trcampos@Gmail.com'", [hash]);
        console.log('Password updated to Academia123!');
    }
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();
