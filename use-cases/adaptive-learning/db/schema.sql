-- ============================================================
-- S1-S2 Adaptive Math Learning Platform — Database Schema
-- ============================================================
-- Requires: PostgreSQL 14+, pgvector extension (for embeddings)
-- ============================================================

-- Enable pgvector for semantic search on curriculum chunks
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- ─── CURRICULUM ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS learning_objectives (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code            TEXT NOT NULL UNIQUE,        -- e.g. MATH.S1.FRACTION.ADD
  grade           TEXT NOT NULL,               -- S1, S2
  topic           TEXT NOT NULL,               -- e.g. Number & Algebra
  subtopic        TEXT,                         -- e.g. Fractions
  name_en         TEXT NOT NULL,
  name_zh         TEXT NOT NULL,
  description_en  TEXT,
  description_zh  TEXT,
  display_order   INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── QUESTION BANK ─────────────────────────────────────────

CREATE TYPE question_type AS ENUM ('MCQ', 'OPEN_ENDED', 'FILL_IN', 'MULTI_STEP');
CREATE TYPE source_type AS ENUM ('PAST_PAPER', 'TEACHER_CREATED', 'SYSTEM_GENERATED');

CREATE TABLE IF NOT EXISTS questions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stem_en             TEXT NOT NULL,
  stem_zh             TEXT,
  -- MCQ options (null for non-MCQ)
  option_a_en         TEXT,
  option_b_en         TEXT,
  option_c_en         TEXT,
  option_d_en         TEXT,
  option_a_zh         TEXT,
  option_b_zh         TEXT,
  option_c_zh         TEXT,
  option_d_zh         TEXT,
  answer              TEXT NOT NULL,           -- 'A'/'B'/'C'/'D' or free text
  explanation_en      TEXT,
  explanation_zh      TEXT,
  question_type       question_type NOT NULL DEFAULT 'MCQ',
  difficulty_estimate SMALLINT CHECK (difficulty_estimate BETWEEN 1 AND 5),
  source_type         source_type NOT NULL DEFAULT 'TEACHER_CREATED',
  has_image           BOOLEAN DEFAULT FALSE,
  image_url           TEXT,
  grade               TEXT,                    -- S1, S2
  topic               TEXT,
  subtopic            TEXT,
  is_active           BOOLEAN DEFAULT TRUE,
  created_by          UUID,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Many-to-many: questions <-> learning_objectives
CREATE TABLE IF NOT EXISTS question_objective_map (
  question_id    UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  objective_id   UUID NOT NULL REFERENCES learning_objectives(id) ON DELETE CASCADE,
  is_primary     BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (question_id, objective_id)
);

-- ─── USERS ─────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');

CREATE TABLE IF NOT EXISTS users (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT NOT NULL,
  email               TEXT UNIQUE,
  password_hash       TEXT,
  role                user_role NOT NULL DEFAULT 'student',
  grade               TEXT,                    -- S1 / S2 (for students)
  class_name          TEXT,                    -- e.g. 1A, 2B
  preferred_language  TEXT DEFAULT 'ZH' CHECK (preferred_language IN ('EN', 'ZH')),
  is_active           BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── STUDENT MASTERY STATE ─────────────────────────────────

CREATE TABLE IF NOT EXISTS mastery_states (
  student_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  objective_id    UUID NOT NULL REFERENCES learning_objectives(id) ON DELETE CASCADE,
  -- 0=Not seen, 1=Introduced, 2=Practicing, 3=Consolidating, 4=Mastered
  mastery_level   SMALLINT NOT NULL DEFAULT 0 CHECK (mastery_level BETWEEN 0 AND 4),
  interest_level  NUMERIC(3,1) DEFAULT 3.0 CHECK (interest_level BETWEEN 1.0 AND 5.0),
  evidence_count  INT DEFAULT 0,
  last_practiced_at TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (student_id, objective_id)
);

-- ─── SESSIONS ──────────────────────────────────────────────

CREATE TYPE session_mode AS ENUM ('adaptive', 'practice', 'review', 'teacher_assigned');

CREATE TABLE IF NOT EXISTS sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mode            session_mode NOT NULL DEFAULT 'adaptive',
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  ended_at        TIMESTAMPTZ,
  duration_secs   INT,
  questions_seen  INT DEFAULT 0,
  questions_correct INT DEFAULT 0,
  ai_summary      JSONB,                       -- cached STUDENT_SESSION_SUMMARY output
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INTERACTIONS (per question attempt) ───────────────────

CREATE TABLE IF NOT EXISTS interactions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id          UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  student_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id         UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  objective_id        UUID REFERENCES learning_objectives(id),  -- primary objective
  student_answer      TEXT,
  is_correct          BOOLEAN,
  time_taken_secs     INT,
  hint_used           BOOLEAN DEFAULT FALSE,
  -- Student self-ratings (1-5)
  self_understanding  SMALLINT CHECK (self_understanding BETWEEN 1 AND 5),
  self_interest       SMALLINT CHECK (self_interest BETWEEN 1 AND 5),
  ai_explanation      JSONB,                   -- cached STUDENT_EXPLANATION output
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── KNOWLEDGE BASE CHUNKS (for RAG) ───────────────────────

CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_type     TEXT NOT NULL,               -- 'curriculum', 'policy', 'guidance'
  source_label    TEXT,
  content_en      TEXT,
  content_zh      TEXT,
  objective_code  TEXT,                        -- optional link to LO
  embedding       vector(1536),               -- OpenAI/Anthropic embedding dims
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Vector similarity index for semantic search
CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_idx
  ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ─── TEACHER PAPER UPLOAD ──────────────────────────────────

CREATE TABLE IF NOT EXISTS papers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id  UUID REFERENCES users(id),
  subject     TEXT DEFAULT 'MATH',
  grade_band  TEXT,
  exam_name   TEXT,
  year        INT,
  file_url    TEXT,
  file_key    TEXT,
  status      TEXT DEFAULT 'UPLOADED',   -- UPLOADED | OCR_RUNNING | DRAFT_READY | CONFIRMED | NEEDS_REVIEW
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS draft_questions (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paper_id              UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  stem_en               TEXT,
  stem_zh               TEXT,
  has_image             BOOLEAN DEFAULT FALSE,
  image_url             TEXT,
  suggested_type        TEXT DEFAULT 'MCQ',
  suggested_difficulty  SMALLINT DEFAULT 2,
  candidate_objectives  JSONB,
  raw_ocr_text          TEXT,
  status                TEXT DEFAULT 'DRAFT',  -- DRAFT | EDITED | CONFIRMED | SKIPPED | NEEDS_REVIEW
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ─── BADGES & GAMIFICATION ─────────────────────────────────

CREATE TABLE IF NOT EXISTS badges (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code        TEXT NOT NULL UNIQUE,
  name_en     TEXT NOT NULL,
  name_zh     TEXT NOT NULL,
  description_en TEXT,
  description_zh TEXT,
  icon        TEXT
);

CREATE TABLE IF NOT EXISTS student_badges (
  student_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id    UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (student_id, badge_id)
);

-- ─── VIEWS ─────────────────────────────────────────────────

-- Class-level mastery heatmap (for teacher panel)
CREATE OR REPLACE VIEW v_class_mastery AS
SELECT
  u.class_name,
  u.grade,
  lo.code       AS objective_code,
  lo.name_en,
  lo.name_zh,
  lo.topic,
  lo.subtopic,
  ROUND(AVG(ms.mastery_level), 2)   AS avg_mastery,
  ROUND(AVG(ms.interest_level), 2)  AS avg_interest,
  COUNT(ms.student_id)              AS student_count,
  COUNT(ms.student_id) FILTER (WHERE ms.mastery_level = 0) AS not_seen,
  COUNT(ms.student_id) FILTER (WHERE ms.mastery_level = 1) AS introduced,
  COUNT(ms.student_id) FILTER (WHERE ms.mastery_level = 2) AS practicing,
  COUNT(ms.student_id) FILTER (WHERE ms.mastery_level = 3) AS consolidating,
  COUNT(ms.student_id) FILTER (WHERE ms.mastery_level = 4) AS mastered
FROM mastery_states ms
JOIN users u ON u.id = ms.student_id AND u.role = 'student'
JOIN learning_objectives lo ON lo.id = ms.objective_id
GROUP BY u.class_name, u.grade, lo.code, lo.name_en, lo.name_zh, lo.topic, lo.subtopic;

-- Student progress summary
CREATE OR REPLACE VIEW v_student_progress AS
SELECT
  u.id AS student_id,
  u.name,
  u.grade,
  u.class_name,
  COUNT(ms.objective_id)                                    AS objectives_seen,
  COUNT(ms.objective_id) FILTER (WHERE ms.mastery_level >= 3) AS objectives_strong,
  ROUND(AVG(ms.mastery_level), 2)                           AS avg_mastery,
  ROUND(AVG(ms.interest_level), 2)                          AS avg_interest,
  SUM(ms.evidence_count)                                    AS total_attempts
FROM users u
LEFT JOIN mastery_states ms ON ms.student_id = u.id
WHERE u.role = 'student'
GROUP BY u.id, u.name, u.grade, u.class_name;

-- ─── SEED: BADGES ──────────────────────────────────────────

INSERT INTO badges (code, name_en, name_zh, description_en, description_zh, icon) VALUES
  ('FIRST_SESSION',     'First Step',        '第一步',         'Completed your first learning session',              '完成了第一次學習', '🎯'),
  ('CURIOUS_EXPLORER',  'Curious Explorer',  '好奇探索者',     'Explored 5 different concept areas',                '探索了5個不同概念', '🔍'),
  ('CONCEPT_MASTER',    'Concept Master',    '概念達人',       'Achieved mastery in 3 or more objectives',          '在3個或以上目標達到精通', '🏆'),
  ('HONEST_SELF',       'Honest Learner',    '誠實學者',       'Rated your own understanding 10 times',             '自我評估10次', '💡'),
  ('STREAK_3',          '3-Day Streak',      '三日連續',       'Practiced 3 days in a row',                        '連續3天練習', '🔥'),
  ('INTEREST_PEAK',     'Interest Peak',     '興趣高峰',       'Gave a 5/5 interest rating to a concept',          '對某概念給出5分興趣評分', '⭐')
ON CONFLICT (code) DO NOTHING;
