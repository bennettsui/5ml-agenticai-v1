'use strict';
/**
 * Arrisonapps — Admin / CRM / Inventory API
 * All routes require a valid JWT with role: admin | region_manager | sales | backoffice
 *
 * Base: /api/arrisonapps/v1/admin
 *
 * Products
 *   GET    /products
 *   POST   /products
 *   PUT    /products/:id
 *   DELETE /products/:id
 *   POST   /products/:id/images
 *   DELETE /products/:id/images/:imageId
 *
 * Stock
 *   GET    /stock                   ?product_id=&region_code=&location_id=
 *   POST   /stock/movements         purchase | sale | transfer | adjustment
 *   GET    /stock/movements         ?product_id=&location_id=&from=&to=
 *
 * CRM — Leads
 *   GET    /leads                   ?region=&status=&assigned_to=&from=&to=&q=&page=&limit=
 *   POST   /leads
 *   GET    /leads/:id
 *   PUT    /leads/:id
 *   PATCH  /leads/:id/status
 *   POST   /leads/:id/notes
 *   PUT    /leads/:id/items
 *
 * Reports
 *   GET    /reports/leads-summary
 *   GET    /reports/inventory-summary
 *   GET    /reports/leads.pdf
 *   GET    /reports/inventory.pdf
 */

const express   = require('express');
const router    = express.Router();
const jwt       = require('jsonwebtoken');
const multer    = require('multer');
const sharp     = require('sharp');

const JWT_SECRET  = process.env.ARRISONAPPS_JWT_SECRET || process.env.JWT_SECRET || 'change-me';
const SCHEMA      = 'arrisonapps';
const ADMIN_ROLES = new Set(['admin', 'region_manager', 'sales', 'backoffice']);

// multer in-memory for image uploads (max 10 MB)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

function db(req) { return req.app.locals.arrisonappsPool || req.app.locals.pool; }

