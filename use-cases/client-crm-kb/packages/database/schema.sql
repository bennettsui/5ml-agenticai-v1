-- Client CRM + Knowledge Base System
-- PostgreSQL 16 Schema

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

CREATE TYPE client_status AS ENUM ('active', 'dormant', 'prospect', 'lost');
CREATE TYPE client_value_tier AS ENUM ('A', 'B', 'C', 'D');
CREATE TYPE contact_status AS ENUM ('active', 'inactive');
CREATE TYPE preferred_channel AS ENUM ('email', 'phone', 'chat', 'in_person');
CREATE TYPE contract_type AS ENUM ('retainer', 'project', 'license', 'other');
CREATE TYPE contract_status AS ENUM ('draft', 'active', 'expired', 'terminated');
CREATE TYPE opportunity_stage AS ENUM ('prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost');
CREATE TYPE risk_type AS ENUM ('payment_risk', 'scope_creep', 'unrealistic_expectations', 'political_sensitivity', 'resource_intensive');
CREATE TYPE severity_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE project_type AS ENUM ('website', 'social_campaign', 'rebrand', 'video_series', 'content_production', 'other');
CREATE TYPE project_status AS ENUM ('planning', 'in_progress', 'on_hold', 'completed', 'cancelled');
CREATE TYPE success_flag AS ENUM ('success', 'failure', 'neutral');
CREATE TYPE deliverable_type AS ENUM ('web_page', 'KV', 'video', 'social_post', 'report', 'other');
CREATE TYPE deliverable_status AS ENUM ('not_started', 'in_progress', 'review', 'completed');
CREATE TYPE team_role AS ENUM ('AE', 'PM', 'designer', 'developer', 'copywriter', 'strategist', 'other');
CREATE TYPE milestone_status AS ENUM ('upcoming', 'completed', 'delayed');
CREATE TYPE brand_status AS ENUM ('draft', 'active', 'archived');
CREATE TYPE taste_type AS ENUM ('campaign', 'KV', 'video', 'social_post', 'website', 'copy');
CREATE TYPE taste_category AS ENUM ('likes', 'dislikes');
CREATE TYPE feedback_source AS ENUM ('email', 'meeting_notes', 'form', 'chat', 'phone', 'other');
CREATE TYPE sentiment AS ENUM ('positive', 'neutral', 'negative');
CREATE TYPE feedback_severity AS ENUM ('info', 'minor', 'major', 'critical');
CREATE TYPE feedback_status AS ENUM ('new', 'reviewed', 'converted_to_rule', 'converted_to_pattern', 'ignored');
CREATE TYPE rule_type AS ENUM ('hard', 'soft');
CREATE TYPE rule_status AS ENUM ('active', 'deprecated');
CREATE TYPE pattern_scope AS ENUM ('global', 'segment', 'client');
CREATE TYPE pattern_category AS ENUM ('error_pattern', 'best_practice', 'playbook', 'standard');
CREATE TYPE user_role AS ENUM ('admin', 'account_director', 'AE', 'PM', 'designer', 'developer', 'finance', 'guest');
CREATE TYPE user_status AS ENUM ('active', 'inactive');

-- =============================================================================
-- SYSTEM TABLES
-- =============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(100),
    role user_role NOT NULL DEFAULT 'guest',
    status user_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- CRM CORE TABLES
-- =============================================================================

CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    legal_name VARCHAR(300) NOT NULL,
    industry TEXT[] NOT NULL DEFAULT '{}',
    region TEXT[] NOT NULL DEFAULT '{}',
    languages TEXT[] NOT NULL DEFAULT '{}',
    status client_status NOT NULL DEFAULT 'prospect',
    timezone VARCHAR(50) DEFAULT 'Asia/Hong_Kong',
    website_url TEXT,
    company_size VARCHAR(50),
    parent_company VARCHAR(200),
    internal_notes TEXT,
    client_value_tier client_value_tier,
    health_score INTEGER DEFAULT 100 CHECK (health_score >= 0 AND health_score <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    preferred_channel preferred_channel DEFAULT 'email',
    decision_power INTEGER DEFAULT 0 CHECK (decision_power >= 0 AND decision_power <= 3),
    is_primary BOOLEAN DEFAULT FALSE,
    status contact_status DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    type contract_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    value DECIMAL(15, 2),
    currency VARCHAR(3) DEFAULT 'HKD',
    status contract_status DEFAULT 'draft',
    document_ref TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    description TEXT,
    stage opportunity_stage NOT NULL DEFAULT 'prospecting',
    estimated_value DECIMAL(15, 2),
    currency VARCHAR(3) DEFAULT 'HKD',
    probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
    expected_close_date DATE,
    owner_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE client_risks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    risk_type risk_type NOT NULL,
    severity severity_level NOT NULL DEFAULT 'low',
    description TEXT NOT NULL,
    marked_by UUID REFERENCES users(id),
    marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE health_score_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    factors JSONB,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- PROJECT TABLES
-- =============================================================================

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    type project_type NOT NULL DEFAULT 'other',
    brief TEXT,
    brief_documents TEXT[] DEFAULT '{}',
    start_date DATE NOT NULL,
    end_date DATE,
    status project_status NOT NULL DEFAULT 'planning',
    success_flag success_flag,
    success_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE project_deliverables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    type deliverable_type NOT NULL DEFAULT 'other',
    description TEXT,
    due_date DATE,
    status deliverable_status NOT NULL DEFAULT 'not_started',
    file_refs TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE project_team (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    role team_role NOT NULL DEFAULT 'other',
    allocation INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

CREATE TABLE project_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    due_date DATE NOT NULL,
    status milestone_status NOT NULL DEFAULT 'upcoming',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- BRAND & TASTE TABLES
-- =============================================================================

CREATE TABLE brand_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
    brand_tone TEXT,
    brand_values TEXT[] DEFAULT '{}',
    key_messages TEXT[] DEFAULT '{}',
    do_list TEXT[] DEFAULT '{}',
    dont_list TEXT[] DEFAULT '{}',
    legal_sensitivities TEXT,
    visual_rules JSONB DEFAULT '{}',
    documents TEXT[] DEFAULT '{}',
    version INTEGER DEFAULT 1,
    status brand_status DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE taste_examples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    type taste_type NOT NULL,
    category taste_category NOT NULL,
    media_ref TEXT,
    description TEXT,
    why_client_likes_or_dislikes TEXT,
    tags TEXT[] DEFAULT '{}',
    -- embedding VECTOR(1536),  -- Uncomment when pgvector is available
    added_by UUID REFERENCES users(id),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- FEEDBACK & LEARNING TABLES
-- =============================================================================

CREATE TABLE feedback_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    source feedback_source NOT NULL DEFAULT 'other',
    date DATE NOT NULL,
    raw_text TEXT NOT NULL,
    attachments TEXT[] DEFAULT '{}',
    sentiment sentiment,
    sentiment_score INTEGER CHECK (sentiment_score >= 0 AND sentiment_score <= 100),
    topics TEXT[] DEFAULT '{}',
    severity feedback_severity DEFAULT 'info',
    extracted_requirements JSONB,
    status feedback_status NOT NULL DEFAULT 'new',
    processed_by UUID REFERENCES users(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    processing_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE client_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    origin_feedback_ids UUID[] DEFAULT '{}',
    description TEXT NOT NULL,
    rule_type rule_type NOT NULL DEFAULT 'soft',
    applies_to TEXT[] DEFAULT '{}',
    validation_type VARCHAR(50),
    validation_pattern TEXT,
    priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
    status rule_status NOT NULL DEFAULT 'active',
    deprecated_reason TEXT,
    deprecated_at TIMESTAMP WITH TIME ZONE,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scope pattern_scope NOT NULL DEFAULT 'client',
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    segment_tags TEXT[] DEFAULT '{}',
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category pattern_category NOT NULL DEFAULT 'best_practice',
    trigger_conditions TEXT,
    recommended_actions TEXT[] DEFAULT '{}',
    example_cases JSONB DEFAULT '[]',
    applicable_channels TEXT[] DEFAULT '{}',
    usage_count INTEGER DEFAULT 0,
    effectiveness_score DECIMAL(3, 2) DEFAULT 0.0 CHECK (effectiveness_score >= 0.0 AND effectiveness_score <= 1.0),
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- DEBUG ENUM TYPES
-- =============================================================================

CREATE TYPE debug_subject_type AS ENUM ('web_page', 'design', 'video', 'social_post', 'agent_workflow', 'document', 'other');
CREATE TYPE debug_session_status AS ENUM ('open', 'in_review', 'addressed', 'ignored', 'archived');
CREATE TYPE debug_overall_status AS ENUM ('pass', 'warning', 'fail');
CREATE TYPE issue_area AS ENUM ('WebPerf', 'WebQC', 'Design', 'Video', 'Social', 'Brand', 'Logic', 'AgentBehavior');
CREATE TYPE issue_severity AS ENUM ('critical', 'major', 'minor', 'info');
CREATE TYPE issue_priority AS ENUM ('P0', 'P1', 'P2', 'P3');
CREATE TYPE resolution_status AS ENUM ('open', 'in_progress', 'resolved', 'accepted_risk', 'wont_fix', 'duplicate');
CREATE TYPE business_impact AS ENUM ('high', 'medium', 'low', 'none');
CREATE TYPE trace_step_type AS ENUM ('llm_call', 'tool_call', 'decision', 'eval', 'api_call', 'other');

-- =============================================================================
-- DEBUG TABLES
-- =============================================================================

CREATE TABLE debug_module_definitions (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    applicable_subject_types TEXT[] DEFAULT '{}',
    version VARCHAR(20) DEFAULT '1.0',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE debug_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    subject_type debug_subject_type NOT NULL DEFAULT 'other',
    subject_ref TEXT,
    modules_invoked JSONB DEFAULT '[]',
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
    overall_status debug_overall_status,
    overall_summary TEXT,
    kb_entries_used JSONB DEFAULT '[]',
    status debug_session_status NOT NULL DEFAULT 'open',
    status_notes TEXT,
    initiated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    report_ref TEXT,
    trace_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE debug_issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    debug_session_id UUID NOT NULL REFERENCES debug_sessions(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    module VARCHAR(100) NOT NULL,
    area issue_area NOT NULL,
    severity issue_severity NOT NULL DEFAULT 'info',
    finding TEXT NOT NULL,
    evidence JSONB DEFAULT '{}',
    recommendation TEXT,
    priority issue_priority NOT NULL DEFAULT 'P2',
    related_rule_ids UUID[] DEFAULT '{}',
    related_pattern_ids UUID[] DEFAULT '{}',
    score_impact INTEGER DEFAULT 0,
    business_impact business_impact DEFAULT 'none',
    user_impact TEXT,
    resolution_status resolution_status NOT NULL DEFAULT 'open',
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE debug_trace_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    debug_session_id UUID NOT NULL REFERENCES debug_sessions(id) ON DELETE CASCADE,
    parent_step_id UUID REFERENCES debug_trace_steps(id) ON DELETE SET NULL,
    type trace_step_type NOT NULL DEFAULT 'other',
    name VARCHAR(200) NOT NULL,
    input_summary TEXT,
    output_summary TEXT,
    raw_input_ref TEXT,
    raw_output_ref TEXT,
    model VARCHAR(100),
    temperature DECIMAL(3, 2),
    token_usage JSONB,
    cost_estimate DECIMAL(10, 6),
    tool_name VARCHAR(100),
    tool_args JSONB,
    tool_result JSONB,
    error_flag BOOLEAN DEFAULT FALSE,
    error_type VARCHAR(100),
    error_message TEXT,
    latency_ms INTEGER,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed initial debug module definitions
INSERT INTO debug_module_definitions (id, name, description, applicable_subject_types, version) VALUES
('brand_guardian', 'Brand Guardian', 'Checks deliverables against client brand profile (tone, values, do/don''t list, visual rules)', ARRAY['web_page','design','video','social_post','document'], '1.0'),
('web_qc', 'Web Quality Check', 'Checks web pages for accessibility, SEO basics, broken elements, and responsive design', ARRAY['web_page'], '1.0'),
('social_best_practice', 'Social Best Practice', 'Checks social posts against platform-specific best practices (engagement, hashtags, formatting)', ARRAY['social_post'], '1.0'),
('design_accuracy', 'Design Accuracy', 'Checks design files against brand visual rules (colors, typography, logo usage)', ARRAY['design'], '1.0'),
('content_review', 'Content Review', 'Checks copy/documents for tone consistency, legal sensitivities, and message alignment', ARRAY['document','web_page'], '1.0'),
('seo_aiseo', 'SEO / AI SEO Audit', 'Comprehensive SEO audit inspired by Ahrefs: meta tags, headings, structured data, keyword density, internal linking, Core Web Vitals SEO signals, and AI-generated content optimization', ARRAY['web_page'], '1.0'),
('website_health', 'Website Health Check', 'Google PageSpeed-based health check: Core Web Vitals (LCP, FID, CLS), broken link detection, mobile-friendliness, HTTPS compliance, and latest Google standards', ARRAY['web_page'], '1.0');

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX idx_clients_status ON clients(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_clients_health_score ON clients(health_score);
CREATE INDEX idx_contacts_client_id ON contacts(client_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contracts_client_id ON contracts(client_id);
CREATE INDEX idx_opportunities_client_id ON opportunities(client_id);
CREATE INDEX idx_opportunities_stage ON opportunities(stage);
CREATE INDEX idx_client_risks_client_id ON client_risks(client_id);
CREATE INDEX idx_health_score_history_client_id ON health_score_history(client_id);
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_project_deliverables_project_id ON project_deliverables(project_id);
CREATE INDEX idx_project_team_project_id ON project_team(project_id);
CREATE INDEX idx_project_milestones_project_id ON project_milestones(project_id);
CREATE INDEX idx_brand_profiles_client_id ON brand_profiles(client_id);
CREATE INDEX idx_taste_examples_client_id ON taste_examples(client_id);
CREATE INDEX idx_feedback_client_id ON feedback_events(client_id);
CREATE INDEX idx_feedback_date ON feedback_events(date DESC);
CREATE INDEX idx_feedback_status ON feedback_events(status);
CREATE INDEX idx_feedback_project_id ON feedback_events(project_id);
CREATE INDEX idx_rules_client_id ON client_rules(client_id);
CREATE INDEX idx_rules_status ON client_rules(status);
CREATE INDEX idx_patterns_scope ON patterns(scope);
CREATE INDEX idx_patterns_client_id ON patterns(client_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- Debug indexes
CREATE INDEX idx_debug_sessions_client_id ON debug_sessions(client_id);
CREATE INDEX idx_debug_sessions_project_id ON debug_sessions(project_id);
CREATE INDEX idx_debug_sessions_status ON debug_sessions(status);
CREATE INDEX idx_debug_sessions_created_at ON debug_sessions(created_at DESC);
CREATE INDEX idx_debug_issues_session_id ON debug_issues(debug_session_id);
CREATE INDEX idx_debug_issues_client_id ON debug_issues(client_id);
CREATE INDEX idx_debug_issues_severity ON debug_issues(severity);
CREATE INDEX idx_debug_issues_resolution ON debug_issues(resolution_status);
CREATE INDEX idx_debug_trace_session_id ON debug_trace_steps(debug_session_id);
CREATE INDEX idx_debug_trace_parent ON debug_trace_steps(parent_step_id);
