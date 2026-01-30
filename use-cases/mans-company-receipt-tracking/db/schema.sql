-- Man's Accounting Firm - Receipt Tracking Database Schema
-- Version: 1.0.0
-- Created: 2026-01-18

-- =============================================================================
-- RECEIPT BATCHES TABLE
-- Tracks processing batches from Dropbox folders
-- =============================================================================

CREATE TABLE IF NOT EXISTS receipt_batches (
  id SERIAL PRIMARY KEY,
  batch_id UUID UNIQUE DEFAULT gen_random_uuid(),
  client_name VARCHAR(255) NOT NULL,
  dropbox_url TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  -- Status: pending, processing, completed, failed
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

CREATE INDEX IF NOT EXISTS idx_receipt_batches_client ON receipt_batches(client_name);
CREATE INDEX IF NOT EXISTS idx_receipt_batches_status ON receipt_batches(status);
CREATE INDEX IF NOT EXISTS idx_receipt_batches_created ON receipt_batches(created_at DESC);

-- =============================================================================
-- RECEIPTS TABLE
-- Stores individual receipt records with OCR and categorization data
-- =============================================================================

CREATE TABLE IF NOT EXISTS receipts (
  id SERIAL PRIMARY KEY,
  receipt_id UUID UNIQUE DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES receipt_batches(batch_id) ON DELETE CASCADE,

  -- Receipt source
  image_path TEXT NOT NULL,
  image_hash VARCHAR(64),
  -- SHA-256 hash for duplicate detection

  -- OCR extracted data
  receipt_date DATE NOT NULL,
  vendor VARCHAR(255) NOT NULL,
  description TEXT,
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'HKD',
  tax_amount DECIMAL(12, 2) DEFAULT 0,
  receipt_number VARCHAR(100),
  payment_method VARCHAR(50),

  -- OCR metadata
  ocr_confidence DECIMAL(3, 2),
  -- 0.00 - 1.00
  ocr_warnings TEXT[],
  ocr_raw_text TEXT,
  ocr_boxes JSONB,

  -- Categorization
  category_id VARCHAR(10) NOT NULL,
  -- e.g., 5100, 5200
  category_name VARCHAR(100) NOT NULL,
  categorization_confidence DECIMAL(3, 2),
  categorization_reasoning TEXT,

  -- Financial classification
  deductible BOOLEAN DEFAULT true,
  deductible_amount DECIMAL(12, 2) NOT NULL,
  non_deductible_amount DECIMAL(12, 2) DEFAULT 0,

  -- Compliance
  compliance_warnings TEXT[],
  compliance_errors TEXT[],
  requires_review BOOLEAN DEFAULT false,
  reviewed BOOLEAN DEFAULT false,
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMP,

  -- Retention (HK rule: 7 years)
  retention_until DATE,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receipts_batch ON receipts(batch_id);
CREATE INDEX IF NOT EXISTS idx_receipts_date ON receipts(receipt_date DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_vendor ON receipts(vendor);
CREATE INDEX IF NOT EXISTS idx_receipts_category ON receipts(category_id);
CREATE INDEX IF NOT EXISTS idx_receipts_review ON receipts(requires_review)
WHERE
  requires_review = true;
CREATE INDEX IF NOT EXISTS idx_receipts_hash ON receipts(image_hash);

-- =============================================================================
-- CATEGORY STATISTICS TABLE
-- Aggregate category performance for analytics
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
  -- Percentage
  avg_confidence DECIMAL(3, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(batch_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_category_stats_batch ON category_statistics(batch_id);
CREATE INDEX IF NOT EXISTS idx_category_stats_category ON category_statistics(category_id);

-- =============================================================================
-- PROCESSING LOGS TABLE
-- Detailed logs of processing steps for debugging
-- =============================================================================

CREATE TABLE IF NOT EXISTS processing_logs (
  id SERIAL PRIMARY KEY,
  batch_id UUID REFERENCES receipt_batches(batch_id) ON DELETE CASCADE,
  receipt_id UUID REFERENCES receipts(receipt_id) ON DELETE CASCADE,
  log_level VARCHAR(20) NOT NULL,
  -- info, warning, error
  step VARCHAR(100) NOT NULL,
  -- download, ocr, categorize, export, etc.
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
-- Track potential duplicate submissions
-- =============================================================================

CREATE TABLE IF NOT EXISTS duplicate_receipts (
  id SERIAL PRIMARY KEY,
  receipt_id_1 UUID NOT NULL REFERENCES receipts(receipt_id) ON DELETE CASCADE,
  receipt_id_2 UUID NOT NULL REFERENCES receipts(receipt_id) ON DELETE CASCADE,
  similarity_score DECIMAL(3, 2) NOT NULL,
  -- 0.00 - 1.00
  match_type VARCHAR(50) NOT NULL,
  -- exact_hash, vendor_date_amount, etc.
  flagged_at TIMESTAMP DEFAULT NOW(),
  resolved BOOLEAN DEFAULT false,
  resolved_by VARCHAR(255),
  resolved_at TIMESTAMP,
  resolution_notes TEXT,
  UNIQUE(receipt_id_1, receipt_id_2)
);

CREATE INDEX IF NOT EXISTS idx_duplicate_receipts_unresolved ON duplicate_receipts(resolved)
WHERE
  resolved = false;

-- =============================================================================
-- P&L LEARNING DATA (Phase 2)
-- Vector embeddings for enhanced categorization
-- =============================================================================

-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS pnl_learning_data (
  id SERIAL PRIMARY KEY,
  learning_id UUID UNIQUE DEFAULT gen_random_uuid(),
  client_name VARCHAR(255) NOT NULL,
  source_file TEXT,
  -- Original P&L file path
  category_id VARCHAR(10) NOT NULL,
  category_name VARCHAR(100) NOT NULL,
  description_patterns TEXT[],
  vendor_patterns TEXT[],
  amount_range_min DECIMAL(12, 2),
  amount_range_max DECIMAL(12, 2),
  frequency_score DECIMAL(3, 2),
  -- How often this pattern appears

  -- Vector embedding for semantic search
  embedding vector(384),
  -- 384 dimensions for sentence-transformers

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pnl_learning_client ON pnl_learning_data(client_name);
CREATE INDEX IF NOT EXISTS idx_pnl_learning_category ON pnl_learning_data(category_id);

-- Create vector index for similarity search
CREATE INDEX IF NOT EXISTS pnl_learning_embedding_idx ON pnl_learning_data USING ivfflat (embedding vector_cosine_ops)
WITH
  (lists = 100);

-- =============================================================================
-- VIEWS FOR ANALYTICS
-- =============================================================================

-- View: Recent batches with statistics
CREATE OR REPLACE VIEW v_recent_batches AS
SELECT
  rb.batch_id,
  rb.client_name,
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
  COUNT(r.receipt_id) FILTER (
    WHERE
      r.requires_review = true
  ) AS review_count
FROM
  receipt_batches rb
  LEFT JOIN receipts r ON rb.batch_id = r.batch_id
GROUP BY
  rb.batch_id,
  rb.client_name,
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
ORDER BY
  rb.created_at DESC;

-- View: Category breakdown with trends
CREATE OR REPLACE VIEW v_category_breakdown AS
SELECT
  r.category_id,
  r.category_name,
  COUNT(*) AS receipt_count,
  SUM(r.amount) AS total_amount,
  SUM(r.deductible_amount) AS deductible_amount,
  SUM(r.non_deductible_amount) AS non_deductible_amount,
  AVG(r.categorization_confidence) AS avg_confidence,
  COUNT(*) FILTER (
    WHERE
      r.requires_review = true
  ) AS review_required_count
FROM
  receipts r
GROUP BY
  r.category_id,
  r.category_name
ORDER BY
  total_amount DESC;

-- View: Compliance issues summary
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
FROM
  receipts r
WHERE
  array_length(r.compliance_errors, 1) > 0
  OR array_length(r.compliance_warnings, 1) > 0
ORDER BY
  error_count DESC,
  warning_count DESC;

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function: Update batch statistics after receipt processing
CREATE OR REPLACE FUNCTION update_batch_statistics() RETURNS TRIGGER AS $$
BEGIN
  UPDATE
    receipt_batches
  SET
    processed_receipts = (
      SELECT
        COUNT(*)
      FROM
        receipts
      WHERE
        batch_id = NEW.batch_id
    ),
    total_amount = (
      SELECT
        COALESCE(SUM(amount), 0)
      FROM
        receipts
      WHERE
        batch_id = NEW.batch_id
    ),
    deductible_amount = (
      SELECT
        COALESCE(SUM(deductible_amount), 0)
      FROM
        receipts
      WHERE
        batch_id = NEW.batch_id
    ),
    non_deductible_amount = (
      SELECT
        COALESCE(SUM(non_deductible_amount), 0)
      FROM
        receipts
      WHERE
        batch_id = NEW.batch_id
    ),
    updated_at = NOW()
  WHERE
    batch_id = NEW.batch_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update batch statistics on receipt insert/update
CREATE OR REPLACE TRIGGER trigger_update_batch_statistics AFTER INSERT
OR
UPDATE ON receipts FOR EACH ROW
EXECUTE FUNCTION update_batch_statistics();

-- Function: Calculate retention date (HK rule: 7 years)
CREATE OR REPLACE FUNCTION calculate_retention_date(receipt_date DATE) RETURNS DATE AS $$
BEGIN
  RETURN DATE_TRUNC('year', receipt_date) + INTERVAL '7 years' + INTERVAL '11 months' + INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Detect duplicate receipts
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
      WHEN r1.vendor = r2.vendor
      AND r1.receipt_date = r2.receipt_date
      AND ABS(r1.amount - r2.amount) < 0.01 THEN 0.95
      WHEN r1.vendor = r2.vendor
      AND r1.receipt_date = r2.receipt_date
      AND ABS(r1.amount - r2.amount) / r1.amount < 0.05 THEN 0.85
      ELSE 0.00
    END AS similarity_score,
    CASE
      WHEN r1.image_hash = r2.image_hash THEN 'exact_hash'
      WHEN r1.vendor = r2.vendor
      AND r1.receipt_date = r2.receipt_date
      AND ABS(r1.amount - r2.amount) < 0.01 THEN 'exact_match'
      ELSE 'similar_match'
    END AS match_type
  FROM
    receipts r1
    JOIN receipts r2 ON r1.batch_id = r2.batch_id
    AND r1.receipt_id != r2.receipt_id
  WHERE
    r1.receipt_id = p_receipt_id
    AND (
      r1.image_hash = r2.image_hash
      OR (
        r1.vendor = r2.vendor
        AND r1.receipt_date = r2.receipt_date
        AND ABS(r1.amount - r2.amount) / r1.amount < 0.05
      )
    )
  ORDER BY
    similarity_score DESC;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- SAMPLE DATA (for testing)
-- =============================================================================

-- Uncomment to insert sample batch
-- INSERT INTO receipt_batches (client_name, dropbox_url, status, period_start, period_end)
-- VALUES ('Man\'s Accounting Firm', 'https://www.dropbox.com/sh/sample123', 'completed', '2026-01-01', '2026-01-31');

-- =============================================================================
-- CLEANUP & MAINTENANCE
-- =============================================================================

-- Function: Clean up old logs (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_logs() RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM processing_logs
  WHERE
    created_at < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Archive completed batches older than 2 years
-- (Implement as needed for archival strategy)

COMMENT ON TABLE receipt_batches IS 'Tracks batch processing of receipts from Dropbox folders';
COMMENT ON TABLE receipts IS 'Individual receipt records with OCR and categorization';
COMMENT ON TABLE category_statistics IS 'Aggregate category performance metrics';
COMMENT ON TABLE processing_logs IS 'Detailed processing logs for debugging';
COMMENT ON TABLE duplicate_receipts IS 'Potential duplicate receipt pairs';
COMMENT ON TABLE pnl_learning_data IS 'Phase 2: P&L learning data with vector embeddings';
