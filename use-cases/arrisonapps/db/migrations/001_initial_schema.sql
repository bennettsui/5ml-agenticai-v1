-- =============================================================================
-- Arrisonapps Cigar System — Initial Schema
-- Version: 001
-- Description: Full schema for multi-region cigar product catalog, enquiry,
--              CRM, inventory, and 5ML Agentic integration.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- EXTENSIONS
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "unaccent";   -- accent-insensitive search

-- ---------------------------------------------------------------------------
-- SCHEMA ISOLATION
-- ---------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS arrisonapps;
SET search_path TO arrisonapps, public;

-- ---------------------------------------------------------------------------
-- 1. REGIONS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS regions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          VARCHAR(10)  NOT NULL UNIQUE,  -- e.g. 'HK', 'SG', 'EU'
  name          VARCHAR(100) NOT NULL,         -- e.g. 'Hong Kong'
  currency_code VARCHAR(3)   NOT NULL,         -- ISO 4217: 'HKD', 'SGD', 'EUR'
  currency_symbol VARCHAR(5) NOT NULL,         -- '$', '€'
  default_language VARCHAR(10) NOT NULL DEFAULT 'en',  -- 'en', 'zh-TW', 'zh-CN'
  notify_emails TEXT[],                        -- sales team email list for this region
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 2. LOCATIONS  (within a region)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS locations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id     UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  code          VARCHAR(20)  NOT NULL,                    -- 'HK-CENTRAL', 'HK-WH'
  name          VARCHAR(200) NOT NULL,                    -- 'Central Store'
  location_type VARCHAR(30)  NOT NULL DEFAULT 'store',    -- store | warehouse | consignment
  address       TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (region_id, code)
);

-- ---------------------------------------------------------------------------
-- 3. ROLES & PERMISSIONS (RBAC)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(50) NOT NULL UNIQUE,   -- admin | region_manager | sales | backoffice | viewer
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource    VARCHAR(100) NOT NULL,   -- products | stock | leads | reports | settings
  action      VARCHAR(50)  NOT NULL,   -- read | create | update | delete | manage
  description TEXT,
  UNIQUE (resource, action)
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id       UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- ---------------------------------------------------------------------------
-- 4. USERS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(320) NOT NULL UNIQUE,
  password_hash   TEXT,                            -- bcrypt hash; NULL = SSO-only
  full_name       VARCHAR(200) NOT NULL,
  phone           VARCHAR(30),
  role_id         UUID REFERENCES roles(id),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  is_customer     BOOLEAN NOT NULL DEFAULT FALSE,  -- TRUE = front-end registered customer
  email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- user ↔ region assignments (a sales person may cover multiple regions)
CREATE TABLE IF NOT EXISTS user_regions (
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  region_id UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, region_id)
);

