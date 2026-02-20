// BrandHistoryAgent
// Connects the media generation workflow to the CRM brand profiles and
// maintains a brand's visual history — previous images, style decisions,
// approved LoRAs, and tone guidelines.
//
// This gives the agency "institutional memory":
//  - New briefs automatically inherit the brand's approved style tokens
//  - Art directors can see what worked / what was rejected in previous campaigns
//  - LoRA selection is data-driven, not guesswork
//
// Links to: GET /api/crm/brands/:id for the brand CRM profile
// Model: DeepSeek Reasoner

const deepseekService = require('../../../services/deepseekService');
const { shouldUseDeepSeek, getClaudeModel } = require('../../../utils/modelHelper');

class BrandHistoryAgent {
  constructor(anthropic, pool) {
    this.anthropic = anthropic;
    this.pool = pool;
    this.name = 'BrandHistoryAgent';
  }

  // ── Load brand profile from CRM ───────────────────────────────────────────
  async loadCrmBrand(brandId) {
    try {
      const result = await this.pool.query(
        'SELECT * FROM crm_clients WHERE id = $1',
        [brandId]
      );
      return result.rows[0] || null;
    } catch {
      return null; // CRM table may not exist in all environments
    }
  }

  // ── Link a media project to a CRM brand ───────────────────────────────────
  async linkProjectToBrand(projectId, brandId) {
    await this.pool.query(
      `UPDATE media_projects SET brand_id = $1, updated_at = NOW() WHERE id = $2`,
      [brandId, projectId]
    );
  }

  // ── Build brand memory from past approved assets ───────────────────────────
  async buildBrandMemory(brandId) {
    // Gather all approved assets and their prompts for this brand
    const assetsResult = await this.pool.query(
      `SELECT a.id, a.type, a.tags_json, a.qc_json,
              pr.prompt_json, pr.format, pr.version,
              p.name AS project_name, p.created_at AS project_date
       FROM media_assets a
       JOIN media_projects p ON p.id = a.project_id
       LEFT JOIN media_prompts pr ON pr.id = a.prompt_id
       WHERE p.brand_id = $1 AND a.status = 'approved'
       ORDER BY a.created_at DESC
       LIMIT 50`,
      [brandId]
    );

    const styleGuidesResult = await this.pool.query(
      `SELECT sg.guide_json, p.created_at
       FROM media_style_guides sg
       JOIN media_projects p ON p.id = sg.project_id
       WHERE p.brand_id = $1
       ORDER BY p.created_at DESC
       LIMIT 10`,
      [brandId]
    );

    if (!assetsResult.rows.length && !styleGuidesResult.rows.length) {
      return {
        hasHistory: false,
        message: 'No approved assets for this brand yet. Starting fresh.',
        approvedStyleTokens: [],
        approvedLoRAs: [],
        toneGuidance: '',
        successPatterns: [],
      };
    }

    const systemPrompt = `You are a brand historian for an AI creative agency.
Given a brand's historical approved assets and style guides, extract a CONSOLIDATED brand memory
that can be injected into future briefs to ensure consistency.

Return ONLY JSON:
{
  "hasHistory": true,
  "approvedStyleTokens": ["string — prompt tokens that appeared consistently in approved assets"],
  "approvedLoRAs": [{"loraName": "string", "avgWeight": number, "usedFor": "string"}],
  "toneGuidance": "string — 2-3 sentences describing the brand's visual voice",
  "successPatterns": ["string — prompt patterns that correlated with approval"],
  "rejectedPatterns": ["string — patterns that were rejected or revised"],
  "channelPreferences": {"channel": "string — preferred style/composition for that channel"},
  "colorMemory": "string — how the brand's palette has been encoded in past prompts",
  "evolutionNotes": "string — how the brand's visual direction has shifted over time"
}`;

    try {
      const userContent = `Brand assets history (last 50 approved):\n${JSON.stringify(assetsResult.rows, null, 2)}\n\nStyle guides history:\n${JSON.stringify(styleGuidesResult.rows, null, 2)}`;
      let rawJson;
      const messages = [{ role: 'user', content: userContent }];
      if (shouldUseDeepSeek('deepseek')) {
        const resp = await deepseekService.chat([
          { role: 'system', content: systemPrompt },
          ...messages,
        ]);
        rawJson = resp.content;
      } else {
        const resp = await this.anthropic.messages.create({
          model: getClaudeModel('haiku'),
          max_tokens: 1024,
          system: systemPrompt,
          messages,
        });
        rawJson = resp.content[0].text;
      }
      const cleaned = rawJson.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const memory = JSON.parse(cleaned);

      // Cache brand memory
      await this.pool.query(
        `INSERT INTO media_brand_memory (brand_id, memory_json, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (brand_id)
         DO UPDATE SET memory_json = $2, updated_at = NOW()`,
        [brandId, JSON.stringify(memory)]
      ).catch(() => {}); // non-fatal

      return memory;
    } catch (err) {
      console.error(`[${this.name}] Brand memory build failed:`, err.message);
      return { hasHistory: false, message: `Error: ${err.message}` };
    }
  }

  // ── Get cached brand memory ───────────────────────────────────────────────
  async getBrandMemory(brandId) {
    try {
      const result = await this.pool.query(
        'SELECT memory_json FROM media_brand_memory WHERE brand_id = $1',
        [brandId]
      );
      return result.rows[0]?.memory_json || null;
    } catch {
      return null;
    }
  }

  // ── Inject brand memory into a brief spec ─────────────────────────────────
  injectMemoryIntoBrief(briefSpec, brandMemory) {
    if (!brandMemory?.hasHistory) return briefSpec;

    return {
      ...briefSpec,
      brand: {
        ...briefSpec.brand,
        // Prepend approved style tokens so they have higher weight in prompts
        approvedStyleTokens: brandMemory.approvedStyleTokens || [],
        toneGuidance: brandMemory.toneGuidance || '',
        colorMemory: brandMemory.colorMemory || '',
      },
      technicalConstraints: {
        ...briefSpec.technicalConstraints,
        // Suggest previously approved LoRAs
        loraHints: [
          ...(briefSpec.technicalConstraints?.loraHints || []),
          ...(brandMemory.approvedLoRAs?.map(l => l.loraName) || []),
        ],
      },
      brandMemoryActive: true,
    };
  }

  // ── Ensure schema exists for brand memory tables ──────────────────────────
  async ensureSchema() {
    try {
      await this.pool.query(`
        ALTER TABLE media_projects ADD COLUMN IF NOT EXISTS brand_id INTEGER;
        CREATE TABLE IF NOT EXISTS media_brand_memory (
          brand_id    INTEGER PRIMARY KEY,
          memory_json JSONB NOT NULL,
          updated_at  TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS media_feedback (
          id          SERIAL PRIMARY KEY,
          project_id  INTEGER,
          asset_id    INTEGER,
          feedback_text TEXT,
          changes_json  JSONB,
          created_at  TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS media_asset_performance (
          id          SERIAL PRIMARY KEY,
          asset_id    INTEGER,
          platform    VARCHAR(50),
          metric      VARCHAR(50),
          value       NUMERIC,
          recorded_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(asset_id, platform, metric)
        );
      `);
    } catch (err) {
      // Non-fatal — tables may already exist
      if (!err.message.includes('already exists')) {
        console.warn(`[${this.name}] Schema update warning:`, err.message);
      }
    }
  }
}

module.exports = BrandHistoryAgent;
