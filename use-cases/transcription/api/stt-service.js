// ─────────────────────────────────────────────────────────────────────────────
// STT Service — Abstract Speech-to-Text provider
//
// Unified interface for all STT providers.
// Returns: { provider, transcript, segments, language, confidence?, fallbackFrom? }
//
// Providers:
//   'whisper'    — Self-hosted Whisper HTTP service (WHISPER_SERVICE_URL)
//   'google-stt' — Google Cloud Speech-to-Text V1 (stable)
//
// Provider selection (in order of precedence):
//   1. Explicit `provider` arg
//   2. STT_PROVIDER env var
//   3. Auto: whisper if WHISPER_SERVICE_URL set, else google-stt
//
// Fallback:
//   If Whisper fails AND GEMINI_API_KEY is set, falls back to Google STT.
//   Adds `fallbackFrom: 'whisper'` to the result in that case.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const FormData = require('form-data');

// ── Encoding map for Google STT V1 ───────────────────────────────────────────
const ENCODING_MAP = {
  'audio/wav':  'LINEAR16',
  'audio/mp3':  'MP3',
  'audio/mpeg': 'MP3',
  'audio/ogg':  'OGG_OPUS',
  'audio/webm': 'WEBM_OPUS',
  'audio/flac': 'FLAC',
  'audio/m4a':  'MP4',
  'audio/mp4':  'MP4',  // browsers report M4A files as audio/mp4
};

// ── Time helpers ──────────────────────────────────────────────────────────────
function nanos(offset) {
  if (!offset) return 0;
  if (typeof offset === 'string') return parseFloat(offset.replace('s', ''));
  return (offset.seconds || 0) + (offset.nanos || 0) / 1e9;
}
function secs(s) {
  if (!s) return 0;
  return typeof s === 'string' ? parseFloat(s.replace('s', '')) : s;
}

// ── Parse Google STT V2 response ──────────────────────────────────────────────
function parseV2Response(data) {
  let transcript = '';
  const segments = [];
  for (const result of (data.results || [])) {
    const alt = result.alternatives?.[0];
    if (!alt) continue;
    transcript += (transcript ? ' ' : '') + alt.transcript;
    if (alt.words?.length) {
      const start = nanos(alt.words[0].startOffset);
      const end   = nanos(alt.words[alt.words.length - 1].endOffset);
      segments.push({ start, end, text: alt.transcript });
    }
  }
  return { transcript, segments };
}

// ── Parse Google STT V1 response ──────────────────────────────────────────────
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

// ── Gemini audio transcription provider ──────────────────────────────────────
// Uses Gemini 2.0 Flash via the Generative Language API (same key as GEMINI_API_KEY).
// For files ≤ 15 MB: sends audio inline as base64.
// For larger files: uploads via the Files API first, then references by URI.
async function transcribeWithGoogle({ fileBuffer, mimeType, language, onProgress }) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    const err = new Error('GEMINI_API_KEY 未設定');
    err.code = 'CT-012';
    throw err;
  }

  const INLINE_LIMIT = 15 * 1024 * 1024; // 15 MB raw → ~20 MB base64
  const BASE = 'https://generativelanguage.googleapis.com';
  const MODEL = 'gemini-2.0-flash';

  const prompt = language === 'yue-Hant-HK'
    ? '請逐字轉錄以下粵語音訊，使用繁體中文，英語詞彙保留原文。只輸出轉錄文字，不要加任何解釋或標題。'
    : `Please transcribe the following audio accurately. Output only the transcription, no explanations.`;

  let audioPart;

  if (fileBuffer.length <= INLINE_LIMIT) {
    // Inline base64
    onProgress?.(`準備音訊（${(fileBuffer.length / 1024 / 1024).toFixed(1)} MB）...`, 20);
    audioPart = { inline_data: { mime_type: mimeType, data: fileBuffer.toString('base64') } };
  } else {
    // Upload via Files API
    onProgress?.(`上傳音訊至 Gemini Files API（${(fileBuffer.length / 1024 / 1024).toFixed(1)} MB）...`, 15);
    const initResp = await fetch(`${BASE}/upload/v1beta/files?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'X-Goog-Upload-Protocol': 'resumable',
        'X-Goog-Upload-Command': 'start',
        'X-Goog-Upload-Header-Content-Length': String(fileBuffer.length),
        'X-Goog-Upload-Header-Content-Type': mimeType,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ file: { display_name: 'audio' } }),
    });
    if (!initResp.ok) {
      const err = new Error(`Google STT: Files API init failed (${initResp.status})`);
      err.code = 'CT-013';
      throw err;
    }
    const uploadUrl = initResp.headers.get('x-goog-upload-url');
    const uploadResp = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Length': String(fileBuffer.length),
        'X-Goog-Upload-Offset': '0',
        'X-Goog-Upload-Command': 'upload, finalize',
      },
      body: fileBuffer,
    });
    if (!uploadResp.ok) {
      const err = new Error(`Google STT: file upload failed (${uploadResp.status})`);
      err.code = 'CT-013';
      throw err;
    }
    const fileData = await uploadResp.json();
    onProgress?.('音訊上傳完成，正在轉錄...', 35);
    audioPart = { file_data: { mime_type: mimeType, file_uri: fileData.file.uri } };
  }

  onProgress?.('正在呼叫 Gemini 2.0 Flash...', 40);
  const genUrl = `${BASE}/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
  const resp = await fetch(genUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }, audioPart] }],
      generationConfig: { temperature: 0 },
    }),
    signal: AbortSignal.timeout(55_000),
  });

  if (!resp.ok) {
    let errDetail = `HTTP ${resp.status}`;
    try {
      const errBody = await resp.json();
      errDetail = errBody?.error?.message || errBody?.error || errDetail;
    } catch { /* ignore */ }
    const err = new Error(`Google STT: ${errDetail}`);
    err.code = resp.status === 400 ? 'CT-017' : 'CT-013';
    throw err;
  }

  const data = await resp.json();
  const transcript = (data.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
  onProgress?.(`轉錄完成（${transcript.length} 字元）`, 100);
  return { provider: 'google-stt', language, transcript, segments: [] };
}

