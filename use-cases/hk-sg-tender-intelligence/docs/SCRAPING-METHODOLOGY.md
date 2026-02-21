# Scraping Database & Ingestion Methodology

> This document covers the conceptual data model and methodology for feeding XML/RSS feeds and website listings into the tender intelligence database — including government, public orgs, and NGOs.

---

## 1. Source Registry Model & Methodology

The Source Registry is the **master catalogue** of every feed and page we ingest from. It is the single source of truth for "where do we get tender data, and how?"

### Source Object Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| source_id | UUID | Unique internal ID | hk-emsd-rss-tender-notices |
| name | TEXT | Human-readable name | "EMSD – Tender Notices RSS" |
| owner_type | ENUM | Type of organisation | gov / public_org / ngo / multilateral / other |
| jurisdiction | TEXT | Geographic scope | HK / SG / HK,SG / US / EU |
| source_type | ENUM | Data format | rss_xml / api_json / csv_open_data / html_list |
| access | ENUM | Access requirement | public / login_required |
| update_pattern | ENUM | How often source updates | daily / weekly / irregular / unknown |
| base_url | TEXT | Primary URL | https://www.emsd.gov.hk/... |
| feed_url | TEXT | Direct feed URL (if different) | http://www.emsd.gov.hk/filemanager/.../tender_notices.xml |
| legal_notes | TEXT | robots.txt / ToS observations | "Public RSS. No robots restriction found." |
| scraping_config | JSONB | For HTML sources: CSS selectors | { "list_selector": "table.tenderList tr", ... } |
| reliability_score | FLOAT | 0–1, from SourceValidatorAgent | 0.95 |
| priority | INT | Ingest priority | 1 / 2 / 3 |
| status | ENUM | Current health | active / deprecated / broken / format_changed |
| last_checked_at | TIMESTAMPTZ | Last health check | 2026-02-21T02:00:00Z |
| last_status_detail | TEXT | Short status note | "fetch_error: 403" |
| tags | TEXT[] | Free classification tags | ["hk", "gov", "rss", "primary"] |

### Discovering New Sources

**Strategy: hub-first scanning**

Rather than trying to enumerate all sources up front, we identify a small number of reliable **hub pages** that aggregate links to many sources. SourceDiscoveryAgent scans these weekly.

HK hubs:
- GovHK RSS directory (gov.hk/en/about/rss.htm) — lists RSS feeds for most HK departments
- FSTB Tender Notices hub (fstb.gov.hk) — aggregates links to dept tender pages

SG hubs:
- GeBIZ main portal — public listing of all SG government procurement opportunities
- GovTech developer docs — provides structural context for GeBIZ categories

NGO/International hubs:
- Grants.gov RSS directory (grants.gov/connect/rss-feeds) — US federal grants + NGO-relevant
- UN Global Marketplace, ECDC procurement pages

**Classification methodology:**

When a candidate URL is found:
1. Fetch and detect format (Content-Type + first 500 bytes → XML/RSS vs HTML vs JSON/CSV)
2. Check domain against known owner patterns (.gov.hk = gov, .edu.hk = public_org, etc.)
3. Scan content for tender keywords to confirm relevance
4. Check robots.txt for any scraping restrictions
5. Assign owner_type, source_type, access, reliability_score
6. Add to source registry with status=active (or status=pending_validation if uncertain)

**Maintaining the registry over time:**

- Weekly health sweep: HEAD request per active source
- 3 consecutive failures → deprecated + alert
- Format change detected (Content-Type changed, page structure 0 rows) → format_changed + alert
- Manually verified restoration → back to active

---

## 2. Raw Capture vs Normalised Layer

### The Raw Capture Layer

Stores everything **exactly as received** from the source, tagged with source_id and timestamps.

Purpose: traceability, reprocessing, auditing.

What goes in:
- Full XML `<item>` string for RSS sources
- HTML fragment (the tender row/card HTML) for HTML sources
- Raw CSV row string for CSV sources
- Raw JSON object string for API sources

What it enables:
- **Debugging:** If a field mapping is wrong (e.g. we mis-parse the closing date format), we can fix the mapping rule and re-run normalisation against the stored raw payload without re-scraping the live website
- **Legal traceability:** For any field in our normalised DB, we can trace it back to the exact raw HTML/XML that came from a specific public URL at a specific timestamp
- **Future reprocessing:** When we improve our parsers (e.g. better handling of HK date formats, better tender_ref regex), we can reprocess all historical raw captures without touching the live sources

