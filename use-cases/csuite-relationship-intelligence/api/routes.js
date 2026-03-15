/**
 * C-Suite Relationship Intelligence — API Routes
 *
 * Mounted at: /api/csuite-rel
 *
 * Endpoints:
 *  POST /chat                  — Conversational interface (orchestrator)
 *  GET  /contacts              — List contacts for tenant
 *  POST /contacts              — Create / upsert a contact
 *  GET  /contacts/:id          — Get single contact with scores
 *  PUT  /contacts/:id          — Update contact
 *  DELETE /contacts/:id        — Delete contact (soft: marks deleted)
 *  POST /contacts/:id/enrich   — Run contact enricher agent
 *  POST /contacts/:id/score    — Run relationship scorer
 *  POST /action-plan           — Generate weekly action plan
 *  GET  /action-plan           — Latest action plan for tenant
 */

'use strict';

const express = require('express');
const router = express.Router();
router.use(express.json());

// ─── Lazy-load agents & services ────────────────────────────────────────────
let _orchestrator, _enricher, _scorer, _advisor;
function getOrchestrator() {
  if (!_orchestrator) _orchestrator = require('../agents/orchestrator');
  return _orchestrator;
}
function getEnricher() {
  if (!_enricher) _enricher = require('../agents/contact-enricher');
  return _enricher;
}
function getScorer() {
  if (!_scorer) _scorer = require('../agents/relationship-scorer');
  return _scorer;
}
function getAdvisor() {
  if (!_advisor) _advisor = require('../agents/action-advisor');
  return _advisor;
}

// ─── DB pool (injected via initDb) ──────────────────────────────────────────
let _pool;
async function initDb(pool) {
  _pool = pool;
  const { initDb: runSchema } = require('../db/schema');
  await runSchema(pool);
}

// ─── LLM services (lazy) ────────────────────────────────────────────────────
function getAnthropicClient() {
  try {
    const Anthropic = require('@anthropic-ai/sdk').default;
    return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  } catch {
    return null;
  }
}
function getDeepseekService() {
  try {
    return require('../../../services/deepseekService');
  } catch {
    return null;
  }
}

// ─── Middleware: resolve tenant from header ──────────────────────────────────
function resolveTenant(req, res, next) {
  const tenantId = req.headers['x-tenant-id'] || req.query.tenant_id;
  if (!tenantId) {
    return res.status(400).json({ error: 'x-tenant-id header required' });
  }
  req.tenantId = tenantId;
  next();
}

