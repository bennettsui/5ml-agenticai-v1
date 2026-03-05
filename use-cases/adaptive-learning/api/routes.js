/**
 * API Routes — S1-S2 Adaptive Math Learning Platform
 *
 * Specialist endpoints (preferred):
 *   POST /api/adaptive-learning/explain           — StudentAgent: EXPLAIN_ONE_QUESTION
 *   POST /api/adaptive-learning/session-summary   — StudentAgent: SESSION_SUMMARY
 *   POST /api/adaptive-learning/class-summary     — TeacherAgent: CLASS_SUMMARY
 *   POST /api/adaptive-learning/student-profile   — TeacherAgent: STUDENT_PROFILE
 *   POST /api/adaptive-learning/author-question   — QuestionAgent: QUESTION_AUTHORING
 *   POST /api/adaptive-learning/gamification      — Inline: GAMIFICATION_MESSAGE
 *
 * Generic demo endpoint (all modes):
 *   POST /api/adaptive-learning/demo              — any mode via orchestrator
 *
 * Utility:
 *   GET  /api/adaptive-learning/curriculum        — HK S1-S2 curriculum map JSON
 *   GET  /api/adaptive-learning/health            — health check
 *
 * Supported modes for /demo:
 *   EXPLAIN_ONE_QUESTION | SESSION_SUMMARY
 *   CLASS_SUMMARY | STUDENT_PROFILE
 *   QUESTION_AUTHORING
 *   GAMIFICATION_MESSAGE | ADMIN_SUMMARY
 *   (Legacy aliases: STUDENT_EXPLANATION, STUDENT_SESSION_SUMMARY, TEACHER_CLASS_SUMMARY)
 */

const express = require('express');
const router = express.Router();

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
    agents: ['StudentAgent', 'TeacherAgent', 'QuestionAgent'],
    modes: [
      'EXPLAIN_ONE_QUESTION', 'SESSION_SUMMARY',
      'CLASS_SUMMARY', 'STUDENT_PROFILE',
      'QUESTION_AUTHORING',
      'GAMIFICATION_MESSAGE', 'ADMIN_SUMMARY',
    ],
  });
});

// ─── Curriculum map ───────────────────────────────────────────────────────────

router.get('/curriculum', (req, res) => {
  try {
    const curriculum = require('../kb/hk-math-curriculum.json');
    res.json({ success: true, curriculum });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to load curriculum map' });
  }
});

// ─── Helper ───────────────────────────────────────────────────────────────────

function requireApiKey(res) {
  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(503).json({ success: false, error: 'ANTHROPIC_API_KEY not configured' });
    return false;
  }
  return true;
}

// ─── StudentAgent: EXPLAIN_ONE_QUESTION ───────────────────────────────────────

/**
 * POST /api/adaptive-learning/explain
 * Body: { question, student_answer, student_state_for_objectives, language }
 */
