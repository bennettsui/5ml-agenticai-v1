'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  Mic, FileText, Clipboard, Loader2, CheckCircle2, AlertCircle,
  ChevronLeft, Copy, RefreshCw, History, AlertTriangle, BarChart3,
  Languages, List, AlignLeft, BookOpen, Sparkles, Clock, Hash,
  ChevronDown, ChevronUp, Database, Info, Zap,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Task     = 'clean_transcript' | 'meeting_minutes' | 'summary_zh' | 'summary_en' | 'action_items';
type Model    = 'haiku' | 'sonnet' | 'deepseek';
type PageTab  = 'analyze' | 'history' | 'errors' | 'error-codes';

interface JobRecord {
  job_id:            string;
  transcript:        string;
  task:              string;
  model:             string;
  extra_instructions?: string;
  status:            'pending' | 'processing' | 'done' | 'error';
  char_count:        number;
  result_text?:      string;
  model_used?:       string;
  duration_ms?:      number;
  created_at:        string;
}

interface ErrorLog {
  id:            number;
  job_id?:       string;
  error_code:    string;
  error_message: string;
  context?:      Record<string, unknown>;
  created_at:    string;
}

interface Stats {
  total_jobs:       string;
  done_jobs:        string;
  error_jobs:       string;
  processing_jobs:  string;
  total_chars:      string;
  total_errors:     string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Task + model config
// ─────────────────────────────────────────────────────────────────────────────

const TASKS: {
  value: Task; label: string; labelEn: string; description: string;
  icon: typeof FileText; color: string; ring: string;
}[] = [
  {
    value: 'clean_transcript', label: '清理逐字稿', labelEn: 'Clean Transcript',
    description: '修正ASR錯誤，保留粵語口語風格',
    icon: AlignLeft, color: 'text-blue-400',
    ring: 'border-blue-500/40 bg-blue-500/[0.07] ring-1 ring-blue-500/30',
  },
  {
    value: 'meeting_minutes', label: '會議紀要', labelEn: 'Meeting Minutes',
    description: '整理成正式會議紀要，列出重點決定',
    icon: BookOpen, color: 'text-purple-400',
    ring: 'border-purple-500/40 bg-purple-500/[0.07] ring-1 ring-purple-500/30',
  },
  {
    value: 'summary_zh', label: '中文摘要', labelEn: 'ZH Summary',
    description: '書面中文摘要，概括核心內容',
    icon: Languages, color: 'text-teal-400',
    ring: 'border-teal-500/40 bg-teal-500/[0.07] ring-1 ring-teal-500/30',
  },
  {
    value: 'summary_en', label: '英文摘要', labelEn: 'EN Summary',
    description: 'Concise professional English summary',
    icon: Sparkles, color: 'text-amber-400',
    ring: 'border-amber-500/40 bg-amber-500/[0.07] ring-1 ring-amber-500/30',
  },
  {
    value: 'action_items', label: '待辦事項', labelEn: 'Action Items',
    description: '提取所有行動項目及負責人',
    icon: List, color: 'text-rose-400',
    ring: 'border-rose-500/40 bg-rose-500/[0.07] ring-1 ring-rose-500/30',
  },
];

const MODEL_OPTIONS: { value: Model; label: string; note: string; color: string }[] = [
  { value: 'haiku',    label: 'Claude Haiku 4.5',  note: 'Fast · $0.25/1M',   color: 'text-blue-400' },
  { value: 'sonnet',   label: 'Claude Sonnet 4.6', note: 'Best · $3/1M',      color: 'text-purple-400' },
  { value: 'deepseek', label: 'DeepSeek Chat',     note: 'Economy · $0.14/1M', color: 'text-teal-400' },
];

const ERROR_CODE_COLORS: Record<string, string> = {
  'CT-001': 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  'CT-002': 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  'CT-003': 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  'CT-004': 'text-red-400 bg-red-500/10 border-red-500/30',
  'CT-005': 'text-red-400 bg-red-500/10 border-red-500/30',
  'CT-006': 'text-red-400 bg-red-500/10 border-red-500/30',
  'CT-007': 'text-red-400 bg-red-500/10 border-red-500/30',
  'CT-008': 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  'CT-009': 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  'CT-010': 'text-orange-400 bg-orange-500/10 border-orange-500/30',
};

function taskDef(task: string) {
  return TASKS.find(t => t.value === task) ?? TASKS[0];
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('zh-HK', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function StatBadge({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white/[0.03] border border-slate-700/50 rounded-xl p-4 text-center">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-[10px] text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

function JobRow({ job, onExpand }: { job: JobRecord; onExpand: (j: JobRecord) => void }) {
  const td = taskDef(job.task);
  const Icon = td.icon;
  const statusColor = job.status === 'done' ? 'text-green-400' : job.status === 'error' ? 'text-red-400' : 'text-amber-400';
  const statusLabel = job.status === 'done' ? '完成' : job.status === 'error' ? '失敗' : '處理中';

  return (
    <div
      className="px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors cursor-pointer"
      onClick={() => onExpand(job)}
    >
      <Icon className={`w-3.5 h-3.5 shrink-0 ${td.color}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-300">{td.label}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
            job.status === 'done'
              ? 'border-green-500/30 bg-green-500/10 text-green-400'
              : job.status === 'error'
              ? 'border-red-500/30 bg-red-500/10 text-red-400'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
          }`}>{statusLabel}</span>
        </div>
        <p className="text-[11px] text-slate-500 truncate mt-0.5">
          {job.transcript.slice(0, 80)}{job.transcript.length > 80 ? '…' : ''}
        </p>
      </div>
      <div className="text-right shrink-0">
        <div className="text-[10px] text-slate-500">{fmtDate(job.created_at)}</div>
        <div className="text-[10px] text-slate-600 mt-0.5">{job.char_count?.toLocaleString()} chars</div>
      </div>
      <ChevronDown className="w-3 h-3 text-slate-600 shrink-0" />
    </div>
  );
}

function ErrorRow({ log }: { log: ErrorLog }) {
  const [open, setOpen] = useState(false);
  const colorClass = ERROR_CODE_COLORS[log.error_code] ?? 'text-slate-400 bg-slate-500/10 border-slate-500/30';

  return (
    <div className="border-b border-slate-700/30 last:border-0">
      <div
        className="px-4 py-3 flex items-start gap-3 hover:bg-white/[0.02] cursor-pointer"
        onClick={() => setOpen(o => !o)}
      >
        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${colorClass}`}>
          {log.error_code}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-300">{log.error_message}</p>
          {log.job_id && (
            <p className="text-[10px] text-slate-600 font-mono mt-0.5">job: {log.job_id}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] text-slate-500">{fmtDate(log.created_at)}</div>
        </div>
        {log.context && (open ? <ChevronUp className="w-3 h-3 text-slate-600 shrink-0 mt-0.5" /> : <ChevronDown className="w-3 h-3 text-slate-600 shrink-0 mt-0.5" />)}
      </div>
      {open && log.context && (
        <div className="px-4 pb-3">
          <pre className="text-[10px] text-slate-400 bg-white/[0.02] rounded-lg p-3 overflow-x-auto">
            {JSON.stringify(log.context, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function CantoneseTranscriptionPage() {
  const [pageTab, setPageTab]               = useState<PageTab>('analyze');

  // Analyze tab state
  const [transcript, setTranscript]         = useState('');
  const [extraInstructions, setExtra]       = useState('');
  const [selectedTask, setTask]             = useState<Task>('clean_transcript');
  const [model, setModel]                   = useState<Model>('haiku');
  const [loading, setLoading]               = useState(false);
  const [result, setResult]                 = useState<string | null>(null);
  const [currentJobId, setCurrentJobId]     = useState<string | null>(null);
  const [analyzeError, setAnalyzeError]     = useState<{ code: string; message: string } | null>(null);
  const [copied, setCopied]                 = useState(false);
  const resultRef                           = useRef<HTMLDivElement>(null);

  // History tab state
  const [jobs, setJobs]                     = useState<JobRecord[]>([]);
  const [jobsLoading, setJobsLoading]       = useState(false);
  const [expandedJob, setExpandedJob]       = useState<JobRecord | null>(null);

  // Errors tab state
  const [errorLogs, setErrorLogs]           = useState<ErrorLog[]>([]);
  const [errorsLoading, setErrorsLoading]   = useState(false);

  // Error codes tab
  const [errorCodes, setErrorCodes]         = useState<{ code: string; message: string }[]>([]);

  // Stats
  const [stats, setStats]                   = useState<Stats | null>(null);

  // ── Load history / errors on tab switch ──────────────────────────────────
  const loadJobs = useCallback(async () => {
    setJobsLoading(true);
    try {
      const res  = await fetch('/api/cantonese-transcription/jobs?limit=50');
      const data = await res.json();
      if (data.ok) setJobs(data.jobs);
    } catch { /* ignore */ } finally {
      setJobsLoading(false);
    }
  }, []);

  const loadErrors = useCallback(async () => {
    setErrorsLoading(true);
    try {
      const res  = await fetch('/api/cantonese-transcription/errors?limit=100');
      const data = await res.json();
      if (data.ok) setErrorLogs(data.logs);
    } catch { /* ignore */ } finally {
      setErrorsLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const res  = await fetch('/api/cantonese-transcription/stats');
      const data = await res.json();
      if (data.ok) setStats(data.stats);
    } catch { /* ignore */ }
  }, []);

  const loadErrorCodes = useCallback(async () => {
    try {
      const res  = await fetch('/api/cantonese-transcription/error-codes');
      const data = await res.json();
      if (data.ok) setErrorCodes(data.error_codes);
    } catch { /* ignore */ }
  }, []);

  // ── Analyze ───────────────────────────────────────────────────────────────
  async function handleAnalyze() {
    if (!transcript.trim()) return;
    setLoading(true);
    setResult(null);
    setAnalyzeError(null);
    setCurrentJobId(null);

    try {
      const res  = await fetch('/api/cantonese-transcription/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: transcript.trim(),
          task: selectedTask,
          extra_instructions: extraInstructions.trim() || undefined,
          model,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setAnalyzeError({ code: data.error_code ?? 'ERR', message: data.error ?? '分析失敗' });
      } else {
        setResult(data.result);
        setCurrentJobId(data.job_id);
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      }
    } catch (err: unknown) {
      setAnalyzeError({ code: 'CT-005', message: err instanceof Error ? err.message : '網絡錯誤' });
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Tab switch side effects ──────────────────────────────────────────────
  useEffect(() => {
    if (pageTab === 'history')     { loadJobs(); loadStats(); }
    if (pageTab === 'errors')      { loadErrors(); }
    if (pageTab === 'error-codes') { loadErrorCodes(); }
  }, [pageTab, loadJobs, loadErrors, loadStats, loadErrorCodes]);

  const td = TASKS.find(t => t.value === selectedTask)!;
  const charCount = transcript.length;

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ── Top nav ────────────────────────────────────────────────────── */}
      <header className="border-b border-slate-800/60 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" /> Dashboard
          </Link>
          <span className="text-slate-700">/</span>
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-semibold text-white">粵語逐字稿分析</span>
            <span className="text-[10px] text-slate-500">Cantonese Transcription</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[10px] text-slate-500 border border-slate-700/50 rounded px-1.5 py-0.5">
              Whisper v3 · khleeloo
            </span>
          </div>
        </div>

        {/* Page tabs */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-0 border-t border-slate-800/40">
          {([
            { id: 'analyze',     label: '分析',      icon: Zap },
            { id: 'history',     label: '歷史記錄',  icon: History },
            { id: 'errors',      label: '錯誤日誌',  icon: AlertTriangle },
            { id: 'error-codes', label: '錯誤代碼',  icon: Info },
          ] as { id: PageTab; label: string; icon: typeof Zap }[]).map(tab => {
            const Icon = tab.icon;
            const active = pageTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setPageTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                  active
                    ? 'border-indigo-500 text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3 h-3" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">

        {/* ================================================================ */}
        {/* ANALYZE TAB                                                       */}
        {/* ================================================================ */}
        {pageTab === 'analyze' && (
          <div className="space-y-6">

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Input */}
              <div className="space-y-4">
                {/* Transcript */}
                <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700/50">
                    <div className="flex items-center gap-2">
                      <Clipboard className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-medium text-slate-300">ASR 逐字稿</span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {charCount.toLocaleString()} 字元
                    </span>
                  </div>
                  <textarea
                    value={transcript}
                    onChange={e => setTranscript(e.target.value)}
                    placeholder="貼上 Whisper ASR 輸出嘅粵語逐字稿…&#10;&#10;例：佢哋噉講嘅，我冇聽錯喎，嗰個 project 要喺下個月 deliver 㗎。"
                    rows={13}
                    className="w-full bg-transparent px-4 py-3 text-sm text-slate-200 placeholder-slate-600 resize-none focus:outline-none font-mono leading-relaxed"
                  />
                </div>

                {/* Extra instructions */}
                <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-slate-700/50">
                    <span className="text-xs font-medium text-slate-300">額外指示（可選）</span>
                  </div>
                  <textarea
                    value={extraInstructions}
                    onChange={e => setExtra(e.target.value)}
                    placeholder="例：重點關注 marketing 相關討論；或 Focus on technical decisions only"
                    rows={2}
                    className="w-full bg-transparent px-4 py-3 text-sm text-slate-300 placeholder-slate-600 resize-none focus:outline-none"
                  />
                </div>
              </div>

              {/* Right: Task + model */}
              <div className="space-y-4">
                {/* Task */}
                <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-slate-700/50">
                    <span className="text-xs font-medium text-slate-300">分析任務</span>
                  </div>
                  <div className="p-3 grid grid-cols-1 gap-2">
                    {TASKS.map(task => {
                      const Icon  = task.icon;
                      const active = selectedTask === task.value;
                      return (
                        <button
                          key={task.value}
                          onClick={() => setTask(task.value)}
                          className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                            active ? task.ring : 'border-slate-700/50 hover:bg-white/[0.02]'
                          }`}
                        >
                          <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${active ? task.color : 'text-slate-500'}`} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-medium ${active ? 'text-white' : 'text-slate-300'}`}>
                                {task.label}
                              </span>
                              <span className="text-[10px] text-slate-600">{task.labelEn}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">{task.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Model */}
                <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-slate-700/50">
                    <span className="text-xs font-medium text-slate-300">AI 模型</span>
                  </div>
                  <div className="p-3 grid grid-cols-3 gap-2">
                    {MODEL_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setModel(opt.value)}
                        className={`p-2.5 rounded-lg border text-center transition-all ${
                          model === opt.value
                            ? 'border-indigo-500/40 bg-indigo-500/[0.07] ring-1 ring-indigo-500/30'
                            : 'border-slate-700/50 hover:bg-white/[0.02]'
                        }`}
                      >
                        <div className={`text-[11px] font-medium ${model === opt.value ? opt.color : 'text-slate-300'}`}>
                          {opt.label}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{opt.note}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Analyze button */}
                <button
                  onClick={handleAnalyze}
                  disabled={loading || !transcript.trim()}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />分析緊…</>
                  ) : (
                    <><td.icon className="w-4 h-4" />{td.label}</>
                  )}
                </button>
              </div>
            </div>

            {/* ── Error display ──────────────────────────────────────────── */}
            {analyzeError && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/[0.07] border border-red-500/20">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                      ERROR_CODE_COLORS[analyzeError.code] ?? 'text-red-400 bg-red-500/10 border-red-500/30'
                    }`}>{analyzeError.code}</span>
                    <span className="text-sm text-red-300">{analyzeError.message}</span>
                  </div>
                </div>
              </div>
            )}

            {/* ── Result ────────────────────────────────────────────────── */}
            {result && (
              <div ref={resultRef} className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700/50">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-xs font-medium text-slate-300">{td.label} — 完成</span>
                    {currentJobId && (
                      <span className="text-[10px] text-slate-600 font-mono">#{currentJobId.slice(0, 8)}</span>
                    )}
                  </div>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-white transition-colors"
                  >
                    {copied
                      ? <><CheckCircle2 className="w-3 h-3 text-green-400" />已複製</>
                      : <><Copy className="w-3 h-3" />複製</>}
                  </button>
                </div>
                <div className="p-5">
                  <pre className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">{result}</pre>
                </div>
              </div>
            )}

            {/* Info footer */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-white/[0.02] border border-slate-700/30">
              <Mic className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
              <p className="text-[11px] text-slate-500 leading-relaxed">
                此工具處理來自 <span className="text-slate-400">khleeloo/whisper-large-v3-cantonese</span> 嘅 ASR 輸出。
                AI 只會清理明顯錯誤，唔會自行添加內容。所有分析記錄均保存至 Fly Postgres 資料庫。
              </p>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* HISTORY TAB                                                       */}
        {/* ================================================================ */}
        {pageTab === 'history' && (
          <div className="space-y-5">
            {/* Stats strip */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <StatBadge label="總任務" value={Number(stats.total_jobs).toLocaleString()} color="text-white" />
                <StatBadge label="完成" value={Number(stats.done_jobs).toLocaleString()} color="text-green-400" />
                <StatBadge label="失敗" value={Number(stats.error_jobs).toLocaleString()} color="text-red-400" />
                <StatBadge label="處理中" value={Number(stats.processing_jobs).toLocaleString()} color="text-amber-400" />
                <StatBadge label="總字元" value={Number(stats.total_chars || 0).toLocaleString()} color="text-indigo-400" />
              </div>
            )}

            {/* Job list */}
            <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-medium text-slate-300">分析記錄</span>
                </div>
                <button
                  onClick={() => { loadJobs(); loadStats(); }}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                >
                  <RefreshCw className={`w-3 h-3 ${jobsLoading ? 'animate-spin' : ''}`} />
                  重新整理
                </button>
              </div>

              {jobsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                </div>
              ) : jobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <History className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">未有記錄</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/30">
                  {jobs.map(job => (
                    <JobRow key={job.job_id} job={job} onExpand={setExpandedJob} />
                  ))}
                </div>
              )}
            </div>

            {/* Expanded job drawer */}
            {expandedJob && (
              <div className="bg-slate-800/60 rounded-xl border border-indigo-500/20 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
                  <div className="flex items-center gap-2">
                    <Hash className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-xs font-mono text-slate-300">{expandedJob.job_id}</span>
                  </div>
                  <button onClick={() => setExpandedJob(null)} className="text-[11px] text-slate-400 hover:text-white">
                    關閉
                  </button>
                </div>
                {/* Job metadata */}
                <div className="px-4 pt-3 pb-0 flex flex-wrap gap-3">
                  {[
                    { label: '任務', value: taskDef(expandedJob.task).label },
                    { label: '模型', value: expandedJob.model_used ?? expandedJob.model },
                    { label: '耗時', value: expandedJob.duration_ms ? `${expandedJob.duration_ms}ms` : '—' },
                    { label: '字元', value: expandedJob.char_count?.toLocaleString() ?? '—' },
                    { label: '狀態', value: expandedJob.status },
                    { label: '時間', value: fmtDate(expandedJob.created_at) },
                  ].map(item => (
                    <div key={item.label} className="text-[11px]">
                      <span className="text-slate-500">{item.label}：</span>
                      <span className="text-slate-300">{item.value}</span>
                    </div>
                  ))}
                </div>
                {/* Transcript */}
                <div className="px-4 pt-3">
                  <p className="text-[10px] text-slate-500 mb-1">逐字稿輸入</p>
                  <pre className="text-xs text-slate-400 bg-white/[0.02] rounded-lg p-3 max-h-32 overflow-y-auto whitespace-pre-wrap font-sans">
                    {expandedJob.transcript}
                  </pre>
                </div>
                {/* Result */}
                {expandedJob.result_text && (
                  <div className="px-4 pt-3 pb-4">
                    <p className="text-[10px] text-slate-500 mb-1">分析結果</p>
                    <pre className="text-xs text-slate-200 bg-white/[0.02] rounded-lg p-3 max-h-64 overflow-y-auto whitespace-pre-wrap font-sans">
                      {expandedJob.result_text}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/* ERRORS TAB                                                        */}
        {/* ================================================================ */}
        {pageTab === 'errors' && (
          <div className="space-y-4">
            <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-medium text-slate-300">錯誤日誌</span>
                  {errorLogs.length > 0 && (
                    <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full">
                      {errorLogs.length}
                    </span>
                  )}
                </div>
                <button
                  onClick={loadErrors}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                >
                  <RefreshCw className={`w-3 h-3 ${errorsLoading ? 'animate-spin' : ''}`} />
                  重新整理
                </button>
              </div>

              {errorsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                </div>
              ) : errorLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <CheckCircle2 className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">冇錯誤記錄</p>
                </div>
              ) : (
                <div>
                  {errorLogs.map(log => (
                    <ErrorRow key={log.id} log={log} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* ERROR CODES TAB                                                   */}
        {/* ================================================================ */}
        {pageTab === 'error-codes' && (
          <div className="space-y-4">
            <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-medium text-slate-300">錯誤代碼參考表</span>
                </div>
              </div>
              <div className="divide-y divide-slate-700/30">
                {(errorCodes.length > 0 ? errorCodes : Object.entries({
                  'CT-001': '逐字稿內容唔可以為空',
                  'CT-002': '逐字稿內容過短（最少10個字元）',
                  'CT-003': '唔支援嘅分析任務類型',
                  'CT-004': 'AI 模型 API Key 未設定，請聯絡管理員',
                  'CT-005': 'AI 模型調用失敗，請稍後再試',
                  'CT-006': '資料庫寫入失敗',
                  'CT-007': '資料庫讀取失敗',
                  'CT-008': '請求逾時，請重試',
                  'CT-009': 'Segments JSON 格式無效',
                  'CT-010': 'AI 模型速率限制，請稍後再試',
                }).map(([code, message]) => ({ code, message }))).map(({ code, message }) => (
                  <div key={code} className="px-4 py-3 flex items-center gap-4">
                    <span className={`text-[11px] font-mono px-2 py-1 rounded border shrink-0 w-16 text-center ${
                      ERROR_CODE_COLORS[code] ?? 'text-slate-400 bg-slate-500/10 border-slate-500/30'
                    }`}>
                      {code}
                    </span>
                    <span className="text-sm text-slate-300">{message}</span>
                    <span className="ml-auto text-[10px] text-slate-600">
                      {code <= 'CT-003' ? '4xx 輸入錯誤' : code <= 'CT-005' ? '5xx AI 錯誤' : code <= 'CT-007' ? '5xx DB 錯誤' : '4xx/5xx 其他'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* DB schema info */}
            <div className="bg-white/[0.02] border border-slate-700/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-300">Fly Postgres 資料庫 Schema</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { table: 'ct_jobs',       desc: '每次分析任務記錄', fields: ['job_id (UUID)', 'transcript', 'task', 'model', 'status', 'char_count', 'created_at'] },
                  { table: 'ct_results',    desc: '已完成嘅分析結果',  fields: ['job_id (FK)', 'result_text', 'model_used', 'duration_ms', 'created_at'] },
                  { table: 'ct_error_logs', desc: '結構化錯誤日誌',    fields: ['job_id (nullable FK)', 'error_code', 'error_message', 'context (JSONB)', 'created_at'] },
                ].map(t => (
                  <div key={t.table} className="bg-white/[0.02] rounded-lg p-3">
                    <div className="text-xs font-mono text-indigo-400 mb-1">{t.table}</div>
                    <div className="text-[10px] text-slate-500 mb-2">{t.desc}</div>
                    <ul className="space-y-0.5">
                      {t.fields.map(f => (
                        <li key={f} className="text-[10px] text-slate-400 font-mono">• {f}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
