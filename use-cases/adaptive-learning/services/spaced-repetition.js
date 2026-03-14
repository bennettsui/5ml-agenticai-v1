/**
 * Spaced Repetition Service — SM-2 Algorithm
 *
 * SuperMemo SM-2: schedules future reviews of each (student, objective) pair
 * based on correctness and mastery level.  Integrated with BKT:
 *  - BKT tracks the probability-of-mastery belief state
 *  - SM-2 tells us WHEN to resurface that objective for review
 *
 * After each session answer the caller should invoke updateSchedule().
 * The session-service uses getDueObjectives() to prioritise what to show next.
 *
 * Personalisation layer:
 *   Reads preference_signals to adjust the base interval (e.g. student who
 *   prefers shorter sessions gets more frequent but shorter review nudges).
 */

const { pool } = require('../../../db');

// ─── SM-2 core ────────────────────────────────────────────────────────────────

/**
 * Compute new SM-2 state from one review outcome.
 *
 * @param {{ interval_days, easiness, repetitions }} current  — current SM-2 row (defaults for new)
 * @param {number} quality  0–5 SM-2 quality rating
 *   Derived from BKT + self-rating:
 *     5 = perfect correct + self-understanding ≥ 4
 *     4 = correct + understanding ≥ 3
 *     3 = correct + understanding 2
 *     2 = correct but low understanding (<2) or hint used
 *     1 = incorrect but close
 *     0 = completely wrong
 * @returns {{ interval_days, easiness, repetitions, next_review_at }}
 */
