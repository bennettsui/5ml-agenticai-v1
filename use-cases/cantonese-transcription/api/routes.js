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

// ── Helper: emit SSE event ────────────────────────────────────────────────────
function emit(res, data) {
  try { res.write(`data: ${JSON.stringify(data)}\n\n`); } catch (_) {}
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/cantonese-transcription/analyze  (SSE streaming)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/analyze', async (req, res) => {
  const startTime = Date.now();

  // ── Set up SSE ─────────────────────────────────────────────────────────
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const {
    transcript,
    segments = [],
    task = 'clean_transcript',
    extra_instructions = '',
    model = 'haiku',
  } = req.body;

  // ── Step 1: validate input ─────────────────────────────────────────────
  emit(res, { type: 'step', step: 'validating', label: '驗證輸入中…' });

  if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
    await db.logError({ errorCode: db.ERROR_CODES.CT_001, errorMessage: db.ERROR_MESSAGES['CT-001'], context: { task, model } });
    emit(res, { type: 'error', error_code: 'CT-001', error: db.ERROR_MESSAGES['CT-001'] });
    return res.end();
  }
  if (transcript.trim().length < 10) {
    await db.logError({ errorCode: db.ERROR_CODES.CT_002, errorMessage: db.ERROR_MESSAGES['CT-002'], context: { char_count: transcript.length } });
    emit(res, { type: 'error', error_code: 'CT-002', error: db.ERROR_MESSAGES['CT-002'] });
    return res.end();
  }
  if (!VALID_TASKS.includes(task)) {
    await db.logError({ errorCode: db.ERROR_CODES.CT_003, errorMessage: db.ERROR_MESSAGES['CT-003'], context: { task } });
    emit(res, { type: 'error', error_code: 'CT-003', error: db.ERROR_MESSAGES['CT-003'] });
    return res.end();
  }

  let parsedSegments = [];
  if (segments && segments.length > 0) {
    try {
      parsedSegments = Array.isArray(segments) ? segments : JSON.parse(segments);
    } catch {
      await db.logError({ errorCode: db.ERROR_CODES.CT_009, errorMessage: db.ERROR_MESSAGES['CT-009'], context: { segments_type: typeof segments } });
      emit(res, { type: 'error', error_code: 'CT-009', error: db.ERROR_MESSAGES['CT-009'] });
      return res.end();
    }
  }

  // ── Step 2: create DB job ──────────────────────────────────────────────
  emit(res, { type: 'step', step: 'creating_job', label: '建立分析任務…' });

  let job;
  try {
    job = await db.createJob({
      transcript: transcript.trim(),
      segments: parsedSegments.length > 0 ? parsedSegments : null,
      task,
      model,
      extra_instructions: extra_instructions.trim() || null,
    });
    emit(res, { type: 'job_created', job_id: job.job_id });
  } catch (err) {
    console.error('[ct-routes] DB createJob error:', err.message);
    await db.logError({ errorCode: db.ERROR_CODES.CT_006, errorMessage: db.ERROR_MESSAGES['CT-006'], context: { detail: err.message } });
    emit(res, { type: 'error', error_code: 'CT-006', error: db.ERROR_MESSAGES['CT-006'] });
    return res.end();
  }

  // ── Build prompt ───────────────────────────────────────────────────────
  const taskInstruction = TASK_PROMPTS[task] || extra_instructions || '請處理以下逐字稿。';
  let userContent = `${taskInstruction}\n\n`;
  if (extra_instructions.trim()) userContent += `Additional instructions: ${extra_instructions.trim()}\n\n`;
  userContent += `**Transcript:**\n${transcript.trim()}`;
  if (parsedSegments.length > 0) {
    const segText = parsedSegments.map(s => `[${formatTime(s.start)} → ${formatTime(s.end)}] ${s.text}`).join('\n');
    userContent += `\n\n**Segments with timestamps:**\n${segText}`;
  }

  // ── Step 3: call AI model (streaming) ─────────────────────────────────
  const modelLabel = model === 'deepseek' ? 'DeepSeek Chat' : model === 'sonnet' ? 'Claude Sonnet 4.6' : 'Claude Haiku 4.5';
  emit(res, { type: 'step', step: 'calling_ai', label: `呼叫 ${modelLabel}…`, model: modelLabel });

  let fullText = '';
  let modelUsed = '';

  try {
    if (model === 'deepseek' && deepseekService.isAvailable()) {
      // DeepSeek: no streaming SDK — emit progress, then single call
      emit(res, { type: 'step', step: 'streaming', label: 'DeepSeek 生成中…' });
      const result = await deepseekService.analyze(CANTONESE_SYSTEM_PROMPT, userContent, {
        model: 'deepseek-chat',
        maxTokens: 4000,
        temperature: 0.3,
      });
      fullText = result.content;
      modelUsed = 'deepseek-chat';
      // Emit the whole text as a single token event (no native streaming)
      emit(res, { type: 'token', text: fullText });
    } else {
      if (!process.env.ANTHROPIC_API_KEY) {
        throw Object.assign(new Error(db.ERROR_MESSAGES['CT-004']), { code: 'CT-004' });
      }
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const claudeModel = model === 'sonnet' ? 'claude-sonnet-4-6' : 'claude-haiku-4-5-20251001';
      modelUsed = claudeModel;

      emit(res, { type: 'step', step: 'streaming', label: `串流生成中 (${claudeModel})…` });

      // Token-by-token streaming
      const stream = anthropic.messages.stream({
        model: claudeModel,
        max_tokens: 4000,
        system: CANTONESE_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userContent }],
      });

      let tokenCount = 0;
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta?.type === 'text_delta') {
          const token = chunk.delta.text;
          fullText += token;
          tokenCount++;
          emit(res, { type: 'token', text: token, token_count: tokenCount });
        }
      }
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
    emit(res, { type: 'error', job_id: job.job_id, error_code: errorCode, error: db.ERROR_MESSAGES[errorCode] || err.message });
    return res.end();
  }

  // ── Step 4: save result ────────────────────────────────────────────────
  const durationMs = Date.now() - startTime;
  emit(res, { type: 'step', step: 'saving', label: '儲存至資料庫…' });

  try {
    await db.saveResult({ jobId: job.job_id, resultText: fullText, modelUsed, durationMs });
    await db.updateJobStatus(job.job_id, 'done');
  } catch (err) {
    console.error('[ct-routes] DB saveResult error:', err.message);
    await db.logError({
      jobId: job.job_id,
      errorCode: db.ERROR_CODES.CT_006,
      errorMessage: db.ERROR_MESSAGES['CT-006'],
      context: { detail: err.message, phase: 'save_result' },
    });
    // Continue — result already streamed to client
  }

  emit(res, {
    type: 'done',
    job_id: job.job_id,
    model: modelUsed,
    duration_ms: durationMs,
    char_count: fullText.length,
  });
  res.end();
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
    return res.status(500).json({ ok: false, error_code: 'CT-007', error: db.ERROR_MESSAGES['CT-007'] });
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
    return res.status(500).json({ ok: false, error_code: 'CT-007', error: db.ERROR_MESSAGES['CT-007'] });
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
    return res.status(500).json({ ok: false, error_code: 'CT-007', error: db.ERROR_MESSAGES['CT-007'] });
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
    return res.status(500).json({ ok: false, error_code: 'CT-007', error: db.ERROR_MESSAGES['CT-007'] });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/cantonese-transcription/error-codes
// ─────────────────────────────────────────────────────────────────────────────
router.get('/error-codes', (_req, res) => {
  const table = Object.entries(db.ERROR_MESSAGES).map(([code, message]) => ({ code, message }));
  return res.json({ ok: true, error_codes: table });
});

module.exports = { router, initDb: db.init };
