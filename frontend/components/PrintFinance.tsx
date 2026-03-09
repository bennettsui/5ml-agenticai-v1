'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  LayoutDashboard, Layers, DollarSign, Package, TrendingUp,
  FlaskConical, FileText, ArrowUpRight, ArrowDownRight,
  AlertCircle, CheckCircle2, Clock, Zap, Plus, Trash2,
  Upload, Download, X, Loader2, RefreshCw, Pencil, Save,
  Calculator, Filter, Receipt, ChevronDown, ChevronUp, Settings as SettingsIcon,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SubTab = 'overview' | 'work-units' | 'revenue' | 'costs' | 'inventory' | 'scenarios' | 'reports' | 'estimator' | 'invoices' | 'settings' | 'upload';

interface WorkUnit {
  id: number;
  job_id: string;
  name: string;
  material: string;
  grams: number;
  hours: number;
  status: 'complete' | 'in-progress' | 'queued' | 'failed';
  revenue: number;
  direct_cost: number;
  overhead_alloc: number;
  notes?: string;
  created_at?: string;
}

interface RevenueEntry {
  id: number;
  channel: string;
  period: string;
  jobs: number;
  units_grams: number;
  revenue: number;
  cogs: number;
}

interface CostEntry {
  id: number;
  category: string;
  type: 'direct' | 'overhead' | 'fixed';
  amount: number;
  period?: string;
  notes?: string;
}

interface SavedScenario {
  id: number;
  name: string;
  volume_mult: number;
  price_adj: number;
  overhead_adj: number;
  notes?: string;
  created_at: string;
}

interface MaterialRate {
  id: number;
  material: string;
  machine_rate_per_hr: number;
  filament_cost_per_g: number;
  notes?: string;
}

interface Invoice {
  id: number;
  invoice_no: string;
  type: 'invoice' | 'quote';
  client_name?: string;
  client_company?: string;
  client_email?: string;
  client_address?: string;
  issue_date?: string;
  due_date?: string;
  payment_terms?: string;
  notes?: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  work_unit_ids: number[];
  created_at: string;
}

interface InventoryItem {
  id: number;
  sku: string;
  name: string;
  type: 'filament' | 'resin' | 'powder';
  unit: string;
  stock_qty: number;
  reorder_point: number;
  unit_cost: number;
  supplier?: string;
}

interface PfSetting {
  key: string;
  value: string;
  label: string;
  category: string;
}

interface ImportPreview {
  detected_type: string;
  columns: string[];
  sample_rows: Record<string, string>[];
  row_count: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmt = (n: number, decimals = 0) =>
  Number(n).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const money = (n: number) => `$${fmt(n, 2)}`;

const STATUS_COLOR: Record<string, string> = {
  'complete': 'bg-emerald-500/20 text-emerald-300',
  'in-progress': 'bg-blue-500/20 text-blue-300',
  'queued': 'bg-slate-500/20 text-slate-300',
  'failed': 'bg-red-500/20 text-red-300',
};

function useApi<T>(url: string, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      setData(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, ...deps]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, reload: load };
}

function LoadingRow({ cols }: { cols: number }) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-8 text-center text-slate-500 text-sm">
        <Loader2 className="w-4 h-4 animate-spin inline mr-2" />Loading…
      </td>
    </tr>
  );
}

