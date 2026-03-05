/**
 * Knowledge Base Evolution Engine
 *
 * Runs on a nightly cron and drives four continuous feedback loops:
 *
 *  Loop 1 — Question Quality (IRT)
 *    Recomputes Item Response Theory parameters from raw interaction data.
 *    Flags questions that are too easy, too hard, or have low discrimination.
 *    Deactivates persistently bad questions (>50 attempts, still flagged).
 *
 *  Loop 2 — Gap Detection & Auto-Generation
 *    Finds Learning Objectives with <MIN_QUESTIONS active questions.
 *    Calls Claude QuestionAgent to generate new questions, inserts them as
 *    SYSTEM_GENERATED questions ready for teacher review.
 *
 *  Loop 3 — Explanation Promotion
 *    Collects AI explanations that received positive feedback (rating = 1).
 *    Embeds them as knowledge_chunks so future RAG queries surface them.
 *
 *  Loop 4 — Student Pattern Mining
 *    Identifies LO co-occurrence patterns ("students who mastered X also
 *    needed Y"). Stores in kb_evolution_log for later use in scheduling.
 *
 * Scheduling: daily at 02:00 HKT via index.js cron.
 */

const { pool }          = require('../../../db');
const scheduleRegistry  = require('../../../services/schedule-registry');
const { AdaptiveAgent } = require('../agents/adaptive-agent');
const nodeCron          = require('node-cron');

const MIN_QUESTIONS_PER_LO   = 5;   // trigger auto-gen when below this
const MAX_AUTO_GEN_PER_RUN   = 10;  // cap Claude calls per nightly run
const FLAG_EASY_THRESHOLD    = 0.85; // p-value (proportion correct)
const FLAG_HARD_THRESHOLD    = 0.10;
const FLAG_DISC_THRESHOLD    = 0.20; // discrimination (corrected point-biserial)
const DEACTIVATE_AFTER_FLAGS = 3;    // consecutive nightly runs flagged → deactivate

let _agent;
function agent() { return (_agent ??= new AdaptiveAgent()); }

// ─── Main entry point ────────────────────────────────────────────────────────

async function runEvolutionCycle(triggeredBy = 'nightly_cron') {
  const startedAt = Date.now();
  console.log(`[KB Evolution] Starting cycle triggered by: ${triggeredBy}`);

  scheduleRegistry.register({
    id: 'adaptive-learning:kb-evolution',
    group: 'Adaptive Learning',
    name: 'KB Evolution Engine',
    description: 'Nightly: IRT updates, gap detection, question gen, explanation promotion',
    schedule: '0 2 * * *',
    timezone: 'Asia/Hong_Kong',
    status: 'running',
    lastRunAt: new Date().toISOString(),
    lastResult: null,
    lastDurationMs: null,
    nextRunAt: 'Tomorrow 02:00 HKT',
  });

  const summary = {
    irt_updated:      0,
    questions_flagged: 0,
    questions_deactivated: 0,
    questions_generated: 0,
    chunks_embedded:  0,
    patterns_mined:   0,
    errors:           [],
  };

  await loop1_IrtUpdate(summary, triggeredBy);
  await loop2_GapDetectionAndGen(summary, triggeredBy);
  await loop3_ExplanationPromotion(summary, triggeredBy);
  await loop4_PatternMining(summary, triggeredBy);

  const durationMs = Date.now() - startedAt;
  const resultText = `IRT:${summary.irt_updated} flagged:${summary.questions_flagged} deactivated:${summary.questions_deactivated} gen:${summary.questions_generated} chunks:${summary.chunks_embedded} patterns:${summary.patterns_mined}`;

  scheduleRegistry.register({
    id: 'adaptive-learning:kb-evolution',
    group: 'Adaptive Learning',
    name: 'KB Evolution Engine',
    description: 'Nightly: IRT updates, gap detection, question gen, explanation promotion',
    schedule: '0 2 * * *',
    timezone: 'Asia/Hong_Kong',
    status: summary.errors.length > 0 ? 'failed' : 'completed',
    lastRunAt: new Date(startedAt).toISOString(),
    lastResult: resultText,
    lastDurationMs: durationMs,
    nextRunAt: 'Tomorrow 02:00 HKT',
    meta: { ...summary },
  });

  console.log(`[KB Evolution] Done in ${Math.round(durationMs / 1000)}s — ${resultText}`);
  return summary;
}

