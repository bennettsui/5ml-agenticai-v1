'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  LayoutGrid,
  ChevronRight,
  Activity,
  User,
  StickyNote,
  Flag,
  Layers,
  Users,
} from 'lucide-react';
import {
  ROADMAP_ITEMS,
  SOLUTION_LINES,
  STATUS_CONFIG,
  CSUITE_ROLES,
  type RoadmapTimeframe,
  type RoadmapItem,
} from '@/lib/platform-config';

// ---------------------------------------------------------------------------
// Timeframe configuration
// ---------------------------------------------------------------------------

const TIMEFRAME_CONFIG: Record<
  RoadmapTimeframe,
  { label: string; accent: string; border: string; bg: string; text: string }
> = {
  now: {
    label: 'Now (0-3mo)',
    accent: 'border-l-green-500',
    border: 'border-green-500/30',
    bg: 'bg-green-500/10',
    text: 'text-green-400',
  },
  next: {
    label: 'Next (3-9mo)',
    accent: 'border-l-amber-500',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
  },
  later: {
    label: 'Later (9-18mo)',
    accent: 'border-l-blue-500',
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
  },
};

// ---------------------------------------------------------------------------
// Priority helpers
// ---------------------------------------------------------------------------

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'text-red-400',
  high: 'text-orange-400',
  medium: 'text-amber-400',
  low: 'text-blue-400',
};

// ---------------------------------------------------------------------------
// Type badge helpers
// ---------------------------------------------------------------------------

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  product: { label: 'Product', cls: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
  platform: { label: 'Platform', cls: 'text-slate-300 bg-slate-500/10 border-slate-500/20' },
  csuite: { label: 'C-Suite', cls: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
};

// ---------------------------------------------------------------------------
// Solution line keys used for the "By Area" grouping
// ---------------------------------------------------------------------------

type SolutionLineKey = keyof typeof SOLUTION_LINES;

const AREA_KEYS: SolutionLineKey[] = [
  'GrowthOS',
  'IntelStudio',
  'TechNexus',
  'ExpLab',
  'MediaChannel',
  'FrontierVentures',
  'CSuite',
  'Platform',
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: RoadmapItem['status'] }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.color} ${cfg.bg}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {cfg.label}
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.04]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-slate-500">{pct}%</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Item card used in the "By Time" view
// ---------------------------------------------------------------------------

