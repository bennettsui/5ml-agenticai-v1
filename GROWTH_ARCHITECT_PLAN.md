# 5ML Growth Architect — Implementation Plan

## Overview

Build a new productized use case (`use-cases/growth-architect/`) that functions as a complete **agentic growth system**: input a brand/product, output a full growth strategy, marketing assets, CRM flows, EDM campaigns, performance tracking, and periodic reviews — all driven by coordinated AI agents sharing a knowledge base.

**Approach**: Extend and connect existing infrastructure. No duplication.

---

## What Gets Reused (No Rebuild)

| Existing Asset | Reused For |
|---|---|
| `services/deepseekService.js` | All agent LLM calls |
| `services/rag-service.js` | Growth KB context retrieval |
| `services/schedule-registry.js` | Weekly review job tracking |
| `services/scheduler.js` | Cron scheduling weekly loop |
| `utils/modelHelper.js` | Model routing (DeepSeek → Haiku → Sonnet) |
| `db.js` (PostgreSQL pool) | All new table queries |
| `/api/brands/*` | Brand/client profile lookup |
| `/api/ads/*` | Ads performance data read |
| `/api/conversations/*` | Growth chat history |
| `lib/llm.js` | Claude model fallback calls |
| Topic Intelligence `edmService.js` pattern | EDM generation + caching |
| CSO Orchestrator pattern | Growth Architect Orchestrator design |
| Dashboard tab architecture | New `growth` tab (no auto-fetch) |
| Dark theme UI conventions | All new components |

---

## Phase 1 — Core Orchestration + Weekly Reporting Loop (MVP)

### Goal
Working end-to-end: input a brand → generate a growth plan → schedule weekly review reports.

### 1a. New Database Tables (index.js `initDatabase`)

```sql
-- Master growth plans per brand
CREATE TABLE IF NOT EXISTS growth_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name TEXT NOT NULL,
  plan_data JSONB NOT NULL,          -- full 6-block plan output
  status TEXT DEFAULT 'draft',       -- draft | active | archived
  phase TEXT DEFAULT 'pmf',          -- pmf | funnel | scaling
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Experiment hypotheses (WHO, WHAT, WHICH channel)
CREATE TABLE IF NOT EXISTS growth_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES growth_plans(id),
  brand_name TEXT NOT NULL,
  hypothesis TEXT NOT NULL,
  channel TEXT,                      -- fb | gdn | sem | kol | email | ...
  status TEXT DEFAULT 'pending',     -- pending | running | completed | paused
  result_data JSONB,                 -- outcome, metrics, learnings
  tags TEXT[],                       -- ['A1', 'hook-problem', ...]
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Weekly review snapshots (agent-generated)
CREATE TABLE IF NOT EXISTS growth_weekly_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name TEXT NOT NULL,
  plan_id UUID REFERENCES growth_plans(id),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  summary JSONB NOT NULL,            -- key_metrics, anomalies, recommendations
  human_decisions JSONB,             -- what humans chose to scale/pause/pivot
  status TEXT DEFAULT 'pending',     -- pending | reviewed | actioned
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Growth metrics snapshots (sourced from ads + CRM)
CREATE TABLE IF NOT EXISTS growth_metrics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name TEXT NOT NULL,
  snapshot_date DATE NOT NULL,
  channel TEXT,
  ctr NUMERIC(10,6),
  cpc NUMERIC(18,4),
  cvr NUMERIC(10,6),
  cpa NUMERIC(18,4),
  roas NUMERIC(10,6),
  cac NUMERIC(18,4),
  ltv NUMERIC(18,4),
  spend NUMERIC(18,4),
  revenue NUMERIC(18,4),
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 1b. New Agents (JS, in `use-cases/growth-architect/agents/`)

**Pattern**: All follow existing agent template (DeepSeek primary → Claude fallback, return `{ ...result, _meta }`).

#### `growthArchitectOrchestrator.js`
- **Role**: Orchestrating agent. Coordinates 6-block plan generation.
- **Inputs**: brand_name, product_brief, icp, channels, budget, goals
- **Reads KB**: brand profile from `/api/brands/:name`, past experiments from `growth_experiments`, past reviews from `growth_weekly_reviews`
- **Calls in sequence**: strategyAgent → researchAgent (parallel) → produces merged 6-block plan
- **Writes**: saves plan to `growth_plans` table
- **Model**: DeepSeek Reasoner (full system prompt from Section 1 of the spec)

#### `strategyAgent.js`
- **Role**: Block 1 (PMF & ICP) + Block 2 (Funnel & Growth Loop)
- **Inputs**: product brief, ICP segments, existing data
- **Reads KB**: RAG service for similar past briefs/ICPs
- **Output**: `{ icp, hypotheses, funnel_stages, growth_loops, agents_map }`
- **Writes back**: new ICP + hypotheses to `growth_experiments` (pending status)

#### `reportingAgent.js`
- **Role**: Block 6 (Weekly Review). Runs on cron.
- **Inputs**: brand_name, week range
- **Reads**: `growth_metrics_snapshots` (last 7 days), `growth_experiments` (running), `ads_daily_performance` (existing ads table)
- **Output**: `{ summary, key_metrics, anomalies, experiment_results, recommendations }`
- **Writes**: saves to `growth_weekly_reviews`
- **Schedule**: Every Monday 09:00 HKT

### 1c. API Routes (`use-cases/growth-architect/api/routes.js`)

```
POST /api/growth/plan                  — generate full 6-block growth plan
GET  /api/growth/plan/:brand_name      — get latest plan for brand
GET  /api/growth/plans                 — list all active plans