-- ---------------------------------------------------------------------------
-- 5. CUSTOMERS (CRM entity — linked to or separate from user accounts)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,  -- linked account if exists
  full_name     VARCHAR(200) NOT NULL,
  email         VARCHAR(320) NOT NULL UNIQUE,
  phone         VARCHAR(30),
  preferred_language VARCHAR(10) DEFAULT 'en',
  preferred_currency VARCHAR(3),                -- override region default
  home_region_id UUID REFERENCES regions(id),  -- customer's primary region
  kyc_notes     TEXT,                           -- internal KYC / due diligence notes
  is_vip        BOOLEAN NOT NULL DEFAULT FALSE,
  tags          TEXT[],                         -- e.g. ['collector', 'corporate']
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 6. BRANDS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS brands (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        VARCHAR(100) NOT NULL UNIQUE,     -- 'cohiba', 'montecristo'
  name        VARCHAR(200) NOT NULL,
  origin      VARCHAR(100),                     -- 'Cuba', 'Dominican Republic'
  description TEXT,
  logo_url    TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 7. PRODUCTS  (Global SKU catalogue)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku             VARCHAR(100) NOT NULL UNIQUE,  -- global unique code
  brand_id        UUID NOT NULL REFERENCES brands(id),
  series          VARCHAR(200),                  -- 'Siglo', 'No.2'
  vitola          VARCHAR(200),                  -- 'Robusto', 'Churchill', 'Corona'
  ring_gauge      NUMERIC(5,2),                  -- ring gauge in 64ths of an inch
  length_mm       NUMERIC(6,1),                  -- length in mm
  wrapper_origin  VARCHAR(100),
  binder_origin   VARCHAR(100),
  filler_origins  TEXT[],
  strength        VARCHAR(20),                   -- mild | medium | full
  vintage_year    INT,
  packaging_qty   INT NOT NULL DEFAULT 1,        -- 1, 10, 25, 50
  packaging_type  VARCHAR(50) DEFAULT 'singles', -- singles | box | tube | travel-humidor
  is_limited_edition BOOLEAN NOT NULL DEFAULT FALSE,
  is_travel_humidor  BOOLEAN NOT NULL DEFAULT FALSE,
  short_description  TEXT,
  full_description   TEXT,
  tasting_notes   TEXT,
  pairing_notes   TEXT,
  tags            TEXT[],                        -- ['LE', 'Travel Humidor', 'New Arrival']
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_sku   ON products(sku);

-- ---------------------------------------------------------------------------
-- 8. PRODUCT IMAGES  (stored as binary in Postgres)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_images (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sort_order    INT NOT NULL DEFAULT 0,
  is_primary    BOOLEAN NOT NULL DEFAULT FALSE,
  -- Binary storage: store image directly in Postgres (BYTEA)
  image_data    BYTEA,                           -- raw image bytes (max ~10 MB recommended)
  -- Metadata
  filename      VARCHAR(500),
  mime_type     VARCHAR(100) NOT NULL DEFAULT 'image/jpeg',
  width_px      INT,
  height_px     INT,
  size_bytes    INT,
  alt_text      TEXT,
  -- CDN / external URL fallback (if migrated to object storage later)
  cdn_url       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);

COMMENT ON COLUMN product_images.image_data IS
  'Raw binary image stored in Postgres BYTEA. Max recommended: 10 MB per image. '
  'For larger assets, populate cdn_url and leave image_data NULL.';

-- ---------------------------------------------------------------------------
-- 9. PRODUCT REGION SETTINGS  (which regions carry which SKUs & price hints)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_region_settings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  region_id     UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  is_listed     BOOLEAN NOT NULL DEFAULT TRUE,   -- FALSE = hidden from this region's storefront
  display_price NUMERIC(12,2),                   -- indicative RRP in region currency
  price_notes   TEXT,                            -- e.g. 'price on request', 'enquiry only'
  enquiry_only  BOOLEAN NOT NULL DEFAULT FALSE,  -- bypass cart, force enquiry
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, region_id)
);

