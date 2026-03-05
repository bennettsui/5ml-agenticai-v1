/**
 * Adaptive Session Engine
 *
 * Handles the full lifecycle of a 20-minute student session:
 *   startSession()   — create session, select first question
 *   submitAnswer()   — evaluate, BKT update, Claude explanation, next question
 *   endSession()     — Claude session summary + student UX copy
 *
 * Question selection strategy (v1):
 *   1. Prioritise objectives in the "learning zone": mastery 1–3, interest ≥ 2.5
 *   2. Fallback to any target objective with available questions
 *   3. Avoid repeating questions seen this session
 *   4. End session at MAX_QUESTIONS or MAX_DURATION_SECS
 */

const db  = require('../db');
const bkt = require('./bkt');
const { AdaptiveAgent } = require('../agents/adaptive-agent');

const MAX_QUESTIONS     = 10;
const MAX_DURATION_SECS = 1200; // 20 min

let _agent;
function agent() {
  if (!_agent) _agent = new AdaptiveAgent();
  return _agent;
}

// ─── Start ────────────────────────────────────────────────────────────────────

/**
 * @param {string} studentId
 * @param {string[]} targetObjectiveCodes  e.g. ['MATH.S1.FRACTION.ADD', ...]
 * @param {string} language  'EN'|'ZH'
 * @param {string} mode  'adaptive'|'practice'|'review'
 */
async function startSession(studentId, targetObjectiveCodes, language = 'EN', mode = 'adaptive') {
  const session = await db.createSession(studentId, mode);

  // Resolve objective UUIDs
  const objectives = await Promise.all(
    targetObjectiveCodes.map(code => db.getLearningObjectiveByCode(code))
  );
  const validObjectives = objectives.filter(Boolean);

  // Ensure mastery_state rows exist for all target objectives
  await Promise.all(validObjectives.map(lo => db.ensureMasteryState(studentId, lo.id)));

  const question = await _selectNextQuestion(studentId, validObjectives, []);
  if (!question) {
    throw new Error('No questions available for the selected objectives. Please ask your teacher to add questions to the question bank.');
  }

  return { session, question: _formatQuestion(question, language) };
}

// ─── Submit Answer ────────────────────────────────────────────────────────────

/**
 * @param {string} sessionId
 * @param {string} questionId
 * @param {object} answerPayload  { selectedOptionIndex?, text? }
 * @param {object} selfRatings    { understanding: 1–5, interest: 1–5 }
 * @param {number} timeTakenSecs
 * @param {boolean} hintUsed
 * @param {string} language
 */
