// AssetLibrarianAgent
// Manages the agency's growing asset library:
//  - Auto-tags generated images/videos with semantic labels
//  - Enables search by style, brand, format, or visual description
//  - Tracks asset lineage: which prompt + workflow + seed produced it
//  - Supports "find similar" queries to reuse existing assets
// Model: Claude Haiku (fast tagging) + DeepSeek (semantic search)

const deepseekService = require('../../../services/deepseekService');
const { shouldUseDeepSeek, getClaudeModel } = require('../../../utils/modelHelper');

class AssetLibrarianAgent {
  constructor(anthropic, pool) {
    this.anthropic = anthropic;
    this.pool = pool;
    this.name = 'AssetLibrarianAgent';
  }

  // ── Auto-tag an asset ─────────────────────────────────────────────────────
  async tagAsset(assetId, context) {
    // context: { type, url, prompt, styleGuide, briefSpec }
    const systemPrompt = `You are a digital asset librarian for an AI creative agency.
Given information about a generated image or video, create a comprehensive tag set for the asset library.
Return ONLY JSON:
{
  "primaryTags": ["string — main subject/theme tags, max 5"],
  "styleTags": ["string — visual style, aesthetic, medium"],
  "technicalTags": ["string — format, resolution, model used"],
  "brandTags": ["string — client brand, campaign"],
  "channelTags": ["string — intended channel: ig_post, tiktok, key_visual, etc."],
  "moodTags": ["string — mood, tone, emotional quality"],
  "colorTags": ["string — dominant colours in plain english"],
  "searchKeywords": ["string — 8-12 additional search terms"],
  "reuseScore": number,
  "reuseNotes": "string — when this asset can be repurposed"
}`;

    const userContent = `Asset type: ${context.type}
Prompt used: ${context.prompt?.positive || 'N/A'}
Style guide tokens: ${context.styleGuide?.styleTokenBlock || 'N/A'}
Campaign: ${context.briefSpec?.projectName || 'N/A'}
Brand: ${context.briefSpec?.brand?.name || 'N/A'}
Format: ${context.briefSpec?.deliverables?.[0]?.format || 'N/A'}`;

    try {
      let rawJson;
      if (shouldUseDeepSeek('deepseek')) {
        const resp = await deepseekService.chat([
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ]);
        rawJson = resp.content;
      } else {
        const resp = await this.anthropic.messages.create({
          model: getClaudeModel('haiku'),
          max_tokens: 512,
          system: systemPrompt,
          messages: [{ role: 'user', content: userContent }],
        });
        rawJson = resp.content[0].text;
      }
      const cleaned = rawJson.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const tags = JSON.parse(cleaned);

      await this.pool.query(
        `UPDATE media_assets SET tags_json = $1, updated_at = NOW() WHERE id = $2`,
        [JSON.stringify(tags), assetId]
      );

      return tags;
    } catch (err) {
      console.error(`[${this.name}] Tagging failed:`, err.message);
      return { primaryTags: [], styleTags: [], searchKeywords: [] };
    }
  }

