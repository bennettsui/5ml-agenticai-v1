// ---------------------------------------------------------------------------
// Enum union types (matching API Python enums)
// ---------------------------------------------------------------------------

export type ClientStatus = "active" | "dormant" | "prospect" | "lost";
export type ClientValueTier = "A" | "B" | "C" | "D";
export type ContactPreferredChannel = "email" | "phone" | "chat" | "in_person";
export type ContactStatus = "active" | "inactive";
export type ContractType = "retainer" | "project" | "license" | "other";
export type ContractStatus = "draft" | "active" | "expired" | "terminated";
export type OpportunityStage =
  | "prospecting"
  | "qualification"
  | "proposal"
  | "negotiation"
  | "closed_won"
  | "closed_lost";
export type RiskType =
  | "churn"
  | "payment"
  | "satisfaction"
  | "competitive"
  | "operational"
  | "legal"
  | "other";
export type Severity = "low" | "medium" | "high";
export type ProjectType =
  | "website"
  | "social_campaign"
  | "rebrand"
  | "video_series"
  | "content_production"
  | "other";
export type ProjectStatus =
  | "planning"
  | "in_progress"
  | "on_hold"
  | "completed"
  | "cancelled";
export type SuccessFlag = "success" | "failure" | "neutral";
export type DeliverableType =
  | "web_page"
  | "KV"
  | "video"
  | "social_post"
  | "report"
  | "other";
export type DeliverableStatus =
  | "not_started"
  | "in_progress"
  | "review"
  | "completed";
export type ProjectTeamRole =
  | "AE"
  | "PM"
  | "designer"
  | "developer"
  | "copywriter"
  | "strategist"
  | "other";
export type MilestoneStatus = "upcoming" | "completed" | "delayed";
export type BrandProfileStatus = "draft" | "active" | "archived";
export type TasteExampleType =
  | "campaign"
  | "KV"
  | "video"
  | "social_post"
  | "website"
  | "copy";
export type TasteExampleCategory = "likes" | "dislikes";
export type FeedbackSource =
  | "email"
  | "meeting_notes"
  | "form"
  | "chat"
  | "phone"
  | "other";
export type Sentiment = "positive" | "neutral" | "negative";
export type FeedbackSeverity = "info" | "minor" | "major" | "critical";
export type FeedbackStatus =
  | "new"
  | "reviewed"
  | "converted_to_rule"
  | "converted_to_pattern"
  | "ignored";
export type RuleType = "hard" | "soft";
export type RuleStatus = "active" | "deprecated";
export type PatternScope = "global" | "segment" | "client";
export type PatternCategory =
  | "error_pattern"
  | "best_practice"
  | "playbook"
  | "standard";
export type UserRole =
  | "admin"
  | "account_director"
  | "AE"
  | "PM"
  | "designer"
  | "developer"
  | "finance"
  | "guest";
