/**
 * Growth Architect Database Schema
 * Tables for growth plans, experiments, metrics, and weekly reviews
 */

async function initGrowthTables(pool) {
  try {
    await pool.query(`
      -- Master growth plans per brand
      CREATE TABLE IF NOT EXISTS growth_plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        brand_name VARCHAR(255) NOT NULL,
        plan_data JSONB NOT NULL,
        status VARCHAR(50) DEFAULT 'draft',
        phase VARCHAR(50) DEFAULT 'pmf',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );

      -- Experiment hypotheses (WHO, WHAT, WHICH channel)
      CREATE TABLE IF NOT EXISTS growth_experiments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        plan_id UUID REFERENCES growth_plans(id) ON DELETE CASCADE,
        brand_name VARCHAR(255) NOT NULL,
        hypothesis TEXT NOT NULL,
        channel VARCHAR(100),
        status VARCHAR(50) DEFAULT 'pending',
        result_data JSONB,
        tags TEXT[],
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );

      -- Weekly review snapshots (agent-generated)
      CREATE TABLE IF NOT EXISTS growth_weekly_reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        brand_name VARCHAR(255) NOT NULL,
        plan_id UUID REFERENCES growth_plans(id) ON DELETE CASCADE,
        week_start DATE NOT NULL,
        week_end DATE NOT NULL,
        summary JSONB NOT NULL,
        human_decisions JSONB,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT now()
      );

      -- Growth metrics snapshots (sourced from ads + CRM)
      CREATE TABLE IF NOT EXISTS growth_metrics_snapshots (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        brand_name VARCHAR(255) NOT NULL,
        snapshot_date DATE NOT NULL,
        channel VARCHAR(100),
        ctr NUMERIC(10,6),
        cpc NUMERIC(18,4),
        cvr NUMERIC(10,6),
        cpa NUMERIC(18,4),
        roas NUMERIC(10,6),
        cac NUMERIC(18,4),
        ltv NUMERIC(18,4),
        spend NUMERIC(18,4),
        revenue NUMERIC(18,4),
        raw_data JSONB,
        created_at TIMESTAMPTZ DEFAULT now()
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_growth_plans_brand ON growth_plans(brand_name);
      CREATE INDEX IF NOT EXISTS idx_growth_plans_status ON growth_plans(status);
      CREATE INDEX IF NOT EXISTS idx_growth_plans_created ON growth_plans(created_at DESC);

      CREATE INDEX IF NOT EXISTS idx_growth_experiments_plan ON growth_experiments(plan_id);
      CREATE INDEX IF NOT EXISTS idx_growth_experiments_brand ON growth_experiments(brand_name);
      CREATE INDEX IF NOT EXISTS idx_growth_experiments_status ON growth_experiments(status);

      CREATE INDEX IF NOT EXISTS idx_growth_reviews_brand ON growth_weekly_reviews(brand_name);
      CREATE INDEX IF NOT EXISTS idx_growth_reviews_week ON growth_weekly_reviews(week_start);

      CREATE INDEX IF NOT EXISTS idx_growth_metrics_brand_date ON growth_metrics_snapshots(brand_name, snapshot_date);
      CREATE INDEX IF NOT EXISTS idx_growth_metrics_channel ON growth_metrics_snapshots(channel);
    `);

    // Phase 2 tables: assets, CRM flows, EDM campaigns
    await pool.query(`
      -- Generated marketing assets (nanobanana + social content)
      CREATE TABLE IF NOT EXISTS growth_assets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        brand_name VARCHAR(255) NOT NULL,
        plan_id UUID REFERENCES growth_plans(id) ON DELETE CASCADE,
        experiment_id UUID REFERENCES growth_experiments(id) ON DELETE SET NULL,
        asset_type VARCHAR(100) NOT NULL,
        channel VARCHAR(100),
        funnel_stage VARCHAR(100),
        tag VARCHAR(100),
        content JSONB NOT NULL,
        status VARCHAR(50) DEFAULT 'draft',
        performance JSONB,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );

      -- CRM communication flow definitions
      CREATE TABLE IF NOT EXISTS growth_crm_flows (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        brand_name VARCHAR(255) NOT NULL,
        plan_id UUID REFERENCES growth_plans(id) ON DELETE CASCADE,
        flow_name VARCHAR(255) NOT NULL,
        trigger_event VARCHAR(255),
        audience_segment VARCHAR(255),
        flow_steps JSONB NOT NULL DEFAULT '[]',
        status VARCHAR(50) DEFAULT 'draft',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );

      -- EDM campaigns (extends topic-intelligence EDM pattern)
      CREATE TABLE IF NOT EXISTS growth_edm_campaigns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        brand_name VARCHAR(255) NOT NULL,
        plan_id UUID REFERENCES growth_plans(id) ON DELETE CASCADE,
        campaign_name VARCHAR(255) NOT NULL,
        campaign_type VARCHAR(100),
        subject VARCHAR(500) NOT NULL,
        preview_text TEXT,
        html_content TEXT NOT NULL,
        recipients JSONB DEFAULT '[]',
        scheduled_at TIMESTAMPTZ,
        sent_at TIMESTAMPTZ,
        open_rate NUMERIC(10,6),
        click_rate NUMERIC(10,6),
        status VARCHAR(50) DEFAULT 'draft',
        created_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_growth_assets_brand ON growth_assets(brand_name);
      CREATE INDEX IF NOT EXISTS idx_growth_assets_type ON growth_assets(asset_type);
      CREATE INDEX IF NOT EXISTS idx_growth_assets_status ON growth_assets(status);
      CREATE INDEX IF NOT EXISTS idx_growth_assets_plan ON growth_assets(plan_id);

      CREATE INDEX IF NOT EXISTS idx_growth_crm_flows_brand ON growth_crm_flows(brand_name);
      CREATE INDEX IF NOT EXISTS idx_growth_crm_flows_status ON growth_crm_flows(status);

      CREATE INDEX IF NOT EXISTS idx_growth_edm_brand ON growth_edm_campaigns(brand_name);
      CREATE INDEX IF NOT EXISTS idx_growth_edm_status ON growth_edm_campaigns(status);
    `);

    // Phase 3 tables: knowledge base + ROAS modeling
    await pool.query(`
      -- Knowledge base for RAG (ICPs, experiments, playbooks, performance insights)
      CREATE TABLE IF NOT EXISTS growth_kb (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        brand_name VARCHAR(255) NOT NULL,
        category VARCHAR(50) NOT NULL,
        title VARCHAR(500) NOT NULL,
        content TEXT NOT NULL,
        metadata JSONB DEFAULT '{}',
        embedding vector(1536),
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );

      -- ROAS financial projections (scaling models per brand)
      CREATE TABLE IF NOT EXISTS growth_roas_models (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        brand_name VARCHAR(255) NOT NULL,
        plan_id UUID REFERENCES growth_plans(id) ON DELETE CASCADE,
        base_spend NUMERIC(18,4) NOT NULL,
        base_revenue NUMERIC(18,4) NOT NULL,
        base_roas NUMERIC(10,6),
        channel_mix JSONB NOT NULL,
        scaling_assumptions JSONB DEFAULT '{}',
        projections JSONB DEFAULT '{}',
        ltv_assumptions JSONB DEFAULT '{}',
        break_even_spend NUMERIC(18,4),
        status VARCHAR(50) DEFAULT 'draft',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_growth_kb_brand ON growth_kb(brand_name);
      CREATE INDEX IF NOT EXISTS idx_growth_kb_category ON growth_kb(category);
      CREATE INDEX IF NOT EXISTS idx_growth_kb_embedding ON growth_kb USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

      CREATE INDEX IF NOT EXISTS idx_growth_roas_brand ON growth_roas_models(brand_name);
      CREATE INDEX IF NOT EXISTS idx_growth_roas_plan ON growth_roas_models(plan_id);
      CREATE INDEX IF NOT EXISTS idx_growth_roas_status ON growth_roas_models(status);
    `);

    console.log('✅ Growth Architect tables initialized');
    return true;
  } catch (error) {
    console.error('❌ Error initializing growth tables:', error.message);
    throw error;
  }
}

module.exports = { initGrowthTables };