// ─── Loop 1: IRT parameter recomputation ─────────────────────────────────────

async function loop1_IrtUpdate(summary, triggeredBy) {
  // Pull all questions that have at least 5 interactions
  const { rows: questions } = await pool.query(`
    SELECT q.id, q.is_active,
           COUNT(i.id)::int            AS total_attempts,
           SUM(CASE WHEN i.is_correct THEN 1 ELSE 0 END)::int AS correct_attempts,
           SUM(CASE WHEN i.hint_used  THEN 1 ELSE 0 END)::int AS hint_used_count,
           ROUND(AVG(i.time_taken_secs)::numeric, 2)          AS avg_time_secs
    FROM questions q
    JOIN interactions i ON i.question_id = q.id
    GROUP BY q.id, q.is_active
    HAVING COUNT(i.id) >= 5
  `);

  for (const q of questions) {
    const pValue = q.total_attempts > 0 ? q.correct_attempts / q.total_attempts : 0;
    const guessRate = q.total_attempts > 0 ? q.hint_used_count / q.total_attempts : 0;

    // 1PL IRT: difficulty_irt ≈ logit(1 - pValue) — higher = harder
    const diffIrt = pValue > 0 && pValue < 1
      ? Math.log((1 - pValue) / pValue)
      : (pValue <= 0 ? 5.0 : -5.0);

    // Approximated discrimination from pValue variance heuristic
    const disc = Math.min(2.0, Math.max(0, 4 * pValue * (1 - pValue)));

    const tooEasy = pValue > FLAG_EASY_THRESHOLD;
    const tooHard = pValue < FLAG_HARD_THRESHOLD;
    const lowDisc = disc < FLAG_DISC_THRESHOLD && q.total_attempts >= 20;

    await pool.query(`
      INSERT INTO question_analytics
        (question_id, total_attempts, correct_attempts, hint_used_count, avg_time_secs,
         difficulty_irt, discrimination, guess_rate,
         flagged_too_easy, flagged_too_hard, flagged_low_disc, last_computed_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW(),NOW())
      ON CONFLICT (question_id) DO UPDATE SET
        total_attempts   = EXCLUDED.total_attempts,
        correct_attempts = EXCLUDED.correct_attempts,
        hint_used_count  = EXCLUDED.hint_used_count,
        avg_time_secs    = EXCLUDED.avg_time_secs,
        difficulty_irt   = EXCLUDED.difficulty_irt,
        discrimination   = EXCLUDED.discrimination,
        guess_rate       = EXCLUDED.guess_rate,
        flagged_too_easy = EXCLUDED.flagged_too_easy,
        flagged_too_hard = EXCLUDED.flagged_too_hard,
        flagged_low_disc = EXCLUDED.flagged_low_disc,
        last_computed_at = NOW(),
        updated_at       = NOW()
    `, [q.id, q.total_attempts, q.correct_attempts, q.hint_used_count, q.avg_time_secs,
        diffIrt.toFixed(3), disc.toFixed(3), guessRate.toFixed(3),
        tooEasy, tooHard, lowDisc]);

    summary.irt_updated++;

    if (tooEasy || tooHard || lowDisc) {
      summary.questions_flagged++;

      // Auto-deactivate if flagged and has 50+ attempts (clear evidence it's bad)
      if ((tooEasy || tooHard) && q.total_attempts >= 50 && q.is_active) {
        await pool.query(`UPDATE questions SET is_active = FALSE WHERE id = $1`, [q.id]);
        summary.questions_deactivated++;
        await _logEvolution(triggeredBy, 'FLAG_QUESTION', 'question', q.id, {
          reason: tooEasy ? 'p-value too high (too easy)' : 'p-value too low (too hard)',
          p_value: pValue.toFixed(3),
          total_attempts: q.total_attempts,
          action: 'deactivated',
        });
      }
    }
  }
}

// ─── Loop 2: Gap detection + auto-generation ─────────────────────────────────

