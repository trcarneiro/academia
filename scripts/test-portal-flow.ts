import fetch from 'node-fetch';
import { prisma } from '../src/utils/database';

const BASE_URL = 'http://127.0.0.1:3000/api/portal';

async function runTest() {
  console.log('🚀 Starting Portal Flow Test...');

  // 1. Get Organization
  const org = await prisma.organization.findFirst();
  if (!org) {
    console.error('❌ No organization found');
    process.exit(1);
  }
  console.log(`✅ Organization found: ${org.name} (${org.id})`);

  // 2. Register
  const email = `test.student.${Date.now()}@example.com`;
  const cpf = generateCPF();
  const password = 'password123';

  console.log(`📝 Registering student: ${email} / ${cpf}`);

  const registerRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Student',
      email,
      cpf,
      password,
      phone: '11999999999',
      organizationId: org.id
    })
  });

  const registerData = await registerRes.json();
  
  if (!registerData.success) {
    console.error('❌ Registration failed:', registerData);
    process.exit(1);
  }
  console.log('✅ Registration successful');
  const token = registerData.token;

  // 3. Login (Verify login works)
  console.log('🔑 Testing Login...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      organizationId: org.id
    })
  });

  const loginData = await loginRes.json();
  if (!loginData.success) {
    console.error('❌ Login failed:', loginData);
    process.exit(1);
  }
  console.log('✅ Login successful');

  // 4. Fetch Dashboard
  console.log('📊 Fetching Dashboard...');
  const dashboardRes = await fetch(`${BASE_URL}/dashboard`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const dashboardData = await dashboardRes.json();
  if (!dashboardData.success) {
    console.error('❌ Dashboard fetch failed:', dashboardData);
    process.exit(1);
  }
  console.log('✅ Dashboard fetched');

  // 5. Fetch QR Code
  console.log('📱 Fetching QR Code...');
  const qrRes = await fetch(`${BASE_URL}/dashboard/access-qrcode`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const qrData = await qrRes.json();
  if (!qrData.success) {
    console.error('❌ QR Code fetch failed:', qrData);
    process.exit(1);
  }
  console.log('✅ QR Code fetched');

  console.log('🎉 All tests passed!');
}

function generateCPF() {
  const rnd = (n: number) => Math.round(Math.random() * n);
  const mod = (base: number, div: number) => Math.round(base - Math.floor(base / div) * div);
  const n = Array(9).fill(0).map(() => rnd(9));
  
  let d1 = n.reduce((total, val, i) => total + val * (10 - i), 0);
  d1 = 11 - mod(d1, 11);
  if (d1 >= 10) d1 = 0;
  
  let d2 = n.reduce((total, val, i) => total + val * (11 - i), 0) + d1 * 2;
  d2 = 11 - mod(d2, 11);
  if (d2 >= 10) d2 = 0;
  
  return `${n.join('')}${d1}${d2}`;
}

runTest().catch(console.error);
