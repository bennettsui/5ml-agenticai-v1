'use strict';
/**
 * Arrisonapps — 5ML Agentic Integration API
 * Authenticated via API key header: X-Agent-Key
 *
 * Base: /api/arrisonapps/v1/agent
 *
 * Designed for LLM tool-calling: compact, flat JSON responses.
 *
 * GET  /products/search       ?q=&region=&brand=&strength=
 * GET  /stock                 ?sku=&region=&location=
 * GET  /leads                 ?status=&region=&assigned_to=&from=&to=&q=
 * GET  /leads/:id
 * PATCH /leads/:id/status
 * POST  /leads/:id/notes
 * GET  /leads/:id/summary     (email draft context)
 * GET  /reports/leads         ?from=&to=&region=
 * GET  /reports/inventory     ?region=&brand=
 */

const express = require('express');
const router  = express.Router();
const SCHEMA  = 'arrisonapps';

function db(req) { return req.app.locals.arrisonappsPool || req.app.locals.pool; }

// ─── API Key Auth ─────────────────────────────────────────────────────────────
router.use(async (req, res, next) => {
  const key = req.headers['x-agent-key'] || req.query.api_key;
  if (!key) return res.status(401).json({ error: 'X-Agent-Key required' });
  try {
    const { rows } = await db(req).query(
      `SELECT value FROM ${SCHEMA}.integration_settings
       WHERE namespace = '5ml-agent' AND key = 'cigar_system_api_key'`
    );
    const stored = rows[0]?.value;
    if (!stored || stored !== key) return res.status(401).json({ error: 'Invalid API key' });
    next();
  } catch (err) {
    // If DB not available, fall through with env-var check
    const envKey = process.env.ARRISONAPPS_AGENT_KEY;
    if (envKey && envKey === key) return next();
    res.status(500).json({ error: 'Auth check failed: ' + err.message });
  }
});

// ─── Tool: get_product_by_sku / search_products ───────────────────────────────
/**
 * Tool: search_products
 * Use when: user asks about available cigars, specific brands, or product details.
 * Input: q (name/brand search), region (ISO code), brand, strength
 * Output: array of products with stock_status
 */