async function submitAnswer(sessionId, questionId, answerPayload, selfRatings = {}, timeTakenSecs, hintUsed = false, language = 'EN') {
  const session = await db.getSession(sessionId);
  if (!session) throw new Error('Session not found');
  if (session.status === 'completed') throw new Error('Session already ended');

  const question = await db.getQuestion(questionId);
  if (!question) throw new Error('Question not found');

  // ── Evaluate correctness ──────────────────────────────────
  const isCorrect = _evaluateAnswer(question, answerPayload);

  // ── Primary objective for this question ───────────────────
  const primaryObjective = Array.isArray(question.objectives) && question.objectives[0];
  const objectiveId = primaryObjective?.id || null;
  const objectiveCode = primaryObjective?.code || null;

  // ── Claude explanation ────────────────────────────────────
  let aiExplanation = null;
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      aiExplanation = await agent().student.explainQuestion({
        question: {
          stem_en: question.stem_en,
          stem_zh: question.stem_zh,
          type: question.question_type,
          answer: question.answer,
          linked_objectives: question.objectives?.filter(Boolean) || [],
        },
        studentAnswer: answerPayload,
        studentStateForObjectives: objectiveCode ? [objectiveCode] : undefined,
        language,
      });
    } catch (err) {
      console.warn('StudentAgent explanation failed (non-fatal):', err.message);
    }
  }

  // ── Log interaction ───────────────────────────────────────
  await db.createInteraction({
    sessionId, studentId: session.student_id, questionId,
    objectiveId,
    studentAnswer: JSON.stringify(answerPayload),
    isCorrect,
    timeTakenSecs,
    hintUsed,
    selfUnderstanding: selfRatings.understanding || null,
    selfInterest:      selfRatings.interest      || null,
    aiExplanation,
  });

  // ── BKT mastery update ────────────────────────────────────
  let masteryDelta = 0;
  if (objectiveId) {
    const current = await db.getMasteryForObjective(session.student_id, objectiveId);
    const currentLevel = current?.mastery_level ?? 0;
    const currentInterest = current?.interest_level ?? 3.0;

    const { newLevel } = bkt.updateMastery(currentLevel, isCorrect);
    const newInterest  = selfRatings.interest
      ? bkt.updateInterest(currentInterest, selfRatings.interest)
      : currentInterest;

    await db.upsertMasteryState(session.student_id, objectiveId, {
      masteryLevel: newLevel,
      interestLevel: newInterest,
      evidenceCount: (current?.evidence_count ?? 0) + 1,
    });
    masteryDelta = newLevel - currentLevel;
  }

  // ── Update session counters ───────────────────────────────
  const newCount   = (session.questions_seen  || 0) + 1;
  const newCorrect = (session.questions_correct || 0) + (isCorrect ? 1 : 0);
  await db.updateSession(sessionId, {
    questions_seen:    newCount,
    questions_correct: newCorrect,
  });

  // ── Check if session should end ───────────────────────────
  const durationSecs = Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000);
  const shouldEnd = newCount >= MAX_QUESTIONS || durationSecs >= MAX_DURATION_SECS;

  let next;
  if (shouldEnd) {
    next = { type: 'END' };
  } else {
    // Get IDs of questions already seen this session
    const interactions = await db.getSessionInteractions(sessionId);
    const usedIds = interactions.map(i => i.question_id);

    // Get target objectives from current mastery state (student's objectives)
    const masteryState = await db.getStudentMasteryState(session.student_id);
    const targetLOs = masteryState.map(ms => ({ id: ms.objective_id, code: ms.code, mastery_level: ms.mastery_level, interest_level: ms.interest_level }));

    const nextQ = await _selectNextQuestion(session.student_id, targetLOs, usedIds);
    next = nextQ
      ? { type: 'QUESTION', question: _formatQuestion(nextQ, language) }
      : { type: 'END' };
  }

  return {
    result: {
      correctness: isCorrect ? 'CORRECT' : 'INCORRECT',
      correct_answer: question.answer,
      explanation: aiExplanation,
      mastery_delta: masteryDelta,
    },
    next,
  };
}

// ─── End Session ──────────────────────────────────────────────────────────────

async function endSession(sessionId, language = 'EN') {
  const session = await db.getSession(sessionId);
  if (!session) throw new Error('Session not found');

  // Mark ended
  const durationSecs = Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000);
  await db.updateSession(sessionId, {
    status:      'completed',
    ended_at:    new Date(),
    duration_secs: durationSecs,
  });

  const interactions = await db.getSessionInteractions(sessionId);
  const masteryState  = await db.getStudentMasteryState(session.student_id);

  // Build mastery deltas: compare before/after approximated from interactions
  const masteryDeltas = _computeMasteryDeltas(interactions, masteryState);

  let sessionSummary = null;
  let studentUxText  = null;

  if (process.env.ANTHROPIC_API_KEY && interactions.length > 0) {
    try {
      sessionSummary = await agent().student.summariseSession({
        sessionInfo: {
          duration_minutes: Math.round(durationSecs / 60),
          question_count:   interactions.length,
          correct_count:    interactions.filter(i => i.is_correct).length,
        },
        interactions: interactions.map(i => ({
          question_stem_en:   i.stem_en,
          question_stem_zh:   i.stem_zh,
          linked_objectives:  [i.objective_code].filter(Boolean),
          is_correct:         i.is_correct,
          hint_used:          i.hint_used,
          student_self_interest: i.self_interest,
        })),
        masteryDeltas,
        language,
      });
    } catch (err) {
      console.warn('StudentAgent summariseSession failed (non-fatal):', err.message);
    }

    try {
      const uxResult = await agent().studentUx.run('SESSION_SUMMARY_STUDENT', language, {
        questions_done:   interactions.length,
        correct_count:    interactions.filter(i => i.is_correct).length,
        mastery_deltas:   masteryDeltas,
        duration_minutes: Math.round(durationSecs / 60),
      });
      studentUxText = uxResult?.text || null;
    } catch (err) {
      console.warn('StudentUxAgent SESSION_SUMMARY_STUDENT failed (non-fatal):', err.message);
    }
  }

  // Cache summary on session row
  if (sessionSummary) {
    await db.updateSession(sessionId, { ai_summary: JSON.stringify(sessionSummary) });
  }

  return {
    session_id:        sessionId,
    duration_minutes:  Math.round(durationSecs / 60),
    questions_done:    interactions.length,
    correct_count:     interactions.filter(i => i.is_correct).length,
    mastery_deltas:    masteryDeltas,
    session_summary:   sessionSummary,
    student_ux_text:   studentUxText,
  };
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function _evaluateAnswer(question, answerPayload) {
  const correctAnswer = (question.answer || '').toString().trim().toUpperCase();
  if (answerPayload?.selectedOptionIndex !== undefined) {
    // MCQ: map index 0–3 to A–D
    const chosen = ['A', 'B', 'C', 'D'][answerPayload.selectedOptionIndex] || '';
    return chosen === correctAnswer;
  }
  if (answerPayload?.text !== undefined) {
    return answerPayload.text.trim().toLowerCase() === correctAnswer.toLowerCase();
  }
  return false;
}

