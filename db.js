const { Pool } = require('pg');
const fs = require('fs');

// ===========================================
// SSL CONFIG
// ===========================================

// Load AWS RDS CA certificate if available (for EC2 deployments)
function loadRdsCaCert() {
  const rdsCaPaths = [
    process.env.PGSSLROOTCERT,
    process.env.DB_CA_CERT_PATH,
    '/usr/local/share/ca-certificates/rds-ca-bundle.crt',
  ];

  for (const path of rdsCaPaths) {
    if (path) {
      try {
        if (fs.existsSync(path)) {
          console.log(`✅ Loaded RDS CA certificate from: ${path}`);
          return fs.readFileSync(path, 'utf8');
        }
      } catch (error) {
        console.warn(`⚠️ Failed to read CA cert at ${path}:`, error.message);
      }
    }
  }
  return null;
}

const rdsCaCert = loadRdsCaCert();

// Simple database config
const getDatabaseConfig = () => {
  let connectionString = process.env.DATABASE_URL;

  const config = {
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 10,
  };

  // No SSL for localhost
  if (!connectionString || connectionString.includes('localhost') || connectionString.includes('127.0.0.1')) {
    console.log('🔓 Local database: SSL disabled');
    config.connectionString = connectionString;
    config.ssl = false;
    return config;
  }

  // AWS RDS: use CA certificate if available
  if (connectionString.includes('amazonaws.com') || connectionString.includes('rds.')) {
    config.connectionString = connectionString;
    if (rdsCaCert) {
      config.ssl = {
        rejectUnauthorized: true,
        ca: rdsCaCert,
      };
      console.log('🔒 AWS RDS: SSL enabled with CA verification');
    } else {
      config.ssl = {
        rejectUnauthorized: false,
      };
      console.log('⚠️ AWS RDS: SSL enabled but no CA cert (verification disabled)');
    }
    return config;
  }

  // Everything else (Fly, Neon, Supabase, Render, etc.):
  // Strip sslmode from connection string to prevent it from overriding our SSL config
  if (connectionString.includes('sslmode=')) {
    connectionString = connectionString
      .replace(/[?&]sslmode=[^&]*/g, '')
      .replace(/\?&/, '?')
      .replace(/\?$/, '');
    console.log('🔧 Stripped sslmode from DATABASE_URL to apply custom SSL config');
  }
  config.connectionString = connectionString;

  // Disable Node.js TLS certificate verification for self-signed certs
  // This is required for Fly.io Postgres and similar providers
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  config.ssl = {
    rejectUnauthorized: false,
    checkServerIdentity: () => undefined,
  };
  console.log('🔒 Database SSL: enabled (certificate verification disabled for Fly.io/cloud compatibility)');

  return config;
};

const pool = new Pool(getDatabaseConfig());

