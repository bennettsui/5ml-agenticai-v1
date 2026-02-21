/**
 * TenderEvaluatorAgent
 *
 * Role: Score each new (or re-evaluation-flagged) tender on:
 *       1. capability_fit_score (0–1): can we realistically deliver this?
 *       2. business_potential_score (0–1): is it worth pursuing commercially?
 *       3. overall_relevance_score: weighted combination
 *       4. label: Priority / Consider / Partner-only / Ignore
 *       5. rationale: 2–3 sentence plain-English explanation
 *
 * Cadence: Daily 04:00 HKT — runs after ingestion + normalisation completes.
 *          Registered as "tender-intel:evaluation"
 *
 * Model: DeepSeek Reasoner (primary) — structured scoring with reasoning chain
 *        Claude Haiku (fallback) — for simpler classification sub-tasks
 */

export interface CompanyCapabilityProfile {
  /** Core service categories we can deliver */
  competencies: string[];         // e.g. ["digital_marketing", "events_experiential", "consultancy"]
  /** Keywords from our track record (extracted from past tender titles/descriptions) */
  trackRecordKeywords: string[];
  /** Agencies we've successfully worked with */
  knownAgencies: string[];
  /** Size constraints: max team FTE we can reasonably deploy */
  maxDeliveryFTE: number;
  /** Geographic coverage */
  primaryJurisdiction: 'HK';
  secondaryJurisdiction: 'SG';
  /** Current scoring weights (adjustable by FeedbackLearningAgent) */
  scoringWeights: {
    capabilityFit: {
      categoryMatch: number;      // default 0.35
      agencyFamiliarity: number;  // default 0.15
      deliveryScale: number;      // default 0.20
      keywordOverlap: number;     // default 0.20
      geographicFit: number;      // default 0.10
    };
    businessPotential: {
      budget: number;             // default 0.30
      budgetProxy: number;        // default 0.15
      strategicBeachhead: number; // default 0.20
      categoryGrowth: number;     // default 0.15
      timeToDeadline: number;     // default 0.10
      recurrencePotential: number;// default 0.10
    };
    overallWeights: {
      capabilityFit: number;      // default 0.55
      businessPotential: number;  // default 0.45
    };
  };
  /** version used for scoring_version tracking */
  version: string;
}

export interface TenderEvaluatorInput {
  /** Tenders with evaluation_status = 'pending' or 're_evaluate' */
  tenders: Array<{
    tender_id: string;
    jurisdiction: string;
    owner_type: string;
    title: string;
    agency: string | null;
    category_tags: string[];
    closing_date: string | null;
    status: string;
    budget_min: number | null;
    budget_max: number | null;
    budget_source: string;
    description_snippet: string | null;
    source_type?: string;         // open_tender / quotation (affects budget proxy)
  }>;
  capabilityProfile: CompanyCapabilityProfile;
}

export interface TenderEvaluation {
  tender_id: string;
  capability_fit_score: number;
  business_potential_score: number;
  overall_relevance_score: number;
  label: 'Priority' | 'Consider' | 'Partner-only' | 'Ignore';
  rationale: string;            // 2–3 sentences
  signals_used: {
    capability_fit: {
      category_match: number;
      agency_familiarity: number;
      delivery_scale: number;
      keyword_overlap: number;
      geographic_fit: number;
    };
    business_potential: {
      budget: number;
      budget_proxy: number;
      strategic_beachhead: number;
      category_growth: number;
      time_to_deadline: number;
      recurrence_potential: number;
    };
  };
  scoring_weights: CompanyCapabilityProfile['scoringWeights'];
  model_used: string;
  evaluated_at: string;
  scoring_version: string;
}

export interface TenderEvaluatorOutput {
  evaluations: TenderEvaluation[];
  errors: Array<{ tender_id: string; error: string }>;
}

