/**
 * OCR Service — Google Gemini 2.0 Flash
 *
 * Uses Gemini's native PDF understanding to extract math questions from
 * Hong Kong secondary school past papers (bilingual EN/ZH, diagrams, MCQ).
 *
 * Required env:
 *   GEMINI_API_KEY   — Google AI Studio key (aistudio.google.com)
 */

const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_URL   = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/**
 * Strip markdown code fences that Gemini sometimes wraps around JSON.
 * e.g. ```json\n[...]\n``` → [...]
 */
function stripFences(text) {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
}

/**
 * Extract individual question blocks from a PDF buffer via Gemini.
 *
 * @param {Buffer} pdfBuffer
 * @returns {Promise<Array<{
 *   raw_text: string, stem_en: string, stem_zh: string,
 *   page_number: number, has_image: boolean,
 *   suggested_type: string, difficulty_hint: number
 * }>>}
 */
async function extractFromPdf(pdfBuffer) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY env var not set');

  const base64 = pdfBuffer.toString('base64');

  const prompt = `You are processing a Hong Kong Secondary School mathematics exam paper (S1–S2 level).

Extract every individual question from this PDF. Return a JSON array where each element is:
{
  "page_number": <number>,
  "raw_text": "<exact question text as it appears, including sub-parts>",
  "stem_en": "<clean English question stem — rewrite if messy, fix math notation>",
  "stem_zh": "<clean Traditional Chinese equivalent — translate if EN-only, or clean up if bilingual>",
  "has_image": <true if the question references a figure, diagram, or graph>,
  "suggested_type": "MCQ" | "OPEN_ENDED" | "FILL_IN" | "MULTI_STEP",
  "difficulty_hint": <1–5 integer, 1=easy recall, 5=complex multi-step>
}

Rules:
- Include every numbered question (1, 2, 3… or (a)(b)(c)…).
- If a parent question has sub-parts, include it as one MULTI_STEP question with all sub-parts in the stem.
- MCQ: has exactly 4 lettered choices (A/B/C/D).
- Fix OCR artifacts (e.g. "I" vs "1", "O" vs "0", broken fractions).
- Use Unicode math: fractions as a/b, powers as x², roots as √x.
- If the paper is Chinese-only, still produce stem_en as a faithful translation.
- Output ONLY the JSON array. No explanation, no markdown fences.`;

  const body = {
    contents: [{
      parts: [
        { inline_data: { mime_type: 'application/pdf', data: base64 } },
        { text: prompt },
      ],
    }],
    generationConfig: {
      temperature:      0.1,
      responseMimeType: 'application/json',
      maxOutputTokens:  8192,
    },
  };

  let response;
  try {
    response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
  } catch (netErr) {
    throw new Error(`Gemini network error: ${netErr.message}`);
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Gemini API ${response.status}: ${errText.slice(0, 400)}`);
  }

  const data = await response.json();

  // Log finish reason so we can diagnose truncation / safety blocks
  const candidate    = data?.candidates?.[0];
  const finishReason = candidate?.finishReason;
  if (finishReason && finishReason !== 'STOP') {
    console.warn(`[OCR] Gemini finishReason=${finishReason} — output may be incomplete`);
  }

  // Safety block check
  if (!candidate && data?.promptFeedback?.blockReason) {
    throw new Error(`Gemini blocked prompt: ${data.promptFeedback.blockReason}`);
  }

  const rawText = candidate?.content?.parts?.[0]?.text || '';
  if (!rawText) {
    console.warn('[OCR] Gemini returned empty text. Full response:', JSON.stringify(data).slice(0, 500));
    return [];
  }

  const cleaned = stripFences(rawText);

  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) {
      console.warn('[OCR] Gemini response is not an array:', cleaned.slice(0, 200));
      return [];
    }
    const blocks = parsed.filter(q => q.raw_text?.length > 5);
    console.log(`[OCR] Extracted ${blocks.length} question blocks via Gemini`);
    return blocks;
  } catch (parseErr) {
    console.warn('[OCR] JSON parse failed. Raw text sample:', cleaned.slice(0, 300));
    // Last-ditch: try to find a JSON array inside the text
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        const fallback = JSON.parse(match[0]).filter(q => q.raw_text?.length > 5);
        console.log(`[OCR] Fallback parse got ${fallback.length} blocks`);
        return fallback;
      } catch {}
    }
    return [];
  }
}

/**
 * Describe a question image (diagram/figure) via Gemini.
 * Returns { description_en, description_zh }
 */
async function describeQuestionImage(imageBuffer, mimeType = 'image/png') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY env var not set');

  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { inline_data: { mime_type: mimeType, data: imageBuffer.toString('base64') } },
          { text: 'Describe this math diagram or figure in English and Traditional Chinese. Be concise. Output JSON: {"description_en": "...", "description_zh": "..."}' },
        ],
      }],
      generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
    }),
  });

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  try { return JSON.parse(stripFences(text)); }
  catch { return { description_en: '', description_zh: '' }; }
}

function isAvailable() {
  return !!(process.env.GEMINI_API_KEY);
}

module.exports = { extractFromPdf, describeQuestionImage, isAvailable };
