/**
 * API Routes — S1-S2 Adaptive Math Learning Platform
 *
 * Endpoints:
 *   POST /api/adaptive-learning/explain          — STUDENT_EXPLANATION
 *   POST /api/adaptive-learning/session-summary  — STUDENT_SESSION_SUMMARY
 *   POST /api/adaptive-learning/class-summary    — TEACHER_CLASS_SUMMARY
 *   POST /api/adaptive-learning/author-question  — QUESTION_AUTHORING
 *   POST /api/adaptive-learning/gamification     — GAMIFICATION_MESSAGE
 *   POST /api/adaptive-learning/demo             — Demo/playground: any mode
 *   GET  /api/adaptive-learning/curriculum       — Return HK S1-S2 curriculum map
 *   GET  /api/adaptive-learning/health           — Health check
 */

const express = require('express');
const router = express.Router();
const path = require('path');

const { AdaptiveAgent } = require('../agents/adaptive-agent');

let agent;
function getAgent() {
  if (!agent) agent = new AdaptiveAgent();
  return agent;
}

// ─── Health ───────────────────────────────────────────────────────────────────

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'adaptive-learning',
    model: 'claude-haiku-4-5-20251001',
    hasApiKey: !!process.env.ANTHROPIC_API_KEY,
  });
});

// ─── Curriculum map ───────────────────────────────────────────────────────────

router.get('/curriculum', (req, res) => {
  try {
    const curriculum = require('../kb/hk-math-curriculum.json');
    res.json({ success: true, curriculum });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to load curriculum map' });
  }
});

// ─── Helper ───────────────────────────────────────────────────────────────────

function checkApiKey(res) {
  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(503).json({
      success: false,
      error: 'ANTHROPIC_API_KEY not configured',
    });
    return false;
  }
  return true;
}

// ─── STUDENT_EXPLANATION ──────────────────────────────────────────────────────

/**
 * POST /api/adaptive-learning/explain
 * Body: { question, student_answer, student_state, language }
 */
router.post('/explain', async (req, res) => {
  if (!checkApiKey(res)) return;
  const { question, student_answer, student_state, language } = req.body || {};
  if (!question) {
    return res.status(400).json({ success: false, error: 'question is required' });
  }
  try {
    const result = await getAgent().explainQuestion({
      question,
      studentAnswer: student_answer,
      studentState: student_state,
      language: language || 'EN',
    });
    res.json({ success: true, result });
  } catch (err) {
    console.error('[adaptive-learning] explain error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── STUDENT_SESSION_SUMMARY ──────────────────────────────────────────────────

/**
 * POST /api/adaptive-learning/session-summary
 * Body: { session_info, interactions, mastery_deltas, language }
 */
router.post('/session-summary', async (req, res) => {
  if (!checkApiKey(res)) return;
  const { session_info, interactions, mastery_deltas, language } = req.body || {};
  if (!interactions || !Array.isArray(interactions)) {
    return res.status(400).json({ success: false, error: 'interactions array is required' });
  }
  try {
    const result = await getAgent().summariseSession({
      sessionInfo: session_info,
      interactions,
      masteryDeltas: mastery_deltas,
      language: language || 'EN',
    });
    res.json({ success: true, result });
  } catch (err) {
    console.error('[adaptive-learning] session-summary error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── TEACHER_CLASS_SUMMARY ────────────────────────────────────────────────────

/**
 * POST /api/adaptive-learning/class-summary
 * Body: { class_info, objective_stats, examples_of_common_errors, language }
 */
router.post('/class-summary', async (req, res) => {
  if (!checkApiKey(res)) return;
  const { class_info, objective_stats, examples_of_common_errors, language } = req.body || {};
  if (!class_info || !objective_stats) {
    return res.status(400).json({ success: false, error: 'class_info and objective_stats are required' });
  }
  try {
    const result = await getAgent().summariseClass({
      classInfo: class_info,
      objectiveStats: objective_stats,
      examplesOfCommonErrors: examples_of_common_errors,
      language: language || 'EN',
    });
    res.json({ success: true, result });
  } catch (err) {
    console.error('[adaptive-learning] class-summary error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── QUESTION_AUTHORING ───────────────────────────────────────────────────────

/**
 * POST /api/adaptive-learning/author-question
 * Body: { raw_text_en, raw_text_zh, image_description, candidate_objectives, grade_band, topic, subtopic, language }
 */
router.post('/author-question', async (req, res) => {
  if (!checkApiKey(res)) return;
  const {
    raw_text_en, raw_text_zh, image_description,
    candidate_objectives, grade_band, topic, subtopic, language,
  } = req.body || {};
  if (!raw_text_en && !raw_text_zh) {
    return res.status(400).json({ success: false, error: 'raw_text_en or raw_text_zh is required' });
  }
  try {
    const result = await getAgent().authorQuestion({
      rawTextEn: raw_text_en,
      rawTextZh: raw_text_zh,
      imageDescription: image_description,
      candidateObjectives: candidate_objectives || [],
      gradeBand: grade_band || 'S1-S2',
      topic,
      subtopic,
      language: language || 'EN',
    });
    res.json({ success: true, result });
  } catch (err) {
    console.error('[adaptive-learning] author-question error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GAMIFICATION_MESSAGE ─────────────────────────────────────────────────────

/**
 * POST /api/adaptive-learning/gamification
 * Body: { recent_mastery_changes, recent_sessions, current_badges, language }
 */
router.post('/gamification', async (req, res) => {
  if (!checkApiKey(res)) return;
  const { recent_mastery_changes, recent_sessions, current_badges, language } = req.body || {};
  try {
    const result = await getAgent().generateGamification({
      recentMasteryChanges: recent_mastery_changes || [],
      recentSessions: recent_sessions || [],
      currentBadges: current_badges || [],
      language: language || 'EN',
    });
    res.json({ success: true, result });
  } catch (err) {
    console.error('[adaptive-learning] gamification error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── DEMO / PLAYGROUND ────────────────────────────────────────────────────────

/**
 * POST /api/adaptive-learning/demo
 * Body: { mode, language, payload }
 * Generic endpoint accepting any mode — useful for the demo UI.
 */
router.post('/demo', async (req, res) => {
  if (!checkApiKey(res)) return;
  const { mode, language, payload } = req.body || {};
  const validModes = [
    'STUDENT_EXPLANATION',
    'STUDENT_SESSION_SUMMARY',
    'TEACHER_CLASS_SUMMARY',
    'QUESTION_AUTHORING',
    'GAMIFICATION_MESSAGE',
    'ADMIN_SUMMARY',
  ];
  if (!mode || !validModes.includes(mode)) {
    return res.status(400).json({
      success: false,
      error: `mode is required and must be one of: ${validModes.join(', ')}`,
    });
  }
  try {
    const result = await getAgent().run(mode, language || 'EN', payload || {});
    res.json({ success: true, mode, language: language || 'EN', result });
  } catch (err) {
    console.error('[adaptive-learning] demo error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
