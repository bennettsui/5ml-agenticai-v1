const { Pool } = require('pg');

// Configure SSL and connection timeouts based on environment and DATABASE_URL
const getDatabaseConfig = () => {
  const config = {
    connectionString: process.env.DATABASE_URL,
    // Connection timeout settings for TLS stability on Fly.io
    connectionTimeoutMillis: 10000, // 10 seconds to establish connection
    idleTimeoutMillis: 30000, // 30 seconds before idle clients are closed
    max: 10, // Maximum number of clients in the pool
  };

  // Only enable SSL for production databases (not localhost)
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost')) {
    config.ssl = {
      rejectUnauthorized: false,
    };
  }

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
        keywords JSONB DEFAULT '[]',
        status VARCHAR(50) DEFAULT 'active',
        daily_scan_config JSONB DEFAULT '{"enabled": true, "time": "06:00", "timezone": "Asia/Hong_Kong"}',
        weekly_digest_config JSONB DEFAULT '{"enabled": true, "day": "monday", "time": "08:00", "timezone": "Asia/Hong_Kong", "recipientList": []}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

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
    `);
    console.log('✅ Database schema initialized');
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    console.error('Database URL configured:', process.env.DATABASE_URL ? 'Yes' : 'No');
    console.error('SSL enabled:', getDatabaseConfig().ssl ? 'Yes' : 'No');
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
      `INSERT INTO intelligence_topics (name, keywords, daily_scan_config, weekly_digest_config)
       VALUES ($1, $2, $3, $4)
       RETURNING topic_id, name, keywords, status, daily_scan_config, weekly_digest_config, created_at`,
      [name, JSON.stringify(keywords), JSON.stringify(dailyScanConfig), JSON.stringify(weeklyDigestConfig)]
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
      `SELECT topic_id, name, keywords, status, daily_scan_config, weekly_digest_config, created_at, updated_at
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
      `SELECT t.topic_id, t.name, t.keywords, t.status, t.daily_scan_config, t.weekly_digest_config, t.created_at, t.updated_at,
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
    const { name, keywords, daily_scan_config, weekly_digest_config } = updates;
    console.log('[DB] Updating topic:', topicId);
    console.log('[DB] weekly_digest_config to save:', JSON.stringify(weekly_digest_config, null, 2));

    const result = await pool.query(
      `UPDATE intelligence_topics
       SET name = COALESCE($2, name),
           keywords = COALESCE($3, keywords),
           daily_scan_config = COALESCE($4, daily_scan_config),
           weekly_digest_config = COALESCE($5, weekly_digest_config),
           updated_at = NOW()
       WHERE topic_id = $1
       RETURNING *`,
      [topicId, name, keywords ? JSON.stringify(keywords) : null,
       daily_scan_config ? JSON.stringify(daily_scan_config) : null,
       weekly_digest_config ? JSON.stringify(weekly_digest_config) : null]
    );

    console.log('[DB] Updated topic, returned weekly_digest_config:', JSON.stringify(result.rows[0]?.weekly_digest_config, null, 2));
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
};
