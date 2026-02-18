# Ziwei Knowledge Center - Complete Interface Guide

**Status:** Ready for Implementation
**Components:** Frontend UI + Backend Services + API Endpoints

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ZiweiKnowledgeCenter.tsx (Main Component)                       │
│  ├─ OverviewTab      (📊 Dashboard with key metrics)            │
│  ├─ GapsTab          (⚠️ Knowledge gap management)              │
│  ├─ ScrapingTab      (🔄 Scraping progress tracking)            │
│  ├─ SourcesTab       (📖 Source management by phase)            │
│  └─ SettingsTab      (⚙️ Configuration & budgets)               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓ REST API
┌─────────────────────────────────────────────────────────────────┐
│                  BACKEND (Node.js/Express)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  API Endpoints (/api/ziwei/knowledge/*, /scraping/*, etc.)      │
│  │                                                               │
│  ├─ Knowledge Management API                                     │
│  │  ├─ GET /knowledge/gaps        → Retrieve all gaps           │
│  │  ├─ GET /knowledge/gaps/:id    → Specific gap details        │
│  │  └─ POST /knowledge/gaps/:id/start-scraping                  │
│  │                                                               │
│  ├─ Scraping Control API                                        │
│  │  ├─ GET /scraping/sources      → All sources status          │
│  │  ├─ GET /scraping/phases       → Phase progress              │
│  │  ├─ POST /scraping/phases/:n/start                           │
│  │  ├─ POST /scraping/phases/:n/pause                           │
│  │  └─ POST /scraping/phases/:n/resume                          │
│  │                                                               │
│  ├─ Items Management API                                        │
│  │  ├─ GET /scraping/items        → Filtered items              │
│  │  ├─ POST /scraping/items/:id/validate                        │
│  │  ├─ POST /scraping/items/:id/integrate                       │
│  │  └─ POST /scraping/items/batch-integrate                     │
│  │                                                               │
│  ├─ Metrics & Reporting API                                     │
│  │  ├─ GET /metrics/overview      → Dashboard metrics           │
│  │  ├─ GET /metrics/by-phase      → Phase breakdown             │
│  │  └─ POST /metrics/export-report                              │
│  │                                                               │
│  └─ Configuration API                                           │
│     ├─ GET /config                → Current configuration       │
│     ├─ PUT /config                → Update config               │
│     └─ POST /config/reset         → Reset all                   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓ Service Layer
┌─────────────────────────────────────────────────────────────────┐
│         ORCHESTRATION & AGENT SERVICES (TypeScript)             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ZiweiScrapingOrchestrator (Main Coordinator)                   │
│  ├─ initialize()              → Setup phases & gaps              │
│  ├─ startPhase(n)             → Begin phase scraping             │
│  ├─ scheduleSourceScraping()  → Queue source                     │
│  ├─ validateItems()           → Run validation layer             │
│  ├─ critiqueItems()           → Devil's Advocate review          │
│  ├─ integrateItems()          → Add to knowledge base            │
│  ├─ pauseAllScraping()        → Stop all operations              │
│  ├─ resumeScraping()          → Resume operations                │
│  ├─ getMetrics()              → Retrieve current metrics         │
│  └─ generateReport()          → Comprehensive report             │
│                                                                   │
│  Search Agent (Web Scraping)  [Phase 1-4]                       │
│  ├─ Search Priority 1 sources (Wang Ting Zhi, Official)        │
│  ├─ Search Priority 2 sources (Educational platforms)          │
│  └─ Search Priority 3 sources (Supporting references)           │
│                                                                   │
│  Validation Agent (Quality Control)  [After Search]             │
│  ├─ Multi-source cross-validation                               │
│  ├─ Conflict detection & resolution                             │
│  ├─ Source credibility scoring                                  │
│  └─ Confidence score assignment (0.0-1.0)                       │
│                                                                   │
│  Devil's Advocate Agent (Critique)  [Optional/Selective]        │
│  ├─ Challenge assumptions (5 core questions)                    │
│  ├─ Identify knowledge gaps                                     │
│  ├─ Recommend improvements (prioritized)                        │
│  ├─ Adjust confidence (-0.25 to +0.10)                          │
│  ├─ SCOPE: Confidence < 0.70 OR conflicts exist                │
│  ├─ LENGTH: 1-10 critique points (by priority)                 │
│  ├─ TIME: Max 5 minutes per item (escalate if over)            │
│  ├─ TOKENS: Max 2,000 per critique (summarize & escalate)      │
│  └─ STOPS: Time limit, concerns addressed, budget exhausted    │
│                                                                   │
│  Integration Agent (Database Update)  [After Critique]          │
│  ├─ Pre-integration validation                                  │
│  ├─ Database insert/update                                      │
│  ├─ Version control & attribution                               │
│  └─ Cache invalidation & verification                           │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓ Data Layer
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE (PostgreSQL)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Tables:                                                         │
│  ├─ ziwei_stars (104 stars with metadata)                       │
│  ├─ ziwei_star_palace_meanings (1,248 combinations)             │
│  ├─ ziwei_transformation_rules (440+ rules)                     │
│  ├─ ziwei_luck_cycles (Decade/Annual/Monthly/Daily)             │
│  ├─ ziwei_scraping_sources (32 sources)                         │
│  ├─ ziwei_scraped_items (Raw data from scraping)                │
│  ├─ ziwei_knowledge_gaps (20 gaps tracked)                      │
│  ├─ ziwei_scraping_jobs (Job history & logs)                    │
│  ├─ ziwei_scraping_metrics (Performance data)                   │
│  └─ ziwei_conflicts (Conflicting interpretations)               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Frontend Interface Walkthrough

### 1. **Overview Tab** (📊 Dashboard)

**Key Metrics Displayed:**
- Knowledge Coverage: `15%` → `85%` (target Phase 4) → `95%+` (Year 1)
- Knowledge Gaps: `20` total, `6` critical
- Active Scraping: `5` sources currently running
- Target Completion: `9 weeks` (Phases 1-4)

**Progress Visualization:**
- Coverage bars for each category (Stars, Palaces, Transformations, Patterns)
- Color-coded by completeness (Blue = progress gradient)
- Real-time updates via WebSocket

**Quick Actions:**
- `Start Scraping` → Initiates Phase 1
- `View Metrics` → Detailed statistics
- `Read Docs` → Links to CLAUDE.md, plans
- `Settings` → Configuration UI

---

### 2. **Knowledge Gaps Tab** (⚠️ Management)

**Display:**
- Filterable list of 20 knowledge gaps
- Color-coded by severity:
  - 🔴 CRITICAL (6 gaps)
  - 🟠 HIGH (8 gaps)
  - 🟡 MEDIUM (4 gaps)
  - 🔵 LOW (2 gaps)

**Per Gap Card Shows:**
- Category name (e.g., "104 Stars Complete Meanings")
- Description (what's missing)
- Severity badge
- Progress bar (14/104 items complete)
- Coverage % (13.5%)
- Estimated tokens needed

**Expandable Details:**
- Items needed vs. complete breakdown
- Related sources
- "Start Scraping" button
- "View Sources" button

**Search & Filter:**
- Search by keyword
- Filter by severity level
- Sort by priority

---

### 3. **Scraping Tab** (🔄 Progress Tracking)

**Real-time Progress:**
- Active sources with progress bars
- Colored status badges:
  - ⚪ Pending
  - 🔵 Scraping (animated pulse)
  - 🟢 Completed
  - 🔴 Failed

**Per Source Shows:**
- Source name (e.g., "Zhihu - Wang Ting Zhi Collection")
- Authority level (⭐⭐⭐⭐⭐)
- Progress % with items found count
- Last run date & next scheduled run

**Controls:**
- `Start Phase 1 Scraping` button (primary)
- `Schedule` button (for recurring)
- `Pause All` button (pause all sources)

**Source Details Expandable:**
- Quality metrics (avg confidence)
- Token usage
- Items by type breakdown

---

### 4. **Sources Tab** (📖 Phase Organization)

**Organized by Phase:**
- **Phase 1:** Critical Foundation (Weeks 1-2, ~50K tokens)
  - Zhihu 王亭之 Collection
  - Ziwei.asia (Official)
  - Weread (Wang Ting Zhi books)
  - Scribd (Advanced lectures)

- **Phase 2:** Specialized Knowledge (Weeks 3-4, ~20K tokens)
  - Inzense (Decade Luck)
  - 星林學苑 (Transformations)
  - 科技紫微網 (Monthly Luck)
  - Vocus (Transformation guides)

- **Phase 3:** Comprehensive Dictionary (Weeks 5-7, ~30K tokens)
  - Zi Wei Dou Shu Academy
  - Fusang Vision (Star Dictionary)
  - Gagan Sarkaria (104 stars)
  - Flourish Astrology

- **Phase 4:** Verification (Weeks 8+, ~15K tokens)
  - Ming Ming Guan Zhi (Tools)
  - Sean Chan's School (Practical)
  - Wikipedia (Historical)

**Per Phase Card:**
- Phase name & description
- Weeks duration
- Token budget
- "Run Phase X" button
- List of sources with status badges

---

### 5. **Settings Tab** (⚙️ Configuration)

**Scraping Configuration:**
- Daily token budget: `50,000` (adjustable)
- Minimum confidence threshold: `0.70 | 0.80 | 0.90` (selector)
- Devil's Advocate engagement: `Always | Smart | Minimal` (selector)
- Checkboxes:
  - ☑️ Auto-integrate when confidence > 0.85
  - ☑️ Notify on phase completion

**Advanced Settings:**
- `Reset All Progress` button (clear everything)
- `Export Knowledge Database` button (download)
- `Clear Cache & Restart` button (red danger button)

---

## Backend Services Implementation

### ZiweiScrapingOrchestrator Class

**Key Methods:**
```typescript
// Initialize system
orchestrator.initialize(sources, gaps);

// Start scraping phase
await orchestrator.startPhase(1);

// Validate items (Validation Agent)
const validated = await orchestrator.validateItems(scraped);

// Critique items (Devil's Advocate)
const critiqued = await orchestrator.critiqueItems(validated);

// Integrate into database (Integration Agent)
const integrated = await orchestrator.integrateItems(critiqued);

// Get metrics
const metrics = orchestrator.getMetrics();

// Generate report
const report = orchestrator.generateReport();
```

**Budget Management:**
- Daily: 50,000 tokens
- Weekly: +100,000 tokens
- Monthly: +200,000 tokens
- Carry over: up to 500K max
- Cost calculation: `(authority × relevance) / cost`

**Quality Thresholds:**
- Minimum for integration: 0.75 confidence
- Target Phase 1: 0.85 confidence
- Target Phase 4: 0.88 confidence

---

## API Endpoints Quick Reference

```
GET  /api/ziwei/knowledge/gaps              # All gaps
GET  /api/ziwei/knowledge/gaps/:id          # Specific gap
POST /api/ziwei/knowledge/gaps/:id/start-scraping

GET  /api/ziwei/scraping/sources            # All sources
GET  /api/ziwei/scraping/sources/:id        # Specific source
POST /api/ziwei/scraping/sources/:id/scrape # Manual trigger
PUT  /api/ziwei/scraping/sources/:id/config # Update config

GET  /api/ziwei/scraping/phases             # All phases
GET  /api/ziwei/scraping/phases/:n          # Specific phase
POST /api/ziwei/scraping/phases/:n/start    # Start phase
POST /api/ziwei/scraping/phases/:n/pause    # Pause phase
POST /api/ziwei/scraping/phases/:n/resume   # Resume phase

GET  /api/ziwei/scraping/jobs               # All jobs
GET  /api/ziwei/scraping/jobs/:id           # Specific job

GET  /api/ziwei/scraping/items              # Filtered items
POST /api/ziwei/scraping/items/:id/validate
POST /api/ziwei/scraping/items/:id/integrate
POST /api/ziwei/scraping/items/batch-integrate

GET  /api/ziwei/validation/conflicts        # Conflicting items
POST /api/ziwei/validation/conflicts/:id/resolve

GET  /api/ziwei/metrics/overview            # Dashboard metrics
GET  /api/ziwei/metrics/by-phase            # Phase metrics
POST /api/ziwei/metrics/export-report       # Export report

GET  /api/ziwei/config                      # Current config
PUT  /api/ziwei/config                      # Update config
POST /api/ziwei/config/reset                # Reset all

ws://localhost:8080/api/ziwei/scraping/ws   # Real-time updates
```

---

## Data Flow Example: Phase 1 Execution

```
1. User clicks "Start Phase 1 Scraping"
   ↓
2. UI calls POST /api/ziwei/scraping/phases/1/start
   ↓
3. Backend creates ZiweiScrapingOrchestrator
   ↓
4. orchestrator.startPhase(1)
   └─ Queues 4 Priority-1 sources for scraping
   └─ Allocates budget: 50,000 tokens
   └─ Sets target confidence: 0.85
   ↓
5. For each source (Zhihu, Ziwei.asia, Weread, Scribd):
   ├─ Search Agent scrapes content
   │  └─ Sends WebSocket updates every 2 seconds (progress %)
   ├─ Validation Agent cross-validates findings
   │  └─ Assigns confidence scores (0.75-0.95)
   ├─ Devil's Advocate critiques (if confidence < 0.70 OR conflicts)
   │  └─ Adjusts confidence (-0.25 to +0.10)
   │  └─ Max 5 minutes per item
   └─ Integration Agent integrates to database
      └─ Version tags: "2026-02-18_phase1_conf-0.82"
   ↓
6. UI displays real-time updates:
   ├─ Progress bars animate
   ├─ Items found counter updates
   ├─ Confidence scores display
   ├─ Token usage tracked
   └─ Time remaining calculated
   ↓
7. Phase completes:
   ├─ 50,000 tokens used
   ├─ 850 items scraped
   ├─ 750 items validated
   ├─ 600 items integrated
   ├─ Average confidence: 0.82
   └─ Notification sent to user
```

---

## Implementation Checklist

### Frontend Components
- [ ] ZiweiKnowledgeCenter.tsx (main)
- [ ] Individual tab components
- [ ] Progress bars & visualizations
- [ ] Real-time WebSocket connection
- [ ] Error handling & loading states

### Backend Services
- [ ] ZiweiScrapingOrchestrator class
- [ ] Search Agent implementation
- [ ] Validation Agent implementation
- [ ] Devil's Advocate Agent implementation
- [ ] Integration Agent implementation

### API Endpoints
- [ ] All 30+ endpoints implemented
- [ ] Error handling & validation
- [ ] Rate limiting & budgets
- [ ] Logging & audit trails
- [ ] WebSocket real-time updates

### Database Schema
- [ ] Create all 10 tables
- [ ] Add indexes for performance
- [ ] Set up audit logging
- [ ] Create backup strategy

### Integration
- [ ] Connect UI to backend APIs
- [ ] Integrate with existing Ziwei system
- [ ] Connect to knowledge base
- [ ] Set up scheduled tasks
- [ ] Configure monitoring & alerts

---

## Key Features Summary

✅ **Real-time Progress Tracking** - See scraping happening live
✅ **Multi-agent Orchestration** - Search, Validate, Critique, Integrate
✅ **Smart Budget Management** - Token allocation optimized by value/cost
✅ **Quality Control** - Devil's Advocate ensures accuracy
✅ **Flexible Configuration** - Adjust thresholds and budgets
✅ **Comprehensive Metrics** - Track coverage, cost, quality
✅ **Phase Management** - 4 organized phases over 9 weeks
✅ **Conflict Resolution** - Multiple sources, clear prioritization
✅ **Audit Trail** - Full history of all changes
✅ **Automated Reports** - Export metrics and progress

---

**Total Interface Components:** 1 main component + 5 tabs + 30+ API endpoints
**Total Backend Services:** 5 specialized agents + 1 orchestrator
**Total Database Tables:** 10 tables
**Estimated LOC:** 3,000+ lines (frontend + backend + API)

**Status:** ✅ Ready for implementation
