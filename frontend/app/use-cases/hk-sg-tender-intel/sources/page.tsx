'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  CheckCircle2, AlertTriangle, Clock, RefreshCw, ChevronDown, Plus,
  ExternalLink, Search, Loader2, Cpu, Zap, Globe, CheckCheck, XCircle,
} from 'lucide-react';

type SourceStatus = 'active' | 'broken' | 'pending_validation' | 'deferred';
type SourceType = 'rss_xml' | 'api_xml' | 'csv_open_data' | 'html_list' | 'html_hub';

interface Source {
  source_id: string;
  name: string;
  organisation: string;
  jurisdiction: 'HK' | 'SG' | 'Global';
  source_type: SourceType;
  priority: 1 | 2 | 3;
  status: SourceStatus;
  last_checked: string | null;
  new_items_today: number | null;
  feed_url: string | null;
  category_tags_default: string[];
  notes: string;
  reliability_score: number;
}

// SSE event types emitted by runSourceDiscovery
type DiscoverEvent =
  | { type: 'init';      total: number; aiEnabled: boolean }
  | { type: 'hub_start'; hub: string; url: string; index: number; total: number }
  | { type: 'hub_ai';    hub: string; status: string }
  | { type: 'hub_done';  hub: string; status: 'found' | 'known' | 'none' | 'error'; found: number; scanned?: number; aiUsed?: boolean; aiModel?: string | null; error?: string }
  | { type: 'done';      newSources: number; hubsScanned: number; errors: number; durationMs: number }
  | { type: 'error';     error: string };

const STATUS_CONFIG: Record<SourceStatus, { label: string; icon: typeof CheckCircle2; color: string; dot: string }> = {
  active:             { label: 'Active',   icon: CheckCircle2,  color: 'text-teal-400',   dot: 'bg-teal-400' },
  broken:             { label: 'Broken',   icon: AlertTriangle, color: 'text-red-400',    dot: 'bg-red-400' },
  pending_validation: { label: 'Pending',  icon: Clock,         color: 'text-amber-400',  dot: 'bg-amber-400' },
  deferred:           { label: 'Deferred', icon: Clock,         color: 'text-slate-500',  dot: 'bg-slate-600' },
};

const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  rss_xml:      'RSS/XML',
  api_xml:      'XML API',
  csv_open_data:'CSV Open Data',
  html_list:    'HTML Scrape',
  html_hub:     'Discovery Hub',
};

const PRIORITY_COLORS = { 1: 'text-emerald-400', 2: 'text-blue-400', 3: 'text-slate-500' };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapApiSource(s: any): Source {
  return {
    source_id:             s.source_id,
    name:                  s.name || s.source_id,
    organisation:          s.organisation || '',
    jurisdiction:          (s.jurisdiction as Source['jurisdiction']) || 'HK',
    source_type:           (s.source_type as SourceType) || 'rss_xml',
    priority:              (s.priority as 1 | 2 | 3) || 2,
    status:                (s.status as SourceStatus) || 'pending_validation',
    last_checked:          s.last_checked_at
      ? new Date(s.last_checked_at).toLocaleString('en-HK', { timeZone: 'Asia/Hong_Kong' })
      : null,
    new_items_today:       null,
    feed_url:              s.feed_url || null,
    category_tags_default: Array.isArray(s.category_tags_default) ? s.category_tags_default : [],
    notes:                 s.notes || '',
    reliability_score:     s.last_status === 'ok' ? 0.95 : s.last_status === 'error' ? 0.3 : 0.7,
  };
}

// ─── Discovery Log Line ────────────────────────────────────────────────────────