function computeSM2(current = {}, quality) {
  let { interval_days = 1, easiness = 2.5, repetitions = 0 } = current;

  // SM-2: if quality < 3, reset to beginning
  if (quality < 3) {
    repetitions   = 0;
    interval_days = 1;
  } else {
    if (repetitions === 0) {
      interval_days = 1;
    } else if (repetitions === 1) {
      interval_days = 6;
    } else {
      interval_days = Math.round(interval_days * easiness);
    }
    repetitions++;
  }

  // Update E-factor
  easiness = Math.max(1.3, easiness + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  const next_review_at = new Date(Date.now() + interval_days * 86400 * 1000);

  return { interval_days, easiness: Math.round(easiness * 100) / 100, repetitions, next_review_at };
}

/**
 * Map interaction result to SM-2 quality (0–5).
 */
function toSM2Quality(isCorrect, selfUnderstanding, hintUsed) {
  if (!isCorrect) return selfUnderstanding >= 3 ? 1 : 0;
  if (hintUsed)   return 2;
  const u = selfUnderstanding || 3;
  if (u >= 4) return 5;
  if (u >= 3) return 4;
  if (u >= 2) return 3;
  return 2;
}

// ─── DB operations ────────────────────────────────────────────────────────────

/**
 * Update the SM-2 schedule for a (student, objective) pair after an answer.
 */
async function updateSchedule(studentId, objectiveId, isCorrect, selfUnderstanding, hintUsed) {
  // Fetch current schedule row
  const { rows } = await pool.query(
    `SELECT interval_days, easiness, repetitions FROM study_schedule
     WHERE student_id=$1 AND objective_id=$2`,
    [studentId, objectiveId]
  );
  const current = rows[0] || {};
  const quality = toSM2Quality(isCorrect, selfUnderstanding, hintUsed);
  const newState = computeSM2(current, quality);

  await pool.query(
    `INSERT INTO study_schedule (student_id, objective_id, interval_days, easiness, repetitions, next_review_at, last_reviewed_at)
     VALUES ($1,$2,$3,$4,$5,$6,NOW())
     ON CONFLICT (student_id, objective_id) DO UPDATE SET
       interval_days    = EXCLUDED.interval_days,
       easiness         = EXCLUDED.easiness,
       repetitions      = EXCLUDED.repetitions,
       next_review_at   = EXCLUDED.next_review_at,
       last_reviewed_at = NOW(),
       updated_at       = NOW()`,
    [studentId, objectiveId, newState.interval_days, newState.easiness, newState.repetitions, newState.next_review_at]
  );

  return newState;
}

/**
 * Get objectives due for review for a student, ordered by urgency.
 * "Due" means next_review_at <= NOW() + lookahead hours.
 */
async function getDueObjectives(studentId, lookaheadHours = 24) {
  const { rows } = await pool.query(
    `SELECT ss.objective_id, ss.interval_days, ss.easiness, ss.repetitions,
            ss.next_review_at, ss.last_reviewed_at,
            lo.code, lo.name_en, lo.name_zh, lo.topic, lo.subtopic, lo.grade,
            ms.mastery_level, ms.interest_level
     FROM study_schedule ss
     JOIN learning_objectives lo ON lo.id = ss.objective_id
     LEFT JOIN mastery_states ms ON ms.student_id = ss.student_id AND ms.objective_id = ss.objective_id
     WHERE ss.student_id = $1
       AND ss.next_review_at <= NOW() + ($2 || ' hours')::interval
     ORDER BY ss.next_review_at ASC, ms.mastery_level ASC
     LIMIT 10`,
    [studentId, lookaheadHours]
  );
  return rows;
}

// ─── Personalisation signals ──────────────────────────────────────────────────

/**
 * Read a preference signal for a student.
 */
async function getPreference(studentId, key) {
  const { rows } = await pool.query(
    `SELECT value, confidence FROM preference_signals WHERE student_id=$1 AND key=$2`,
    [studentId, key]
  );
  return rows[0] || null;
}

/**
 * Update (upsert) a preference signal.
 * Uses exponential moving average for numeric values.
 */
async function upsertPreference(studentId, key, value, confidence = 0.6) {
  const existing = await getPreference(studentId, key);
  let finalValue = value;

  // EMA for numeric preferences (session_length, time_hour, difficulty)
  if (existing && !isNaN(parseFloat(existing.value)) && !isNaN(parseFloat(value))) {
    const alpha = 0.3;
    const ema = alpha * parseFloat(value) + (1 - alpha) * parseFloat(existing.value);
    finalValue = ema.toFixed(2);
    confidence = Math.min(1.0, (existing.confidence || 0.5) + 0.05);
  }

  await pool.query(
    `INSERT INTO preference_signals (student_id, key, value, confidence)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (student_id, key) DO UPDATE SET
       value      = EXCLUDED.value,
       confidence = EXCLUDED.confidence,
       updated_at = NOW()`,
    [studentId, key, String(finalValue), confidence]
  );
}

/**
 * Learn and persist preference signals from a completed session.
 * Called by session-service.endSession().
 */
async function learnFromSession(studentId, sessionData) {
  const {
    duration_minutes,
    questions_done,
    correct_count,
    interactions = [],
  } = sessionData;

  // Session length preference
  if (duration_minutes) {
    await upsertPreference(studentId, 'preferred_session_length_mins', duration_minutes);
  }

  // Time-of-day preference (current hour)
  const hour = new Date().getHours();
  await upsertPreference(studentId, 'preferred_time_hour', hour, 0.4);

  // Preferred difficulty (avg difficulty of correct questions)
  const correctInteractions = interactions.filter(i => i.is_correct && i.difficulty_estimate);
  if (correctInteractions.length > 0) {
    const avgDiff = correctInteractions.reduce((sum, i) => sum + (i.difficulty_estimate || 2), 0) / correctInteractions.length;
    await upsertPreference(studentId, 'preferred_difficulty', avgDiff.toFixed(1));
  }

  // Topic affinity from interest ratings
  const interestByTopic = {};
  for (const i of interactions) {
    if (i.objective_code && i.self_interest) {
      const topic = i.objective_code.split('.')[2] || 'GENERAL';
      if (!interestByTopic[topic]) interestByTopic[topic] = [];
      interestByTopic[topic].push(i.self_interest);
    }
  }
  for (const [topic, ratings] of Object.entries(interestByTopic)) {
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    await upsertPreference(studentId, `topic_affinity_${topic}`, avg.toFixed(1), 0.5);
  }
}

/**
 * Get a personalised session config for a student.
 * Returns suggested: duration, objectives to prioritise, difficulty target.
 */
async function getPersonalisedConfig(studentId) {
  const [length, difficulty, timeHour] = await Promise.all([
    getPreference(studentId, 'preferred_session_length_mins'),
    getPreference(studentId, 'preferred_difficulty'),
    getPreference(studentId, 'preferred_time_hour'),
  ]);

  // Get due objectives from spaced rep
  const dueObjectives = await getDueObjectives(studentId, 48);

  return {
    suggested_duration_mins: length ? Math.round(parseFloat(length.value)) : 20,
    target_difficulty:       difficulty ? parseFloat(difficulty.value) : 2.5,
    preferred_hour:          timeHour ? parseInt(timeHour.value) : null,
    review_objectives:       dueObjectives.map(o => o.code),
  };
}

module.exports = {
  updateSchedule,
  getDueObjectives,
  getPreference,
  upsertPreference,
  learnFromSession,
  getPersonalisedConfig,
  computeSM2,
  toSM2Quality,
};
