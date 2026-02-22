# University & Education Institution Sources — Design Extension

> Extension to `DESIGN.md` and `SCRAPING-METHODOLOGY.md`
> Covers: owner_type=university, discovery methodology, evaluation differences
> Last updated: 2026-02-21

---

## Why this doc exists

The initial seed list (HK+SG gov) only covers central government portals and a handful of department RSS feeds. Universities and education institutions are a structurally different category: they are publicly-funded, operate semi-autonomously, and publish a wider range of opportunity types (procurement tenders, research grant calls, service contracts, community programmes). This doc extends the Source Registry and evaluation methodology to cover them cleanly without a schema change.

---

## 1. Positioning Within the Source Registry

Universities and education institutions sit between government bodies and NGOs:

- They are **publicly funded** (like gov) but operate with institutional autonomy over procurement decisions — budgets are set at institution level, not centrally mandated
- They issue **two distinct streams** of opportunities that have different evaluation logic: (a) standard procurement tenders that look much like government tenders, and (b) research grants and innovation calls that look more like NGO/foundation opportunities
- They are **internationally connected** — HK universities often have RGC and ITF grants; SG universities tap MOE and NRF research funding — so the buyer is sometimes the institution but the underlying funder may be a government agency
- Unlike pure NGOs, they are unlikely to issue completely open community grants — their calls tend to be formal, have clear submission processes, and often have public procurement rules they must follow

**How they map to existing owner_type values:**

Rather than adding a new owner_type, extend the existing taxonomy:

```
owner_type = "public_org"  (for procurement/tenders — universities behave like statutory bodies)
owner_type = "ngo"         (for research grant calls / community funding rounds — behave like foundations)
```

The distinction is captured via `source_category` (see below) and `category_tags`, not owner_type. This keeps the data model clean while preserving routing logic.

---

## 2. University Source Registry Fields & Taxonomy

Extend the base source registry with these additional fields for university/education sources:

### New fields (education-specific extension)

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `institution_name` | TEXT | Full institution name | "The University of Hong Kong" |
| `institution_type` | ENUM | Classification within education sector | See table below |
| `source_category` | ENUM | What type of opportunity this page publishes | See table below |
| `academic_calendar_notes` | TEXT | When activity peaks or pauses | "Activity pauses Jul–Aug summer break; peaks Jan–Mar and Oct–Dec" |
| `procurement_office` | TEXT | Name of issuing office if known | "HKU Finance and Enterprises Office" |
| `jurisdiction_funding` | TEXT | Where external funding originates | "HK: RGC, ITF, InnoHK; SG: MOE, NRF, NTF" |

### institution_type taxonomy

| Value | Description | Examples |
|-------|-------------|---------|
| `university_public` | Publicly funded university | HKU, CUHK, NUS, NTU |
| `university_private` | Privately run university | Some US satellite campuses |
| `polytechnic` | Technical / applied university | PolyU, HK; Singapore Polytechnic |
| `community_college` | Two-year programmes | HKCC, CCCU |
| `vocational_institute` | Skills and vocational training | IVE, VTC, ITE Singapore |
| `research_institute` | Research-focused, no full degree | HKIB, A*STAR Singapore |
| `school_district` | K-12 / primary-secondary | EDB (HK), MOE school clusters |

### source_category taxonomy (critical for routing)

| Value | Description | Evaluation routing |
|-------|-------------|-------------------|
| `procurement_tenders` | IT systems, facilities, AV, printing | Same as gov tenders — capability_fit + business_potential |
| `research_grants` | Seed funding, innovation grants, RGC calls | Research collaboration scoring |
| `service_contracts` | Communications, events, training, consultancy | Same as gov tenders, lighter compliance |
| `scholarship_awards` | Student scholarships (not relevant for us) | Auto-label Ignore |
| `campus_events_rfp` | Event requests, venue activations | Events evaluation track |
| `procurement_preferred_vendor` | Preferred/approved vendor registration | Long-term pipeline flag |

