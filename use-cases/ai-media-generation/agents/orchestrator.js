// MediaGenerationOrchestrator
// Coordinates the full agency workflow:
//   brief → prompt design → preview config → review → refined config → QC → delivery
//
// Does NOT call the GPU server itself — it emits workflow configs + prompt specs
// that the AI operator loads into ComfyUI / AnimateDiff.

const BriefTranslatorAgent = require('./brief-translator');
const PromptEngineerAgent = require('./prompt-engineer');
const StyleManagerAgent = require('./style-manager');
const WorkflowDesignerAgent = require('./workflow-designer');
const QualityCheckerAgent = require('./quality-checker');
const AssetLibrarianAgent = require('./asset-librarian');
const ClientFeedbackAgent = require('./client-feedback');
const BrandHistoryAgent = require('./brand-history');

class MediaGenerationOrchestrator {
  constructor({ pool, anthropic }) {
    this.pool = pool;
    this.anthropic = anthropic;
    this.briefTranslator = new BriefTranslatorAgent(anthropic);
    this.promptEngineer = new PromptEngineerAgent(anthropic);
    this.styleManager = new StyleManagerAgent(anthropic, pool);
    this.workflowDesigner = new WorkflowDesignerAgent(anthropic);
    this.qualityChecker = new QualityCheckerAgent(anthropic);
    this.assetLibrarian = new AssetLibrarianAgent(anthropic, pool);
    this.clientFeedback = new ClientFeedbackAgent(anthropic, pool);
    this.brandHistory = new BrandHistoryAgent(anthropic, pool);
  }

  async ensureExtendedSchema() {
    await this.brandHistory.ensureSchema();
  }

  // ── 1. Create project ─────────────────────────────────────────────────────
  async createProject({ name, client, notes }) {
    const result = await this.pool.query(
      `INSERT INTO media_projects (name, client, notes, status, created_at, updated_at)
       VALUES ($1, $2, $3, 'brief_pending', NOW(), NOW())
       RETURNING *`,
      [name, client, notes || null]
    );
    return result.rows[0];
  }

  // ── 2. Submit brief → translate → build style guide ───────────────────────
  async submitBrief(projectId, briefText) {
    await this._updateProjectStatus(projectId, 'translating_brief');

    const spec = await this.briefTranslator.translate(briefText);

    await this.pool.query(
      `UPDATE media_projects SET brief_text = $1, brief_spec_json = $2,
         status = 'building_style_guide', updated_at = NOW()
       WHERE id = $3`,
      [briefText, JSON.stringify(spec), projectId]
    );

    const styleGuide = await this.styleManager.buildStyleGuide(projectId, spec);

    await this.pool.query(
      `UPDATE media_projects SET status = 'prompt_design', updated_at = NOW()
       WHERE id = $1`,
      [projectId]
    );

    return { spec, styleGuide };
  }

