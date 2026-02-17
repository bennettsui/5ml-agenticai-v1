# Plan: Debug Use Case Implementation

## What Already Exists vs What's Needed

### Existing (CRM+KB — Sections 1-3): FULLY BUILT
The `use-cases/client-crm-kb/` package already has **16 tables** covering:
- **Client CRM**: `clients`, `contacts`, `contracts`, `opportunities`, `client_risks`, `health_score_history` — all REQ-CRM-* requirements
- **Brand/KB**: `brand_profiles`, `taste_examples`, `feedback_events`, `client_rules`, `patterns` — all REQ-BRAND-*, REQ-TASTE-*, REQ-FEEDBACK-*, REQ-RULES-*, REQ-PATTERN-* requirements
- **Projects**: `projects`, `project_deliverables`, `project_team`, `project_milestones` — all REQ-PROJECT-* requirements
- **System**: `users`, `audit_logs`
- **Backend**: Python FastAPI with routers for clients, contacts, contracts, brand, feedback, patterns, opportunities, gmail, chatbot, orchestration
- **Frontend**: CRM pages with brands, projects, feedback, integrations, agentic dashboard

### Missing (Debug — Section 4): NOT BUILT
- **Debug Sessions** (REQ-DEBUG-001~006): No tables, no API, no UI
- **Debug Issues** (REQ-ISSUE-001~006): No tables, no API, no UI
- **Debug Trace** (REQ-TRACE-001~005): No tables, no API, no UI
- **Debug Modules**: Not defined (web_monitor, brand_guardian, etc.)
- **CRM↔Debug integration** (REQ-INTEGRATION-001~005): No linking

---

## Implementation Plan

### Step 1: Database Schema — Add Debug Tables
**File**: `use-cases/client-crm-kb/packages/database/schema.sql` (append)

Add new enum types:
- `debug_subject_type` (web_page, design, video, social_post, agent_workflow, document, other)
- `debug_session_status` (open, in_review, addressed, ignored, archived)
- `debug_module_status` (success, partial_success, failed)
- `issue_area` (WebPerf, WebQC, Design, Video, Social, Brand, Logic, AgentBehavior)
- `issue_severity` (critical, major, minor, info)
- `issue_priority` (P0, P1, P2, P3)
- `resolution_status` (open, in_progress, resolved, accepted_risk, wont_fix, duplicate)
- `business_impact` (high, medium, low, none)
- `trace_step_type` (llm_call, tool_call, decision, eval, api_call, other)

Add 4 new tables:

**a) `debug_sessions`** — One per debug task
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| project_id | UUID FK → projects | Required |
| client_id | UUID FK → clients | Denormalized for fast queries |
| subject_type | debug_subject_type | What is being debugged |
| subject_ref | TEXT | URL / file ID / agent run ID |
| modules_invoked | JSONB | Array of {module, execution_time_ms, status, error_message} |
| overall_score | INTEGER (0-100) | |
| overall_status | VARCHAR(20) | pass / warning / fail |
| overall_summary | TEXT | |
| kb_entries_used | JSONB | Array of {type: 'rule'|'pattern', id: UUID} |
| status | debug_session_status | |
| status_notes | TEXT | |
| initiated_by | UUID FK → users | |
| report_ref | TEXT | Generated report file/URL |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**b) `debug_issues`** — Problems found during debug
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| debug_session_id | UUID FK → debug_sessions | |
| client_id | UUID FK → clients | Denormalized |
| project_id | UUID FK → projects | Denormalized |
| module | VARCHAR(100) | Source module |
| area | issue_area | |
| severity | issue_severity | |
| finding | TEXT | Problem description |
| evidence | JSONB | {screenshots, video_timecodes, text_fragments, log_links} |
| recommendation | TEXT | Suggested fix |
| priority | issue_priority | |
| related_rule_ids | UUID[] | KB rules related |
| related_pattern_ids | UUID[] | KB patterns related |
| score_impact | INTEGER | Points deducted |
| business_impact | business_impact | |
| user_impact | TEXT | |
| resolution_status | resolution_status | |
| assigned_to | UUID FK → users | |
| resolved_at | TIMESTAMPTZ | |
| resolution_notes | TEXT | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**c) `debug_trace_steps`** — Optional detailed execution trace
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| debug_session_id | UUID FK → debug_sessions | |
| parent_step_id | UUID FK → debug_trace_steps | NULL = root |
| type | trace_step_type | |
| name | VARCHAR(200) | |
| input_summary | TEXT | |
| output_summary | TEXT | |
| raw_input_ref | TEXT | File/object storage ref |
| raw_output_ref | TEXT | File/object storage ref |
| model | VARCHAR(100) | LLM calls only |
| temperature | DECIMAL(3,2) | LLM calls only |
| token_usage | JSONB | {prompt, completion, total} |
| cost_estimate | DECIMAL(10,6) | |
| tool_name | VARCHAR(100) | Tool calls only |
| tool_args | JSONB | Tool calls only |
| tool_result | JSONB | Tool calls only |
| error_flag | BOOLEAN | |
| error_type | VARCHAR(100) | |
| error_message | TEXT | |
| latency_ms | INTEGER | |
| started_at | TIMESTAMPTZ | |

