const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yawfuymgwukericlhgxh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhd2Z1eW1nd3VrZXJpY2xoZ3hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA5NTYsImV4cCI6MjA2NjUzNjk1Nn0.sqm8ZAVJoS_tUGSGFuQapJYFTjfdAa7dkLs437A5bUs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignup() {
  console.log('Testing signup for trcampos@Gmail.com...');
  const { data, error } = await supabase.auth.signUp({
    email: 'trcampos@Gmail.com',
    password: 'Academia123!'
  });

  if (error) {
    console.error('Signup failed:', error.message);
  } else {
    console.log('Signup successful!');
    console.log('User ID:', data.user?.id);
    if (data.user?.identities?.length === 0) {
        console.log('User already exists (identities empty).');
    }
  }
}

testSignup();
