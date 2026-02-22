# HK+SG Government Tender Intelligence Layer — System Design

> Status: Design-complete, implementation-ready
> Last updated: 2026-02-21

---

## 中文摘要

呢個係「HK+SG 情報中樞」use case：每日自動發掘來源 → 拉 XML/RSS/scrape → 評估係咪啱你 → 入 tender-ops 大系統。
佢係整個 tender-ops pipeline 嘅第一棒，負責「知道世界上有咩 tender」，然後交畀 qualification → proposal → execution 做後面嘅嘢。

---

## 1. Positioning Within Tender-Ops Architecture

```
┌──────────────────────────────────────────────────────────┐
│  UPSTREAM (strategy / sector focus)                       │
│  Founder decides: IT, digital, events, consultancy focus  │
│  Capability profile lives in company profile DB           │
└───────────────────────┬──────────────────────────────────┘
                        │ drives evaluation criteria
                        ▼
┌──────────────────────────────────────────────────────────┐
│  THIS USE CASE: HK+SG TENDER INTELLIGENCE LAYER           │
│                                                           │
│  1) Source Discovery & Maintenance (weekly)               │
│     → discover new RSS/XML/HTML sources                   │
│     → maintain source registry                            │
│                                                           │
│  2) Daily Ingestion & Normalisation (03:00 HKT)           │
│     → pull XML/RSS first; scrape HTML where no feed       │
│     → deduplicate across sources                          │
│     → store in unified tender DB                          │
│                                                           │
│  3) Tender Evaluation & Scoring (04:00 HKT)               │
│     → capability_fit + business_potential scoring         │
│     → short rationale per tender                          │
│     → feedback loop from founder                          │
│                                                           │
│  4) Daily Alert & Digest (08:00 HKT)                      │
│     → ranked shortlist delivered to founder               │
│     → Track / Ignore / Assign response options            │
└───────────────────────┬──────────────────────────────────┘
                        │ feeds
                        ▼
┌──────────────────────────────────────────────────────────┐
│  DOWNSTREAM (tender-ops pipeline)                         │
│  Qualification → Bid/No-Bid → Proposal → Submission       │
│  Calendar / deadline management                           │
│  Win/loss analysis (feeds back into scoring)              │
└──────────────────────────────────────────────────────────┘
```

This layer is the **single source of truth** for all HK+SG government and public-sector tender opportunities. Every downstream process reads from this layer — no duplicate scraping logic elsewhere.

---

## 2. Source Discovery & Maintenance Use Case

**Cadence:** Weekly (Sunday 02:00 HKT)

**What it does:** Builds and maintains the Source Registry — the master catalogue of all feeds and pages we ingest from.

### Agent: SourceDiscoveryAgent

**Role:** Crawl known hub pages to find new RSS feeds and tender sections.

**Inputs:**
- Hardcoded seed hub URLs (GovHK RSS directory, FSTB tender notices, GeBIZ supplier guide)
- Current source registry (to diff and find new entries)

**Logic:**
1. Fetch each hub page HTML
2. Extract all RSS/XML links and "tender" / "procurement" section links
3. Filter by keywords: tender, procurement, quotation, EOI, 招標, bidding
4. For each URL not already in registry → pass to SourceValidatorAgent
5. For existing `status = broken` sources → re-attempt, restore if recovered

**Output:** Candidate source list → SourceValidatorAgent

**Model:** Claude Haiku (HTML parsing + link extraction)

---

### Agent: SourceValidatorAgent

**Role:** Validate and classify each candidate source URL into the Source Registry schema.

**Inputs:** Single candidate URL

**Validation sequence:**
1. Reachability: HTTP 200?
2. robots.txt compliance: is fetch permitted?
3. Format detection: XML/RSS, JSON, CSV, or HTML? (Content-Type + first 500 bytes)
4. Content relevance: contains tender keywords?
5. Owner type: .gov.hk / .gov.sg / statutory body / NGO / public utility?

