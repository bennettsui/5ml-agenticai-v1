'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Mic, FileText, Clipboard, Loader2, CheckCircle2, AlertCircle,
  ChevronLeft, Copy, RefreshCw, History, AlertTriangle,
  Languages, List, AlignLeft, BookOpen, Sparkles, Hash,
  ChevronDown, ChevronUp, Database, Info, Zap,
  CircleDot, Circle, CheckCircle, Cpu, Play, Pause, RotateCcw,
  Upload, Volume2, Wand2, Scissors, Download, SplitSquareHorizontal,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Task     = 'clean_transcript' | 'meeting_minutes' | 'summary_zh' | 'summary_en' | 'action_items';
type Model    = 'haiku' | 'sonnet' | 'deepseek' | 'gemini';
type PageTab  = 'analyze' | 'orchestrate' | 'visualizer' | 'history' | 'errors' | 'error-codes' | 'convert';

interface VideoType {
  type: string; label: string; emoji: string; confidence: number; reason: string;
}

type StepStatus = 'pending' | 'active' | 'done' | 'error';

interface ProgressStep {
  id: string;
  label: string;
  status: StepStatus;
}

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
// Config
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

const MODEL_OPTIONS: {
  value: Model; label: string; note: string; color: string;
  inputPer1M: number; outputPer1M: number;
}[] = [
  { value: 'deepseek', label: 'DeepSeek Chat',     note: 'Economy',  color: 'text-teal-400',   inputPer1M: 0.14, outputPer1M: 0.28  },
  { value: 'gemini',   label: 'Gemini 2.0 Flash',  note: 'Fast',     color: 'text-green-400',  inputPer1M: 0.075, outputPer1M: 0.30 },
  { value: 'haiku',    label: 'Claude Haiku 4.5',  note: 'Balanced', color: 'text-blue-400',   inputPer1M: 0.25, outputPer1M: 1.25  },
  { value: 'sonnet',   label: 'Claude Sonnet 4.6', note: 'Best',     color: 'text-purple-400', inputPer1M: 3.00, outputPer1M: 15.00 },
];

// Rough token estimate: ~4 chars per token
function estimateCost(model: Model, inputChars: number, outputChars = 600): string {
  const opt = MODEL_OPTIONS.find(m => m.value === model);
  if (!opt) return '—';
  const inputTokens  = inputChars  / 4;
  const outputTokens = outputChars / 4;
  const cost = (inputTokens * opt.inputPer1M + outputTokens * opt.outputPer1M) / 1_000_000;
  if (cost < 0.001) return '<$0.001';
  return `~$${cost.toFixed(4)}`;
}

// Recommended model per task
const TASK_DEFAULT_MODEL: Record<string, Model> = {
  clean_transcript: 'deepseek',
  meeting_minutes:  'deepseek',
  summary_zh:       'deepseek',
  summary_en:       'deepseek',
  action_items:     'deepseek',
};

const INITIAL_STEPS: ProgressStep[] = [
  { id: 'validating',   label: '驗證輸入',   status: 'pending' },
  { id: 'creating_job', label: '建立任務',   status: 'pending' },
  { id: 'calling_ai',   label: '呼叫模型',   status: 'pending' },
  { id: 'streaming',    label: '串流生成',   status: 'pending' },
  { id: 'saving',       label: '儲存記錄',   status: 'pending' },
];

const ORCH_STEPS: ProgressStep[] = [
  { id: 'validating',   label: '驗證輸入',     status: 'pending' },
  { id: 'creating_job', label: '建立任務',     status: 'pending' },
  { id: 'classifying',  label: '判斷影片類型', status: 'pending' },
  { id: 'calling_ai',   label: '呼叫模型',     status: 'pending' },
  { id: 'streaming',    label: '串流生成',     status: 'pending' },
  { id: 'saving',       label: '儲存記錄',     status: 'pending' },
];

const ORCH_TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  meeting:  { bg: 'bg-purple-500/[0.07]', border: 'border-purple-500/30', text: 'text-purple-300' },
  tutorial: { bg: 'bg-teal-500/[0.07]',   border: 'border-teal-500/30',   text: 'text-teal-300'   },
  interview:{ bg: 'bg-amber-500/[0.07]',  border: 'border-amber-500/30',  text: 'text-amber-300'  },
};

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

