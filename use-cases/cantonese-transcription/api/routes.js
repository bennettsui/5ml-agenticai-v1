// ─────────────────────────────────────────────────────────────────────────────
// Cantonese Transcription & Analysis — Express API Routes
// Base path: /api/cantonese-transcription
// ─────────────────────────────────────────────────────────────────────────────

const express    = require('express');
const Anthropic  = require('@anthropic-ai/sdk');
const deepseekService = require('../../../services/deepseekService');
const db         = require('./db');

const router = express.Router();

const VALID_TASKS = ['clean_transcript', 'meeting_minutes', 'summary_zh', 'summary_en', 'action_items'];

// ── System prompt ────────────────────────────────────────────────────────────
const CANTONESE_SYSTEM_PROMPT = `You are an expert Cantonese speech transcription and analysis assistant.

Context:
- Upstream, a Whisper v3 Cantonese ASR model (khleeloo/whisper-large-v3-cantonese) converts raw audio into text.
- The ASR output may contain:
  - Colloquial Cantonese, 粵語口語字（例：「佢哋」、「冇」、「嗰啲」、「噉」）
  - Mixed Chinese-English code-switching
  - Minor recognition errors, duplicated words, or incomplete sentences
- You never have access to raw audio, only to the ASR transcript and optional word/segment timestamps.

Your jobs:
1. Never try to "re‑transcribe" from imagination.
   - Treat the ASR transcript as the only ground truth of what was said.
   - You may fix obvious ASR glitches (repeated characters, broken words), but you must not invent new content.

2. Preserve Cantonese style unless explicitly asked to "標準書面中文" or "English".
   - Default: keep spoken Cantonese tone, but correct very obvious recognition mistakes.
   - When user asks for:
     - 「轉做書面中文」: rewrite into formal written Chinese, keep meaning intact.
     - 「英文摘要」: produce a concise English summary, not a literal translation.
     - 「逐字稿」: keep as close to original wording as possible, only clean glitches.

3. Robustness to code-switching:
   - Keep English terms as-is if they are business / technical jargon.
   - If meaning is ambiguous, prefer to keep original wording with a short clarification in brackets.

4. For all structured outputs (meeting notes, action items, etc.):
   - Use clear sections and bullet points.
   - Include speaker labels if provided in the input metadata.
   - If timestamps are provided, you may keep one representative timestamp per bullet (start time).

5. Safety and fidelity:
   - If the transcript is clearly incomplete or corrupted, clearly state that limitations exist.
   - If you are not sure about a detail, avoid hallucinating; say it is unclear from the transcript.

Output style:
- Be concise and information‑dense.
- When the user works in Cantonese, respond mainly in written Chinese (Traditional) and keep some Cantonese flavour when appropriate.
- When the user requests English, respond in clear, professional English.

You must:
- First, restate briefly what you will do in one sentence (in the user's language).
- Then perform exactly the requested task, nothing more.`;

const TASK_PROMPTS = {
  clean_transcript: '請幫我清理以下粵語逐字稿，修正明顯的ASR錯誤，保留粵語口語風格。',
  meeting_minutes:  '請根據以下逐字稿，整理成正式會議紀要，包括討論重點和決定事項。',
  summary_zh:       '請用書面中文寫一份簡潔摘要，概括以下逐字稿的核心內容。',
  summary_en:       'Please write a concise English summary of the following transcript.',
  action_items:     '請從以下逐字稿中提取所有待辦事項和行動項目，列出負責人（如有提及）和截止日期（如有提及）。',
};

