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

    // Check if database already has user tables
    const requiredTables = [
      'projects',
      'brands',
      'receipts',
      'tenders',
      'ziwei_birth_charts'
    ];

    const existingTables = await db.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    `);

    const existingTableNames = existingTables.rows.map(row => row.table_name);
    const existingSet = new Set(existingTableNames);
    const missingTables = requiredTables.filter(name => !existingSet.has(name));

    if (existingTableNames.length > 0) {
      return res.json({
        success: true,
        message: '✅ Database already initialized',
        tables_exist: true,
        table_count: existingTableNames.length,
        missing_tables: missingTables
      });
    }

    console.log('📄 Loading schema file...');
    const schemaPath = path.join(__dirname, '../db/schema.sql');
    let schema = fs.readFileSync(schemaPath, 'utf8');

    schema = schema.replace(/^\\.*$/gm, '');

    const availableExtensions = await db.query('SELECT name FROM pg_available_extensions');
    const availableSet = new Set(availableExtensions.rows.map(row => row.name));

    const stripExtensionStatements = (schemaText, extensionName) => {
      const escapedName = extensionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const createRegex = new RegExp(`^CREATE EXTENSION IF NOT EXISTS ${escapedName}[^;]*;\\n?`, 'gm');
      const commentRegex = new RegExp(`^COMMENT ON EXTENSION ${escapedName}[^;]*;\\n?`, 'gm');
      return schemaText.replace(createRegex, '').replace(commentRegex, '');
    };

    const optionalExtensions = ['pg_stat_monitor', 'pgaudit', 'vector'];
    for (const extension of optionalExtensions) {
      if (!availableSet.has(extension)) {
        console.log(`⚠️  ${extension} not available - skipping related statements`);
        schema = stripExtensionStatements(schema, extension);
      }
    }

    if (!availableSet.has('vector')) {
      schema = schema.replace(/public\.vector\(\d+\)/g, 'jsonb');
      schema = schema.replace(/\bvector\(\d+\)/g, 'jsonb');
      schema = schema.replace(/^CREATE INDEX .* USING (ivfflat|hnsw) .*;\\n?/gm, '');
    } else {
      console.log('✅ pgvector available');
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
      tables: result.rows.map(r => r.table_name),
      missing_tables_before: missingTables
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
