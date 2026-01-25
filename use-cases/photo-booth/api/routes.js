// Photo Booth API Routes
// Express router for Photo Booth endpoints with SSE support

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Anthropic = require('@anthropic-ai/sdk').default;

// Import pool from main db module
const { pool } = require('../../../db');

const router = express.Router();

// Initialize database schema
let schemaInitialized = false;
async function initializeSchema() {
  if (schemaInitialized) return;

  try {
    // Create tables if they don't exist
    await pool.query(`
      -- Events table
      CREATE TABLE IF NOT EXISTS photo_booth_events (
        id SERIAL PRIMARY KEY,
        event_id UUID DEFAULT gen_random_uuid() UNIQUE,
        name VARCHAR(255) NOT NULL,
        brand_name VARCHAR(255),
        logo_path TEXT,
        hashtag VARCHAR(100),
        metadata_json JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Sessions table
      CREATE TABLE IF NOT EXISTS photo_booth_sessions (
        id SERIAL PRIMARY KEY,
        session_id UUID DEFAULT gen_random_uuid() UNIQUE,
        event_id UUID REFERENCES photo_booth_events(event_id),
        user_consent BOOLEAN DEFAULT false,
        language VARCHAR(10) DEFAULT 'en',
        theme_selected VARCHAR(100),
        analysis_json JSONB,
        status VARCHAR(50) DEFAULT 'created',
        error_code VARCHAR(50),
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP,
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Images table
      CREATE TABLE IF NOT EXISTS photo_booth_images (
        id SERIAL PRIMARY KEY,
        image_id UUID DEFAULT gen_random_uuid() UNIQUE,
        session_id UUID REFERENCES photo_booth_sessions(session_id) ON DELETE CASCADE,
        image_type VARCHAR(20) NOT NULL,
        image_path TEXT NOT NULL,
        image_hash VARCHAR(64),
        theme VARCHAR(100),
        comfyui_prompt TEXT,
        generation_time_ms INTEGER,
        quality_check_json JSONB,
        metadata_json JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Errors table
      CREATE TABLE IF NOT EXISTS photo_booth_errors (
        id SERIAL PRIMARY KEY,
        error_id UUID DEFAULT gen_random_uuid() UNIQUE,
        session_id UUID REFERENCES photo_booth_sessions(session_id) ON DELETE SET NULL,
        error_code VARCHAR(50) NOT NULL,
        error_message TEXT NOT NULL,
        agent_name VARCHAR(100),
        input_params JSONB,
        stack_trace TEXT,
        recovery_action VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Analytics table
      CREATE TABLE IF NOT EXISTS photo_booth_analytics (
        id SERIAL PRIMARY KEY,
        event_id UUID REFERENCES photo_booth_events(event_id),
        date DATE NOT NULL,
        total_sessions INTEGER DEFAULT 0,
        completed_count INTEGER DEFAULT 0,
        failed_count INTEGER DEFAULT 0,
        avg_generation_time_ms INTEGER,
        theme_distribution_json JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(event_id, date)
      );

      -- QR codes table
      CREATE TABLE IF NOT EXISTS photo_booth_qr_codes (
        id SERIAL PRIMARY KEY,
        qr_id UUID DEFAULT gen_random_uuid() UNIQUE,
        session_id UUID REFERENCES photo_booth_sessions(session_id) ON DELETE CASCADE,
        image_id UUID REFERENCES photo_booth_images(image_id) ON DELETE CASCADE,
        qr_code_path TEXT,
        short_link VARCHAR(255),
        download_link TEXT,
        share_link TEXT,
        scan_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Indexes
      CREATE INDEX IF NOT EXISTS idx_pb_sessions_event ON photo_booth_sessions(event_id);
      CREATE INDEX IF NOT EXISTS idx_pb_sessions_status ON photo_booth_sessions(status);
      CREATE INDEX IF NOT EXISTS idx_pb_images_session ON photo_booth_images(session_id);
      CREATE INDEX IF NOT EXISTS idx_pb_qr_session ON photo_booth_qr_codes(session_id);
    `);

    schemaInitialized = true;
    console.log('Photo booth database schema initialized');
  } catch (error) {
    console.error('Failed to initialize photo booth schema:', error.message);
  }
}

// Initialize schema on module load
initializeSchema();

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_PATH || '/tmp/photo-booth/uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `upload-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  },
});

// Import orchestrator
const { createPhotoBoothOrchestrator } = require('../agents/orchestrator');

// Lazy load orchestrator
let orchestrator = null;
let anthropic = null;

