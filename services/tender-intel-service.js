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
      await pool.query(
        `INSERT INTO raw_tender_captures
           (source_id, raw_format, raw_payload, item_url, item_guid,
            captured_at, normalised, pre_extracted)
         VALUES ($1,$2,$3,$4,$5,NOW(),false,$6)
         ON CONFLICT (item_guid) DO NOTHING`,
        [
          c.source_id, c.raw_format, c.raw_payload || c.rawXml || '',
          c.item_url, c.item_guid,
          JSON.stringify(c.pre_extracted || {}),
        ]
      );
      inserted++;
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
          is_canonical, evaluation_status, label, created_at, updated_at
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,
          $17,$18,$19,$20,$21,$22,$23,NOW(),NOW()
        )
        ON CONFLICT (tender_ref, source_id) DO UPDATE SET
          title            = EXCLUDED.title,
          closing_date     = EXCLUDED.closing_date,
          status           = EXCLUDED.status,
          category_tags    = EXCLUDED.category_tags,
          updated_at       = NOW()`,
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
    await pool.query(
      `INSERT INTO tender_agent_run_logs
         (agent_name, status, items_processed, new_items, duration_ms, detail, run_at)
       VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
      [agentName, status, itemsProcessed || 0, newItems || 0, durationMs || 0, detail || null]
    );
  } catch (_) { /* non-fatal */ }
}

// ─── Main Ingest Pipeline ─────────────────────────────────────────────────────

/**
 * Run the full RSS/XML ingestion + normalisation pipeline.
 * Called daily at 03:00 HKT or via manual trigger.
 * Returns a run summary object.
 */
async function runIngestion(pool) {
  const startTime = Date.now();
  const summary = {
    sourcesProcessed: 0,
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

  const existingGuids = await getExistingGuids(pool);

  for (const source of sources) {
    const srcStart = Date.now();
    summary.sourcesProcessed++;

    const { items, error } = await fetchRSSSource(source);

    if (error) {
      summary.errors.push({ source_id: source.source_id, error });
      summary.sourceResults.push({ source_id: source.source_id, status: error.startsWith('fetch') ? 'fetch_error' : 'parse_error', newItems: 0, error });
      // Update source status in registry
      try {
        await pool.query(
          `UPDATE tender_source_registry SET last_status='error', last_status_detail=$1, last_checked_at=NOW() WHERE source_id=$2`,
          [error, source.source_id]
        );
      } catch (_) {}
      continue;
    }

    const newItems = items.filter(item => !existingGuids.has(item.guid));
    summary.totalRawCaptures += items.length;

    // Insert new raw captures
    const rawCaptures = newItems.map(item => ({
      source_id:     source.source_id,
      raw_format:    source.source_type === 'api_xml' ? 'rss_xml' : 'rss_xml',
      raw_payload:   item.rawXml || JSON.stringify(item),
      item_url:      item.link || source.feed_url,
      item_guid:     item.guid,
      pre_extracted: item.preExtracted || { title: item.title, publish_date: item.pubDate, description_snippet: item.description },
    }));

    const inserted = await insertRawCaptures(pool, rawCaptures);
    summary.newRawCaptures += inserted;

    // Add new guids to the local set so we don't re-insert within this run
    for (const item of newItems) existingGuids.add(item.guid);

    // Normalise new captures
    let tendersInserted = 0;
    for (const raw of rawCaptures) {
      const capture = {
        capture_id:    null,
        source_id:     raw.source_id,
        raw_format:    raw.raw_format,
        raw_payload:   raw.raw_payload,
        item_url:      raw.item_url,
        item_guid:     raw.item_guid,
        captured_at:   new Date().toISOString(),
        pre_extracted: raw.pre_extracted,
      };
      const normalised = normaliseTender(capture, source);
      if (normalised) {
        const n = await insertTenders(pool, [normalised]);
        tendersInserted += n;
      }
    }
    summary.tendersInserted += tendersInserted;

    // Update source registry last_checked_at
    try {
      await pool.query(
        `UPDATE tender_source_registry
         SET last_status='ok', last_status_detail=$1, last_checked_at=NOW()
         WHERE source_id=$2`,
        [`${inserted} new items, ${tendersInserted} tenders`, source.source_id]
      );
    } catch (_) {}

    summary.sourceResults.push({
      source_id:    source.source_id,
      status:       'success',
      newItems:     inserted,
      durationMs:   Date.now() - srcStart,
    });
  }

  const durationMs = Date.now() - startTime;

  // Log the overall run
  await logAgentRun(pool, {
    agentName:       'RSSXMLIngestorAgent',
    status:          summary.errors.length > 0 ? 'partial' : 'success',
    itemsProcessed:  summary.totalRawCaptures,
    newItems:        summary.newRawCaptures,
    durationMs,
    detail:          `${summary.sourcesProcessed} sources, ${summary.tendersInserted} tenders inserted`,
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
     ORDER BY t.publish_date DESC NULLS LAST, t.created_at DESC
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
    `SELECT * FROM tender_agent_run_logs ORDER BY run_at DESC LIMIT $1`,
    [limit]
  );
  return result.rows;
}

/** GET /api/tender-intel/digest — latest tenders for the daily digest view */
async function getDigest(pool) {
  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysLater = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  const newToday = await pool.query(
    `SELECT COUNT(*) FROM tenders WHERE DATE(created_at) = $1`, [today]
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
  const tenders = await pool.query(
    `SELECT t.*, s.name AS source_name, s.organisation,
            e.overall_score, e.capability_fit, e.business_potential, e.reasoning_summary
     FROM tenders t
     LEFT JOIN tender_source_registry s ON t.source_id = s.source_id
     LEFT JOIN tender_evaluations e ON t.id = e.tender_id AND e.is_latest = true
     WHERE t.status = 'open' AND t.label != 'ignore'
     ORDER BY
       CASE t.label WHEN 'priority' THEN 0 WHEN 'consider' THEN 1 WHEN 'partner_only' THEN 2 ELSE 3 END,
       t.closing_date ASC NULLS LAST
     LIMIT 20`
  );

  const lastRun = await pool.query(
    `SELECT run_at, status FROM tender_agent_run_logs
     WHERE agent_name = 'RSSXMLIngestorAgent'
     ORDER BY run_at DESC LIMIT 1`
  );

  return {
    stats: {
      newToday:     parseInt(newToday.rows[0].count),
      priority:     parseInt(priority.rows[0].count),
      closingSoon:  parseInt(closingSoon.rows[0].count),
      sourcesOk:    `${sourcesOk.rows[0].count}/${totalSources.rows[0].count}`,
    },
    tenders:   tenders.rows,
    lastRun:   lastRun.rows[0] || null,
  };
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  runIngestion,
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
};
