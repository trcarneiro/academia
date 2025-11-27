const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yawfuymgwukericlhgxh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhd2Z1eW1nd3VrZXJpY2xoZ3hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA5NTYsImV4cCI6MjA2NjUzNjk1Nn0.sqm8ZAVJoS_tUGSGFuQapJYFTjfdAa7dkLs437A5bUs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
  console.log('Testing login for trcampos@Gmail.com with password temp123456...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'trcampos@Gmail.com',
    password: 'temp123456'
  });

  if (error) {
    console.error('Login failed:', error.message);
  } else {
    console.log('Login successful!');
    console.log('User ID:', data.user.id);
    console.log('Access Token:', data.session.access_token.substring(0, 20) + '...');
  }
}

testLogin();
