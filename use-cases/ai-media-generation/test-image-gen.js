#!/usr/bin/env node
/**
 * End-to-end test for AI Media Generation image pipeline.
 * Run: node use-cases/ai-media-generation/test-image-gen.js
 *
 * Tests: health → create project → submit brief → poll → generate prompts → poll → generate image → poll → verify file
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:3000/api/media';
const POLL_INTERVAL_MS = 2000;
const MAX_WAIT_MS = 120_000; // 2 min

// ─── Helpers ──────────────────────────────────────────────────────────────────

function request(method, url, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const lib = parsed.protocol === 'https:' ? https : http;
    const opts = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    const req = lib.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function log(emoji, msg) { console.log(`${emoji}  ${msg}`); }
function ok(msg)   { log('✅', msg); }
function info(msg) { log('ℹ️ ', msg); }
function warn(msg) { log('⚠️ ', msg); }
function fail(msg) { log('❌', msg); process.exit(1); }

async function pollProject(projectId, stopStatuses, label) {
  const start = Date.now();
  while (Date.now() - start < MAX_WAIT_MS) {
    const r = await request('GET', `${BASE}/projects/${projectId}`);
    const status = r.body?.project?.status;
    const elapsed = Math.round((Date.now() - start) / 1000);
    info(`[${elapsed}s] Project status: ${status}`);
    if (stopStatuses.includes(status)) return r.body;
    if (status === 'error') fail(`Project entered error state during ${label}`);
    await sleep(POLL_INTERVAL_MS);
  }
  fail(`Timeout waiting for ${label}`);
}

async function pollAsset(assetId, label) {
  const start = Date.now();
  while (Date.now() - start < MAX_WAIT_MS) {
    const r = await request('GET', `${BASE}/assets/${assetId}`);
    if (r.status === 404) { warn('Asset not found yet — retrying'); await sleep(POLL_INTERVAL_MS); continue; }
    const asset = r.body?.asset;
    const elapsed = Math.round((Date.now() - start) / 1000);
    info(`[${elapsed}s] Asset status: ${asset?.status}, url: ${asset?.url || 'null'}`);
    if (asset?.status === 'error') {
      fail(`Asset entered error state: ${JSON.stringify(asset?.metadata_json)}`);
    }
    if (asset?.url && asset?.status !== 'generating') return asset;
    await sleep(POLL_INTERVAL_MS);
  }
  fail(`Timeout waiting for ${label}`);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  AI Media Generation — Integration Test');
  console.log('═══════════════════════════════════════════════════════\n');

  // ── 1. Health check ──────────────────────────────────────────────────────
  info('Checking server health…');
  try {
    const r = await request('GET', `${BASE}/health`);
    if (r.status !== 200) fail(`Health check failed: ${r.status}`);
    ok(`Server is up — ${JSON.stringify(r.body)}`);
  } catch (e) {
    fail(`Cannot reach server at ${BASE}: ${e.message}\nMake sure "npm start" is running first.`);
  }

  // ── 2. Create test project ────────────────────────────────────────────────
  info('Creating test project…');
  const projResp = await request('POST', `${BASE}/projects`, {
    name: `test-${Date.now()}`,
    client: 'TestClient',
    notes: 'Automated integration test',
  });
  if (projResp.status !== 200 || !projResp.body.project) {
    fail(`Create project failed: ${JSON.stringify(projResp.body)}`);
  }
  const project = projResp.body.project;
  ok(`Created project id=${project.id} name="${project.name}"`);

  // ── 3. Submit brief ───────────────────────────────────────────────────────
  const brief = `
Campaign: Summer Glow Skincare Launch
Client: GlowCo Beauty
Product: SPF 50 moisturiser for young adults (18-35)
Key message: Protect and glow all summer
CTA: Shop Now
Headline: Glow Brighter This Summer
Deliverables:
  - 1 Instagram post (1:1, image)
  - 1 Instagram story (9:16, image)
Tone: Fresh, youthful, sun-kissed editorial
Style: Bright natural lighting, models outdoors, golden hour
Brand colours: Warm coral, ivory, gold
Avoid: Dark backgrounds, heavy makeup looks
`.trim();

  info('Submitting brief (async)…');
  const briefResp = await request('POST', `${BASE}/projects/${project.id}/brief`, { brief });
  if (briefResp.status !== 200) fail(`Submit brief failed: ${JSON.stringify(briefResp.body)}`);
  ok(`Brief submitted — server response: ${JSON.stringify(briefResp.body)}`);

  // ── 4. Poll until brief processed ─────────────────────────────────────────
  info('Polling for brief translation + style guide…');
  const briefState = await pollProject(project.id, ['prompt_design', 'prompts_ready'], 'brief translation');
  ok(`Brief processed — project status: ${briefState.project.status}`);
  if (!briefState.project.brief_spec_json) fail('brief_spec_json is empty — translation may have failed');
  const spec = briefState.project.brief_spec_json;
  ok(`Deliverables found: ${spec.deliverables?.length || 0}`);
  if (!spec.deliverables?.length) fail('No deliverables in spec');

  // ── 5. Generate prompts ───────────────────────────────────────────────────
  info('Triggering prompt generation (async)…');
  const genResp = await request('POST', `${BASE}/projects/${project.id}/generate-prompts`);
  if (genResp.status !== 200) fail(`Generate prompts failed: ${JSON.stringify(genResp.body)}`);
  ok(`Prompt generation triggered — ${JSON.stringify(genResp.body)}`);

  // ── 6. Poll until prompts ready ───────────────────────────────────────────
  info('Polling for prompt generation…');
  const promptState = await pollProject(project.id, ['prompts_ready'], 'prompt generation');
  ok(`Prompts ready — count: ${promptState.prompts?.length || 0}`);
  if (!promptState.prompts?.length) fail('No prompts generated');

  const firstPrompt = promptState.prompts[0];
  const posPrompt = firstPrompt.prompt_json?.image?.positive;
  info(`First prompt id=${firstPrompt.id} format=${firstPrompt.format}`);
  if (!posPrompt) fail(`No positive prompt on record. prompt_json: ${JSON.stringify(firstPrompt.prompt_json)}`);
  ok(`Positive prompt: "${posPrompt.substring(0, 80)}…"`);

  // Check ad copy fields
  const imgJson = firstPrompt.prompt_json?.image;
  if (imgJson?.headline) ok(`Headline: "${imgJson.headline}"`);
  else warn('No headline in prompt_json.image (may be missing from LLM output)');
  if (imgJson?.cta) ok(`CTA: "${imgJson.cta}"`);

  // ── 7. Generate image ─────────────────────────────────────────────────────
  info(`Triggering image generation for prompt id=${firstPrompt.id} (model=flux)…`);
  const imgResp = await request('POST', `${BASE}/prompts/${firstPrompt.id}/generate-image`, { model: 'flux' });
  if (imgResp.status !== 200) fail(`Generate image failed (${imgResp.status}): ${JSON.stringify(imgResp.body)}`);
  const { assetId } = imgResp.body;
  if (!assetId) fail(`No assetId in response: ${JSON.stringify(imgResp.body)}`);
  ok(`Image generation started — assetId=${assetId}`);

  // ── 8. Poll until image ready ─────────────────────────────────────────────
  info('Polling for image download…');
  const asset = await pollAsset(assetId, 'image generation');
  ok(`Image ready — url: ${asset.url}, status: ${asset.status}`);

  // ── 9. Verify file on disk ────────────────────────────────────────────────
  if (asset.url?.startsWith('/api/media/serve/')) {
    const filename = path.basename(asset.url);
    const filePath = path.join(__dirname, '..', '..', 'uploads', 'media', filename);
    if (fs.existsSync(filePath)) {
      const sizeKB = Math.round(fs.statSync(filePath).size / 1024);
      ok(`File on disk: ${filePath} (${sizeKB} KB)`);
      if (sizeKB < 5) warn('File is very small — may not be a valid image');
    } else {
      fail(`File not found on disk: ${filePath}`);
    }
  } else {
    warn(`URL doesn't look like a local serve path: ${asset.url}`);
  }

  // ── 10. Verify serve endpoint ─────────────────────────────────────────────
  if (asset.url?.startsWith('/')) {
    info(`Verifying serve endpoint: GET ${asset.url}`);
    const serveResp = await request('GET', `http://localhost:3000${asset.url}`);
    if (serveResp.status === 200) ok('Serve endpoint returns 200');
    else warn(`Serve endpoint returned ${serveResp.status}`);
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  ✅  ALL TESTS PASSED');
  console.log('═══════════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('\n❌ Unexpected error:', err);
  process.exit(1);
});