function getOrchestrator() {
  if (!orchestrator) {
    if (!anthropic) {
      anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }

    orchestrator = createPhotoBoothOrchestrator({
      pool,
      anthropic,
    });
  }
  return orchestrator;
}

// Get database pool
function getPool(req) {
  return pool;
}

/**
 * @swagger
 * /api/photo-booth/session/create:
 *   post:
 *     summary: Create a new photo booth session
 *     tags: [Photo Booth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event_id:
 *                 type: string
 *               language:
 *                 type: string
 *                 default: en
 *               consent_agreed:
 *                 type: boolean
 *                 required: true
 *     responses:
 *       200:
 *         description: Session created successfully
 */
router.post('/session/create', async (req, res) => {
  try {
    const { event_id, language = 'en', consent_agreed } = req.body;

    if (!consent_agreed) {
      return res.status(400).json({
        success: false,
        error: 'User consent is required',
      });
    }

    const pool = getPool(req);
    const orch = getOrchestrator();

    const session = await orch.createSession(event_id, language, consent_agreed);

    res.json({
      success: true,
      session_id: session.session_id,
      created_at: session.created_at,
    });
  } catch (error) {
    console.error('[Photo Booth API] Create session error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create session',
      code: error.code || 'FB_DB_001',
    });
  }
});

/**
 * @swagger
 * /api/photo-booth/image/upload:
 *   post:
 *     summary: Upload an image to an existing session
 *     tags: [Photo Booth]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               session_id:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded and validated
 */
router.post('/image/upload', upload.single('image'), async (req, res) => {
  try {
    const { session_id } = req.body;

    if (!session_id) {
      return res.status(400).json({
        success: false,
        error: 'session_id is required',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided',
      });
    }

    const pool = getPool(req);
    const orch = getOrchestrator();

    const result = await orch.uploadImage(session_id, req.file.path);

    res.json({
      success: true,
      image_id: result.image_id,
      quality_check: result.quality_check,
    });
  } catch (error) {
    console.error('[Photo Booth API] Upload error:', error);
    res.status(error.code?.startsWith('FB_') ? 400 : 500).json({
      success: false,
      error: error.message || 'Upload failed',
      code: error.code || 'FB_UPLOAD_002',
      details: error.details,
      recovery_action: error.recovery_action,
    });
  }
});

/**
 * @swagger
 * /api/photo-booth/themes:
 *   get:
 *     summary: Get available themes
 *     tags: [Photo Booth]
 *     responses:
 *       200:
 *         description: List of available themes
 */
router.get('/themes', async (req, res) => {
  try {
    const pool = getPool(req);
    const orch = getOrchestrator();

    const themes = orch.getThemes();

    res.json({
      success: true,
      themes: themes.map((theme) => ({
        id: theme.id,
        name: theme.name,
        country: theme.country,
        description: theme.description,
        era: theme.era,
        image_url: theme.image_url,
      })),
    });
  } catch (error) {
    console.error('[Photo Booth API] Get themes error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get themes',
    });
  }
});

/**
 * @swagger
 * /api/photo-booth/analyze:
 *   post:
 *     summary: Analyze uploaded image (with SSE progress)
 *     tags: [Photo Booth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               session_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: SSE stream of analysis progress
 */
router.post('/analyze', async (req, res) => {
  const { session_id } = req.body;

  if (!session_id) {
    return res.status(400).json({
      success: false,
      error: 'session_id is required',
    });
  }

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  // Send initial event
  res.write(`data: ${JSON.stringify({ type: 'start', message: 'Starting analysis...' })}\n\n`);

  try {
    const pool = getPool(req);
    const orch = getOrchestrator();

    // Progress callback for SSE
    const onProgress = (update) => {
      res.write(
        `data: ${JSON.stringify({
          type: 'progress',
          step: update.current_step,
          substep: update.substep,
          message: update.message,
          percentage: update.progress_percentage,
          timestamp: update.timestamp,
        })}\n\n`
      );
    };

    const result = await orch.analyzeImage(session_id, onProgress);

    // Send completion event
    res.write(
      `data: ${JSON.stringify({
        type: 'complete',
        analysis: result.analysis,
        recommended_theme: result.recommended_theme,
      })}\n\n`
    );

    res.end();
  } catch (error) {
    console.error('[Photo Booth API] Analyze error:', error);

    res.write(
      `data: ${JSON.stringify({
        type: 'error',
        error: {
          code: error.code || 'FB_DB_001',
          message: error.message || 'Analysis failed',
          recovery_action: error.recovery_action,
        },
      })}\n\n`
    );

    res.end();
  }
});

