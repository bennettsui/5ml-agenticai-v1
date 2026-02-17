'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Workflow, Brain, Users, Newspaper, Camera, Megaphone, FileSpreadsheet,
  BookOpen, Zap, RefreshCw, Shield, Search, PenTool, BarChart3, Target,
  Eye, Image, QrCode, Database, Globe, Mail, TrendingUp, Layers, Bot,
  ZoomIn, ZoomOut, Maximize2, AlertTriangle, Send, Trash2, MessageSquare,
  UserCheck, Sparkles, ChevronRight, PanelRightOpen, PanelRightClose,
  Plus,
} from 'lucide-react';
import {
  createSession, getLatestSession, addMessage as persistMessage,
  pruneExpiredSessions,
} from '@/lib/chat-history';
import MessageActions from '@/components/MessageActions';

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

interface NodeDef {
  id: string;
  name: string;
  role: string;
  icon: React.ElementType;
  color: string;
  x: number;
  y: number;
}

interface EdgeDef {
  from: string;
  to: string;
  label?: string;
  type: 'solid' | 'conditional' | 'feedback';
}

interface WorkflowDef {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  gradient: string;
  pattern: string;
  patternDesc: string;
  trigger: string;
  canvasWidth: number;
  canvasHeight: number;
  nodes: NodeDef[];
  edges: EdgeDef[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mode: string;
  timestamp: Date;
}

// ────────────────────────────────────────────
// Initial Workflow Definitions
// ────────────────────────────────────────────

const INITIAL_WORKFLOWS: WorkflowDef[] = [
  {
    id: 'marketing',
    title: 'CSO Marketing Agents',
    subtitle: '14 agents — event-driven parallel pipeline with circuit breakers',
    icon: TrendingUp,
    gradient: 'from-purple-500 to-pink-600',
    pattern: 'Event-Driven Parallel Pipeline',
    patternDesc: 'Budget-gated parallel research → strategy synthesis → multi-channel creative → compliance/quality gate with circuit-breaker feedback (max 2 retries)',
    trigger: 'API Request (POST /social/generate)',
    canvasWidth: 1500,
    canvasHeight: 580,
    nodes: [
      // Column 1: Entry
      { id: 'validator', name: 'Input Validator', role: 'Sanitize & validate API requests', icon: Zap, color: '#64748b', x: 60, y: 260 },
      // Column 2: Control
      { id: 'cso', name: 'CSO Orchestrator', role: 'Event dispatch, strategy coordination · DeepSeek ($0.14/M)', icon: Workflow, color: '#a855f7', x: 260, y: 150 },
      { id: 'budget', name: 'Budget Optimizer', role: 'Cost constraints, model routing · DeepSeek ($0.14/M)', icon: Target, color: '#10b981', x: 260, y: 380 },
      // Column 3: Research Phase (parallel)
      { id: 'research', name: 'Research Agent', role: 'Brand & market research · Haiku ($0.25/M)', icon: Search, color: '#3b82f6', x: 500, y: 50 },
      { id: 'customer', name: 'Customer Agent', role: 'Persona & audience analysis · Haiku ($0.25/M)', icon: Users, color: '#06b6d4', x: 500, y: 190 },
      { id: 'competitor', name: 'Competitor Agent', role: 'Competitive intel · Perplexity ($3/M)', icon: Target, color: '#f97316', x: 500, y: 330 },
      { id: 'seo', name: 'SEO Agent', role: 'Search & keyword optimization · Haiku ($0.25/M)', icon: TrendingUp, color: '#22c55e', x: 500, y: 470 },
      // Column 4: Strategy & Creative
      { id: 'strategy', name: 'Strategy Agent', role: 'Campaign strategy synthesis · DeepSeek ($0.14/M)', icon: Brain, color: '#8b5cf6', x: 740, y: 130 },
      { id: 'creative', name: 'Creative Agent', role: 'Ad copy, content, visuals · Sonnet ($3/M)', icon: PenTool, color: '#ec4899', x: 740, y: 340 },
      // Column 5: Channels & Compliance
      { id: 'social', name: 'Social Agent', role: 'Social strategy & scheduling · DeepSeek ($0.14/M)', icon: Globe, color: '#6366f1', x: 980, y: 70 },
      { id: 'multichannel', name: 'Multi-Channel', role: 'Social + email + search + display · DeepSeek ($0.14/M)', icon: Mail, color: '#0ea5e9', x: 980, y: 240 },
      { id: 'compliance', name: 'Compliance Agent', role: 'FTC, GDPR, platform policies · Haiku ($0.25/M)', icon: Eye, color: '#f59e0b', x: 980, y: 420 },
      // Column 6: Quality & Output
      { id: 'sentinel', name: 'Sentinel Agent', role: 'Quality gate · circuit breaker (max 2×) · DeepSeek ($0.14/M)', icon: Shield, color: '#ef4444', x: 1220, y: 150 },
      { id: 'tracker', name: 'Performance Tracker', role: 'KPI monitoring & feedback loop · Haiku ($0.25/M)', icon: BarChart3, color: '#14b8a6', x: 1220, y: 380 },
    ],
    edges: [
      // Entry chain
      { from: 'validator', to: 'cso', label: 'validated', type: 'solid' },
      { from: 'cso', to: 'budget', label: 'cost constraints', type: 'solid' },
      // Parallel research phase
      { from: 'budget', to: 'research', label: 'parallel', type: 'conditional' },
      { from: 'budget', to: 'customer', label: 'parallel', type: 'conditional' },
      { from: 'budget', to: 'competitor', label: 'parallel', type: 'conditional' },
      { from: 'budget', to: 'seo', label: 'parallel', type: 'conditional' },
      // Research → Strategy merge
      { from: 'research', to: 'strategy', type: 'solid' },
      { from: 'customer', to: 'strategy', type: 'solid' },
      { from: 'competitor', to: 'strategy', type: 'solid' },
      // Strategy → Creative phase
      { from: 'strategy', to: 'creative', type: 'solid' },
      { from: 'seo', to: 'creative', type: 'solid' },
      // Creative → Channels
      { from: 'creative', to: 'social', type: 'solid' },
      { from: 'creative', to: 'multichannel', type: 'solid' },
      { from: 'social', to: 'multichannel', type: 'solid' },
      // Channels → Quality gate
      { from: 'multichannel', to: 'compliance', type: 'solid' },
      { from: 'compliance', to: 'sentinel', label: 'cleared', type: 'solid' },
      // Output & feedback
      { from: 'sentinel', to: 'tracker', label: 'approved', type: 'solid' },
      { from: 'sentinel', to: 'cso', label: 'reject (max 2×)', type: 'feedback' },
    ],
  },
  {
    id: 'ads',
    title: 'Ads Performance Pipeline',
    subtitle: '12 agents — orchestrated pipeline with temporal data strategy, validation & backfill',
    icon: Megaphone,
    gradient: 'from-orange-500 to-red-600',
    pattern: 'Orchestrated Cron Pipeline',
    patternDesc: 'Orchestrator routes cron triggers → parallel fetch with 72h priority + historical backfill → normalize → validate → anomaly/funnel analysis → budget/recommendations → internal strategy → report generation. Circuit breakers (10min timeout), quality scoring, cost-optimized model routing.',
    trigger: 'Cron (Daily 07:00, Weekly Sun 08:00 HKT)',
    canvasWidth: 1400,
    canvasHeight: 500,
    nodes: [
      // Column 1: Entry
      { id: 'orchestrator', name: 'Pipeline Orchestrator', role: 'Trigger routing, circuit breakers, recovery · Haiku ($0.25/M)', icon: Workflow, color: '#a855f7', x: 60, y: 210 },
      // Column 2: Data Fetch (parallel)
      { id: 'meta-fetch', name: 'Meta Fetcher', role: '72h priority + historical backfill · DeepSeek ($0.14/M)', icon: Megaphone, color: '#3b82f6', x: 280, y: 50 },
      { id: 'google-fetch', name: 'Google Fetcher', role: '72h priority + historical backfill · DeepSeek ($0.14/M)', icon: Globe, color: '#22c55e', x: 280, y: 210 },
      { id: 'backfill', name: 'Backfill Manager', role: 'Historical recovery · 1 month/run · DeepSeek ($0.14/M)', icon: RefreshCw, color: '#64748b', x: 280, y: 380 },
      // Column 3: Normalize
      { id: 'normalizer', name: 'Data Normalizer', role: 'Unify metrics, dedupe, timezone · DeepSeek ($0.14/M)', icon: Database, color: '#06b6d4', x: 500, y: 130 },
      // Column 4: Validate
      { id: 'validator', name: 'Data Validator', role: 'Schema, temporal, business checks · DeepSeek ($0.14/M)', icon: Shield, color: '#ef4444', x: 660, y: 130 },
      // Column 5: Analysis (parallel)
      { id: 'anomaly', name: 'Anomaly Detector', role: 'Trend breaks, unusual shifts · Haiku ($0.25/M)', icon: AlertTriangle, color: '#f59e0b', x: 840, y: 50 },
      { id: 'funnel', name: 'Funnel Analyzer', role: 'Conversion funnels, attribution · Haiku ($0.25/M)', icon: BarChart3, color: '#a855f7', x: 840, y: 250 },
      // Column 6: Strategy (parallel)
      { id: 'budget', name: 'Budget Planner', role: 'Allocation & forecasting · DeepSeek ($0.14/M)', icon: Target, color: '#10b981', x: 1020, y: 50 },
      { id: 'recommend', name: 'Recommendation Writer', role: 'Action items & optimization · Haiku ($0.25/M)', icon: PenTool, color: '#ec4899', x: 1020, y: 250 },
      // Column 7: Output
      { id: 'internal', name: 'Internal Strategy', role: 'Cross-tenant patterns · Sonnet ($3/M)', icon: Brain, color: '#6366f1', x: 1220, y: 100 },
      { id: 'reporter', name: 'Report Generator', role: 'Weekly/monthly reports & alerts · Haiku ($0.25/M)', icon: FileSpreadsheet, color: '#14b8a6', x: 1220, y: 310 },
    ],
    edges: [
      // Orchestrator routing
      { from: 'orchestrator', to: 'meta-fetch', label: 'daily/weekly', type: 'conditional' },
      { from: 'orchestrator', to: 'google-fetch', label: 'daily/weekly', type: 'conditional' },
      { from: 'orchestrator', to: 'backfill', label: 'if capacity', type: 'conditional' },
      // Fetch → Normalize
      { from: 'meta-fetch', to: 'normalizer', type: 'solid' },
      { from: 'google-fetch', to: 'normalizer', type: 'solid' },
      { from: 'backfill', to: 'normalizer', label: 'historical', type: 'solid' },
      // Normalize → Validate
      { from: 'normalizer', to: 'validator', type: 'solid' },
      // Validate → Analysis (parallel)
      { from: 'validator', to: 'anomaly', label: 'pass/flag', type: 'conditional' },
      { from: 'validator', to: 'funnel', label: 'pass/flag', type: 'conditional' },
      // Validator feedback
      { from: 'validator', to: 'orchestrator', label: 'block → retry', type: 'feedback' },
      // Analysis → Strategy
      { from: 'anomaly', to: 'budget', type: 'solid' },
      { from: 'funnel', to: 'budget', type: 'solid' },
      { from: 'funnel', to: 'recommend', type: 'solid' },
      // Strategy → Output
      { from: 'budget', to: 'internal', label: 'weekly', type: 'conditional' },
      { from: 'recommend', to: 'internal', label: 'weekly', type: 'conditional' },
      { from: 'recommend', to: 'reporter', type: 'solid' },
      { from: 'internal', to: 'reporter', label: 'weekly', type: 'conditional' },
      // Reporter feedback
      { from: 'reporter', to: 'orchestrator', label: 'run complete', type: 'feedback' },
    ],
  },
  {
    id: 'photobooth',
    title: 'AI Photo Booth Pipeline',
    subtitle: '9 agents in a sequential state machine',
    icon: Camera,
    gradient: 'from-amber-500 to-orange-600',
    pattern: 'Sequential State Machine',
    patternDesc: 'Each photo session progresses through a fixed agent sequence with state transitions tracked per session',
    trigger: 'User Upload (WebSocket session)',
    canvasWidth: 1100,
    canvasHeight: 380,
    nodes: [
      { id: 'session', name: 'Session Manager', role: 'Creates session', icon: Workflow, color: '#3b82f6', x: 60, y: 70 },
      { id: 'face', name: 'Face Quality', role: 'Detect & validate', icon: Eye, color: '#06b6d4', x: 60, y: 230 },
      { id: 'environ', name: 'Environment', role: 'Background analysis', icon: Search, color: '#22c55e', x: 280, y: 70 },
      { id: 'style', name: 'Style Generator', role: '18th century prompt', icon: PenTool, color: '#a855f7', x: 280, y: 230 },
      { id: 'imggen', name: 'Image Generation', role: 'ComfyUI pipeline', icon: Image, color: '#ec4899', x: 500, y: 150 },
      { id: 'brand', name: 'Branding Overlay', role: 'Event branding', icon: Layers, color: '#6366f1', x: 700, y: 70 },
      { id: 'qr', name: 'QR Delivery', role: 'Download QR code', icon: QrCode, color: '#10b981', x: 700, y: 230 },
      { id: 'analytics', name: 'Analytics Logger', role: 'Session metrics', icon: BarChart3, color: '#f97316', x: 920, y: 70 },
      { id: 'gallery', name: 'Gallery Manager', role: 'Event gallery', icon: Database, color: '#64748b', x: 920, y: 230 },
    ],
    edges: [
      { from: 'session', to: 'face', type: 'solid' },
      { from: 'face', to: 'environ', type: 'solid' },
      { from: 'environ', to: 'style', type: 'solid' },
      { from: 'style', to: 'imggen', type: 'solid' },
      { from: 'imggen', to: 'brand', type: 'solid' },
      { from: 'brand', to: 'qr', type: 'solid' },
      { from: 'qr', to: 'analytics', type: 'solid' },
      { from: 'analytics', to: 'gallery', type: 'solid' },
    ],
  },
  {
    id: 'intelligence',
    title: 'Topic Intelligence Agents',
    subtitle: '3 core agents with multi-topic cron scheduling',
    icon: Newspaper,
    gradient: 'from-teal-500 to-cyan-600',
    pattern: 'Fan-Out / Fan-In',
    patternDesc: 'Cron triggers parallel scraping across 5 sources per topic, merges through analysis and distribution',
    trigger: 'Cron Schedule (Staggered, 10s apart per topic)',
    canvasWidth: 900,
    canvasHeight: 380,
    nodes: [
      { id: 'cron', name: 'Cron Trigger', role: 'Staggered schedule', icon: RefreshCw, color: '#64748b', x: 60, y: 150 },
      { id: 'src1', name: 'Source 1', role: 'Concurrent scrape', icon: Globe, color: '#3b82f6', x: 280, y: 20 },
      { id: 'src2', name: 'Source 2', role: 'Concurrent scrape', icon: Globe, color: '#3b82f6', x: 280, y: 100 },
      { id: 'src3', name: 'Source 3', role: 'Concurrent scrape', icon: Globe, color: '#3b82f6', x: 280, y: 180 },
      { id: 'src4', name: 'Source 4', role: 'Concurrent scrape', icon: Globe, color: '#3b82f6', x: 280, y: 260 },
      { id: 'src5', name: 'Source 5', role: 'Concurrent scrape', icon: Globe, color: '#3b82f6', x: 280, y: 340 },
      { id: 'analyst', name: 'News Analyst', role: 'AI analysis & dedup', icon: Brain, color: '#a855f7', x: 530, y: 150 },
      { id: 'notion', name: 'Notion Sync', role: 'Database update', icon: Database, color: '#22c55e', x: 730, y: 80 },
      { id: 'writer', name: 'Newsletter Writer', role: 'Weekly digest', icon: Mail, color: '#10b981', x: 730, y: 230 },
    ],
    edges: [
      { from: 'cron', to: 'src1', type: 'solid' },
      { from: 'cron', to: 'src2', type: 'solid' },
      { from: 'cron', to: 'src3', type: 'solid' },
      { from: 'cron', to: 'src4', type: 'solid' },
      { from: 'cron', to: 'src5', type: 'solid' },
      { from: 'src1', to: 'analyst', type: 'solid' },
      { from: 'src2', to: 'analyst', type: 'solid' },
      { from: 'src3', to: 'analyst', type: 'solid' },
      { from: 'src4', to: 'analyst', type: 'solid' },
      { from: 'src5', to: 'analyst', type: 'solid' },
      { from: 'analyst', to: 'notion', type: 'solid' },
      { from: 'analyst', to: 'writer', label: 'weekly', type: 'conditional' },
    ],
  },
  {
    id: 'receipts',
    title: 'Receipt Tracking Pipeline',
    subtitle: 'Checkpoint-based OCR and categorization',
    icon: FileSpreadsheet,
    gradient: 'from-blue-500 to-cyan-600',
    pattern: 'Checkpoint Pipeline',
    patternDesc: 'Receipts progress through OCR and categorization checkpoints with state persisted at each step',
    trigger: 'Dropbox Webhook (new file upload)',
    canvasWidth: 1050,
    canvasHeight: 320,
    nodes: [
      { id: 'dropbox', name: 'Dropbox Watcher', role: 'Monitor uploads', icon: Database, color: '#3b82f6', x: 60, y: 120 },
      { id: 'tesseract', name: 'Tesseract OCR', role: 'Text extraction', icon: Eye, color: '#06b6d4', x: 260, y: 120 },
      { id: 'vision', name: 'Claude Vision', role: 'AI field extraction', icon: Brain, color: '#a855f7', x: 460, y: 40 },
      { id: 'categorize', name: 'Auto-Categorizer', role: 'HK tax categories', icon: Target, color: '#22c55e', x: 460, y: 210 },
      { id: 'db', name: 'Database Writer', role: 'Persist with checkpoint', icon: Database, color: '#6366f1', x: 700, y: 120 },
      { id: 'excel', name: 'Excel Exporter', role: 'P&L generation', icon: FileSpreadsheet, color: '#10b981', x: 900, y: 120 },
    ],
    edges: [
      { from: 'dropbox', to: 'tesseract', type: 'solid' },
      { from: 'tesseract', to: 'vision', label: 'low confidence', type: 'conditional' },
      { from: 'tesseract', to: 'categorize', label: 'high confidence', type: 'conditional' },
      { from: 'vision', to: 'categorize', type: 'solid' },
      { from: 'categorize', to: 'db', type: 'solid' },
      { from: 'db', to: 'excel', label: 'on export', type: 'conditional' },
    ],
  },
  {
    id: 'crm',
    title: 'CRM Relationship Intelligence',
    subtitle: '18 agents — Relationship Intelligence Platform with orchestrator, scoring & signal analysis',
    icon: BookOpen,
    gradient: 'from-emerald-500 to-teal-600',
    pattern: 'Orchestrated Relationship Intelligence',
    patternDesc: 'Relationship Orchestrator routes triggers → Phase 0 research → data collection & communication analysis → validation → Relationship Graph → pattern/scoring/connection intelligence → strategy & execution → quality gate → RAG-powered chat. Tier-based model routing with cost optimization.',
    trigger: 'New Client / Relationship Signal / Simple Query / Quarterly Review',
    canvasWidth: 1700,
    canvasHeight: 680,
    nodes: [
      // Entry: Relationship Orchestrator
      { id: 'orchestrator', name: 'Rel. Orchestrator', role: 'Entry · Trigger classification & routing · Haiku ($0.25/M)', icon: Workflow, color: '#a855f7', x: 60, y: 290 },
      // Phase 0: Pre-CRM Setup & Research
      { id: 'brand-discover', name: 'Brand Discovery', role: 'Phase 0 · Web search, basic profile · Haiku ($0.25/M)', icon: Search, color: '#3b82f6', x: 280, y: 40 },
      { id: 'market-research', name: 'Market Research', role: 'Phase 0 · Industry context & trends · Perplexity ($3/M)', icon: Globe, color: '#06b6d4', x: 280, y: 180 },
      { id: 'competitor-analysis', name: 'Competitor Analysis', role: 'Phase 0 · Market position · Perplexity ($3/M)', icon: Target, color: '#f97316', x: 280, y: 320 },
      { id: 'linkedin-analyzer', name: 'LinkedIn Analyzer', role: 'Phase 0 · Key contacts, org structure · Haiku ($0.25/M)', icon: Users, color: '#8b5cf6', x: 280, y: 460 },
      // Phase 1: Data Ingestion & Communication
      { id: 'brand-monitor', name: 'Brand Monitor', role: 'Phase 1 · News, mentions, social · Haiku ($0.25/M)', icon: Eye, color: '#22c55e', x: 520, y: 40 },
      { id: 'crm-collector', name: 'CRM Data Collector', role: 'Phase 1 · Feedback, emails, forms · DeepSeek ($0.14/M)', icon: Mail, color: '#0ea5e9', x: 520, y: 200 },
      { id: 'comm-analyzer', name: 'Comms Analyzer', role: 'Phase 1 · Tone, responsiveness, patterns · Haiku ($0.25/M)', icon: MessageSquare, color: '#f59e0b', x: 520, y: 380 },
      // Phase 2: Validation & Normalization
      { id: 'data-validator', name: 'Data Validator', role: 'Phase 2 · Early validation checkpoint · DeepSeek ($0.14/M)', icon: Shield, color: '#64748b', x: 730, y: 100 },
      { id: 'normalizer', name: 'Data Normalizer', role: 'Phase 2 · Clean, dedupe, normalize', icon: Database, color: '#64748b', x: 730, y: 310 },
      // Phase 3: Relationship Graph
      { id: 'rel-graph', name: 'Relationship Graph', role: 'Phase 3 · Strength metrics, temporal tracking · DeepSeek ($0.14/M)', icon: Layers, color: '#a855f7', x: 940, y: 210 },
      // Phase 4: Intelligence Layer
      { id: 'pattern-detect', name: 'Pattern Recognizer', role: 'Phase 4 · Cross-brand patterns · DeepSeek ($0.14/M)', icon: Brain, color: '#ec4899', x: 1140, y: 60 },
      { id: 'rel-scorer', name: 'Relationship Scorer', role: 'Phase 4 · Multi-factor scoring, at-risk detection · DeepSeek ($0.14/M)', icon: TrendingUp, color: '#10b981', x: 1140, y: 230 },
      { id: 'connection-suggest', name: 'Connection Suggester', role: 'Phase 4 · Development opportunities · DeepSeek ($0.14/M)', icon: UserCheck, color: '#06b6d4', x: 1140, y: 400 },
      // Phase 5-6: Strategy & Execution
      { id: 'strategy-planner', name: 'Strategy Planner', role: 'Phase 5 · Budget, resource allocation · Sonnet ($3/M)', icon: Target, color: '#6366f1', x: 1340, y: 100 },
      { id: 'crm-updater', name: 'CRM Updater', role: 'Phase 6 · System updates, alerts · Haiku ($0.25/M)', icon: Database, color: '#22c55e', x: 1340, y: 300 },
      { id: 'quality-gate', name: 'Quality Gate', role: 'Phase 6 · Completeness validator · DeepSeek ($0.14/M)', icon: Shield, color: '#ef4444', x: 1340, y: 490 },
      // Phase 7: UI & Interaction
      { id: 'context-builder', name: 'Context Builder', role: 'Phase 7 · History + relationship rules + RAG', icon: BookOpen, color: '#06b6d4', x: 1540, y: 170 },
      { id: 'chat-agent', name: 'CRM Chat Agent', role: 'Phase 7 · Client-facing AI · Sonnet ($3/M)', icon: Bot, color: '#10b981', x: 1540, y: 400 },
    ],
    edges: [
      // Orchestrator routing (entry point)
      { from: 'orchestrator', to: 'brand-discover', label: 'new client', type: 'conditional' },
      { from: 'orchestrator', to: 'comm-analyzer', label: 'rel. signal', type: 'conditional' },
      { from: 'orchestrator', to: 'chat-agent', label: 'simple query', type: 'conditional' },
      { from: 'orchestrator', to: 'brand-monitor', label: 'quarterly', type: 'conditional' },
      // Phase 0 parallel research → Phase 2 validation
      { from: 'brand-discover', to: 'data-validator', type: 'solid' },
      { from: 'market-research', to: 'data-validator', label: 'parallel', type: 'solid' },
      { from: 'competitor-analysis', to: 'data-validator', label: 'parallel', type: 'solid' },
      { from: 'linkedin-analyzer', to: 'normalizer', label: 'contacts', type: 'solid' },
      // Phase 1 ongoing feeds → normalizer
      { from: 'brand-monitor', to: 'normalizer', type: 'solid' },
      { from: 'crm-collector', to: 'normalizer', type: 'solid' },
      { from: 'comm-analyzer', to: 'normalizer', type: 'solid' },
      // Phase 2 internal
      { from: 'data-validator', to: 'normalizer', label: 'validated', type: 'solid' },
      // Phase 2 → 3
      { from: 'normalizer', to: 'rel-graph', type: 'solid' },
      // Phase 3 → 4
      { from: 'rel-graph', to: 'pattern-detect', type: 'solid' },
      { from: 'rel-graph', to: 'rel-scorer', type: 'solid' },
      { from: 'rel-graph', to: 'connection-suggest', type: 'solid' },
      // Phase 4 → 5-6
      { from: 'pattern-detect', to: 'strategy-planner', type: 'solid' },
      { from: 'rel-scorer', to: 'strategy-planner', type: 'solid' },
      { from: 'connection-suggest', to: 'strategy-planner', type: 'solid' },
      { from: 'strategy-planner', to: 'crm-updater', type: 'solid' },
      { from: 'strategy-planner', to: 'quality-gate', label: 'validate', type: 'conditional' },
      // Quality gate feedback
      { from: 'quality-gate', to: 'brand-discover', label: 'gaps → re-research', type: 'feedback' },
      // Relationship scorer feedback loop
      { from: 'rel-scorer', to: 'orchestrator', label: 'at-risk alert', type: 'feedback' },
      // Phase 6 → 7
      { from: 'crm-updater', to: 'context-builder', type: 'solid' },
      { from: 'pattern-detect', to: 'context-builder', label: 'rules', type: 'conditional' },
      { from: 'context-builder', to: 'chat-agent', type: 'solid' },
    ],
  },
];

// ────────────────────────────────────────────
// SVG helpers
// ────────────────────────────────────────────

const NODE_W = 160;
const NODE_H = 56;

function getNodeCenter(node: NodeDef) { return { x: node.x + NODE_W / 2, y: node.y + NODE_H / 2 }; }

function getEdgePoints(from: NodeDef, to: NodeDef) {
  const fc = getNodeCenter(from);
  const tc = getNodeCenter(to);
  const dx = tc.x - fc.x;
  const dy = tc.y - fc.y;
  let x1: number, y1: number, x2: number, y2: number;
  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0) { x1 = from.x + NODE_W; y1 = fc.y; x2 = to.x; y2 = tc.y; }
    else { x1 = from.x; y1 = fc.y; x2 = to.x + NODE_W; y2 = tc.y; }
  } else {
    if (dy > 0) { x1 = fc.x; y1 = from.y + NODE_H; x2 = tc.x; y2 = to.y; }
    else { x1 = fc.x; y1 = from.y; x2 = tc.x; y2 = to.y + NODE_H; }
  }
  return { x1: x1!, y1: y1!, x2: x2!, y2: y2! };
}

