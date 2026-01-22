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

    // Check if tables already exist
    const checkTables = await db.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'receipt_batches'
    `);

    if (checkTables.rows.length > 0) {
      return res.json({
        success: true,
        message: '✅ Database already initialized',
        tables_exist: true
      });
    }

    console.log('📄 Loading schema file...');
    const schemaPath = path.join(__dirname, '../db/schema.sql');
    let schema = fs.readFileSync(schemaPath, 'utf8');

    // Check for pgvector extension (installed and available)
    console.log('🔍 Checking for pgvector...');
    try {
      const vectorInstalled = await db.query(
        "SELECT 1 FROM pg_extension WHERE extname = 'vector' LIMIT 1"
      );
      if (vectorInstalled.rows.length > 0) {
        console.log('✅ pgvector installed');
      } else {
        console.log('⚠️  pgvector not installed - adjusting schema');
        schema = schema.replace(/CREATE EXTENSION IF NOT EXISTS vector;\s*/g, '');
        schema = schema.replace(/embedding vector\(384\)/g, 'embedding TEXT');
        schema = schema.replace(/CREATE INDEX IF NOT EXISTS pnl_learning_embedding_idx[\s\S]*?WITH\s+\(lists = 100\);\s*/g, '');
      }
    } catch (error) {
      console.log('⚠️  pgvector check failed - adjusting schema');
      schema = schema.replace(/CREATE EXTENSION IF NOT EXISTS vector;\s*/g, '');
      schema = schema.replace(/embedding vector\(384\)/g, 'embedding TEXT');
      schema = schema.replace(/CREATE INDEX IF NOT EXISTS pnl_learning_embedding_idx[\s\S]*?WITH\s+\(lists = 100\);\s*/g, '');
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

router.post('/drop-database', async (req, res) => {
  try {
    const confirm = req.query.confirm === 'true' || req.body?.confirm === true;
    if (!confirm) {
      return res.status(400).json({
        success: false,
        error: 'Confirmation required: pass ?confirm=true or {"confirm": true}',
      });
    }

    console.log('\n🧨 Database drop requested via web endpoint\n');

    const tablesResult = await db.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    `);

    const tables = tablesResult.rows.map(r => r.table_name);
    if (tables.length === 0) {
      return res.json({
        success: true,
        message: 'No tables to drop',
        tables_dropped: 0,
      });
    }

    const quoteIdent = (name) => `"${String(name).replace(/"/g, '""')}"`;
    const dropSql = tables.map(name => `DROP TABLE IF EXISTS ${quoteIdent(name)} CASCADE;`).join('\n');
    await db.query(dropSql);

    res.json({
      success: true,
      message: '✅ Dropped all tables',
      tables_dropped: tables.length,
      tables,
    });
  } catch (error) {
    console.error('❌ Database drop failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.stack,
    });
  }
});

module.exports = router;