// ─── Auth Middleware ──────────────────────────────────────────────────────────
router.use((req, res, next) => {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (!ADMIN_ROLES.has(payload.role))
      return res.status(403).json({ error: 'Insufficient permissions' });
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────
router.get('/products', async (req, res) => {
  const { q, brand, is_active = 'true', page = 1, limit = 50 } = req.query;
  try {
    const conditions = [];
    const params = [];
    if (is_active !== 'all') {
      params.push(is_active === 'true');
      conditions.push(`p.is_active = $${params.length}`);
    }
    if (brand) {
      params.push(`%${brand}%`);
      conditions.push(`b.name ILIKE $${params.length}`);
    }
    if (q) {
      params.push(`%${q}%`);
      conditions.push(`(p.sku ILIKE $${params.length} OR p.series ILIKE $${params.length} OR p.vitola ILIKE $${params.length})`);
    }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const offset = (Number(page) - 1) * Number(limit);
    params.push(Number(limit), offset);

    const { rows } = await db(req).query(
      `SELECT p.id, p.sku, b.name AS brand_name, p.series, p.vitola,
              p.packaging_qty, p.packaging_type, p.strength, p.is_active,
              p.is_limited_edition, p.is_travel_humidor, p.tags,
              p.created_at, p.updated_at
       FROM ${SCHEMA}.products p
       JOIN ${SCHEMA}.brands b ON b.id = p.brand_id
       ${where}
       ORDER BY b.name, p.series, p.vitola
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json({ products: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/products', express.json(), async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'region_manager')
    return res.status(403).json({ error: 'Not allowed' });
  const {
    sku, brand_id, series, vitola, ring_gauge, length_mm, wrapper_origin,
    binder_origin, filler_origins, strength, vintage_year,
    packaging_qty, packaging_type, is_limited_edition, is_travel_humidor,
    short_description, full_description, tasting_notes, pairing_notes, tags
  } = req.body;
  if (!sku || !brand_id) return res.status(400).json({ error: 'sku and brand_id are required' });
  try {
    const { rows: [p] } = await db(req).query(
      `INSERT INTO ${SCHEMA}.products
         (sku, brand_id, series, vitola, ring_gauge, length_mm, wrapper_origin,
          binder_origin, filler_origins, strength, vintage_year,
          packaging_qty, packaging_type, is_limited_edition, is_travel_humidor,
          short_description, full_description, tasting_notes, pairing_notes, tags)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
       RETURNING id, sku`,
      [sku, brand_id, series, vitola, ring_gauge, length_mm, wrapper_origin,
       binder_origin, filler_origins, strength, vintage_year,
       packaging_qty || 1, packaging_type || 'singles',
       is_limited_edition || false, is_travel_humidor || false,
       short_description, full_description, tasting_notes, pairing_notes, tags]
    );
    await _audit(req, 'product.create', 'products', p.id, null, req.body);
    res.status(201).json(p);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/products/:id', express.json(), async (req, res) => {
  const fields = ['series','vitola','ring_gauge','length_mm','wrapper_origin',
    'binder_origin','filler_origins','strength','vintage_year','packaging_qty',
    'packaging_type','is_limited_edition','is_travel_humidor','short_description',
    'full_description','tasting_notes','pairing_notes','tags','is_active'];
  const setClauses = [];
  const params = [];
  fields.forEach(f => {
    if (req.body[f] !== undefined) {
      params.push(req.body[f]);
      setClauses.push(`${f} = $${params.length}`);
    }
  });
  if (!setClauses.length) return res.status(400).json({ error: 'No fields to update' });
  params.push(req.params.id);
  try {
    await db(req).query(
      `UPDATE ${SCHEMA}.products SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $${params.length}`,
      params
    );
    await _audit(req, 'product.update', 'products', req.params.id, null, req.body);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Image upload — store in Postgres BYTEA, compress with sharp
router.post('/products/:id/images', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image file uploaded' });
  try {
    const { width, height, format } = await sharp(req.file.buffer).metadata();
    // Resize if too large; convert to JPEG for storage efficiency
    const compressed = await sharp(req.file.buffer)
      .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer();

    const is_primary = req.body.is_primary === 'true';
    if (is_primary) {
      await db(req).query(
        `UPDATE ${SCHEMA}.product_images SET is_primary = FALSE WHERE product_id = $1`, [req.params.id]
      );
    }
    const { rows: [img] } = await db(req).query(
      `INSERT INTO ${SCHEMA}.product_images
         (product_id, image_data, filename, mime_type, width_px, height_px, size_bytes, is_primary, alt_text)
       VALUES ($1, $2, $3, 'image/jpeg', $4, $5, $6, $7, $8)
       RETURNING id`,
      [req.params.id, compressed, req.file.originalname,
       width, height, compressed.length, is_primary, req.body.alt_text || '']
    );
    res.status(201).json({
      id: img.id,
      url: `/api/arrisonapps/v1/products/${req.params.id}/images/${img.id}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/products/:id/images/:imageId', async (req, res) => {
  try {
    await db(req).query(
      `DELETE FROM ${SCHEMA}.product_images WHERE id = $1 AND product_id = $2`,
      [req.params.imageId, req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── STOCK ────────────────────────────────────────────────────────────────────
router.get('/stock', async (req, res) => {
  const { product_id, region_code, location_id } = req.query;
  const conditions = [];
  const params = [];
  if (product_id) { params.push(product_id); conditions.push(`sl.product_id = $${params.length}`); }
  if (location_id) { params.push(location_id); conditions.push(`sl.location_id = $${params.length}`); }
  if (region_code) { params.push(region_code.toUpperCase()); conditions.push(`r.code = $${params.length}`); }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  try {
    const { rows } = await db(req).query(
      `SELECT sl.id, sl.quantity, sl.reserved_qty,
              sl.quantity - sl.reserved_qty AS available_qty,
              sl.reorder_point, sl.updated_at,
              p.sku, b.name AS brand_name, p.series, p.vitola,
              loc.id AS location_id, loc.name AS location_name, loc.location_type,
              r.code AS region_code, r.name AS region_name
       FROM ${SCHEMA}.stock_levels sl
       JOIN ${SCHEMA}.products p   ON p.id = sl.product_id
       JOIN ${SCHEMA}.brands b     ON b.id = p.brand_id
       JOIN ${SCHEMA}.locations loc ON loc.id = sl.location_id
       JOIN ${SCHEMA}.regions r    ON r.id = loc.region_id
       ${where}
       ORDER BY r.code, loc.name, b.name, p.series`,
      params
    );
    res.json({ stock: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/stock/movements', express.json(), async (req, res) => {
  const {
    movement_type, product_id, from_location_id, to_location_id,
    quantity, unit_cost, reference_no, notes, enquiry_id
  } = req.body;
  const VALID_TYPES = ['purchase','sale','transfer','consignment_in','consignment_out','adjustment'];
  if (!VALID_TYPES.includes(movement_type))
    return res.status(400).json({ error: `movement_type must be one of: ${VALID_TYPES.join(', ')}` });
  if (!product_id || !quantity || quantity <= 0)
    return res.status(400).json({ error: 'product_id and positive quantity required' });

  const pool = db(req);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: [mv] } = await client.query(
      `INSERT INTO ${SCHEMA}.stock_movements
         (movement_type, product_id, from_location_id, to_location_id,
          quantity, unit_cost, reference_no, notes, performed_by, enquiry_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id`,
      [movement_type, product_id, from_location_id || null, to_location_id || null,
       quantity, unit_cost || null, reference_no || null, notes || null,
       req.user.sub, enquiry_id || null]
    );

    // Update stock_levels
    if (['purchase', 'consignment_in'].includes(movement_type) && to_location_id) {
      await client.query(
        `INSERT INTO ${SCHEMA}.stock_levels (product_id, location_id, quantity)
         VALUES ($1, $2, $3)
         ON CONFLICT (product_id, location_id)
         DO UPDATE SET quantity = stock_levels.quantity + $3, updated_at = NOW()`,
        [product_id, to_location_id, quantity]
      );
    } else if (['sale', 'consignment_out'].includes(movement_type) && from_location_id) {
      await client.query(
        `UPDATE ${SCHEMA}.stock_levels
         SET quantity = GREATEST(0, quantity - $1), updated_at = NOW()
         WHERE product_id = $2 AND location_id = $3`,
        [quantity, product_id, from_location_id]
      );
    } else if (movement_type === 'transfer' && from_location_id && to_location_id) {
      await client.query(
        `UPDATE ${SCHEMA}.stock_levels
         SET quantity = GREATEST(0, quantity - $1), updated_at = NOW()
         WHERE product_id = $2 AND location_id = $3`,
        [quantity, product_id, from_location_id]
      );
      await client.query(
        `INSERT INTO ${SCHEMA}.stock_levels (product_id, location_id, quantity)
         VALUES ($1, $2, $3)
         ON CONFLICT (product_id, location_id)
         DO UPDATE SET quantity = stock_levels.quantity + $3, updated_at = NOW()`,
        [product_id, to_location_id, quantity]
      );
    } else if (movement_type === 'adjustment' && (from_location_id || to_location_id)) {
      const loc = from_location_id || to_location_id;
      await client.query(
        `INSERT INTO ${SCHEMA}.stock_levels (product_id, location_id, quantity)
         VALUES ($1, $2, $3)
         ON CONFLICT (product_id, location_id)
         DO UPDATE SET quantity = $3, updated_at = NOW()`,
        [product_id, loc, quantity]
      );
    }

    await client.query('COMMIT');
    await _audit(req, `stock.${movement_type}`, 'stock_movement', mv.id, null, req.body);
    res.status(201).json({ movement_id: mv.id });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.get('/stock/movements', async (req, res) => {
  const { product_id, location_id, from, to, page = 1, limit = 50 } = req.query;
  const conditions = [];
  const params = [];
  if (product_id) { params.push(product_id); conditions.push(`sm.product_id = $${params.length}`); }
  if (location_id) {
    params.push(location_id);
    conditions.push(`(sm.from_location_id = $${params.length} OR sm.to_location_id = $${params.length})`);
  }
  if (from) { params.push(from); conditions.push(`sm.created_at >= $${params.length}`); }
  if (to)   { params.push(to);   conditions.push(`sm.created_at <= $${params.length}`); }
  const where  = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const offset = (Number(page) - 1) * Number(limit);
  params.push(Number(limit), offset);
  try {
    const { rows } = await db(req).query(
      `SELECT sm.id, sm.movement_type, sm.quantity, sm.unit_cost,
              sm.reference_no, sm.notes, sm.created_at,
              p.sku, b.name AS brand_name, p.series, p.vitola,
              fl.name AS from_location, tl.name AS to_location,
              u.full_name AS performed_by
       FROM ${SCHEMA}.stock_movements sm
       JOIN ${SCHEMA}.products p   ON p.id = sm.product_id
       JOIN ${SCHEMA}.brands b     ON b.id = p.brand_id
       LEFT JOIN ${SCHEMA}.locations fl ON fl.id = sm.from_location_id
       LEFT JOIN ${SCHEMA}.locations tl ON tl.id = sm.to_location_id
       LEFT JOIN ${SCHEMA}.users u     ON u.id = sm.performed_by
       ${where}
       ORDER BY sm.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json({ movements: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CRM LEADS ────────────────────────────────────────────────────────────────
router.get('/leads', async (req, res) => {
  const { region, status, assigned_to, from, to, q, page = 1, limit = 30 } = req.query;
  const conditions = [];
  const params = [];

  // Region scope enforcement: non-admin users can only see their regions
  if (req.user.role !== 'admin') {
    params.push(req.user.sub);
    conditions.push(`EXISTS (
      SELECT 1 FROM ${SCHEMA}.user_regions ur
      WHERE ur.user_id = $${params.length} AND ur.region_id = l.region_id
    )`);
  }
  if (region) { params.push(region.toUpperCase()); conditions.push(`r.code = $${params.length}`); }
  if (status) { params.push(status); conditions.push(`l.status = $${params.length}`); }
  if (assigned_to) { params.push(assigned_to); conditions.push(`l.assigned_to = $${params.length}`); }
  if (from) { params.push(from); conditions.push(`l.created_at >= $${params.length}`); }
  if (to)   { params.push(to);   conditions.push(`l.created_at <= $${params.length}`); }
  if (q) {
    params.push(`%${q}%`);
    conditions.push(`(c.full_name ILIKE $${params.length} OR c.email ILIKE $${params.length} OR l.lead_no ILIKE $${params.length})`);
  }

  const where  = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const offset = (Number(page) - 1) * Number(limit);
  params.push(Number(limit), offset);
  try {
    const { rows } = await db(req).query(
      `SELECT l.id, l.lead_no, l.status, l.currency_code, l.estimated_value,
              l.probability_pct, l.expected_close, l.created_at, l.updated_at,
              c.full_name AS customer_name, c.email AS customer_email,
              r.code AS region_code, r.name AS region_name,
              u.full_name AS assigned_to_name,
              (SELECT COUNT(*) FROM ${SCHEMA}.lead_items li WHERE li.lead_id = l.id)::INT AS item_count
       FROM ${SCHEMA}.leads l
       JOIN ${SCHEMA}.customers c ON c.id = l.customer_id
       JOIN ${SCHEMA}.regions r   ON r.id = l.region_id
       LEFT JOIN ${SCHEMA}.users u ON u.id = l.assigned_to
       ${where}
       ORDER BY l.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json({ leads: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/leads/:id', async (req, res) => {
  try {
    const { rows: [lead] } = await db(req).query(
      `SELECT l.id, l.lead_no, l.status, l.currency_code, l.estimated_value,
              l.probability_pct, l.expected_close, l.lost_reason, l.won_note,
              l.source, l.created_at, l.updated_at,
              c.id AS customer_id, c.full_name AS customer_name,
              c.email AS customer_email, c.phone AS customer_phone,
              c.preferred_language, c.is_vip,
              r.code AS region_code, r.name AS region_name,
              u.full_name AS assigned_to_name, l.assigned_to AS assigned_to_id,
              l.enquiry_id
       FROM ${SCHEMA}.leads l
       JOIN ${SCHEMA}.customers c ON c.id = l.customer_id
       JOIN ${SCHEMA}.regions r   ON r.id = l.region_id
       LEFT JOIN ${SCHEMA}.users u ON u.id = l.assigned_to
       WHERE l.id = $1`,
      [req.params.id]
    );
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const [{ rows: items }, { rows: activities }] = await Promise.all([
      db(req).query(
        `SELECT li.id, li.quantity, li.unit_price, li.discount_pct, li.line_total,
                p.sku, b.name AS brand_name, p.series, p.vitola, p.packaging_qty
         FROM ${SCHEMA}.lead_items li
         JOIN ${SCHEMA}.products p ON p.id = li.product_id
         JOIN ${SCHEMA}.brands b   ON b.id = p.brand_id
         WHERE li.lead_id = $1`,
        [req.params.id]
      ),
      db(req).query(
        `SELECT la.id, la.activity_type, la.content, la.old_status, la.new_status,
                la.is_internal, la.created_at, u.full_name AS performed_by
         FROM ${SCHEMA}.lead_activities la
         LEFT JOIN ${SCHEMA}.users u ON u.id = la.performed_by
         WHERE la.lead_id = $1
         ORDER BY la.created_at DESC`,
        [req.params.id]
      ),
    ]);
    lead.items = items;
    lead.activities = activities;
    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/leads', express.json(), async (req, res) => {
  const { customer_id, region_id, currency_code, notes, source, assigned_to } = req.body;
  if (!customer_id || !region_id) return res.status(400).json({ error: 'customer_id and region_id required' });
  try {
    const { rows: [r] } = await db(req).query(
      `SELECT code FROM ${SCHEMA}.regions WHERE id = $1`, [region_id]
    );
    const leadNo = `LEAD-${r?.code || 'XX'}-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;
    const { rows: [lead] } = await db(req).query(
      `INSERT INTO ${SCHEMA}.leads
         (lead_no, customer_id, region_id, currency_code, status, source, assigned_to)
       VALUES ($1,$2,$3,$4,'new',$5,$6)
       RETURNING id, lead_no`,
      [leadNo, customer_id, region_id, currency_code || 'HKD', source || 'manual', assigned_to || null]
    );
    await _audit(req, 'lead.create', 'leads', lead.id, null, req.body);
    res.status(201).json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/leads/:id', express.json(), async (req, res) => {
  const allowed = ['assigned_to','estimated_value','probability_pct','expected_close',
    'lost_reason','won_note','currency_code'];
  const setClauses = [];
  const params = [];
  allowed.forEach(f => {
    if (req.body[f] !== undefined) {
      params.push(req.body[f]);
      setClauses.push(`${f} = $${params.length}`);
    }
  });
  if (!setClauses.length) return res.status(400).json({ error: 'No updatable fields provided' });
  params.push(req.params.id);
  try {
    await db(req).query(
      `UPDATE ${SCHEMA}.leads SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $${params.length}`,
      params
    );
    await _audit(req, 'lead.update', 'leads', req.params.id, null, req.body);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/leads/:id/status', express.json(), async (req, res) => {
  const { status } = req.body;
  const VALID = ['new','contacted','quoting','negotiation','won','lost'];
  if (!VALID.includes(status)) return res.status(400).json({ error: `status must be one of: ${VALID.join(', ')}` });
  try {
    const { rows: [old] } = await db(req).query(
      `SELECT status FROM ${SCHEMA}.leads WHERE id = $1`, [req.params.id]
    );
    await db(req).query(
      `UPDATE ${SCHEMA}.leads SET status = $1, updated_at = NOW() WHERE id = $2`,
      [status, req.params.id]
    );
    await db(req).query(
      `INSERT INTO ${SCHEMA}.lead_activities
         (lead_id, activity_type, old_status, new_status, performed_by)
       VALUES ($1, 'status_change', $2, $3, $4)`,
      [req.params.id, old?.status, status, req.user.sub]
    );
    await _audit(req, 'lead.status_change', 'leads', req.params.id, { status: old?.status }, { status });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/leads/:id/notes', express.json(), async (req, res) => {
  const { content, is_internal = true } = req.body;
  if (!content) return res.status(400).json({ error: 'content is required' });
  try {
    const { rows: [note] } = await db(req).query(
      `INSERT INTO ${SCHEMA}.lead_activities
         (lead_id, activity_type, content, is_internal, performed_by)
       VALUES ($1, 'note', $2, $3, $4)
       RETURNING id, created_at`,
      [req.params.id, content, is_internal, req.user.sub]
    );
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/leads/:id/items', express.json(), async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items)) return res.status(400).json({ error: 'items[] array required' });
  const pool = db(req);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`DELETE FROM ${SCHEMA}.lead_items WHERE lead_id = $1`, [req.params.id]);
    let estimatedValue = 0;
    for (const item of items) {
      const lineTotal = ((item.unit_price || 0) * item.quantity * (1 - (item.discount_pct || 0) / 100));
      estimatedValue += lineTotal;
      await client.query(
        `INSERT INTO ${SCHEMA}.lead_items
           (lead_id, product_id, quantity, unit_price, discount_pct, line_total)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [req.params.id, item.product_id, item.quantity,
         item.unit_price || null, item.discount_pct || 0, lineTotal || null]
      );
    }
    await client.query(
      `UPDATE ${SCHEMA}.leads SET estimated_value = $1, updated_at = NOW() WHERE id = $2`,
      [estimatedValue || null, req.params.id]
    );
    await client.query('COMMIT');
    res.json({ ok: true, estimated_value: estimatedValue });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ─── REPORTS ──────────────────────────────────────────────────────────────────
router.get('/reports/leads-summary', async (req, res) => {
  const { from, to, region } = req.query;
  const fromDate = from || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const toDate   = to   || new Date().toISOString().slice(0, 10);
  try {
    const regionFilter = region ? `AND r.code = '${region.toUpperCase().replace(/[^A-Z]/g, '')}'` : '';
    const { rows } = await db(req).query(
      `SELECT l.status,
              r.code AS region_code,
              COUNT(*)::INT AS lead_count,
              SUM(l.estimated_value)::NUMERIC AS total_value,
              AVG(l.probability_pct)::NUMERIC AS avg_probability
       FROM ${SCHEMA}.leads l
       JOIN ${SCHEMA}.regions r ON r.id = l.region_id
       WHERE l.created_at BETWEEN $1 AND $2 ${regionFilter}
       GROUP BY l.status, r.code
       ORDER BY r.code, l.status`,
      [fromDate, toDate + ' 23:59:59']
    );
    res.json({ from: fromDate, to: toDate, summary: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/reports/inventory-summary', async (req, res) => {
  const { region } = req.query;
  try {
    const regionFilter = region
      ? `WHERE r.code = '${region.toUpperCase().replace(/[^A-Z]/g, '')}'`
      : '';
    const { rows } = await db(req).query(
      `SELECT r.code AS region_code, r.name AS region_name,
              loc.name AS location_name, loc.location_type,
              b.name AS brand_name,
              p.sku, p.series, p.vitola, p.packaging_qty,
              sl.quantity, sl.reserved_qty,
              sl.quantity - sl.reserved_qty AS available_qty,
              sl.reorder_point,
              CASE WHEN sl.quantity - sl.reserved_qty <= sl.reorder_point THEN TRUE ELSE FALSE END AS is_low_stock
       FROM ${SCHEMA}.stock_levels sl
       JOIN ${SCHEMA}.products p   ON p.id = sl.product_id
       JOIN ${SCHEMA}.brands b     ON b.id = p.brand_id
       JOIN ${SCHEMA}.locations loc ON loc.id = sl.location_id
       JOIN ${SCHEMA}.regions r    ON r.id = loc.region_id
       ${regionFilter}
       ORDER BY r.code, loc.name, b.name, p.series`,
    );
    res.json({ inventory: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PDF report endpoints — use puppeteer/html-to-pdf via external service or return JSON
// For now: return structured data and accept ?format=pdf to trigger PDF generation
router.get('/reports/leads.pdf', async (req, res) => {
  // Redirect to JSON endpoint if no PDF library; frontend can call window.print()
  res.setHeader('Content-Type', 'application/json');
  res.json({
    message: 'PDF generation: fetch /admin/reports/leads-summary and render in browser with window.print()',
    endpoint: '/api/arrisonapps/v1/admin/reports/leads-summary',
  });
});

// ─── DELETE PRODUCT (soft delete) ────────────────────────────────────────────
router.delete('/products/:id', async (req, res) => {
  try {
    await db(req).query(
      `UPDATE ${SCHEMA}.products SET is_active = FALSE, updated_at = NOW() WHERE id = $1`,
      [req.params.id]
    );
    await _audit(req, 'product.deactivate', 'products', req.params.id, null, { is_active: false });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── BRANDS ──────────────────────────────────────────────────────────────────
router.get('/brands', async (req, res) => {
  try {
    const { rows } = await db(req).query(
      `SELECT id, slug, name, origin FROM ${SCHEMA}.brands ORDER BY name`
    );
    res.json({ brands: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CUSTOMERS ────────────────────────────────────────────────────────────────
router.get('/customers', async (req, res) => {
  const { q, page = 1, limit = 50 } = req.query;
  const conditions = [];
  const params = [];
  if (q) {
    params.push(`%${q}%`);
    conditions.push(`(c.full_name ILIKE $${params.length} OR c.email ILIKE $${params.length} OR c.phone ILIKE $${params.length})`);
  }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const offset = (Number(page) - 1) * Number(limit);
  params.push(Number(limit), offset);
  try {
    const { rows } = await db(req).query(
      `SELECT c.id, c.full_name, c.email, c.phone, c.is_vip,
              c.home_region_id, c.tags, c.preferred_language,
              c.preferred_currency, c.created_at
       FROM ${SCHEMA}.customers c
       ${where}
       ORDER BY c.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json({ customers: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/customers', express.json(), async (req, res) => {
  const { full_name, email, phone, preferred_language, region_code, kyc_notes, is_vip, tags } = req.body;
  if (!full_name || !email) return res.status(400).json({ error: 'full_name and email are required' });
  try {
    let region_id = null;
    if (region_code) {
      const { rows: [r] } = await db(req).query(
        `SELECT id FROM ${SCHEMA}.regions WHERE code = $1`, [region_code.toUpperCase()]
      );
      region_id = r?.id || null;
    }
    const { rows: [c] } = await db(req).query(
      `INSERT INTO ${SCHEMA}.customers
         (full_name, email, phone, preferred_language, home_region_id, kyc_notes, is_vip, tags)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id, full_name, email`,
      [full_name, email, phone || null, preferred_language || 'en',
       region_id, kyc_notes || null, is_vip || false, tags || []]
    );
    await _audit(req, 'customer.create', 'customers', c.id, null, req.body);
    res.status(201).json(c);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/customers/:id', express.json(), async (req, res) => {
  const fields = ['full_name','email','phone','preferred_language','home_region_id','kyc_notes','is_vip','tags','preferred_currency'];
  const setClauses = [];
  const params = [];
  fields.forEach(f => {
    if (req.body[f] !== undefined) {
      params.push(req.body[f]);
      setClauses.push(`${f} = $${params.length}`);
    }
  });
  if (!setClauses.length) return res.status(400).json({ error: 'No fields to update' });
  params.push(req.params.id);
  try {
    await db(req).query(
      `UPDATE ${SCHEMA}.customers SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $${params.length}`,
      params
    );
    await _audit(req, 'customer.update', 'customers', req.params.id, null, req.body);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ENQUIRIES ────────────────────────────────────────────────────────────────
router.get('/enquiries', async (req, res) => {
  const { status, region, customer_id, from, to, page = 1, limit = 30 } = req.query;
  const conditions = [];
  const params = [];
  if (status) { params.push(status); conditions.push(`e.status = $${params.length}`); }
  if (region) { params.push(region.toUpperCase()); conditions.push(`r.code = $${params.length}`); }
  if (customer_id) { params.push(customer_id); conditions.push(`e.customer_id = $${params.length}`); }
  if (from) { params.push(from); conditions.push(`e.submitted_at >= $${params.length}`); }
  if (to)   { params.push(to);   conditions.push(`e.submitted_at <= $${params.length + ' 23:59:59'}`); }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const offset = (Number(page) - 1) * Number(limit);
  params.push(Number(limit), offset);
  try {
    const { rows } = await db(req).query(
      `SELECT e.id, e.enquiry_no, e.status, e.notes, e.submitted_at,
              c.full_name AS customer_name, c.email AS customer_email,
              r.code AS region_code, e.currency_code,
              (SELECT COUNT(*) FROM ${SCHEMA}.enquiry_items ei WHERE ei.enquiry_id = e.id)::INT AS item_count
       FROM ${SCHEMA}.enquiries e
       JOIN ${SCHEMA}.customers c ON c.id = e.customer_id
       JOIN ${SCHEMA}.regions r   ON r.id = e.region_id
       ${where}
       ORDER BY e.submitted_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json({ enquiries: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/enquiries/:id', async (req, res) => {
  try {
    const { rows: [enquiry] } = await db(req).query(
      `SELECT e.id, e.enquiry_no, e.status, e.notes, e.submitted_at,
              c.full_name AS customer_name, c.email AS customer_email,
              r.code AS region_code, e.currency_code
       FROM ${SCHEMA}.enquiries e
       JOIN ${SCHEMA}.customers c ON c.id = e.customer_id
       JOIN ${SCHEMA}.regions r   ON r.id = e.region_id
       WHERE e.id = $1`,
      [req.params.id]
    );
    if (!enquiry) return res.status(404).json({ error: 'Enquiry not found' });
    const { rows: items } = await db(req).query(
      `SELECT ei.id, ei.quantity, ei.unit_price_hint,
              p.sku, b.name AS brand_name, p.series
       FROM ${SCHEMA}.enquiry_items ei
       JOIN ${SCHEMA}.products p ON p.id = ei.product_id
       JOIN ${SCHEMA}.brands b   ON b.id = p.brand_id
       WHERE ei.enquiry_id = $1`,
      [req.params.id]
    );
    enquiry.items = items;
    res.json(enquiry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── AI CHAT ──────────────────────────────────────────────────────────────────
router.post('/chat', express.json(), async (req, res) => {
  const { messages, context } = req.body;
  if (!Array.isArray(messages) || messages.length === 0)
    return res.status(400).json({ error: 'messages array required' });

  const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
  if (!DEEPSEEK_API_KEY) return res.status(503).json({ error: 'AI service not configured' });

  const systemPrompt = [
    'You are an AI assistant for Arrisonapps Fine Cigars admin portal.',
    'You help with product management, inventory, CRM leads, and business insights.',
    'Be concise and professional.',
    context ? `\nCurrent context: ${context}` : '',
  ].filter(Boolean).join(' ');

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-reasoner',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        stream: false,
      }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(502).json({ error: err.error?.message || 'AI request failed' });
    }
    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || '';
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Audit helper ─────────────────────────────────────────────────────────────
async function _audit(req, action, resource, resourceId, before, after) {
  try {
    await db(req).query(
      `INSERT INTO ${SCHEMA}.audit_log
         (performed_by, action, resource, resource_id, before_data, after_data, ip_address)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [req.user?.sub || null, action, resource, resourceId || null,
       before ? JSON.stringify(before) : null,
       after  ? JSON.stringify(after)  : null,
       req.ip]
    );
  } catch { /* non-blocking */ }
}

module.exports = router;
