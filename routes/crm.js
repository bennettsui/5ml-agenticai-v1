/**
 * CRM API Routes
 * Provides CRUD for clients, projects, feedback + Gmail integration + orchestration status
 */
const express = require('express');
const router = express.Router();

module.exports = function createCrmRoutes(db) {
  const { pool } = db;

  // ==========================================
  // BRANDS
  // ==========================================

  // List clients (paginated, searchable)
  router.get('/brands', async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const size = Math.min(200, Math.max(1, parseInt(req.query.size) || 20));
      const search = req.query.search || '';
      const offset = (page - 1) * size;

      let whereClause = '';
      const params = [];

      if (search) {
        params.push(`%${search}%`);
        whereClause = `WHERE name ILIKE $${params.length}`;
      }

      const countResult = await pool.query(
        `SELECT COUNT(*) as total FROM crm_clients ${whereClause}`,
        params
      );
      const total = parseInt(countResult.rows[0].total);

      const dataParams = [...params, size, offset];
      const result = await pool.query(
        `SELECT * FROM crm_clients ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
        dataParams
      );

      res.json({
        items: result.rows,
        total,
        page,
        size,
        pages: Math.ceil(total / size),
      });
    } catch (error) {
      console.error('Error listing clients:', error);
      res.status(500).json({ detail: error.message });
    }
  });

  // Get single client
  router.get('/brands/:id', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM crm_clients WHERE id = $1', [req.params.id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ detail: 'Client not found' });
      }
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error getting client:', error);
      res.status(500).json({ detail: error.message });
    }
  });

  // Create client
  router.post('/brands', async (req, res) => {
    try {
      const { name, legal_name, industry, region, status, website_url, company_size, client_value_tier } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ detail: 'Client name is required' });
      }

      const result = await pool.query(
        `INSERT INTO crm_clients (name, legal_name, industry, region, status, website_url, company_size, client_value_tier)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          name.trim(),
          legal_name || null,
          JSON.stringify(industry || []),
          JSON.stringify(region || []),
          status || 'prospect',
          website_url || null,
          company_size || null,
          client_value_tier || null,
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating client:', error);
      res.status(500).json({ detail: error.message });
    }
  });

  // Update client
  router.put('/brands/:id', async (req, res) => {
    try {
      const { name, legal_name, industry, region, status, website_url, company_size, client_value_tier } = req.body;
      const result = await pool.query(
        `UPDATE crm_clients SET
          name = COALESCE($2, name),
          legal_name = COALESCE($3, legal_name),
          industry = COALESCE($4, industry),
          region = COALESCE($5, region),
          status = COALESCE($6, status),
          website_url = COALESCE($7, website_url),
          company_size = COALESCE($8, company_size),
          client_value_tier = COALESCE($9, client_value_tier),
          updated_at = NOW()
        WHERE id = $1
        RETURNING *`,
        [
          req.params.id,
          name || null,
          legal_name || null,
          industry ? JSON.stringify(industry) : null,
          region ? JSON.stringify(region) : null,
          status || null,
          website_url || null,
          company_size || null,
          client_value_tier || null,
        ]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ detail: 'Client not found' });
      }
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating client:', error);
      res.status(500).json({ detail: error.message });
    }
  });

  // Get projects for a specific client
  router.get('/brands/:id/projects', async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const size = Math.min(200, Math.max(1, parseInt(req.query.size) || 50));
      const offset = (page - 1) * size;

      const countResult = await pool.query(
        'SELECT COUNT(*) as total FROM crm_projects WHERE client_id = $1',
        [req.params.id]
      );
      const total = parseInt(countResult.rows[0].total);

      const result = await pool.query(
        `SELECT * FROM crm_projects WHERE client_id = $1
         ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [req.params.id, size, offset]
      );

      res.json({
        items: result.rows,
        total,
        page,
        size,
        pages: Math.ceil(total / size),
      });
    } catch (error) {
      console.error('Error listing client projects:', error);
      res.status(500).json({ detail: error.message });
    }
  });

  // Get feedback for a specific client
  router.get('/brands/:id/feedback', async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const size = Math.min(200, Math.max(1, parseInt(req.query.size) || 50));
      const offset = (page - 1) * size;

      const countResult = await pool.query(
        'SELECT COUNT(*) as total FROM crm_feedback WHERE client_id = $1',
        [req.params.id]
      );
      const total = parseInt(countResult.rows[0].total);

      const result = await pool.query(
        `SELECT * FROM crm_feedback WHERE client_id = $1
         ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [req.params.id, size, offset]
      );

      res.json({
        items: result.rows,
        total,
        page,
        size,
        pages: Math.ceil(total / size),
      });
    } catch (error) {
      console.error('Error listing client feedback:', error);
      res.status(500).json({ detail: error.message });
    }
  });

  // ==========================================
  // PROJECTS
  // ==========================================

  // List projects (paginated, filterable by status)
  router.get('/projects', async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const size = Math.min(200, Math.max(1, parseInt(req.query.size) || 20));
      const statusFilter = req.query.status || '';
      const offset = (page - 1) * size;

      let whereClause = '';
      const params = [];

      if (statusFilter) {
        params.push(statusFilter);
        whereClause = `WHERE p.status = $${params.length}`;
      }

      const countResult = await pool.query(
        `SELECT COUNT(*) as total FROM crm_projects p ${whereClause}`,
        params
      );
      const total = parseInt(countResult.rows[0].total);

      const dataParams = [...params, size, offset];
      const result = await pool.query(
        `SELECT p.*, c.name as client_name
         FROM crm_projects p
         LEFT JOIN crm_clients c ON p.client_id = c.id
         ${whereClause}
         ORDER BY p.created_at DESC
         LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
        dataParams
      );

      res.json({
        items: result.rows,
        total,
        page,
        size,
        pages: Math.ceil(total / size),
      });
    } catch (error) {
      console.error('Error listing projects:', error);
      res.status(500).json({ detail: error.message });
    }
  });

  // Get single project
  router.get('/projects/:id', async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT * FROM crm_projects WHERE id = $1',
        [req.params.id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ detail: 'Project not found' });
      }
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error getting project:', error);
      res.status(500).json({ detail: error.message });
    }
  });

  // Create project
  router.post('/projects', async (req, res) => {
    try {
      const { client_id, name, type, brief, start_date, end_date, status } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ detail: 'Project name is required' });
      }

      const result = await pool.query(
        `INSERT INTO crm_projects (client_id, name, type, brief, start_date, end_date, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          client_id || null,
          name.trim(),
          type || 'other',
          brief || null,
          start_date || null,
          end_date || null,
          status || 'planning',
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating project:', error);
      res.status(500).json({ detail: error.message });
    }
  });

  // ==========================================
  // FEEDBACK
  // ==========================================

  // List feedback (paginated, filterable by sentiment)
  router.get('/feedback', async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const size = Math.min(200, Math.max(1, parseInt(req.query.size) || 20));
      const sentimentFilter = req.query.sentiment || '';
      const projectIdFilter = req.query.project_id || '';
      const offset = (page - 1) * size;

      const conditions = [];
      const params = [];

      if (sentimentFilter) {
        params.push(sentimentFilter);
        conditions.push(`f.sentiment = $${params.length}`);
      }
      if (projectIdFilter) {
        params.push(projectIdFilter);
        conditions.push(`f.project_id = $${params.length}`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const countResult = await pool.query(
        `SELECT COUNT(*) as total FROM crm_feedback f ${whereClause}`,
        params
      );
      const total = parseInt(countResult.rows[0].total);

      const dataParams = [...params, size, offset];
      const result = await pool.query(
        `SELECT f.*, c.name as client_name
         FROM crm_feedback f
         LEFT JOIN crm_clients c ON f.client_id = c.id
         ${whereClause}
         ORDER BY f.created_at DESC
         LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
        dataParams
      );

      res.json({
        items: result.rows,
        total,
        page,
        size,
        pages: Math.ceil(total / size),
      });
    } catch (error) {
      console.error('Error listing feedback:', error);
      res.status(500).json({ detail: error.message });
    }
  });

  // ==========================================
  // GMAIL INTEGRATION
  // ==========================================

  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
  const GMAIL_SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
  ];

  // Gmail status
  router.get('/gmail/status', async (req, res) => {
    const configured = !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_REDIRECT_URI);

    try {
      const result = await pool.query(
        'SELECT email, last_sync_at, total_synced FROM crm_gmail_tokens ORDER BY updated_at DESC LIMIT 1'
      );

      if (result.rows.length === 0) {
        return res.json({
          configured,
          connected: false,
          email: null,
          last_sync_at: null,
          total_synced: 0,
        });
      }

      const row = result.rows[0];
      res.json({
        configured,
        connected: true,
        email: row.email,
        last_sync_at: row.last_sync_at,
        total_synced: row.total_synced || 0,
      });
    } catch (error) {
      console.error('Error getting Gmail status:', error);
      res.json({
        configured,
        connected: false,
        email: null,
        last_sync_at: null,
        total_synced: 0,
      });
    }
  });

  // Gmail auth URL
  router.get('/gmail/auth', (req, res) => {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_REDIRECT_URI) {
      return res.status(400).json({
        detail: 'Gmail integration not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI.',
      });
    }

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: GMAIL_SCOPES.join(' '),
      access_type: 'offline',
      prompt: 'consent',
    });

    res.json({ auth_url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
  });

  // Gmail OAuth callback
  router.get('/gmail/callback', async (req, res) => {
    try {
      const { code } = req.query;
      if (!code) {
        return res.status(400).json({ detail: 'Authorization code is required' });
      }

      // Exchange code for tokens
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: GOOGLE_REDIRECT_URI,
          grant_type: 'authorization_code',
        }),
      });

      const tokens = await tokenRes.json();
      if (tokens.error) {
        return res.status(400).json({ detail: `OAuth error: ${tokens.error_description || tokens.error}` });
      }

      // Get user email
      const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const userInfo = await userRes.json();

      // Save tokens to DB
      const expiryDate = new Date(Date.now() + (tokens.expires_in || 3600) * 1000);
      await pool.query(
        `INSERT INTO crm_gmail_tokens (email, access_token, refresh_token, token_expiry)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO UPDATE SET
           access_token = $2, refresh_token = COALESCE($3, crm_gmail_tokens.refresh_token),
           token_expiry = $4, updated_at = NOW()`,
        [userInfo.email, tokens.access_token, tokens.refresh_token, expiryDate]
      );

      // Redirect back to integrations page
      res.redirect('/use-cases/crm/integrations?gmail=connected');
    } catch (error) {
      console.error('Gmail callback error:', error);
      res.status(500).json({ detail: error.message });
    }
  });

  // Gmail sync
  router.post('/gmail/sync', async (req, res) => {
    try {
      // Get stored tokens
      const tokenResult = await pool.query(
        'SELECT * FROM crm_gmail_tokens ORDER BY updated_at DESC LIMIT 1'
      );

      if (tokenResult.rows.length === 0) {
        return res.status(400).json({ detail: 'Gmail not connected. Please authorize first.' });
      }

      let { access_token, refresh_token, token_expiry, email } = tokenResult.rows[0];
      const tokenId = tokenResult.rows[0].id;

      // Refresh token if expired
      if (new Date(token_expiry) < new Date()) {
        if (!refresh_token) {
          return res.status(400).json({ detail: 'Token expired and no refresh token available. Please re-authorize.' });
        }

        const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            refresh_token,
            grant_type: 'refresh_token',
          }),
        });

        const newTokens = await refreshRes.json();
        if (newTokens.error) {
          return res.status(400).json({ detail: `Token refresh failed: ${newTokens.error}` });
        }

        access_token = newTokens.access_token;
        const newExpiry = new Date(Date.now() + (newTokens.expires_in || 3600) * 1000);

        await pool.query(
          'UPDATE crm_gmail_tokens SET access_token = $1, token_expiry = $2, updated_at = NOW() WHERE id = $3',
          [access_token, newExpiry, tokenId]
        );
      }

      // Fetch recent emails from Gmail
      const maxResults = req.body.max_results || 20;
      const listRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&labelIds=INBOX`,
        { headers: { Authorization: `Bearer ${access_token}` } }
      );
      const listData = await listRes.json();

      if (listData.error) {
        return res.status(400).json({ detail: `Gmail API error: ${listData.error.message}` });
      }

      const messages = listData.messages || [];
      let syncedCount = 0;
      let newFeedbackCount = 0;

      // Get all client emails for matching (from client names for now)
      const clients = await pool.query('SELECT id, name FROM crm_clients');
      const clientMap = new Map(clients.rows.map(c => [c.name.toLowerCase(), c.id]));

      for (const msg of messages.slice(0, maxResults)) {
        try {
          const msgRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
            { headers: { Authorization: `Bearer ${access_token}` } }
          );
          const msgData = await msgRes.json();

          const headers = msgData.payload?.headers || [];
          const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || '(no subject)';
          const from = headers.find(h => h.name.toLowerCase() === 'from')?.value || '';
          const dateStr = headers.find(h => h.name.toLowerCase() === 'date')?.value || '';

          // Extract body text
          let body = '';
          if (msgData.payload?.body?.data) {
            body = Buffer.from(msgData.payload.body.data, 'base64').toString('utf-8');
          } else if (msgData.payload?.parts) {
            const textPart = msgData.payload.parts.find(p => p.mimeType === 'text/plain');
            if (textPart?.body?.data) {
              body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
            }
          }

          syncedCount++;

          // Try to match to a client by checking if sender contains client name
          const fromLower = from.toLowerCase();
          let matchedClientId = null;
          for (const [clientName, clientId] of clientMap) {
            if (fromLower.includes(clientName.toLowerCase().split(' ')[0])) {
              matchedClientId = clientId;
              break;
            }
          }

          // Create feedback entry for matched emails
          if (matchedClientId && body.trim()) {
            await pool.query(
              `INSERT INTO crm_feedback (client_id, source, date, raw_text, sentiment, topics, status)
               VALUES ($1, 'email', $2, $3, 'neutral', '[]', 'new')`,
              [matchedClientId, dateStr ? new Date(dateStr) : new Date(), `[${subject}] ${body.substring(0, 2000)}`]
            );
            newFeedbackCount++;
          }
        } catch (msgErr) {
          console.error(`Error processing message ${msg.id}:`, msgErr.message);
        }
      }

      // Update sync status
      await pool.query(
        'UPDATE crm_gmail_tokens SET last_sync_at = NOW(), total_synced = total_synced + $1, updated_at = NOW() WHERE id = $2',
        [syncedCount, tokenId]
      );

      res.json({ synced_count: syncedCount, new_feedback_count: newFeedbackCount });
    } catch (error) {
      console.error('Gmail sync error:', error);
      res.status(500).json({ detail: error.message });
    }
  });

  // ==========================================
  // ORCHESTRATION STATUS
  // ==========================================

  router.get('/orchestration/status', (req, res) => {
    res.json({
      circuit_breaker_state: 'CLOSED',
      active_model: 'claude-sonnet-4-5-20250929',
      daily_tokens_used: 0,
      daily_token_limit: 1000000,
      daily_cost_used_usd: 0,
      daily_cost_limit_usd: 50,
      budget_warning: false,
    });
  });

  return router;
};
