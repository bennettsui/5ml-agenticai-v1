'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Upload, Link2, FileText, CheckCircle2, AlertCircle, Loader2,
  ChevronLeft, ChevronRight, Download, FileSpreadsheet, History,
  Plus, Pencil, Check, X, Info, ArrowLeft, BookOpen, Sparkles,
  ChevronDown, ChevronUp,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface UploadedFile {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'done' | 'error';
  progress: number;
  error?: string;
}

interface LogLine {
  ts: string;
  msg: string;
  level?: 'info' | 'warning' | 'error';
}

interface OcrBox {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence?: number;
}

interface Receipt {
  receipt_id: string;
  image_path: string;
  image_data: string | null;
  receipt_date: string;
  vendor: string;
  description: string | null;
  amount: number | string;
  currency: string;
  tax_amount: number | string | null;
  receipt_number: string | null;
  payment_method: string | null;
  category_id: string | null;
  category_name: string | null;
  ocr_confidence: number | string | null;
  ocr_raw_text: string | null;
  ocr_boxes: OcrBox[] | null;
  deductible: boolean | null;
  deductible_amount: number | string | null;
  non_deductible_amount: number | string | null;
  remarks: string | null;
  requires_review: boolean | null;
}

interface BatchStatus {
  batch_id: string;
  status: string;
  progress: number;
  total_receipts: number;
  processed_receipts: number;
  failed_receipts: number;
  total_amount: number;
  message?: string;
}

type Step = 'upload' | 'ocr' | 'pl';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const fmt = (v: number | string | null | undefined, decimals = 2) => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n.toFixed(decimals) : '0.00';
};

const apiBase = () => {
  if (typeof window === 'undefined') return '';
  const h = window.location.hostname;
  if (h === 'localhost' || h === '127.0.0.1') return process.env.NEXT_PUBLIC_API_URL || '';
  return '';
};

const apiUrl = (p: string) => `${apiBase()}${p}`;

