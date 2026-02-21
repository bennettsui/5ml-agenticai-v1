// ---------------------------------------------------------------------------
// Shared configuration for use cases, solution lines, roadmap, and C-Suite
// ---------------------------------------------------------------------------

export type Status = 'live' | 'in_progress' | 'planned' | 'prototype';

export type SolutionLineKey =
  | 'GrowthOS'
  | 'IntelStudio'
  | 'TechNexus'
  | 'ExpLab'
  | 'MediaChannel'
  | 'FrontierVentures'
  | 'CSuite'
  | 'GovProcurement'
  | 'Platform';

export interface UseCaseConfig {
  id: string;
  name: string;
  description: string;
  solutionLine: SolutionLineKey;
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

export const SOLUTION_LINES: Record<SolutionLineKey, {
  id: SolutionLineKey;
  name: string;
  tagline: string;
  color: string;
  darkBg: string;
  textColor: string;
}> = {
  GrowthOS: {
    id: 'GrowthOS',
    name: 'Growth Hacking Studio',
    tagline: 'End-to-end brand growth: social strategy, ads, SEO, PR, content, and media buy',
    color: 'from-purple-500 to-pink-600',
    darkBg: 'bg-purple-500/10 border-purple-500/20',
    textColor: 'text-purple-400',
  },
  IntelStudio: {
    id: 'IntelStudio',
    name: 'ExcelIntel Studio',
    tagline: 'Market research, competitive intelligence, trend analysis, and strategic insights',
    color: 'from-teal-500 to-cyan-600',
    darkBg: 'bg-teal-500/10 border-teal-500/20',
    textColor: 'text-teal-400',
  },
  TechNexus: {
    id: 'TechNexus',
    name: 'NexTech Studio',
    tagline: 'Web tech stack: eCom channels, healthcheck, SEO/AI SEO, WCAG compliance, vibe tools',
    color: 'from-blue-500 to-cyan-600',
    darkBg: 'bg-blue-500/10 border-blue-500/20',
    textColor: 'text-blue-400',
  },
  ExpLab: {
    id: 'ExpLab',
    name: 'Agentic Experience Lab',
    tagline: 'Immersive AI experiences: video generation, live characters, interactive installations',
    color: 'from-indigo-500 to-violet-600',
    darkBg: 'bg-indigo-500/10 border-indigo-500/20',
    textColor: 'text-indigo-400',
  },
  MediaChannel: {
    id: 'MediaChannel',
    name: 'Owned Media Channel',
    tagline: 'Own your audience: website content, social channels, and eCom content engine',
    color: 'from-rose-500 to-pink-600',
    darkBg: 'bg-rose-500/10 border-rose-500/20',
    textColor: 'text-rose-400',
  },
  FrontierVentures: {
    id: 'FrontierVentures',
    name: 'Frontier Ventures',
    tagline: 'New business lines: AI booths, longevity tech, 3D printing, astrology, human design',
    color: 'from-amber-500 to-orange-600',
    darkBg: 'bg-amber-500/10 border-amber-500/20',
    textColor: 'text-amber-400',
  },
  CSuite: {
    id: 'CSuite',
    name: 'C-Suite Management',
    tagline: 'Agency ops, finance, HR, CRM, and C-level decision intelligence',
    color: 'from-emerald-500 to-green-600',
    darkBg: 'bg-emerald-500/10 border-emerald-500/20',
    textColor: 'text-emerald-400',
  },
  GovProcurement: {
    id: 'GovProcurement',
    name: 'Government Procurement',
    tagline: 'Automate RFP tracking, bid management, and procurement intelligence',
    color: 'from-indigo-500 to-cyan-600',
    darkBg: 'bg-indigo-500/10 border-indigo-500/20',
    textColor: 'text-indigo-400',
  },
  Platform: {
    id: 'Platform',
    name: 'Platform & Infrastructure',
    tagline: 'Core platform, dashboard, workflows, API, and agentic orchestration layer',
    color: 'from-slate-500 to-slate-700',
    darkBg: 'bg-slate-500/10 border-slate-500/20',
    textColor: 'text-slate-400',
  },
} as const;

// ---------------------------------------------------------------------------
// All Use Cases (single source of truth)
// ---------------------------------------------------------------------------

export const USE_CASES: UseCaseConfig[] = [
  // ========================================================================
  // GROWTH HACKING STUDIO — GrowthOS
  // ========================================================================
  {
    id: 'crm-brand-profile',
    name: 'Brand Profile',
    description: '18-agent Relationship Intelligence Platform with orchestrator, relationship graph, scoring, signal analysis & RAG-powered chat',
    solutionLine: 'GrowthOS',
    status: 'in_progress',
    progress: 0.65,
    priority: 'critical',
    path: '/use-cases/crm',
    agentCount: 18,
    features: ['Relationship Orchestrator', 'Relationship Graph', 'Signal Analysis', 'RAG Chat'],
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
    id: 'social-content-ops',
    name: 'Social Content Ops',
    description: 'Social Studio: 10-module platform with AI director, human approval workflow, 7-layer agentic architecture, shared knowledge base, and scheduling/delivery',
    solutionLine: 'GrowthOS',
    status: 'live',
    progress: 0.9,
    priority: 'high',
    path: '/use-cases/social-content-ops',
    agentCount: 7,
    features: ['Social Strategy', 'Content Calendar', 'Content Dev', 'Interactive Content', 'Media Buy', 'Community Management', 'Ad Performance', 'Brand Research', 'Trend Research', 'Social Monitoring'],
  },
  {
    id: 'social-agents',
    name: 'Social Strategy & Content',
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
    id: 'content-calendar',
    name: 'Content Calendar',
    description: 'AI-powered monthly content calendar with approval workflow, scheduling, and cross-platform delivery',
    solutionLine: 'GrowthOS',
    status: 'live',
    progress: 0.85,
    priority: 'high',
    path: '/use-cases/social-content-ops/calendar',
    features: ['AI Generation', 'Approval Workflow', 'Scheduling', 'Cross-Channel'],
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
    features: ['Pipeline Orchestrator', 'Temporal Fetchers', 'Data Validator', 'Backfill Manager', 'Report Generator'],
  },
  {
    id: 'sme-growth-engine',
    name: 'SME Growth Engine',
    description: '7-agent lead generation system covering lead scoring, personalised email nurture, campaign analytics, retargeting strategy, CRO, demo pipeline, and lead intelligence',
    solutionLine: 'GrowthOS',
    status: 'in_progress',
    progress: 0.70,
    priority: 'high',
    path: '#',
    agentCount: 7,
    features: [
      'Lead Scoring Agent',
      'Lead Intelligence Agent',
      'Email Nurture Agent',
      'Demo Closer Agent',
      'Campaign Analytics Agent',
      'Retargeting Strategist Agent',
      'Conversion Optimizer Agent',
    ],
  },
  {
    id: 'community-management',
    name: 'Community Management',
    description: 'Automated engagement, moderation, and community growth across platforms',
    solutionLine: 'GrowthOS',
    status: 'planned',
    progress: 0,
    priority: 'medium',
    path: '#',
    features: ['Auto-Reply', 'Sentiment Monitor', 'Escalation', 'Growth Metrics'],
  },
  {
    id: 'brand-strategy',
    name: 'Brand Strategy & Setup',
    description: 'AI-guided brand onboarding, identity generation, and strategy documentation',
    solutionLine: 'GrowthOS',
    status: 'in_progress',
    progress: 0.55,
    priority: 'high',
    path: '/brand-setup',
    features: ['Brand Onboarding', 'AI Strategy', 'Identity Design', 'Positioning'],
  },
  {
    id: 'design-projects',
    name: 'Design Projects',
    description: 'AI-assisted creative brief generation, design workflow management, and asset delivery',
    solutionLine: 'GrowthOS',
    status: 'planned',
    progress: 0,
    priority: 'low',
    path: '#',
    features: ['Creative Briefs', 'Asset Library', 'Approval Flow', 'Brand Consistency'],
  },
  {
    id: 'video-projects',
    name: 'Video Projects',
    description: 'Video production pipeline with AI scripting, storyboarding, and distribution',
    solutionLine: 'GrowthOS',
    status: 'planned',
    progress: 0,
    priority: 'medium',
    path: '#',
    features: ['AI Scripting', 'Storyboard', 'Production Queue', 'Distribution'],
  },
  {
    id: 'event-projects',
    name: 'Event Projects',
    description: 'End-to-end event marketing: planning, promotion, on-site coordination, and post-event analysis',
    solutionLine: 'GrowthOS',
    status: 'planned',
    progress: 0,
    priority: 'medium',
    path: '#',
    features: ['Event Planning', 'Promotion', 'Registration', 'Post-Analysis'],
  },
  {
    id: 'sem-seo',
    name: 'SEM & SEO',
    description: 'Paid search campaign management and organic search strategy with AI recommendations',
    solutionLine: 'GrowthOS',
    status: 'planned',
    progress: 0,
    priority: 'high',
    path: '#',
    features: ['Keyword Research', 'Ad Copy', 'Bid Strategy', 'Rank Tracking'],
  },
  {
    id: 'media-buy',
    name: 'Media Buy',
    description: 'Cross-channel media planning, buying, and performance tracking automation',
    solutionLine: 'GrowthOS',
    status: 'planned',
    progress: 0,
    priority: 'medium',
    path: '#',
    features: ['Media Planning', 'Channel Mix', 'Budget Allocation', 'ROI Analysis'],
  },
  {
    id: 'pr-projects',
    name: 'PR Projects',
    description: 'PR monitoring, press release generation, media outreach, and coverage tracking',
    solutionLine: 'GrowthOS',
    status: 'planned',
    progress: 0,
    priority: 'medium',
    path: '#',
    features: ['Media Monitoring', 'Press Releases', 'Outreach', 'Coverage Report'],
  },

  // ========================================================================
  // EXCELINTEL STUDIO — IntelStudio
  // ========================================================================
  {
    id: 'topic-intelligence',
    name: 'Market Research & Topic Intel',
    description: 'Multi-topic news monitoring with daily scraping, analysis, and weekly digests',
    solutionLine: 'IntelStudio',
    status: 'live',
    progress: 0.8,
    priority: 'high',
    path: '/intelligence',
    agentCount: 3,
    features: ['Source Curator', 'News Analyst', 'Newsletter Writer', 'Real-time Scan'],
  },
  {
    id: 'social-trend-research',
    name: 'Social Trend Research',
    description: 'Shared knowledge base with format best practices, platform SEO signals, and real-time trend identification',
    solutionLine: 'IntelStudio',
    status: 'live',
    progress: 0.85,
    priority: 'high',
    path: '/use-cases/social-content-ops/trend-research',
    features: ['Format Best Practices', 'Platform SEO', 'Trend Detection', 'Shared Knowledge Base'],
  },
  {
    id: 'ai-trend-research',
    name: 'AI Trend Research',
    description: 'Track emerging AI tools, model releases, and technology landscape shifts',
    solutionLine: 'IntelStudio',
    status: 'planned',
    progress: 0,
    priority: 'medium',
    path: '#',
    features: ['Model Tracker', 'Tool Discovery', 'Tech Radar', 'Weekly Digest'],
  },
  {
    id: 'brand-competitive-research',
    name: 'Brand & Competitive Research',
    description: '3-tab research hub: business overview, audience segmentation, and products/services analysis with AI-powered insights',
    solutionLine: 'IntelStudio',
    status: 'live',
    progress: 0.8,
    priority: 'high',
    path: '/use-cases/social-content-ops/research',
    features: ['Business Overview', 'Audience Segments', 'Product Analysis', 'AI Insights'],
  },
  {
    id: 'web-tech-research',
    name: 'Web & Tech Research',
    description: 'Technology stack analysis, digital footprint audits, and web innovation scouting',
    solutionLine: 'IntelStudio',
    status: 'planned',
    progress: 0,
    priority: 'low',
    path: '#',
    features: ['Stack Detection', 'Tech Audit', 'Innovation Scouting', 'Reports'],
  },

  // ========================================================================
  // NEXTECH STUDIO — TechNexus
  // ========================================================================
  {
    id: 'vibe-demo',
    name: 'Vibe Code Demo',
    description: 'Interactive showcase of modern web effects and dynamic animations',
    solutionLine: 'TechNexus',
    status: 'live',
    progress: 1.0,
    priority: 'low',
    path: '/vibe-demo',
    features: ['Parallax Effects', 'Mouse Tracking', 'Click Animations'],
  },
  {
    id: 'ecom-channels',
    name: 'eCom Channels',
    description: 'Multi-channel eCommerce management: product listing optimization and channel performance',
    solutionLine: 'TechNexus',
    status: 'planned',
    progress: 0,
    priority: 'high',
    path: '#',
    features: ['Listing Optimizer', 'Channel Sync', 'Price Monitor', 'Inventory Alerts'],
  },
  {
    id: 'healthcheck',
    name: 'Website Health Check',
    description: '7-layer AI-orchestrated SEO, security, accessibility, and performance audit with live monitoring',
    solutionLine: 'TechNexus',
    status: 'in_progress',
    progress: 0.6,
    priority: 'high',
    path: '/healthcheck',
    features: ['SEO / AI SEO Audit', 'Security Scan', 'WCAG 2.2', 'Live Monitoring'],
  },
  {
    id: 'ai-seo',
    name: 'SEO / AI SEO',
    description: 'Next-gen SEO optimized for both traditional search engines and AI-powered discovery',
    solutionLine: 'TechNexus',
    status: 'planned',
    progress: 0,
    priority: 'high',
    path: '#',
    features: ['AI Search Optimization', 'Schema Markup', 'Content Clusters', 'SERP Tracking'],
  },
  {
    id: 'wcag-compliance',
    name: 'WCAG 2.0 Compliance',
    description: 'Automated accessibility auditing, remediation suggestions, and compliance certification',
    solutionLine: 'TechNexus',
    status: 'planned',
    progress: 0,
    priority: 'medium',
    path: '#',
    features: ['WCAG 2.0 Audit', 'Color Contrast', 'Screen Reader', 'Remediation Guide'],
  },

  // ========================================================================
  // AGENTIC EXPERIENCE LAB — ExpLab
  // ========================================================================
  {
    id: 'ai-video-generation',
    name: 'AI Video Generation',
    description: 'Text-to-video and image-to-video generation for marketing, social, and creative content',
    solutionLine: 'ExpLab',
    status: 'planned',
    progress: 0,
    priority: 'high',
    path: '#',
    features: ['Text-to-Video', 'Script-to-Scene', 'Brand Templates', 'Auto-Captions'],
  },
  {
    id: 'fictional-character',
    name: 'Live Fictional Character',
    description: 'AI persona engine that transforms speech into character-voiced content for live events',
    solutionLine: 'ExpLab',
    status: 'prototype',
    progress: 0.3,
    priority: 'medium',
    path: '/use-cases/fictional-character',
    features: ['Persona Engine', 'TTS-Ready Output', 'Multi-Character', 'Avatar Integration'],
  },
  {
    id: 'receipt-to-audit',
    name: 'Receipt to Audit',
    description: 'Receipt to P&L automation with Claude Vision OCR, auto-categorization, and HK compliance',
    solutionLine: 'ExpLab',
    status: 'live',
    progress: 0.9,
    priority: 'high',
    path: '/use-cases/mans-accounting',
    agentCount: 1,
    features: ['OCR Processing', 'Auto-Categorization', 'Excel Export', 'HK Compliance'],
  },
  {
    id: 'video-to-audio',
    name: 'Video to Audio',
    description: 'Agentic pipeline that extracts, cleans, and normalises audio tracks from video files — supports MP4, MOV, WebM with format and bitrate options',
    solutionLine: 'ExpLab',
    status: 'planned',
    progress: 0,
    priority: 'medium',
    path: '#',
    agentCount: 3,
    features: ['Video Upload', 'Audio Extraction', 'Noise Reduction', 'Format Conversion (MP3/WAV/AAC)', 'Batch Processing'],
  },
  {
    id: 'audio-to-transcript',
    name: 'Audio to Transcript',
    description: 'Agentic transcription pipeline: audio → Whisper STT → speaker diarisation → formatted transcript with timestamps and summary',
    solutionLine: 'ExpLab',
    status: 'planned',
    progress: 0,
    priority: 'medium',
    path: '#',
    agentCount: 4,
    features: ['Whisper STT', 'Speaker Diarisation', 'Timestamped Transcript', 'AI Summary', 'Export (TXT/SRT/DOCX)'],
  },

  // ========================================================================
  // OWNED MEDIA CHANNEL — MediaChannel
  // ========================================================================
  {
    id: 'website-content',
    name: 'Website Content Studio',
    description: 'AI-powered content strategy, writing, and publishing for owned web properties',
    solutionLine: 'MediaChannel',
    status: 'planned',
    progress: 0,
    priority: 'high',
    path: '#',
    features: ['Content Strategy', 'AI Copywriting', 'SEO Integrated', 'CMS Publish'],
  },
  {
    id: 'social-channel',
    name: 'Social Media Channel',
    description: 'Owned social channel management across FB, IG, XHS (Little Red Book), and TikTok',
    solutionLine: 'MediaChannel',
    status: 'planned',
    progress: 0,
    priority: 'high',
    path: '#',
    features: ['FB/IG', 'XHS (小红书)', 'TikTok', 'Cross-Post Scheduler'],
  },
  {
    id: 'ecom-content',
    name: 'eCom Content Engine',
    description: 'Product description generation, enhanced content, and A/B testing for eCom listings',
    solutionLine: 'MediaChannel',
    status: 'planned',
    progress: 0,
    priority: 'medium',
    path: '#',
    features: ['Product Descriptions', 'A+ Content', 'A/B Testing', 'Multi-language'],
  },
  {
    id: 'ai-image-generation',
    name: 'AI Image Generation',
    description: 'Agency-grade image generation workflow: brief → structured prompts → SDXL / ComfyUI configs → brand QC → delivery',
    solutionLine: 'MediaChannel',
    status: 'planned',
    progress: 0,
    priority: 'high',
    path: '#',
    agentCount: 6,
    features: ['Brief Translator', 'Prompt Engineer', 'Style Manager', 'ComfyUI Workflow Config', 'Vision QC', 'Prompt Library'],
  },
  {
    id: 'ai-video-generation',
    name: 'AI Video Generation',
    description: 'Image-to-video and text-to-video workflows using AnimateDiff and Stable Video Diffusion with brand-consistent motion prompts',
    solutionLine: 'MediaChannel',
    status: 'planned',
    progress: 0,
    priority: 'high',
    path: '#',
    agentCount: 8,
    features: ['AnimateDiff Pipeline', 'SVD Image-to-Video', 'Motion Prompt Engineering', 'Asset Librarian', 'Client Feedback Agent', 'Brand History', 'Performance Loop', 'Delivery Checklist'],
  },
  {
    id: 'multimedia-library',
    name: 'Multimedia Library',
    description: 'Upload images or paste video URLs to reverse-engineer prompts and build reusable style templates for any brand or project',
    solutionLine: 'MediaChannel',
    status: 'in_progress',
    progress: 0.50,
    priority: 'high',
    path: '/use-cases/ai-media-generation',
    agentCount: 3,
    features: ['Image Upload (File/URL/Paste)', 'Video URL Analysis (YouTube)', 'Reverse Prompt Engineering', 'Style Template Builder', 'Canvas Annotation', 'Brand Profile Linking'],
  },

  // ========================================================================
  // FRONTIER VENTURES — FrontierVentures
  // ========================================================================
  {
    id: 'photo-booth',
    name: 'AI Photo Booth',
    description: '18th-century fashion portrait generator for live events with real-time AI transformation',
    solutionLine: 'FrontierVentures',
    status: 'live',
    progress: 0.7,
    priority: 'high',
    path: '/photo-booth',
    agentCount: 9,
    features: ['Face Detection', 'Theme Selection', '18th Century Styles', 'QR Code Sharing'],
  },
  {
    id: 'longevity-elderly',
    name: 'Longevity & Elderly Living',
    description: 'AI-powered elderly care experiences, wellness programs, and smart senior engagement',
    solutionLine: 'FrontierVentures',
    status: 'planned',
    progress: 0,
    priority: 'medium',
    path: '#',
    features: ['Wellness Programs', 'Cognitive Engagement', 'Family Connect', 'Health Tracking'],
  },
  {
    id: '3d-printing',
    name: '3D Printing Studio',
    description: 'AI-assisted 3D model design, print optimization, and factory management platform',
    solutionLine: 'FrontierVentures',
    status: 'planned',
    progress: 0,
    priority: 'medium',
    path: '#',
    features: ['AI Model Design', 'Print Queue', 'Material Optimizer', 'Factory Dashboard'],
  },
  {
    id: 'purple-star',
    name: '紫微 Purple Star Astrology',
    description: 'AI-powered Zi Wei Dou Shu reading, personalized charts, and destiny analysis platform',
    solutionLine: 'FrontierVentures',
    status: 'live',
    progress: 0.8,
    priority: 'high',
    path: '/use-cases/ziwei',
    features: ['Chart Generator', 'AI Interpretation', 'Pattern Recognition', 'Rule Database'],
    agentCount: 4,
  },
  {
    id: 'human-design',
    name: 'Human Design Platform',
    description: 'Human Design chart calculation, type analysis, and personalized guidance engine',
    solutionLine: 'FrontierVentures',
    status: 'planned',
    progress: 0,
    priority: 'low',
    path: '#',
    features: ['Chart Calculator', 'Type Analysis', 'Strategy Guide', 'Authority Tracker'],
  },
  {
    id: 'event-management',
    name: 'Event Management System',
    description: 'End-to-end AI event planning with attendee management, venue logistics, and real-time coordination',
    solutionLine: 'FrontierVentures',
    status: 'planned',
    progress: 0,
    priority: 'medium',
    path: '#',
    features: ['Attendee Management', 'Venue Logistics', 'Schedule Builder', 'Live Coordination'],
  },
  {
    id: 'link-shortener',
    name: 'Link Shortener',
    description: 'Branded URL shortener with click analytics, UTM builder, QR export, and custom slug management',
    solutionLine: 'FrontierVentures',
    status: 'planned',
    progress: 0,
    priority: 'medium',
    path: '#',
    features: ['Custom Slugs', 'Click Analytics', 'UTM Builder', 'QR Export', 'Branded Domains'],
  },
  {
    id: 'barcode-qr-generator',
    name: 'Barcode & QR Generator',
    description: 'Generate QR codes and barcodes (EAN, UPC, Code128) with logo embedding, batch export, and brand colour customisation',
    solutionLine: 'FrontierVentures',
    status: 'planned',
    progress: 0,
    priority: 'medium',
    path: '#',
    features: ['QR Code Generator', 'Barcode (EAN/UPC/Code128)', 'Logo Embedding', 'Brand Colours', 'Batch Export'],
  },
  {
    id: 'pdf-compressor',
    name: 'PDF Compressor',
    description: 'Compress, merge, split and optimise PDF files with configurable quality targets and metadata stripping',
    solutionLine: 'FrontierVentures',
    status: 'planned',
    progress: 0,
    priority: 'medium',
    path: '#',
    features: ['Compress PDF', 'Merge PDFs', 'Split Pages', 'Metadata Strip', 'Quality Presets'],
  },
  {
    id: 'ziwei-astrology',
    name: '紫微 Purple Star Astrology (Internal)',
    description: 'Internal Ziwei system with comprehensive rule evaluation, pattern matching, and accuracy tracking',
    solutionLine: 'ExpLab',
    status: 'live',
    progress: 0.8,
    priority: 'high',
    path: '/use-cases/ziwei',
    agentCount: 4,
    features: ['Chart Engine', 'Rule Evaluator', 'Pattern Recognition', 'Compatibility Analysis', 'Rule Management', 'Accuracy Tracking'],
  },

  // ========================================================================
  // C-SUITE MANAGEMENT — CSuite
  // ========================================================================
  {
    id: 'agency-management',
    name: 'Agency Management',
    description: 'End-to-end agency operations: project tracking, client management, and resource planning',
    solutionLine: 'CSuite',
    status: 'planned',
    progress: 0,
    priority: 'high',
    path: '#',
    features: ['Project Tracking', 'Client Portal', 'Resource Planning', 'Billing'],
  },
  {
    id: 'finance-accounting',
    name: 'Finance & Accounting',
    description: 'Financial reporting, cash flow forecasting, budgeting, and cost optimization intelligence',
    solutionLine: 'CSuite',
    status: 'planned',
    progress: 0,
    priority: 'high',
    path: '#',
    features: ['P&L Reports', 'Cash Flow Forecast', 'Budget Tracking', 'Cost Optimization'],
  },
  {
    id: 'hr-platform',
    name: 'HR Platform',
    description: 'Talent management, onboarding, capacity planning, and team performance insights',
    solutionLine: 'CSuite',
    status: 'planned',
    progress: 0,
    priority: 'medium',
    path: '#',
    features: ['Talent Pipeline', 'Onboarding', 'Capacity Planner', 'Performance Reviews'],
  },
  {
    id: 'c-level-decision',
    name: 'C-Level Decision Center',
    description: 'Unified executive intelligence: KPIs, strategic recommendations, and cross-function insights',
    solutionLine: 'CSuite',
    status: 'in_progress',
    progress: 0.2,
    priority: 'critical',
    path: '#',
    features: ['KPI Dashboard', 'Strategic AI', 'Cross-Function', 'Scenario Planning'],
  },

  // ========================================================================
  // GOVERNMENT PROCUREMENT — GovProcurement
  // ========================================================================
  {
    id: 'government-tender-ops',
    name: 'Government Tender Operations',
    description: '10-module platform for RFP tracking, bid management, and procurement pipeline with AI orchestrator, team collaboration, and win probability scoring',
    solutionLine: 'GovProcurement',
    status: 'planned',
    progress: 0,
    priority: 'high',
    path: '/use-cases/government-tenders',
    agentCount: 8,
    features: ['Tender Monitoring', 'Bid Management', 'Proposal Gen', 'Competitor Analysis', 'Compliance Check', 'Deadline Alerts', 'Win Analysis', 'Team Collab'],
  },
  {
    id: 'government-tender-intel',
    name: 'Government Tender Intelligence',
    description: 'Real-time government & public utilities tender scraping, news analysis, compliance alerts, and strategic procurement insights with daily digests',
    solutionLine: 'GovProcurement',
    status: 'planned',
    progress: 0,
    priority: 'high',
    path: '/intelligence/government-tenders',
    agentCount: 5,
    features: ['Tender Scraping', 'News Analysis', 'Smart Alerts', 'Relevance Scoring', 'KB Search', 'Daily Digest', 'Competitor Track', 'Trend Analysis'],
  },

  // ========================================================================
  // PLATFORM & INFRASTRUCTURE — Platform
  // ========================================================================
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
  {
    ...USE_CASES.find(u => u.id === 'ads-performance')!,
    timeframe: 'now',
    type: 'product',
    owner: 'Growth Team',
    notes: 'v2: 12-agent orchestrated pipeline with temporal data strategy, validation layer, backfill manager, cost-optimized routing',
  },
  {
    ...USE_CASES.find(u => u.id === 'crm-brand-profile')!,
    timeframe: 'now',
    type: 'platform',
    owner: 'Platform Team',
    notes: '18-agent Relationship Intelligence Platform: orchestrator, relationship graph, scoring, signal feed, RAG chat',
  },
  {
    ...USE_CASES.find(u => u.id === 'healthcheck')!,
    timeframe: 'now',
    type: 'product',
    owner: 'TechNexus Team',
    notes: '7-layer architecture, WCAG + security modules, live monitoring',
  },
  {
    ...USE_CASES.find(u => u.id === 'brand-strategy')!,
    timeframe: 'now',
    type: 'product',
    owner: 'Growth Team',
    notes: 'AI-guided brand onboarding with identity generation and strategy output',
  },
  {
    ...USE_CASES.find(u => u.id === 'c-level-decision')!,
    timeframe: 'now',
    type: 'csuite',
    owner: 'CEO / CSO',
    notes: 'Phase 1: KPI dashboard and strategic AI recommendations',
  },

  // NEXT (3-9 months)
  {
    ...USE_CASES.find(u => u.id === 'brand-competitive-research')!,
    timeframe: 'next',
    type: 'product',
    owner: 'IntelStudio Team',
    notes: 'Deep competitor profiles, positioning maps, SWOT analysis',
  },
  {
    ...USE_CASES.find(u => u.id === 'ecom-channels')!,
    timeframe: 'next',
    type: 'product',
    owner: 'TechNexus Team',
    notes: 'Multi-channel eCom listing management and performance optimization',
  },
  {
    ...USE_CASES.find(u => u.id === 'ai-video-generation')!,
    timeframe: 'next',
    type: 'product',
    owner: 'ExpLab Team',
    notes: 'Text-to-video pipeline for social and marketing content',
  },
  {
    ...USE_CASES.find(u => u.id === 'social-channel')!,
    timeframe: 'next',
    type: 'product',
    owner: 'Media Team',
    notes: 'Owned social presence across FB, IG, XHS, TikTok',
  },
  {
    ...USE_CASES.find(u => u.id === 'agency-management')!,
    timeframe: 'next',
    type: 'csuite',
    owner: 'COO',
    notes: 'Full project and client lifecycle management for agency ops',
  },

  // LATER (9-18 months)
  {
    ...USE_CASES.find(u => u.id === 'photo-booth')!,
    timeframe: 'later',
    type: 'product',
    owner: 'FrontierVentures Team',
    notes: 'v2: new themes, faster generation, gallery admin, white-label',
  },
  {
    ...USE_CASES.find(u => u.id === 'purple-star')!,
    timeframe: 'later',
    type: 'product',
    owner: 'FrontierVentures Team',
    notes: 'Bilingual Zi Wei Dou Shu platform with AI interpretation',
  },
  {
    ...USE_CASES.find(u => u.id === '3d-printing')!,
    timeframe: 'later',
    type: 'product',
    owner: 'FrontierVentures Team',
    notes: 'AI-assisted design + factory management for 3D printing operations',
  },
  {
    ...USE_CASES.find(u => u.id === 'longevity-elderly')!,
    timeframe: 'later',
    type: 'product',
    owner: 'FrontierVentures Team',
    notes: 'Pilot with elderly care partners',
  },
  {
    ...USE_CASES.find(u => u.id === 'hr-platform')!,
    timeframe: 'later',
    type: 'csuite',
    owner: 'CHRO',
    notes: 'Talent management, capacity planning, and performance insights',
  },
];

// ---------------------------------------------------------------------------
// C-Suite Roles
// ---------------------------------------------------------------------------

export const CSUITE_ROLES: CSuiteRole[] = [
  {
    id: 'ceo',
    title: 'Chief Executive Officer',
    shortTitle: 'CEO',
    agentFamily: 'Decision Center',
    description: 'Strategic overview, business KPIs, cross-functional coordination',
    status: 'in_progress',
    progress: 0.2,
    focus: ['Business KPIs', 'Strategy', 'Team Sync'],
  },
  {
    id: 'cso',
    title: 'Chief Strategy Officer',
    shortTitle: 'CSO',
    agentFamily: 'Intel Studio',
    description: 'Market research, competitor intelligence, brand strategy',
    status: 'live',
    progress: 0.7,
    focus: ['Market Research', 'Competitor Intel', 'Brand Strategy'],
  },
  {
    id: 'cmo',
    title: 'Chief Marketing Officer',
    shortTitle: 'CMO',
    agentFamily: 'Growth Hacking Studio',
    description: 'Campaign orchestration, social strategy, content pipeline',
    status: 'live',
    progress: 0.6,
    focus: ['Campaigns', 'Social Media', 'Content'],
  },
  {
    id: 'coo',
    title: 'Chief Operating Officer',
    shortTitle: 'COO',
    agentFamily: 'Agency Management',
    description: 'Agency operations, project delivery, resource tracking',
    status: 'planned',
    progress: 0,
    focus: ['Project Health', 'Delivery', 'Resources'],
  },
  {
    id: 'cfo',
    title: 'Chief Financial Officer',
    shortTitle: 'CFO',
    agentFamily: 'Finance & Accounting',
    description: 'Financial reporting, cash flow forecasting, cost optimization',
    status: 'live',
    progress: 0.9,
    focus: ['P&L', 'Cash Flow', 'HK Compliance'],
  },
  {
    id: 'chro',
    title: 'Chief HR Officer',
    shortTitle: 'CHRO',
    agentFamily: 'HR Platform',
    description: 'Team capacity planning, skill gap analysis, hiring',
    status: 'planned',
    progress: 0,
    focus: ['Capacity', 'Talent', 'Hiring'],
  },
];

// ---------------------------------------------------------------------------
// 7-Layer Architecture (for reference in multiple pages)
// ---------------------------------------------------------------------------

export const SEVEN_LAYERS = [
  { number: 7, name: 'Governance & Compliance', components: ['Tenant Isolation', 'Audit Logging', 'Access Control', 'Data Retention'] },
  { number: 6, name: 'Orchestration & Workflow', components: ['Schedule Registry', 'CSO Orchestrator', 'Scan Queue', 'WebSocket', 'Health Monitor'] },
  { number: 5, name: 'Task Definitions', components: ['DailySync', 'WeeklyAnalysis', 'MonthlyExecutive', 'NewsDiscovery', 'DigestWorkflow'] },
  { number: 4, name: 'Knowledge Management', components: ['pgvector', 'Notion Connector', 'Vector Embeddings', 'Semantic Search', 'Multi-source'] },
  { number: 3, name: 'Roles & Agents', components: ['56+ Agents', 'Growth (14+12)', 'Photo Booth (9)', 'Intel (3)', 'CRM (18)'] },
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
