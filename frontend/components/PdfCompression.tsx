'use client';

import { useState } from 'react';
import {
  FileText, Zap, Shield, Globe, Minimize2, Layers,
  ChevronDown, ChevronUp, Loader2, CheckCircle2,
  AlertCircle, ArrowRight, Clock, Server, Package,
  BarChart3, RefreshCw, Download,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────
// Static definitions
// ─────────────────────────────────────────────────────────

const PROFILES = [
  {
    id: 'balanced',
    name: 'Balanced',
    icon: Layers,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    badge: 'bg-blue-500/20 text-blue-300',
    tool: 'Ghostscript default',
    dpi: '150 DPI',
    description: 'Good quality-to-size ratio. Best all-around choice for most documents.',
    useCase: 'Tender submissions, internal reports, client drafts',
    estimatedReduction: '40–60%',
  },
  {
    id: 'lossless',
    name: 'Lossless',
    icon: Shield,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    badge: 'bg-emerald-500/20 text-emerald-300',
    tool: 'pdfsizeopt + JBIG2',
    dpi: '300 DPI',
    description: 'Maximum quality preservation. No visual degradation. Recompresses losslessly.',
    useCase: 'Legal docs, certificates, signed contracts, official submissions',
    estimatedReduction: '10–30%',
  },
  {
    id: 'web',
    name: 'Web / Email',
    icon: Globe,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
    badge: 'bg-purple-500/20 text-purple-300',
    tool: 'Ghostscript ebook',
    dpi: '120 DPI',
    description: 'Screen-optimised. Fast to send, opens quickly on mobile. Slight visual reduction.',
    useCase: 'Email attachments, WhatsApp/LINE sharing, website downloads, client review drafts',
    estimatedReduction: '60–80%',
  },
  {
    id: 'small',
    name: 'Small (Aggressive)',
    icon: Minimize2,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    badge: 'bg-amber-500/20 text-amber-300',
    tool: 'Ghostscript screen',
    dpi: '96 DPI',
    description: 'Maximum size reduction. Visible quality loss acceptable. For upload portals.',
    useCase: 'Portal uploads with strict size limits (< 5 MB), archiving large scan batches',
    estimatedReduction: '70–90%',
  },
  {
    id: 'auto',
    name: 'Auto',
    icon: Zap,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
    badge: 'bg-cyan-500/20 text-cyan-300',
    tool: 'Strategy-selected',
    dpi: 'Variable',
    description: 'Service inspects file size and selects the best tool automatically.',
    useCase: 'General purpose — good default when unsure which profile to use',
    estimatedReduction: '30–70%',
  },
];

const AGENTS = [
  {
    id: 'ingestion',
    name: 'PDF Ingestion Agent',
    icon: RefreshCw,
    color: 'text-teal-400',
    bg: 'bg-teal-500/10 border-teal-500/20',
    profile: 'balanced',
    priority: 'quality',
    description: 'Normalises PDFs before OCR / RAG ingestion. 150 DPI — sufficient for text extraction.',
    downstream: ['RAG embedding pipeline', 'OCR text extraction'],
    trigger: 'POST /api/pdf-compress',
  },
  {
    id: 'tender',
    name: 'Tender / Proposal Agent',
    icon: FileText,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    profile: 'lossless',
    priority: 'quality',
    description: 'Shrinks tender PDFs to meet upload limits (10–20 MB) without visual degradation. Signatures remain readable.',
    downstream: ['HK+SG Tender Intelligence', 'Client CRM'],
    trigger: 'POST /api/pdf-compress',
  },
  {
    id: 'sharing',
    name: 'Sharing / Distribution Agent',
    icon: Download,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
    profile: 'web',
    priority: 'size',
    description: 'Generates compact PDFs for email / WhatsApp / client review. Targets < 5 MB.',
    downstream: ['Email sender', 'WhatsApp / LINE API'],
    trigger: 'POST /api/pdf-compress',
  },
];

const TOOLS = [
  {
    name: 'pdfsizeopt',
    repo: 'pts/pdfsizeopt',
    description: 'Advanced lossless PDF optimiser. Uses JBIG2 for mono images and PNGOUT for colour. Best compression without quality loss.',
    profiles: ['lossless'],
    install: 'Binary download (see Dockerfile)',
  },
  {
    name: 'pdfc / Ghostscript',
    repo: 'theeko74/pdfc',
    description: 'Python wrapper around Ghostscript. Uses PDFSETTINGS presets (screen, ebook, default, prepress). Reliable and fast.',
    profiles: ['balanced', 'small', 'web'],
    install: 'apt install ghostscript && pip install pdfc',
  },
  {
    name: 'pdfEasyCompress',
    repo: 'davidAlgis/pdfEasyCompress',
    description: 'Image-focused compression using Pillow + pikepdf. Downsamples embedded images. Ideal for brochures and scanned docs.',
    profiles: ['web', 'small (secondary pass)'],
    install: 'pip install pdf-easy-compress pikepdf Pillow',
  },
  {
    name: 'Paperweight',
    repo: 'chekuhakim/paperweight',
    description: 'Self-hosted web app using Ghostscript. Called via HTTP API. Useful when Ghostscript is isolated in its own container.',
    profiles: ['balanced (HTTP fallback)'],
    install: 'docker run chekuhakim/paperweight',
  },
];

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

interface ServiceHealth {
  status: string;
  tools: Record<string, boolean>;
}

interface CompressResult {
  ok: boolean;
  request_id?: string;
  original_size_bytes?: number;
  compressed_size_bytes?: number;
  ratio?: number;
  reduction_pct?: number;
  page_count?: number;
  tool_chain?: string[];
  output_path?: string;
  warnings?: string[];
  logs?: string[];
  elapsed_seconds?: number;
  error?: string;
}

// ─────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────

export default function PdfCompression() {
  const [health, setHealth] = useState<ServiceHealth | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState('');

  const [source, setSource] = useState('');
  const [selectedProfile, setSelectedProfile] = useState('balanced');
  const [priority, setPriority] = useState<'quality' | 'size'>('quality');
  const [tags, setTags] = useState('');
  const [compressLoading, setCompressLoading] = useState(false);
  const [compressResult, setCompressResult] = useState<CompressResult | null>(null);

  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [expandedTool, setExpandedTool] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);

  async function checkHealth() {
    setHealthLoading(true);
    setHealthError('');
    try {
      const res = await fetch('/api/pdf-compress/health');
      const data = await res.json();
      setHealth(data);
    } catch (err) {
      setHealthError('Could not reach service');
      setHealth(null);
    } finally {
      setHealthLoading(false);
    }
  }

  async function runCompress() {
    if (!source.trim()) return;
    setCompressLoading(true);
    setCompressResult(null);
    try {
      const res = await fetch('/api/pdf-compress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: source.trim(),
          profile: selectedProfile,
          priority,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      setCompressResult(data);
    } catch (err) {
      setCompressResult({ ok: false, error: 'Network error — is the PDF Compression Service running?' });
    } finally {
      setCompressLoading(false);
    }
  }

  const selectedProfileDef = PROFILES.find(p => p.id === selectedProfile);

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">PDF Compression Service</h2>
          <p className="text-slate-400 mt-1 text-sm">
            Self-hosted pipeline · 4 open-source tools · 5 compression profiles · 3 agentic workflows
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
            In Progress
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-700/60 text-slate-300 border border-slate-600/40">
            65% complete
          </span>
        </div>
      </div>

      {/* ── Architecture diagram ── */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-400" />
          Architecture
        </h3>
        <pre className="text-xs text-slate-400 font-mono leading-relaxed overflow-x-auto bg-white/[0.02] rounded-lg p-4">{`Agent / Orchestrator (Node.js)
        │
        │  POST /api/pdf-compress  { source, profile, priority, tags }
        ▼
┌──────────────────────────────────────────┐
│          Express Proxy (index.js)         │
│  → forwards to PDF_COMPRESSION_SERVICE    │
└──────────────┬───────────────────────────┘
               │  POST /compress
               ▼
┌──────────────────────────────────────────┐
│          FastAPI Service (Python)         │
│                                          │
│  Fetcher → Strategy → Tool Adapters      │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │ Strategy (select_chain)          │    │
│  │  lossless → pdfsizeopt           │    │
│  │  balanced → gs default           │    │
│  │  web      → gs ebook + images    │    │
│  │  small    → gs screen            │    │
│  │  auto     → size-based select    │    │
│  └──────────────────────────────────┘    │
│                                          │
│  Validator → check integrity, ratio      │
└──────────────────────────────────────────┘
        │
        │  { ok, ratio, tool_chain, output_path, logs }
        ▼
   Agent / Orchestrator`}</pre>
      </div>

      {/* ── Service Health ── */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Server className="w-4 h-4 text-slate-400" />
            Service Health
          </h3>
          <button
            onClick={checkHealth}
            disabled={healthLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700/80 text-slate-300 text-xs font-medium transition-colors disabled:opacity-50"
          >
            {healthLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Check Health
          </button>
        </div>

        {healthError && (
          <div className="flex items-center gap-2 text-amber-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {healthError} — Start with: <code className="bg-white/[0.04] px-1.5 py-0.5 rounded text-xs">cd use-cases/pdf-compression && docker-compose up</code>
          </div>
        )}

        {health && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {health.status === 'ok'
                ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                : <AlertCircle className="w-4 h-4 text-red-400" />}
              <span className={`text-sm font-medium ${health.status === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
                {health.status === 'ok' ? 'Service Online' : 'Service Unavailable'}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(health.tools || {}).map(([tool, available]) => (
                <div key={tool} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs ${
                  available ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300' : 'bg-slate-700/40 border border-slate-600/30 text-slate-500'
                }`}>
                  {available ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                  {tool}
                </div>
              ))}
            </div>
          </div>
        )}

        {!health && !healthError && (
          <p className="text-slate-500 text-sm">Click "Check Health" to verify tool availability.</p>
        )}
      </div>

      {/* ── Compression Profiles ── */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-slate-400" />
          Compression Profiles
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PROFILES.map(profile => {
            const Icon = profile.icon;
            const isSelected = selectedProfile === profile.id;
            return (
              <button
                key={profile.id}
                onClick={() => setSelectedProfile(profile.id)}
                className={`text-left p-4 rounded-xl border transition-all ${
                  isSelected
                    ? `${profile.bg} ring-1 ring-current ${profile.color}`
                    : 'bg-white/[0.02] border-slate-700/50 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${profile.color}`} />
                    <span className="text-sm font-medium text-white">{profile.name}</span>
                  </div>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${profile.badge}`}>
                    {profile.estimatedReduction}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-2">{profile.description}</p>
                <div className="space-y-1">
                  <div className="text-xs text-slate-500">
                    <span className="text-slate-400">Tool:</span> {profile.tool}
                  </div>
                  <div className="text-xs text-slate-500">
                    <span className="text-slate-400">DPI:</span> {profile.dpi}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Test Panel ── */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-slate-400" />
          Test Compression
        </h3>

        <div className="space-y-4">
          {/* Source */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Source PDF</label>
            <input
              type="text"
              value={source}
              onChange={e => setSource(e.target.value)}
              placeholder="/absolute/path/to/file.pdf  or  https://example.com/file.pdf"
              className="w-full bg-white/[0.03] border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50"
            />
          </div>

          {/* Profile + Priority row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Profile</label>
              <select
                value={selectedProfile}
                onChange={e => setSelectedProfile(e.target.value)}
                className="w-full bg-slate-700/60 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
              >
                {PROFILES.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as 'quality' | 'size')}
                className="w-full bg-slate-700/60 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
              >
                <option value="quality">Quality</option>
                <option value="size">Size</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Tags (comma-separated, optional)</label>
            <input
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="tender, clientX, internal"
              className="w-full bg-white/[0.03] border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50"
            />
          </div>

          {/* Profile context */}
          {selectedProfileDef && (
            <div className={`text-xs px-3 py-2 rounded-lg border ${selectedProfileDef.bg}`}>
              <span className={`font-medium ${selectedProfileDef.color}`}>{selectedProfileDef.name}:</span>{' '}
              <span className="text-slate-300">{selectedProfileDef.useCase}</span>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={runCompress}
            disabled={compressLoading || !source.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600/80 hover:bg-blue-600 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {compressLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Compressing...</>
            ) : (
              <><Zap className="w-4 h-4" /> Compress PDF</>
            )}
          </button>
        </div>

        {/* Result */}
        {compressResult && (
          <div className={`mt-4 p-4 rounded-xl border ${
            compressResult.ok
              ? 'bg-emerald-500/[0.06] border-emerald-500/20'
              : 'bg-red-500/[0.06] border-red-500/20'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              {compressResult.ok
                ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                : <AlertCircle className="w-5 h-5 text-red-400" />}
              <span className={`text-sm font-semibold ${compressResult.ok ? 'text-emerald-300' : 'text-red-300'}`}>
                {compressResult.ok ? `Compressed successfully — ${compressResult.reduction_pct?.toFixed(1)}% reduction` : 'Compression failed'}
              </span>
              {compressResult.request_id && (
                <span className="ml-auto text-xs text-slate-500">#{compressResult.request_id}</span>
              )}
            </div>

            {compressResult.ok && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                {[
                  { label: 'Original', value: formatBytes(compressResult.original_size_bytes ?? 0) },
                  { label: 'Compressed', value: formatBytes(compressResult.compressed_size_bytes ?? 0) },
                  { label: 'Ratio', value: `${((compressResult.ratio ?? 1) * 100).toFixed(1)}%` },
                  { label: 'Elapsed', value: `${compressResult.elapsed_seconds?.toFixed(2)}s` },
                ].map(m => (
                  <div key={m.label} className="bg-white/[0.02] rounded-lg p-2.5">
                    <div className="text-xs text-slate-500 mb-0.5">{m.label}</div>
                    <div className="text-sm font-semibold text-white">{m.value}</div>
                  </div>
                ))}
              </div>
            )}

            {compressResult.tool_chain && compressResult.tool_chain.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                <Package className="w-3.5 h-3.5" />
                Tool chain: {compressResult.tool_chain.join(' → ')}
              </div>
            )}

            {compressResult.output_path && (
              <div className="text-xs text-slate-400 mb-2 font-mono bg-white/[0.02] px-2 py-1 rounded truncate">
                {compressResult.output_path}
              </div>
            )}

            {compressResult.warnings && compressResult.warnings.length > 0 && (
              <div className="space-y-1 mb-2">
                {compressResult.warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-xs text-amber-400">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    {w}
                  </div>
                ))}
              </div>
            )}

            {compressResult.error && (
              <div className="text-xs text-red-300 mt-1">{compressResult.error}</div>
            )}

            {compressResult.logs && compressResult.logs.length > 0 && (
              <div>
                <button
                  onClick={() => setShowLogs(!showLogs)}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors mt-2"
                >
                  {showLogs ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {showLogs ? 'Hide' : 'Show'} logs ({compressResult.logs.length} lines)
                </button>
                {showLogs && (
                  <pre className="mt-2 bg-white/[0.02] rounded-lg p-3 text-xs text-slate-400 font-mono overflow-x-auto max-h-48 overflow-y-auto">
                    {compressResult.logs.join('\n')}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Agents ── */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-slate-400" />
          Agentic Workflows
        </h3>
        <div className="space-y-3">
          {AGENTS.map(agent => {
            const Icon = agent.icon;
            const isOpen = expandedAgent === agent.id;
            const profileDef = PROFILES.find(p => p.id === agent.profile);
            return (
              <div key={agent.id} className={`border rounded-xl overflow-hidden ${agent.bg}`}>
                <button
                  className="w-full flex items-center justify-between p-4 text-left"
                  onClick={() => setExpandedAgent(isOpen ? null : agent.id)}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${agent.color}`} />
                    <div>
                      <div className="text-sm font-semibold text-white">{agent.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{agent.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    {profileDef && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${profileDef.badge}`}>
                        {profileDef.name}
                      </span>
                    )}
                    {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </div>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 space-y-2 border-t border-white/[0.05] pt-3">
                    <div className="text-xs text-slate-400">
                      <span className="text-slate-500">Trigger:</span>{' '}
                      <code className="bg-white/[0.04] px-1.5 py-0.5 rounded">{agent.trigger}</code>
                    </div>
                    <div className="text-xs text-slate-400">
                      <span className="text-slate-500">Priority:</span> {agent.priority}
                    </div>
                    <div className="text-xs text-slate-400">
                      <span className="text-slate-500">Downstream:</span>{' '}
                      {agent.downstream.join(', ')}
                    </div>
                    <div className="text-xs text-slate-500 bg-white/[0.02] rounded-lg p-2 font-mono mt-2">
{`POST /api/pdf-compress
{
  "source": "/path/to/file.pdf",
  "profile": "${agent.profile}",
  "priority": "${agent.priority}",
  "tags": ["${agent.id}"]
}`}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Tools ── */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <Package className="w-4 h-4 text-slate-400" />
          Open-Source Tools
        </h3>
        <div className="space-y-2">
          {TOOLS.map(tool => {
            const isOpen = expandedTool === tool.name;
            return (
              <div key={tool.name} className="border border-slate-700/50 rounded-xl overflow-hidden bg-white/[0.02]">
                <button
                  className="w-full flex items-center justify-between p-3.5 text-left"
                  onClick={() => setExpandedTool(isOpen ? null : tool.name)}
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="text-sm font-medium text-white">{tool.name}</div>
                      <div className="text-xs text-slate-500">{tool.repo}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    {tool.profiles.map(p => (
                      <span key={p} className="text-xs px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-400 hidden sm:block">
                        {p}
                      </span>
                    ))}
                    {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </div>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 space-y-2 border-t border-slate-700/50 pt-3">
                    <p className="text-xs text-slate-400">{tool.description}</p>
                    <div className="text-xs text-slate-500">
                      <span className="text-slate-400">Install:</span>{' '}
                      <code className="bg-white/[0.04] px-1.5 py-0.5 rounded">{tool.install}</code>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {tool.profiles.map(p => (
                        <span key={p} className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── API Reference ── */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <ArrowRight className="w-4 h-4 text-slate-400" />
          API Reference
        </h3>
        <div className="space-y-4">
          {[
            {
              method: 'POST',
              path: '/api/pdf-compress',
              desc: 'Compress a PDF. Proxied to the Python microservice.',
              body: `{
  "source":   "/abs/path/or/https://url.pdf",
  "profile":  "balanced | lossless | web | small | auto",
  "priority": "quality | size",
  "tags":     ["tender", "clientX"]
}`,
            },
            {
              method: 'GET',
              path: '/api/pdf-compress/health',
              desc: 'Check Python service health and tool availability.',
              body: null,
            },
            {
              method: 'GET',
              path: '/api/pdf-compress/profiles',
              desc: 'List all compression profiles with descriptions.',
              body: null,
            },
          ].map(ep => (
            <div key={ep.path} className="bg-white/[0.02] rounded-lg p-3.5">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                  ep.method === 'POST' ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {ep.method}
                </span>
                <code className="text-sm text-slate-200 font-mono">{ep.path}</code>
              </div>
              <p className="text-xs text-slate-400 mb-2">{ep.desc}</p>
              {ep.body && (
                <pre className="text-xs text-slate-500 font-mono bg-black/20 rounded p-2 overflow-x-auto">
                  {ep.body}
                </pre>
              )}
            </div>
          ))}
        </div>

        {/* Deploy note */}
        <div className="mt-4 p-3.5 bg-amber-500/[0.06] border border-amber-500/20 rounded-xl">
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-medium text-amber-300 mb-1">Start the Python microservice</div>
              <code className="text-xs text-slate-400 font-mono">
                cd use-cases/pdf-compression && docker-compose up --build
              </code>
              <div className="text-xs text-slate-500 mt-1">
                Service runs on port 8082. Set <code className="bg-white/[0.03] px-1 rounded">PDF_COMPRESSION_SERVICE_URL</code> env var to point elsewhere.
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
