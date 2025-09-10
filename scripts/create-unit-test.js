// Quick test script to create a unit against local server
// Usage: node scripts/create-unit-test.js
// Requires Node 18+ (global fetch)

(async () => {
  try {
    const apiBase = process.env.API_BASE || 'http://localhost:3000';

    // 1) Fetch organizations
    const orgRes = await fetch(`${apiBase}/api/organizations`);
    const orgJson = await orgRes.json();
    if (!orgJson.success || !Array.isArray(orgJson.data) || orgJson.data.length === 0) {
      console.error('No organizations available. Ensure server is running and organizations exist.');
      process.exit(1);
    }

    const orgId = orgJson.data[0].id;
    console.log('Using organization:', orgJson.data[0].name, orgId);

    // 2) Build payload
    const payload = {
      organizationId: orgId,
      name: `Teste Unidade ${Date.now()}`,
      address: 'Rua Teste, 123',
      city: 'Belo Horizonte',
      state: 'MG',
      zipCode: '30112000',
      phone: '(31) 99999-9999',
      email: 'teste-unidade@example.com',
      capacity: 30,
      totalMats: 2,
      isActive: true
    };

    console.log('Creating unit with payload:', payload);

    const createRes = await fetch(`${apiBase}/api/units`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const createJson = await createRes.json();
    console.log('Response status:', createRes.status);
    console.log(JSON.stringify(createJson, null, 2));

    if (!createJson.success) process.exit(2);

  } catch (err) {
    console.error('Error running create-unit-test:', err);
    process.exit(1);
  }
})();
