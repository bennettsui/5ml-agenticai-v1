# Government Tender Operations Platform

## Vision
A comprehensive AI-powered government tender management platform that helps organizations:
- Track government & public utilities tender opportunities
- Manage bidding pipelines and proposal workflows
- Monitor tender news and regulatory updates in real-time
- Analyze win probability and competitive landscape

---

## Architecture Overview

### 1. Solution Line: Government Procurement
**Name:** Government Procurement & Tenders
**Tagline:** Automate RFP tracking, bid management, and procurement intelligence
**Color Gradient:** from-indigo-600 to-cyan-500
**Icon:** FileText / Briefcase

### 2. Use Cases

#### A. Government Tender Operations (Main Platform)
**Similar to:** Social Content Ops (but for tenders instead of social content)
**Path:** `/use-cases/government-tenders`
**Status:** Planned (building in phases)
**Agents:** 8-12 specialized agents

**Modules/Tabs:**
1. **Overview** - Dashboard with pipeline summary, deadlines, win rates
2. **Tender Monitoring** - View all active tenders, filter by category/urgency
3. **Bid Management** - Proposal drafting, review workflow, submission tracking
4. **Competitor Analysis** - Track competitor bids, success patterns
5. **Document Manager** - Store bid templates, compliance docs, company info
6. **Deadline Alerts** - Smart reminders and risk flags
7. **Win Analysis** - Historical bid success rate, improvement insights
8. **Team Collaboration** - Assign bidding roles, approvals, comments

**Key Components:**
- Tender database with search/filter
- Bid pipeline (opportunity → drafting → review → submission → won/lost)
- Real-time deadline tracking
- Multi-channel notifications (email, in-app, SMS)
- Compliance checker (ensure all requirements met)

---

#### B. Government Tender Intelligence (News & Monitoring)
**Similar to:** Topic Intelligence (but focused on government/public utilities tenders)
**Path:** `/intelligence/government-tenders` (or new section)
**Status:** Planned (Phase 1)
**Agents:** 4-6 specialized agents

**Intel Sources:**
- Government official tender portals (HK: eTender platform, China: gov.cn, etc.)
- Public utilities tender announcements
- Regulatory change alerts
- Industry news feeds
- Competitor activity monitoring

**Features:**
1. **Real-Time Tender Scraping**
   - Automated daily/hourly scans of government tender sites
   - Parse tender details: title, deadline, budget, requirements
   - Extract key keywords and opportunity scoring

2. **News Analysis & Summarization**
   - Policy changes affecting procurement
   - Industry trend analysis
   - Competitor intelligence
   - Daily digest with actionable insights

3. **Alert & Filtering**
   - Smart alerts based on company profile (industry, size, capability)
   - Relevance scoring (budget, location, sector match)
   - Deadline proximity warnings

4. **Knowledge Base**
   - Winning bid templates
   - Compliance checklists
   - Industry best practices
   - Regulatory requirements by territory

---

## Technical Implementation

### Database Schema

#### New Tables:
```sql
-- Government Tenders
CREATE TABLE government_tenders (
  id UUID PRIMARY KEY,
  source_url TEXT,
  tender_id VARCHAR(100) UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  category VARCHAR(50),
  authority VARCHAR(100),
  budget_hkd DECIMAL(15, 2),
  posted_date TIMESTAMP,
  closing_date TIMESTAMP NOT NULL,
  requirements JSONB,
  scanned_at TIMESTAMP,
  status VARCHAR(20), -- 'open', 'closed', 'archived'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Company Bid Tracker
CREATE TABLE company_bids (
  id UUID PRIMARY KEY,
  brand_id UUID REFERENCES brands(brand_id),
  tender_id UUID REFERENCES government_tenders(id),
  proposal_status VARCHAR(20), -- 'interested', 'drafting', 'review', 'submitted', 'won', 'lost'
  estimated_value DECIMAL(15, 2),
  win_probability INT, -- 0-100
  assigned_team JSONB,
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Tender News & Intel
CREATE TABLE tender_news (
  id UUID PRIMARY KEY,
  source VARCHAR(50),
  title TEXT NOT NULL,
  content TEXT,
  url TEXT,
  category VARCHAR(50),
  relevance_score INT,
  published_at TIMESTAMP,
  scraped_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Bid Templates & Docs
CREATE TABLE bid_templates (
  id UUID PRIMARY KEY,
  brand_id UUID REFERENCES brands(brand_id),
  name VARCHAR(255),
  template_type VARCHAR(50), -- 'proposal', 'cover_letter', 'compliance_checklist'
  content TEXT,
  created_at TIMESTAMP
);
```

---

### Frontend Structure

```
/use-cases/
  /government-tenders/
    layout.tsx              # Main layout with sidebar + AI chat
    page.tsx                # Overview dashboard
    /monitoring/            # Real-time tender monitoring
      page.tsx
      components/
    /bid-management/        # Proposal workflow
      page.tsx
      components/
    /competitor-analysis/   # Win rate tracking
      page.tsx
    /team-collaboration/    # Team assignments & approvals
      page.tsx
    /resources/             # Templates & docs
      page.tsx
    contexts/
      tender-context.tsx    # Global tender state

/intelligence/
  /government-tenders/      # Tender news & intel dashboard
    page.tsx
    components/
      TenderFeed.tsx
      NewsAnalysis.tsx
      IntelAlerts.tsx
```

### Backend Services

1. **Tender Scraper Service** (`/services/tender-scraper.js`)
   - Cron jobs for daily/hourly scraping
   - Support for HK eTender, China gov.cn, other portals
   - Parse tender XML/JSON and extract structured data
   - Deduplication to prevent duplicate entries

