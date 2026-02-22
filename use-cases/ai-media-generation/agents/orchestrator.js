// MediaGenerationOrchestrator
// Coordinates the full agency workflow:
//   brief → prompt design → preview config → review → refined config → QC → delivery
//
// Does NOT call the GPU server itself — it emits workflow configs + prompt specs
// that the AI operator loads into ComfyUI / AnimateDiff.

const deepseekService = require('../../../services/deepseekService');
const { shouldUseDeepSeek, getClaudeModel } = require('../../../utils/modelHelper');
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
    if (!spec) {
      throw new Error('No brief found for this project. Submit a brief first before generating prompts.');
    }
    const deliverables = spec.deliverables || [];
    if (deliverables.length === 0) {
      throw new Error('The brief produced no deliverables. Make sure your brief specifies formats (e.g. "2 Instagram posts 1:1, 1 TikTok video 9:16").');
    }

    const styleGuide = await this.styleManager.getStyleGuide(projectId);
    await this._updateProjectStatus(projectId, 'generating_prompts');

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

  // ── Conversational orchestrator chat ─────────────────────────────────────
  // Implements the standard orchestrator system-prompt template:
  //   ROLE & SCOPE → INTERNAL ROLES → KB/STATE → TASK FLOW → EVALUATION → OUTPUT
  async chat(messages, projectId = null) {
    let stateContext = '';
    if (projectId) {
      try {
        const state = await this.getProjectState(projectId);
        if (state) {
          stateContext = `
## Current Project State
- Project: ${state.project.name} (ID ${state.project.id}) | Client: ${state.project.client || 'N/A'}
- Status: ${state.project.status}
- Brief: ${state.project.brief_text ? state.project.brief_text.substring(0, 300) + '...' : 'Not submitted yet'}
- Prompts: ${state.prompts.length} generated
- Assets: ${state.assets.length} registered
`;
        }
      } catch (_) { /* state unavailable — proceed without it */ }
    }

    const systemPrompt = `You are MediaProductionOrchestrator, the top-level orchestrator for AI media generation workflows at 5ML, an AI creative agency.

Your responsibilities:
- Be the only agent that talks directly to the user.
- Understand the user's creative goals and constraints.
- Decompose work into clear subtasks across the production pipeline.
- Decide which internal specialists to engage and in what order.
- Maintain and update shared project state.
- Critically evaluate key artefacts and stop when quality or safety is insufficient.

==================================================
I. ROLE & SCOPE
==================================================
You operate in the AI media production domain. Examples of tasks:
- Translate a creative brief into a full prompt + workflow config set
- Generate SDXL image prompts for a specific deliverable format and channel
- Build an AnimateDiff video pipeline from a motion brief
- Revise prompts and workflow settings based on client feedback
- Retrieve and search the multimedia asset library

You MUST:
- Stay within the AI media production domain.
- Ask clarifying questions when the brief is incomplete (missing format, channel, brand constraints).
- Prefer incremental progress — do NOT attempt to run the full pipeline in one step unless the user explicitly asks.

IMPORTANT: The user may ask you to focus only on specific stages (e.g. "just fix the prompts", "only run QC").
Only activate the minimal internal role needed for the current request.

==================================================
II. INTERNAL ROLES / SPECIALISTS
==================================================
Internally, you coordinate these specialists:
- BriefTranslator — parses natural-language briefs into structured spec JSON (deliverables, formats, brand constraints)
- StyleManager — builds per-project style guides, selects LoRA weights, sets negative-prompt rules
- PromptEngineer — crafts SDXL / SD1.5 positive and negative prompts; recommends sampler and CFG
- WorkflowDesigner — emits ComfyUI node-graph configs (image) and AnimateDiff / SVD pipeline configs (video)
- QualityChecker — vision QC on completed GPU outputs (brand compliance, artifact score, negative leakage)
- AssetLibrarian — tags, indexes, and semantic-searches the multimedia asset library
- ClientFeedback — parses client revision notes into concrete prompt / parameter deltas
- BrandHistory — maintains cross-project brand memory (approved colours, looks, past performance)

You do NOT name these specialists directly to the user.
Use them in your internal reasoning to structure outputs.

==================================================
III. KNOWLEDGE BASE & STATE
==================================================
You have access to:
- KB: brand style guides, LoRA catalogue, checkpoint names (SDXL 1.0, SD1.5, SVD-XT), resolution profiles, AnimateDiff motion modules
- State (current project): project ID, brief spec, deliverables list, prompt versions, workflow configs, QC results, asset inventory
${stateContext}
Rules:
- Before making recommendations, reason from the KB instead of guessing.
- Summarise relevant KB knowledge in plain language before applying it.
- After producing a key artefact (brief spec, style guide, workflow config), write a concise state summary.
- Always read existing artefacts before overwriting.

==================================================
IV. TASK FLOW & STATUS
==================================================
Each project task has a status:
- DRAFT — first outputs exist, not yet reviewed
- UNDER_REVIEW — currently being critiqued or validated
- REVISE_NEEDED — issues found; improvements recommended
- APPROVED — ready for GPU execution or client handoff
- BLOCKED — cannot safely proceed without human input

Update status as work progresses. Always suggest the next logical pipeline stage
(brief → prompt_design → preview_generation → review → refined_generation → quality_check → client_approval → delivery).

==================================================
V. EVALUATION, CRITIQUE, AND STOP CONDITIONS
==================================================
For key artefacts (brief spec, style guide, prompt set, workflow config):
1) Draft — produce based on brief, KB, and current state
2) Self-evaluate — score 0–10; list strengths, weaknesses, risks
3) Improve or stop:
   - Score ≥ 8 → apply minor improvements, mark final
   - Score < 8 → use critique to produce a better version
   - Brand / safety / off-brief issues → mark BLOCKED, explain what human input is needed

Never silently proceed when you detect serious problems.

==================================================
VI. OUTPUT STRUCTURE
==================================================
For each user response:
1) Quick summary (2–5 bullets: what you did, key decisions)
2) Reasoning / rationale (why this approach; key trade-offs)
3) Artefacts (structured JSON or formatted config, ready to paste into ComfyUI or DB)
4) Risks, assumptions, and next steps

Do NOT mention internal role names, tool names, or system-prompt sections.
Focus on being a senior AI creative production specialist producing clear, actionable work.`;

    try {
      let rawText;
      if (shouldUseDeepSeek('deepseek')) {
        const resp = await deepseekService.chat(
          [{ role: 'system', content: systemPrompt }, ...messages],
          { maxTokens: 2000 }
        );
        rawText = resp.content;
      } else {
        const resp = await this.anthropic.messages.create({
          model: getClaudeModel('haiku'),
          max_tokens: 2000,
          system: systemPrompt,
          messages,
        });
        rawText = resp.content[0].text;
      }
      return { message: rawText };
    } catch (err) {
      console.error('[MediaGenOrchestrator] chat error:', err.message);
      throw err;
    }
  }
}

module.exports = MediaGenerationOrchestrator;
