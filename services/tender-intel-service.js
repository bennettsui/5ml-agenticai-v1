/**
 * Tender Intelligence Service
 *
 * Implements the HK+SG Tender Intelligence pipeline:
 *  - RSS/XML ingestor (no LLM)
 *  - HTML scraper stub (CSS-selector based, Haiku fallback)
 *  - Tender normalizer (deterministic + Haiku fallback)
 *  - Digest query helpers
 *  - Source registry CRUD
 *
 * Called from index.js API routes and cron jobs.
 */

'use strict';

const axios = require('axios');
const crypto = require('crypto');

// ─── Lightweight XML/RSS Parser ──────────────────────────────────────────────
// No xml2js dependency — handles RSS 2.0 + Atom + simple custom XML.

/**
 * Extract all occurrences of a tag's text content from an XML string.
 * Handles CDATA and simple text nodes. Does NOT handle attributes.
 */
function xmlTagValues(xml, tag) {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  const results = [];
  let m;
  while ((m = re.exec(xml)) !== null) {
    let val = m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
    results.push(val);
  }
  return results;
}

/** First occurrence of a tag, or null */
function xmlTagFirst(xml, tag) {
  return xmlTagValues(xml, tag)[0] || null;
}

/**
 * Parse an RSS 2.0 or Atom feed XML string.
 * Returns an array of raw item objects with: title, link, pubDate, description, guid
 */
function parseRSSFeed(xml) {
  const isAtom = /<feed\b/i.test(xml);
  const itemTag = isAtom ? 'entry' : 'item';

  // Split into item blocks
  const itemRe = new RegExp(`<${itemTag}[\\s\\S]*?<\\/${itemTag}>`, 'gi');
  const items = [];
  let m;
  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[0];
    const item = {
      title:       xmlTagFirst(block, 'title'),
      link:        null,
      pubDate:     null,
      description: null,
      guid:        null,
    };

    if (isAtom) {
      // Atom: <link href="..."> or <link>...</link>, <updated>, <summary>/<content>
      const linkHref = block.match(/<link[^>]+href=["']([^"']+)["']/i);
      item.link        = linkHref ? linkHref[1] : xmlTagFirst(block, 'link');
      item.pubDate     = xmlTagFirst(block, 'updated') || xmlTagFirst(block, 'published');
      item.description = xmlTagFirst(block, 'summary') || xmlTagFirst(block, 'content');
      item.guid        = xmlTagFirst(block, 'id');
    } else {
      // RSS 2.0
      item.link        = xmlTagFirst(block, 'link');
      item.pubDate     = xmlTagFirst(block, 'pubDate') || xmlTagFirst(block, 'dc:date');
      item.description = xmlTagFirst(block, 'description');
      item.guid        = xmlTagFirst(block, 'guid');
    }

    // Fallback guid: hash of title+link
    if (!item.guid) {
      item.guid = crypto.createHash('sha1')
        .update((item.title || '') + (item.link || '')).digest('hex').slice(0, 16);
    }

    // Decode HTML entities in title + description
    if (item.title)       item.title       = decodeHtmlEntities(item.title);
    if (item.description) item.description = decodeHtmlEntities(item.description);

    if (item.title) items.push(item);  // skip items with no title
  }

  return items;
}

/**
 * Parse a simple custom XML file where each row is a repeating element.
 * Used for GLD ETB XML which uses tabular XML rows.
 * rowTag: the repeating element name (e.g. 'Row', 'record', 'tender')
 * fieldMap: { standardField: 'XmlTagName' }
 * Returns array of objects with standardField keys.
 */
function parseTabularXML(xml, rowTag, fieldMap) {
  // Try common row tags if not specified
  const tags = rowTag ? [rowTag] : ['Row', 'row', 'record', 'tender', 'item', 'entry'];
  let rows = [];

  for (const tag of tags) {
    const tagRe = new RegExp(`<${tag}[\\s\\S]*?<\\/${tag}>`, 'gi');
    const found = [];
    let m;
    while ((m = tagRe.exec(xml)) !== null) found.push(m[0]);
    if (found.length > 0) {
      rows = found;
      break;
    }
  }

  return rows.map(rowXml => {
    const result = {};
    for (const [stdField, xmlTagName] of Object.entries(fieldMap)) {
      result[stdField] = xmlTagFirst(rowXml, xmlTagName) || null;
    }
    // Guid: hash of all field values
    result._guid = crypto.createHash('sha1')
      .update(Object.values(result).filter(Boolean).join('|')).digest('hex').slice(0, 16);
    result._raw = rowXml;
    return result;
  });
}

function decodeHtmlEntities(str) {
  return str
    .replace(/&amp;/g,  '&')
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g,  "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)));
}

// ─── Date Normalisation ───────────────────────────────────────────────────────

const MONTH_MAP = {
  jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12
};

/**
 * Try to parse various date formats → ISO date string (YYYY-MM-DD) or null.
 * Handles: ISO 8601, RFC 822 (RSS), DD/MM/YYYY, DD-MMM-YYYY, MM/DD/YYYY.
 */
function parseDate(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const s = raw.trim();
  if (!s) return null;

  // ISO 8601: 2025-12-31 or 2025-12-31T...
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;

  // RFC 822 RSS: Tue, 31 Dec 2025 ...
  m = s.match(/(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s+(\d{1,2})\s+(\w{3})\s+(\d{4})/i);
  if (m) {
    const month = MONTH_MAP[m[2].toLowerCase()];
    if (month) return `${m[3]}-${String(month).padStart(2,'0')}-${m[1].padStart(2,'0')}`;
  }

  // DD/MM/YYYY (HK HTML format)
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) {
    const [,d,mo,y] = m;
    if (parseInt(mo) <= 12) return `${y}-${mo.padStart(2,'0')}-${d.padStart(2,'0')}`;
  }

  // DD-MMM-YYYY: 31-Dec-2025
  m = s.match(/^(\d{1,2})-(\w{3})-(\d{4})/i);
  if (m) {
    const month = MONTH_MAP[m[2].toLowerCase()];
    if (month) return `${m[3]}-${String(month).padStart(2,'0')}-${m[1].padStart(2,'0')}`;
  }

  // Atom: 2025-12-31T23:59:59+08:00
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})T/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;

  return null;
}

// ─── Tender Ref Extraction ────────────────────────────────────────────────────

const TENDER_REF_PATTERNS = [
  /\bEMSD[^)\s,]+/i,              // EMSD(T)23/2025
  /\b[A-Z]{2,6}\([A-Z]\)\d+\/\d{4}\b/,  // Generic dept pattern HyD(T)01/2025
  /\b[A-Z]{2,8}[\/-]\w+\/\d{4}\b/,      // ISD/EA/2026/001
  /\bGeBIZ[-\w]+\d{4}[-\w]+/i,   // GeBIZ-MOE-2026-0231
  /\b[A-Z]{2,6}\d{6,}\b/,        // HY202514
  /\bTB\d{4}\/\d{2,4}\b/i,       // TB2025/001
];

function extractTenderRef(title, parsingNotes) {
  if (!title) return null;

  // Try parsing_notes hint first
  if (parsingNotes) {
    const hintMatch = parsingNotes.match(/\/(.+?)\//);
    if (hintMatch) {
      try {
        const re = new RegExp(hintMatch[1]);
        const m = title.match(re);
        if (m) return m[0];
      } catch (_) {}
    }
  }

  for (const re of TENDER_REF_PATTERNS) {
    const m = title.match(re);
    if (m) return m[0];
  }
  return null;
}

// ─── Category Classification ──────────────────────────────────────────────────

const CATEGORY_KEYWORDS = {
  IT_digital:             ['software', 'it ', 'digital', 'system', 'platform', 'cyber', 'app', 'database', 'network', 'cloud', 'data centre', 'computer'],
  events_experiential:    ['event', 'exhibition', 'ceremony', 'show', 'seminar', 'conference', 'forum', 'festival', 'performance'],
  marketing_comms:        ['marketing', 'publicity', 'campaign', 'media', 'communications', 'advertising', 'branding', 'pr ', 'printing'],
  consultancy_advisory:   ['consultancy', 'advisory', 'consulting', 'eoi', 'expression of interest', 'study', 'review', 'assessment'],
  construction_works:     ['construction', 'building', 'civil', 'structural', 'renovation', 'fitting', 'alteration', 'demolition', 'drainage', 'sewage'],
  facilities_management:  ['maintenance', 'lift', 'escalator', 'hvac', 'electrical', 'mechanical', 'cleaning', 'security', 'facilities'],
  social_services:        ['social', 'welfare', 'elderly', 'disability', 'youth', 'community', 'health', 'medical', 'hospital'],
  research_study:         ['research', 'survey', 'study', 'investigation', 'pilot', 'evaluation', 'impact assessment'],
  supplies_procurement:   ['supply', 'purchase', 'procurement', 'equipment', 'furniture', 'vehicle', 'material', 'goods'],
  financial_services:     ['insurance', 'audit', 'accounting', 'financial', 'banking', 'actuarial'],
  grant_funding:          ['grant', 'funding', 'subsidy', 'bursary', 'scholarship'],
};

function classifyByTitle(title) {
  if (!title) return ['other'];
  const lower = title.toLowerCase();
  const tags = [];
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) tags.push(cat);
  }
  return tags.length ? tags : ['other'];
}

// ─── Core Ingestor ────────────────────────────────────────────────────────────

/**
 * Fetch and parse a single RSS/XML source.
 * Returns { items, error }
 * items: array of { guid, title, link, pubDate, description, rawXml }
 */
