const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  connectionTimeoutMillis: 20000,
});

(async () => {
  console.log('DATABASE_URL set:', !!process.env.DATABASE_URL);
  if (!process.env.DATABASE_URL) {
    console.log('No DATABASE_URL - cannot test connection');
    return;
  }
  
  try {
    console.log('Connecting...');
    const start = Date.now();
    await client.connect();
    const res = await client.query('SELECT 1 as test, NOW() as time');
    console.log('DB OK:', res.rows[0], 'Latency:', Date.now() - start, 'ms');
  } catch (err) {
    console.error('DB ERROR:', err.message);
    console.error('Code:', err.code);
  } finally {
    await client.end();
  }
})();
