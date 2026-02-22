/**
 * SourceValidatorAgent
 *
 * Role: Validate and classify each candidate source URL into the Source Registry
 *       schema. Called per-candidate by SourceDiscoveryAgent.
 *
 * Cadence: On-demand (triggered by SourceDiscoveryAgent)
 *
 * Model: Claude Haiku (structured classification output)
 */

export interface SourceValidatorInput {
  candidateUrl: string;
  /** Optional: surrounding context text from the hub page that linked to this URL */
  contextText?: string;
}

export interface SourceValidatorOutput {
  isValid: boolean;
  rejectionReason?: string; // e.g. "login_required", "not_tender_related", "robots_disallowed"

  // Only populated when isValid = true
  sourceEntry?: {
    source_id: string;              // auto-generated: {jurisdiction}-{org_slug}-{format}
    name: string;
    owner_type: 'gov' | 'public_org' | 'ngo' | 'multilateral' | 'other';
    jurisdiction: string;           // HK / SG / EU / US / other
    source_type: 'rss_xml' | 'api_json' | 'csv_open_data' | 'html_list';
    access: 'public' | 'login_required';
    feed_url: string;
    reliability_score: number;      // 0–1
    estimated_update_pattern: 'daily' | 'weekly' | 'irregular' | 'unknown';
    legal_notes: string;
    category_tags_default: string[];
    // For html_list sources: initial scraping config (may need refinement)
    scraping_config?: object;
    status: 'active' | 'pending_validation';
    tags: string[];
  };
}

/**
 * IMPLEMENTATION NOTES
 *
 * Validation sequence:
 * 1. Reachability: HEAD request → HTTP 200?
 *    - 403/401 → isValid=false, rejectionReason="login_required"
 *    - 404/500 → isValid=false, rejectionReason="unreachable"
 *    - Timeout → isValid=false, rejectionReason="timeout"
 *
 * 2. robots.txt check: fetch /{domain}/robots.txt
 *    - If Disallow matches the candidate path → isValid=false, rejectionReason="robots_disallowed"
 *    - Store result in legal_notes regardless
 *
 * 3. Format detection: GET request (first 2000 bytes)
 *    - Content-Type application/rss+xml or application/xml → source_type=rss_xml
 *    - Content-Type text/csv → source_type=csv_open_data
 *    - application/json → source_type=api_json
 *    - text/html → source_type=html_list (needs scraping_config)
 *    - First bytes contain <?xml or <rss or <feed → treat as rss_xml regardless of Content-Type
 *
 * 4. Content relevance check (use Haiku for NLP):
 *    - Does content contain: tender, procurement, quotation, EOI, 招標, bid, RFP, grant, opportunity?
 *    - If no keywords → isValid=false, rejectionReason="not_tender_related"
 *
 * 5. Owner type inference from domain:
 *    - *.gov.hk / *.gov.sg / *.gov.* → gov
 *    - *.edu.hk / *.edu.sg → public_org
 *    - Known statutory bodies (MTR, KCRC, HKHA) → public_org
 *    - Known NGO patterns → ngo
 *    - UN/EU/World Bank domains → multilateral
 *    - Otherwise → other (or use contextText + Haiku to infer)
 *
 * 6. For html_list: generate initial scraping_config using Haiku
 *    - Pass first 3000 chars of HTML to Haiku
 *    - Ask: "What CSS selector identifies the repeating tender row? What selectors map to title, ref, date, agency, link?"
 *    - Output as scraping_config JSONB (will be refined by HTMLScraperAgent on first live run)
 *
 * 7. Reliability score heuristics:
 *    - HTTP 200 consistently: +0.5
 *    - Has structured format (XML/RSS vs HTML): +0.2
 *    - Government domain: +0.1
 *    - Has guid/stable IDs (for dedup): +0.1
 *    - Update pattern determinable: +0.1
 */

export class SourceValidatorAgent {
  readonly name = 'SourceValidatorAgent';
  readonly model = 'claude-haiku-4-5-20251001';

  async run(_input: SourceValidatorInput): Promise<SourceValidatorOutput> {
    throw new Error('SourceValidatorAgent: not yet implemented. See DESIGN.md §2 for full spec.');
  }
}
