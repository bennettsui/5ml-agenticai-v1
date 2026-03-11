'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft, ChevronRight, Loader2, AlertCircle, CheckCircle,
  Edit2, Check, X, ZoomIn, ZoomOut, RefreshCw, FileText, Eye,
  MessageSquare, Send, Bot, User, Wand2, Activity, ChevronDown, ChevronUp,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PipelineLogEntry {
  time: string;
  message: string;
  level: 'info' | 'warn' | 'error' | 'success';
}

interface LiveProgress {
  stage: string;
  detail: string;
  questions_found: number;
  questions_analysed: number;
}

interface BBox { x: number; y: number; w: number; h: number }

interface VisualElement {
  id: number;
  type: string;
  content: string;
  content_zh: string;
  bbox: BBox;
  confidence: number;
  needs_review: boolean;
  corrected_content?: string;
  corrected_zh?: string;
}

interface OcrMeta {
  text?: string;
  options?: string[];
  image_description?: string;
  page_number?: number | null;
  question_number?: number | null;
}

interface DraftQuestion {
  id: string;
  stem_en: string;
  stem_zh: string;
  has_image: boolean;
  suggested_type: string;
  suggested_difficulty: number;
  status: string;
  raw_ocr_text?: string;
  _meta?: OcrMeta;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ─── Colour map ───────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, { border: string; bg: string; label: string; dot: string }> = {
  question_number: { border: '#f87171', bg: 'rgba(248,113,113,0.15)', label: 'Q#',      dot: 'bg-red-400' },
  question_stem:   { border: '#a78bfa', bg: 'rgba(167,139,250,0.15)', label: 'Stem',    dot: 'bg-violet-400' },
  sub_part:        { border: '#818cf8', bg: 'rgba(129,140,248,0.15)', label: 'Sub',     dot: 'bg-indigo-400' },
  math_expression: { border: '#f472b6', bg: 'rgba(244,114,182,0.15)', label: 'Math',    dot: 'bg-pink-400' },
  diagram:         { border: '#fb923c', bg: 'rgba(251,146,60,0.15)',  label: 'Diagram', dot: 'bg-orange-400' },
  graph:           { border: '#fbbf24', bg: 'rgba(251,191,36,0.15)', label: 'Graph',   dot: 'bg-amber-400' },
  table:           { border: '#34d399', bg: 'rgba(52,211,153,0.15)', label: 'Table',   dot: 'bg-emerald-400' },
  option:          { border: '#60a5fa', bg: 'rgba(96,165,250,0.15)', label: 'Option',  dot: 'bg-blue-400' },
  answer_line:     { border: '#94a3b8', bg: 'rgba(148,163,184,0.08)', label: 'Ans',    dot: 'bg-slate-400' },
  instruction:     { border: '#64748b', bg: 'rgba(100,116,139,0.08)', label: 'Instr',  dot: 'bg-slate-500' },
};

function typeColor(t: string) {
  return TYPE_COLORS[t] ?? { border: '#a78bfa', bg: 'rgba(167,139,250,0.15)', label: t, dot: 'bg-violet-400' };
}

function parseMeta(raw?: string): OcrMeta {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return { text: raw }; }
}

// ─── Load pdf.js from local /pdfjs/ (served via public/) ─────────────────────

let pdfjsLibCache: any = null;

async function getPdfJs(): Promise<any> {
  if (pdfjsLibCache) return pdfjsLibCache;
  return new Promise((resolve, reject) => {
    if ((window as any).pdfjsLib) {
      pdfjsLibCache = (window as any).pdfjsLib;
      return resolve(pdfjsLibCache);
    }
    const script = document.createElement('script');
    // Use our locally-served pdf.js (avoids CDN dependency)
    script.src  = '/pdfjs/pdf.min.js';
    script.type = 'module'; // pdfjs v5 is ES module
    script.onload = () => {
      // pdfjs v5 exports via globalThis.pdfjsLib when loaded as module
      // Give it a tick to register
      setTimeout(() => {
        const lib = (window as any).pdfjsLib;
        if (lib) {
          lib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js';
          pdfjsLibCache = lib;
          resolve(lib);
        } else {
          reject(new Error('pdf.js loaded but window.pdfjsLib not available'));
        }
      }, 100);
    };
    script.onerror = () => reject(new Error('Failed to load /pdfjs/pdf.min.js'));
    document.head.appendChild(script);
  });
}

