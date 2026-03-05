/**
 * OCR Service — Google Document AI
 *
 * Extracts raw question text from uploaded PDF past papers.
 *
 * Required Fly secrets:
 *   GOOGLE_CREDENTIALS_JSON     — service account JSON (full JSON string)
 *   GOOGLE_CLOUD_PROJECT        — GCP project ID
 *   GOOGLE_DOCAI_PROCESSOR_ID   — full resource name:
 *                                  projects/{project}/locations/{location}/processors/{id}
 *
 * Returns: Array of { raw_text, page_number, has_image }
 */

const { DocumentProcessorServiceClient } = require('@google-cloud/documentai').v1;

let _docAiClient = null;

function getDocAiClient() {
  if (_docAiClient) return _docAiClient;

  const credJson = process.env.GOOGLE_CREDENTIALS_JSON;
  if (!credJson) throw new Error('GOOGLE_CREDENTIALS_JSON env var not set');

  const credentials = JSON.parse(credJson);
  _docAiClient = new DocumentProcessorServiceClient({ credentials });
  return _docAiClient;
}

/**
 * Process a PDF buffer through Google Document AI.
 *
 * @param {Buffer} pdfBuffer     — raw PDF bytes
 * @param {string} processorId   — overrides env var (optional)
 * @returns {Promise<Array<{raw_text: string, page_number: number, has_image: boolean}>>}
 */
async function extractFromPdf(pdfBuffer, processorId) {
  const name = processorId || process.env.GOOGLE_DOCAI_PROCESSOR_ID;
  if (!name) throw new Error('GOOGLE_DOCAI_PROCESSOR_ID env var not set');

  const client = getDocAiClient();

  const [result] = await client.processDocument({
    name,
    rawDocument: {
      content:  pdfBuffer.toString('base64'),
      mimeType: 'application/pdf',
    },
  });

  const document = result.document;
  if (!document?.text) return [];

  // Split into question blocks by common patterns:
  //   - numbered items: "1.", "2.", "(1)", "(a)"
  //   - blank lines between blocks
  const rawChunks = splitIntoQuestionBlocks(document.text);

  // Map to our draft_question shape
  return rawChunks.map((chunk, i) => ({
    raw_text:    chunk.text.trim(),
    page_number: chunk.page || i + 1,
    has_image:   detectImagePlaceholder(chunk.text),
  })).filter(c => c.raw_text.length > 10); // drop empty/tiny fragments
}

/**
 * Heuristic: split a document's full text into individual question blocks.
 * Works for standard HK exam formats (numbered questions).
 */
function splitIntoQuestionBlocks(fullText) {
  // Match question number patterns at start of line:
  //   "1 ", "1. ", "(1) ", "Q1 ", "Question 1", "第1題"
  const questionStartPattern = /(?:^|\n)(?:Q(?:uestion)?\s*\d+|第\s*\d+\s*題|\(\d+\)|\d+[.\s])/gi;

  const matches = [];
  let match;
  while ((match = questionStartPattern.exec(fullText)) !== null) {
    matches.push(match.index);
  }

  if (matches.length === 0) {
    // No numbered questions found; split by double newlines
    return fullText.split(/\n{2,}/).map((text, i) => ({ text, page: i + 1 }));
  }

  const blocks = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i];
    const end   = matches[i + 1] || fullText.length;
    blocks.push({ text: fullText.slice(start, end), page: i + 1 });
  }
  return blocks;
}

/**
 * Simple heuristic: check if block mentions a figure/diagram.
 */
function detectImagePlaceholder(text) {
  return /figure|diagram|圖|graph|chart/i.test(text);
}

/**
 * Check if Document AI is configured and reachable.
 */
async function isAvailable() {
  return !!(
    process.env.GOOGLE_CREDENTIALS_JSON &&
    process.env.GOOGLE_DOCAI_PROCESSOR_ID
  );
}

module.exports = { extractFromPdf, isAvailable };