**d) `debug_module_definitions`** — Registry of debug modules
| Column | Type | Notes |
|--------|------|-------|
| id | VARCHAR(50) PK | e.g. 'web_monitor', 'brand_guardian' |
| name | VARCHAR(200) | Display name |
| description | TEXT | |
| applicable_subject_types | TEXT[] | Which subject_types this module handles |
| version | VARCHAR(20) | |
| status | VARCHAR(20) | active / deprecated |
| created_at | TIMESTAMPTZ | |

Indexes:
- `debug_sessions(client_id)`, `debug_sessions(project_id)`, `debug_sessions(status)`, `debug_sessions(created_at DESC)`
- `debug_issues(debug_session_id)`, `debug_issues(client_id)`, `debug_issues(severity)`, `debug_issues(resolution_status)`
- `debug_trace_steps(debug_session_id)`, `debug_trace_steps(parent_step_id)`

### Step 2: Backend API Routes
**New directory**: `use-cases/client-crm-kb/apps/api/app/debug/`

Files:
- `__init__.py`
- `schemas.py` — Pydantic models for all debug entities
- `service.py` — CRUD operations + orchestration logic
- `router.py` — FastAPI endpoints
- `modules.py` — Debug module definitions and runner

**Key endpoints**:
```
POST   /api/debug/sessions              — Create debug session
GET    /api/debug/sessions               — List sessions (filter by client/project/status)
GET    /api/debug/sessions/{id}          — Get session detail + issues
PATCH  /api/debug/sessions/{id}/status   — Update session status
POST   /api/debug/sessions/{id}/run      — Execute debug modules
GET    /api/debug/sessions/{id}/report   — Generate/download report

GET    /api/debug/issues                 — List issues (filter by severity/status/client)
PATCH  /api/debug/issues/{id}            — Update issue (assign, resolve, etc.)
PATCH  /api/debug/issues/bulk            — Bulk update issues

GET    /api/debug/sessions/{id}/trace    — Get trace for a session
GET    /api/debug/modules                — List available debug modules

GET    /api/debug/stats                  — Aggregate stats (by client, by module, resolution rates)
```

**Debug Module Runner Logic** (service.py):
1. On `POST /sessions/{id}/run`:
   - Load client KB: brand_profile, client_rules (active), patterns (client + segment + global), taste_examples
   - For each selected module: invoke with KB context → produce issues
   - Calculate overall_score based on issues (start at 100, subtract per severity)
   - Record kb_entries_used
   - Save all issues
   - Optionally enable trace mode (records each LLM/tool call as trace steps)
2. Health score auto-update: after session completes, recalculate client health_score

### Step 3: Debug Modules — Initial Set (Phase 1 MVP: 3-5 modules)
Each module is an AI-powered check that receives: subject (URL/file), client KB context, and returns issues.

**Module 1: `brand_guardian`**
- Checks deliverable against brand profile (tone, values, do/don't list, visual rules)
- Uses Claude to analyze text/image against brand guidelines
- Returns issues for brand violations

**Module 2: `web_qc`**
- For web pages: checks accessibility, broken links, SEO basics, responsive design
- Can use headless browser or URL fetch + analysis
- Returns issues for web quality problems

**Module 3: `social_best_practice`**
- For social posts: checks platform-specific best practices (character limits, hashtags, image sizes, engagement hooks)
- Returns issues for social media guideline violations

**Module 4: `design_accuracy`**
- For design files/screenshots: checks color compliance, typography, logo usage against brand profile visual_rules
- Uses Claude Vision to analyze images
- Returns issues for design violations

**Module 5: `content_review`**
- For copy/documents: checks tone consistency, legal sensitivities, message alignment with key_messages
- Returns issues for content problems

### Step 4: Frontend — Debug Pages
**New directory**: `frontend/app/use-cases/crm/debug/`

**a) `page.tsx`** — Debug Sessions List
- Table/card view of all debug sessions
- Filters: client, project, status, date range
- Stats summary: total sessions, pass/warning/fail counts, avg score
- "New Debug Session" button

