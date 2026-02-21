/**
 * RSSXMLIngestorAgent
 *
 * Role: Fetch and parse all RSS/XML format sources from the source registry.
 *       Produces raw capture records for each new tender item found.
 *
 * Cadence: Daily 03:00 HKT — first step in the daily ingestion pipeline.
 *          Registered as "tender-intel:daily-ingestion" (grouped with HTML + CSV ingestors)
 *
 * Model: NONE — pure parsing, no LLM needed.
 *        Exception: If parsing fails and raw content is ambiguous, Claude Haiku
 *        may be called to extract key fields from malformed XML.
 */

export interface RSSXMLIngestorInput {
  /** All active sources with source_type = 'rss_xml' */
  sources: Array<{
    source_id: string;
    name: string;
    feed_url: string;
    jurisdiction: string;
    owner_type: string;
    field_map: Record<string, string>;  // source-specific field → standard field name
    parsing_notes?: string;             // e.g. "extract tender_ref from title with regex"
    priority: number;
  }>;
  /** Existing item GUIDs / URLs in raw_tender_captures (for dedup) */
  existingGuids: Set<string>;
}

export interface RSSXMLIngestorOutput {
  rawCaptures: Array<{
    source_id: string;
    raw_format: 'rss_xml';
    raw_payload: string;          // Full <item> or <entry> XML string
    item_url: string;
    item_guid: string;
    captured_at: string;
    normalised: false;
    // Pre-extracted fields to speed up normalisation (best-effort, may be null)
    pre_extracted?: {
      title?: string;
      publish_date?: string;
      description?: string;
    };
  }>;
  sourceSummary: Array<{
    source_id: string;
    status: 'success' | 'fetch_error' | 'parse_error' | 'no_new_items';
    newItemsFound: number;
    errorDetail?: string;
  }>;
}

/**
 * IMPLEMENTATION NOTES
 *
 * For each source in input.sources:
 *
 * 1. Fetch the RSS/XML URL (GET request, timeout 15s)
 *    - On HTTP error: record status=fetch_error, update source registry last_status_detail, continue
 *
 * 2. Parse XML:
 *    - RSS 2.0: root <rss><channel><item> elements
 *    - Atom: root <feed><entry> elements
 *    - Custom XML: use source.field_map to navigate structure
 *
 * 3. For each item:
 *    a. Extract guid (prefer <guid>, fall back to <link>, fall back to hash(title+pubDate))
 *    b. Check if guid exists in existingGuids → skip if found (dedup)
 *    c. If new: capture full item XML as raw_payload
 *    d. Best-effort pre-extraction of title, pubDate, link for speed
 *
 * 4. Handle pagination:
 *    - Check for <link rel="next"> or similar pagination
 *    - If this is first ever run for source (no existing guids): follow up to 10 pages
 *    - If incremental: assume new items at top, stop after first page with all-known guids
 *
 * 5. HK-specific parsing rules:
 *    - GLD ETB XML: look for gld: namespace fields (gld:tender_ref, gld:closing_date, gld:department)
 *    - EMSD RSS: title contains tender_ref inline — store raw, let TenderNormalizerAgent extract
 *    - DSD RSS: standard RSS; links point to dept detail pages
 *    - ArchSD RSS: standard RSS
 *
 * 6. SG-specific:
 *    - GeBIZ RSS (if/when available): category field → procurement_category
 *
 * 7. Error handling:
 *    - Malformed XML (parse error): log first 500 chars of raw response, mark parse_error
 *    - Partial parse (some items failed): continue, count failures in sourceSummary
 *    - Timeout: mark fetch_error; do NOT retry — daily cadence is the retry
 *
 * Field mapping examples (from source-registry-seed.json field_map):
 * {
 *   "tender_ref":   "Tender Reference",    // GLD ETB XML column name
 *   "title":        "Subject",
 *   "agency":       "Requisitioning / Issuing Department",
 *   "closing_date": "Closing Date"
 * }
 */

export class RSSXMLIngestorAgent {
  readonly name = 'RSSXMLIngestorAgent';
  readonly model = 'none';  // No LLM needed
  readonly schedule = '0 3 * * *';
  readonly timezone = 'Asia/Hong_Kong';

  async run(_input: RSSXMLIngestorInput): Promise<RSSXMLIngestorOutput> {
    throw new Error('RSSXMLIngestorAgent: not yet implemented. See DESIGN.md §3 for full spec.');
  }
}
