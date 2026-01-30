-- Photo Booth Database Schema
-- Tables for AI Photo Booth use case

-- Events table - represents branded events/activations
CREATE TABLE IF NOT EXISTS photo_booth_events (
  id SERIAL PRIMARY KEY,
  event_id UUID DEFAULT gen_random_uuid() UNIQUE,
  name VARCHAR(255) NOT NULL,
  brand_name VARCHAR(255),
  logo_path TEXT,
  hashtag VARCHAR(100),
  metadata_json JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Sessions table - represents individual photo booth sessions
CREATE TABLE IF NOT EXISTS photo_booth_sessions (
  id SERIAL PRIMARY KEY,
  session_id UUID DEFAULT gen_random_uuid() UNIQUE,
  event_id UUID REFERENCES photo_booth_events(event_id),
  user_consent BOOLEAN DEFAULT false,
  language VARCHAR(10) DEFAULT 'en',
  theme_selected VARCHAR(100),
  analysis_json JSONB,
  status VARCHAR(50) DEFAULT 'created',
  error_code VARCHAR(50),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Images table - stores both original and generated images
CREATE TABLE IF NOT EXISTS photo_booth_images (
  id SERIAL PRIMARY KEY,
  image_id UUID DEFAULT gen_random_uuid() UNIQUE,
  session_id UUID REFERENCES photo_booth_sessions(session_id) ON DELETE CASCADE,
  image_type VARCHAR(20) NOT NULL, -- 'original', 'styled', 'branded'
  image_path TEXT NOT NULL,
  image_hash VARCHAR(64),
  theme VARCHAR(100),
  comfyui_prompt TEXT,
  generation_time_ms INTEGER,
  quality_check_json JSONB,
  metadata_json JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Errors table - detailed error logging
CREATE TABLE IF NOT EXISTS photo_booth_errors (
  id SERIAL PRIMARY KEY,
  error_id UUID DEFAULT gen_random_uuid() UNIQUE,
  session_id UUID REFERENCES photo_booth_sessions(session_id) ON DELETE SET NULL,
  error_code VARCHAR(50) NOT NULL,
  error_message TEXT NOT NULL,
  agent_name VARCHAR(100),
  input_params JSONB,
  stack_trace TEXT,
  recovery_action VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Analytics table - aggregated event statistics
CREATE TABLE IF NOT EXISTS photo_booth_analytics (
  id SERIAL PRIMARY KEY,
  event_id UUID REFERENCES photo_booth_events(event_id),
  date DATE NOT NULL,
  total_sessions INTEGER DEFAULT 0,
  completed_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  avg_generation_time_ms INTEGER,
  theme_distribution_json JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, date)
);

-- QR codes table - stores generated QR codes and share links
CREATE TABLE IF NOT EXISTS photo_booth_qr_codes (
  id SERIAL PRIMARY KEY,
  qr_id UUID DEFAULT gen_random_uuid() UNIQUE,
  session_id UUID REFERENCES photo_booth_sessions(session_id) ON DELETE CASCADE,
  image_id UUID REFERENCES photo_booth_images(image_id) ON DELETE CASCADE,
  qr_code_path TEXT,
  short_link VARCHAR(255),
  download_link TEXT,
  share_link TEXT,
  scan_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pb_sessions_event ON photo_booth_sessions(event_id);
CREATE INDEX IF NOT EXISTS idx_pb_sessions_status ON photo_booth_sessions(status);
CREATE INDEX IF NOT EXISTS idx_pb_sessions_created ON photo_booth_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_pb_images_session ON photo_booth_images(session_id);
CREATE INDEX IF NOT EXISTS idx_pb_images_type ON photo_booth_images(image_type);
CREATE INDEX IF NOT EXISTS idx_pb_errors_session ON photo_booth_errors(session_id);
CREATE INDEX IF NOT EXISTS idx_pb_errors_code ON photo_booth_errors(error_code);
CREATE INDEX IF NOT EXISTS idx_pb_analytics_event_date ON photo_booth_analytics(event_id, date);
CREATE INDEX IF NOT EXISTS idx_pb_qr_session ON photo_booth_qr_codes(session_id);

-- Status enum values: created, analyzing, generating, branding, completed, failed
-- Image type enum values: original, styled, branded