/**
 * IMPLEMENTATION NOTES
 *
 * CAPABILITY FIT SCORING (sub-scores, 0–1 each, then weighted):
 *
 * categoryMatch (weight 0.35):
 *   - Map tender's category_tags to our competencies
 *   - Full match (e.g. both have "events_experiential"): 1.0
 *   - Adjacent match (e.g. "marketing_comms" vs "consultancy_advisory"): 0.5
 *   - No match: 0.0
 *
 * agencyFamiliarity (weight 0.15):
 *   - tender.agency in capabilityProfile.knownAgencies: 1.0
 *   - Not known: 0.0
 *
 * deliveryScale (weight 0.20):
 *   - Estimate FTE required from category + budget proxy
 *   - ≤ maxDeliveryFTE: 1.0
 *   - 1.5× maxDeliveryFTE: 0.5 (Partner-only signal)
 *   - >2× maxDeliveryFTE: 0.0
 *
 * keywordOverlap (weight 0.20):
 *   - Intersect words in title+description_snippet with trackRecordKeywords
 *   - overlap_ratio = matching_words / max(title_words, min_threshold)
 *   - Score = min(overlap_ratio × 3, 1.0) (amplified, capped at 1.0)
 *
 * geographicFit (weight 0.10):
 *   - jurisdiction matches primaryJurisdiction (HK): 1.0
 *   - jurisdiction matches secondaryJurisdiction (SG): 0.7
 *   - Other: 0.3
 *
 * BUSINESS POTENTIAL SCORING (sub-scores, 0–1 each, then weighted):
 *
 * budget (weight 0.30) — only when budget_source='stated':
 *   - HK: >HK$500k: 1.0 | HK$100k-500k: 0.6 | <HK$50k: 0.2
 *   - SG: >SGD$100k: 1.0 | SGD$30k-100k: 0.6 | <SGD$20k: 0.2
 *   - If budget null or unknown: use budgetProxy signal instead (this signal = 0)
 *
 * budgetProxy (weight 0.15) — used when budget not stated:
 *   - Open tender (vs. quotation) → HK threshold >HK$1.4M: 0.9
 *   - Large government agency: 0.7
 *   - Small department or one-off: 0.3
 *
 * strategicBeachhead (weight 0.20):
 *   - Agency NOT in knownAgencies → new relationship opportunity: 0.8
 *   - Already known agency → less beachhead value but lower risk: 0.4
 *
 * categoryGrowth (weight 0.15):
 *   - Categories with growing government spend (IT, digital transformation, events): 0.9
 *   - Stable categories: 0.5
 *   - Declining or very competitive categories: 0.2
 *
 * timeToDeadline (weight 0.10):
 *   - closing_date null: 0.3
 *   - >30 days: 1.0
 *   - 14–30 days: 0.7
 *   - 7–13 days: 0.4
 *   - <7 days: 0.1
 *
 * recurrencePotential (weight 0.10):
 *   - Keywords in title: "framework", "annual", "multi-year", "panel", "standing offer": 0.9
 *   - One-off / project-based signals: 0.3
 *   - Unknown: 0.5
 *
 * OVERALL FORMULA:
 *   overall = (capability_fit × 0.55) + (business_potential × 0.45)
 *
 * LABEL ASSIGNMENT:
 *   ≥ 0.70 → Priority
 *   0.50–0.69 → Consider
 *   0.35–0.49 → Partner-only  (also triggered if deliveryScale < 0.5)
 *   < 0.35 → Ignore
 *
 * RATIONALE GENERATION (DeepSeek):
 *   Prompt: "Given these scores and signals, write 2-3 sentences explaining why this tender
 *   scored {label}. Mention the top 2 positive signals and the top 1 concern."
 *   Input: all signals_used values + label + tender title + agency + category_tags
 *   Output: plain English rationale string
 *
 * DEEPSEEK PROMPT STRUCTURE:
 *   system: "You are a tender evaluation assistant for a digital marketing and events agency
 *            in Hong Kong. You evaluate government tenders for relevance."
 *   user: JSON object with tender details + computed sub-scores + profile
 *   → extract: rationale string (2–3 sentences), confirm label
 */

export class TenderEvaluatorAgent {
  readonly name = 'TenderEvaluatorAgent';
  readonly model = 'deepseek-reasoner';
  readonly fallbackModel = 'claude-haiku-4-5-20251001';
  readonly schedule = '0 4 * * *';
  readonly timezone = 'Asia/Hong_Kong';

  async run(_input: TenderEvaluatorInput): Promise<TenderEvaluatorOutput> {
    throw new Error('TenderEvaluatorAgent: not yet implemented. See DESIGN.md §4 for full spec.');
  }
}
