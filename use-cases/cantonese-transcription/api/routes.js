// ─────────────────────────────────────────────────────────────────────────────
// Cantonese Transcription & Analysis — Express API Routes
// Base path: /api/cantonese-transcription
// ─────────────────────────────────────────────────────────────────────────────

const express    = require('express');
const Anthropic  = require('@anthropic-ai/sdk');
const multer     = require('multer');
const deepseekService = require('../../../services/deepseekService');
const db         = require('./db');

// multer: memory storage so we can forward audio bytes to Google STT
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

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
  const MODEL_LABELS = {
    deepseek: 'DeepSeek Chat',
    sonnet:   'Claude Sonnet 4.6',
    haiku:    'Claude Haiku 4.5',
    gemini:   'Gemini 2.0 Flash',
  };
  const modelLabel = MODEL_LABELS[model] || model;
  emit(res, { type: 'step', step: 'calling_ai', label: `呼叫 ${modelLabel}…`, model: modelLabel });

  let fullText = '';
  let modelUsed = '';

  try {
    if (model === 'gemini') {
      // ── Gemini 2.0 Flash — SSE streaming via REST ─────────────────────
      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey) throw Object.assign(new Error('GEMINI_API_KEY 未設定'), { code: 'CT-004' });

      const geminiModel = 'gemini-2.0-flash';
      modelUsed = geminiModel;
      emit(res, { type: 'step', step: 'streaming', label: `串流生成中 (${geminiModel})…` });

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:streamGenerateContent?alt=sse&key=${geminiKey}`;
      const geminiBody = {
        system_instruction: { parts: [{ text: CANTONESE_SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: userContent }] }],
        generationConfig: { maxOutputTokens: 4000, temperature: 0.3 },
      };

      const geminiResp = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiBody),
      });

      if (!geminiResp.ok) {
        const errText = await geminiResp.text();
        throw new Error(`Gemini API error ${geminiResp.status}: ${errText}`);
      }

      // Gemini SSE: each chunk is `data: {...}\n\n`
      const reader  = geminiResp.body.getReader();
      const decoder = new TextDecoder();
      let buffer    = '';
      let tokenCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const chunk = JSON.parse(jsonStr);
            const text  = chunk.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
            if (text) {
              fullText += text;
              tokenCount++;
              emit(res, { type: 'token', text, token_count: tokenCount });
            }
          } catch { /* malformed chunk, skip */ }
        }
      }

    } else if (model === 'deepseek' && deepseekService.isAvailable()) {
      // ── DeepSeek: no streaming SDK — emit progress, then single call ──
      emit(res, { type: 'step', step: 'streaming', label: 'DeepSeek 生成中…' });
      const result = await deepseekService.analyze(CANTONESE_SYSTEM_PROMPT, userContent, {
        model: 'deepseek-chat',
        maxTokens: 4000,
        temperature: 0.3,
      });
      fullText = result.content;
      modelUsed = 'deepseek-chat';
      emit(res, { type: 'token', text: fullText });

    } else {
      // ── Claude (Haiku or Sonnet) — Anthropic streaming SDK ────────────
      if (!process.env.ANTHROPIC_API_KEY) {
        throw Object.assign(new Error(db.ERROR_MESSAGES['CT-004']), { code: 'CT-004' });
      }
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const claudeModel = model === 'sonnet' ? 'claude-sonnet-4-6' : 'claude-haiku-4-5-20251001';
      modelUsed = claudeModel;

      emit(res, { type: 'step', step: 'streaming', label: `串流生成中 (${claudeModel})…` });

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
// Orchestrator: type-specific prompts + fast classifier
// ─────────────────────────────────────────────────────────────────────────────

const ORCH_TYPES = {
  meeting: {
    label: '會議',
    emoji: '📋',
    prompt: `請根據以下粵語會議逐字稿，整理成完整會議紀要。

輸出格式：
## 📋 會議紀要

**日期／時間**：（如有提及）
**出席人士**：（如有提及，列出姓名或稱謂）

---

### 議題與討論
（分項列出各討論事項，每項包括背景、要點、結論）

### 決定事項
（所有已確認的決定，每項一條）

### 行動項目
| 事項 | 負責人 | 期限 |
|------|--------|------|

### 備註
（其他重要資訊，如有）

要求：
- 保留所有決定事項，不要遺漏
- 如有講者資訊請在適當位置標注
- 如有日期或截止日期被提及，必須列出
- 書面中文輸出`,
  },
  tutorial: {
    label: '教學影片',
    emoji: '📚',
    prompt: `請根據以下粵語教學影片逐字稿，整理成結構清晰的課程筆記。

輸出格式：
## 📚 課程筆記

**主題**：（一句概括）
**適合對象**：（如可判斷）

---

### 核心概念
（3–7 個重要概念，每個附簡短解釋）

### 重點說明
（按邏輯順序列出教學要點，可分小節）

### 示例／案例
（具體例子及其意義）

### 重要金句
> （逐字稿中的精彩或關鍵語句）

### 課後行動
（建議學員的跟進步驟或練習）

要求：
- 保留技術術語（英文原文可保留）
- 突出「為什麼」而非只有「是什麼」
- 書面中文輸出`,
  },
  interview: {
    label: '訪談',
    emoji: '🎙️',
    prompt: `請根據以下粵語訪談逐字稿，整理成專業訪談摘要。

輸出格式：
## 🎙️ 訪談摘要

**受訪者**：（如可判斷）
**訪問者**：（如可判斷）
**主題**：（一句概括）

---

### 主要觀點
（受訪者的 3–6 個核心見解或立場）

### 精選問答
**Q：**（問題）
**A：**（回答要點）

（列出最有價值的 3–5 組問答）

### 精彩引述
> （受訪者最有分量的原話，盡量保留粵語風格）

### 核心洞察
（整體訪談的核心洞察，100 字以內）

要求：
- 保留受訪者的個人觀點和獨特視角
- 金句保留粵語原汁原味
- 書面中文輸出`,
  },
};

const CLASSIFY_SYSTEM = `You are a content-type classifier for Cantonese audio transcripts.
Classify into exactly one of:
- "meeting": business meetings, team syncs, planning sessions, stand-ups, project calls
- "tutorial": lessons, how-to guides, workshops, courses, training sessions, educational content
- "interview": podcasts, press interviews, Q&A sessions, one-on-one conversations with host/guest dynamic

Reply ONLY with valid JSON (no markdown): {"type":"meeting"|"tutorial"|"interview","confidence":0.0-1.0,"reason":"one sentence in Traditional Chinese"}`;

async function classifyTranscript(transcript) {
  const sample = transcript.slice(0, 900);

  // Try Gemini first (cheapest + fast JSON output)
  if (process.env.GEMINI_API_KEY) {
    const url  = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const body = {
      system_instruction: { parts: [{ text: CLASSIFY_SYSTEM }] },
      contents: [{ role: 'user', parts: [{ text: `分類以下粵語逐字稿（首 900 字）：\n\n${sample}` }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            type:       { type: 'string', enum: ['meeting', 'tutorial', 'interview'] },
            confidence: { type: 'number' },
            reason:     { type: 'string' },
          },
          required: ['type', 'confidence', 'reason'],
        },
        temperature: 0,
        maxOutputTokens: 120,
      },
    };
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (resp.ok) {
      const data = await resp.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return JSON.parse(text);
    }
  }

  // Fallback: Claude Haiku
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('No API key available for classification');
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 120,
    system: CLASSIFY_SYSTEM,
    messages: [{ role: 'user', content: `分類以下粵語逐字稿（首 900 字）：\n\n${sample}` }],
  });
  return JSON.parse(msg.content[0].text);
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/cantonese-transcription/orchestrate  (SSE streaming)
// Classifies transcript → routes to type-specific prompt → streams result
// ─────────────────────────────────────────────────────────────────────────────
router.post('/orchestrate', async (req, res) => {
  const startTime = Date.now();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const { transcript, segments = [], model = 'deepseek', extra_instructions = '' } = req.body;

  // ── Validate ────────────────────────────────────────────────────────────
  emit(res, { type: 'step', step: 'validating', label: '驗證輸入中…' });

  if (!transcript || typeof transcript !== 'string' || transcript.trim().length < 10) {
    emit(res, { type: 'error', error_code: 'CT-001', error: db.ERROR_MESSAGES['CT-001'] });
    return res.end();
  }

  // ── Create DB job ────────────────────────────────────────────────────────
  emit(res, { type: 'step', step: 'creating_job', label: '建立分析任務…' });

  let job;
  try {
    job = await db.createJob({
      transcript: transcript.trim(),
      segments: null,
      task: 'orchestrate',
      model,
      extra_instructions: extra_instructions.trim() || null,
    });
    emit(res, { type: 'job_created', job_id: job.job_id });
  } catch (err) {
    console.error('[orchestrate] createJob:', err.message);
    emit(res, { type: 'error', error_code: 'CT-006', error: db.ERROR_MESSAGES['CT-006'] });
    return res.end();
  }

  // ── Classify ─────────────────────────────────────────────────────────────
  emit(res, { type: 'step', step: 'classifying', label: 'Gemini 分析影片類型…' });

  let videoType = 'meeting';
  try {
    const cls = await classifyTranscript(transcript.trim());
    videoType  = ORCH_TYPES[cls.type] ? cls.type : 'meeting';
    emit(res, {
      type:       'classified',
      video_type: videoType,
      label:      ORCH_TYPES[videoType].label,
      emoji:      ORCH_TYPES[videoType].emoji,
      confidence: cls.confidence,
      reason:     cls.reason,
    });
  } catch (err) {
    console.error('[orchestrate] classify error:', err.message);
    emit(res, {
      type:       'classified',
      video_type: 'meeting',
      label:      '會議',
      emoji:      '📋',
      confidence: 0,
      reason:     '自動分類失敗，預設使用「會議」格式',
    });
  }

  // ── Build prompt ──────────────────────────────────────────────────────────
  const typeConfig = ORCH_TYPES[videoType];
  let userContent  = typeConfig.prompt + '\n\n';
  if (extra_instructions.trim()) userContent += `Additional instructions: ${extra_instructions.trim()}\n\n`;
  userContent += `**Transcript:**\n${transcript.trim()}`;

  const parsedSegments = Array.isArray(segments) ? segments : [];
  if (parsedSegments.length > 0) {
    const segText = parsedSegments
      .map(s => `[${formatTime(s.start)} → ${formatTime(s.end)}] ${s.text}`)
      .join('\n');
    userContent += `\n\n**Segments with timestamps:**\n${segText}`;
  }

  // ── Stream result ─────────────────────────────────────────────────────────
  const MODEL_LABELS = { deepseek: 'DeepSeek Chat', gemini: 'Gemini 2.0 Flash', sonnet: 'Claude Sonnet 4.6', haiku: 'Claude Haiku 4.5' };
  emit(res, { type: 'step', step: 'calling_ai', label: `呼叫 ${MODEL_LABELS[model] || model}…`, model: MODEL_LABELS[model] || model });

  let fullText  = '';
  let modelUsed = '';

  try {
    if (model === 'gemini') {
      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey) throw Object.assign(new Error('GEMINI_API_KEY 未設定'), { code: 'CT-004' });

      const geminiModel = 'gemini-2.0-flash';
      modelUsed = geminiModel;
      emit(res, { type: 'step', step: 'streaming', label: `串流生成中 (${geminiModel})…` });

      const geminiResp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:streamGenerateContent?alt=sse&key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: CANTONESE_SYSTEM_PROMPT }] },
            contents: [{ role: 'user', parts: [{ text: userContent }] }],
            generationConfig: { maxOutputTokens: 4000, temperature: 0.3 },
          }),
        }
      );
      if (!geminiResp.ok) throw new Error(`Gemini API error ${geminiResp.status}`);

      const reader   = geminiResp.body.getReader();
      const decoder  = new TextDecoder();
      let buffer     = '';
      let tokenCount = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const chunk = JSON.parse(jsonStr);
            const text  = chunk.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
            if (text) { fullText += text; emit(res, { type: 'token', text, token_count: ++tokenCount }); }
          } catch { /* skip malformed */ }
        }
      }

    } else if (model === 'deepseek' && deepseekService.isAvailable()) {
      emit(res, { type: 'step', step: 'streaming', label: 'DeepSeek 生成中…' });
      const result = await deepseekService.analyze(CANTONESE_SYSTEM_PROMPT, userContent, { model: 'deepseek-chat', maxTokens: 4000, temperature: 0.3 });
      fullText  = result.content;
      modelUsed = 'deepseek-chat';
      emit(res, { type: 'token', text: fullText });

    } else {
      if (!process.env.ANTHROPIC_API_KEY) throw Object.assign(new Error(db.ERROR_MESSAGES['CT-004']), { code: 'CT-004' });
      const anthropic   = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const claudeModel = model === 'sonnet' ? 'claude-sonnet-4-6' : 'claude-haiku-4-5-20251001';
      modelUsed = claudeModel;
      emit(res, { type: 'step', step: 'streaming', label: `串流生成中 (${claudeModel})…` });

      let tokenCount = 0;
      const stream = anthropic.messages.stream({
        model: claudeModel,
        max_tokens: 4000,
        system: CANTONESE_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userContent }],
      });
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta?.type === 'text_delta') {
          const token = chunk.delta.text;
          fullText += token;
          emit(res, { type: 'token', text: token, token_count: ++tokenCount });
        }
      }
    }
  } catch (err) {
    const isRateLimit = err.status === 429 || err.message?.includes('rate');
    const errorCode   = err.code === 'CT-004' ? 'CT-004' : isRateLimit ? 'CT-010' : 'CT-005';
    console.error(`[orchestrate] AI error (${errorCode}):`, err.message);
    await db.updateJobStatus(job.job_id, 'error');
    await db.logError({ jobId: job.job_id, errorCode, errorMessage: db.ERROR_MESSAGES[errorCode] || err.message, context: { model, http_status: err.status, detail: err.message } });
    emit(res, { type: 'error', job_id: job.job_id, error_code: errorCode, error: db.ERROR_MESSAGES[errorCode] || err.message });
    return res.end();
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  const durationMs = Date.now() - startTime;
  emit(res, { type: 'step', step: 'saving', label: '儲存至資料庫…' });
  try {
    await db.saveResult({ jobId: job.job_id, resultText: fullText, modelUsed, durationMs });
    await db.updateJobStatus(job.job_id, 'done');
  } catch (err) {
    console.error('[orchestrate] saveResult:', err.message);
  }

  emit(res, { type: 'done', job_id: job.job_id, model: modelUsed, duration_ms: durationMs, char_count: fullText.length, video_type: videoType });
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

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/cantonese-transcription/transcribe
// Audio file → Google Cloud Speech-to-Text V2 → transcript + segments
//
// Required Fly secrets:
//   GOOGLE_CLOUD_API_KEY  — Google Cloud API key
//   GCP_PROJECT_ID        — GCP project ID (needed for V2 URL)
//
// Falls back to V1p1beta1 if GCP_PROJECT_ID is not set.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ ok: false, error_code: 'CT-011', error: '未收到音訊檔案' });
  }

  const apiKey    = process.env.GOOGLE_CLOUD_API_KEY;
  const projectId = process.env.GCP_PROJECT_ID;

  if (!apiKey) {
    return res.status(503).json({
      ok: false,
      error_code: 'CT-012',
      error: 'GOOGLE_CLOUD_API_KEY 未設定，請聯絡管理員',
    });
  }

  const audioB64   = req.file.buffer.toString('base64');
  const mimeType   = req.file.mimetype || 'audio/webm';
  const language   = req.body.language || 'yue-Hant-HK'; // Cantonese (HK)

  // Detect encoding from MIME
  const ENCODING_MAP = {
    'audio/wav':   'LINEAR16',
    'audio/mp3':   'MP3',
    'audio/mpeg':  'MP3',
    'audio/ogg':   'OGG_OPUS',
    'audio/webm':  'WEBM_OPUS',
    'audio/flac':  'FLAC',
    'audio/m4a':   'MP4',
  };
  const encoding = ENCODING_MAP[mimeType] || 'ENCODING_UNSPECIFIED';

  try {
    let sttResult;

    if (projectId) {
      // ── V2 API ───────────────────────────────────────────────────────────
      const url = `https://speech.googleapis.com/v2/projects/${projectId}/locations/global/recognizers/_:recognize?key=${apiKey}`;
      const body = {
        config: {
          autoDecodingConfig: {},
          languageCodes: [language],
          model: 'long',
          features: {
            enableWordTimeOffsets: true,
            enableAutomaticPunctuation: true,
          },
        },
        audio: { content: audioB64 },
      };
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`Google STT V2 error ${resp.status}: ${errText}`);
      }
      const data = await resp.json();
      sttResult = parseV2Response(data);
    } else {
      // ── V1p1beta1 fallback ───────────────────────────────────────────────
      const url = `https://speech.googleapis.com/v1p1beta1/speech:recognize?key=${apiKey}`;
      const body = {
        config: {
          encoding,
          languageCode: language,
          alternativeLanguageCodes: ['zh-HK', 'en-US'],
          enableWordTimeOffsets: true,
          enableAutomaticPunctuation: true,
          model: 'latest_long',
        },
        audio: { content: audioB64 },
      };
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`Google STT V1 error ${resp.status}: ${errText}`);
      }
      const data = await resp.json();
      sttResult = parseV1Response(data);
    }

    return res.json({ ok: true, ...sttResult });
  } catch (err) {
    console.error('[ct-transcribe] Google STT error:', err.message);
    await db.logError({
      errorCode: 'CT-013',
      errorMessage: 'Google STT 調用失敗',
      context: { detail: err.message, language, mime: mimeType },
    });
    return res.status(502).json({
      ok: false,
      error_code: 'CT-013',
      error: `Google STT 調用失敗：${err.message}`,
    });
  }
});

