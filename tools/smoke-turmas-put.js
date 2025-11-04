// Simple smoke test for PUT /api/turmas/:id
// Gets the first turma and updates its description or schedule duration
const http = require('http');

function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : null;
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function run() {
  try {
    // Verify health
    const health = await request('GET', '/health');
    if (health.status !== 200) {
      console.error('Health check failed:', health);
      process.exit(1);
    }

    const list = await request('GET', '/api/turmas');
    const turmas = list.data?.data || list.data; // ResponseHelper or raw
    if (!Array.isArray(turmas) || turmas.length === 0) {
      console.log('NO_TURMAS');
      return;
    }
    const first = turmas[0];
    const id = first.id;

    const detail = await request('GET', `/api/turmas/${id}`);
    const turma = detail.data?.data || detail.data;

    let body;
    if (turma?.schedule && turma.schedule.daysOfWeek && turma.schedule.time) {
      body = {
        schedule: {
          daysOfWeek: turma.schedule.daysOfWeek,
          time: turma.schedule.time,
          duration: 5 // shrink to 5 minutes to validate no-min limit
        }
      };
    } else {
      body = { description: `smoke ${new Date().toISOString()}` };
    }

    const put = await request('PUT', `/api/turmas/${id}`, body);
    console.log(JSON.stringify(put, null, 2));
  } catch (err) {
    console.error('Smoke test error:', err.message || err);
    process.exit(1);
  }
}

run();