// ─── POST /chat — Conversational orchestrator ────────────────────────────────
router.post('/chat', resolveTenant, async (req, res) => {
  try {
    const { message, conversation_history = [], contact_context = null } = req.body;
    if (!message) return res.status(400).json({ error: 'message required' });

    const { runOrchestrator } = getOrchestrator();
    const result = await runOrchestrator(
      { message, tenantId: req.tenantId, conversationHistory: conversation_history, contactContext: contact_context },
      { deepseekService: getDeepseekService(), anthropic: getAnthropicClient() }
    );

    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[csuite-rel/chat]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /contacts — List contacts for tenant ────────────────────────────────
router.get('/contacts', resolveTenant, async (req, res) => {
  if (!_pool) return res.status(503).json({ error: 'DB not initialised' });
  try {
    const { rows } = await _pool.query(
      `SELECT c.*,
              s.warmth_score, s.leverage_score, s.business_potential, s.overall_priority,
              s.scored_at
       FROM csuite_contacts c
       LEFT JOIN LATERAL (
         SELECT * FROM csuite_scores WHERE contact_id = c.id ORDER BY scored_at DESC LIMIT 1
       ) s ON true
       WHERE c.tenant_id = $1
       ORDER BY s.overall_priority NULLS LAST, c.updated_at DESC
       LIMIT 200`,
      [req.tenantId]
    );
    res.json({ success: true, contacts: rows });
  } catch (err) {
    console.error('[csuite-rel/contacts GET]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /contacts — Create contact ────────────────────────────────────────
router.post('/contacts', resolveTenant, async (req, res) => {
  if (!_pool) return res.status(503).json({ error: 'DB not initialised' });
  try {
    const {
      full_name, email, phone, title, company, linkedin_url,
      relationship_type, visibility, tags, sectors, geographies, notes, source,
    } = req.body;

    if (!full_name) return res.status(400).json({ error: 'full_name required' });

    const { rows } = await _pool.query(
      `INSERT INTO csuite_contacts
         (tenant_id, full_name, email, phone, title, company, linkedin_url,
          relationship_type, visibility, tags, sectors, geographies, notes, source)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [req.tenantId, full_name, email, phone, title, company, linkedin_url,
        relationship_type || 'contact', visibility || 'PRIVATE',
        tags || [], sectors || [], geographies || [], notes, source || 'manual']
    );
    res.status(201).json({ success: true, contact: rows[0] });
  } catch (err) {
    console.error('[csuite-rel/contacts POST]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /contacts/:id — Get single contact ──────────────────────────────────
router.get('/contacts/:id', resolveTenant, async (req, res) => {
  if (!_pool) return res.status(503).json({ error: 'DB not initialised' });
  try {
    const { rows: contactRows } = await _pool.query(
      'SELECT * FROM csuite_contacts WHERE id=$1 AND tenant_id=$2',
      [req.params.id, req.tenantId]
    );
    if (!contactRows.length) return res.status(404).json({ error: 'Not found' });

    const { rows: scoreRows } = await _pool.query(
      'SELECT * FROM csuite_scores WHERE contact_id=$1 ORDER BY scored_at DESC LIMIT 1',
      [req.params.id]
    );
    const { rows: interactionRows } = await _pool.query(
      'SELECT * FROM csuite_interactions WHERE contact_id=$1 AND tenant_id=$2 ORDER BY occurred_at DESC LIMIT 20',
      [req.params.id, req.tenantId]
    );

    res.json({
      success: true,
      contact: contactRows[0],
      latest_score: scoreRows[0] || null,
      recent_interactions: interactionRows,
    });
  } catch (err) {
    console.error('[csuite-rel/contacts/:id GET]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /contacts/:id — Update contact ─────────────────────────────────────
router.put('/contacts/:id', resolveTenant, async (req, res) => {
  if (!_pool) return res.status(503).json({ error: 'DB not initialised' });
  try {
    const fields = ['full_name','email','phone','title','company','linkedin_url',
      'relationship_type','visibility','tags','sectors','geographies','notes'];
    const updates = [];
    const values = [];
    let idx = 1;
    for (const f of fields) {
      if (req.body[f] !== undefined) {
        updates.push(`${f}=$${idx++}`);
        values.push(req.body[f]);
      }
    }
    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
    updates.push(`updated_at=now()`);
    values.push(req.params.id, req.tenantId);

    const { rows } = await _pool.query(
      `UPDATE csuite_contacts SET ${updates.join(',')} WHERE id=$${idx} AND tenant_id=$${idx+1} RETURNING *`,
      values
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true, contact: rows[0] });
  } catch (err) {
    console.error('[csuite-rel/contacts/:id PUT]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /contacts/:id ────────────────────────────────────────────────────
router.delete('/contacts/:id', resolveTenant, async (req, res) => {
  if (!_pool) return res.status(503).json({ error: 'DB not initialised' });
  try {
    const { rowCount } = await _pool.query(
      'DELETE FROM csuite_contacts WHERE id=$1 AND tenant_id=$2',
      [req.params.id, req.tenantId]
    );
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('[csuite-rel/contacts/:id DELETE]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /contacts/:id/enrich — Run contact enricher ───────────────────────
router.post('/contacts/:id/enrich', resolveTenant, async (req, res) => {
  if (!_pool) return res.status(503).json({ error: 'DB not initialised' });
  try {
    const { rows } = await _pool.query(
      'SELECT * FROM csuite_contacts WHERE id=$1 AND tenant_id=$2',
      [req.params.id, req.tenantId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const contact = rows[0];

    const { research_content = '' } = req.body;
    const { enrichContact } = getEnricher();
    const enrichment = await enrichContact(
      { name: contact.full_name, title: contact.title, company: contact.company, linkedinUrl: contact.linkedin_url },
      research_content,
      { anthropic: getAnthropicClient() }
    );

    await _pool.query(
      'UPDATE csuite_contacts SET enrichment_data=$1, updated_at=now() WHERE id=$2',
      [enrichment, contact.id]
    );

    res.json({ success: true, enrichment });
  } catch (err) {
    console.error('[csuite-rel/contacts/:id/enrich]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /contacts/:id/score — Run relationship scorer ─────────────────────
router.post('/contacts/:id/score', resolveTenant, async (req, res) => {
  if (!_pool) return res.status(503).json({ error: 'DB not initialised' });
  try {
    const { rows: contactRows } = await _pool.query(
      'SELECT * FROM csuite_contacts WHERE id=$1 AND tenant_id=$2',
      [req.params.id, req.tenantId]
    );
    if (!contactRows.length) return res.status(404).json({ error: 'Not found' });
    const contact = contactRows[0];

    const { rows: interactionRows } = await _pool.query(
      `SELECT interaction_type as type, occurred_at::date as date, summary
       FROM csuite_interactions WHERE contact_id=$1 ORDER BY occurred_at DESC LIMIT 15`,
      [contact.id]
    );

    const { initiatives = '' } = req.body;
    const { scoreRelationship } = getScorer();
    const scores = await scoreRelationship(contact, interactionRows, initiatives, { anthropic: getAnthropicClient() });

    await _pool.query(
      `INSERT INTO csuite_scores (tenant_id, contact_id, warmth_score, leverage_score, business_potential, overall_priority, rationale)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [req.tenantId, contact.id, scores.warmth_score, scores.leverage_score,
        scores.business_potential, scores.overall_priority, scores]
    );

    res.json({ success: true, scores });
  } catch (err) {
    console.error('[csuite-rel/contacts/:id/score]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /action-plan — Generate weekly action plan ────────────────────────
router.post('/action-plan', resolveTenant, async (req, res) => {
  if (!_pool) return res.status(503).json({ error: 'DB not initialised' });
  try {
    const { focus_areas = '', week_of } = req.body;

    const { rows: contacts } = await _pool.query(
      `SELECT c.full_name as name, c.title, c.company,
              s.warmth_score, s.leverage_score, s.business_potential, s.overall_priority,
              (SELECT occurred_at::date FROM csuite_interactions WHERE contact_id=c.id ORDER BY occurred_at DESC LIMIT 1) as last_interaction_date
       FROM csuite_contacts c
       LEFT JOIN LATERAL (
         SELECT * FROM csuite_scores WHERE contact_id = c.id ORDER BY scored_at DESC LIMIT 1
       ) s ON true
       WHERE c.tenant_id=$1
       ORDER BY s.warmth_score DESC NULLS LAST
       LIMIT 30`,
      [req.tenantId]
    );

    const { generateActionPlan } = getAdvisor();
    const plan = await generateActionPlan(contacts, focus_areas, {
      deepseekService: getDeepseekService(),
      anthropic: getAnthropicClient(),
    });

    const weekDate = week_of || new Date().toISOString().slice(0, 10);
    await _pool.query(
      `INSERT INTO csuite_action_plans (tenant_id, week_of, focus_areas, plan_data) VALUES ($1,$2,$3,$4)`,
      [req.tenantId, weekDate, focus_areas, plan]
    );

    res.json({ success: true, plan });
  } catch (err) {
    console.error('[csuite-rel/action-plan POST]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /action-plan — Latest plan ─────────────────────────────────────────
router.get('/action-plan', resolveTenant, async (req, res) => {
  if (!_pool) return res.status(503).json({ error: 'DB not initialised' });
  try {
    const { rows } = await _pool.query(
      'SELECT * FROM csuite_action_plans WHERE tenant_id=$1 ORDER BY week_of DESC LIMIT 1',
      [req.tenantId]
    );
    res.json({ success: true, plan: rows[0] || null });
  } catch (err) {
    console.error('[csuite-rel/action-plan GET]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
module.exports.initDb = initDb;