async function fetchRSSSource(source) {
  const url = source.feed_url;
  if (!url) return { items: [], error: 'no_feed_url' };

  let responseText;
  try {
    const resp = await axios.get(url, {
      timeout: 15000,
      headers: { 'User-Agent': '5ML-TenderIntel/1.0 (+https://5ml.ai)' },
      maxRedirects: 5,
    });
    responseText = typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data);
  } catch (err) {
    return { items: [], error: `fetch_error: ${err.message}` };
  }

  let items = [];
  try {
    if (source.source_type === 'api_xml' && source.field_map) {
      // Tabular XML (e.g. GLD ETB)
      const rows = parseTabularXML(responseText, null, source.field_map);
      items = rows.map(row => ({
        guid:        row._guid,
        title:       row.title || row.Subject || null,
        link:        row.source_url || source.feed_url,
        pubDate:     row.publish_date || null,
        description: null,
        rawXml:      row._raw,
        preExtracted: row,
      }));
    } else {
      // RSS / Atom
      const parsed = parseRSSFeed(responseText);
      items = parsed.map(p => ({
        guid:        p.guid,
        title:       p.title,
        link:        p.link || source.feed_url,
        pubDate:     p.pubDate,
        description: p.description,
        rawXml:      null,
        preExtracted: { title: p.title, publish_date: p.pubDate, description_snippet: p.description },
      }));
    }
  } catch (err) {
    return { items: [], error: `parse_error: ${err.message}` };
  }

  return { items, error: null };
}

// ─── Normalizer ───────────────────────────────────────────────────────────────

/**
 * Normalise a raw capture into the unified Tender model.
 * Returns a normalised tender object or null if skipped.
 */
function normaliseTender(raw, source) {
  const pre = raw.pre_extracted || {};
  const title = pre.title || null;
  if (!title) return null;  // REQUIRED

  const closingDateRaw = pre.closing_date || null;
  const publishDateRaw = pre.publish_date || raw.captured_at || null;

  const closingDate  = parseDate(closingDateRaw);
  const publishDate  = parseDate(publishDateRaw);

  const now = new Date();
  let status = 'unknown_closing';
  if (closingDate) {
    status = new Date(closingDate) >= now ? 'open' : 'closed';
  }

  // Tender ref
  let tenderRef = pre.tender_ref || null;
  if (!tenderRef) {
    tenderRef = extractTenderRef(title, source.parsing_notes);
  }
  if (!tenderRef) {
    // Synthetic fallback
    tenderRef = `${source.source_id.slice(0,8)}-${crypto.createHash('sha1').update(title).digest('hex').slice(0,8)}`;
  }

  // Agency
  const agency = pre.agency || source.organisation || source.name || null;

  // Category
  const defaultTags = source.category_tags_default || [];
  const inferredTags = classifyByTitle(title);
  const categoryTags = [...new Set([...defaultTags, ...inferredTags])];

  return {
    source_id:               source.source_id,
    raw_pointer:             raw.capture_id || null,
    jurisdiction:            source.jurisdiction,
    owner_type:              source.owner_type,
    source_url:              raw.item_url || source.feed_url || null,
    mapping_version:         'v1.0',
    tender_ref:              tenderRef,
    title,
    description_snippet:     pre.description_snippet || null,
    agency,
    category_tags:           categoryTags,
    raw_category:            pre.raw_category || null,
    publish_date:            publishDate,
    publish_date_estimated:  !parseDate(publishDateRaw),
    closing_date:            closingDate,
    status,
    budget_min:              null,
    budget_max:              null,
    currency:                source.jurisdiction === 'HK' ? 'HKD' : source.jurisdiction === 'SG' ? 'SGD' : null,
    budget_source:           'unknown',
    is_canonical:            true,
    evaluation_status:       'pending',
    label:                   'unscored',
  };
}

// ─── DB Helpers ───────────────────────────────────────────────────────────────

/**
 * Get all active RSS/XML sources from the registry.
 */
async function getActiveSources(pool) {
  const result = await pool.query(
    `SELECT * FROM tender_source_registry
     WHERE status IN ('active', 'pending_validation')
       AND source_type IN ('rss_xml', 'api_xml')
     ORDER BY priority ASC, source_id ASC`
  );
  return result.rows;
}

/**
 * Get set of known guids from raw_tender_captures for dedup.
 */
async function getExistingGuids(pool) {
  const result = await pool.query('SELECT item_guid FROM raw_tender_captures');
  return new Set(result.rows.map(r => r.item_guid));
}

/**
 * Insert raw captures into raw_tender_captures.
 * Returns count of inserted rows.
 */
async function insertRawCaptures(pool, captures) {
  let inserted = 0;
  for (const c of captures) {
    try {
      const result = await pool.query(
        `INSERT INTO raw_tender_captures
           (source_id, raw_format, raw_payload, item_url, item_guid,
            captured_at, normalised, pre_extracted)
         VALUES ($1,$2,$3,$4,$5,NOW(),false,$6)
         ON CONFLICT (source_id, item_guid) WHERE item_guid IS NOT NULL DO NOTHING`,
        [
          c.source_id, c.raw_format, c.raw_payload || c.rawXml || '',
          c.item_url, c.item_guid,
          JSON.stringify(c.pre_extracted || {}),
        ]
      );
      // Only count rows that were actually inserted (not skipped by ON CONFLICT)
      if (result.rowCount > 0) inserted++;
    } catch (_) { /* duplicate or constraint — skip */ }
  }
  return inserted;
}

/**
 * Insert normalised tenders into tenders table.
 * Returns count of inserted rows.
 */
async function insertTenders(pool, tenders) {
  let inserted = 0;
  for (const t of tenders) {
    try {
      await pool.query(
        `INSERT INTO tenders (
          source_id, raw_pointer, jurisdiction, owner_type, source_url,
          mapping_version, tender_ref, title, description_snippet,
          agency, category_tags, raw_category,
          publish_date, publish_date_estimated, closing_date, status,
          budget_min, budget_max, currency, budget_source,
          is_canonical, evaluation_status, label, first_seen_at, last_seen_at
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,
          $17,$18,$19,$20,$21,$22,$23,NOW(),NOW()
        )
        ON CONFLICT (tender_ref, jurisdiction)
          WHERE tender_ref IS NOT NULL AND is_canonical = TRUE
        DO UPDATE SET
          title            = EXCLUDED.title,
          closing_date     = EXCLUDED.closing_date,
          status           = EXCLUDED.status,
          category_tags    = EXCLUDED.category_tags,
          last_seen_at     = NOW()`,
        [
          t.source_id, t.raw_pointer, t.jurisdiction, t.owner_type, t.source_url,
          t.mapping_version, t.tender_ref, t.title, t.description_snippet,
          t.agency, t.category_tags, t.raw_category,
          t.publish_date, t.publish_date_estimated, t.closing_date, t.status,
          t.budget_min, t.budget_max, t.currency, t.budget_source,
          t.is_canonical, t.evaluation_status, t.label,
        ]
      );
      inserted++;
    } catch (_) { /* skip */ }
  }
  return inserted;
}

/**
 * Log an agent run to tender_agent_run_logs.
 */
async function logAgentRun(pool, { agentName, status, itemsProcessed, newItems, durationMs, detail }) {
  try {
    const meta = JSON.stringify({ new_items: newItems || 0, duration_ms: durationMs || 0 });
    await pool.query(
      `INSERT INTO tender_agent_run_logs
         (agent_name, status, items_processed, error_detail, meta, started_at, completed_at)
       VALUES ($1,$2,$3,$4,$5,NOW(),NOW())`,
      [agentName, status, itemsProcessed || 0, detail || null, meta]
    );
  } catch (_) { /* non-fatal */ }
}

// ─── Main Ingest Pipeline ─────────────────────────────────────────────────────

/**
 * Run the full RSS/XML ingestion + normalisation pipeline.
 * Called daily at 03:00 HKT or via manual trigger.
 * Returns a run summary object.
 */
/**
 * Run ingestion across all active RSS/XML sources and GeBIZ.
 *
 * @param {Pool}     pool        - pg Pool
 * @param {function} onProgress  - optional SSE callback: (eventObj) => void
 *
 * Records are always APPENDED (ON CONFLICT DO NOTHING on raw captures;
 * ON CONFLICT DO UPDATE SET last_seen_at on tenders — content never overwritten).
 *
 * To avoid re-ingesting recently checked sources in scheduled runs,
 * pass skipRecentHours > 0. Manual triggers should pass 0 (run all).
 */
