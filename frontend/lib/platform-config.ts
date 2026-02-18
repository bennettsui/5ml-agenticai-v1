// ---------------------------------------------------------------------------
// Shared configuration for use cases, solution lines, roadmap, and C-Suite
// ---------------------------------------------------------------------------

export type Status = 'live' | 'in_progress' | 'planned' | 'prototype';

export interface UseCaseConfig {
  id: string;
  name: string;
  description: string;
  solutionLine: 'GrowthOS' | 'ExecIntel' | 'OpsFinance' | 'Experience' | 'Platform';
  status: Status;
  progress: number; // 0–1
  priority: 'low' | 'medium' | 'high' | 'critical';
  internalOnly?: boolean;
  path: string;
  agentCount?: number;
  features?: string[];
}

export type RoadmapTimeframe = 'now' | 'next' | 'later';

export interface RoadmapItem extends UseCaseConfig {
  timeframe: RoadmapTimeframe;
  owner?: string;
  notes?: string;
  type: 'product' | 'platform' | 'csuite';
}

export interface CSuiteRole {
  id: string;
  title: string;
  shortTitle: string;
  agentFamily: string;
  description: string;
  status: Status;
  progress: number;
  focus: string[];
}

// ---------------------------------------------------------------------------
// Solution Line definitions
// ---------------------------------------------------------------------------

export const SOLUTION_LINES = {
  GrowthOS: {
    id: 'GrowthOS',
    name: 'GrowthOS for Brands',
    tagline: 'AI-powered marketing, social and advertising intelligence',
    color: 'from-purple-500 to-pink-600',
    darkBg: 'bg-purple-500/10 border-purple-500/20',
    textColor: 'text-purple-400',
  },
  ExecIntel: {
    id: 'ExecIntel',
    name: 'ExecIntel Studio',
    tagline: 'Strategic intelligence and market monitoring for C-Suite',
    color: 'from-teal-500 to-cyan-600',
    darkBg: 'bg-teal-500/10 border-teal-500/20',
    textColor: 'text-teal-400',
  },
  OpsFinance: {
    id: 'OpsFinance',
    name: 'Agentic Ops & Finance',
    tagline: 'Automated accounting, P&L, and operational workflows',
    color: 'from-blue-500 to-cyan-600',
    darkBg: 'bg-blue-500/10 border-blue-500/20',
    textColor: 'text-blue-400',
  },
  Experience: {
    id: 'Experience',
    name: 'Agentic Experience Lab',
    tagline: 'Interactive AI experiences, events, and creative tools',
    color: 'from-amber-500 to-orange-600',
    darkBg: 'bg-amber-500/10 border-amber-500/20',
    textColor: 'text-amber-400',
  },
  Platform: {
    id: 'Platform',
    name: 'Platform & Infrastructure',
    tagline: 'Core platform, dashboard, workflows, API, and CRM',
    color: 'from-slate-500 to-slate-700',
    darkBg: 'bg-slate-500/10 border-slate-500/20',
    textColor: 'text-slate-400',
  },
} as const;

// ---------------------------------------------------------------------------
// All Use Cases (single source of truth)
// ---------------------------------------------------------------------------

