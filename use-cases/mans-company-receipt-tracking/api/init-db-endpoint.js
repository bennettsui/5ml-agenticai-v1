/**
 * Database Initialization Endpoint
 * Access via: https://your-app.fly.dev/api/receipts/init-database
 */

const express = require('express');
const router = express.Router();
const db = require('../../../db');
const fs = require('fs');
const path = require('path');

router.get('/init-database', async (req, res) => {
  try {
    console.log('\n🗄️  Database initialization requested via web endpoint\n');

    // Check if all required tables exist
    const checkTables = await db.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('receipt_batches', 't_clients')
    `);

    const existingTables = checkTables.rows.map(r => r.table_name);
    const requiredTables = ['receipt_batches', 't_clients'];
    const missingTables = requiredTables.filter(t => !existingTables.includes(t));

    if (missingTables.length === 0) {
      return res.json({
        success: true,
        message: '✅ Database already initialized',
        tables_exist: true
      });
    }

    console.log('⚠️  Missing tables:', missingTables.join(', '));

    console.log('📄 Loading schema file...');
    const schemaPath = path.join(__dirname, '../db/schema.sql');
    let schema = fs.readFileSync(schemaPath, 'utf8');

    // Check for pgvector extension
    console.log('🔍 Checking for pgvector...');
    try {
      await db.query("SELECT * FROM pg_available_extensions WHERE name = 'vector'");
      console.log('✅ pgvector available');
    } catch (error) {
      console.log('⚠️  pgvector not available - adjusting schema');
      // Remove pgvector sections
      schema = schema.replace(/CREATE EXTENSION IF NOT EXISTS vector;[\s\S]*?WITH\s+\(lists = 100\);/g, '');
      schema = schema.replace(/embedding vector\(384\),/g, '-- embedding vector(384),');
    }

    console.log('🚀 Executing schema...');
    await db.query(schema);

    // Verify tables created
    const result = await db.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    console.log('✅ Database initialized successfully');
    console.log(`📊 Created ${result.rows.length} tables`);

    res.json({
      success: true,
      message: '✅ Database initialized successfully',
      tables_created: result.rows.length,
      tables: result.rows.map(r => r.table_name)
    });

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.stack
    });
  }
});

module.exports = router;