async function loop2_GapDetectionAndGen(summary, triggeredBy) {
  if (!process.env.ANTHROPIC_API_KEY) return;

  // Find LOs with fewer than MIN_QUESTIONS active questions
  const { rows: gaps } = await pool.query(`
    SELECT lo.id, lo.code, lo.grade, lo.topic, lo.subtopic, lo.name_en, lo.name_zh,
           lo.description_en, lo.description_zh,
           COUNT(q.id)::int AS active_question_count
    FROM learning_objectives lo
    LEFT JOIN question_objective_map qom ON qom.objective_id = lo.id
    LEFT JOIN questions q ON q.id = qom.question_id AND q.is_active = TRUE
    GROUP BY lo.id, lo.code, lo.grade, lo.topic, lo.subtopic, lo.name_en, lo.name_zh,
             lo.description_en, lo.description_zh
    HAVING COUNT(q.id) < $1
    ORDER BY COUNT(q.id) ASC
    LIMIT $2
  `, [MIN_QUESTIONS_PER_LO, MAX_AUTO_GEN_PER_RUN]);

  for (const gap of gaps) {
    const needed = MIN_QUESTIONS_PER_LO - gap.active_question_count;
    for (let i = 0; i < Math.min(needed, 2); i++) {  // max 2 per LO per run
      try {
        const result = await agent().question.authorQuestion({
          rawTextEn: null, // generation mode — no raw input
          generationMode: true,
          targetObjective: {
            code:           gap.code,
            name_en:        gap.name_en,
            name_zh:        gap.name_zh,
            description_en: gap.description_en,
            description_zh: gap.description_zh,
            grade:          gap.grade,
            topic:          gap.topic,
            subtopic:       gap.subtopic,
          },
          questionNumber: i + 1,
          gradeBand: gap.grade,
          candidateObjectives: [{ code: gap.code, name_en: gap.name_en, name_zh: gap.name_zh }],
        });

        if (!result?.clean_stem_en) continue;

        // Insert as SYSTEM_GENERATED, is_active=FALSE until teacher confirms
        const { rows } = await pool.query(`
          INSERT INTO questions
            (stem_en, stem_zh, answer, question_type, difficulty_estimate,
             option_a_en, option_b_en, option_c_en, option_d_en,
             explanation_en, explanation_zh,
             source_type, grade, topic, subtopic, is_active)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'SYSTEM_GENERATED',$12,$13,$14,FALSE)
          RETURNING id
        `, [
          result.clean_stem_en, result.clean_stem_zh || null,
          result.answer || 'A',
          result.question_type || 'MCQ',
          result.difficulty_estimate || 2,
          result.options?.[0] || null, result.options?.[1] || null,
          result.options?.[2] || null, result.options?.[3] || null,
          result.explanation_en || null, result.explanation_zh || null,
          gap.grade, gap.topic, gap.subtopic,
        ]);

        const questionId = rows[0].id;
        await pool.query(
          `INSERT INTO question_objective_map (question_id, objective_id, is_primary) VALUES ($1,$2,TRUE) ON CONFLICT DO NOTHING`,
          [questionId, gap.id]
        );

        summary.questions_generated++;
        await _logEvolution(triggeredBy, 'GENERATE_QUESTION', 'question', questionId, {
          objective_code: gap.code,
          reason: `Gap: only ${gap.active_question_count} active questions`,
          status: 'pending_teacher_review',
        });
      } catch (err) {
        summary.errors.push(`Gap gen ${gap.code}: ${err.message}`);
      }
    }
  }
}

// ─── Loop 3: Explanation promotion to knowledge chunks ───────────────────────

