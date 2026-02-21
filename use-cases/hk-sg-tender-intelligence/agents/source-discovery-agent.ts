/**
 * SourceDiscoveryAgent
 *
 * Role: Crawl known hub pages to discover new RSS/XML feeds and HTML tender
 *       listing pages. Maintains the source registry by finding new sources
 *       and flagging broken or changed ones.
 *
 * Cadence: Weekly — Sunday 02:00 HKT
 *          Registered in schedule-registry.js as "tender-intel:source-discovery"
 *
 * Model: Claude Haiku (HTML parsing + link extraction — no heavy reasoning needed)
 *
 * Pipeline position: UPSTREAM of all ingestion. Must run before RSSXMLIngestorAgent
 *                    on the first week; thereafter runs in parallel on weekly cycle.
 */

import type { SourceRegistryEntry } from '../workflows/types';

// ─── Input ───────────────────────────────────────────────────────────────────

export interface SourceDiscoveryInput {
  /** Hub pages to scan for new RSS feeds / tender sections. Sourced from seed JSON. */
  hubPages: Array<{
    hub_id: string;
    url: string;
    scan_method: 'extract_all_rss_links' | 'extract_all_rss_links_filter_by_keywords' | 'extract_department_tender_links' | 'hub_page_scan';
    keywords: string[];
  }>;
  /** All currently registered source_ids (to diff against new discoveries) */
  existingSourceIds: string[];
  /** Active sources that had errors recently — re-attempt these */
  brokenSourceIds: string[];
}

// ─── Output ──────────────────────────────────────────────────────────────────

export interface SourceDiscoveryOutput {
  /** New candidate URLs not yet in registry — pass to SourceValidatorAgent */
  newCandidateUrls: string[];
  /** Hub sub-feeds found (e.g. DSD has multiple RSS URLs on one hub page) */
  hubSubFeeds: Array<{ hub_id: string; feed_url: string; feed_title: string }>;
  /** Previously broken sources that are now responding */
  recoveredSourceIds: string[];
  /** Sources that are still unreachable */
  stillBrokenSourceIds: string[];
  /** Run metadata */
  meta: {
    hubsScanned: number;
    totalLinksFound: number;
    newCandidatesFound: number;
    runAt: string;
  };
}

// ─── Agent Logic (to be implemented) ─────────────────────────────────────────

/**
 * IMPLEMENTATION NOTES
 *
 * 1. For each hub in input.hubPages:
 *    a. Fetch the HTML page (respect robots.txt)
 *    b. Extract all <link type="application/rss+xml"> elements
 *    c. Extract all href values matching .xml, .rss patterns
 *    d. If scan_method includes "filter_by_keywords":
 *       - Only keep links whose surrounding text or <title> contains a keyword
 *       - Keywords: tender, procurement, quotation, EOI, 招標, 招募, bidding
 *    e. If scan_method is "extract_department_tender_links":
 *       - Extract all href values pointing to dept sub-pages
 *       - These become html_list candidates, not RSS candidates
 *
 * 2. Diff found URLs against existingSourceIds
 *
 * 3. For each previously broken source:
 *    a. Attempt HEAD request
 *    b. If HTTP 200 → add to recoveredSourceIds
 *    c. If still failing → add to stillBrokenSourceIds
 *
 * 4. Return all new candidates for SourceValidatorAgent to process
 *
 * KNOWN HUBS (from source-registry-seed.json):
 * - https://www.gov.hk/en/about/rss.htm              (GovHK RSS directory)
 * - https://www.fstb.gov.hk/tb/en/business/gov_procurement/tender-notices.htm
 * - https://www.dsd.gov.hk/EN/RSS_Feeds/index.html
 * - https://www.rvd.gov.hk/en/RSS/index.html
 * - https://www.archsd.gov.hk/en/rss-feeds.html
 */

export class SourceDiscoveryAgent {
  readonly name = 'SourceDiscoveryAgent';
  readonly model = 'claude-haiku-4-5-20251001';
  readonly schedule = '0 2 * * 0'; // Sunday 02:00 HKT
  readonly timezone = 'Asia/Hong_Kong';

  async run(_input: SourceDiscoveryInput): Promise<SourceDiscoveryOutput> {
    throw new Error('SourceDiscoveryAgent: not yet implemented. See DESIGN.md §2 for full spec.');
  }
}
