'use client';

import { useState } from 'react';
import { CheckCircle2, AlertTriangle, Clock, RefreshCw, ChevronDown, Plus, ExternalLink } from 'lucide-react';

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

const SOURCES: Source[] = [
  {
    source_id: 'hk-gld-etb-xml',
    name: 'GLD e-Tender Box — Open Tenders',
    organisation: 'Government Logistics Department',
    jurisdiction: 'HK',
    source_type: 'api_xml',
    priority: 1,
    status: 'active',
    last_checked: '03:12 HKT',
    new_items_today: 23,
    feed_url: 'https://data.gov.hk/en-data/dataset/hk-gld-gldetb-gldetb-tendernotice',
    category_tags_default: ['government_procurement'],
    notes: 'Primary cross-department source. Updated 3× daily.',
    reliability_score: 0.97,
  },
  {
    source_id: 'hk-emsd-rss-tender-notices',
    name: 'EMSD — Tender Notices RSS',
    organisation: 'Electrical and Mechanical Services Department',
    jurisdiction: 'HK',
    source_type: 'rss_xml',
    priority: 1,
    status: 'active',
    last_checked: '03:14 HKT',
    new_items_today: 2,
    feed_url: 'http://www.emsd.gov.hk/filemanager/tendernotice/en/tender_notices.xml',
    category_tags_default: ['IT_digital', 'facilities_management'],
    notes: 'Tender ref usually embedded in title — regex extraction applied.',
    reliability_score: 0.93,
  },
  {
    source_id: 'hk-emsd-rss-consultancy-eoi',
    name: 'EMSD — Consultancy / EOI RSS',
    organisation: 'Electrical and Mechanical Services Department',
    jurisdiction: 'HK',
    source_type: 'rss_xml',
    priority: 2,
    status: 'active',
    last_checked: '03:14 HKT',
    new_items_today: 0,
    feed_url: 'http://www.emsd.gov.hk/filemanager/tendernotice/en/consultancy.xml',
    category_tags_default: ['consultancy_advisory'],
    notes: 'Covers EOI and consultancy calls.',
    reliability_score: 0.90,
  },
  {
    source_id: 'sg-gebiz-public-listing',
    name: 'GeBIZ — Business Opportunities Listing',
    organisation: 'Government of Singapore',
    jurisdiction: 'SG',
    source_type: 'html_list',
    priority: 1,
    status: 'active',
    last_checked: '03:18 HKT',
    new_items_today: 8,
    feed_url: 'https://www.gebiz.gov.sg/ptn/opportunity/BOListing.xhtml',
    category_tags_default: ['government_procurement'],
    notes: 'HTML scrape, paginated. No login required for public listing.',
    reliability_score: 0.88,
  },
  {
    source_id: 'hk-archsd-rss-tender-notices',
    name: 'ArchSD — Tender Notices RSS',
    organisation: 'Architectural Services Department',
    jurisdiction: 'HK',
    source_type: 'rss_xml',
    priority: 1,
    status: 'pending_validation',
    last_checked: null,
    new_items_today: null,
    feed_url: 'https://www.archsd.gov.hk/en/rss-feeds/tender-notices.xml',
    category_tags_default: ['construction_works'],
    notes: 'Feed URL inferred — agent must validate on first run.',
    reliability_score: 0.0,
  },
  {
    source_id: 'hk-dsd-rss-hub',
    name: 'DSD — RSS Feeds Hub',
    organisation: 'Drainage Services Department',
    jurisdiction: 'HK',
    source_type: 'html_hub',
    priority: 1,
    status: 'pending_validation',
    last_checked: null,
    new_items_today: null,
    feed_url: 'https://www.dsd.gov.hk/EN/RSS_Feeds/index.html',
    category_tags_default: ['construction_works'],
    notes: 'Hub page — agent will extract individual sub-feed URLs on first run.',
    reliability_score: 0.0,
  },
  {
    source_id: 'hk-govhk-rss-directory',
    name: 'GovHK — RSS Directory (Discovery Hub)',
    organisation: 'GovHK / OGCIO',
    jurisdiction: 'HK',
    source_type: 'html_hub',
    priority: 1,
    status: 'active',
    last_checked: '4 days ago',
    new_items_today: null,
    feed_url: 'https://www.gov.hk/en/about/rss.htm',
    category_tags_default: [],
    notes: 'Scanned weekly by SourceDiscoveryAgent. 3 new feeds found last run.',
    reliability_score: 0.95,
  },
  {
    source_id: 'sg-gebiz-rss-trading-partner',
    name: 'GeBIZ — RSS Feeds (Trading Partners)',
    organisation: 'Government of Singapore',
    jurisdiction: 'SG',
    source_type: 'rss_xml',
    priority: 2,
    status: 'deferred',
    last_checked: null,
    new_items_today: null,
    feed_url: null,
    category_tags_default: ['government_procurement'],
    notes: 'Requires GeBIZ Trading Partner login. Deferred until GTP registration.',
    reliability_score: 0.0,
  },
];

