/**
 * OCR Service — Google Gemini 2.0 Flash
 *
 * Two-phase extraction to work around the 8192 output-token limit:
 *   Phase 1 — count questions, get question numbers (tiny response)
 *   Phase 2 — extract full content in batches of BATCH_SIZE questions
 *             (each batch stays well under the token limit)
 *
 * Required env:
 *   GEMINI_API_KEY   — Google AI Studio key (aistudio.google.com)
 */

const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_URL   = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const BATCH_SIZE   = 6; // questions per Gemini call — keeps output ~3 000 tokens max

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripFences(text) {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
}

async function callGemini(parts, generationConfig = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY env var not set');

  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        temperature:      0.1,
        responseMimeType: 'application/json',
        maxOutputTokens:  8192,
        ...generationConfig,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Gemini API ${response.status}: ${errText.slice(0, 400)}`);
  }

  const data      = await response.json();
  const candidate = data?.candidates?.[0];
  const reason    = candidate?.finishReason;

  if (reason && reason !== 'STOP') {
    console.warn(`[OCR] Gemini finishReason=${reason}`);
  }
  if (!candidate && data?.promptFeedback?.blockReason) {
    throw new Error(`Gemini blocked: ${data.promptFeedback.blockReason}`);
  }

  const text = candidate?.content?.parts?.[0]?.text || '';
  if (!text) {
    console.warn('[OCR] Empty response. Full data:', JSON.stringify(data).slice(0, 400));
  }
  return text;
}

function tryParseJson(text) {
  const cleaned = stripFences(text);
  try { return JSON.parse(cleaned); } catch {}
  const match = cleaned.match(/[\[{][\s\S]*[\]}]/);
  if (match) { try { return JSON.parse(match[0]); } catch {} }
  return null;
}

// ─── Phase 1: count questions ─────────────────────────────────────────────────

async function countQuestions(pdfBase64) {
  const prompt = `This is a Hong Kong Secondary School mathematics paper. It may be a standard exam paper OR a compiled/sorted past-paper booklet containing questions from multiple exams.

Count the total number of top-level numbered questions (e.g. "1.", "11.", "12." etc.) across all pages.
Output ONLY this JSON: {"total": <number>, "question_numbers": [<array of integers in the order they appear>]}

Rules:
- List the ACTUAL question numbers as they appear in the document (they may not start at 1).
- Do not include sub-parts like (a)(b)(c) as separate questions.
- For compiled booklets, include every numbered question from every page.
- If question numbers restart on a new section, still list them all.`;

  const text = await callGemini([
    { inline_data: { mime_type: 'application/pdf', data: pdfBase64 } },
    { text: prompt },
  ], { maxOutputTokens: 512 });

  const parsed = tryParseJson(text);
  if (!parsed || !Array.isArray(parsed.question_numbers)) {
    console.warn('[OCR] Phase 1 parse failed, raw:', text.slice(0, 200));
    return null;
  }
  console.log(`[OCR] Phase 1: found ${parsed.total} questions: [${parsed.question_numbers.join(', ')}]`);
  return parsed.question_numbers;
}

// ─── Phase 2: extract a batch of questions ────────────────────────────────────

async function extractBatch(pdfBase64, questionNumbers) {
  const list = questionNumbers.join(', ');
  const prompt = `Extract ONLY questions numbered ${list} from this Hong Kong Secondary School mathematics paper (may be a standard exam or a compiled sorted past-paper booklet).

For each question return a JSON object:
{
  "question_number": <integer>,
  "page_number": <integer — which page this question starts on>,
  "stem_en": "<complete English question text, including ALL sub-parts (a)(b)(c) inline>",
  "stem_zh": "<complete Traditional Chinese question text, or translated if English-only>",
  "has_image": <true if the question references a figure, diagram, table, or graph>,
  "image_description": "<if has_image: brief English description of the figure, e.g. 'Triangle ABC with angle B=90°, AB=3cm'; else empty string>",
  "suggested_type": "MCQ" | "OPEN_ENDED" | "FILL_IN" | "MULTI_STEP",
  "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
  "difficulty_hint": <1–5 integer>
}

Rules:
- "options" must contain all 4 answer choices for MCQ questions. Leave as [] for non-MCQ.
- Include the complete stem text even if it spans multiple lines or has a diagram reference.
- For bilingual papers: stem_en = English portion (cleaned), stem_zh = Chinese portion (cleaned).
- Fix OCR artefacts: "I"→"1", "O"→"0", fix fraction/power notation.
- If a question has a diagram: set has_image=true AND describe the figure in image_description.
- Output ONLY the JSON array of ${questionNumbers.length} objects. No markdown.`;

  const text = await callGemini([
    { inline_data: { mime_type: 'application/pdf', data: pdfBase64 } },
    { text: prompt },
  ]);

  const parsed = tryParseJson(text);
  if (!Array.isArray(parsed)) {
    console.warn(`[OCR] Batch [${list}] parse failed, raw:`, text.slice(0, 300));
    return [];
  }
  console.log(`[OCR] Batch [${list}]: extracted ${parsed.length}/${questionNumbers.length} questions`);
  return parsed;
}

// ─── Main extraction ──────────────────────────────────────────────────────────

async function extractFromPdf(pdfBuffer, onLog) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY env var not set');

  const log = onLog || ((msg, level) => console.log(`[OCR] [${level || 'info'}] ${msg}`));
  const base64 = pdfBuffer.toString('base64');

  // Phase 1: discover question numbers
  log('Phase 1: asking Gemini to count questions in the PDF…');
  let questionNumbers = await countQuestions(base64);

  if (!questionNumbers || questionNumbers.length === 0) {
    log('Phase 1 failed to parse a question list — falling back to questions 1–20', 'warn');
    questionNumbers = Array.from({ length: 20 }, (_, i) => i + 1);
  } else {
    log(`Phase 1 complete: found ${questionNumbers.length} questions [${questionNumbers.slice(0, 10).join(', ')}${questionNumbers.length > 10 ? '…' : ''}]`, 'info');
  }

  // Phase 2: extract in batches
  const allBlocks = [];
  const totalBatches = Math.ceil(questionNumbers.length / BATCH_SIZE);
  for (let i = 0; i < questionNumbers.length; i += BATCH_SIZE) {
    const batch     = questionNumbers.slice(i, i + BATCH_SIZE);
    const batchNum  = Math.floor(i / BATCH_SIZE) + 1;
    log(`Phase 2 batch ${batchNum}/${totalBatches}: extracting Q${batch[0]}–Q${batch[batch.length - 1]}…`);
    const results = await extractBatch(base64, batch);
    log(`  → batch ${batchNum} returned ${results.length}/${batch.length} questions`);
    allBlocks.push(...results);
  }

  // Normalise to the shape the pipeline expects
  const blocks = allBlocks
    .filter(q => q.stem_en?.length > 2 || q.stem_zh?.length > 2)
    .map(q => ({
      raw_text:          `Q${q.question_number}: ${q.stem_en || q.stem_zh || ''}`,
      stem_en:           q.stem_en           || '',
      stem_zh:           q.stem_zh           || '',
      has_image:         !!q.has_image,
      image_description: q.image_description || '',
      options:           Array.isArray(q.options) ? q.options : [],
      suggested_type:    q.suggested_type    || 'MCQ',
      difficulty_hint:   q.difficulty_hint   || 2,
      page_number:       q.page_number       || null,
      question_number:   q.question_number   || null,
    }));

  log(`Total: ${blocks.length} questions extracted (${questionNumbers.length} detected, ${allBlocks.length - blocks.length} filtered as empty)`, blocks.length > 0 ? 'success' : 'warn');
  return blocks;
}

// ─── Image description (for visual validation) ────────────────────────────────

async function describeQuestionImage(imageBuffer, mimeType = 'image/png') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY env var not set');

  const text = await callGemini([
    { inline_data: { mime_type, data: imageBuffer.toString('base64') } },
    { text: 'Describe this math diagram or figure in English and Traditional Chinese. Be concise. Output JSON: {"description_en": "...", "description_zh": "..."}' },
  ], { maxOutputTokens: 512 });

  const parsed = tryParseJson(text);
  return parsed || { description_en: '', description_zh: '' };
}

function isAvailable() {
  return !!(process.env.GEMINI_API_KEY);
}

module.exports = { extractFromPdf, describeQuestionImage, isAvailable };