export type UserStatus = "active" | "inactive";

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export interface Client {
  id: string;
  name: string;
  legal_name: string | null;
  industry: string[] | null;
  region: string[] | null;
  languages: string[] | null;
  status: ClientStatus;
  timezone: string | null;
  website_url: string | null;
  company_size: string | null;
  parent_company: string | null;
  internal_notes: string | null;
  client_value_tier: ClientValueTier | null;
  health_score: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ClientCreate {
  name: string;
  legal_name?: string | null;
  industry?: string[] | null;
  region?: string[] | null;
  languages?: string[] | null;
  status?: ClientStatus;
  timezone?: string | null;
  website_url?: string | null;
  company_size?: string | null;
  parent_company?: string | null;
  internal_notes?: string | null;
  client_value_tier?: ClientValueTier | null;
  health_score?: number;
}

export interface ClientUpdate {
  name?: string;
  legal_name?: string | null;
  industry?: string[] | null;
  region?: string[] | null;
  languages?: string[] | null;
  status?: ClientStatus;
  timezone?: string | null;
  website_url?: string | null;
  company_size?: string | null;
  parent_company?: string | null;
  internal_notes?: string | null;
  client_value_tier?: ClientValueTier | null;
  health_score?: number;
}

export interface ClientOverview {
  client: Client;
  contacts_count: number;
  active_contracts: number;
  active_projects: number;
  open_opportunities: number;
  recent_feedback_count: number;
  rules_count: number;
}

// ---------------------------------------------------------------------------
// Contact
// ---------------------------------------------------------------------------

export interface Contact {
  id: string;
  client_id: string;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  preferred_channel: ContactPreferredChannel | null;
  decision_power: number | null;
  is_primary: boolean;
  status: ContactStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ContactCreate {
  client_id: string;
  name: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  preferred_channel?: ContactPreferredChannel | null;
  decision_power?: number | null;
  is_primary?: boolean;
  status?: ContactStatus;
  notes?: string | null;
}

export interface ContactUpdate {
  name?: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  preferred_channel?: ContactPreferredChannel | null;
  decision_power?: number | null;
  is_primary?: boolean;
  status?: ContactStatus;
  notes?: string | null;
}

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

export interface Contract {
  id: string;
  client_id: string;
  type: ContractType;
  start_date: string | null;
  end_date: string | null;
  value: number | null;
  currency: string;
  status: ContractStatus;
  document_ref: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContractCreate {
  client_id: string;
  type: ContractType;
  start_date?: string | null;
  end_date?: string | null;
  value?: number | null;
  currency?: string;
  status?: ContractStatus;
  document_ref?: string | null;
}

// ---------------------------------------------------------------------------
// Opportunity
// ---------------------------------------------------------------------------

export interface Opportunity {
  id: string;
  client_id: string;
  description: string | null;
  stage: OpportunityStage;
  estimated_value: number | null;
  currency: string;
  probability: number | null;
  expected_close_date: string | null;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface OpportunityCreate {
  client_id: string;
  description?: string | null;
  stage?: OpportunityStage;
  estimated_value?: number | null;
  currency?: string;
  probability?: number | null;
  expected_close_date?: string | null;
  owner_id?: string | null;
}

// ---------------------------------------------------------------------------
// Project
// ---------------------------------------------------------------------------

export interface Project {
  id: string;
  client_id: string;
  name: string;
  type: ProjectType;
  brief: string | null;
  brief_documents: string[] | null;
  start_date: string | null;
  end_date: string | null;
  status: ProjectStatus;
  success_flag: SuccessFlag | null;
  success_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreate {
  client_id: string;
  name: string;
  type: ProjectType;
  brief?: string | null;
  brief_documents?: string[] | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: ProjectStatus;
  success_flag?: SuccessFlag | null;
  success_notes?: string | null;
}

export interface ProjectDeliverable {
  id: string;
  project_id: string;
  type: DeliverableType;
  description: string | null;
  due_date: string | null;
  status: DeliverableStatus;
  file_refs: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectMilestone {
  id: string;
  project_id: string;
  name: string;
  due_date: string | null;
  status: MilestoneStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectTeam {
  id: string;
  project_id: string;
  user_id: string;
  role: ProjectTeamRole;
  allocation: number | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Brand Profile
// ---------------------------------------------------------------------------

export interface BrandProfile {
  id: string;
  client_id: string;
  brand_tone: string | null;
  brand_values: string[] | null;
  key_messages: string[] | null;
  do_list: string[] | null;
  dont_list: string[] | null;
  legal_sensitivities: string | null;
  visual_rules: Record<string, unknown> | null;
  documents: string[] | null;
  version: number;
  status: BrandProfileStatus;
  created_at: string;
  updated_at: string;
}

export interface BrandProfileUpdate {
  brand_tone?: string | null;
  brand_values?: string[] | null;
  key_messages?: string[] | null;
  do_list?: string[] | null;
  dont_list?: string[] | null;
  legal_sensitivities?: string | null;
  visual_rules?: Record<string, unknown> | null;
  documents?: string[] | null;
  status?: BrandProfileStatus;
}

// ---------------------------------------------------------------------------
// Taste Example
// ---------------------------------------------------------------------------

export interface TasteExample {
  id: string;
  client_id: string;
  type: TasteExampleType;
  category: TasteExampleCategory;
  media_ref: string | null;
  description: string | null;
  why_client_likes_or_dislikes: string | null;
  tags: string[] | null;
  added_by: string | null;
  added_at: string;
}

export interface TasteExampleCreate {
  client_id: string;
  type: TasteExampleType;
  category: TasteExampleCategory;
  media_ref?: string | null;
  description?: string | null;
  why_client_likes_or_dislikes?: string | null;
  tags?: string[] | null;
}

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------

export interface FeedbackEvent {
  id: string;
  client_id: string;
  project_id: string | null;
  source: FeedbackSource;
  date: string;
  raw_text: string;
  attachments: string[] | null;
  sentiment: Sentiment | null;
  sentiment_score: number | null;
  topics: string[] | null;
  severity: FeedbackSeverity | null;
  extracted_requirements: Record<string, unknown> | null;
  status: FeedbackStatus;
  processed_by: string | null;
  processed_at: string | null;
  processing_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeedbackCreate {
  client_id: string;
  project_id?: string | null;
  source: FeedbackSource;
  date: string;
  raw_text: string;
  attachments?: string[] | null;
  sentiment?: Sentiment | null;
  sentiment_score?: number | null;
  topics?: string[] | null;
  severity?: FeedbackSeverity | null;
}

export interface FeedbackAnalysis {
  feedback_id: string;
  sentiment: Sentiment;
  sentiment_score: number;
  topics: string[];
  severity: FeedbackSeverity;
  extracted_requirements: Record<string, unknown>;
  rule_suggestions: RuleSuggestion[];
}

export interface RuleSuggestion {
  description: string;
  rule_type: RuleType;
  applies_to: string[];
  priority: number;
  confidence: number;
}

// ---------------------------------------------------------------------------
// Client Rule
// ---------------------------------------------------------------------------

export interface ClientRule {
  id: string;
  client_id: string;
  origin_feedback_ids: string[] | null;
  description: string;
  rule_type: RuleType;
  applies_to: string[] | null;
  validation_type: string | null;
  validation_pattern: string | null;
  priority: number;
  status: RuleStatus;
  deprecated_reason: string | null;
  deprecated_at: string | null;
  usage_count: number;
  last_used_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientRuleCreate {
  client_id: string;
  description: string;
  rule_type: RuleType;
  origin_feedback_ids?: string[] | null;
  applies_to?: string[] | null;
  validation_type?: string | null;
  validation_pattern?: string | null;
  priority?: number;
  status?: RuleStatus;
}

// ---------------------------------------------------------------------------
// Pattern
// ---------------------------------------------------------------------------

export interface Pattern {
  id: string;
  scope: PatternScope;
  client_id: string | null;
  segment_tags: string[] | null;
  name: string;
  description: string;
  category: PatternCategory;
  trigger_conditions: string | null;
  recommended_actions: string[] | null;
  example_cases: Record<string, unknown> | null;
  applicable_channels: string[] | null;
  usage_count: number;
  effectiveness_score: number | null;
  last_used_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PatternCreate {
  scope: PatternScope;
  client_id?: string | null;
  segment_tags?: string[] | null;
  name: string;
  description: string;
  category: PatternCategory;
  trigger_conditions?: string | null;
  recommended_actions?: string[] | null;
  example_cases?: Record<string, unknown> | null;
  applicable_channels?: string[] | null;
}

// ---------------------------------------------------------------------------
// User / Auth
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

// ---------------------------------------------------------------------------
// Chat / Chatbot
// ---------------------------------------------------------------------------

export interface ChatMessageInput {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  messages: ChatMessageInput[];
  session_id?: string;
}

export interface ChatToolCall {
  tool: string;
  input: Record<string, unknown>;
  result_preview: string;
}

export interface ChatResponse {
  message: string;
  session_id: string;
  tool_calls: ChatToolCall[] | null;
}

// ---------------------------------------------------------------------------
// Paginated Response
// ---------------------------------------------------------------------------

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}