function ErrorBanner({ msg, onRetry }: { msg: string; onRetry: () => void }) {
  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-2 text-xs text-red-300">
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1">{msg}</span>
      <button onClick={onRetry} className="hover:text-white flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Retry</button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-tab: Overview
// ---------------------------------------------------------------------------

function Overview() {
  const { data: jobs, loading, error, reload } = useApi<WorkUnit[]>('/api/print-finance/work-units');
  const { data: costs } = useApi<CostEntry[]>('/api/print-finance/costs');
  const { data: revenue } = useApi<RevenueEntry[]>('/api/print-finance/revenue');

  const completed = (jobs || []).filter(w => w.status === 'complete');
  const totalRevenue = completed.reduce((s, w) => s + Number(w.revenue), 0);
  const totalCost = completed.reduce((s, w) => s + Number(w.direct_cost) + Number(w.overhead_alloc), 0);
  const grossProfit = totalRevenue - totalCost;
  const margin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const totalGrams = completed.reduce((s, w) => s + Number(w.grams), 0);
  const costPerGram = totalGrams > 0 ? totalCost / totalGrams : 0;

  // Fallback aggregate from revenue table if work units empty
  const revTotal = (revenue || []).reduce((s, r) => s + Number(r.revenue), 0);
  const costTotal = (costs || []).reduce((s, c) => s + Number(c.amount), 0);

  const displayRevenue = totalRevenue || revTotal;
  const displayCost = totalCost || costTotal;
  const displayProfit = displayRevenue - displayCost;
  const displayMargin = displayRevenue > 0 ? (displayProfit / displayRevenue) * 100 : 0;

  const kpis = [
    { label: 'Revenue (MTD)', value: money(displayRevenue), sub: `${completed.length} completed jobs`, icon: DollarSign, color: 'text-emerald-400' },
    { label: 'Gross Profit', value: money(displayProfit), sub: `${fmt(displayMargin, 1)}% margin`, icon: TrendingUp, color: displayMargin > 30 ? 'text-emerald-400' : 'text-amber-400' },
    { label: 'Total Cost', value: money(displayCost), sub: 'Direct + overhead', icon: Layers, color: 'text-rose-400' },
    { label: 'Cost / Gram', value: `$${fmt(costPerGram, 3)}`, sub: `${fmt(totalGrams)}g printed`, icon: Package, color: 'text-blue-400' },
  ];

  return (
    <div className="space-y-6">
      {error && <ErrorBanner msg={error} onRetry={reload} />}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs text-slate-400 font-medium">{k.label}</span>
                <Icon className={`w-4 h-4 ${k.color}`} />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {loading ? <span className="text-slate-500 text-base">—</span> : k.value}
              </div>
              <div className="text-xs text-slate-500">{k.sub}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-4">Recent Jobs</h3>
          {loading ? (
            <div className="text-sm text-slate-500 py-4 text-center"><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Loading…</div>
          ) : (jobs || []).length === 0 ? (
            <div className="text-sm text-slate-500 py-4 text-center">No jobs yet. Add work units to get started.</div>
          ) : (
            <div className="space-y-2">
              {(jobs || []).slice(0, 6).map(w => {
                const margin = Number(w.revenue) > 0 ? ((Number(w.revenue) - Number(w.direct_cost) - Number(w.overhead_alloc)) / Number(w.revenue)) * 100 : 0;
                return (
                  <div key={w.id} className="flex items-center gap-3 py-2 border-b border-slate-700/40 last:border-0">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${w.status === 'complete' ? 'bg-emerald-400' : w.status === 'failed' ? 'bg-red-400' : 'bg-blue-400'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-slate-200 truncate">{w.name}</div>
                      <div className="text-xs text-slate-500">{w.material} · {w.grams}g · {w.hours}h</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-medium text-white">{money(Number(w.revenue))}</div>
                      {Number(w.revenue) > 0 && (
                        <div className={`text-xs ${margin > 40 ? 'text-emerald-400' : 'text-amber-400'}`}>{fmt(margin, 0)}%</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-4">Job Status</h3>
          {(['complete', 'in-progress', 'queued', 'failed'] as const).map(s => {
            const count = (jobs || []).filter(w => w.status === s).length;
            const pct = (jobs || []).length > 0 ? Math.round((count / (jobs || []).length) * 100) : 0;
            return (
              <div key={s} className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="capitalize text-slate-400">{s}</span>
                  <span className="text-slate-300">{count}</span>
                </div>
                <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${s === 'complete' ? 'bg-emerald-500' : s === 'in-progress' ? 'bg-blue-500' : s === 'queued' ? 'bg-slate-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue vs Cost bar chart by channel */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-4">Revenue vs Cost by Job</h3>
          {(jobs || []).length === 0 ? (
            <div className="text-sm text-slate-500 py-8 text-center">No jobs yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={(jobs || []).slice(0, 7).map(w => ({
                name: w.name.length > 12 ? w.name.slice(0, 12) + '…' : w.name,
                Revenue: Number(w.revenue),
                Cost: Number(w.direct_cost) + Number(w.overhead_alloc),
              }))} margin={{ top: 0, right: 0, bottom: 0, left: -10 }}>
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: '#e2e8f0' }} />
                <Bar dataKey="Revenue" fill="#10b981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Cost" fill="#f43f5e" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Cost mix donut */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-4">Cost Mix</h3>
          {(() => {
            const directAmt = (jobs || []).reduce((s, w) => s + Number(w.direct_cost), 0);
            const overheadAmt = (jobs || []).reduce((s, w) => s + Number(w.overhead_alloc), 0);
            const pieData = [
              { name: 'Direct', value: directAmt },
              { name: 'Overhead', value: overheadAmt },
            ].filter(d => d.value > 0);
            const COLORS = ['#f43f5e', '#f59e0b'];
            return pieData.length === 0 ? (
              <div className="text-sm text-slate-500 py-8 text-center">No cost data yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} formatter={(v: number) => `$${v.toFixed(2)}`} />
                  <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-tab: Work Units
// ---------------------------------------------------------------------------

function WorkUnits() {
  const { data: jobs, loading, error, reload } = useApi<WorkUnit[]>('/api/print-finance/work-units');
  const [selected, setSelected] = useState<WorkUnit | null>(null);
  const [adding, setAdding] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<WorkUnit>>({});
  const [form, setForm] = useState({ job_id: '', name: '', material: '', grams: '', hours: '', status: 'queued', revenue: '', direct_cost: '', overhead_alloc: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.name) return;
    setSaving(true);
    await fetch('/api/print-finance/work-units', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, grams: parseFloat(form.grams)||0, hours: parseFloat(form.hours)||0, revenue: parseFloat(form.revenue)||0, direct_cost: parseFloat(form.direct_cost)||0, overhead_alloc: parseFloat(form.overhead_alloc)||0 }),
    });
    setSaving(false);
    setAdding(false);
    setForm({ job_id: '', name: '', material: '', grams: '', hours: '', status: 'queued', revenue: '', direct_cost: '', overhead_alloc: '', notes: '' });
    reload();
  };

  const startEdit = (w: WorkUnit) => { setEditId(w.id); setEditForm({ ...w }); setSelected(null); };
  const cancelEdit = () => { setEditId(null); setEditForm({}); };
  const saveEdit = async () => {
    if (!editId) return;
    setSaving(true);
    await fetch(`/api/print-finance/work-units/${editId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    setSaving(false); cancelEdit(); reload();
  };

  const del = async (id: number) => {
    await fetch(`/api/print-finance/work-units/${id}`, { method: 'DELETE' });
    if (selected?.id === id) setSelected(null);
    if (editId === id) cancelEdit();
    reload();
  };

  const months = Array.from(new Set((jobs || []).map(w => {
    const d = new Date(w.created_at as unknown as string);
    return isNaN(d.getTime()) ? '' : d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
  }).filter(Boolean))).sort().reverse();

  const visibleJobs = filterPeriod
    ? (jobs || []).filter(w => {
        const d = new Date(w.created_at as unknown as string);
        return d.toLocaleString('en-US', { month: 'short', year: 'numeric' }) === filterPeriod;
      })
    : (jobs || []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-white">All Work Units</h3>
        <div className="flex items-center gap-2 ml-auto">
          {months.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)}
                className="bg-slate-700/80 border border-slate-600/50 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50">
                <option value="">All periods</option>
                {months.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          )}
          <button onClick={() => setAdding(v => !v)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs rounded-lg transition-colors">
            <Plus className="w-3.5 h-3.5" /> New Job
          </button>
        </div>
      </div>

      {error && <ErrorBanner msg={error} onRetry={reload} />}

      {adding && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-white mb-3">New Work Unit</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            {[
              { key: 'job_id', label: 'Job ID', placeholder: 'e.g. JOB-001' },
              { key: 'name', label: 'Job Name', full: true },
              { key: 'material', label: 'Material' },
              { key: 'grams', label: 'Weight (g)', type: 'number' },
              { key: 'hours', label: 'Hours', type: 'number' },
              { key: 'revenue', label: 'Revenue ($)', type: 'number' },
              { key: 'direct_cost', label: 'Direct Cost ($)', type: 'number' },
              { key: 'overhead_alloc', label: 'Overhead ($)', type: 'number' },
            ].map(f => (
              <div key={f.key} className={f.full ? 'col-span-2 md:col-span-4' : ''}>
                <label className="text-xs text-slate-400 block mb-1">{f.label}</label>
                <input
                  type={f.type || 'text'}
                  placeholder={'placeholder' in f ? f.placeholder : undefined}
                  value={(form as Record<string, string>)[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full bg-white/[0.05] border border-slate-600/50 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50"
                />
              </div>
            ))}
            <div>
              <label className="text-xs text-slate-400 block mb-1">Status</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="w-full bg-slate-700 border border-slate-600/50 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none">
                {['queued', 'in-progress', 'complete', 'failed'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving || !form.name} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs rounded-lg transition-colors">
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => setAdding(false)} className="px-4 py-1.5 bg-slate-700 text-slate-300 text-xs rounded-lg hover:bg-slate-600 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                {['Job ID', 'Name', 'Material', 'Weight', 'Time', 'Status', 'Revenue', 'Direct Cost', 'Overhead', 'Margin', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-400 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <LoadingRow cols={11} /> : visibleJobs.length === 0 ? (
                <tr><td colSpan={11} className="px-4 py-8 text-center text-sm text-slate-500">{filterPeriod ? `No jobs in ${filterPeriod}.` : 'No jobs yet. Click "New Job" to add one.'}</td></tr>
              ) : visibleJobs.map(w => {
                const isEditing = editId === w.id;
                const profit = Number(w.revenue) - Number(w.direct_cost) - Number(w.overhead_alloc);
                const margin = Number(w.revenue) > 0 ? (profit / Number(w.revenue)) * 100 : 0;

                if (isEditing) return (
                  <tr key={w.id} className="border-b border-blue-500/20 bg-blue-500/5">
                    <td className="px-4 py-2"><input className="w-20 bg-white/[0.07] border border-blue-500/40 rounded px-2 py-1 text-xs font-mono text-white placeholder:text-slate-600" placeholder="JOB-001" value={String(editForm.job_id||'')} onChange={e => setEditForm(p => ({...p, job_id: e.target.value}))} /></td>
                    <td className="px-4 py-2"><input className="w-full bg-white/[0.07] border border-blue-500/40 rounded px-2 py-1 text-xs text-white" value={String(editForm.name||'')} onChange={e => setEditForm(p => ({...p, name: e.target.value}))} /></td>
                    <td className="px-4 py-2"><input className="w-24 bg-white/[0.07] border border-slate-600/40 rounded px-2 py-1 text-xs text-white" value={String(editForm.material||'')} onChange={e => setEditForm(p => ({...p, material: e.target.value}))} /></td>
                    <td className="px-4 py-2"><input type="number" className="w-16 bg-white/[0.07] border border-slate-600/40 rounded px-2 py-1 text-xs text-white" value={String(editForm.grams||'')} onChange={e => setEditForm(p => ({...p, grams: Number(e.target.value)}))} /></td>
                    <td className="px-4 py-2"><input type="number" className="w-14 bg-white/[0.07] border border-slate-600/40 rounded px-2 py-1 text-xs text-white" value={String(editForm.hours||'')} onChange={e => setEditForm(p => ({...p, hours: Number(e.target.value)}))} /></td>
                    <td className="px-4 py-2"><select className="bg-slate-700 border border-slate-600/40 rounded px-2 py-1 text-xs text-white" value={String(editForm.status||'queued')} onChange={e => setEditForm(p => ({...p, status: e.target.value as WorkUnit['status']}))}>
                      {['queued','in-progress','complete','failed'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select></td>
                    <td className="px-4 py-2"><input type="number" className="w-20 bg-white/[0.07] border border-slate-600/40 rounded px-2 py-1 text-xs text-white" value={String(editForm.revenue||'')} onChange={e => setEditForm(p => ({...p, revenue: Number(e.target.value)}))} /></td>
                    <td className="px-4 py-2"><input type="number" className="w-20 bg-white/[0.07] border border-slate-600/40 rounded px-2 py-1 text-xs text-white" value={String(editForm.direct_cost||'')} onChange={e => setEditForm(p => ({...p, direct_cost: Number(e.target.value)}))} /></td>
                    <td className="px-4 py-2"><input type="number" className="w-20 bg-white/[0.07] border border-slate-600/40 rounded px-2 py-1 text-xs text-white" value={String(editForm.overhead_alloc||'')} onChange={e => setEditForm(p => ({...p, overhead_alloc: Number(e.target.value)}))} /></td>
                    <td className="px-4 py-2 text-slate-500">—</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1">
                        <button onClick={saveEdit} disabled={saving} className="text-emerald-400 hover:text-emerald-300"><Save className="w-3.5 h-3.5" /></button>
                        <button onClick={cancelEdit} className="text-slate-500 hover:text-slate-300"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );

                return (
                  <tr key={w.id} onClick={() => setSelected(selected?.id === w.id ? null : w)}
                    className="border-b border-slate-700/30 last:border-0 hover:bg-white/[0.02] cursor-pointer transition-colors group">
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">{w.job_id}</td>
                    <td className="px-4 py-3 text-slate-200 font-medium max-w-[180px] truncate">{w.name}</td>
                    <td className="px-4 py-3 text-slate-400">{w.material}</td>
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{w.grams}g</td>
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{w.hours}h</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_COLOR[w.status] || 'bg-slate-500/20 text-slate-300'}`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white font-medium">{money(Number(w.revenue))}</td>
                    <td className="px-4 py-3 text-rose-300">{money(Number(w.direct_cost))}</td>
                    <td className="px-4 py-3 text-amber-300">{money(Number(w.overhead_alloc))}</td>
                    <td className="px-4 py-3">
                      {Number(w.revenue) > 0 ? (
                        <span className={`font-medium ${margin > 50 ? 'text-emerald-400' : margin > 30 ? 'text-blue-400' : 'text-amber-400'}`}>{fmt(margin, 1)}%</span>
                      ) : <span className="text-slate-500">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={e => { e.stopPropagation(); startEdit(w); }} className="text-slate-500 hover:text-blue-400 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={e => { e.stopPropagation(); del(w.id); }} className="text-slate-500 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="text-base font-semibold text-white">{selected.name}</h4>
              <p className="text-xs text-slate-400 mt-0.5">{selected.job_id} · {selected.material}</p>
            </div>
            <button onClick={() => setSelected(null)}><X className="w-4 h-4 text-slate-500 hover:text-white" /></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Revenue', value: money(Number(selected.revenue)), color: 'text-emerald-400' },
              { label: 'Direct Cost', value: money(Number(selected.direct_cost)), color: 'text-rose-400' },
              { label: 'Overhead', value: money(Number(selected.overhead_alloc)), color: 'text-amber-400' },
              { label: 'Net Profit', value: money(Number(selected.revenue) - Number(selected.direct_cost) - Number(selected.overhead_alloc)), color: Number(selected.revenue) > Number(selected.direct_cost) + Number(selected.overhead_alloc) ? 'text-emerald-400' : 'text-red-400' },
              { label: 'Weight', value: `${selected.grams}g`, color: 'text-slate-300' },
              { label: 'Print Time', value: `${selected.hours}h`, color: 'text-slate-300' },
              { label: 'Cost/gram', value: `$${fmt((Number(selected.direct_cost) + Number(selected.overhead_alloc)) / Math.max(Number(selected.grams), 1), 3)}`, color: 'text-slate-300' },
              { label: 'Rev/hour', value: money(Number(selected.revenue) / Math.max(Number(selected.hours), 1)), color: 'text-slate-300' },
            ].map(f => (
              <div key={f.label} className="bg-white/[0.03] rounded-lg p-3">
                <div className="text-xs text-slate-500 mb-1">{f.label}</div>
                <div className={`text-lg font-bold ${f.color}`}>{f.value}</div>
              </div>
            ))}
          </div>
          {selected.notes && <p className="text-xs text-slate-500 mt-3">{selected.notes}</p>}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-tab: Revenue
// ---------------------------------------------------------------------------

function Revenue() {
  const { data: entries, loading, error, reload } = useApi<RevenueEntry[]>('/api/print-finance/revenue');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ channel: '', period: '', jobs: '', units_grams: '', revenue: '', cogs: '' });
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<RevenueEntry>>({});
  const [saving, setSaving] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState('');

  const periods = Array.from(new Set((entries || []).map(r => r.period).filter(Boolean))).sort().reverse();
  const visible = filterPeriod ? (entries || []).filter(r => r.period === filterPeriod) : (entries || []);

  const save = async () => {
    if (!form.channel || !form.period) return;
    setSaving(true);
    await fetch('/api/print-finance/revenue', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, jobs: parseInt(form.jobs)||0, units_grams: parseFloat(form.units_grams)||0, revenue: parseFloat(form.revenue)||0, cogs: parseFloat(form.cogs)||0 }),
    });
    setSaving(false); setAdding(false);
    setForm({ channel: '', period: '', jobs: '', units_grams: '', revenue: '', cogs: '' });
    reload();
  };

  const startEdit = (r: RevenueEntry) => { setEditId(r.id); setEditForm({ ...r }); };
  const cancelEdit = () => { setEditId(null); setEditForm({}); };
  const saveEdit = async () => {
    if (!editId) return;
    setSaving(true);
    await fetch(`/api/print-finance/revenue/${editId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    setSaving(false); cancelEdit(); reload();
  };

  const del = async (id: number) => { await fetch(`/api/print-finance/revenue/${id}`, { method: 'DELETE' }); if (editId === id) cancelEdit(); reload(); };

  const totals = (filterPeriod ? visible : (entries || [])).reduce((acc, r) => ({ revenue: acc.revenue + Number(r.revenue), cogs: acc.cogs + Number(r.cogs) }), { revenue: 0, cogs: 0 });

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
              <div className="flex items-center justify-between mb-2"><span className="text-xs text-slate-400">{k.label}</span><Icon className={`w-4 h-4 ${k.color}`} /></div>
              <div className={`text-2xl font-bold ${k.color}`}>{loading ? '—' : k.value}</div>
            </div>
          );
        })}
      </div>

      {error && <ErrorBanner msg={error} onRetry={reload} />}

      <div className="flex items-center justify-between gap-3">
        {periods.length > 0 ? (
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)}
              className="bg-slate-700/80 border border-slate-600/50 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50">
              <option value="">All periods</option>
              {periods.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        ) : <div />}
        <button onClick={() => setAdding(v => !v)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs rounded-lg transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add Entry
        </button>
      </div>

      {adding && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
            {[
              { key: 'channel', label: 'Channel' },
              { key: 'period', label: 'Period (e.g. Mar 2026)' },
              { key: 'jobs', label: 'Jobs', type: 'number' },
              { key: 'units_grams', label: 'Units (g)', type: 'number' },
              { key: 'revenue', label: 'Revenue ($)', type: 'number' },
              { key: 'cogs', label: 'COGS ($)', type: 'number' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs text-slate-400 block mb-1">{f.label}</label>
                <input type={f.type || 'text'} value={(form as Record<string, string>)[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full bg-white/[0.05] border border-slate-600/50 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500/50" />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs rounded-lg transition-colors">{saving ? 'Saving…' : 'Save'}</button>
            <button onClick={() => setAdding(false)} className="px-4 py-1.5 bg-slate-700 text-slate-300 text-xs rounded-lg hover:bg-slate-600 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/50">
              {['Channel', 'Period', 'Jobs', 'Grams', 'Revenue', 'COGS', 'Gross Profit', 'Margin', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? <LoadingRow cols={9} /> : visible.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-sm text-slate-500">{filterPeriod ? `No entries for ${filterPeriod}.` : 'No entries yet.'}</td></tr>
            ) : visible.map(r => {
              const isEditing = editId === r.id;
              const gp = Number(r.revenue) - Number(r.cogs);
              const margin = Number(r.revenue) > 0 ? (gp / Number(r.revenue)) * 100 : 0;

              if (isEditing) return (
                <tr key={r.id} className="border-b border-blue-500/20 bg-blue-500/5">
                  <td className="px-3 py-2"><input className="w-28 bg-white/[0.07] border border-blue-500/40 rounded px-2 py-1 text-xs text-white" value={String(editForm.channel||'')} onChange={e => setEditForm(p => ({...p, channel: e.target.value}))} /></td>
                  <td className="px-3 py-2"><input className="w-24 bg-white/[0.07] border border-slate-600/40 rounded px-2 py-1 text-xs text-white" value={String(editForm.period||'')} onChange={e => setEditForm(p => ({...p, period: e.target.value}))} /></td>
                  <td className="px-3 py-2"><input type="number" className="w-14 bg-white/[0.07] border border-slate-600/40 rounded px-2 py-1 text-xs text-white" value={String(editForm.jobs||'')} onChange={e => setEditForm(p => ({...p, jobs: Number(e.target.value)}))} /></td>
                  <td className="px-3 py-2"><input type="number" className="w-16 bg-white/[0.07] border border-slate-600/40 rounded px-2 py-1 text-xs text-white" value={String(editForm.units_grams||'')} onChange={e => setEditForm(p => ({...p, units_grams: Number(e.target.value)}))} /></td>
                  <td className="px-3 py-2"><input type="number" className="w-20 bg-white/[0.07] border border-slate-600/40 rounded px-2 py-1 text-xs text-white" value={String(editForm.revenue||'')} onChange={e => setEditForm(p => ({...p, revenue: Number(e.target.value)}))} /></td>
                  <td className="px-3 py-2"><input type="number" className="w-20 bg-white/[0.07] border border-slate-600/40 rounded px-2 py-1 text-xs text-white" value={String(editForm.cogs||'')} onChange={e => setEditForm(p => ({...p, cogs: Number(e.target.value)}))} /></td>
                  <td className="px-3 py-2 text-slate-500">—</td>
                  <td className="px-3 py-2 text-slate-500">—</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button onClick={saveEdit} disabled={saving} className="text-emerald-400 hover:text-emerald-300"><Save className="w-3.5 h-3.5" /></button>
                      <button onClick={cancelEdit} className="text-slate-500 hover:text-slate-300"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              );

              return (
                <tr key={r.id} className="border-b border-slate-700/30 last:border-0 hover:bg-white/[0.02] transition-colors group">
                  <td className="px-4 py-3 text-slate-200 font-medium">{r.channel}</td>
                  <td className="px-4 py-3 text-slate-400">{r.period}</td>
                  <td className="px-4 py-3 text-slate-300">{r.jobs}</td>
                  <td className="px-4 py-3 text-slate-300">{fmt(Number(r.units_grams))}</td>
                  <td className="px-4 py-3 text-white font-medium">{money(Number(r.revenue))}</td>
                  <td className="px-4 py-3 text-rose-300">{money(Number(r.cogs))}</td>
                  <td className="px-4 py-3 text-emerald-300">{money(gp)}</td>
                  <td className="px-4 py-3"><span className={`font-medium ${margin > 70 ? 'text-emerald-400' : margin > 50 ? 'text-blue-400' : 'text-amber-400'}`}>{fmt(margin, 1)}%</span></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(r)} className="text-slate-500 hover:text-blue-400 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => del(r.id)} className="text-slate-500 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {(entries || []).length > 0 && (
            <tfoot>
              <tr className="border-t border-slate-600/50 bg-white/[0.02]">
                <td colSpan={4} className="px-4 py-3 text-xs font-semibold text-slate-300">TOTAL</td>
                <td className="px-4 py-3 text-white font-bold">{money(totals.revenue)}</td>
                <td className="px-4 py-3 text-rose-300 font-bold">{money(totals.cogs)}</td>
                <td className="px-4 py-3 text-emerald-300 font-bold">{money(totals.revenue - totals.cogs)}</td>
                <td className="px-4 py-3 text-blue-400 font-bold">{totals.revenue > 0 ? fmt(((totals.revenue - totals.cogs) / totals.revenue) * 100, 1) : '—'}%</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-tab: Costs (with CSV/XLSX upload)
// ---------------------------------------------------------------------------

function Costs() {
  const { data: entries, loading, error, reload } = useApi<CostEntry[]>('/api/print-finance/costs');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ category: '', type: 'direct' as CostEntry['type'], amount: '', period: '', notes: '' });
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<CostEntry>>({});
  const [saving, setSaving] = useState(false);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [uploadResult, setUploadResult] = useState<{ inserted: number; errors: { row: Record<string, string>; reason: string }[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [filterPeriod, setFilterPeriod] = useState('');
  const costPeriods = Array.from(new Set((entries || []).map(c => c.period).filter((p): p is string => !!p))).sort().reverse();
  const visibleEntries = filterPeriod ? (entries || []).filter(c => c.period === filterPeriod) : (entries || []);

  const direct = visibleEntries.filter(c => c.type === 'direct').reduce((s, c) => s + Number(c.amount), 0);
  const overhead = visibleEntries.filter(c => c.type === 'overhead').reduce((s, c) => s + Number(c.amount), 0);
  const fixed = visibleEntries.filter(c => c.type === 'fixed').reduce((s, c) => s + Number(c.amount), 0);

  const save = async () => {
    if (!form.category) return;
    setSaving(true);
    await fetch('/api/print-finance/costs', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) || 0 }),
    });
    setSaving(false); setAdding(false);
    setForm({ category: '', type: 'direct', amount: '', period: '', notes: '' });
    reload();
  };

  const startEdit = (c: CostEntry) => { setEditId(c.id); setEditForm({ ...c }); };
  const cancelEdit = () => { setEditId(null); setEditForm({}); };
  const saveEdit = async () => {
    if (!editId) return;
    setSaving(true);
    await fetch(`/api/print-finance/costs/${editId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    setSaving(false); cancelEdit(); reload();
  };

  const del = async (id: number) => { await fetch(`/api/print-finance/costs/${id}`, { method: 'DELETE' }); if (editId === id) cancelEdit(); reload(); };

  const handleUpload = async (file: File) => {
    setUploadState('uploading');
    setUploadResult(null);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/print-finance/costs/upload', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Upload failed');
      setUploadResult(json);
      setUploadState('done');
      reload();
    } catch (e: unknown) {
      setUploadResult({ inserted: 0, errors: [{ row: {}, reason: e instanceof Error ? e.message : 'Unknown error' }] });
      setUploadState('error');
    }
  };

  const downloadTemplate = () => { window.open('/api/print-finance/costs/template', '_blank'); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="grid grid-cols-4 gap-3 flex-1">
          {[
            { label: 'Direct Costs', value: money(direct), color: 'text-rose-400' },
            { label: 'Overhead', value: money(overhead), color: 'text-amber-400' },
            { label: 'Fixed Costs', value: money(fixed), color: 'text-blue-400' },
            { label: 'Total', value: money(direct + overhead + fixed), color: 'text-slate-200' },
          ].map(k => (
            <div key={k.label} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
              <div className="text-xs text-slate-400 mb-2">{k.label}</div>
              <div className={`text-xl font-bold ${k.color}`}>{loading ? '—' : k.value}</div>
            </div>
          ))}
        </div>
        {costPeriods.length > 0 && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)}
              className="bg-slate-700/80 border border-slate-600/50 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50">
              <option value="">All periods</option>
              {costPeriods.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        )}
      </div>

      {error && <ErrorBanner msg={error} onRetry={reload} />}

      {/* Upload Zone */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Import Cost Data</h3>
            <p className="text-xs text-slate-400 mt-0.5">Upload a <span className="text-slate-300 font-medium">.csv</span> or <span className="text-slate-300 font-medium">.xlsx</span> file with columns: <code className="text-blue-300 bg-blue-900/20 px-1 rounded text-xs">category, type, amount, period, notes</code></p>
          </div>
          <button onClick={downloadTemplate} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 rounded-lg transition-colors whitespace-nowrap">
            <Download className="w-3.5 h-3.5" /> CSV Template
          </button>
        </div>

        <div
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${uploadState === 'uploading' ? 'border-blue-500/40 bg-blue-500/5' : 'border-slate-600/40 hover:border-slate-500/60 hover:bg-white/[0.02]'}`}
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleUpload(f); }}
        >
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ''; }} />
          {uploadState === 'uploading' ? (
            <><Loader2 className="w-6 h-6 text-blue-400 animate-spin mx-auto mb-2" /><p className="text-sm text-blue-300">Uploading…</p></>
          ) : (
            <><Upload className="w-6 h-6 text-slate-500 mx-auto mb-2" /><p className="text-sm text-slate-400">Drag & drop or <span className="text-blue-400">click to browse</span></p><p className="text-xs text-slate-600 mt-1">Accepts .csv · .xlsx · .xls · max 5 MB</p></>
          )}
        </div>

        {uploadResult && (
          <div className={`mt-3 rounded-lg p-3 text-xs ${uploadState === 'done' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300' : 'bg-red-500/10 border border-red-500/20 text-red-300'}`}>
            {uploadState === 'done' && <p className="font-medium">✓ {uploadResult.inserted} row{uploadResult.inserted !== 1 ? 's' : ''} imported successfully.</p>}
            {uploadResult.errors.length > 0 && (
              <ul className="mt-1 space-y-0.5">
                {uploadResult.errors.map((e, i) => <li key={i}>✗ {e.reason}</li>)}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Manual Add + Table */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Cost Entries</h3>
        <button onClick={() => setAdding(v => !v)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs rounded-lg transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add Entry
        </button>
      </div>

      {adding && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
            {[
              { key: 'category', label: 'Category' },
              { key: 'amount', label: 'Amount ($)', type: 'number' },
              { key: 'period', label: 'Period' },
              { key: 'notes', label: 'Notes' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs text-slate-400 block mb-1">{f.label}</label>
                <input type={f.type || 'text'} value={(form as Record<string, string>)[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full bg-white/[0.05] border border-slate-600/50 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500/50" />
              </div>
            ))}
            <div>
              <label className="text-xs text-slate-400 block mb-1">Type</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as CostEntry['type'] }))}
                className="w-full bg-slate-700 border border-slate-600/50 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none">
                <option value="direct">Direct</option>
                <option value="overhead">Overhead</option>
                <option value="fixed">Fixed</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving || !form.category} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs rounded-lg transition-colors">{saving ? 'Saving…' : 'Save'}</button>
            <button onClick={() => setAdding(false)} className="px-4 py-1.5 bg-slate-700 text-slate-300 text-xs rounded-lg hover:bg-slate-600 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      <div className="border border-slate-700/50 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-700/50 bg-white/[0.03]">
              <th className="px-3 py-2.5 text-left text-slate-400 font-medium">Category</th>
              <th className="px-3 py-2.5 text-left text-slate-400 font-medium">Type</th>
              <th className="px-3 py-2.5 text-left text-slate-400 font-medium">Period</th>
              <th className="px-3 py-2.5 text-right text-slate-400 font-medium">Amount</th>
              <th className="px-3 py-2.5 text-left text-slate-400 font-medium">Notes</th>
              <th className="px-3 py-2.5 w-16" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-slate-500">Loading…</td></tr>
            )}
            {!loading && visibleEntries.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-slate-500">No cost entries yet.</td></tr>
            )}
            {visibleEntries.map(c => {
              const typeColor = c.type === 'direct' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                : c.type === 'overhead' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                : 'text-blue-400 bg-blue-500/10 border-blue-500/20';
              if (editId === c.id) return (
                <tr key={c.id} className="border-b border-slate-700/30 bg-blue-500/5">
                  <td className="px-3 py-2">
                    <input className="w-full bg-white/[0.07] border border-blue-500/40 rounded px-2 py-1 text-xs text-white" value={String(editForm.category||'')} onChange={e => setEditForm(p => ({...p, category: e.target.value}))} />
                  </td>
                  <td className="px-3 py-2">
                    <select className="bg-slate-700 border border-slate-600/40 rounded px-2 py-1 text-xs text-white" value={String(editForm.type||c.type)} onChange={e => setEditForm(p => ({...p, type: e.target.value as CostEntry['type']}))}>
                      <option value="direct">Direct</option>
                      <option value="overhead">Overhead</option>
                      <option value="fixed">Fixed</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input className="w-full bg-white/[0.07] border border-slate-600/40 rounded px-2 py-1 text-xs text-white" value={String(editForm.period||'')} onChange={e => setEditForm(p => ({...p, period: e.target.value}))} />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" className="w-full bg-white/[0.07] border border-slate-600/40 rounded px-2 py-1 text-xs text-white text-right" value={String(editForm.amount||'')} onChange={e => setEditForm(p => ({...p, amount: Number(e.target.value)}))} />
                  </td>
                  <td className="px-3 py-2">
                    <input className="w-full bg-white/[0.07] border border-slate-600/40 rounded px-2 py-1 text-xs text-white" value={String(editForm.notes||'')} onChange={e => setEditForm(p => ({...p, notes: e.target.value}))} />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <button onClick={saveEdit} disabled={saving} className="flex items-center gap-0.5 px-1.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded transition-colors disabled:opacity-50"><Save className="w-3 h-3" /></button>
                      <button onClick={cancelEdit} className="text-slate-500 hover:text-slate-300 transition-colors px-1"><X className="w-3 h-3" /></button>
                    </div>
                  </td>
                </tr>
              );
              return (
                <tr key={c.id} className="border-b border-slate-700/30 last:border-0 group hover:bg-white/[0.02]">
                  <td className="px-3 py-2.5 text-slate-200 font-medium">{c.category}</td>
                  <td className="px-3 py-2.5">
                    <span className={`px-1.5 py-0.5 rounded border text-xs font-medium ${typeColor}`}>{c.type}</span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-400">{c.period || <span className="text-slate-600">—</span>}</td>
                  <td className="px-3 py-2.5 text-right text-slate-200 font-medium tabular-nums">{money(Number(c.amount))}</td>
                  <td className="px-3 py-2.5 text-slate-400 max-w-[200px] truncate">{c.notes || <span className="text-slate-600">—</span>}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(c)} className="text-slate-500 hover:text-blue-400 transition-colors"><Pencil className="w-3 h-3" /></button>
                      <button onClick={() => del(c.id)} className="text-slate-500 hover:text-red-400 transition-colors"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Overhead Allocation Engine */}
      <OverheadAllocator />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overhead Allocation Engine (used inside Costs tab)
// ---------------------------------------------------------------------------

interface AllocPreview {
  total_overhead: number;
  total_hours: number;
  rate_per_hour: number;
  allocations: {
    id: number;
    job_id: string;
    name: string;
    hours: number;
    current_alloc: number;
    proposed_alloc: number;
  }[];
}

function OverheadAllocator() {
  const [preview, setPreview] = useState<AllocPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState<{ updated: number; rate_per_hour: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPreview = async () => {
    setLoadingPreview(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/print-finance/allocate-overhead/preview');
      if (!res.ok) { const j = await res.json(); throw new Error(j.error); }
      setPreview(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load preview');
    } finally {
      setLoadingPreview(false);
    }
  };

  const applyAllocation = async () => {
    setApplying(true);
    setError(null);
    try {
      const res = await fetch('/api/print-finance/allocate-overhead', { method: 'POST' });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error); }
      const json = await res.json();
      setResult(json);
      setPreview(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to apply allocation');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Overhead Allocation Engine</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Splits total overhead costs across work units proportionally by print hours.
            <span className="text-slate-500 ml-1">Formula: overhead × (job hours / total hours)</span>
          </p>
        </div>
        <button
          onClick={loadPreview}
          disabled={loadingPreview}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 text-xs rounded-lg transition-colors whitespace-nowrap disabled:opacity-50"
        >
          {loadingPreview ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
          Preview Allocation
        </button>
      </div>

      {error && <ErrorBanner msg={error} onRetry={loadPreview} />}

      {result && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-xs text-emerald-300 mb-4">
          ✓ Overhead allocated to {result.updated} work unit{result.updated !== 1 ? 's' : ''} at{' '}
          <span className="font-semibold">${Number(result.rate_per_hour).toFixed(3)}/hour</span>.
          Refresh Work Units to see updated values.
        </div>
      )}

      {preview && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total Overhead Pool', value: money(preview.total_overhead), color: 'text-amber-400' },
              { label: 'Total Print Hours', value: `${fmt(preview.total_hours, 1)}h`, color: 'text-blue-400' },
              { label: 'Rate / Hour', value: `$${Number(preview.rate_per_hour).toFixed(3)}`, color: 'text-slate-200' },
            ].map(k => (
              <div key={k.label} className="bg-white/[0.03] rounded-lg p-3">
                <div className="text-xs text-slate-500 mb-1">{k.label}</div>
                <div className={`text-lg font-bold ${k.color}`}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* Per-job preview table */}
          <div className="overflow-x-auto rounded-lg border border-slate-700/40">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-700/50">
                  {['Job', 'Hours', 'Hours %', 'Current Alloc', 'Proposed Alloc', 'Δ Change'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-slate-400 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.allocations.map(a => {
                  const pct = preview.total_hours > 0 ? (a.hours / preview.total_hours) * 100 : 0;
                  const delta = a.proposed_alloc - a.current_alloc;
                  return (
                    <tr key={a.id} className="border-b border-slate-700/30 last:border-0 hover:bg-white/[0.02]">
                      <td className="px-3 py-2">
                        <div className="text-slate-200 font-medium truncate max-w-[160px]">{a.name}</div>
                        <div className="text-slate-500 font-mono">{a.job_id}</div>
                      </td>
                      <td className="px-3 py-2 text-slate-300">{a.hours}h</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 bg-slate-700/50 rounded-full overflow-hidden flex-shrink-0">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-slate-400">{fmt(pct, 1)}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-slate-400">{money(a.current_alloc)}</td>
                      <td className="px-3 py-2 text-amber-300 font-semibold">{money(a.proposed_alloc)}</td>
                      <td className="px-3 py-2">
                        <span className={`font-medium ${Math.abs(delta) < 0.01 ? 'text-slate-500' : delta > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {delta > 0.01 ? '+' : ''}{money(delta)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {preview.total_overhead === 0 && (
            <div className="text-xs text-amber-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              No overhead costs found. Add overhead entries above first.
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={applyAllocation}
              disabled={applying || preview.total_overhead === 0 || preview.total_hours === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-xs font-medium rounded-lg transition-colors"
            >
              {applying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              Apply to All Work Units
            </button>
            <button onClick={() => setPreview(null)} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              Dismiss
            </button>
            <span className="text-xs text-slate-600">This will overwrite current overhead values.</span>
          </div>
        </div>
      )}

      {!preview && !result && !loadingPreview && (
        <div className="text-xs text-slate-500 mt-1">
          Click "Preview Allocation" to see how overhead would be distributed before applying.
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-tab: Inventory
// ---------------------------------------------------------------------------

function Inventory() {
  const { data: items, loading, error, reload } = useApi<InventoryItem[]>('/api/print-finance/inventory');
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<InventoryItem>>({});
  const [form, setForm] = useState({ name: '', type: 'filament', unit: 'kg', stock_qty: '', reorder_point: '', unit_cost: '', supplier: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.name) return;
    setSaving(true);
    await fetch('/api/print-finance/inventory', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, stock_qty: parseFloat(form.stock_qty)||0, reorder_point: parseFloat(form.reorder_point)||0, unit_cost: parseFloat(form.unit_cost)||0 }),
    });
    setSaving(false); setAdding(false);
    setForm({ name: '', type: 'filament', unit: 'kg', stock_qty: '', reorder_point: '', unit_cost: '', supplier: '', notes: '' });
    reload();
  };

  const startEdit = (item: InventoryItem) => { setEditId(item.id); setEditForm({ ...item }); };
  const cancelEdit = () => { setEditId(null); setEditForm({}); };
  const saveEdit = async () => {
    if (!editId) return;
    setSaving(true);
    await fetch(`/api/print-finance/inventory/${editId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    setSaving(false); cancelEdit(); reload();
  };

  const del = async (id: number) => { await fetch(`/api/print-finance/inventory/${id}`, { method: 'DELETE' }); if (editId === id) cancelEdit(); reload(); };

  const totalValue = (items || []).reduce((s, i) => s + Number(i.stock_qty) * Number(i.unit_cost), 0);
  const lowStock = (items || []).filter(i => Number(i.stock_qty) <= Number(i.reorder_point));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-2">Stock Value</div>
          <div className="text-2xl font-bold text-white">{loading ? '—' : money(totalValue)}</div>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-2">SKUs</div>
          <div className="text-2xl font-bold text-white">{(items || []).length}</div>
        </div>
        <div className={`bg-slate-800/60 border rounded-xl p-4 ${lowStock.length > 0 ? 'border-amber-500/40' : 'border-slate-700/50'}`}>
          <div className="text-xs text-slate-400 mb-2">Low Stock Alerts</div>
          <div className={`text-2xl font-bold ${lowStock.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>{lowStock.length}</div>
        </div>
      </div>

      {error && <ErrorBanner msg={error} onRetry={reload} />}
      {lowStock.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300">{lowStock.map(i => i.name).join(', ')} {lowStock.length === 1 ? 'is' : 'are'} at or below reorder point.</p>
        </div>
      )}

      <div className="flex justify-end">
        <button onClick={() => setAdding(v => !v)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs rounded-lg transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add Item
        </button>
      </div>

      {adding && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            {[
              { key: 'name', label: 'Name', full: true },
              { key: 'stock_qty', label: 'Stock Qty', type: 'number' },
              { key: 'reorder_point', label: 'Reorder @', type: 'number' },
              { key: 'unit_cost', label: 'Unit Cost ($)', type: 'number' },
              { key: 'supplier', label: 'Supplier' },
            ].map(f => (
              <div key={f.key} className={f.full ? 'col-span-2 md:col-span-4' : ''}>
                <label className="text-xs text-slate-400 block mb-1">{f.label}</label>
                <input type={f.type || 'text'} value={(form as Record<string, string>)[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full bg-white/[0.05] border border-slate-600/50 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500/50" />
              </div>
            ))}
            <div>
              <label className="text-xs text-slate-400 block mb-1">Type</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600/50 rounded-lg px-3 py-1.5 text-sm text-white">
                {['filament', 'resin', 'powder'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Unit</label>
              <select value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600/50 rounded-lg px-3 py-1.5 text-sm text-white">
                {['kg', 'g', 'L', 'mL', 'pcs'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving || !form.name} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs rounded-lg transition-colors">{saving ? 'Saving…' : 'Save'}</button>
            <button onClick={() => setAdding(false)} className="px-4 py-1.5 bg-slate-700 text-slate-300 text-xs rounded-lg hover:bg-slate-600 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                {['SKU', 'Name', 'Type', 'Stock', 'Reorder @', 'Unit Cost', 'Value', 'Supplier', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-400 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <LoadingRow cols={10} /> : (items || []).length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-sm text-slate-500">No inventory yet.</td></tr>
              ) : (items || []).map(item => {
                const isEditing = editId === item.id;
                const value = Number(item.stock_qty) * Number(item.unit_cost);
                const isLow = Number(item.stock_qty) <= Number(item.reorder_point);

                if (isEditing) return (
                  <tr key={item.id} className="border-b border-blue-500/20 bg-blue-500/5">
                    <td className="px-4 py-2 text-slate-400 font-mono text-xs">{item.sku}</td>
                    <td className="px-4 py-2"><input className="w-full bg-white/[0.07] border border-blue-500/40 rounded px-2 py-1 text-xs text-white" value={String(editForm.name||'')} onChange={e => setEditForm(p => ({...p, name: e.target.value}))} /></td>
                    <td className="px-4 py-2"><select className="bg-slate-700 border border-slate-600/40 rounded px-2 py-1 text-xs text-white" value={String(editForm.type||'filament')} onChange={e => setEditForm(p => ({...p, type: e.target.value as InventoryItem['type']}))}>
                      {['filament','resin','powder'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select></td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1">
                        <input type="number" className="w-16 bg-white/[0.07] border border-slate-600/40 rounded px-2 py-1 text-xs text-white" value={String(editForm.stock_qty||'')} onChange={e => setEditForm(p => ({...p, stock_qty: Number(e.target.value)}))} />
                        <select className="bg-slate-700 border border-slate-600/40 rounded px-1 py-1 text-xs text-white" value={String(editForm.unit||'kg')} onChange={e => setEditForm(p => ({...p, unit: e.target.value}))}>
                          {['kg','g','L','mL','pcs'].map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                    </td>
                    <td className="px-4 py-2"><input type="number" className="w-16 bg-white/[0.07] border border-slate-600/40 rounded px-2 py-1 text-xs text-white" value={String(editForm.reorder_point||'')} onChange={e => setEditForm(p => ({...p, reorder_point: Number(e.target.value)}))} /></td>
                    <td className="px-4 py-2"><input type="number" className="w-20 bg-white/[0.07] border border-slate-600/40 rounded px-2 py-1 text-xs text-white" value={String(editForm.unit_cost||'')} onChange={e => setEditForm(p => ({...p, unit_cost: Number(e.target.value)}))} /></td>
                    <td className="px-4 py-2 text-slate-500 text-xs">{money(Number(editForm.stock_qty||0)*Number(editForm.unit_cost||0))}</td>
                    <td className="px-4 py-2"><input className="w-28 bg-white/[0.07] border border-slate-600/40 rounded px-2 py-1 text-xs text-white" value={String(editForm.supplier||'')} onChange={e => setEditForm(p => ({...p, supplier: e.target.value}))} /></td>
                    <td className="px-4 py-2 text-slate-500">—</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1">
                        <button onClick={saveEdit} disabled={saving} className="text-emerald-400 hover:text-emerald-300"><Save className="w-3.5 h-3.5" /></button>
                        <button onClick={cancelEdit} className="text-slate-500 hover:text-slate-300"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );

                return (
                  <tr key={item.id} className="border-b border-slate-700/30 last:border-0 hover:bg-white/[0.02] transition-colors group">
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">{item.sku}</td>
                    <td className="px-4 py-3 text-slate-200 font-medium">{item.name}</td>
                    <td className="px-4 py-3"><span className="px-1.5 py-0.5 rounded text-xs bg-slate-700/50 text-slate-300 capitalize">{item.type}</span></td>
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{item.stock_qty} {item.unit}</td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{item.reorder_point} {item.unit}</td>
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{money(Number(item.unit_cost))}/{item.unit}</td>
                    <td className="px-4 py-3 text-white font-medium">{money(value)}</td>
                    <td className="px-4 py-3 text-slate-400">{item.supplier || '—'}</td>
                    <td className="px-4 py-3">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-400"><AlertCircle className="w-3 h-3" /> Reorder</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 className="w-3 h-3" /> OK</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(item)} className="text-slate-500 hover:text-blue-400 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => del(item.id)} className="text-slate-500 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-tab: Scenarios (client-side only)
// ---------------------------------------------------------------------------

function Scenarios() {
  const { data: costs } = useApi<CostEntry[]>('/api/print-finance/costs');
  const { data: revenue } = useApi<RevenueEntry[]>('/api/print-finance/revenue');
  const { data: saved, reload: reloadSaved } = useApi<SavedScenario[]>('/api/print-finance/scenarios');

  const [volumeMult, setVolumeMult] = useState(1.0);
  const [priceAdj, setPriceAdj] = useState(0);
  const [overheadAdj, setOverheadAdj] = useState(0);
  const [scenarioName, setScenarioName] = useState('');
  const [savingScenario, setSavingScenario] = useState(false);

  const baseRevenue = (revenue || []).reduce((s, r) => s + Number(r.revenue), 0) || 3130;
  const baseCost = (costs || []).reduce((s, c) => s + Number(c.amount), 0) || 2252;
  const baseMargin = baseRevenue > 0 ? ((baseRevenue - baseCost) / baseRevenue) * 100 : 0;

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

  const saveScenario = async () => {
    if (!scenarioName.trim()) return;
    setSavingScenario(true);
    await fetch('/api/print-finance/scenarios', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: scenarioName, volume_mult: volumeMult, price_adj: priceAdj, overhead_adj: overheadAdj }),
    });
    setSavingScenario(false);
    setScenarioName('');
    reloadSaved();
  };

  const loadScenario = (s: SavedScenario) => {
    setVolumeMult(Number(s.volume_mult));
    setPriceAdj(Number(s.price_adj));
    setOverheadAdj(Number(s.overhead_adj));
  };

  const deleteScenario = async (id: number) => {
    await fetch(`/api/print-finance/scenarios/${id}`, { method: 'DELETE' });
    reloadSaved();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-5">Scenario Parameters</h3>
          <div className="space-y-6">
            {sliders.map(s => (
              <div key={s.label}>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-400">{s.label}</span>
                  <span className="text-blue-400 font-semibold">{s.fmt(s.value)}</span>
                </div>
                <input type="range" min={s.min} max={s.max} step={s.step} value={s.value}
                  onChange={e => s.set(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-blue-500" />
                <div className="flex justify-between text-xs text-slate-600 mt-1">
                  <span>{s.fmt(s.min)}</span><span>{s.fmt(s.max)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-slate-700/50 space-y-2">
            <div className="flex gap-2">
              <input
                value={scenarioName}
                onChange={e => setScenarioName(e.target.value)}
                placeholder="Name this scenario…"
                className="flex-1 bg-white/[0.05] border border-slate-600/50 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50"
              />
              <button onClick={saveScenario} disabled={savingScenario || !scenarioName.trim()}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs rounded-lg transition-colors disabled:opacity-50">
                {savingScenario ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save
              </button>
            </div>
            <button onClick={() => { setVolumeMult(1); setPriceAdj(0); setOverheadAdj(0); }} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              Reset to baseline
            </button>
          </div>
        </div>

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
                    <div className="text-sm text-slate-400 mb-1">Base: <span className="text-slate-200">{r.pct ? `${fmt(r.base, 1)}%` : money(r.base)}</span></div>
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
            <div className="text-xs font-semibold text-slate-400 mb-1">Assessment</div>
            <div className={`text-sm font-medium ${scenMargin > 30 ? 'text-emerald-300' : scenMargin > 15 ? 'text-blue-300' : 'text-red-300'}`}>
              {scenMargin > 30 ? '✓ Healthy — target margin maintained' : scenMargin > 15 ? '⚠ Marginal — consider cost reduction' : '✗ Unprofitable — review pricing or volume'}
            </div>
            <div className="text-xs text-slate-500 mt-2">
              Incremental profit: {deltaProfit >= 0 ? '+' : ''}{money(deltaProfit)} · Revenue delta: {deltaRevenue >= 0 ? '+' : ''}{money(deltaRevenue)}
            </div>
          </div>
        </div>
      </div>

      {/* Saved Scenarios */}
      {(saved || []).length > 0 && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Saved Scenarios</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {(saved || []).map(s => (
              <div key={s.id} className="flex items-center justify-between bg-white/[0.03] border border-slate-700/40 rounded-lg px-3 py-2 group">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-slate-200 truncate">{s.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {Number(s.volume_mult).toFixed(2)}× vol · {Number(s.price_adj) >= 0 ? '+' : ''}{s.price_adj}% price · {Number(s.overhead_adj) >= 0 ? '+' : ''}{s.overhead_adj}% OH
                  </div>
                </div>
                <div className="flex gap-1 ml-2 flex-shrink-0">
                  <button onClick={() => loadScenario(s)} title="Load"
                    className="text-slate-500 hover:text-blue-400 transition-colors text-xs px-1.5 py-1 rounded hover:bg-blue-500/10">
                    Load
                  </button>
                  <button onClick={() => deleteScenario(s.id)} className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-tab: Reports
// ---------------------------------------------------------------------------

function Reports() {
  const { data: costs } = useApi<CostEntry[]>('/api/print-finance/costs');
  const { data: revenue } = useApi<RevenueEntry[]>('/api/print-finance/revenue');
  const { data: jobs } = useApi<WorkUnit[]>('/api/print-finance/work-units');

  const totalRevenue = (revenue || []).reduce((s, r) => s + Number(r.revenue), 0);
  const totalCogs = (revenue || []).reduce((s, r) => s + Number(r.cogs), 0);
  const totalCosts = (costs || []).reduce((s, c) => s + Number(c.amount), 0);
  const grossProfit = totalRevenue - totalCogs;
  const opex = (costs || []).filter(c => c.type === 'overhead').reduce((s, c) => s + Number(c.amount), 0);
  const ebitda = grossProfit - opex;
  const depreciation = (costs || []).find(c => c.category.toLowerCase().includes('depreciation'))?.amount || 0;
  const ebit = ebitda - Number(depreciation);

  const plLines = [
    { label: 'Revenue', value: totalRevenue, indent: 0, bold: false },
    { label: 'Cost of Goods Sold', value: -totalCogs, indent: 1, bold: false },
    { label: 'Gross Profit', value: grossProfit, indent: 0, bold: true },
    { label: 'Operating Expenses', value: -opex, indent: 1, bold: false },
    { label: 'EBITDA', value: ebitda, indent: 0, bold: true },
    { label: 'Depreciation (machines)', value: -Number(depreciation), indent: 1, bold: false },
    { label: 'EBIT', value: ebit, indent: 0, bold: true },
  ];

  const topJobs = (jobs || [])
    .filter(w => w.status === 'complete')
    .map(w => ({ ...w, profit: Number(w.revenue) - Number(w.direct_cost) - Number(w.overhead_alloc) }))
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 5);

  const channels = Array.from(new Set((revenue || []).map(r => r.channel))).map(ch => {
    const rows = (revenue || []).filter(r => r.channel === ch);
    const rev = rows.reduce((s, r) => s + Number(r.revenue), 0);
    const cogs = rows.reduce((s, r) => s + Number(r.cogs), 0);
    return { name: ch, revenue: rev, margin: rev > 0 ? ((rev - cogs) / rev) * 100 : 0 };
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Profit & Loss</h3>
            <span className="text-xs text-slate-500">3D Print Finance · MTD</span>
          </div>
          {totalRevenue === 0 ? (
            <div className="text-sm text-slate-500 py-4 text-center">Add revenue and cost entries to generate P&L.</div>
          ) : (
            <>
              <div className="space-y-1">
                {plLines.map((l, i) => (
                  <div key={i} className={`flex justify-between py-2 text-sm ${l.bold ? 'border-t border-slate-600/50 mt-1 font-semibold' : ''}`}>
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
                  <div className="text-lg font-bold text-emerald-400">{totalRevenue > 0 ? fmt((grossProfit / totalRevenue) * 100, 1) : '—'}%</div>
                </div>
                <div className="bg-white/[0.03] rounded-lg p-3 text-center">
                  <div className="text-xs text-slate-500">EBIT Margin</div>
                  <div className={`text-lg font-bold ${ebit > 0 ? 'text-blue-400' : 'text-red-400'}`}>{totalRevenue > 0 ? fmt((ebit / totalRevenue) * 100, 1) : '—'}%</div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Top Jobs by Profit</h3>
            {topJobs.length === 0 ? (
              <div className="text-xs text-slate-500 py-2">No completed jobs yet.</div>
            ) : topJobs.map(w => (
              <div key={w.id} className="flex items-center gap-3 py-2 border-b border-slate-700/30 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-slate-200 truncate">{w.name}</div>
                  <div className="text-xs text-slate-500">{w.material}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-emerald-400">{money(w.profit)}</div>
                  <div className="text-xs text-slate-500">{Number(w.revenue) > 0 ? fmt((w.profit / Number(w.revenue)) * 100, 0) : 0}% margin</div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Channel Summary</h3>
            {channels.length === 0 ? (
              <div className="text-xs text-slate-500 py-2">No revenue entries yet.</div>
            ) : channels.map(c => (
              <div key={c.name} className="flex items-center gap-3 py-2 border-b border-slate-700/30 last:border-0">
                <span className="text-sm text-slate-300 flex-1">{c.name}</span>
                <span className="text-sm text-white">{money(c.revenue)}</span>
                <span className={`text-xs w-12 text-right font-medium ${c.margin > 70 ? 'text-emerald-400' : 'text-blue-400'}`}>{fmt(c.margin, 1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Channel revenue chart */}
      {channels.length > 0 && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-4">Revenue & Gross Profit by Channel</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={channels.map(c => {
              const entries = (revenue || []).filter(r => r.channel === c.name);
              const cogs = entries.reduce((s, r) => s + Number(r.cogs), 0);
              return { name: c.name, Revenue: c.revenue, 'Gross Profit': c.revenue - cogs };
            })} margin={{ top: 0, right: 0, bottom: 0, left: -10 }}>
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="Revenue" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Gross Profit" fill="#10b981" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Job P&L Summary table */}
      <JobPnlSummary />

      <div className="flex flex-wrap gap-3">
        {[
          { label: 'Export P&L (.xlsx)',        url: '/api/print-finance/export/pl' },
          { label: 'Export Job Detail (.xlsx)', url: '/api/print-finance/export/jobs' },
          { label: 'Export Inventory (.xlsx)',  url: '/api/print-finance/export/inventory' },
        ].map(({ label, url }) => (
          <a key={label} href={url} download
            className="px-4 py-2 bg-slate-700/60 hover:bg-slate-700 border border-slate-600/50 text-slate-300 hover:text-white text-xs rounded-lg transition-colors flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" />
            {label}
          </a>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Job P&L Summary (used in Reports tab)
// ---------------------------------------------------------------------------

interface JobPnl {
  job_id: string;
  unit_count: number;
  hours: number;
  grams: number;
  materials: string[];
  revenue: number;
  direct_cost: number;
  overhead_alloc: number;
  total_cost: number;
  gross_profit: number;
  gross_margin_pct: number | null;
  fixed_alloc: number;
  contrib_profit: number;
  contrib_margin_pct: number | null;
  is_profitable: boolean;
}

interface JobPnlData {
  jobs: JobPnl[];
  totals: { revenue: number; direct_cost: number; overhead_alloc: number; gross_profit: number };
  total_fixed_costs: number;
}

function JobPnlSummary() {
  const [data, setData] = useState<JobPnlData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/print-finance/job-pnl');
      if (!res.ok) { const j = await res.json(); throw new Error(j.error); }
      setData(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load job P&L');
    } finally { setLoading(false); }
  };

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Job P&amp;L Summary</h3>
          <p className="text-xs text-slate-500 mt-0.5">Per-job gross margin and contribution margin (after fixed cost allocation)</p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs rounded-lg transition-colors disabled:opacity-50">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TrendingUp className="w-3.5 h-3.5" />}
          {data ? 'Refresh' : 'Load P&L'}
        </button>
      </div>

      {error && <ErrorBanner msg={error} onRetry={load} />}

      {!data && !loading && (
        <div className="text-xs text-slate-500">Click "Load P&L" to generate the job-level profitability breakdown.</div>
      )}

      {data && data.jobs.length === 0 && (
        <div className="text-xs text-slate-500 py-2">No work units have a Job ID assigned. Set job_id on work units to see this report.</div>
      )}

      {data && data.jobs.length > 0 && (
        <div className="space-y-4">
          {/* Totals */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Total Revenue', value: money(data.totals.revenue), color: 'text-blue-400' },
              { label: 'Direct Costs', value: money(data.totals.direct_cost), color: 'text-rose-400' },
              { label: 'Overhead Alloc', value: money(data.totals.overhead_alloc), color: 'text-amber-400' },
              { label: 'Gross Profit', value: money(data.totals.gross_profit), color: data.totals.gross_profit >= 0 ? 'text-emerald-400' : 'text-red-400' },
            ].map(k => (
              <div key={k.label} className="bg-white/[0.03] rounded-lg p-3">
                <div className="text-xs text-slate-500 mb-1">{k.label}</div>
                <div className={`text-base font-bold ${k.color}`}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* Per-job table */}
          <div className="overflow-x-auto rounded-lg border border-slate-700/40">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-700/50 bg-white/[0.02]">
                  <th className="text-left px-3 py-2 text-slate-400 font-medium">Job ID</th>
                  <th className="text-right px-3 py-2 text-slate-400 font-medium whitespace-nowrap">Units</th>
                  <th className="text-right px-3 py-2 text-slate-400 font-medium">Hours</th>
                  <th className="text-right px-3 py-2 text-slate-400 font-medium">Revenue</th>
                  <th className="text-right px-3 py-2 text-slate-400 font-medium whitespace-nowrap">Direct Cost</th>
                  <th className="text-right px-3 py-2 text-slate-400 font-medium whitespace-nowrap">Overhead</th>
                  <th className="text-right px-3 py-2 text-slate-400 font-medium whitespace-nowrap">Gross Profit</th>
                  <th className="text-right px-3 py-2 text-slate-400 font-medium whitespace-nowrap">Gross %</th>
                  <th className="text-right px-3 py-2 text-slate-400 font-medium whitespace-nowrap">Contrib %</th>
                  <th className="text-center px-3 py-2 text-slate-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.jobs.map(j => {
                  const gm = j.gross_margin_pct;
                  const cm = j.contrib_margin_pct;
                  const gmColor = gm === null ? 'text-slate-500' : gm >= 50 ? 'text-emerald-400' : gm >= 20 ? 'text-amber-400' : 'text-rose-400';
                  const cmColor = cm === null ? 'text-slate-500' : cm >= 30 ? 'text-emerald-400' : cm >= 0 ? 'text-amber-400' : 'text-rose-400';
                  return (
                    <tr key={j.job_id} className="border-b border-slate-700/30 last:border-0 hover:bg-white/[0.02]">
                      <td className="px-3 py-2">
                        <div className="font-mono text-slate-200 font-medium">{j.job_id}</div>
                        {j.materials.length > 0 && <div className="text-slate-600">{j.materials.join(', ')}</div>}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-400">{j.unit_count}</td>
                      <td className="px-3 py-2 text-right text-slate-400">{fmt(j.hours, 1)}h</td>
                      <td className="px-3 py-2 text-right text-blue-300">{money(j.revenue)}</td>
                      <td className="px-3 py-2 text-right text-slate-300">{money(j.direct_cost)}</td>
                      <td className="px-3 py-2 text-right text-amber-300/80">{money(j.overhead_alloc)}</td>
                      <td className={`px-3 py-2 text-right font-semibold ${j.gross_profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {j.gross_profit >= 0 ? money(j.gross_profit) : `(${money(-j.gross_profit)})`}
                      </td>
                      <td className={`px-3 py-2 text-right font-medium ${gmColor}`}>
                        {gm !== null ? `${fmt(gm, 1)}%` : '—'}
                      </td>
                      <td className={`px-3 py-2 text-right font-medium ${cmColor}`}>
                        {cm !== null ? `${fmt(cm, 1)}%` : '—'}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${j.is_profitable ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                          {j.is_profitable ? '✓ Profit' : '✗ Loss'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-600/50 bg-white/[0.02] font-semibold">
                  <td className="px-3 py-2 text-slate-300" colSpan={3}>Total ({data.jobs.length} jobs)</td>
                  <td className="px-3 py-2 text-right text-blue-300">{money(data.totals.revenue)}</td>
                  <td className="px-3 py-2 text-right text-slate-300">{money(data.totals.direct_cost)}</td>
                  <td className="px-3 py-2 text-right text-amber-300/80">{money(data.totals.overhead_alloc)}</td>
                  <td className={`px-3 py-2 text-right ${data.totals.gross_profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {data.totals.gross_profit >= 0 ? money(data.totals.gross_profit) : `(${money(-data.totals.gross_profit)})`}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-400">
                    {data.totals.revenue > 0 ? `${fmt((data.totals.gross_profit / data.totals.revenue) * 100, 1)}%` : '—'}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>

          {data.total_fixed_costs > 0 && (
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              Fixed costs of {money(data.total_fixed_costs)} are allocated by revenue share to compute contribution margin.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Sub-tab: Estimator (material rates + job cost calculator)
// ---------------------------------------------------------------------------

function Estimator() {
  const { data: rates, reload } = useApi<MaterialRate[]>('/api/print-finance/material-rates');
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<MaterialRate>>({});
  const [form, setForm] = useState({ material: '', machine_rate_per_hr: '', filament_cost_per_g: '', notes: '' });
  const [saving, setSaving] = useState(false);

  // Calculator state
  const [calcMaterial, setCalcMaterial] = useState('');
  const [calcGrams, setCalcGrams] = useState('');
  const [calcHours, setCalcHours] = useState('');
  const [calcMargin, setCalcMargin] = useState('40');

  const saveRate = async () => {
    if (!form.material) return;
    setSaving(true);
    await fetch('/api/print-finance/material-rates', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, machine_rate_per_hr: parseFloat(form.machine_rate_per_hr)||0, filament_cost_per_g: parseFloat(form.filament_cost_per_g)||0 }),
    });
    setSaving(false); setAdding(false);
    setForm({ material: '', machine_rate_per_hr: '', filament_cost_per_g: '', notes: '' });
    reload();
  };

  const startEdit = (r: MaterialRate) => { setEditId(r.id); setEditForm({ ...r }); };
  const cancelEdit = () => { setEditId(null); setEditForm({}); };
  const saveEdit = async () => {
    if (!editId) return;
    setSaving(true);
    await fetch(`/api/print-finance/material-rates/${editId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    setSaving(false); cancelEdit(); reload();
  };
  const del = async (id: number) => { await fetch(`/api/print-finance/material-rates/${id}`, { method: 'DELETE' }); reload(); };

  // Calculator logic
  const selectedRate = (rates || []).find(r => r.material === calcMaterial);
  const grams = parseFloat(calcGrams) || 0;
  const hours = parseFloat(calcHours) || 0;
  const targetMargin = parseFloat(calcMargin) || 40;
  const filamentCost = selectedRate ? grams * Number(selectedRate.filament_cost_per_g) : 0;
  const machineCost = selectedRate ? hours * Number(selectedRate.machine_rate_per_hr) : 0;
  const totalCost = filamentCost + machineCost;
  const suggestedPrice = targetMargin < 100 ? totalCost / (1 - targetMargin / 100) : 0;
  const hasCalc = selectedRate && (grams > 0 || hours > 0);

  return (
    <div className="space-y-6">
      {/* Material Rates Config */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Material Rate Configuration</h3>
            <p className="text-xs text-slate-400 mt-0.5">Machine cost per hour and filament cost per gram by material</p>
          </div>
          <button onClick={() => setAdding(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs rounded-lg transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Material
          </button>
        </div>

        {adding && (
          <div className="mb-4 bg-white/[0.03] border border-slate-700/40 rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              {[
                { key: 'material', label: 'Material Name', placeholder: 'PLA, PETG, Resin…' },
                { key: 'machine_rate_per_hr', label: 'Machine $/hr', type: 'number', placeholder: '2.50' },
                { key: 'filament_cost_per_g', label: 'Filament $/g', type: 'number', placeholder: '0.025' },
                { key: 'notes', label: 'Notes' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs text-slate-400 block mb-1">{f.label}</label>
                  <input type={f.type || 'text'} placeholder={f.placeholder}
                    value={(form as Record<string, string>)[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full bg-white/[0.05] border border-slate-600/50 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50" />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={saveRate} disabled={saving || !form.material}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs rounded-lg transition-colors">{saving ? 'Saving…' : 'Save'}</button>
              <button onClick={() => setAdding(false)} className="px-4 py-1.5 bg-slate-700 text-slate-300 text-xs rounded-lg hover:bg-slate-600 transition-colors">Cancel</button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto rounded-lg border border-slate-700/40">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700/50 bg-white/[0.02]">
                {['Material', 'Machine $/hr', 'Filament $/g', 'Notes', ''].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-slate-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(rates || []).length === 0 ? (
                <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-500">No materials configured yet. Add one above.</td></tr>
              ) : (rates || []).map(r => {
                if (editId === r.id) return (
                  <tr key={r.id} className="border-b border-blue-500/20 bg-blue-500/5">
                    <td className="px-3 py-2"><input className="w-28 bg-white/[0.07] border border-blue-500/40 rounded px-2 py-1 text-xs text-white" value={String(editForm.material||'')} onChange={e => setEditForm(p => ({...p, material: e.target.value}))} /></td>
                    <td className="px-3 py-2"><input type="number" className="w-20 bg-white/[0.07] border border-slate-600/40 rounded px-2 py-1 text-xs text-white" value={String(editForm.machine_rate_per_hr||'')} onChange={e => setEditForm(p => ({...p, machine_rate_per_hr: Number(e.target.value)}))} /></td>
                    <td className="px-3 py-2"><input type="number" className="w-20 bg-white/[0.07] border border-slate-600/40 rounded px-2 py-1 text-xs text-white" value={String(editForm.filament_cost_per_g||'')} onChange={e => setEditForm(p => ({...p, filament_cost_per_g: Number(e.target.value)}))} /></td>
                    <td className="px-3 py-2"><input className="w-32 bg-white/[0.07] border border-slate-600/40 rounded px-2 py-1 text-xs text-white" value={String(editForm.notes||'')} onChange={e => setEditForm(p => ({...p, notes: e.target.value}))} /></td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        <button onClick={saveEdit} disabled={saving} className="text-emerald-400 hover:text-emerald-300"><Save className="w-3.5 h-3.5" /></button>
                        <button onClick={cancelEdit} className="text-slate-500 hover:text-slate-300"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
                return (
                  <tr key={r.id} className="border-b border-slate-700/30 last:border-0 hover:bg-white/[0.02] group">
                    <td className="px-3 py-2 text-slate-200 font-medium">{r.material}</td>
                    <td className="px-3 py-2 text-slate-300">${Number(r.machine_rate_per_hr).toFixed(3)}/hr</td>
                    <td className="px-3 py-2 text-slate-300">${Number(r.filament_cost_per_g).toFixed(4)}/g</td>
                    <td className="px-3 py-2 text-slate-500 truncate max-w-[160px]">{r.notes || '—'}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(r)} className="text-slate-500 hover:text-blue-400 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => del(r.id)} className="text-slate-500 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Job Cost Calculator */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Job Cost Calculator</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inputs */}
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Material</label>
              <select value={calcMaterial} onChange={e => setCalcMaterial(e.target.value)}
                className="w-full bg-slate-700/80 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50">
                <option value="">— select material —</option>
                {(rates || []).map(r => <option key={r.material} value={r.material}>{r.material}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Weight (grams)</label>
                <input type="number" value={calcGrams} onChange={e => setCalcGrams(e.target.value)} placeholder="0"
                  className="w-full bg-white/[0.05] border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Print Hours</label>
                <input type="number" value={calcHours} onChange={e => setCalcHours(e.target.value)} placeholder="0"
                  className="w-full bg-white/[0.05] border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <label className="text-slate-400">Target Margin</label>
                <span className="text-blue-400 font-semibold">{calcMargin}%</span>
              </div>
              <input type="range" min={10} max={80} step={5} value={calcMargin} onChange={e => setCalcMargin(e.target.value)}
                className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-blue-500" />
              <div className="flex justify-between text-xs text-slate-600 mt-1"><span>10%</span><span>80%</span></div>
            </div>
            {selectedRate && (
              <div className="text-xs text-slate-500 bg-white/[0.03] rounded-lg p-3 space-y-0.5">
                <div>Machine rate: <span className="text-slate-300">${Number(selectedRate.machine_rate_per_hr).toFixed(3)}/hr</span></div>
                <div>Filament rate: <span className="text-slate-300">${Number(selectedRate.filament_cost_per_g).toFixed(4)}/g</span></div>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="space-y-3">
            {!hasCalc ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-500 text-center py-8">
                Select a material and enter weight or hours to estimate cost
              </div>
            ) : (
              <>
                {[
                  { label: 'Filament Cost', value: filamentCost, sub: `${fmt(grams, 1)}g × $${Number(selectedRate!.filament_cost_per_g).toFixed(4)}/g`, color: 'text-rose-400' },
                  { label: 'Machine Time Cost', value: machineCost, sub: `${fmt(hours, 2)}h × $${Number(selectedRate!.machine_rate_per_hr).toFixed(3)}/hr`, color: 'text-amber-400' },
                  { label: 'Total Cost', value: totalCost, sub: 'Before margin', color: 'text-slate-200', bold: true },
                ].map(k => (
                  <div key={k.label} className="bg-white/[0.03] border border-slate-700/40 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-400">{k.label}</div>
                      <div className="text-xs text-slate-600 mt-0.5">{k.sub}</div>
                    </div>
                    <div className={`text-lg font-bold ${k.color}`}>{money(k.value)}</div>
                  </div>
                ))}
                <div className={`rounded-xl p-4 border ${suggestedPrice > 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-700/30 border-slate-700/50'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-400 mb-0.5">Suggested Selling Price</div>
                      <div className="text-xs text-slate-500">At {calcMargin}% gross margin</div>
                    </div>
                    <div className="text-2xl font-bold text-emerald-400">{money(suggestedPrice)}</div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-emerald-500/20 grid grid-cols-2 gap-2 text-xs">
                    <div className="text-slate-500">Gross Profit: <span className="text-emerald-300 font-medium">{money(suggestedPrice - totalCost)}</span></div>
                    <div className="text-slate-500">Markup: <span className="text-emerald-300 font-medium">{totalCost > 0 ? fmt(((suggestedPrice - totalCost) / totalCost) * 100, 1) : '—'}%</span></div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-tab: Invoices
// ---------------------------------------------------------------------------

const INV_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  draft:     { label: 'Draft',     color: 'text-slate-400',  bg: 'bg-slate-500/10 border-slate-500/20' },
  sent:      { label: 'Sent',      color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
  paid:      { label: 'Paid',      color: 'text-emerald-400',bg: 'bg-emerald-500/10 border-emerald-500/20' },
  cancelled: { label: 'Cancelled', color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20' },
};

const EMPTY_FORM = {
  type: 'invoice' as 'invoice' | 'quote',
  client_name: '', client_company: '', client_email: '', client_address: '',
  issue_date: new Date().toISOString().split('T')[0],
  due_date: '', payment_terms: 'Net 30', notes: '',
  tax_rate: '0',
};

function Invoices() {
  const { data: invoices, reload } = useApi<Invoice[]>('/api/print-finance/invoices');
  const { data: workUnits } = useApi<WorkUnit[]>('/api/print-finance/work-units');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [selectedWUs, setSelectedWUs] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleWU = (id: number) =>
    setSelectedWUs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const chosenUnits = (workUnits || []).filter(w => selectedWUs.includes(w.id));
  const subtotal = chosenUnits.reduce((s, w) => s + Number(w.revenue), 0);
  const taxRate = parseFloat(form.tax_rate) || 0;
  const taxAmount = subtotal * taxRate / 100;
  const total = subtotal + taxAmount;

  const create = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/print-finance/invoices', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form, tax_rate: taxRate, subtotal, tax_amount: taxAmount, total,
          work_unit_ids: selectedWUs,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const inv: Invoice = await res.json();
      // Auto-download
      window.open(`/api/print-finance/invoices/${inv.id}/download`, '_blank');
      setCreating(false);
      setForm({ ...EMPTY_FORM });
      setSelectedWUs([]);
      reload();
    } finally { setSaving(false); }
  };

  const updateStatus = async (id: number, status: string) => {
    await fetch(`/api/print-finance/invoices/${id}/status`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    reload();
  };

  const del = async (id: number) => {
    await fetch(`/api/print-finance/invoices/${id}`, { method: 'DELETE' });
    reload();
  };

  const statusCounts = (invoices || []).reduce((acc, inv) => {
    acc[inv.status] = (acc[inv.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalPaid = (invoices || []).filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.total), 0);
  const totalOutstanding = (invoices || []).filter(i => i.status === 'sent').reduce((s, i) => s + Number(i.total), 0);

  return (
    <div className="space-y-5">
      {/* Summary bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Invoices', value: String((invoices || []).length), color: 'text-slate-200' },
          { label: 'Paid', value: money(totalPaid), color: 'text-emerald-400' },
          { label: 'Outstanding', value: money(totalOutstanding), color: 'text-amber-400' },
          { label: 'Draft', value: String(statusCounts['draft'] || 0), color: 'text-slate-400' },
        ].map(k => (
          <div key={k.label} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
            <div className="text-xs text-slate-500 mb-1">{k.label}</div>
            <div className={`text-xl font-bold ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* New Invoice button */}
      <div className="flex justify-end">
        <button onClick={() => setCreating(v => !v)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-medium rounded-lg transition-colors">
          <Plus className="w-3.5 h-3.5" />
          {creating ? 'Cancel' : 'New Invoice / Quote'}
        </button>
      </div>

      {/* Creation form */}
      {creating && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 space-y-5">
          <h3 className="text-sm font-semibold text-white">New {form.type === 'quote' ? 'Quotation' : 'Invoice'}</h3>

          {/* Type toggle */}
          <div className="flex gap-2">
            {(['invoice', 'quote'] as const).map(t => (
              <button key={t} onClick={() => setForm(p => ({ ...p, type: t }))}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${form.type === t ? 'bg-blue-600 text-white' : 'bg-slate-700/60 text-slate-400 hover:text-white'}`}>
                {t === 'invoice' ? 'Invoice' : 'Quotation'}
              </button>
            ))}
          </div>

          {/* Client details */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Client Details</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { key: 'client_name', label: 'Client Name', full: false },
                { key: 'client_company', label: 'Company', full: false },
                { key: 'client_email', label: 'Email', full: false },
                { key: 'client_address', label: 'Address', full: false },
                { key: 'issue_date', label: 'Issue Date', type: 'date', full: false },
                { key: 'due_date', label: 'Due Date', type: 'date', full: false },
                { key: 'payment_terms', label: 'Payment Terms', full: false },
                { key: 'tax_rate', label: 'Tax Rate (%)', type: 'number', full: false },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs text-slate-500 block mb-1">{f.label}</label>
                  <input type={f.type || 'text'}
                    value={(form as Record<string, string>)[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full bg-white/[0.05] border border-slate-600/50 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500/50" />
                </div>
              ))}
            </div>
            <div className="mt-3">
              <label className="text-xs text-slate-500 block mb-1">Notes</label>
              <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                className="w-full bg-white/[0.05] border border-slate-600/50 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500/50" />
            </div>
          </div>

          {/* Work unit selector */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Line Items — Select Work Units ({selectedWUs.length} selected)
            </h4>
            <div className="border border-slate-700/40 rounded-lg overflow-hidden max-h-56 overflow-y-auto">
              {(workUnits || []).length === 0 ? (
                <div className="text-xs text-slate-500 p-4 text-center">No work units found.</div>
              ) : (workUnits || []).map(w => {
                const checked = selectedWUs.includes(w.id);
                return (
                  <label key={w.id} className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors border-b border-slate-700/30 last:border-0 ${checked ? 'bg-blue-500/10' : 'hover:bg-white/[0.02]'}`}>
                    <input type="checkbox" checked={checked} onChange={() => toggleWU(w.id)}
                      className="rounded border-slate-600 text-blue-500 focus:ring-0 bg-slate-700" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-slate-200 font-medium truncate">{w.name}</div>
                      <div className="text-xs text-slate-500">{w.job_id && `${w.job_id} · `}{w.material} · {w.grams}g · {w.hours}h</div>
                    </div>
                    <div className="text-xs font-semibold text-white flex-shrink-0">{money(Number(w.revenue))}</div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Totals preview */}
          <div className="bg-white/[0.03] border border-slate-700/40 rounded-lg p-4 space-y-2">
            {[
              { label: 'Subtotal', value: subtotal },
              { label: `Tax (${taxRate}%)`, value: taxAmount },
            ].map(r => (
              <div key={r.label} className="flex justify-between text-xs text-slate-400">
                <span>{r.label}</span><span>{money(r.value)}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-600/50">
              <span>Total</span><span className="text-emerald-400">{money(total)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={create} disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              {saving ? 'Creating…' : `Create & Download ${form.type === 'quote' ? 'Quote' : 'Invoice'}`}
            </button>
            <span className="text-xs text-slate-500">Saves to list and downloads XLSX immediately</span>
          </div>
        </div>
      )}

      {/* Invoice list */}
      <div className="space-y-2">
        {(invoices || []).length === 0 && !creating && (
          <div className="text-sm text-slate-500 text-center py-10">No invoices yet. Click "New Invoice / Quote" to create one.</div>
        )}
        {(invoices || []).map(inv => {
          const st = INV_STATUS[inv.status] || INV_STATUS.draft;
          const isExpanded = expandedId === inv.id;
          return (
            <div key={inv.id} className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <Receipt className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white font-mono">{inv.invoice_no}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${st.color} ${st.bg}`}>{st.label}</span>
                    <span className="text-xs text-slate-500 capitalize">{inv.type}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {inv.client_name || 'No client'}{inv.client_company ? ` · ${inv.client_company}` : ''}
                    {inv.issue_date ? ` · ${new Date(inv.issue_date).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}` : ''}
                  </div>
                </div>
                <div className="text-base font-bold text-emerald-400 flex-shrink-0">{money(Number(inv.total))}</div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <a href={`/api/print-finance/invoices/${inv.id}/download`} target="_blank" rel="noreferrer"
                    className="p-1.5 text-slate-500 hover:text-blue-400 transition-colors" title="Download XLSX">
                    <Download className="w-3.5 h-3.5" />
                  </a>
                  <button onClick={() => setExpandedId(isExpanded ? null : inv.id)}
                    className="p-1.5 text-slate-500 hover:text-slate-200 transition-colors">
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-slate-700/50 px-4 py-3 space-y-3 bg-white/[0.02]">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    {[
                      { label: 'Subtotal', value: money(Number(inv.subtotal)) },
                      { label: `Tax ${Number(inv.tax_rate).toFixed(1)}%`, value: money(Number(inv.tax_amount)) },
                      { label: 'Due Date', value: inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : '—' },
                      { label: 'Payment Terms', value: inv.payment_terms || '—' },
                    ].map(f => (
                      <div key={f.label}>
                        <div className="text-slate-500 mb-0.5">{f.label}</div>
                        <div className="text-slate-200">{f.value}</div>
                      </div>
                    ))}
                  </div>
                  {inv.notes && <div className="text-xs text-slate-500">Notes: {inv.notes}</div>}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-slate-500">Status:</span>
                    {(['draft', 'sent', 'paid', 'cancelled'] as const).map(s => (
                      <button key={s} onClick={() => updateStatus(inv.id, s)}
                        className={`text-xs px-2 py-0.5 rounded border transition-colors capitalize ${inv.status === s ? `${INV_STATUS[s].color} ${INV_STATUS[s].bg}` : 'text-slate-500 border-slate-700/40 hover:border-slate-600/60 hover:text-slate-300'}`}>
                        {INV_STATUS[s].label}
                      </button>
                    ))}
                    <button onClick={() => del(inv.id)} className="ml-auto text-slate-600 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
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

// ---------------------------------------------------------------------------
// Sub-tab: Settings
// ---------------------------------------------------------------------------

const SETTING_GROUPS: { category: string; label: string }[] = [
  { category: 'general',   label: 'General' },
  { category: 'hr',        label: 'Labour Rates' },
  { category: 'overhead',  label: 'Overhead' },
  { category: 'pricing',   label: 'Pricing' },
  { category: 'invoicing', label: 'Invoicing' },
];

function Settings() {
  const { data: settings, reload } = useApi<PfSetting[]>('/api/print-finance/settings');
  const { data: rates, reload: reloadRates } = useApi<MaterialRate[]>('/api/print-finance/material-rates');
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [addRate, setAddRate] = useState(false);
  const [rateForm, setRateForm] = useState({ material: '', machine_rate_per_hr: '', filament_cost_per_g: '', notes: '' });

  // Sync settings into draft once loaded
  const settingsMap = Object.fromEntries((settings || []).map(s => [s.key, s.value]));
  const get = (key: string) => (draft[key] !== undefined ? draft[key] : settingsMap[key] ?? '');
  const set = (key: string, value: string) => setDraft(p => ({ ...p, [key]: value }));

  const saveSettings = async () => {
    if (!Object.keys(draft).length) return;
    setSaving(true);
    await fetch('/api/print-finance/settings', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    setSaving(false);
    setDraft({});
    reload();
  };

  const saveRate = async () => {
    await fetch('/api/print-finance/material-rates', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...rateForm, machine_rate_per_hr: parseFloat(rateForm.machine_rate_per_hr)||0, filament_cost_per_g: parseFloat(rateForm.filament_cost_per_g)||0 }),
    });
    setAddRate(false);
    setRateForm({ material: '', machine_rate_per_hr: '', filament_cost_per_g: '', notes: '' });
    reloadRates();
  };

  const delRate = async (id: number) => {
    await fetch(`/api/print-finance/material-rates/${id}`, { method: 'DELETE' });
    reloadRates();
  };

  const hasDraft = Object.keys(draft).length > 0;

  return (
    <div className="space-y-6">
      {/* General + HR + Pricing settings */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Platform Settings</h3>
          <button onClick={saveSettings} disabled={!hasDraft || saving}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 disabled:opacity-40 border border-blue-500/30 text-blue-300 text-xs font-medium rounded-lg transition-colors">
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            {saving ? 'Saving…' : hasDraft ? 'Save Changes' : 'Saved'}
          </button>
        </div>
        <div className="space-y-5">
          {SETTING_GROUPS.map(group => {
            const groupSettings = (settings || []).filter(s => s.category === group.category);
            if (!groupSettings.length) return null;
            return (
              <div key={group.category}>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{group.label}</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {groupSettings.map(s => (
                    <div key={s.key}>
                      <label className="text-xs text-slate-400 block mb-1">{s.label}</label>
                      <input
                        value={get(s.key)}
                        onChange={e => set(s.key, e.target.value)}
                        className="w-full bg-white/[0.05] border border-slate-600/50 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500/50" />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Material Rates */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Material Rates</h3>
          <button onClick={() => setAddRate(v => !v)}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-700/60 hover:bg-slate-700 border border-slate-600/50 text-slate-300 text-xs rounded-lg transition-colors">
            <Plus className="w-3.5 h-3.5" />{addRate ? 'Cancel' : 'Add Material'}
          </button>
        </div>

        {addRate && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 p-3 bg-white/[0.03] border border-slate-700/40 rounded-lg">
            {[
              { key: 'material', label: 'Material' },
              { key: 'machine_rate_per_hr', label: 'Machine Rate/hr ($)' },
              { key: 'filament_cost_per_g', label: 'Filament Cost/g ($)' },
              { key: 'notes', label: 'Notes' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs text-slate-500 block mb-1">{f.label}</label>
                <input value={(rateForm as Record<string,string>)[f.key]}
                  onChange={e => setRateForm(p => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full bg-white/[0.05] border border-slate-600/50 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500/50" />
              </div>
            ))}
            <div className="col-span-2 md:col-span-4">
              <button onClick={saveRate} disabled={!rateForm.material}
                className="px-4 py-1.5 bg-blue-600 disabled:opacity-40 text-white text-xs rounded-lg">
                Add Rate
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700/50">
                {['Material', 'Machine Rate/hr', 'Filament/g', 'Notes', ''].map(h => (
                  <th key={h} className="text-left py-2 px-2 text-slate-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(rates || []).map(r => (
                <tr key={r.id} className="border-b border-slate-700/30 hover:bg-white/[0.02]">
                  <td className="py-2 px-2 text-white font-medium">{r.material}</td>
                  <td className="py-2 px-2 text-slate-300">${Number(r.machine_rate_per_hr).toFixed(2)}</td>
                  <td className="py-2 px-2 text-slate-300">${Number(r.filament_cost_per_g).toFixed(4)}</td>
                  <td className="py-2 px-2 text-slate-500">{r.notes || '—'}</td>
                  <td className="py-2 px-2 text-right">
                    <button onClick={() => delRate(r.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {!(rates || []).length && (
                <tr><td colSpan={5} className="py-4 text-center text-slate-600 text-xs italic">No material rates configured.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// UploadModal — universal CSV/XLSX importer
// ---------------------------------------------------------------------------

const IMPORT_TYPES = [
  { id: 'revenue',    label: 'Revenue Entries',  desc: 'period, channel, revenue, notes' },
  { id: 'costs',      label: 'Cost Entries',     desc: 'category, type, amount, period, notes' },
  { id: 'work-units', label: 'Work Units',       desc: 'name, job_id, material, grams, hours, revenue, notes' },
  { id: 'inventory',  label: 'Inventory',        desc: 'material, brand, color, stock_kg, price_per_kg, supplier' },
] as const;

function UploadTab() {
  const [file, setFile] = useState<File | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importType, setImportType] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ inserted: number; errors: unknown[] } | null>(null);
  const [dragging, setDragging] = useState(false);

  const doPreview = async (f: File) => {
    setPreviewing(true);
    setPreview(null);
    setResult(null);
    const fd = new FormData();
    fd.append('file', f);
    try {
      const res = await fetch('/api/print-finance/import/preview', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPreview(data);
      setImportType(data.detected_type !== 'unknown' ? data.detected_type : '');
    } catch (e: unknown) {
      alert((e as Error).message);
    } finally { setPreviewing(false); }
  };

  const doImport = async () => {
    if (!file || !importType) return;
    setImporting(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', importType);
    try {
      const res = await fetch('/api/print-finance/import/confirm', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (e: unknown) {
      alert((e as Error).message);
    } finally { setImporting(false); }
  };

  const reset = () => { setFile(null); setPreview(null); setResult(null); setImportType(''); };

  const handleFile = (f: File) => { setFile(f); doPreview(f); };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const detectedLabel = IMPORT_TYPES.find(t => t.id === importType)?.label;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h3 className="text-base font-semibold text-white">Import Data</h3>
        <p className="text-sm text-slate-400 mt-1">
          Drop any CSV or Excel file — the system will analyse the columns and suggest where the data belongs.
          You can confirm or override before anything is saved.
        </p>
      </div>

      {/* Drop zone */}
      {!result && (
        <label
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-10 cursor-pointer transition-all ${
            dragging ? 'border-blue-400/70 bg-blue-500/10 scale-[1.01]' :
            file    ? 'border-blue-500/40 bg-blue-500/5' :
                      'border-slate-600/50 hover:border-slate-500/70 hover:bg-white/[0.02]'
          }`}>
          <div className={`p-3 rounded-xl transition-colors ${file ? 'bg-blue-500/15' : 'bg-slate-700/60'}`}>
            <Upload className={`w-6 h-6 ${file ? 'text-blue-400' : 'text-slate-400'}`} />
          </div>
          {file ? (
            <div className="text-center">
              <div className="text-sm font-medium text-white">{file.name}</div>
              <div className="text-xs text-slate-500 mt-0.5">{(file.size / 1024).toFixed(1)} KB</div>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-sm text-slate-300">Drop a CSV or Excel file here</div>
              <div className="text-xs text-slate-500 mt-0.5">or click to browse · .csv · .xlsx · .xls</div>
            </div>
          )}
          <input type="file" accept=".csv,.xlsx,.xls" className="hidden"
            onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
        </label>
      )}

      {previewing && (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
          Analysing file…
        </div>
      )}

      {/* Preview + type selection */}
      {preview && !result && (
        <div className="space-y-5">

          {/* Detected type banner */}
          <div className={`flex items-start gap-3 p-4 rounded-xl border ${importType ? 'bg-blue-500/8 border-blue-500/25' : 'bg-amber-500/8 border-amber-500/25'}`}>
            <div className={`p-1.5 rounded-lg mt-0.5 ${importType ? 'bg-blue-500/15' : 'bg-amber-500/15'}`}>
              {importType
                ? <CheckCircle2 className="w-4 h-4 text-blue-400" />
                : <AlertCircle className="w-4 h-4 text-amber-400" />}
            </div>
            <div>
              <div className="text-sm font-medium text-white">
                {importType
                  ? <>Detected: <span className="text-blue-300">{detectedLabel}</span> — {preview.row_count} rows</>
                  : <>Could not auto-detect data type — please select below</>}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Columns found: {preview.columns.join(' · ')}
              </div>
            </div>
          </div>

          {/* Type selector */}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Where should this data go?
            </div>
            <div className="grid grid-cols-2 gap-2">
              {IMPORT_TYPES.map(t => (
                <button key={t.id} onClick={() => setImportType(t.id)}
                  className={`text-left p-3.5 rounded-xl border transition-colors ${
                    importType === t.id
                      ? 'border-blue-500/60 bg-blue-500/10 ring-1 ring-blue-500/30'
                      : 'border-slate-700/40 hover:border-slate-600/60 bg-white/[0.02]'
                  }`}>
                  <div className={`text-xs font-semibold mb-1 ${importType === t.id ? 'text-blue-300' : 'text-slate-200'}`}>
                    {t.label}
                  </div>
                  <div className="text-xs text-slate-500 leading-relaxed font-mono">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Data preview table */}
          {preview.sample_rows.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Preview — first {preview.sample_rows.length} of {preview.row_count} rows
              </div>
              <div className="overflow-x-auto border border-slate-700/40 rounded-xl">
                <table className="text-xs w-full">
                  <thead>
                    <tr className="border-b border-slate-700/50 bg-white/[0.03]">
                      {preview.columns.map(c => (
                        <th key={c} className="px-3 py-2.5 text-left text-slate-400 font-medium whitespace-nowrap">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.sample_rows.map((row, i) => (
                      <tr key={i} className="border-b border-slate-700/30 last:border-0 hover:bg-white/[0.02]">
                        {preview.columns.map(c => (
                          <td key={c} className="px-3 py-2 text-slate-300 whitespace-nowrap max-w-[140px] truncate">{String(row[c] ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import CTA */}
          <div className="flex items-center gap-3">
            <button onClick={doImport} disabled={!importType || importing}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition-colors">
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {importing ? 'Importing…' : `Import ${preview.row_count} rows into ${detectedLabel || '…'}`}
            </button>
            <button onClick={reset} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              Upload different file
            </button>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-5 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-base font-semibold text-emerald-300">
                {(result as {inserted:number}).inserted} rows imported successfully
              </div>
              <div className="text-sm text-slate-400 mt-0.5">
                Data added to <span className="text-white">{detectedLabel}</span>. Switch to that tab to review.
              </div>
              {(result as {errors:unknown[]}).errors?.length > 0 && (
                <div className="text-xs text-amber-400 mt-2">
                  {(result as {errors:unknown[]}).errors.length} rows were skipped — check column names match the expected format.
                </div>
              )}
            </div>
          </div>
          <button onClick={reset}
            className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors">
            <Upload className="w-3.5 h-3.5" /> Import another file
          </button>
        </div>
      )}

      {/* Format guide */}
      {!file && (
        <div className="border border-slate-700/40 rounded-xl p-4 space-y-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Supported formats</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {IMPORT_TYPES.map(t => (
              <div key={t.id} className="text-xs">
                <span className="text-slate-300 font-medium">{t.label}:</span>{' '}
                <span className="text-slate-600 font-mono">{t.desc}</span>
              </div>
            ))}
          </div>
          <div className="text-xs text-slate-600">
            Column names are matched flexibly — spaces, underscores, and casing are ignored.
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-tab types + constants
// ---------------------------------------------------------------------------

const SUB_TABS: { id: SubTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'work-units', label: 'Work Units', icon: Layers },
  { id: 'revenue', label: 'Revenue', icon: TrendingUp },
  { id: 'costs', label: 'Costs', icon: DollarSign },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'scenarios', label: 'Scenarios', icon: FlaskConical },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'estimator', label: 'Estimator', icon: Calculator },
  { id: 'invoices', label: 'Invoices', icon: Receipt },
  { id: 'upload',   label: 'Upload',   icon: Upload },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export default function PrintFinance() {
  const [activeTab, setActiveTab] = useState<SubTab>('overview');

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">3D Print Finance</h2>
          <p className="text-sm text-slate-400 mt-0.5">Job costing · Revenue tracking · Inventory · Scenarios</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex-shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs text-emerald-300 font-medium">Live</span>
        </div>
      </div>

      <div className="flex gap-1 border-b border-slate-700/50 overflow-x-auto">
        {SUB_TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap -mb-px ${activeTab === tab.id ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'overview'   && <Overview />}
      {activeTab === 'work-units' && <WorkUnits />}
      {activeTab === 'revenue'    && <Revenue />}
      {activeTab === 'costs'      && <Costs />}
      {activeTab === 'inventory'  && <Inventory />}
      {activeTab === 'scenarios'  && <Scenarios />}
      {activeTab === 'reports'    && <Reports />}
      {activeTab === 'estimator'  && <Estimator />}
      {activeTab === 'invoices'   && <Invoices />}
      {activeTab === 'upload'     && <UploadTab />}
      {activeTab === 'settings'   && <Settings />}
    </div>
  );
}