async function runIngestion(pool, onProgress = null, skipRecentHours = 0) {
  const emit = (data) => { if (onProgress) onProgress(data); };
  const startTime = Date.now();
  const summary = {
    sourcesProcessed: 0,
    sourcesSkipped:   0,
    totalRawCaptures: 0,
    newRawCaptures:   0,
    tendersInserted:  0,
    errors:           [],
    sourceResults:    [],
  };

  let sources;
  try {
    sources = await getActiveSources(pool);
  } catch (err) {
    summary.errors.push({ stage: 'load_sources', error: err.message });
    return summary;
  }

  // Count GeBIZ source separately
  let gebizSource = null;
  try {
    const gbResult = await pool.query(
      `SELECT * FROM tender_source_registry WHERE source_id LIKE '%gebiz%' AND source_type = 'html_list' AND status = 'active' LIMIT 1`
    );
    gebizSource = gbResult.rows[0] || null;
  } catch (_) {}

  const totalSources = sources.length + (gebizSource ? 1 : 0);
  emit({
    type: 'init',
    total: totalSources,
    sources: [
      ...sources.map(s => ({ source_id: s.source_id, name: s.name || s.source_id, type: s.source_type })),
      ...(gebizSource ? [{ source_id: gebizSource.source_id, name: 'GeBIZ (HTML Scrape)', type: 'html_list' }] : []),
    ],
  });

  const existingGuids = await getExistingGuids(pool);
  let sourceIndex = 0;

  // ─── RSS / XML sources ────────────────────────────────────────────────────
  for (const source of sources) {
    sourceIndex++;
    const srcStart = Date.now();

    // Skip recently checked sources (for cron scheduling — not for manual triggers)
    if (skipRecentHours > 0 && source.last_checked_at) {
      const hoursSince = (Date.now() - new Date(source.last_checked_at).getTime()) / 3_600_000;
      if (hoursSince < skipRecentHours) {
        summary.sourcesSkipped++;
        emit({
          type: 'source_done', source: source.name || source.source_id,
          status: 'skipped', skippedHoursAgo: hoursSince.toFixed(1),
          found: 0, new: 0, tenders: 0,
        });
        continue;
      }
    }

    summary.sourcesProcessed++;
    emit({ type: 'source_start', source: source.name || source.source_id, source_id: source.source_id, index: sourceIndex, total: totalSources });

    const { items, error } = await fetchRSSSource(source);

    if (error) {
      summary.errors.push({ source_id: source.source_id, error });
      summary.sourceResults.push({ source_id: source.source_id, status: 'error', newItems: 0, error });
      try {
        await pool.query(
          `UPDATE tender_source_registry SET last_status='error', last_status_detail=$1, last_checked_at=NOW() WHERE source_id=$2`,
          [error, source.source_id]
        );
      } catch (_) {}
      emit({ type: 'source_done', source: source.name || source.source_id, status: 'error', found: 0, new: 0, tenders: 0, error });
      continue;
    }

    const newItems = items.filter(item => !existingGuids.has(item.guid));
    summary.totalRawCaptures += items.length;

    // Insert new raw captures (append-only — ON CONFLICT DO NOTHING)
    const rawCaptures = newItems.map(item => ({
      source_id:     source.source_id,
      raw_format:    'rss_xml',
      raw_payload:   item.rawXml || JSON.stringify(item),
      item_url:      item.link || source.feed_url,
      item_guid:     item.guid,
      pre_extracted: item.preExtracted || {
        title: item.title, publish_date: item.pubDate, description_snippet: item.description,
      },
    }));

    const inserted = await insertRawCaptures(pool, rawCaptures);
    summary.newRawCaptures += inserted;
    for (const item of newItems) existingGuids.add(item.guid);

    // Normalise + insert tenders (append-only — ON CONFLICT updates last_seen_at only)
    let tendersInserted = 0;
    for (const raw of rawCaptures) {
      const capture = {
        capture_id: null, source_id: raw.source_id, raw_format: raw.raw_format,
        raw_payload: raw.raw_payload, item_url: raw.item_url, item_guid: raw.item_guid,
        captured_at: new Date().toISOString(), pre_extracted: raw.pre_extracted,
      };
      const normalised = normaliseTender(capture, source);
      if (normalised) tendersInserted += await insertTenders(pool, [normalised]);
    }
    summary.tendersInserted += tendersInserted;

    try {
      await pool.query(
        `UPDATE tender_source_registry SET last_status='ok', last_status_detail=$1, last_checked_at=NOW() WHERE source_id=$2`,
        [`${inserted} new captures, ${tendersInserted} tenders`, source.source_id]
      );
    } catch (_) {}

    summary.sourceResults.push({ source_id: source.source_id, status: 'success', newItems: inserted, durationMs: Date.now() - srcStart });
    emit({
      type: 'source_done', source: source.name || source.source_id,
      status: 'ok', found: items.length, new: inserted, tenders: tendersInserted,
      durationMs: Date.now() - srcStart,
    });
  }

  // ─── GeBIZ HTML scraping (SG html_list source) ───────────────────────────
  if (gebizSource) {
    sourceIndex++;
    summary.sourcesProcessed++;
    emit({ type: 'source_start', source: 'GeBIZ (HTML Scrape)', source_id: gebizSource.source_id, index: sourceIndex, total: totalSources });

    const { items: gebizItems, errors: gebizErrors } = await fetchGeBIZ();

    if (gebizErrors.length > 0) {
      const errMsg = gebizErrors.join('; ');
      summary.errors.push({ source_id: gebizSource.source_id, error: errMsg });
      try {
        await pool.query(
          `UPDATE tender_source_registry SET last_status='error', last_status_detail=$1, last_checked_at=NOW() WHERE source_id=$2`,
          [errMsg, gebizSource.source_id]
        );
      } catch (_) {}
      emit({ type: 'source_done', source: 'GeBIZ (HTML Scrape)', status: 'error', found: 0, new: 0, tenders: 0, error: errMsg });
    } else {
      const newGeBIZ = gebizItems.filter(item => !existingGuids.has(item.guid));
      summary.totalRawCaptures += gebizItems.length;

      const gebizCaptures = newGeBIZ.map(item => ({
        source_id: gebizSource.source_id, raw_format: 'html_fragment',
        raw_payload: JSON.stringify(item), item_url: item.link || gebizSource.feed_url,
        item_guid: item.guid, pre_extracted: item.preExtracted || { title: item.title },
      }));

      const gbInserted = await insertRawCaptures(pool, gebizCaptures);
      summary.newRawCaptures += gbInserted;
      for (const item of newGeBIZ) existingGuids.add(item.guid);

      let gbTenders = 0;
      for (const raw of gebizCaptures) {
        const capture = {
          capture_id: null, source_id: raw.source_id, raw_format: raw.raw_format,
          raw_payload: raw.raw_payload, item_url: raw.item_url, item_guid: raw.item_guid,
          captured_at: new Date().toISOString(), pre_extracted: raw.pre_extracted,
        };
        const normalised = normaliseTender(capture, gebizSource);
        if (normalised) gbTenders += await insertTenders(pool, [normalised]);
      }
      summary.tendersInserted += gbTenders;

      try {
        await pool.query(
          `UPDATE tender_source_registry SET last_status='ok', last_status_detail=$1, last_checked_at=NOW() WHERE source_id=$2`,
          [`${gbInserted} new captures, ${gbTenders} tenders`, gebizSource.source_id]
        );
      } catch (_) {}

      summary.sourceResults.push({ source_id: gebizSource.source_id, status: 'success', newItems: gbInserted, durationMs: 0 });
      emit({ type: 'source_done', source: 'GeBIZ (HTML Scrape)', status: 'ok', found: gebizItems.length, new: gbInserted, tenders: gbTenders });
    }
  }

  const durationMs = Date.now() - startTime;

  await logAgentRun(pool, {
    agentName:      'RSSXMLIngestorAgent',
    status:         summary.errors.length > 0 ? 'partial' : 'success',
    itemsProcessed: summary.totalRawCaptures,
    newItems:       summary.newRawCaptures,
    durationMs,
    detail:         `${summary.sourcesProcessed} sources, ${summary.newRawCaptures} new captures, ${summary.tendersInserted} tenders`,
  });

  emit({
    type: 'done',
    newCaptures: summary.newRawCaptures,
    tendersInserted: summary.tendersInserted,
    sources: summary.sourcesProcessed,
    skipped: summary.sourcesSkipped,
    errors: summary.errors.length,
    durationMs,
  });

  summary.durationMs = durationMs;
  return summary;
}

// ─── API Query Helpers ────────────────────────────────────────────────────────

