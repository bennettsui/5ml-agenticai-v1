# HK+SG Government Tender Intelligence Layer

> **Status:** Design-complete, implementation-ready
> **Cost:** ~$1.80/month
> **Cadence:** Daily ingestion (03:00 HKT) · Weekly source discovery (Sun 02:00 HKT)

## 一句話

每日自動發掘 HK+SG 政府招標來源 → 拉 XML/RSS/scrape → 評估係咪啱你 → 入 tender-ops 大系統。

---

## What It Does

```
Source Registry (maintained weekly)
        │
        ├── XML/RSS sources ──► RSSXMLIngestorAgent   ─┐
        ├── HTML list sources ─► HTMLScraperAgent       ├─► TenderNormalizerAgent
        └── CSV open data ────► CSVIngestorAgent       ─┘          │
                                                               DeduplicationAgent
                                                                      │
                                                           TenderEvaluatorAgent
                                                              (score + label)
                                                                      │
                                                           DigestGeneratorAgent
                                                          (daily 08:00 HKT digest)
                                                                      │
                                                           Founder: Track/Ignore/Assign
                                                                      │
                                                           FeedbackLearningAgent
                                                              (weekly calibration)
```

## Agents (10 total)

| Agent | Cadence | Model | Role |
|-------|---------|-------|------|
| SourceDiscoveryAgent | Weekly Sun 02:00 | Haiku | Scan hub pages for new RSS/HTML sources |
| SourceValidatorAgent | On-demand | Haiku | Validate + classify candidate sources |
| RSSXMLIngestorAgent | Daily 03:00 | None | Fetch all RSS/XML feeds |
| HTMLScraperAgent | Daily 03:00 | Haiku (edge) | Scrape HTML tender list pages |
| CSVIngestorAgent | Daily 03:00 | None | Pull open-data CSV files |
| TenderNormalizerAgent | Daily after ingestion | Haiku | Raw → unified tender model |
| DeduplicationAgent | Daily after normalisation | pgvector | Merge cross-source duplicates |
| TenderEvaluatorAgent | Daily 04:00 | DeepSeek | Score capability_fit + business_potential |
| FeedbackLearningAgent | Weekly Sun 05:00 | DeepSeek | Recalibrate scoring from founder feedback |
| DigestGeneratorAgent | Daily 08:00 | DeepSeek | Daily ranked digest + narrative |

## Key Sources (seed list)

### Hong Kong (Stage 1)
- **GLD e-Tender Box XML** — data.gov.hk, updated 3×/day, all-department coverage
- **EMSD RSS** — tender notices + EOI/consultancy
- **ArchSD RSS** — building & architecture tenders
- **DSD RSS Hub** — drainage, civil engineering (multiple sub-feeds)
- **GovHK RSS Directory** — discovery hub for all HK dept feeds
- **FSTB Tender Notices Hub** — HTML hub listing all dept tender pages
- **GeBIZ (SG) HTML listing** — Singapore government procurement (public, no login)

### International / NGO (Stage 2)
- Grants.gov RSS (US federal + NGO grants)
- ECDC Procurement RSS (EU multilateral)

Full seed list: `data/source-registry-seed.json`

## Directory Structure

```
use-cases/hk-sg-tender-intelligence/
├── README.md                          ← This file
├── DESIGN.md                          ← Full system architecture + agent specs
├── agents/
│   ├── index.ts                       ← Agent registry
│   ├── source-discovery-agent.ts      ← Hub page scanning
│   ├── source-validator-agent.ts      ← Source classification
│   ├── rss-xml-ingestor-agent.ts      ← RSS/XML ingestion
│   ├── html-scraper-agent.ts          ← HTML list scraping
│   ├── tender-normalizer-agent.ts     ← Raw → unified model
│   ├── tender-evaluator-agent.ts      ← Scoring + labelling
│   ├── feedback-learning-agent.ts     ← Score recalibration
│   └── digest-generator-agent.ts     ← Daily digest
├── data/
│   └── source-registry-seed.json     ← Initial source seed list (all URLs)
├── docs/
│   └── SCRAPING-METHODOLOGY.md       ← Data model + ingestion methodology
├── scripts/
│   └── create-tables.sql             ← DB schema (6 tables)
└── workflows/
    └── types.ts                       ← Shared TypeScript types
```

## Data Models (6 tables)

1. `tender_source_registry` — master catalogue of all data sources
2. `raw_tender_captures` — raw as-fetched data (audit + reprocessing layer)
3. `tenders` — normalised, deduplicated tender records
4. `tender_evaluations` — per-tender scoring with full signal breakdown
5. `tender_decisions` — founder actions (Track/Ignore/Assign/Won/Lost)
6. `tender_daily_digests` — daily digest records

## Scoring Model

```
capability_fit (0–1):
  category match × 0.35
  agency familiarity × 0.15
  delivery scale × 0.20
  keyword overlap × 0.20
  geographic fit × 0.10

business_potential (0–1):
  budget × 0.30
  budget proxy × 0.15
  strategic beachhead × 0.20
  category growth × 0.15
  time to deadline × 0.10
  recurrence potential × 0.10

overall_relevance = (capability_fit × 0.55) + (business_potential × 0.45)

Labels: Priority (≥0.70) · Consider (0.50–0.69) · Partner-only (0.35–0.49) · Ignore (<0.35)
```

## Implementation Notes

- Never download tender PDFs — list-level metadata only
- robots.txt checked once per source on first validation
- 2-second polite delay between HTML page fetches within same domain
- All agents log to `tender_agent_run_logs` table
- Re-evaluation triggered by FeedbackLearningAgent (founder approval required before weight changes)

## Setup

```bash
# 1. Create DB tables
psql $DATABASE_URL -f use-cases/hk-sg-tender-intelligence/scripts/create-tables.sql

# 2. Seed source registry
node use-cases/hk-sg-tender-intelligence/scripts/seed-sources.js
# (import data/source-registry-seed.json → tender_source_registry table)

# 3. Register cron jobs in schedule-registry.js
# See DESIGN.md §7 for schedule table
```
