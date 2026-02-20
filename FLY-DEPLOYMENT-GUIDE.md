# 🚀 Fly.io Production Deployment - Complete Setup Guide

**Status**: Ready for production deployment
**Last Updated**: 2026-02-19
**Target**: https://5ml-agenticai-v1.fly.dev

---

## 🎯 Deployment Checklist

- ✅ Dockerfile configured with all app code
- ✅ Environment files created (.env.production)
- ✅ Database SSL handling fixed (db.js)
- ✅ Vector store SSL handling fixed
- ✅ Frontend API paths using relative URLs for production
- ✅ Fly.toml configured
- ✅ All localhost references reviewed and production-ready
- ⏳ **NEXT**: Set Fly secrets and deploy

---

## 📋 Pre-Deployment Requirements

### 1. Fly Postgres Database

You mentioned you have Fly Postgres. Verify it's running:

```bash
# List your Postgres apps
fly postgres list

# Or if database is attached to your main app, verify with:
fly config show
```

The DATABASE_URL should look like:
```
postgresql://username:password@your-app-db.internal:5432/postgres
```

### 2. Required API Keys

Have these ready:
- `ANTHROPIC_API_KEY` - Claude API key
- `DEEPSEEK_API_KEY` - DeepSeek API key
- (Optional) `PERPLEXITY_API_KEY`, `OPENAI_API_KEY`
- (Optional) Meta Ads API credentials
- (Optional) Google Ads API credentials

---

## 🔐 Step 1: Set Fly Secrets (CRITICAL)

All production secrets are set via `fly secrets set`, **NOT** in .env files:

```bash
# Navigate to the project
cd /home/user/5ml-agenticai-v1

# Set database URL (get this from Fly Postgres)
fly secrets set DATABASE_URL="postgresql://username:password@your-app-db.internal:5432/postgres"

# Set required API keys
fly secrets set ANTHROPIC_API_KEY="sk-ant-xxxxx"
fly secrets set DEEPSEEK_API_KEY="sk-xxxxx"

# Optional: Set additional API keys
fly secrets set PERPLEXITY_API_KEY="pplx-xxxxx"
fly secrets set OPENAI_API_KEY="sk-xxxxx"

# Verify secrets are set
fly secrets list
```

**⚠️ IMPORTANT**:
- Never commit secrets to git
- Always use `fly secrets set` for production
- Local .env is for development only

---

## 🏗️ Step 2: Initialize Database Schema

The database needs to be initialized with tables. Run this ONCE after deploying:

```bash
# SSH into the running Fly.io machine
fly ssh console

# Once inside, run database initialization
cd /usr/src/app
node -e "const db = require('./db'); db.pool.query('SELECT version();').then(r => console.log('✅ DB connected:', r.rows[0].version)).catch(e => console.error('❌ DB error:', e.message))"
```

Or let the app auto-initialize on startup (recommended).

---

## 📦 Step 3: Build and Deploy to Fly

### Option A: Deploy with Fly CLI (Recommended)

```bash
# Ensure you're in the project root
cd /home/user/5ml-agenticai-v1

# Log in to Fly.io
fly auth login

# Deploy (this will build and push Docker image)
fly deploy

# Watch the deployment
fly logs --follow
```

### Option B: Deploy from Git Push

If you have a deploy trigger set up:
```bash
git push origin claude/ziwei-backend-system-NELVG
# Fly will auto-detect and deploy
```

---

## ✅ Step 4: Verify Deployment

### Check App Status
```bash
# See if app is running
fly status

# Get app URL
fly open

# Should open: https://5ml-agenticai-v1.fly.dev
```

### Test Health Endpoints
```bash
# Check health
curl https://5ml-agenticai-v1.fly.dev/health

# Expected response:
# {"status":"ok",...}

# Check if knowledge API works
curl https://5ml-agenticai-v1.fly.dev/api/ziwei/knowledge/stats

# Expected response:
# {"success":true,"data":{...}}
```

### Test Dashboard
Visit: https://5ml-agenticai-v1.fly.dev/use-cases/ziwei?tab=knowledge

You should see:
- ✅ Real knowledge base statistics
- ✅ All curriculum levels
- ✅ Knowledge sources
- ✅ No localhost references

---

## 🔍 Production Changes Made

### 1. Dockerfile (`/Dockerfile`)
- ✅ Now copies `/data/` directory with knowledge JSON files
- ✅ Uses production environment variables
- ✅ Health check configured

**Before:**
```dockerfile
COPY knowledge/ ./knowledge/
COPY infrastructure/ ./infrastructure/
# data/ was missing ❌
```

**After:**
```dockerfile
COPY knowledge/ ./knowledge/
COPY infrastructure/ ./infrastructure/
COPY data/ ./data/  # ✅ Added
```

### 2. Environment Configuration

**Development (.env):**
```
DATABASE_URL=postgresql://agenticai:agenticai123@localhost:5432/agenticai_db
NODE_ENV=development
```

**Production (.env.production):**
```
DATABASE_URL=${DATABASE_URL}  # Set via fly secrets
NODE_ENV=production
PUBLIC_BASE_URL=https://5ml-agenticai-v1.fly.dev
```

### 3. Database Configuration (db.js)
- ✅ Already handles SSL for non-localhost databases
- ✅ Loads AWS RDS CA certificates if needed
- ✅ Works with Fly Postgres out of the box

### 4. Frontend API Paths
- ✅ Photo booth uses relative URLs in production
- ✅ Knowledge dashboard uses relative URLs
- ✅ All components support both localhost and production

---

## 🗄️ Database Configuration

### Fly Postgres Details