// ── Helper: format seconds → MM:SS ───────────────────────────────────────────
function formatTime(seconds) {
  if (typeof seconds !== 'number') return '?';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/cantonese-transcription/analyze
// ─────────────────────────────────────────────────────────────────────────────
router.post('/analyze', async (req, res) => {
  const startTime = Date.now();
  let job = null;

  const {
    transcript,
    segments = [],
    task = 'clean_transcript',
    extra_instructions = '',
    model = 'haiku',
  } = req.body;

  // ── Input validation ────────────────────────────────────────────────────
  if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
    await db.logError({
      errorCode: db.ERROR_CODES.CT_001,
      errorMessage: db.ERROR_MESSAGES['CT-001'],
      context: { task, model },
    });
    return res.status(400).json({
      ok: false,
      error_code: 'CT-001',
      error: db.ERROR_MESSAGES['CT-001'],
    });
  }

  if (transcript.trim().length < 10) {
    await db.logError({
      errorCode: db.ERROR_CODES.CT_002,
      errorMessage: db.ERROR_MESSAGES['CT-002'],
      context: { char_count: transcript.length },
    });
    return res.status(400).json({
      ok: false,
      error_code: 'CT-002',
      error: db.ERROR_MESSAGES['CT-002'],
    });
  }

  if (!VALID_TASKS.includes(task)) {
    await db.logError({
      errorCode: db.ERROR_CODES.CT_003,
      errorMessage: db.ERROR_MESSAGES['CT-003'],
      context: { task },
    });
    return res.status(400).json({
      ok: false,
      error_code: 'CT-003',
      error: db.ERROR_MESSAGES['CT-003'],
    });
  }

  // Validate segments if provided
  let parsedSegments = [];
  if (segments && segments.length > 0) {
    try {
      parsedSegments = Array.isArray(segments) ? segments : JSON.parse(segments);
    } catch {
      await db.logError({
        errorCode: db.ERROR_CODES.CT_009,
        errorMessage: db.ERROR_MESSAGES['CT-009'],
        context: { segments_type: typeof segments },
      });
      return res.status(400).json({
        ok: false,
        error_code: 'CT-009',
        error: db.ERROR_MESSAGES['CT-009'],
      });
    }
  }

  // ── Create job record ───────────────────────────────────────────────────
  try {
    job = await db.createJob({
      transcript: transcript.trim(),
      segments: parsedSegments.length > 0 ? parsedSegments : null,
      task,
      model,
      extra_instructions: extra_instructions.trim() || null,
    });
  } catch (err) {
    console.error('[ct-routes] DB createJob error:', err.message);
    await db.logError({
      errorCode: db.ERROR_CODES.CT_006,
      errorMessage: db.ERROR_MESSAGES['CT-006'],
      context: { detail: err.message },
    });
    return res.status(500).json({
      ok: false,
      error_code: 'CT-006',
      error: db.ERROR_MESSAGES['CT-006'],
    });
  }

  // ── Build AI prompt ─────────────────────────────────────────────────────
  const taskInstruction = TASK_PROMPTS[task] || extra_instructions || '請處理以下逐字稿。';
  let userContent = `${taskInstruction}\n\n`;
  if (extra_instructions.trim()) {
    userContent += `Additional instructions: ${extra_instructions.trim()}\n\n`;
  }
  userContent += `**Transcript:**\n${transcript.trim()}`;

  if (parsedSegments.length > 0) {
    const segText = parsedSegments
      .map(s => `[${formatTime(s.start)} → ${formatTime(s.end)}] ${s.text}`)
      .join('\n');
    userContent += `\n\n**Segments with timestamps:**\n${segText}`;
  }

  // ── Call AI model ───────────────────────────────────────────────────────
  let resultText;
  let modelUsed;

  try {
    if (model === 'deepseek' && deepseekService.isAvailable()) {
      const result = await deepseekService.analyze(CANTONESE_SYSTEM_PROMPT, userContent, {
        model: 'deepseek-chat',
        maxTokens: 4000,
        temperature: 0.3,
      });
      resultText = result.content;
      modelUsed = 'deepseek-chat';
    } else {
      if (!process.env.ANTHROPIC_API_KEY) {
        throw Object.assign(new Error(db.ERROR_MESSAGES['CT-004']), { code: 'CT-004' });
      }
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const claudeModel = model === 'sonnet'
        ? 'claude-sonnet-4-6'
        : 'claude-haiku-4-5-20251001';

      const message = await anthropic.messages.create({
        model: claudeModel,
        max_tokens: 4000,
        system: CANTONESE_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userContent }],
      });
      resultText = message.content[0].text;
      modelUsed = claudeModel;
    }
  } catch (err) {
    const isRateLimit = err.status === 429 || err.message?.includes('rate');
    const errorCode = err.code === 'CT-004' ? 'CT-004' : isRateLimit ? 'CT-010' : 'CT-005';

    console.error(`[ct-routes] AI error (${errorCode}):`, err.message);
    await db.updateJobStatus(job.job_id, 'error');
    await db.logError({
      jobId: job.job_id,
      errorCode,
      errorMessage: db.ERROR_MESSAGES[errorCode] || err.message,
      context: { model, task, http_status: err.status, detail: err.message },
    });

    return res.status(err.status === 429 ? 429 : 502).json({
      ok: false,
      job_id: job.job_id,
      error_code: errorCode,
      error: db.ERROR_MESSAGES[errorCode] || err.message,
    });
  }

  // ── Save result ─────────────────────────────────────────────────────────
  const durationMs = Date.now() - startTime;
  try {
    await db.saveResult({
      jobId: job.job_id,
      resultText,
      modelUsed,
      durationMs,
    });
    await db.updateJobStatus(job.job_id, 'done');
  } catch (err) {
    console.error('[ct-routes] DB saveResult error:', err.message);
    await db.logError({
      jobId: job.job_id,
      errorCode: db.ERROR_CODES.CT_006,
      errorMessage: db.ERROR_MESSAGES['CT-006'],
      context: { detail: err.message, phase: 'save_result' },
    });
    // Still return the result even if DB save fails
  }

  return res.json({
    ok: true,
    job_id: job.job_id,
    task,
    result: resultText,
    model: modelUsed,
    duration_ms: durationMs,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/cantonese-transcription/jobs
// ─────────────────────────────────────────────────────────────────────────────
router.get('/jobs', async (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit  || '50', 10), 200);
    const offset = parseInt(req.query.offset || '0', 10);
    const jobs   = await db.listJobs({ limit, offset });
    return res.json({ ok: true, jobs });
  } catch (err) {
    console.error('[ct-routes] listJobs error:', err.message);
    return res.status(500).json({
      ok: false,
      error_code: 'CT-007',
      error: db.ERROR_MESSAGES['CT-007'],
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/cantonese-transcription/jobs/:jobId
// ─────────────────────────────────────────────────────────────────────────────
router.get('/jobs/:jobId', async (req, res) => {
  try {
    const job = await db.getJob(req.params.jobId);
    if (!job) return res.status(404).json({ ok: false, error: 'Job not found' });
    return res.json({ ok: true, job });
  } catch (err) {
    console.error('[ct-routes] getJob error:', err.message);
    return res.status(500).json({
      ok: false,
      error_code: 'CT-007',
      error: db.ERROR_MESSAGES['CT-007'],
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/cantonese-transcription/errors
// ─────────────────────────────────────────────────────────────────────────────
router.get('/errors', async (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit  || '100', 10), 500);
    const offset = parseInt(req.query.offset || '0', 10);
    const logs   = await db.listErrorLogs({ limit, offset });
    return res.json({ ok: true, logs });
  } catch (err) {
    console.error('[ct-routes] listErrors error:', err.message);
    return res.status(500).json({
      ok: false,
      error_code: 'CT-007',
      error: db.ERROR_MESSAGES['CT-007'],
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/cantonese-transcription/stats
// ─────────────────────────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const stats = await db.getStats();
    return res.json({ ok: true, stats });
  } catch (err) {
    console.error('[ct-routes] stats error:', err.message);
    return res.status(500).json({
      ok: false,
      error_code: 'CT-007',
      error: db.ERROR_MESSAGES['CT-007'],
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/cantonese-transcription/error-codes
// Returns the full error code reference table
// ─────────────────────────────────────────────────────────────────────────────
router.get('/error-codes', (_req, res) => {
  const table = Object.entries(db.ERROR_MESSAGES).map(([code, message]) => ({
    code,
    message,
  }));
  return res.json({ ok: true, error_codes: table });
});

module.exports = { router, initDb: db.init };
