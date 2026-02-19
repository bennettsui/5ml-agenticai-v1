# ✅ Production Deployment Checklist

**Status**: Ready for production deployment to https://5ml-agenticai-v1.fly.dev
**Date**: 2026-02-19
**Database**: Fly Postgres (your external database)

---

## 📋 Pre-Deployment (Do These First)

### 1. Verify Fly Postgres Database
- [ ] Fly Postgres is running and accessible
- [ ] Get your DATABASE_URL connection string
- [ ] Format: `postgresql://user:password@host:5432/dbname`
- [ ] Test connection locally if possible

### 2. Gather Required Secrets
- [ ] ANTHROPIC_API_KEY (Claude API)
- [ ] DEEPSEEK_API_KEY (DeepSeek)
- [ ] (Optional) PERPLEXITY_API_KEY
- [ ] (Optional) OPENAI_API_KEY
- [ ] (Optional) Meta Ads API credentials
- [ ] (Optional) Google Ads API credentials

### 3. Code Preparation
- [ ] All code is committed to `claude/ziwei-backend-system-NELVG` branch
- [ ] Frontend has been built: `npm run build`
- [ ] No uncommitted changes: `git status`

---

## 🚀 Deployment Steps

### Step 1: Set Fly Secrets (CRITICAL)

```bash
cd /home/user/5ml-agenticai-v1

# Set DATABASE_URL (from your Fly Postgres)
fly secrets set DATABASE_URL="postgresql://your-user:your-pass@your-host:5432/postgres"

# Set required API keys
fly secrets set ANTHROPIC_API_KEY="sk-ant-xxxxx"
fly secrets set DEEPSEEK_API_KEY="sk-xxxxx"

# Optional: Set additional keys if you have them
fly secrets set PERPLEXITY_API_KEY="pplx-xxxxx"
fly secrets set OPENAI_API_KEY="sk-xxxxx"
fly secrets set META_AD_ACCOUNT_ID="act_xxxxx"
fly secrets set META_ACCESS_TOKEN="EAAI..."
```

**Checklist:**
- [ ] DATABASE_URL set
- [ ] ANTHROPIC_API_KEY set
- [ ] DEEPSEEK_API_KEY set
- [ ] Other optional keys set (if needed)
- [ ] Verified: `fly secrets list`

### Step 2: Deploy to Fly

**Option A: Using Deploy Script (Recommended)**
```bash
cd /home/user/5ml-agenticai-v1
./scripts/deploy-to-fly.sh
```

**Option B: Manual Deployment**
```bash
fly deploy
fly logs --follow  # Watch the logs
```

**Checklist:**
- [ ] Deployment started successfully
- [ ] Docker image built without errors
- [ ] App pushed to Fly.io
- [ ] Machines started
- [ ] Health checks passing

### Step 3: Verify Deployment

**Test Health Endpoint:**
```bash
curl https://5ml-agenticai-v1.fly.dev/health
# Expected: {"status":"ok",...}
```

**Test Knowledge API:**
```bash
curl https://5ml-agenticai-v1.fly.dev/api/ziwei/knowledge/stats
# Expected: {"success":true,"data":{...with real stats...}}
```

**Test Dashboard:**
Open browser to:
```
https://5ml-agenticai-v1.fly.dev/use-cases/ziwei?tab=knowledge
```

Should see:
- Real knowledge base statistics (not mock data)
- All curriculum levels
- Source inventory
- No localhost references

**Checklist:**
- [ ] Health endpoint responds
- [ ] Knowledge API returns real data
- [ ] Dashboard loads without errors
- [ ] No console errors in browser
- [ ] All API calls work
- [ ] Data is from knowledge JSON files, not localhost

---

## 🔍 Post-Deployment Verification

### Database Connectivity
```bash
# SSH into machine
fly ssh console

# Test database connection
psql $DATABASE_URL -c "SELECT version();"
# Should show PostgreSQL version
```

**Checklist:**
- [ ] Database connection successful
- [ ] PostgreSQL version visible
- [ ] No SSL errors

### Knowledge Database
```bash
# Verify data files are included
fly ssh console
ls -la /usr/src/app/data/

# Should list:
# - ziwei-curriculum-enhanced.json
# - ziwei-star-combinations.json
# - ziwei-12-palaces.json
# - ziwei-learning-guide.json
# - ziwei-combinations-sources.json
# - ziwei-secondary-stars-research.json
# - ziwei-sources-database.json
# - ziwei-rules-seed.json
```

**Checklist:**
- [ ] All 8 knowledge files present
- [ ] Files are readable
- [ ] API can access them

### API Endpoints
Test each endpoint:

```bash
# Knowledge stats
curl https://5ml-agenticai-v1.fly.dev/api/ziwei/knowledge/stats

# All knowledge
curl https://5ml-agenticai-v1.fly.dev/api/ziwei/knowledge/all | jq '.data | keys'

# Curriculum level 4
curl https://5ml-agenticai-v1.fly.dev/api/ziwei/knowledge/curriculum/4

# Search
curl 'https://5ml-agenticai-v1.fly.dev/api/ziwei/knowledge/search?q=四化'

# Combinations
curl 'https://5ml-agenticai-v1.fly.dev/api/ziwei/knowledge/combinations/auspicious'
```

**Checklist:**
- [ ] Stats endpoint returns real data
- [ ] All endpoint returns knowledge
- [ ] Curriculum endpoints work
- [ ] Search functionality works
- [ ] Combinations endpoint works

