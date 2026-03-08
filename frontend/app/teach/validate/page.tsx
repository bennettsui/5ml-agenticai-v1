'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft, ChevronRight, Loader2, AlertCircle, CheckCircle,
  Edit2, Check, X, ZoomIn, ZoomOut, RefreshCw, ArrowRight,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BBox { x: number; y: number; w: number; h: number }

interface Element {
  id: number;
  type: string;
  content: string;
  content_zh: string;
  bbox: BBox;
  confidence: number;
  needs_review: boolean;
  // teacher corrections
  corrected_content?: string;
  corrected_zh?: string;
}

// ─── Color map by element type ────────────────────────────────────────────────

const TYPE_COLORS: Record<string, { border: string; bg: string; label: string; dot: string }> = {
  question_number: { border: '#f87171', bg: 'rgba(248,113,113,0.12)', label: 'Q#',      dot: 'bg-red-400' },
  question_stem:   { border: '#a78bfa', bg: 'rgba(167,139,250,0.12)', label: 'Stem',    dot: 'bg-violet-400' },
  sub_part:        { border: '#818cf8', bg: 'rgba(129,140,248,0.12)', label: 'Sub',     dot: 'bg-indigo-400' },
  math_expression: { border: '#f472b6', bg: 'rgba(244,114,182,0.12)', label: 'Math',    dot: 'bg-pink-400' },
  diagram:         { border: '#fb923c', bg: 'rgba(251,146,60,0.12)',  label: 'Diagram', dot: 'bg-orange-400' },
  graph:           { border: '#fbbf24', bg: 'rgba(251,191,36,0.12)', label: 'Graph',   dot: 'bg-amber-400' },
  table:           { border: '#34d399', bg: 'rgba(52,211,153,0.12)', label: 'Table',   dot: 'bg-emerald-400' },
  option:          { border: '#60a5fa', bg: 'rgba(96,165,250,0.12)', label: 'Option',  dot: 'bg-blue-400' },
  answer_line:     { border: '#94a3b8', bg: 'rgba(148,163,184,0.08)', label: 'Ans',    dot: 'bg-slate-400' },
  instruction:     { border: '#64748b', bg: 'rgba(100,116,139,0.08)', label: 'Instr',  dot: 'bg-slate-500' },
};

