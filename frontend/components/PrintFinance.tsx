'use client';

import { useState } from 'react';
import {
  LayoutDashboard, Layers, DollarSign, Package, TrendingUp,
  FlaskConical, FileText, ChevronRight, ArrowUpRight, ArrowDownRight,
  AlertCircle, CheckCircle2, Clock, Zap,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SubTab = 'overview' | 'work-units' | 'revenue' | 'costs' | 'inventory' | 'scenarios' | 'reports';

interface WorkUnit {
  id: string;
  name: string;
  material: string;
  grams: number;
  hours: number;
  status: 'complete' | 'in-progress' | 'queued' | 'failed';
  revenue: number;
  directCost: number;
  overheadAlloc: number;
}

interface InventoryItem {
  id: string;
  name: string;
  type: 'filament' | 'resin' | 'powder';
  unit: string;
  stockQty: number;
  reorderPoint: number;
  unitCost: number;
  supplier: string;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const WORK_UNITS: WorkUnit[] = [
  { id: 'WU-001', name: 'Prototype Bracket v3', material: 'PLA+', grams: 142, hours: 4.2, status: 'complete', revenue: 85, directCost: 18, overheadAlloc: 12 },
  { id: 'WU-002', name: 'Medical Fixture Set', material: 'Nylon PA12', grams: 520, hours: 11.5, status: 'complete', revenue: 340, directCost: 68, overheadAlloc: 38 },
  { id: 'WU-003', name: 'Custom Enclosure', material: 'ABS', grams: 380, hours: 8.0, status: 'in-progress', revenue: 220, directCost: 48, overheadAlloc: 28 },
  { id: 'WU-004', name: 'Resin Display Models ×12', material: 'Standard Resin', grams: 890, hours: 14.0, status: 'complete', revenue: 480, directCost: 95, overheadAlloc: 52 },
  { id: 'WU-005', name: 'Aerospace Clip', material: 'PEEK', grams: 65, hours: 6.5, status: 'queued', revenue: 390, directCost: 52, overheadAlloc: 30 },
  { id: 'WU-006', name: 'Dental Splint ×4', material: 'Dental Resin', grams: 210, hours: 5.0, status: 'complete', revenue: 520, directCost: 80, overheadAlloc: 35 },
  { id: 'WU-007', name: 'Robot Arm Part B', material: 'TPU', grams: 175, hours: 3.8, status: 'failed', revenue: 0, directCost: 24, overheadAlloc: 18 },
  { id: 'WU-008', name: 'Architectural Model', material: 'PLA', grams: 1100, hours: 22.0, status: 'in-progress', revenue: 650, directCost: 110, overheadAlloc: 80 },
];

const INVENTORY: InventoryItem[] = [
  { id: 'INV-001', name: 'PLA+ White 1.75mm', type: 'filament', unit: 'kg', stockQty: 12.4, reorderPoint: 5, unitCost: 18.50, supplier: 'Hatchbox' },
  { id: 'INV-002', name: 'Nylon PA12 Black', type: 'filament', unit: 'kg', stockQty: 3.2, reorderPoint: 4, unitCost: 42.00, supplier: 'Ultimaker' },
  { id: 'INV-003', name: 'ABS Gray 2.85mm', type: 'filament', unit: 'kg', stockQty: 8.1, reorderPoint: 3, unitCost: 22.00, supplier: 'Polymaker' },
  { id: 'INV-004', name: 'Standard Resin Clear', type: 'resin', unit: 'L', stockQty: 4.5, reorderPoint: 2, unitCost: 35.00, supplier: 'Elegoo' },
  { id: 'INV-005', name: 'PEEK Natural', type: 'filament', unit: 'kg', stockQty: 0.8, reorderPoint: 1, unitCost: 280.00, supplier: 'Victrex' },
  { id: 'INV-006', name: 'Dental Resin A2', type: 'resin', unit: 'L', stockQty: 1.2, reorderPoint: 1, unitCost: 120.00, supplier: 'Formlabs' },
  { id: 'INV-007', name: 'TPU 95A Shore', type: 'filament', unit: 'kg', stockQty: 5.6, reorderPoint: 2, unitCost: 28.00, supplier: 'NinjaFlex' },
];

const STATUS_COLOR: Record<WorkUnit['status'], string> = {
  'complete': 'bg-emerald-500/20 text-emerald-300',
  'in-progress': 'bg-blue-500/20 text-blue-300',
  'queued': 'bg-slate-500/20 text-slate-300',
  'failed': 'bg-red-500/20 text-red-300',
};

const STATUS_ICON: Record<WorkUnit['status'], typeof CheckCircle2> = {
  'complete': CheckCircle2,
  'in-progress': Clock,
  'queued': Clock,
  'failed': AlertCircle,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmt = (n: number, decimals = 0) =>
  n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const money = (n: number) => `$${fmt(n, 2)}`;

// ---------------------------------------------------------------------------
// Sub-tab: Overview
// ---------------------------------------------------------------------------

function Overview() {
  const completed = WORK_UNITS.filter(w => w.status === 'complete');
  const totalRevenue = completed.reduce((s, w) => s + w.revenue, 0);
  const totalCost = completed.reduce((s, w) => s + w.directCost + w.overheadAlloc, 0);
  const grossProfit = totalRevenue - totalCost;
  const margin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const totalGrams = completed.reduce((s, w) => s + w.grams, 0);
  const costPerGram = totalGrams > 0 ? totalCost / totalGrams : 0;

  const kpis = [
    { label: 'Revenue (MTD)', value: money(totalRevenue), sub: `${completed.length} completed jobs`, positive: true, icon: DollarSign, color: 'text-emerald-400' },
    { label: 'Gross Profit', value: money(grossProfit), sub: `${fmt(margin, 1)}% margin`, positive: margin > 30, icon: TrendingUp, color: margin > 30 ? 'text-emerald-400' : 'text-amber-400' },
    { label: 'Total Cost', value: money(totalCost), sub: 'Direct + overhead', positive: false, icon: Layers, color: 'text-rose-400' },
    { label: 'Cost / Gram', value: `$${fmt(costPerGram, 3)}`, sub: `${fmt(totalGrams)}g printed`, positive: costPerGram < 0.15, icon: Package, color: 'text-blue-400' },
  ];

  const recentJobs = [...WORK_UNITS].slice(0, 5);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs text-slate-400 font-medium">{k.label}</span>
                <Icon className={`w-4 h-4 ${k.color}`} />
              </div>
              <div className="text-2xl font-bold text-white mb-1">{k.value}</div>
              <div className="text-xs text-slate-500">{k.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Job Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-4">Recent Jobs</h3>
          <div className="space-y-2">
            {recentJobs.map(w => {
              const margin = w.revenue > 0 ? ((w.revenue - w.directCost - w.overheadAlloc) / w.revenue) * 100 : 0;
              const Icon = STATUS_ICON[w.status];
              return (
                <div key={w.id} className="flex items-center gap-3 py-2 border-b border-slate-700/40 last:border-0">
                  <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${w.status === 'complete' ? 'text-emerald-400' : w.status === 'failed' ? 'text-red-400' : 'text-blue-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-200 truncate">{w.name}</div>
                    <div className="text-xs text-slate-500">{w.material} · {w.grams}g · {w.hours}h</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-medium text-white">{money(w.revenue)}</div>
                    {w.revenue > 0 && (
                      <div className={`text-xs ${margin > 40 ? 'text-emerald-400' : 'text-amber-400'}`}>{fmt(margin, 0)}% margin</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-4">Job Status</h3>
          {(['complete', 'in-progress', 'queued', 'failed'] as const).map(s => {
            const count = WORK_UNITS.filter(w => w.status === s).length;
            const pct = Math.round((count / WORK_UNITS.length) * 100);
            return (
              <div key={s} className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="capitalize text-slate-400">{s}</span>
                  <span className="text-slate-300">{count}</span>
                </div>
                <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${s === 'complete' ? 'bg-emerald-500' : s === 'in-progress' ? 'bg-blue-500' : s === 'queued' ? 'bg-slate-500' : 'bg-red-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}

          <div className="mt-6 pt-4 border-t border-slate-700/40">
            <h4 className="text-xs font-semibold text-slate-400 mb-3">Material Mix</h4>
            {['PLA+', 'Nylon PA12', 'Resin', 'PEEK', 'Other'].map((m, i) => {
              const widths = [35, 20, 25, 8, 12];
              return (
                <div key={m} className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ['#10b981','#3b82f6','#8b5cf6','#f59e0b','#64748b'][i] }} />
                  <span className="text-xs text-slate-400 flex-1">{m}</span>
                  <span className="text-xs text-slate-300">{widths[i]}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-tab: Work Units
// ---------------------------------------------------------------------------

function WorkUnits() {
  const [selected, setSelected] = useState<WorkUnit | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">All Work Units</h3>
        <div className="flex gap-2">
          {(['all', 'complete', 'in-progress', 'queued'] as const).map(f => (
            <span key={f} className="px-2 py-0.5 rounded text-xs bg-slate-700/50 text-slate-300 cursor-pointer hover:bg-slate-700 transition-colors capitalize">{f}</span>
          ))}
        </div>
      </div>

      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/50">
              {['Job ID', 'Name', 'Material', 'Weight', 'Time', 'Status', 'Revenue', 'Direct Cost', 'Overhead', 'Margin'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {WORK_UNITS.map(w => {
              const profit = w.revenue - w.directCost - w.overheadAlloc;
              const margin = w.revenue > 0 ? (profit / w.revenue) * 100 : 0;
              const Icon = STATUS_ICON[w.status];
              return (
                <tr
                  key={w.id}
                  onClick={() => setSelected(selected?.id === w.id ? null : w)}
                  className="border-b border-slate-700/30 last:border-0 hover:bg-white/[0.02] cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">{w.id}</td>
                  <td className="px-4 py-3 text-slate-200 font-medium">{w.name}</td>
                  <td className="px-4 py-3 text-slate-400">{w.material}</td>
                  <td className="px-4 py-3 text-slate-300">{w.grams}g</td>
                  <td className="px-4 py-3 text-slate-300">{w.hours}h</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[w.status]}`}>
                      <Icon className="w-3 h-3" />
                      {w.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white font-medium">{money(w.revenue)}</td>
                  <td className="px-4 py-3 text-rose-300">{money(w.directCost)}</td>
                  <td className="px-4 py-3 text-amber-300">{money(w.overheadAlloc)}</td>
                  <td className="px-4 py-3">
                    {w.revenue > 0 ? (
                      <span className={`font-medium ${margin > 50 ? 'text-emerald-400' : margin > 30 ? 'text-blue-400' : 'text-amber-400'}`}>
                        {fmt(margin, 1)}%
                      </span>
                    ) : <span className="text-slate-500">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="text-base font-semibold text-white">{selected.name}</h4>
              <p className="text-xs text-slate-400 mt-0.5">{selected.id} · {selected.material}</p>
            </div>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[selected.status]}`}>
              {selected.status}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Revenue', value: money(selected.revenue), color: 'text-emerald-400' },
              { label: 'Direct Cost', value: money(selected.directCost), color: 'text-rose-400' },
              { label: 'Overhead', value: money(selected.overheadAlloc), color: 'text-amber-400' },
              { label: 'Net Profit', value: money(selected.revenue - selected.directCost - selected.overheadAlloc), color: selected.revenue > selected.directCost + selected.overheadAlloc ? 'text-emerald-400' : 'text-red-400' },
              { label: 'Weight', value: `${selected.grams}g`, color: 'text-slate-300' },
              { label: 'Print Time', value: `${selected.hours}h`, color: 'text-slate-300' },
              { label: 'Cost/gram', value: `$${fmt((selected.directCost + selected.overheadAlloc) / selected.grams, 3)}`, color: 'text-slate-300' },
              { label: 'Rev/hour', value: money(selected.revenue / selected.hours), color: 'text-slate-300' },
            ].map(f => (
              <div key={f.label} className="bg-white/[0.03] rounded-lg p-3">
                <div className="text-xs text-slate-500 mb-1">{f.label}</div>
                <div className={`text-lg font-bold ${f.color}`}>{f.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-tab: Revenue
// ---------------------------------------------------------------------------

const REVENUE_ROWS = [
  { channel: 'Direct B2B', period: 'Mar 2026', jobs: 4, units: 1792, revenue: 1535, cogs: 281 },
  { channel: 'Etsy / D2C', period: 'Mar 2026', jobs: 12, units: 890, revenue: 480, cogs: 147 },
  { channel: 'Medical', period: 'Mar 2026', jobs: 2, units: 730, revenue: 860, cogs: 203 },
  { channel: 'Prototyping', period: 'Mar 2026', jobs: 6, units: 562, revenue: 375, cogs: 90 },
  { channel: 'Direct B2B', period: 'Feb 2026', jobs: 3, units: 1420, revenue: 1200, cogs: 235 },
  { channel: 'Medical', period: 'Feb 2026', jobs: 1, units: 520, revenue: 680, cogs: 168 },
];

function Revenue() {
  const totals = REVENUE_ROWS.reduce((acc, r) => ({
    jobs: acc.jobs + r.jobs, revenue: acc.revenue + r.revenue, cogs: acc.cogs + r.cogs,
  }), { jobs: 0, revenue: 0, cogs: 0 });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Revenue', value: money(totals.revenue), icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Total COGS', value: money(totals.cogs), icon: DollarSign, color: 'text-rose-400' },
          { label: 'Gross Profit', value: money(totals.revenue - totals.cogs), icon: Zap, color: 'text-blue-400' },
        ].map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">{k.label}</span>
                <Icon className={`w-4 h-4 ${k.color}`} />
              </div>
              <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/50">
              {['Channel', 'Period', 'Jobs', 'Grams', 'Revenue', 'COGS', 'Gross Profit', 'Margin'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {REVENUE_ROWS.map((r, i) => {
              const gp = r.revenue - r.cogs;
              const margin = (gp / r.revenue) * 100;
              return (
                <tr key={i} className="border-b border-slate-700/30 last:border-0 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-slate-200 font-medium">{r.channel}</td>
                  <td className="px-4 py-3 text-slate-400">{r.period}</td>
                  <td className="px-4 py-3 text-slate-300">{r.jobs}</td>
                  <td className="px-4 py-3 text-slate-300">{fmt(r.units)}</td>
                  <td className="px-4 py-3 text-white font-medium">{money(r.revenue)}</td>
                  <td className="px-4 py-3 text-rose-300">{money(r.cogs)}</td>
                  <td className="px-4 py-3 text-emerald-300">{money(gp)}</td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${margin > 70 ? 'text-emerald-400' : margin > 50 ? 'text-blue-400' : 'text-amber-400'}`}>
                      {fmt(margin, 1)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-600/50 bg-white/[0.02]">
              <td colSpan={4} className="px-4 py-3 text-xs font-semibold text-slate-300">TOTAL</td>
              <td className="px-4 py-3 text-white font-bold">{money(totals.revenue)}</td>
              <td className="px-4 py-3 text-rose-300 font-bold">{money(totals.cogs)}</td>
              <td className="px-4 py-3 text-emerald-300 font-bold">{money(totals.revenue - totals.cogs)}</td>
              <td className="px-4 py-3 text-blue-400 font-bold">{fmt(((totals.revenue - totals.cogs) / totals.revenue) * 100, 1)}%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-tab: Costs
// ---------------------------------------------------------------------------

const COST_CATEGORIES = [
  { category: 'Filament & Resin', type: 'direct', amount: 842, pct: 38 },
  { category: 'Post-processing labor', type: 'direct', amount: 320, pct: 14 },
  { category: 'Failed prints / waste', type: 'direct', amount: 95, pct: 4 },
  { category: 'Machine depreciation', type: 'overhead', amount: 410, pct: 18 },
  { category: 'Electricity', type: 'overhead', amount: 180, pct: 8 },
  { category: 'Software / slicing licenses', type: 'overhead', amount: 55, pct: 2 },
  { category: 'Facility / rent alloc.', type: 'overhead', amount: 240, pct: 11 },
  { category: 'Admin & support', type: 'overhead', amount: 110, pct: 5 },
];

function Costs() {
  const direct = COST_CATEGORIES.filter(c => c.type === 'direct').reduce((s, c) => s + c.amount, 0);
  const overhead = COST_CATEGORIES.filter(c => c.type === 'overhead').reduce((s, c) => s + c.amount, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Direct Costs', value: money(direct), sub: 'Variable with output', color: 'text-rose-400' },
          { label: 'Overhead', value: money(overhead), sub: 'Fixed & semi-fixed', color: 'text-amber-400' },
          { label: 'Total Costs', value: money(direct + overhead), sub: 'MTD combined', color: 'text-slate-200' },
        ].map(k => (
          <div key={k.label} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
            <div className="text-xs text-slate-400 mb-2">{k.label}</div>
            <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
            <div className="text-xs text-slate-500 mt-1">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {(['direct', 'overhead'] as const).map(type => (
          <div key={type} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-4 capitalize">{type} Costs</h3>
            <div className="space-y-3">
              {COST_CATEGORIES.filter(c => c.type === type).map(c => (
                <div key={c.category}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">{c.category}</span>
                    <span className="text-slate-200 font-medium">{money(c.amount)}</span>
                  </div>
                  <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${type === 'direct' ? 'bg-rose-500' : 'bg-amber-500'}`}
                      style={{ width: `${c.pct}%` }}
                    />
                  </div>
                  <div className="text-right text-xs text-slate-500 mt-0.5">{c.pct}% of total</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-tab: Inventory
// ---------------------------------------------------------------------------

function Inventory() {
  const totalValue = INVENTORY.reduce((s, i) => s + i.stockQty * i.unitCost, 0);
  const lowStock = INVENTORY.filter(i => i.stockQty <= i.reorderPoint);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-2">Stock Value</div>
          <div className="text-2xl font-bold text-white">{money(totalValue)}</div>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-2">SKUs</div>
          <div className="text-2xl font-bold text-white">{INVENTORY.length}</div>
        </div>
        <div className={`bg-slate-800/60 border rounded-xl p-4 ${lowStock.length > 0 ? 'border-amber-500/40' : 'border-slate-700/50'}`}>
          <div className="text-xs text-slate-400 mb-2">Low Stock Alerts</div>
          <div className={`text-2xl font-bold ${lowStock.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>{lowStock.length}</div>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300">
            {lowStock.map(i => i.name).join(', ')} {lowStock.length === 1 ? 'is' : 'are'} at or below reorder point.
          </p>
        </div>
      )}

      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/50">
              {['ID', 'Name', 'Type', 'Stock', 'Reorder @', 'Unit Cost', 'Value', 'Supplier', 'Status'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {INVENTORY.map(item => {
              const value = item.stockQty * item.unitCost;
              const isLow = item.stockQty <= item.reorderPoint;
              return (
                <tr key={item.id} className="border-b border-slate-700/30 last:border-0 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">{item.id}</td>
                  <td className="px-4 py-3 text-slate-200 font-medium">{item.name}</td>
                  <td className="px-4 py-3">
                    <span className="px-1.5 py-0.5 rounded text-xs bg-slate-700/50 text-slate-300 capitalize">{item.type}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{item.stockQty} {item.unit}</td>
                  <td className="px-4 py-3 text-slate-400">{item.reorderPoint} {item.unit}</td>
                  <td className="px-4 py-3 text-slate-300">{money(item.unitCost)}/{item.unit}</td>
                  <td className="px-4 py-3 text-white font-medium">{money(value)}</td>
                  <td className="px-4 py-3 text-slate-400">{item.supplier}</td>
                  <td className="px-4 py-3">
                    {isLow ? (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-400">
                        <AlertCircle className="w-3 h-3" /> Reorder
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" /> OK
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-tab: Scenarios
// ---------------------------------------------------------------------------

function Scenarios() {
  const [volumeMult, setVolumeMult] = useState(1.0);
  const [priceAdj, setPriceAdj] = useState(0);
  const [overheadAdj, setOverheadAdj] = useState(0);

  const baseRevenue = 3130;
  const baseCost = 2252;
  const baseMargin = ((baseRevenue - baseCost) / baseRevenue) * 100;

  const scenRevenue = baseRevenue * volumeMult * (1 + priceAdj / 100);
  const scenCost = baseCost * volumeMult * (1 + overheadAdj / 100);
  const scenProfit = scenRevenue - scenCost;
  const scenMargin = scenRevenue > 0 ? (scenProfit / scenRevenue) * 100 : 0;

  const deltaRevenue = scenRevenue - baseRevenue;
  const deltaProfit = scenProfit - (baseRevenue - baseCost);

  const sliders = [
    { label: 'Volume Multiplier', min: 0.25, max: 3, step: 0.05, value: volumeMult, set: setVolumeMult, fmt: (v: number) => `${v.toFixed(2)}×` },
    { label: 'Price Adjustment', min: -30, max: 50, step: 1, value: priceAdj, set: setPriceAdj, fmt: (v: number) => `${v > 0 ? '+' : ''}${v}%` },
    { label: 'Overhead Change', min: -20, max: 40, step: 1, value: overheadAdj, set: setOverheadAdj, fmt: (v: number) => `${v > 0 ? '+' : ''}${v}%` },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Controls */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-5">Scenario Parameters</h3>
          <div className="space-y-6">
            {sliders.map(s => (
              <div key={s.label}>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-400">{s.label}</span>
                  <span className="text-blue-400 font-semibold">{s.fmt(s.value)}</span>
                </div>
                <input
                  type="range" min={s.min} max={s.max} step={s.step}
                  value={s.value}
                  onChange={e => s.set(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-xs text-slate-600 mt-1">
                  <span>{s.fmt(s.min)}</span><span>{s.fmt(s.max)}</span>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => { setVolumeMult(1); setPriceAdj(0); setOverheadAdj(0); }}
            className="mt-4 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Reset to baseline
          </button>
        </div>

        {/* Results */}
        <div className="space-y-3">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-4">Baseline vs Scenario</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Revenue', base: baseRevenue, scen: scenRevenue },
                { label: 'Cost', base: baseCost, scen: scenCost },
                { label: 'Gross Profit', base: baseRevenue - baseCost, scen: scenProfit },
                { label: 'Margin', base: baseMargin, scen: scenMargin, pct: true },
              ].map(r => {
                const delta = r.scen - r.base;
                const positive = delta >= 0;
                return (
                  <div key={r.label} className="bg-white/[0.03] rounded-lg p-3">
                    <div className="text-xs text-slate-500 mb-1">{r.label}</div>
                    <div className="text-sm text-slate-400 mb-1">
                      Base: <span className="text-slate-200">{r.pct ? `${fmt(r.base, 1)}%` : money(r.base)}</span>
                    </div>
                    <div className="text-lg font-bold text-white">{r.pct ? `${fmt(r.scen, 1)}%` : money(r.scen)}</div>
                    <div className={`text-xs mt-1 flex items-center gap-0.5 ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {r.pct ? `${fmt(Math.abs(delta), 1)}pp` : money(Math.abs(delta))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`rounded-xl p-4 border ${scenMargin > 30 ? 'bg-emerald-500/10 border-emerald-500/30' : scenMargin > 15 ? 'bg-blue-500/10 border-blue-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
            <div className="text-xs font-semibold text-slate-400 mb-1">Scenario Assessment</div>
            <div className={`text-sm font-medium ${scenMargin > 30 ? 'text-emerald-300' : scenMargin > 15 ? 'text-blue-300' : 'text-red-300'}`}>
              {scenMargin > 30 ? '✓ Healthy — target margin maintained' : scenMargin > 15 ? '⚠ Marginal — consider cost reduction' : '✗ Unprofitable — review pricing or volume'}
            </div>
            <div className="text-xs text-slate-500 mt-2">
              Incremental profit vs baseline: {deltaProfit >= 0 ? '+' : ''}{money(deltaProfit)} | Revenue delta: {deltaRevenue >= 0 ? '+' : ''}{money(deltaRevenue)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-tab: Reports
// ---------------------------------------------------------------------------

function Reports() {
  const revenue = 3130;
  const cogs = 1257;
  const grossProfit = revenue - cogs;
  const opex = 995;
  const ebitda = grossProfit - opex;
  const depreciation = 410;
  const ebit = ebitda - depreciation;

  const lines = [
    { label: 'Revenue', value: revenue, indent: 0, bold: false, border: false },
    { label: 'Cost of Goods Sold', value: -cogs, indent: 1, bold: false, border: false },
    { label: 'Gross Profit', value: grossProfit, indent: 0, bold: true, border: true },
    { label: 'Operating Expenses', value: -opex, indent: 1, bold: false, border: false },
    { label: 'EBITDA', value: ebitda, indent: 0, bold: true, border: true },
    { label: 'Depreciation (machines)', value: -depreciation, indent: 1, bold: false, border: false },
    { label: 'EBIT', value: ebit, indent: 0, bold: true, border: true },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* P&L */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Profit & Loss — MTD Mar 2026</h3>
            <span className="text-xs text-slate-500">3D Print Finance</span>
          </div>
          <div className="space-y-1">
            {lines.map((l, i) => (
              <div key={i} className={`flex justify-between py-2 text-sm ${l.border ? 'border-t border-slate-600/50 mt-1' : ''} ${l.bold ? 'font-semibold' : ''}`}>
                <span className={`${l.indent === 1 ? 'pl-4' : ''} ${l.bold ? 'text-white' : 'text-slate-400'}`}>{l.label}</span>
                <span className={l.value < 0 ? 'text-rose-300' : l.bold ? 'text-emerald-300' : 'text-slate-200'}>
                  {l.value < 0 ? `(${money(-l.value)})` : money(l.value)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-600/50 grid grid-cols-2 gap-3">
            <div className="bg-white/[0.03] rounded-lg p-3 text-center">
              <div className="text-xs text-slate-500">Gross Margin</div>
              <div className="text-lg font-bold text-emerald-400">{fmt((grossProfit / revenue) * 100, 1)}%</div>
            </div>
            <div className="bg-white/[0.03] rounded-lg p-3 text-center">
              <div className="text-xs text-slate-500">EBIT Margin</div>
              <div className={`text-lg font-bold ${ebit > 0 ? 'text-blue-400' : 'text-red-400'}`}>{fmt((ebit / revenue) * 100, 1)}%</div>
            </div>
          </div>
        </div>

        {/* Job Profitability + Channel Summary */}
        <div className="space-y-4">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Top Jobs by Profit</h3>
            {WORK_UNITS.filter(w => w.status === 'complete')
              .map(w => ({ ...w, profit: w.revenue - w.directCost - w.overheadAlloc }))
              .sort((a, b) => b.profit - a.profit)
              .slice(0, 4)
              .map(w => (
                <div key={w.id} className="flex items-center gap-3 py-2 border-b border-slate-700/30 last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-200 truncate">{w.name}</div>
                    <div className="text-xs text-slate-500">{w.material}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-emerald-400">{money(w.profit)}</div>
                    <div className="text-xs text-slate-500">{fmt((w.profit / w.revenue) * 100, 0)}% margin</div>
                  </div>
                </div>
              ))}
          </div>

          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Channel Summary</h3>
            {[
              { name: 'Medical', revenue: 1540, margin: 76 },
              { name: 'Direct B2B', revenue: 2735, margin: 68 },
              { name: 'Prototyping', revenue: 375, margin: 76 },
              { name: 'Etsy / D2C', revenue: 480, margin: 69 },
            ].map(c => (
              <div key={c.name} className="flex items-center gap-3 py-2 border-b border-slate-700/30 last:border-0">
                <span className="text-sm text-slate-300 flex-1">{c.name}</span>
                <span className="text-sm text-white">{money(c.revenue)}</span>
                <span className={`text-xs w-12 text-right font-medium ${c.margin > 70 ? 'text-emerald-400' : 'text-blue-400'}`}>{c.margin}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        {['Export P&L CSV', 'Export Job Detail CSV', 'Export Inventory CSV'].map(label => (
          <button
            key={label}
            className="px-4 py-2 bg-slate-700/60 hover:bg-slate-700 border border-slate-600/50 text-slate-300 hover:text-white text-xs rounded-lg transition-colors flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const SUB_TABS: { id: SubTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'work-units', label: 'Work Units', icon: Layers },
  { id: 'revenue', label: 'Revenue', icon: TrendingUp },
  { id: 'costs', label: 'Costs', icon: DollarSign },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'scenarios', label: 'Scenarios', icon: FlaskConical },
  { id: 'reports', label: 'Reports', icon: FileText },
];

export default function PrintFinance() {
  const [activeTab, setActiveTab] = useState<SubTab>('overview');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">3D Print Finance</h2>
          <p className="text-sm text-slate-400 mt-0.5">Job costing · Revenue tracking · Inventory · Scenarios</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs text-emerald-300 font-medium">8 jobs active</span>
        </div>
      </div>

      {/* Sub-tab nav */}
      <div className="flex gap-1 border-b border-slate-700/50 overflow-x-auto">
        {SUB_TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap -mb-px ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'overview'    && <Overview />}
      {activeTab === 'work-units'  && <WorkUnits />}
      {activeTab === 'revenue'     && <Revenue />}
      {activeTab === 'costs'       && <Costs />}
      {activeTab === 'inventory'   && <Inventory />}
      {activeTab === 'scenarios'   && <Scenarios />}
      {activeTab === 'reports'     && <Reports />}
    </div>
  );
}