2. **Tender Intelligence Service** (`/services/tender-intelligence.js`)
   - Filter tenders by company profile
   - Calculate relevance & win probability scores
   - Generate daily digest summaries
   - Alert routing to users

3. **Bid Management Service** (`/services/bid-management.js`)
   - Proposal workflow orchestration
   - Compliance checking
   - Document versioning
   - Team notifications

### API Endpoints

```
GET /api/government-tenders                    # List all tenders
GET /api/government-tenders/:id                # Get tender details
GET /api/government-tenders/search            # Search by keyword/category
POST /api/government-tenders/:id/bid          # Create new bid

GET /api/company-bids                          # List all bids by company
GET /api/company-bids/:bidId                   # Get bid details
POST /api/company-bids/:bidId/submit          # Submit proposal
PATCH /api/company-bids/:bidId                # Update bid status

GET /api/tender-news                           # Get tender news feed
GET /api/tender-news/alerts                    # Get user alerts
POST /api/tender-news/subscribe                # Subscribe to alerts

GET /api/tender-intelligence/dashboard         # Intelligence summary
GET /api/tender-intelligence/analysis/:id     # Deep dive analysis

POST /api/bid-templates                        # Create template
GET /api/bid-templates                         # List templates
```

---

## Implementation Phases

### Phase 1: Tender Monitoring (Weeks 1-2)
- [x] Create solution line & use case configs
- [x] Update homepage
- [x] Build Overview dashboard
- [x] Create Tender Monitoring page with search/filter
- [ ] Integrate with government tender APIs (HK eTender)
- [ ] Basic scraper for daily tender sync

### Phase 2: Bid Management (Weeks 3-4)
- [ ] Build Bid Management workflow
- [ ] Create proposal templates
- [ ] Add approval workflow
- [ ] Team collaboration features

### Phase 3: Intelligence & Analytics (Weeks 5-6)
- [ ] Build Tender Intelligence dashboard
- [ ] Implement news scraping
- [ ] Win probability scoring
- [ ] Competitor analysis module
- [ ] Daily/weekly intel digests

### Phase 4: Advanced Features (Weeks 7-8)
- [ ] Compliance checking automation
- [ ] Budget forecasting
- [ ] Historical win pattern analysis
- [ ] Integration with CRM
- [ ] Mobile alerts

---

## Sarah Orchestrator Integration

### New Orchestrator: `bidOrchestrator.js`
For handling bid proposal generation and analysis:

**Nodes:**
1. `bid_router` - Determine action type
2. `opportunity_analyzer` - Analyze tender requirements
3. `proposal_generator` - Generate bid proposal
4. `compliance_checker` - Verify compliance
5. `competitor_analyzer` - Compare vs competitors
6. `win_probability_scorer` - Estimate win chance
7. `done` - Output summary

**Input:** Tender details + company profile
**Output:** Structured proposal draft + compliance checklist + win analysis

---

## External Integrations

### Tender Data Sources:
1. **Hong Kong eTender** - Government tenders (HK)
2. **China Government Procurement** - gov.cn (Mainland)
3. **Public Utilities Board (PUB)** - Singapore water/utilities
4. **Clover Connect** - Municipal tenders (HK)
5. **BidNet** - International procurement marketplace
6. **TenderBoard** - Commercial aggregator

### News Sources:
- Government announcement feeds (RSS)
- Industry publications (e.g., Construction, Energy, IT)
- LinkedIn company updates (competitor tracking)
- Regulatory change alerts

---

## Success Metrics

1. **Tender Discovery:** Track% of relevant tenders identified vs total available
2. **Bid Win Rate:** % of submitted bids that convert to wins
3. **Response Time:** Avg time from tender posting to bid submission
4. **Team Efficiency:** Time saved on proposal generation + compliance checks
5. **Pipeline Value:** Total bid value in pipeline / win probability average
6. **Alert Relevance:** % of alerts actioned / dismissed

---

## UI/UX Highlights

- **Tender Card:** Title, authority, deadline (red if <7 days), budget, category badge
- **Pipeline View:** Kanban-style stages (Interested → Drafting → Review → Submitted → Won/Lost)
- **Deadline Heat Map:** Calendar view with color-coded urgency
- **Win Probability Gauge:** Visual indicator with supporting data
- **Quick Actions:** One-click bid start, template apply, team assign
- **Notifications:** Smart alerts based on user role (Finance, Ops, Leadership)

---

## Notes for Implementation

1. **Government Tendering is Highly Regional:**
   - Start with HK (eTender), expand to China/Singapore
   - Each portal has different data formats/access requirements
   - May need partnerships for portal access

2. **Regulatory Compliance Critical:**
   - Some governments restrict automated scraping
   - Ensure compliance with their T&Cs before deploying
   - May need official API partnerships

3. **Team Workflows Vary:**
   - Some companies have dedicated bid teams
   - Others distribute bidding across departments
   - Need flexible role/permission system

4. **Competitive Intelligence Sensitive:**
   - Don't store competitor bid amounts (legal risk)
   - Focus on public patterns and trends
   - Anonymize competitor data

---

## Next Steps (For User Approval)

1. ✅ Finalize platform architecture & UX flow
2. ✅ Get approval on solution line name/positioning
3. → Create use case configs in platform-config.ts
4. → Build Phase 1 (Tender Monitoring)
5. → Integrate first government tender portal (eTender)
6. → Test with real tender data
7. → Iterate based on user feedback