/**
 * @swagger
 * /api/photo-booth/generate:
 *   post:
 *     summary: Generate styled image (with SSE progress)
 *     tags: [Photo Booth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               session_id:
 *                 type: string
 *               theme_name:
 *                 type: string
 *     responses:
 *       200:
 *         description: SSE stream of generation progress
 */
router.post('/generate', async (req, res) => {
  const { session_id, theme_name } = req.body;

  if (!session_id || !theme_name) {
    return res.status(400).json({
      success: false,
      error: 'session_id and theme_name are required',
    });
  }

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  res.write(`data: ${JSON.stringify({ type: 'start', message: 'Starting generation...' })}\n\n`);

  try {
    const pool = getPool(req);
    const orch = getOrchestrator();

    const onProgress = (update) => {
      res.write(
        `data: ${JSON.stringify({
          type: 'progress',
          step: update.current_step,
          substep: update.substep,
          message: update.message,
          percentage: update.progress_percentage,
          timestamp: update.timestamp,
        })}\n\n`
      );
    };

    const result = await orch.generateImage(session_id, theme_name, onProgress);

    res.write(
      `data: ${JSON.stringify({
        type: 'complete',
        image_id: result.image_id,
        generated_image_url: result.generated_image_url,
        generation_time_ms: result.generation_time_ms,
      })}\n\n`
    );

    res.end();
  } catch (error) {
    console.error('[Photo Booth API] Generate error:', error);

    res.write(
      `data: ${JSON.stringify({
        type: 'error',
        error: {
          code: error.code || 'FB_GENAI_001',
          message: error.message || 'Generation failed',
          recovery_action: error.recovery_action,
        },
      })}\n\n`
    );

    res.end();
  }
});

/**
 * @swagger
 * /api/photo-booth/finalize:
 *   post:
 *     summary: Finalize session with branding and QR code
 *     tags: [Photo Booth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               session_id:
 *                 type: string
 *               image_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Session finalized successfully
 */
router.post('/finalize', async (req, res) => {
  const { session_id, image_id } = req.body;

  if (!session_id || !image_id) {
    return res.status(400).json({
      success: false,
      error: 'session_id and image_id are required',
    });
  }

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  res.write(`data: ${JSON.stringify({ type: 'start', message: 'Finalizing...' })}\n\n`);

  try {
    const pool = getPool(req);
    const orch = getOrchestrator();

    const onProgress = (update) => {
      res.write(
        `data: ${JSON.stringify({
          type: 'progress',
          step: update.current_step,
          substep: update.substep,
          message: update.message,
          percentage: update.progress_percentage,
          timestamp: update.timestamp,
        })}\n\n`
      );
    };

    const result = await orch.finalizeSession(session_id, image_id, onProgress);

    res.write(
      `data: ${JSON.stringify({
        type: 'complete',
        branded_image_url: result.branded_image_url,
        qr_code_url: result.qr_code_url,
        qr_code_data_url: result.qr_code_data_url,
        download_link: result.download_link,
        share_link: result.share_link,
      })}\n\n`
    );

    res.end();
  } catch (error) {
    console.error('[Photo Booth API] Finalize error:', error);

    res.write(
      `data: ${JSON.stringify({
        type: 'error',
        error: {
          code: error.code || 'FB_BRAND_002',
          message: error.message || 'Finalization failed',
          recovery_action: error.recovery_action,
        },
      })}\n\n`
    );

    res.end();
  }
});

/**
 * @swagger
 * /api/photo-booth/session/{session_id}/status:
 *   get:
 *     summary: Get session status
 *     tags: [Photo Booth]
 *     parameters:
 *       - in: path
 *         name: session_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session status
 */
router.get('/session/:session_id/status', async (req, res) => {
  try {
    const { session_id } = req.params;

    const pool = getPool(req);
    const orch = getOrchestrator();

    const status = await orch.getSessionStatus(session_id);

    if (!status.session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
        code: 'FB_DB_002',
      });
    }

    res.json({
      success: true,
      session: {
        session_id: status.session.session_id,
        status: status.session.status,
        theme_selected: status.session.theme_selected,
        created_at: status.session.created_at,
        completed_at: status.session.completed_at,
        error_code: status.session.error_code,
        error_message: status.session.error_message,
      },
      progress: status.progress,
      recent_updates: status.statusUpdates.slice(-10),
    });
  } catch (error) {
    console.error('[Photo Booth API] Get status error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get session status',
    });
  }
});