**Output fields per source:**
- source_type: rss_xml / api_json / csv_open_data / html_list
- owner_type: gov / public_org / ngo / multilateral / other
- jurisdiction: HK / SG
- access: public / login_required
- reliability_score: 0–1
- estimated_update_pattern: daily / weekly / irregular / unknown
- legal_notes: robots.txt observation

**Model:** Claude Haiku

---

### Source Registry Health Sweep

Runs alongside weekly discovery. For all `status = active` sources:
- HEAD request per source
- 3 consecutive failures → mark `status = deprecated`, log alert
- Format changed → mark `status = format_changed`, flag for manual review
- Broken source recovered → reset to `status = active`

---

## 3. Daily Ingestion & Normalisation Use Case

**Cadence:** Daily 03:00 HKT

**Raw vs Normalised layer separation:**

```
[Source] → [RSSXMLIngestorAgent / HTMLScraperAgent / CSVIngestorAgent]
                  ↓
         [raw_tender_captures table]   ← full raw payload stored here
                  ↓
         [TenderNormalizerAgent]       ← maps raw → unified schema
                  ↓
         [DeduplicationAgent]          ← merge cross-source duplicates
                  ↓
         [tenders table]               ← canonical records
```

Why separate raw from normalised?
- Debug: re-run normalisation against stored payload without re-scraping
- Legal: show exactly which public page produced each field value
- Future: improve parsers and reprocess all history from raw

---

### Agent: RSSXMLIngestorAgent

**Role:** Fetch and parse all XML/RSS format sources.

**Inputs:** All `source_type = rss_xml` active sources from registry

**Logic per source:**
1. Fetch RSS/XML URL
2. Parse all `<item>` or `<entry>` elements
3. Extract: title, link, pubDate, description, guid, any custom namespace fields
4. Check guid/link against raw_tender_captures (dedup by ID)
5. Emit only new items as raw captures (source_id, captured_at, raw_format=rss_xml, raw_payload=full item XML)
6. Follow pagination up to 10 pages on first run; incremental thereafter

**HK-specific parsing notes:**
- GLD ETB XML: custom fields gld:tender_ref, gld:closing_date
- EMSD RSS: tender_ref embedded in title (e.g. "EMSD(T)23/2025 - Supply of...") — extract with regex /EMSD[^\s]+/
- DSD RSS: standard RSS + link to dept page

**Error handling:**
- HTTP error → log + skip, mark last_status=fetch_error in registry
- Parse error → log raw response, mark last_status=parse_error
- No special retry — daily cadence is the natural retry

**Model:** None — pure parsing

---

### Agent: HTMLScraperAgent

**Role:** Scrape HTML list pages for sources with no RSS/XML feed.

**Key sources handled:**
- FSTB Tender Notices hub → dept-level links → individual dept tender lists
- GeBIZ Business Opportunities public listing (paginated)
- Individual dept pages (HyD, EPD, etc.)

**scraping_config schema** (stored per source in registry):
```json
{
  "list_selector": "CSS selector for repeating tender row/card",
  "field_map": {
    "title":        "CSS selector relative to row",
    "tender_ref":   "CSS selector or regex",
    "closing_date": "CSS selector",
    "agency":       "CSS selector or static string",
    "link":         "CSS selector for href"
  },
  "pagination": {
    "type": "next_link | page_param | none",
    "selector": "CSS selector for next page link"
  }
}
```

**Logic:**
1. Fetch HTML page
2. Apply list_selector → find all tender rows
3. Extract fields per field_map
4. Parse dates to ISO format (handle HK format DD/MM/YYYY)
5. Dedup: source_url + tender_ref combo already in raw_captures?
6. Emit new items as raw captures with raw_format=html_fragment

**Fallback when structure changes:**
- list_selector returns 0 rows → emit structure_changed alert
- Alert surfaced in daily digest: "Source X may have changed its layout — manual check needed"
- Do not silently fail

**Model:** Claude Haiku — only for edge cases where field extraction requires NLP (e.g. tender_ref embedded in free-text). Purely structural pages need no LLM.

---

### Agent: CSVIngestorAgent

**Role:** Pull and process open-data CSV files.