function TimeItemCard({ item }: { item: RoadmapItem }) {
  const slCfg = SOLUTION_LINES[item.solutionLine];
  const typeBadge = TYPE_BADGE[item.type];

  return (
    <div className="rounded-lg border border-slate-700/50 bg-slate-800/60 p-4 transition hover:bg-white/[0.02]">
      {/* Top row: name + badges */}
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <h4 className="text-sm font-semibold text-white">{item.name}</h4>
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${slCfg.darkBg} ${slCfg.textColor}`}
          >
            {slCfg.name}
          </span>
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${typeBadge.cls}`}
          >
            {typeBadge.label}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="mb-3 text-xs leading-relaxed text-slate-400">{item.description}</p>

      {/* Status + priority */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <StatusBadge status={item.status} />
        <span className={`text-xs font-medium ${PRIORITY_COLORS[item.priority]}`}>
          <Flag className="mr-0.5 inline h-3 w-3" />
          {item.priority}
        </span>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <ProgressBar value={item.progress} />
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
        {item.owner && (
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" /> {item.owner}
          </span>
        )}
        {item.notes && (
          <span className="flex items-center gap-1">
            <StickyNote className="h-3 w-3" /> {item.notes}
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compact row used in the "By Area" view
// ---------------------------------------------------------------------------

function AreaItemRow({ item }: { item: RoadmapItem }) {
  const tfCfg = TIMEFRAME_CONFIG[item.timeframe];

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-700/50 bg-white/[0.03] px-4 py-3 transition hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-white">{item.name}</span>
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${tfCfg.bg} ${tfCfg.border} ${tfCfg.text}`}
        >
          {tfCfg.label}
        </span>
        <StatusBadge status={item.status} />
        <span className={`text-xs font-medium ${PRIORITY_COLORS[item.priority]}`}>
          <Flag className="mr-0.5 inline h-3 w-3" />
          {item.priority}
        </span>
      </div>
      <div className="w-full sm:w-36">
        <ProgressBar value={item.progress} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

type ViewMode = 'time' | 'area';

export default function RoadmapPage() {
  const [view, setView] = useState<ViewMode>('time');

  // ----- By Time: group items ----- //
  const timeframeOrder: RoadmapTimeframe[] = ['now', 'next', 'later'];
  const itemsByTimeframe = timeframeOrder.map((tf) => ({
    timeframe: tf,
    items: ROADMAP_ITEMS.filter((i) => i.timeframe === tf),
  }));

  // ----- By Area: group items ----- //
  const itemsByArea = AREA_KEYS.map((key) => ({
    key,
    line: SOLUTION_LINES[key],
    items: ROADMAP_ITEMS.filter((i) => i.solutionLine === key && i.type !== 'csuite'),
  }));
  const csuiteItems = ROADMAP_ITEMS.filter((i) => i.type === 'csuite');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      {/* ---- Header ---- */}
      <header className="sticky top-0 z-30 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">5ML Agentic Roadmap</h1>
            <p className="text-xs text-slate-400">
              Track every agent, use case and platform module from idea to live.
            </p>
          </div>

          {/* Toggle */}
          <div className="flex rounded-lg border border-slate-700/50 bg-white/[0.03] p-0.5">
            <button
              onClick={() => setView('time')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                view === 'time'
                  ? 'bg-white/[0.08] text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              By Time
            </button>
            <button
              onClick={() => setView('area')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                view === 'area'
                  ? 'bg-white/[0.08] text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              By Area
            </button>
          </div>
        </div>
      </header>

      {/* ---- Content ---- */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        {view === 'time' ? (
          /* ======== BY TIME VIEW ======== */
          <div className="space-y-10">
            {itemsByTimeframe.map(({ timeframe, items }) => {
              const tfCfg = TIMEFRAME_CONFIG[timeframe];
              return (
                <section
                  key={timeframe}
                  className={`rounded-lg border-l-4 ${tfCfg.accent} border border-slate-700/50 bg-slate-800/60 p-6`}
                >
                  {/* Section heading */}
                  <div className="mb-5 flex items-center gap-3">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${tfCfg.bg} ${tfCfg.border} ${tfCfg.text}`}
                    >
                      {tfCfg.label}
                    </span>
                    <span className="text-sm text-slate-500">
                      {items.length} item{items.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Cards grid */}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((item) => (
                      <TimeItemCard key={item.id} item={item} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          /* ======== BY AREA VIEW ======== */
          <div className="space-y-8">
            {itemsByArea
              .filter((g) => g.items.length > 0)
              .map(({ key, line, items }) => (
                <section key={key}>
                  <div className="mb-3 flex items-center gap-2">
                    <Layers className={`h-4 w-4 ${line.textColor}`} />
                    <h3 className={`text-sm font-semibold ${line.textColor}`}>{line.name}</h3>
                    <span className="text-xs text-slate-500">{line.tagline}</span>
                  </div>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <AreaItemRow key={item.id} item={item} />
                    ))}
                  </div>
                </section>
              ))}

            {/* C-Suite group */}
            {csuiteItems.length > 0 && (
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-violet-400" />
                  <h3 className="text-sm font-semibold text-violet-400">C-Suite Agents</h3>
                  <span className="text-xs text-slate-500">
                    Executive-level agent families
                  </span>
                </div>
                <div className="space-y-2">
                  {csuiteItems.map((item) => (
                    <AreaItemRow key={item.id} item={item} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
