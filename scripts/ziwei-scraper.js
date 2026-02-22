#!/usr/bin/env node
/**
 * Ziwei Doushu Knowledge Scraper
 * ─────────────────────────────────────────────────────────────────────────────
 * Scrapes publicly-accessible Ziwei knowledge sources from ziwei-sources-database.json.
 * Respects robots.txt conventions: 1–2 s delay between requests, proper User-Agent.
 *
 * Usage:
 *   node scripts/ziwei-scraper.js [--source=source-017] [--phase=3] [--dry-run]
 *
 * Saves scraped content to: data/scraped/<source-id>-<slug>.json
 * Updates scrapingProgress in: data/ziwei-sources-database.json
 */

'use strict';

const https  = require('https');
const http   = require('http');
const fs     = require('fs');
const path   = require('path');
const url    = require('url');

// ── Paths ─────────────────────────────────────────────────────────────────────
const ROOT        = path.join(__dirname, '..');
const DB_PATH     = path.join(ROOT, 'data', 'ziwei-sources-database.json');
const SCRAPED_DIR = path.join(ROOT, 'data', 'scraped');

// ── CLI flags ─────────────────────────────────────────────────────────────────
const args     = process.argv.slice(2);
const DRY_RUN  = args.includes('--dry-run');
const onlyId   = (args.find(a => a.startsWith('--source=')) || '').replace('--source=', '') || null;
const onlyPhase= parseInt((args.find(a => a.startsWith('--phase='))  || '').replace('--phase=', '') || '0', 10);