function taskDef(task: string) { return TASKS.find(t => t.value === task) ?? TASKS[0]; }

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('zh-HK', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function StepIndicator({ steps }: { steps: ProgressStep[] }) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        return (
          <div key={step.id} className="flex items-center gap-0">
            <div className="flex flex-col items-center gap-1">
              <div className={`flex items-center justify-center w-6 h-6 rounded-full border transition-all ${
                step.status === 'done'   ? 'border-green-500  bg-green-500/10'  :
                step.status === 'active' ? 'border-indigo-400 bg-indigo-500/10 ring-1 ring-indigo-500/30' :
                step.status === 'error'  ? 'border-red-500    bg-red-500/10'   :
                'border-slate-700 bg-slate-800/30'
              }`}>
                {step.status === 'done'   && <CheckCircle  className="w-3.5 h-3.5 text-green-400" />}
                {step.status === 'active' && <Loader2      className="w-3 h-3 text-indigo-400 animate-spin" />}
                {step.status === 'error'  && <AlertCircle  className="w-3.5 h-3.5 text-red-400" />}
                {step.status === 'pending'&& <Circle       className="w-3 h-3 text-slate-600" />}
              </div>
              <span className={`text-[9px] font-medium whitespace-nowrap ${
                step.status === 'done'    ? 'text-green-400' :
                step.status === 'active'  ? 'text-indigo-300' :
                step.status === 'error'   ? 'text-red-400'  :
                'text-slate-600'
              }`}>{step.label}</span>
            </div>
            {!isLast && (
              <div className={`w-8 h-px mx-1 mb-4 transition-colors ${
                step.status === 'done' ? 'bg-green-500/40' : 'bg-slate-700/60'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

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
          }`}>{job.status === 'done' ? '完成' : job.status === 'error' ? '失敗' : '處理中'}</span>
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
          {log.job_id && <p className="text-[10px] text-slate-600 font-mono mt-0.5">job: {log.job_id}</p>}
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] text-slate-500">{fmtDate(log.created_at)}</div>
        </div>
        {log.context && (open
          ? <ChevronUp className="w-3 h-3 text-slate-600 shrink-0 mt-0.5" />
          : <ChevronDown className="w-3 h-3 text-slate-600 shrink-0 mt-0.5" />)}
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
// Cassette Visualizer
// ─────────────────────────────────────────────────────────────────────────────

interface Segment { start: number; end: number; text: string; }

function CassetteVisualizer({ transcript, segments }: { transcript: string; segments: Segment[] }) {
  const [playing, setPlaying]         = useState(false);
  const [progress, setProgress]       = useState(0); // 0–1
  const [activeWordIdx, setActiveWord] = useState(-1);
  const tickRef                        = useRef<ReturnType<typeof setInterval> | null>(null);
  const trackRef                       = useRef<HTMLDivElement>(null);

  // Split transcript into words for the track
  const words = useMemo(() => transcript.trim().split(/\s+/).filter(Boolean), [transcript]);

  // Derive total "duration": if segments available use real time, else 1s per 5 chars
  const totalDuration = useMemo(() => {
    if (segments.length > 0) return segments[segments.length - 1].end;
    return Math.max(words.length * 0.35, 5);
  }, [segments, words]);

  // Which word is active at a given progress
  function wordAtProgress(p: number): number {
    const t = p * totalDuration;
    if (segments.length > 0) {
      // find segment whose time window contains t, then estimate word within
      let charOffset = 0;
      for (const seg of segments) {
        if (t >= seg.start && t <= seg.end) {
          const segWords = seg.text.trim().split(/\s+/);
          const frac = (t - seg.start) / Math.max(seg.end - seg.start, 0.01);
          const wIdx = Math.floor(frac * segWords.length);
          // map back to global word index
          const globalStart = transcript.slice(0, charOffset).trim().split(/\s+/).filter(Boolean).length;
          return globalStart + wIdx;
        }
        charOffset += seg.text.length + 1;
      }
      return -1;
    }
    return Math.min(Math.floor(p * words.length), words.length - 1);
  }

  function startPlay() {
    if (tickRef.current) clearInterval(tickRef.current);
    const step = 0.016; // ~60fps
    const inc  = step / totalDuration;
    tickRef.current = setInterval(() => {
      setProgress(prev => {
        const next = prev + inc;
        if (next >= 1) {
          clearInterval(tickRef.current!);
          setPlaying(false);
          setActiveWord(words.length - 1);
          return 1;
        }
        setActiveWord(wordAtProgress(next));
        return next;
      });
    }, step * 1000);
  }

  function handlePlayPause() {
    if (playing) {
      clearInterval(tickRef.current!);
      setPlaying(false);
    } else {
      if (progress >= 1) { setProgress(0); setActiveWord(-1); }
      setPlaying(true);
      startPlay();
    }
  }

  function handleReset() {
    clearInterval(tickRef.current!);
    setPlaying(false);
    setProgress(0);
    setActiveWord(-1);
  }

  // Scroll active word into view
  useEffect(() => {
    if (activeWordIdx < 0 || !trackRef.current) return;
    const el = trackRef.current.querySelector(`[data-widx="${activeWordIdx}"]`) as HTMLElement | null;
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeWordIdx]);

  useEffect(() => () => { if (tickRef.current) clearInterval(tickRef.current); }, []);

  const reelAngle = progress * 360 * 8; // 8 full rotations over whole tape
  const leftFill  = Math.max(0.15, 1 - progress * 0.7);  // left reel shrinks
  const rightFill = Math.max(0.15, 0.15 + progress * 0.7); // right reel grows

  // Waveform bars: pseudo-random heights seeded from word chars
  const waveformBars = useMemo(() => {
    const bars: number[] = [];
    for (let i = 0; i < 80; i++) {
      const seed = (i * 1337 + 7919) % 100;
      bars.push(20 + (seed % 60));
    }
    return bars;
  }, []);

  const playheadX = progress * 100; // %

  return (
    <div className="space-y-6">
      {/* Cassette body */}
      <div className="relative mx-auto max-w-lg">
        <div
          className="relative bg-slate-800 rounded-2xl border border-slate-600/60 p-6 shadow-2xl"
          style={{ background: 'linear-gradient(145deg, #1e293b, #0f172a)' }}
        >
          {/* Label strip */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-36 h-7 rounded-sm bg-indigo-900/70 border border-indigo-500/30 flex items-center justify-center">
            <span className="text-[9px] font-bold tracking-widest text-indigo-300 uppercase">Cantonese ASR</span>
          </div>

          {/* Reels */}
          <div className="flex items-center justify-between pt-6 pb-2 px-4">
            {/* Left reel */}
            <div className="relative flex items-center justify-center">
              <div
                className="rounded-full border-2 border-slate-500/70 bg-slate-700 flex items-center justify-center"
                style={{
                  width: 80, height: 80,
                  transform: `rotate(${reelAngle}deg)`,
                  transition: playing ? 'none' : 'transform 0.3s ease',
                }}
              >
                {/* Spokes */}
                {[0, 60, 120, 180, 240, 300].map(angle => (
                  <div key={angle} className="absolute w-0.5 bg-slate-400/50 rounded-full"
                    style={{ height: `${leftFill * 28}px`, transform: `rotate(${angle}deg)`, transformOrigin: 'center' }} />
                ))}
                {/* Hub */}
                <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-600/50 flex items-center justify-center z-10">
                  <div className="w-3 h-3 rounded-full bg-slate-700 border border-slate-500/50" />
                </div>
                {/* Tape mass ring */}
                <div className="absolute inset-0 rounded-full border-4 border-slate-600/30"
                  style={{ inset: `${(1 - leftFill) * 14}px`, background: 'rgba(99,102,241,0.08)' }} />
              </div>
            </div>

            {/* Tape window */}
            <div className="flex-1 mx-3 h-12 rounded bg-black/50 border border-slate-700/50 overflow-hidden relative flex items-center">
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="h-0.5 bg-slate-500/40 rounded-full"
                  style={{ width: `${leftFill * 100}%`, marginRight: 4 }}
                />
                <div className="w-2.5 h-5 bg-slate-600 rounded-sm border border-slate-500/50 mx-1 flex-shrink-0" />
                <div
                  className="h-0.5 bg-slate-500/40 rounded-full"
                  style={{ width: `${rightFill * 100}%`, marginLeft: 4 }}
                />
              </div>
            </div>

            {/* Right reel */}
            <div className="relative flex items-center justify-center">
              <div
                className="rounded-full border-2 border-slate-500/70 bg-slate-700 flex items-center justify-center"
                style={{
                  width: 80, height: 80,
                  transform: `rotate(${reelAngle}deg)`,
                  transition: playing ? 'none' : 'transform 0.3s ease',
                }}
              >
                {[0, 60, 120, 180, 240, 300].map(angle => (
                  <div key={angle} className="absolute w-0.5 bg-slate-400/50 rounded-full"
                    style={{ height: `${rightFill * 28}px`, transform: `rotate(${angle}deg)`, transformOrigin: 'center' }} />
                ))}
                <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-600/50 flex items-center justify-center z-10">
                  <div className="w-3 h-3 rounded-full bg-slate-700 border border-slate-500/50" />
                </div>
                <div className="absolute inset-0 rounded-full border-4 border-slate-600/30"
                  style={{ inset: `${(1 - rightFill) * 14}px`, background: 'rgba(99,102,241,0.08)' }} />
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3 mt-3">
            <button
              onClick={handleReset}
              className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600/50 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-600 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handlePlayPause}
              disabled={!transcript.trim()}
              className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/30 flex items-center justify-center text-white disabled:opacity-40 transition-all shadow-lg shadow-indigo-900/40"
            >
              {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <div className="text-[10px] font-mono text-slate-500 w-16 text-right">
              {Math.floor(progress * totalDuration / 60).toString().padStart(2,'0')}:{Math.floor(progress * totalDuration % 60).toString().padStart(2,'0')} /&nbsp;
              {Math.floor(totalDuration / 60).toString().padStart(2,'0')}:{Math.floor(totalDuration % 60).toString().padStart(2,'0')}
            </div>
          </div>
        </div>
      </div>

      {/* Waveform track */}
      <div className="bg-slate-900/80 rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="px-4 py-2 border-b border-slate-700/30 flex items-center gap-2">
          <span className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Audio Track</span>
          {segments.length > 0 && (
            <span className="text-[9px] text-slate-600">{segments.length} segments</span>
          )}
        </div>
        {/* Waveform bars with playhead */}
        <div className="relative h-20 px-3 flex items-center">
          <div className="absolute inset-x-3 inset-y-0 flex items-center gap-px">
            {waveformBars.map((h, i) => {
              const barX   = (i / waveformBars.length) * 100;
              const isPast = barX <= playheadX;
              return (
                <div
                  key={i}
                  className={`flex-1 rounded-sm transition-colors ${isPast ? 'bg-indigo-500/70' : 'bg-slate-700/60'}`}
                  style={{ height: `${h}%` }}
                />
              );
            })}
          </div>
          {/* Playhead line */}
          <div
            className="absolute top-0 bottom-0 w-px bg-indigo-400/80 pointer-events-none z-10"
            style={{ left: `calc(${playheadX}% + 12px)` }}
          >
            <div className="w-2 h-2 bg-indigo-400 rounded-full -translate-x-[3px] -translate-y-[1px]" />
          </div>
        </div>
      </div>

      {/* Scrolling word track */}
      {words.length > 0 && (
        <div className="bg-slate-900/60 rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="px-4 py-2 border-b border-slate-700/30">
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Transcript</span>
          </div>
          <div
            ref={trackRef}
            className="px-4 py-4 overflow-x-auto flex flex-wrap gap-1.5 max-h-40 overflow-y-auto"
          >
            {words.map((word, i) => {
              const isActive = i === activeWordIdx;
              const isPast   = i < activeWordIdx;
              return (
                <span
                  key={i}
                  data-widx={i}
                  className={`px-1.5 py-0.5 rounded text-sm leading-relaxed transition-all duration-100 ${
                    isActive
                      ? 'bg-indigo-500/30 text-indigo-200 ring-1 ring-indigo-400/60 scale-105'
                      : isPast
                      ? 'text-slate-400'
                      : 'text-slate-600'
                  }`}
                >
                  {word}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {!transcript.trim() && (
        <div className="text-center py-8 text-slate-600 text-sm">
          喺「分析」頁面貼上逐字稿先可以用視覺化模式
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function CantoneseTranscriptionPage() {
  const [pageTab, setPageTab]           = useState<PageTab>('analyze');

  // Transcription engine state
  const [sttLoading, setSttLoading]         = useState(false);
  const [sttError, setSttError]             = useState<string | null>(null);
  const [sttEngine, setSttEngine]           = useState<'paste' | 'google-stt' | 'whisper'>('paste');
  const [sttProviders, setSttProviders]     = useState<string[]>([]);
  const [sttLastProvider, setSttLastProvider] = useState<string | null>(null);
  const [sttFallbackFrom, setSttFallbackFrom] = useState<string | null>(null);
  const [sttDragging, setSttDragging]        = useState(false);
  const [sttProgress, setSttProgress]       = useState<number | null>(null);
  const [sttFileName, setSttFileName]       = useState<string | null>(null);
  const [sttFileSize, setSttFileSize]       = useState<number | null>(null);
  const [sttLog, setSttLog]                 = useState<string[]>([]);
  const audioInputRef                        = useRef<HTMLInputElement>(null);
  const sttXhrRef                            = useRef<XMLHttpRequest | null>(null);

  // ── Convert tab state ────────────────────────────────────────────────────
  type ConvFormat = 'mp3' | 'wav' | 'm4a';
  type ConvStatus = 'idle' | 'uploading' | 'converting' | 'done' | 'error';
  interface ConvChunk { index: number; filename: string; start: number; end: number; dataUrl: string }
  interface ConvJob {
    id: string; filename: string; size: number; format: ConvFormat;
    startTime: number; endTime: number; splitChunks: boolean; chunkLen: number;
    status: ConvStatus; error?: string; progress?: number;
    result?: { single?: { dataUrl: string; filename: string; blob?: Blob }; chunks?: ConvChunk[] };
    createdAt: number;
  }
  const [convFile, setConvFile]             = useState<File | null>(null);
  const [convFormat, setConvFormat]         = useState<ConvFormat>('mp3');
  const [convStartTime, setConvStartTime]   = useState('');
  const [convEndTime, setConvEndTime]       = useState('');
  const [convSplit, setConvSplit]           = useState(false);
  const [convChunkLen, setConvChunkLen]     = useState('60');
  const [convDragging, setConvDragging]     = useState(false);
  const [convJobs, setConvJobs]             = useState<ConvJob[]>([]);
  const [convActiveJob, setConvActiveJob]   = useState<string | null>(null);
  const convFileRef                         = useRef<HTMLInputElement>(null);
  const convXhrRef                          = useRef<XMLHttpRequest | null>(null);

  // Analyze state
  const [transcript, setTranscript]     = useState('');
  const [extraInstructions, setExtra]   = useState('');
  const [segments, setSegments]         = useState<Segment[]>([]);
  const [selectedTask, setTask]         = useState<Task>('clean_transcript');
  const [model, setModel]               = useState<Model>('deepseek');
  const [modelManuallySet, setModelManuallySet] = useState(false);

  // Streaming state
  const [loading, setLoading]           = useState(false);
  const [steps, setSteps]               = useState<ProgressStep[]>(INITIAL_STEPS);
  const [streamText, setStreamText]     = useState('');
  const [tokenCount, setTokenCount]     = useState(0);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [finalMeta, setFinalMeta]       = useState<{ model: string; duration_ms: number; char_count?: number } | null>(null);
  const [analyzeError, setAnalyzeError] = useState<{ code: string; message: string } | null>(null);
  const [copied, setCopied]             = useState(false);
  const streamRef                       = useRef<HTMLPreElement>(null);
  const abortRef                        = useRef<AbortController | null>(null);

  // Orchestrate state
  const [orchLoading, setOrchLoading]   = useState(false);
  const [orchSteps, setOrchSteps]       = useState<ProgressStep[]>(ORCH_STEPS.map(s => ({ ...s })));
  const [orchStream, setOrchStream]     = useState('');
  const [orchTokens, setOrchTokens]     = useState(0);
  const [orchJobId, setOrchJobId]       = useState<string | null>(null);
  const [orchMeta, setOrchMeta]         = useState<{ model: string; duration_ms: number; char_count?: number } | null>(null);
  const [orchError, setOrchError]       = useState<{ code: string; message: string } | null>(null);
  const [orchType, setOrchType]         = useState<VideoType | null>(null);
  const [orchCopied, setOrchCopied]     = useState(false);
  const orchAbortRef                    = useRef<AbortController | null>(null);
  const orchStreamRef                   = useRef<HTMLDivElement>(null);

  // History state
  const [jobs, setJobs]                 = useState<JobRecord[]>([]);
  const [jobsLoading, setJobsLoading]   = useState(false);
  const [expandedJob, setExpandedJob]   = useState<JobRecord | null>(null);

  // Errors state
  const [errorLogs, setErrorLogs]       = useState<ErrorLog[]>([]);
  const [errorsLoading, setErrorsLoading] = useState(false);

  // Error codes
  const [errorCodes, setErrorCodes]     = useState<{ code: string; message: string }[]>([]);

  // Stats
  const [stats, setStats]               = useState<Stats | null>(null);

  // ── Step helpers ────────────────────────────────────────────────────────
  function setStepStatus(id: string, status: StepStatus, label?: string) {
    setSteps(prev => prev.map(s =>
      s.id === id ? { ...s, status, ...(label ? { label } : {}) } : s
    ));
  }

  function completeAllPrev(upToId: string) {
    const idx = INITIAL_STEPS.findIndex(s => s.id === upToId);
    setSteps(prev => prev.map((s, i) =>
      i < idx && s.status !== 'error' ? { ...s, status: 'done' } : s
    ));
  }

  // ── Analyze (SSE streaming) ──────────────────────────────────────────────
  async function handleAnalyze() {
    if (!transcript.trim() || loading) return;

    // Reset state
    setLoading(true);
    setStreamText('');
    setTokenCount(0);
    setAnalyzeError(null);
    setCurrentJobId(null);
    setFinalMeta(null);
    setSteps(INITIAL_STEPS.map(s => ({ ...s, status: 'pending' })));

    abortRef.current = new AbortController();

    try {
      const response = await fetch('/api/cantonese-transcription/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: transcript.trim(),
          task: selectedTask,
          extra_instructions: extraInstructions.trim() || undefined,
          model,
        }),
        signal: abortRef.current.signal,
      });

      if (!response.body) throw new Error('No streaming response body');

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer    = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data: ')) continue;
          let ev: Record<string, unknown>;
          try { ev = JSON.parse(line.slice(6)); } catch { continue; }

          switch (ev.type) {
            case 'step': {
              const stepId = ev.step as string;
              completeAllPrev(stepId);
              setStepStatus(stepId, 'active', ev.label as string);
              break;
            }
            case 'job_created':
              setCurrentJobId(ev.job_id as string);
              setStepStatus('creating_job', 'done');
              break;
            case 'token': {
              const txt = ev.text as string;
              setStreamText(prev => prev + txt);
              setTokenCount(ev.token_count as number ?? 0);
              // Auto-scroll
              setTimeout(() => streamRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 30);
              break;
            }
            case 'done':
              setSteps(prev => prev.map(s => ({ ...s, status: s.status !== 'error' ? 'done' : 'error' })));
              setFinalMeta({ model: ev.model as string, duration_ms: ev.duration_ms as number, char_count: ev.char_count as number });
              setCurrentJobId(ev.job_id as string);
              break;
            case 'error':
              setStepStatus(steps.find(s => s.status === 'active')?.id ?? 'validating', 'error');
              setAnalyzeError({ code: ev.error_code as string ?? 'ERR', message: ev.error as string ?? '分析失敗' });
              break;
          }
        }
      }
    } catch (err: unknown) {
      if ((err as { name?: string }).name !== 'AbortError') {
        setAnalyzeError({ code: 'CT-005', message: err instanceof Error ? err.message : '網絡錯誤' });
        setSteps(prev => prev.map(s => s.status === 'active' ? { ...s, status: 'error' } : s));
      }
    } finally {
      setLoading(false);
    }
  }

  function handleStop() {
    abortRef.current?.abort();
    setLoading(false);
  }

  // ── Orchestrate (classify + stream type-specific output) ────────────────
  async function handleOrchestrate() {
    if (!transcript.trim() || orchLoading) return;

    setOrchLoading(true);
    setOrchStream('');
    setOrchTokens(0);
    setOrchError(null);
    setOrchJobId(null);
    setOrchMeta(null);
    setOrchType(null);
    setOrchSteps(ORCH_STEPS.map(s => ({ ...s, status: 'pending' })));

    orchAbortRef.current = new AbortController();

    function setStep(id: string, status: StepStatus, label?: string) {
      setOrchSteps(prev => prev.map(s =>
        s.id === id ? { ...s, status, ...(label ? { label } : {}) } : s
      ));
    }
    function completePrev(upToId: string) {
      const idx = ORCH_STEPS.findIndex(s => s.id === upToId);
      setOrchSteps(prev => prev.map((s, i) =>
        i < idx && s.status !== 'error' ? { ...s, status: 'done' } : s
      ));
    }

    try {
      const resp = await fetch('/api/cantonese-transcription/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: transcript.trim(), model, extra_instructions: extraInstructions.trim() || undefined }),
        signal: orchAbortRef.current.signal,
      });
      if (!resp.body) throw new Error('No streaming body');

      const reader  = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer    = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data: ')) continue;
          let ev: Record<string, unknown>;
          try { ev = JSON.parse(line.slice(6)); } catch { continue; }

          switch (ev.type) {
            case 'step':
              completePrev(ev.step as string);
              setStep(ev.step as string, 'active', ev.label as string);
              break;
            case 'job_created':
              setOrchJobId(ev.job_id as string);
              setStep('creating_job', 'done');
              break;
            case 'classified':
              setOrchType({
                type: ev.video_type as string,
                label: ev.label as string,
                emoji: ev.emoji as string,
                confidence: ev.confidence as number,
                reason: ev.reason as string,
              });
              setStep('classifying', 'done');
              break;
            case 'token': {
              const txt = ev.text as string;
              setOrchStream(prev => prev + txt);
              setOrchTokens(ev.token_count as number ?? 0);
              setTimeout(() => orchStreamRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 30);
              break;
            }
            case 'done':
              setOrchSteps(prev => prev.map(s => ({ ...s, status: s.status !== 'error' ? 'done' : 'error' })));
              setOrchMeta({ model: ev.model as string, duration_ms: ev.duration_ms as number, char_count: ev.char_count as number });
              setOrchJobId(ev.job_id as string);
              break;
            case 'error':
              setStep(orchSteps.find(s => s.status === 'active')?.id ?? 'validating', 'error');
              setOrchError({ code: ev.error_code as string ?? 'ERR', message: ev.error as string ?? '分析失敗' });
              break;
          }
        }
      }
    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') {
        setOrchError({ code: 'ERR', message: (err as Error).message ?? '請求失敗' });
      }
    } finally {
      setOrchLoading(false);
    }
  }

  function handleOrchStop() {
    orchAbortRef.current?.abort();
    setOrchLoading(false);
  }

  // ── Convert helpers ──────────────────────────────────────────────────────
  function handleConvert() {
    if (!convFile) return;
    const jobId = crypto.randomUUID();
    const job: ConvJob = {
      id: jobId, filename: convFile.name, size: convFile.size,
      format: convFormat,
      startTime: parseFloat(convStartTime) || 0,
      endTime:   parseFloat(convEndTime)   || 0,
      splitChunks: convSplit,
      chunkLen:  parseInt(convChunkLen, 10) || 60,
      status: 'uploading', progress: 0, createdAt: Date.now(),
    };
    setConvJobs(prev => [job, ...prev]);
    setConvActiveJob(jobId);

    const form = new FormData();
    form.append('file',        convFile);
    form.append('format',      convFormat);
    form.append('startTime',   String(job.startTime));
    form.append('endTime',     String(job.endTime));
    form.append('splitChunks', String(convSplit));
    form.append('chunkLen',    String(job.chunkLen));

    const xhr = new XMLHttpRequest();
    convXhrRef.current = xhr;

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 50); // upload = 0-50%
        setConvJobs(prev => prev.map(j => j.id === jobId ? { ...j, progress: pct } : j));
      }
    };
    xhr.upload.onload = () => {
      setConvJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'converting', progress: 60 } : j));
    };
    xhr.onload = () => {
      convXhrRef.current = null;
      const contentType = xhr.getResponseHeader('Content-Type') || '';
      const buf = xhr.response as ArrayBuffer;
      const text = new TextDecoder().decode(buf);
      if (xhr.status >= 200 && xhr.status < 300) {
        if (contentType.startsWith('audio/') || contentType.startsWith('video/')) {
          // Single file — create object URL for download
          const blob = new Blob([buf], { type: contentType });
          const dataUrl = URL.createObjectURL(blob);
          const baseName = convFile.name.replace(/\.[^.]+$/, '');
          const filename = `${baseName}.${convFormat}`;
          setConvJobs(prev => prev.map(j => j.id === jobId
            ? { ...j, status: 'done', progress: 100, result: { single: { dataUrl, filename, blob } } }
            : j));
        } else {
          // JSON response (chunks mode or error)
          try {
            const data = JSON.parse(text);
            if (data.ok) {
              setConvJobs(prev => prev.map(j => j.id === jobId
                ? { ...j, status: 'done', progress: 100, result: { chunks: data.chunks } }
                : j));
            } else {
              setConvJobs(prev => prev.map(j => j.id === jobId
                ? { ...j, status: 'error', error: data.error || '轉換失敗' }
                : j));
            }
          } catch {
            setConvJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'error', error: '無效回應' } : j));
          }
        }
      } else {
        let msg = `HTTP ${xhr.status}`;
        try { msg = JSON.parse(text)?.error || msg; } catch { /* ignore */ }
        setConvJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'error', error: msg } : j));
      }
    };
    xhr.onerror = () => {
      convXhrRef.current = null;
      setConvJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'error', error: '網絡錯誤' } : j));
    };
    xhr.onabort = () => {
      convXhrRef.current = null;
      setConvJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'error', error: '已取消' } : j));
    };
    xhr.open('POST', '/api/cantonese-transcription/convert');
    xhr.responseType = 'arraybuffer';
    xhr.send(form);
  }

  function cancelConvert() {
    convXhrRef.current?.abort();
    convXhrRef.current = null;
    setConvActiveJob(null);
  }

  function convSendToTranscribe(dataUrl: string, filename: string, blob?: Blob) {
    const go = (b: Blob) => {
      const file = new File([b], filename, { type: b.type });
      setSttEngine('google-stt');
      setPageTab('analyze');
      setTimeout(() => handleSttUpload(file), 100);
    };
    if (blob) { go(blob); return; }
    fetch(dataUrl)
      .then(r => r.blob())
      .then(go)
      .catch(err => console.error('[convSendToTranscribe]', err));
  }

  function cancelSttUpload() {
    sttXhrRef.current?.abort();
    sttXhrRef.current = null;
    setSttLoading(false);
    setSttProgress(null);
    setSttError(null);
  }

  function handleSttUpload(file: File) {
    cancelSttUpload();
    setSttLoading(true);
    setSttError(null);
    setSttFallbackFrom(null);
    setSttProgress(0);
    setSttFileName(file.name);
    setSttFileSize(file.size);
    setSttLog([]);

    const form = new FormData();
    form.append('audio', file);
    form.append('language', 'yue-Hant-HK');
    const providerParam = sttEngine === 'whisper' ? 'whisper' : sttEngine === 'google-stt' ? 'google-stt' : 'auto';
    form.append('provider', providerParam);

    const xhr = new XMLHttpRequest();
    sttXhrRef.current = xhr;
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setSttProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.upload.onload = () => setSttProgress(100);

    // Parse streaming NDJSON progress lines as they arrive
    let parsedUpTo = 0;
    xhr.onprogress = () => {
      const newText = xhr.responseText.slice(parsedUpTo);
      parsedUpTo = xhr.responseText.length;
      const lines = newText.split('\n');
      const logLines: string[] = [];
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const obj = JSON.parse(line) as Record<string, unknown>;
          if (obj.type === 'log') logLines.push(obj.message as string);
        } catch { /* incomplete line, will retry on next progress */ }
      }
      if (logLines.length) setSttLog(prev => [...prev, ...logLines]);
    };

    xhr.onload = () => {
      sttXhrRef.current = null;
      // Parse final NDJSON result (last 'done' or 'error' entry)
      let data: Record<string, unknown> = {};
      const lines = xhr.responseText.split('\n').filter(l => l.trim());
      for (const line of lines) {
        try {
          const obj = JSON.parse(line) as Record<string, unknown>;
          if (obj.type === 'done' || obj.type === 'error') data = obj;
        } catch { /* ignore */ }
      }
      if (!data.ok && lines.length === 1) {
        // Fallback: plain JSON error from early validation
        try { data = JSON.parse(xhr.responseText); } catch { /* ignore */ }
      }
      if (xhr.status < 200 || xhr.status >= 300 || !data.ok) {
        setSttError((data.error as string) ?? `轉錄失敗 (HTTP ${xhr.status})`);
      } else {
        setTranscript((data.transcript as string) ?? '');
        if ((data.segments as unknown[])?.length) setSegments(data.segments as Segment[]);
        setSttLastProvider((data.provider as string) ?? null);
        setSttFallbackFrom((data.fallbackFrom as string) ?? null);
        setSttEngine('paste');
      }
      setSttLoading(false);
      setSttProgress(null);
    };
    xhr.onerror = () => {
      sttXhrRef.current = null;
      // Try to extract a message from the response body if present
      let msg = '網絡錯誤，請重試';
      try {
        const d = JSON.parse(xhr.responseText);
        if (d?.error) msg = d.error;
      } catch { /* ignore */ }
      setSttError(msg);
      setSttLoading(false);
      setSttProgress(null);
    };
    xhr.ontimeout = () => {
      sttXhrRef.current = null;
      setSttError('請求逾時，音訊檔案太長或網絡緩慢，請重試');
      setSttLoading(false);
      setSttProgress(null);
    };
    xhr.onabort = () => {
      sttXhrRef.current = null;
      setSttLoading(false);
      setSttProgress(null);
    };
    xhr.open('POST', '/api/cantonese-transcription/transcribe');
    xhr.send(form);
  }

  async function handleCopy() {
    if (!streamText) return;
    await navigator.clipboard.writeText(streamText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Data loaders ────────────────────────────────────────────────────────
  const loadJobs = useCallback(async () => {
    setJobsLoading(true);
    try {
      const res  = await fetch('/api/cantonese-transcription/jobs?limit=50');
      const data = await res.json();
      if (data.ok) setJobs(data.jobs);
    } catch { /* ignore */ } finally { setJobsLoading(false); }
  }, []);

  const loadErrors = useCallback(async () => {
    setErrorsLoading(true);
    try {
      const res  = await fetch('/api/cantonese-transcription/errors?limit=100');
      const data = await res.json();
      if (data.ok) setErrorLogs(data.logs);
    } catch { /* ignore */ } finally { setErrorsLoading(false); }
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

  useEffect(() => {
    if (pageTab === 'history')     { loadJobs(); loadStats(); }
    if (pageTab === 'errors')      { loadErrors(); }
    if (pageTab === 'error-codes') { loadErrorCodes(); }
  }, [pageTab, loadJobs, loadErrors, loadStats, loadErrorCodes]);

  // Fetch available STT providers once on mount
  useEffect(() => {
    fetch('/api/cantonese-transcription/providers')
      .then(r => r.json())
      .then(d => { if (d.ok) setSttProviders(d.available ?? []); })
      .catch(() => {});
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  const td = TASKS.find(t => t.value === selectedTask)!;
  const isDone  = !loading && streamText && !analyzeError;
  const isError = !!analyzeError;

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
          <div className="ml-auto">
            <span className="text-[10px] text-slate-500 border border-slate-700/50 rounded px-1.5 py-0.5">
              Whisper v3 · khleeloo
            </span>
          </div>
        </div>

        {/* Page tabs */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-0 border-t border-slate-800/40">
          {([
            { id: 'analyze',     label: '分析',     icon: Zap },
            { id: 'orchestrate', label: '智能分析', icon: Wand2 },
            { id: 'visualizer',  label: '視覺化',   icon: Mic },
            { id: 'history',     label: '歷史記錄', icon: History },
            { id: 'errors',      label: '錯誤日誌', icon: AlertTriangle },
            { id: 'error-codes', label: '錯誤代碼', icon: Info },
            { id: 'convert',     label: '格式轉換', icon: Scissors },
          ] as { id: PageTab; label: string; icon: typeof Zap }[]).map(tab => {
            const Icon   = tab.icon;
            const active = pageTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setPageTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                  active ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3 h-3" />{tab.label}
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
          <div className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* ── Left: input ─────────────────────────────────────── */}
              <div className="space-y-4">

                {/* Transcription engine toggle */}
                <div className="flex items-center gap-1 bg-slate-800/60 rounded-lg border border-slate-700/50 p-1">
                  <button
                    onClick={() => { cancelSttUpload(); setSttEngine('paste'); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                      sttEngine === 'paste'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Clipboard className="w-3 h-3" />貼上逐字稿
                  </button>
                  <button
                    onClick={() => setSttEngine('whisper')}
                    disabled={!sttProviders.includes('whisper')}
                    title={!sttProviders.includes('whisper') ? 'WHISPER_SERVICE_URL 未設定' : 'Whisper large-v3 Cantonese'}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                      sttEngine === 'whisper'
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Cpu className="w-3 h-3" />Whisper
                  </button>
                  <button
                    onClick={() => setSttEngine('google-stt')}
                    disabled={!sttProviders.includes('google-stt')}
                    title={!sttProviders.includes('google-stt') ? 'GEMINI_API_KEY 未設定' : 'Google Cloud Speech-to-Text'}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                      sttEngine === 'google-stt'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Volume2 className="w-3 h-3" />Google STT
                  </button>
                </div>

                {/* STT upload panel — shown for whisper or google-stt engines */}
                {(sttEngine === 'whisper' || sttEngine === 'google-stt') && (
                  <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-slate-700/50 flex items-center gap-2">
                      {sttEngine === 'whisper'
                        ? <Cpu className="w-3.5 h-3.5 text-violet-400" />
                        : <Volume2 className="w-3.5 h-3.5 text-blue-400" />}
                      <span className="text-xs font-medium text-slate-300">
                        {sttEngine === 'whisper' ? 'Whisper large-v3 Cantonese' : 'Google Cloud Speech-to-Text V2'}
                      </span>
                      <span className="text-[10px] text-slate-600 ml-auto">
                        {sttEngine === 'whisper' ? 'yue · khleeloo fine-tune' : 'yue-Hant-HK · Cantonese'}
                      </span>
                    </div>
                    <div className="p-4 space-y-3">
                      <input
                        ref={audioInputRef}
                        type="file"
                        accept="audio/*,.wav,.mp3,.ogg,.flac,.m4a,.webm"
                        className="hidden"
                        onChange={e => { if (e.target.files?.[0]) handleSttUpload(e.target.files[0]); }}
                      />
                      <button
                        onClick={() => audioInputRef.current?.click()}
                        disabled={sttLoading}
                        onDragOver={e => { e.preventDefault(); if (!sttLoading) setSttDragging(true); }}
                        onDragLeave={() => setSttDragging(false)}
                        onDrop={e => {
                          e.preventDefault();
                          setSttDragging(false);
                          const file = e.dataTransfer.files?.[0];
                          if (file && !sttLoading) handleSttUpload(file);
                        }}
                        className={`w-full py-8 rounded-xl border-2 border-dashed transition-all flex flex-col items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                          sttDragging
                            ? sttEngine === 'whisper'
                              ? 'border-violet-500/70 bg-violet-500/[0.06]'
                              : 'border-blue-500/70 bg-blue-500/[0.06]'
                            : sttEngine === 'whisper'
                              ? 'border-slate-600/60 hover:border-violet-500/50 hover:bg-violet-500/[0.03]'
                              : 'border-slate-600/60 hover:border-blue-500/50 hover:bg-blue-500/[0.03]'
                        }`}
                      >
                        {sttProgress !== null && sttProgress < 100 ? (
                          <>
                            <Upload className={`w-5 h-5 ${sttEngine === 'whisper' ? 'text-violet-400' : 'text-blue-400'}`} />
                            <span className="text-xs text-slate-300 max-w-xs truncate">{sttFileName}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-40 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-150 ${sttEngine === 'whisper' ? 'bg-violet-500' : 'bg-blue-500'}`}
                                  style={{ width: `${sttProgress}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-slate-500 w-14">{sttProgress}% 上傳中</span>
                              <button
                                onMouseDown={e => e.stopPropagation()}
                                onClick={e => { e.stopPropagation(); cancelSttUpload(); }}
                                className="text-slate-500 hover:text-slate-300 transition-colors"
                                title="取消上傳"
                              >✕</button>
                            </div>
                          </>
                        ) : sttLoading ? (
                          <>
                            <Loader2 className={`w-6 h-6 animate-spin ${sttEngine === 'whisper' ? 'text-violet-400' : 'text-blue-400'}`} />
                            <span className="text-xs text-slate-400">轉錄中，請稍候…</span>
                            {sttLog.length > 0 && (
                              <div className="w-full max-h-28 overflow-y-auto space-y-0.5 px-2">
                                {sttLog.map((msg, i) => (
                                  <p key={i} className={`text-[10px] text-center font-mono ${i === sttLog.length - 1 ? 'text-slate-400' : 'text-slate-600'}`}>{msg}</p>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <Upload className={`w-6 h-6 ${sttDragging ? (sttEngine === 'whisper' ? 'text-violet-400' : 'text-blue-400') : 'text-slate-500'}`} />
                            <span className="text-xs text-slate-400">{sttDragging ? '放開以上傳' : '上傳音訊檔案'}</span>
                            <span className="text-[10px] text-slate-600">WAV · MP3 · OGG · FLAC · M4A · WebM · 最大 100MB</span>
                          </>
                        )}
                      </button>
                      {sttError && (
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                          <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          <span className="text-xs text-red-300">{sttError}</span>
                        </div>
                      )}
                      {sttFallbackFrom && (
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="text-xs text-amber-300">Whisper 失敗，自動切換至 Google STT</span>
                        </div>
                      )}
                      {transcript && !sttLoading && (
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-500/10 border border-green-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                          <div className="min-w-0">
                            <span className="text-xs text-green-300">轉錄完成 · {transcript.length} 字元{segments.length > 0 ? ` · ${segments.length} segments` : ''}</span>
                            {sttFileName && <p className="text-[10px] text-green-500/70 truncate">{sttFileName}{sttFileSize ? ` · ${(sttFileSize / 1024 / 1024).toFixed(1)} MB` : ''}</p>}
                          </div>
                        </div>
                      )}
                      <p className="text-[10px] text-slate-600 leading-relaxed">
                        {sttEngine === 'whisper'
                          ? <>自家部署 Whisper large-v3 粵語模型（<code className="text-slate-500">khleeloo/whisper-large-v3-cantonese</code>）。若 Whisper 失敗會自動 fallback 至 Google STT。</>
                          : <>使用 Google Cloud Speech-to-Text V1（<code className="text-slate-500">latest_long</code> model），支援粵語（<code className="text-slate-500">yue-Hant-HK</code>）及中英混合識別。</>}
                      </p>
                    </div>
                  </div>
                )}

                {/* Transcript textarea (always shown, highlighted when auto-filled) */}
                <div className={`bg-slate-800/60 rounded-xl border overflow-hidden transition-colors ${
                  sttEngine === 'paste' ? 'border-slate-700/50' : 'border-slate-700/30'
                }`}>
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700/50">
                    <div className="flex items-center gap-2">
                      <Clipboard className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-medium text-slate-300">
                        {sttEngine === 'paste' ? 'ASR 逐字稿' : 'STT 結果 / 手動編輯'}
                      </span>
                      {sttLastProvider === 'whisper' && transcript && (
                        <span className="text-[9px] text-violet-400 bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.5 rounded-full">Whisper</span>
                      )}
                      {sttLastProvider === 'google-stt' && transcript && !sttFallbackFrom && (
                        <span className="text-[9px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded-full">Google STT</span>
                      )}
                      {sttFallbackFrom && transcript && (
                        <span className="text-[9px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full">Google STT (fallback)</span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500">{transcript.length.toLocaleString()} 字元</span>
                  </div>
                  <textarea
                    value={transcript}
                    onChange={e => setTranscript(e.target.value)}
                    disabled={loading}
                    placeholder={sttEngine !== 'paste' ? 'STT 轉錄結果將顯示喺度，可直接編輯…' : '貼上 Whisper ASR 輸出嘅粵語逐字稿…\n\n例：佢哋噉講嘅，我冇聽錯喎，嗰個 project 要喺下個月 deliver 㗎。'}
                    rows={sttEngine !== 'paste' ? 5 : 13}
                    className="w-full bg-transparent px-4 py-3 text-sm text-slate-200 placeholder-slate-600 resize-none focus:outline-none font-mono leading-relaxed disabled:opacity-50"
                  />
                </div>

                <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-slate-700/50">
                    <span className="text-xs font-medium text-slate-300">額外指示（可選）</span>
                  </div>
                  <textarea
                    value={extraInstructions}
                    onChange={e => setExtra(e.target.value)}
                    disabled={loading}
                    placeholder="例：重點關注 marketing 相關討論；或 Focus on technical decisions only"
                    rows={2}
                    className="w-full bg-transparent px-4 py-3 text-sm text-slate-300 placeholder-slate-600 resize-none focus:outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              {/* ── Right: task + model ──────────────────────────── */}
              <div className="space-y-4">
                <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-slate-700/50">
                    <span className="text-xs font-medium text-slate-300">分析任務</span>
                  </div>
                  <div className="p-3 grid grid-cols-1 gap-2">
                    {TASKS.map(task => {
                      const Icon   = task.icon;
                      const active = selectedTask === task.value;
                      return (
                        <button
                          key={task.value}
                          onClick={() => {
                            setTask(task.value);
                            if (!modelManuallySet) setModel(TASK_DEFAULT_MODEL[task.value] ?? 'deepseek');
                          }}
                          disabled={loading}
                          className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all disabled:cursor-not-allowed ${
                            active ? task.ring : 'border-slate-700/50 hover:bg-white/[0.02]'
                          }`}
                        >
                          <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${active ? task.color : 'text-slate-500'}`} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-medium ${active ? 'text-white' : 'text-slate-300'}`}>{task.label}</span>
                              <span className="text-[10px] text-slate-600">{task.labelEn}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">{task.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-slate-700/50">
                    <span className="text-xs font-medium text-slate-300">AI 模型</span>
                  </div>
                  <div className="p-3 grid grid-cols-2 gap-2">
                    {MODEL_OPTIONS.map(opt => {
                      const isDefault = TASK_DEFAULT_MODEL[selectedTask] === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => { setModel(opt.value); setModelManuallySet(true); }}
                          disabled={loading}
                          className={`p-2.5 rounded-lg border text-center transition-all disabled:cursor-not-allowed relative ${
                            model === opt.value
                              ? 'border-indigo-500/40 bg-indigo-500/[0.07] ring-1 ring-indigo-500/30'
                              : 'border-slate-700/50 hover:bg-white/[0.02]'
                          }`}
                        >
                          {isDefault && (
                            <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-[8px] bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-full px-1.5 leading-4">推薦</span>
                          )}
                          <div className={`text-[11px] font-medium mt-1 ${model === opt.value ? opt.color : 'text-slate-300'}`}>{opt.label}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{opt.note}</div>
                          <div className="text-[9px] text-slate-600 mt-0.5">${opt.inputPer1M}/${opt.outputPer1M} /1M</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Cost estimate */}
                {transcript.trim() && !loading && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-slate-700/30 text-[11px]">
                    <span className="text-slate-500">預計費用：</span>
                    <span className={`font-medium ${MODEL_OPTIONS.find(m => m.value === model)?.color ?? 'text-slate-300'}`}>
                      {estimateCost(model, transcript.length)}
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className={`${MODEL_OPTIONS.find(m => m.value === model)?.color ?? 'text-slate-300'}`}>
                      {MODEL_OPTIONS.find(m => m.value === model)?.label}
                    </span>
                    <span className="text-slate-600 ml-auto">≈{Math.round(transcript.length / 4).toLocaleString()} input tokens</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleAnalyze}
                    disabled={loading || !transcript.trim()}
                    className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    {loading
                      ? <><Loader2 className="w-4 h-4 animate-spin" />分析緊…</>
                      : <><td.icon className="w-4 h-4" />{td.label}</>}
                  </button>
                  {loading && (
                    <button
                      onClick={handleStop}
                      className="px-4 py-3 rounded-xl border border-red-500/40 text-red-400 text-sm hover:bg-red-500/10 transition-colors"
                    >
                      停止
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ── Progress steps ─────────────────────────────────────────── */}
            {(loading || streamText || analyzeError) && (
              <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 px-5 py-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-xs font-medium text-slate-300">處理進度</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500">
                    {currentJobId && (
                      <span className="font-mono">#{currentJobId.slice(0, 8)}</span>
                    )}
                    {tokenCount > 0 && (
                      <span>{tokenCount.toLocaleString()} tokens</span>
                    )}
                    {finalMeta && (
                      <>
                        <span>{(finalMeta.duration_ms / 1000).toFixed(1)}s</span>
                        <span className="text-slate-600">·</span>
                        <span>{finalMeta.model.replace('claude-', '').replace('-20251001', '').replace('gemini-', 'Gemini ')}</span>
                        {finalMeta.char_count && (
                          <>
                            <span className="text-slate-600">·</span>
                            <span className="text-green-400">
                              實際≈{estimateCost(model, transcript.length, finalMeta.char_count)}
                            </span>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <StepIndicator steps={steps} />
              </div>
            )}

            {/* ── Error ──────────────────────────────────────────────────── */}
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

            {/* ── Live streaming result ──────────────────────────────────── */}
            {streamText && (
              <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700/50">
                  <div className="flex items-center gap-2">
                    {loading
                      ? <><CircleDot className="w-3 h-3 text-indigo-400 animate-pulse" /><span className="text-xs font-medium text-indigo-300">生成中…</span></>
                      : <><CheckCircle2 className="w-3.5 h-3.5 text-green-400" /><span className="text-xs font-medium text-slate-300">{td.label} — 完成</span></>}
                  </div>
                  <div className="flex items-center gap-2">
                    {streamText.length > 0 && (
                      <span className="text-[10px] text-slate-500">{streamText.length.toLocaleString()} chars</span>
                    )}
                    {!loading && (
                      <button
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-white transition-colors"
                      >
                        {copied
                          ? <><CheckCircle2 className="w-3 h-3 text-green-400" />已複製</>
                          : <><Copy className="w-3 h-3" />複製</>}
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-5 max-h-[500px] overflow-y-auto">
                  <pre className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
                    {streamText}
                    {loading && <span className="inline-block w-0.5 h-4 bg-indigo-400 animate-pulse ml-0.5 align-text-bottom" />}
                  </pre>
                  <div ref={streamRef} />
                </div>
              </div>
            )}

            {/* Info footer */}
            {!loading && !streamText && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-white/[0.02] border border-slate-700/30">
                <Mic className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  此工具處理來自 <span className="text-slate-400">khleeloo/whisper-large-v3-cantonese</span> 嘅 ASR 輸出。
                  結果以 SSE 串流即時顯示，每個 token 實時渲染。所有記錄保存至 Fly Postgres。
                </p>
              </div>
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/* ORCHESTRATE TAB                                                   */}
        {/* ================================================================ */}
        {pageTab === 'orchestrate' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* ── Left: transcript input (shared state) ───────────────── */}
              <div className="space-y-4">
                <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-slate-700/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-medium text-slate-300">粵語逐字稿</span>
                    </div>
                    {transcript && (
                      <span className="text-[10px] text-slate-500">{transcript.length.toLocaleString()} chars</span>
                    )}
                  </div>
                  <textarea
                    value={transcript}
                    onChange={e => setTranscript(e.target.value)}
                    disabled={orchLoading}
                    placeholder="貼上粵語逐字稿…（Orchestrator 會自動判斷係會議、教學影片定訪談，然後出對應格式輸出）"
                    className="w-full h-64 px-4 py-3 bg-transparent text-sm text-slate-200 placeholder-slate-600 resize-none focus:outline-none"
                  />
                </div>

                {/* Extra instructions */}
                <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-slate-700/50">
                    <span className="text-xs font-medium text-slate-300">補充說明（可選）</span>
                  </div>
                  <textarea
                    value={extraInstructions}
                    onChange={e => setExtra(e.target.value)}
                    disabled={orchLoading}
                    placeholder="e.g. 出席者包括 Alice (PM), Bob (Dev)…"
                    className="w-full h-20 px-4 py-3 bg-transparent text-sm text-slate-200 placeholder-slate-600 resize-none focus:outline-none"
                  />
                </div>
              </div>

              {/* ── Right: model + controls ──────────────────────────────── */}
              <div className="space-y-4">

                {/* How it works card */}
                <div className="bg-indigo-500/[0.05] rounded-xl border border-indigo-500/20 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-xs font-semibold text-indigo-300">智能 Orchestrator</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { step: '01', icon: '🔍', label: 'Gemini 快速分類', desc: '判斷係會議 / 教學影片 / 訪談' },
                      { step: '02', icon: '📐', label: '選擇對應 Prompt', desc: '紀要 / 課程筆記 / 訪談摘要' },
                      { step: '03', icon: '⚡', label: '串流輸出', desc: '用你選擇嘅 AI 模型生成' },
                    ].map(({ step, icon, label, desc }) => (
                      <div key={step} className="flex items-start gap-3">
                        <span className="text-[10px] font-mono text-indigo-500 mt-0.5 w-4 shrink-0">{step}</span>
                        <span className="text-base leading-none shrink-0">{icon}</span>
                        <div>
                          <div className="text-[11px] font-medium text-slate-300">{label}</div>
                          <div className="text-[10px] text-slate-500">{desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Model picker */}
                <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-slate-700/50 flex items-center gap-2">
                    <Cpu className="w-3 h-3 text-slate-400" />
                    <span className="text-xs font-medium text-slate-300">生成模型（分類固定用 Gemini）</span>
                  </div>
                  <div className="p-3 grid grid-cols-2 gap-2">
                    {MODEL_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => { setModel(opt.value); setModelManuallySet(true); }}
                        disabled={orchLoading}
                        className={`p-2.5 rounded-lg border text-center transition-all disabled:cursor-not-allowed ${
                          model === opt.value
                            ? 'border-indigo-500/40 bg-indigo-500/[0.07] ring-1 ring-indigo-500/30'
                            : 'border-slate-700/50 hover:bg-white/[0.02]'
                        }`}
                      >
                        <div className={`text-[11px] font-medium ${model === opt.value ? opt.color : 'text-slate-300'}`}>{opt.label}</div>
                        <div className="text-[9px] text-slate-600 mt-0.5">${opt.inputPer1M}/${opt.outputPer1M} /1M</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Detected type badge (after classification) */}
                {orchType && (
                  <div className={`flex items-start gap-3 p-3.5 rounded-xl border ${ORCH_TYPE_COLORS[orchType.type]?.bg ?? 'bg-white/[0.03]'} ${ORCH_TYPE_COLORS[orchType.type]?.border ?? 'border-slate-700/50'}`}>
                    <span className="text-2xl leading-none">{orchType.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${ORCH_TYPE_COLORS[orchType.type]?.text ?? 'text-slate-300'}`}>{orchType.label}</span>
                        <span className="text-[10px] text-slate-500 border border-slate-700/50 rounded px-1.5 py-0.5">
                          {Math.round((orchType.confidence ?? 0) * 100)}% 信心
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{orchType.reason}</p>
                    </div>
                  </div>
                )}

                {/* Cost estimate */}
                {transcript.trim() && !orchLoading && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-slate-700/30 text-[11px]">
                    <span className="text-slate-500">預計費用：</span>
                    <span className={`font-medium ${MODEL_OPTIONS.find(m => m.value === model)?.color ?? 'text-slate-300'}`}>
                      {estimateCost(model, transcript.length)}
                    </span>
                    <span className="text-slate-600 ml-auto">+分類≈$0.000</span>
                  </div>
                )}

                {/* Action button */}
                <div className="flex gap-2">
                  <button
                    onClick={handleOrchestrate}
                    disabled={orchLoading || !transcript.trim()}
                    className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    {orchLoading
                      ? <><Loader2 className="w-4 h-4 animate-spin" />分析緊…</>
                      : <><Wand2 className="w-4 h-4" />智能分析</>}
                  </button>
                  {orchLoading && (
                    <button
                      onClick={handleOrchStop}
                      className="px-4 py-3 rounded-xl border border-red-500/40 text-red-400 text-sm hover:bg-red-500/10 transition-colors"
                    >
                      停止
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ── Progress steps ──────────────────────────────────────────── */}
            {(orchLoading || orchStream || orchError) && (
              <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 px-5 py-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-xs font-medium text-slate-300">處理進度</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500">
                    {orchJobId && <span className="font-mono">#{orchJobId.slice(0, 8)}</span>}
                    {orchTokens > 0 && <span>{orchTokens.toLocaleString()} tokens</span>}
                    {orchMeta && (
                      <>
                        <span>{(orchMeta.duration_ms / 1000).toFixed(1)}s</span>
                        <span className="text-slate-600">·</span>
                        <span>{orchMeta.model.replace('claude-', '').replace('-20251001', '').replace('gemini-', 'Gemini ')}</span>
                        {orchMeta.char_count && (
                          <>
                            <span className="text-slate-600">·</span>
                            <span className="text-green-400">實際≈{estimateCost(model, transcript.length, orchMeta.char_count)}</span>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <StepIndicator steps={orchSteps} />
              </div>
            )}

            {/* ── Error ──────────────────────────────────────────────────── */}
            {orchError && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/[0.07] border border-red-500/20">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${ERROR_CODE_COLORS[orchError.code] ?? 'text-red-400 bg-red-500/10 border-red-500/30'}`}>{orchError.code}</span>
                    <span className="text-sm text-red-300">{orchError.message}</span>
                  </div>
                </div>
              </div>
            )}

            {/* ── Streaming result ────────────────────────────────────────── */}
            {orchStream && (
              <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700/50">
                  <div className="flex items-center gap-2">
                    {orchLoading
                      ? <><CircleDot className="w-3 h-3 text-indigo-400 animate-pulse" /><span className="text-xs font-medium text-indigo-300">生成中…</span></>
                      : <><CheckCircle2 className="w-3.5 h-3.5 text-green-400" /><span className="text-xs font-medium text-slate-300">{orchType ? `${orchType.emoji} ${orchType.label}` : '智能分析'} — 完成</span></>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-500">{orchStream.length.toLocaleString()} chars</span>
                    {!orchLoading && (
                      <button
                        onClick={() => { navigator.clipboard.writeText(orchStream); setOrchCopied(true); setTimeout(() => setOrchCopied(false), 2000); }}
                        className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-white transition-colors"
                      >
                        {orchCopied ? <><CheckCircle2 className="w-3 h-3 text-green-400" />已複製</> : <><Copy className="w-3 h-3" />複製</>}
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-5 max-h-[600px] overflow-y-auto">
                  <pre className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
                    {orchStream}
                    {orchLoading && <span className="inline-block w-0.5 h-4 bg-indigo-400 animate-pulse ml-0.5 align-text-bottom" />}
                  </pre>
                  <div ref={orchStreamRef} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/* VISUALIZER TAB                                                    */}
        {/* ================================================================ */}
        {pageTab === 'visualizer' && (
          <div className="space-y-4">
            {/* Segments JSON paste */}
            <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-700/50 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-300">Whisper Segments JSON（可選）</span>
                <span className="text-[10px] text-slate-500">{segments.length} segments loaded</span>
              </div>
              <textarea
                defaultValue=""
                onChange={e => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    if (Array.isArray(parsed)) setSegments(parsed);
                  } catch { /* wait for valid JSON */ }
                }}
                placeholder={'[{"start":0.0,"end":3.2,"text":"佢哋噉講嘅"},{"start":3.2,"end":6.5,"text":"我冇聽錯喎"}]'}
                rows={3}
                className="w-full bg-transparent px-4 py-3 text-xs text-slate-300 placeholder-slate-600 resize-none focus:outline-none font-mono"
              />
            </div>
            <CassetteVisualizer transcript={transcript} segments={segments} />
          </div>
        )}

        {/* ================================================================ */}
        {/* HISTORY TAB                                                       */}
        {/* ================================================================ */}
        {pageTab === 'history' && (
          <div className="space-y-5">
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <StatBadge label="總任務" value={Number(stats.total_jobs).toLocaleString()}  color="text-white" />
                <StatBadge label="完成"   value={Number(stats.done_jobs).toLocaleString()}    color="text-green-400" />
                <StatBadge label="失敗"   value={Number(stats.error_jobs).toLocaleString()}   color="text-red-400" />
                <StatBadge label="處理中" value={Number(stats.processing_jobs).toLocaleString()} color="text-amber-400" />
                <StatBadge label="總字元" value={Number(stats.total_chars || 0).toLocaleString()} color="text-indigo-400" />
              </div>
            )}
            <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-medium text-slate-300">分析記錄</span>
                </div>
                <button onClick={() => { loadJobs(); loadStats(); }} className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white">
                  <RefreshCw className={`w-3 h-3 ${jobsLoading ? 'animate-spin' : ''}`} />重新整理
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
                  {jobs.map(job => <JobRow key={job.job_id} job={job} onExpand={setExpandedJob} />)}
                </div>
              )}
            </div>

            {expandedJob && (
              <div className="bg-slate-800/60 rounded-xl border border-indigo-500/20 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
                  <div className="flex items-center gap-2">
                    <Hash className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-xs font-mono text-slate-300">{expandedJob.job_id}</span>
                  </div>
                  <button onClick={() => setExpandedJob(null)} className="text-[11px] text-slate-400 hover:text-white">關閉</button>
                </div>
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
                <div className="px-4 pt-3">
                  <p className="text-[10px] text-slate-500 mb-1">逐字稿輸入</p>
                  <pre className="text-xs text-slate-400 bg-white/[0.02] rounded-lg p-3 max-h-32 overflow-y-auto whitespace-pre-wrap font-sans">{expandedJob.transcript}</pre>
                </div>
                {expandedJob.result_text && (
                  <div className="px-4 pt-3 pb-4">
                    <p className="text-[10px] text-slate-500 mb-1">分析結果</p>
                    <pre className="text-xs text-slate-200 bg-white/[0.02] rounded-lg p-3 max-h-64 overflow-y-auto whitespace-pre-wrap font-sans">{expandedJob.result_text}</pre>
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
                    <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full">{errorLogs.length}</span>
                  )}
                </div>
                <button onClick={loadErrors} className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white">
                  <RefreshCw className={`w-3 h-3 ${errorsLoading ? 'animate-spin' : ''}`} />重新整理
                </button>
              </div>
              {errorsLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-slate-500" /></div>
              ) : errorLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <CheckCircle2 className="w-8 h-8 mb-2 opacity-30" /><p className="text-sm">冇錯誤記錄</p>
                </div>
              ) : (
                <div>{errorLogs.map(log => <ErrorRow key={log.id} log={log} />)}</div>
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
                    }`}>{code}</span>
                    <span className="text-sm text-slate-300">{message}</span>
                    <span className="ml-auto text-[10px] text-slate-600">
                      {code <= 'CT-003' ? '4xx 輸入' : code <= 'CT-005' ? '5xx AI' : code <= 'CT-007' ? '5xx DB' : '其他'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/[0.02] border border-slate-700/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-300">Fly Postgres Schema</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { table: 'ct_jobs',       desc: '每次分析任務',  fields: ['job_id (UUID)', 'transcript', 'task', 'model', 'status', 'char_count', 'created_at'] },
                  { table: 'ct_results',    desc: '已完成結果',    fields: ['job_id (FK)', 'result_text', 'model_used', 'duration_ms', 'created_at'] },
                  { table: 'ct_error_logs', desc: '結構化錯誤日誌', fields: ['job_id (nullable FK)', 'error_code', 'error_message', 'context (JSONB)', 'created_at'] },
                ].map(t => (
                  <div key={t.table} className="bg-white/[0.02] rounded-lg p-3">
                    <div className="text-xs font-mono text-indigo-400 mb-1">{t.table}</div>
                    <div className="text-[10px] text-slate-500 mb-2">{t.desc}</div>
                    <ul className="space-y-0.5">
                      {t.fields.map(f => <li key={f} className="text-[10px] text-slate-400 font-mono">• {f}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* ================================================================ */}
        {/* CONVERT TAB                                                       */}
        {/* ================================================================ */}
        {pageTab === 'convert' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* ── Left: upload + options ─────────────────────────────── */}
              <div className="space-y-4">

                {/* File dropzone */}
                <div
                  onDragOver={e => { e.preventDefault(); setConvDragging(true); }}
                  onDragLeave={() => setConvDragging(false)}
                  onDrop={e => {
                    e.preventDefault(); setConvDragging(false);
                    const f = e.dataTransfer.files[0];
                    if (f) setConvFile(f);
                  }}
                  onClick={() => convFileRef.current?.click()}
                  className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
                    convDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-600/50 hover:border-slate-500/70 bg-white/[0.02]'
                  }`}
                >
                  <input ref={convFileRef} type="file" className="hidden"
                    accept="audio/*,video/*,.m4a,.mp4,.mov,.mkv,.avi,.webm,.mp3,.wav,.flac,.ogg"
                    onChange={e => { const f = e.target.files?.[0]; if (f) setConvFile(f); e.target.value = ''; }}
                  />
                  <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                  {convFile ? (
                    <div>
                      <p className="text-sm text-slate-200 truncate max-w-full">{convFile.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{(convFile.size / 1024 / 1024).toFixed(1)} MB</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-slate-300">拖放或點擊上傳音訊 / 影片</p>
                      <p className="text-xs text-slate-500 mt-1">MP4 · MOV · M4A · MP3 · WAV · FLAC · WebM · OGG · 最大 500MB</p>
                    </div>
                  )}
                </div>

                {/* Options */}
                <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4 space-y-4">
                  {/* Output format */}
                  <div>
                    <label className="text-xs text-slate-400 mb-2 block">輸出格式</label>
                    <div className="flex gap-1">
                      {(['mp3', 'wav', 'm4a'] as const).map(f => (
                        <button key={f} onClick={() => setConvFormat(f)}
                          className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                            convFormat === f ? 'bg-indigo-600 text-white' : 'bg-white/[0.04] text-slate-400 hover:text-slate-200'
                          }`}
                        >.{f.toUpperCase()}</button>
                      ))}
                    </div>
                  </div>

                  {/* Trim times */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">開始時間（秒）</label>
                      <input value={convStartTime} onChange={e => setConvStartTime(e.target.value)}
                        placeholder="0" type="number" min="0"
                        className="w-full bg-white/[0.04] border border-slate-700/50 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">結束時間（秒）</label>
                      <input value={convEndTime} onChange={e => setConvEndTime(e.target.value)}
                        placeholder="不限" type="number" min="0"
                        className="w-full bg-white/[0.04] border border-slate-700/50 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50"
                      />
                    </div>
                  </div>

                  {/* Split chunks toggle */}
                  <div className="flex items-center gap-3">
                    <button onClick={() => setConvSplit(v => !v)}
                      className={`flex items-center gap-2 text-xs transition-colors ${convSplit ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-300'}`}
                    >
                      <div className={`w-8 h-4 rounded-full transition-colors relative ${convSplit ? 'bg-indigo-600' : 'bg-slate-600'}`}>
                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${convSplit ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </div>
                      <SplitSquareHorizontal className="w-3.5 h-3.5" />
                      分割成 60 秒片段（用於 STT）
                    </button>
                    {convSplit && (
                      <div className="flex items-center gap-1.5 ml-auto">
                        <span className="text-xs text-slate-500">每段</span>
                        <input value={convChunkLen} onChange={e => setConvChunkLen(e.target.value)}
                          type="number" min="10" max="300"
                          className="w-14 bg-white/[0.04] border border-slate-700/50 rounded-md px-2 py-0.5 text-xs text-slate-200 text-center focus:outline-none focus:border-indigo-500/50"
                        />
                        <span className="text-xs text-slate-500">秒</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={handleConvert}
                    disabled={!convFile || convJobs.some(j => j.id === convActiveJob && (j.status === 'uploading' || j.status === 'converting'))}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium text-white transition-colors"
                  >
                    {convJobs.some(j => j.id === convActiveJob && (j.status === 'uploading' || j.status === 'converting'))
                      ? <><Loader2 className="w-4 h-4 animate-spin" />轉換中…</>
                      : <><Scissors className="w-4 h-4" />開始轉換</>
                    }
                  </button>
                  {convJobs.some(j => j.id === convActiveJob && (j.status === 'uploading' || j.status === 'converting')) && (
                    <button onClick={cancelConvert}
                      className="px-3 py-2.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.07] text-slate-400 hover:text-slate-200 text-xs transition-colors border border-slate-700/50"
                    >取消</button>
                  )}
                </div>
              </div>

              {/* ── Right: conversion history ──────────────────────────── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">轉換記錄</span>
                  {convJobs.length > 0 && (
                    <button onClick={() => setConvJobs([])} className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors">清除記錄</button>
                  )}
                </div>

                {convJobs.length === 0 ? (
                  <div className="bg-white/[0.02] rounded-xl border border-slate-700/30 p-8 text-center">
                    <Scissors className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                    <p className="text-xs text-slate-600">尚無轉換記錄</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {convJobs.map(job => (
                      <div key={job.id} className={`bg-slate-800/60 rounded-xl border p-4 space-y-3 ${
                        job.status === 'error' ? 'border-red-500/30' :
                        job.status === 'done'  ? 'border-green-500/20' :
                        'border-slate-700/50'
                      }`}>
                        {/* Job header */}
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-200 truncate">{job.filename}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {(job.size / 1024 / 1024).toFixed(1)} MB · .{job.format.toUpperCase()}
                              {job.startTime > 0 && ` · 從 ${job.startTime}s`}
                              {job.endTime   > 0 && ` 至 ${job.endTime}s`}
                              {job.splitChunks && ` · 每 ${job.chunkLen}s 分割`}
                            </p>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${
                            job.status === 'done'       ? 'bg-green-500/20 text-green-400' :
                            job.status === 'error'      ? 'bg-red-500/20 text-red-400' :
                            job.status === 'uploading'  ? 'bg-blue-500/20 text-blue-400' :
                            job.status === 'converting' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-slate-700/50 text-slate-500'
                          }`}>
                            {job.status === 'done'       ? '完成' :
                             job.status === 'error'      ? '失敗' :
                             job.status === 'uploading'  ? '上傳中' :
                             job.status === 'converting' ? '轉換中' : '待機'}
                          </span>
                        </div>

                        {/* Progress bar */}
                        {(job.status === 'uploading' || job.status === 'converting') && (
                          <div className="space-y-1">
                            <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-300 ${
                                job.status === 'converting' ? 'bg-amber-500 animate-pulse' : 'bg-indigo-500'
                              }`} style={{ width: `${job.progress ?? 0}%` }} />
                            </div>
                            <p className="text-[10px] text-slate-500">
                              {job.status === 'converting' ? 'ffmpeg 轉換中…' : `${job.progress ?? 0}% 上傳中`}
                            </p>
                          </div>
                        )}

                        {/* Error */}
                        {job.status === 'error' && (
                          <p className="text-xs text-red-400">{job.error}</p>
                        )}

                        {/* Done — single file */}
                        {job.status === 'done' && job.result?.single && (
                          <div className="flex gap-2">
                            <a href={job.result.single.dataUrl} download={job.result.single.filename}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600/20 hover:bg-green-600/30 text-green-400 text-xs transition-colors border border-green-600/20"
                            ><Download className="w-3.5 h-3.5" />下載 .{job.format.toUpperCase()}</a>
                            <button
                              onClick={() => convSendToTranscribe(job.result!.single!.dataUrl, job.result!.single!.filename, job.result!.single!.blob)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 text-xs transition-colors border border-indigo-600/20"
                            ><Mic className="w-3.5 h-3.5" />轉錄</button>
                          </div>
                        )}

                        {/* Done — chunks */}
                        {job.status === 'done' && job.result?.chunks && (
                          <div className="space-y-1.5">
                            <p className="text-[10px] text-slate-500">{job.result.chunks.length} 個片段</p>
                            <div className="grid grid-cols-2 gap-1.5">
                              {job.result.chunks.map(chunk => (
                                <div key={chunk.index} className="bg-white/[0.03] rounded-lg p-2 space-y-1.5">
                                  <p className="text-[10px] text-slate-400">
                                    #{chunk.index} · {Math.round(chunk.start)}s–{Math.round(chunk.end)}s
                                  </p>
                                  <div className="flex gap-1">
                                    <a href={chunk.dataUrl} download={chunk.filename}
                                      className="flex-1 flex items-center justify-center gap-1 py-1 rounded bg-green-600/20 hover:bg-green-600/30 text-green-400 text-[10px] transition-colors"
                                    ><Download className="w-3 h-3" />下載</a>
                                    <button
                                      onClick={() => convSendToTranscribe(chunk.dataUrl, chunk.filename)}
                                      className="flex-1 flex items-center justify-center gap-1 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 text-[10px] transition-colors"
                                    ><Mic className="w-3 h-3" />轉錄</button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
