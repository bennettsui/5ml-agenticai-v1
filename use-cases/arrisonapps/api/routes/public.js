'use strict';
/**
 * Arrisonapps — Public Storefront API
 * All routes are unauthenticated (or JWT-protected for cart/enquiry).
 *
 * Base: /api/arrisonapps/v1
 *
 * GET  /regions
 * GET  /regions/:code/config
 * GET  /products              ?region=HK&brand=&q=&page=1&limit=24
 * GET  /products/:id
 * GET  /products/:id/images/:imageId
 * POST /auth/register
 * POST /auth/login
 * POST /auth/logout
 * GET  /me
 * PUT  /me
 * POST /enquiries
 * GET  /enquiries/:id
 */

const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');

const JWT_SECRET = process.env.ARRISONAPPS_JWT_SECRET || process.env.JWT_SECRET || 'change-me';
const SCHEMA     = 'arrisonapps';

function db(req) { return req.app.locals.arrisonappsPool || req.app.locals.pool; }

// ─── Auth Middleware ──────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try { req.user = jwt.verify(token, JWT_SECRET); } catch { /* ignore */ }
  }
  next();
}

function nextEnquiryNo(regionCode) {
  const y = new Date().getFullYear();
  return `ENQ-${regionCode}-${y}-${Date.now().toString().slice(-5)}`;
}

