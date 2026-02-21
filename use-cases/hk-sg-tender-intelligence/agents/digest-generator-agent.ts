/**
 * DigestGeneratorAgent
 *
 * Role: Compile and deliver the daily tender digest — a ranked shortlist of
 *       today's most relevant HK and SG tenders, with narrative summary and
 *       quick-action buttons for founder interaction.
 *
 * Cadence: Daily 08:00 HKT — after evaluation completes.
 *          Registered as "tender-intel:digest"
 *
 * Model: DeepSeek Reasoner — for narrative generation only.
 *        Ranking is purely algorithmic (done in evaluation stage).
 */

export interface DigestGeneratorInput {
  today: string;  // ISO date string e.g. "2026-02-21"

  /** Tenders scored today with evaluation_status=scored and status=open */
  scoredTenders: Array<{
    tender_id: string;
    jurisdiction: 'HK' | 'SG';
    title: string;
    agency: string | null;
    tender_ref: string | null;
    closing_date: string | null;
    budget_min: number | null;
    budget_max: number | null;
    currency: string | null;
    budget_source: string;
    category_tags: string[];
    source_url: string;
    overall_relevance_score: number;
    label: 'Priority' | 'Consider' | 'Partner-only' | 'Ignore';
    rationale: string;
  }>;

  /** Tender IDs already surfaced in past 7 days (avoid repeating) */
  recentlySurfacedIds: string[];

  /** Tenders closing within 7 days that are still open and tracked */
  closingSoonTenders: Array<{
    tender_id: string;
    title: string;
    agency: string | null;
    closing_date: string;
    label: string;
    days_remaining: number;
  }>;

  /** Source health summary from today's ingestion */
  sourceHealth: {
    active: number;
    failed: number;
    issues: Array<{ source_id: string; issue: string }>;
  };
}

export interface DigestEntry {
  rank: number;
  tender_id: string;
  label: 'Priority' | 'Consider' | 'Partner-only' | 'Ignore';
  score: number;
  title: string;
  agency: string | null;
  tender_ref: string | null;
  closing_date: string | null;
  days_to_close: number | null;
  budget_display: string;     // e.g. "~HK$1.2M (estimated)" or "Budget not stated"
  category_tags: string[];
  rationale: string;
  source_url: string;
  // Actions available in UI
  actions: Array<'track' | 'ignore' | 'assign_to_team' | 'partner_only' | 'not_for_us'>;
}

export interface DigestGeneratorOutput {
  digest_date: string;
  narrative_summary: string;       // 1–2 para AI-generated overview of today's tender landscape
  hk_tenders: DigestEntry[];       // Top HK tenders, sorted by score descending
  sg_tenders: DigestEntry[];       // Top SG tenders, sorted by score descending
  closing_soon: Array<{
    tender_id: string;
    title: string;
    agency: string | null;
    closing_date: string;
    days_remaining: number;
    label: string;
  }>;
  stats: {
    new_tenders_total: number;
    hk_count: number;
    sg_count: number;
    sources_active: number;
    sources_failed: number;
    source_issues: string[];
  };
}

/**
 * IMPLEMENTATION NOTES
 *
 * 1. FILTERING
 *    - Exclude tenders already surfaced in the past 7 days (recentlySurfacedIds)
 *    - Exclude tenders with label=Ignore (they are logged but not shown in digest)
 *    - Include closing_soon tenders even if previously surfaced (they need repeated alerts)
 *
 * 2. RANKING
 *    - Sort by overall_relevance_score descending within each jurisdiction
 *    - HK section: top 10 (or fewer if <10 scored today)
 *    - SG section: top 10 (or fewer)
 *    - Within same score: sort by closing_date ascending (closer deadline first)
 *
 * 3. BUDGET DISPLAY FORMAT
 *    - budget_source=stated: "HK$1,200,000"
 *    - budget_source=estimated/proxy: "~HK$500k (estimated)"
 *    - budget_source=unknown: "Budget not stated"
 *    - null budget: "Budget not stated"
 *
 * 4. NARRATIVE GENERATION (DeepSeek)
 *    System prompt: "You are a senior tender intelligence analyst for a HK digital marketing
 *    and events agency. Write a concise 1-2 paragraph daily overview of today's government
 *    tender landscape based on the tenders found. Mention any notable themes, high-value
 *    opportunities, unusual patterns, or important deadlines. Be factual and brief."
 *
 *    Input to model: list of top 10 HK + top 10 SG tenders (title, agency, label, rationale,
 *    closing_date), source health summary, date
 *
 *    Output: narrative_summary string (1–2 paragraphs, ~150–250 words)
 *
 * 5. ACTIONS AVAILABLE
 *    - All tenders: ['track', 'ignore', 'partner_only', 'not_for_us']
 *    - Priority tenders: additionally ['assign_to_team']
 *
 * 6. DELIVERY
 *    a. Write to daily_digests table
 *    b. Emit in-app notification (dashboard tab refresh)
 *    c. If RESEND_API_KEY configured: send email using existing Resend integration
 *       Subject: "HK+SG Tender Daily Digest · {date} · {N} Priority tenders"
 *
 * 7. FOUNDER RESPONSE PROCESSING (separate flow, same use case)
 *    When founder clicks an action button in the UI:
 *    - POST /api/tender-intel/decision { tender_id, action, notes? }
 *    - Creates a tender_decisions record
 *    - If action=track: marks tender for qualification pipeline
 *    - If action=ignore or not_for_us: feeds into FeedbackLearningAgent queue
 *    - Frontend optimistically updates the button state
 */

export class DigestGeneratorAgent {
  readonly name = 'DigestGeneratorAgent';
  readonly model = 'deepseek-reasoner';
  readonly schedule = '0 8 * * *';
  readonly timezone = 'Asia/Hong_Kong';

  async run(_input: DigestGeneratorInput): Promise<DigestGeneratorOutput> {
    throw new Error('DigestGeneratorAgent: not yet implemented. See DESIGN.md §5 for full spec.');
  }
}