// ── Whisper provider ──────────────────────────────────────────────────────────
// Calls a self-hosted Whisper HTTP service compatible with the OpenAI
// /v1/audio/transcriptions API (e.g. faster-whisper-server, whisper.cpp,
// or any FastAPI wrapper exposing the same multipart endpoint).
//
// Required env:
//   WHISPER_SERVICE_URL — base URL of the Whisper service (e.g. https://whisper.internal)
//
// Optional env:
//   WHISPER_MODEL — model name to request (default: 'khleeloo/whisper-large-v3-cantonese')
//
// The service must accept POST /v1/audio/transcriptions with:
//   file        — audio file (multipart)
//   model       — model name string
//   language    — BCP-47 language code (we send 'yue' for Cantonese)
//   response_format — 'verbose_json' to get segments
//
// Response (verbose_json):
//   { text, segments: [{ id, start, end, text, ... }], language }
// ─────────────────────────────────────────────────────────────────────────────
async function transcribeWithWhisper({ fileBuffer, mimeType, language, filename }) {
  const serviceUrl = process.env.WHISPER_SERVICE_URL;
  if (!serviceUrl) {
    const err = new Error('WHISPER_SERVICE_URL 未設定');
    err.code = 'CT-014';
    throw err;
  }

  const model = process.env.WHISPER_MODEL || 'khleeloo/whisper-large-v3-cantonese';

  // Map yue-Hant-HK → 'yue' for Whisper (BCP-47 short code)
  const whisperLang = language === 'yue-Hant-HK' ? 'yue' : language;

  const form = new FormData();
  form.append('file', fileBuffer, {
    filename: filename || `audio.${mimeType.split('/')[1] || 'webm'}`,
    contentType: mimeType,
  });
  form.append('model', model);
  form.append('language', whisperLang);
  form.append('response_format', 'verbose_json');

  const endpoint = serviceUrl.replace(/\/$/, '') + '/v1/audio/transcriptions';

  let resp;
  try {
    resp = await fetch(endpoint, { method: 'POST', body: form, headers: form.getHeaders() });
  } catch (networkErr) {
    const err = new Error(`Whisper 服務無法連接：${networkErr.message}`);
    err.code = 'CT-015';
    throw err;
  }

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Whisper service error ${resp.status}: ${text}`);
  }

  const data = await resp.json();

  const transcript = data.text || '';
  const segments   = (data.segments || []).map(s => ({
    start: s.start,
    end:   s.end,
    text:  s.text,
  }));
  const confidence = data.segments
    ? (data.segments.reduce((sum, s) => sum + (s.avg_logprob ?? 0), 0) / Math.max(data.segments.length, 1))
    : undefined;

  return { provider: 'whisper', language, transcript, segments, confidence };
}

// ── Main entrypoint ───────────────────────────────────────────────────────────
// provider: 'whisper' | 'google-stt' | 'auto' (default)
// Returns: { provider, transcript, segments, language, confidence?, fallbackFrom? }
async function transcribeAudio({ fileBuffer, mimeType, language, filename, provider, onProgress }) {
  const resolved = provider || process.env.STT_PROVIDER || 'auto';

  const wantWhisper = resolved === 'whisper' ||
    (resolved === 'auto' && !!process.env.WHISPER_SERVICE_URL);

  if (wantWhisper) {
    try {
      return await transcribeWithWhisper({ fileBuffer, mimeType, language, filename });
    } catch (err) {
      // If Google STT is available, fall back silently
      if (process.env.GEMINI_API_KEY && resolved !== 'whisper') {
        console.warn('[stt-service] Whisper failed, falling back to Google STT:', err.message);
        onProgress?.('Whisper 失敗，切換至 Gemini...', 15);
        const result = await transcribeWithGoogle({ fileBuffer, mimeType, language, onProgress });
        return { ...result, fallbackFrom: 'whisper' };
      }
      throw err; // no fallback available, surface the error
    }
  }

  // Google STT (explicit or auto-fallback when no Whisper URL)
  return await transcribeWithGoogle({ fileBuffer, mimeType, language, onProgress });
}

// ── Available providers check ─────────────────────────────────────────────────
function availableProviders() {
  const providers = [];
  if (process.env.WHISPER_SERVICE_URL) providers.push('whisper');
  if (process.env.GEMINI_API_KEY) providers.push('google-stt');
  return providers;
}

function defaultProvider() {
  if (process.env.STT_PROVIDER) return process.env.STT_PROVIDER;
  if (process.env.WHISPER_SERVICE_URL) return 'whisper';
  if (process.env.GEMINI_API_KEY) return 'google-stt';
  return null;
}

// ── Speaker diarization via pyannote-audio microservice ───────────────────────
// Calls the Python diarization service at DIARIZATION_SERVICE_URL.
// Returns: [{ speaker: 'SPEAKER_00', start: 0.0, end: 2.5 }, ...] or null.
//
// Required env:
//   DIARIZATION_SERVICE_URL — base URL of the Python diarization service
//                             (e.g. http://localhost:8001)
//
// Optional params:
//   numSpeakers  — exact number of speakers (skips auto-detection)
//   minSpeakers  — lower bound hint
//   maxSpeakers  — upper bound hint
// ─────────────────────────────────────────────────────────────────────────────
async function diarizeAudio({ fileBuffer, mimeType, filename, numSpeakers, minSpeakers, maxSpeakers } = {}) {
  const serviceUrl = process.env.DIARIZATION_SERVICE_URL;
  if (!serviceUrl) return null;

  const form = new FormData();
  form.append('file', fileBuffer, {
    filename: filename || `audio.${(mimeType || 'audio/wav').split('/')[1] || 'wav'}`,
    contentType: mimeType || 'audio/wav',
  });
  if (numSpeakers != null) form.append('num_speakers', String(numSpeakers));
  if (minSpeakers  != null) form.append('min_speakers',  String(minSpeakers));
  if (maxSpeakers  != null) form.append('max_speakers',  String(maxSpeakers));

  const endpoint = serviceUrl.replace(/\/$/, '') + '/diarize';
  let resp;
  try {
    resp = await fetch(endpoint, {
      method:  'POST',
      body:    form,
      headers: form.getHeaders(),
      signal:  AbortSignal.timeout(120_000),
    });
  } catch (err) {
    console.warn('[stt-service] Diarization service unreachable:', err.message);
    return null;
  }

  if (!resp.ok) {
    console.warn('[stt-service] Diarization service error:', resp.status);
    return null;
  }

  const data = await resp.json();
  return data.ok ? (data.segments || null) : null;
}

// ── Speaker assignment ────────────────────────────────────────────────────────
// Assigns a speaker label to each transcript segment by max-overlap matching
// against pyannote diarization output.
//
// transcriptSegments:  [{ start, end, text, ... }]
// diarizationSegments: [{ speaker, start, end }]
// Returns the same array with an added `speaker` field on each segment.
// ─────────────────────────────────────────────────────────────────────────────
function assignSpeakers(transcriptSegments, diarizationSegments) {
  if (!diarizationSegments?.length || !transcriptSegments?.length) {
    return transcriptSegments;
  }
  return transcriptSegments.map(seg => {
    let bestSpeaker = null;
    let bestOverlap = 0;
    for (const d of diarizationSegments) {
      const overlap = Math.min(seg.end, d.end) - Math.max(seg.start, d.start);
      if (overlap > bestOverlap) {
        bestOverlap = overlap;
        bestSpeaker = d.speaker;
      }
    }
    return bestSpeaker ? { ...seg, speaker: bestSpeaker } : seg;
  });
}

module.exports = { transcribeAudio, availableProviders, defaultProvider, diarizeAudio, assignSpeakers };
