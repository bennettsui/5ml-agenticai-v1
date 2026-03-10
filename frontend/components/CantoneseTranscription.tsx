'use client';

import { useState, useRef } from 'react';
import {
  Mic, FileText, Clipboard, Loader2, CheckCircle2, AlertCircle,
  ChevronDown, Sparkles, Languages, List, AlignLeft, BookOpen, Copy,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Task = 'clean_transcript' | 'meeting_minutes' | 'summary_zh' | 'summary_en' | 'action_items';
type Model = 'haiku' | 'sonnet' | 'deepseek';

interface TaskOption {
  value: Task;
  label: string;
  labelZh: string;
  description: string;
  icon: typeof FileText;
  color: string;
  ring: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Task definitions
// ─────────────────────────────────────────────────────────────────────────────

const TASKS: TaskOption[] = [
  {
    value: 'clean_transcript',
    label: 'Clean Transcript',
    labelZh: '清理逐字稿',
    description: '修正ASR錯誤，保留粵語口語風格',
    icon: AlignLeft,
    color: 'text-blue-400',
    ring: 'border-blue-500/40 bg-blue-500/[0.07] ring-1 ring-blue-500/30',
  },
  {
    value: 'meeting_minutes',
    label: 'Meeting Minutes',
    labelZh: '會議紀要',
    description: '整理成正式會議紀要，列出重點決定',
    icon: BookOpen,
    color: 'text-purple-400',
    ring: 'border-purple-500/40 bg-purple-500/[0.07] ring-1 ring-purple-500/30',
  },
  {
    value: 'summary_zh',
    label: '中文摘要',
    labelZh: '中文摘要',
    description: '書面中文摘要，概括核心內容',
    icon: Languages,
    color: 'text-teal-400',
    ring: 'border-teal-500/40 bg-teal-500/[0.07] ring-1 ring-teal-500/30',
  },
  {
    value: 'summary_en',
    label: 'English Summary',
    labelZh: '英文摘要',
    description: 'Concise professional English summary',
    icon: Sparkles,
    color: 'text-amber-400',
    ring: 'border-amber-500/40 bg-amber-500/[0.07] ring-1 ring-amber-500/30',
  },
  {
    value: 'action_items',
    label: 'Action Items',
    labelZh: '待辦事項',
    description: '提取所有行動項目及負責人',
    icon: List,
    color: 'text-rose-400',
    ring: 'border-rose-500/40 bg-rose-500/[0.07] ring-1 ring-rose-500/30',
  },
];

const MODEL_OPTIONS: { value: Model; label: string; note: string }[] = [
  { value: 'haiku',    label: 'Claude Haiku 4.5',   note: 'Fast · $0.25/1M' },
  { value: 'sonnet',   label: 'Claude Sonnet 4.6',  note: 'Best quality · $3/1M' },
  { value: 'deepseek', label: 'DeepSeek Chat',      note: 'Economical · $0.14/1M' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function CantoneseTranscription() {
  const [transcript, setTranscript] = useState('');
  const [extraInstructions, setExtraInstructions] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task>('clean_transcript');
  const [model, setModel] = useState<Model>('haiku');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const selectedTaskDef = TASKS.find(t => t.value === selectedTask)!;

  async function handleAnalyze() {
    if (!transcript.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch('/api/cantonese-transcription/analyze', {
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
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setResult(data.result);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
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

  const charCount = transcript.length;
  const wordEstimate = transcript.trim() ? Math.ceil(transcript.trim().split(/\s+/).length) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
          <Mic className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">粵語逐字稿分析</h2>
          <p className="text-xs text-slate-400">Cantonese ASR Transcript Analysis · Whisper v3</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Left: Input panel ─────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Transcript input */}
          <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700/50">
              <div className="flex items-center gap-2">
                <Clipboard className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-300">ASR 逐字稿</span>
              </div>
              <span className="text-[10px] text-slate-500">
                {charCount.toLocaleString()} chars · ~{wordEstimate} words
              </span>
            </div>
            <textarea
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
              placeholder="貼上 Whisper ASR 輸出嘅粵語逐字稿…&#10;&#10;例：佢哋噉講嘅，我冇聽錯喎，嗰個 project 要喺下個月 deliver 㗎。"
              rows={12}
              className="w-full bg-transparent px-4 py-3 text-sm text-slate-200 placeholder-slate-600 resize-none focus:outline-none font-mono leading-relaxed"
            />
          </div>

          {/* Extra instructions */}
          <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-700/50">
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-medium text-slate-300">額外指示（可選）</span>
            </div>
            <textarea
              value={extraInstructions}
              onChange={e => setExtraInstructions(e.target.value)}
              placeholder="例：重點關注 marketing 相關討論；或 Focus on technical decisions only"
              rows={2}
              className="w-full bg-transparent px-4 py-3 text-sm text-slate-300 placeholder-slate-600 resize-none focus:outline-none"
            />
          </div>
        </div>

        {/* ── Right: Task + model selectors ────────────────────────────── */}
        <div className="space-y-4">
          {/* Task selection */}
          <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-700/50">
              <span className="text-xs font-medium text-slate-300">分析任務</span>
            </div>
            <div className="p-3 grid grid-cols-1 gap-2">
              {TASKS.map(task => {
                const Icon = task.icon;
                const active = selectedTask === task.value;
                return (
                  <button
                    key={task.value}
                    onClick={() => setSelectedTask(task.value)}
                    className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                      active
                        ? task.ring
                        : 'border-slate-700/50 hover:bg-white/[0.02]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${active ? task.color : 'text-slate-500'}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${active ? 'text-white' : 'text-slate-300'}`}>
                          {task.labelZh}
                        </span>
                        <span className="text-[10px] text-slate-600">{task.label}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{task.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Model selection */}
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
                  <div className={`text-xs font-medium ${model === opt.value ? 'text-white' : 'text-slate-300'}`}>
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
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                分析緊…
              </>
            ) : (
              <>
                <selectedTaskDef.icon className="w-4 h-4" />
                {selectedTaskDef.labelZh}
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Result panel ──────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/[0.07] border border-red-500/20">
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {result && (
        <div ref={resultRef} className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
              <span className="text-xs font-medium text-slate-300">
                {selectedTaskDef.labelZh} — 完成
              </span>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-white transition-colors"
            >
              {copied ? (
                <><CheckCircle2 className="w-3 h-3 text-green-400" />已複製</>
              ) : (
                <><Copy className="w-3 h-3" />複製</>
              )}
            </button>
          </div>
          <div className="p-5">
            <pre className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
              {result}
            </pre>
          </div>
        </div>
      )}

      {/* Info footer */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-white/[0.02] border border-slate-700/30">
        <Mic className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
        <p className="text-[11px] text-slate-500 leading-relaxed">
          此工具處理來自 Whisper v3 Cantonese ASR 模型（khleeloo/whisper-large-v3-cantonese）嘅逐字稿輸出。
          AI 只會清理明顯錯誤，唔會自行添加內容。
        </p>
      </div>
    </div>
  );
}