Your Fly Postgres setup:
- **Hostname**: `your-app-db.internal` (internal Fly network)
- **Port**: `5432`
- **Database**: `postgres` (default)
- **User**: Set during Fly Postgres creation
- **Password**: Set during Fly Postgres creation

### Connection String Format
```
postgresql://USERNAME:PASSWORD@your-app-db.internal:5432/postgres
```

### Set with:
```bash
fly secrets set DATABASE_URL="postgresql://USER:PASS@DB_HOST:5432/DB_NAME"
```

---

## 📂 Knowledge Database Integration

All knowledge JSON files are now included in production:

| File | Status | Location |
|------|--------|----------|
| ziwei-curriculum-enhanced.json | ✅ Included | `/data/` |
| ziwei-star-combinations.json | ✅ Included | `/data/` |
| ziwei-12-palaces.json | ✅ Included | `/data/` |
| ziwei-learning-guide.json | ✅ Included | `/data/` |
| ziwei-combinations-sources.json | ✅ Included | `/data/` |
| ziwei-secondary-stars-research.json | ✅ Included | `/data/` |
| ziwei-sources-database.json | ✅ Included | `/data/` |
| ziwei-rules-seed.json | ✅ Included | `/data/` |

**API Endpoints Available:**
- `GET /api/ziwei/knowledge/stats` - Real statistics
- `GET /api/ziwei/knowledge/all` - All knowledge
- `GET /api/ziwei/knowledge/curriculum/:level` - Specific level
- `GET /api/ziwei/knowledge/search?q=keyword` - Search

---

## 🐛 Troubleshooting

### App Won't Start
```bash
# Check logs
fly logs --follow

# Common issues:
# 1. DATABASE_URL not set
# 2. API keys missing
# 3. Database connection timeout
```

### Database Connection Failed
```bash
# Verify secret is set
fly secrets show DATABASE_URL

# Check database is running
fly postgres status 5ml-agenticai-db

# Test connection (SSH into machine)
fly ssh console
psql $DATABASE_URL -c "SELECT version();"
```

### Knowledge API Returns Empty
```bash
# Verify data files are in Docker image
fly ssh console
ls -la /usr/src/app/data/

# Should show:
# ziwei-curriculum-enhanced.json
# ziwei-star-combinations.json
# etc.
```

### Health Check Failing
```bash
# The health check expects /health endpoint
# Verify it's responding
curl https://5ml-agenticai-v1.fly.dev/health

# If failing, check logs:
fly logs --follow
```

---

## 📊 Environment Variables Summary

| Variable | Development | Production | Source |
|----------|-------------|-----------|--------|
| `NODE_ENV` | development | production | fly.toml |
| `PORT` | 8080 | 8080 | fly.toml |
| `DATABASE_URL` | localhost | Fly secret | `fly secrets set` |
| `PUBLIC_BASE_URL` | localhost:8080 | 5ml-agenticai-v1.fly.dev | fly.toml |
| `ANTHROPIC_API_KEY` | .env | Fly secret | `fly secrets set` |
| `DEEPSEEK_API_KEY` | .env | Fly secret | `fly secrets set` |
| `NODE_EXTRA_CA_CERTS` | not needed | /etc/ssl/certs/ca-certificates.crt | Dockerfile |

---

## 🚀 Deployment Steps Summary

```bash
# 1. Verify Fly Postgres is running
fly postgres list

# 2. Set all secrets
fly secrets set DATABASE_URL="postgresql://..."
fly secrets set ANTHROPIC_API_KEY="sk-ant-..."
fly secrets set DEEPSEEK_API_KEY="sk-..."
# (set other API keys as needed)

# 3. Deploy
fly deploy

# 4. Watch logs
fly logs --follow

# 5. Test
curl https://5ml-agenticai-v1.fly.dev/health
curl https://5ml-agenticai-v1.fly.dev/api/ziwei/knowledge/stats

# 6. Visit dashboard
# https://5ml-agenticai-v1.fly.dev/use-cases/ziwei?tab=knowledge
```

---

## 📝 File Changes Summary

**Modified Files:**
1. `Dockerfile` - Added `COPY data/ ./data/`
2. `.env.production` - Created (documents required vars)

**Already Production-Ready:**
- `db.js` - SSL handling ✅
- `knowledge/embeddings/vector-store.ts` - SSL handling ✅
- `frontend/**` - Relative URLs ✅
- `swagger.js` - Multiple servers configured ✅
- `fly.toml` - Properly configured ✅
- `index.js` - CORS ready ✅

**No Changes Needed:**
- Photo booth config - Already uses env vars
- Frontend pages - Already support production URLs
- Services - Already support production setup

---

## 🎉 You're Ready to Deploy!

All the code is production-ready. Just:

1. Set the Fly secrets
2. Run `fly deploy`
3. Visit https://5ml-agenticai-v1.fly.dev

Your knowledge dashboard, all API endpoints, and the complete Ziwei astrology system will be live! 🚀

---

## 📞 Need Help?

Check logs:
```bash
fly logs --follow
```

SSH into machine:
```bash
fly ssh console
```

Reset app (if needed):
```bash
fly restart
```

View config:
```bash
fly config show
```

---

## ✨ After Deployment

### Monitor in Production
```bash
# Real-time logs
fly logs --follow

# App metrics
fly status

# Resource usage
fly apps info
```

### Update Code
```bash
# After making changes locally:
git add .
git commit -m "Update feature"
git push origin claude/ziwei-backend-system-NELVG

# Then deploy:
fly deploy
```

### Scale if Needed
```bash
# More machines
fly scale count 2

# More memory
fly scale memory 2048
```

---

**Deployment ready! 🚀**
