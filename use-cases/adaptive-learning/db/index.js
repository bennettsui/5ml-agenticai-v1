/**
 * Adaptive Learning — Database layer
 *
 * Uses the shared Fly Postgres pool from /db.js.
 * initAdaptiveLearningDb() is called once on server startup.
 */

const fs   = require('fs');
const path = require('path');
const { pool } = require('../../../db');

// ─── Schema init ──────────────────────────────────────────────────────────────

async function initAdaptiveLearningDb() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  try {
    await pool.query(sql);
    console.log('✅ Adaptive Learning schema ready');
    await seedLearningObjectives();
  } catch (err) {
    console.error('❌ Adaptive Learning schema init failed:', err.message);
  }
}

// ─── Seed LOs from curriculum JSON ───────────────────────────────────────────

async function seedLearningObjectives() {
  const curriculum = require('../kb/hk-math-curriculum.json');
  let seeded = 0;
  for (const strand of curriculum.strands || []) {
    for (const obj of strand.objectives || []) {
      await pool.query(
        `INSERT INTO learning_objectives (code, grade, topic, subtopic, name_en, name_zh, description_en, description_zh)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (code) DO NOTHING`,
        [obj.code, obj.grade, obj.topic, obj.subtopic, obj.name_en, obj.name_zh,
         obj.description_en || null, obj.description_zh || null]
      );
      seeded++;
    }
  }
  console.log(`✅ Seeded ${seeded} learning objectives`);
  await seedSampleQuestions();
}

// ─── Seed sample questions ────────────────────────────────────────────────────

async function seedSampleQuestions() {
  let filePath;
  try {
    filePath = path.join(__dirname, 'sample-questions.json');
    if (!fs.existsSync(filePath)) return;
  } catch { return; }

  const questions = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let inserted = 0;
  for (const q of questions) {
    // Find the objective
    const { rows: objRows } = await pool.query(
      'SELECT id FROM learning_objectives WHERE code = $1', [q.objective_code]
    );
    if (!objRows.length) continue;
    const objectiveId = objRows[0].id;

    // Insert question (skip if identical stem_en already exists for this objective)
    const { rows: existing } = await pool.query(
      `SELECT q.id FROM questions q
       JOIN question_objective_map qom ON qom.question_id = q.id
       WHERE q.stem_en = $1 AND qom.objective_id = $2 LIMIT 1`,
      [q.stem_en, objectiveId]
    );
    if (existing.length) continue;

    const { rows: qRows } = await pool.query(
      `INSERT INTO questions
         (stem_en, stem_zh, option_a_en, option_b_en, option_c_en, option_d_en,
          option_a_zh, option_b_zh, option_c_zh, option_d_zh,
          answer, explanation_en, explanation_zh,
          question_type, difficulty_estimate, source_type, grade, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::question_type,$15,'TEACHER_CREATED',$16,TRUE)
       RETURNING id`,
      [
        q.stem_en, q.stem_zh || null,
        q.option_a_en || null, q.option_b_en || null, q.option_c_en || null, q.option_d_en || null,
        q.option_a_zh || null, q.option_b_zh || null, q.option_c_zh || null, q.option_d_zh || null,
        q.answer,
        q.explanation_en || null, q.explanation_zh || null,
        q.question_type || 'MCQ',
        q.difficulty_estimate || 2,
        q.grade || 'S1',
      ]
    );
    const questionId = qRows[0].id;

    await pool.query(
      `INSERT INTO question_objective_map (question_id, objective_id, is_primary)
       VALUES ($1,$2,TRUE) ON CONFLICT DO NOTHING`,
      [questionId, objectiveId]
    );
    inserted++;
  }
  console.log(`✅ Seeded ${inserted} sample questions`);
}

// ─── Learning Objectives ──────────────────────────────────────────────────────

async function getLearningObjectives({ grade, topic } = {}) {
  let q = 'SELECT * FROM learning_objectives WHERE 1=1';
  const params = [];
  if (grade) { params.push(grade); q += ` AND grade = $${params.length}`; }
  if (topic) { params.push(topic); q += ` AND topic ILIKE $${params.length}`; }
  q += ' ORDER BY display_order, code';
  const { rows } = await pool.query(q, params);
  return rows;
}

async function getLearningObjectiveByCode(code) {
  const { rows } = await pool.query(
    'SELECT * FROM learning_objectives WHERE code = $1', [code]
  );
  return rows[0] || null;
}

// ─── Questions ────────────────────────────────────────────────────────────────

async function getQuestion(id) {
  const { rows } = await pool.query(
    `SELECT q.*, array_agg(json_build_object(
       'id', lo.id, 'code', lo.code, 'name_en', lo.name_en, 'name_zh', lo.name_zh
     )) AS objectives
     FROM questions q
     LEFT JOIN question_objective_map qom ON qom.question_id = q.id
     LEFT JOIN learning_objectives lo ON lo.id = qom.objective_id
     WHERE q.id = $1
     GROUP BY q.id`, [id]
  );
  return rows[0] || null;
}

