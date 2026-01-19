#!/bin/bash

# Quick database initialization using fly postgres connect
# This will connect to your database and run the schema

echo "🗄️  Initializing Receipt Tracking Database Tables..."
echo ""

# Check if DATABASE_URL is available via fly secrets
if ! fly secrets list -a 5ml-agenticai-v1 2>/dev/null | grep -q "DATABASE_URL"; then
    echo "❌ DATABASE_URL not found in secrets"
    echo "Please attach your database first:"
    echo "  fly postgres attach <your-postgres-db-name> -a 5ml-agenticai-v1"
    exit 1
fi

echo "✅ DATABASE_URL is configured"
echo ""

# Get the postgres app name
echo "📋 Your Fly.io apps:"
fly apps list | grep -E "NAME|postgres"
echo ""
echo -n "Enter your Postgres app name (e.g., 5ml-agenticai-v1-db): "
read POSTGRES_APP_NAME

if [ -z "$POSTGRES_APP_NAME" ]; then
    echo "❌ No app name provided"
    exit 1
fi

echo ""
echo "🔌 Connecting to $POSTGRES_APP_NAME and running schema..."
echo ""

# Connect and run the schema
fly postgres connect -a "$POSTGRES_APP_NAME" < use-cases/mans-company-receipt-tracking/db/schema.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database initialized successfully!"
    echo ""
    echo "🚀 Next steps:"
    echo "  1. The database is ready"
    echo "  2. Try processing receipts again at:"
    echo "     https://5ml-agenticai-v1.fly.dev/use-cases/mans-accounting"
else
    echo ""
    echo "❌ Failed to initialize database"
    echo ""
    echo "💡 Alternative method:"
    echo "  1. fly postgres connect -a $POSTGRES_APP_NAME"
    echo "  2. In psql prompt: \\i use-cases/mans-company-receipt-tracking/db/schema.sql"
fi
