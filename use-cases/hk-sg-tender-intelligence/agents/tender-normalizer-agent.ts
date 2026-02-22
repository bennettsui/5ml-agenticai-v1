/**
 * TenderNormalizerAgent
 *
 * Role: Transform raw capture records into the unified Tender model.
 *       Bridges the raw layer (source-specific formats) and the normalised layer
 *       (unified schema used by all downstream agents).
 *
 * Cadence: Daily — runs after RSSXMLIngestorAgent, HTMLScraperAgent, CSVIngestorAgent complete.
 *          Chained via the daily-ingestion orchestrator.
 *
 * Model: Claude Haiku — for NLP-based field extraction when deterministic rules fail.
 *        (Most cases are deterministic mapping rules — no LLM needed.)
 */

export interface TenderNormalizerInput {
  /** All raw captures with normalised = false */
  rawCaptures: Array<{
    capture_id: string;
    source_id: string;
    raw_format: 'rss_xml' | 'html_fragment' | 'csv_row' | 'api_json';
    raw_payload: string;
    item_url: string;
    item_guid: string;
    captured_at: string;
    pre_extracted?: Record<string, string | null>;
  }>;
  /** Source registry entries (for context: owner_type, jurisdiction, field_map) */
  sourceRegistry: Record<string, {
    owner_type: string;
    jurisdiction: string;
    source_type: string;
    field_map?: Record<string, string>;
    parsing_notes?: string;
    category_tags_default: string[];
  }>;
}

export interface NormalisedTender {
  // Identity & Provenance
  source_id: string;
  raw_pointer: string;          // capture_id
  jurisdiction: string;
  owner_type: string;
  source_url: string;
  mapping_version: string;      // e.g. "v1.0"

  // Content & Classification
  tender_ref: string | null;
  title: string;
  description_snippet: string | null;
  agency: string | null;
  category_tags: string[];
  raw_category: string | null;

  // Time & Status
  publish_date: string | null;  // ISO date string or null
  publish_date_estimated: boolean;
  closing_date: string | null;
  status: 'open' | 'closed' | 'unknown_closing';

  // Money & Scale
  budget_min: number | null;
  budget_max: number | null;
  currency: string | null;
  budget_source: 'stated' | 'proxy' | 'unknown';

  // Deduplication
  is_canonical: boolean;        // default true; DeduplicationAgent may change to false

  // Evaluation (populated by TenderEvaluatorAgent later)
  evaluation_status: 'pending';
  label: 'unscored';
}

export interface TenderNormalizerOutput {
  normalisedTenders: NormalisedTender[];
  skipped: Array<{
    capture_id: string;
    reason: string;  // e.g. "missing_title", "past_closing_date", "duplicate_tender_ref"
  }>;
  processedCaptureIds: string[];  // Mark these as normalised=true in raw layer
}

/**
 * IMPLEMENTATION NOTES
 *
 * For each raw capture:
 *
 * 1. Look up source in sourceRegistry → get owner_type, jurisdiction, field_map, category_tags_default
 *
 * 2. Parse raw_payload according to raw_format:
 *    - rss_xml: parse XML, use field_map to navigate elements
 *    - html_fragment: use pre_extracted fields if available, else fallback to simple text extraction
 *    - csv_row: split by comma/tab (or JSON parse if pre-serialised), map columns by index or header name
 *    - api_json: JSON.parse + field_map navigation
 *
 * 3. Date normalisation:
 *    - Input formats: RFC 822 (RSS pubDate), DD/MM/YYYY (HK HTML), ISO 8601
 *    - Output: ISO date string YYYY-MM-DD
 *    - If parse fails: leave null, set publish_date_estimated=true for publish_date
 *    - If closing_date parse fails: set status=unknown_closing
 *
 * 4. Status determination:
 *    - closing_date in past → status=closed
 *    - closing_date in future → status=open
 *    - closing_date null → status=unknown_closing
 *
 * 5. Tender ref extraction:
 *    - Direct field from field_map
 *    - Regex from title (source.parsing_notes may specify pattern)
 *    - EMSD pattern: /^([A-Z]+\([A-Z]\)\d+\/\d{4})/
 *    - GLD pattern: standard column "Tender Reference"
 *    - If not found: generate synthetic = source_id.slice(0,6) + '-' + hash(title).slice(0,8)
 *
 * 6. Category taxonomy mapping:
 *    - Start with source.category_tags_default (e.g. ["construction_works"] for ArchSD)
 *    - Then try to map raw_category → canonical tag via lookup table
 *    - Finally run NLP keyword scan on title if still no tags (Haiku only if needed)
 *
 *    CANONICAL TAXONOMY:
 *    IT_digital · events_experiential · marketing_comms · consultancy_advisory ·
 *    construction_works · facilities_management · social_services · research_study ·
 *    supplies_procurement · financial_services · grant_funding · other
 *
 * 7. Agency inference:
 *    - From explicit field (most sources have this)
 *    - From source name if not in content (e.g. EMSD RSS → "Electrical and Mechanical Services Department")
 *
 * 8. Budget extraction:
 *    - Rare in public listing metadata; mostly null for HK/SG sources
 *    - If present: parse number + currency → budget_min=budget_max=value, budget_source=stated
 *    - If not present: leave null, budget_source=unknown
 *    - Proxy heuristics are applied by TenderEvaluatorAgent, not here
 *
 * 9. Missing field handling:
 *    - title: REQUIRED. If missing, skip with reason="missing_title"
 *    - closing_date: not required; set status=unknown_closing
 *    - publish_date: use captured_at as proxy, set publish_date_estimated=true
 *    - tender_ref: generate synthetic (see step 5)
 *    - agency: use source name as fallback
 *    - description: leave null (evaluation works on title+tags)
 *
 * 10. Mapping version:
 *     Increment when normalisation rules change significantly, to allow reprocessing.
 *     Format: "v{major}.{minor}" — e.g. "v1.0", "v1.1"
 */

export class TenderNormalizerAgent {
  readonly name = 'TenderNormalizerAgent';
  readonly model = 'claude-haiku-4-5-20251001'; // Only for NLP field extraction fallback

  async run(_input: TenderNormalizerInput): Promise<TenderNormalizerOutput> {
    throw new Error('TenderNormalizerAgent: not yet implemented. See DESIGN.md §3 for full spec.');
  }
}