export const USE_CASES: UseCaseConfig[] = [
  // ---- GrowthOS ----
  {
    id: 'social-agents',
    name: 'Social Media & SEO Agents',
    description: '14-agent event-driven pipeline with parallel execution, budget optimization, compliance gate & circuit breakers',
    solutionLine: 'GrowthOS',
    status: 'live',
    progress: 0.85,
    priority: 'high',
    path: '/social',
    agentCount: 14,
    features: ['Input Validator', 'Budget Optimizer', 'Multi-Channel', 'Compliance Agent', 'Performance Tracker'],
  },
  {
    id: 'growth-architect',
    name: 'Growth Architect',
    description: 'AI-powered growth strategy builder with market analysis, audience insights, and tactical recommendations',
    solutionLine: 'GrowthOS',
    status: 'live',
    progress: 0.8,
    priority: 'high',
    path: '/growth-architect',
    agentCount: 5,
    features: ['Market Analysis', 'Audience Insights', 'Strategy Builder', 'KPI Dashboard', 'Recommendations'],
  },
  {
    id: 'ads-performance',
    name: 'Social Ad Performance',
    description: '12-agent orchestrated pipeline with temporal data strategy, validation, backfill & cost-optimized model routing',
    solutionLine: 'GrowthOS',
    status: 'live',
    progress: 0.8,
    priority: 'high',
    path: '/ads-dashboard',
    agentCount: 12,
    features: ['Pipeline Orchestrator', 'Temporal Fetchers', 'Data Validator', 'Backfill Manager', 'Report Generator', 'Multi-Tenant'],
  },
  {
    id: 'short-url-vcard',
    name: 'Short URL + vCard',
    description: 'Branded short links and digital business card generator',
    solutionLine: 'GrowthOS',
    status: 'planned',
    progress: 0,
    priority: 'medium',
    path: '#',
    features: ['Branded Links', 'QR Codes', 'Digital vCard', 'Analytics'],
  },

  // ---- ExecIntel ----
  {
    id: 'topic-intelligence',
    name: 'Topic Intelligence',
    description: 'Multi-topic news monitoring with daily scraping, analysis, and weekly digests',
    solutionLine: 'ExecIntel',
    status: 'live',
    progress: 0.8,
    priority: 'high',
    path: '/intelligence',
    agentCount: 3,
    features: ['Source Curator', 'News Analyst', 'Newsletter Writer', 'Real-time Scan'],
  },

  // ---- OpsFinance ----
  {
    id: 'mans-accounting',
    name: "Man's Accounting Firm",
    description: 'Receipt to P&L automation with Claude Vision OCR and HK compliance',
    solutionLine: 'OpsFinance',
    status: 'live',
    progress: 0.9,
    priority: 'high',
    path: '/use-cases/mans-accounting',
    agentCount: 1,
    features: ['OCR Processing', 'Auto-Categorization', 'Excel Export', 'HK Compliance'],
  },

  // ---- Experience ----
  {
    id: 'photo-booth',
    name: 'AI Photo Booth',
    description: '18th-century fashion portrait generator for live events with real-time AI transformation',
    solutionLine: 'Experience',
    status: 'live',
    progress: 0.7,
    priority: 'high',
    path: '/photo-booth',
    agentCount: 9,
    features: ['Face Detection', 'Theme Selection', '18th Century Styles', 'QR Code Sharing'],
  },
  {
    id: 'healthcheck',
    name: 'Website Health Check',
    description: '7-layer AI-orchestrated SEO, security, accessibility, and performance audit',
    solutionLine: 'Experience',
    status: 'in_progress',
    progress: 0.6,
    priority: 'high',
    path: '/healthcheck',
    features: ['SEO / AI SEO Audit', 'Security Scan', 'WCAG 2.2', 'Best Practices'],
  },
  {
    id: 'fictional-character',
    name: 'Live Fictional Character',
    description: 'AI persona engine that transforms speech into character-voiced content',
    solutionLine: 'Experience',
    status: 'prototype',
    progress: 0.3,
    priority: 'medium',
    path: '/use-cases/fictional-character',
    features: ['Persona Engine', 'TTS-Ready Output', 'Multi-Character', 'Avatar Integration'],
  },
  {
    id: 'vibe-demo',
    name: 'Vibe Code Demo',
    description: 'Interactive showcase of modern web effects and dynamic animations',
    solutionLine: 'Experience',
    status: 'live',
    progress: 1.0,
    priority: 'low',
    path: '/vibe-demo',
    features: ['Parallax Effects', 'Mouse Tracking', 'Click Animations'],
  },

  // ---- Platform ----
  {
    id: 'platform-dashboard',
    name: 'Platform Dashboard',
    description: 'System overview, analytics, architecture visualization, API health, scheduling',
    solutionLine: 'Platform',
    status: 'live',
    progress: 0.85,
    priority: 'critical',
    path: '/dashboard',
    features: ['Analytics', 'Architecture', 'API Health', 'Scheduling'],
  },
  {
    id: 'agentic-workflows',
    name: 'Agentic Team Workflows',
    description: 'Visual n8n-style workflow diagrams showing agent relationships and orchestration',
    solutionLine: 'Platform',
    status: 'live',
    progress: 0.7,
    priority: 'high',
    path: '/agentic-workflows',
    features: ['Node Graph', 'Agent Relationships', 'Data Flow', '6 Pipelines'],
  },
  {
    id: 'crm',
    name: 'CRM Relationship Intelligence',
    description: '18-agent Relationship Intelligence Platform with orchestrator, relationship graph, scoring, signal analysis & RAG-powered chat',
    solutionLine: 'Platform',
    status: 'in_progress',
    progress: 0.65,
    priority: 'critical',
    path: '/use-cases/crm',
    agentCount: 18,
    features: ['Relationship Orchestrator', 'Relationship Graph', 'Signal Analysis', 'Relationship Scoring', 'Connection Suggester', 'RAG Chat'],
  },
  {
    id: 'api-docs',
    name: 'API Documentation',
    description: 'Complete API reference, endpoints, request/response schemas, and examples',
    solutionLine: 'Platform',
    status: 'live',
    progress: 0.5,
    priority: 'medium',
    path: '/api-docs',
    internalOnly: true,
    features: ['REST API', 'Agent Endpoints', 'Authentication', 'Code Examples'],
  },
];

