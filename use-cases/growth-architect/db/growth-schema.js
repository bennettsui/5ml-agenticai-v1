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

    console.log('✅ Growth Architect tables initialized');
    return true;
  } catch (error) {
    console.error('❌ Error initializing growth tables:', error.message);
    throw error;
  }
}

module.exports = { initGrowthTables };