// 初始化數據庫表
async function initDatabase() {
  try {
    // Test connection first
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection established');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        project_id UUID UNIQUE DEFAULT gen_random_uuid(),
        client_name VARCHAR(255) NOT NULL,
        brief TEXT,
        title VARCHAR(255),
        purpose TEXT,
        deliverable TEXT,
        background TEXT,
        industry VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS analyses (
        id SERIAL PRIMARY KEY,
        project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
        agent_type VARCHAR(50),
        analysis_data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_project_client ON projects(client_name);
      CREATE INDEX IF NOT EXISTS idx_analysis_project ON analyses(project_id);
      CREATE INDEX IF NOT EXISTS idx_analysis_agent ON analyses(agent_type);
    `);

    // Migrate existing projects table to add new fields if they don't exist
    await pool.query(`
      ALTER TABLE projects
      ADD COLUMN IF NOT EXISTS title VARCHAR(255),
      ADD COLUMN IF NOT EXISTS purpose TEXT,
      ADD COLUMN IF NOT EXISTS deliverable TEXT,
      ADD COLUMN IF NOT EXISTS background TEXT;

      ALTER TABLE projects
      ALTER COLUMN brief DROP NOT NULL;

      CREATE TABLE IF NOT EXISTS sandbox_tests (
        id SERIAL PRIMARY KEY,
        test_id UUID UNIQUE DEFAULT gen_random_uuid(),
        agent_type VARCHAR(50) NOT NULL,
        client_name VARCHAR(255) NOT NULL,
        brief TEXT NOT NULL,
        results JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_sandbox_agent ON sandbox_tests(agent_type);
      CREATE INDEX IF NOT EXISTS idx_sandbox_created ON sandbox_tests(created_at DESC);

      CREATE TABLE IF NOT EXISTS brands (
        id SERIAL PRIMARY KEY,
        brand_id UUID UNIQUE DEFAULT gen_random_uuid(),
        brand_name VARCHAR(255) UNIQUE NOT NULL,
        normalized_name VARCHAR(255) NOT NULL,
        industry VARCHAR(255),
        brand_info JSONB DEFAULT '{}',
        last_analysis JSONB,
        agent_results JSONB DEFAULT '{}',
        usage_count INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_brands_normalized ON brands(normalized_name);
      CREATE INDEX IF NOT EXISTS idx_brands_name ON brands(brand_name);
      CREATE INDEX IF NOT EXISTS idx_brands_updated ON brands(updated_at DESC);

      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        conversation_id UUID UNIQUE DEFAULT gen_random_uuid(),
        brand_name VARCHAR(255) NOT NULL,
        agent_type VARCHAR(50) NOT NULL,
        initial_brief TEXT,
        messages JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_conversations_brand ON conversations(brand_name);
      CREATE INDEX IF NOT EXISTS idx_conversations_agent ON conversations(agent_type);
      CREATE INDEX IF NOT EXISTS idx_conversations_created ON conversations(created_at DESC);

      -- Topic Intelligence Tables
      CREATE TABLE IF NOT EXISTS intelligence_topics (
        id SERIAL PRIMARY KEY,
        topic_id UUID UNIQUE DEFAULT gen_random_uuid(),
        name VARCHAR(500) NOT NULL,
        objectives TEXT,
        keywords JSONB DEFAULT '[]',
        status VARCHAR(50) DEFAULT 'active',
        daily_scan_config JSONB DEFAULT '{"enabled": true, "time": "06:00", "timezone": "Asia/Hong_Kong"}',
        weekly_digest_config JSONB DEFAULT '{"enabled": true, "day": "monday", "time": "08:00", "timezone": "Asia/Hong_Kong", "recipientList": []}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Add objectives column if not exists (for existing databases)
      ALTER TABLE intelligence_topics ADD COLUMN IF NOT EXISTS objectives TEXT;

      CREATE TABLE IF NOT EXISTS intelligence_sources (
        id SERIAL PRIMARY KEY,
        source_id UUID UNIQUE DEFAULT gen_random_uuid(),
        topic_id UUID REFERENCES intelligence_topics(topic_id) ON DELETE CASCADE,
        name VARCHAR(500) NOT NULL,
        title TEXT,
        source_type VARCHAR(100),
        primary_url TEXT NOT NULL,
        secondary_urls JSONB DEFAULT '[]',
        content_types JSONB DEFAULT '[]',
        posting_frequency VARCHAR(50),
        focus_areas JSONB DEFAULT '[]',
        authority_score INTEGER DEFAULT 50,
        why_selected TEXT,
        freshness VARCHAR(100),
        priority VARCHAR(50) DEFAULT 'medium',
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS intelligence_news (
        id SERIAL PRIMARY KEY,
        news_id UUID UNIQUE DEFAULT gen_random_uuid(),
        topic_id UUID REFERENCES intelligence_topics(topic_id) ON DELETE CASCADE,
        source_id UUID REFERENCES intelligence_sources(source_id) ON DELETE SET NULL,
        title TEXT NOT NULL,
        url TEXT,
        summary TEXT,
        importance_score INTEGER,
        dimensions JSONB,
        published_at TIMESTAMP,
        scraped_at TIMESTAMP DEFAULT NOW(),
        status VARCHAR(50) DEFAULT 'new'
      );

      CREATE INDEX IF NOT EXISTS idx_topics_status ON intelligence_topics(status);
      CREATE INDEX IF NOT EXISTS idx_sources_topic ON intelligence_sources(topic_id);
      CREATE INDEX IF NOT EXISTS idx_news_topic ON intelligence_news(topic_id);
      CREATE INDEX IF NOT EXISTS idx_news_scraped ON intelligence_news(scraped_at DESC);

      -- Intelligence Summaries Table
      CREATE TABLE IF NOT EXISTS intelligence_summaries (
        id SERIAL PRIMARY KEY,
        summary_id UUID UNIQUE DEFAULT gen_random_uuid(),
        topic_id UUID REFERENCES intelligence_topics(topic_id) ON DELETE CASCADE,
        breaking_news JSONB DEFAULT '[]',
        practical_tips JSONB DEFAULT '[]',
        key_points JSONB DEFAULT '[]',
        overall_trend TEXT,
        model_used VARCHAR(100),
        input_tokens INTEGER,
        output_tokens INTEGER,
        estimated_cost DECIMAL(10, 8),
        articles_analyzed INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_summaries_topic ON intelligence_summaries(topic_id);
      CREATE INDEX IF NOT EXISTS idx_summaries_created ON intelligence_summaries(created_at DESC);

      -- Intelligence EDM (Email) History Table
      CREATE TABLE IF NOT EXISTS intelligence_edm_history (
        id SERIAL PRIMARY KEY,
        edm_id UUID UNIQUE DEFAULT gen_random_uuid(),
        topic_id UUID REFERENCES intelligence_topics(topic_id) ON DELETE CASCADE,
        subject VARCHAR(500),
        preview_text TEXT,
        html_content TEXT,
        recipients JSONB DEFAULT '[]',
        articles_included INTEGER,
        status VARCHAR(50) DEFAULT 'sent',
        resend_id VARCHAR(100),
        sent_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_edm_topic ON intelligence_edm_history(topic_id);
      CREATE INDEX IF NOT EXISTS idx_edm_sent ON intelligence_edm_history(sent_at DESC);

      -- ==========================================
      -- CRM Tables
      -- ==========================================
      CREATE TABLE IF NOT EXISTS crm_clients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(300) NOT NULL,
        legal_name VARCHAR(300),
        industry JSONB DEFAULT '[]',
        region JSONB DEFAULT '[]',
        status VARCHAR(50) DEFAULT 'prospect',
        website_url VARCHAR(500),
        company_size VARCHAR(50),
        client_value_tier VARCHAR(1),
        health_score INTEGER DEFAULT 50,
        internal_notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_crm_clients_status ON crm_clients(status);
      CREATE INDEX IF NOT EXISTS idx_crm_clients_name ON crm_clients(name);

      CREATE TABLE IF NOT EXISTS crm_projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID REFERENCES crm_clients(id) ON DELETE CASCADE,
        name VARCHAR(300) NOT NULL,
        type VARCHAR(50) DEFAULT 'other',
        brief TEXT,
        start_date DATE,
        end_date DATE,
        status VARCHAR(50) DEFAULT 'planning',
        success_flag VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_crm_projects_client ON crm_projects(client_id);
      CREATE INDEX IF NOT EXISTS idx_crm_projects_status ON crm_projects(status);

      CREATE TABLE IF NOT EXISTS crm_feedback (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID REFERENCES crm_clients(id) ON DELETE CASCADE,
        project_id UUID REFERENCES crm_projects(id) ON DELETE SET NULL,
        source VARCHAR(50) DEFAULT 'other',
        date DATE DEFAULT CURRENT_DATE,
        raw_text TEXT NOT NULL,
        sentiment VARCHAR(20),
        sentiment_score INTEGER,
        topics JSONB DEFAULT '[]',
        severity VARCHAR(20),
        status VARCHAR(50) DEFAULT 'new',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_crm_feedback_client ON crm_feedback(client_id);
      CREATE INDEX IF NOT EXISTS idx_crm_feedback_sentiment ON crm_feedback(sentiment);

      CREATE TABLE IF NOT EXISTS crm_gmail_tokens (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE,
        access_token TEXT,
        refresh_token TEXT,
        token_expiry TIMESTAMP,
        last_sync_at TIMESTAMP,
        total_synced INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- ==========================================
      -- Ziwei Astrology Tables (中州派紫微斗數)
      -- ==========================================
      CREATE TABLE IF NOT EXISTS ziwei_interpretation_rules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        version INTEGER DEFAULT 1,
        scope VARCHAR(50) NOT NULL,
        condition JSONB NOT NULL,
        interpretation JSONB NOT NULL,
        dimension_tags JSONB DEFAULT '[]',
        school VARCHAR(50) DEFAULT 'zhongzhou',
        consensus_label VARCHAR(20) DEFAULT 'consensus',
        source_refs JSONB DEFAULT '[]',
        statistics JSONB DEFAULT '{"sample_size": 0, "match_rate": 0.5, "confidence_level": 0}',
        notes TEXT,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_ziwei_rules_scope ON ziwei_interpretation_rules(scope);
      CREATE INDEX IF NOT EXISTS idx_ziwei_rules_consensus ON ziwei_interpretation_rules(consensus_label);
      CREATE INDEX IF NOT EXISTS idx_ziwei_rules_status ON ziwei_interpretation_rules(status);
      CREATE INDEX IF NOT EXISTS idx_ziwei_rules_school ON ziwei_interpretation_rules(school);

      CREATE TABLE IF NOT EXISTS ziwei_birth_charts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255),
        name VARCHAR(255),
        birth_info JSONB NOT NULL,
        gan_zhi JSONB NOT NULL,
        base_chart JSONB NOT NULL,
        xuan_patterns JSONB DEFAULT '{}',
        decade_luck JSONB DEFAULT '[]',
        annual_luck JSONB DEFAULT '[]',
        monthly_luck JSONB DEFAULT '[]',
        daily_luck JSONB DEFAULT '[]',
        interpretations JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_ziwei_charts_user ON ziwei_birth_charts(user_id);
      CREATE INDEX IF NOT EXISTS idx_ziwei_charts_created ON ziwei_birth_charts(created_at DESC);

      CREATE TABLE IF NOT EXISTS ziwei_rule_feedback (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        chart_id UUID REFERENCES ziwei_birth_charts(id) ON DELETE SET NULL,
        rule_id UUID REFERENCES ziwei_interpretation_rules(id) ON DELETE CASCADE,
        user_rating INTEGER,
        outcome_status VARCHAR(50),
        accuracy_flag VARCHAR(50),
        user_notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_ziwei_feedback_chart ON ziwei_rule_feedback(chart_id);
      CREATE INDEX IF NOT EXISTS idx_ziwei_feedback_rule ON ziwei_rule_feedback(rule_id);
      CREATE INDEX IF NOT EXISTS idx_ziwei_feedback_created ON ziwei_rule_feedback(created_at DESC);

      CREATE TABLE IF NOT EXISTS ziwei_rule_statistics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        rule_id UUID UNIQUE REFERENCES ziwei_interpretation_rules(id) ON DELETE CASCADE,
        sample_size INTEGER DEFAULT 0,
        match_count INTEGER DEFAULT 0,
        mismatch_count INTEGER DEFAULT 0,
        match_rate DECIMAL(5, 4) DEFAULT 0.5,
        confidence_level DECIMAL(5, 4) DEFAULT 0,
        last_updated TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_ziwei_stats_match_rate ON ziwei_rule_statistics(match_rate DESC);

      -- ==========================================
      -- Ziwei DeepSeek Enhancement Tables (Steps 4-6)
      -- ==========================================

      CREATE TABLE IF NOT EXISTS ziwei_enhanced_interpretations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        chart_id UUID NOT NULL REFERENCES ziwei_birth_charts(id) ON DELETE CASCADE,
        rule_interpretation_id UUID,
        llm_enhancement JSONB NOT NULL,
        confidence_boost DECIMAL(5, 4),
        synthesis_summary TEXT,
        model_used VARCHAR(50) DEFAULT 'deepseek-reasoner',
        tokens_input INTEGER,
        tokens_output INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_ziwei_enhanced_chart ON ziwei_enhanced_interpretations(chart_id);

      CREATE TABLE IF NOT EXISTS ziwei_conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        chart_id UUID NOT NULL REFERENCES ziwei_birth_charts(id) ON DELETE CASCADE,
        user_id VARCHAR(255),
        title VARCHAR(255),
        summary TEXT,
        message_count INTEGER DEFAULT 0,
        last_message_at TIMESTAMP,
        system_prompt TEXT,
        model_used VARCHAR(50) DEFAULT 'deepseek-chat',
        tokens_used INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_ziwei_conv_chart ON ziwei_conversations(chart_id);
      CREATE INDEX IF NOT EXISTS idx_ziwei_conv_user ON ziwei_conversations(user_id);
      CREATE INDEX IF NOT EXISTS idx_ziwei_conv_updated ON ziwei_conversations(updated_at DESC);

      CREATE TABLE IF NOT EXISTS ziwei_conversation_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL REFERENCES ziwei_conversations(id) ON DELETE CASCADE,
        role VARCHAR(20),
        content TEXT NOT NULL,
        tokens_used INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_ziwei_msg_conv ON ziwei_conversation_messages(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_ziwei_msg_created ON ziwei_conversation_messages(created_at);

      CREATE TABLE IF NOT EXISTS ziwei_compatibility_analyses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        chart1_id UUID NOT NULL REFERENCES ziwei_birth_charts(id) ON DELETE CASCADE,
        chart2_id UUID NOT NULL REFERENCES ziwei_birth_charts(id) ON DELETE CASCADE,
        relationship_type VARCHAR(50),
        compatibility_score DECIMAL(5, 4),
        harmonious_elements JSONB,
        conflicting_elements JSONB,
        full_report TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_ziwei_compat_chart1 ON ziwei_compatibility_analyses(chart1_id);
      CREATE INDEX IF NOT EXISTS idx_ziwei_compat_chart2 ON ziwei_compatibility_analyses(chart2_id);

      CREATE TABLE IF NOT EXISTS ziwei_insights (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        chart_id UUID NOT NULL REFERENCES ziwei_birth_charts(id) ON DELETE CASCADE,
        life_stage VARCHAR(50),
        analysis_depth VARCHAR(20),
        life_guidance TEXT,
        decade_analysis JSONB,
        recommendations JSONB,
        warnings JSONB,
        model_used VARCHAR(50) DEFAULT 'deepseek-reasoner',
        tokens_used INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_ziwei_insights_chart ON ziwei_insights(chart_id);

      ALTER TABLE ziwei_birth_charts
      ADD COLUMN IF NOT EXISTS enhanced_interpretations JSONB,
      ADD COLUMN IF NOT EXISTS llm_enhancements JSONB,
      ADD COLUMN IF NOT EXISTS conversation_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS last_chat_at TIMESTAMP;

      CREATE TABLE IF NOT EXISTS social_states (
        id SERIAL PRIMARY KEY,
        task_id VARCHAR(255) UNIQUE NOT NULL,
        brand_id VARCHAR(255),
        project_id VARCHAR(255),
        state JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_social_states_task ON social_states(task_id);
      CREATE INDEX IF NOT EXISTS idx_social_states_brand ON social_states(brand_id);
      CREATE INDEX IF NOT EXISTS idx_social_states_project ON social_states(project_id);

      CREATE TABLE IF NOT EXISTS social_campaigns (
        id SERIAL PRIMARY KEY,
        task_id VARCHAR(255) UNIQUE NOT NULL REFERENCES social_states(task_id) ON DELETE CASCADE,
        brand_id VARCHAR(255),
        project_id VARCHAR(255),
        brief_title VARCHAR(500),
        status VARCHAR(50) DEFAULT 'DRAFT',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_social_campaigns_task ON social_campaigns(task_id);
      CREATE INDEX IF NOT EXISTS idx_social_campaigns_brand ON social_campaigns(brand_id);

      CREATE TABLE IF NOT EXISTS social_artefacts (
        id SERIAL PRIMARY KEY,
        task_id VARCHAR(255) NOT NULL REFERENCES social_campaigns(task_id) ON DELETE CASCADE,
        artefact_key VARCHAR(255) NOT NULL,
        artefact_type VARCHAR(50),
        markdown_content TEXT,
        json_structure JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(task_id, artefact_key)
      );

      CREATE INDEX IF NOT EXISTS idx_social_artefacts_task ON social_artefacts(task_id);
      CREATE INDEX IF NOT EXISTS idx_social_artefacts_key ON social_artefacts(artefact_key);

      CREATE TABLE IF NOT EXISTS social_content_posts (
        id SERIAL PRIMARY KEY,
        task_id VARCHAR(255) NOT NULL REFERENCES social_campaigns(task_id) ON DELETE CASCADE,
        post_date DATE,
        platform VARCHAR(50),
        format VARCHAR(50),
        title VARCHAR(500),
        pillar VARCHAR(100),
        objective VARCHAR(255),
        key_message TEXT,
        copy_hook TEXT,
        cta TEXT,
        language VARCHAR(20),
        visual_type VARCHAR(100),
        status VARCHAR(50) DEFAULT 'Draft',
        ad_plan VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_social_posts_task ON social_content_posts(task_id);
      CREATE INDEX IF NOT EXISTS idx_social_posts_date ON social_content_posts(post_date);
      CREATE INDEX IF NOT EXISTS idx_social_posts_platform ON social_content_posts(platform);

      CREATE TABLE IF NOT EXISTS social_ad_campaigns (
        id SERIAL PRIMARY KEY,
        task_id VARCHAR(255) NOT NULL REFERENCES social_campaigns(task_id) ON DELETE CASCADE,
        campaign_name VARCHAR(500) NOT NULL,
        objective VARCHAR(100),
        funnel_stage VARCHAR(100),
        platform VARCHAR(100),
        budget_hkd NUMERIC(12,2),
        budget_pct NUMERIC(5,2),
        audience_definition TEXT,
        geo VARCHAR(100),
        placements TEXT,
        status VARCHAR(50) DEFAULT 'Draft',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_social_ads_task ON social_ad_campaigns(task_id);
      CREATE INDEX IF NOT EXISTS idx_social_ads_platform ON social_ad_campaigns(platform);

      CREATE TABLE IF NOT EXISTS social_kpi_definitions (
        id SERIAL PRIMARY KEY,
        task_id VARCHAR(255) NOT NULL REFERENCES social_campaigns(task_id) ON DELETE CASCADE,
        kpi_name VARCHAR(255) NOT NULL,
        kpi_type VARCHAR(50),
        definition TEXT,
        formula TEXT,
        data_source VARCHAR(255),
        reporting_frequency VARCHAR(50),
        funnel_stage VARCHAR(100),
        platform VARCHAR(100),
        target_value VARCHAR(100),
        target_direction VARCHAR(50),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_social_kpis_task ON social_kpi_definitions(task_id);
      CREATE INDEX IF NOT EXISTS idx_social_kpis_name ON social_kpi_definitions(kpi_name);

      -- Content Development: Draft pool for posts not yet in calendar
      CREATE TABLE IF NOT EXISTS social_content_drafts (
        id SERIAL PRIMARY KEY,
        draft_id UUID UNIQUE DEFAULT gen_random_uuid(),
        task_id VARCHAR(255) NOT NULL REFERENCES social_campaigns(task_id) ON DELETE CASCADE,
        post_id VARCHAR(255),
        platform VARCHAR(50),
        format VARCHAR(50),
        title VARCHAR(500),
        pillar VARCHAR(100),
        objective VARCHAR(255),
        key_message TEXT,
        copy_hook TEXT,
        cta TEXT,
        language VARCHAR(20),
        visual_type VARCHAR(100),
        caption TEXT,
        hashtags JSONB DEFAULT '[]',
        status VARCHAR(50) DEFAULT 'draft',
        synced_to_calendar BOOLEAN DEFAULT FALSE,
        calendar_post_id INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_social_drafts_task ON social_content_drafts(task_id);
      CREATE INDEX IF NOT EXISTS idx_social_drafts_status ON social_content_drafts(status);
      CREATE INDEX IF NOT EXISTS idx_social_drafts_synced ON social_content_drafts(synced_to_calendar);

      -- Brand Portfolio: Products and Services with status tracking
      CREATE TABLE IF NOT EXISTS brand_products_services (
        id SERIAL PRIMARY KEY,
        product_service_id UUID UNIQUE DEFAULT gen_random_uuid(),
        brand_id UUID NOT NULL,
        name VARCHAR(500) NOT NULL,
        category VARCHAR(100),
        description TEXT,
        type VARCHAR(50),
        status VARCHAR(50) DEFAULT 'active',
        launch_date DATE,
        discontinue_date DATE,
        portfolio_order INTEGER,
        image_url TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT fk_brand_id FOREIGN KEY(brand_id) REFERENCES brands(brand_id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_products_brand ON brand_products_services(brand_id);
      CREATE INDEX IF NOT EXISTS idx_products_status ON brand_products_services(status);
      CREATE INDEX IF NOT EXISTS idx_products_type ON brand_products_services(type);
      CREATE INDEX IF NOT EXISTS idx_products_created ON brand_products_services(created_at DESC);

      -- Research Data: Brand & Competitive Research
      CREATE TABLE IF NOT EXISTS research_business (
        id SERIAL PRIMARY KEY,
        research_id UUID UNIQUE DEFAULT gen_random_uuid(),
        brand_id UUID NOT NULL,
        business_overview TEXT,
        mission_vision_values TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT fk_brand_id FOREIGN KEY(brand_id) REFERENCES brands(brand_id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_research_business_brand ON research_business(brand_id);

      -- Research: Competitor Analysis
      CREATE TABLE IF NOT EXISTS research_competitors (
        id SERIAL PRIMARY KEY,
        competitor_id UUID UNIQUE DEFAULT gen_random_uuid(),
        brand_id UUID NOT NULL,
        name VARCHAR(500) NOT NULL,
        website VARCHAR(500),
        strengths TEXT,
        weaknesses TEXT,
        social_presence TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT fk_brand_id FOREIGN KEY(brand_id) REFERENCES brands(brand_id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_competitors_brand ON research_competitors(brand_id);

      -- Research: Audience Analysis
      CREATE TABLE IF NOT EXISTS research_audience (
        id SERIAL PRIMARY KEY,
        audience_id UUID UNIQUE DEFAULT gen_random_uuid(),
        brand_id UUID NOT NULL,
        positioning_statement TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT fk_brand_id FOREIGN KEY(brand_id) REFERENCES brands(brand_id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_audience_brand ON research_audience(brand_id);

      -- Research: Audience Segments
      CREATE TABLE IF NOT EXISTS research_audience_segments (
        id SERIAL PRIMARY KEY,
        segment_id UUID UNIQUE DEFAULT gen_random_uuid(),
        audience_id UUID NOT NULL,
        name VARCHAR(500) NOT NULL,
        demographics TEXT,
        psychographics TEXT,
        pain_points TEXT,
        channels TEXT,
        size VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT fk_audience_id FOREIGN KEY(audience_id) REFERENCES research_audience(audience_id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_segments_audience ON research_audience_segments(audience_id);

      -- Research: Products & Services
      CREATE TABLE IF NOT EXISTS research_products (
        id SERIAL PRIMARY KEY,
        product_id UUID UNIQUE DEFAULT gen_random_uuid(),
        brand_id UUID NOT NULL,
        name VARCHAR(500) NOT NULL,
        category VARCHAR(255),
        description TEXT,
        key_features TEXT,
        price_range VARCHAR(255),
        target_segment VARCHAR(500),
        usp TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT fk_brand_id FOREIGN KEY(brand_id) REFERENCES brands(brand_id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_research_products_brand ON research_products(brand_id);
    `);

    console.log('✅ Database schema initialized (including CRM tables)');

    // Seed Ziwei interpretation rules
    await seedZiweiRules();
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    console.error('Database URL configured:', process.env.DATABASE_URL ? 'Yes' : 'No');
    // Don't throw - allow app to start even if DB init fails
  }
}

// 保存 project
async function saveProject(client_name, briefOrProjectData, industry = null) {
  try {
    // Support both old format (string) and new format (object)
    if (typeof briefOrProjectData === 'string') {
      // Old format: just a brief string
      const result = await pool.query(
        'INSERT INTO projects (client_name, brief, industry) VALUES ($1, $2, $3) RETURNING project_id',
        [client_name, briefOrProjectData, industry]
      );
      return result.rows[0].project_id;
    } else {
      // New format: object with title, purpose, deliverable, background
      const { title, purpose, deliverable, background, brief } = briefOrProjectData;
      const result = await pool.query(
        'INSERT INTO projects (client_name, title, purpose, deliverable, background, brief, industry) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING project_id',
        [client_name, title, purpose, deliverable, background, brief, industry]
      );
      return result.rows[0].project_id;
    }
  } catch (error) {
    console.error('Error saving project:', error);
    throw error;
  }
}

// 保存 analysis
async function saveAnalysis(project_id, agent_type, analysis_data) {
  try {
    const result = await pool.query(
      'INSERT INTO analyses (project_id, agent_type, analysis_data) VALUES ($1, $2, $3) RETURNING id',
      [project_id, agent_type, JSON.stringify(analysis_data)]
    );
    return result.rows[0].id;
  } catch (error) {
    console.error('Error saving analysis:', error);
    throw error;
  }
}

// 查詢 project 的所有分析
async function getProjectAnalyses(project_id) {
  try {
    const result = await pool.query(
      'SELECT * FROM analyses WHERE project_id = $1 ORDER BY created_at DESC',
      [project_id]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching analyses:', error);
    throw error;
  }
}

// 查詢所有 projects
async function getAllProjects(limit = 10) {
  try {
    const result = await pool.query(
      `SELECT
        p.*,
        COUNT(a.id) as analysis_count
      FROM projects p
      LEFT JOIN analyses a ON p.project_id = a.project_id
      GROUP BY p.id, p.project_id, p.client_name, p.brief, p.industry, p.created_at
      ORDER BY p.created_at DESC
      LIMIT $1`,
      [limit]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
}

// 獲取分析統計數據
async function getAnalytics() {
  try {
    // Total counts
    const totalProjects = await pool.query('SELECT COUNT(*) as count FROM projects');
    const totalAnalyses = await pool.query('SELECT COUNT(*) as count FROM analyses');

    // Agent distribution
    const agentDistribution = await pool.query(`
      SELECT agent_type, COUNT(*) as count
      FROM analyses
      GROUP BY agent_type
      ORDER BY count DESC
    `);

    // Recent activity (last 7 days)
    const recentActivity = await pool.query(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as count
      FROM analyses
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // Model usage (extracted from analysis_data JSONB)
    const modelUsage = await pool.query(`
      SELECT
        analysis_data->'_meta'->>'model' as model,
        COUNT(*) as count
      FROM analyses
      WHERE analysis_data->'_meta'->>'model' IS NOT NULL
      GROUP BY analysis_data->'_meta'->>'model'
      ORDER BY count DESC
    `);

    // Token usage statistics
    const tokenStats = await pool.query(`
      SELECT
        COALESCE(SUM((analysis_data->'_meta'->'usage'->>'input_tokens')::int), 0) as total_input_tokens,
        COALESCE(SUM((analysis_data->'_meta'->'usage'->>'output_tokens')::int), 0) as total_output_tokens
      FROM analyses
      WHERE analysis_data->'_meta'->'usage' IS NOT NULL
    `);

    return {
      totalProjects: parseInt(totalProjects.rows[0].count),
      totalAnalyses: parseInt(totalAnalyses.rows[0].count),
      agentDistribution: agentDistribution.rows,
      recentActivity: recentActivity.rows,
      modelUsage: modelUsage.rows,
      tokenStats: tokenStats.rows[0],
    };
  } catch (error) {
    console.error('Error fetching analytics:', error);
    throw error;
  }
}

// 獲取 Agent 性能統計
async function getAgentPerformance() {
  try {
    const result = await pool.query(`
      SELECT
        agent_type,
        COUNT(*) as total_requests,
        AVG(
          CASE
            WHEN analysis_data->'_meta' IS NOT NULL
            THEN 2.5
            ELSE 3.0
          END
        ) as avg_response_time,
        COUNT(CASE WHEN analysis_data IS NOT NULL THEN 1 END)::float / COUNT(*)::float * 100 as success_rate
      FROM analyses
      WHERE agent_type IS NOT NULL
      GROUP BY agent_type
      ORDER BY total_requests DESC
    `);

    return result.rows;
  } catch (error) {
    console.error('Error fetching agent performance:', error);
    throw error;
  }
}

// Sandbox test history functions
async function saveSandboxTest(agent_type, client_name, brief, results) {
  try {
    const result = await pool.query(
      'INSERT INTO sandbox_tests (agent_type, client_name, brief, results) VALUES ($1, $2, $3, $4) RETURNING test_id, created_at',
      [agent_type, client_name, brief, JSON.stringify(results)]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error saving sandbox test:', error);
    throw error;
  }
}

async function getSandboxTests(limit = 50) {
  try {
    const result = await pool.query(
      'SELECT test_id, agent_type, client_name, brief, results, created_at FROM sandbox_tests ORDER BY created_at DESC LIMIT $1',
      [limit]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching sandbox tests:', error);
    throw error;
  }
}

async function deleteSandboxTest(test_id) {
  try {
    await pool.query('DELETE FROM sandbox_tests WHERE test_id = $1', [test_id]);
  } catch (error) {
    console.error('Error deleting sandbox test:', error);
    throw error;
  }
}

async function clearSandboxTests() {
  try {
    await pool.query('DELETE FROM sandbox_tests');
  } catch (error) {
    console.error('Error clearing sandbox tests:', error);
    throw error;
  }
}

// Brand database functions
function normalizeBrandName(brandName) {
  return brandName.toLowerCase().trim().replace(/\s+/g, ' ');
}

async function saveBrand(brand_name, industry = null, brand_info = {}) {
  try {
    const normalized_name = normalizeBrandName(brand_name);

    // Check if brand already exists (by normalized name)
    const existing = await pool.query(
      'SELECT * FROM brands WHERE normalized_name = $1',
      [normalized_name]
    );

    if (existing.rows.length > 0) {
      // Update existing brand
      const result = await pool.query(
        `UPDATE brands
         SET brand_name = $1,
             industry = COALESCE($2, industry),
             brand_info = COALESCE($3, brand_info),
             usage_count = usage_count + 1,
             updated_at = NOW()
         WHERE normalized_name = $4
         RETURNING *`,
        [brand_name, industry, JSON.stringify(brand_info), normalized_name]
      );
      return result.rows[0];
    } else {
      // Create new brand
      const result = await pool.query(
        `INSERT INTO brands (brand_name, normalized_name, industry, brand_info)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [brand_name, normalized_name, industry, JSON.stringify(brand_info)]
      );
      return result.rows[0];
    }
  } catch (error) {
    console.error('Error saving brand:', error);
    throw error;
  }
}

async function getBrandByName(brand_name) {
  try {
    const normalized_name = normalizeBrandName(brand_name);
    const result = await pool.query(
      'SELECT * FROM brands WHERE normalized_name = $1',
      [normalized_name]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching brand:', error);
    throw error;
  }
}

async function searchBrands(query, limit = 10) {
  try {
    const searchTerm = `%${normalizeBrandName(query)}%`;
    const result = await pool.query(
      `SELECT brand_id, brand_name, industry, usage_count, updated_at
       FROM brands
       WHERE normalized_name LIKE $1
       ORDER BY usage_count DESC, updated_at DESC
       LIMIT $2`,
      [searchTerm, limit]
    );
    return result.rows;
  } catch (error) {
    console.error('Error searching brands:', error);
    throw error;
  }
}

async function updateBrandResults(brand_name, agent_type, results) {
  try {
    const normalized_name = normalizeBrandName(brand_name);

    // Get current agent_results
    const brand = await pool.query(
      'SELECT agent_results FROM brands WHERE normalized_name = $1',
      [normalized_name]
    );

    if (brand.rows.length === 0) {
      throw new Error(`Brand not found: ${brand_name}`);
    }

    const agentResults = brand.rows[0].agent_results || {};
    agentResults[agent_type] = results;

    // Update brand with new results
    const result = await pool.query(
      `UPDATE brands
       SET agent_results = $1,
           last_analysis = $2,
           updated_at = NOW()
       WHERE normalized_name = $3
       RETURNING *`,
      [JSON.stringify(agentResults), JSON.stringify(results), normalized_name]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error updating brand results:', error);
    throw error;
  }
}

async function getAllBrands(limit = 50) {
  try {
    const result = await pool.query(
      `SELECT brand_id, brand_name, industry, usage_count, updated_at, created_at
       FROM brands
       ORDER BY updated_at DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching brands:', error);
    throw error;
  }
}

async function getBrandWithResults(brand_name) {
  try {
    const normalized_name = normalizeBrandName(brand_name);
    const result = await pool.query(
      'SELECT * FROM brands WHERE normalized_name = $1',
      [normalized_name]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching brand with results:', error);
    throw error;
  }
}

// Conversation history functions
async function saveConversation(brand_name, agent_type, initial_brief, messages) {
  try {
    const result = await pool.query(
      `INSERT INTO conversations (brand_name, agent_type, initial_brief, messages, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING conversation_id, created_at`,
      [brand_name, agent_type, initial_brief, JSON.stringify(messages)]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error saving conversation:', error);
    throw error;
  }
}

async function updateConversation(conversation_id, messages) {
  try {
    const result = await pool.query(
      `UPDATE conversations
       SET messages = $1, updated_at = NOW()
       WHERE conversation_id = $2
       RETURNING *`,
      [JSON.stringify(messages), conversation_id]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error updating conversation:', error);
    throw error;
  }
}

async function getConversationsByBrand(brand_name, limit = 20) {
  try {
    const result = await pool.query(
      `SELECT conversation_id, agent_type, initial_brief, messages, created_at, updated_at
       FROM conversations
       WHERE brand_name = $1
       ORDER BY updated_at DESC
       LIMIT $2`,
      [brand_name, limit]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
}

async function getConversation(conversation_id) {
  try {
    const result = await pool.query(
      'SELECT * FROM conversations WHERE conversation_id = $1',
      [conversation_id]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching conversation:', error);
    throw error;
  }
}

async function deleteConversation(conversation_id) {
  try {
    await pool.query('DELETE FROM conversations WHERE conversation_id = $1', [conversation_id]);
  } catch (error) {
    console.error('Error deleting conversation:', error);
    throw error;
  }
}

async function deleteBrand(brand_name) {
  try {
    // Delete all conversations for this brand first
    await pool.query('DELETE FROM conversations WHERE brand_name = $1', [brand_name]);

    // Delete the brand
    await pool.query('DELETE FROM brands WHERE brand_name = $1', [brand_name]);
  } catch (error) {
    console.error('Error deleting brand:', error);
    throw error;
  }
}

async function deleteProject(brand_name, initial_brief) {
  try {
    // Delete all conversations for this specific project (brand + brief)
    await pool.query(
      'DELETE FROM conversations WHERE brand_name = $1 AND initial_brief = $2',
      [brand_name, initial_brief]
    );
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
}

async function getProjectsByBrand(brand_name) {
  try {
    // Get all unique briefs for the brand with aggregated data
    const result = await pool.query(
      `SELECT
        initial_brief as brief,
        COUNT(*) as conversation_count,
        MAX(updated_at) as last_updated,
        MIN(created_at) as created_at,
        json_agg(
          json_build_object(
            'conversation_id', conversation_id,
            'agent_type', agent_type,
            'created_at', created_at,
            'updated_at', updated_at,
            'message_count', jsonb_array_length(messages)
          ) ORDER BY updated_at DESC
        ) as conversations
       FROM conversations
       WHERE brand_name = $1
       GROUP BY initial_brief
       ORDER BY last_updated DESC`,
      [brand_name]
    );

    // Parse brief to extract title, purpose, deliverable, background
    const projects = result.rows.map(row => {
      const brief = row.brief || '';
      const parsed = {
        title: null,
        purpose: null,
        deliverable: null,
        background: null,
      };

      // Extract fields from formatted brief
      const titleMatch = brief.match(/Title:\s*([^\n]+)/);
      const purposeMatch = brief.match(/Purpose:\s*([^\n]+)/);
      const deliverableMatch = brief.match(/Deliverable:\s*([^\n]+)/);
      const backgroundMatch = brief.match(/Background:\s*([^\n]+)/);

      if (titleMatch) parsed.title = titleMatch[1].trim();
      if (purposeMatch) parsed.purpose = purposeMatch[1].trim();
      if (deliverableMatch) parsed.deliverable = deliverableMatch[1].trim();
      if (backgroundMatch) parsed.background = backgroundMatch[1].trim();

      return {
        ...row,
        ...parsed,
      };
    });

    return projects;
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
}

async function getConversationsByBrandAndBrief(brand_name, initial_brief, limit = 20) {
  try {
    const result = await pool.query(
      `SELECT conversation_id, agent_type, initial_brief, messages, created_at, updated_at
       FROM conversations
       WHERE brand_name = $1 AND initial_brief = $2
       ORDER BY updated_at DESC
       LIMIT $3`,
      [brand_name, initial_brief, limit]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching conversations by brand and brief:', error);
    throw error;
  }
}

// Generic query function for direct database access
async function query(text, params) {
  return pool.query(text, params);
}

// ==========================================
// Topic Intelligence Functions
// ==========================================

async function saveIntelligenceTopic(name, keywords = [], config = {}) {
  try {
    const objectives = config.objectives || '';
    const dailyScanConfig = config.dailyScanConfig || {
      enabled: true,
      time: '06:00',
      timezone: 'Asia/Hong_Kong'
    };
    const weeklyDigestConfig = config.weeklyDigestConfig || {
      enabled: true,
      day: 'monday',
      time: '08:00',
      timezone: 'Asia/Hong_Kong',
      recipientList: []
    };

    const result = await pool.query(
      `INSERT INTO intelligence_topics (name, objectives, keywords, daily_scan_config, weekly_digest_config)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING topic_id, name, objectives, keywords, status, daily_scan_config, weekly_digest_config, created_at`,
      [name, objectives, JSON.stringify(keywords), JSON.stringify(dailyScanConfig), JSON.stringify(weeklyDigestConfig)]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error saving intelligence topic:', error);
    throw error;
  }
}

async function getIntelligenceTopics() {
  try {
    const result = await pool.query(
      `SELECT topic_id, name, objectives, keywords, status, daily_scan_config, weekly_digest_config, created_at, updated_at
       FROM intelligence_topics
       ORDER BY created_at DESC`
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching intelligence topics:', error);
    throw error;
  }
}

async function getIntelligenceTopic(topicId) {
  try {
    const result = await pool.query(
      `SELECT t.topic_id, t.name, t.objectives, t.keywords, t.status, t.daily_scan_config, t.weekly_digest_config, t.created_at, t.updated_at,
              COALESCE(json_agg(s.*) FILTER (WHERE s.source_id IS NOT NULL), '[]') as sources
       FROM intelligence_topics t
       LEFT JOIN intelligence_sources s ON t.topic_id = s.topic_id
       WHERE t.topic_id = $1
       GROUP BY t.id`,
      [topicId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching intelligence topic:', error);
    throw error;
  }
}

async function updateIntelligenceTopicStatus(topicId, status) {
  try {
    const result = await pool.query(
      `UPDATE intelligence_topics SET status = $2, updated_at = NOW() WHERE topic_id = $1 RETURNING *`,
      [topicId, status]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error updating topic status:', error);
    throw error;
  }
}

async function updateIntelligenceTopic(topicId, updates) {
  try {
    const { name, objectives, keywords, daily_scan_config, weekly_digest_config } = updates;

    const result = await pool.query(
      `UPDATE intelligence_topics
       SET name = COALESCE($2, name),
           objectives = COALESCE($3, objectives),
           keywords = COALESCE($4, keywords),
           daily_scan_config = COALESCE($5, daily_scan_config),
           weekly_digest_config = COALESCE($6, weekly_digest_config),
           updated_at = NOW()
       WHERE topic_id = $1
       RETURNING *`,
      [topicId, name, objectives,
       keywords ? JSON.stringify(keywords) : null,
       daily_scan_config ? JSON.stringify(daily_scan_config) : null,
       weekly_digest_config ? JSON.stringify(weekly_digest_config) : null]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error updating topic:', error);
    throw error;
  }
}

async function deleteIntelligenceTopic(topicId) {
  try {
    // Delete related data first (sources, news, summaries)
    await pool.query('DELETE FROM intelligence_summaries WHERE topic_id = $1', [topicId]);
    await pool.query('DELETE FROM intelligence_news WHERE topic_id = $1', [topicId]);
    await pool.query('DELETE FROM intelligence_sources WHERE topic_id = $1', [topicId]);
    // Then delete the topic
    const result = await pool.query(
      'DELETE FROM intelligence_topics WHERE topic_id = $1 RETURNING *',
      [topicId]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error deleting topic:', error);
    throw error;
  }
}

async function deleteIntelligenceSource(sourceId) {
  try {
    const result = await pool.query(
      'DELETE FROM intelligence_sources WHERE source_id = $1 RETURNING *',
      [sourceId]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error deleting source:', error);
    throw error;
  }
}

async function saveIntelligenceSources(topicId, sources) {
  try {
    const savedSources = [];
    for (const source of sources) {
      const result = await pool.query(
        `INSERT INTO intelligence_sources
         (topic_id, name, title, source_type, primary_url, secondary_urls, content_types, posting_frequency, focus_areas, authority_score, why_selected, freshness, priority)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING *`,
        [
          topicId,
          source.name,
          source.title || '',
          source.type || 'blog',
          source.primary_url,
          JSON.stringify(source.secondary_urls || []),
          JSON.stringify(source.content_types || []),
          source.posting_frequency || 'irregular',
          JSON.stringify(source.focus_areas || []),
          source.authority_score || 50,
          source.why_selected || '',
          source.freshness || '',
          source.priority || 'medium'
        ]
      );
      savedSources.push(result.rows[0]);
    }
    return savedSources;
  } catch (error) {
    console.error('Error saving intelligence sources:', error);
    throw error;
  }
}

async function getIntelligenceSources(topicId) {
  try {
    const result = await pool.query(
      `SELECT * FROM intelligence_sources WHERE topic_id = $1 ORDER BY authority_score DESC`,
      [topicId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching intelligence sources:', error);
    throw error;
  }
}

async function saveIntelligenceNews(topicId, sourceId, newsItem) {
  try {
    const result = await pool.query(
      `INSERT INTO intelligence_news
       (topic_id, source_id, title, url, summary, importance_score, dimensions, published_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        topicId,
        sourceId,
        newsItem.title,
        newsItem.url,
        newsItem.summary,
        newsItem.importance_score || newsItem.importanceScore,
        JSON.stringify(newsItem.dimensions || {}),
        newsItem.published_at || newsItem.publishedAt
      ]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error saving intelligence news:', error);
    throw error;
  }
}

async function getIntelligenceNews(topicId, limit = 50) {
  try {
    const result = await pool.query(
      `SELECT n.*, s.name as source_name
       FROM intelligence_news n
       LEFT JOIN intelligence_sources s ON n.source_id = s.source_id
       WHERE n.topic_id = $1
       ORDER BY n.scraped_at DESC
       LIMIT $2`,
      [topicId, limit]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching intelligence news:', error);
    throw error;
  }
}

async function saveIntelligenceSummary(topicId, summaryData, meta) {
  try {
    const result = await pool.query(
      `INSERT INTO intelligence_summaries
       (topic_id, breaking_news, practical_tips, key_points, overall_trend, model_used, input_tokens, output_tokens, estimated_cost, articles_analyzed)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        topicId,
        JSON.stringify(summaryData.breakingNews || []),
        JSON.stringify(summaryData.practicalTips || []),
        JSON.stringify(summaryData.keyPoints || []),
        summaryData.overallTrend || '',
        meta.analysisModel || 'unknown',
        meta.inputTokens || 0,
        meta.outputTokens || 0,
        meta.estimatedCost || 0,
        meta.articlesAnalyzed || 0
      ]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error saving intelligence summary:', error);
    throw error;
  }
}

async function getIntelligenceSummaries(topicId, limit = 10) {
  try {
    const result = await pool.query(
      `SELECT * FROM intelligence_summaries
       WHERE topic_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [topicId, limit]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching intelligence summaries:', error);
    throw error;
  }
}

async function getLatestIntelligenceSummary(topicId) {
  try {
    const result = await pool.query(
      `SELECT * FROM intelligence_summaries
       WHERE topic_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [topicId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching latest intelligence summary:', error);
    throw error;
  }
}

// ==================== EDM History Functions ====================

async function saveEdmHistory(topicId, edmData) {
  try {
    const result = await pool.query(
      `INSERT INTO intelligence_edm_history
       (topic_id, subject, preview_text, html_content, recipients, articles_included, status, resend_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        topicId,
        edmData.subject,
        edmData.previewText,
        edmData.htmlContent,
        JSON.stringify(edmData.recipients || []),
        edmData.articlesIncluded || 0,
        edmData.status || 'sent',
        edmData.resendId || null
      ]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error saving EDM history:', error);
    throw error;
  }
}

async function getEdmHistory(topicId, limit = 10) {
  try {
    const result = await pool.query(
      `SELECT edm_id, topic_id, subject, preview_text, recipients, articles_included, status, resend_id, sent_at
       FROM intelligence_edm_history
       WHERE topic_id = $1
       ORDER BY sent_at DESC
       LIMIT $2`,
      [topicId, limit]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching EDM history:', error);
    throw error;
  }
}

async function getEdmById(edmId) {
  try {
    const result = await pool.query(
      `SELECT * FROM intelligence_edm_history WHERE edm_id = $1`,
      [edmId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching EDM by ID:', error);
    throw error;
  }
}

// ==========================================
// Ziwei Seeder Functions
// ==========================================

async function seedZiweiRules() {
  try {
    const rules = require('./services/ziwei-rules-seed');

    let insertedCount = 0;
    for (const rule of rules) {
      const existing = await pool.query(
        `SELECT id FROM ziwei_interpretation_rules
         WHERE scope = $1 AND condition = $2 AND consensus_label = $3 LIMIT 1`,
        [rule.scope, JSON.stringify(rule.condition), rule.consensus_label]
      );

      if (existing.rows.length === 0) {
        await pool.query(
          `INSERT INTO ziwei_interpretation_rules
           (version, scope, condition, interpretation, consensus_label, statistics, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            1,
            rule.scope,
            JSON.stringify(rule.condition),
            JSON.stringify(rule.interpretation),
            rule.consensus_label,
            JSON.stringify(rule.statistics),
            'active'
          ]
        );
        insertedCount++;
      }
    }

    console.log(`✅ Ziwei rules seeded: ${insertedCount} new rules added`);
    return insertedCount;
  } catch (error) {
    console.error('⚠️ Ziwei seeding error:', error.message);
    return 0;
  }
}

async function getZiweiRules(filters = {}) {
  try {
    let query = `SELECT * FROM ziwei_interpretation_rules WHERE status = 'active'`;
    const params = [];

    if (filters.scope) {
      query += ` AND scope = $${params.length + 1}`;
      params.push(filters.scope);
    }

    if (filters.consensus) {
      query += ` AND consensus_label = $${params.length + 1}`;
      params.push(filters.consensus);
    }

    query += ` ORDER BY consensus_label DESC, statistics->>'confidence_level' DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error fetching Ziwei rules:', error);
    throw error;
  }
}

async function saveZiweiRuleFeedback(chartId, ruleId, feedback) {
  try {
    const result = await pool.query(
      `INSERT INTO ziwei_rule_feedback (chart_id, rule_id, user_rating, outcome_status, accuracy_flag, user_notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [chartId, ruleId, feedback.rating, feedback.outcome, feedback.accuracy, feedback.notes]
    );
    return result.rows[0].id;
  } catch (error) {
    console.error('Error saving rule feedback:', error);
    throw error;
  }
}

async function updateZiweiRuleStatistics(ruleId) {
  try {
    // Calculate match rate from feedback
    const feedback = await pool.query(
      `SELECT COUNT(*) as total,
              SUM(CASE WHEN accuracy_flag = 'accurate' THEN 1 ELSE 0 END) as matches
       FROM ziwei_rule_feedback WHERE rule_id = $1`,
      [ruleId]
    );

    const { total, matches } = feedback.rows[0];
    const matchRate = total > 0 ? (matches / total) : 0.5;

    await pool.query(
      `UPDATE ziwei_rule_statistics
       SET sample_size = $1, match_count = $2, match_rate = $3, confidence_level = $4, updated_at = NOW()
       WHERE rule_id = $5`,
      [total, matches, matchRate, Math.sqrt(matchRate), ruleId]
    );

    console.log(`✅ Updated statistics for rule ${ruleId}: ${matches}/${total} matches`);
  } catch (error) {
    console.error('Error updating rule statistics:', error);
  }
}

// ==========================================
// Ziwei Step 4: LLM Enhancement Functions
// ==========================================

async function saveEnhancedInterpretation(chartId, enhancement) {
  try {
    const result = await pool.query(
      `INSERT INTO ziwei_enhanced_interpretations
       (chart_id, llm_enhancement, confidence_boost, synthesis_summary, model_used, tokens_input, tokens_output)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        chartId,
        JSON.stringify(enhancement.llmEnhancement),
        enhancement.confidenceBoost || 0.4,
        enhancement.synthesizeSummary || null,
        enhancement.model || 'deepseek-reasoner',
        enhancement.tokensInput || 0,
        enhancement.tokensOutput || 0
      ]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error saving enhanced interpretation:', error);
    throw error;
  }
}

async function getEnhancedInterpretations(chartId) {
  try {
    const result = await pool.query(
      `SELECT * FROM ziwei_enhanced_interpretations WHERE chart_id = $1 ORDER BY created_at DESC`,
      [chartId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching enhanced interpretations:', error);
    throw error;
  }
}

// ==========================================
// Ziwei Step 5: Conversation Functions
// ==========================================

async function createConversation(chartId, userId, title = null) {
  try {
    const result = await pool.query(
      `INSERT INTO ziwei_conversations (chart_id, user_id, title)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [chartId, userId, title]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
}

async function addConversationMessage(conversationId, role, content, tokensUsed = 0) {
  try {
    const result = await pool.query(
      `INSERT INTO ziwei_conversation_messages (conversation_id, role, content, tokens_used)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [conversationId, role, content, tokensUsed]
    );

    // Update conversation metadata
    await pool.query(
      `UPDATE ziwei_conversations
       SET message_count = message_count + 1,
           last_message_at = NOW(),
           tokens_used = tokens_used + $1,
           updated_at = NOW()
       WHERE id = $2`,
      [tokensUsed, conversationId]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error adding conversation message:', error);
    throw error;
  }
}

async function getConversationMessages(conversationId, limit = 50) {
  try {
    const result = await pool.query(
      `SELECT * FROM ziwei_conversation_messages
       WHERE conversation_id = $1
       ORDER BY created_at ASC
       LIMIT $2`,
      [conversationId, limit]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    throw error;
  }
}

async function updateConversationMetadata(conversationId, updates) {
  try {
    const { title, summary } = updates;
    const result = await pool.query(
      `UPDATE ziwei_conversations
       SET title = COALESCE($1, title),
           summary = COALESCE($2, summary),
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [title || null, summary || null, conversationId]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error updating conversation metadata:', error);
    throw error;
  }
}

async function getConversationsByChart(chartId) {
  try {
    const result = await pool.query(
      `SELECT * FROM ziwei_conversations WHERE chart_id = $1 ORDER BY updated_at DESC`,
      [chartId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching conversations by chart:', error);
    throw error;
  }
}

async function getZiweiConversation(conversationId) {
  try {
    const result = await pool.query(
      `SELECT * FROM ziwei_conversations WHERE id = $1`,
      [conversationId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching conversation:', error);
    throw error;
  }
}

// ==========================================
// Ziwei Step 6: Compatibility Functions
// ==========================================

async function saveCompatibilityAnalysis(chart1Id, chart2Id, relationshipType, analysis) {
  try {
    const result = await pool.query(
      `INSERT INTO ziwei_compatibility_analyses
       (chart1_id, chart2_id, relationship_type, compatibility_score, harmonious_elements, conflicting_elements, full_report)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        chart1Id,
        chart2Id,
        relationshipType,
        analysis.compatibilityScore || 0,
        JSON.stringify(analysis.harmoniousElements || []),
        JSON.stringify(analysis.conflictingElements || []),
        analysis.fullReport || null
      ]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error saving compatibility analysis:', error);
    throw error;
  }
}

async function getCompatibilityAnalysis(chart1Id, chart2Id) {
  try {
    const result = await pool.query(
      `SELECT * FROM ziwei_compatibility_analyses
       WHERE (chart1_id = $1 AND chart2_id = $2) OR (chart1_id = $2 AND chart2_id = $1)
       ORDER BY created_at DESC LIMIT 1`,
      [chart1Id, chart2Id]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching compatibility analysis:', error);
    throw error;
  }
}

// ==========================================
// Ziwei Step 6: Insights Functions
// ==========================================

async function saveInsights(chartId, insights) {
  try {
    const result = await pool.query(
      `INSERT INTO ziwei_insights
       (chart_id, life_stage, analysis_depth, life_guidance, decade_analysis, recommendations, warnings, model_used, tokens_used)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        chartId,
        insights.lifeStage || null,
        insights.analysisDepth || 'detailed',
        insights.lifeGuidance || '',
        JSON.stringify(insights.decadeAnalysis || {}),
        JSON.stringify(insights.recommendations || []),
        JSON.stringify(insights.warnings || []),
        insights.model || 'deepseek-reasoner',
        insights.tokensUsed || 0
      ]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error saving insights:', error);
    throw error;
  }
}

async function getInsights(chartId) {
  try {
    const result = await pool.query(
      `SELECT * FROM ziwei_insights WHERE chart_id = $1 ORDER BY created_at DESC`,
      [chartId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching insights:', error);
    throw error;
  }
}

// ── Social State (Sarah Orchestrator) ──────────────────────────────────────

async function getSocialState(taskId) {
  try {
    const result = await pool.query(
      'SELECT state FROM social_states WHERE task_id = $1',
      [taskId]
    );
    return result.rows[0]?.state || null;
  } catch (error) {
    console.error('Error fetching social state:', error);
    throw error;
  }
}

async function upsertSocialState(taskId, state, brandId = null, projectId = null) {
  try {
    await pool.query(
      `INSERT INTO social_states (task_id, brand_id, project_id, state, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (task_id) DO UPDATE
         SET state = $4, updated_at = NOW()`,
      [taskId, brandId, projectId, JSON.stringify(state)]
    );
  } catch (error) {
    console.error('Error upserting social state:', error);
    throw error;
  }
}

async function deleteSocialState(taskId) {
  try {
    await pool.query('DELETE FROM social_states WHERE task_id = $1', [taskId]);
  } catch (error) {
    console.error('Error deleting social state:', error);
    throw error;
  }
}

// ── Social Campaign & Artefact Storage ───────────────────────────────────────

async function saveSocialCampaign(taskId, { briefTitle, brandId, projectId, status = 'DRAFT' }) {
  try {
    await pool.query(
      `INSERT INTO social_campaigns (task_id, brand_id, project_id, brief_title, status)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (task_id) DO UPDATE
         SET status = $5, updated_at = NOW()`,
      [taskId, brandId, projectId, briefTitle, status]
    );
  } catch (error) {
    console.error('Error saving social campaign:', error);
    throw error;
  }
}

async function saveArtefact(taskId, { artefactKey, artefactType, markdown, json = null }) {
  try {
    await pool.query(
      `INSERT INTO social_artefacts (task_id, artefact_key, artefact_type, markdown_content, json_structure)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (task_id, artefact_key) DO UPDATE
         SET markdown_content = $4, json_structure = $5, updated_at = NOW()`,
      [taskId, artefactKey, artefactType, markdown, json ? JSON.stringify(json) : null]
    );
  } catch (error) {
    console.error('Error saving artefact:', error);
    throw error;
  }
}

async function getArtefact(taskId, artefactKey) {
  try {
    const result = await pool.query(
      `SELECT markdown_content, json_structure FROM social_artefacts
       WHERE task_id = $1 AND artefact_key = $2`,
      [taskId, artefactKey]
    );
    if (result.rows[0]) {
      return {
        markdown: result.rows[0].markdown_content,
        json: result.rows[0].json_structure,
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching artefact:', error);
    throw error;
  }
}

async function getAllArtefacts(taskId) {
  try {
    const result = await pool.query(
      `SELECT artefact_key, artefact_type, markdown_content, json_structure
       FROM social_artefacts WHERE task_id = $1 ORDER BY updated_at DESC`,
      [taskId]
    );
    return result.rows.map(row => ({
      key: row.artefact_key,
      type: row.artefact_type,
      markdown: row.markdown_content,
      json: row.json_structure,
    }));
  } catch (error) {
    console.error('Error fetching all artefacts:', error);
    throw error;
  }
}

// ── Content Calendar Storage (for frontend RECENT_POSTS view) ────────────────

async function saveSocialContentPosts(taskId, posts) {
  try {
    for (const post of posts) {
      await pool.query(
        `INSERT INTO social_content_posts
         (task_id, post_date, platform, format, title, pillar, objective, key_message, copy_hook, cta, language, visual_type, status, ad_plan)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (id) DO NOTHING`,
        [
          taskId, post.date, post.platform, post.format, post.title, post.pillar,
          post.objective, post.keyMessage, post.copyHook, post.cta, post.language,
          post.visualType, post.status || 'Draft', post.adPlan
        ]
      );
    }
  } catch (error) {
    console.error('Error saving content posts:', error);
    throw error;
  }
}

async function getSocialContentPosts(taskId, limit = 50) {
  try {
    const result = await pool.query(
      `SELECT post_date, platform, format, title, pillar, status, ad_plan
       FROM social_content_posts WHERE task_id = $1
       ORDER BY post_date ASC LIMIT $2`,
      [taskId, limit]
    );
    return result.rows.map(row => ({
      date: row.post_date?.toISOString().split('T')[0],
      platform: row.platform,
      format: row.format,
      title: row.title,
      pillar: row.pillar,
      status: row.status,
      adPlan: row.ad_plan,
    }));
  } catch (error) {
    console.error('Error fetching content posts:', error);
    throw error;
  }
}

// ── Ad Campaigns Storage (for frontend AD_CAMPAIGNS view) ────────────────────

async function saveSocialAdCampaigns(taskId, campaigns) {
  try {
    for (const campaign of campaigns) {
      await pool.query(
        `INSERT INTO social_ad_campaigns
         (task_id, campaign_name, objective, funnel_stage, platform, budget_hkd, budget_pct, audience_definition, geo, placements, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO NOTHING`,
        [
          taskId, campaign.name, campaign.objective, campaign.funnelStage,
          campaign.platform, campaign.budgetHKD, campaign.budgetPct,
          campaign.audienceDefinition, campaign.geo, campaign.placements,
          campaign.status || 'Draft'
        ]
      );
    }
  } catch (error) {
    console.error('Error saving ad campaigns:', error);
    throw error;
  }
}

async function getSocialAdCampaigns(taskId) {
  try {
    const result = await pool.query(
      `SELECT campaign_name, platform, budget_hkd, audience_definition, geo, status
       FROM social_ad_campaigns WHERE task_id = $1 ORDER BY created_at DESC`,
      [taskId]
    );
    return result.rows.map(row => ({
      name: row.campaign_name,
      platform: row.platform,
      spend: row.budget_hkd ? `$${Math.round(row.budget_hkd)}` : 'N/A',
      impressions: '—',
      clicks: '—',
      ctr: '—',
      roas: '—',
      status: row.status,
    }));
  } catch (error) {
    console.error('Error fetching ad campaigns:', error);
    throw error;
  }
}

// ── KPI Definitions Storage (for frontend KPI_CARDS view) ────────────────────

async function saveSocialKPIs(taskId, kpis) {
  try {
    for (const kpi of kpis) {
      await pool.query(
        `INSERT INTO social_kpi_definitions
         (task_id, kpi_name, kpi_type, definition, formula, data_source, reporting_frequency, funnel_stage, platform, target_value, target_direction)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO NOTHING`,
        [
          taskId, kpi.name, kpi.type, kpi.definition, kpi.formula,
          kpi.dataSource, kpi.frequency, kpi.funnelStage, kpi.platform,
          kpi.targetValue, kpi.targetDirection
        ]
      );
    }
  } catch (error) {
    console.error('Error saving KPIs:', error);
    throw error;
  }
}

async function getSocialKPIs(taskId) {
  try {
    const result = await pool.query(
      `SELECT kpi_name, kpi_type, target_value FROM social_kpi_definitions
       WHERE task_id = $1 ORDER BY created_at ASC`,
      [taskId]
    );
    // Map to frontend KPI_CARDS format
    const kpiMap = {
      'Scheduled Posts': { value: '6', change: '+3 this week', icon: 'Calendar' },
      'Impressions': { value: '533K', change: '+12% MoM', icon: 'Eye' },
      'Clicks': { value: '9.3K', change: '+8% MoM', icon: 'MousePointer' },
      'Ad Spend': { value: '$2,820', change: '67% of budget', icon: 'DollarSign' },
    };

    return result.rows.map(row => ({
      label: row.kpi_name,
      value: kpiMap[row.kpi_name]?.value || '—',
      change: kpiMap[row.kpi_name]?.change || row.target_value || '—',
      icon: kpiMap[row.kpi_name]?.icon || 'Target',
    }));
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    throw error;
  }
}

// ── Content Development: Draft Management ────────────────────────────────────

async function createContentDraft(taskId, draftData) {
  try {
    const result = await pool.query(
      `INSERT INTO social_content_drafts
       (task_id, platform, format, title, pillar, objective, key_message, copy_hook, cta, language, visual_type, caption, hashtags, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING draft_id, id`,
      [
        taskId, draftData.platform, draftData.format, draftData.title, draftData.pillar,
        draftData.objective, draftData.keyMessage, draftData.copyHook, draftData.cta,
        draftData.language, draftData.visualType, draftData.caption,
        JSON.stringify(draftData.hashtags || []), 'draft'
      ]
    );
    return { draft_id: result.rows[0].draft_id, id: result.rows[0].id };
  } catch (error) {
    console.error('Error creating content draft:', error);
    throw error;
  }
}

async function getContentDrafts(taskId, status = null) {
  try {
    let query = 'SELECT * FROM social_content_drafts WHERE task_id = $1';
    const params = [taskId];

    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }

    query += ' ORDER BY updated_at DESC';
    const result = await pool.query(query, params);

    return result.rows.map(row => ({
      draft_id: row.draft_id,
      id: row.id,
      platform: row.platform,
      format: row.format,
      title: row.title,
      pillar: row.pillar,
      objective: row.objective,
      keyMessage: row.key_message,
      copyHook: row.copy_hook,
      cta: row.cta,
      language: row.language,
      visualType: row.visual_type,
      caption: row.caption,
      hashtags: row.hashtags,
      status: row.status,
      syncedToCalendar: row.synced_to_calendar,
      calendarPostId: row.calendar_post_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (error) {
    console.error('Error fetching content drafts:', error);
    throw error;
  }
}

async function updateContentDraft(draftId, draftData) {
  try {
    const result = await pool.query(
      `UPDATE social_content_drafts
       SET platform = COALESCE($1, platform),
           format = COALESCE($2, format),
           title = COALESCE($3, title),
           pillar = COALESCE($4, pillar),
           objective = COALESCE($5, objective),
           key_message = COALESCE($6, key_message),
           copy_hook = COALESCE($7, copy_hook),
           cta = COALESCE($8, cta),
           language = COALESCE($9, language),
           visual_type = COALESCE($10, visual_type),
           caption = COALESCE($11, caption),
           hashtags = COALESCE($12, hashtags),
           status = COALESCE($13, status),
           updated_at = NOW()
       WHERE draft_id = $14
       RETURNING *`,
      [
        draftData.platform, draftData.format, draftData.title, draftData.pillar,
        draftData.objective, draftData.keyMessage, draftData.copyHook, draftData.cta,
        draftData.language, draftData.visualType, draftData.caption,
        draftData.hashtags ? JSON.stringify(draftData.hashtags) : null,
        draftData.status, draftId
      ]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error updating content draft:', error);
    throw error;
  }
}

async function deleteContentDraft(draftId) {
  try {
    await pool.query('DELETE FROM social_content_drafts WHERE draft_id = $1', [draftId]);
    return true;
  } catch (error) {
    console.error('Error deleting content draft:', error);
    throw error;
  }
}

async function promoteContentDraftToCalendar(draftId, postDate) {
  try {
    const draft = await pool.query(
      'SELECT * FROM social_content_drafts WHERE draft_id = $1',
      [draftId]
    );

    if (draft.rows.length === 0) {
      throw new Error('Draft not found');
    }

    const d = draft.rows[0];

    // Insert into social_content_posts
    const postResult = await pool.query(
      `INSERT INTO social_content_posts
       (task_id, post_date, platform, format, title, pillar, objective, key_message, copy_hook, cta, language, visual_type, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id`,
      [
        d.task_id, postDate, d.platform, d.format, d.title, d.pillar,
        d.objective, d.key_message, d.copy_hook, d.cta, d.language, d.visual_type, 'Scheduled'
      ]
    );

    // Update draft with calendar reference
    await pool.query(
      'UPDATE social_content_drafts SET synced_to_calendar = TRUE, calendar_post_id = $1, updated_at = NOW() WHERE draft_id = $2',
      [postResult.rows[0].id, draftId]
    );

    return { calendarPostId: postResult.rows[0].id };
  } catch (error) {
    console.error('Error promoting draft to calendar:', error);
    throw error;
  }
}

// ── Content Calendar & Development Sync ───────────────────────────────────────

async function syncContentCalendarAndDevelopment(taskId) {
  try {
    // Find orphaned calendar posts (no corresponding draft)
    const orphanedPosts = await pool.query(
      `SELECT id, title, platform FROM social_content_posts
       WHERE task_id = $1 AND id NOT IN (SELECT calendar_post_id FROM social_content_drafts WHERE synced_to_calendar = TRUE)`,
      [taskId]
    );

    // Find orphaned drafts (calendar was deleted)
    const orphanedDrafts = await pool.query(
      `SELECT draft_id, title FROM social_content_drafts
       WHERE task_id = $1 AND synced_to_calendar = TRUE AND calendar_post_id NOT IN (SELECT id FROM social_content_posts)`,
      [taskId]
    );

    return {
      orphanedCalendarPosts: orphanedPosts.rows,
      orphanedDrafts: orphanedDrafts.rows,
      syncStatus: 'ok'
    };
  } catch (error) {
    console.error('Error syncing calendar and development:', error);
    throw error;
  }
}

// ── Brand Products & Services Management ───────────────────────────────────────

async function createProductService(brandId, productData) {
  try {
    const result = await pool.query(
      `INSERT INTO brand_products_services
       (brand_id, name, category, description, type, status, launch_date, portfolio_order, image_url, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING product_service_id, id`,
      [
        brandId, productData.name, productData.category, productData.description,
        productData.type, productData.status || 'active', productData.launchDate,
        productData.portfolioOrder || 0, productData.imageUrl,
        JSON.stringify(productData.metadata || {})
      ]
    );
    return { product_service_id: result.rows[0].product_service_id, id: result.rows[0].id };
  } catch (error) {
    console.error('Error creating product/service:', error);
    throw error;
  }
}

async function getProductsServices(brandId, status = null) {
  try {
    let query = 'SELECT * FROM brand_products_services WHERE brand_id = $1';
    const params = [brandId];

    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }

    query += ' ORDER BY portfolio_order ASC, created_at DESC';
    const result = await pool.query(query, params);

    return result.rows.map(row => ({
      product_service_id: row.product_service_id,
      id: row.id,
      name: row.name,
      category: row.category,
      description: row.description,
      type: row.type,
      status: row.status,
      launchDate: row.launch_date,
      discontinueDate: row.discontinue_date,
      imageUrl: row.image_url,
      metadata: row.metadata,
      createdAt: row.created_at,
    }));
  } catch (error) {
    console.error('Error fetching products/services:', error);
    throw error;
  }
}

async function updateProductServiceStatus(productServiceId, status, discontinueDate = null) {
  try {
    const result = await pool.query(
      `UPDATE brand_products_services
       SET status = $1, discontinue_date = COALESCE($2, discontinue_date), updated_at = NOW()
       WHERE product_service_id = $3
       RETURNING *`,
      [status, discontinueDate, productServiceId]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error updating product/service status:', error);
    throw error;
  }
}

async function getProductServicePortfolio(brandId) {
  try {
    const result = await pool.query(
      `SELECT name, type, status, launch_date, discontinue_date
       FROM brand_products_services
       WHERE brand_id = $1
       ORDER BY status DESC, portfolio_order ASC, created_at DESC`,
      [brandId]
    );

    const portfolio = {
      active: [],
      paused: [],
      retired: [],
    };

    result.rows.forEach(row => {
      const item = {
        name: row.name,
        type: row.type,
        launchDate: row.launch_date,
        discontinueDate: row.discontinue_date,
      };

      if (row.status === 'active') {
        portfolio.active.push(item);
      } else if (row.status === 'paused') {
        portfolio.paused.push(item);
      } else if (row.status === 'retired') {
        portfolio.retired.push(item);
      }
    });

    return portfolio;
  } catch (error) {
    console.error('Error fetching product portfolio:', error);
    throw error;
  }
}

// ── Research Data Management ─────────────────────────────────────────────────

async function saveResearchBusiness(brandId, businessData) {
  try {
    const result = await pool.query(
      `INSERT INTO research_business (brand_id, business_overview, mission_vision_values)
       VALUES ($1, $2, $3)
       ON CONFLICT (brand_id) DO UPDATE SET
         business_overview = EXCLUDED.business_overview,
         mission_vision_values = EXCLUDED.mission_vision_values,
         updated_at = NOW()
       RETURNING research_id`,
      [brandId, businessData.businessOverview || '', businessData.mission || '']
    );
    return { research_id: result.rows[0].research_id };
  } catch (error) {
    console.error('Error saving research business:', error);
    throw error;
  }
}

async function getResearchBusiness(brandId) {
  try {
    const result = await pool.query(
      `SELECT * FROM research_business WHERE brand_id = $1`,
      [brandId]
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      research_id: row.research_id,
      businessOverview: row.business_overview,
      mission: row.mission_vision_values,
    };
  } catch (error) {
    console.error('Error fetching research business:', error);
    throw error;
  }
}

async function saveResearchCompetitors(brandId, competitors) {
  try {
    for (const comp of competitors) {
      await pool.query(
        `INSERT INTO research_competitors (brand_id, name, website, strengths, weaknesses, social_presence, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING`,
        [brandId, comp.name, comp.website, comp.strengths, comp.weaknesses, comp.socialPresence, comp.notes]
      );
    }
  } catch (error) {
    console.error('Error saving research competitors:', error);
    throw error;
  }
}

async function getResearchCompetitors(brandId) {
  try {
    const result = await pool.query(
      `SELECT * FROM research_competitors WHERE brand_id = $1 ORDER BY created_at DESC`,
      [brandId]
    );
    return result.rows.map(row => ({
      id: row.competitor_id,
      name: row.name,
      website: row.website,
      strengths: row.strengths,
      weaknesses: row.weaknesses,
      socialPresence: row.social_presence,
      notes: row.notes,
    }));
  } catch (error) {
    console.error('Error fetching research competitors:', error);
    throw error;
  }
}

async function deleteResearchCompetitor(competitorId) {
  try {
    await pool.query(`DELETE FROM research_competitors WHERE competitor_id = $1`, [competitorId]);
  } catch (error) {
    console.error('Error deleting research competitor:', error);
    throw error;
  }
}

async function saveResearchAudience(brandId, audienceData) {
  try {
    const result = await pool.query(
      `INSERT INTO research_audience (brand_id, positioning_statement)
       VALUES ($1, $2)
       ON CONFLICT (brand_id) DO UPDATE SET
         positioning_statement = EXCLUDED.positioning_statement,
         updated_at = NOW()
       RETURNING audience_id`,
      [brandId, audienceData.positioning || '']
    );
    return { audience_id: result.rows[0].audience_id };
  } catch (error) {
    console.error('Error saving research audience:', error);
    throw error;
  }
}

async function getResearchAudience(brandId) {
  try {
    const result = await pool.query(
      `SELECT * FROM research_audience WHERE brand_id = $1`,
      [brandId]
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      audience_id: row.audience_id,
      positioning: row.positioning_statement,
    };
  } catch (error) {
    console.error('Error fetching research audience:', error);
    throw error;
  }
}

async function saveResearchSegments(audienceId, segments) {
  try {
    for (const seg of segments) {
      await pool.query(
        `INSERT INTO research_audience_segments (audience_id, name, demographics, psychographics, pain_points, channels, size)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING`,
        [audienceId, seg.name, seg.demographics, seg.psychographics, seg.painPoints, seg.channels, seg.size]
      );
    }
  } catch (error) {
    console.error('Error saving research segments:', error);
    throw error;
  }
}

async function getResearchSegments(brandId) {
  try {
    const result = await pool.query(
      `SELECT s.* FROM research_audience_segments s
       JOIN research_audience a ON s.audience_id = a.audience_id
       WHERE a.brand_id = $1 ORDER BY s.created_at DESC`,
      [brandId]
    );
    return result.rows.map(row => ({
      id: row.segment_id,
      name: row.name,
      demographics: row.demographics,
      psychographics: row.psychographics,
      painPoints: row.pain_points,
      channels: row.channels,
      size: row.size,
    }));
  } catch (error) {
    console.error('Error fetching research segments:', error);
    throw error;
  }
}

async function deleteResearchSegment(segmentId) {
  try {
    await pool.query(`DELETE FROM research_audience_segments WHERE segment_id = $1`, [segmentId]);
  } catch (error) {
    console.error('Error deleting research segment:', error);
    throw error;
  }
}

async function saveResearchProducts(brandId, products) {
  try {
    for (const prod of products) {
      await pool.query(
        `INSERT INTO research_products (brand_id, name, category, description, key_features, price_range, target_segment, usp)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT DO NOTHING`,
        [brandId, prod.name, prod.category, prod.description, prod.keyFeatures, prod.priceRange, prod.targetSegment, prod.usp]
      );
    }
  } catch (error) {
    console.error('Error saving research products:', error);
    throw error;
  }
}

async function getResearchProducts(brandId) {
  try {
    const result = await pool.query(
      `SELECT * FROM research_products WHERE brand_id = $1 ORDER BY created_at DESC`,
      [brandId]
    );
    return result.rows.map(row => ({
      id: row.product_id,
      name: row.name,
      category: row.category,
      description: row.description,
      keyFeatures: row.key_features,
      priceRange: row.price_range,
      targetSegment: row.target_segment,
      usp: row.usp,
    }));
  } catch (error) {
    console.error('Error fetching research products:', error);
    throw error;
  }
}

async function deleteResearchProduct(productId) {
  try {
    await pool.query(`DELETE FROM research_products WHERE product_id = $1`, [productId]);
  } catch (error) {
    console.error('Error deleting research product:', error);
    throw error;
  }
}

module.exports = {
  pool,
  query,
  initDatabase,
  saveProject,
  saveAnalysis,
  getProjectAnalyses,
  getAllProjects,
  getAnalytics,
  getAgentPerformance,
  saveSandboxTest,
  getSandboxTests,
  deleteSandboxTest,
  clearSandboxTests,
  saveBrand,
  getBrandByName,
  searchBrands,
  updateBrandResults,
  getAllBrands,
  getBrandWithResults,
  saveConversation,
  updateConversation,
  getConversationsByBrand,
  getConversation,
  deleteConversation,
  deleteBrand,
  deleteProject,
  getProjectsByBrand,
  getConversationsByBrandAndBrief,
  // Topic Intelligence
  saveIntelligenceTopic,
  getIntelligenceTopics,
  getIntelligenceTopic,
  updateIntelligenceTopicStatus,
  updateIntelligenceTopic,
  deleteIntelligenceTopic,
  saveIntelligenceSources,
  getIntelligenceSources,
  deleteIntelligenceSource,
  saveIntelligenceNews,
  getIntelligenceNews,
  saveIntelligenceSummary,
  getIntelligenceSummaries,
  getLatestIntelligenceSummary,
  // EDM History
  saveEdmHistory,
  getEdmHistory,
  getEdmById,
  // Ziwei Astrology
  seedZiweiRules,
  getZiweiRules,
  saveZiweiRuleFeedback,
  updateZiweiRuleStatistics,
  // Ziwei Step 4-6 (LLM Enhancement)
  saveEnhancedInterpretation,
  getEnhancedInterpretations,
  // Ziwei Step 5 (Conversations)
  createConversation,
  addConversationMessage,
  getConversationMessages,
  updateConversationMetadata,
  getConversationsByChart,
  getConversation: getZiweiConversation,
  // Ziwei Step 6 (Compatibility)
  saveCompatibilityAnalysis,
  getCompatibilityAnalysis,
  // Ziwei Step 6 (Insights)
  saveInsights,
  getInsights,
  // Social Orchestrator State
  getSocialState,
  upsertSocialState,
  deleteSocialState,
  // Social Campaign & Artefacts
  saveSocialCampaign,
  saveArtefact,
  getArtefact,
  getAllArtefacts,
  // Content Posts (for calendar view)
  saveSocialContentPosts,
  getSocialContentPosts,
  // Ad Campaigns (for media buy view)
  saveSocialAdCampaigns,
  getSocialAdCampaigns,
  // KPI Definitions (for dashboard)
  saveSocialKPIs,
  getSocialKPIs,
  // Content Development: Drafts
  createContentDraft,
  getContentDrafts,
  updateContentDraft,
  deleteContentDraft,
  promoteContentDraftToCalendar,
  // Content Sync
  syncContentCalendarAndDevelopment,
  // Brand Products & Services
  createProductService,
  getProductsServices,
  updateProductServiceStatus,
  getProductServicePortfolio,
  // Research Data
  saveResearchBusiness,
  getResearchBusiness,
  saveResearchCompetitors,
  getResearchCompetitors,
  deleteResearchCompetitor,
  saveResearchAudience,
  getResearchAudience,
  saveResearchSegments,
  getResearchSegments,
  deleteResearchSegment,
  saveResearchProducts,
  getResearchProducts,
  deleteResearchProduct,
};