router.get('/products/search', async (req, res) => {
  const { q, region = 'HK', brand, strength, limit = 20 } = req.query;
  const conditions = [`va.is_listed = TRUE`, `va.region_code = $1`];
  const params = [region.toUpperCase()];

  if (brand) {
    params.push(`%${brand}%`);
    conditions.push(`va.brand_name ILIKE $${params.length}`);
  }
  if (strength) {
    params.push(strength);
    conditions.push(`va.strength = $${params.length}`);
  }
  if (q) {
    params.push(`%${q}%`);
    conditions.push(
      `(va.brand_name ILIKE $${params.length} OR va.series ILIKE $${params.length} OR va.vitola ILIKE $${params.length})`
    );
  }
  params.push(Number(limit));
  try {
    const { rows } = await db(req).query(
      `SELECT va.sku, va.brand_name, va.series, va.vitola,
              va.packaging_qty, va.packaging_type, va.strength,
              va.stock_status, va.available_qty, va.display_price,
              va.currency_code, va.enquiry_only,
              va.is_limited_edition, va.is_travel_humidor, va.tags
       FROM ${SCHEMA}.vw_product_availability va
       WHERE ${conditions.join(' AND ')}
       ORDER BY va.brand_name, va.series
       LIMIT $${params.length}`,
      params
    );
    res.json({ products: rows, count: rows.length, region });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Tool: get_stock ──────────────────────────────────────────────────────────
/**
 * Tool: get_stock
 * Use when: checking inventory levels for a specific SKU/region/location.
 * Input: sku (required), region (optional), location (optional location name)
 * Output: stock levels per location
 */
router.get('/stock', async (req, res) => {
  const { sku, region, location } = req.query;
  if (!sku) return res.status(400).json({ error: 'sku is required' });
  const conditions = [`p.sku = $1`];
  const params = [sku];
  if (region) { params.push(region.toUpperCase()); conditions.push(`r.code = $${params.length}`); }
  if (location) { params.push(`%${location}%`); conditions.push(`loc.name ILIKE $${params.length}`); }
  try {
    const { rows } = await db(req).query(
      `SELECT sl.quantity, sl.reserved_qty,
              sl.quantity - sl.reserved_qty AS available_qty,
              sl.reorder_point,
              loc.name AS location, loc.location_type,
              r.code AS region, r.name AS region_name,
              p.sku, b.name AS brand, p.series, p.vitola
       FROM ${SCHEMA}.stock_levels sl
       JOIN ${SCHEMA}.products p    ON p.id = sl.product_id
       JOIN ${SCHEMA}.brands b      ON b.id = p.brand_id
       JOIN ${SCHEMA}.locations loc ON loc.id = sl.location_id
       JOIN ${SCHEMA}.regions r     ON r.id = loc.region_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY r.code, loc.name`,
      params
    );
    if (!rows.length) return res.json({ stock: [], message: `No stock records found for SKU: ${sku}` });
    res.json({ stock: rows, sku });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Tool: search_leads ───────────────────────────────────────────────────────
router.get('/leads', async (req, res) => {
  const { status, region, assigned_to, from, to, q, limit = 20 } = req.query;
  const conditions = [];
  const params = [];
  if (status) { params.push(status); conditions.push(`l.status = $${params.length}`); }
  if (region) { params.push(region.toUpperCase()); conditions.push(`r.code = $${params.length}`); }
  if (assigned_to) { params.push(`%${assigned_to}%`); conditions.push(`u.full_name ILIKE $${params.length}`); }
  if (from) { params.push(from); conditions.push(`l.created_at >= $${params.length}`); }
  if (to)   { params.push(to);   conditions.push(`l.created_at <= $${params.length}`); }
  if (q) {
    params.push(`%${q}%`);
    conditions.push(`(c.full_name ILIKE $${params.length} OR c.email ILIKE $${params.length})`);
  }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  params.push(Number(limit));
  try {
    const { rows } = await db(req).query(
      `SELECT l.id, l.lead_no, l.status, l.currency_code,
              l.estimated_value, l.probability_pct, l.expected_close,
              l.created_at, l.updated_at,
              c.full_name AS customer_name, c.email AS customer_email,
              c.preferred_language, c.is_vip,
              r.code AS region, r.name AS region_name,
              u.full_name AS assigned_to
       FROM ${SCHEMA}.leads l
       JOIN ${SCHEMA}.customers c ON c.id = l.customer_id
       JOIN ${SCHEMA}.regions r   ON r.id = l.region_id
       LEFT JOIN ${SCHEMA}.users u ON u.id = l.assigned_to
       ${where}
       ORDER BY l.created_at DESC
       LIMIT $${params.length}`,
      params
    );
    res.json({ leads: rows, count: rows.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Tool: get_lead ───────────────────────────────────────────────────────────
router.get('/leads/:id', async (req, res) => {
  try {
    const { rows: [lead] } = await db(req).query(
      `SELECT l.id, l.lead_no, l.status, l.currency_code,
              l.estimated_value, l.probability_pct, l.expected_close,
              l.source, l.created_at,
              c.full_name AS customer_name, c.email AS customer_email,
              c.phone AS customer_phone, c.preferred_language, c.is_vip,
              r.code AS region, r.currency_symbol
       FROM ${SCHEMA}.leads l
       JOIN ${SCHEMA}.customers c ON c.id = l.customer_id
       JOIN ${SCHEMA}.regions r   ON r.id = l.region_id
       WHERE l.id = $1`,
      [req.params.id]
    );
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const { rows: items } = await db(req).query(
      `SELECT li.quantity, li.unit_price, li.discount_pct, li.line_total,
              p.sku, b.name AS brand, p.series, p.vitola, p.packaging_qty
       FROM ${SCHEMA}.lead_items li
       JOIN ${SCHEMA}.products p ON p.id = li.product_id
       JOIN ${SCHEMA}.brands b   ON b.id = p.brand_id
       WHERE li.lead_id = $1`,
      [req.params.id]
    );
    lead.items = items;
    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Tool: update_lead_status ─────────────────────────────────────────────────
router.patch('/leads/:id/status', express.json(), async (req, res) => {
  const { status } = req.body;
  const VALID = ['new','contacted','quoting','negotiation','won','lost'];
  if (!VALID.includes(status)) return res.status(400).json({ error: `status must be: ${VALID.join('|')}` });
  try {
    await db(req).query(
      `UPDATE ${SCHEMA}.leads SET status = $1, updated_at = NOW() WHERE id = $2`,
      [status, req.params.id]
    );
    await db(req).query(
      `INSERT INTO ${SCHEMA}.lead_activities
         (lead_id, activity_type, new_status, content)
       VALUES ($1, 'status_change', $2, 'Status updated by 5ML Agent')`,
      [req.params.id, status]
    );
    res.json({ ok: true, lead_id: req.params.id, new_status: status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Tool: add_lead_note ──────────────────────────────────────────────────────
router.post('/leads/:id/notes', express.json(), async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'content required' });
  try {
    const { rows: [note] } = await db(req).query(
      `INSERT INTO ${SCHEMA}.lead_activities
         (lead_id, activity_type, content, is_internal)
       VALUES ($1, 'note', $2, TRUE)
       RETURNING id, created_at`,
      [req.params.id, content]
    );
    res.status(201).json({ ok: true, note_id: note.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Tool: get_lead_summary_for_email ─────────────────────────────────────────
/**
 * Tool: get_lead_summary_for_email
 * Use when: generating an email draft for a customer regarding their lead.
 * Returns all context needed: customer language, region, items, status, history.
 */
router.get('/leads/:id/summary', async (req, res) => {
  try {
    const { rows: [lead] } = await db(req).query(
      `SELECT l.id, l.lead_no, l.status, l.currency_code,
              l.estimated_value, l.expected_close,
              c.full_name AS customer_name, c.email AS customer_email,
              c.preferred_language, c.is_vip,
              r.code AS region, r.name AS region_name, r.currency_symbol
       FROM ${SCHEMA}.leads l
       JOIN ${SCHEMA}.customers c ON c.id = l.customer_id
       JOIN ${SCHEMA}.regions r   ON r.id = l.region_id
       WHERE l.id = $1`,
      [req.params.id]
    );
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const { rows: items } = await db(req).query(
      `SELECT li.quantity, li.unit_price, li.discount_pct, li.line_total,
              p.sku, b.name AS brand, p.series, p.vitola, p.packaging_qty, p.tasting_notes
       FROM ${SCHEMA}.lead_items li
       JOIN ${SCHEMA}.products p ON p.id = li.product_id
       JOIN ${SCHEMA}.brands b   ON b.id = p.brand_id
       WHERE li.lead_id = $1 ORDER BY b.name, p.series`,
      [req.params.id]
    );

    const { rows: recent_notes } = await db(req).query(
      `SELECT content, activity_type, created_at
       FROM ${SCHEMA}.lead_activities
       WHERE lead_id = $1 AND activity_type IN ('note','status_change')
       ORDER BY created_at DESC LIMIT 5`,
      [req.params.id]
    );

    res.json({
      lead_context: {
        ...lead,
        items,
        recent_notes,
        total_items:   items.length,
        estimated_value_formatted: lead.estimated_value
          ? `${lead.currency_symbol}${Number(lead.estimated_value).toLocaleString()}`
          : 'TBC',
      },
      email_hints: {
        language:       lead.preferred_language || 'en',
        tone:           lead.is_vip ? 'formal-prestige' : 'professional-warm',
        include_pricing: ['quoting','negotiation','won'].includes(lead.status),
        suggested_subject: `[${lead.lead_no}] Your Arrisonapps Enquiry — ${lead.status === 'quoting' ? 'Quotation Ready' : 'Update'}`,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Tool: reporting ──────────────────────────────────────────────────────────
router.get('/reports/leads', async (req, res) => {
  const { from, to, region } = req.query;
  const fromDate = from || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const toDate   = to   || new Date().toISOString().slice(0, 10);
  const regionFilter = region
    ? `AND r.code = '${region.toUpperCase().replace(/[^A-Z]/g, '')}'`
    : '';
  try {
    const { rows } = await db(req).query(
      `SELECT l.status, r.code AS region,
              COUNT(*)::INT AS count,
              SUM(l.estimated_value)::NUMERIC AS total_value
       FROM ${SCHEMA}.leads l
       JOIN ${SCHEMA}.regions r ON r.id = l.region_id
       WHERE l.created_at BETWEEN $1 AND $2 ${regionFilter}
       GROUP BY l.status, r.code ORDER BY r.code, l.status`,
      [fromDate, toDate + ' 23:59:59']
    );
    res.json({ period: { from: fromDate, to: toDate }, leads_by_status: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/reports/inventory', async (req, res) => {
  const { region, brand } = req.query;
  const conditions = [];
  const params = [];
  if (region) { params.push(region.toUpperCase()); conditions.push(`r.code = $${params.length}`); }
  if (brand)  { params.push(`%${brand}%`); conditions.push(`b.name ILIKE $${params.length}`); }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  try {
    const { rows } = await db(req).query(
      `SELECT r.code AS region, b.name AS brand,
              p.sku, p.series, p.vitola, p.strength,
              SUM(sl.quantity)::INT AS total_qty,
              SUM(sl.quantity - sl.reserved_qty)::INT AS available_qty,
              COUNT(CASE WHEN sl.quantity - sl.reserved_qty <= sl.reorder_point THEN 1 END)::INT AS low_stock_locations
       FROM ${SCHEMA}.stock_levels sl
       JOIN ${SCHEMA}.products p   ON p.id = sl.product_id
       JOIN ${SCHEMA}.brands b     ON b.id = p.brand_id
       JOIN ${SCHEMA}.locations loc ON loc.id = sl.location_id
       JOIN ${SCHEMA}.regions r    ON r.id = loc.region_id
       ${where}
       GROUP BY r.code, b.name, p.sku, p.series, p.vitola, p.strength
       ORDER BY r.code, b.name, p.series`,
      params
    );
    res.json({ inventory: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
