/**
 * OCR Service — Google Gemini (via Google AI Studio API key)
 *
 * Replaces Google Document AI with Gemini 1.5 Flash, which understands
 * PDFs and images natively (math notation, diagrams, bilingual text).
 *
 * Required Fly secret:
 *   GOOGLE_AI_API_KEY   — Google AI Studio API key (aistudio.google.com)
 *
 * Returns: Array of { raw_text, stem_en, stem_zh, page_number, has_image,
 *                     suggested_type, difficulty_hint }
 */

const GEMINI_MODEL = 'gemini-1.5-flash';
const GEMINI_URL   = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/**
 * Process a PDF buffer through Gemini and extract individual question blocks.
 *
 * @param {Buffer} pdfBuffer
 * @returns {Promise<Array<{
 *   raw_text: string,
 *   stem_en: string,
 *   stem_zh: string,
 *   page_number: number,
 *   has_image: boolean,
 *   suggested_type: string,
 *   difficulty_hint: number
 * }>>}
 */
async function extractFromPdf(pdfBuffer) {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY env var not set');

  const base64 = pdfBuffer.toString('base64');

  const prompt = `You are processing a Hong Kong Secondary School mathematics exam paper (S1–S2 level).

Extract every individual question from this PDF. For each question output a JSON array where each element is:
{
  "page_number": <number>,
  "raw_text": "<exact question text as it appears, including sub-parts>",
  "stem_en": "<clean English question stem — rewrite if messy, fix math notation>",
  "stem_zh": "<clean Traditional Chinese equivalent — translate if only EN, or clean up if bilingual>",
  "has_image": <true if the question references a figure, diagram, or graph>,
  "suggested_type": "MCQ" | "OPEN_ENDED" | "FILL_IN" | "MULTI_STEP",
  "difficulty_hint": <1-5 integer, 1=easy recall, 5=complex multi-step>
}

Rules:
- Include every numbered question (1, 2, 3... or (a)(b)(c)...).
- If a parent question has sub-parts, include the parent as one MULTI_STEP question with all sub-parts in the stem.
- MCQ: has exactly 4 lettered choices (A/B/C/D or (A)(B)(C)(D)).
- Fix OCR artifacts (e.g. "I" vs "1", "O" vs "0", broken fraction notation).
- Use Unicode for math: fractions as a/b, powers as x², square roots as √x.
- If the paper is Chinese-only, still produce stem_en as a faithful translation.
- Output ONLY the JSON array. No explanation, no markdown.`;

  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { inline_data: { mime_type: 'application/pdf', data: base64 } },
          { text: prompt },
        ],
      }],
      generationConfig: {
        temperature:     0.1,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${err.slice(0, 300)}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed.filter(q => q.raw_text?.length > 5) : [];
  } catch {
    console.warn('Gemini returned non-JSON:', text.slice(0, 200));
    return [];
  }
}

/**
 * Re-run Gemini on a single question image (for questions with diagrams).
 * Returns { description_en, description_zh }
 */
async function describeQuestionImage(imageBuffer, mimeType = 'image/png') {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY env var not set');

  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
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
  try { return JSON.parse(text); } catch { return { description_en: '', description_zh: '' }; }
}

function isAvailable() {
  return !!(process.env.GOOGLE_AI_API_KEY);
}

module.exports = { extractFromPdf, describeQuestionImage, isAvailable };
