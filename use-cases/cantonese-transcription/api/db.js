'use strict';

/**
 * db.js — Cantonese Transcription Database Layer (PostgreSQL / Fly Postgres)
 *
 * Tables:
 *   ct_jobs        — one row per user submission (input + status)
 *   ct_results     — one row per completed analysis result
 *   ct_error_logs  — structured error log with error codes
 */

const { pool } = require('../../../db');

// ─────────────────────────────────────────────────────────────────────────────
// Error codes
// ─────────────────────────────────────────────────────────────────────────────

const ERROR_CODES = {
  CT_001: 'CT-001', // Missing or empty transcript
  CT_002: 'CT-002', // Transcript too short (< 10 chars)
  CT_003: 'CT-003', // Unknown / unsupported task
  CT_004: 'CT-004', // AI model unavailable (no API key)
  CT_005: 'CT-005', // AI API call failed
  CT_006: 'CT-006', // Database write error
  CT_007: 'CT-007', // Database read error
  CT_008: 'CT-008', // Request timeout
  CT_009: 'CT-009', // Invalid segments JSON
  CT_010: 'CT-010', // Model rate-limited
};

const ERROR_MESSAGES = {
  'CT-001': '逐字稿內容唔可以為空',
  'CT-002': '逐字稿內容過短（最少10個字元）',
  'CT-003': '唔支援嘅分析任務類型',
  'CT-004': 'AI 模型 API Key 未設定，請聯絡管理員',
  'CT-005': 'AI 模型調用失敗，請稍後再試',
  'CT-006': '資料庫寫入失敗',
  'CT-007': '資料庫讀取失敗',
  'CT-008': '請求逾時，請重試',
  'CT-009': 'Segments JSON 格式無效',
  'CT-010': 'AI 模型速率限制，請稍後再試',
};

// ─────────────────────────────────────────────────────────────────────────────
// Schema init
// ─────────────────────────────────────────────────────────────────────────────

async function init() {
  // Jobs table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ct_jobs (
      id          SERIAL PRIMARY KEY,
      job_id      UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
      transcript  TEXT NOT NULL,
      segments    JSONB,
      task        TEXT NOT NULL,
      model       TEXT NOT NULL,
      extra_instructions TEXT,
      status      TEXT NOT NULL DEFAULT 'pending'
                  CHECK(status IN ('pending','processing','done','error')),
      char_count  INTEGER,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Results table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ct_results (
      id          SERIAL PRIMARY KEY,
      job_id      UUID NOT NULL REFERENCES ct_jobs(job_id) ON DELETE CASCADE,
      result_text TEXT,
      model_used  TEXT,
      duration_ms INTEGER,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Error log table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ct_error_logs (
      id            SERIAL PRIMARY KEY,
      job_id        UUID REFERENCES ct_jobs(job_id) ON DELETE SET NULL,
      error_code    TEXT NOT NULL,
      error_message TEXT NOT NULL,
      context       JSONB,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Indexes for list queries
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_ct_jobs_created_at ON ct_jobs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_ct_results_job_id  ON ct_results(job_id);
    CREATE INDEX IF NOT EXISTS idx_ct_error_logs_created_at ON ct_error_logs(created_at DESC);
  `);
}

// ─────────────────────────────────────────────────────────────────────────────
// Jobs
// ─────────────────────────────────────────────────────────────────────────────

async function createJob({ transcript, segments, task, model, extra_instructions }) {
  const { rows } = await pool.query(
    `INSERT INTO ct_jobs (transcript, segments, task, model, extra_instructions, status, char_count)
     VALUES ($1, $2, $3, $4, $5, 'processing', $6)
     RETURNING *`,
    [
      transcript,
      segments ? JSON.stringify(segments) : null,
      task,
      model,
      extra_instructions || null,
      transcript.length,
    ]
  );
  return rows[0];
}

async function updateJobStatus(jobId, status) {
  await pool.query(
    `UPDATE ct_jobs SET status = $1, updated_at = NOW() WHERE job_id = $2`,
    [status, jobId]
  );
}

async function listJobs({ limit = 50, offset = 0 } = {}) {
  const { rows } = await pool.query(
    `SELECT j.*,
            r.result_text,
            r.model_used,
            r.duration_ms
     FROM ct_jobs j
     LEFT JOIN ct_results r ON r.job_id = j.job_id
     ORDER BY j.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
}

async function getJob(jobId) {
  const { rows } = await pool.query(
    `SELECT j.*,
            r.result_text,
            r.model_used,
            r.duration_ms
     FROM ct_jobs j
     LEFT JOIN ct_results r ON r.job_id = j.job_id
     WHERE j.job_id = $1`,
    [jobId]
  );
  return rows[0] || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Results
// ─────────────────────────────────────────────────────────────────────────────

async function saveResult({ jobId, resultText, modelUsed, durationMs }) {
  const { rows } = await pool.query(
    `INSERT INTO ct_results (job_id, result_text, model_used, duration_ms)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [jobId, resultText, modelUsed, durationMs]
  );
  return rows[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// Error logs
// ─────────────────────────────────────────────────────────────────────────────

async function logError({ jobId, errorCode, errorMessage, context }) {
  try {
    await pool.query(
      `INSERT INTO ct_error_logs (job_id, error_code, error_message, context)
       VALUES ($1, $2, $3, $4)`,
      [jobId || null, errorCode, errorMessage, context ? JSON.stringify(context) : null]
    );
  } catch (err) {
    // Don't throw from the error logger itself
    console.error('[ct-db] Failed to write error log:', err.message);
  }
}

async function listErrorLogs({ limit = 100, offset = 0 } = {}) {
  const { rows } = await pool.query(
    `SELECT * FROM ct_error_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
}

async function getStats() {
  const { rows } = await pool.query(`
    SELECT
      COUNT(*)                                            AS total_jobs,
      COUNT(*) FILTER (WHERE status = 'done')             AS done_jobs,
      COUNT(*) FILTER (WHERE status = 'error')            AS error_jobs,
      COUNT(*) FILTER (WHERE status = 'processing')       AS processing_jobs,
      SUM(char_count)                                     AS total_chars,
      (SELECT COUNT(*) FROM ct_error_logs)                AS total_errors
    FROM ct_jobs
  `);
  return rows[0];
}

module.exports = {
  init,
  ERROR_CODES,
  ERROR_MESSAGES,
  // jobs
  createJob,
  updateJobStatus,
  listJobs,
  getJob,
  // results
  saveResult,
  // error logs
  logError,
  listErrorLogs,
  getStats,
};