async function _selectNextQuestion(studentId, objectivesOrMastery, usedQuestionIds) {
  // objectivesOrMastery can be LO rows OR mastery_state rows (both have .id and .code)
  if (!objectivesOrMastery || objectivesOrMastery.length === 0) return null;

  // Sort: mastery 1–3 first (learning zone), then by interest desc, then level asc
  const sorted = [...objectivesOrMastery].sort((a, b) => {
    const aLevel = a.mastery_level ?? 1;
    const bLevel = b.mastery_level ?? 1;
    const aInZone = aLevel >= 1 && aLevel <= 3 ? 0 : 1;
    const bInZone = bLevel >= 1 && bLevel <= 3 ? 0 : 1;
    if (aInZone !== bInZone) return aInZone - bInZone;
    const aInterest = a.interest_level ?? 3;
    const bInterest = b.interest_level ?? 3;
    if (bInterest !== aInterest) return bInterest - aInterest;
    return aLevel - bLevel;
  });

  for (const lo of sorted) {
    const code = lo.code || lo.objective_code;
    if (!code) continue;
    const questions = await db.getQuestionsForObjective(code, { excludeIds: usedQuestionIds, limit: 3 });
    if (questions.length > 0) {
      return questions[0];
    }
  }
  return null;
}

function _formatQuestion(q, language = 'EN') {
  const stem = language === 'ZH' ? (q.stem_zh || q.stem_en) : q.stem_en;
  const options = language === 'ZH'
    ? [q.option_a_zh || q.option_a_en, q.option_b_zh || q.option_b_en, q.option_c_zh || q.option_c_en, q.option_d_zh || q.option_d_en].filter(Boolean)
    : [q.option_a_en, q.option_b_en, q.option_c_en, q.option_d_en].filter(Boolean);

  return {
    question_id:   q.id,
    type:          q.question_type,
    stem,
    options:       options.length ? options : null,
    has_image:     q.has_image,
    image_url:     q.image_url || null,
    difficulty:    q.difficulty_estimate,
  };
}

function _computeMasteryDeltas(interactions, masteryState) {
  const byObjective = {};
  for (const i of interactions) {
    if (!i.objective_code) continue;
    if (!byObjective[i.objective_code]) {
      byObjective[i.objective_code] = {
        objective_code: i.objective_code,
        name_en: i.objective_name_en,
        name_zh: i.objective_name_zh,
        attempts: 0, correct: 0,
      };
    }
    byObjective[i.objective_code].attempts++;
    if (i.is_correct) byObjective[i.objective_code].correct++;
  }

  // Attach current mastery level from mastery state
  for (const ms of masteryState) {
    if (byObjective[ms.code]) {
      byObjective[ms.code].current_mastery_level = ms.mastery_level;
      byObjective[ms.code].current_interest_level = ms.interest_level;
    }
  }

  return Object.values(byObjective);
}

module.exports = { startSession, submitAnswer, endSession };