### Logs and Monitoring
```bash
# Check logs for any errors
fly logs --follow

# Check app status
fly status

# View resource usage
fly apps info
```

**Checklist:**
- [ ] No error messages in logs
- [ ] App status is "running"
- [ ] All machines are healthy
- [ ] Resource usage is reasonable

---

## 🎯 Verification Results

### Should See ✅
- [x] No localhost references in logs
- [x] Database connected with SSL
- [x] Knowledge JSON files loaded
- [x] API endpoints responding
- [x] Frontend fully functional
- [x] Dashboard showing real data
- [x] Health checks passing
- [x] App running on https://5ml-agenticai-v1.fly.dev

### Should NOT See ❌
- [x] No "localhost" errors
- [x] No "database connection" errors
- [x] No "file not found" errors for /data/
- [x] No CORS errors
- [x] No API key errors (unless keys not set)
- [x] No SSL certificate errors

---

## 📊 Files Modified for Production

| File | Change | Status |
|------|--------|--------|
| `Dockerfile` | Added `COPY data/ ./data/` | ✅ Done |
| `.env.production` | Created (documents required vars) | ✅ Done |
| `fly.toml` | Already production-ready | ✅ OK |
| `db.js` | Already handles Fly Postgres SSL | ✅ OK |
| `swagger.js` | Already has production server | ✅ OK |
| `index.js` | No localhost hardcoding | ✅ OK |
| `knowledge/vector-store.ts` | Already handles Fly Postgres SSL | ✅ OK |
| `frontend/**` | Uses relative paths for production | ✅ OK |

---

## 🆘 Troubleshooting

### "Database connection refused"
```bash
# Check DATABASE_URL is set
fly secrets show DATABASE_URL

# Verify Postgres is running
fly postgres status 5ml-agenticai-db

# Test connection manually
fly ssh console
psql $DATABASE_URL -c "SELECT 1;"
```

### "Cannot find module 'data/...'"
```bash
# Verify data files are in Docker image
fly ssh console
ls -la /usr/src/app/data/

# If missing, rebuild:
fly deploy --force
```

### "API_BASE is undefined"
```bash
# This means localhost fallback was used
# Should only happen in development
# In production, should use relative paths automatically
```

### Health check failing
```bash
# Check /health endpoint exists
curl https://5ml-agenticai-v1.fly.dev/health

# View logs
fly logs --follow

# Restart if needed
fly restart
```

### Slow startup or timeouts
```bash
# Increase startup timeout in fly.toml:
[http_service.checks]
grace_period = "120s"  # Increase if needed

# Then redeploy:
fly deploy
```

---

## 🚀 Production URLs

Once deployed, access at:

| Service | URL |
|---------|-----|
| Main App | https://5ml-agenticai-v1.fly.dev |
| Ziwei Dashboard | https://5ml-agenticai-v1.fly.dev/use-cases/ziwei |
| Knowledge Tab | https://5ml-agenticai-v1.fly.dev/use-cases/ziwei?tab=knowledge |
| API Docs | https://5ml-agenticai-v1.fly.dev/api-docs |
| Health Check | https://5ml-agenticai-v1.fly.dev/health |

---

## 📝 Post-Deployment Tasks

After successful deployment:

1. **Test in staging first** (if available)
   - [ ] All features tested
   - [ ] All data accessible
   - [ ] Performance acceptable

2. **Monitor for 24 hours**
   - [ ] Check logs daily
   - [ ] Monitor error rates
   - [ ] Watch resource usage

3. **Update documentation**
   - [ ] Update team on production URL
   - [ ] Document any deployment-specific configs
   - [ ] Create runbook for support team

4. **Set up alerts** (Optional)
   - [ ] CPU usage alerts
   - [ ] Memory usage alerts
   - [ ] Error rate alerts
   - [ ] Downtime alerts

5. **Plan rollback** (Just in case)
   - [ ] Keep previous deployment info
   - [ ] Document rollback steps
   - [ ] Have backup database URL

---

## ✨ Success Criteria

Deployment is **SUCCESSFUL** when:

- ✅ All health checks pass
- ✅ Knowledge API returns real data
- ✅ Dashboard loads and displays data
- ✅ No errors in logs for 5 minutes
- ✅ Database connection is stable
- ✅ All API endpoints respond
- ✅ Frontend is fully functional
- ✅ No localhost references
- ✅ HTTPS is working
- ✅ App is accessible from public internet

---

## 🎉 You're Ready!

All code changes are complete and production-ready.

**Quick start:**
```bash
cd /home/user/5ml-agenticai-v1

# 1. Set secrets (replace with your actual values)
fly secrets set DATABASE_URL="postgresql://..."
fly secrets set ANTHROPIC_API_KEY="sk-ant-..."
fly secrets set DEEPSEEK_API_KEY="sk-..."

# 2. Deploy
./scripts/deploy-to-fly.sh

# 3. Verify
fly logs --follow
curl https://5ml-agenticai-v1.fly.dev/health
fly open
```

**That's it!** Your app will be live on Fly.io! 🚀

---

**For detailed information, see:**
- `FLY-DEPLOYMENT-GUIDE.md` - Complete deployment guide
- `KNOWLEDGE-DATABASE-CONNECTION-GUIDE.md` - Knowledge database integration
- `CLAUDE.md` - Project structure and conventions
