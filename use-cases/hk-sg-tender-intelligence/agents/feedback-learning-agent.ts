/**
 * FeedbackLearningAgent
 *
 * Role: Recalibrate the tender evaluation scoring rules based on founder feedback.
 *       Analyses patterns in tender_decisions to improve what "fit" and "potential"
 *       mean for our specific company profile over time.
 *
 * Cadence: Weekly — Sunday 05:00 HKT, or when ≥10 new feedback items received.
 *          Registered as "tender-intel:feedback-learning"
 *
 * Model: DeepSeek Reasoner (pattern analysis + report generation)
 *
 * IMPORTANT: This agent produces RECOMMENDATIONS, not automatic changes.
 *            The founder must approve scoring weight updates before they take effect.
 */

export interface FeedbackLearningInput {
  /** New tender decisions since last learning run */
  newDecisions: Array<{
    tender_id: string;
    decision: 'track' | 'ignore' | 'assigned' | 'partner_needed' | 'not_for_us' | 'won' | 'lost' | 'shortlisted';
    decided_at: string;
    notes?: string;
    // Tender attributes at decision time
    tender: {
      title: string;
      agency: string | null;
      category_tags: string[];
      jurisdiction: string;
      overall_relevance_score: number;
      label: string;
      capability_fit_score: number;
      business_potential_score: number;
    };
  }>;
  /** Current scoring weights (to compare against observed outcomes) */
  currentWeights: object;
  /** Historical accuracy statistics (computed from all past decisions) */
  historicalAccuracy: {
    precision: number;            // % of Priority/Consider tenders the founder tracked
    recall: number;               // % of tracked tenders that were scored Priority/Consider
    falsePositiveCategories: string[];   // Categories we overrated
    falseNegativeCategories: string[];  // Categories we underrated
    topMissedAgencies: string[];  // Agencies not in knownAgencies but founder tracked
  };
}

export interface CalibrationRecommendation {
  type: 'weight_adjustment' | 'add_known_agency' | 'add_track_record_keyword' | 'downgrade_category';
  description: string;          // Plain English explanation
  currentValue: unknown;
  recommendedValue: unknown;
  confidence: number;           // 0–1 — how confident is this recommendation?
  supportingEvidence: string;   // e.g. "Founder tracked 8/9 construction_works tenders but score averaged 0.38"
}

export interface FeedbackLearningOutput {
  calibrationReport: {
    summary: string;              // 2–3 para summary for founder
    accuracy: {
      precision: number;
      recall: number;
      f1: number;
    };
    recommendations: CalibrationRecommendation[];
    noChangesNeeded: boolean;     // True if scores are well-calibrated
  };
  /** Only populated after founder approves — triggers re-evaluation */
  approvedUpdates?: {
    newWeights: object;
    newKnownAgencies: string[];
    newTrackRecordKeywords: string[];
    reEvaluateSince: string;      // ISO date — re-evaluate tenders seen since this date
  };
}

/**
 * IMPLEMENTATION NOTES
 *
 * 1. ACCURACY ANALYSIS
 *    - "True positive": tender labelled Priority/Consider AND founder chose Track/Assign
 *    - "False positive": tender labelled Priority/Consider but founder chose Ignore/Not-for-us
 *    - "True negative": tender labelled Ignore AND founder confirmed (implicit, never actioned)
 *    - "False negative": tender labelled Ignore but... (harder to detect since ignored tenders are hidden)
 *
 *    For false negatives: look at tenders where founder manually searched for and tracked a tender
 *    that was originally scored low (requires "found externally" decision type)
 *
 * 2. PATTERN ANALYSIS (DeepSeek)
 *    Prompt: "Analyse these tender decisions and scoring outcomes. Identify:
 *    1. Categories that are systematically over- or under-rated
 *    2. Agencies the founder consistently tracks that we should add to knownAgencies
 *    3. Keywords in tracked tenders that should be added to trackRecordKeywords
 *    4. Patterns in ignored tenders that suggest a weight should be reduced
 *    Provide specific, quantified recommendations with confidence levels."
 *
 *    Input: last 90 days of decisions with tender attributes and scores
 *    Output: structured list of CalibrationRecommendations
 *
 * 3. RECOMMENDATION TYPES
 *    weight_adjustment: e.g. reduce categoryMatch weight for construction_works from 0.35 to 0.20
 *    add_known_agency: e.g. add "LCSD" to knownAgencies (founder tracked 3 LCSD tenders)
 *    add_track_record_keyword: e.g. add "digital transformation" to trackRecordKeywords
 *    downgrade_category: e.g. reduce IT_digital × construction_works cross-match score
 *
 * 4. APPROVAL WORKFLOW
 *    a. Output is written to calibration_reports table
 *    b. Founder sees report in dashboard with "Approve" / "Reject" per recommendation
 *    c. On approval: update company_capability_profile table with new weights
 *    d. Queue re-evaluation job: TenderEvaluatorAgent runs on all tenders with last_seen_at ≥ 30 days ago
 *
 * 5. EMBEDDING-BASED SIMILARITY (future enhancement)
 *    - When enough tracked tenders exist (≥20): compute pgvector embeddings of their titles
 *    - Store as "past wins cluster" in vector store
 *    - TenderEvaluatorAgent adds a "similarity to past wins" signal (cosine distance from cluster centroid)
 *    - Weight: 0.15 within capability_fit (redistributed from categoryMatch)
 */

export class FeedbackLearningAgent {
  readonly name = 'FeedbackLearningAgent';
  readonly model = 'deepseek-reasoner';
  readonly schedule = '0 5 * * 0';  // Sunday 05:00 HKT
  readonly timezone = 'Asia/Hong_Kong';

  async run(_input: FeedbackLearningInput): Promise<FeedbackLearningOutput> {
    throw new Error('FeedbackLearningAgent: not yet implemented. See DESIGN.md §4 for full spec.');
  }
}
