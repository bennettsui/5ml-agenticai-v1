'use client';

import { useState } from 'react';
import {
  CheckCircle2, Clock, TrendingUp, Rss, ChevronRight, Star,
  BookmarkPlus, X, Users, RefreshCw, AlertTriangle, Globe,
  Building2, Tag, Calendar, DollarSign, ExternalLink,
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

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_NARRATIVE = `Today's digest surfaces 9 new tenders across HK (6) and SG (3).
The standout is ISD's Creative and Events Management Services framework (HK$2.5M, 22 days) —
our strongest category match this week. EMSD's digital signage tender and LCSD's
transformation consultancy are also solid Priority fits. In Singapore, the MOE digital
learning platform represents a strategic new agency relationship worth pursuing.
One closing-soon alert: NHB Singapore event management closes in 7 days.`;

const HK_TENDERS: Tender[] = [
  {
    id: 'hk-001',
    jurisdiction: 'HK',
    tender_ref: 'ISD/EA/2026/001',
    title: 'Creative and Events Management Services Framework',
    agency: 'Information Services Department',
    closing_date: '2026-03-15',
    days_remaining: 22,
    budget_display: '~HK$2.5M (open tender)',
    category_tags: ['events_experiential', 'marketing_comms'],
    overall_score: 0.85,
    capability_fit: 0.91,
    business_potential: 0.78,
    label: 'Priority',
    rationale: 'Perfect category fit for our events and marketing capabilities. ISD is a known agency with strong track record for us. Budget is well above threshold at ~HK$2.5M framework value.',
    source: 'hk-gld-etb-xml',
    owner_type: 'gov',
  },
  {
    id: 'hk-002',
    jurisdiction: 'HK',
    tender_ref: 'EMSD(T)07/2026',
    title: 'Provision of Digital Signage and AV Systems for Government Buildings',
    agency: 'Electrical and Mechanical Services Department',
    closing_date: '2026-03-04',
    days_remaining: 11,
    budget_display: '~HK$800k (estimated, open tender)',
    category_tags: ['IT_digital', 'facilities_management'],
    overall_score: 0.81,
    capability_fit: 0.84,
    business_potential: 0.77,
    label: 'Priority',
    rationale: 'Strong IT/digital fit with a familiar agency. Digital signage AV overlaps directly with our events tech capability. Budget estimated above threshold; 11 days is tight but manageable.',
    source: 'hk-emsd-rss-tender-notices',
    owner_type: 'gov',
  },
  {
    id: 'hk-003',
    jurisdiction: 'HK',
    tender_ref: 'LCSD/IT/001/2026',
    title: 'Digital Transformation Consultancy Services',
    agency: 'Leisure and Cultural Services Department',
    closing_date: '2026-03-10',
    days_remaining: 17,
    budget_display: '~HK$1.2M (estimated)',
    category_tags: ['consultancy_advisory', 'IT_digital'],
    overall_score: 0.79,
    capability_fit: 0.82,
    business_potential: 0.75,
    label: 'Priority',
    rationale: 'Direct match for consultancy and digital strategy. LCSD is a strategic beachhead — a new agency relationship that could open a large pipeline. 17 days is sufficient for a strong proposal.',
    source: 'hk-gld-etb-xml',
    owner_type: 'gov',
  },
  {
    id: 'hk-004',
    jurisdiction: 'HK',
    tender_ref: 'HKPC/DM/003/2026',
    title: 'Social Media Marketing and Brand Campaign Management',
    agency: 'Hong Kong Productivity Council',
    closing_date: '2026-03-08',
    days_remaining: 15,
    budget_display: 'HK$480,000',
    category_tags: ['marketing_comms'],
    overall_score: 0.64,
    capability_fit: 0.71,
    business_potential: 0.55,
    label: 'Consider',
    rationale: 'Solid category fit for social media and brand campaign work. Budget is below our preferred threshold at HK$480k. HKPC is an unfamiliar agency — good relationship-building opportunity but lower immediate value.',
    source: 'hk-gld-etb-xml',
    owner_type: 'public_org',
  },
  {
    id: 'hk-005',
    jurisdiction: 'HK',
    tender_ref: 'PolyU/MKT/2026/02',
    title: 'Student Recruitment Campaign — Digital and Experiential Marketing',
    agency: 'PolyU — Communications and Public Affairs Office',
    closing_date: '2026-03-18',
    days_remaining: 25,
    budget_display: '~HK$600k (estimated)',
    category_tags: ['marketing_comms', 'events_experiential'],
    overall_score: 0.61,
    capability_fit: 0.68,
    business_potential: 0.52,
    label: 'Consider',
    rationale: 'Good marketing and events fit. University procurement typically smaller in scale than gov. Strategic value: establishes education sector credentials. 25 days allows for a well-prepared bid.',
    source: 'hk-polyu-procurement',
    owner_type: 'university',
  },
  {
    id: 'hk-006',
    jurisdiction: 'HK',
    tender_ref: 'ArchSD/T/002/2026',
    title: 'Renovation and Fitting-out Works at Government Office',
    agency: 'Architectural Services Department',
    closing_date: '2026-03-20',
    days_remaining: 27,
    budget_display: '~HK$3.2M (estimated)',
    category_tags: ['construction_works'],
    overall_score: 0.19,
    capability_fit: 0.12,
    business_potential: 0.28,
    label: 'Ignore',
    rationale: 'Construction and fitting-out work is outside our core capability. Despite the high budget, delivery scale far exceeds our team capacity. Recommend auto-ignore for construction_works category.',
    source: 'hk-archsd-rss-tender-notices',
    owner_type: 'gov',
  },
];

const SG_TENDERS: Tender[] = [
  {
    id: 'sg-001',
    jurisdiction: 'SG',
    tender_ref: 'GeBIZ-MOE-2026-0231',
    title: 'Digital Learning Platform Development and Implementation',
    agency: 'Ministry of Education',
    closing_date: '2026-03-12',
    days_remaining: 19,
    budget_display: 'SGD$450,000',
    category_tags: ['IT_digital', 'consultancy_advisory'],
    overall_score: 0.77,
    capability_fit: 0.79,
    business_potential: 0.74,
    label: 'Priority',
    rationale: 'Strong IT and digital consultancy match. MOE is a strategic beachhead in Singapore — a new government agency relationship. Budget above SG threshold at SGD$450k. 19 days is workable.',
    source: 'sg-gebiz-public-listing',
    owner_type: 'gov',
  },
  {
    id: 'sg-002',
    jurisdiction: 'SG',
    tender_ref: 'GeBIZ-ESG-2026-0087',
    title: 'Brand Campaign for Singapore Business Events and MICE Sector',
    agency: 'Enterprise Singapore',
    closing_date: '2026-03-07',
    days_remaining: 14,
    budget_display: 'SGD$280,000',
    category_tags: ['events_experiential', 'marketing_comms'],
    overall_score: 0.61,
    capability_fit: 0.67,
    business_potential: 0.54,
    label: 'Consider',
    rationale: 'Events and brand campaign category match. Budget is moderate at SGD$280k. EnterpriseSG is a good brand association. 14 days is tight — assess resource availability before committing.',
    source: 'sg-gebiz-public-listing',
    owner_type: 'gov',
  },
  {
    id: 'sg-003',
    jurisdiction: 'SG',
    tender_ref: 'GeBIZ-NHB-2026-0014',
    title: 'Event Management Services for National Heritage Exhibitions 2026',
    agency: 'National Heritage Board',
    closing_date: '2026-02-28',
    days_remaining: 7,
    budget_display: 'SGD$150,000',
    category_tags: ['events_experiential'],
    overall_score: 0.56,
    capability_fit: 0.63,
    business_potential: 0.47,
    label: 'Consider',
    rationale: 'Good events category fit. Budget is below SG threshold at SGD$150k. Closing in 7 days — only pursue if team capacity is immediately available. NHB could be a good cultural sector reference.',
    source: 'sg-gebiz-public-listing',
    owner_type: 'gov',
  },
];

const STATS = [
  { label: 'New Today', value: '9', sub: 'HK: 6 · SG: 3', icon: TrendingUp, color: 'teal' },
  { label: 'Priority', value: '4', sub: 'Action recommended', icon: Star, color: 'emerald' },
  { label: 'Closing ≤7d', value: '1', sub: 'SG NHB tender', icon: AlertTriangle, color: 'amber' },
  { label: 'Sources OK', value: '6/7', sub: '1 pending validation', icon: Rss, color: 'slate' },
];

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
          href="#"
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
            {tender.closing_date} · {tender.days_remaining}d
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
      {!isIgnore && (
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
      <p className="text-xs text-slate-400 leading-relaxed mb-4">{tender.rationale}</p>

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

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TenderIntelDigest() {
  const [decisions, setDecisions] = useState<Record<string, Action>>({});
  const [showIgnored, setShowIgnored] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  function handleAction(id: string, action: Action) {
    setDecisions(prev => ({ ...prev, [id]: action }));
  }

  function handleRefresh() {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }

  const allTenders = [...HK_TENDERS, ...SG_TENDERS];
  const hkVisible = HK_TENDERS.filter(t => showIgnored || t.label !== 'Ignore').filter(t => decisions[t.id] !== 'ignore');
  const sgVisible = SG_TENDERS.filter(t => showIgnored || t.label !== 'Ignore').filter(t => decisions[t.id] !== 'ignore');
  const closingSoon = allTenders.filter(t => t.days_remaining <= 7 && t.label !== 'Ignore');
  const trackedCount = Object.values(decisions).filter(a => a === 'track').length;

  return (
    <div className="space-y-7 max-w-4xl">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Daily Digest</h1>
          <p className="text-sm text-slate-400">Friday 21 February 2026 · 08:00 HKT</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 border border-slate-700/50 hover:border-slate-600 hover:text-white transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STATS.map(s => {
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
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{s.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Narrative summary */}
      <div className="rounded-xl border border-slate-700/40 bg-white/[0.02] p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1 h-4 rounded-full bg-teal-400" />
          <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">Today's Overview</span>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{MOCK_NARRATIVE}</p>
        {trackedCount > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-700/30 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-xs text-teal-400 font-medium">{trackedCount} tender{trackedCount > 1 ? 's' : ''} tracked today</span>
          </div>
        )}
      </div>

      {/* Closing soon alert */}
      {closingSoon.length > 0 && (
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

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">
            Showing {hkVisible.length + sgVisible.length} of {HK_TENDERS.length + SG_TENDERS.length} tenders
          </span>
        </div>
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

      {/* HK Tenders */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-base font-bold text-white">🇭🇰 Hong Kong</span>
          <span className="text-xs text-slate-500">— {hkVisible.length} tenders</span>
        </div>
        <div className="space-y-3">
          {hkVisible.map(t => (
            <TenderCard key={t.id} tender={t} onAction={handleAction} />
          ))}
          {hkVisible.length === 0 && (
            <p className="text-sm text-slate-500 py-4 text-center">No HK tenders to show.</p>
          )}
        </div>
      </section>

      {/* SG Tenders */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-base font-bold text-white">🇸🇬 Singapore</span>
          <span className="text-xs text-slate-500">— {sgVisible.length} tenders</span>
        </div>
        <div className="space-y-3">
          {sgVisible.map(t => (
            <TenderCard key={t.id} tender={t} onAction={handleAction} />
          ))}
          {sgVisible.length === 0 && (
            <p className="text-sm text-slate-500 py-4 text-center">No SG tenders to show.</p>
          )}
        </div>
      </section>

      {/* Source health footer */}
      <div className="rounded-xl border border-slate-700/30 bg-white/[0.02] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Rss className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ingestion Summary</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {[
            { source: 'GLD ETB XML', items: 23, status: 'ok' },
            { source: 'EMSD RSS', items: 2, status: 'ok' },
            { source: 'GeBIZ HTML', items: 8, status: 'ok' },
            { source: 'ArchSD RSS', items: 0, status: 'pending' },
          ].map(s => (
            <div key={s.source} className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.status === 'ok' ? 'bg-teal-400' : 'bg-amber-400'}`} />
              <div>
                <div className="text-slate-300 font-medium">{s.source}</div>
                <div className="text-slate-500">{s.status === 'ok' ? `${s.items} new items` : 'Pending first run'}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-slate-700/30">
          <button className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors">
            View full ingestion log
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Tag legend */}
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
    </div>
  );
}
