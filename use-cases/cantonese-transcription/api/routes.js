// ─────────────────────────────────────────────────────────────────────────────
// Cantonese Transcription & Analysis — Express API Routes
// Base path: /api/cantonese-transcription
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const deepseekService = require('../../../services/deepseekService');

const router = express.Router();

// ── System prompt for the Cantonese transcription assistant ─────────────────
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

You will receive inputs in the following form:
- "transcript": full ASR text (string)
- "segments": optional list of segments with text and timestamps
- "task": what the user wants (clean_transcript, meeting_minutes, summary_zh, summary_en, action_items, custom)
- "extra_instructions": free-form user instructions

You must:
- First, restate briefly what you will do in one sentence (in the user's language).
- Then perform exactly the requested task, nothing more.`;

// ── Task label map ────────────────────────────────────────────────────────────
const TASK_PROMPTS = {
  clean_transcript: '請幫我清理以下粵語逐字稿，修正明顯的ASR錯誤，保留粵語口語風格。',
  meeting_minutes:  '請根據以下逐字稿，整理成正式會議紀要，包括討論重點和決定事項。',
  summary_zh:       '請用書面中文寫一份簡潔摘要，概括以下逐字稿的核心內容。',
  summary_en:       'Please write a concise English summary of the following transcript.',
  action_items:     '請從以下逐字稿中提取所有待辦事項和行動項目，列出負責人（如有提及）和截止日期（如有提及）。',
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/cantonese-transcription/analyze
// Body: { transcript, segments?, task, extra_instructions?, model? }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/analyze', async (req, res) => {
  const {
    transcript,
    segments = [],
    task = 'clean_transcript',
    extra_instructions = '',
    model = 'haiku',
  } = req.body;

  if (!transcript || transcript.trim().length === 0) {
    return res.status(400).json({ error: 'transcript is required' });
  }

  // Build user message
  const taskInstruction = TASK_PROMPTS[task] || extra_instructions || '請處理以下逐字稿。';

  let userContent = `${taskInstruction}\n\n`;

  if (extra_instructions) {
    userContent += `Additional instructions: ${extra_instructions}\n\n`;
  }

  userContent += `**Transcript:**\n${transcript}`;

  if (segments && segments.length > 0) {
    const segText = segments
      .map(s => `[${formatTime(s.start)} → ${formatTime(s.end)}] ${s.text}`)
      .join('\n');
    userContent += `\n\n**Segments with timestamps:**\n${segText}`;
  }

  try {
    let resultText;
    let modelUsed;

    if (model === 'deepseek' && deepseekService.isAvailable()) {
      const result = await deepseekService.analyze(CANTONESE_SYSTEM_PROMPT, userContent, {
        model: 'deepseek-chat',
        maxTokens: 4000,
        temperature: 0.3,
      });
      resultText = result.content;
      modelUsed = 'deepseek-chat';
    } else {
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

    return res.json({
      ok: true,
      task,
      result: resultText,
      model: modelUsed,
    });
  } catch (err) {
    console.error('[cantonese-transcription] analyze error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Helper: format seconds → MM:SS
// ─────────────────────────────────────────────────────────────────────────────
function formatTime(seconds) {
  if (typeof seconds !== 'number') return '?';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

module.exports = router;