### The Normalised Tender Layer

Stores **clean, mapped tender records** in a unified schema. This is what all downstream logic (evaluation, alerts, analytics, pipeline) reads from.

All downstream agents are isolated from source format differences — they always see the same clean schema regardless of whether a record came from XML, CSV, or HTML.

### Conceptual separation benefits

```
Raw Layer                          Normalised Layer
─────────────────────────          ─────────────────────────
Source-specific format             Source-agnostic unified schema
Verbose (full raw payload)         Concise (extracted + standardised fields)
Append-only (never modified)       Updated (e.g. status changes, re-evaluation)
For engineers / auditors           For business logic + founder UI
```

---

## 3. Unified Tender Data Model (Normalised Layer)

Designed to represent government tenders, public org tenders, and NGO/grant calls within a single schema.

### Identity & Provenance

| Field | Notes |
|-------|-------|
| tender_id | Internal UUID |
| source_id | Primary source |
| source_references | UUID[] — all sources that referenced this tender |
| raw_pointer | FK to raw_tender_captures — the raw record that produced this |
| jurisdiction | HK / SG / EU / US |
| owner_type | gov / public_org / ngo / multilateral / other |
| source_url | Direct URL to the listing |
| mapping_version | Which normalisation rules were used (for reprocessing) |

### Content & Classification

| Field | Notes |
|-------|-------|
| tender_ref | Official reference (e.g. LCSD/IT/2026/001) |
| title | Full tender title |
| description_snippet | ≤500 chars extracted from listing or LLM-generated |
| agency | Buyer / issuing organisation name |
| category_tags | Canonical taxonomy (see below) |
| raw_category | Original category string from source |

**Category taxonomy (supports both broad and granular):**

Broad categories → sub-tags
- IT_digital → cloud, cybersecurity, app_development, data_analytics, AI
- events_experiential → conference, exhibition, outdoor_event, activation
- marketing_comms → advertising, PR, digital_marketing, content
- consultancy_advisory → management, policy, financial, legal
- construction_works → civil, structural, M&E, fitting_out
- facilities_management → cleaning, security, maintenance
- social_services → welfare, community, healthcare_support
- research_study → survey, academic, policy_research
- supplies_procurement → goods, equipment, uniforms
- financial_services → audit, insurance, investment
- grant_funding → project_grant, capacity_building, research_grant
- other

For NGO/grant calls, `grant_funding` and owner_type=ngo signal the evaluation agent to apply the `social_impact` scoring dimension.

### Time & Status

| Field | Notes |
|-------|-------|
| publish_date | DATE — when tender was published |
| publish_date_estimated | BOOLEAN — true if inferred from captured_at |
| closing_date | DATE — submission deadline |
| status | open / closed / awarded / cancelled / unknown_closing |
| first_seen_at | TIMESTAMPTZ — first ingestion |
| last_seen_at | TIMESTAMPTZ — last time this appeared in source |

### Money & Scale

| Field | Notes |
|-------|-------|
| budget_min / budget_max | NUMERIC — null if not stated |
| currency | HKD / SGD / USD / EUR |
| budget_source | stated / estimated / proxy / unknown |

Proxy signals for budget estimation when not stated:
- Open tender (vs. quotation): typically >HK$1.4M threshold in HK
- Agency size + category: large agency IT tender → estimated high value
- Board type (tender board vs. departmental): signals value tier

### Graceful handling of incomplete data

The model is designed to produce a usable record even when many fields are missing:

- Missing budget: downstream evaluation uses proxy signals. Label as `budget_source=proxy` or `budget_source=unknown`. Rationale in evaluation notes this limitation.
- Missing closing_date: set `status=unknown_closing`. These tenders get lowest priority in digest ranking, not filtered out entirely.
- Missing tender_ref: generate synthetic ref `{source_prefix}-{title_hash[:8]}`. Deduplication uses title+agency+date instead.
- Missing description: evaluation works on title + category_tags alone. Many HK gov RSS feeds only provide title + closing date — this is normal and expected.

The principle: **never drop a tender because of missing fields**. Surface it with caveats in the rationale.

---

## 4. Feeding XML/RSS Into the Database

### RSS/XML as first-class inputs

When a source has an RSS or XML feed, always prefer it over HTML scraping. Reasons:
- Structured data: fields are already labelled (title, link, pubDate, guid)
- Stable: less likely to break due to website redesigns
- Lightweight: smaller payload, no HTML parsing overhead
- Guid-based deduplication: RSS items have stable unique IDs