// ─── Regions ─────────────────────────────────────────────────────────────────
router.get('/regions', async (req, res) => {
  try {
    const { rows } = await db(req).query(
      `SELECT id, code, name, currency_code, currency_symbol, default_language
       FROM ${SCHEMA}.regions WHERE is_active = TRUE ORDER BY name`
    );
    res.json({ regions: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/regions/:code/config', async (req, res) => {
  try {
    const { rows } = await db(req).query(
      `SELECT r.id, r.code, r.name, r.currency_code, r.currency_symbol, r.default_language,
              array_agg(DISTINCT b.name ORDER BY b.name) FILTER (WHERE b.id IS NOT NULL) AS brands
       FROM ${SCHEMA}.regions r
       LEFT JOIN ${SCHEMA}.product_region_settings prs ON prs.region_id = r.id AND prs.is_listed = TRUE
       LEFT JOIN ${SCHEMA}.products p  ON p.id = prs.product_id AND p.is_active = TRUE
       LEFT JOIN ${SCHEMA}.brands b    ON b.id = p.brand_id AND b.is_active = TRUE
       WHERE r.code = $1 AND r.is_active = TRUE
       GROUP BY r.id`,
      [req.params.code.toUpperCase()]
    );
    if (!rows.length) return res.status(404).json({ error: 'Region not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Products ─────────────────────────────────────────────────────────────────
router.get('/products', optionalAuth, async (req, res) => {
  try {
    const { region, brand, q, strength, packaging_type, page = 1, limit = 24 } = req.query;
    if (!region) return res.status(400).json({ error: 'region is required' });

    const conditions = [`va.region_code = $1`, `va.is_listed = TRUE`, `va.stock_status != 'out_of_stock'`];
    const params = [region.toUpperCase()];

    if (brand) {
      params.push(brand);
      conditions.push(`va.brand_name ILIKE $${params.length}`);
    }
    if (strength) {
      params.push(strength);
      conditions.push(`va.strength = $${params.length}`);
    }
    if (packaging_type) {
      params.push(packaging_type);
      conditions.push(`va.packaging_type = $${params.length}`);
    }
    if (q) {
      params.push(`%${q}%`);
      conditions.push(`(va.brand_name ILIKE $${params.length} OR va.series ILIKE $${params.length} OR va.vitola ILIKE $${params.length})`);
    }

    const offset   = (Number(page) - 1) * Number(limit);
    const whereSQL = 'WHERE ' + conditions.join(' AND ');

    const { rows: countRows } = await db(req).query(
      `SELECT COUNT(*) FROM ${SCHEMA}.vw_product_availability va ${whereSQL}`,
      params
    );
    const total = parseInt(countRows[0].count, 10);

    params.push(Number(limit), offset);
    const { rows } = await db(req).query(
      `SELECT va.product_id AS id, va.sku, va.brand_name, va.series, va.vitola,
              va.packaging_qty, va.packaging_type, va.strength,
              va.is_limited_edition, va.is_travel_humidor, va.tags,
              va.short_description, va.display_price, va.currency_code,
              va.currency_symbol, va.stock_status, va.enquiry_only,
              (SELECT cdn_url FROM ${SCHEMA}.product_images pi
               WHERE pi.product_id = va.product_id AND pi.is_primary = TRUE LIMIT 1) AS primary_image_url
       FROM ${SCHEMA}.vw_product_availability va ${whereSQL}
       ORDER BY va.brand_name, va.series, va.vitola
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      products: rows,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/products/:id', optionalAuth, async (req, res) => {
  try {
    const region = req.query.region;
    const { rows } = await db(req).query(
      `SELECT p.id, p.sku, b.name AS brand_name, p.series, p.vitola,
              p.ring_gauge, p.length_mm, p.wrapper_origin, p.binder_origin,
              p.filler_origins, p.strength, p.vintage_year,
              p.packaging_qty, p.packaging_type,
              p.is_limited_edition, p.is_travel_humidor,
              p.short_description, p.full_description,
              p.tasting_notes, p.pairing_notes, p.tags,
              prs.display_price, prs.enquiry_only, prs.price_notes,
              r.currency_code, r.currency_symbol,
              CASE
                WHEN COALESCE(SUM(sl.quantity - sl.reserved_qty), 0) <= 0 THEN 'out_of_stock'
                WHEN COALESCE(SUM(sl.quantity - sl.reserved_qty), 0) <= 10 THEN 'low_stock'
                ELSE 'in_stock'
              END AS stock_status
       FROM ${SCHEMA}.products p
       JOIN ${SCHEMA}.brands b ON b.id = p.brand_id
       LEFT JOIN ${SCHEMA}.product_region_settings prs ON prs.product_id = p.id
         AND prs.region_id = (SELECT id FROM ${SCHEMA}.regions WHERE code = $2)
       LEFT JOIN ${SCHEMA}.regions r ON r.id = prs.region_id
       LEFT JOIN ${SCHEMA}.locations loc ON loc.region_id = r.id AND loc.is_active = TRUE
       LEFT JOIN ${SCHEMA}.stock_levels sl ON sl.product_id = p.id AND sl.location_id = loc.id
       WHERE p.id = $1 AND p.is_active = TRUE
       GROUP BY p.id, b.name, prs.display_price, prs.enquiry_only, prs.price_notes,
                r.currency_code, r.currency_symbol`,
      [req.params.id, (region || 'HK').toUpperCase()]
    );

    if (!rows.length) return res.status(404).json({ error: 'Product not found' });

    const product = rows[0];

    // Images metadata (no binary data in list)
    const { rows: images } = await db(req).query(
      `SELECT id, sort_order, is_primary, cdn_url, mime_type, width_px, height_px, alt_text
       FROM ${SCHEMA}.product_images
       WHERE product_id = $1
       ORDER BY sort_order, is_primary DESC`,
      [req.params.id]
    );
    product.images = images.map(img => ({
      ...img,
      url: img.cdn_url || `/api/arrisonapps/v1/products/${req.params.id}/images/${img.id}`,
    }));

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/products/:id/images/:imageId', async (req, res) => {
  try {
    const { rows } = await db(req).query(
      `SELECT image_data, mime_type, cdn_url FROM ${SCHEMA}.product_images
       WHERE id = $1 AND product_id = $2`,
      [req.params.imageId, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Image not found' });
    const img = rows[0];
    if (img.cdn_url) return res.redirect(302, img.cdn_url);
    if (!img.image_data) return res.status(404).json({ error: 'No image data' });
    res.setHeader('Content-Type', img.mime_type || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(img.image_data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Auth ─────────────────────────────────────────────────────────────────────
router.post('/auth/register', express.json(), async (req, res) => {
  const { email, password, full_name, phone, preferred_language, region_code } = req.body;
  if (!email || !password || !full_name)
    return res.status(400).json({ error: 'email, password and full_name are required' });
  try {
    const hash = await bcrypt.hash(password, 12);
    const pool = db(req);

    // Upsert user
    const { rows: [user] } = await pool.query(
      `INSERT INTO ${SCHEMA}.users
         (email, password_hash, full_name, phone, is_customer, email_verified,
          role_id)
       VALUES ($1, $2, $3, $4, TRUE, FALSE,
         (SELECT id FROM ${SCHEMA}.roles WHERE name = 'viewer'))
       ON CONFLICT (email) DO NOTHING
       RETURNING id, email, full_name`,
      [email.toLowerCase(), hash, full_name, phone || null]
    );
    if (!user) return res.status(409).json({ error: 'Email already registered' });

    // Create customer record
    await pool.query(
      `INSERT INTO ${SCHEMA}.customers
         (user_id, full_name, email, phone, preferred_language, home_region_id)
       VALUES ($1, $2, $3, $4, $5,
         (SELECT id FROM ${SCHEMA}.regions WHERE code = $6))
       ON CONFLICT (email) DO NOTHING`,
      [user.id, full_name, email.toLowerCase(), phone || null,
       preferred_language || 'en', (region_code || 'HK').toUpperCase()]
    );

    const token = jwt.sign({ sub: user.id, email: user.email, role: 'viewer' }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user.id, email: user.email, full_name: user.full_name } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/auth/login', express.json(), async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  try {
    const { rows: [user] } = await db(req).query(
      `SELECT u.id, u.email, u.full_name, u.password_hash, r.name AS role
       FROM ${SCHEMA}.users u
       LEFT JOIN ${SCHEMA}.roles r ON r.id = u.role_id
       WHERE u.email = $1 AND u.is_active = TRUE`,
      [email.toLowerCase()]
    );
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password_hash || '');
    if (!ok)  return res.status(401).json({ error: 'Invalid credentials' });

    await db(req).query(
      `UPDATE ${SCHEMA}.users SET last_login_at = NOW() WHERE id = $1`, [user.id]
    );
    const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/auth/logout', requireAuth, (req, res) => {
  // Client-side token deletion; server-side could add to blocklist if needed
  res.json({ ok: true });
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const { rows: [user] } = await db(req).query(
      `SELECT u.id, u.email, u.full_name, u.phone, r.name AS role,
              c.id AS customer_id, c.preferred_language, c.preferred_currency,
              c.home_region_id, c.is_vip
       FROM ${SCHEMA}.users u
       LEFT JOIN ${SCHEMA}.roles r ON r.id = u.role_id
       LEFT JOIN ${SCHEMA}.customers c ON c.user_id = u.id
       WHERE u.id = $1`,
      [req.user.sub]
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/me', requireAuth, express.json(), async (req, res) => {
  const { full_name, phone, preferred_language } = req.body;
  try {
    await db(req).query(
      `UPDATE ${SCHEMA}.users SET full_name = COALESCE($1, full_name),
         phone = COALESCE($2, phone), updated_at = NOW()
       WHERE id = $3`,
      [full_name, phone, req.user.sub]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Enquiries ────────────────────────────────────────────────────────────────
router.post('/enquiries', requireAuth, express.json(), async (req, res) => {
  const { region_code, items, notes } = req.body;
  if (!region_code || !Array.isArray(items) || !items.length)
    return res.status(400).json({ error: 'region_code and items[] are required' });

  const pool = db(req);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get customer
    const { rows: [cust] } = await client.query(
      `SELECT id FROM ${SCHEMA}.customers WHERE user_id = $1`, [req.user.sub]
    );
    if (!cust) return res.status(400).json({ error: 'Customer profile not found' });

    // Get region
    const { rows: [region] } = await client.query(
      `SELECT id, code, currency_code FROM ${SCHEMA}.regions WHERE code = $1 AND is_active = TRUE`,
      [region_code.toUpperCase()]
    );
    if (!region) return res.status(400).json({ error: 'Invalid region' });

    const enquiryNo = nextEnquiryNo(region.code);

    const { rows: [enq] } = await client.query(
      `INSERT INTO ${SCHEMA}.enquiries
         (enquiry_no, customer_id, region_id, currency_code, notes, source)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, enquiry_no`,
      [enquiryNo, cust.id, region.id, region.currency_code, notes || null,
       `website-${region.code}`]
    );

    for (const item of items) {
      await client.query(
        `INSERT INTO ${SCHEMA}.enquiry_items (enquiry_id, product_id, quantity, unit_price_hint)
         VALUES ($1, $2, $3, $4)`,
        [enq.id, item.product_id, item.quantity, item.unit_price_hint || null]
      );
    }

    // Create CRM Lead
    const leadNo = enquiryNo.replace('ENQ-', 'LEAD-');
    await client.query(
      `INSERT INTO ${SCHEMA}.leads
         (lead_no, enquiry_id, customer_id, region_id, currency_code, status, source)
       VALUES ($1, $2, $3, $4, $5, 'new', $6)`,
      [leadNo, enq.id, cust.id, region.id, region.currency_code, `website-${region.code}`]
    );

    // Soft-reserve stock on first available location in region
    const { rows: locations } = await client.query(
      `SELECT id FROM ${SCHEMA}.locations WHERE region_id = $1 AND is_active = TRUE ORDER BY sort_order LIMIT 1`,
      [region.id]
    );
    if (locations.length) {
      for (const item of items) {
        await client.query(
          `INSERT INTO ${SCHEMA}.stock_levels (product_id, location_id, quantity, reserved_qty)
           VALUES ($1, $2, 0, $3)
           ON CONFLICT (product_id, location_id)
           DO UPDATE SET reserved_qty = stock_levels.reserved_qty + $3, updated_at = NOW()`,
          [item.product_id, locations[0].id, item.quantity]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ enquiry_id: enq.id, enquiry_no: enq.enquiry_no });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.get('/enquiries/:id', requireAuth, async (req, res) => {
  try {
    const { rows: [enq] } = await db(req).query(
      `SELECT e.id, e.enquiry_no, e.status, e.notes, e.submitted_at,
              e.currency_code, r.code AS region_code, r.name AS region_name
       FROM ${SCHEMA}.enquiries e
       JOIN ${SCHEMA}.regions r ON r.id = e.region_id
       WHERE e.id = $1`,
      [req.params.id]
    );
    if (!enq) return res.status(404).json({ error: 'Enquiry not found' });

    const { rows: items } = await db(req).query(
      `SELECT ei.quantity, ei.unit_price_hint,
              p.sku, b.name AS brand_name, p.series, p.vitola, p.packaging_qty
       FROM ${SCHEMA}.enquiry_items ei
       JOIN ${SCHEMA}.products p ON p.id = ei.product_id
       JOIN ${SCHEMA}.brands b   ON b.id = p.brand_id
       WHERE ei.enquiry_id = $1`,
      [req.params.id]
    );
    enq.items = items;
    res.json(enq);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