**b) `new/page.tsx`** — Create Debug Session
- Select client → auto-populate projects
- Select project
- Select subject type + enter subject ref (URL/file)
- Select modules to run (checkboxes, with recommended modules pre-selected based on subject type)
- Optional: enable trace mode
- "Run Debug" button

**c) `[id]/page.tsx`** — Debug Session Detail
- Header: overall score (big number with color), status badge, subject info
- Tab 1: Issues list (sortable by severity/priority, with expand/collapse detail)
- Tab 2: Module results (which modules ran, their individual status)
- Tab 3: KB entries used (links to rules/patterns that were referenced)
- Tab 4: Trace view (if trace was enabled — timeline/tree visualization)
- Actions: update status, assign issues, generate report

**d) Integration into existing CRM pages**:
- On project detail page: show "Debug Sessions" section with session list
- On client overview: show "Recent Debug" summary (count, avg score, unresolved issues)
- On feedback page: link from feedback → related debug sessions

### Step 5: Register as Use Case
**Modify**: `frontend/app/page.tsx`
- The CRM use case card already exists. The debug functionality is part of the CRM system (it's described in the same requirements doc), so rather than creating a separate use case card, add "Debug QA System" to the CRM card features.
- Update features: `['Client & Brand CRM', 'AI Feedback Analysis', 'Debug QA System', 'Knowledge Rules Engine']`

**Modify**: CRM layout/nav to add "Debug" navigation item alongside Brands, Projects, Feedback, etc.

### Step 6: CRM↔Debug Integration (REQ-INTEGRATION-001~005)
- Debug session creation auto-loads client KB (brand_profile + rules + patterns + taste_examples)
- Each module receives KB context in its system prompt
- After session: if new error pattern found, suggest creating a new pattern (needs human approval)
- After session: auto-update client health_score based on new critical/major issues
- In debug report: explicitly list which KB entries were used and how they influenced judgments

---

## Phasing

### Phase 1 — MVP (This implementation)
- DB schema (all 4 tables)
- 3 core modules: `brand_guardian`, `web_qc`, `social_best_practice`
- Backend CRUD + basic run endpoint
- Frontend: session list, create session, session detail with issues
- CRM nav integration (add Debug tab)
- KB loading on session creation
- Health score update after debug

### Phase 2 — Enhancement (Future)
- 2 more modules: `design_accuracy`, `content_review`
- Trace mode (detailed step recording + visualization)
- Report generation (PDF/HTML)
- Issue export to tickets (JIRA/Linear)
- Batch debug (multiple pages/files at once)
- Pattern suggestion from recurring issues

### Phase 3 — Advanced (Future)
- Real-time progress via WebSocket during debug execution
- Knowledge evolution dashboard
- Cross-client pattern promotion (client → segment → global)
- Onboarding missions
- RBAC with fine-grained debug permissions

---

## File Structure (New/Modified)

```
use-cases/client-crm-kb/
├── packages/database/
│   └── schema.sql                          # MODIFY: append debug tables + enums + indexes
├── apps/api/app/
│   ├── debug/                              # NEW: entire directory
│   │   ├── __init__.py
│   │   ├── schemas.py                      # Pydantic models
│   │   ├── service.py                      # CRUD + orchestration
│   │   ├── router.py                       # FastAPI routes
│   │   └── modules.py                      # Debug module definitions + runners
│   └── main.py                             # MODIFY: register debug router

frontend/app/use-cases/crm/
├── debug/                                  # NEW: entire directory
│   ├── page.tsx                            # Sessions list
│   ├── new/page.tsx                        # Create session
│   └── [id]/page.tsx                       # Session detail
├── layout.tsx                              # MODIFY: add Debug nav item
├── page.tsx                                # MODIFY: add debug stats to overview

frontend/app/page.tsx                       # MODIFY: update CRM card features
```

## Estimated Scope
- **New files**: ~10 (backend debug module + frontend pages)
- **Modified files**: ~4 (schema.sql, main.py, CRM layout, home page)
- **New DB tables**: 4
- **New API endpoints**: ~10
- **New frontend pages**: 3