// ---------------------------------------------------------------------------
// Roadmap Items
// ---------------------------------------------------------------------------

export const ROADMAP_ITEMS: RoadmapItem[] = [
  // NOW (0-3 months)
  { ...USE_CASES.find(u => u.id === 'ads-performance')!, timeframe: 'now', type: 'product', owner: 'Growth Team', notes: 'v2: orchestrated pipeline with temporal data strategy, validation layer, backfill manager, cost-optimized routing' },
  { ...USE_CASES.find(u => u.id === 'crm')!, timeframe: 'now', type: 'platform', owner: 'Platform Team', notes: 'Relationship Intelligence Platform: orchestrator, relationship graph, scoring, signal feed, action center' },
  { id: 'founder-cockpit', name: 'Founder Cockpit Agent', description: 'CEO-level strategic dashboard with all business KPIs', solutionLine: 'ExecIntel', status: 'in_progress', progress: 0.2, priority: 'critical', path: '#', timeframe: 'now', type: 'csuite', owner: 'CEO / CSO', notes: 'Integrates CSO orchestrator with business metrics' },
  { ...USE_CASES.find(u => u.id === 'photo-booth')!, timeframe: 'now', type: 'product', owner: 'Experience Team', notes: 'v2: additional themes, faster generation, gallery admin' },
  { ...USE_CASES.find(u => u.id === 'healthcheck')!, timeframe: 'now', type: 'product', owner: 'Platform Team', notes: '7-layer architecture, WCAG + security modules, best practices' },

  // NEXT (3-9 months)
  { id: 'execintel-v2', name: 'ExecIntel Studio v2', description: 'Advanced market intelligence with multi-source analysis and automated briefings', solutionLine: 'ExecIntel', status: 'planned', progress: 0, priority: 'high', path: '#', timeframe: 'next', type: 'product', owner: 'CSO', notes: 'Build on Topic Intelligence, add cross-source correlation' },
  { id: 'pnl-cash-agent', name: 'P&L & Cash Agent', description: 'Automated financial reporting, cash flow forecasting, and variance analysis', solutionLine: 'OpsFinance', status: 'planned', progress: 0, priority: 'high', path: '#', timeframe: 'next', type: 'csuite', owner: 'CFO', notes: 'Extends Man\'s Accounting into full finance automation' },
  { id: 'project-health-agent', name: 'Project Health Agent', description: 'Operational health monitoring, resource tracking, and risk alerts', solutionLine: 'OpsFinance', status: 'planned', progress: 0, priority: 'medium', path: '#', timeframe: 'next', type: 'csuite', owner: 'COO', notes: 'Track project delivery, team velocity, blockers' },
  { id: 'smart-silver-lab', name: 'Smart Silver Experience Lab', description: 'AI-powered elderly engagement experiences for senior care and wellness', solutionLine: 'Experience', status: 'planned', progress: 0, priority: 'medium', path: '#', timeframe: 'next', type: 'product', owner: 'Experience Team', notes: 'Pilot with elderly care partners' },
  { ...USE_CASES.find(u => u.id === 'short-url-vcard')!, timeframe: 'next', type: 'product', owner: 'Growth Team', notes: 'Branded short links for campaign tracking' },

  // LATER (9-18 months)
  { id: 'agentic-pr-lab', name: 'Agentic PR Lab', description: 'AI-powered PR monitoring, press release generation, and media outreach', solutionLine: 'GrowthOS', status: 'planned', progress: 0, priority: 'medium', path: '#', timeframe: 'later', type: 'product', owner: 'CMO', notes: 'Partnership with Radiance HK' },
  { id: 'lead-gen-studio', name: 'Lead Gen Studio', description: 'Automated lead generation, qualification, and nurture sequences', solutionLine: 'GrowthOS', status: 'planned', progress: 0, priority: 'medium', path: '#', timeframe: 'later', type: 'product', owner: 'Growth Team', notes: 'Packages for SME clients' },
  { id: 'csuite-cockpit-v2', name: 'Full C-Suite Cockpit v2', description: 'Unified executive dashboard with all 6 C-Suite agent families', solutionLine: 'ExecIntel', status: 'planned', progress: 0, priority: 'high', path: '#', timeframe: 'later', type: 'csuite', owner: 'CEO', notes: 'All roles: CEO, CSO, CMO, COO, CFO, CHRO' },
  { id: 'capacity-planner', name: 'Capacity & Talent Planner', description: 'AI-driven team capacity planning, skill gap analysis, and hiring recommendations', solutionLine: 'OpsFinance', status: 'planned', progress: 0, priority: 'low', path: '#', timeframe: 'later', type: 'csuite', owner: 'CHRO', notes: 'Workforce planning for scaling teams' },
];