function LogLine({ ev }: { ev: DiscoverEvent }) {
  if (ev.type === 'init') {
    return (
      <div className="flex items-center gap-2 text-slate-500">
        <Globe className="w-3 h-3 flex-shrink-0 text-blue-400" />
        <span>Scanning <span className="text-white">{ev.total}</span> hub pages…
          {ev.aiEnabled
            ? <span className="ml-2 text-[10px] text-blue-400 font-medium">AI-assisted (DeepSeek)</span>
            : <span className="ml-2 text-[10px] text-slate-600">no AI key — regex only</span>
          }
        </span>
      </div>
    );
  }
  if (ev.type === 'hub_start') {
    return (
      <div className="flex items-center gap-2 text-slate-400">
        <Loader2 className="w-3 h-3 flex-shrink-0 animate-spin text-slate-500" />
        <span className="text-slate-500">[{ev.index}/{ev.total}]</span>
        <span className="truncate">{ev.hub}</span>
      </div>
    );
  }
  if (ev.type === 'hub_ai') {
    return (
      <div className="flex items-center gap-2 text-blue-400 pl-5">
        <Cpu className="w-3 h-3 flex-shrink-0 animate-pulse" />
        <span className="text-[11px]">Querying DeepSeek — no RSS links found by regex</span>
      </div>
    );
  }
  if (ev.type === 'hub_done') {
    const isFound = ev.status === 'found';
    const isKnown = ev.status === 'known';
    const isError = ev.status === 'error';
    return (
      <div className={`flex items-center gap-2 pl-1 ${isError ? 'text-red-400' : isFound ? 'text-teal-400' : 'text-slate-500'}`}>
        {isError
          ? <XCircle className="w-3 h-3 flex-shrink-0" />
          : isFound
          ? <CheckCheck className="w-3 h-3 flex-shrink-0" />
          : <span className="w-3 h-3 flex-shrink-0 text-center text-[10px]">·</span>
        }
        <span className="truncate font-medium">{ev.hub}</span>
        {isError && <span className="text-[11px] text-red-400/70">— {ev.error}</span>}
        {isFound && (
          <span className="ml-auto flex-shrink-0 text-[11px]">
            +{ev.found} new
            {ev.aiUsed && (
              <span className="ml-1.5 text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded px-1 py-0.5">
                AI
              </span>
            )}
          </span>
        )}
        {isKnown && <span className="ml-auto text-[11px] text-slate-600">{ev.scanned} already known</span>}
        {!isFound && !isKnown && !isError && <span className="ml-auto text-[11px] text-slate-600">no links found</span>}
      </div>
    );
  }
  if (ev.type === 'done') {
    return (
      <div className="flex items-center gap-2 pt-1 mt-1 border-t border-slate-700/40 text-slate-300 font-medium">
        <Zap className="w-3 h-3 flex-shrink-0 text-amber-400" />
        <span>
          Done — <span className={ev.newSources > 0 ? 'text-teal-400' : 'text-slate-400'}>{ev.newSources} new source{ev.newSources !== 1 ? 's' : ''}</span>
          {' '}from {ev.hubsScanned} hubs
          {ev.errors > 0 && <span className="text-amber-400 ml-2">({ev.errors} errors)</span>}
          <span className="text-slate-600 font-normal ml-2">in {(ev.durationMs / 1000).toFixed(1)}s</span>
        </span>
      </div>
    );
  }
  if (ev.type === 'error') {
    return (
      <div className="flex items-center gap-2 text-red-400">
        <XCircle className="w-3 h-3 flex-shrink-0" />
        <span>Error: {ev.error}</span>
      </div>
    );
  }
  return null;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SourceRegistryPage() {
  const [expanded, setExpanded]       = useState<string | null>(null);
  const [filterJur, setFilterJur]     = useState<'All' | 'HK' | 'SG' | 'Global'>('All');
  const [filterStatus, setFilterStatus] = useState<'All' | SourceStatus>('All');
  const [sources, setSources]         = useState<Source[]>([]);
  const [loading, setLoading]         = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [discoverLog, setDiscoverLog] = useState<DiscoverEvent[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  const fetchSources = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterJur !== 'All') params.set('jurisdiction', filterJur);
      if (filterStatus !== 'All') params.set('status', filterStatus);
      const res = await fetch(`/api/tender-intel/sources?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      setSources(Array.isArray(data) ? data.map(mapApiSource) : []);
    } catch (_) {
      setSources([]);
    } finally {
      setLoading(false);
    }
  }, [filterJur, filterStatus]);

  useEffect(() => { fetchSources(); }, [fetchSources]);

  // Auto-scroll log to bottom
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [discoverLog]);

  async function handleDiscover() {
    setDiscovering(true);
    setDiscoverLog([]);

    try {
      const response = await fetch('/api/tender-intel/discover', { method: 'POST' });
      if (!response.body) throw new Error('No streaming response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let gotDone = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE messages are separated by \n\n
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data: ')) continue;
          try {
            const ev: DiscoverEvent = JSON.parse(line.slice(6));
            setDiscoverLog(prev => [...prev, ev]);
            if (ev.type === 'done') {
              gotDone = true;
              if (ev.newSources > 0) setTimeout(() => fetchSources(), 600);
            }
          } catch (_) { /* malformed SSE chunk */ }
        }
      }

      if (!gotDone) setDiscovering(false);
    } catch (err) {
      setDiscoverLog(prev => [...prev, { type: 'error', error: String(err) }]);
    } finally {
      setDiscovering(false);
    }
  }

  const filtered = sources;
  const activeCount  = sources.filter(s => s.status === 'active').length;
  const pendingCount = sources.filter(s => s.status === 'pending_validation').length;
  const totalNewToday = sources.reduce((sum, s) => sum + (s.new_items_today ?? 0), 0);
  const doneEvent = discoverLog.find((e): e is Extract<DiscoverEvent, {type:'done'}> => e.type === 'done');

  return (
    <div className="space-y-6 max-w-4xl">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Source Registry</h1>
          <p className="text-sm text-slate-400">
            {loading ? 'Loading…' : `${activeCount} active · ${pendingCount} pending · ${totalNewToday} new items today`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={fetchSources}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 border border-slate-700/50 hover:border-slate-600 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button
            onClick={handleDiscover}
            disabled={discovering}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25 transition-colors disabled:opacity-50"
          >
            {discovering
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Search className="w-3.5 h-3.5" />
            }
            {discovering ? 'Scanning…' : 'Discover sources'}
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-teal-500/15 text-teal-400 border border-teal-500/30 hover:bg-teal-500/25 transition-colors">
            <Plus className="w-3.5 h-3.5" />
            Add source
          </button>
        </div>
      </div>

      {/* ── Discovery Log Box ── */}
      {discoverLog.length > 0 && (
        <div className="rounded-xl border border-slate-700/40 bg-black/40 overflow-hidden">
          {/* Header bar */}
          <div className="px-3 py-2 border-b border-slate-700/30 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Source Discovery</span>
              {discovering && (
                <span className="flex items-center gap-1 text-[10px] text-blue-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  Running
                </span>
              )}
              {doneEvent && (
                <span className="flex items-center gap-1 text-[10px] text-teal-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                  Complete
                </span>
              )}
            </div>
            {doneEvent && (
              <span className="text-[10px] text-slate-600">
                DeepSeek Chat · {(doneEvent.durationMs / 1000).toFixed(1)}s
              </span>
            )}
          </div>
          {/* Log lines */}
          <div className="p-3 font-mono text-[11px] leading-relaxed space-y-1.5 max-h-72 overflow-y-auto">
            {discoverLog.map((ev, i) => (
              <LogLine key={i} ev={ev} />
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="flex gap-2 flex-wrap">
        {(['All', 'HK', 'SG', 'Global'] as const).map(j => (
          <button
            key={j}
            onClick={() => setFilterJur(j)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterJur === j
                ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                : 'text-slate-400 border border-slate-700/50 hover:bg-white/[0.03] hover:text-white'
            }`}
          >
            {j}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          {(['All', 'active', 'pending_validation', 'deferred'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === s
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 border border-slate-700/50 hover:bg-white/[0.03]'
              }`}
            >
              {s === 'pending_validation' ? 'Pending' : s === 'All' ? 'All statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Source cards ── */}
      <div className="space-y-2">
        {filtered.map(source => {
          const sc = STATUS_CONFIG[source.status];
          const StatusIcon = sc.icon;
          const isOpen = expanded === source.source_id;
          return (
            <div
              key={source.source_id}
              className="rounded-xl border border-slate-700/50 bg-slate-800/60 overflow-hidden"
            >
              <button
                className="w-full flex items-center gap-4 px-4 py-3 hover:bg-white/[0.02] transition-colors text-left"
                onClick={() => setExpanded(isOpen ? null : source.source_id)}
              >
                {/* Status dot */}
                <div className="flex-shrink-0">
                  <div className={`w-2 h-2 rounded-full ${sc.dot} ${source.status === 'active' ? 'shadow-[0_0_6px_1px] shadow-teal-400/40' : ''}`} />
                </div>

                {/* Priority */}
                <span className={`text-[10px] font-bold ${PRIORITY_COLORS[source.priority]} w-4 text-center flex-shrink-0`}>
                  P{source.priority}
                </span>

                {/* Name + org */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">{source.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400 flex-shrink-0 hidden sm:inline">
                      {SOURCE_TYPE_LABELS[source.source_type]}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400 flex-shrink-0 hidden md:inline">
                      {source.jurisdiction}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 truncate mt-0.5">{source.organisation}</div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 flex-shrink-0">
                  {source.new_items_today !== null && (
                    <div className="text-right hidden sm:block">
                      <div className="text-xs font-medium text-teal-400">{source.new_items_today} new</div>
                      <div className="text-[10px] text-slate-500">today</div>
                    </div>
                  )}
                  <div className="text-right hidden md:block">
                    <div className={`text-xs font-medium ${sc.color}`}>{sc.label}</div>
                    <div className="text-[10px] text-slate-500">{source.last_checked ?? '—'}</div>
                  </div>
                  {source.reliability_score > 0 && (
                    <div className="hidden lg:flex items-center gap-1.5 w-20">
                      <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-400 rounded-full"
                          style={{ width: `${source.reliability_score * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 w-6">
                        {(source.reliability_score * 100).toFixed(0)}
                      </span>
                    </div>
                  )}
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Expanded detail */}
              {isOpen && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-700/30 bg-white/[0.01]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Feed / Hub URL</p>
                      {source.feed_url ? (
                        <a
                          href={source.feed_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-teal-400 hover:underline flex items-center gap-1 break-all"
                        >
                          {source.feed_url}
                          <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-500 italic">Not yet configured</span>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Category defaults</p>
                      <div className="flex flex-wrap gap-1">
                        {source.category_tags_default.length > 0
                          ? source.category_tags_default.map(t => (
                              <span
                                key={t}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/40 text-slate-400 border border-slate-600/30"
                              >
                                {t.replace(/_/g, ' ')}
                              </span>
                            ))
                          : <span className="text-xs text-slate-600 italic">None (discovery hub)</span>
                        }
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Notes</p>
                    <p className="text-xs text-slate-400">{source.notes}</p>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {source.status === 'pending_validation' && (
                      <button className="text-xs px-3 py-1.5 rounded-lg bg-teal-500/15 text-teal-400 border border-teal-500/30 hover:bg-teal-500/25 transition-colors">
                        Validate now
                      </button>
                    )}
                    {source.status === 'active' && (
                      <button className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.04] text-slate-400 border border-slate-700/50 hover:bg-white/[0.06] transition-colors">
                        Test fetch
                      </button>
                    )}
                    {source.status === 'deferred' && (
                      <button className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.04] text-slate-400 border border-slate-700/50 hover:bg-white/[0.06] transition-colors">
                        Configure access
                      </button>
                    )}
                    <button className="text-xs px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-400 transition-colors">
                      Edit
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {!loading && filtered.length === 0 && (
          <div className="rounded-xl border border-slate-700/30 bg-white/[0.01] p-8 text-center">
            <p className="text-sm text-slate-500">
              No sources found. Seed the source registry first:{' '}
              <code className="text-teal-400 text-xs">
                node use-cases/hk-sg-tender-intelligence/scripts/seed-sources.js
              </code>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
