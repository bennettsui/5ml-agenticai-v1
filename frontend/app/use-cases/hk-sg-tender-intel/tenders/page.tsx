'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronDown, ExternalLink, Calendar, DollarSign, Building2, Globe, Loader2, ThumbsUp, ThumbsDown, RotateCcw } from 'lucide-react';

type Label = 'Priority' | 'Consider' | 'Partner-only' | 'Ignore' | 'All';
type Jurisdiction = 'All' | 'HK' | 'SG';
type Status = 'All' | 'open' | 'closed';
type DecisionChoice = 'track' | 'ignore';

interface Tender {
  id: string;
  tender_ref: string;
  jurisdiction: 'HK' | 'SG';
  title: string;
  agency: string;
  category_tags: string[];
  publish_date: string;
  closing_date: string;
  days_remaining: number | null;
  budget_display: string;
  owner_type: string;
  status: 'open' | 'closed';
  label: 'Priority' | 'Consider' | 'Partner-only' | 'Ignore';
  overall_score: number;
  source: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapApiTender(t: any): Tender {
  const closingDate = t.closing_date ? t.closing_date.slice(0, 10) : null;
  const daysLeft = closingDate ? Math.ceil((new Date(closingDate).getTime() - Date.now()) / 86400000) : null;
  const labelMap: Record<string, Tender['label']> = {
    priority: 'Priority', consider: 'Consider',
    partner_only: 'Partner-only', ignore: 'Ignore', unscored: 'Consider',
  };
  const currency = t.currency || (t.jurisdiction === 'SG' ? 'SGD' : 'HKD');
  return {
    id:            String(t.tender_id || t.tender_ref),  // tender_id is the UUID PK
    tender_ref:    t.tender_ref || '',
    jurisdiction:  (t.jurisdiction as 'HK' | 'SG') || 'HK',
    title:         t.title || '',
    agency:        t.agency || t.source_name || '',
    category_tags: Array.isArray(t.category_tags) ? t.category_tags : [],
    publish_date:  t.publish_date ? t.publish_date.slice(0, 10) : '',
    closing_date:  closingDate || 'TBC',
    days_remaining: daysLeft,
    budget_display: t.budget_min ? `~${currency}$${Math.round(t.budget_min / 1000)}k` : '(not stated)',
    owner_type:    t.owner_type || 'gov',
    status:        (t.status as 'open' | 'closed') || 'open',
    label:         labelMap[t.label] || 'Consider',
    overall_score: t.overall_score ?? 0,
    source:        t.source_url || '',
  };
}

const LABEL_STYLES: Record<string, string> = {
  Priority: 'bg-emerald-500/15 text-emerald-400',
  Consider: 'bg-cyan-500/15 text-cyan-400',
  'Partner-only': 'bg-amber-500/15 text-amber-400',
  Ignore: 'bg-slate-500/10 text-slate-500',
};

export default function TendersPage() {
  const [search, setSearch] = useState('');
  const [filterLabel, setFilterLabel] = useState<Label>('All');
  const [filterJur, setFilterJur] = useState<Jurisdiction>('All');
  const [filterStatus, setFilterStatus] = useState<Status>('open');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [decisions, setDecisions] = useState<Record<string, DecisionChoice>>({});
  const [decisionLoading, setDecisionLoading] = useState<Record<string, boolean>>({});

  const fetchTenders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterJur !== 'All') params.set('jurisdiction', filterJur);
      if (filterLabel !== 'All') params.set('label', filterLabel.toLowerCase().replace('-', '_'));
      if (filterStatus !== 'All') params.set('status', filterStatus);
      if (search) params.set('search', search);
      params.set('limit', '100');
      const res = await fetch(`/api/tender-intel/tenders?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      setTenders((data.tenders || []).map(mapApiTender));
      setTotal(data.total ?? 0);
    } catch (_) {
      setTenders([]);
    } finally {
      setLoading(false);
    }
  }, [filterJur, filterLabel, filterStatus, search]);

  useEffect(() => { fetchTenders(); }, [fetchTenders]);

  async function handleDecision(tenderId: string, decision: DecisionChoice) {
    setDecisionLoading(prev => ({ ...prev, [tenderId]: true }));
    try {
      await fetch('/api/tender-intel/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenderId, action: decision }),
      });
      setDecisions(prev => ({ ...prev, [tenderId]: decision }));
    } catch (_) { /* silently ignore */ } finally {
      setDecisionLoading(prev => ({ ...prev, [tenderId]: false }));
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight mb-1">All Tenders</h1>
        <p className="text-sm text-slate-400">
          {loading ? 'Loading…' : `${total} records`} · sorted by relevance score
        </p>
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search title, agency, ref…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500/50"
          />
        </div>
        {([
          { value: filterJur, set: setFilterJur, options: ['All', 'HK', 'SG'], label: 'Jurisdiction' },
          { value: filterLabel, set: setFilterLabel, options: ['All', 'Priority', 'Consider', 'Partner-only', 'Ignore'], label: 'Label' },
          { value: filterStatus, set: setFilterStatus, options: ['All', 'open', 'closed'], label: 'Status' },
        ] as const).map(f => (
          <div key={f.label} className="relative">
            <select
              value={f.value}
              onChange={e => (f.set as (v: string) => void)(e.target.value)}
              className="appearance-none pl-3 pr-7 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-teal-500/50 cursor-pointer"
            >
              {f.options.map(o => <option key={o} value={o}>{o === 'All' ? `${f.label}: All` : o}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
          </div>
        ))}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700/50 bg-white/[0.02]">
            <Loader2 className="w-3.5 h-3.5 text-slate-500 animate-spin" />
            <span className="text-xs text-slate-500">Loading tenders…</span>
          </div>
          {[1,2,3,4,5].map(i => (
            <div key={i} className="px-4 py-3 border-b border-slate-700/30 animate-pulse flex gap-4">
              <div className="h-3 bg-slate-700/50 rounded w-16" />
              <div className="h-3 bg-slate-700/40 rounded flex-1" />
              <div className="h-3 bg-slate-700/30 rounded w-24 hidden sm:block" />
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="rounded-xl border border-slate-700/50 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700/50 bg-white/[0.02]">
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Label · Score</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Title</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-slate-500 font-semibold hidden sm:table-cell">Agency</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-slate-500 font-semibold hidden md:table-cell">Closing</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-slate-500 font-semibold hidden lg:table-cell">Budget</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {tenders.map((t, i) => (
                <>
                  <tr
                    key={t.id}
                    className={`border-b border-slate-700/30 cursor-pointer transition-colors ${
                      expanded === t.id ? 'bg-white/[0.04]' : i % 2 === 0 ? 'hover:bg-white/[0.02]' : 'bg-white/[0.01] hover:bg-white/[0.03]'
                    }`}
                    onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold ${LABEL_STYLES[t.label]}`}>
                          {t.label === 'Partner-only' ? 'Partner' : t.label}
                        </span>
                        <span className="font-mono text-slate-400">{(t.overall_score * 100).toFixed(0)}</span>
                        <span className="text-[10px] text-slate-600 hidden xl:inline">{t.jurisdiction}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-200 leading-snug max-w-xs truncate">{t.title}</div>
                      <div className="text-slate-500 font-mono mt-0.5">{t.tender_ref}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-400 hidden sm:table-cell max-w-[140px] truncate">{t.agency}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`${t.days_remaining !== null && t.days_remaining <= 7 ? 'text-amber-400' : 'text-slate-400'}`}>
                        {t.closing_date}
                      </span>
                      {t.days_remaining !== null && (
                        <span className="text-slate-600 ml-1">({t.days_remaining}d)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400 hidden lg:table-cell">{t.budget_display}</td>
                    <td className="pr-3 text-center">
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-600 transition-transform ${expanded === t.id ? 'rotate-180' : ''}`} />
                    </td>
                  </tr>
                  {expanded === t.id && (
                    <tr key={`${t.id}-detail`} className="border-b border-slate-700/30 bg-white/[0.04]">
                      <td colSpan={6} className="px-4 pb-4 pt-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3 text-xs">
                          <div className="flex items-center gap-1.5">
                            <Globe className="w-3 h-3 text-slate-500" />
                            <span className="text-slate-400">{t.jurisdiction} · {t.owner_type}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            <span className="text-slate-400">Closes {t.closing_date}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="w-3 h-3 text-slate-500" />
                            <span className="text-slate-400">{t.budget_display}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3 h-3 text-slate-500" />
                            <span className="text-slate-400">{t.source}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {t.category_tags.map(tag => (
                            <span key={tag} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-slate-700/40 text-slate-400 border border-slate-600/30">
                              {tag.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                        {t.source && (
                          <a
                            href={t.source}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors mt-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View on government portal
                          </a>
                        )}
                        {/* ── Proceed / Pass decision ── */}
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-700/30">
                          {decisions[t.id] ? (
                            <div className={`flex items-center gap-2 text-xs ${decisions[t.id] === 'track' ? 'text-emerald-400' : 'text-slate-500'}`}>
                              {decisions[t.id] === 'track'
                                ? <><ThumbsUp className="w-3 h-3" /><span className="font-medium">Proceeding</span></>
                                : <><ThumbsDown className="w-3 h-3" /><span>Passed</span></>
                              }
                              <button
                                onClick={e => { e.stopPropagation(); setDecisions(prev => { const d = {...prev}; delete d[t.id]; return d; }); }}
                                className="flex items-center gap-1 text-[10px] text-slate-600 hover:text-slate-400 transition-colors ml-1"
                              >
                                <RotateCcw className="w-2.5 h-2.5" /> Undo
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={e => { e.stopPropagation(); handleDecision(t.id, 'track'); }}
                                disabled={decisionLoading[t.id]}
                                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors disabled:opacity-50"
                              >
                                {decisionLoading[t.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <ThumbsUp className="w-3 h-3" />}
                                Proceed
                              </button>
                              <button
                                onClick={e => { e.stopPropagation(); handleDecision(t.id, 'ignore'); }}
                                disabled={decisionLoading[t.id]}
                                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white/[0.04] text-slate-400 border border-slate-700/50 hover:bg-white/[0.06] transition-colors disabled:opacity-50"
                              >
                                Pass
                              </button>
                              <span className="text-[10px] text-slate-600">Mark your intent for this tender</span>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {tenders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    No tenders yet. Run ingestion to fetch live data, or adjust filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