### Full education source schema (extending base registry)

```json
{
  "source_id": "hk-hku-procurement",
  "name": "HKU – Procurement Tenders & Quotations",
  "institution_name": "The University of Hong Kong",
  "institution_type": "university_public",
  "owner_type": "public_org",
  "jurisdiction": "HK",
  "source_category": "procurement_tenders",
  "source_type": "html_list",
  "access": "public",
  "priority": 2,
  "status": "active",
  "base_url": "https://www.hku.hk",
  "feed_url": null,
  "update_pattern": "weekly",
  "academic_calendar_notes": "Lower activity July–August",
  "procurement_office": "Finance and Enterprises Office",
  "legal_notes": "Public procurement pages. Validate robots.txt at hku.hk.",
  "category_tags_default": ["IT_digital", "facilities_management", "supplies_procurement"],
  "tags": ["hk", "university", "public_org", "html"],
  "notes": "HKU Finance Office publishes tenders and quotation notices. No RSS found — HTML scraping required."
}
```

---

## 3. Discovery Agent Methodology — Universities (HK + SG First)

### Seed list of institutions

**Hong Kong (UGC-funded + VTC):**
HKU, CUHK, HKUST, PolyU, CityU, EdUHK, HKBU, LU, OUHK, VTC/IVE

**Singapore (public universities + polytechnics):**
NUS, NTU, SMU, SUSS, SIT, SUTD, Nanyang Polytechnic, Singapore Polytechnic, Temasek Polytechnic, Republic Polytechnic, Ngee Ann Polytechnic, ITE

### Step 1 — Institution-level discovery

Starting from each institution's main domain (e.g. hku.hk, nus.edu.sg):

**Keyword search within the site:**
- Procurement keywords: tender, procurement, purchasing, vendor, supplier, quotation, ITT, ITQ, RFP, 招標, 採購
- Funding/research keywords: research grant, seed fund, funding opportunity, call for proposals, innovation grant, research support, funding scheme

**Where to look:**
- Top-level navigation for "Procurement", "Business", "Suppliers", "Vendors"
- Footer links for "Tenders", "Quotations"
- Research office pages: "Research Grants", "Funding Opportunities", "Innovation"
- Staff/faculty resources section (often contains funding calls)
- News/announcements section (may announce grant rounds)

**Candidate page indicators:**
- Recurring list of opportunities with dates (table or cards)
- Page title contains: tender, procurement, quotation, grants, funding, RFP
- Links that point to PDF attachments with names like "tender_notice_", "rfp_", "grant_guidelines_"

### Step 2 — Classification of each candidate page

For each candidate URL found:

1. **Format detection:** RSS/XML link on page? → use it. No RSS → HTML list or PDF-only.
2. **source_category assignment:** Does page list procurement notices? → `procurement_tenders`. Grant schemes? → `research_grants`. Event/service RFPs? → `service_contracts` or `campus_events_rfp`.
3. **owner_type assignment:** Procurement pages → `public_org`. Grant/research funding pages → `ngo` (foundation-like).
4. **Relevance check:** Does ANY category_tags_default match our competencies (IT_digital, events_experiential, marketing_comms, consultancy_advisory)? If no → set priority=3 (still tracked, lower eval weight).
5. **Accessibility check:** Public page, no login? → `access=public`. Requires vendor registration or login? → `access=login_required`, defer.

### Step 3 — Re-run cadence

- **First run:** Full domain crawl per institution. May take 2–5 minutes per institution.
- **Weekly re-run:** Re-check known candidate pages for content changes (new tenders, new grant rounds).
- **Quarterly deep re-run:** Repeat Step 1 domain crawl to find new pages that may have been added (e.g. new research centres, new procurement portals).
- **Calendar-aware:** Schedule more frequent checks during semester start (January, September) when procurement and grant activity peaks.

### Coverage tracking

After discovery, maintain a coverage table:

```
institution_name | has_procurement_source | has_research_source | last_scanned | discovery_gaps
HKU              | yes                     | yes                  | 2026-02-21   | none
CUHK             | yes                     | no                   | 2026-02-21   | research_grants page not found
HKUST            | pending                 | pending              | -            | first scan not yet run
```

This becomes the basis for a "Coverage Gap Analysis" — which institutions have we not yet found sources for?

---

## 4. How University Sources Feed Into the Tender Model

### Mapping table

| University page content | Tender model field | Value |
|------------------------|-------------------|-------|
| Institution name | `agency` | "The University of Hong Kong" / "HKU Finance and Enterprises Office" |
| Tender reference | `tender_ref` | "HKU/2026/IT/001" or site-specific format |
| Procurement vs grant | `owner_type` | procurement → `public_org`; grant → `ngo` |
| Page category | `category_tags` | See taxonomy below |
| Submission deadline | `closing_date` | Standard date field |
| Posted date | `publish_date` | Standard date field |
| Estimated value | `budget_min`/`budget_max` | Often stated for procurement; rarely for grants |
| Grant ceiling | `budget_max` | "Up to HK$300,000 per project" → budget_max=300000 |
| Source URL | `source_url` | Direct link to tender/grant page |

### category_tags for university sources

| Opportunity type | category_tags |
|-----------------|--------------|
| IT procurement (computers, networks, AV) | `IT_digital`, `supplies_procurement` |
| Facilities management, cleaning, security | `facilities_management` |
| Events — graduation, conferences, exhibitions | `events_experiential` |
| Marketing, communications, student recruitment | `marketing_comms`, `consultancy_advisory` |
| Research seed grant, innovation fund | `research_study`, `grant_funding` |
| Training, workshops, capacity building | `consultancy_advisory`, `social_services` |
| Construction, renovation | `construction_works` |

### Two evaluation tracks triggered by owner_type + category_tags

**Track A: "Standard procurement"** (owner_type=public_org, category_tags excludes grant_funding)
- Uses the same capability_fit + business_potential scoring as government tenders
- University procurement follows similar rules to gov procurement (public notice, closing date, formal evaluation)
- Budget is typically stated → `budget_source=stated`

**Track B: "Research/grant collaboration"** (owner_type=ngo OR category_tags includes research_study or grant_funding)
- Uses modified scoring with additional dimensions (see §5)
- Budget may be a ceiling, not a contract value → different interpretation
- Timeline is often longer and less urgent than procurement deadlines

---

## 5. Evaluation Differences for Universities / Education

### Procurement tenders from universities (Track A)

Treated identically to government procurement. Same capability_fit and business_potential signals apply:
- Category match, agency familiarity, budget, deadline proximity
- Universities may have slightly lower budgets than central government for equivalent scope — adjust proxy heuristics accordingly (e.g. university IT tender threshold ~HK$200k vs gov ~HK$500k)

### Research grants & innovation calls (Track B)

**capability_fit (modified):**
- Does our work intersect with the research theme? (e.g. digital innovation in communications, AI in marketing)
- Do we have academic or research partners we could bring in?
- Keywords: innovation, digital transformation, AI, data, creative technology → boost
- Keywords: hard science, biomedical, engineering → reduce (not our domain)

**business_potential (modified):**
- Direct revenue potential is low to moderate (grants are typically cost-covering, not margin-generating)
- However, score highly on **strategic_value** (which replaces `recurrence_potential` in Track B):
  - IP co-ownership with a university → high value
  - Credibility boost / co-branding with HKU/NUS → high value
  - Access to student talent pipeline → moderate value
  - Publications and case study rights → moderate value
- New signal: `alignment_with_public_narrative` — does this project let us tell a compelling story about our agency's innovation credentials? (0–1 score)

**Label assignment (Track B):**
- Priority: strong capability fit + strong strategic value (even if budget is low)
- Consider: partial fit OR good strategic value
- Partner-only: we need a co-applicant with academic credentials
- Ignore: no thematic relevance at all

**How to express this in the model without schema changes:**

