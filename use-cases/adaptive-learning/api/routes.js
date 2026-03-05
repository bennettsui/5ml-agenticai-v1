/**
 * API Routes — S1-S2 Adaptive Math Learning Platform
 *
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  Specialist endpoints                                               ║
 * ╠══════════════════════╦══════════════════════════════════════════════╣
 * ║ StudentAgent         ║ POST /explain                               ║
 * ║                      ║ POST /session-summary                       ║
 * ╠══════════════════════╬══════════════════════════════════════════════╣
 * ║ TeacherAgent         ║ POST /class-summary                         ║
 * ║                      ║ POST /student-profile                       ║
 * ╠══════════════════════╬══════════════════════════════════════════════╣
 * ║ QuestionAgent        ║ POST /author-question                       ║
 * ╠══════════════════════╬══════════════════════════════════════════════╣
 * ║ StudentUxAgent       ║ POST /student-ux                            ║
 * ╠══════════════════════╬══════════════════════════════════════════════╣
 * ║ TeacherGuideAgent    ║ POST /teacher-guide                         ║
 * ╠══════════════════════╬══════════════════════════════════════════════╣
 * ║ TechArchAgent        ║ POST /tech-arch                             ║
 * ╠══════════════════════╬══════════════════════════════════════════════╣
 * ║ Generic demo         ║ POST /demo  (any mode via orchestrator)     ║
 * ╚══════════════════════╩══════════════════════════════════════════════╝
 *
 * Utility:
 *   GET  /api/adaptive-learning/curriculum   — HK S1-S2 curriculum JSON
 *   GET  /api/adaptive-learning/health       — health + mode list
 */

const express = require('express');
const router = express.Router();
const { AdaptiveAgent } = require('../agents/adaptive-agent');

let agent;
function getAgent() {
  if (!agent) agent = new AdaptiveAgent();
  return agent;
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function requireApiKey(res) {
  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(503).json({ success: false, error: 'ANTHROPIC_API_KEY not configured' });
    return false;
  }
  return true;
}

// ─── Health ───────────────────────────────────────────────────────────────────

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'adaptive-learning',
    model: 'claude-haiku-4-5-20251001',
    hasApiKey: !!process.env.ANTHROPIC_API_KEY,
    agents: [
      'StudentAgent', 'TeacherAgent', 'QuestionAgent',
      'StudentUxAgent', 'TeacherGuideAgent', 'TechArchAgent',
      'GamificationAgent', 'AdminReportAgent',
    ],
    modes: {
      StudentAgent:       ['EXPLAIN_ONE_QUESTION', 'SESSION_SUMMARY'],
      TeacherAgent:       ['CLASS_SUMMARY', 'STUDENT_PROFILE'],
      QuestionAgent:      ['QUESTION_AUTHORING'],
      StudentUxAgent:     ['WELCOME', 'SESSION_INTRO', 'QUESTION_FEEDBACK', 'SESSION_SUMMARY_STUDENT', 'GAMIFICATION_EVENT'],
      TeacherGuideAgent:  ['INTRO_PAGE', 'STEP_BY_STEP_FEATURE', 'FAQ'],
      TechArchAgent:      ['HIGH_LEVEL_ARCH', 'SEQUENCE_STUDENT_SESSION', 'SEQUENCE_TEACHER_UPLOAD', 'SEQUENCE_TEACHER_DASHBOARD'],
      GamificationAgent:  ['BADGE_MESSAGE', 'SUGGEST_MISSIONS', 'PROGRESS_NUDGE'],
      AdminReportAgent:   ['TERM_REPORT', 'GRADE_REPORT', 'CLASS_REPORT'],
    },
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