POST /api/growth/weekly-review         — trigger review for brand (manual)
GET  /api/growth/weekly-reviews/:brand — list all weekly reviews
GET  /api/growth/weekly-review/:id     — get specific review

GET  /api/growth/experiments/:brand    — list experiments
PATCH /api/growth/experiments/:id      — update status/result

GET  /api/growth/metrics/:brand        — get metrics snapshots
POST /api/growth/metrics               — save metrics snapshot (from ads agent)
```

### 1d. Scheduled Weekly Job

Register in `services/scheduler.js`:
```
Name: Growth Weekly Review
Cron: 0 9 * * 1  (Every Monday 09:00)
Group: growth
Action: For each active growth plan → call reportingAgent → save to growth_weekly_reviews
```

### 1e. Frontend — `growth` Tab

New tab in `frontend/app/dashboard/page.tsx`:
- Tab ID: `growth`
- Icon: `TrendingUp` (lucide-react)
- Component: `GrowthArchitect` (`frontend/components/GrowthArchitect.tsx`)

Sub-tabs inside `GrowthArchitect`:
1. **Plan Builder** — brand selector + brief form → trigger orchestrator → display 6-block plan
2. **Weekly Reviews** — list of reviews per brand, collapsible detail view
3. **Experiments** — table of hypotheses with status chips + update button
4. *(Phases 2-4 add more sub-tabs)*

**No auto-fetch on mount** — all data loaded via button click per CLAUDE.md.

---

## Phase 2 — Asset Generation Pipeline

### Goal
Agents generate versioned marketing assets (ads copy, social posts, scripts) tagged to experiments in the knowledge base.

### 2a. New Database Table

```sql
CREATE TABLE IF NOT EXISTS growth_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name TEXT NOT NULL,
  plan_id UUID REFERENCES growth_plans(id),
  experiment_id UUID REFERENCES growth_experiments(id),
  asset_type TEXT NOT NULL,          -- ad_copy | social_post | edm | landing_copy | video_script | kol_brief
  channel TEXT,                      -- fb | ig | gdn | sem | email | whatsapp
  funnel_stage TEXT,                 -- awareness | acquisition | activation | retention | referral
  tag TEXT,                          -- 'A1', 'Hook-Problem', 'Offer-Trial' etc.
  content JSONB NOT NULL,            -- { headline, body, cta, hook, angle }
  status TEXT DEFAULT 'draft',       -- draft | approved | live | retired
  performance JSONB,                 -- linked CTR/CVR once live
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 2b. New Agents

#### `copyAgent.js` (nanobanana wrapper)
- **Role**: Block 3 assets — ad copy, landing pages, email/WhatsApp scripts
- **Inputs**: brand, icp, hypothesis, funnel_stage, channel, hook_angle
- **System prompt**: nanobanana copywriting framework (loaded from KB or hardcoded)
- **Output**: `{ headline, body, cta, hook, angle, tag }` × N variants
- **Writes**: saves to `growth_assets` (type: `ad_copy`, `landing_copy`, `email_template`)
- **Model**: Claude Sonnet (creative work)