**Primary sources:**
- GLD ETB Open Tenders CSV (data.gov.hk) — daily
- GLD Tenders Awarded CSV (historical) — for win/loss baseline

**Logic:**
1. Fetch CSV URL; check Last-Modified header — skip if unchanged
2. Parse CSV rows
3. Check Tender Reference against existing raw_captures
4. Emit only new rows; historical awarded records go to tender_awards table

**Model:** None

---

### Agent: TenderNormalizerAgent

**Role:** Transform raw captures into the unified Tender model.

**Inputs:** All raw captures with `normalised = false`

**Logic per raw capture:**
1. Look up source in registry → owner_type, jurisdiction, format
2. Apply field mapping rules (normalisation templates per source_type)
3. Parse and standardise dates to UTC ISO-8601
4. Map source-specific category strings to canonical taxonomy

**Canonical category taxonomy:**
IT_digital · events_experiential · marketing_comms · consultancy_advisory ·
construction_works · facilities_management · social_services · research_study ·
supplies_procurement · financial_services · grant_funding · other

**Handling missing/partial data:**

| Missing field | Strategy |
|--------------|----------|
| budget | Leave null; evaluation uses proxy signals |
| closing_date | Mark status=unknown_closing; lowest eval priority |
| publish_date | Use captured_at as proxy; set publish_date_estimated=true |
| tender_ref | Generate: {source_id_prefix}-{sha256(title)[:8]} |
| description | Leave null; eval works on title + category_tags alone |
| agency | Infer from source name (e.g. EMSD RSS → "Electrical and Mechanical Services Dept") |

**Model:** Claude Haiku — for NLP extraction of missing fields. Most cases are deterministic mapping rules.

---

### Agent: DeduplicationAgent

**Role:** Identify and merge tenders that appear across multiple sources.

**Deduplication strategy (layered):**
1. Exact: Same tender_ref + same jurisdiction → definite duplicate
2. Near: Same normalised title + same agency + closing date ±3 days → probable duplicate (confidence ≥ 0.9) → auto-merge
3. Fuzzy: Title similarity > 0.85 via pgvector cosine → flag as dedup_candidate for manual review; do not auto-merge

**Merge rule:**
Keep record from highest-priority source (per registry reliability_score). Secondary sources become source_references[] array on canonical record for full provenance.

**Model:** pgvector for fuzzy; no LLM for exact/near matching

---

## 4. Tender Evaluation & Scoring Use Case

**Cadence:** Daily 04:00 HKT (after ingestion completes)

### Agent: TenderEvaluatorAgent

**Role:** Score each new tender on capability_fit and business_potential.

**Inputs:**
- Normalised tender records with evaluation_status=pending
- Company Capability Profile (from Founder KB):
  - Core competencies: digital marketing, events & experiential, brand comms, consultancy
  - Track record keywords (from past wins)
  - Geographic reach: HK-primary, SG-secondary
  - Team constraints: small team, exclude 50+ FTE delivery

**Capability Fit Scoring (capability_fit_score, 0.0–1.0):**

| Signal | Weight | Logic |
|--------|--------|-------|
| Category match | 0.35 | IT_digital, events_experiential, marketing_comms, consultancy_advisory → high |
| Agency familiarity | 0.15 | Agency in our won/shortlisted history → boost |
| Delivery scale | 0.20 | Estimated team req vs our capacity |
| Keyword overlap | 0.20 | Title/description vs our capability keywords |
| Geographic fit | 0.10 | HK > SG > other |

**Business Potential Scoring (business_potential_score, 0.0–1.0):**

| Signal | Weight | Logic |
|--------|--------|-------|
| Budget (if stated) | 0.30 | >HK$500k or >SGD$100k → high; <HK$50k → low |
| Budget proxy (if missing) | 0.15 | Board type, open tender vs quotation, agency size |
| Strategic beachhead | 0.20 | New agency = relationship-building value |
| Category growth | 0.15 | Digital transformation, events growing in gov spend |
| Time to deadline | 0.10 | >21 days → sufficient prep; <7 days → deprioritise |
| Recurrence potential | 0.10 | Framework agreements / multi-year contracts score higher |

