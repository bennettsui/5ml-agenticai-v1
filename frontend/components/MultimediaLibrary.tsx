'use client';

import { useState, useCallback, useRef, DragEvent } from 'react';
import {
  Image, Film, Upload, Link2, Search, ChevronRight, Loader2,
  Copy, CheckCheck, Wand2, AlertCircle, RefreshCw, Plus, Eye,
  BookOpen, Sparkles, Play, Grid3X3, Trash2, ExternalLink,
} from 'lucide-react';
import ImageAnnotationCanvas from './ImageAnnotationCanvas';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LibraryItem {
  id: number;
  item_id: string;
  type: 'image' | 'video';
  source_type: string;
  source_url?: string;
  title: string;
  status: string;
  template_id?: string;
  reversed_prompt?: { positive: string; negative: string; styleTokens?: string[]; modelRecommendation?: string };
  style_classification?: { aesthetic: string; medium?: string };
  prompt_template_summary?: { name: string; basePositive: string };
  created_at: string;
}

interface PromptTemplate {
  id: number;
  template_id: string;
  name: string;
  category: string;
  source_type: string;
  usage_count: number;
  template_json: {
    basePositive?: string;
    motionPromptTemplate?: string;
    styleTokens?: string[];
    loraRecommendations?: string[];
    generationSettings?: {
      modelRecommendation?: string;
      pipeline?: string;
      sampler?: string;
      cfgScale?: number;
      steps?: number;
      resolutionProfile?: string;
      frames?: number;
      fps?: number;
    };
    channelVariants?: Record<string, string>;
    exampleFilledPrompts?: Array<{ scenario: string; filled?: string; imagePrompt?: string; motionPrompt?: string }>;
    usageNotes?: string;
    limitations?: string;
  };
  created_at: string;
}

// ─── Model library selector ───────────────────────────────────────────────────

