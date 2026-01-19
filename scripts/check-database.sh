#!/bin/bash

# Database Configuration Diagnostic Script
# Run this to check if your Fly.io database is properly configured

echo "🔍 Checking Fly.io Database Configuration..."
echo ""

# Check 1: List all Fly.io apps
echo "1️⃣ Your Fly.io Apps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
fly apps list 2>/dev/null || echo "❌ Error: 'fly' command not found. Install it first: https://fly.io/docs/hands-on/install-flyctl/"
echo ""

# Check 2: Check if DATABASE_URL is set
echo "2️⃣ Checking DATABASE_URL Secret:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if fly secrets list -a 5ml-agenticai-v1 2>/dev/null | grep -q "DATABASE_URL"; then
    echo "✅ DATABASE_URL is set"
    fly secrets list -a 5ml-agenticai-v1 | grep DATABASE_URL
else
    echo "❌ DATABASE_URL is NOT set"
    echo ""
    echo "💡 Fix: You need to attach a database:"
    echo ""
    echo "   Option A - If you have an existing Postgres database:"
    echo "   fly postgres attach <your-postgres-db-name> -a 5ml-agenticai-v1"
    echo ""
    echo "   Option B - Create a new database:"
    echo "   fly postgres create --name 5ml-agenticai-v1-db --region iad"
    echo "   fly postgres attach 5ml-agenticai-v1-db -a 5ml-agenticai-v1"
fi
echo ""

# Check 3: Check DROPBOX_ACCESS_TOKEN
echo "3️⃣ Checking DROPBOX_ACCESS_TOKEN Secret:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if fly secrets list -a 5ml-agenticai-v1 2>/dev/null | grep -q "DROPBOX_ACCESS_TOKEN"; then
    echo "✅ DROPBOX_ACCESS_TOKEN is set"
else
    echo "❌ DROPBOX_ACCESS_TOKEN is NOT set"
    echo ""
    echo "💡 Fix: Set your Dropbox token:"
    echo "   1. Go to https://www.dropbox.com/developers/apps"
    echo "   2. Create/select your app"
    echo "   3. Go to Settings → Generate access token"
    echo "   4. Run: fly secrets set DROPBOX_ACCESS_TOKEN='your_token' -a 5ml-agenticai-v1"
fi
echo ""

# Check 4: Check if latest code is deployed
echo "4️⃣ Checking Deployment Status:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Latest local commit: $(git log -1 --oneline)"
echo ""
echo "To deploy latest code:"
echo "   git push"
echo "   fly deploy -a 5ml-agenticai-v1"
echo ""

# Check 5: Test the endpoint
echo "5️⃣ Testing Receipt Processing Endpoint:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Sending test request..."
RESPONSE=$(curl -s -X POST https://5ml-agenticai-v1.fly.dev/api/receipts/process \
  -H "Content-Type: application/json" \
  -d '{"client_name":"Test","dropbox_url":"https://test.com"}' 2>&1)

if echo "$RESPONSE" | grep -q "Database not configured"; then
    echo "❌ Database is not configured on server"
    echo ""
    echo "Response: $RESPONSE"
    echo ""
    echo "Action needed: Attach database and redeploy (see step 2)"
elif echo "$RESPONSE" | grep -q "batch_id"; then
    echo "✅ API is working! Database is configured."
elif echo "$RESPONSE" | grep -q "error"; then
    echo "⚠️  API returned an error:"
    echo "$RESPONSE" | grep -o '"error":"[^"]*"' || echo "$RESPONSE"
else
    echo "📋 Response:"
    echo "$RESPONSE"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Summary & Next Steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "If DATABASE_URL is not set:"
echo "  1. Create/attach database (see step 2 above)"
echo "  2. Initialize schema: ./use-cases/mans-company-receipt-tracking/db/init-db.sh"
echo "  3. Deploy: fly deploy -a 5ml-agenticai-v1"
echo ""
echo "If DATABASE_URL is set but still failing:"
echo "  1. Redeploy: fly deploy -a 5ml-agenticai-v1"
echo "  2. Check logs: fly logs -a 5ml-agenticai-v1"
echo "  3. Test again at: https://5ml-agenticai-v1.fly.dev/use-cases/mans-accounting"
echo ""