function typeColor(type: string) {
  return TYPE_COLORS[type] ?? { border: '#94a3b8', bg: 'rgba(148,163,184,0.08)', label: type, dot: 'bg-slate-400' };
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function Legend() {
  const types = ['question_number','question_stem','sub_part','math_expression','diagram','graph','table','option','answer_line'];
  return (
    <div className="flex flex-wrap gap-2 text-[10px]">
      {types.map(t => {
        const c = typeColor(t);
        return (
          <span key={t} className="flex items-center gap-1 text-slate-400">
            <span className={`w-2 h-2 rounded-sm shrink-0 ${c.dot}`} />
            {c.label}
          </span>
        );
      })}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

function ValidateInner() {
  const searchParams = useSearchParams();
  const id           = searchParams.get('paper_id') || '';
  const router       = useRouter();

  // PDF state
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc]         = useState<any>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage]             = useState(1);
  const [scale, setScale]           = useState(1.4);
  const [pdfError, setPdfError]     = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);

  // Recognition state
  const [elements, setElements]     = useState<Element[]>([]);
  const [analyzing, setAnalyzing]   = useState(false);
  const [analyzed, setAnalyzed]     = useState<Set<number>>(new Set());
  const [hoveredId, setHoveredId]   = useState<number | null>(null);
  const [editingId, setEditingId]   = useState<number | null>(null);
  const [editDraft, setEditDraft]   = useState({ content: '', content_zh: '' });

  // Load pdfjs from CDN (avoids bundler complexity)
  useEffect(() => {
    if ((window as any).__pdfjsLib) return;
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    };
    document.head.appendChild(script);
  }, []);

  // Load PDF
  useEffect(() => {
    const pdfUrl = `/api/adaptive-learning/teachers/papers/${id}/file`;
    let cancelled = false;

    async function load() {
      setPdfLoading(true); setPdfError('');
      try {
        const lib = (window as any).pdfjsLib;
        if (!lib) { setPdfError('PDF viewer not loaded yet. Refresh the page.'); return; }
        const doc = await lib.getDocument(pdfUrl).promise;
        if (cancelled) return;
        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        setPage(1);
      } catch (e: any) {
        if (!cancelled) setPdfError(e.message || 'Failed to load PDF');
      } finally {
        if (!cancelled) setPdfLoading(false);
      }
    }

    // Wait for pdfjsLib to be available
    const interval = setInterval(() => {
      if ((window as any).pdfjsLib) { clearInterval(interval); load(); }
    }, 300);
    setTimeout(() => clearInterval(interval), 10000);

    return () => { cancelled = true; clearInterval(interval); };
  }, [id]);

  // Render page to canvas
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
    // Clear elements when page changes
    setElements([]);
    setAnalyzed(prev => { const n = new Set(prev); n.delete(page); return n; });
  }, [pdfDoc, page, scale, renderPage]);

  // ─── Run visual analysis on current page ────────────────────────────────────

  const analyzeCurrentPage = async () => {
    if (!canvasRef.current) return;
    setAnalyzing(true);
    try {
      const canvas  = canvasRef.current;
      const b64     = canvas.toDataURL('image/png').replace('data:image/png;base64,', '');
      const res     = await fetch(`/api/adaptive-learning/teachers/papers/${id}/visual-extract`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ page_image_base64: b64, page_number: page, mime_type: 'image/png' }),
      });
      const data = await res.json();
      if (data.success) {
        setElements(data.elements || []);
        setAnalyzed(prev => new Set([...prev, page]));
      }
    } catch (e: any) {
      console.error('Visual extract failed:', e.message);
    } finally {
      setAnalyzing(false);
    }
  };

  // ─── Inline editing ─────────────────────────────────────────────────────────

  const startEdit = (el: Element) => {
    setEditingId(el.id);
    setEditDraft({
      content:    el.corrected_content ?? el.content,
      content_zh: el.corrected_zh     ?? el.content_zh,
    });
  };

  const saveEdit = (elId: number) => {
    setElements(prev => prev.map(e => e.id === elId
      ? { ...e, corrected_content: editDraft.content, corrected_zh: editDraft.content_zh, needs_review: false }
      : e
    ));
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  // ─── Proceed to review ───────────────────────────────────────────────────────

  const proceedToReview = () => {
    router.push(`/teach/questions/pending?paper_id=${id}`);
  };

  // ─── Canvas overlay ──────────────────────────────────────────────────────────

  const canvasWidth  = canvasRef.current?.width  || 0;
  const canvasHeight = canvasRef.current?.height || 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/teach/papers" className="text-slate-500 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Visual Validation</h1>
            <p className="text-slate-400 text-xs mt-0.5">Verify AI reading · correct errors · then proceed to review</p>
          </div>
        </div>
        <button
          onClick={proceedToReview}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          Review Questions
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <Legend />

      {/* Main split layout */}
      <div className="flex gap-4" style={{ minHeight: '70vh' }}>

        {/* LEFT: PDF canvas */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          {/* Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Page nav */}
            <div className="flex items-center gap-1 bg-slate-800/60 border border-slate-700/50 rounded-xl px-2 py-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="text-slate-400 hover:text-white disabled:opacity-30 transition-colors p-1">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs text-slate-300 px-2">Page {page} / {totalPages || '?'}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="text-slate-400 hover:text-white disabled:opacity-30 transition-colors p-1">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Zoom */}
            <div className="flex items-center gap-1 bg-slate-800/60 border border-slate-700/50 rounded-xl px-2 py-1">
              <button onClick={() => setScale(s => Math.max(0.6, s - 0.2))}
                className="text-slate-400 hover:text-white transition-colors p-1">
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs text-slate-400 px-1">{Math.round(scale * 100)}%</span>
              <button onClick={() => setScale(s => Math.min(3, s + 0.2))}
                className="text-slate-400 hover:text-white transition-colors p-1">
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Analyze button */}
            <button
              onClick={analyzeCurrentPage}
              disabled={analyzing || !pdfDoc}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 rounded-xl text-xs font-medium transition-colors disabled:opacity-40"
            >
              {analyzing
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing…</>
                : analyzed.has(page)
                  ? <><RefreshCw className="w-3.5 h-3.5" /> Re-analyze</>
                  : <><ZoomIn className="w-3.5 h-3.5" /> Analyze Page</>
              }
            </button>

            {analyzed.has(page) && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                {elements.length} elements detected
              </span>
            )}
          </div>

          {/* Canvas + overlay container */}
          <div className="overflow-auto bg-slate-900/60 border border-slate-700/50 rounded-2xl p-3">
            {pdfLoading && (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
              </div>
            )}
            {pdfError && (
              <div className="flex items-start gap-2 text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Could not load PDF</p>
                  <p className="text-xs text-amber-400/80 mt-1">{pdfError}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    The local file may have been wiped (Fly.dev ephemeral FS). Check the{' '}
                    <Link href="/teach/storage" className="text-purple-400 underline">Storage page</Link>{' '}
                    to push to CDN or re-upload.
                  </p>
                </div>
              </div>
            )}

            {/* Relative container for canvas + overlay boxes */}
            <div className="relative inline-block">
              <canvas ref={canvasRef} className="block max-w-full" />

              {/* Bounding box overlays */}
              {elements.map(el => {
                const c = typeColor(el.type);
                const isHovered  = hoveredId === el.id;
                const isEditing  = editingId === el.id;
                const needsFlag  = el.needs_review && !el.corrected_content;
                return (
                  <div
                    key={el.id}
                    onMouseEnter={() => setHoveredId(el.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => !isEditing && startEdit(el)}
                    style={{
                      position:  'absolute',
                      left:      `${el.bbox.x}%`,
                      top:       `${el.bbox.y}%`,
                      width:     `${el.bbox.w}%`,
                      height:    `${el.bbox.h}%`,
                      border:    `2px solid ${isHovered || isEditing ? c.border : (needsFlag ? '#f59e0b' : c.border)}`,
                      background: isHovered || isEditing ? c.bg : 'transparent',
                      opacity:   isHovered || isEditing ? 1 : 0.7,
                      cursor:    'pointer',
                      boxSizing: 'border-box',
                      transition: 'all 0.15s',
                    }}
                  >
                    {/* Type label tag */}
                    <span style={{
                      position:  'absolute',
                      top:       '-18px',
                      left:      0,
                      background: c.border,
                      color:     '#fff',
                      fontSize:  '9px',
                      fontWeight: 700,
                      padding:   '1px 5px',
                      borderRadius: '3px 3px 3px 0',
                      whiteSpace: 'nowrap',
                      lineHeight: '16px',
                    }}>
                      {c.label}{needsFlag ? ' ⚠' : ''}{el.corrected_content ? ' ✓' : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: Element list + editing panel */}
        <div className="w-80 shrink-0 flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: '80vh' }}>
          {elements.length === 0 && !analyzing && (
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 text-center">
              <ZoomIn className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">Click <strong className="text-slate-400">Analyze Page</strong> to run visual recognition on this page.</p>
            </div>
          )}

          {analyzing && (
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 text-center">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-2" />
              <p className="text-slate-400 text-sm">Gemini is reading the page…</p>
              <p className="text-slate-600 text-xs mt-1">Detecting questions, math, diagrams</p>
            </div>
          )}

          {elements.map(el => {
            const c         = typeColor(el.type);
            const isHov     = hoveredId === el.id;
            const isEditing = editingId === el.id;
            const display   = el.corrected_content ?? el.content;
            const displayZh = el.corrected_zh     ?? el.content_zh;
            const corrected = !!el.corrected_content;
            const needsFlag = el.needs_review && !corrected;

            return (
              <div
                key={el.id}
                onMouseEnter={() => setHoveredId(el.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`bg-slate-800/60 border rounded-xl overflow-hidden transition-all ${
                  isHov || isEditing ? 'border-slate-500/60' : needsFlag ? 'border-amber-500/30' : 'border-slate-700/50'
                }`}
              >
                {/* Header row */}
                <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-700/30">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${c.dot}`} />
                  <span className="text-[10px] text-slate-400 font-medium flex-1">{c.label}</span>
                  {needsFlag && <span className="text-[10px] text-amber-400 flex items-center gap-0.5"><AlertCircle className="w-3 h-3" />Review</span>}
                  {corrected  && <span className="text-[10px] text-emerald-400 flex items-center gap-0.5"><CheckCircle className="w-3 h-3" />Corrected</span>}
                  <span className="text-[10px] text-slate-600">{Math.round(el.confidence * 100)}%</span>

                  {!isEditing && (
                    <button onClick={() => startEdit(el)} className="text-slate-500 hover:text-white transition-colors">
                      <Edit2 className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Content */}
                {!isEditing ? (
                  <div className="px-3 py-2">
                    <p className={`text-xs leading-relaxed ${needsFlag ? 'text-amber-200' : 'text-slate-200'}`}>
                      {display || <span className="text-slate-600 italic">(empty)</span>}
                    </p>
                    {displayZh && (
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{displayZh}</p>
                    )}
                  </div>
                ) : (
                  /* Inline edit form */
                  <div className="px-3 py-2 space-y-2">
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-1">English / Reading</label>
                      <textarea
                        rows={3}
                        value={editDraft.content}
                        onChange={e => setEditDraft(d => ({ ...d, content: e.target.value }))}
                        autoFocus
                        className="w-full bg-slate-900/60 border border-slate-600/50 rounded-lg px-2 py-1.5 text-white text-xs resize-none focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-1">Chinese (optional)</label>
                      <textarea
                        rows={2}
                        value={editDraft.content_zh}
                        onChange={e => setEditDraft(d => ({ ...d, content_zh: e.target.value }))}
                        className="w-full bg-slate-900/60 border border-slate-600/50 rounded-lg px-2 py-1.5 text-white text-xs resize-none focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(el.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 rounded-lg text-[10px] font-medium transition-colors"
                      >
                        <Check className="w-3 h-3" />Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex items-center gap-1 px-3 py-1.5 text-slate-500 hover:text-slate-300 text-[10px] transition-colors"
                      >
                        <X className="w-3 h-3" />Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Proceed button at bottom of list */}
          {elements.length > 0 && (
            <button
              onClick={proceedToReview}
              className="flex items-center justify-center gap-2 w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold transition-colors mt-2"
            >
              Proceed to Review Questions
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ValidatePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <ValidateInner />
    </Suspense>
  );
}
