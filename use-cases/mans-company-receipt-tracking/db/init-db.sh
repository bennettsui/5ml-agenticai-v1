#!/bin/bash

# Database initialization script for Man's Accounting Receipt Tracking
# This script initializes the PostgreSQL database schema

set -e  # Exit on error

echo "🗄️  Initializing Receipt Tracking Database..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  echo ""
  echo "Please set DATABASE_URL first:"
  echo "  fly secrets set DATABASE_URL='postgresql://user:password@host:port/database'"
  echo ""
  echo "Or create a new Postgres database on Fly.io:"
  echo "  fly postgres create"
  echo "  fly postgres attach <postgres-app-name>"
  exit 1
fi

echo "✅ DATABASE_URL is set"

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Run the schema SQL file
echo "📋 Running schema.sql..."
if command -v psql &> /dev/null; then
  psql "$DATABASE_URL" -f "$SCRIPT_DIR/schema.sql"
  echo "✅ Database schema initialized successfully!"
else
  echo "⚠️  psql not found. Using node pg instead..."
  node -e "
    const { Client } = require('pg');
    const fs = require('fs');
    const path = require('path');

    const client = new Client({ connectionString: process.env.DATABASE_URL });

    (async () => {
      try {
        await client.connect();
        const schema = fs.readFileSync('$SCRIPT_DIR/schema.sql', 'utf8');
        await client.query(schema);
        console.log('✅ Database schema initialized successfully!');
      } catch (err) {
        console.error('❌ Error initializing database:', err.message);
        process.exit(1);
      } finally {
        await client.end();
      }
    })();
  "
fi

echo ""
echo "✨ Database is ready for receipt processing!"
echo ""
echo "Next steps:"
echo "  1. Set DROPBOX_ACCESS_TOKEN: fly secrets set DROPBOX_ACCESS_TOKEN='your_token'"
echo "  2. Deploy: git push && fly deploy"
echo "  3. Test: Visit https://5ml-agenticai-v1.fly.dev/use-cases/mans-accounting"
