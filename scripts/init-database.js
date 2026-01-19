#!/usr/bin/env node

/**
 * Database Initialization Script
 * Initializes the receipt tracking database schema
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  🗄️  Database Initialization           ║');
  console.log('╚════════════════════════════════════════╝\n');

  // Check DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL environment variable is not set');
    console.error('\nPlease set it with:');
    console.error('  export DATABASE_URL="postgresql://user:pass@host:5432/dbname"');
    process.exit(1);
  }

  console.log('✓ DATABASE_URL found');
  console.log(`  Host: ${new URL(process.env.DATABASE_URL).host}`);
  console.log(`  Database: ${new URL(process.env.DATABASE_URL).pathname.substring(1)}\n`);

  // Create pool
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    // Test connection
    console.log('🔌 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to database\n');

    // Read schema file
    const schemaPath = path.join(__dirname, '../use-cases/mans-company-receipt-tracking/db/schema.sql');
    console.log('📄 Reading schema file...');
    console.log(`  Path: ${schemaPath}`);

    if (!fs.existsSync(schemaPath)) {
      console.error(`❌ Schema file not found: ${schemaPath}`);
      process.exit(1);
    }

    let schema = fs.readFileSync(schemaPath, 'utf8');
    console.log('✅ Schema file loaded\n');

    // Check if pgvector extension is available
    console.log('🔍 Checking for pgvector extension...');
    try {
      await pool.query('SELECT * FROM pg_available_extensions WHERE name = \'vector\'');
      console.log('✅ pgvector available\n');
    } catch (error) {
      console.log('⚠️  pgvector not available - removing from schema');
      // Remove pgvector-related sections
      schema = schema.replace(/CREATE EXTENSION IF NOT EXISTS vector;[\s\S]*?WITH\s+\(lists = 100\);/g, '');
      schema = schema.replace(/embedding vector\(384\),/g, '-- embedding vector(384), -- pgvector not available');
      console.log('✅ Schema adjusted for non-pgvector environment\n');
    }

    // Execute schema
    console.log('🚀 Executing schema...');
    console.log('  Creating tables, indexes, views, functions...\n');

    await pool.query(schema);

    console.log('✅ Schema executed successfully\n');

    // Verify tables
    console.log('🔍 Verifying tables...');
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    console.log(`\n📊 Created ${result.rows.length} tables:`);
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║  ✅ Database Initialization Complete   ║');
    console.log('╚════════════════════════════════════════╝\n');

    console.log('Next steps:');
    console.log('  1. Deploy your app: fly deploy');
    console.log('  2. Test the receipt processing API');
    console.log('  3. Monitor logs: fly logs\n');

  } catch (error) {
    console.error('\n❌ ERROR during initialization:');
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run initialization
initDatabase();