/**
 * @swagger
 * /api/photo-booth/event/{event_id}/analytics:
 *   get:
 *     summary: Get event analytics
 *     tags: [Photo Booth]
 *     parameters:
 *       - in: path
 *         name: event_id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *     responses:
 *       200:
 *         description: Event analytics
 */
router.get('/event/:event_id/analytics', async (req, res) => {
  try {
    const { event_id } = req.params;
    const days = parseInt(req.query.days) || 7;

    const pool = getPool(req);
    const orch = getOrchestrator();

    const analytics = await orch.getAnalytics(event_id === 'all' ? undefined : event_id, days);
    const popularThemes = await orch.getPopularThemes(event_id === 'all' ? undefined : event_id, days);

    res.json({
      success: true,
      analytics,
      popular_themes: popularThemes,
    });
  } catch (error) {
    console.error('[Photo Booth API] Get analytics error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get analytics',
    });
  }
});

/**
 * @swagger
 * /api/photo-booth/image/{image_id}:
 *   get:
 *     summary: Get image by ID
 *     tags: [Photo Booth]
 *     parameters:
 *       - in: path
 *         name: image_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image file
 */
router.get('/image/:image_id', async (req, res) => {
  try {
    const { image_id } = req.params;
    const pool = getPool(req);

    // Get image path from database
    const result = await pool.query(
      'SELECT image_path, image_type FROM photo_booth_images WHERE image_id = $1',
      [image_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Image not found',
      });
    }

    const { image_path } = result.rows[0];

    if (!fs.existsSync(image_path)) {
      // Return placeholder for mock mode
      return res.status(404).json({
        success: false,
        error: 'Image file not found (mock mode)',
        image_path,
      });
    }

    res.sendFile(image_path);
  } catch (error) {
    console.error('[Photo Booth API] Get image error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get image',
    });
  }
});

/**
 * @swagger
 * /api/photo-booth/download/{short_id}:
 *   get:
 *     summary: Download image by short link
 *     tags: [Photo Booth]
 *     parameters:
 *       - in: path
 *         name: short_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image file download
 */
router.get('/download/:short_id', async (req, res) => {
  try {
    const { short_id } = req.params;
    const pool = getPool(req);

    // Get QR code record
    const baseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:8080';
    const shortLink = `${baseUrl}/pb/${short_id}`;

    const qrResult = await pool.query(
      'SELECT * FROM photo_booth_qr_codes WHERE short_link = $1',
      [shortLink]
    );

    if (qrResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Download link not found',
      });
    }

    const qrRecord = qrResult.rows[0];

    // Increment scan count
    await pool.query(
      'UPDATE photo_booth_qr_codes SET scan_count = scan_count + 1 WHERE qr_id = $1',
      [qrRecord.qr_id]
    );

    // Get branded image
    const imageResult = await pool.query(
      'SELECT image_path FROM photo_booth_images WHERE image_id = $1',
      [qrRecord.image_id]
    );

    if (imageResult.rows.length === 0 || !fs.existsSync(imageResult.rows[0].image_path)) {
      return res.status(404).json({
        success: false,
        error: 'Image file not found',
      });
    }

    const imagePath = imageResult.rows[0].image_path;
    const filename = `5ml-photo-booth-${short_id}.jpg`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'image/jpeg');
    res.sendFile(imagePath);
  } catch (error) {
    console.error('[Photo Booth API] Download error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Download failed',
    });
  }
});

/**
 * @swagger
 * /api/photo-booth/qr/{qr_id}:
 *   get:
 *     summary: Get QR code image
 *     tags: [Photo Booth]
 *     parameters:
 *       - in: path
 *         name: qr_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: QR code PNG image
 */
router.get('/qr/:qr_id', async (req, res) => {
  try {
    const { qr_id } = req.params;
    const pool = getPool(req);

    const result = await pool.query(
      'SELECT qr_code_path FROM photo_booth_qr_codes WHERE qr_id = $1',
      [qr_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'QR code not found',
      });
    }

    const { qr_code_path } = result.rows[0];

    if (!fs.existsSync(qr_code_path)) {
      return res.status(404).json({
        success: false,
        error: 'QR code file not found',
      });
    }

    res.setHeader('Content-Type', 'image/png');
    res.sendFile(qr_code_path);
  } catch (error) {
    console.error('[Photo Booth API] Get QR error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get QR code',
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'photo-booth',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