// ── Parse Google STT V2 response → { transcript, segments } ──────────────────
function parseV2Response(data) {
  let transcript = '';
  const segments = [];
  for (const result of (data.results || [])) {
    const alt = result.alternatives?.[0];
    if (!alt) continue;
    transcript += (transcript ? ' ' : '') + alt.transcript;
    // Build segments from word timings if available
    if (alt.words?.length) {
      const start = nanos(alt.words[0].startOffset);
      const end   = nanos(alt.words[alt.words.length - 1].endOffset);
      segments.push({ start, end, text: alt.transcript });
    }
  }
  return { transcript, segments };
}

// ── Parse Google STT V1 response → { transcript, segments } ──────────────────
function parseV1Response(data) {
  let transcript = '';
  const segments = [];
  for (const result of (data.results || [])) {
    const alt = result.alternatives?.[0];
    if (!alt) continue;
    transcript += (transcript ? ' ' : '') + alt.transcript;
    if (alt.words?.length) {
      const start = secs(alt.words[0].startTime);
      const end   = secs(alt.words[alt.words.length - 1].endTime);
      segments.push({ start, end, text: alt.transcript });
    }
  }
  return { transcript, segments };
}

// ── Duration string helpers ───────────────────────────────────────────────────
function nanos(offset) {
  if (!offset) return 0;
  // V2 uses "1.5s" string or { seconds, nanos }
  if (typeof offset === 'string') return parseFloat(offset.replace('s', ''));
  return (offset.seconds || 0) + (offset.nanos || 0) / 1e9;
}
function secs(s) {
  if (!s) return 0;
  // V1 uses "1.500s" string
  return typeof s === 'string' ? parseFloat(s.replace('s', '')) : s;
}

module.exports = { router, initDb: db.init };