  // ── 3. Generate prompts + workflow config for each deliverable ────────────
  async generatePrompts(projectId) {
    const project = await this._getProject(projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);

    const spec = project.brief_spec_json;
    const styleGuide = await this.styleManager.getStyleGuide(projectId);

    await this._updateProjectStatus(projectId, 'generating_prompts');

    const deliverables = spec.deliverables || [];
    const results = [];

    for (const deliverable of deliverables) {
      // Build image prompt
      const imagePrompt = await this.promptEngineer.buildImagePrompt({
        ...spec,
        deliverable,
      });

      // Apply style guide tokens
      imagePrompt.positive = this.styleManager.applyStyleGuide(
        imagePrompt,
        styleGuide,
        deliverable.format
      );

      // Prompt QC
      const promptQc = await this.qualityChecker.checkPromptQuality(imagePrompt, spec);

      // Build image workflow config
      const previewWorkflow = this.workflowDesigner.buildImageWorkflow({
        spec, imagePrompt, styleGuide, pass: 'preview',
      });

      let videoPrompt = null;
      let videoWorkflow = null;

      if (deliverable.type === 'video') {
        videoPrompt = await this.promptEngineer.buildVideoPrompt({ ...spec, deliverable }, imagePrompt);
        videoWorkflow = this.workflowDesigner.buildVideoWorkflow({ spec, imageWorkflow: previewWorkflow, videoPrompt });
      }

      // Persist prompt record
      const promptEntry = await this.promptEngineer.buildPromptLibraryEntry(
        project.name?.replace(/\s+/g, '_').toUpperCase().substring(0, 8) || 'PROJ',
        deliverable,
        imagePrompt,
        videoPrompt
      );

      await this.pool.query(
        `INSERT INTO media_prompts
           (project_id, deliverable_type, format, prompt_json, image_workflow_json, video_workflow_json, qc_json, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft', NOW())`,
        [
          projectId,
          deliverable.type,
          deliverable.format,
          JSON.stringify(promptEntry),
          JSON.stringify(previewWorkflow),
          videoWorkflow ? JSON.stringify(videoWorkflow) : null,
          JSON.stringify(promptQc),
        ]
      );

      results.push({
        deliverable,
        imagePrompt,
        videoPrompt,
        previewWorkflow,
        videoWorkflow,
        promptQc,
      });
    }

    await this._updateProjectStatus(projectId, 'prompts_ready');
    return results;
  }

  // ── 4. Get full project state for dashboard ───────────────────────────────
  async getProjectState(projectId) {
    const project = await this._getProject(projectId);
    if (!project) return null;

    const promptsResult = await this.pool.query(
      `SELECT * FROM media_prompts WHERE project_id = $1 ORDER BY created_at ASC`,
      [projectId]
    );
    const assetsResult = await this.pool.query(
      `SELECT * FROM media_assets WHERE project_id = $1 ORDER BY created_at DESC`,
      [projectId]
    );

    return {
      project,
      prompts: promptsResult.rows,
      assets: assetsResult.rows,
    };
  }

  // ── 5. Register an asset (operator uploads completed GPU output) ──────────
  async registerAsset(projectId, { promptId, type, url, metadata }) {
    const result = await this.pool.query(
      `INSERT INTO media_assets
         (project_id, prompt_id, type, url, metadata_json, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'pending_review', NOW())
       RETURNING *`,
      [projectId, promptId || null, type, url, JSON.stringify(metadata || {})]
    );
    return result.rows[0];
  }

  // ── 6. Run QC on a registered asset ──────────────────────────────────────
  async runAssetQc(assetId, projectId) {
    const assetResult = await this.pool.query(
      'SELECT * FROM media_assets WHERE id = $1 AND project_id = $2',
      [assetId, projectId]
    );
    if (!assetResult.rows.length) throw new Error('Asset not found');
    const asset = assetResult.rows[0];

    const project = await this._getProject(projectId);
    const spec = project?.brief_spec_json;

    let qcResult;
    if (asset.type === 'image' && asset.url) {
      qcResult = await this.qualityChecker.checkImageOutput(asset.url, spec, null);
    } else {
      qcResult = { approved: true, issues: [], revisionNotes: 'Manual review required for video assets.' };
    }

    const checklist = this.qualityChecker.buildDeliveryChecklist(asset.type);

    await this.pool.query(
      `UPDATE media_assets SET qc_json = $1, status = $2, updated_at = NOW()
       WHERE id = $3`,
      [
        JSON.stringify({ ...qcResult, checklist }),
        qcResult.approved ? 'approved' : 'needs_revision',
        assetId,
      ]
    );

    return { qcResult, checklist };
  }

  // ─── Internal helpers ─────────────────────────────────────────────────────
  async _getProject(projectId) {
    const result = await this.pool.query(
      'SELECT * FROM media_projects WHERE id = $1',
      [projectId]
    );
    return result.rows[0] || null;
  }

  async _updateProjectStatus(projectId, status) {
    await this.pool.query(
      'UPDATE media_projects SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, projectId]
    );
  }
}

module.exports = MediaGenerationOrchestrator;