const STATUS_CONFIG: Record<SourceStatus, { label: string; icon: typeof CheckCircle2; color: string; dot: string }> = {
  active: { label: 'Active', icon: CheckCircle2, color: 'text-teal-400', dot: 'bg-teal-400' },
  broken: { label: 'Broken', icon: AlertTriangle, color: 'text-red-400', dot: 'bg-red-400' },
  pending_validation: { label: 'Pending', icon: Clock, color: 'text-amber-400', dot: 'bg-amber-400' },
  deferred: { label: 'Deferred', icon: Clock, color: 'text-slate-500', dot: 'bg-slate-600' },
};

const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  rss_xml: 'RSS/XML',
  api_xml: 'XML API',
  csv_open_data: 'CSV Open Data',
  html_list: 'HTML Scrape',
  html_hub: 'Discovery Hub',
};

const PRIORITY_COLORS = { 1: 'text-emerald-400', 2: 'text-blue-400', 3: 'text-slate-500' };

export default function SourceRegistryPage() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterJur, setFilterJur] = useState<'All' | 'HK' | 'SG' | 'Global'>('All');
  const [filterStatus, setFilterStatus] = useState<'All' | SourceStatus>('All');

  const filtered = SOURCES.filter(s => {
    if (filterJur !== 'All' && s.jurisdiction !== filterJur) return false;
    if (filterStatus !== 'All' && s.status !== filterStatus) return false;
    return true;
  });

  const activeCount = SOURCES.filter(s => s.status === 'active').length;
  const pendingCount = SOURCES.filter(s => s.status === 'pending_validation').length;
  const totalNewToday = SOURCES.reduce((sum, s) => sum + (s.new_items_today ?? 0), 0);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Source Registry</h1>
          <p className="text-sm text-slate-400">{activeCount} active · {pendingCount} pending · {totalNewToday} new items today</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 border border-slate-700/50 hover:border-slate-600 hover:text-white transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
            Run discovery
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-teal-500/15 text-teal-400 border border-teal-500/30 hover:bg-teal-500/25 transition-colors">
            <Plus className="w-3.5 h-3.5" />
            Add source
          </button>
        </div>
      </div>

      {/* Filters */}
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

      {/* Source cards */}
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
              {/* Row */}
              <button
                className="w-full flex items-center gap-4 px-4 py-3 hover:bg-white/[0.02] transition-colors text-left"
                onClick={() => setExpanded(isOpen ? null : source.source_id)}
              >
                {/* Status dot */}
                <div className="flex-shrink-0 flex items-center gap-2">
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
                        <div className="h-full bg-teal-400 rounded-full" style={{ width: `${source.reliability_score * 100}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-500 w-6">{(source.reliability_score * 100).toFixed(0)}</span>
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
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Feed URL</p>
                      {source.feed_url ? (
                        <a href={source.feed_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-teal-400 hover:underline flex items-center gap-1 break-all">
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
                              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/40 text-slate-400 border border-slate-600/30">
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
      </div>
    </div>
  );
}
