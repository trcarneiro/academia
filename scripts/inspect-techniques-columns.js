/**
 * Inspect columns of public.techniques safely (Windows/cmd friendly)
 * Usage:
 *   node scripts/inspect-techniques-columns.js
 * Requires:
 *   - DATABASE_URL in environment (.env loaded by your shell or VSCode)
 *   - npm i pg (already present via Prisma usually)
 */
const { Client } = require('pg');

(async () => {
  try {
    const url = process.env.DATABASE_URL;
    if (!url) {
      console.error('DATABASE_URL não definido no ambiente');
      process.exit(1);
    }

    const client = new Client({
      connectionString: url,
      ssl: { rejectUnauthorized: false },
    });

    await client.connect();

    const sql =
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'techniques' ORDER BY column_name";
    const res = await client.query(sql);

    console.log('Colunas da tabela techniques:');
    for (const row of res.rows) {
      console.log(`${row.column_name} :: ${row.data_type}`);
    }

    await client.end();
    process.exit(0);
  } catch (e) {
    console.error('Erro introspecção:', e);
    process.exit(1);
  }
})();