  // ── Search asset library ──────────────────────────────────────────────────
  async searchAssets({ query, brandId, type, channel, limit = 20 }) {
    const conditions = [];
    const params = [];

    if (type) {
      conditions.push(`a.type = $${params.length + 1}`);
      params.push(type);
    }
    if (brandId) {
      conditions.push(`p.brand_id = $${params.length + 1}`);
      params.push(brandId);
    }
    if (channel) {
      conditions.push(`a.tags_json->>'channelTags' ILIKE $${params.length + 1}`);
      params.push(`%${channel}%`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await this.pool.query(
      `SELECT a.*, p.name AS project_name, p.client
       FROM media_assets a
       LEFT JOIN media_projects p ON p.id = a.project_id
       ${whereClause}
       ORDER BY a.created_at DESC
       LIMIT $${params.length + 1}`,
      [...params, limit]
    );

    let assets = result.rows;

    // If we have a text query, use LLM to rank by relevance
    if (query && assets.length > 0) {
      assets = await this._rankByRelevance(query, assets);
    }

    return assets;
  }

  // ── Semantic ranking via LLM ──────────────────────────────────────────────
  async _rankByRelevance(query, assets) {
    const systemPrompt = `You are an asset librarian. Given a search query and a list of asset summaries,
rank the asset IDs by relevance. Return ONLY a JSON array of asset IDs in order of relevance:
[id1, id2, id3, ...]`;

    const assetSummaries = assets.map(a => ({
      id: a.id,
      type: a.type,
      tags: a.tags_json,
      project: a.project_name,
    }));

    try {
      let rawJson;
      const messages = [{ role: 'user', content: `Query: "${query}"\n\nAssets:\n${JSON.stringify(assetSummaries, null, 2)}` }];
      if (shouldUseDeepSeek('deepseek')) {
        const resp = await deepseekService.chat([
          { role: 'system', content: systemPrompt },
          ...messages,
        ]);
        rawJson = resp.content;
      } else {
        const resp = await this.anthropic.messages.create({
          model: getClaudeModel('haiku'),
          max_tokens: 256,
          system: systemPrompt,
          messages,
        });
        rawJson = resp.content[0].text;
      }
      const cleaned = rawJson.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const rankedIds = JSON.parse(cleaned);
      const idToAsset = Object.fromEntries(assets.map(a => [a.id, a]));
      return rankedIds.map((id) => idToAsset[id]).filter(Boolean);
    } catch {
      return assets; // fallback to original order
    }
  }

  // ── Get asset lineage (which prompt/workflow produced it) ─────────────────
  async getAssetLineage(assetId) {
    const result = await this.pool.query(
      `SELECT a.*,
              p.name AS project_name, p.client, p.brief_spec_json,
              pr.prompt_json, pr.image_workflow_json, pr.video_workflow_json, pr.version
       FROM media_assets a
       LEFT JOIN media_projects p ON p.id = a.project_id
       LEFT JOIN media_prompts pr ON pr.id = a.prompt_id
       WHERE a.id = $1`,
      [assetId]
    );
    return result.rows[0] || null;
  }

  // ── Get performance data for learning loop ────────────────────────────────
  async recordPerformance(assetId, { platform, metric, value }) {
    // metric: 'likes', 'views', 'ctr', 'view_through_rate', 'ab_winner'
    await this.pool.query(
      `INSERT INTO media_asset_performance
         (asset_id, platform, metric, value, recorded_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (asset_id, platform, metric)
       DO UPDATE SET value = $4, recorded_at = NOW()`,
      [assetId, platform, metric, value]
    );
  }

  // ── Analyse performance patterns for prompt improvement ──────────────────
  async analysePerformance(projectId) {
    const systemPrompt = `You are a performance analyst for an AI creative agency.
Given performance data from published social media assets, identify:
1. Which visual styles / prompt patterns correlate with high engagement
2. Which LoRA / style tokens should be prioritised in future briefs
3. Which formats/channels are underperforming
4. Concrete prompt template updates to improve next cycle

Return JSON:
{
  "topPerformingPatterns": ["string"],
  "underperformingPatterns": ["string"],
  "promptUpdates": ["string — actionable change to prompt template"],
  "loraRecommendations": ["string — keep/retire/increase weight"],
  "channelInsights": {"channel": "insight"},
  "learningNotes": "string"
}`;

    const perfResult = await this.pool.query(
      `SELECT a.id, a.type, a.tags_json, ap.platform, ap.metric, ap.value
       FROM media_assets a
       JOIN media_asset_performance ap ON ap.asset_id = a.id
       WHERE a.project_id = $1
       ORDER BY ap.recorded_at DESC`,
      [projectId]
    );

    if (!perfResult.rows.length) {
      return { learningNotes: 'No performance data recorded yet.' };
    }

    try {
      let rawJson;
      const messages = [{ role: 'user', content: JSON.stringify(perfResult.rows, null, 2) }];
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
      return JSON.parse(cleaned);
    } catch (err) {
      return { learningNotes: `Analysis failed: ${err.message}` };
    }
  }
}

module.exports = AssetLibrarianAgent;
