const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yawfuymgwukericlhgxh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhd2Z1eW1nd3VrZXJpY2xoZ3hoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDk2MDk1NiwiZXhwIjoyMDY2NTM2OTU2fQ.f_tR7vBgwf8kLqy2-Z6vWJI4cGVjy4P3xQLemGjDqbM';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function test() {
  console.log('Testing connection...');
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Success! Users found:', data.users.length);
    data.users.forEach(u => console.log(u.email));
  }
}

test();