No separate schema needed. Express via:
- `category_tags` includes `research_study` or `grant_funding` → triggers Track B evaluation logic
- `owner_type = ngo` (grant-like) → additional `social_impact` and `strategic_value` signals active
- `evaluation_reason` text explicitly notes "evaluated as research/grant opportunity — strategic value weighted more heavily than commercial margin"

### NGO-style opportunities from universities (community programmes, social impact grants)

- Treat as `owner_type=ngo`, `category_tags=[social_services, grant_funding]`
- Evaluation emphasises `social_impact` signal (brand elevation, CSR alignment)
- Founder may choose to have a separate "minimum threshold" for these — e.g. only surface if strategic brand value is clearly articulable

---

## 6. Ongoing Maintenance & Evolution

### Keeping university sources healthy

- **Weekly:** Re-check known HTML list pages for new tenders (same as gov sources)
- **Quarterly:** Re-run Step 1 domain crawl per institution — find new portals, detect renamed pages
- **Coverage dashboard:** Show which institutions have active sources vs gaps
- **Broken source handling:** Same as gov — 3 consecutive failures → `status=deprecated` + alert

### Expansion path

**HK → SG → Regional Asia:**
- Current: HKU, CUHK, HKUST, PolyU, CityU + NUS, NTU, SMU, NTU polytechnics
- Next: EdUHK, HKBU, LU, SUSS, SIT, SUTD
- Then: Regional Asia: Taiwan (NTU, NTHU), Mainland CN (universities with HK-facing partnerships), Malaysia, Thailand
- Then: Global: UK Russell Group, US Ivy League R&D offices, Australian Go8

**Analytics the system can later generate:**
- "Which institutions produce the most Priority tenders per year?"
- "What is our win rate on university vs gov tenders?"
- "Which procurement offices are we well-known to? Which are cold?"

These become inputs to strategic relationship-building decisions — the tender intelligence layer informs not just bid decisions but account development strategy.

---

## Appendix: HK + SG University Seed List

### Hong Kong — UGC-funded institutions

| Institution | Short | Domain | Priority |
|------------|-------|--------|---------|
| The University of Hong Kong | HKU | hku.hk | 1 |
| The Chinese University of Hong Kong | CUHK | cuhk.edu.hk | 1 |
| The Hong Kong University of Science and Technology | HKUST | ust.hk | 1 |
| The Hong Kong Polytechnic University | PolyU | polyu.edu.hk | 1 |
| City University of Hong Kong | CityU | cityu.edu.hk | 1 |
| The Education University of Hong Kong | EdUHK | eduhk.hk | 2 |
| Hong Kong Baptist University | HKBU | hkbu.edu.hk | 2 |
| Lingnan University | LU | ln.edu.hk | 2 |
| The Open University of Hong Kong | OUHK | ouhk.edu.hk | 2 |
| Vocational Training Council (VTC) | VTC | vtc.edu.hk | 2 |

### Singapore — Public universities & polytechnics

| Institution | Short | Domain | Priority |
|------------|-------|--------|---------|
| National University of Singapore | NUS | nus.edu.sg | 1 |
| Nanyang Technological University | NTU | ntu.edu.sg | 1 |
| Singapore Management University | SMU | smu.edu.sg | 1 |
| Singapore University of Social Sciences | SUSS | suss.edu.sg | 2 |
| Singapore Institute of Technology | SIT | singaporetech.edu.sg | 2 |
| Singapore University of Technology and Design | SUTD | sutd.edu.sg | 2 |
| Nanyang Polytechnic | NYP | nyp.edu.sg | 2 |
| Singapore Polytechnic | SP | sp.edu.sg | 2 |
| Temasek Polytechnic | TP | tp.edu.sg | 2 |
| Republic Polytechnic | RP | rp.edu.sg | 3 |
| Ngee Ann Polytechnic | NP | np.edu.sg | 3 |
| Institute of Technical Education | ITE | ite.edu.sg | 3 |