-- ---------------------------------------------------------------------------
-- 10. STOCK LEVELS  (current quantity per product per location)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_levels (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  location_id   UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  quantity      INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  reserved_qty  INT NOT NULL DEFAULT 0 CHECK (reserved_qty >= 0),  -- soft reservations
  reorder_point INT NOT NULL DEFAULT 5,          -- trigger low-stock alert below this
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, location_id)
);
CREATE INDEX IF NOT EXISTS idx_stock_levels_product  ON stock_levels(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_levels_location ON stock_levels(location_id);

-- ---------------------------------------------------------------------------
-- 11. STOCK MOVEMENTS  (audit trail of all inventory changes)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_movements (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movement_type    VARCHAR(30) NOT NULL,  -- purchase | sale | transfer | consignment_in | consignment_out | adjustment
  product_id       UUID NOT NULL REFERENCES products(id),
  from_location_id UUID REFERENCES locations(id),  -- NULL for initial purchase
  to_location_id   UUID REFERENCES locations(id),  -- NULL for outbound sale
  quantity         INT NOT NULL,                    -- always positive; direction implied by type
  unit_cost        NUMERIC(12,2),                   -- cost price at time of movement
  reference_no     VARCHAR(200),                    -- PO number, invoice, shipment ref
  notes            TEXT,
  performed_by     UUID REFERENCES users(id),
  enquiry_id       UUID,                            -- FK set after enquiries table created (deferred)
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product  ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type     ON stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created  ON stock_movements(created_at DESC);

-- ---------------------------------------------------------------------------
-- 12. ENQUIRIES  (front-end cart → submitted enquiry)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS enquiries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_no      VARCHAR(50) NOT NULL UNIQUE,     -- human-readable ref, e.g. 'ENQ-HK-2026-00001'
  customer_id     UUID NOT NULL REFERENCES customers(id),
  region_id       UUID NOT NULL REFERENCES regions(id),
  currency_code   VARCHAR(3) NOT NULL,             -- currency at time of enquiry
  status          VARCHAR(30) NOT NULL DEFAULT 'submitted',  -- submitted | acknowledged | fulfilled | cancelled
  notes           TEXT,                            -- customer remarks / budget / preferences
  source          VARCHAR(100),                    -- 'website-HK', 'manual', 'agent'
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_enquiries_customer ON enquiries(customer_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_region   ON enquiries(region_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_status   ON enquiries(status);

-- ---------------------------------------------------------------------------
-- 13. ENQUIRY ITEMS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS enquiry_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id   UUID NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
  product_id   UUID NOT NULL REFERENCES products(id),
  quantity     INT NOT NULL CHECK (quantity > 0),
  unit_price_hint NUMERIC(12,2),   -- indicative price shown to customer at enquiry time
  notes        TEXT
);
CREATE INDEX IF NOT EXISTS idx_enquiry_items_enquiry ON enquiry_items(enquiry_id);

-- Add deferred FK for stock_movements → enquiries
ALTER TABLE stock_movements
  ADD CONSTRAINT fk_stock_movements_enquiry
  FOREIGN KEY (enquiry_id) REFERENCES enquiries(id) ON DELETE SET NULL
  DEFERRABLE INITIALLY DEFERRED;

-- ---------------------------------------------------------------------------
-- 14. LEADS  (CRM pipeline record — created from enquiry or manually)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_no         VARCHAR(50) NOT NULL UNIQUE,   -- 'LEAD-HK-2026-00001'
  enquiry_id      UUID UNIQUE REFERENCES enquiries(id) ON DELETE SET NULL,
  customer_id     UUID NOT NULL REFERENCES customers(id),
  region_id       UUID NOT NULL REFERENCES regions(id),
  currency_code   VARCHAR(3) NOT NULL,
  assigned_to     UUID REFERENCES users(id),     -- sales owner
  status          VARCHAR(30) NOT NULL DEFAULT 'new',
    -- new | contacted | quoting | negotiation | won | lost
  source          VARCHAR(100),
  estimated_value NUMERIC(12,2),                 -- in region currency
  probability_pct INT,                           -- 0–100
  expected_close  DATE,
  lost_reason     TEXT,
  won_note        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_leads_region     ON leads(region_id);
CREATE INDEX IF NOT EXISTS idx_leads_status     ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned   ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_customer   ON leads(customer_id);

-- ---------------------------------------------------------------------------
-- 15. LEAD ITEMS  (products in a CRM lead, may include pricing / quote)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lead_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id      UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  product_id   UUID NOT NULL REFERENCES products(id),
  quantity     INT NOT NULL CHECK (quantity > 0),
  unit_price   NUMERIC(12,2),                    -- quoted price (sales editable)
  discount_pct NUMERIC(5,2) DEFAULT 0,           -- % discount
  line_total   NUMERIC(12,2)                     -- computed: qty * unit_price * (1 - discount/100)
);
CREATE INDEX IF NOT EXISTS idx_lead_items_lead ON lead_items(lead_id);

-- ---------------------------------------------------------------------------
-- 16. LEAD ACTIVITIES  (notes, emails, status changes — activity timeline)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lead_activities (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id      UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  activity_type VARCHAR(30) NOT NULL,  -- note | email_sent | status_change | call | meeting
  content      TEXT,
  old_status   VARCHAR(30),
  new_status   VARCHAR(30),
  performed_by UUID REFERENCES users(id),
  is_internal  BOOLEAN NOT NULL DEFAULT TRUE,    -- FALSE = customer-visible
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead    ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_created ON lead_activities(created_at DESC);

-- ---------------------------------------------------------------------------
-- 17. EMAIL TEMPLATES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_type VARCHAR(50) NOT NULL,   -- enquiry_confirmation | quotation_ready | lead_won | enquiry_notify_sales
  language      VARCHAR(10) NOT NULL DEFAULT 'en',
  region_id     UUID REFERENCES regions(id),   -- NULL = all regions
  subject       TEXT NOT NULL,
  body_html     TEXT NOT NULL,
  variables     TEXT[],                 -- list of {{variable}} placeholders used
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (template_type, language, region_id)
);

-- ---------------------------------------------------------------------------
-- 18. NOTIFICATIONS / NOTIFICATION LOG
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notification_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type VARCHAR(50) NOT NULL,   -- email | sms | webhook
  recipient_email VARCHAR(320),
  template_type   VARCHAR(50),
  reference_id    UUID,                     -- enquiry_id or lead_id
  reference_type  VARCHAR(30),              -- 'enquiry' | 'lead'
  status          VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending | sent | failed
  error_message   TEXT,
  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notification_log_ref ON notification_log(reference_id);

-- ---------------------------------------------------------------------------
-- 19. INTEGRATION SETTINGS  (5ML Agentic platform & other external services)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS integration_settings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  namespace   VARCHAR(100) NOT NULL,  -- '5ml-agent', 'smtp', 'deepseek', etc.
  key         VARCHAR(200) NOT NULL,
  value       TEXT,                   -- store encrypted secrets in application layer
  is_secret   BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (namespace, key)
);

-- Seed: 5ML Agentic integration placeholders
INSERT INTO integration_settings (namespace, key, value, is_secret, description) VALUES
  ('5ml-agent', 'cigar_system_base_url',     '',    FALSE, 'Base URL of this Arrisonapps API, e.g. https://arrisonapps.fly.dev'),
  ('5ml-agent', 'cigar_system_api_key',      '',    TRUE,  'Bearer token for 5ML agent tool calls'),
  ('5ml-agent', 'cigar_system_region_default','HK', FALSE, 'Default region code for agent queries'),
  ('deepseek',  'model',                     'deepseek-reasoner', FALSE, 'DeepSeek model for AI tasks'),
  ('smtp',      'host',                      '',    FALSE, 'SMTP server host'),
  ('smtp',      'port',                      '587', FALSE, 'SMTP server port'),
  ('smtp',      'user',                      '',    TRUE,  'SMTP username'),
  ('smtp',      'pass',                      '',    TRUE,  'SMTP password'),
  ('smtp',      'from_name',                 'Arrisonapps', FALSE, 'Email sender name')
ON CONFLICT (namespace, key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 20. AUDIT LOG
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  performed_by UUID REFERENCES users(id),
  action       VARCHAR(100) NOT NULL,     -- 'lead.status_change', 'stock.movement', 'settings.update'
  resource     VARCHAR(50)  NOT NULL,     -- 'lead' | 'stock_movement' | 'integration_settings'
  resource_id  UUID,
  before_data  JSONB,
  after_data   JSONB,
  ip_address   INET,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource   ON audit_log(resource, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user       ON audit_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_log_created    ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action     ON audit_log(action);

-- ---------------------------------------------------------------------------
-- SEED DATA: Default Roles & Permissions
-- ---------------------------------------------------------------------------

INSERT INTO roles (id, name, description) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin',          'Full system access across all regions'),
  ('00000000-0000-0000-0000-000000000002', 'region_manager', 'Manage products, leads, stock for assigned regions'),
  ('00000000-0000-0000-0000-000000000003', 'sales',          'View and manage leads in assigned regions'),
  ('00000000-0000-0000-0000-000000000004', 'backoffice',     'Inventory, reports; limited lead access'),
  ('00000000-0000-0000-0000-000000000005', 'viewer',         'Read-only access')
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (resource, action, description) VALUES
  ('products',  'read',   'View product catalogue'),
  ('products',  'create', 'Create new products'),
  ('products',  'update', 'Edit products'),
  ('products',  'delete', 'Delete / deactivate products'),
  ('stock',     'read',   'View stock levels'),
  ('stock',     'create', 'Create stock movements'),
  ('stock',     'update', 'Adjust stock'),
  ('leads',     'read',   'View CRM leads'),
  ('leads',     'create', 'Create leads'),
  ('leads',     'update', 'Edit leads and add notes'),
  ('leads',     'manage', 'Assign leads, manage pipeline'),
  ('reports',   'read',   'View reports and analytics'),
  ('reports',   'export', 'Export PDF reports'),
  ('settings',  'read',   'View system settings'),
  ('settings',  'manage', 'Edit integration settings and config'),
  ('customers', 'read',   'View customer records'),
  ('customers', 'update', 'Edit customer records')
ON CONFLICT (resource, action) DO NOTHING;

-- Seed: Default regions
INSERT INTO regions (code, name, currency_code, currency_symbol, default_language, notify_emails) VALUES
  ('HK', 'Hong Kong', 'HKD', 'HK$', 'en',    ARRAY['sales-hk@arrisonapps.com']),
  ('SG', 'Singapore', 'SGD', 'S$',   'en',    ARRAY['sales-sg@arrisonapps.com']),
  ('EU', 'Europe',    'EUR', '€',    'en',    ARRAY['sales-eu@arrisonapps.com'])
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------------------------
-- HELPER VIEW: Product availability per region (for storefront)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_product_availability AS
SELECT
  p.id            AS product_id,
  p.sku,
  p.brand_id,
  b.name          AS brand_name,
  p.series,
  p.vitola,
  p.packaging_qty,
  p.packaging_type,
  p.strength,
  p.is_limited_edition,
  p.is_travel_humidor,
  p.tags,
  p.short_description,
  r.id            AS region_id,
  r.code          AS region_code,
  r.currency_code,
  r.currency_symbol,
  prs.is_listed,
  prs.display_price,
  prs.enquiry_only,
  COALESCE(SUM(sl.quantity - sl.reserved_qty), 0) AS available_qty,
  CASE
    WHEN NOT prs.is_listed THEN 'unlisted'
    WHEN COALESCE(SUM(sl.quantity - sl.reserved_qty), 0) <= 0 THEN 'out_of_stock'
    WHEN COALESCE(SUM(sl.quantity - sl.reserved_qty), 0) <= 10 THEN 'low_stock'
    ELSE 'in_stock'
  END AS stock_status
FROM products p
JOIN brands b ON b.id = p.brand_id
JOIN product_region_settings prs ON prs.product_id = p.id
JOIN regions r ON r.id = prs.region_id
LEFT JOIN locations loc ON loc.region_id = r.id AND loc.is_active = TRUE
LEFT JOIN stock_levels sl ON sl.product_id = p.id AND sl.location_id = loc.id
WHERE p.is_active = TRUE
GROUP BY
  p.id, p.sku, p.brand_id, b.name, p.series, p.vitola,
  p.packaging_qty, p.packaging_type, p.strength,
  p.is_limited_edition, p.is_travel_humidor, p.tags, p.short_description,
  r.id, r.code, r.currency_code, r.currency_symbol,
  prs.is_listed, prs.display_price, prs.enquiry_only;

COMMENT ON VIEW vw_product_availability IS
  'Aggregates available stock per product per region. '
  'Frontend: only show rows where stock_status != ''out_of_stock'' AND is_listed = TRUE. '
  'stock_status ''out_of_stock'' rows should be hidden from public catalog.';