/** GET /api/tender-intel/tenders — filterable list */
async function getTenders(pool, { jurisdiction, label, status, search, limit = 50, offset = 0 } = {}) {
  const conditions = [];
  const params = [];
  let i = 1;

  if (jurisdiction && jurisdiction !== 'all') {
    conditions.push(`t.jurisdiction = $${i++}`);
    params.push(jurisdiction.toUpperCase());
  }
  if (label && label !== 'all') {
    conditions.push(`t.label = $${i++}`);
    params.push(label);
  }
  if (status && status !== 'all') {
    conditions.push(`t.status = $${i++}`);
    params.push(status);
  }
  if (search) {
    conditions.push(`(t.title ILIKE $${i} OR t.tender_ref ILIKE $${i} OR t.agency ILIKE $${i})`);
    params.push(`%${search}%`);
    i++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM tenders t ${where}`, params
  );
  const total = parseInt(countResult.rows[0].count);

  params.push(limit, offset);
  const result = await pool.query(
    `SELECT t.*, s.name AS source_name, s.organisation
     FROM tenders t
     LEFT JOIN tender_source_registry s ON t.source_id = s.source_id
     ${where}
     ORDER BY t.publish_date DESC NULLS LAST, t.first_seen_at DESC
     LIMIT $${i} OFFSET $${i+1}`,
    params
  );

  return { tenders: result.rows, total };
}

/** GET /api/tender-intel/sources — source registry with run status */
async function getSources(pool, { jurisdiction, status } = {}) {
  const conditions = [];
  const params = [];
  let i = 1;

  if (jurisdiction && jurisdiction !== 'all') {
    conditions.push(`jurisdiction = $${i++}`);
    params.push(jurisdiction.toUpperCase());
  }
  if (status && status !== 'all') {
    conditions.push(`status = $${i++}`);
    params.push(status);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await pool.query(
    `SELECT * FROM tender_source_registry ${where} ORDER BY priority ASC, source_id ASC`,
    params
  );
  return result.rows;
}

/** GET /api/tender-intel/logs — recent agent run logs */
async function getLogs(pool, { limit = 50 } = {}) {
  const result = await pool.query(
    `SELECT * FROM tender_agent_run_logs ORDER BY started_at DESC LIMIT $1`,
    [limit]
  );
  return result.rows;
}

/** GET /api/tender-intel/digest — latest tenders for the daily digest view */
async function getDigest(pool) {
  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysLater = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  const newToday = await pool.query(
    `SELECT COUNT(*) FROM tenders WHERE DATE(first_seen_at) = $1`, [today]
  );
  const priority = await pool.query(
    `SELECT COUNT(*) FROM tenders WHERE label = 'priority' AND status = 'open'`
  );
  const closingSoon = await pool.query(
    `SELECT COUNT(*) FROM tenders WHERE status = 'open' AND closing_date BETWEEN $1 AND $2`,
    [today, sevenDaysLater]
  );
  const sourcesOk = await pool.query(
    `SELECT COUNT(*) FROM tender_source_registry WHERE last_status = 'ok'`
  );
  const totalSources = await pool.query(
    `SELECT COUNT(*) FROM tender_source_registry WHERE status = 'active'`
  );

  // Top tenders for digest (priority first, then consider, ordered by closing date)
  const tendersResult = await pool.query(
    `SELECT t.*, s.name AS source_name, s.organisation,
            e.overall_relevance_score  AS overall_score,
            e.capability_fit_score     AS capability_fit,
            e.business_potential_score AS business_potential,
            e.rationale                AS reasoning_summary
     FROM tenders t
     LEFT JOIN tender_source_registry s ON t.source_id = s.source_id
     LEFT JOIN tender_evaluations e
       ON t.tender_id = e.tender_id AND e.is_latest = TRUE
     WHERE t.status = 'open' AND t.label != 'ignore'
     ORDER BY
       CASE t.label WHEN 'priority' THEN 0 WHEN 'consider' THEN 1 WHEN 'partner_only' THEN 2 ELSE 3 END,
       t.closing_date ASC NULLS LAST
     LIMIT 20`
  );

  const lastRun = await pool.query(
    `SELECT started_at AS run_at, status FROM tender_agent_run_logs
     WHERE agent_name = 'RSSXMLIngestorAgent'
     ORDER BY started_at DESC LIMIT 1`
  );

  const tenderRows = tendersResult.rows;
  const hkCount = tenderRows.filter(t => t.jurisdiction === 'HK').length;
  const sgCount = tenderRows.filter(t => t.jurisdiction === 'SG').length;
  const priorityCount = parseInt(priority.rows[0].count);

  // Generate AI narrative summary (DeepSeek, with fallback)
  const narrative = await generateDigestNarrative(
    tenderRows,
    { hk: hkCount, sg: sgCount, priority: priorityCount },
    today
  );

  return {
    stats: {
      newToday:     parseInt(newToday.rows[0].count),
      priority:     priorityCount,
      closingSoon:  parseInt(closingSoon.rows[0].count),
      sourcesOk:    `${sourcesOk.rows[0].count}/${totalSources.rows[0].count}`,
    },
    tenders:   tenderRows,
    narrative,
    lastRun:   lastRun.rows[0] || null,
  };
}

// ─── Capability Profile (default — overridable via DB settings) ───────────────

const DEFAULT_PROFILE = {
  // 5 Miles Lab (5ML) — HK-based Agentic AI Solutions Agency
  // Competes with NDN and Fimmick; serves enterprise and SME clients
  competencies: [
    'IT_digital',          // AI platforms, agentic systems, workflow automation, website health check
    'events_experiential', // AI Photo Booth, live events, exhibitions, activations
    'marketing_comms',     // Social media, ads performance, brand campaigns, content, PR
    'consultancy_advisory',// Management consultancy, strategy, AI advisory, EOI responses
    'research_study',      // Topic intelligence, market research, AI-powered analysis
    'financial_services',  // Finance automation, receipt OCR, invoice tracking (Man's Accounting)
  ],
  trackRecordKeywords: [
    // AI / tech
    'AI', 'artificial intelligence', 'agentic', 'automation', 'digital', 'platform',
    'system', 'software', 'intelligence', 'technology', 'IT', 'web', 'mobile', 'app',
    // Events / experiential
    'event', 'exhibition', 'experiential', 'activation', 'photo booth', 'live',
    'performance', 'cultural', 'arts', 'festival', 'ceremony',
    // Marketing / comms
    'marketing', 'campaign', 'social media', 'communications', 'brand', 'content',
    'media', 'advertising', 'promotion', 'public relations', 'PR', 'creative',
    // Consultancy / advisory
    'consultancy', 'advisory', 'strategy', 'consultant', 'study', 'research',
    'assessment', 'review', 'training', 'workshop',
    // Production
    'production', 'design', 'video', 'photography', 'print',
  ],
  // Agencies known to post tenders matching 5ML scope (HK & SG)
  seedAgencies: {
    HK: [
      'ISD',   // Information Services Department — comms, public education, media
      'LCSD',  // Leisure and Cultural Services — events, cultural, experiential
      'HKTDC', // HK Trade Development Council — events, trade fairs, marketing
      'HKTB',  // HK Tourism Board — tourism marketing, events
      'CreateHK',   // Creative industries support — creative, content
      'InvestHK',   // Investment promotion — marketing, communications
      'OGCIO', // Office of Gov Chief Information Officer — IT, digital
      'ITC',   // Innovation and Technology Commission — AI, tech
      'HAD',   // Home Affairs — community events, cultural activities
      'HKPC',  // HK Productivity Council — IT services, digital
      'TID',   // Trade and Industry Department — business services
    ],
    SG: [
      'GovTech',          // Government Technology Agency — IT, digital
      'STB',              // Singapore Tourism Board — events, tourism marketing
      'Enterprise Singapore', // Business development, marketing
      'NAC',              // National Arts Council — events, arts, experiential
      'IMDA',             // Info-communications Media Dev Authority — digital, media
      'DesignSingapore',  // Design, creative, branding
      'MTI',              // Ministry of Trade & Industry — consultancy
    ],
  },
  knownAgencies: [],   // populated at runtime from tender_decisions 'track' history
  maxDeliveryFTE: 15,
  primaryJurisdiction: 'HK',
  secondaryJurisdiction: 'SG',
  // Budget bands aligned to 5ML pricing tiers
  budgetBands: {
    HK: { enterprise: 500000, midMarket: 100000, sme: 30000 },
    SG: { enterprise: 100000, midMarket: 30000, sme: 10000 },
  },
  scoringWeights: {
    capabilityFit: {
      categoryMatch: 0.35, agencyFamiliarity: 0.15,
      deliveryScale: 0.20, keywordOverlap: 0.20, geographicFit: 0.10,
    },
    businessPotential: {
      budget: 0.30, budgetProxy: 0.15, strategicBeachhead: 0.20,
      categoryGrowth: 0.15, timeToDeadline: 0.10, recurrencePotential: 0.10,
    },
    overallWeights: { capabilityFit: 0.55, businessPotential: 0.45 },
  },
  version: 'v1.1',
};

// Categories with growing gov spend
const GROWTH_CATEGORIES = new Set(['IT_digital', 'events_experiential', 'marketing_comms', 'consultancy_advisory', 'research_study']);
// Categories adjacent to our competencies
const ADJACENT_MAP = {
  IT_digital:          ['consultancy_advisory', 'research_study'],
  events_experiential: ['marketing_comms'],
  marketing_comms:     ['events_experiential', 'consultancy_advisory'],
  consultancy_advisory:['IT_digital', 'research_study'],
  research_study:      ['consultancy_advisory'],
};

// ─── Evaluator: pure scoring logic (no LLM) ───────────────────────────────────

function scoreCapabilityFit(tender, profile) {
  const w = profile.scoringWeights.capabilityFit;

  // categoryMatch
  const competencySet = new Set(profile.competencies);
  const exactMatches = tender.category_tags.filter(t => competencySet.has(t));
  const adjacentMatches = tender.category_tags.filter(t => {
    const adj = ADJACENT_MAP[t] || [];
    return adj.some(a => competencySet.has(a));
  });
  const categoryScore = exactMatches.length > 0 ? 1.0
    : adjacentMatches.length > 0 ? 0.5
    : 0.0;

  // agencyFamiliarity
  const knownSet = new Set((profile.knownAgencies || []).map(a => a.toLowerCase()));
  const agencyScore = tender.agency && knownSet.has(tender.agency.toLowerCase()) ? 1.0 : 0.0;

  // deliveryScale: estimate FTE from category + budget proxy
  const budgetProxy = tender.budget_min || (tender.jurisdiction === 'HK' ? 1400000 : 300000);
  const estimatedFTE = Math.ceil(budgetProxy / 200000);  // rough: 1 FTE / HK$200k
  const deliveryScore = estimatedFTE <= profile.maxDeliveryFTE ? 1.0
    : estimatedFTE <= profile.maxDeliveryFTE * 1.5 ? 0.5
    : 0.0;

  // keywordOverlap
  const titleWords = (tender.title || '').toLowerCase().split(/\W+/);
  const descWords  = (tender.description_snippet || '').toLowerCase().split(/\W+/);
  const allWords   = new Set([...titleWords, ...descWords].filter(w => w.length > 3));
  const kw         = profile.trackRecordKeywords.map(k => k.toLowerCase());
  const matches    = kw.filter(k => allWords.has(k) || [...allWords].some(w => w.includes(k)));
  const overlapScore = Math.min((matches.length / Math.max(kw.length * 0.3, 3)), 1.0);

  // geographicFit
  const geoScore = tender.jurisdiction === profile.primaryJurisdiction ? 1.0
    : tender.jurisdiction === profile.secondaryJurisdiction ? 0.7
    : 0.3;

  const total = (categoryScore   * w.categoryMatch)
              + (agencyScore     * w.agencyFamiliarity)
              + (deliveryScore   * w.deliveryScale)
              + (overlapScore    * w.keywordOverlap)
              + (geoScore        * w.geographicFit);

  return {
    score: Math.min(Math.max(total, 0), 1),
    signals: {
      category_match:      categoryScore,
      agency_familiarity:  agencyScore,
      delivery_scale:      deliveryScore,
      keyword_overlap:     overlapScore,
      geographic_fit:      geoScore,
    },
  };
}

function scoreBusinessPotential(tender, profile) {
  const w = profile.scoringWeights.businessPotential;
  const isHK = tender.jurisdiction === 'HK';

  // budget
  const hkThresholds = { hi: 500000, mid: 100000, lo: 50000 };
  const sgThresholds = { hi: 100000, mid: 30000,  lo: 20000 };
  const thr = isHK ? hkThresholds : sgThresholds;
  let budgetScore = 0;
  if (tender.budget_source === 'stated' && tender.budget_min != null) {
    budgetScore = tender.budget_min >= thr.hi ? 1.0 : tender.budget_min >= thr.mid ? 0.6 : 0.2;
  }

  // budgetProxy (open tender = large contract proxy)
  const proxyBudget = tender.budget_min || (isHK ? 1400000 : 300000);
  const proxyScore = proxyBudget >= (isHK ? 1400000 : 300000) ? 0.9
    : proxyBudget >= (isHK ? 200000 : 50000) ? 0.7
    : 0.3;

  // strategicBeachhead
  const knownSet = new Set((profile.knownAgencies || []).map(a => a.toLowerCase()));
  const isKnown = tender.agency && knownSet.has(tender.agency.toLowerCase());
  const beachheadScore = isKnown ? 0.4 : 0.8;

  // categoryGrowth
  const growthScore = tender.category_tags.some(t => GROWTH_CATEGORIES.has(t)) ? 0.9 : 0.5;

  // timeToDeadline
  const daysLeft = tender.closing_date
    ? Math.ceil((new Date(tender.closing_date).getTime() - Date.now()) / 86400000)
    : null;
  const deadlineScore = !daysLeft ? 0.3 : daysLeft > 30 ? 1.0 : daysLeft >= 14 ? 0.7 : daysLeft >= 7 ? 0.4 : 0.1;

  // recurrencePotential
  const titleLower = (tender.title || '').toLowerCase();
  const recurrenceKeywords = ['framework', 'annual', 'multi-year', 'panel', 'standing offer', 'retainer'];
  const recurrenceScore = recurrenceKeywords.some(k => titleLower.includes(k)) ? 0.9 : 0.3;

  const total = (budgetScore     * w.budget)
              + (proxyScore      * w.budgetProxy)
              + (beachheadScore  * w.strategicBeachhead)
              + (growthScore     * w.categoryGrowth)
              + (deadlineScore   * w.timeToDeadline)
              + (recurrenceScore * w.recurrencePotential);

  return {
    score: Math.min(Math.max(total, 0), 1),
    signals: {
      budget:                budgetScore,
      budget_proxy:          proxyScore,
      strategic_beachhead:   beachheadScore,
      category_growth:       growthScore,
      time_to_deadline:      deadlineScore,
      recurrence_potential:  recurrenceScore,
    },
  };
}

function assignLabel(overall, deliveryScale) {
  if (deliveryScale < 0.5) return 'partner_only';
  if (overall >= 0.70) return 'priority';
  if (overall >= 0.50) return 'consider';
  if (overall >= 0.35) return 'partner_only';
  return 'ignore';
}

/**
 * Generate a rationale for one tender using DeepSeek Reasoner.
 * Returns a plain-English 2-3 sentence rationale.
 */
async function generateRationale(tender, capFit, bizPot, label) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return `Scored ${label}: capability fit ${(capFit.score * 100).toFixed(0)}%, business potential ${(bizPot.score * 100).toFixed(0)}%. Category: ${tender.category_tags.join(', ') || 'general'}.`;

  try {
    const resp = await axios.post(
      'https://api.deepseek.com/chat/completions',
      {
        model: 'deepseek-chat',  // chat is cheaper for short rationale generation
        messages: [
          {
            role: 'system',
            content: 'You are a tender evaluation analyst for a HK digital marketing, events, and technology agency. Write concise, factual tender evaluations.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              task: 'Write exactly 2-3 sentences explaining why this tender scored this label. Mention the top 2 positive signals and 1 concern. Be specific and factual.',
              tender: {
                title:              tender.title,
                agency:             tender.agency,
                jurisdiction:       tender.jurisdiction,
                category_tags:      tender.category_tags,
                closing_date:       tender.closing_date,
                budget_stated:      tender.budget_min ? `${tender.currency || 'HKD'}$${tender.budget_min}` : 'not stated',
              },
              label:            label.toUpperCase(),
              capability_fit:   (capFit.score * 100).toFixed(0) + '%',
              business_potential: (bizPot.score * 100).toFixed(0) + '%',
              top_signals: {
                category_match:     capFit.signals.category_match,
                keyword_overlap:    capFit.signals.keyword_overlap,
                time_to_deadline:   bizPot.signals.time_to_deadline,
                strategic_beachhead: bizPot.signals.strategic_beachhead,
              },
            }),
          },
        ],
        max_tokens: 150,
        temperature: 0.3,
      },
      { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, timeout: 20000 }
    );
    return resp.data?.choices?.[0]?.message?.content?.trim() || '';
  } catch (_) {
    return `Scored ${label}: capability fit ${(capFit.score * 100).toFixed(0)}%, business potential ${(bizPot.score * 100).toFixed(0)}%.`;
  }
}

/**
 * Run evaluation on all pending tenders.
 * Returns { evaluated, errors }.
 */
async function runEvaluation(pool, profileOverride) {
  const profile = profileOverride || DEFAULT_PROFILE;

  // Load known agencies from past tracked decisions
  try {
    const decidedResult = await pool.query(
      `SELECT DISTINCT t.agency FROM tender_decisions d
       JOIN tenders t ON t.tender_id = d.tender_id
       WHERE d.decision = 'track' AND t.agency IS NOT NULL`
    );
    profile.knownAgencies = decidedResult.rows.map(r => r.agency).filter(Boolean);
  } catch (_) {}

  // Load pending tenders
  const { rows: pending } = await pool.query(
    `SELECT t.tender_id, t.jurisdiction, t.owner_type, t.title, t.agency,
            t.category_tags, t.closing_date, t.status, t.budget_min, t.budget_max,
            t.budget_source, t.currency, t.description_snippet, t.source_id
     FROM tenders t
     WHERE t.evaluation_status = 'pending' AND t.status = 'open'
     ORDER BY t.first_seen_at DESC
     LIMIT 100`
  );

  const evaluated = [];
  const errors    = [];

  // Map lowercase internal labels to display labels for tender_evaluations table
  const EVAL_LABEL_MAP = {
    priority: 'Priority', consider: 'Consider',
    partner_only: 'Partner-only', ignore: 'Ignore',
  };

  for (const tender of pending) {
    try {
      const capFit = scoreCapabilityFit(tender, profile);
      const bizPot = scoreBusinessPotential(tender, profile);
      const overall = (capFit.score * profile.scoringWeights.overallWeights.capabilityFit)
                    + (bizPot.score * profile.scoringWeights.overallWeights.businessPotential);
      const label = assignLabel(overall, capFit.signals.delivery_scale);
      const evalLabel = EVAL_LABEL_MAP[label] || 'Ignore';

      const rationale = await generateRationale(tender, capFit, bizPot, label);

      // Mark previous evaluations as not latest
      await pool.query(
        `UPDATE tender_evaluations SET is_latest = FALSE WHERE tender_id = $1 AND is_latest = TRUE`,
        [tender.tender_id]
      );

      // Insert new evaluation as latest
      await pool.query(
        `INSERT INTO tender_evaluations
           (tender_id, capability_fit_score, business_potential_score, overall_relevance_score,
            label, rationale, signals_used, scoring_weights, scoring_version, is_latest, evaluated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,TRUE,NOW())`,
        [
          tender.tender_id,
          capFit.score, bizPot.score, overall, evalLabel,
          rationale,
          JSON.stringify({ capability_fit: capFit.signals, business_potential: bizPot.signals }),
          JSON.stringify(profile.scoringWeights),
          profile.version,
        ]
      );

      // Update tenders table label + evaluation_status
      await pool.query(
        `UPDATE tenders SET label=$1, evaluation_status='scored', last_seen_at=NOW() WHERE tender_id=$2`,
        [label, tender.tender_id]
      );

      evaluated.push({ tender_id: tender.tender_id, label, overall });
    } catch (err) {
      errors.push({ tender_id: tender.tender_id, error: err.message });
    }
  }

  await logAgentRun(pool, {
    agentName:       'TenderEvaluatorAgent',
    status:          errors.length > 0 ? 'partial' : 'success',
    itemsProcessed:  pending.length,
    newItems:        evaluated.length,
    durationMs:      0,
    detail:          `${evaluated.length} tenders scored, ${errors.length} errors`,
  });

  return { evaluated, errors, profile_version: profile.version };
}

// ─── GeBIZ HTML Scraper ───────────────────────────────────────────────────────

/**
 * Scrape GeBIZ public business opportunity listing.
 * GeBIZ uses JSF/Facelets — we fetch the HTML directly and parse with regex.
 * Rate limited: 2s between page requests.
 */
async function fetchGeBIZ() {
  const BASE_URL = 'https://www.gebiz.gov.sg/ptn/opportunity/BOListing.xhtml';
  const items = [];
  const errors = [];

  try {
    const resp = await axios.get(BASE_URL, {
      timeout: 20000,
      headers: {
        'User-Agent': '5ML-TenderIntel/1.0 (+https://5ml.ai)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    const html = resp.data || '';
    // Parse table rows — GeBIZ uses a data table with class "list-view-table" or similar
    // Each row contains: Title, Category, Agency, Open Date, Close Date, Status
    const rowRe = /<tr[^>]*class="[^"]*(?:odd|even|dataRow)[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi;
    const cellRe = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const linkRe = /href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i;
    const stripTagsRe = /<[^>]+>/g;

    let rowMatch;
    while ((rowMatch = rowRe.exec(html)) !== null) {
      const rowHtml = rowMatch[1];
      const cells = [];
      let cellMatch;
      const cellRegex = new RegExp(cellRe.source, 'gi');
      while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
        cells.push(cellMatch[1].replace(stripTagsRe, '').trim());
      }
      if (cells.length < 3) continue;

      // Try to get the tender URL from the row
      const linkMatch = linkRe.exec(rowHtml);
      const tenderUrl = linkMatch ? `https://www.gebiz.gov.sg${linkMatch[1]}` : BASE_URL;
      const title = cells[0] || cells[1] || '';
      if (!title) continue;

      const guid = crypto.createHash('sha1').update(title + (cells[2] || '')).digest('hex').slice(0, 16);
      items.push({
        guid,
        title:       decodeHtmlEntities(title),
        link:        tenderUrl,
        pubDate:     cells[3] || null,   // Open Date column
        description: cells[1] || null,   // Category column
        rawXml:      null,
        preExtracted: {
          title,
          publish_date:       cells[3] || null,
          closing_date:       cells[4] || null,
          agency:             cells[2] || null,
          raw_category:       cells[1] || null,
          description_snippet: null,
        },
      });
    }
  } catch (err) {
    errors.push(`GeBIZ fetch error: ${err.message}`);
  }

  return { items, errors };
}