#### `socialAgent.js` (social content tool wrapper)
- **Role**: Block 3 social assets — posts, reels scripts, KOL briefs
- **Inputs**: brand, icp, campaign_theme, platform (IG/Xiaohongshu/LinkedIn)
- **Output**: `{ caption, hashtags, hook_line, visual_direction, kol_brief }`
- **Writes**: saves to `growth_assets` (type: `social_post`, `kol_brief`)
- **Model**: Claude Sonnet (creative work)

### 2c. New API Routes

```
POST /api/growth/assets/generate     — trigger copyAgent or socialAgent
GET  /api/growth/assets/:brand       — list assets with filters (type, channel, status)
PATCH /api/growth/assets/:id         — approve/retire, add performance data
```

### 2d. Frontend — Asset Library Sub-Tab

Inside `GrowthArchitect`:
- Sub-tab: **Asset Library**
- Filter bar: channel, type, funnel stage, status
- Generate button: opens modal to pick agent (Copy vs Social), inputs, triggers generation
- Card grid: assets with tag chips, approve/retire actions
- Visual diagram: "Where does this asset sit in the funnel?" (static diagram placed here)

---

## Phase 3 — CRM Communication Flow & EDM Generation

### Goal
Agent designs CRM sequences (WhatsApp/email drip flows) and generates EDM HTML — connected to the existing CRM database.

### 3a. New Database Tables

```sql
-- CRM communication flow definitions
CREATE TABLE IF NOT EXISTS growth_crm_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name TEXT NOT NULL,
  plan_id UUID REFERENCES growth_plans(id),
  flow_name TEXT NOT NULL,
  trigger_event TEXT,                -- lead_captured | purchase | 7day_inactive | ...
  audience_segment TEXT,
  flow_steps JSONB NOT NULL,         -- [{ delay, channel, asset_id, message }]
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- EDM campaigns (extends topic-intelligence EDM pattern)
CREATE TABLE IF NOT EXISTS growth_edm_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name TEXT NOT NULL,
  plan_id UUID REFERENCES growth_plans(id),
  campaign_name TEXT NOT NULL,
  campaign_type TEXT,                -- nurture | reactivation | upsell | weekly_digest
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  recipients JSONB,                  -- segment definition or list
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  open_rate NUMERIC(10,6),
  click_rate NUMERIC(10,6),
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3b. New Agent

#### `crmCommunicationAgent.js`
- **Role**: Block 3 (CRM assets) + Block 5 (CRM integration)
- **Inputs**: brand, icp, funnel_stage, trigger_event, audience_segment
- **Reads**: `crm_clients` (existing), `growth_experiments`, `growth_assets`
- **Output**: `{ flow_steps, edm_subject, edm_html, whatsapp_sequences }`
- **Writes**: saves to `growth_crm_flows` + `growth_edm_campaigns`
- **EDM pattern**: Reuses `edmService.js` caching pattern from topic-intelligence
- **Model**: DeepSeek (flow structure) → Claude Sonnet (HTML generation)

### 3c. New API Routes

```
POST /api/growth/crm-flows           — generate CRM flow for brand
GET  /api/growth/crm-flows/:brand    — list flows
PATCH /api/growth/crm-flows/:id      — update/activate flow

