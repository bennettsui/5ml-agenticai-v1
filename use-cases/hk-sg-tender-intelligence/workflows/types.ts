/**
 * Shared type definitions for the HK+SG Tender Intelligence Layer.
 * These types are used across agents and the orchestration layer.
 */

// ─── Source Registry ─────────────────────────────────────────────────────────

export type OwnerType = 'gov' | 'public_org' | 'ngo' | 'multilateral' | 'other';
export type SourceType = 'rss_xml' | 'api_json' | 'csv_open_data' | 'html_list' | 'html_hub' | 'html_reference';
export type SourceAccess = 'public' | 'login_required';
export type SourceStatus = 'active' | 'deprecated' | 'broken' | 'format_changed' | 'pending_validation' | 'deferred' | 'stage_2_only' | 'reference_only';
export type UpdatePattern = 'daily' | 'weekly' | 'irregular' | 'unknown';

export interface ScrapingConfig {
  list_selector: string;
  field_map: Record<string, string>;
  date_format?: string;
  pagination?: {
    type: 'next_link' | 'page_param' | 'none';
    selector?: string;
    param_name?: string;
    max_pages?: number;
  };
  note?: string;
}

export interface SourceRegistryEntry {
  source_id: string;
  name: string;
  organisation?: string;
  owner_type: OwnerType;
  jurisdiction: string;
  source_type: SourceType;
  access: SourceAccess;
  priority: 1 | 2 | 3;
  status: SourceStatus;
  discovery_hub_url?: string;
  base_url?: string;
  feed_url?: string | null;
  feed_url_note?: string;
  ingest_method?: string;
  update_pattern: UpdatePattern;
  update_times_hkt?: string[];
  fields_in_source?: string[];
  field_map?: Record<string, string>;
  parsing_notes?: string;
  scraping_config?: ScrapingConfig;
  category_tags_default: string[];
  legal_notes: string;
  reliability_score?: number;
  tags: string[];
  notes?: string;
  last_checked_at?: string;
  last_status_detail?: string;
  created_at?: string;
  updated_at?: string;
}

// ─── Tenders ─────────────────────────────────────────────────────────────────

export type TenderStatus = 'open' | 'closed' | 'awarded' | 'cancelled' | 'unknown_closing';
export type EvaluationStatus = 'pending' | 'scored' | 're_evaluate';
export type TenderLabel = 'Priority' | 'Consider' | 'Partner-only' | 'Ignore' | 'unscored';
export type BudgetSource = 'stated' | 'estimated' | 'proxy' | 'unknown';

export interface Tender {
  tender_id: string;
  source_id: string;
  source_references: string[];
  raw_pointer: string;
  jurisdiction: string;
  owner_type: OwnerType;
  source_url: string;
  mapping_version: string;

  tender_ref: string | null;
  title: string;
  description_snippet: string | null;
  agency: string | null;
  category_tags: string[];
  raw_category: string | null;

  publish_date: string | null;
  publish_date_estimated: boolean;
  closing_date: string | null;
  status: TenderStatus;
  first_seen_at: string;
  last_seen_at: string;

  budget_min: number | null;
  budget_max: number | null;
  currency: string | null;
  budget_source: BudgetSource;

  is_canonical: boolean;
  canonical_tender_id: string | null;

  evaluation_status: EvaluationStatus;
  label: TenderLabel;
}

// ─── Tender Decisions ────────────────────────────────────────────────────────

export type DecisionType =
  | 'track'
  | 'ignore'
  | 'assigned'
  | 'partner_needed'
  | 'not_for_us'
  | 'won'
  | 'lost'
  | 'shortlisted';

export type PipelineStage =
  | 'qualification'
  | 'proposal_drafting'
  | 'submitted'
  | 'won'
  | 'lost';

export interface TenderDecision {
  decision_id: string;
  tender_id: string;
  decision: DecisionType;
  decided_by: string;
  decided_at: string;
  notes: string | null;
  assigned_to: string | null;
  pipeline_stage: PipelineStage | null;
  pipeline_entered_at: string | null;
}

// ─── Category Taxonomy ───────────────────────────────────────────────────────

export const CATEGORY_TAXONOMY = [
  'IT_digital',
  'events_experiential',
  'marketing_comms',
  'consultancy_advisory',
  'construction_works',
  'facilities_management',
  'social_services',
  'research_study',
  'supplies_procurement',
  'financial_services',
  'grant_funding',
  'other',
] as const;

export type CategoryTag = typeof CATEGORY_TAXONOMY[number];

// High-relevance categories for our agency profile (used in TenderEvaluatorAgent)
export const HIGH_RELEVANCE_CATEGORIES: CategoryTag[] = [
  'IT_digital',
  'events_experiential',
  'marketing_comms',
  'consultancy_advisory',
];