// ─── Digest Narrative Generator ───────────────────────────────────────────────

/**
 * Generate a 1-2 paragraph AI narrative summarising today's tender landscape.
 * Falls back to a rule-based summary if DeepSeek is unavailable.
 */
async function generateDigestNarrative(tenders, stats, today) {
  const topTenders = tenders
    .filter(t => t.label !== 'ignore')
    .sort((a, b) => (b.overall_score || 0) - (a.overall_score || 0))
    .slice(0, 10);

  if (!process.env.DEEPSEEK_API_KEY || topTenders.length === 0) {
    const hk = tenders.filter(t => t.jurisdiction === 'HK').length;
    const sg = tenders.filter(t => t.jurisdiction === 'SG').length;
    const priority = tenders.filter(t => t.label === 'priority').length;
    return `Today's digest surfaces ${tenders.length} tenders across HK (${hk}) and SG (${sg}). ${priority > 0 ? `${priority} priority opportunities identified.` : 'No priority tenders today.'} Review the full list below and mark relevant tenders for follow-up.`;
  }

  try {
    const resp = await axios.post(
      'https://api.deepseek.com/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a senior tender intelligence analyst for a HK digital marketing and events agency. Write concise daily briefings.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              task: 'Write a 1-2 paragraph daily briefing (150-200 words) summarising today\'s government tender landscape. Highlight notable themes, high-value opportunities, and important deadlines. Be factual and brief.',
              date: today,
              stats: { hk: stats.hk, sg: stats.sg, priority: stats.priority },
              top_tenders: topTenders.map(t => ({
                title:       t.title,
                agency:      t.agency,
                jurisdiction: t.jurisdiction,
                label:       t.label,
                closing_date: t.closing_date,
                score:       (t.overall_score * 100).toFixed(0) + '%',
              })),
            }),
          },
        ],
        max_tokens: 300,
        temperature: 0.4,
      },
      { headers: { Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`, 'Content-Type': 'application/json' }, timeout: 30000 }
    );
    return resp.data?.choices?.[0]?.message?.content?.trim() || '';
  } catch (_) {
    return `Today's tender landscape shows ${tenders.length} new opportunities across HK and SG. Review scored tenders below.`;
  }
}