### Standard RSS field mapping → Tender model

| RSS field | Tender model field | Notes |
|-----------|-------------------|-------|
| `<guid>` | item_guid (raw layer) | Used for deduplication |
| `<title>` | title | May contain tender_ref inline — extract with regex |
| `<link>` | source_url | Direct link to tender page |
| `<pubDate>` | publish_date | Parse to ISO-8601; handle RFC 822 format |
| `<description>` | description_snippet | Strip HTML tags; truncate to 500 chars |
| `<category>` | raw_category → category_tags | Map to canonical taxonomy |

**Custom namespace fields (where available):**
Some government RSS feeds extend standard RSS with custom fields. Example patterns:
- `<tender:reference>` → tender_ref
- `<tender:closingDate>` → closing_date
- `<gld:department>` → agency

For HK EMSD RSS: tender_ref is embedded in the `<title>` in format "EMSD(T)23/2025 - Description". Extract with pattern `/^([A-Z]+\([A-Z]\)\d+\/\d{4})/`.

### Polling frequency and incremental updates

- Poll each RSS source **once per day** at 03:00 HKT
- On first run: process all items in feed (may include historical)
- On subsequent runs: skip any item whose guid/link already exists in raw_tender_captures
- Only create new Tender records when item IDs are new — never update existing tenders based on RSS content alone (updates come from re-evaluation or manual review)
- For paginated RSS (Link rel="next"): follow up to 10 pages on first run; 1 page on subsequent (new items are always at the top)

### Cross-source deduplication

The same tender often appears in multiple feeds:
- GLD ETB XML + department's own RSS + FSTB hub link

Deduplication strategy:
1. Exact match on tender_ref + jurisdiction → definite same tender → keep canonical, add source to source_references[]
2. Near match on normalised title + agency + closing date (±3 days) → probable same → auto-merge with confidence flag
3. Fuzzy match via pgvector cosine similarity > 0.85 → candidate for manual review

Always prefer the record from the source with the highest reliability_score as the canonical.

---

## 5. Feeding HTML Websites Into the Database

### When HTML scraping applies

HTML scraping is used when:
- Source has no RSS/XML feed (e.g. GeBIZ public listing, many individual dept pages)
- RSS feed exists but is incomplete (e.g. RSS only has title + link, HTML page has more fields)

HTML scraping is a **fallback**, not a preference.

### Types of HTML sources

**Government tender list pages:**
- Typically: an HTML table with columns for tender_ref, title, agency, closing_date, and a link
- Examples: GeBIZ Business Opportunities, FSTB dept links, HyD tender notices
- Pattern: find the repeating row element, map columns to fields

**Public organisation procurement pages:**
- Universities, statutory bodies, public utilities
- Often similar table structure but may use div/card layouts
- Sometimes include additional fields: estimated value, procurement category

**NGO / non-profit funding opportunity pages:**
- Grant call listings, calls for proposals, service tenders
- Less standardised — may be blog posts, PDF links, or simple lists
- More NLP needed to extract structured fields from free-text descriptions

### Scraping config per source

Each html_list source in the registry carries a `scraping_config` JSON object:

```json
{
  "list_selector": "CSS selector for the repeating tender row/card",
  "field_map": {
    "title":        "a.tenderTitle",
    "tender_ref":   "td.refCol",
    "closing_date": "td.dateCol",
    "agency":       "td.agencyCol",
    "link":         "a.tenderTitle@href"
  },
  "date_format": "DD/MM/YYYY",
  "pagination": {
    "type": "next_link",
    "selector": "a.nextPage"
  }
}
```

This config is validated on first agent run and updated when structure changes are detected.

### Managing variability between sites

Different sites have different HTML structures — but they all map into the **same unified Tender model**. The scraping_config layer absorbs the variability:

- Site A uses a `<table>` → `list_selector = "table.tenderList tr"`
- Site B uses `<div class="tender-card">` → `list_selector = "div.tender-card"`
- Site C has tender_ref in the URL not the page → `tender_ref = "url_pattern: /tender/([A-Z0-9]+)/"`

The downstream normalisation agent always receives the same field names regardless of which CSS selectors were used to extract them.

**Fallback when structure changes:**
- list_selector returns 0 rows → emit `structure_changed` alert
- Agent logs source_id + URL + timestamp
- Does not silently fail or produce empty records
- Alert surfaces in daily digest: "Source X layout may have changed — manual scraping_config review needed"
- SourceValidatorAgent re-runs on this source at next weekly cycle to re-classify

