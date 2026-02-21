-- HK+SG Tender Intelligence Layer — Database Schema
-- Run this once to create all required tables.
-- Requires: PostgreSQL 14+ with pgvector extension.

-- ─── Enable pgvector (if not already enabled) ────────────────────────────────
CREATE EXTENSION IF NOT EXISTS vector;

-- ─── Source Registry ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tender_source_registry (
  source_id                 TEXT PRIMARY KEY,
  name                      TEXT NOT NULL,
  organisation              TEXT,
  owner_type                TEXT NOT NULL CHECK (owner_type IN ('gov', 'public_org', 'ngo', 'multilateral', 'other')),
  jurisdiction              TEXT NOT NULL,
  source_type               TEXT NOT NULL CHECK (source_type IN ('rss_xml', 'api_json', 'csv_open_data', 'html_list', 'html_hub', 'html_reference')),
  access                    TEXT NOT NULL DEFAULT 'public' CHECK (access IN ('public', 'login_required')),
  priority                  SMALLINT NOT NULL DEFAULT 2 CHECK (priority IN (1, 2, 3)),
  status                    TEXT NOT NULL DEFAULT 'active',
  base_url                  TEXT,
  feed_url                  TEXT,
  discovery_hub_url         TEXT,
  ingest_method             TEXT,
  update_pattern            TEXT DEFAULT 'unknown',
  update_times_hkt          TEXT[],
  field_map                 JSONB,
  parsing_notes             TEXT,
  scraping_config           JSONB,
  category_tags_default     TEXT[] NOT NULL DEFAULT '{}',
  legal_notes               TEXT,
  reliability_score         FLOAT CHECK (reliability_score >= 0 AND reliability_score <= 1),
  tags                      TEXT[] DEFAULT '{}',
  notes                     TEXT,
  last_checked_at           TIMESTAMPTZ,
  last_status_detail        TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tsr_jurisdiction ON tender_source_registry(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_tsr_status ON tender_source_registry(status);
CREATE INDEX IF NOT EXISTS idx_tsr_source_type ON tender_source_registry(source_type);

-- ─── Raw Capture Layer ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS raw_tender_captures (
  capture_id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id                 TEXT NOT NULL REFERENCES tender_source_registry(source_id),
  raw_format                TEXT NOT NULL CHECK (raw_format IN ('rss_xml', 'html_fragment', 'csv_row', 'api_json')),
  raw_payload               TEXT NOT NULL,
  item_url                  TEXT,
  item_guid                 TEXT,
  captured_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  normalised                BOOLEAN NOT NULL DEFAULT FALSE,
  normalised_tender_id      UUID,
  mapping_version           TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_rtc_source_guid ON raw_tender_captures(source_id, item_guid) WHERE item_guid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rtc_normalised ON raw_tender_captures(normalised) WHERE normalised = FALSE;
CREATE INDEX IF NOT EXISTS idx_rtc_captured_at ON raw_tender_captures(captured_at DESC);

-- ─── Unified Tenders (Normalised Layer) ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS tenders (
  tender_id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id                 TEXT NOT NULL REFERENCES tender_source_registry(source_id),
  source_references         TEXT[] DEFAULT '{}',
  raw_pointer               UUID REFERENCES raw_tender_captures(capture_id),
  jurisdiction              TEXT NOT NULL,
  owner_type                TEXT NOT NULL,
  source_url                TEXT,
  mapping_version           TEXT,

  -- Content
  tender_ref                TEXT,
  title                     TEXT NOT NULL,
  description_snippet       TEXT,
  agency                    TEXT,
  category_tags             TEXT[] DEFAULT '{}',
  raw_category              TEXT,

  -- Time
  publish_date              DATE,
  publish_date_estimated    BOOLEAN DEFAULT FALSE,
  closing_date              DATE,
  status                    TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'awarded', 'cancelled', 'unknown_closing')),
  first_seen_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Money
  budget_min                NUMERIC(15, 2),
  budget_max                NUMERIC(15, 2),
  currency                  TEXT,
  budget_source             TEXT DEFAULT 'unknown' CHECK (budget_source IN ('stated', 'estimated', 'proxy', 'unknown')),

  -- Deduplication
  is_canonical              BOOLEAN NOT NULL DEFAULT TRUE,
  canonical_tender_id       UUID REFERENCES tenders(tender_id),

  -- Evaluation (populated by TenderEvaluatorAgent)
  evaluation_status         TEXT NOT NULL DEFAULT 'pending' CHECK (evaluation_status IN ('pending', 'scored', 're_evaluate')),
  label                     TEXT NOT NULL DEFAULT 'unscored',

  -- Vector embedding of title+description for semantic dedup (future)
  title_embedding           vector(1536),

  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenders_ref_jurisdiction ON tenders(tender_ref, jurisdiction) WHERE tender_ref IS NOT NULL AND is_canonical = TRUE;
CREATE INDEX IF NOT EXISTS idx_tenders_closing_date ON tenders(closing_date) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_tenders_evaluation_status ON tenders(evaluation_status);
CREATE INDEX IF NOT EXISTS idx_tenders_label ON tenders(label);
CREATE INDEX IF NOT EXISTS idx_tenders_jurisdiction ON tenders(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_tenders_category_tags ON tenders USING GIN(category_tags);
-- pgvector similarity index for deduplication
CREATE INDEX IF NOT EXISTS idx_tenders_embedding ON tenders USING ivfflat (title_embedding vector_cosine_ops) WITH (lists = 50);

-- ─── Tender Evaluations ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tender_evaluations (
  eval_id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id                 UUID NOT NULL REFERENCES tenders(tender_id),
  capability_fit_score      FLOAT NOT NULL CHECK (capability_fit_score >= 0 AND capability_fit_score <= 1),
  business_potential_score  FLOAT NOT NULL CHECK (business_potential_score >= 0 AND business_potential_score <= 1),
  overall_relevance_score   FLOAT NOT NULL CHECK (overall_relevance_score >= 0 AND overall_relevance_score <= 1),
  label                     TEXT NOT NULL CHECK (label IN ('Priority', 'Consider', 'Partner-only', 'Ignore')),
  rationale                 TEXT NOT NULL,
  signals_used              JSONB,
  scoring_weights           JSONB,
  model_used                TEXT,
  evaluated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scoring_version           TEXT
);

CREATE INDEX IF NOT EXISTS idx_te_tender_id ON tender_evaluations(tender_id);
CREATE INDEX IF NOT EXISTS idx_te_evaluated_at ON tender_evaluations(evaluated_at DESC);
CREATE INDEX IF NOT EXISTS idx_te_label ON tender_evaluations(label);

-- ─── Tender Decisions ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tender_decisions (
  decision_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id                 UUID NOT NULL REFERENCES tenders(tender_id),
  decision                  TEXT NOT NULL CHECK (decision IN ('track', 'ignore', 'assigned', 'partner_needed', 'not_for_us', 'won', 'lost', 'shortlisted')),
  decided_by                TEXT NOT NULL DEFAULT 'founder',
  decided_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes                     TEXT,
  assigned_to               TEXT,
  pipeline_stage            TEXT CHECK (pipeline_stage IN ('qualification', 'proposal_drafting', 'submitted', 'won', 'lost')),
  pipeline_entered_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_td_tender_id ON tender_decisions(tender_id);
CREATE INDEX IF NOT EXISTS idx_td_decided_at ON tender_decisions(decided_at DESC);
CREATE INDEX IF NOT EXISTS idx_td_decision ON tender_decisions(decision);

-- ─── Daily Digests ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tender_daily_digests (
  digest_id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  digest_date               DATE NOT NULL UNIQUE,
  tenders_surfaced          UUID[] DEFAULT '{}',
  narrative_summary         TEXT,
  hk_top_count              INT DEFAULT 0,
  sg_top_count              INT DEFAULT 0,
  closing_soon_count        INT DEFAULT 0,
  new_tenders_total         INT DEFAULT 0,
  sources_active            INT DEFAULT 0,
  sources_with_issues       INT DEFAULT 0,
  source_issue_details      JSONB,
  generated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  email_sent_at             TIMESTAMPTZ
);

-- ─── Agent Run Logs ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tender_agent_run_logs (
  log_id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name                TEXT NOT NULL,
  run_id                    TEXT,
  started_at                TIMESTAMPTZ NOT NULL,
  completed_at              TIMESTAMPTZ,
  status                    TEXT CHECK (status IN ('running', 'success', 'failed', 'partial')),
  items_processed           INT DEFAULT 0,
  items_failed              INT DEFAULT 0,
  error_detail              TEXT,
  meta                      JSONB
);

CREATE INDEX IF NOT EXISTS idx_tarl_agent_name ON tender_agent_run_logs(agent_name);
CREATE INDEX IF NOT EXISTS idx_tarl_started_at ON tender_agent_run_logs(started_at DESC);

-- ─── Calibration Reports ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tender_calibration_reports (
  report_id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  summary                   TEXT,
  accuracy_precision        FLOAT,
  accuracy_recall           FLOAT,
  accuracy_f1               FLOAT,
  recommendations           JSONB,
  no_changes_needed         BOOLEAN DEFAULT FALSE,
  approved_at               TIMESTAMPTZ,
  approved_updates          JSONB
);

-- ─── Trigger: update updated_at automatically ────────────────────────────────

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_updated_at_tsr
  BEFORE UPDATE ON tender_source_registry
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_tenders
  BEFORE UPDATE ON tenders
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