function buildPath(x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1, dy = y2 - y1;
  if (Math.abs(dx) > Math.abs(dy)) {
    const cx = dx / 2;
    return `M${x1},${y1} C${x1 + cx},${y1} ${x2 - cx},${y2} ${x2},${y2}`;
  } else {
    const cy = dy / 2;
    return `M${x1},${y1} C${x1},${y1 + cy} ${x2},${y2 - cy} ${x2},${y2}`;
  }
}

// ────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────

export default function AgenticWorkflows() {
  // Workflow state (mutable — chatbot can modify)
  const [workflows, setWorkflows] = useState<WorkflowDef[]>(INITIAL_WORKFLOWS);
  const [selected, setSelected] = useState<string>('marketing');
  const [zoom, setZoom] = useState(1);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan state
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  // Chat state
  const [chatMode, setChatMode] = useState<'assistant' | 'business_analyst'>('assistant');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Prune stale empty sessions, then load previous workflow chat session on mount
  useEffect(() => {
    pruneExpiredSessions();
    const prev = getLatestSession('workflow');
    if (prev && prev.messages.length > 0) {
      setMessages(prev.messages.map((m, i) => ({
        id: `loaded-${i}`,
        role: m.role,
        content: m.content,
        mode: m.metadata?.mode as string || 'assistant',
        timestamp: new Date(m.timestamp),
      })));
      setChatSessionId(prev.id);
    } else {
      const fresh = createSession('workflow');
      setChatSessionId(fresh.id);
    }
  }, []);

  const startNewChat = useCallback(() => {
    const fresh = createSession('workflow');
    setChatSessionId(fresh.id);
    setMessages([]);
  }, []);

  const active = workflows.find(w => w.id === selected) || workflows[0];
  const totalAgents = workflows.reduce((sum, w) => sum + w.nodes.length, 0);

  // ── Canvas zoom & pan ──────────────────────
  const fitToView = useCallback(() => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth || 600;
    const containerHeight = containerRef.current.clientHeight || 400;
    const scale = Math.min(1, (containerWidth - 48) / active.canvasWidth, (containerHeight - 48) / active.canvasHeight);
    const newZoom = Math.max(0.4, Math.min(1.2, scale));
    setZoom(newZoom);
    // Center the canvas
    const scaledW = active.canvasWidth * newZoom;
    const scaledH = active.canvasHeight * newZoom;
    setPanX((containerWidth - scaledW) / 2);
    setPanY((containerHeight - scaledH) / 2);
  }, [active.canvasWidth, active.canvasHeight]);

  useEffect(() => { fitToView(); }, [selected, fitToView]);
  useEffect(() => {
    const handleResize = () => fitToView();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fitToView]);

  // ── Drag-to-pan handlers ───────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only pan on left-click on the background (not on nodes)
    if (e.button !== 0) return;
    isPanning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY, panX, panY };
    e.preventDefault();
  }, [panX, panY]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setPanX(panStart.current.panX + dx);
    setPanY(panStart.current.panY + dy);
  }, []);

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  useEffect(() => {
    const onMouseUp = () => { isPanning.current = false; };
    window.addEventListener('mouseup', onMouseUp);
    return () => window.removeEventListener('mouseup', onMouseUp);
  }, []);

  // ── Pinch-to-zoom (trackpad) & scroll-zoom ─
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Pinch-to-zoom on Mac trackpad (reports as ctrlKey + wheel)
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Calculate new zoom
        const delta = -e.deltaY * 0.01;
        const newZoom = Math.max(0.2, Math.min(2.5, zoom + delta));
        const scaleFactor = newZoom / zoom;

        // Zoom towards mouse position
        const newPanX = mouseX - (mouseX - panX) * scaleFactor;
        const newPanY = mouseY - (mouseY - panY) * scaleFactor;

        setZoom(newZoom);
        setPanX(newPanX);
        setPanY(newPanY);
      } else {
        // Normal two-finger scroll → pan
        e.preventDefault();
        setPanX(prev => prev - e.deltaX);
        setPanY(prev => prev - e.deltaY);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [zoom, panX, panY]);

  // ── Auto-scroll chat ──────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Edge highlighting ─────────────────────
  const connectedEdges = hoveredNode ? active.edges.filter(e => e.from === hoveredNode || e.to === hoveredNode) : [];
  const connectedNodeIds = new Set<string>();
  if (hoveredNode) {
    connectedNodeIds.add(hoveredNode);
    connectedEdges.forEach(e => { connectedNodeIds.add(e.from); connectedNodeIds.add(e.to); });
  }

  // ── Apply workflow updates from chat ──────
  const applyUpdates = useCallback((updates: Array<{ action: string; [key: string]: string }>) => {
    setWorkflows(prev => {
      const next = prev.map(w => {
        if (w.id !== selected) return w;
        let nodes = [...w.nodes];
        let edges = [...w.edges];
        let meta = { pattern: w.pattern, patternDesc: w.patternDesc, trigger: w.trigger };

        for (const upd of updates) {
          if (upd.action === 'update_node') {
            nodes = nodes.map(n =>
              n.id === upd.node_id
                ? { ...n, ...(upd.name ? { name: upd.name } : {}), ...(upd.role ? { role: upd.role } : {}) }
                : n
            );
          } else if (upd.action === 'remove_node') {
            nodes = nodes.filter(n => n.id !== upd.node_id);
            edges = edges.filter(e => e.from !== upd.node_id && e.to !== upd.node_id);
          } else if (upd.action === 'add_edge') {
            if (upd.from && upd.to) {
              edges.push({ from: upd.from, to: upd.to, label: upd.label, type: (upd.edge_type as EdgeDef['type']) || 'solid' });
            }
          } else if (upd.action === 'remove_edge') {
            edges = edges.filter(e => !(e.from === upd.from && e.to === upd.to));
          } else if (upd.action === 'update_meta') {
            if (upd.pattern) meta.pattern = upd.pattern;
            if (upd.patternDesc) meta.patternDesc = upd.patternDesc;
            if (upd.trigger) meta.trigger = upd.trigger;
          }
        }

        return { ...w, nodes, edges, ...meta };
      });
      return next;
    });
  }, [selected]);

  // ── Send chat message ─────────────────────
  const sendMessage = useCallback(async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: msg,
      mode: chatMode,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Persist user message
    if (chatSessionId) persistMessage(chatSessionId, { role: 'user', content: msg, timestamp: new Date().toISOString(), metadata: { mode: chatMode } });

    try {
      const res = await fetch('/api/workflow-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          workflow: {
            id: active.id,
            title: active.title,
            pattern: active.pattern,
            patternDesc: active.patternDesc,
            trigger: active.trigger,
            nodes: active.nodes.map(n => ({ id: n.id, name: n.name, role: n.role })),
            edges: active.edges.map(e => ({ from: e.from, to: e.to, label: e.label, type: e.type })),
          },
          mode: chatMode,
        }),
      });

      const data = await res.json();

      if (data.error) {
        const errContent = `Error: ${data.error}`;
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: errContent,
          mode: chatMode,
          timestamp: new Date(),
        }]);
        if (chatSessionId) persistMessage(chatSessionId, { role: 'assistant', content: errContent, timestamp: new Date().toISOString() });
      } else {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.message,
          mode: chatMode,
          timestamp: new Date(),
        }]);
        if (chatSessionId) persistMessage(chatSessionId, { role: 'assistant', content: data.message, timestamp: new Date().toISOString(), metadata: { rag_used: data.rag_used } });

        // Apply any workflow modifications
        if (data.workflow_updates && data.workflow_updates.length > 0) {
          applyUpdates(data.workflow_updates);
        }
      }
    } catch {
      const failMsg = 'Failed to connect to the chat API. Please check the server is running.';
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: failMsg,
        mode: chatMode,
        timestamp: new Date(),
      }]);
      if (chatSessionId) persistMessage(chatSessionId, { role: 'assistant', content: failMsg, timestamp: new Date().toISOString() });
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, chatMode, messages, active, applyUpdates, chatSessionId]);

  // ── Suggestions ───────────────────────────
  const suggestions = chatMode === 'business_analyst'
    ? [
        `What are the bottlenecks in the ${active.title}?`,
        `Critique the ROI of each agent in this workflow`,
        `What happens if the ${active.nodes[0]?.name} fails?`,
      ]
    : [
        `Explain how the ${active.title} workflow operates`,
        `Change the ${active.nodes[0]?.name}'s role to include error handling`,
        `What improvements would you suggest for this pipeline?`,
      ];

  // ── Render ────────────────────────────────
  return (
    <div className="text-white flex h-[calc(100vh-160px)] min-h-[600px] gap-0">
      {/* ━━━ LEFT: Use Case Selector ━━━ */}
      <div className="w-56 shrink-0 bg-[#0f1019] border-r border-white/5 flex flex-col overflow-y-auto">
        <div className="px-4 pt-4 pb-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Use Cases</div>
          <div className="flex gap-2 text-xs">
            <span className="px-2 py-0.5 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-full">
              {totalAgents} agents
            </span>
            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-full">
              {workflows.length} flows
            </span>
          </div>
        </div>

        <div className="flex-1 px-2 py-2 space-y-1">
          {workflows.map(w => {
            const Icon = w.icon;
            const isActive = w.id === selected;
            return (
              <button
                key={w.id}
                onClick={() => setSelected(w.id)}
                className={`w-full text-left rounded-xl px-3 py-3 transition-all ${
                  isActive
                    ? 'bg-white/10 border border-white/15 shadow-lg'
                    : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-1">
                  <div className={`p-1.5 rounded-lg bg-gradient-to-br ${w.gradient}`}>
                    <Icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className={`text-xs font-semibold truncate ${isActive ? 'text-white' : 'text-slate-400'}`}>
                    {w.title}
                  </span>
                </div>
                <div className="pl-8">
                  <div className="text-[10px] text-slate-500">{w.pattern}</div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-600 mt-0.5">
                    <span>{w.nodes.length} agents</span>
                    <span>{w.edges.length} edges</span>
                  </div>
                </div>
                {isActive && (
                  <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ━━━ CENTER: Workflow Diagram ━━━ */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#12131f]">
        {/* Info bar */}
        <div className="flex items-center justify-between bg-white/[0.03] border-b border-white/5 px-4 py-2.5 shrink-0">
          <div className="flex items-center gap-5 min-w-0">
            <div className="min-w-0">
              <div className="text-xs text-slate-500">Pattern</div>
              <div className="text-sm font-medium truncate">{active.pattern}</div>
            </div>
            <div className="w-px h-7 bg-white/10 shrink-0" />
            <div className="min-w-0">
              <div className="text-xs text-slate-500">Trigger</div>
              <div className="text-xs font-medium flex items-center gap-1.5 truncate">
                <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                {active.trigger}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-3">
            <button onClick={() => {
              if (!containerRef.current) return;
              const rect = containerRef.current.getBoundingClientRect();
              const cx = rect.width / 2, cy = rect.height / 2;
              const newZoom = Math.max(0.2, zoom - 0.1);
              const sf = newZoom / zoom;
              setPanX(cx - (cx - panX) * sf);
              setPanY(cy - (cy - panY) * sf);
              setZoom(newZoom);
            }} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400" title="Zoom out"><ZoomOut className="w-4 h-4" /></button>
            <span className="text-xs text-slate-500 w-10 text-center font-mono">{Math.round(zoom * 100)}%</span>
            <button onClick={() => {
              if (!containerRef.current) return;
              const rect = containerRef.current.getBoundingClientRect();
              const cx = rect.width / 2, cy = rect.height / 2;
              const newZoom = Math.min(2.5, zoom + 0.1);
              const sf = newZoom / zoom;
              setPanX(cx - (cx - panX) * sf);
              setPanY(cy - (cy - panY) * sf);
              setZoom(newZoom);
            }} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400" title="Zoom in"><ZoomIn className="w-4 h-4" /></button>
            <button onClick={fitToView} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 ml-1" title="Fit to view"><Maximize2 className="w-4 h-4" /></button>
            <div className="w-px h-5 bg-white/10 mx-1" />
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400"
              title={chatOpen ? 'Hide chat' : 'Show chat'}
            >
              {chatOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="px-4 py-2 text-xs text-slate-500 border-b border-white/5 shrink-0">
          {active.patternDesc}
        </div>

        {/* Canvas */}
        <div
          ref={containerRef}
          className="flex-1 relative overflow-hidden"
          style={{ cursor: isPanning.current ? 'grabbing' : 'grab' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
              backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
              backgroundPosition: `${panX}px ${panY}px`,
            }}
          />
          <div className="absolute" style={{ left: 0, top: 0 }}>
            <div
              ref={canvasRef}
              className="relative"
              style={{
                width: active.canvasWidth,
                height: active.canvasHeight,
                transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
                transformOrigin: '0 0',
              }}
            >
              {/* SVG Edges */}
              <svg className="absolute inset-0 pointer-events-none" width={active.canvasWidth} height={active.canvasHeight} style={{ overflow: 'visible' }}>
                <defs>
                  <marker id="ah-solid" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#64748b" /></marker>
                  <marker id="ah-conditional" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#f59e0b" /></marker>
                  <marker id="ah-feedback" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#a855f7" /></marker>
                  <marker id="ah-highlight" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#ffffff" /></marker>
                </defs>
                {active.edges.map((edge, idx) => {
                  const fromNode = active.nodes.find(n => n.id === edge.from);
                  const toNode = active.nodes.find(n => n.id === edge.to);
                  if (!fromNode || !toNode) return null;
                  const { x1, y1, x2, y2 } = getEdgePoints(fromNode, toNode);
                  const path = buildPath(x1, y1, x2, y2);
                  const isHighlighted = hoveredNode && connectedEdges.includes(edge);
                  const isDimmed = hoveredNode && !isHighlighted;
                  const strokeColors: Record<string, string> = { solid: '#475569', conditional: '#f59e0b', feedback: '#a855f7' };
                  return (
                    <g key={idx}>
                      <path d={path} fill="none" stroke={isHighlighted ? '#ffffff' : strokeColors[edge.type] || '#475569'} strokeWidth={isHighlighted ? 2.5 : 1.5} strokeDasharray={edge.type === 'feedback' ? '6 4' : edge.type === 'conditional' ? '4 2' : 'none'} markerEnd={`url(#ah-${isHighlighted ? 'highlight' : edge.type})`} opacity={isDimmed ? 0.15 : 1} className="transition-all duration-200" />
                      {edge.label && <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 6} textAnchor="middle" className="text-[9px] font-medium" fill={isDimmed ? '#334155' : edge.type === 'conditional' ? '#f59e0b' : edge.type === 'feedback' ? '#a855f7' : '#64748b'} opacity={isDimmed ? 0.3 : 0.8}>{edge.label}</text>}
                    </g>
                  );
                })}
              </svg>

              {/* Nodes */}
              {active.nodes.map(node => {
                const Icon = node.icon;
                const isHovered = hoveredNode === node.id;
                const isConnected = connectedNodeIds.has(node.id);
                const isDimmed = hoveredNode && !isConnected;
                return (
                  <div key={node.id} className={`absolute select-none transition-all duration-200 ${isDimmed ? 'opacity-20' : ''}`} style={{ left: node.x, top: node.y, width: NODE_W, height: NODE_H }} onMouseEnter={() => setHoveredNode(node.id)} onMouseLeave={() => setHoveredNode(null)} onMouseDown={(e) => e.stopPropagation()}>
                    <div className={`w-full h-full rounded-xl border-2 flex items-center gap-2.5 px-3 transition-all duration-200 cursor-default ${isHovered ? 'bg-white/10 border-white/40 shadow-lg shadow-white/5 scale-105' : 'bg-[#1e1f35] border-white/[0.08] hover:border-white/20'}`} style={isHovered ? { borderColor: node.color + '80' } : {}}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: node.color + '20' }}>
                        <Icon className="w-4 h-4" style={{ color: node.color }} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold text-white truncate">{node.name}</div>
                        <div className="text-[9px] text-slate-500 truncate">{node.role}</div>
                      </div>
                    </div>
                    <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-white/20" style={{ backgroundColor: node.color + '60' }} />
                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-white/20" style={{ backgroundColor: node.color + '60' }} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 text-[10px] text-slate-500 px-4 py-2 border-t border-white/5 shrink-0">
          <div className="flex items-center gap-1.5">
            <svg width="20" height="2"><line x1="0" y1="1" x2="20" y2="1" stroke="#475569" strokeWidth="1.5" /></svg>
            <span>Direct</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg width="20" height="2"><line x1="0" y1="1" x2="20" y2="1" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 2" /></svg>
            <span>Conditional</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg width="20" height="2"><line x1="0" y1="1" x2="20" y2="1" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="6 4" /></svg>
            <span>Feedback</span>
          </div>
        </div>
      </div>

      {/* ━━━ RIGHT: Chat Panel ━━━ */}
      {chatOpen && (
        <div className="w-96 shrink-0 bg-[#0f1019] border-l border-white/5 flex flex-col">
          {/* Chat header */}
          <div className="px-4 py-3 border-b border-white/5 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-semibold">Workflow Architect</span>
              </div>
              {messages.length > 0 && (
                <button
                  onClick={startNewChat}
                  className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-slate-300"
                  title="New chat session"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Mode toggle */}
            <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
              <button
                onClick={() => setChatMode('assistant')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  chatMode === 'assistant'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                Assistant
              </button>
              <button
                onClick={() => setChatMode('business_analyst')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  chatMode === 'business_analyst'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <UserCheck className="w-3 h-3" />
                Business Analyst
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 ? (
              <div className="space-y-3">
                {/* Welcome */}
                <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {chatMode === 'business_analyst' ? (
                      <UserCheck className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-purple-400" />
                    )}
                    <span className="text-xs font-semibold">
                      {chatMode === 'business_analyst' ? 'Business Analyst Mode' : 'Workflow Architect'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {chatMode === 'business_analyst'
                      ? 'I will critically evaluate this workflow — questioning ROI, identifying bottlenecks, challenging assumptions, and suggesting improvements. I critique both you and the agents.'
                      : `I can help you understand, modify, and improve the "${active.title}" workflow. Ask me to change agent roles, add connections, or explain how the pipeline works.`
                    }
                  </p>
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-600">
                    <span className="px-1.5 py-0.5 bg-white/5 rounded">DeepSeek</span>
                    <span>+</span>
                    <span className="px-1.5 py-0.5 bg-white/5 rounded">RAG</span>
                    <span className="text-slate-700">powered</span>
                  </div>
                </div>

                {/* Suggestions */}
                <div className="space-y-1.5">
                  <div className="text-[10px] text-slate-600 uppercase tracking-wider">Try asking:</div>
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(s)}
                      className="w-full text-left text-xs text-slate-400 hover:text-white bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 rounded-lg px-3 py-2 transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group`}>
                  <div className={`max-w-[90%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-purple-500/20 text-purple-100 border border-purple-500/20'
                      : msg.mode === 'business_analyst'
                        ? 'bg-amber-500/10 text-slate-300 border border-amber-500/10'
                        : 'bg-white/[0.04] text-slate-300 border border-white/5'
                  }`}>
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-500">
                        {msg.mode === 'business_analyst' ? (
                          <><UserCheck className="w-3 h-3 text-amber-400" /> BA</>
                        ) : (
                          <><Sparkles className="w-3 h-3 text-purple-400" /> AI</>
                        )}
                      </div>
                    )}
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    <MessageActions content={msg.content} variant={msg.role === 'user' ? 'user' : 'assistant'} />
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/[0.04] border border-white/5 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span>Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-white/5 shrink-0">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={chatMode === 'business_analyst' ? 'Challenge the workflow...' : 'Ask about or modify the workflow...'}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/40 resize-none"
                rows={2}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                className={`px-3 rounded-xl transition-all ${
                  input.trim() && !isLoading
                    ? 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30'
                    : 'bg-white/5 text-slate-600 border border-white/5'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