---

## 6. Extending Beyond Government to Public Orgs & NGOs

### owner_type as the extension mechanism

Rather than separate schemas for different buyer types, the unified Tender model uses `owner_type` + `category_tags` to distinguish:

| owner_type | Examples | Typical category_tags |
|-----------|---------|----------------------|
| gov | HK govt depts, SG ministries | Any |
| public_org | Universities, MTR, KCRC, public hospitals | IT_digital, facilities_management, research_study |
| ngo | Charities, foundations, international NGOs | grant_funding, social_services, consultancy_advisory |
| multilateral | UN agencies, World Bank, ECDC, ADB | consultancy_advisory, research_study, grant_funding |
| other | Commercial aggregators (not primary sources) | — |

### NGO grant RSS feeds → same Tender model

NGO/foundation grant calls can be ingested through the same RSS pipeline:
- Grants.gov (US federal + NGO-facing): `owner_type=gov`, `category_tags=[grant_funding]`
- ECDC procurement RSS: `owner_type=multilateral`, `category_tags=[consultancy_advisory, research_study]`
- Foundation grant pages (HTML): `owner_type=ngo`, `category_tags=[grant_funding, capacity_building]`

The only schema difference: for grant calls, `closing_date` maps to the grant application deadline, and `budget_max` maps to the grant ceiling amount if stated.

### Evaluation extension for NGO/social impact

When `owner_type=ngo` or `category_tags` includes `grant_funding` or `social_services`, the TenderEvaluatorAgent adds a third scoring dimension:

- `social_impact_score` (0–1): Does this grant or service contract align with our CSR / brand values? Is there reputational value beyond the commercial return?

This feeds into `business_potential_score` as an additional signal, weighted at 0.10 when applicable. It prevents grant calls with modest budgets from being systematically ignored purely on commercial grounds.

---

## 7. Governance, Ethics & Evolution

### Legal and ethical scraping

- **robots.txt compliance:** Checked by SourceValidatorAgent on first validation; result stored in `legal_notes`. Never scrape a source that disallows it.
- **No bypassing protections:** We only access publicly visible list-level pages. No login bypass, no CAPTCHA solving, no session token sharing.
- **Metadata only:** We store only what appears on the public listing: title, reference, agency, dates, category, link. We do not download or store tender documents (PDFs, detailed specs).
- **Reasonable frequency:** Once per day per source, with polite delays between page fetches (2 seconds within same domain). Well below any reasonable rate limit.
- **Transparency:** The raw_tender_captures table provides a complete audit trail of exactly what was fetched, from where, and when.

### Data lineage and compliance

The raw/normalised layer separation directly supports compliance:
- For any field in the normalised `tenders` table, trace via `raw_pointer` → `raw_tender_captures` → the exact raw payload from the exact URL at the exact timestamp
- `mapping_version` on both raw and normalised records allows reproducibility: given the same raw payload and same mapping version, the normalisation output is deterministic
- If a data subject (e.g. a government department) queries "where did you get this tender description?", the answer is always traceable to a specific public URL and timestamp

### Evolution path

**Adding more regions:**
- Add source_registry entries with new jurisdiction (UK, EU, Mainland CN, etc.)
- All existing agents iterate over the registry — no code changes needed
- Region-specific parsing quirks go into per-source `scraping_config` or normalisation templates
- Example: EU TED (Tenders Electronic Daily) has an OJS/XML API → new `source_type=api_xml` entries, `RSSXMLIngestorAgent` handles with minor format config

**Incorporating award data:**
- `CSVIngestorAgent` already handles GLD Tenders Awarded CSV
- A new `AwardProcessorAgent` matches awarded records to existing tenders by `tender_ref` + jurisdiction
- Populates a `tender_awards` table (contractor, amount, award date)
- `FeedbackLearningAgent` uses historical awards to identify "categories where government actually awards to firms like us" — sharpens capability_fit scoring

**Feeding improved evaluation outputs back:**
- As `tender_decisions` accumulate (won, lost, shortlisted), `FeedbackLearningAgent` updates scoring weights
- Improved scores are written back to `tender_evaluations` with new `scoring_version`
- pgvector embeddings of won tender titles create a "similarity to past wins" signal
- The `tenders` table's `label` field is updated when re-evaluation completes — downstream UI always shows the latest assessment
