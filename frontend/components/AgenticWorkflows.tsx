'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Workflow,
  Brain,
  Users,
  Newspaper,
  Camera,
  Megaphone,
  FileSpreadsheet,
  BookOpen,
  Zap,
  RefreshCw,
  Shield,
  Search,
  PenTool,
  BarChart3,
  Target,
  Eye,
  Image,
  QrCode,
  Database,
  Globe,
  Mail,
  TrendingUp,
  Layers,
  Bot,
  ZoomIn,
  ZoomOut,
  Maximize2,
  AlertTriangle,
} from 'lucide-react';

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

// ────────────────────────────────────────────
// Workflow Definitions
// ────────────────────────────────────────────

const workflows: WorkflowDef[] = [
  {
    id: 'marketing',
    title: 'CSO Marketing Agents',
    subtitle: '9 specialized agents with conditional orchestration',
    icon: TrendingUp,
    gradient: 'from-purple-500 to-pink-600',
    pattern: 'Conditional Orchestration',
    patternDesc: 'CSO orchestrator conditionally activates specialists based on brief analysis, with quality reflection loop',
    trigger: 'API Request (POST /social/generate)',
    canvasWidth: 1100,
    canvasHeight: 520,
    nodes: [
      { id: 'cso', name: 'CSO Orchestrator', role: 'Analyzes brief, selects agents', icon: Workflow, color: '#a855f7', x: 80, y: 200 },
      { id: 'research', name: 'Research Agent', role: 'Market research', icon: Search, color: '#3b82f6', x: 340, y: 40 },
      { id: 'customer', name: 'Customer Agent', role: 'Persona analysis', icon: Users, color: '#06b6d4', x: 340, y: 140 },
      { id: 'competitor', name: 'Competitor Agent', role: 'Competitive intel', icon: Target, color: '#f97316', x: 340, y: 240 },
      { id: 'strategy', name: 'Strategy Agent', role: 'Campaign strategy', icon: Brain, color: '#22c55e', x: 340, y: 340 },
      { id: 'seo', name: 'SEO Agent', role: 'Search optimization', icon: TrendingUp, color: '#10b981', x: 340, y: 440 },
      { id: 'creative', name: 'Creative Agent', role: 'Ad copy & content', icon: PenTool, color: '#ec4899', x: 610, y: 140 },
      { id: 'social', name: 'Social Agent', role: 'Social strategy', icon: Globe, color: '#6366f1', x: 610, y: 290 },
      { id: 'sentinel', name: 'Sentinel Agent', role: 'Quality review', icon: Shield, color: '#ef4444', x: 880, y: 200 },
    ],
    edges: [
      { from: 'cso', to: 'research', label: 'if needed', type: 'conditional' },
      { from: 'cso', to: 'customer', label: 'if needed', type: 'conditional' },
      { from: 'cso', to: 'competitor', label: 'if needed', type: 'conditional' },
      { from: 'cso', to: 'strategy', type: 'solid' },
      { from: 'cso', to: 'seo', label: 'if needed', type: 'conditional' },
      { from: 'research', to: 'creative', type: 'solid' },
      { from: 'customer', to: 'creative', type: 'solid' },
      { from: 'competitor', to: 'social', type: 'solid' },
      { from: 'strategy', to: 'social', type: 'solid' },
      { from: 'creative', to: 'sentinel', type: 'solid' },
      { from: 'social', to: 'sentinel', type: 'solid' },
      { from: 'sentinel', to: 'cso', label: 'reflection loop', type: 'feedback' },
    ],
  },
  {
    id: 'ads',
    title: 'Ads Performance Pipeline',
    subtitle: '8 agents in a cron-scheduled sequential pipeline',
    icon: Megaphone,
    gradient: 'from-orange-500 to-red-600',
    pattern: 'Cron-Batch Pipeline',
    patternDesc: 'Daily/weekly pipeline processes 5 concurrent tenants through a fixed analysis sequence',
    trigger: 'Cron (Daily 07:00, Weekly Sun 08:00 HKT)',
    canvasWidth: 1100,
    canvasHeight: 380,
    nodes: [
      { id: 'meta-fetch', name: 'Meta Fetcher', role: 'Pull Meta campaigns', icon: Megaphone, color: '#3b82f6', x: 60, y: 80 },
      { id: 'google-fetch', name: 'Google Fetcher', role: 'Pull Google campaigns', icon: Globe, color: '#22c55e', x: 60, y: 230 },
      { id: 'normalizer', name: 'Data Normalizer', role: 'Unify metrics', icon: Database, color: '#06b6d4', x: 300, y: 155 },
      { id: 'anomaly', name: 'Anomaly Detector', role: 'Flag unusual shifts', icon: AlertTriangle, color: '#f59e0b', x: 460, y: 155 },
      { id: 'funnel', name: 'Funnel Analyzer', role: 'Conversion analysis', icon: BarChart3, color: '#a855f7', x: 620, y: 155 },
      { id: 'budget', name: 'Budget Planner', role: 'Budget allocation', icon: Target, color: '#10b981', x: 780, y: 80 },
      { id: 'recommend', name: 'Recommendation Writer', role: 'Action items', icon: PenTool, color: '#ec4899', x: 780, y: 230 },
      { id: 'internal', name: 'Internal Strategy', role: 'Cross-tenant patterns', icon: Brain, color: '#6366f1', x: 980, y: 155 },
    ],
    edges: [
      { from: 'meta-fetch', to: 'normalizer', type: 'solid' },
      { from: 'google-fetch', to: 'normalizer', type: 'solid' },
      { from: 'normalizer', to: 'anomaly', type: 'solid' },
      { from: 'anomaly', to: 'funnel', type: 'solid' },
      { from: 'funnel', to: 'budget', type: 'solid' },
      { from: 'funnel', to: 'recommend', type: 'solid' },
      { from: 'budget', to: 'internal', label: 'weekly', type: 'conditional' },
      { from: 'recommend', to: 'internal', label: 'weekly', type: 'conditional' },
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
    title: 'CRM Knowledge Agents',
    subtitle: 'Event-driven feedback analysis and knowledge extraction',
    icon: BookOpen,
    gradient: 'from-emerald-500 to-teal-600',
    pattern: 'Event-Driven Analysis',
    patternDesc: 'Client feedback triggers analysis chain that extracts patterns and enriches future interactions',
    trigger: 'API Request (POST /crm/feedback)',
    canvasWidth: 900,
    canvasHeight: 300,
    nodes: [
      { id: 'feedback', name: 'Feedback Analyzer', role: 'Sentiment & themes', icon: Brain, color: '#3b82f6', x: 60, y: 110 },
      { id: 'pattern', name: 'Pattern Recognizer', role: 'Cross-client patterns', icon: Search, color: '#a855f7', x: 280, y: 110 },
      { id: 'kb', name: 'KB Search Engine', role: 'Semantic search', icon: Database, color: '#06b6d4', x: 500, y: 40 },
      { id: 'context', name: 'Context Builder', role: 'History + brand rules', icon: Layers, color: '#22c55e', x: 500, y: 200 },
      { id: 'chat', name: 'Chat Agent', role: 'Client-facing AI', icon: Bot, color: '#10b981', x: 730, y: 110 },
    ],
    edges: [
      { from: 'feedback', to: 'pattern', type: 'solid' },
      { from: 'pattern', to: 'kb', label: 'updates rules', type: 'solid' },
      { from: 'kb', to: 'context', label: 'on query', type: 'conditional' },
      { from: 'context', to: 'chat', type: 'solid' },
    ],
  },
];

// ────────────────────────────────────────────
// Constants & SVG helpers
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
  return { x1, y1, x2, y2 };
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
// Component
// ────────────────────────────────────────────

export default function AgenticWorkflows() {
  const [selected, setSelected] = useState<string>(workflows[0].id);
  const [zoom, setZoom] = useState(1);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const active = workflows.find(w => w.id === selected) || workflows[0];

  const totalAgents = workflows.reduce((sum, w) => sum + w.nodes.length, 0);

  const fitToView = useCallback(() => {
    if (!canvasRef.current) return;
    const containerWidth = canvasRef.current.parentElement?.clientWidth || 800;
    const scale = Math.min(1, (containerWidth - 48) / active.canvasWidth);
    setZoom(Math.max(0.5, Math.min(1.2, scale)));
  }, [active.canvasWidth]);

  useEffect(() => { fitToView(); }, [selected, fitToView]);
  useEffect(() => {
    const handleResize = () => fitToView();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fitToView]);

  const connectedEdges = hoveredNode ? active.edges.filter(e => e.from === hoveredNode || e.to === hoveredNode) : [];
  const connectedNodeIds = new Set<string>();
  if (hoveredNode) {
    connectedNodeIds.add(hoveredNode);
    connectedEdges.forEach(e => { connectedNodeIds.add(e.from); connectedNodeIds.add(e.to); });
  }

  return (
    <div className="text-white space-y-4">
      {/* Summary badges */}
      <div className="flex items-center gap-3 text-xs">
        <span className="px-2.5 py-1 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-full font-medium">
          {totalAgents} Agents
        </span>
        <span className="px-2.5 py-1 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-full font-medium">
          {workflows.length} Workflows
        </span>
      </div>

      {/* Workflow Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {workflows.map(w => {
          const Icon = w.icon;
          const isActive = w.id === selected;
          return (
            <button
              key={w.id}
              onClick={() => setSelected(w.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-white/10 text-white border border-white/20 shadow-lg'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : ''}`} />
              {w.title}
              <span className={`text-xs px-1.5 py-0.5 rounded ${isActive ? 'bg-white/10' : 'bg-white/5'}`}>
                {w.nodes.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Info Bar */}
      <div className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-xl px-5 py-3">
        <div className="flex items-center gap-6">
          <div>
            <div className="text-xs text-slate-500 mb-0.5">Pattern</div>
            <div className="text-sm font-medium">{active.pattern}</div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div>
            <div className="text-xs text-slate-500 mb-0.5">Trigger</div>
            <div className="text-sm font-medium flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              {active.trigger}
            </div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="max-w-md">
            <div className="text-xs text-slate-500 mb-0.5">Description</div>
            <div className="text-xs text-slate-400">{active.patternDesc}</div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-4">
          <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 transition-colors" title="Zoom out">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-500 w-10 text-center font-mono">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(1.5, z + 0.1))} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 transition-colors" title="Zoom in">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={fitToView} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 transition-colors ml-1" title="Fit to view">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="bg-[#12131f] border border-white/5 rounded-2xl overflow-hidden relative">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="overflow-auto p-6" style={{ maxHeight: '70vh' }}>
          <div
            ref={canvasRef}
            className="relative mx-auto transition-transform duration-200"
            style={{ width: active.canvasWidth, height: active.canvasHeight, transform: `scale(${zoom})`, transformOrigin: 'top left', marginBottom: active.canvasHeight * (zoom - 1), marginRight: active.canvasWidth * (zoom - 1) }}
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
                <div key={node.id} className={`absolute select-none transition-all duration-200 ${isDimmed ? 'opacity-20' : ''}`} style={{ left: node.x, top: node.y, width: NODE_W, height: NODE_H }} onMouseEnter={() => setHoveredNode(node.id)} onMouseLeave={() => setHoveredNode(null)}>
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
      <div className="flex items-center gap-6 text-xs text-slate-500 px-2">
        <div className="flex items-center gap-2">
          <svg width="24" height="2"><line x1="0" y1="1" x2="24" y2="1" stroke="#475569" strokeWidth="1.5" /></svg>
          <span>Direct flow</span>
        </div>
        <div className="flex items-center gap-2">
          <svg width="24" height="2"><line x1="0" y1="1" x2="24" y2="1" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 2" /></svg>
          <span>Conditional</span>
        </div>
        <div className="flex items-center gap-2">
          <svg width="24" height="2"><line x1="0" y1="1" x2="24" y2="1" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="6 4" /></svg>
          <span>Feedback loop</span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="w-3 h-3 text-amber-400" />
          <span>Trigger</span>
        </div>
      </div>

      {/* Overview Grid */}
      <div className="pt-4">
        <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-400" />
          All Workflows
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workflows.map(w => {
            const Icon = w.icon;
            return (
              <button key={w.id} onClick={() => { setSelected(w.id); }} className={`text-left bg-white/[0.03] border rounded-xl p-5 transition-all hover:bg-white/[0.06] ${w.id === selected ? 'border-purple-500/30 bg-purple-500/5' : 'border-white/5'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${w.gradient}`}><Icon className="w-4 h-4 text-white" /></div>
                  <div>
                    <h3 className="font-semibold text-sm">{w.title}</h3>
                    <p className="text-[10px] text-slate-500">{w.pattern}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mb-3 line-clamp-2">{w.patternDesc}</p>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Bot className="w-3 h-3" />{w.nodes.length} agents</span>
                  <span className="flex items-center gap-1"><Workflow className="w-3 h-3" />{w.edges.length} connections</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
