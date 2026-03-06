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

const express  = require('express');
const multer   = require('multer');
const router   = express.Router();
const { AdaptiveAgent }  = require('../agents/adaptive-agent');
const sessionService     = require('../services/session-service');
const ocrService         = require('../services/ocr-service');
const db                 = require('../db');
const sr                 = require('../services/spaced-repetition');
const { runEvolutionCycle } = require('../services/kb-evolution');

// Multer: memory storage for PDF uploads (max 20 MB)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

let agent;
function getAgent() {
  if (!agent) agent = new AdaptiveAgent();
  return agent;
}

// ─── Simple student-id helper (pilot: no full auth yet) ───────────────────────
// Pass X-Student-Id header or student_id in body for pilot usage.
function getStudentId(req) {
  return req.headers['x-student-id'] || req.body?.student_id || null;
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

// ─── Student Session Engine ───────────────────────────────────────────────────

/**
 * POST /api/adaptive-learning/student/sessions/start
 * Body: { student_id, target_objective_codes, language, mode }
 * Header: X-Student-Id (alternative to body.student_id)
 */
router.post('/student/sessions/start', async (req, res) => {
  const { target_objective_codes, language, mode } = req.body || {};
  const studentId = getStudentId(req);
  if (!studentId) return res.status(400).json({ success: false, error: 'student_id is required (body or X-Student-Id header)' });
  if (!Array.isArray(target_objective_codes) || target_objective_codes.length === 0) {
    return res.status(400).json({ success: false, error: 'target_objective_codes array is required' });
  }
  try {
    const result = await sessionService.startSession(studentId, target_objective_codes, language || 'EN', mode || 'adaptive');
    res.json({ success: true, session_id: result.session.id, initial_question: result.question });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/adaptive-learning/student/sessions/:id/answer
 * Body: { question_id, answer_payload, self_ratings, time_taken_seconds, hint_used, language }
 */
router.post('/student/sessions/:id/answer', async (req, res) => {
  const { question_id, answer_payload, self_ratings, time_taken_seconds, hint_used, language } = req.body || {};
  if (!question_id || !answer_payload) {
    return res.status(400).json({ success: false, error: 'question_id and answer_payload are required' });
  }
  try {
    const result = await sessionService.submitAnswer(
      req.params.id, question_id, answer_payload,
      self_ratings || {}, time_taken_seconds, hint_used || false, language || 'EN'
    );
    res.json({ success: true, ...result });
  } catch (err) {
    const status = err.message.includes('not found') ? 404 : 500;
    res.status(status).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/adaptive-learning/student/sessions/:id/end
 * Body: { language }
 */
router.post('/student/sessions/:id/end', async (req, res) => {
  const { language } = req.body || {};
  try {
    const result = await sessionService.endSession(req.params.id, language || 'EN');
    res.json({ success: true, ...result });
  } catch (err) {
    const status = err.message.includes('not found') ? 404 : 500;
    res.status(status).json({ success: false, error: err.message });
  }
});

// ─── Student concept overview ─────────────────────────────────────────────────

/**
 * GET /api/adaptive-learning/student/concepts/overview
 * Header: X-Student-Id  or  Query: student_id
 */
router.get('/student/concepts/overview', async (req, res) => {
  const studentId = req.headers['x-student-id'] || req.query.student_id;
  if (!studentId) return res.status(400).json({ success: false, error: 'student_id is required' });
  try {
    const mastery = await db.getStudentMasteryState(studentId);
    res.json({ success: true, student_id: studentId, objectives: mastery });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Teacher: paper upload ────────────────────────────────────────────────────

/**
 * POST /api/adaptive-learning/teachers/papers/upload
 * multipart/form-data: file (PDF), subject, grade_band, exam_name, year
 * Header: X-Teacher-Id
 */
router.post('/teachers/papers/upload', upload.single('file'), async (req, res) => {
  const teacherId = req.headers['x-teacher-id'] || req.body?.teacher_id;
  if (!req.file) return res.status(400).json({ success: false, error: 'PDF file is required' });
  if (req.file.mimetype !== 'application/pdf') return res.status(400).json({ success: false, error: 'Only PDF files are accepted' });

  try {
    // Store on Fly persistent volume if available, else keep in-memory reference
    const fileKey  = `papers/${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const fileUrl  = `/uploads/${fileKey}`; // will be served from Fly volume

    // Write to volume
    const fs   = require('fs');
    const path = require('path');
    const dir  = path.join('/app/uploads/papers');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join('/app/uploads', fileKey), req.file.buffer);

    const paper = await db.createPaper({
      teacherId: teacherId || null,
      subject:   req.body.subject   || 'MATH',
      gradeBand: req.body.grade_band || 'S1-S2',
      examName:  req.body.exam_name  || req.file.originalname,
      year:      req.body.year       || new Date().getFullYear(),
      fileUrl,
      fileKey,
    });

    // Fire OCR + QuestionAgent pipeline async (non-blocking)
    _runOcrPipeline(paper.id, req.file.buffer, req.body.grade_band || 'S1-S2').catch(err =>
      console.error(`OCR pipeline failed for paper ${paper.id}:`, err.message)
    );

    res.json({ success: true, paper_id: paper.id, status: 'UPLOADED', message: 'PDF uploaded. Draft questions will be ready shortly.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/adaptive-learning/teachers/papers/:id/draft-questions
 */
router.get('/teachers/papers/:id/draft-questions', async (req, res) => {
  try {
    const paper  = await db.getPaper(req.params.id);
    if (!paper) return res.status(404).json({ success: false, error: 'Paper not found' });
    const drafts = await db.getDraftQuestions(req.params.id);
    res.json({ success: true, paper_id: paper.id, status: paper.status, exam_name: paper.exam_name, draft_questions: drafts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Teacher: confirm questions ───────────────────────────────────────────────

/**
 * POST /api/adaptive-learning/teachers/questions/confirm
 * Body: { paper_id, questions: [{ draft_id, stem_en, stem_zh, answer, question_type, difficulty_estimate, objective_codes, explanation_en, explanation_zh, options }] }
 */
router.post('/teachers/questions/confirm', async (req, res) => {
  if (!requireApiKey(res)) return;
  const { paper_id, questions } = req.body || {};
  if (!Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ success: false, error: 'questions array is required' });
  }
  const { pool } = require('../../../db');
  const results = [];
  try {
    for (const q of questions) {
      // Upsert question
      const { rows: qRows } = await pool.query(
        `INSERT INTO questions (stem_en, stem_zh, answer, question_type, difficulty_estimate,
           option_a_en, option_b_en, option_c_en, option_d_en,
           explanation_en, explanation_zh, source_type, grade)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'PAST_PAPER',$12)
         RETURNING id`,
        [q.stem_en, q.stem_zh || null, q.answer, q.question_type || 'MCQ',
         q.difficulty_estimate || 2,
         q.options?.[0] || null, q.options?.[1] || null, q.options?.[2] || null, q.options?.[3] || null,
         q.explanation_en || null, q.explanation_zh || null, q.grade || null]
      );
      const questionId = qRows[0].id;

      // Map to objectives
      for (const code of (q.objective_codes || [])) {
        const lo = await db.getLearningObjectiveByCode(code);
        if (lo) {
          await pool.query(
            `INSERT INTO question_objective_map (question_id, objective_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
            [questionId, lo.id]
          );
        }
      }

      // Mark draft confirmed
      if (q.draft_id) {
        await pool.query(`UPDATE draft_questions SET status='CONFIRMED' WHERE id=$1`, [q.draft_id]);
      }

      results.push({ draft_id: q.draft_id || null, question_id: questionId });
    }

    if (paper_id) await db.updatePaperStatus(paper_id, 'CONFIRMED');

    res.json({ success: true, created_questions: results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Teacher dashboard ────────────────────────────────────────────────────────

/**
 * GET /api/adaptive-learning/teacher/classes/:className/mastery
 * Query: grade
 */
router.get('/teacher/classes/:className/mastery', async (req, res) => {
  if (!requireApiKey(res)) return;
  const { grade } = req.query;
  if (!grade) return res.status(400).json({ success: false, error: 'grade query param is required' });
  try {
    const mastery = await db.getClassMastery(req.params.className, grade);

    // Generate AI class summary
    let aiSummary = null;
    if (mastery.length > 0) {
      const objectiveStats = mastery.map(m => ({
        objective_code: m.objective_code,
        name_en: m.name_en, name_zh: m.name_zh,
        avg_mastery: parseFloat(m.avg_mastery),
        avg_interest: parseFloat(m.avg_interest),
        student_count: parseInt(m.student_count),
        distribution: { not_seen: m.not_seen, introduced: m.introduced, practicing: m.practicing, consolidating: m.consolidating, mastered: m.mastered },
      }));

      try {
        aiSummary = await getAgent().teacher.summariseClass({
          classInfo: { class_name: req.params.className, grade },
          objectiveStats,
          language: req.query.language || 'EN',
        });
      } catch (err) {
        console.warn('TeacherAgent CLASS_SUMMARY failed (non-fatal):', err.message);
      }
    }

    res.json({ success: true, class_name: req.params.className, grade, objectives: mastery, ai_summary: aiSummary });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── OCR pipeline (async) ─────────────────────────────────────────────────────

async function _runOcrPipeline(paperId, pdfBuffer, gradeBand) {
  await db.updatePaperStatus(paperId, 'OCR_RUNNING');

  let rawBlocks = [];
  if (await ocrService.isAvailable()) {
    rawBlocks = await ocrService.extractFromPdf(pdfBuffer);
  } else {
    console.warn(`Paper ${paperId}: Google Document AI not configured, skipping OCR`);
    await db.updatePaperStatus(paperId, 'NEEDS_REVIEW');
    return;
  }

  if (rawBlocks.length === 0) {
    await db.updatePaperStatus(paperId, 'NEEDS_REVIEW');
    return;
  }

  await db.updatePaperStatus(paperId, 'DRAFT_READY');

  // Get candidate LOs for this grade
  const los = await db.getLearningObjectives({ grade: gradeBand.split('-')[0] || 'S1' });
  const candidateObjectives = los.slice(0, 20).map(lo => ({ code: lo.code, name_en: lo.name_en, name_zh: lo.name_zh }));

  // Run QuestionAgent on each block
  for (const block of rawBlocks) {
    let draft = {
      paperId,
      rawOcrText:  block.raw_text,
      hasImage:    block.has_image,
      stemEn:      block.raw_text,
      suggestedDifficulty: 2,
      candidateObjectives,
    };

    if (process.env.ANTHROPIC_API_KEY && block.raw_text.length > 20) {
      try {
        const result = await getAgent().question.authorQuestion({
          rawTextEn:            block.raw_text,
          imageDescription:     block.has_image ? 'Question contains a diagram or figure' : null,
          candidateObjectives,
          gradeBand,
        });
        draft.stemEn               = result.clean_stem_en  || block.raw_text;
        draft.stemZh               = result.clean_stem_zh  || null;
        draft.suggestedType        = result.question_type  || 'MCQ';
        draft.suggestedDifficulty  = result.difficulty_estimate || 2;
        draft.candidateObjectives  = result.selected_objective_codes?.map(code =>
          candidateObjectives.find(lo => lo.code === code)
        ).filter(Boolean) || candidateObjectives;
      } catch (err) {
        console.warn(`QuestionAgent failed for block (non-fatal):`, err.message);
      }
    }

    await db.createDraftQuestion(draft);
  }
}

// ─── Additional routes appended below ──────────────────────────────────────
// ─── Explanation feedback ─────────────────────────────────────────────────────

/**
 * POST /api/adaptive-learning/student/feedback/explanation
 * Body: { interaction_id, question_id, rating (1|-1), comment }
 */
router.post('/student/feedback/explanation', async (req, res) => {
  const { interaction_id, question_id, rating, comment } = req.body || {};
  const studentId = getStudentId(req);
  if (!studentId || !question_id || !rating) {
    return res.status(400).json({ success: false, error: 'student_id, question_id, and rating are required' });
  }
  try {
    await db.recordExplanationFeedback({ interactionId: interaction_id, studentId, questionId: question_id, rating, comment });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Personalised session config ──────────────────────────────────────────────

/**
 * GET /api/adaptive-learning/student/config
 * Returns: suggested_duration_mins, target_difficulty, review_objectives
 */
router.get('/student/config', async (req, res) => {
  const studentId = req.headers['x-student-id'] || req.query.student_id;
  if (!studentId) return res.status(400).json({ success: false, error: 'student_id is required' });
  try {
    const config = await sr.getPersonalisedConfig(studentId);
    res.json({ success: true, student_id: studentId, ...config });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Teacher: generated question review ───────────────────────────────────────

/**
 * GET /api/adaptive-learning/teachers/questions/pending
 * Lists AI-generated questions awaiting teacher approval.
 */
router.get('/teachers/questions/pending', async (req, res) => {
  try {
    const questions = await db.getPendingGeneratedQuestions(parseInt(req.query.limit) || 20);
    res.json({ success: true, count: questions.length, questions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/adaptive-learning/teachers/questions/:id/activate
 * Approve a system-generated question for student use.
 */
router.post('/teachers/questions/:id/activate', async (req, res) => {
  try {
    await db.activateQuestion(req.params.id);
    res.json({ success: true, question_id: req.params.id, status: 'active' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── KB evolution ─────────────────────────────────────────────────────────────

/**
 * GET /api/adaptive-learning/admin/evolution/log
 * Returns recent KB evolution actions.
 */
router.get('/admin/evolution/log', async (req, res) => {
  try {
    const log = await db.getEvolutionLog(parseInt(req.query.limit) || 50);
    res.json({ success: true, count: log.length, log });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/adaptive-learning/admin/evolution/run
 * Manually trigger a KB evolution cycle (useful for testing).
 */
router.post('/admin/evolution/run', async (req, res) => {
  try {
    const summary = await runEvolutionCycle('manual_trigger');
    res.json({ success: true, summary });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

// ─── Pilot auth (no passwords — name-based identity for school pilot) ─────────

/**
 * POST /api/adaptive-learning/student/auth
 * Body: { name, class_name, grade, language }
 * Returns: { success, student_id }
 */
router.post('/student/auth', async (req, res) => {
  const { name, class_name, grade, language } = req.body || {};
  if (!name) return res.status(400).json({ success: false, error: 'name is required' });
  try {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(name + (class_name || ''), 8); // lightweight hash as placeholder
    const student = await db.createUser({
      name, email: `${name.toLowerCase().replace(/\s+/g,'-')}-${class_name || 'x'}@pilot.local`,
      passwordHash: hash, role: 'student', grade, className: class_name,
      preferredLanguage: language || 'ZH',
    });
    if (!student) {
      // User exists — fetch by name+class
      const { pool } = require('../../../db');
      const { rows } = await pool.query(
        `SELECT id FROM users WHERE name=$1 AND class_name=$2 AND role='student' LIMIT 1`,
        [name, class_name || null]
      );
      if (rows.length === 0) return res.status(404).json({ success: false, error: 'User not found' });
      return res.json({ success: true, student_id: rows[0].id });
    }
    res.json({ success: true, student_id: student.id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/adaptive-learning/teacher/auth
 * Body: { name }
 * Returns: { success, teacher_id }
 */
router.post('/teacher/auth', async (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ success: false, error: 'name is required' });
  try {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(name + '-teacher', 8);
    const teacher = await db.createUser({
      name, email: `${name.toLowerCase().replace(/\s+/g,'-')}-teacher@pilot.local`,
      passwordHash: hash, role: 'teacher',
    });
    if (!teacher) {
      const { pool } = require('../../../db');
      const { rows } = await pool.query(
        `SELECT id FROM users WHERE name=$1 AND role='teacher' LIMIT 1`, [name]
      );
      if (rows.length === 0) return res.status(404).json({ success: false, error: 'User not found' });
      return res.json({ success: true, teacher_id: rows[0].id });
    }
    res.json({ success: true, teacher_id: teacher.id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
