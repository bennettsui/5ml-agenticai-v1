'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, ChevronDown, ExternalLink, Calendar, DollarSign, Building2, Globe } from 'lucide-react';

type Label = 'Priority' | 'Consider' | 'Partner-only' | 'Ignore' | 'All';
type Jurisdiction = 'All' | 'HK' | 'SG';
type Status = 'All' | 'open' | 'closed';

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

const ALL_TENDERS: Tender[] = [
  {
    id: 'hk-001', tender_ref: 'ISD/EA/2026/001', jurisdiction: 'HK',
    title: 'Creative and Events Management Services Framework',
    agency: 'Information Services Department',
    category_tags: ['events_experiential', 'marketing_comms'],
    publish_date: '2026-02-05', closing_date: '2026-03-15', days_remaining: 22,
    budget_display: '~HK$2.5M', owner_type: 'gov', status: 'open',
    label: 'Priority', overall_score: 0.85, source: 'hk-gld-etb-xml',
  },
  {
    id: 'hk-002', tender_ref: 'EMSD(T)07/2026', jurisdiction: 'HK',
    title: 'Provision of Digital Signage and AV Systems',
    agency: 'EMSD',
    category_tags: ['IT_digital', 'facilities_management'],
    publish_date: '2026-02-10', closing_date: '2026-03-04', days_remaining: 11,
    budget_display: '~HK$800k', owner_type: 'gov', status: 'open',
    label: 'Priority', overall_score: 0.81, source: 'hk-emsd-rss-tender-notices',
  },
  {
    id: 'hk-003', tender_ref: 'LCSD/IT/001/2026', jurisdiction: 'HK',
    title: 'Digital Transformation Consultancy Services',
    agency: 'LCSD',
    category_tags: ['consultancy_advisory', 'IT_digital'],
    publish_date: '2026-02-12', closing_date: '2026-03-10', days_remaining: 17,
    budget_display: '~HK$1.2M', owner_type: 'gov', status: 'open',
    label: 'Priority', overall_score: 0.79, source: 'hk-gld-etb-xml',
  },
  {
    id: 'hk-004', tender_ref: 'HKPC/DM/003/2026', jurisdiction: 'HK',
    title: 'Social Media Marketing and Brand Campaign Management',
    agency: 'HKPC',
    category_tags: ['marketing_comms'],
    publish_date: '2026-02-14', closing_date: '2026-03-08', days_remaining: 15,
    budget_display: 'HK$480k', owner_type: 'public_org', status: 'open',
    label: 'Consider', overall_score: 0.64, source: 'hk-gld-etb-xml',
  },
  {
    id: 'hk-005', tender_ref: 'PolyU/MKT/2026/02', jurisdiction: 'HK',
    title: 'Student Recruitment Campaign — Digital and Experiential',
    agency: 'PolyU',
    category_tags: ['marketing_comms', 'events_experiential'],
    publish_date: '2026-02-15', closing_date: '2026-03-18', days_remaining: 25,
    budget_display: '~HK$600k', owner_type: 'university', status: 'open',
    label: 'Consider', overall_score: 0.61, source: 'hk-polyu-procurement',
  },
  {
    id: 'hk-006', tender_ref: 'ArchSD/T/002/2026', jurisdiction: 'HK',
    title: 'Renovation and Fitting-out Works at Government Office',
    agency: 'ArchSD',
    category_tags: ['construction_works'],
    publish_date: '2026-02-01', closing_date: '2026-03-20', days_remaining: 27,
    budget_display: '~HK$3.2M', owner_type: 'gov', status: 'open',
    label: 'Ignore', overall_score: 0.19, source: 'hk-archsd-rss-tender-notices',
  },
  {
    id: 'sg-001', tender_ref: 'GeBIZ-MOE-2026-0231', jurisdiction: 'SG',
    title: 'Digital Learning Platform Development and Implementation',
    agency: 'Ministry of Education',
    category_tags: ['IT_digital', 'consultancy_advisory'],
    publish_date: '2026-02-08', closing_date: '2026-03-12', days_remaining: 19,
    budget_display: 'SGD$450k', owner_type: 'gov', status: 'open',
    label: 'Priority', overall_score: 0.77, source: 'sg-gebiz-public-listing',
  },
  {
    id: 'sg-002', tender_ref: 'GeBIZ-ESG-2026-0087', jurisdiction: 'SG',
    title: 'Brand Campaign for Singapore Business Events and MICE Sector',
    agency: 'Enterprise Singapore',
    category_tags: ['events_experiential', 'marketing_comms'],
    publish_date: '2026-02-11', closing_date: '2026-03-07', days_remaining: 14,
    budget_display: 'SGD$280k', owner_type: 'gov', status: 'open',
    label: 'Consider', overall_score: 0.61, source: 'sg-gebiz-public-listing',
  },
  {
    id: 'sg-003', tender_ref: 'GeBIZ-NHB-2026-0014', jurisdiction: 'SG',
    title: 'Event Management Services for National Heritage Exhibitions 2026',
    agency: 'National Heritage Board',
    category_tags: ['events_experiential'],
    publish_date: '2026-02-14', closing_date: '2026-02-28', days_remaining: 7,
    budget_display: 'SGD$150k', owner_type: 'gov', status: 'open',
    label: 'Consider', overall_score: 0.56, source: 'sg-gebiz-public-listing',
  },
  {
    id: 'hk-old-001', tender_ref: 'LCSD/EVT/2025/008', jurisdiction: 'HK',
    title: 'Event Production Services for Cultural Festival 2025',
    agency: 'LCSD',
    category_tags: ['events_experiential'],
    publish_date: '2025-11-01', closing_date: '2025-12-15', days_remaining: null,
    budget_display: 'HK$1.8M', owner_type: 'gov', status: 'closed',
    label: 'Priority', overall_score: 0.88, source: 'hk-gld-etb-xml',
  },
];

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

  const filtered = useMemo(() => {
    return ALL_TENDERS.filter(t => {
      if (filterLabel !== 'All' && t.label !== filterLabel) return false;
      if (filterJur !== 'All' && t.jurisdiction !== filterJur) return false;
      if (filterStatus !== 'All' && t.status !== filterStatus) return false;
      if (search && !t.title.toLowerCase().includes(search.toLowerCase()) &&
        !t.agency.toLowerCase().includes(search.toLowerCase()) &&
        !t.tender_ref.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }).sort((a, b) => b.overall_score - a.overall_score);
  }, [search, filterLabel, filterJur, filterStatus]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight mb-1">All Tenders</h1>
        <p className="text-sm text-slate-400">{filtered.length} records · sorted by relevance score</p>
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

      {/* Table */}
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
            {filtered.map((t, i) => (
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
                      <button className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors mt-1">
                        <ExternalLink className="w-3 h-3" />
                        View source
                      </button>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">No tenders match the current filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