**Overall relevance formula:**
```
overall_relevance = (capability_fit × 0.55) + (business_potential × 0.45)
```

**Label assignment:**
- ≥ 0.70 → Priority
- 0.50–0.69 → Consider
- 0.35–0.49 → Partner-only (needs consortium partner)
- < 0.35 → Ignore

**Rationale generation:** 2–3 sentences citing top 2 positive signals and top 1 negative.

Example: *"Strong fit for digital events capability. LCSD is a familiar agency. Budget is ~HK$800k. However, closing date is 9 days away."*

**Model:** DeepSeek Reasoner (primary); Claude Haiku fallback for simpler classification sub-tasks

---

### Agent: FeedbackLearningAgent

**Role:** Recalibrate scoring rules based on founder feedback.

**Cadence:** Weekly Sunday 05:00 HKT, or when ≥10 new feedback items received

**Inputs:**
- tender_decisions: founder labels (Track, Ignore, Assign, Won, Lost, Not-for-us)
- Current scoring weights and capability profile

**Learning mechanism (rule-based calibration, no neural fine-tuning):**
1. Compute accuracy: Track/Assign → were these scored Priority/Consider? Ignore → were these scored Ignore?
2. Identify categories of systematic mis-scoring
3. Generate calibration_report with suggested weight adjustments
4. Founder approves adjustments via UI
5. System updates scoring weights
6. Re-trigger evaluation on last 30 days of tenders

**Future extension:** pgvector embeddings of won/shortlisted tender titles → "similarity to past wins" signal in capability_fit.

**Model:** DeepSeek Reasoner

---

## 5. Daily Alert & Interaction Use Case

**Cadence:** Daily 08:00 HKT

### Agent: DigestGeneratorAgent

**Role:** Compile and deliver the daily tender digest.

**Inputs:**
- Tenders scored today with evaluation_status=scored and status=open
- Yesterday's digest (to avoid repeating already-surfaced tenders)
- Closing-soon flags: closing_date within 7 days

**Digest structure:**

```
═══════════════════════════════════════════════════════
  HK+SG TENDER INTELLIGENCE · Daily Digest · [Date]
═══════════════════════════════════════════════════════

TODAY'S HIGHLIGHTS
[1–2 para narrative — notable themes, warnings, high-value arrivals]

─────────────────────────────────────────────────────
HK TOP TENDERS (ranked by overall_relevance_score)

#1 [PRIORITY] 0.82
   Title:   Digital Transformation Consultancy for LCSD
   Agency:  Leisure and Cultural Services Dept
   Ref:     LCSD/IT/2026/001
   Closes:  2026-03-05 (12 days)
   Budget:  ~HK$1.2M (estimated)
   Why:     Strong digital consultancy match; familiar agency;
            budget above threshold; adequate prep time.
   [TRACK] [IGNORE] [ASSIGN TO TEAM]

#2 ...

─────────────────────────────────────────────────────
SG TOP TENDERS ...

─────────────────────────────────────────────────────
CLOSING SOON (≤7 days) ...

─────────────────────────────────────────────────────
TODAY'S STATS
New tenders found: X (HK: Y | SG: Z)
Sources active: N/M
Sources with issues: [list]
═══════════════════════════════════════════════════════
```

**Delivery channels:**
- In-app dashboard tab (primary)
- Email via Resend integration (optional)
- Future: WhatsApp / Telegram

**Model:** DeepSeek Reasoner (narrative generation only; ranking done in evaluation stage)

---

### Founder Interaction & Feedback Loop

| Action | What it does |
|--------|-------------|
| Track | Moves tender to qualification stage; decision=track |
| Ignore | Marks irrelevant; fed to FeedbackLearningAgent |
| Assign to Team | Creates task; decision=assigned, assigned_to=[person] |
| Not For Us | Strong negative signal; adjusts category weights |
| Partnership Only | Flags for consortium search; decision=partner_needed |

All responses stored in tender_decisions → consumed weekly by FeedbackLearningAgent.

---

## 6. Data Models & Registry Schemas

### 6.1 source_registry table

