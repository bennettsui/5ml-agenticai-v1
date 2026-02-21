#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# fly-setup.sh — Provision Fly Postgres for 5ml-agenticai-v1
#
# Run this ONCE from your local machine (needs flyctl installed + authenticated).
# After this script: restart the app and the schema + sources are auto-created.
#
# Usage:
#   chmod +x fly-setup.sh
#   ./fly-setup.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e

APP="5ml-agenticai-v1"
DB_NAME="${APP}-db"
REGION="iad"   # same region as the app (fly.toml: primary_region = "iad")

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  5ML Agentic AI — Fly Postgres Setup"
echo "═══════════════════════════════════════════════════════"
echo ""

# ── Step 1: Check if Postgres cluster already exists ─────────────────────────
echo "▸ Checking for existing Postgres cluster '${DB_NAME}'..."
if flyctl postgres list 2>/dev/null | grep -q "${DB_NAME}"; then
  echo "  ✅ Cluster '${DB_NAME}' already exists — skipping creation"
else
  echo "  ▸ Creating Postgres cluster '${DB_NAME}' in region '${REGION}'..."
  flyctl postgres create \
    --name "${DB_NAME}" \
    --region "${REGION}" \
    --initial-cluster-size 1 \
    --vm-size shared-cpu-1x \
    --volume-size 10
  echo "  ✅ Cluster created"
fi

echo ""

# ── Step 2: Attach Postgres to app (sets DATABASE_URL secret automatically) ──
echo "▸ Attaching '${DB_NAME}' to app '${APP}'..."
echo "  (If already attached, this will fail safely — that's OK)"
flyctl postgres attach \
  --app "${APP}" \
  "${DB_NAME}" || echo "  ⚠️  Already attached or attach failed — check fly secrets list"

echo ""

# ── Step 3: Enable pgvector extension ────────────────────────────────────────
echo "▸ Enabling pgvector extension on Postgres cluster..."
echo "  Note: This connects to the Postgres instance directly."
flyctl postgres connect \
  --app "${DB_NAME}" \
  --database postgres \
  --command "CREATE EXTENSION IF NOT EXISTS vector;" 2>/dev/null \
  || echo "  ⚠️  pgvector may not be available — the app will fall back to TEXT columns"

echo ""

# ── Step 4: Verify DATABASE_URL secret is set ────────────────────────────────
echo "▸ Verifying secrets..."
if flyctl secrets list --app "${APP}" 2>/dev/null | grep -q "DATABASE_URL"; then
  echo "  ✅ DATABASE_URL secret is set"
else
  echo "  ❌ DATABASE_URL not found in secrets — attach may have failed"
  echo "     Run manually: flyctl postgres attach --app ${APP} ${DB_NAME}"
  exit 1
fi

echo ""

# ── Step 5: Deploy (triggers auto schema creation + source seeding) ───────────
echo "▸ Deploying app (this triggers schema auto-creation on boot)..."
flyctl deploy --app "${APP}" --wait-timeout 120
echo "  ✅ Deploy complete"

echo ""

# ── Step 6: Verify schema ─────────────────────────────────────────────────────
echo "▸ Checking database status..."
sleep 5
RESULT=$(curl -sf "https://${APP}.fly.dev/api/admin/db-status" 2>/dev/null || echo '{"ok":false}')
echo "  Response: ${RESULT}"

if echo "${RESULT}" | grep -q '"ok":true'; then
  echo "  ✅ Schema verified — all tables exist"
else
  echo "  ⚠️  Some tables may be missing — check app logs: flyctl logs --app ${APP}"
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  Setup complete!"
echo ""
echo "  Next steps:"
echo "  1. Check DB status:  https://${APP}.fly.dev/api/admin/db-status"
echo "  2. Set API keys:     flyctl secrets set DEEPSEEK_API_KEY=... ANTHROPIC_API_KEY=... --app ${APP}"
echo "  3. Open dashboard:   https://${APP}.fly.dev/dashboard"
echo "  4. Go to Tender Intel → Sources → 'Discover sources' to start scanning"
echo "═══════════════════════════════════════════════════════"
echo ""