router.post('/explain', async (req, res) => {
  if (!requireApiKey(res)) return;
  const { question, student_answer, student_state_for_objectives, language } = req.body || {};
  if (!question) return res.status(400).json({ success: false, error: 'question is required' });
  try {
    const result = await getAgent().student.explainQuestion({
      question,
      studentAnswer: student_answer,
      studentStateForObjectives: student_state_for_objectives,
      language: language || 'EN',
    });
    res.json({ success: true, mode: 'EXPLAIN_ONE_QUESTION', result });
  } catch (err) {
    console.error('[adaptive-learning] explain error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── StudentAgent: SESSION_SUMMARY ────────────────────────────────────────────

/**
 * POST /api/adaptive-learning/session-summary
 * Body: { session_info, interactions, mastery_deltas, language }
 */
router.post('/session-summary', async (req, res) => {
  if (!requireApiKey(res)) return;
  const { session_info, interactions, mastery_deltas, language } = req.body || {};
  if (!Array.isArray(interactions)) {
    return res.status(400).json({ success: false, error: 'interactions array is required' });
  }
  try {
    const result = await getAgent().student.summariseSession({
      sessionInfo: session_info,
      interactions,
      masteryDeltas: mastery_deltas,
      language: language || 'EN',
    });
    res.json({ success: true, mode: 'SESSION_SUMMARY', result });
  } catch (err) {
    console.error('[adaptive-learning] session-summary error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── TeacherAgent: CLASS_SUMMARY ──────────────────────────────────────────────

/**
 * POST /api/adaptive-learning/class-summary
 * Body: { class_info, objective_stats, example_items, language }
 */
router.post('/class-summary', async (req, res) => {
  if (!requireApiKey(res)) return;
  const { class_info, objective_stats, example_items, language } = req.body || {};
  if (!class_info || !objective_stats) {
    return res.status(400).json({ success: false, error: 'class_info and objective_stats are required' });
  }
  try {
    const result = await getAgent().teacher.summariseClass({
      classInfo: class_info,
      objectiveStats: objective_stats,
      exampleItems: example_items,
      language: language || 'EN',
    });
    res.json({ success: true, mode: 'CLASS_SUMMARY', result });
  } catch (err) {
    console.error('[adaptive-learning] class-summary error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── TeacherAgent: STUDENT_PROFILE ───────────────────────────────────────────

/**
 * POST /api/adaptive-learning/student-profile
 * Body: { student_info, objective_states, recent_sessions, language }
 */
router.post('/student-profile', async (req, res) => {
  if (!requireApiKey(res)) return;
  const { student_info, objective_states, recent_sessions, language } = req.body || {};
  if (!student_info) {
    return res.status(400).json({ success: false, error: 'student_info is required' });
  }
  try {
    const result = await getAgent().teacher.profileStudent({
      studentInfo: student_info,
      objectiveStates: objective_states || [],
      recentSessions: recent_sessions || [],
      language: language || 'EN',
    });
    res.json({ success: true, mode: 'STUDENT_PROFILE', result });
  } catch (err) {
    console.error('[adaptive-learning] student-profile error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── QuestionAgent: QUESTION_AUTHORING ───────────────────────────────────────

/**
 * POST /api/adaptive-learning/author-question
 * Body: { raw_text_en, raw_text_zh, image_description, candidate_objectives, grade_band, topic, subtopic, language }
 */
router.post('/author-question', async (req, res) => {
  if (!requireApiKey(res)) return;
  const { raw_text_en, raw_text_zh, image_description, candidate_objectives, grade_band, topic, subtopic, language } = req.body || {};
  if (!raw_text_en && !raw_text_zh) {
    return res.status(400).json({ success: false, error: 'raw_text_en or raw_text_zh is required' });
  }
  try {
    const result = await getAgent().question.authorQuestion({
      rawTextEn: raw_text_en,
      rawTextZh: raw_text_zh,
      imageDescription: image_description,
      candidateObjectives: candidate_objectives || [],
      gradeBand: grade_band || 'S1-S2',
      topic,
      subtopic,
      language: language || 'EN',
    });
    res.json({ success: true, mode: 'QUESTION_AUTHORING', result });
  } catch (err) {
    console.error('[adaptive-learning] author-question error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Inline: GAMIFICATION_MESSAGE ────────────────────────────────────────────

/**
 * POST /api/adaptive-learning/gamification
 * Body: { recent_mastery_changes, recent_sessions, current_badges, language }
 */
router.post('/gamification', async (req, res) => {
  if (!requireApiKey(res)) return;
  const { recent_mastery_changes, recent_sessions, current_badges, language } = req.body || {};
  try {
    const result = await getAgent().generateGamification({
      recentMasteryChanges: recent_mastery_changes || [],
      recentSessions: recent_sessions || [],
      currentBadges: current_badges || [],
      language: language || 'EN',
    });
    res.json({ success: true, mode: 'GAMIFICATION_MESSAGE', result });
  } catch (err) {
    console.error('[adaptive-learning] gamification error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Generic demo/playground (any mode) ──────────────────────────────────────

/**
 * POST /api/adaptive-learning/demo
 * Body: { mode, language, payload }
 *
 * Accepts all canonical modes and legacy aliases.
 */
const ALL_MODES = [
  // Specialist
  'EXPLAIN_ONE_QUESTION', 'SESSION_SUMMARY',
  'CLASS_SUMMARY', 'STUDENT_PROFILE',
  'QUESTION_AUTHORING',
  'GAMIFICATION_MESSAGE', 'ADMIN_SUMMARY',
  // Legacy aliases
  'STUDENT_EXPLANATION', 'STUDENT_SESSION_SUMMARY', 'TEACHER_CLASS_SUMMARY',
];

router.post('/demo', async (req, res) => {
  if (!requireApiKey(res)) return;
  const { mode, language, payload } = req.body || {};
  if (!mode || !ALL_MODES.includes(mode)) {
    return res.status(400).json({
      success: false,
      error: `mode is required and must be one of: ${ALL_MODES.join(', ')}`,
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
