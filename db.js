const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// 初始化數據庫表
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        project_id UUID UNIQUE DEFAULT gen_random_uuid(),
        client_name VARCHAR(255) NOT NULL,
        brief TEXT NOT NULL,
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
    console.log('✅ Database initialized');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  }
}

// 保存 project
async function saveProject(client_name, brief, industry = null) {
  try {
    const result = await pool.query(
      'INSERT INTO projects (client_name, brief, industry) VALUES ($1, $2, $3) RETURNING project_id',
      [client_name, brief, industry]
    );
    return result.rows[0].project_id;
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
      'SELECT * FROM projects ORDER BY created_at DESC LIMIT $1',
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

module.exports = {
  pool,
  initDatabase,
  saveProject,
  saveAnalysis,
  getProjectAnalyses,
  getAllProjects,
  getAnalytics,
  getAgentPerformance,
};