// ---------------------------------------------------------------------------
// OcrImageOverlay  (canvas-based bounding boxes)
// ---------------------------------------------------------------------------
function OcrImageOverlay({
  imageData,
  boxes,
  highlightId,
  onBoxClick,
}: {
  imageData: string;
  boxes: OcrBox[];
  highlightId: string | null;
  onBoxClick: (box: OcrBox) => void;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dim, setDim] = useState({ w: 0, h: 0 });
  const [hovered, setHovered] = useState<string | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || dim.w === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const box of boxes) {
      const isHighlit = box.id === highlightId;
      const isHov = box.id === hovered;
      const x = box.x * dim.w;
      const y = box.y * dim.h;
      const w = box.width * dim.w;
      const h = box.height * dim.h;

      ctx.strokeStyle = isHighlit ? '#f59e0b' : isHov ? '#3b82f6' : '#ef4444';
      ctx.lineWidth = isHighlit || isHov ? 2.5 : 1.5;
      ctx.strokeRect(x, y, w, h);

      if (isHighlit || isHov) {
        ctx.fillStyle = isHighlit ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.12)';
        ctx.fillRect(x, y, w, h);
      }
    }
  }, [boxes, dim, highlightId, hovered]);

  useEffect(() => { draw(); }, [draw]);

  const handleLoad = () => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    setDim({ w: img.naturalWidth, h: img.naturalHeight });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const img = imgRef.current;
    if (!img || dim.w === 0) return;
    const rect = img.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (dim.w / rect.width);
    const my = (e.clientY - rect.top) * (dim.h / rect.height);
    const found = boxes.find(b => {
      const bx = b.x * dim.w, by = b.y * dim.h;
      return mx >= bx && mx <= bx + b.width * dim.w && my >= by && my <= by + b.height * dim.h;
    });
    setHovered(found?.id ?? null);
  };

  const handleClick = () => {
    if (hovered) {
      const box = boxes.find(b => b.id === hovered);
      if (box) onBoxClick(box);
    }
  };

  return (
    <div
      className="relative inline-block select-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHovered(null)}
      onClick={handleClick}
      style={{ cursor: hovered ? 'pointer' : 'default' }}
    >
      <img
        ref={imgRef}
        src={imageData}
        alt="Receipt"
        onLoad={handleLoad}
        className="max-w-full h-auto block rounded"
        style={{ maxHeight: '70vh' }}
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 pointer-events-none rounded"
        style={{ width: '100%', height: '100%' }}
      />
      {boxes.length > 0 && (
        <div className="absolute top-2 right-2 bg-red-500/90 text-white text-xs px-2 py-0.5 rounded-full">
          {boxes.length} words
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------
function StepIndicator({ current }: { current: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: 'upload', label: '1  Upload' },
    { id: 'ocr',    label: '2  OCR Review' },
    { id: 'pl',     label: '3  P&L' },
  ];
  return (
    <div className="flex items-center gap-0">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center">
          {i > 0 && (
            <div className={`h-px w-8 ${current === 'upload' && i >= 1 ? 'bg-slate-600' : current === 'ocr' && i >= 2 ? 'bg-slate-600' : 'bg-blue-500'}`} />
          )}
          <div className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            s.id === current
              ? 'bg-blue-600 text-white'
              : steps.indexOf(steps.find(x => x.id === current)!) > i
                ? 'bg-green-600/20 text-green-400'
                : 'bg-slate-800 text-slate-400'
          }`}>
            {s.id !== current && steps.indexOf(steps.find(x => x.id === current)!) > i ? '✓ ' : ''}{s.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function ReceiptOCRPage() {
  const [mode, setMode] = useState<'new' | 'history' | 'learning'>('new');
  const [step, setStep] = useState<Step>('upload');

  // — Upload state
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dropboxUrl, setDropboxUrl] = useState('');
  const [inputMode, setInputMode] = useState<'file' | 'dropbox'>('file');
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // — Processing state
  const [batchId, setBatchId] = useState<string | null>(null);
  const [batchStatus, setBatchStatus] = useState<BatchStatus | null>(null);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // — OCR Review state
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [ocrIdx, setOcrIdx] = useState(0);
  const [highlightBoxId, setHighlightBoxId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<Receipt> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // — P&L state
  const [plEdit, setPlEdit] = useState<Record<string, Partial<Receipt>>>({});
  const [remarksEdit, setRemarksEdit] = useState<Record<string, string>>({});
  const [isSavingRemarks, setIsSavingRemarks] = useState<Record<string, boolean>>({});

  // — History state
  const [batches, setBatches] = useState<BatchStatus[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());
  const [batchRemarks, setBatchRemarks] = useState<Record<string, { vendor: string; category_name: string; receipt_date: string; remarks: string }[]>>({});

  // — Learning state
  const [learningData, setLearningData] = useState<{ total_remarks: number; batches: any[]; summary: string | null } | null>(null);
  const [learningLoading, setLearningLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // ---------------------------------------------------------------------------
  // File handling
  // ---------------------------------------------------------------------------
  const addFiles = (incoming: FileList | File[]) => {
    const arr = Array.from(incoming);
    const allowed = arr.filter(f =>
      f.type.startsWith('image/') || f.type === 'application/pdf'
    );
    if (allowed.length < arr.length) {
      setSubmitError(`${arr.length - allowed.length} file(s) skipped — only images and PDFs accepted.`);
    }
    setFiles(prev => [
      ...prev,
      ...allowed.map(f => ({
        id: `${Date.now()}_${Math.random()}`,
        file: f,
        status: 'pending' as const,
        progress: 0,
      })),
    ]);
  };

  const removeFile = (id: string) => setFiles(prev => prev.filter(f => f.id !== id));

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  // ---------------------------------------------------------------------------
  // WebSocket + polling for live updates
  // ---------------------------------------------------------------------------
  const addLog = useCallback((msg: string, level: LogLine['level'] = 'info') => {
    const ts = new Date().toLocaleTimeString('en-HK', { hour12: false });
    setLogs(prev => [...prev, { ts, msg, level }]);
  }, []);

  // Track which log IDs we've already shown from polling
  const shownLogStepsRef = useRef<Set<string>>(new Set());

  const startLiveUpdates = useCallback((bid: string) => {
    // Polling — also surfaces recent_logs from the DB into the live log panel
    pollRef.current = setInterval(async () => {
      try {
        const r = await fetch(apiUrl(`/api/receipts/batches/${bid}/status`));
        if (!r.ok) return;
        const d = await r.json();
        if (d.status) {
          setBatchStatus(d);

          // Surface any DB log entries not yet shown
          if (Array.isArray(d.recent_logs)) {
            for (const entry of [...d.recent_logs].reverse()) {
              const key = `${entry.created_at}_${entry.step}`;
              if (!shownLogStepsRef.current.has(key)) {
                shownLogStepsRef.current.add(key);
                const level = entry.log_level === 'error' ? 'error' : entry.log_level === 'warning' ? 'warning' : 'info';
                addLog(entry.message, level);
              }
            }
          }

          if (d.status === 'completed' || d.status === 'failed') {
            clearInterval(pollRef.current!);
            if (d.status === 'failed') {
              // Fetch the last error log and show it prominently
              addLog(`Batch failed — check logs above for details`, 'error');
            }
          }
        }
      } catch { /* ignore */ }
    }, 2000);

    // WebSocket for real-time logs
    try {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${proto}//${window.location.host}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'subscribe', batchId: bid }));
        addLog('Connected to live processing stream', 'info');
      };

      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          if (data.type === 'progress' || data.type === 'status') {
            const payload = data.data || data;
            if (payload.message) addLog(payload.message);
            if (payload.status) {
              setBatchStatus(prev => ({ ...(prev as BatchStatus), ...payload }));
            }
          }
          if (data.type === 'log' && data.message) {
            addLog(data.message, data.level || 'info');
          }
        } catch { /* ignore */ }
      };

      ws.onclose = () => { wsRef.current = null; };
    } catch { /* WS not available */ }
  }, [addLog]);

  useEffect(() => {
    return () => {
      clearInterval(pollRef.current!);
      wsRef.current?.close();
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Submit batch
  // ---------------------------------------------------------------------------
  const submitBatch = async () => {
    setSubmitError('');
    setIsSubmitting(true);
    setLogs([]);
    addLog('Preparing upload...');

    try {
      let batchData: { batch_id: string };

      if (inputMode === 'dropbox') {
        if (!dropboxUrl.trim()) throw new Error('Please enter a Dropbox folder URL');
        addLog(`Starting Dropbox download: ${dropboxUrl}`);
        const r = await fetch(apiUrl('/api/receipts/process'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ client_name: 'Receipt OCR', dropbox_url: dropboxUrl, ocr_model: 'google-vision' }),
        });
        const d = await r.json();
        if (!d.success) throw new Error(d.error || d.details || 'Failed to start batch');
        batchData = d;
      } else {
        if (files.length === 0) throw new Error('Please add at least one file');

        const formData = new FormData();
        for (const uf of files) {
          formData.append('files', uf.file);
          setFiles(prev => prev.map(f => f.id === uf.id ? { ...f, status: 'uploading', progress: 50 } : f));
        }
        addLog(`Uploading ${files.length} file(s)...`);

        const r = await fetch(apiUrl('/api/receipts/upload-multipart'), {
          method: 'POST',
          body: formData,
        });

        if (!r.ok) {
          const errText = await r.text();
          let errMsg = `Upload failed (${r.status})`;
          try { const j = JSON.parse(errText); errMsg = j.error || errMsg; } catch { /* */ }
          throw new Error(errMsg);
        }

        const d = await r.json();
        if (!d.success) throw new Error(d.error || 'Upload failed');

        setFiles(prev => prev.map(f => ({ ...f, status: 'done', progress: 100 })));
        batchData = d;
        addLog(`${files.length} file(s) uploaded — batch ${d.batch_id}`);
      }

      setBatchId(batchData.batch_id);
      setBatchStatus({
        batch_id: batchData.batch_id,
        status: 'pending',
        progress: 0,
        total_receipts: 0,
        processed_receipts: 0,
        failed_receipts: 0,
        total_amount: 0,
      });

      startLiveUpdates(batchData.batch_id);
      addLog('OCR processing started — Google Vision + DeepSeek');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unexpected error';
      setSubmitError(msg);
      addLog(`Error: ${msg}`, 'error');
      setFiles(prev => prev.map(f => f.status === 'uploading' ? { ...f, status: 'error', error: msg } : f));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Load receipts when moving to OCR step
  // ---------------------------------------------------------------------------
  const loadReceipts = useCallback(async (bid: string) => {
    try {
      const r = await fetch(apiUrl(`/api/receipts/batches/${bid}/receipts`));
      const d = await r.json();
      if (d.success) {
        setReceipts(d.receipts);
        setOcrIdx(0);
      }
    } catch { /* ignore */ }
  }, []);

  const goToOcr = async () => {
    if (!batchId) return;
    await loadReceipts(batchId);
    setStep('ocr');
  };

  // ---------------------------------------------------------------------------
  // OCR Review: save edits
  // ---------------------------------------------------------------------------
  const saveEdit = async () => {
    if (!editDraft || !receipts[ocrIdx]) return;
    setIsSaving(true);
    try {
      const r = await fetch(apiUrl(`/api/receipts/${receipts[ocrIdx].receipt_id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editDraft),
      });
      const d = await r.json();
      if (d.success) {
        setReceipts(prev => prev.map((rx, i) => i === ocrIdx ? { ...rx, ...editDraft } : rx));
        setEditDraft(null);
      }
    } catch { /* ignore */ }
    setIsSaving(false);
  };

  // ---------------------------------------------------------------------------
  // P&L: save remarks
  // ---------------------------------------------------------------------------
  const saveRemarks = async (receiptId: string) => {
    setIsSavingRemarks(prev => ({ ...prev, [receiptId]: true }));
    try {
      await fetch(apiUrl(`/api/receipts/${receiptId}/remarks`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remarks: remarksEdit[receiptId] ?? '' }),
      });
      setReceipts(prev => prev.map(r => r.receipt_id === receiptId
        ? { ...r, remarks: remarksEdit[receiptId] ?? '' } : r));
    } catch { /* ignore */ }
    setIsSavingRemarks(prev => ({ ...prev, [receiptId]: false }));
  };

  // ---------------------------------------------------------------------------
  // History
  // ---------------------------------------------------------------------------
  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const r = await fetch(apiUrl('/api/receipts/batches?limit=50'));
      const d = await r.json();
      if (d.success) setBatches(d.batches || []);
    } catch { /* ignore */ }
    setHistoryLoading(false);
  };

  const toggleBatchRemarks = async (batchId: string) => {
    setExpandedBatches(prev => {
      const next = new Set(prev);
      if (next.has(batchId)) { next.delete(batchId); return next; }
      next.add(batchId);
      return next;
    });
    if (!batchRemarks[batchId]) {
      try {
        const r = await fetch(apiUrl(`/api/receipts/batches/${batchId}/receipts`));
        const d = await r.json();
        if (d.success) {
          setBatchRemarks(prev => ({
            ...prev,
            [batchId]: d.receipts.filter((rx: any) => rx.remarks?.trim()),
          }));
        }
      } catch { /* ignore */ }
    }
  };

  // ---------------------------------------------------------------------------
  // Learning
  // ---------------------------------------------------------------------------
  const loadLearning = async (withSummary = false) => {
    if (withSummary) setSummaryLoading(true);
    else setLearningLoading(true);
    try {
      const r = await fetch(apiUrl(`/api/receipts/learning?summarize=${withSummary}`));
      const d = await r.json();
      if (d.success) setLearningData(d);
    } catch { /* ignore */ }
    if (withSummary) setSummaryLoading(false);
    else setLearningLoading(false);
  };

  useEffect(() => {
    if (mode === 'history') loadHistory();
    if (mode === 'learning') loadLearning(false);
  }, [mode]);

  // ---------------------------------------------------------------------------
  // Current OCR receipt
  // ---------------------------------------------------------------------------
  const receipt = receipts[ocrIdx] ?? null;
  const ocrBoxes: OcrBox[] = (() => {
    if (!receipt?.ocr_boxes) return [];
    if (Array.isArray(receipt.ocr_boxes)) return receipt.ocr_boxes as OcrBox[];
    try { return JSON.parse(receipt.ocr_boxes as unknown as string); } catch { return []; }
  })();

  const isProcessing = batchStatus?.status === 'processing' || batchStatus?.status === 'pending';
  const isDone = batchStatus?.status === 'completed';
  const isFailed = batchStatus?.status === 'failed';

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="text-slate-400 hover:text-slate-200 flex items-center gap-1 text-sm">
              <ArrowLeft className="w-4 h-4" /> Back
            </a>
            <div>
              <h1 className="text-lg font-bold text-white">Receipt OCR</h1>
              <p className="text-xs text-slate-400">Google Vision + DeepSeek · P&L automation</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode('new')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${mode === 'new' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Plus className="w-3.5 h-3.5 inline mr-1" />New Batch
            </button>
            <button
              onClick={() => setMode('history')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${mode === 'history' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <History className="w-3.5 h-3.5 inline mr-1" />History
            </button>
            <button
              onClick={() => setMode('learning')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${mode === 'learning' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <BookOpen className="w-3.5 h-3.5 inline mr-1" />Learning
            </button>
          </div>
        </div>
      </div>

      {/* History mode */}
      {mode === 'history' && (
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h2 className="text-base font-semibold text-white mb-4">Previous Batches</h2>
          {historyLoading ? (
            <div className="flex items-center gap-2 text-slate-400"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>
          ) : batches.length === 0 ? (
            <div className="text-slate-500 text-sm">No batches yet.</div>
          ) : (
            <div className="space-y-2">
              {batches.map((b: any) => {
                const isExpanded = expandedBatches.has(b.batch_id);
                const remarks = batchRemarks[b.batch_id];
                return (
                  <div key={b.batch_id} className="bg-slate-800/60 border border-slate-700/50 rounded-lg overflow-hidden">
                    <div className="px-4 py-3 flex items-center justify-between">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={async () => {
                          setBatchId(b.batch_id);
                          setBatchStatus(b);
                          await loadReceipts(b.batch_id);
                          setMode('new');
                          setStep('pl');
                        }}
                      >
                        <div className="text-sm font-medium text-white">
                          Batch {b.batch_id?.slice(0, 8)}…
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {b.created_at ? new Date(b.created_at).toLocaleString('en-HK') : ''}
                          {b.total_receipts ? ` · ${b.total_receipts} receipts` : ''}
                          {b.total_amount ? ` · HKD ${fmt(b.total_amount)}` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={b.status} />
                        <button
                          onClick={() => toggleBatchRemarks(b.batch_id)}
                          className="text-slate-500 hover:text-slate-300 flex items-center gap-1 text-xs"
                          title="Show learning notes"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                        <ChevronRight
                          className="w-4 h-4 text-slate-500 cursor-pointer"
                          onClick={async () => {
                            setBatchId(b.batch_id);
                            setBatchStatus(b);
                            await loadReceipts(b.batch_id);
                            setMode('new');
                            setStep('pl');
                          }}
                        />
                      </div>
                    </div>

                    {/* Learning notes for this batch */}
                    {isExpanded && (
                      <div className="border-t border-slate-700/50 bg-slate-900/40 px-4 py-3">
                        {!remarks ? (
                          <div className="flex items-center gap-2 text-slate-500 text-xs">
                            <Loader2 className="w-3 h-3 animate-spin" /> Loading notes…
                          </div>
                        ) : remarks.length === 0 ? (
                          <p className="text-slate-500 text-xs italic">No learning notes for this batch.</p>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-xs text-slate-500 mb-2">{remarks.length} learning note(s):</p>
                            {remarks.map((rx: any) => (
                              <div key={rx.receipt_id} className="flex items-start gap-3 text-xs">
                                <div className="flex-shrink-0 text-slate-500 w-24 truncate">{rx.vendor}</div>
                                <div className="flex-shrink-0 text-slate-600 w-20">{rx.receipt_date}</div>
                                <div className="flex-1 text-slate-300">{rx.remarks}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Learning mode */}
      {mode === 'learning' && (
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Learning Notes</h2>
              <p className="text-xs text-slate-500 mt-0.5">Remarks saved during receipt review — used to guide future OCR analysis</p>
            </div>
            <button
              onClick={() => loadLearning(true)}
              disabled={summaryLoading || !learningData?.total_remarks}
              className="px-4 py-2 bg-violet-700 hover:bg-violet-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
            >
              {summaryLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate Summary
            </button>
          </div>

          {learningLoading ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
          ) : !learningData || learningData.total_remarks === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
              <BookOpen className="w-8 h-8 mx-auto mb-3 text-slate-600" />
              <p className="text-slate-400 text-sm">No learning notes yet.</p>
              <p className="text-slate-600 text-xs mt-1">Add remarks to receipts in the P&L view — they'll appear here and inform future analyses.</p>
            </div>
          ) : (
            <>
              {/* DeepSeek summary */}
              {learningData.summary && (
                <div className="bg-violet-950/30 border border-violet-800/40 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    <span className="text-sm font-medium text-violet-300">DeepSeek Learning Summary</span>
                  </div>
                  <div className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{learningData.summary}</div>
                </div>
              )}

              {/* All notes grouped by batch */}
              <div className="space-y-4">
                <p className="text-xs text-slate-500">{learningData.total_remarks} note(s) across {learningData.batches.length} batch(es)</p>
                {learningData.batches.map((batch: any) => (
                  <div key={batch.batch_id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-slate-800 flex items-center gap-3">
                      <span className="text-xs text-slate-500">Batch {batch.batch_id?.slice(0, 8)}…</span>
                      <span className="text-xs text-slate-600">
                        {batch.batch_created_at ? new Date(batch.batch_created_at).toLocaleString('en-HK') : ''}
                      </span>
                      <span className="text-xs text-slate-600">{batch.remarks.length} note(s)</span>
                    </div>
                    <div className="divide-y divide-slate-800/60">
                      {batch.remarks.map((rx: any) => (
                        <div key={rx.receipt_id} className="px-4 py-2.5 grid grid-cols-[120px_80px_100px_1fr] gap-3 text-xs items-start">
                          <span className="text-slate-300 font-medium truncate">{rx.vendor}</span>
                          <span className="text-slate-500">{rx.receipt_date}</span>
                          <span className="text-slate-500">{rx.currency} {fmt(rx.amount)}</span>
                          <span className="text-slate-300">{rx.remarks}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* New batch mode */}
      {mode === 'new' && (
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Step indicator */}
          <div className="flex items-center justify-between mb-8">
            <StepIndicator current={step} />
            {batchId && isDone && step === 'upload' && (
              <button onClick={goToOcr} className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
                Review OCR <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* ================================================================ */}
          {/* STEP 1: Upload                                                   */}
          {/* ================================================================ */}
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Input mode toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setInputMode('file')}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${inputMode === 'file' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                >
                  <Upload className="w-3.5 h-3.5 inline mr-1.5" />Upload Files
                </button>
                <button
                  onClick={() => setInputMode('dropbox')}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${inputMode === 'dropbox' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                >
                  <Link2 className="w-3.5 h-3.5 inline mr-1.5" />Dropbox URL
                </button>
              </div>

              {inputMode === 'file' ? (
                <>
                  {/* Drop zone */}
                  <div
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
                      isDragging ? 'border-blue-500 bg-blue-500/5' : 'border-slate-700 hover:border-slate-500 bg-slate-900/40'
                    }`}
                  >
                    <Upload className="w-8 h-8 mx-auto mb-3 text-slate-500" />
                    <p className="text-slate-300 font-medium mb-1">Drop receipt files here, or click to browse</p>
                    <p className="text-slate-500 text-sm">JPG, PNG, WebP, PDF — multiple files allowed · PDFs will be split per page</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={e => e.target.files && addFiles(e.target.files)}
                    />
                  </div>

                  {/* File list */}
                  {files.length > 0 && (
                    <div className="space-y-2">
                      {files.map(uf => (
                        <div key={uf.id} className="bg-slate-800/60 rounded-lg px-4 py-2.5 flex items-center gap-3">
                          <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-slate-200 truncate">{uf.file.name}</div>
                            <div className="text-xs text-slate-500">{(uf.file.size / 1024).toFixed(0)} KB · {uf.file.type}</div>
                            {uf.status === 'uploading' && (
                              <div className="mt-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 transition-all" style={{ width: `${uf.progress}%` }} />
                              </div>
                            )}
                            {uf.error && <div className="text-xs text-red-400 mt-0.5">{uf.error}</div>}
                          </div>
                          <StatusIcon status={uf.status} />
                          <button onClick={() => removeFile(uf.id)} className="text-slate-600 hover:text-slate-300 ml-1">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-3">
                  <label className="text-sm text-slate-400">Dropbox shared folder URL</label>
                  <input
                    type="url"
                    value={dropboxUrl}
                    onChange={e => setDropboxUrl(e.target.value)}
                    placeholder="https://www.dropbox.com/sh/..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-xs text-slate-500">Files will be downloaded from the folder and processed automatically.</p>
                </div>
              )}

              {submitError && (
                <div className="bg-red-950/50 border border-red-800 rounded-lg px-4 py-3 text-sm text-red-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium">Upload error</div>
                    <div className="mt-0.5 text-red-400">{submitError}</div>
                    <div className="mt-1 text-xs text-red-500">Check your API keys (GOOGLE_VISION_API_KEY, DEEPSEEK_API_KEY) and try again.</div>
                  </div>
                </div>
              )}

              {/* Live log */}
              {(isProcessing || isDone || isFailed || logs.length > 0) && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Live Processing Log</span>
                    {batchStatus && (
                      <div className="flex items-center gap-3">
                        <StatusBadge status={batchStatus.status} />
                        {isProcessing && (
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <div className="h-1.5 w-24 bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${batchStatus.progress || 0}%` }} />
                            </div>
                            {batchStatus.progress || 0}%
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="p-4 max-h-52 overflow-y-auto font-mono text-xs space-y-1">
                    {logs.map((l, i) => (
                      <div key={i} className={`flex gap-2 ${l.level === 'error' ? 'text-red-400' : l.level === 'warning' ? 'text-yellow-400' : 'text-slate-300'}`}>
                        <span className="text-slate-600 flex-shrink-0">{l.ts}</span>
                        <span>{l.msg}</span>
                      </div>
                    ))}
                    <div ref={logsEndRef} />
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-3">
                {!batchId ? (
                  <button
                    onClick={submitBatch}
                    disabled={isSubmitting || (inputMode === 'file' ? files.length === 0 : !dropboxUrl.trim())}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : <><Upload className="w-4 h-4" /> Start Processing</>}
                  </button>
                ) : (
                  <>
                    {isDone && (
                      <button
                        onClick={goToOcr}
                        className="px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Review OCR Results
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                    {isFailed && (
                      <div className="space-y-1">
                        <div className="text-red-400 text-sm flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" /> Processing failed — see log above for details.
                        </div>
                        {batchStatus?.message && (
                          <div className="text-red-500 text-xs font-mono bg-red-950/40 border border-red-900/50 rounded px-3 py-1.5">
                            {batchStatus.message}
                          </div>
                        )}
                      </div>
                    )}
                    {isProcessing && (
                      <div className="text-blue-400 text-sm flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Processing {batchStatus?.processed_receipts ?? 0}/{batchStatus?.total_receipts ?? '?'} receipts…
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* STEP 2: OCR Review                                               */}
          {/* ================================================================ */}
          {step === 'ocr' && (
            <div className="space-y-4">
              {receipts.length === 0 ? (
                <div className="text-slate-400 text-sm">No receipts found.</div>
              ) : (
                <>
                  {/* Thumbnail strip */}
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {receipts.map((r, i) => (
                      <button
                        key={r.receipt_id}
                        onClick={() => { setOcrIdx(i); setEditDraft(null); setHighlightBoxId(null); }}
                        className={`flex-shrink-0 w-16 h-20 rounded border-2 overflow-hidden transition-colors ${
                          i === ocrIdx ? 'border-blue-500' : 'border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        {r.image_data ? (
                          <img src={r.image_data} alt={r.image_path} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-slate-600" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Side-by-side viewer */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: image with red bounding boxes */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-slate-300">
                          Receipt {ocrIdx + 1} / {receipts.length}
                          <span className="text-slate-500 ml-2 font-normal text-xs">{receipt?.image_path}</span>
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <div className="w-3 h-3 border-2 border-red-500 rounded-sm" />
                          <span>Red boxes = detected text</span>
                        </div>
                      </div>
                      <div className="overflow-auto max-h-[70vh] flex justify-center bg-slate-950/50 rounded-lg p-2">
                        {receipt?.image_data ? (
                          <OcrImageOverlay
                            imageData={receipt.image_data}
                            boxes={ocrBoxes}
                            highlightId={highlightBoxId}
                            onBoxClick={(box) => setHighlightBoxId(box.id === highlightBoxId ? null : box.id)}
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-500 py-16">
                            <FileText className="w-12 h-12 mb-2" />
                            <span className="text-sm">Image not available</span>
                          </div>
                        )}
                      </div>

                      {highlightBoxId && (
                        <div className="mt-2 bg-yellow-950/40 border border-yellow-800/50 rounded px-3 py-1.5 text-xs text-yellow-300 flex items-center justify-between">
                          <span>Selected: "{ocrBoxes.find(b => b.id === highlightBoxId)?.text}"</span>
                          <button onClick={() => setHighlightBoxId(null)} className="text-yellow-500 hover:text-yellow-300"><X className="w-3 h-3" /></button>
                        </div>
                      )}
                    </div>

                    {/* Right: editable fields */}
                    <div className="space-y-4">
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-medium text-slate-300">Extracted Data</h3>
                          {receipt && (
                            <div className="flex items-center gap-1 text-xs">
                              {editDraft ? (
                                <>
                                  <button onClick={saveEdit} disabled={isSaving} className="px-2.5 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-xs flex items-center gap-1">
                                    {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Save
                                  </button>
                                  <button onClick={() => setEditDraft(null)} className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs">Cancel</button>
                                </>
                              ) : (
                                <button
                                  onClick={() => setEditDraft({
                                    receipt_date: receipt.receipt_date,
                                    vendor: receipt.vendor,
                                    description: receipt.description ?? '',
                                    amount: receipt.amount,
                                    currency: receipt.currency,
                                    tax_amount: receipt.tax_amount ?? 0,
                                    receipt_number: receipt.receipt_number ?? '',
                                    payment_method: receipt.payment_method ?? '',
                                    category_name: receipt.category_name ?? '',
                                    deductible: receipt.deductible ?? true,
                                  })}
                                  className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs flex items-center gap-1"
                                >
                                  <Pencil className="w-3 h-3" /> Edit
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {receipt && (
                          <div className="space-y-3 text-sm">
                            {[
                              { label: 'Date',           key: 'receipt_date',   type: 'date' },
                              { label: 'Vendor',         key: 'vendor',         type: 'text' },
                              { label: 'Amount',         key: 'amount',         type: 'number' },
                              { label: 'Currency',       key: 'currency',       type: 'text' },
                              { label: 'Tax',            key: 'tax_amount',     type: 'number' },
                              { label: 'Category',       key: 'category_name',  type: 'text' },
                              { label: 'Payment',        key: 'payment_method', type: 'text' },
                              { label: 'Receipt #',      key: 'receipt_number', type: 'text' },
                              { label: 'Description',    key: 'description',    type: 'text' },
                            ].map(({ label, key, type }) => {
                              const rawVal = (editDraft ?? receipt)[key as keyof Receipt];
                              const val = rawVal !== null && rawVal !== undefined ? String(rawVal) : '';
                              return (
                                <div key={key} className="flex items-center gap-3">
                                  <span className="text-slate-500 w-24 flex-shrink-0">{label}</span>
                                  {editDraft ? (
                                    <input
                                      type={type}
                                      value={val}
                                      onChange={e => setEditDraft(prev => ({ ...prev!, [key]: e.target.value }))}
                                      className="flex-1 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
                                    />
                                  ) : (
                                    <span className={`text-slate-200 ${key === 'amount' ? 'font-semibold text-green-400' : ''}`}>
                                      {key === 'amount' ? `${receipt.currency} ${fmt(receipt.amount)}` : val || '—'}
                                    </span>
                                  )}
                                </div>
                              );
                            })}

                            {/* Confidence */}
                            <div className="flex items-center gap-3 pt-1 border-t border-slate-800">
                              <span className="text-slate-500 w-24 flex-shrink-0">Confidence</span>
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-20 bg-slate-700 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${Number(receipt.ocr_confidence) >= 0.85 ? 'bg-green-500' : Number(receipt.ocr_confidence) >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                    style={{ width: `${Math.round(Number(receipt.ocr_confidence ?? 0.5) * 100)}%` }}
                                  />
                                </div>
                                <span className="text-slate-400 text-xs">{Math.round(Number(receipt.ocr_confidence ?? 0.5) * 100)}%</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Raw OCR text */}
                      {receipt?.ocr_raw_text && (
                        <details className="bg-slate-900/60 border border-slate-800 rounded-xl">
                          <summary className="px-4 py-2.5 text-xs text-slate-400 cursor-pointer select-none">
                            Raw OCR text ({receipt.ocr_raw_text.length} chars)
                          </summary>
                          <div className="px-4 pb-4 max-h-40 overflow-y-auto">
                            <pre className="text-xs text-slate-400 whitespace-pre-wrap font-mono">{receipt.ocr_raw_text}</pre>
                          </div>
                        </details>
                      )}
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => { setOcrIdx(i => Math.max(0, i - 1)); setEditDraft(null); setHighlightBoxId(null); }}
                      disabled={ocrIdx === 0}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-sm flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" /> Previous
                    </button>
                    <span className="text-slate-500 text-sm">{ocrIdx + 1} / {receipts.length}</span>
                    {ocrIdx < receipts.length - 1 ? (
                      <button
                        onClick={() => { setOcrIdx(i => i + 1); setEditDraft(null); setHighlightBoxId(null); }}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm flex items-center gap-1"
                      >
                        Next <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setStep('pl')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm flex items-center gap-2"
                      >
                        View P&L <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ================================================================ */}
          {/* STEP 3: P&L                                                      */}
          {/* ================================================================ */}
          {step === 'pl' && (
            <div className="space-y-6">
              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Receipts',     value: String(receipts.length) },
                  { label: 'Total',        value: `${receipts[0]?.currency || 'HKD'} ${fmt(receipts.reduce((s, r) => s + Number(r.amount || 0), 0))}` },
                  { label: 'Deductible',   value: `${receipts[0]?.currency || 'HKD'} ${fmt(receipts.filter(r => r.deductible).reduce((s, r) => s + Number(r.deductible_amount || r.amount || 0), 0))}` },
                  { label: 'Flagged',      value: String(receipts.filter(r => r.requires_review).length) },
                ].map(c => (
                  <div key={c.label} className="bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3">
                    <div className="text-xs text-slate-500 mb-1">{c.label}</div>
                    <div className="text-base font-semibold text-white">{c.value}</div>
                  </div>
                ))}
              </div>

              {/* Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                  <h3 className="text-sm font-medium text-slate-300">P&L Table</h3>
                  <a
                    href={batchId ? apiUrl(`/api/receipts/batches/${batchId}/download`) : '#'}
                    download
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-medium flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Excel
                  </a>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                        {['Date', 'Vendor', 'Amount', 'Category', 'Payment', 'Deductible', 'Remarks', ''].map(h => (
                          <th key={h} className="px-4 py-2.5 text-left font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {receipts.map((r) => {
                        const draft = plEdit[r.receipt_id];
                        const rem = remarksEdit[r.receipt_id] ?? r.remarks ?? '';
                        return (
                          <tr key={r.receipt_id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="px-4 py-2.5 text-slate-300 whitespace-nowrap">
                              {draft?.receipt_date !== undefined ? (
                                <input type="date" value={String(draft.receipt_date)} onChange={e => setPlEdit(p => ({ ...p, [r.receipt_id]: { ...p[r.receipt_id], receipt_date: e.target.value } }))}
                                  className="bg-slate-800 border border-slate-600 rounded px-1.5 py-0.5 text-xs w-28" />
                              ) : r.receipt_date}
                            </td>
                            <td className="px-4 py-2.5 text-slate-200 max-w-[150px]">
                              {draft?.vendor !== undefined ? (
                                <input value={String(draft.vendor)} onChange={e => setPlEdit(p => ({ ...p, [r.receipt_id]: { ...p[r.receipt_id], vendor: e.target.value } }))}
                                  className="bg-slate-800 border border-slate-600 rounded px-1.5 py-0.5 text-xs w-full" />
                              ) : <span className="truncate block">{r.vendor}</span>}
                            </td>
                            <td className="px-4 py-2.5 text-green-400 font-medium whitespace-nowrap">
                              {draft?.amount !== undefined ? (
                                <input type="number" value={String(draft.amount)} onChange={e => setPlEdit(p => ({ ...p, [r.receipt_id]: { ...p[r.receipt_id], amount: e.target.value } }))}
                                  className="bg-slate-800 border border-slate-600 rounded px-1.5 py-0.5 text-xs w-24" />
                              ) : `${r.currency} ${fmt(r.amount)}`}
                            </td>
                            <td className="px-4 py-2.5 text-slate-400 text-xs">{r.category_name || '—'}</td>
                            <td className="px-4 py-2.5 text-slate-400 text-xs">{r.payment_method || '—'}</td>
                            <td className="px-4 py-2.5">
                              <span className={`text-xs px-1.5 py-0.5 rounded ${r.deductible ? 'bg-green-900/40 text-green-400' : 'bg-slate-800 text-slate-500'}`}>
                                {r.deductible ? 'Yes' : 'No'}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 min-w-[160px]">
                              <div className="flex items-center gap-1.5">
                                <input
                                  value={rem}
                                  onChange={e => setRemarksEdit(p => ({ ...p, [r.receipt_id]: e.target.value }))}
                                  onBlur={() => { if (rem !== (r.remarks ?? '')) saveRemarks(r.receipt_id); }}
                                  placeholder="Add remark…"
                                  className="flex-1 bg-transparent border-b border-slate-700 focus:border-blue-500 outline-none text-xs text-slate-300 placeholder-slate-600 py-0.5"
                                />
                                {isSavingRemarks[r.receipt_id] && <Loader2 className="w-3 h-3 animate-spin text-blue-400" />}
                              </div>
                            </td>
                            <td className="px-4 py-2.5">
                              {draft ? (
                                <div className="flex gap-1">
                                  <button onClick={async () => {
                                    await fetch(apiUrl(`/api/receipts/${r.receipt_id}`), {
                                      method: 'PUT', headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify(draft),
                                    });
                                    setReceipts(prev => prev.map(rx => rx.receipt_id === r.receipt_id ? { ...rx, ...draft } : rx));
                                    setPlEdit(p => { const n = { ...p }; delete n[r.receipt_id]; return n; });
                                  }} className="text-green-400 hover:text-green-300"><Check className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => setPlEdit(p => { const n = { ...p }; delete n[r.receipt_id]; return n; })} className="text-slate-500 hover:text-slate-300"><X className="w-3.5 h-3.5" /></button>
                                </div>
                              ) : (
                                <button onClick={() => setPlEdit(p => ({ ...p, [r.receipt_id]: { receipt_date: r.receipt_date, vendor: r.vendor, amount: r.amount } }))}
                                  className="text-slate-600 hover:text-slate-300">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Back to OCR */}
              <div className="flex gap-3">
                <button onClick={() => setStep('ocr')} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm flex items-center gap-1">
                  <ChevronLeft className="w-4 h-4" /> Back to OCR Review
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small shared components
// ---------------------------------------------------------------------------
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: 'bg-green-900/50 text-green-400 border-green-800/50',
    processing: 'bg-blue-900/50 text-blue-400 border-blue-800/50',
    pending: 'bg-yellow-900/50 text-yellow-400 border-yellow-800/50',
    failed: 'bg-red-900/50 text-red-400 border-red-800/50',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${map[status] || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
      {status}
    </span>
  );
}

function StatusIcon({ status }: { status: UploadedFile['status'] }) {
  if (status === 'done') return <CheckCircle2 className="w-4 h-4 text-green-400" />;
  if (status === 'error') return <AlertCircle className="w-4 h-4 text-red-400" />;
  if (status === 'uploading') return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
  return <div className="w-4 h-4 rounded-full border-2 border-slate-600" />;
}