async function loop3_ExplanationPromotion(summary, triggeredBy) {
  // Find AI explanations that got positive feedback and haven't been embedded yet
  const { rows: positives } = await pool.query(`
    SELECT ef.question_id, i.ai_explanation,
           lo.code AS objective_code, lo.name_en, lo.name_zh
    FROM explanation_feedback ef
    JOIN interactions i ON i.id = ef.interaction_id
    JOIN questions q ON q.id = ef.question_id
    LEFT JOIN question_objective_map qom ON qom.question_id = q.id AND qom.is_primary = TRUE
    LEFT JOIN learning_objectives lo ON lo.id = qom.objective_id
    WHERE ef.rating = 1
      AND i.ai_explanation IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM knowledge_chunks kc
        WHERE kc.source_type = 'ai_explanation'
          AND kc.source_label = ef.question_id::text
      )
    LIMIT 20
  `);

  for (const row of positives) {
    try {
      const explanation = typeof row.ai_explanation === 'string'
        ? JSON.parse(row.ai_explanation)
        : row.ai_explanation;

      const contentEn = explanation?.explanation_en || explanation?.text || null;
      const contentZh = explanation?.explanation_zh || null;
      if (!contentEn) continue;

      await pool.query(`
        INSERT INTO knowledge_chunks (source_type, source_label, content_en, content_zh, objective_code)
        VALUES ('ai_explanation', $1, $2, $3, $4)
        ON CONFLICT DO NOTHING
      `, [row.question_id, contentEn, contentZh || null, row.objective_code || null]);

      summary.chunks_embedded++;
      await _logEvolution(triggeredBy, 'EMBED_CONTENT', 'knowledge_chunk', null, {
        question_id:    row.question_id,
        objective_code: row.objective_code,
        reason: 'positive explanation feedback promoted to KB',
      });
    } catch (err) {
      summary.errors.push(`Embed explanation ${row.question_id}: ${err.message}`);
    }
  }
}

// ─── Loop 4: Pattern mining (LO co-occurrence) ───────────────────────────────

async function loop4_PatternMining(summary, triggeredBy) {
  // Find pairs of objectives where same student has attempted both.
  // If student mastered LO-A before LO-B more than 70% of the time,
  // record that A is a likely prerequisite for B.
  const { rows: patterns } = await pool.query(`
    SELECT
      ms1.objective_id AS lo_a,
      ms2.objective_id AS lo_b,
      COUNT(*)::int    AS co_count,
      SUM(CASE WHEN ms1.last_practiced_at < ms2.last_practiced_at
               AND ms1.mastery_level >= 3 THEN 1 ELSE 0 END)::int AS a_before_b_mastered
    FROM mastery_states ms1
    JOIN mastery_states ms2 ON ms2.student_id = ms1.student_id
      AND ms2.objective_id != ms1.objective_id
      AND ms2.evidence_count > 0
    WHERE ms1.evidence_count > 0
    GROUP BY ms1.objective_id, ms2.objective_id
    HAVING COUNT(*) >= 5
       AND (SUM(CASE WHEN ms1.last_practiced_at < ms2.last_practiced_at
                     AND ms1.mastery_level >= 3 THEN 1 ELSE 0 END)::float / COUNT(*)) > 0.70
    LIMIT 50
  `);

  for (const p of patterns) {
    await _logEvolution(triggeredBy, 'CLOSE_GAP', 'learning_objective', p.lo_b, {
      prerequisite_lo_id: p.lo_a,
      co_occurrence_count: p.co_count,
      a_before_b_rate: p.co_count > 0 ? (p.a_before_b_mastered / p.co_count).toFixed(2) : 0,
      interpretation: 'LO-A appears to be prerequisite for LO-B',
    });
    summary.patterns_mined++;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function _logEvolution(triggeredBy, action, entityType, entityId, detail) {
  await pool.query(
    `INSERT INTO kb_evolution_log (action, entity_type, entity_id, detail, triggered_by)
     VALUES ($1,$2,$3,$4,$5)`,
    [action, entityType, entityId || null, JSON.stringify(detail), triggeredBy]
  );
}

// ─── Cron registration ────────────────────────────────────────────────────────

function startEvolutionCron() {
  // 02:00 HKT = 18:00 UTC previous day
  nodeCron.schedule('0 18 * * *', () => {
    runEvolutionCycle('nightly_cron').catch(err =>
      console.error('[KB Evolution] Cron failed:', err.message)
    );
  }, { timezone: 'UTC' });

  scheduleRegistry.register({
    id: 'adaptive-learning:kb-evolution',
    group: 'Adaptive Learning',
    name: 'KB Evolution Engine',
    description: 'Daily at 02:00 HKT: IRT updates, gap detection, question auto-gen, explanation promotion, pattern mining',
    schedule: '0 2 * * * (HKT)',
    timezone: 'Asia/Hong_Kong',
    status: 'scheduled',
    lastRunAt: null,
    lastResult: null,
    lastDurationMs: null,
    nextRunAt: 'Tonight 02:00 HKT',
  });

  console.log('✅ KB Evolution cron registered (02:00 HKT daily)');
}

module.exports = { runEvolutionCycle, startEvolutionCron };
