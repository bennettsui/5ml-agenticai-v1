/**
 * C-Suite Relationship Intelligence — Postgres schema
 *
 * Tables:
 *  csuite_tenants          — one row per C-suite user (workspace isolation)
 *  csuite_contacts         — unified contact records per tenant
 *  csuite_interactions     — interaction log (email, meeting, call, note)
 *  csuite_scores           — relationship scores per contact (versioned)
 *  csuite_action_plans     — generated weekly action plans
 *
 * Data minimisation: only fields needed for relationship intelligence.
 * Sensitive notes stored as plain text (encryption handled at app layer if needed).
 */

'use strict';

const SCHEMA_SQL = `
-- Tenant registry (one row per C-suite user / workspace)
CREATE TABLE IF NOT EXISTS csuite_tenants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Unified contact records
CREATE TABLE IF NOT EXISTS csuite_contacts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES csuite_tenants(id) ON DELETE CASCADE,
  full_name         TEXT NOT NULL,
  email             TEXT,
  phone             TEXT,
  title             TEXT,
  company           TEXT,
  linkedin_url      TEXT,
  relationship_type TEXT DEFAULT 'contact',  -- friend|client|investor|gov|partner|media|talent|advisor
  visibility        TEXT DEFAULT 'PRIVATE',  -- PRIVATE|ORG-SHARED|SHARED-WITH-LIST
  tags              TEXT[],
  sectors           TEXT[],
  geographies       TEXT[],
  enrichment_data   JSONB,    -- output of contact-enricher agent
  notes             TEXT,     -- private notes (may be sensitive)
  source            TEXT,     -- google_contacts|email|calendar|manual|business_card
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_csuite_contacts_tenant ON csuite_contacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_csuite_contacts_company ON csuite_contacts(company);
CREATE INDEX IF NOT EXISTS idx_csuite_contacts_tags ON csuite_contacts USING gin(tags);

-- Interaction log
CREATE TABLE IF NOT EXISTS csuite_interactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES csuite_tenants(id) ON DELETE CASCADE,
  contact_id      UUID NOT NULL REFERENCES csuite_contacts(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL,   -- email|meeting|call|note|linkedin_message|event
  occurred_at     TIMESTAMPTZ NOT NULL,
  summary         TEXT,
  sentiment       TEXT,             -- positive|neutral|negative
  follow_up_due   DATE,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_csuite_interactions_contact ON csuite_interactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_csuite_interactions_tenant ON csuite_interactions(tenant_id);

-- Relationship scores (versioned — append-only)
CREATE TABLE IF NOT EXISTS csuite_scores (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES csuite_tenants(id) ON DELETE CASCADE,
  contact_id          UUID NOT NULL REFERENCES csuite_contacts(id) ON DELETE CASCADE,
  warmth_score        SMALLINT CHECK (warmth_score BETWEEN 0 AND 100),
  leverage_score      SMALLINT CHECK (leverage_score BETWEEN 0 AND 100),
  business_potential  SMALLINT CHECK (business_potential BETWEEN 0 AND 100),
  overall_priority    TEXT,   -- high|medium|low
  rationale           JSONB,
  scored_at           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_csuite_scores_contact ON csuite_scores(contact_id, scored_at DESC);

-- Weekly action plans
CREATE TABLE IF NOT EXISTS csuite_action_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES csuite_tenants(id) ON DELETE CASCADE,
  week_of         DATE NOT NULL,
  focus_areas     TEXT,
  plan_data       JSONB NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_csuite_plans_tenant ON csuite_action_plans(tenant_id, week_of DESC);
`;

async function initDb(pool) {
  try {
    await pool.query(SCHEMA_SQL);
    console.log('✅ [csuite-relationship-intelligence] DB schema initialised');
  } catch (err) {
    console.error('[csuite-relationship-intelligence] DB schema error:', err.message);
    throw err;
  }
}

module.exports = { initDb, SCHEMA_SQL };
