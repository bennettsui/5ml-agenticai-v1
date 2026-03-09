'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  FileText, Upload, RefreshCw, CheckCircle, Clock, AlertCircle,
  Loader2, ArrowRight, Cloud, Cpu, PackageCheck, ChevronRight,
} from 'lucide-react';
import { useTeacherAuth } from '@/components/adaptive/useTeacherAuth';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Paper {
  id: string;
  exam_name: string;
  grade_band: string;
  year: number;
  status: string;
  file_url: string | null;
  cdn_url: string | null;
  created_at: string;
  draft_count: number;
  confirmed_count: number;
}

type View = 'list' | 'upload' | 'processing';

const STATUS_CFG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  UPLOADED:     { label: 'Processing',   color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',    icon: Clock },
  OCR_RUNNING:  { label: 'AI Reading',   color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', icon: Cpu },
  DRAFT_READY:  { label: 'Needs Review', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: AlertCircle },
  CONFIRMED:    { label: 'Live',         color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle },
  NEEDS_REVIEW: { label: 'OCR Issue',    color: 'text-red-400 bg-red-500/10 border-red-500/20',       icon: AlertCircle },
};

// ─── Processing step helper ───────────────────────────────────────────────────

type StepState = 'done' | 'active' | 'pending' | 'error';

interface ProcStep {
  label: string;
  detail?: string;
  state: StepState;
}

function buildSteps(
  paperStatus: string,
  draftCount: number,
  fileSizeMb: number,
  cdnDone: boolean,
): ProcStep[] {
  const uploaded  = true; // we always enter processing after upload succeeds
  const ocrRunning = paperStatus === 'OCR_RUNNING';
  const ocrDone    = paperStatus === 'DRAFT_READY' || paperStatus === 'CONFIRMED' || paperStatus === 'NEEDS_REVIEW';
  const failed     = paperStatus === 'NEEDS_REVIEW';

  return [
    {
      label:  'PDF uploaded',
      detail: fileSizeMb > 0 ? `${fileSizeMb.toFixed(1)} MB saved` : undefined,
      state:  'done',
    },
    {
      label:  'CDN backup',
      detail: cdnDone ? 'Backed up' : 'Uploading in background…',
      state:  cdnDone ? 'done' : (ocrDone ? 'done' : 'active'),
    },
    {
      label:  'Gemini reading pages',
      detail: ocrDone ? 'Pages analysed' : ocrRunning ? 'Analysing…' : undefined,
      state:  ocrDone ? 'done' : ocrRunning ? 'active' : uploaded ? 'active' : 'pending',
    },
    {
      label:  failed ? 'Extraction failed' : 'Questions extracted',
      detail: draftCount > 0 ? `${draftCount} questions found` : failed ? 'OCR quality issue' : undefined,
      state:  failed ? 'error' : draftCount > 0 ? 'done' : 'pending',
    },
  ];
}

function StepDot({ state }: { state: StepState }) {
  if (state === 'done')
    return <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />;
  if (state === 'active')
    return <Loader2 className="w-5 h-5 text-purple-400 animate-spin shrink-0" />;
  if (state === 'error')
    return <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />;
  return <div className="w-5 h-5 rounded-full border-2 border-slate-600 shrink-0" />;
}

// ─── Processing panel ─────────────────────────────────────────────────────────

function ProcessingPanel({
  paperId,
  fileName,
  fileSizeMb,
  onDone,
  onCancel,
}: {
  paperId: string;
  fileName: string;
  fileSizeMb: number;
  onDone: (paperId: string) => void;
  onCancel: () => void;
}) {
  const [paperStatus, setPaperStatus] = useState('UPLOADED');
  const [draftCount, setDraftCount]   = useState(0);
  const [cdnDone, setCdnDone]         = useState(false);
  const tries = useRef(0);

  useEffect(() => {
    const poll = setInterval(async () => {
      tries.current++;
      if (tries.current > 36) { clearInterval(poll); onDone(paperId); return; } // 3 min max
      try {
        const r = await fetch(`/api/adaptive-learning/teachers/papers/${paperId}/draft-questions`);
        const d = await r.json();
        if (!d.success) return;
        setPaperStatus(d.status);
        if (d.draft_questions?.length) setDraftCount(d.draft_questions.length);
        if (d.cdn_url) setCdnDone(true);
        if (d.status === 'DRAFT_READY' || d.status === 'CONFIRMED') {
          clearInterval(poll);
          setTimeout(() => onDone(paperId), 1200); // brief pause so user sees all-done state
        } else if (d.status === 'NEEDS_REVIEW') {
          clearInterval(poll);
        }
      } catch {}
    }, 5000);
    return () => clearInterval(poll);
  }, [paperId, onDone]);

  const steps = buildSteps(paperStatus, draftCount, fileSizeMb, cdnDone);
  const isDone  = paperStatus === 'DRAFT_READY' || paperStatus === 'CONFIRMED';
  const isFail  = paperStatus === 'NEEDS_REVIEW';

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
            <Cpu className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-white font-medium text-sm">{fileName}</p>
            <p className="text-slate-500 text-xs mt-0.5">Processing — usually takes 15–60 s</p>
          </div>
        </div>
        {!isDone && !isFail && (
          <button onClick={onCancel} className="text-slate-600 hover:text-slate-400 text-xs transition-colors">
            Cancel
          </button>
        )}
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            <StepDot state={step.state} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${
                step.state === 'done'   ? 'text-white' :
                step.state === 'active' ? 'text-purple-300' :
                step.state === 'error'  ? 'text-red-300' :
                'text-slate-600'
              }`}>{step.label}</p>
              {step.detail && (
                <p className="text-xs text-slate-500 mt-0.5">{step.detail}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Done CTA */}
      {isDone && (
        <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between">
          <p className="text-emerald-400 text-sm font-medium flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4" /> Questions ready!
          </p>
          <Link
            href={`/teach/validate?paper_id=${paperId}`}
            className="flex items-center gap-1.5 text-sm text-purple-300 hover:text-purple-200 font-medium transition-colors"
          >
            Validate & Review <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Fail state */}
      {isFail && (
        <div className="pt-2 border-t border-slate-700/50">
          <p className="text-red-300 text-sm">OCR could not extract questions — check the PDF quality or try re-uploading.</p>
        </div>
      )}
    </div>
  );
}

// ─── Inline upload form ───────────────────────────────────────────────────────

function UploadForm({
  onUploaded,
  onCancel,
}: {
  onUploaded: (paperId: string, fileName: string, sizeMb: number) => void;
  onCancel: () => void;
}) {
  const { teacher }  = useTeacherAuth();
  const fileRef      = useRef<HTMLInputElement>(null);
  const dragCount    = useRef(0);
  const [dragOver, setDragOver]   = useState(false);
  const [file, setFile]           = useState<File | null>(null);
  const [examName, setExamName]   = useState('');
  const [gradeBand, setGradeBand] = useState('S1-S2');
  const [year, setYear]           = useState(new Date().getFullYear().toString());
  const [uploading, setUploading] = useState(false);
  const [err, setErr]             = useState('');

  const handleFile = (f: File) => {
    if (f.type !== 'application/pdf') { setErr('Only PDF files are accepted.'); return; }
    setFile(f); setErr('');
    if (!examName) setExamName(f.name.replace(/\.pdf$/i, '').replace(/_/g, ' '));
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCount.current = 0; setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const submit = async () => {
    if (!file) return;
    setUploading(true); setErr('');
    const form = new FormData();
    form.append('file', file);
    form.append('exam_name', examName || file.name);
    form.append('grade_band', gradeBand);
    form.append('year', year);
    if (teacher) form.append('teacher_id', teacher.id);
    try {
      const res  = await fetch('/api/adaptive-learning/teachers/papers/upload', {
        method: 'POST',
        headers: teacher ? { 'X-Teacher-Id': teacher.id } : {},
        body: form,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      onUploaded(data.paper_id, examName || file.name, file.size / 1024 / 1024);
    } catch (e: any) {
      setErr(e.message); setUploading(false);
    }
  };

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold text-sm">Upload Past Paper</h2>
        <button onClick={onCancel} className="text-slate-500 hover:text-slate-300 text-xs transition-colors">
          Cancel
        </button>
      </div>

      {/* Drop zone */}
      <div
        onDragEnter={e => { e.preventDefault(); dragCount.current++; setDragOver(true); }}
        onDragLeave={e => { e.preventDefault(); dragCount.current--; if (!dragCount.current) setDragOver(false); }}
        onDragOver={e => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          dragOver ? 'border-purple-400 bg-purple-500/10' :
          file     ? 'border-emerald-500/50 bg-emerald-500/5' :
                     'border-slate-700 hover:border-slate-600 bg-slate-800/30'
        }`}
      >
        <input ref={fileRef} type="file" accept=".pdf" className="hidden"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        {file ? (
          <div className="flex flex-col items-center gap-1.5">
            <FileText className="w-7 h-7 text-emerald-400" />
            <p className="text-sm font-medium text-white">{file.name}</p>
            <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <Upload className="w-7 h-7 text-slate-500" />
            <p className="text-sm text-slate-300 font-medium">Drop PDF here or click to browse</p>
            <p className="text-xs text-slate-500">Max 20 MB · PDF only</p>
          </div>
        )}
      </div>

      {/* Metadata */}
      {file && (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Exam name</label>
            <input value={examName} onChange={e => setExamName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Grade band</label>
              <select value={gradeBand} onChange={e => setGradeBand(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/50 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
              >
                {['S1', 'S2', 'S3', 'S1-S2', 'S2-S3'].map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Year</label>
              <input type="number" value={year} onChange={e => setYear(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/50 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>
      )}

      {err && (
        <div className="flex items-start gap-2 text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{err}
        </div>
      )}

      <button
        onClick={submit} disabled={!file || uploading}
        className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
      >
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        {uploading ? 'Uploading…' : 'Upload & Extract Questions'}
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PapersPage() {
  const [papers, setPapers]   = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView]       = useState<View>('list');
  // active processing job
  const [procPaperId, setProcPaperId]   = useState<string | null>(null);
  const [procFileName, setProcFileName] = useState('');
  const [procSizeMb, setProcSizeMb]     = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/adaptive-learning/teachers/papers');
      const data = await res.json();
      if (data.success) setPapers(data.papers);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUploaded = (paperId: string, fileName: string, sizeMb: number) => {
    setProcPaperId(paperId);
    setProcFileName(fileName);
    setProcSizeMb(sizeMb);
    setView('processing');
  };

  const handleProcessingDone = () => {
    setView('list');
    load(); // refresh list
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Papers</h1>
          <p className="text-slate-400 text-sm mt-0.5">{papers.length} past papers</p>
        </div>
        <div className="flex items-center gap-2">
          {view === 'list' && (
            <>
              <button onClick={load}
                className={`text-slate-400 hover:text-white transition-colors ${loading ? 'animate-spin' : ''}`}>
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView('upload')}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload Paper
              </button>
            </>
          )}
        </div>
      </div>

      {/* Upload form (inline) */}
      {view === 'upload' && (
        <UploadForm
          onUploaded={handleUploaded}
          onCancel={() => setView('list')}
        />
      )}

      {/* Processing panel */}
      {view === 'processing' && procPaperId && (
        <ProcessingPanel
          paperId={procPaperId}
          fileName={procFileName}
          fileSizeMb={procSizeMb}
          onDone={handleProcessingDone}
          onCancel={handleProcessingDone}
        />
      )}

      {/* Papers list */}
      {view === 'list' && (
        <>
          {loading && papers.length === 0 && (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          <div className="space-y-3">
            {papers.map(p => {
              const cfg = STATUS_CFG[p.status] || STATUS_CFG.UPLOADED;
              const Icon = cfg.icon;
              const reviewPending = p.draft_count > p.confirmed_count;
              const isProcessing  = p.status === 'UPLOADED' || p.status === 'OCR_RUNNING';

              return (
                <div key={p.id} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center shrink-0">
                      {isProcessing
                        ? <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                        : <FileText className="w-5 h-5 text-slate-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p className="text-white font-medium text-sm">{p.exam_name}</p>
                          <p className="text-slate-500 text-xs mt-0.5">
                            {p.grade_band} · {p.year} · Uploaded {new Date(p.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`text-[10px] font-medium border rounded-full px-2 py-0.5 flex items-center gap-1 ${cfg.color} shrink-0`}>
                          <Icon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </div>

                      {/* Inline processing steps for active papers */}
                      {isProcessing && (
                        <div className="mt-3 space-y-1.5">
                          {buildSteps(
                            p.status,
                            p.draft_count,
                            0,
                            !!p.cdn_url,
                          ).map((step, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <StepDot state={step.state} />
                              <span className={`text-xs ${
                                step.state === 'done'   ? 'text-slate-400' :
                                step.state === 'active' ? 'text-purple-300' :
                                'text-slate-600'
                              }`}>{step.label}{step.detail ? ` — ${step.detail}` : ''}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Progress bar for confirmed papers */}
                      {!isProcessing && p.draft_count > 0 && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                            <span>{p.confirmed_count}/{p.draft_count} questions confirmed</span>
                            <span>{Math.round((p.confirmed_count / p.draft_count) * 100)}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full transition-all"
                              style={{ width: `${(p.confirmed_count / p.draft_count) * 100}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action row */}
                  {!isProcessing && (
                    <div className="mt-3 flex items-center gap-3 pl-13">
                      {reviewPending && (
                        <Link
                          href={`/teach/questions/pending?paper_id=${p.id}`}
                          className="inline-flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 transition-colors"
                        >
                          <AlertCircle className="w-3 h-3" />
                          {p.draft_count - p.confirmed_count} need review
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      )}
                      <Link
                        href={`/teach/validate?paper_id=${p.id}`}
                        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        <PackageCheck className="w-3 h-3" />
                        Validate
                      </Link>
                      {p.cdn_url && (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                          <Cloud className="w-3 h-3" /> CDN
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!loading && papers.length === 0 && (
            <div className="text-center py-16 text-slate-500">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm mb-3">No papers uploaded yet.</p>
              <button onClick={() => setView('upload')}
                className="text-purple-400 text-sm underline">
                Upload your first paper →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