// ── Config ────────────────────────────────────────────────────────────────────
const DELAY_MS   = 1500;   // polite delay between requests
const TIMEOUT_MS = 20000;
const UA = 'Mozilla/5.0 (compatible; ZiweiResearchBot/1.0; +https://github.com/bennettsui/5ml-agenticai-v1)';

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function fetchUrl(targetUrl) {
  return new Promise((resolve, reject) => {
    const parsed  = url.parse(targetUrl);
    const lib     = parsed.protocol === 'https:' ? https : http;
    const options = {
      hostname: parsed.hostname,
      path:     parsed.path,
      method:   'GET',
      headers: {
        'User-Agent': UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'identity',
      },
      timeout: TIMEOUT_MS,
    };
    const req = lib.request(options, (res) => {
      // Follow single redirect
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${targetUrl}`));
      }
      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body, headers: res.headers }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error(`Timeout: ${targetUrl}`)); });
    req.end();
  });
}

// ── HTML text extraction ──────────────────────────────────────────────────────
function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<header[\s\S]*?<\/header>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractMeta(html) {
  const title = (html.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1] || '';
  const desc  = (html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)/i) || [])[1] || '';
  const lang  = (html.match(/<html[^>]*lang=["']([^"']*)/i) || [])[1] || '';
  return { title: title.trim(), description: desc.trim(), language: lang };
}

function extractMainContent(html) {
  // Try to grab main content areas first
  const candidates = [
    /<main[\s\S]*?>([\s\S]*?)<\/main>/i,
    /<article[\s\S]*?>([\s\S]*?)<\/article>/i,
    /<div[^>]*class=["'][^"']*content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class=["'][^"']*post[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
  ];
  for (const re of candidates) {
    const m = html.match(re);
    if (m && m[1] && m[1].length > 500) return m[1];
  }
  return html; // fallback to full page
}

function extractChineseAstrologyContent(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 15);
  // Keep lines that mention Ziwei-relevant terms
  const relevant = lines.filter(l => {
    return /[紫微斗數命盤天機太陽武曲天同廉貞天府太陰貪狼巨門天相天梁七殺破軍輔弼文昌文曲祿存天馬化祿化權化科化忌命宮財帛官祿大限流年]/.test(l) ||
           /ziwei|doushu|palace|star|luck|transformation|fate|natal|chart|birth|astrology|divination/i.test(l);
  });
  return relevant.join('\n');
}

// ── Save output ───────────────────────────────────────────────────────────────
function saveScrapedData(sourceId, sourceName, sourceUrl, rawText, relevantText, meta) {
  if (!fs.existsSync(SCRAPED_DIR)) fs.mkdirSync(SCRAPED_DIR, { recursive: true });
  const slug     = sourceId;
  const filepath = path.join(SCRAPED_DIR, `${slug}.json`);
  const output   = {
    sourceId,
    sourceName,
    url: sourceUrl,
    scrapedAt: new Date().toISOString(),
    meta,
    stats: {
      rawCharacters:      rawText.length,
      relevantLines:      (relevantText.match(/\n/g) || []).length + 1,
      relevantCharacters: relevantText.length,
    },
    content: relevantText,
    rawTextSample: rawText.slice(0, 3000), // first 3000 chars of raw for debugging
  };
  fs.writeFileSync(filepath, JSON.stringify(output, null, 2), 'utf8');
  return filepath;
}

// ── Update database progress ──────────────────────────────────────────────────
function updateDbStatus(sourceId, status, charCount) {
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  const src = db.sources.find(s => s.id === sourceId);
  if (src) {
    src.status = status;
    src.lastScraped = new Date().toISOString();
    src.scrapedCharacters = charCount;
  }
  db.scrapingProgress.lastScrapedDate = new Date().toISOString();
  if (status === 'scraped') db.scrapingProgress.sources_scraped++;
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

// ── Scrape a single source ────────────────────────────────────────────────────
async function scrapeSource(source) {
  const { id, name, url: srcUrl, scraperNote } = source;

  if (scraperNote && /paywall|authentication|manual/i.test(scraperNote)) {
    console.log(`  ⚠  [${id}] Skipping — requires manual access: ${scraperNote}`);
    updateDbStatus(id, 'skipped_manual', 0);
    return null;
  }

  console.log(`  ↓  [${id}] ${name}`);
  console.log(`     ${srcUrl}`);

  if (DRY_RUN) {
    console.log(`     [DRY RUN] Would fetch URL`);
    return null;
  }

  try {
    const { body } = await fetchUrl(srcUrl);
    const meta     = extractMeta(body);
    const main     = extractMainContent(body);
    const rawText  = stripHtml(main);
    const relevant = extractChineseAstrologyContent(rawText);

    const filepath = saveScrapedData(id, name, srcUrl, rawText, relevant, meta);
    updateDbStatus(id, 'scraped', relevant.length);

    console.log(`     ✓ Saved: ${path.basename(filepath)}`);
    console.log(`       ${rawText.length.toLocaleString()} chars raw → ${relevant.length.toLocaleString()} chars relevant`);
    return { id, filepath, chars: relevant.length };
  } catch (err) {
    console.error(`     ✗ Error: ${err.message}`);
    updateDbStatus(id, 'error', 0);
    // Write error log
    const errPath = path.join(SCRAPED_DIR, `${id}-error.json`);
    fs.writeFileSync(errPath, JSON.stringify({ sourceId: id, url: srcUrl, error: err.message, at: new Date().toISOString() }, null, 2));
    return null;
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🔭 Ziwei Doushu Knowledge Scraper');
  console.log('══════════════════════════════════════════════════════');
  if (DRY_RUN) console.log('  MODE: DRY RUN (no requests will be made)');

  const db      = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  let sources   = db.sources.filter(s => s.status !== 'scraped');

  // Filters
  if (onlyId) {
    sources = sources.filter(s => s.id === onlyId);
    console.log(`  Filter: source = ${onlyId}`);
  } else if (onlyPhase) {
    const phaseKey = `phase${onlyPhase}`;
    const phaseSrcs = db.scrapingStrategy[phaseKey]?.sources || [];
    sources = sources.filter(s => phaseSrcs.includes(s.id));
    console.log(`  Filter: phase = ${onlyPhase} (${phaseSrcs.length} sources)`);
  }

  // Sort by priority
  sources.sort((a, b) => (a.priority || 99) - (b.priority || 99));

  console.log(`\n  Queued: ${sources.length} sources\n`);

  const results = [];
  for (const src of sources) {
    const result = await scrapeSource(src);
    if (result) results.push(result);
    await sleep(DELAY_MS);
  }

  // Summary
  console.log('\n══════════════════════════════════════════════════════');
  console.log(`✅ Done — ${results.length}/${sources.length} sources scraped`);
  const totalChars = results.reduce((sum, r) => sum + (r.chars || 0), 0);
  console.log(`   Total relevant content: ${totalChars.toLocaleString()} characters`);
  console.log(`   Saved to: ${SCRAPED_DIR}`);

  // Print updated progress
  const dbUpdated = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  console.log(`\n   DB Progress: ${dbUpdated.scrapingProgress.sources_scraped} sources scraped total`);
  console.log('');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