| Field | Type | Notes |
|-------|------|-------|
| source_id | UUID PK | |
| name | TEXT | Human-readable |
| owner_type | ENUM | gov / public_org / ngo / multilateral / other |
| jurisdiction | TEXT | HK / SG / HK,SG |
| source_type | ENUM | rss_xml / api_json / csv_open_data / html_list |
| base_url | TEXT | Primary URL |
| access | ENUM | public / login_required |
| legal_notes | TEXT | robots.txt / ToS notes |
| reliability_score | FLOAT | 0–1 from validator |
| estimated_update_pattern | ENUM | daily / weekly / irregular / unknown |
| scraping_config | JSONB | CSS selectors + field map for html_list |
| priority | INT | 1 / 2 / 3 |
| status | ENUM | active / deprecated / broken / format_changed |
| last_checked_at | TIMESTAMPTZ | Last health check |
| last_status_detail | TEXT | e.g. "fetch_error: 403" |
| tags | TEXT[] | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### 6.2 raw_tender_captures table (raw layer)

| Field | Type | Notes |
|-------|------|-------|
| capture_id | UUID PK | |
| source_id | UUID FK | |
| raw_format | ENUM | rss_xml / html_fragment / csv_row / api_json |
| raw_payload | TEXT | Full raw content — XML item, HTML fragment, CSV row |
| item_url | TEXT | Direct URL of this tender listing |
| item_guid | TEXT | Source-native unique ID (RSS guid, tender_ref, etc.) |
| captured_at | TIMESTAMPTZ | |
| normalised | BOOLEAN | Has TenderNormalizerAgent processed this? |
| normalised_tender_id | UUID FK → tenders | |
| mapping_version | TEXT | Version of normalisation rules used |

### 6.3 tenders table (normalised layer)

Identity & Provenance:
- tender_id UUID PK
- source_id UUID FK (primary source)
- source_references UUID[] (all sources referencing this tender)
- raw_pointer UUID FK → raw_tender_captures
- jurisdiction TEXT (HK / SG)
- owner_type ENUM
- source_url TEXT
- mapping_version TEXT

Content & Classification:
- tender_ref TEXT (official ref)
- title TEXT
- description_snippet TEXT (≤500 chars)
- agency TEXT
- category_tags TEXT[] (canonical taxonomy)
- raw_category TEXT (original source string)

Time & Status:
- publish_date DATE
- publish_date_estimated BOOLEAN
- closing_date DATE
- status ENUM (open / closed / awarded / cancelled / unknown_closing)
- first_seen_at TIMESTAMPTZ
- last_seen_at TIMESTAMPTZ

Money & Scale:
- budget_min NUMERIC
- budget_max NUMERIC
- currency TEXT (HKD / SGD)
- budget_source ENUM (stated / estimated / proxy / unknown)

Deduplication:
- is_canonical BOOLEAN
- canonical_tender_id UUID FK

Evaluation:
- evaluation_status ENUM (pending / scored / re_evaluate)
- label ENUM (Priority / Consider / Partner-only / Ignore / unscored)

### 6.4 tender_evaluations table

| Field | Type |
|-------|------|
| eval_id | UUID PK |
| tender_id | UUID FK |
| capability_fit_score | FLOAT |
| business_potential_score | FLOAT |
| overall_relevance_score | FLOAT |
| label | ENUM |
| rationale | TEXT |
| signals_used | JSONB |
| scoring_weights | JSONB |
| model_used | TEXT |
| evaluated_at | TIMESTAMPTZ |
| scoring_version | TEXT |

### 6.5 tender_decisions table

| Field | Type |
|-------|------|
| decision_id | UUID PK |
| tender_id | UUID FK |
| decision | ENUM (track / ignore / assigned / partner_needed / not_for_us / won / lost / shortlisted) |
| decided_by | TEXT |
| decided_at | TIMESTAMPTZ |
| notes | TEXT |
| assigned_to | TEXT |
| pipeline_stage | ENUM |
| pipeline_entered_at | TIMESTAMPTZ |

### 6.6 daily_digests table