// ─── Decision Recording ───────────────────────────────────────────────────────

async function recordDecision(pool, { tenderId, action, notes }) {
  // Map frontend action names to schema decision values
  const decisionMap = {
    track: 'track', ignore: 'ignore', partner_only: 'partner_needed',
    not_for_us: 'not_for_us', assign_to_team: 'assigned',
  };
  const decision = decisionMap[action] || action;

  await pool.query(
    `INSERT INTO tender_decisions (tender_id, decision, notes, decided_at)
     VALUES ($1,$2,$3,NOW())`,
    [tenderId, decision, notes || null]
  );

  // Update tenders label to reflect decision
  if (action === 'track') {
    await pool.query(`UPDATE tenders SET label='priority', last_seen_at=NOW() WHERE tender_id=$1`, [tenderId]);
  } else if (action === 'ignore' || action === 'not_for_us') {
    await pool.query(`UPDATE tenders SET label='ignore', last_seen_at=NOW() WHERE tender_id=$1`, [tenderId]);
  } else if (action === 'partner_only') {
    await pool.query(`UPDATE tenders SET label='partner_only', last_seen_at=NOW() WHERE tender_id=$1`, [tenderId]);
  }
}

// ─── Get Capability Profile ───────────────────────────────────────────────────

async function getProfile(pool) {
  try {
    const { rows } = await pool.query(
      `SELECT meta FROM tender_agent_run_logs WHERE agent_name = '__capability_profile__' ORDER BY started_at DESC LIMIT 1`
    );
    if (rows.length > 0 && rows[0].meta) return JSON.parse(rows[0].meta);
  } catch (_) {}
  return DEFAULT_PROFILE;
}

async function saveProfile(pool, profile) {
  // Store profile as a special log entry (reuses existing table without schema change)
  await pool.query(
    `INSERT INTO tender_agent_run_logs (agent_name, status, items_processed, items_failed, meta, started_at, completed_at)
     VALUES ('__capability_profile__', 'success', 0, 0, $1, NOW(), NOW())`,
    [JSON.stringify(profile)]
  );
}

// ─── Source Discovery Agent ───────────────────────────────────────────────────

/**
 * Scan hub pages for new RSS/XML/HTML feed URLs.
 * Use DeepSeek to extract RSS/tender URLs from a hub page when regex finds nothing.
 * Sends a compact list of href values for AI analysis rather than raw HTML.
 */
async function extractUrlsWithAI(hub, html) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return { urls: [], model: null };

  // Extract all hrefs from HTML — gives AI clean URL list without tag noise
  const hrefRe = /href="([^"#][^"]*)"/gi;
  const hrefs = [];
  let m;
  const searchHtml = html.slice(0, 30000);
  while ((m = hrefRe.exec(searchHtml)) !== null) {
    const u = m[1].trim();
    if (u && !u.startsWith('javascript') && !u.startsWith('mailto')) hrefs.push(u);
  }
  // Deduplicate, keep first 150
  const uniqueHrefs = [...new Set(hrefs)].slice(0, 150);
  if (uniqueHrefs.length === 0) return { urls: [], model: 'deepseek-chat' };

  const model = 'deepseek-chat';
  try {
    const resp = await axios.post(
      'https://api.deepseek.com/chat/completions',
      {
        model,
        messages: [
          {
            role: 'system',
            content: 'You identify tender/procurement-related URLs. Respond ONLY with a JSON array of URL strings. No markdown, no explanation.',
          },
          {
            role: 'user',
            content: `These href values are from a government page at ${hub.url}.\n\nReturn a JSON array of URLs that are: RSS/XML/Atom feeds, tender listing pages, procurement opportunity listings, or quotation notice pages. Make relative URLs absolute using the base: ${new URL(hub.url).origin}\n\nIf none match, return [].\n\nHrefs:\n${uniqueHrefs.join('\n')}`,
          },
        ],
        max_tokens: 600,
        temperature: 0.0,
      },
      {
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        timeout: 20000,
      }
    );
    const raw = resp.data?.choices?.[0]?.message?.content?.trim() || '[]';
    const arrayMatch = raw.match(/\[[\s\S]*?\]/);
    if (!arrayMatch) return { urls: [], model };
    const parsed = JSON.parse(arrayMatch[0]);
    const urls = Array.isArray(parsed)
      ? parsed.filter(u => typeof u === 'string' && u.startsWith('http'))
      : [];
    return { urls, model };
  } catch (_) {
    return { urls: [], model };
  }
}

/**
 * For each html_hub source in the registry, fetch its page and extract feed links.
 * New feeds are inserted into tender_source_registry with status 'pending_validation'.
 *
 * @param {Pool} pool  — pg Pool
 * @param {function} onProgress — optional SSE callback: (eventObj) => void
 * Returns { newSources, errors, hubsScanned, durationMs }.
 */
/**
 * @param {Pool}     pool           - pg Pool
 * @param {function} onProgress     - optional SSE callback
 * @param {number}   skipRecentHours - skip hubs scanned within N hours (0 = always run)
 */