const MODELS = [
  { id: 'sd15',       label: 'SD 1.5',      tag: '512px · fast drafts',          color: 'border-blue-500/40 text-blue-400 bg-blue-500/10' },
  { id: 'sdxl',       label: 'SDXL',        tag: '1024px · best quality',         color: 'border-purple-500/40 text-purple-400 bg-purple-500/10' },
  { id: 'sdxl_turbo', label: 'SDXL Turbo',  tag: '1-4 steps · speed',             color: 'border-indigo-500/40 text-indigo-400 bg-indigo-500/10' },
  { id: 'flux',       label: 'Flux 1.1',    tag: 'state-of-art',                  color: 'border-rose-500/40 text-rose-400 bg-rose-500/10' },
  { id: 'animatediff',label: 'AnimateDiff', tag: 'SD1.5 + motion module',         color: 'border-amber-500/40 text-amber-400 bg-amber-500/10' },
  { id: 'svd',        label: 'SVD-XT',      tag: 'image → video',                 color: 'border-teal-500/40 text-teal-400 bg-teal-500/10' },
  { id: 'wan21',      label: 'Wan 2.1',     tag: 'open-source T2V',               color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' },
  { id: 'cogvideox',  label: 'CogVideoX',   tag: 'T2V / I2V',                     color: 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10' },
];

function ModelSelector({ selected, onChange }: { selected: string; onChange: (id: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {MODELS.map(m => (
        <button
          key={m.id}
          onClick={() => onChange(m.id)}
          className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${
            selected === m.id
              ? m.color + ' ring-1 ring-offset-0 ring-offset-slate-900 shadow-sm'
              : 'border-slate-700/50 text-slate-400 bg-white/[0.02] hover:border-slate-600 hover:text-slate-300'
          }`}
        >
          <span className="font-semibold">{m.label}</span>
          <span className="ml-1.5 opacity-60 font-normal">{m.tag}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1 text-slate-500 hover:text-slate-300 shrink-0">
      {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

// ─── Drop zone ────────────────────────────────────────────────────────────────

function DropZone({ onFile }: { onFile: (f: File) => void }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith('image/')) onFile(file);
  }, [onFile]);

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={`flex flex-col items-center justify-center gap-2.5 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
        dragging
          ? 'border-purple-500/60 bg-purple-500/5'
          : 'border-slate-700/60 bg-white/[0.02] hover:border-slate-600/80 hover:bg-white/[0.03]'
      }`}
    >
      <Upload className="w-7 h-7 text-slate-500" />
      <div className="text-center">
        <p className="text-sm font-medium text-slate-300">Drop image here</p>
        <p className="text-[11px] text-slate-500 mt-0.5">or click to browse · also Ctrl+V to paste</p>
      </div>
      <p className="text-[10px] text-slate-600">PNG · JPG · WebP · GIF · max 10 MB</p>
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
    </div>
  );
}

// ─── Library item card ────────────────────────────────────────────────────────

function ItemCard({ item, onAnnotate, onDelete }: {
  item: LibraryItem;
  onAnnotate: (item: LibraryItem) => void;
  onDelete: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const rp = item.reversed_prompt;

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
          item.type === 'video' ? 'bg-rose-500/10' : 'bg-blue-500/10'
        }`}>
          {item.type === 'video'
            ? <Film className="w-4 h-4 text-rose-400" />
            : <Image className="w-4 h-4 text-blue-400" />}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{item.title}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-[10px] text-slate-500 capitalize">{item.source_type.replace('_', ' ')}</span>
            {item.style_classification?.aesthetic && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                {item.style_classification.aesthetic}
              </span>
            )}
            {item.template_id && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                template
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {item.source_url && (
            <a href={item.source_url} target="_blank" rel="noopener noreferrer"
              className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <button onClick={() => onAnnotate(item)} title="Annotate"
            className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors">
            <Wand2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(item.id)} title="Delete"
            className="p-1.5 text-slate-500 hover:text-red-400 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setExpanded(v => !v)}
            className="p-1.5 text-slate-500 hover:text-white transition-colors">
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-700/40 p-4 space-y-3">
          {rp?.positive && (
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Reversed Prompt</p>
              <div className="rounded-lg bg-white/[0.02] border border-slate-700/40 p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <p className="text-xs text-green-300 flex-1 leading-relaxed">✓ {rp.positive}</p>
                  <CopyBtn text={rp.positive} />
                </div>
                {rp.negative && (
                  <div className="flex items-start gap-2 pt-2 border-t border-slate-700/30">
                    <p className="text-xs text-red-400/80 flex-1 leading-relaxed">✗ {rp.negative}</p>
                    <CopyBtn text={rp.negative} />
                  </div>
                )}
              </div>
              {rp.styleTokens?.length ? (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {rp.styleTokens.map((t, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">{t}</span>
                  ))}
                </div>
              ) : null}
              {rp.modelRecommendation && (
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Recommended model: <span className="text-slate-300">{rp.modelRecommendation}</span>
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Template card ────────────────────────────────────────────────────────────

function TemplateCard({ tpl, onUse }: { tpl: PromptTemplate; onUse: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const tj = tpl.template_json;
  const basePrompt = tj.basePositive || tj.motionPromptTemplate || '';

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
          <BookOpen className="w-4 h-4 text-purple-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{tpl.name}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-[10px] text-slate-500 capitalize">{tpl.category}</span>
            <span className="text-[10px] text-slate-600">·</span>
            <span className="text-[10px] text-slate-500">{tpl.source_type}</span>
            {tpl.usage_count > 0 && (
              <span className="text-[10px] text-emerald-500">Used {tpl.usage_count}×</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={onUse}
            className="text-[10px] px-2.5 py-1 rounded-lg bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600/30 transition-colors">
            Use
          </button>
          <button onClick={() => setExpanded(v => !v)}
            className="p-1.5 text-slate-500 hover:text-white transition-colors">
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-700/40 p-4 space-y-3">
          {basePrompt && (
            <div className="rounded-lg bg-white/[0.02] border border-slate-700/40 p-3">
              <div className="flex items-start gap-2">
                <p className="text-xs text-green-300 flex-1 leading-relaxed">{basePrompt}</p>
                <CopyBtn text={basePrompt} />
              </div>
            </div>
          )}
          {tj.generationSettings && (
            <div className="flex flex-wrap gap-3 text-[11px] text-slate-500">
              {tj.generationSettings.modelRecommendation && <span>Model: <span className="text-slate-300">{tj.generationSettings.modelRecommendation}</span></span>}
              {tj.generationSettings.pipeline && <span>Pipeline: <span className="text-slate-300">{tj.generationSettings.pipeline}</span></span>}
              {tj.generationSettings.steps && <span>Steps: <span className="text-slate-300">{tj.generationSettings.steps}</span></span>}
              {tj.generationSettings.cfgScale && <span>CFG: <span className="text-slate-300">{tj.generationSettings.cfgScale}</span></span>}
              {tj.generationSettings.frames && <span>Frames: <span className="text-slate-300">{tj.generationSettings.frames}</span></span>}
              {tj.generationSettings.fps && <span>FPS: <span className="text-slate-300">{tj.generationSettings.fps}</span></span>}
            </div>
          )}
          {tj.styleTokens?.length ? (
            <div className="flex flex-wrap gap-1.5">
              {tj.styleTokens.slice(0, 10).map((t, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">{t}</span>
              ))}
            </div>
          ) : null}
          {tj.channelVariants && Object.keys(tj.channelVariants).length > 0 && (
            <details className="group">
              <summary className="text-[11px] text-slate-500 cursor-pointer hover:text-slate-300 flex items-center gap-1">
                <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform" /> Channel variants
              </summary>
              <div className="mt-2 space-y-1">
                {Object.entries(tj.channelVariants).map(([ch, note]) => (
                  <div key={ch} className="flex gap-2 text-[11px]">
                    <span className="text-slate-500 w-28 shrink-0">{ch}</span>
                    <span className="text-slate-400">{note}</span>
                  </div>
                ))}
              </div>
            </details>
          )}
          {tj.usageNotes && <p className="text-[11px] text-slate-500 italic">{tj.usageNotes}</p>}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MultimediaLibrary() {
  const [section, setSection] = useState<'analyze' | 'library' | 'templates'>('analyze');
  const [selectedModel, setSelectedModel] = useState('sdxl');

  // Data
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [itemsLoaded, setItemsLoaded] = useState(false);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);

  // Analyze inputs
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [inputTitle, setInputTitle] = useState('');
  const [buildTemplate, setBuildTemplate] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Result of last analysis
  const [lastResult, setLastResult] = useState<{
    analysis: Record<string, unknown>;
    item: LibraryItem;
    template?: PromptTemplate | null;
    ytDlpAvailable?: boolean;
  } | null>(null);

  // Canvas annotation
  const [annotatingItem, setAnnotatingItem] = useState<LibraryItem | null>(null);

  // ── Load data ─────────────────────────────────────────────────────────────
  const loadItems = async () => {
    setLoading(true); setError('');
    try {
      const r = await fetch('/api/library/items');
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setItems(d.items || []);
      setItemsLoaded(true);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Unknown error'); }
    finally { setLoading(false); }
  };

  const loadTemplates = async () => {
    setLoading(true); setError('');
    try {
      const r = await fetch('/api/library/templates');
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setTemplates(d.templates || []);
      setTemplatesLoaded(true);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Unknown error'); }
    finally { setLoading(false); }
  };

  // ── Analyze image URL ─────────────────────────────────────────────────────
  const analyzeImageUrl = async () => {
    if (!imageUrl.trim()) return;
    setLoading(true); setError(''); setLastResult(null);
    try {
      const r = await fetch('/api/library/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'url', value: imageUrl, buildTemplate, title: inputTitle }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setLastResult(d);
      setImageUrl('');
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Unknown error'); }
    finally { setLoading(false); }
  };

  // ── Analyze image file ────────────────────────────────────────────────────
  const analyzeFile = async (file: File) => {
    setLoading(true); setError(''); setLastResult(null);
    try {
      const base64 = await new Promise<string>((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result as string);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      const r = await fetch('/api/library/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'base64', value: base64, buildTemplate, title: inputTitle || file.name }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setLastResult(d);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Unknown error'); }
    finally { setLoading(false); }
  };

  // ── Analyze video URL ─────────────────────────────────────────────────────
  const analyzeVideo = async () => {
    if (!videoUrl.trim()) return;
    setLoading(true); setError(''); setLastResult(null);
    try {
      const r = await fetch('/api/library/analyze-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: videoUrl, buildTemplate, title: inputTitle }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setLastResult(d);
      setVideoUrl('');
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Unknown error'); }
    finally { setLoading(false); }
  };

  // ── Delete item ───────────────────────────────────────────────────────────
  const deleteItem = async (id: number) => {
    try {
      await fetch(`/api/library/items/${id}`, { method: 'DELETE' });
      setItems(prev => prev.filter(i => i.id !== id));
    } catch { /* silent */ }
  };

  // ── Save annotation ───────────────────────────────────────────────────────
  const saveAnnotation = async (data: { strokes: unknown[]; comment: string; canvasDataUrl: string }) => {
    if (!annotatingItem) return;
    try {
      await fetch(`/api/library/items/${annotatingItem.id}/annotation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          annotationJson: { strokes: data.strokes, canvasDataUrl: data.canvasDataUrl },
          feedbackText: data.comment,
        }),
      });
    } catch { /* silent */ }
    setAnnotatingItem(null);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Grid3X3 className="w-5 h-5 text-purple-400" />
            Multimedia Library
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Upload images or paste video URLs to reverse-engineer prompts and build reusable style templates
          </p>
        </div>
        <div className="flex gap-1">
          {(['analyze', 'library', 'templates'] as const).map(s => (
            <button key={s} onClick={() => {
              setSection(s);
              if (s === 'library' && !itemsLoaded) loadItems();
              if (s === 'templates' && !templatesLoaded) loadTemplates();
            }}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                section === s
                  ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}>
              {s === 'analyze' ? '＋ Analyze' : s === 'library' ? 'Library' : 'Templates'}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {/* ── Model selector (always visible) ────────────────────── */}
      <div className="rounded-xl border border-slate-700/40 bg-white/[0.02] p-4 space-y-2.5">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Generation Engine — select the model to target prompt templates for
        </p>
        <ModelSelector selected={selectedModel} onChange={setSelectedModel} />
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* ANALYZE SECTION                                           */}
      {/* ══════════════════════════════════════════════════════════ */}
      {section === 'analyze' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* ── Image ──────────────────────────────────────────── */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-white flex items-center gap-1.5">
                <Image className="w-4 h-4 text-blue-400" /> Image → Prompt Template
              </p>

              <DropZone onFile={analyzeFile} />

              {/* URL input */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-slate-700/50" />
                <span className="text-[10px] text-slate-500">or URL</span>
                <div className="flex-1 h-px bg-slate-700/50" />
              </div>
              <div className="flex gap-2">
                <input
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && analyzeImageUrl()}
                  placeholder="https://… paste image URL"
                  className="flex-1 bg-white/[0.04] border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                />
                <button onClick={analyzeImageUrl} disabled={loading || !imageUrl.trim()}
                  className="px-3 py-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 transition-colors disabled:opacity-40">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* ── Video ──────────────────────────────────────────── */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-white flex items-center gap-1.5">
                <Film className="w-4 h-4 text-rose-400" /> Video URL → Motion Prompt
              </p>
              <div className="rounded-xl border border-slate-700/40 bg-white/[0.02] p-4 space-y-3">
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Paste a YouTube, Vimeo, or direct video URL. The AI analyses metadata + frame keypoints to extract visual style and motion patterns for AnimateDiff / SVD prompts.
                </p>
                <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-2.5">
                  <p className="text-[11px] text-amber-400">
                    Full frame analysis requires <code className="font-mono">yt-dlp</code> installed on the server.
                    Without it, metadata-only analysis is used.
                  </p>
                </div>
                <div className="flex gap-2">
                  <input
                    value={videoUrl}
                    onChange={e => setVideoUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && analyzeVideo()}
                    placeholder="https://youtube.com/watch?v=…"
                    className="flex-1 bg-white/[0.04] border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50"
                  />
                  <button onClick={analyzeVideo} disabled={loading || !videoUrl.trim()}
                    className="px-3 py-2 rounded-lg bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600/30 transition-colors disabled:opacity-40">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Options row */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-52">
              <label className="text-[11px] text-slate-400 mb-1 block">Title (optional)</label>
              <input value={inputTitle} onChange={e => setInputTitle(e.target.value)}
                placeholder="e.g. 'Cinematic Brand Reference'"
                className="w-full bg-white/[0.04] border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer mt-5 shrink-0">
              <input type="checkbox" checked={buildTemplate} onChange={e => setBuildTemplate(e.target.checked)}
                className="accent-purple-500 w-4 h-4" />
              <span className="text-sm text-slate-300">Auto-build prompt template</span>
            </label>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center gap-3 py-8 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
              <span className="text-sm">Analysing with Claude Vision…</span>
            </div>
          )}

          {/* Result */}
          {!loading && lastResult && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-4">
              <p className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                <CheckCheck className="w-4 h-4" /> Analysis complete — saved to library
              </p>

              {/* Reversed prompt */}
              {(lastResult.analysis?.reversedPrompt || lastResult.analysis?.animateDiffPrompt) && (() => {
                const rp = (lastResult.analysis.reversedPrompt || lastResult.analysis.animateDiffPrompt) as {
                  positive: string; negative?: string; styleTokens?: string[];
                };
                return (
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Reversed Prompt</p>
                    <div className="rounded-lg bg-white/[0.02] border border-slate-700/40 p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <p className="text-xs text-green-300 flex-1 leading-relaxed">{rp.positive}</p>
                        <CopyBtn text={rp.positive} />
                      </div>
                      {rp.negative && (
                        <div className="flex items-start gap-2 pt-2 border-t border-slate-700/30">
                          <p className="text-xs text-red-400/80 flex-1 leading-relaxed">{rp.negative}</p>
                          <CopyBtn text={rp.negative} />
                        </div>
                      )}
                    </div>
                    {rp.styleTokens?.length ? (
                      <div className="flex flex-wrap gap-1.5">
                        {rp.styleTokens.map((t, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">{t}</span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })()}

              {/* Video-specific: AnimateDiff */}
              {lastResult.analysis?.animateDiffPrompt && (lastResult.analysis.animateDiffPrompt as { motionKeywords?: string[] }).motionKeywords?.length ? (
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Motion Keywords</p>
                  <div className="flex flex-wrap gap-1.5">
                    {((lastResult.analysis.animateDiffPrompt as { motionKeywords: string[] }).motionKeywords || []).map((kw, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">{kw}</span>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Template created */}
              {lastResult.template && (
                <div className="rounded-lg bg-purple-500/5 border border-purple-500/20 p-3">
                  <p className="text-[11px] font-semibold text-purple-400 mb-0.5">
                    Template created: {(lastResult.template as unknown as PromptTemplate).name}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {(lastResult.template as unknown as PromptTemplate).template_json?.usageNotes}
                  </p>
                </div>
              )}

              {lastResult.ytDlpAvailable === false && (
                <p className="text-[11px] text-amber-400">
                  yt-dlp not detected — metadata-only analysis was used. Install yt-dlp for full frame analysis.
                </p>
              )}

              <div className="flex gap-2">
                <button onClick={() => { setSection('library'); if (!itemsLoaded) loadItems(); }}
                  className="text-xs px-3 py-1.5 rounded-lg bg-slate-700/50 text-slate-300 border border-slate-700/50 hover:bg-slate-700 transition-colors">
                  View in Library →
                </button>
                {lastResult.template && (
                  <button onClick={() => { setSection('templates'); if (!templatesLoaded) loadTemplates(); }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600/30 transition-colors">
                    View Templates →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* LIBRARY SECTION                                           */}
      {/* ══════════════════════════════════════════════════════════ */}
      {section === 'library' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">
              {itemsLoaded ? `${items.length} item${items.length !== 1 ? 's' : ''} in library` : 'Load to see library'}
            </p>
            <button onClick={loadItems} disabled={loading}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
            </div>
          )}

          {!loading && itemsLoaded && items.length === 0 && (
            <div className="rounded-xl border border-slate-700/40 bg-white/[0.02] p-10 text-center">
              <Grid3X3 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">Library is empty</p>
              <p className="text-sm text-slate-500 mt-1">Analyse an image or video to add items</p>
            </div>
          )}

          <div className="space-y-2">
            {items.map(item => (
              <ItemCard key={item.id} item={item} onAnnotate={setAnnotatingItem} onDelete={deleteItem} />
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* TEMPLATES SECTION                                         */}
      {/* ══════════════════════════════════════════════════════════ */}
      {section === 'templates' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">
              {templatesLoaded ? `${templates.length} template${templates.length !== 1 ? 's' : ''}` : 'Load to see templates'}
            </p>
            <button onClick={loadTemplates} disabled={loading}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
            </div>
          )}

          {!loading && templatesLoaded && templates.length === 0 && (
            <div className="rounded-xl border border-slate-700/40 bg-white/[0.02] p-10 text-center">
              <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No templates yet</p>
              <p className="text-sm text-slate-500 mt-1">Analyse media with "Auto-build template" enabled</p>
            </div>
          )}

          <div className="space-y-2">
            {templates.map(tpl => (
              <TemplateCard key={tpl.id} tpl={tpl} onUse={async () => {
                await fetch(`/api/library/templates/${tpl.template_id}/use`, { method: 'POST' }).catch(() => {});
                setTemplates(prev => prev.map(t => t.template_id === tpl.template_id ? { ...t, usage_count: t.usage_count + 1 } : t));
              }} />
            ))}
          </div>
        </div>
      )}

      {/* ── Canvas annotation modal ──────────────────────────────── */}
      {annotatingItem && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-2xl border border-slate-700/50 p-5 w-full max-w-4xl my-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Annotate: {annotatingItem.title}</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Draw on the image to mark feedback areas. The annotation + comment will be sent to the AI operator.
                </p>
              </div>
              <button onClick={() => setAnnotatingItem(null)} className="text-slate-400 hover:text-white text-lg leading-none">✕</button>
            </div>
            <ImageAnnotationCanvas
              imageUrl={annotatingItem.source_url}
              width={760}
              height={500}
              onSave={saveAnnotation}
              onClose={() => setAnnotatingItem(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