| Field | Type |
|-------|------|
| digest_id | UUID PK |
| digest_date | DATE |
| tenders_surfaced | UUID[] |
| narrative_summary | TEXT |
| hk_top_count | INT |
| sg_top_count | INT |
| closing_soon_count | INT |
| new_tenders_total | INT |
| sources_active | INT |
| sources_with_issues | INT |
| generated_at | TIMESTAMPTZ |
| email_sent_at | TIMESTAMPTZ |

---

## 7. Implementation Notes & Guardrails

### robots.txt & Rate Limiting
- Check robots.txt once per source on first validation; store in legal_notes
- Default: once per day per source — well within any reasonable limit
- HTML scraping: 2-second polite delay between page fetches within same domain
- HTTP 429 → mark last_status_detail="rate_limited", skip today, retry tomorrow
- HTTP 403 → mark status=broken, flag for manual review (may require access review)
- Never download or store full tender PDFs — list-level metadata only

### Monitoring & Logging
Each agent boundary emits a structured log entry:
```
agent_name | run_id | started_at | completed_at | status | items_processed | items_failed | error_detail
```

Alerts fire when:
- >20% of sources fail in a single ingestion run
- Any P1 source fails 2 days in a row
- Digest generation fails → fallback plain-text notification

### Schedule Registry

| Job ID | Schedule | Timezone |
|--------|----------|----------|
| tender-intel:source-discovery | 0 2 * * 0 (Sunday 02:00) | Asia/Hong_Kong |
| tender-intel:daily-ingestion | 0 3 * * * | Asia/Hong_Kong |
| tender-intel:evaluation | 0 4 * * * | Asia/Hong_Kong |
| tender-intel:digest | 0 8 * * * | Asia/Hong_Kong |
| tender-intel:feedback-learning | 0 5 * * 0 (Sunday 05:00) | Asia/Hong_Kong |

### Extensibility
- New region: add entries to source_registry with new jurisdiction; all agents iterate registry without code changes
- New source type (authenticated API): add new ingestor agent with same raw capture output format
- Award data: CSVIngestorAgent already handles GLD Tenders Awarded CSV → AwardProcessorAgent feeds awards table → FeedbackLearningAgent uses for win/loss patterns
- NGO/public org expansion: owner_type already supports ngo, public_org — just add sources to registry

### Cost Estimate

| Component | Cadence | Model | Est. cost |
|-----------|---------|-------|-----------|
| Source discovery | Weekly | Haiku × 20 | ~$0.01/week |
| Source validation | Weekly | Haiku × 5 new | ~$0.002/week |
| RSS/XML ingestion | Daily | None | $0 |
| HTML scraping | Daily | Haiku × 10 (edge) | ~$0.005/day |
| Normalisation | Daily | Haiku × 30 new | ~$0.015/day |
| Evaluation | Daily | DeepSeek × 30 | ~$0.03/day |
| Digest narrative | Daily | DeepSeek × 1 | ~$0.001/day |
| Feedback learning | Weekly | DeepSeek × 1 | ~$0.005/week |
| **Monthly total** | | | **~$1.80/month** |

---

## Agent Summary Table

| Agent | Cadence | Model | Output |
|-------|---------|-------|--------|
| SourceDiscoveryAgent | Weekly Sun 02:00 | Haiku | Candidate source list |
| SourceValidatorAgent | On-demand | Haiku | Source registry entry |
| RSSXMLIngestorAgent | Daily 03:00 | None | Raw captures |
| HTMLScraperAgent | Daily 03:00 | Haiku (edge) | Raw captures |
| CSVIngestorAgent | Daily 03:00 | None | Raw captures |
| TenderNormalizerAgent | Daily after ingestion | Haiku | Normalised tender records |
| DeduplicationAgent | Daily after normalisation | pgvector | Deduplicated tender DB |
| TenderEvaluatorAgent | Daily 04:00 | DeepSeek | Scored evaluations |
| FeedbackLearningAgent | Weekly Sun 05:00 | DeepSeek | Calibration report |
| DigestGeneratorAgent | Daily 08:00 | DeepSeek | Daily digest + email |