async function runSourceDiscovery(pool, onProgress = null, skipRecentHours = 0) {
  const emit = (data) => { if (onProgress) onProgress(data); };
  const startTime = Date.now();
  const newSources = [];
  const errors = [];
  let hubsScanned = 0;
  let hubsSkipped = 0;

  // Known hub pages to scan (also pick up html_hub sources from DB)
  const STATIC_HUBS = [
    { url: 'https://www.gov.hk/en/about/rss.htm',              jurisdiction: 'HK', label: 'GovHK RSS Directory' },
    { url: 'https://www.dsd.gov.hk/EN/RSS_Feeds/index.html',   jurisdiction: 'HK', label: 'DSD RSS Hub' },
  ];

  // Also load html_hub sources from the registry
  let dbHubs = [];
  try {
    const { rows } = await pool.query(
      `SELECT source_id, name, discovery_hub_url, base_url, jurisdiction
       FROM tender_source_registry
       WHERE source_type = 'html_hub' AND status IN ('active', 'pending_validation')
       ORDER BY priority ASC`
    );
    dbHubs = rows;
  } catch (_) {}

  // Deduplicate by URL — DB hubs may include the STATIC_HUBS
  const seenUrls = new Set(STATIC_HUBS.map(h => h.url));
  const hubsToScan = [
    ...STATIC_HUBS,
    ...dbHubs
      .map(h => ({ url: h.discovery_hub_url || h.base_url, jurisdiction: h.jurisdiction, label: h.name }))
      .filter(h => h.url && !seenUrls.has(h.url) && seenUrls.add(h.url)),
  ];

  // Build lookup map: url → DB row (for last_checked_at tracking)
  const hubUrlToDbRow = {};
  for (const h of dbHubs) {
    if (h.discovery_hub_url) hubUrlToDbRow[h.discovery_hub_url] = h;
    if (h.base_url) hubUrlToDbRow[h.base_url] = h;
  }

  emit({
    type: 'init',
    total: hubsToScan.length,
    aiEnabled: !!process.env.DEEPSEEK_API_KEY,
    skipRecentHours,
  });

  // Get existing feed URLs to avoid re-adding known sources
  const existingUrls = new Set();
  try {
    const { rows } = await pool.query(`SELECT feed_url FROM tender_source_registry WHERE feed_url IS NOT NULL`);
    rows.forEach(r => existingUrls.add(r.feed_url));
  } catch (_) {}

  // Regex patterns to detect RSS/Atom/XML feed links in HTML
  // Pattern 1: <link rel="alternate" type="application/rss+xml" href="...">
  // Pattern 2: hrefs containing rss/atom/feed/xml/tender with .xml extension
  // Pattern 3: any .xml hrefs
  const FEED_PATTERNS = [
    /type="application\/(?:rss|atom)\+xml"[^>]*href="([^"]+)"/gi,
    /href="((?:https?:\/\/[^"]*)?\/[^"]*(?:rss|atom|feed|tender|procurement)[^"]*\.(?:xml|rss|atom)[^"]*)"/gi,
    /href="([^"]+\.xml)"/gi,
  ];

  for (let idx = 0; idx < hubsToScan.length; idx++) {
    const hub = hubsToScan[idx];
    const dbRow = hubUrlToDbRow[hub.url];

    // Skip recently scanned hubs (for cron; manual trigger passes skipRecentHours=0)
    if (skipRecentHours > 0 && dbRow?.last_checked_at) {
      const hoursSince = (Date.now() - new Date(dbRow.last_checked_at).getTime()) / 3_600_000;
      if (hoursSince < skipRecentHours) {
        hubsSkipped++;
        emit({ type: 'hub_done', hub: hub.label, status: 'skipped', skippedHoursAgo: hoursSince.toFixed(1), found: 0, aiUsed: false });
        continue;
      }
    }

    hubsScanned++;
    emit({ type: 'hub_start', hub: hub.label, url: hub.url, index: idx + 1, total: hubsToScan.length });

    // ── Fetch hub page ─────────────────────────────────────────────────────
    let html;
    try {
      const resp = await axios.get(hub.url, {
        timeout: 15000,
        headers: { 'User-Agent': '5ML-TenderIntel/1.0 (+https://5ml.ai)' },
        maxRedirects: 5,
      });
      html = typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data);
    } catch (err) {
      const errMsg = err.code === 'ECONNREFUSED' ? 'connection refused'
        : err.code === 'ETIMEDOUT' ? 'timeout'
        : err.response ? `HTTP ${err.response.status}`
        : err.message;
      errors.push({ hub: hub.label, error: errMsg });
      // Track last check even on failure so we don't hammer broken URLs
      if (dbRow) {
        try { await pool.query(`UPDATE tender_source_registry SET last_checked_at=NOW(), last_status='error', last_status_detail=$1 WHERE source_id=$2`, [errMsg, dbRow.source_id]); } catch (_) {}
      }
      emit({ type: 'hub_done', hub: hub.label, status: 'error', error: errMsg, found: 0, aiUsed: false });
      continue;
    }

    // ── Regex scan ─────────────────────────────────────────────────────────
    const foundUrls = new Set();
    for (const pattern of FEED_PATTERNS) {
      const re = new RegExp(pattern.source, 'gi');
      let m;
      while ((m = re.exec(html)) !== null) {
        let url = m[1];
        if (!url) continue;
        if (url.startsWith('/')) {
          const base = new URL(hub.url);
          url = `${base.protocol}//${base.host}${url}`;
        }
        if (!url.startsWith('http')) continue;
        if (!existingUrls.has(url)) foundUrls.add(url);
      }
    }

    // ── AI fallback — DeepSeek extracts URLs when regex finds nothing ──────
    let aiUsed = false;
    let aiModel = null;
    if (foundUrls.size === 0) {
      emit({ type: 'hub_ai', hub: hub.label, status: 'querying_ai' });
      const { urls: aiUrls, model } = await extractUrlsWithAI(hub, html);
      aiModel = model;
      if (aiUrls.length > 0) {
        aiUsed = true;
        for (let u of aiUrls) {
          if (u.startsWith('/')) { const base = new URL(hub.url); u = `${base.protocol}//${base.host}${u}`; }
          if (u.startsWith('http') && !existingUrls.has(u)) foundUrls.add(u);
        }
      }
    }

    // ── Insert new sources ─────────────────────────────────────────────────
    let inserted = 0;
    for (const feedUrl of foundUrls) {
      try {
        const sourceId = `discovered-${crypto.createHash('sha1').update(feedUrl).digest('hex').slice(0, 12)}`;
        const result = await pool.query(
          `INSERT INTO tender_source_registry
             (source_id, name, organisation, owner_type, jurisdiction, source_type,
              access, priority, status, feed_url, category_tags_default, notes, created_at, updated_at)
           VALUES ($1,$2,$3,'gov',$4,'rss_xml','public',3,'pending_validation',$5,'{}', $6, NOW(), NOW())
           ON CONFLICT (source_id) DO NOTHING
           RETURNING source_id`,
          [
            sourceId,
            `Discovered: ${new URL(feedUrl).hostname}`,
            new URL(feedUrl).hostname,
            hub.jurisdiction,
            feedUrl,
            `Auto-discovered from ${hub.label} on ${new Date().toISOString().slice(0, 10)}`,
          ]
        );
        if (result.rowCount > 0) {
          existingUrls.add(feedUrl);
          newSources.push({ source_id: sourceId, feed_url: feedUrl, jurisdiction: hub.jurisdiction, hub: hub.label });
          inserted++;
        }
      } catch (_) { /* duplicate or constraint violation */ }
    }

    // Persist last_checked_at on the DB hub row (success path)
    if (dbRow) {
      const detail = inserted > 0 ? `${inserted} new feeds discovered` : foundUrls.size > 0 ? `${foundUrls.size} already known` : 'no feeds found';
      try { await pool.query(`UPDATE tender_source_registry SET last_checked_at=NOW(), last_status='ok', last_status_detail=$1 WHERE source_id=$2`, [detail, dbRow.source_id]); } catch (_) {}
    }

    emit({
      type: 'hub_done',
      hub: hub.label,
      status: inserted > 0 ? 'found' : foundUrls.size > 0 ? 'known' : 'none',
      found: inserted,
      scanned: foundUrls.size,
      aiUsed,
      aiModel,
    });
  }

  const durationMs = Date.now() - startTime;

  await logAgentRun(pool, {
    agentName:      'SourceDiscoveryAgent',
    status:         errors.length > 0 && newSources.length === 0 ? 'error' : errors.length > 0 ? 'partial' : 'success',
    itemsProcessed: hubsScanned,
    newItems:       newSources.length,
    durationMs,
    detail:         `${hubsScanned} hubs scanned, ${newSources.length} new sources discovered`,
  });

  emit({ type: 'done', newSources: newSources.length, hubsScanned, hubsSkipped, errors: errors.length, durationMs });

  return { newSources, errors, hubsScanned, durationMs };
}

// ─── Schema Initialization + Auto-seed ───────────────────────────────────────

/**
 * Create all tender intelligence tables (idempotent — safe to call on every boot).
 * Also auto-seeds source registry from seed file if it's empty.
 * Called from index.js startup after initDatabase().
 */