// ─── Pipeline log panel ───────────────────────────────────────────────────────

function PipelineLog({ log, liveProgress, status }: {
  log: PipelineLogEntry[] | null;
  liveProgress: LiveProgress | null;
  status: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (expanded) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log, expanded]);

  const isRunning = status === 'OCR_RUNNING';

  const levelStyle = (level: string) => {
    if (level === 'error')   return 'text-red-400';
    if (level === 'warn')    return 'text-amber-400';
    if (level === 'success') return 'text-emerald-400';
    return 'text-slate-400';
  };
  const levelDot = (level: string) => {
    if (level === 'error')   return 'bg-red-500';
    if (level === 'warn')    return 'bg-amber-500';
    if (level === 'success') return 'bg-emerald-500';
    return 'bg-slate-600';
  };

  const statusBadge = () => {
    if (status === 'OCR_RUNNING')  return <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 flex items-center gap-1"><Loader2 className="w-2.5 h-2.5 animate-spin" />Running</span>;
    if (status === 'DRAFT_READY')  return <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400">Done</span>;
    if (status === 'OCR_ISSUE')    return <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400">Failed</span>;
    if (status === 'NEEDS_REVIEW') return <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400">Needs review</span>;
    return <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-500">{status}</span>;
  };

  if (!log && !isRunning) return null;

  return (
    <div className="bg-slate-900/40 border border-slate-700/50 rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-white/[0.02] transition-colors"
      >
        <Activity className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <span className="text-xs font-medium text-slate-400 flex-1 text-left">OCR Pipeline Log</span>
        {statusBadge()}
        {liveProgress && isRunning && (
          <span className="text-[10px] text-slate-600 ml-1">
            {liveProgress.questions_analysed}/{liveProgress.questions_found} q
          </span>
        )}
        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-600" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-600" />}
      </button>

      {expanded && (
        <div className="border-t border-slate-700/50">
          {/* Live progress bar */}
          {isRunning && liveProgress && liveProgress.questions_found > 0 && (
            <div className="px-4 py-2 border-b border-slate-700/30">
              <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                <span>{liveProgress.detail}</span>
                <span>{liveProgress.questions_analysed}/{liveProgress.questions_found}</span>
              </div>
              <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${liveProgress.questions_found ? (liveProgress.questions_analysed / liveProgress.questions_found) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}
          {isRunning && liveProgress && liveProgress.questions_found === 0 && (
            <div className="px-4 py-2 border-b border-slate-700/30 flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin text-purple-400 shrink-0" />
              <span className="text-[10px] text-slate-500">{liveProgress.detail}</span>
            </div>
          )}

          {/* Log entries */}
          <div className="max-h-52 overflow-y-auto px-4 py-2 space-y-1 font-mono">
            {(log ?? []).map((entry, i) => (
              <div key={i} className="flex items-start gap-2 text-[10px] leading-relaxed">
                <span className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${levelDot(entry.level)}`} />
                <span className="text-slate-700 shrink-0 tabular-nums">
                  {new Date(entry.time).toLocaleTimeString('en-HK', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span className={levelStyle(entry.level)}>{entry.message}</span>
              </div>
            ))}
            {isRunning && (!log || log.length === 0) && (
              <div className="text-[10px] text-slate-600 py-1">Waiting for first log entry…</div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AI Assistant panel ───────────────────────────────────────────────────────

function AiAssistant({
  paperId, paperName, drafts, currentPage, totalPages,
}: {
  paperId: string; paperName: string; drafts: DraftQuestion[];
  currentPage: number; totalPages: number;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    role: 'assistant',
    content: `Hi! I can help you review the OCR extraction for **${paperName || 'this paper'}**.\n\nI can see ${drafts.length} questions were extracted. Ask me things like:\n- "Why are there only ${drafts.length} questions? The paper has 24."\n- "Question 5 is missing its MCQ options"\n- "The image description for Q3 is wrong"\n- "Summarise what was extracted so far"`,
  }]);
  const [input, setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    try {
      // Build context for the AI
      const context = [
        `Paper: ${paperName}`,
        `Total pages: ${totalPages}, currently viewing page ${currentPage}`,
        `Questions extracted by OCR: ${drafts.length}`,
        '',
        'Extracted questions:',
        ...drafts.slice(0, 20).map((d, i) => {
          const meta = parseMeta(d.raw_ocr_text);
          return `Q${i + 1} (${d.suggested_type}, difficulty ${d.suggested_difficulty}): ${d.stem_en?.slice(0, 80)}${d.stem_en?.length > 80 ? '…' : ''}${meta.options?.length ? ` | Options: ${meta.options.join(' / ')}` : ''}${d.has_image ? ` | [Has diagram: ${meta.image_description || 'see paper'}]` : ''}`;
        }),
      ].join('\n');

      const res = await fetch('/api/adaptive-learning/teachers/ocr-assistant', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          paper_id: paperId,
          context,
          messages: [...messages, { role: 'user', content: text }],
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply || 'Sorry, I could not process that.',
      }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error — please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-700/50 shrink-0">
        <Bot className="w-4 h-4 text-purple-400" />
        <span className="text-xs font-medium text-slate-300">OCR Assistant</span>
        <span className="text-[10px] text-slate-600 ml-auto">Powered by Claude</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 text-xs">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
              m.role === 'assistant' ? 'bg-purple-500/20' : 'bg-slate-700'
            }`}>
              {m.role === 'assistant'
                ? <Bot className="w-3 h-3 text-purple-400" />
                : <User className="w-3 h-3 text-slate-400" />}
            </div>
            <div className={`rounded-xl px-3 py-2 max-w-[85%] leading-relaxed whitespace-pre-wrap ${
              m.role === 'assistant'
                ? 'bg-slate-800/60 border border-slate-700/50 text-slate-200'
                : 'bg-purple-600/20 border border-purple-500/20 text-purple-100'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
              <Bot className="w-3 h-3 text-purple-400" />
            </div>
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2">
              <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-2.5 border-t border-slate-700/50 shrink-0">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Ask about the extraction…"
            className="flex-1 bg-slate-800 border border-slate-700/50 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500 placeholder-slate-600"
          />
          <button onClick={send} disabled={!input.trim() || loading}
            className="p-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl transition-colors">
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function ValidateInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get('paper_id') || '';

  // PDF
  const canvasRef                       = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc]             = useState<any>(null);
  const [totalPages, setTotalPages]     = useState(0);
  const [page, setPage]                 = useState(1);
  const [scale, setScale]               = useState(1.5);
  const [pdfError, setPdfError]         = useState('');
  const [pdfLost, setPdfLost]           = useState(false);
  const [pdfLoading, setPdfLoading]     = useState(false);

  // Paper info
  const [paperName, setPaperName]       = useState('');
  const [paperStatus, setPaperStatus]   = useState('');
  const [reprocessing, setReprocessing] = useState(false);

  // Draft questions
  const [drafts, setDrafts]             = useState<DraftQuestion[]>([]);
  const [draftsLoading, setDraftsLoading] = useState(true);

  // Pipeline log (persisted from DB + live in-memory)
  const [pipelineLog, setPipelineLog]   = useState<PipelineLogEntry[] | null>(null);
  const [liveProgress, setLiveProgress] = useState<LiveProgress | null>(null);

  // Visual analysis
  const [elements, setElements]         = useState<VisualElement[]>([]);
  const [analyzing, setAnalyzing]       = useState(false);
  const [analyzedPages, setAnalyzedPages] = useState<Set<number>>(new Set());
  const [hoveredId, setHoveredId]       = useState<number | null>(null);
  const [editingId, setEditingId]       = useState<number | null>(null);
  const [editDraft, setEditDraft]       = useState({ content: '', content_zh: '' });

  // Right panel tab
  const [rightTab, setRightTab]         = useState<'ocr' | 'visual' | 'ai'>('ocr');

  // ─── Load paper info + draft questions (+ pipeline log) ──────────────────

  const loadDraftQuestions = useCallback(async () => {
    const r = await fetch(`/api/adaptive-learning/teachers/papers/${id}/draft-questions`);
    const d = await r.json();
    if (d.success) {
      setPaperName(d.exam_name || d.paper_name || '');
      setPaperStatus(d.status || '');
      const questions = (d.draft_questions || []).map((q: DraftQuestion) => ({
        ...q, _meta: parseMeta(q.raw_ocr_text),
      }));
      setDrafts(questions);
      if (d.pipeline_log) setPipelineLog(d.pipeline_log);
      if (d.live_progress) setLiveProgress(d.live_progress);
      else setLiveProgress(null);
    }
    return d;
  }, [id]);

  useEffect(() => {
    if (!id) return;
    loadDraftQuestions().catch(() => {}).finally(() => setDraftsLoading(false));
  }, [id, loadDraftQuestions]);

  // Poll every 3 s while OCR is running
  useEffect(() => {
    if (!id || (paperStatus !== 'OCR_RUNNING' && paperStatus !== 'UPLOADED')) return;
    const timer = setInterval(async () => {
      const d = await loadDraftQuestions().catch(() => null);
      if (d?.status !== 'OCR_RUNNING' && d?.status !== 'UPLOADED') {
        clearInterval(timer);
        setDraftsLoading(false);
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [id, paperStatus, loadDraftQuestions]);

  // ─── Load PDF (local pdf.js — no CDN dependency) ──────────────────────────

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const pdfUrl = `/api/adaptive-learning/teachers/papers/${id}/file`;

    async function load() {
      setPdfLoading(true); setPdfError(''); setPdfLost(false);
      try {
        // Pre-check: HEAD request so we can show a helpful message on 404
        // instead of the generic pdf.js "Unexpected server response (404)" error.
        const probe = await fetch(pdfUrl, { method: 'HEAD' });
        if (probe.status === 404) {
          if (!cancelled) { setPdfLost(true); setPdfLoading(false); }
          return;
        }
        const lib = await getPdfJs();
        const doc = await lib.getDocument({ url: pdfUrl, withCredentials: false }).promise;
        if (cancelled) return;
        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        setPage(1);
      } catch (e: any) {
        if (!cancelled) setPdfError(e.message);
      } finally {
        if (!cancelled) setPdfLoading(false);
      }
    }
    load();

    return () => { cancelled = true; };
  }, [id]);

  // ─── Render page ──────────────────────────────────────────────────────────

  const renderPage = useCallback(async (doc: any, pageNum: number, sc: number) => {
    if (!doc || !canvasRef.current) return;
    const pdfPage  = await doc.getPage(pageNum);
    const viewport = pdfPage.getViewport({ scale: sc });
    const canvas   = canvasRef.current;
    const ctx      = canvas.getContext('2d')!;
    canvas.height  = viewport.height;
    canvas.width   = viewport.width;
    await pdfPage.render({ canvasContext: ctx, viewport }).promise;
  }, []);

  useEffect(() => {
    if (pdfDoc) renderPage(pdfDoc, page, scale);
    setElements([]);
    setEditingId(null);
  }, [pdfDoc, page, scale, renderPage]);

  // ─── Visual analysis ──────────────────────────────────────────────────────

  const analyzeCurrentPage = async () => {
    if (!canvasRef.current) return;
    setAnalyzing(true); setRightTab('visual');
    try {
      const b64 = canvasRef.current.toDataURL('image/png').replace('data:image/png;base64,', '');
      const res = await fetch(`/api/adaptive-learning/teachers/papers/${id}/visual-extract`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page_image_base64: b64, page_number: page }),
      });
      const data = await res.json();
      if (data.success) {
        setElements(data.elements || []);
        setAnalyzedPages(prev => new Set([...prev, page]));
      }
    } catch (e: any) { console.error(e.message); }
    finally { setAnalyzing(false); }
  };

  // ─── Editing ──────────────────────────────────────────────────────────────

  const startEdit = (el: VisualElement) => {
    setEditingId(el.id);
    setEditDraft({ content: el.corrected_content ?? el.content, content_zh: el.corrected_zh ?? el.content_zh });
  };

  const saveEdit = (elId: number) => {
    setElements(prev => prev.map(e => e.id === elId
      ? { ...e, corrected_content: editDraft.content, corrected_zh: editDraft.content_zh, needs_review: false }
      : e
    ));
    setEditingId(null);
  };

  const diffLabel = (n: number) => ['', 'Easy', 'Med-Low', 'Medium', 'Hard', 'Very Hard'][n] ?? '';

  const reprocessOcr = async () => {
    setReprocessing(true);
    setPipelineLog(null);
    setLiveProgress(null);
    try {
      const res  = await fetch(`/api/adaptive-learning/teachers/papers/${id}/reprocess`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setDrafts([]);
        setDraftsLoading(true);
        setPaperStatus('OCR_RUNNING');
        // Polling is handled by the useEffect above that watches paperStatus
      }
    } catch {}
    finally { setReprocessing(false); }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/teach/papers" className="text-slate-500 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Validate Paper</h1>
            <p className="text-slate-400 text-xs mt-0.5">{paperName || 'PDF + AI reading · verify extraction'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">{drafts.length} questions extracted</span>
          <button
            onClick={reprocessOcr}
            disabled={reprocessing || draftsLoading}
            title="Re-run OCR with latest pipeline (fixes missing questions, MCQ options, images)"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-700/60 hover:bg-slate-700 border border-slate-600/50 text-slate-300 rounded-xl text-sm transition-colors disabled:opacity-40"
          >
            {reprocessing
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Re-extracting…</>
              : <><Wand2 className="w-3.5 h-3.5" />Re-run OCR</>}
          </button>
          <Link href={`/teach/questions/pending?paper_id=${id}`}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold transition-colors">
            Review Questions →
          </Link>
        </div>
      </div>

      {/* Pipeline log (shown when running or when log exists) */}
      {(paperStatus === 'OCR_RUNNING' || pipelineLog) && (
        <PipelineLog log={pipelineLog} liveProgress={liveProgress} status={paperStatus} />
      )}

      {/* OCR_ISSUE banner */}
      {paperStatus === 'OCR_ISSUE' && (
        <div className="flex items-start gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-sm">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-300 font-medium">OCR pipeline crashed</p>
            <p className="text-red-400/70 text-xs mt-0.5">
              The extraction failed — see the log above for details. Click <strong>Re-run OCR</strong> to retry, or check that GEMINI_API_KEY is set.
            </p>
          </div>
        </div>
      )}

      {/* Body: PDF | Right panel */}
      <div className="flex gap-5" style={{ minHeight: '78vh' }}>

        {/* LEFT: PDF + overlays */}
        <div className="flex-1 min-w-0 flex flex-col gap-3" style={{ maxWidth: '50%' }}>
          {/* Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-slate-800/60 border border-slate-700/50 rounded-xl px-2 py-1.5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="text-slate-400 hover:text-white disabled:opacity-30 p-1">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs text-slate-300 px-2 tabular-nums">Page {page} / {totalPages || '?'}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="text-slate-400 hover:text-white disabled:opacity-30 p-1">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-1 bg-slate-800/60 border border-slate-700/50 rounded-xl px-2 py-1.5">
              <button onClick={() => setScale(s => Math.max(0.6, +(s - 0.2).toFixed(1)))}
                className="text-slate-400 hover:text-white p-1"><ZoomOut className="w-3.5 h-3.5" /></button>
              <span className="text-xs text-slate-400 px-1 tabular-nums">{Math.round(scale * 100)}%</span>
              <button onClick={() => setScale(s => Math.min(3, +(s + 0.2).toFixed(1)))}
                className="text-slate-400 hover:text-white p-1"><ZoomIn className="w-3.5 h-3.5" /></button>
            </div>
            <button onClick={analyzeCurrentPage} disabled={analyzing || !pdfDoc}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 rounded-xl text-xs font-medium transition-colors disabled:opacity-40">
              {analyzing
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Analysing…</>
                : analyzedPages.has(page)
                  ? <><RefreshCw className="w-3.5 h-3.5" />Re-analyse</>
                  : <><Eye className="w-3.5 h-3.5" />Analyse page</>}
            </button>
            {analyzedPages.has(page) && elements.length > 0 && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />{elements.length} elements
              </span>
            )}
          </div>

          {/* Canvas */}
          <div className="overflow-auto bg-slate-900/40 border border-slate-700/50 rounded-2xl p-4 flex-1">
            {pdfLoading && (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
              </div>
            )}
            {pdfLost && (
              <div className="flex flex-col items-center justify-center h-64 gap-4 text-center px-6">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <p className="text-white font-semibold">PDF file not found</p>
                  <p className="text-slate-400 text-sm mt-1 max-w-sm leading-relaxed">
                    This paper&apos;s PDF was lost when the server restarted. Fly.io uses an ephemeral filesystem — uploaded files are wiped on every restart or deploy.
                  </p>
                  <p className="text-slate-500 text-xs mt-2">
                    The OCR questions (if already extracted) are still in the database. Re-upload the same PDF to restore the viewer.
                  </p>
                </div>
                <Link href="/teach/papers"
                  className="mt-2 flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold transition-colors">
                  ← Back to Papers to re-upload
                </Link>
              </div>
            )}
            {pdfError && (
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">PDF viewer error — showing fallback below</p>
                    <p className="text-xs text-amber-400/80 mt-1">{pdfError}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      Visual annotation requires pdf.js. If the fallback loads, you can still read the paper but cannot use Analyze Page.
                    </p>
                  </div>
                </div>
                <iframe
                  src={`/api/adaptive-learning/teachers/papers/${id}/file`}
                  className="w-full rounded-xl border border-slate-700/50"
                  style={{ height: '75vh' }}
                  title="PDF fallback viewer"
                />
              </div>
            )}
            <div className="relative inline-block">
              <canvas ref={canvasRef} className="block max-w-full rounded-lg" />
              {/* Bounding boxes */}
              {analyzedPages.has(page) && elements.map(el => {
                const c = typeColor(el.type);
                const isHov = hoveredId === el.id;
                const needsFlag = el.needs_review && !el.corrected_content;
                return (
                  <div key={el.id}
                    onMouseEnter={() => setHoveredId(el.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => { setRightTab('visual'); startEdit(el); }}
                    style={{
                      position: 'absolute',
                      left: `${el.bbox.x}%`, top: `${el.bbox.y}%`,
                      width: `${el.bbox.w}%`, height: `${el.bbox.h}%`,
                      border: `2px solid ${needsFlag ? '#f59e0b' : c.border}`,
                      background: isHov ? c.bg : 'transparent',
                      cursor: 'pointer', boxSizing: 'border-box', transition: 'background 0.12s',
                    }}>
                    <span style={{
                      position: 'absolute', top: '-18px', left: 0,
                      background: needsFlag ? '#f59e0b' : c.border,
                      color: '#fff', fontSize: '9px', fontWeight: 700,
                      padding: '1px 5px', borderRadius: '3px 3px 3px 0',
                      whiteSpace: 'nowrap', lineHeight: '16px',
                    }}>
                      {c.label}{el.corrected_content ? ' ✓' : needsFlag ? ' ⚠' : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: tabs */}
        <div className="flex-1 min-w-0 flex flex-col bg-slate-900/30 border border-slate-700/50 rounded-2xl overflow-hidden" style={{ maxHeight: '84vh' }}>
          {/* Tab bar */}
          <div className="flex border-b border-slate-700/50 shrink-0">
            {([
              ['ocr',    <FileText key="f" className="w-3.5 h-3.5" />, `OCR (${drafts.length})`],
              ['visual', <Eye key="e" className="w-3.5 h-3.5" />,      `Visual (${elements.length})`],
              ['ai',     <MessageSquare key="m" className="w-3.5 h-3.5" />, 'AI'],
            ] as [string, React.ReactNode, string][]).map(([tab, icon, label]) => (
              <button key={tab} onClick={() => setRightTab(tab as any)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-medium border-b-2 transition-colors flex-1 justify-center ${
                  rightTab === tab
                    ? 'border-purple-500 text-purple-300'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}>
                {icon}{label}
              </button>
            ))}
          </div>

          {/* OCR tab */}
          {rightTab === 'ocr' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {draftsLoading && (
                <div className="flex justify-center pt-8"><Loader2 className="w-5 h-5 animate-spin text-purple-400" /></div>
              )}
              {!draftsLoading && drafts.length === 0 && (
                <div className="text-center pt-8 text-slate-600">
                  <FileText className="w-7 h-7 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No questions extracted yet.</p>
                </div>
              )}
              {drafts.map((dq, i) => {
                const meta = dq._meta || {};
                return (
                  <div key={dq.id} className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-700/30 bg-white/[0.02]">
                      <span className="text-[10px] font-bold text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded">
                        Q{meta.question_number ?? i + 1}
                      </span>
                      {meta.page_number && (
                        <span className="text-[10px] text-slate-600">p.{meta.page_number}</span>
                      )}
                      <span className="text-[10px] text-slate-500 flex-1">{dq.suggested_type}</span>
                      <span className="text-[10px] text-slate-600">{diffLabel(dq.suggested_difficulty)}</span>
                      {dq.has_image && (
                        <span className="text-[10px] text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded">img</span>
                      )}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        dq.status === 'CONFIRMED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700/50 text-slate-500'
                      }`}>{dq.status}</span>
                    </div>
                    <div className="px-3 py-2.5 space-y-1.5">
                      <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {dq.stem_en || <span className="text-slate-600 italic">(no text)</span>}
                      </p>
                      {dq.stem_zh && <p className="text-xs text-slate-500 leading-relaxed">{dq.stem_zh}</p>}
                      {/* MCQ options */}
                      {meta.options && meta.options.length > 0 && (
                        <div className="mt-2 space-y-0.5 border-t border-slate-700/30 pt-2">
                          {meta.options.map((opt, j) => (
                            <p key={j} className="text-[11px] text-slate-400 leading-relaxed">{opt}</p>
                          ))}
                        </div>
                      )}
                      {/* Image description */}
                      {meta.image_description && (
                        <p className="text-[11px] text-amber-400/80 italic border-t border-slate-700/30 pt-1.5">
                          📊 {meta.image_description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Visual tab */}
          {rightTab === 'visual' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {!analyzedPages.has(page) && !analyzing && (
                <div className="text-center pt-8 text-slate-600">
                  <Eye className="w-7 h-7 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Click <strong className="text-slate-400">Analyse page</strong> to detect elements with bounding boxes.</p>
                </div>
              )}
              {analyzing && (
                <div className="text-center pt-8">
                  <Loader2 className="w-7 h-7 text-purple-400 animate-spin mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">Gemini reading page {page}…</p>
                </div>
              )}
              {elements.map(el => {
                const c = typeColor(el.type);
                const isHov = hoveredId === el.id;
                const isEdit = editingId === el.id;
                const display = el.corrected_content ?? el.content;
                const displayZh = el.corrected_zh ?? el.content_zh;
                return (
                  <div key={el.id}
                    onMouseEnter={() => setHoveredId(el.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className={`bg-slate-800/60 border rounded-xl overflow-hidden transition-all ${
                      isHov || isEdit ? 'border-slate-500/60' : el.needs_review && !el.corrected_content ? 'border-amber-500/30' : 'border-slate-700/50'
                    }`}>
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-700/30 bg-white/[0.02]">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${c.dot}`} />
                      <span className="text-[10px] text-slate-400 font-medium flex-1">{c.label}</span>
                      {el.needs_review && !el.corrected_content && (
                        <span className="text-[10px] text-amber-400 flex items-center gap-0.5"><AlertCircle className="w-3 h-3" />Review</span>
                      )}
                      {el.corrected_content && (
                        <span className="text-[10px] text-emerald-400 flex items-center gap-0.5"><CheckCircle className="w-3 h-3" />OK</span>
                      )}
                      <span className="text-[10px] text-slate-600">{Math.round(el.confidence * 100)}%</span>
                      {!isEdit && (
                        <button onClick={() => startEdit(el)} className="text-slate-500 hover:text-white transition-colors ml-1">
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    {!isEdit ? (
                      <div className="px-3 py-2.5 cursor-pointer" onClick={() => startEdit(el)}>
                        <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                          {display || <span className="text-slate-600 italic">(empty)</span>}
                        </p>
                        {displayZh && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{displayZh}</p>}
                      </div>
                    ) : (
                      <div className="px-3 py-2.5 space-y-2">
                        <textarea rows={3} value={editDraft.content}
                          onChange={e => setEditDraft(d => ({ ...d, content: e.target.value }))}
                          autoFocus
                          className="w-full bg-slate-900/60 border border-slate-600/50 rounded-lg px-2 py-1.5 text-white text-xs resize-none focus:outline-none focus:border-purple-500" />
                        <textarea rows={2} value={editDraft.content_zh}
                          onChange={e => setEditDraft(d => ({ ...d, content_zh: e.target.value }))}
                          placeholder="Chinese (optional)"
                          className="w-full bg-slate-900/60 border border-slate-600/50 rounded-lg px-2 py-1.5 text-white text-xs resize-none focus:outline-none focus:border-purple-500" />
                        <div className="flex gap-2">
                          <button onClick={() => saveEdit(el.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 rounded-lg text-[10px] font-medium transition-colors">
                            <Check className="w-3 h-3" />Save
                          </button>
                          <button onClick={() => setEditingId(null)}
                            className="flex items-center gap-1 px-3 py-1.5 text-slate-500 hover:text-slate-300 text-[10px] transition-colors">
                            <X className="w-3 h-3" />Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* AI tab */}
          {rightTab === 'ai' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <AiAssistant
                paperId={id}
                paperName={paperName}
                drafts={drafts}
                currentPage={page}
                totalPages={totalPages}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ValidatePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ValidateInner />
    </Suspense>
  );
}
