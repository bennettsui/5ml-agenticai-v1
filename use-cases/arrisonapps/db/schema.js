'use strict';
/**
 * Arrisonapps — DB initialiser
 * Runs the migration SQL and seeds the schema on startup.
 */
const path = require('path');
const fs   = require('fs');

async function initArrisonappsDb(pool) {
  if (!pool) return;
  const migrations = [
    '001_initial_schema.sql',
    '002_product_seed.sql',
  ];
  for (const file of migrations) {
    try {
      const sql = fs.readFileSync(
        path.join(__dirname, 'migrations', file),
        'utf8'
      );
      await pool.query(sql);
      console.log(`✅ [Arrisonapps] Ran migration: ${file}`);
    } catch (err) {
      console.error(`⚠️  [Arrisonapps] Migration error (${file}):`, err.message);
    }
  }
}

module.exports = { initArrisonappsDb };