async function initTenderSchema(pool) {
  const steps = [];

  // 1. Enable pgvector (optional — graceful skip if unavailable)
  let vectorEnabled = false;
  try {
    await pool.query('CREATE EXTENSION IF NOT EXISTS vector');
    vectorEnabled = true;
    steps.push('pgvector: enabled');
  } catch (_) {
    steps.push('pgvector: not available (title_embedding will be TEXT)');
  }

  // 2. Create tables (all idempotent with IF NOT EXISTS)
  await pool.query(`
    -- Source Registry
    CREATE TABLE IF NOT EXISTS tender_source_registry (
      source_id                 TEXT PRIMARY KEY,
      name                      TEXT NOT NULL,
      organisation              TEXT,
      owner_type                TEXT NOT NULL DEFAULT 'gov',
      jurisdiction              TEXT NOT NULL,
      source_type               TEXT NOT NULL DEFAULT 'rss_xml',
      access                    TEXT NOT NULL DEFAULT 'public',
      priority                  SMALLINT NOT NULL DEFAULT 2,
      status                    TEXT NOT NULL DEFAULT 'active',
      base_url                  TEXT,
      feed_url                  TEXT,
      discovery_hub_url         TEXT,
      ingest_method             TEXT,
      update_pattern            TEXT DEFAULT 'unknown',
      update_times_hkt          TEXT[],
      field_map                 JSONB,
      parsing_notes             TEXT,
      scraping_config           JSONB,
      category_tags_default     TEXT[] NOT NULL DEFAULT '{}',
      legal_notes               TEXT,
      reliability_score         FLOAT,
      tags                      TEXT[] DEFAULT '{}',
      notes                     TEXT,
      last_checked_at           TIMESTAMPTZ,
      last_status               TEXT,
      last_status_detail        TEXT,
      created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_tsr_jurisdiction ON tender_source_registry(jurisdiction);
    CREATE INDEX IF NOT EXISTS idx_tsr_status ON tender_source_registry(status);
    CREATE INDEX IF NOT EXISTS idx_tsr_source_type ON tender_source_registry(source_type);

    -- Raw Capture Layer
    CREATE TABLE IF NOT EXISTS raw_tender_captures (
      capture_id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      source_id                 TEXT NOT NULL REFERENCES tender_source_registry(source_id),
      raw_format                TEXT NOT NULL DEFAULT 'rss_xml',
      raw_payload               TEXT NOT NULL,
      pre_extracted             JSONB,
      item_url                  TEXT,
      item_guid                 TEXT,
      captured_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      normalised                BOOLEAN NOT NULL DEFAULT FALSE,
      normalised_tender_id      UUID,
      mapping_version           TEXT
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_rtc_source_guid ON raw_tender_captures(source_id, item_guid) WHERE item_guid IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_rtc_normalised ON raw_tender_captures(normalised) WHERE normalised = FALSE;
    CREATE INDEX IF NOT EXISTS idx_rtc_captured_at ON raw_tender_captures(captured_at DESC);

    -- Tender Evaluations
    CREATE TABLE IF NOT EXISTS tender_evaluations (
      eval_id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tender_id                 UUID NOT NULL,
      capability_fit_score      FLOAT NOT NULL DEFAULT 0,
      business_potential_score  FLOAT NOT NULL DEFAULT 0,
      overall_relevance_score   FLOAT NOT NULL DEFAULT 0,
      is_latest                 BOOLEAN NOT NULL DEFAULT FALSE,
      label                     TEXT NOT NULL DEFAULT 'Ignore',
      rationale                 TEXT NOT NULL DEFAULT '',
      signals_used              JSONB,
      scoring_weights           JSONB,
      model_used                TEXT,
      evaluated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      scoring_version           TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_te_tender_id ON tender_evaluations(tender_id);
    CREATE INDEX IF NOT EXISTS idx_te_evaluated_at ON tender_evaluations(evaluated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_te_label ON tender_evaluations(label);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_te_tender_latest ON tender_evaluations(tender_id) WHERE is_latest = TRUE;

    -- Tender Decisions
    CREATE TABLE IF NOT EXISTS tender_decisions (
      decision_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tender_id                 UUID NOT NULL,
      decision                  TEXT NOT NULL DEFAULT 'track',
      decided_by                TEXT NOT NULL DEFAULT 'founder',
      decided_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      notes                     TEXT,
      assigned_to               TEXT,
      pipeline_stage            TEXT,
      pipeline_entered_at       TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS idx_td_tender_id ON tender_decisions(tender_id);
    CREATE INDEX IF NOT EXISTS idx_td_decided_at ON tender_decisions(decided_at DESC);
    CREATE INDEX IF NOT EXISTS idx_td_decision ON tender_decisions(decision);

    -- Daily Digests
    CREATE TABLE IF NOT EXISTS tender_daily_digests (
      digest_id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      digest_date               DATE NOT NULL UNIQUE,
      tenders_surfaced          UUID[] DEFAULT '{}',
      narrative_summary         TEXT,
      hk_top_count              INT DEFAULT 0,
      sg_top_count              INT DEFAULT 0,
      closing_soon_count        INT DEFAULT 0,
      new_tenders_total         INT DEFAULT 0,
      sources_active            INT DEFAULT 0,
      sources_with_issues       INT DEFAULT 0,
      source_issue_details      JSONB,
      generated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      email_sent_at             TIMESTAMPTZ
    );

    -- Agent Run Logs
    CREATE TABLE IF NOT EXISTS tender_agent_run_logs (
      log_id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      agent_name                TEXT NOT NULL,
      run_id                    TEXT,
      started_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at              TIMESTAMPTZ,
      status                    TEXT DEFAULT 'success',
      items_processed           INT DEFAULT 0,
      items_failed              INT DEFAULT 0,
      error_detail              TEXT,
      meta                      JSONB
    );
    CREATE INDEX IF NOT EXISTS idx_tarl_agent_name ON tender_agent_run_logs(agent_name);
    CREATE INDEX IF NOT EXISTS idx_tarl_started_at ON tender_agent_run_logs(started_at DESC);

    -- Calibration Reports
    CREATE TABLE IF NOT EXISTS tender_calibration_reports (
      report_id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      generated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      summary                   TEXT,
      accuracy_precision        FLOAT,
      accuracy_recall           FLOAT,
      accuracy_f1               FLOAT,
      recommendations           JSONB,
      no_changes_needed         BOOLEAN DEFAULT FALSE,
      approved_at               TIMESTAMPTZ,
      approved_updates          JSONB
    );
  `);
  steps.push('core tables: created / verified');

  // 3. Create tenders table (handle vector column depending on pgvector availability)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tenders (
      tender_id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      source_id                 TEXT NOT NULL REFERENCES tender_source_registry(source_id),
      source_references         TEXT[] DEFAULT '{}',
      raw_pointer               UUID REFERENCES raw_tender_captures(capture_id),
      jurisdiction              TEXT NOT NULL,
      owner_type                TEXT NOT NULL DEFAULT 'gov',
      source_url                TEXT,
      mapping_version           TEXT,
      tender_ref                TEXT,
      title                     TEXT NOT NULL,
      description_snippet       TEXT,
      agency                    TEXT,
      category_tags             TEXT[] DEFAULT '{}',
      raw_category              TEXT,
      publish_date              DATE,
      publish_date_estimated    BOOLEAN DEFAULT FALSE,
      closing_date              DATE,
      status                    TEXT NOT NULL DEFAULT 'open',
      first_seen_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_seen_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      budget_min                NUMERIC(15, 2),
      budget_max                NUMERIC(15, 2),
      currency                  TEXT,
      budget_source             TEXT DEFAULT 'unknown',
      is_canonical              BOOLEAN NOT NULL DEFAULT TRUE,
      canonical_tender_id       UUID REFERENCES tenders(tender_id),
      evaluation_status         TEXT NOT NULL DEFAULT 'pending',
      label                     TEXT NOT NULL DEFAULT 'unscored',
      created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_tenders_ref_jurisdiction ON tenders(tender_ref, jurisdiction) WHERE tender_ref IS NOT NULL AND is_canonical = TRUE;
    CREATE INDEX IF NOT EXISTS idx_tenders_closing_date ON tenders(closing_date) WHERE status = 'open';
    CREATE INDEX IF NOT EXISTS idx_tenders_evaluation_status ON tenders(evaluation_status);
    CREATE INDEX IF NOT EXISTS idx_tenders_label ON tenders(label);
    CREATE INDEX IF NOT EXISTS idx_tenders_jurisdiction ON tenders(jurisdiction);
    CREATE INDEX IF NOT EXISTS idx_tenders_category_tags ON tenders USING GIN(category_tags);
  `);

  // Add vector embedding column only if pgvector is available
  if (vectorEnabled) {
    try {
      await pool.query(`ALTER TABLE tenders ADD COLUMN IF NOT EXISTS title_embedding vector(1536)`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_tenders_embedding ON tenders USING ivfflat (title_embedding vector_cosine_ops) WITH (lists = 50)`);
      steps.push('tenders: vector(1536) embedding column ready');
    } catch (_) {
      steps.push('tenders: vector index skipped (table may need data first)');
    }
  } else {
    await pool.query(`ALTER TABLE tenders ADD COLUMN IF NOT EXISTS title_embedding TEXT`);
    steps.push('tenders: title_embedding stored as TEXT (no pgvector)');
  }

  // 4. Allow api_xml source type (migration)
  try {
    await pool.query(`
      ALTER TABLE tender_source_registry DROP CONSTRAINT IF EXISTS tender_source_registry_source_type_check;
      ALTER TABLE tender_source_registry ADD CONSTRAINT tender_source_registry_source_type_check
        CHECK (source_type IN ('rss_xml', 'api_json', 'api_xml', 'csv_open_data', 'html_list', 'html_hub', 'html_reference'));
    `);
  } catch (_) { /* constraint already applied */ }
  steps.push('migrations: applied');

  // 5. Auto-seed source registry if empty
  const { rows: countRows } = await pool.query('SELECT COUNT(*) AS n FROM tender_source_registry');
  if (parseInt(countRows[0].n, 10) === 0) {
    const seeded = await _autoSeedSources(pool);
    steps.push(`sources: auto-seeded ${seeded} entries from registry`);
  } else {
    steps.push(`sources: ${countRows[0].n} entries already in registry`);
  }

  console.log(`✅ Tender schema ready: ${steps.join(' | ')}`);
  return steps;
}

/**
 * Load and insert sources from source-registry-seed.json.
 * Called automatically by initTenderSchema when registry is empty.
 */
async function _autoSeedSources(pool) {
  let seedData;
  try {
    const path = require('path');
    seedData = require(path.join(__dirname, '../use-cases/hk-sg-tender-intelligence/data/source-registry-seed.json'));
  } catch (_) {
    return 0;
  }

  const sources = (seedData.sources || []).filter(
    s => !['reference_only', 'stage_2_only'].includes(s.status)
  );

  let inserted = 0;
  for (const src of sources) {
    try {
      await pool.query(
        `INSERT INTO tender_source_registry (
          source_id, name, organisation, owner_type, jurisdiction, source_type,
          access, priority, status, discovery_hub_url, feed_url, ingest_method,
          update_pattern, field_map, scraping_config, category_tags_default,
          parsing_notes, legal_notes, notes, tags, created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,NOW(),NOW())
        ON CONFLICT (source_id) DO NOTHING`,
        [
          src.source_id, src.name, src.organisation || null, src.owner_type,
          src.jurisdiction, src.source_type, src.access || 'public', src.priority || 2,
          src.status, src.discovery_hub_url || null, src.feed_url || null,
          src.ingest_method || null, src.update_pattern || null,
          src.field_map ? JSON.stringify(src.field_map) : null,
          src.scraping_config ? JSON.stringify(src.scraping_config) : null,
          src.category_tags_default || [], src.parsing_notes || null,
          src.legal_notes || null, src.notes || null, src.tags || [],
        ]
      );
      inserted++;
    } catch (_) { /* skip individual errors */ }
  }
  return inserted;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  initTenderSchema,
  runIngestion,
  runEvaluation,
  runSourceDiscovery,
  fetchGeBIZ,
  generateDigestNarrative,
  recordDecision,
  getProfile,
  saveProfile,
  getTenders,
  getSources,
  getLogs,
  getDigest,
  // Lower-level helpers (for testing)
  parseRSSFeed,
  parseTabularXML,
  parseDate,
  normaliseTender,
  classifyByTitle,
  DEFAULT_PROFILE,
};
