'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2, Clock, TrendingUp, Rss, ChevronRight, Star,
  BookmarkPlus, X, Users, RefreshCw, AlertTriangle, Globe,
  Building2, Tag, Calendar, DollarSign, ExternalLink, Loader2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Label = 'Priority' | 'Consider' | 'Partner-only' | 'Ignore';
type Action = 'track' | 'ignore' | 'assign' | null;

interface Tender {
  id: string;
  jurisdiction: 'HK' | 'SG';
  tender_ref: string;
  title: string;
  agency: string;
  closing_date: string;
  days_remaining: number;
  budget_display: string;
  category_tags: string[];
  overall_score: number;
  capability_fit: number;
  business_potential: number;
  label: Label;
  rationale: string;
  source: string;
  owner_type: 'gov' | 'public_org' | 'university';
}

interface DigestStats {
  newToday: number;
  priority: number;
  closingSoon: number;
  sourcesOk: string;
}

// ─── API helpers ──────────────────────────────────────────────────────────────

function daysUntil(dateStr: string | null): number {
  if (!dateStr) return 999;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

function mapLabel(raw: string): Label {
  const map: Record<string, Label> = {
    priority: 'Priority', consider: 'Consider',
    partner_only: 'Partner-only', ignore: 'Ignore', unscored: 'Consider',
  };
  return map[raw] || 'Consider';
}

function mapOwnerType(raw: string): 'gov' | 'public_org' | 'university' {
  if (raw === 'gov') return 'gov';
  if (raw === 'university' || raw === 'polytechnic' || raw === 'research_institute') return 'university';
  return 'public_org';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapApiTender(t: any): Tender {
  const closingDate = t.closing_date ? t.closing_date.slice(0, 10) : null;
  const currency = t.currency || (t.jurisdiction === 'SG' ? 'SGD' : 'HKD');
  const budgetDisplay = t.budget_min
    ? `~${currency}$${Math.round(t.budget_min / 1000)}k`
    : '(not stated)';
  const label = mapLabel(t.label || 'unscored');

  return {
    id:                 String(t.id || t.tender_ref),
    jurisdiction:       (t.jurisdiction as 'HK' | 'SG') || 'HK',
    tender_ref:         t.tender_ref || '',
    title:              t.title || '',
    agency:             t.agency || t.source_name || '',
    closing_date:       closingDate || 'TBC',
    days_remaining:     daysUntil(closingDate),
    budget_display:     budgetDisplay,
    category_tags:      Array.isArray(t.category_tags) ? t.category_tags : [],
    overall_score:      t.overall_score ?? 0,
    capability_fit:     t.capability_fit ?? 0,
    business_potential: t.business_potential ?? 0,
    label,
    rationale:          t.reasoning_summary || t.description_snippet || '',
    source:             t.source_id || '',
    owner_type:         mapOwnerType(t.owner_type || 'gov'),
  };
}

// ─── Helper components ────────────────────────────────────────────────────────

const LABEL_STYLES: Record<Label, string> = {
  Priority: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  Consider: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30',
  'Partner-only': 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  Ignore: 'bg-slate-500/10 text-slate-500 border border-slate-600/30',
};

const SCORE_BAR_COLOR: Record<Label, string> = {
  Priority: 'bg-emerald-400',
  Consider: 'bg-cyan-400',
  'Partner-only': 'bg-amber-400',
  Ignore: 'bg-slate-600',
};

const OWNER_BADGE: Record<string, string> = {
  gov: 'bg-indigo-500/10 text-indigo-400',
  public_org: 'bg-purple-500/10 text-purple-400',
  university: 'bg-blue-500/10 text-blue-400',
};

function ScoreBar({ score, label }: { score: number; label: Label }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${SCORE_BAR_COLOR[label]}`}
          style={{ width: `${score * 100}%` }}
        />
      </div>
      <span className="text-xs font-mono text-slate-400 w-8 text-right">{(score * 100).toFixed(0)}</span>
    </div>
  );
}

function CategoryTag({ tag }: { tag: string }) {
  const label = tag.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-700/40 text-slate-400 border border-slate-600/30">
      {label}
    </span>
  );
}

function TenderCard({ tender, onAction }: { tender: Tender; onAction: (id: string, action: Action) => void }) {
  const isIgnore = tender.label === 'Ignore';

  return (
    <div className={`rounded-xl border p-4 transition-all ${
      isIgnore
        ? 'border-slate-700/30 bg-white/[0.01] opacity-60'
        : 'border-slate-700/50 bg-slate-800/60 hover:border-slate-600/60'
    }`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${LABEL_STYLES[tender.label]}`}>
            {tender.label}
          </span>
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${OWNER_BADGE[tender.owner_type] || 'bg-slate-700/40 text-slate-400'}`}>
            {tender.owner_type === 'university' ? 'University' : tender.owner_type === 'public_org' ? 'Public Org' : 'Gov'}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">{tender.tender_ref}</span>
        </div>
        <a
          href={tender.source ? `#` : '#'}
          onClick={e => e.preventDefault()}
          className="flex-shrink-0 text-slate-500 hover:text-teal-400 transition-colors"
          aria-label="Open source"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Title + Agency */}
      <h3 className="text-sm font-semibold text-white leading-snug mb-1">{tender.title}</h3>
      <div className="flex items-center gap-1.5 mb-3">
        <Building2 className="w-3 h-3 text-slate-500 flex-shrink-0" />
        <span className="text-xs text-slate-400">{tender.agency}</span>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-3">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3 h-3 text-slate-500" />
          <span className={`text-xs ${tender.days_remaining <= 7 ? 'text-amber-400 font-medium' : 'text-slate-400'}`}>
            {tender.closing_date !== 'TBC' ? `${tender.closing_date} · ${tender.days_remaining}d` : 'Closing TBC'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <DollarSign className="w-3 h-3 text-slate-500" />
          <span className="text-xs text-slate-400">{tender.budget_display}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Globe className="w-3 h-3 text-slate-500" />
          <span className="text-xs text-slate-400">{tender.jurisdiction}</span>
        </div>
      </div>

      {/* Category tags */}
      <div className="flex flex-wrap gap-1 mb-3">
        {tender.category_tags.map(t => <CategoryTag key={t} tag={t} />)}
      </div>

      {/* Score bars */}
      {!isIgnore && tender.overall_score > 0 && (
        <div className="space-y-1.5 mb-3 p-2.5 rounded-lg bg-white/[0.02] border border-slate-700/30">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Overall</span>
          </div>
          <ScoreBar score={tender.overall_score} label={tender.label} />
          <div className="grid grid-cols-2 gap-2 mt-1.5">
            <div>
              <span className="text-[9px] text-slate-600 uppercase tracking-wider">Capability Fit</span>
              <ScoreBar score={tender.capability_fit} label={tender.label} />
            </div>
            <div>
              <span className="text-[9px] text-slate-600 uppercase tracking-wider">Biz Potential</span>
              <ScoreBar score={tender.business_potential} label={tender.label} />
            </div>
          </div>
        </div>
      )}

      {/* Rationale */}
      {tender.rationale && (
        <p className="text-xs text-slate-400 leading-relaxed mb-4">{tender.rationale}</p>
      )}

      {/* Actions */}
      {!isIgnore && (
        <div className="flex gap-2">
          <button
            onClick={() => onAction(tender.id, 'track')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-teal-500/15 text-teal-400 border border-teal-500/30 hover:bg-teal-500/25 transition-colors"
          >
            <BookmarkPlus className="w-3 h-3" />
            Track
          </button>
          <button
            onClick={() => onAction(tender.id, 'assign')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25 transition-colors"
          >
            <Users className="w-3 h-3" />
            Assign
          </button>
          <button
            onClick={() => onAction(tender.id, 'ignore')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-400 hover:bg-white/[0.03] transition-colors ml-auto"
          >
            <X className="w-3 h-3" />
            Ignore
          </button>
        </div>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-slate-700/30 bg-white/[0.01] p-8 text-center">
      <Rss className="w-8 h-8 text-slate-600 mx-auto mb-3" />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TenderIntelDigest() {
  const [decisions, setDecisions] = useState<Record<string, Action>>({});
  const [showIgnored, setShowIgnored] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [stats, setStats] = useState<DigestStats>({ newToday: 0, priority: 0, closingSoon: 0, sourcesOk: '—' });
  const [narrative, setNarrative] = useState<string>('');
  const [lastRunAt, setLastRunAt] = useState<string | null>(null);

  const fetchDigest = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tender-intel/digest');
      if (!res.ok) throw new Error('non-200');
      const data = await res.json();
      if (data.tenders) setTenders(data.tenders.map(mapApiTender));
      if (data.stats) setStats(data.stats);
      if (data.narrative) setNarrative(data.narrative);
      if (data.lastRun) setLastRunAt(data.lastRun.run_at);
    } catch (_) {
      /* server unavailable — leave empty */
    } finally {
      setLoading(false);
    }
  }, []);

  // Record a decision via API and update local state
  async function handleAction(id: string, action: Action) {
    setDecisions(prev => ({ ...prev, [id]: action }));
    try {
      await fetch('/api/tender-intel/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenderId: id, action }),
      });
    } catch (_) {}
  }

  useEffect(() => { fetchDigest(); }, [fetchDigest]);

  const allTenders = tenders;
  const hkVisible = allTenders.filter(t => t.jurisdiction === 'HK').filter(t => showIgnored || t.label !== 'Ignore').filter(t => decisions[t.id] !== 'ignore');
  const sgVisible = allTenders.filter(t => t.jurisdiction === 'SG').filter(t => showIgnored || t.label !== 'Ignore').filter(t => decisions[t.id] !== 'ignore');
  const closingSoon = allTenders.filter(t => t.days_remaining <= 7 && t.label !== 'Ignore');
  const trackedCount = Object.values(decisions).filter(a => a === 'track').length;

  const displayStats = [
    { label: 'New Today',   value: String(stats.newToday),   sub: 'from all sources',   icon: TrendingUp,    color: 'teal'    },
    { label: 'Priority',    value: String(stats.priority),   sub: 'Action recommended', icon: Star,          color: 'emerald' },
    { label: 'Closing ≤7d', value: String(stats.closingSoon), sub: 'Urgent attention',  icon: AlertTriangle, color: 'amber'   },
    { label: 'Sources OK',  value: stats.sourcesOk,          sub: 'Live sources',       icon: Rss,           color: 'slate'   },
  ];

  return (
    <div className="space-y-7 max-w-4xl">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Daily Digest</h1>
          <p className="text-sm text-slate-400 flex items-center gap-1.5 flex-wrap">
            {lastRunAt
              ? `Last ingestion: ${new Date(lastRunAt).toLocaleString('en-HK', { timeZone: 'Asia/Hong_Kong' })} HKT`
              : 'Waiting for first ingestion run'}
          </p>
        </div>
        <button
          onClick={fetchDigest}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 border border-slate-700/50 hover:border-slate-600 hover:text-white transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {displayStats.map(s => {
          const Icon = s.icon;
          const colorMap: Record<string, string> = {
            teal: 'border-teal-500/30 text-teal-400',
            emerald: 'border-emerald-500/30 text-emerald-400',
            amber: 'border-amber-500/30 text-amber-400',
            slate: 'border-slate-600/40 text-slate-400',
          };
          return (
            <div key={s.label} className={`p-3 rounded-xl border ${colorMap[s.color]} bg-white/[0.02]`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">{s.label}</span>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="text-2xl font-bold text-white">{loading ? '—' : s.value}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{s.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Narrative summary */}
      {(narrative || loading) && (
        <div className="rounded-xl border border-slate-700/40 bg-white/[0.02] p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-4 rounded-full bg-teal-400" />
            <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">Today&apos;s Overview</span>
          </div>
          {loading
            ? <div className="h-4 bg-slate-700/40 rounded animate-pulse w-3/4" />
            : <p className="text-sm text-slate-300 leading-relaxed">{narrative}</p>
          }
          {trackedCount > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-700/30 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-xs text-teal-400 font-medium">{trackedCount} tender{trackedCount > 1 ? 's' : ''} tracked today</span>
            </div>
          )}
        </div>
      )}

      {/* Closing soon alert */}
      {!loading && closingSoon.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Closing ≤ 7 days</span>
          </div>
          <div className="space-y-2">
            {closingSoon.map(t => (
              <div key={t.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-sm text-white font-medium truncate block">{t.title}</span>
                  <span className="text-xs text-slate-400">{t.agency} · {t.jurisdiction}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-amber-400 font-medium">{t.days_remaining}d</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${LABEL_STYLES[t.label]}`}>
                    {t.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-4 animate-pulse">
              <div className="h-3 bg-slate-700/60 rounded w-1/4 mb-3" />
              <div className="h-4 bg-slate-700/40 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-700/30 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      {!loading && allTenders.length > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Showing {hkVisible.length + sgVisible.length} of {allTenders.length} tenders
          </span>
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              className={`w-8 h-4 rounded-full transition-colors relative ${showIgnored ? 'bg-teal-500/40' : 'bg-slate-700'}`}
              onClick={() => setShowIgnored(v => !v)}
            >
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${showIgnored ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-xs text-slate-400">Show Ignore</span>
          </label>
        </div>
      )}

      {/* Empty state — no tenders yet */}
      {!loading && allTenders.length === 0 && (
        <EmptyState message="No tenders yet. Run the ingestion pipeline to fetch live data." />
      )}

      {/* HK Tenders */}
      {!loading && hkVisible.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-base font-bold text-white">🇭🇰 Hong Kong</span>
            <span className="text-xs text-slate-500">— {hkVisible.length} tenders</span>
          </div>
          <div className="space-y-3">
            {hkVisible.map(t => (
              <TenderCard key={t.id} tender={t} onAction={handleAction} />
            ))}
          </div>
        </section>
      )}

      {/* SG Tenders */}
      {!loading && sgVisible.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-base font-bold text-white">🇸🇬 Singapore</span>
            <span className="text-xs text-slate-500">— {sgVisible.length} tenders</span>
          </div>
          <div className="space-y-3">
            {sgVisible.map(t => (
              <TenderCard key={t.id} tender={t} onAction={handleAction} />
            ))}
          </div>
        </section>
      )}

      {/* Scoring Legend */}
      <div className="rounded-xl border border-slate-700/30 bg-white/[0.02] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Tag className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Scoring Legend</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {([
            ['Priority', '≥ 0.70', 'emerald'],
            ['Consider', '0.50–0.69', 'cyan'],
            ['Partner-only', '0.35–0.49', 'amber'],
            ['Ignore', '< 0.35', 'slate'],
          ] as const).map(([label, range, c]) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full bg-${c}-400`} />
              <span className="text-slate-300 font-medium">{label}</span>
              <span className="text-slate-500">{range}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-600 mt-2">
          overall = (capability_fit × 0.55) + (business_potential × 0.45)
        </p>
      </div>

      {/* View full ingestion log link */}
      <div className="flex items-center gap-2">
        <Rss className="w-3 h-3 text-slate-600" />
        <a href="/use-cases/hk-sg-tender-intel/logs" className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors">
          View ingestion log
          <ChevronRight className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
