/**
 * HTMLScraperAgent
 *
 * Role: Scrape HTML list pages for sources that have no RSS/XML feed.
 *       Uses scraping_config (CSS selectors) stored per source in the registry.
 *       Produces raw capture records for each new tender row/card found.
 *
 * Cadence: Daily 03:00 HKT — runs in parallel with RSSXMLIngestorAgent
 *
 * Model: Claude Haiku — ONLY for edge cases:
 *        1. When field extraction requires NLP (e.g. tender_ref embedded in free text)
 *        2. When scraping_config produces no results and re-classification is needed
 *        3. When generating initial scraping_config for a newly discovered html_list source
 *
 * Primary sources:
 *   - sg-gebiz-public-listing (GeBIZ Business Opportunities)
 *   - hk-fstb-tender-hub (FSTB dept links — discovery mode)
 *   - hk-hyd-tender-list (HyD, after first-run discovery)
 *   - Any other html_list sources added to registry
 */

export interface HTMLScraperInput {
  /** All active sources with source_type = 'html_list' */
  sources: Array<{
    source_id: string;
    name: string;
    base_url: string;
    jurisdiction: string;
    owner_type: string;
    scraping_config: {
      list_selector: string;
      field_map: Record<string, string>;  // field_name → CSS selector or regex
      date_format?: string;               // e.g. "DD/MM/YYYY"
      pagination?: {
        type: 'next_link' | 'page_param' | 'none';
        selector?: string;
        param_name?: string;
      };
    };
    priority: number;
  }>;
  /** Existing (source_url + tender_ref) combos in raw_tender_captures (for dedup) */
  existingKeys: Set<string>;
}

export interface HTMLScraperOutput {
  rawCaptures: Array<{
    source_id: string;
    raw_format: 'html_fragment';
    raw_payload: string;    // HTML of the tender row/card
    item_url: string;
    item_guid: string;      // Constructed as: source_id + ':' + tender_ref (or title_hash)
    captured_at: string;
    normalised: false;
    pre_extracted?: {
      title?: string;
      tender_ref?: string;
      closing_date?: string;
      agency?: string;
    };
  }>;
  structureChangedAlerts: Array<{
    source_id: string;
    url: string;
    message: string;        // "list_selector returned 0 rows — layout may have changed"
  }>;
  sourceSummary: Array<{
    source_id: string;
    status: 'success' | 'fetch_error' | 'structure_changed' | 'no_new_items';
    newItemsFound: number;
    pagesScraped: number;
    errorDetail?: string;
  }>;
}

/**
 * IMPLEMENTATION NOTES
 *
 * For each source in input.sources:
 *
 * 1. Fetch the HTML page (GET, timeout 20s, 2-second delay between pages on same domain)
 *    - Set User-Agent to a descriptive string (e.g. "TenderIntelBot/1.0 daily-once")
 *
 * 2. Apply list_selector to find all tender rows/cards
 *    - If 0 rows found → structureChangedAlert, skip source, do not error the whole run
 *
 * 3. For each row:
 *    a. Extract fields using field_map selectors
 *    b. For "@href" selectors: extract the href attribute value from matched element
 *    c. Parse closing_date using source's date_format (default: try ISO, then DD/MM/YYYY, then MM/DD/YYYY)
 *    d. Construct item_guid: "{source_id}:{tender_ref}" if tender_ref exists, else "{source_id}:{hash(title)}"
 *    e. Check item_guid against existingKeys → skip if already captured
 *    f. Capture full row HTML as raw_payload
 *
 * 4. Pagination:
 *    - type=next_link: find selector → if href exists, fetch next page, repeat
 *    - type=page_param: increment page param until no new rows found
 *    - Stop pagination when: all items on page are known-guids (already captured)
 *    - Max pages per source per run: 5 (configurable)
 *
 * 5. Politeness:
 *    - 2-second delay between requests to the SAME domain
 *    - No delay needed between different domains
 *
 * 6. GeBIZ-specific notes (sg-gebiz-public-listing):
 *    - Entry URL: https://www.gebiz.gov.sg/ptn/opportunity/BOListing.xhtml
 *    - Uses paginated table — follow pagination
 *    - Date format: typically DD/MM/YYYY or YYYY-MM-DD
 *    - tender_ref column contains ITQ-/ITT- prefixed reference
 *    - Agency in separate column
 *
 * 7. NLP fallback (Claude Haiku):
 *    - Only invoke when: field in field_map is marked as "nlp_extract" (not a CSS selector)
 *    - Pass row HTML + field description to Haiku → extract structured field
 *    - Example: tender_ref embedded in free-text title like "Request for quotation - IT support 2026/Q1"
 *    - Cost implication: counted per-row, so only apply to sources that truly need it
 *
 * 8. Structure change recovery:
 *    - On structureChangedAlert: set source registry last_status_detail="structure_changed"
 *    - SourceDiscoveryAgent will re-validate this source on next weekly run
 *    - Do NOT attempt to auto-generate new scraping_config in this agent (risk of bad config)
 */

export class HTMLScraperAgent {
  readonly name = 'HTMLScraperAgent';
  readonly model = 'claude-haiku-4-5-20251001'; // Only for NLP edge cases
  readonly schedule = '0 3 * * *';
  readonly timezone = 'Asia/Hong_Kong';

  async run(_input: HTMLScraperInput): Promise<HTMLScraperOutput> {
    throw new Error('HTMLScraperAgent: not yet implemented. See DESIGN.md §3 for full spec.');
  }
}
