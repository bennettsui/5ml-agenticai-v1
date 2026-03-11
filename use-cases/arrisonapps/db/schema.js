'use strict';
/**
 * Arrisonapps — DB initialiser
 * Runs the migration SQL and seeds the schema on startup.
 */
const path = require('path');
const fs   = require('fs');

async function initArrisonappsDb(pool) {
  if (!pool) return;
  try {
    const sql = fs.readFileSync(
      path.join(__dirname, 'migrations', '001_initial_schema.sql'),
      'utf8'
    );
    await pool.query(sql);
    console.log('✅ [Arrisonapps] Database schema ready');
  } catch (err) {
    console.error('⚠️  [Arrisonapps] Schema init error:', err.message);
  }
}

module.exports = { initArrisonappsDb };