// ─── StudentAgent ─────────────────────────────────────────────────────────────

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
      question, studentAnswer: student_answer,
      studentStateForObjectives: student_state_for_objectives,
      language: language || 'EN',
    });
    res.json({ success: true, mode: 'EXPLAIN_ONE_QUESTION', result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/adaptive-learning/session-summary
 * Body: { session_info, interactions, mastery_deltas, language }
 */
router.post('/session-summary', async (req, res) => {
  if (!requireApiKey(res)) return;
  const { session_info, interactions, mastery_deltas, language } = req.body || {};
  if (!Array.isArray(interactions)) return res.status(400).json({ success: false, error: 'interactions array is required' });
  try {
    const result = await getAgent().student.summariseSession({
      sessionInfo: session_info, interactions, masteryDeltas: mastery_deltas,
      language: language || 'EN',
    });
    res.json({ success: true, mode: 'SESSION_SUMMARY', result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── TeacherAgent ─────────────────────────────────────────────────────────────

/**
 * POST /api/adaptive-learning/class-summary
 * Body: { class_info, objective_stats, example_items, language }
 */
router.post('/class-summary', async (req, res) => {
  if (!requireApiKey(res)) return;
  const { class_info, objective_stats, example_items, language } = req.body || {};
  if (!class_info || !objective_stats) return res.status(400).json({ success: false, error: 'class_info and objective_stats are required' });
  try {
    const result = await getAgent().teacher.summariseClass({
      classInfo: class_info, objectiveStats: objective_stats,
      exampleItems: example_items, language: language || 'EN',
    });
    res.json({ success: true, mode: 'CLASS_SUMMARY', result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/adaptive-learning/student-profile
 * Body: { student_info, objective_states, recent_sessions, language }
 */
router.post('/student-profile', async (req, res) => {
  if (!requireApiKey(res)) return;
  const { student_info, objective_states, recent_sessions, language } = req.body || {};
  if (!student_info) return res.status(400).json({ success: false, error: 'student_info is required' });
  try {
    const result = await getAgent().teacher.profileStudent({
      studentInfo: student_info,
      objectiveStates: objective_states || [],
      recentSessions: recent_sessions || [],
      language: language || 'EN',
    });
    res.json({ success: true, mode: 'STUDENT_PROFILE', result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── QuestionAgent ────────────────────────────────────────────────────────────

/**
 * POST /api/adaptive-learning/author-question
 * Body: { raw_text_en, raw_text_zh, image_description, candidate_objectives, grade_band, topic, subtopic, language }
 */
router.post('/author-question', async (req, res) => {
  if (!requireApiKey(res)) return;
  const { raw_text_en, raw_text_zh, image_description, candidate_objectives, grade_band, topic, subtopic, language } = req.body || {};
  if (!raw_text_en && !raw_text_zh) return res.status(400).json({ success: false, error: 'raw_text_en or raw_text_zh is required' });
  try {
    const result = await getAgent().question.authorQuestion({
      rawTextEn: raw_text_en, rawTextZh: raw_text_zh,
      imageDescription: image_description,
      candidateObjectives: candidate_objectives || [],
      gradeBand: grade_band || 'S1-S2', topic, subtopic,
      language: language || 'EN',
    });
    res.json({ success: true, mode: 'QUESTION_AUTHORING', result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── StudentUxAgent ───────────────────────────────────────────────────────────

/**
 * POST /api/adaptive-learning/student-ux
 * Body: { mode, language, payload }
 * mode: WELCOME | SESSION_INTRO | QUESTION_FEEDBACK | SESSION_SUMMARY_STUDENT | GAMIFICATION_EVENT
 */
const STUDENT_UX_MODES = ['WELCOME', 'SESSION_INTRO', 'QUESTION_FEEDBACK', 'SESSION_SUMMARY_STUDENT', 'GAMIFICATION_EVENT'];

router.post('/student-ux', async (req, res) => {
  if (!requireApiKey(res)) return;
  const { mode, language, payload } = req.body || {};
  if (!mode || !STUDENT_UX_MODES.includes(mode)) {
    return res.status(400).json({ success: false, error: `mode must be one of: ${STUDENT_UX_MODES.join(', ')}` });
  }
  try {
    const result = await getAgent().studentUx.run(mode, language || 'EN', payload || {});
    res.json({ success: true, mode, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── TeacherGuideAgent ────────────────────────────────────────────────────────

/**
 * POST /api/adaptive-learning/teacher-guide
 * Body: { mode, language, payload }
 * mode: INTRO_PAGE | STEP_BY_STEP_FEATURE | FAQ
 */
const TEACHER_GUIDE_MODES = ['INTRO_PAGE', 'STEP_BY_STEP_FEATURE', 'FAQ'];

router.post('/teacher-guide', async (req, res) => {
  if (!requireApiKey(res)) return;
  const { mode, language, payload } = req.body || {};
  if (!mode || !TEACHER_GUIDE_MODES.includes(mode)) {
    return res.status(400).json({ success: false, error: `mode must be one of: ${TEACHER_GUIDE_MODES.join(', ')}` });
  }
  try {
    const result = await getAgent().teacherGuide.run(mode, language || 'EN', payload || {});
    res.json({ success: true, mode, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── TechArchAgent ────────────────────────────────────────────────────────────

/**
 * POST /api/adaptive-learning/tech-arch
 * Body: { mode, payload }
 * mode: HIGH_LEVEL_ARCH | SEQUENCE_STUDENT_SESSION | SEQUENCE_TEACHER_UPLOAD | SEQUENCE_TEACHER_DASHBOARD
 */
const TECH_ARCH_MODES = ['HIGH_LEVEL_ARCH', 'SEQUENCE_STUDENT_SESSION', 'SEQUENCE_TEACHER_UPLOAD', 'SEQUENCE_TEACHER_DASHBOARD'];

router.post('/tech-arch', async (req, res) => {
  if (!requireApiKey(res)) return;
  const { mode, payload } = req.body || {};
  if (!mode || !TECH_ARCH_MODES.includes(mode)) {
    return res.status(400).json({ success: false, error: `mode must be one of: ${TECH_ARCH_MODES.join(', ')}` });
  }
  try {
    const result = await getAgent().techArch.run(mode, payload || {});
    res.json({ success: true, mode, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GamificationAgent ───────────────────────────────────────────────────────

/**
 * POST /api/adaptive-learning/gamification
 * Body: { mode, language, payload }
 * mode: BADGE_MESSAGE | SUGGEST_MISSIONS | PROGRESS_NUDGE
 */
const GAMIFICATION_MODES = ['BADGE_MESSAGE', 'SUGGEST_MISSIONS', 'PROGRESS_NUDGE'];

router.post('/gamification', async (req, res) => {
  if (!requireApiKey(res)) return;
  const { mode, language, payload } = req.body || {};
  if (!mode || !GAMIFICATION_MODES.includes(mode)) {
    return res.status(400).json({ success: false, error: `mode must be one of: ${GAMIFICATION_MODES.join(', ')}` });
  }
  try {
    const result = await getAgent().gamification.run(mode, language || 'EN', payload || {});
    res.json({ success: true, mode, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── AdminReportAgent ─────────────────────────────────────────────────────────

/**
 * POST /api/adaptive-learning/admin-report
 * Body: { mode, language, payload }
 * mode: TERM_REPORT | GRADE_REPORT | CLASS_REPORT
 */
const ADMIN_REPORT_MODES = ['TERM_REPORT', 'GRADE_REPORT', 'CLASS_REPORT'];

router.post('/admin-report', async (req, res) => {
  if (!requireApiKey(res)) return;
  const { mode, language, payload } = req.body || {};
  if (!mode || !ADMIN_REPORT_MODES.includes(mode)) {
    return res.status(400).json({ success: false, error: `mode must be one of: ${ADMIN_REPORT_MODES.join(', ')}` });
  }
  try {
    const result = await getAgent().adminReport.run(mode, language || 'ZH', payload || {});
    res.json({ success: true, mode, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Generic demo/playground (any mode) ──────────────────────────────────────

/**
 * POST /api/adaptive-learning/demo
 * Body: { mode, language, payload }
 * Accepts all canonical modes and legacy aliases.
 */
const ALL_MODES = [
  'EXPLAIN_ONE_QUESTION', 'SESSION_SUMMARY',
  'CLASS_SUMMARY', 'STUDENT_PROFILE',
  'QUESTION_AUTHORING',
  'WELCOME', 'SESSION_INTRO', 'QUESTION_FEEDBACK', 'SESSION_SUMMARY_STUDENT', 'GAMIFICATION_EVENT',
  'INTRO_PAGE', 'STEP_BY_STEP_FEATURE', 'FAQ',
  'HIGH_LEVEL_ARCH', 'SEQUENCE_STUDENT_SESSION', 'SEQUENCE_TEACHER_UPLOAD', 'SEQUENCE_TEACHER_DASHBOARD',
  'BADGE_MESSAGE', 'SUGGEST_MISSIONS', 'PROGRESS_NUDGE',
  'TERM_REPORT', 'GRADE_REPORT', 'CLASS_REPORT',
  'ADMIN_SUMMARY',
  // Legacy aliases
  'STUDENT_EXPLANATION', 'STUDENT_SESSION_SUMMARY', 'TEACHER_CLASS_SUMMARY', 'GAMIFICATION_MESSAGE',
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
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
