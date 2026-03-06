/**
 * Bayesian Knowledge Tracing (BKT)
 *
 * Standard 4-parameter BKT for per-objective mastery estimation.
 *
 * Parameters (global defaults; can be tuned per-objective later):
 *   P_L0  — prior probability student already knows the concept
 *   P_T   — probability of learning from one attempt (transition)
 *   P_S   — slip probability (knows it but answers wrong)
 *   P_G   — guess probability (doesn't know but answers correctly)
 *
 * mastery_level 0–4 maps from P(mastery):
 *   0: < 0.20  (not seen / no evidence)
 *   1: 0.20–0.40  (introduced)
 *   2: 0.40–0.60  (practicing)
 *   3: 0.60–0.80  (consolidating)
 *   4: ≥ 0.80  (mastered)
 */

const DEFAULT_PARAMS = {
  P_L0: 0.30,
  P_T:  0.09,
  P_S:  0.10,
  P_G:  0.20,
};

/**
 * Convert mastery_level (0–4) to a representative P(mastery) midpoint.
 * Used when we only have a stored level but need to run BKT.
 */
function levelToProbability(level) {
  const midpoints = [0.10, 0.30, 0.50, 0.70, 0.90];
  return midpoints[Math.max(0, Math.min(4, level))];
}

/**
 * Convert P(mastery) to a 0–4 level.
 */
function probabilityToLevel(p) {
  if (p < 0.20) return 0;
  if (p < 0.40) return 1;
  if (p < 0.60) return 2;
  if (p < 0.80) return 3;
  return 4;
}

/**
 * Run one BKT update step.
 *
 * @param {number} currentLevel  — current mastery_level (0–4) stored in DB
 * @param {boolean} isCorrect    — whether the student answered correctly
 * @param {object} [params]      — optional override of DEFAULT_PARAMS
 * @returns {{ newProbability: number, newLevel: number, delta: number }}
 */
function updateMastery(currentLevel, isCorrect, params = {}) {
  const { P_L0, P_T, P_S, P_G } = { ...DEFAULT_PARAMS, ...params };

  const pL = levelToProbability(currentLevel);

  // Step 1: Update P(mastery) given observation
  let pLgivenObs;
  if (isCorrect) {
    const pCorrect = pL * (1 - P_S) + (1 - pL) * P_G;
    pLgivenObs = (pL * (1 - P_S)) / pCorrect;
  } else {
    const pWrong = pL * P_S + (1 - pL) * (1 - P_G);
    pLgivenObs = (pL * P_S) / pWrong;
  }

  // Step 2: Apply learning transition
  const pLnew = pLgivenObs + (1 - pLgivenObs) * P_T;

  // Clamp to [0, 1]
  const newProbability = Math.max(0, Math.min(1, pLnew));
  const newLevel = probabilityToLevel(newProbability);

  return {
    newProbability,
    newLevel,
    delta: newLevel - currentLevel,
  };
}

/**
 * Update interest level using exponential moving average.
 * @param {number} currentInterest  — current interest_level (1.0–5.0)
 * @param {number} selfRating       — student self-rating (1–5)
 * @param {number} alpha            — smoothing factor (default 0.3)
 */
function updateInterest(currentInterest, selfRating, alpha = 0.3) {
  const updated = alpha * selfRating + (1 - alpha) * currentInterest;
  return Math.max(1.0, Math.min(5.0, Math.round(updated * 10) / 10));
}

module.exports = { updateMastery, updateInterest, levelToProbability, probabilityToLevel };