POST /api/growth/edm/generate        — generate EDM campaign HTML
GET  /api/growth/edm/:brand          — list campaigns
POST /api/growth/edm/:id/send        — mark as sent + record timestamp
```

### 3d. Frontend — CRM Flows Sub-Tab

Inside `GrowthArchitect`:
- Sub-tab: **CRM & EDM**
- Flow builder: visual step-by-step sequence (trigger → steps → conditions)
- EDM preview: rendered HTML iframe preview
- Campaign status tracker: draft → scheduled → sent + open/click metrics

---

## Phase 4 — Knowledge Base / RAG Integration

### Goal
All agents read from and write back to a persistent growth knowledge base. System learns over time.

### 4a. New Database Table

```sql
CREATE TABLE IF NOT EXISTS growth_kb (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name TEXT,                   -- null = global (playbooks, frameworks)
  category TEXT NOT NULL,            -- icp | experiment | playbook | performance | asset_tag
  title TEXT NOT NULL,
  content TEXT NOT NULL,             -- full text for RAG indexing
  metadata JSONB,                    -- tags, channel, funnel_stage, created_by_agent
  embedding vector(1536),            -- pgvector for semantic search
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_growth_kb_brand ON growth_kb(brand_name);
CREATE INDEX IF NOT EXISTS idx_growth_kb_category ON growth_kb(category);
```

### 4b. Growth Analytics Agent

#### `growthAnalyticsAgent.js`
- **Role**: Block 4 — reads ad platform data, computes KPIs, ROAS modeling
- **Reads**: `ads_daily_performance` (existing!), `growth_metrics_snapshots`, `growth_experiments`
- **Computes**: CTR, CPC, CVR, CPA, ROAS, break-even ROAS, LTV/CAC
- **ROAS structure**:
  - Current: `ROAS = Revenue / Spend`
  - Break-even: `Break-even ROAS = 1 / Gross Margin %`
  - Scaling model: `Projected Revenue = ROAS × New Budget`
- **Writes**: saves snapshot to `growth_metrics_snapshots` + KB entry to `growth_kb`
- **Model**: DeepSeek (analysis + interpretation)

### 4c. KB-Augmented RAG for All Agents

Update `services/rag-service.js` to include `growth_kb` documents:
- On plan generation: seed RAG with brand's past experiments, ICP, playbooks
- After each weekly review: write new learnings into `growth_kb`
- Agents call `ragService.getContext(query, 'growth', topK=5)` for context

### 4d. New API Routes

```
GET  /api/growth/kb/:brand           — search KB for brand
POST /api/growth/kb                  — manually add KB entry
GET  /api/growth/roas/:brand         — ROAS model for brand
POST /api/growth/roas/model          — compute ROAS projection with inputs
```

### 4e. Frontend — ROAS Model Sub-Tab

Inside `GrowthArchitect`:
- Sub-tab: **ROAS & Finance**
- Input sliders: current spend, ROAS, gross margin %
- Live computed outputs: break-even ROAS, projected revenue at 2× / 5× budget
- Phase progression: PMF → Funnel → Scaling (status indicator)

---

## Agent Map Summary

| Agent | File | Block | Phase | Model |
|---|---|---|---|---|
| Growth Architect Orchestrator | `growthArchitectOrchestrator.js` | All | 1 | DeepSeek |
| Strategy Agent | `strategyAgent.js` | 1, 2 | 1 | DeepSeek |
| Reporting Agent | `reportingAgent.js` | 6 | 1 | DeepSeek |
| Copy Agent (nanobanana) | `copyAgent.js` | 3 | 2 | Claude Sonnet |
| Social Agent | `socialAgent.js` | 3 | 2 | Claude Sonnet |
| CRM Communication Agent | `crmCommunicationAgent.js` | 3, 5 | 3 | DeepSeek + Sonnet |
| Growth Analytics Agent | `growthAnalyticsAgent.js` | 4 | 4 | DeepSeek |

---

## Knowledge Base Read/Write Map

| Agent | Reads From KB | Writes To KB |
|---|---|---|
| Orchestrator | Brand profile, past plans, past experiments | New plan summary |
| Strategy Agent | ICPs, past hypotheses, channel playbooks | New ICP, new experiment hypotheses |
| Copy Agent | Approved hooks, asset tags, nanobanana framework | New asset with tag + angle |
| Social Agent | Brand voice, past social performance | New content with platform tag |
| Analytics Agent | Past ROAS, channel benchmarks | New metrics snapshot, performance tags |
| CRM Agent | Customer segments, past flow results | New flow definition, EDM performance |
| Reporting Agent | All above | New weekly learnings, recommendations |

---

## Integration Map (Existing → Growth)

| Existing System | Used In Growth Architect |
|---|---|
| `/api/brands/:name` | Orchestrator reads brand profile |
| `/api/ads/*` (ads_daily_performance) | Analytics Agent reads channel data |
| `/api/conversations/*` | Growth chat history stored here |
| `services/deepseekService.js` | All agents primary LLM |
| `services/rag-service.js` | Strategy + Reporting agents context |
| `services/schedule-registry.js` | Weekly review job registered here |
| `crm_clients` table | CRM Agent reads client segments |
| Topic Intel `edmService.js` pattern | EDM caching + HTML generation |
| CSO Orchestrator pattern | Growth Architect Orchestrator structure |

---

## File Structure

```
use-cases/growth-architect/
├── api/
│   └── routes.js                    # All /api/growth/* endpoints
├── agents/
│   ├── growthArchitectOrchestrator.js
│   ├── strategyAgent.js
│   ├── reportingAgent.js            # Phase 1
│   ├── copyAgent.js                 # Phase 2
│   ├── socialAgent.js               # Phase 2
│   ├── crmCommunicationAgent.js     # Phase 3
│   └── growthAnalyticsAgent.js      # Phase 4
├── services/
│   └── growthEdmService.js          # Phase 3 (extends topic-intel pattern)
└── db/
    └── schema.js                    # CREATE TABLE statements

frontend/components/
└── GrowthArchitect.tsx              # Main tab component with sub-tabs
```

**Backend**: Routes registered in `index.js` under `if (process.env.ENABLE_GROWTH)` flag (or always-on).

---

## Development Order (Exact Sequence)

### Sprint 1 (Phase 1 core)
1. `use-cases/growth-architect/db/schema.js` — 4 tables (plans, experiments, weekly_reviews, metrics_snapshots)
2. `use-cases/growth-architect/agents/strategyAgent.js`
3. `use-cases/growth-architect/agents/reportingAgent.js`
4. `use-cases/growth-architect/agents/growthArchitectOrchestrator.js`
5. `use-cases/growth-architect/api/routes.js` — POST plan, GET plan, weekly review routes
6. Register routes in `index.js`
7. Register weekly cron job in `services/scheduler.js`
8. `frontend/components/GrowthArchitect.tsx` — Plan Builder + Weekly Reviews + Experiments sub-tabs
9. Add `growth` tab to `frontend/app/dashboard/page.tsx`
10. `npm run build` — verify, then commit + push

### Sprint 2 (Phase 2 assets)
1. `growth_assets` table migration
2. `copyAgent.js` (nanobanana system prompt)
3. `socialAgent.js`
4. Asset generation routes
5. Asset Library sub-tab in `GrowthArchitect.tsx`
6. Build + commit + push

### Sprint 3 (Phase 3 CRM + EDM)
1. `growth_crm_flows` + `growth_edm_campaigns` tables
2. `crmCommunicationAgent.js`
3. `growthEdmService.js`
4. CRM flow + EDM routes
5. CRM & EDM sub-tab
6. Build + commit + push

### Sprint 4 (Phase 4 KB + ROAS)
1. `growth_kb` table with pgvector column
2. `growthAnalyticsAgent.js`
3. Seed RAG with growth context on plan creation
4. ROAS model routes
5. ROAS & Finance sub-tab
6. Full integration test with real brand data
7. Build + commit + push

---

## Cost Estimate (Monthly, at production load)

| Component | Model | Runs/Month | Est. Cost |
|---|---|---|---|
| Growth Plan Generation (orchestrator) | DeepSeek | 20 | ~$0.50 |
| Strategy Agent | DeepSeek | 20 | ~$0.30 |
| Weekly Reporting Agent | DeepSeek | 40 (10 brands × 4 weeks) | ~$0.80 |
| Copy Agent (nanobanana) | Claude Sonnet | 50 asset batches | ~$3.00 |
| Social Agent | Claude Sonnet | 30 batches | ~$1.80 |
| CRM/EDM Agent | DeepSeek + Sonnet | 20 flows | ~$1.20 |
| Analytics Agent | DeepSeek | 40 | ~$0.60 |
| **Total Growth Architect** | | | **~$8.20/month** |

---

## Definition of Done (Phase 1 MVP)

- [ ] All 4 Phase 1 tables created on DB init
- [ ] Orchestrator generates a valid 6-block growth plan for a test brand
- [ ] Plan saved to `growth_plans` table
- [ ] Hypotheses saved to `growth_experiments`
- [ ] Weekly review cron job registered + visible in `/api/scheduled-jobs`
- [ ] Manual `/api/growth/weekly-review` POST returns structured review
- [ ] `growth` tab visible in dashboard with Plan Builder working
- [ ] `npm run build` passes with zero errors
- [ ] Pushed to `claude/growth-architect-setup-Ixml3`