async function getQuestionsForObjective(objectiveCode, { excludeIds = [], limit = 5 } = {}) {
  const { rows } = await pool.query(
    `SELECT q.* FROM questions q
     JOIN question_objective_map qom ON qom.question_id = q.id
     JOIN learning_objectives lo ON lo.id = qom.objective_id
     WHERE lo.code = $1 AND q.is_active = TRUE
       AND q.id != ALL($2::uuid[])
     ORDER BY RANDOM()
     LIMIT $3`,
    [objectiveCode, excludeIds.length ? excludeIds : ['00000000-0000-0000-0000-000000000000'], limit]
  );
  return rows;
}

// ─── Users ────────────────────────────────────────────────────────────────────

async function getUserById(id) {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] || null;
}

async function getUserByEmail(email) {
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0] || null;
}

async function createUser({ name, email, passwordHash, role = 'student', grade, className, preferredLanguage = 'ZH' }) {
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, grade, class_name, preferred_language)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (email) DO NOTHING
     RETURNING *`,
    [name, email, passwordHash, role, grade || null, className || null, preferredLanguage]
  );
  return rows[0] || null;
}

// ─── Mastery State ────────────────────────────────────────────────────────────

async function getStudentMasteryState(studentId) {
  const { rows } = await pool.query(
    `SELECT ms.*, lo.code, lo.name_en, lo.name_zh, lo.topic, lo.subtopic, lo.grade
     FROM mastery_states ms
     JOIN learning_objectives lo ON lo.id = ms.objective_id
     WHERE ms.student_id = $1
     ORDER BY ms.mastery_level ASC, ms.last_practiced_at DESC NULLS LAST`,
    [studentId]
  );
  return rows;
}

async function getMasteryForObjective(studentId, objectiveId) {
  const { rows } = await pool.query(
    'SELECT * FROM mastery_states WHERE student_id = $1 AND objective_id = $2',
    [studentId, objectiveId]
  );
  return rows[0] || null;
}

async function upsertMasteryState(studentId, objectiveId, { masteryLevel, interestLevel, evidenceCount, lastPracticedAt }) {
  const { rows } = await pool.query(
    `INSERT INTO mastery_states (student_id, objective_id, mastery_level, interest_level, evidence_count, last_practiced_at)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (student_id, objective_id) DO UPDATE SET
       mastery_level     = EXCLUDED.mastery_level,
       interest_level    = EXCLUDED.interest_level,
       evidence_count    = mastery_states.evidence_count + 1,
       last_practiced_at = EXCLUDED.last_practiced_at,
       updated_at        = NOW()
     RETURNING *`,
    [studentId, objectiveId, masteryLevel, interestLevel, evidenceCount || 1, lastPracticedAt || new Date()]
  );
  return rows[0];
}

// Ensure mastery_state row exists for a student/objective (used before first attempt)
async function ensureMasteryState(studentId, objectiveId) {
  await pool.query(
    `INSERT INTO mastery_states (student_id, objective_id)
     VALUES ($1,$2)
     ON CONFLICT DO NOTHING`,
    [studentId, objectiveId]
  );
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

async function createSession(studentId, mode = 'adaptive') {
  const { rows } = await pool.query(
    `INSERT INTO sessions (student_id, mode) VALUES ($1,$2) RETURNING *`,
    [studentId, mode]
  );
  return rows[0];
}

async function getSession(sessionId) {
  const { rows } = await pool.query('SELECT * FROM sessions WHERE id = $1', [sessionId]);
  return rows[0] || null;
}

async function updateSession(sessionId, updates) {
  const fields = [];
  const vals   = [];
  let i = 1;
  for (const [k, v] of Object.entries(updates)) {
    fields.push(`${k} = $${i++}`);
    vals.push(v);
  }
  vals.push(sessionId);
  const { rows } = await pool.query(
    `UPDATE sessions SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`, vals
  );
  return rows[0];
}

// ─── Interactions ─────────────────────────────────────────────────────────────

async function createInteraction({
  sessionId, studentId, questionId, objectiveId,
  studentAnswer, isCorrect, timeTakenSecs, hintUsed,
  selfUnderstanding, selfInterest, aiExplanation,
}) {
  const { rows } = await pool.query(
    `INSERT INTO interactions
       (session_id, student_id, question_id, objective_id, student_answer,
        is_correct, time_taken_secs, hint_used, self_understanding, self_interest, ai_explanation)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING *`,
    [sessionId, studentId, questionId, objectiveId || null, studentAnswer,
     isCorrect, timeTakenSecs || null, hintUsed || false,
     selfUnderstanding || null, selfInterest || null,
     aiExplanation ? JSON.stringify(aiExplanation) : null]
  );
  return rows[0];
}

async function getSessionInteractions(sessionId) {
  const { rows } = await pool.query(
    `SELECT i.*, q.stem_en, q.stem_zh, q.answer AS correct_answer,
            lo.code AS objective_code, lo.name_en AS objective_name_en, lo.name_zh AS objective_name_zh
     FROM interactions i
     JOIN questions q ON q.id = i.question_id
     LEFT JOIN learning_objectives lo ON lo.id = i.objective_id
     WHERE i.session_id = $1
     ORDER BY i.created_at ASC`,
    [sessionId]
  );
  return rows;
}

// ─── Papers (teacher upload) ──────────────────────────────────────────────────

async function createPaper({ teacherId, subject, gradeBand, examName, year, fileUrl, fileKey }) {
  const { rows } = await pool.query(
    `INSERT INTO papers (teacher_id, subject, grade_band, exam_name, year, file_url, file_key, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'UPLOADED')
     RETURNING *`,
    [teacherId, subject || 'MATH', gradeBand, examName, year || null, fileUrl, fileKey || null]
  );
  return rows[0];
}

async function getPaper(paperId) {
  const { rows } = await pool.query('SELECT * FROM papers WHERE id = $1', [paperId]);
  return rows[0] || null;
}

async function updatePaperStatus(paperId, status) {
  await pool.query('UPDATE papers SET status=$1, updated_at=NOW() WHERE id=$2', [status, paperId]);
}

async function createDraftQuestion({ paperId, stemEn, stemZh, hasImage, imageUrl, suggestedType, suggestedDifficulty, candidateObjectives, rawOcrText }) {
  const { rows } = await pool.query(
    `INSERT INTO draft_questions
       (paper_id, stem_en, stem_zh, has_image, image_url, suggested_type, suggested_difficulty, candidate_objectives, raw_ocr_text, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'DRAFT')
     RETURNING *`,
    [paperId, stemEn || null, stemZh || null, hasImage || false, imageUrl || null,
     suggestedType || 'MCQ', suggestedDifficulty || 2,
     candidateObjectives ? JSON.stringify(candidateObjectives) : null,
     rawOcrText || null]
  );
  return rows[0];
}

async function getDraftQuestions(paperId) {
  const { rows } = await pool.query(
    `SELECT * FROM draft_questions WHERE paper_id = $1 AND status != 'SKIPPED' ORDER BY created_at ASC`,
    [paperId]
  );
  return rows;
}

// ─── Class mastery (teacher dashboard) ───────────────────────────────────────

async function getClassMastery(className, grade) {
  const { rows } = await pool.query(
    `SELECT * FROM v_class_mastery WHERE class_name = $1 AND grade = $2 ORDER BY topic, subtopic, objective_code`,
    [className, grade]
  );
  return rows;
}

module.exports = {
  initAdaptiveLearningDb,
  // LOs
  getLearningObjectives,
  getLearningObjectiveByCode,
  // Questions
  getQuestion,
  getQuestionsForObjective,
  // Users
  getUserById,
  getUserByEmail,
  createUser,
  // Mastery
  getStudentMasteryState,
  getMasteryForObjective,
  upsertMasteryState,
  ensureMasteryState,
  // Sessions
  createSession,
  getSession,
  updateSession,
  // Interactions
  createInteraction,
  getSessionInteractions,
  // Papers
  createPaper,
  getPaper,
  updatePaperStatus,
  createDraftQuestion,
  getDraftQuestions,
  // Teacher dashboard
  getClassMastery,
  // Explanation feedback
  recordExplanationFeedback,
  // Generated question review
  getPendingGeneratedQuestions,
  activateQuestion,
  // KB evolution log
  getEvolutionLog,
};

// ─── Explanation feedback ─────────────────────────────────────────────────────

async function recordExplanationFeedback({ interactionId, studentId, questionId, rating, comment }) {
  const { rows } = await pool.query(
    `INSERT INTO explanation_feedback (interaction_id, student_id, question_id, rating, comment)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [interactionId, studentId, questionId, rating, comment || null]
  );
  return rows[0];
}

// ─── Generated question review ────────────────────────────────────────────────

async function getPendingGeneratedQuestions(limit = 20) {
  const { rows } = await pool.query(
    `SELECT q.*, lo.code, lo.name_en, lo.name_zh
     FROM questions q
     LEFT JOIN question_objective_map qom ON qom.question_id = q.id AND qom.is_primary = TRUE
     LEFT JOIN learning_objectives lo ON lo.id = qom.objective_id
     WHERE q.source_type = 'SYSTEM_GENERATED' AND q.is_active = FALSE
     ORDER BY q.created_at DESC
     LIMIT $1`,
    [limit]
  );
  return rows;
}

async function activateQuestion(questionId) {
  await pool.query(`UPDATE questions SET is_active=TRUE, updated_at=NOW() WHERE id=$1`, [questionId]);
}

// ─── KB evolution log ─────────────────────────────────────────────────────────

async function getEvolutionLog(limit = 50) {
  const { rows } = await pool.query(
    `SELECT * FROM kb_evolution_log ORDER BY run_at DESC LIMIT $1`, [limit]
  );
  return rows;
}
