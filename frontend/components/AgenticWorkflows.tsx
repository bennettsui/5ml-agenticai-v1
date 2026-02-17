'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Workflow, Brain, Users, Newspaper, Camera, Megaphone, FileSpreadsheet,
  BookOpen, Zap, RefreshCw, Shield, Search, PenTool, BarChart3, Target,
  Eye, Image, QrCode, Database, Globe, Mail, TrendingUp, Layers, Bot,
  ZoomIn, ZoomOut, Maximize2, AlertTriangle, Send, Trash2, MessageSquare,
  UserCheck, Sparkles, ChevronRight, PanelRightOpen, PanelRightClose,
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Error: ${data.error}`,
          mode: chatMode,
          timestamp: new Date(),
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.message,
          mode: chatMode,
          timestamp: new Date(),
        }]);

        // Apply any workflow modifications
        if (data.workflow_updates && data.workflow_updates.length > 0) {
          applyUpdates(data.workflow_updates);
        }
      }
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Failed to connect to the chat API. Please check the server is running.',
        mode: chatMode,
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, chatMode, messages, active, applyUpdates]);

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
                  onClick={() => setMessages([])}
                  className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-slate-300"
                  title="Clear chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
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
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
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