// ---------------------------------------------------------------------------
// C-Suite Roles
// ---------------------------------------------------------------------------

export const CSUITE_ROLES: CSuiteRole[] = [
  { id: 'ceo', title: 'Chief Executive Officer', shortTitle: 'CEO', agentFamily: 'Founder Cockpit', description: 'Strategic overview, business KPIs, cross-functional coordination', status: 'in_progress', progress: 0.2, focus: ['Business KPIs', 'Strategy', 'Team Sync'] },
  { id: 'cso', title: 'Chief Strategy Officer', shortTitle: 'CSO', agentFamily: 'Market Intel Studio', description: 'Market research, competitor intelligence, brand strategy', status: 'live', progress: 0.7, focus: ['Market Research', 'Competitor Intel', 'Brand Strategy'] },
  { id: 'cmo', title: 'Chief Marketing Officer', shortTitle: 'CMO', agentFamily: 'Campaign Planner', description: 'Campaign orchestration, social strategy, content pipeline', status: 'live', progress: 0.6, focus: ['Campaigns', 'Social Media', 'Content'] },
  { id: 'coo', title: 'Chief Operating Officer', shortTitle: 'COO', agentFamily: 'Project Health Monitor', description: 'Operational health, project delivery, resource tracking', status: 'planned', progress: 0, focus: ['Project Health', 'Delivery', 'Resources'] },
  { id: 'cfo', title: 'Chief Financial Officer', shortTitle: 'CFO', agentFamily: 'P&L & Cash Planner', description: 'Financial reporting, cash flow forecasting, cost optimization', status: 'planned', progress: 0, focus: ['P&L', 'Cash Flow', 'Cost Analysis'] },
  { id: 'chro', title: 'Chief HR Officer', shortTitle: 'CHRO', agentFamily: 'Capacity Planner', description: 'Team capacity planning, skill gap analysis, hiring', status: 'planned', progress: 0, focus: ['Capacity', 'Talent', 'Hiring'] },
];

// ---------------------------------------------------------------------------
// 7-Layer Architecture (for reference in multiple pages)
// ---------------------------------------------------------------------------

export const SEVEN_LAYERS = [
  { number: 7, name: 'Governance & Compliance', components: ['Tenant Isolation', 'Audit Logging', 'Access Control', 'Data Retention'] },
  { number: 6, name: 'Orchestration & Workflow', components: ['Schedule Registry', 'CSO Orchestrator', 'Scan Queue', 'WebSocket', 'Health Monitor'] },
  { number: 5, name: 'Task Definitions', components: ['DailySync', 'WeeklyAnalysis', 'MonthlyExecutive', 'NewsDiscovery', 'DigestWorkflow'] },
  { number: 4, name: 'Knowledge Management', components: ['pgvector', 'Notion Connector', 'Vector Embeddings', 'Semantic Search', 'Multi-source'] },
  { number: 3, name: 'Roles & Agents', components: ['56+ Agents', 'Marketing (14)', 'Ads (12)', 'Photo Booth (9)', 'Intelligence (3)', 'CRM (18)'] },
  { number: 2, name: 'Execution Engine', components: ['DeepSeek', 'Claude API', 'Perplexity', 'ComfyUI', 'Model Router', 'Tesseract OCR'] },
  { number: 1, name: 'Infrastructure & Storage', components: ['PostgreSQL + pgvector', 'Express API', 'Fly.io', 'WebSocket', 'SSE Streaming'] },
];

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

export const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string }> = {
  live: { label: 'Live', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  in_progress: { label: 'In Build', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  planned: { label: 'Planned', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  prototype: { label: 'Prototype', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
};
