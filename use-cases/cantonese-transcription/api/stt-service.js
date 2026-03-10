// ─────────────────────────────────────────────────────────────────────────────
// STT Service — Abstract Speech-to-Text provider
//
// Unified interface for all STT providers.
// Returns: { provider, transcript, segments, language, confidence?, fallbackFrom? }
//
// Providers:
//   'whisper'    — Self-hosted Whisper HTTP service (WHISPER_SERVICE_URL)
//   'google-stt' — Google Cloud Speech-to-Text V2/V1p1beta1
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

// ── Google STT provider ───────────────────────────────────────────────────────
async function transcribeWithGoogle({ fileBuffer, mimeType, language }) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    const err = new Error('GEMINI_API_KEY 未設定');
    err.code = 'CT-012';
    throw err;
  }

  const audioB64 = fileBuffer.toString('base64');
  const encoding = ENCODING_MAP[mimeType] || 'ENCODING_UNSPECIFIED';

  const url  = `https://speech.googleapis.com/v1p1beta1/speech:recognize?key=${apiKey}`;
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
    const text = await resp.text();
    throw new Error(`Google STT V1 error ${resp.status}: ${text}`);
  }
  const data = await resp.json();
  const parsed = parseV1Response(data);
  return { provider: 'google-stt', language, ...parsed };
}

// ── Whisper provider ──────────────────────────────────────────────────────────
// Calls a self-hosted Whisper HTTP service compatible with the OpenAI
// /v1/audio/transcriptions API (e.g. faster-whisper-server, whisper.cpp,
// or any FastAPI wrapper exposing the same multipart endpoint).
//
// Required env:
//   WHISPER_SERVICE_URL — base URL of the Whisper service
//                         e.g. http://localhost:9000 or https://whisper.internal
//
// Optional env:
//   WHISPER_MODEL — model name to request (default: 'large-v3')
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

  const model = process.env.WHISPER_MODEL || 'large-v3';

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
async function transcribeAudio({ fileBuffer, mimeType, language, filename, provider }) {
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
        const result = await transcribeWithGoogle({ fileBuffer, mimeType, language });
        return { ...result, fallbackFrom: 'whisper' };
      }
      throw err; // no fallback available, surface the error
    }
  }

  // Google STT (explicit or auto-fallback when no Whisper URL)
  return await transcribeWithGoogle({ fileBuffer, mimeType, language });
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

module.exports = { transcribeAudio, availableProviders, defaultProvider };
