-- Man's Accounting Firm - Receipt Tracking Database Schema
-- Version: 1.2.0
-- Created: 2026-01-18
-- Updated: 2026-01-22

-- =============================================================================
-- t_clients TABLE
-- Master table for client management
-- =============================================================================

CREATE TABLE IF NOT EXISTS t_clients (
  id SERIAL PRIMARY KEY,
  client_name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_t_clients_name ON t_clients(client_name);

-- =============================================================================
-- receipt_batches TABLE
-- Tracks processing batches for each client
-- =============================================================================

CREATE TABLE IF NOT EXISTS receipt_batches (
  id SERIAL PRIMARY KEY,
  batch_id UUID UNIQUE DEFAULT gen_random_uuid(),
  client_id INT NOT NULL REFERENCES t_clients(id) ON DELETE CASCADE,
  dropbox_url TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  total_receipts INTEGER DEFAULT 0,
  processed_receipts INTEGER DEFAULT 0,
  failed_receipts INTEGER DEFAULT 0,
  total_amount DECIMAL(12, 2) DEFAULT 0,
  deductible_amount DECIMAL(12, 2) DEFAULT 0,
  non_deductible_amount DECIMAL(12, 2) DEFAULT 0,
  period_start DATE,
  period_end DATE,
  excel_file_path TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_receipt_batches_client ON receipt_batches(client_id);
CREATE INDEX IF NOT EXISTS idx_receipt_batches_status ON receipt_batches(status);
CREATE INDEX IF NOT EXISTS idx_receipt_batches_created ON receipt_batches(created_at DESC);

-- =============================================================================
-- t_receipts TABLE
-- Individual receipt records linked to clients and batches
-- =============================================================================

CREATE TABLE IF NOT EXISTS t_receipts (
  id SERIAL PRIMARY KEY,
  client_id INT NOT NULL REFERENCES t_clients(id) ON DELETE CASCADE,
  receipt_id UUID UNIQUE DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES receipt_batches(batch_id) ON DELETE CASCADE,

  image_path TEXT NOT NULL,
  image_hash VARCHAR(64),

  receipt_date DATE NOT NULL,
  vendor VARCHAR(255) NOT NULL,
  description TEXT,
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'HKD',
  tax_amount DECIMAL(12, 2) DEFAULT 0,
  receipt_number VARCHAR(100),
  payment_method VARCHAR(50),

  ocr_confidence DECIMAL(3, 2),
  ocr_warnings TEXT[],
  ocr_raw_text TEXT,

  category_id VARCHAR(10) NOT NULL,
  category_name VARCHAR(100) NOT NULL,
  categorization_confidence DECIMAL(3, 2),
  categorization_reasoning TEXT,

  deductible BOOLEAN DEFAULT true,
  deductible_amount DECIMAL(12, 2) NOT NULL,
  non_deductible_amount DECIMAL(12, 2) DEFAULT 0,

  compliance_warnings TEXT[],
  compliance_errors TEXT[],
  requires_review BOOLEAN DEFAULT false,
  reviewed BOOLEAN DEFAULT false,
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMP,

  retention_until DATE,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_t_receipts_client_id ON t_receipts(client_id);
CREATE INDEX IF NOT EXISTS idx_t_receipts_batch ON t_receipts(batch_id);
CREATE INDEX IF NOT EXISTS idx_t_receipts_date ON t_receipts(receipt_date DESC);
CREATE INDEX IF NOT EXISTS idx_t_receipts_vendor ON t_receipts(vendor);
CREATE INDEX IF NOT EXISTS idx_t_receipts_category ON t_receipts(category_id);
CREATE INDEX IF NOT EXISTS idx_t_receipts_review ON t_receipts(requires_review)
WHERE requires_review = true;
CREATE INDEX IF NOT EXISTS idx_t_receipts_hash ON t_receipts(image_hash);
CREATE INDEX IF NOT EXISTS idx_t_receipts_client_batch ON t_receipts(client_id, batch_id);

-- =============================================================================
-- CATEGORY STATISTICS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS category_statistics (
  id SERIAL PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES receipt_batches(batch_id) ON DELETE CASCADE,
  category_id VARCHAR(10) NOT NULL,
  category_name VARCHAR(100) NOT NULL,
  receipt_count INTEGER NOT NULL DEFAULT 0,
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  deductible_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  non_deductible_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  percent_of_total DECIMAL(5, 2) DEFAULT 0,
  avg_confidence DECIMAL(3, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(batch_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_category_stats_batch ON category_statistics(batch_id);
CREATE INDEX IF NOT EXISTS idx_category_stats_category ON category_statistics(category_id);

-- =============================================================================
-- PROCESSING LOGS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS processing_logs (
  id SERIAL PRIMARY KEY,
  batch_id UUID REFERENCES receipt_batches(batch_id) ON DELETE CASCADE,
  receipt_id UUID REFERENCES t_receipts(receipt_id) ON DELETE CASCADE,
  log_level VARCHAR(20) NOT NULL,
  step VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_processing_logs_batch ON processing_logs(batch_id);
CREATE INDEX IF NOT EXISTS idx_processing_logs_receipt ON processing_logs(receipt_id);
CREATE INDEX IF NOT EXISTS idx_processing_logs_level ON processing_logs(log_level);
CREATE INDEX IF NOT EXISTS idx_processing_logs_created ON processing_logs(created_at DESC);

-- =============================================================================
-- DUPLICATE RECEIPTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS duplicate_receipts (
  id SERIAL PRIMARY KEY,
  receipt_id_1 UUID NOT NULL REFERENCES t_receipts(receipt_id) ON DELETE CASCADE,
  receipt_id_2 UUID NOT NULL REFERENCES t_receipts(receipt_id) ON DELETE CASCADE,
  similarity_score DECIMAL(3, 2) NOT NULL,
  match_type VARCHAR(50) NOT NULL,
  flagged_at TIMESTAMP DEFAULT NOW(),
  resolved BOOLEAN DEFAULT false,
  resolved_by VARCHAR(255),
  resolved_at TIMESTAMP,
  resolution_notes TEXT,
  UNIQUE(receipt_id_1, receipt_id_2)
);

CREATE INDEX IF NOT EXISTS idx_duplicate_receipts_unresolved ON duplicate_receipts(resolved)
WHERE resolved = false;

-- =============================================================================
-- P&L LEARNING DATA (Phase 2)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS pnl_learning_data (
  id SERIAL PRIMARY KEY,
  learning_id UUID UNIQUE DEFAULT gen_random_uuid(),
  client_name VARCHAR(255) NOT NULL,
  source_file TEXT,
  category_id VARCHAR(10) NOT NULL,
  category_name VARCHAR(100) NOT NULL,
  description_patterns TEXT[],
  vendor_patterns TEXT[],
  amount_range_min DECIMAL(12, 2),
  amount_range_max DECIMAL(12, 2),
  frequency_score DECIMAL(3, 2),
  embedding vector(384),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pnl_learning_client ON pnl_learning_data(client_name);
CREATE INDEX IF NOT EXISTS idx_pnl_learning_category ON pnl_learning_data(category_id);
CREATE INDEX IF NOT EXISTS pnl_learning_embedding_idx ON pnl_learning_data USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- =============================================================================
-- VIEWS
-- =============================================================================

CREATE OR REPLACE VIEW v_recent_batches AS
SELECT
  rb.batch_id,
  c.client_name,
  rb.status,
  rb.total_receipts,
  rb.processed_receipts,
  rb.failed_receipts,
  rb.total_amount,
  rb.deductible_amount,
  rb.non_deductible_amount,
  rb.period_start,
  rb.period_end,
  rb.created_at,
  rb.completed_at,
  COUNT(r.receipt_id) FILTER (WHERE r.requires_review = true) AS review_count
FROM receipt_batches rb
LEFT JOIN t_receipts r ON rb.batch_id = r.batch_id
JOIN t_clients c ON rb.client_id = c.id
GROUP BY
  rb.batch_id,
  c.client_name,
  rb.status,
  rb.total_receipts,
  rb.processed_receipts,
  rb.failed_receipts,
  rb.total_amount,
  rb.deductible_amount,
  rb.non_deductible_amount,
  rb.period_start,
  rb.period_end,
  rb.created_at,
  rb.completed_at
ORDER BY rb.created_at DESC;

CREATE OR REPLACE VIEW v_category_breakdown AS
SELECT
  r.category_id,
  r.category_name,
  COUNT(*) AS receipt_count,
  SUM(r.amount) AS total_amount,
  SUM(r.deductible_amount) AS deductible_amount,
  SUM(r.non_deductible_amount) AS non_deductible_amount,
  AVG(r.categorization_confidence) AS avg_confidence,
  COUNT(*) FILTER (WHERE r.requires_review = true) AS review_required_count
FROM t_receipts r
GROUP BY r.category_id, r.category_name
ORDER BY total_amount DESC;

CREATE OR REPLACE VIEW v_compliance_issues AS
SELECT
  r.receipt_id,
  r.batch_id,
  r.receipt_date,
  r.vendor,
  r.amount,
  r.category_name,
  array_length(r.compliance_errors, 1) AS error_count,
  array_length(r.compliance_warnings, 1) AS warning_count,
  r.compliance_errors,
  r.compliance_warnings,
  r.requires_review,
  r.reviewed
FROM t_receipts r
WHERE array_length(r.compliance_errors, 1) > 0
   OR array_length(r.compliance_warnings, 1) > 0
ORDER BY error_count DESC, warning_count DESC;

-- =============================================================================
-- TRIGGERS & FUNCTIONS
-- =============================================================================

CREATE OR REPLACE FUNCTION update_batch_statistics() RETURNS TRIGGER AS $$
BEGIN
  UPDATE receipt_batches
  SET
    processed_receipts = (SELECT COUNT(*) FROM t_receipts WHERE batch_id = NEW.batch_id),
    total_amount = (SELECT COALESCE(SUM(amount),0) FROM t_receipts WHERE batch_id = NEW.batch_id),
    deductible_amount = (SELECT COALESCE(SUM(deductible_amount),0) FROM t_receipts WHERE batch_id = NEW.batch_id),
    non_deductible_amount = (SELECT COALESCE(SUM(non_deductible_amount),0) FROM t_receipts WHERE batch_id = NEW.batch_id),
    updated_at = NOW()
  WHERE batch_id = NEW.batch_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_update_batch_statistics
AFTER INSERT OR UPDATE ON t_receipts
FOR EACH ROW EXECUTE FUNCTION update_batch_statistics();

CREATE OR REPLACE FUNCTION calculate_retention_date(receipt_date DATE) RETURNS DATE AS $$
BEGIN
  RETURN DATE_TRUNC('year', receipt_date) + INTERVAL '7 years' + INTERVAL '11 months' + INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION detect_duplicates(p_receipt_id UUID) RETURNS TABLE (
  duplicate_id UUID,
  similarity_score DECIMAL,
  match_type VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r2.receipt_id AS duplicate_id,
    CASE
      WHEN r1.image_hash = r2.image_hash THEN 1.00
      WHEN r1.vendor = r2.vendor AND r1.receipt_date = r2.receipt_date AND ABS(r1.amount - r2.amount) < 0.01 THEN 0.95
      WHEN r1.vendor = r2.vendor AND r1.receipt_date = r2.receipt_date AND ABS(r1.amount - r2.amount)/r1.amount < 0.05 THEN 0.85
      ELSE 0.00
    END AS similarity_score,
    CASE
      WHEN r1.image_hash = r2.image_hash THEN 'exact_hash'
      WHEN r1.vendor = r2.vendor AND r1.receipt_date = r2.receipt_date AND ABS(r1.amount - r2.amount) < 0.01 THEN 'exact_match'
      ELSE 'similar_match'
    END AS match_type
  FROM t_receipts r1
  JOIN t_receipts r2 ON r1.batch_id = r2.batch_id AND r1.receipt_id != r2.receipt_id
  WHERE r1.receipt_id = p_receipt_id
    AND (r1.image_hash = r2.image_hash OR (r1.vendor = r2.vendor AND r1.receipt_date = r2.receipt_date AND ABS(r1.amount - r2.amount)/r1.amount < 0.05))
  ORDER BY similarity_score DESC;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE t_clients IS 'Master table for client management';
COMMENT ON TABLE receipt_batches IS 'Tracks batch processing of receipts for clients';
COMMENT ON TABLE t_receipts IS 'Individual receipt records linked to clients and batches';
COMMENT ON TABLE category_statistics IS 'Aggregate category performance metrics';
COMMENT ON TABLE processing_logs IS 'Detailed processing logs for debugging';
COMMENT ON TABLE duplicate_receipts IS 'Potential duplicate receipt pairs';
COMMENT ON TABLE pnl_learning_data IS 'Phase 2: P&L learning data with vector embeddings';
