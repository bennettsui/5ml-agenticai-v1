'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Home, ArrowLeft, DollarSign, TrendingUp, BarChart3, Camera, Newspaper,
  FileSpreadsheet, BookOpen, Megaphone, Bot, Zap, Calculator, Layers,
  ChevronDown, ChevronUp, Info, ExternalLink,
} from 'lucide-react';

// ────────────────────────────────────────────
// Types (mirroring /stats response)
// ────────────────────────────────────────────

interface ModelCall {
  model: string;
  calls: number;
  avgTokensIn: number;
  avgTokensOut: number;
  costPerMillion: { input: number; output: number };
  fixedCost?: number;
}

interface CostEstimate {
  perRun: {
    description: string;
    modelCalls: ModelCall[];
    totalTokens: { input: number; output: number };
    estimatedCost: number;
    notes?: string;
  };
  daily: { runsPerDay: number; estimatedCost: number; notes?: string };
  monthly: { runsPerMonth: number; estimatedCost: number; notes?: string; tenantsMultiplier?: string; weeklyDigestCost?: number; totalMonthly?: number };
}

interface UseCase {
  id: string;
  name: string;
  description: string;
  agentCount: number;
  status: string;
  costEstimate?: CostEstimate;
}

interface TokenPricing {
  [model: string]: { input?: number; output?: number; note?: string };
}

interface MonthlySummary {
  [key: string]: number | string;
}

interface StatsData {
  useCases?: UseCase[];
  tokenPricing?: TokenPricing;
  monthlyCostSummary?: MonthlySummary;
}

// ────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────

const useCaseMeta: Record<string, { icon: React.ElementType; color: string; gradient: string }> = {
  marketing:    { icon: Megaphone,       color: 'purple', gradient: 'from-purple-500 to-pink-600' },
  ads:          { icon: BarChart3,       color: 'blue',   gradient: 'from-blue-500 to-cyan-600' },
  photobooth:   { icon: Camera,          color: 'pink',   gradient: 'from-pink-500 to-rose-600' },
  intelligence: { icon: Newspaper,       color: 'teal',   gradient: 'from-teal-500 to-cyan-600' },
  accounting:   { icon: FileSpreadsheet, color: 'orange', gradient: 'from-orange-500 to-amber-600' },
  crm:          { icon: BookOpen,        color: 'emerald',gradient: 'from-emerald-500 to-teal-600' },
};

function fmt(n: number, decimals = 2) {
  return n.toFixed(decimals);
}

function fmtTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function calcModelCost(mc: ModelCall): number {
  const inputCost = (mc.calls * mc.avgTokensIn / 1_000_000) * mc.costPerMillion.input;
  const outputCost = (mc.calls * mc.avgTokensOut / 1_000_000) * mc.costPerMillion.output;
  return inputCost + outputCost + (mc.fixedCost || 0) * mc.calls;
}

// ────────────────────────────────────────────
// Page
// ────────────────────────────────────────────

export default function CostAnalysisPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/stats');
        if (res.ok) setStats(await res.json());
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  const toggle = (id: string) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  const useCases = stats?.useCases || [];
  const pricing = stats?.tokenPricing || {};
  const summary = stats?.monthlyCostSummary || {};
  const totalBase = typeof summary.totalBase === 'number' ? summary.totalBase : 0;

  // Aggregate numbers
  const totalPerMonth = useCases.reduce((s, uc) => {
    const m = uc.costEstimate?.monthly;
    return s + (m?.totalMonthly ?? m?.estimatedCost ?? 0);
  }, 0);
  const totalTokensPerRun = useCases.reduce((s, uc) => {
    const t = uc.costEstimate?.perRun.totalTokens;
    return s + (t ? t.input + t.output : 0);
  }, 0);
  const totalModelCalls = useCases.reduce((s, uc) => {
    return s + (uc.costEstimate?.perRun.modelCalls.reduce((a, mc) => a + mc.calls, 0) ?? 0);
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calculator className="w-6 h-6 text-emerald-500" />
                  Cost Analysis
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">Detailed LLM cost breakdown per use case</p>
              </div>
            </div>
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              <Home className="w-3.5 h-3.5" /> Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ━━━ Top-line Summary ━━━ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard icon={DollarSign} label="Total Monthly" value={`$${fmt(totalPerMonth)}`} sub="all use cases combined" color="emerald" />
          <SummaryCard icon={Bot} label="Use Cases" value={useCases.length.toString()} sub={`${useCases.reduce((s, u) => s + u.agentCount, 0)} agents total`} color="purple" />
          <SummaryCard icon={Zap} label="Model Calls / Run" value={totalModelCalls.toString()} sub="across all pipelines" color="blue" />
          <SummaryCard icon={Layers} label="Tokens / Run" value={fmtTokens(totalTokensPerRun)} sub="input + output combined" color="amber" />
        </div>

        {/* ━━━ Monthly Stacked Bar ━━━ */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Monthly Cost Breakdown</h2>
          <div className="space-y-3">
            {useCases.map(uc => {
              const m = uc.costEstimate?.monthly;
              const cost = m?.totalMonthly ?? m?.estimatedCost ?? 0;
              const pct = totalPerMonth > 0 ? (cost / totalPerMonth) * 100 : 0;
              const meta = useCaseMeta[uc.id] || { icon: Bot, color: 'slate', gradient: 'from-slate-500 to-slate-600' };
              const Icon = meta.icon;
              return (
                <div key={uc.id} className="flex items-center gap-4">
                  <div className="w-32 shrink-0 flex items-center gap-2">
                    <Icon className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{uc.name}</span>
                  </div>
                  <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-6 overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${meta.gradient} rounded-full flex items-center justify-end pr-2 transition-all duration-500`}
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    >
                      {pct > 10 && <span className="text-[10px] text-white font-bold">${fmt(cost)}</span>}
                    </div>
                  </div>
                  <div className="w-20 text-right shrink-0">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">${fmt(cost)}</span>
                    <span className="text-[10px] text-slate-500 block">{fmt(pct, 1)}%</span>
                  </div>
                </div>
              );
            })}
            {/* Total */}
            <div className="flex items-center gap-4 pt-3 border-t border-slate-200 dark:border-slate-700">
              <div className="w-32 shrink-0 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">TOTAL</span>
              </div>
              <div className="flex-1" />
              <div className="w-20 text-right">
                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">${fmt(totalPerMonth)}</span>
                <span className="text-[10px] text-slate-500 block">/month</span>
              </div>
            </div>
          </div>
          {summary.notes && (
            <p className="text-xs text-slate-500 mt-4 flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              {String(summary.notes)}
            </p>
          )}
        </div>

        {/* ━━━ Per Use-Case Deep Dives ━━━ */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Per Use-Case Breakdown</h2>

          {useCases.map(uc => {
            const ce = uc.costEstimate;
            if (!ce) return null;
            const meta = useCaseMeta[uc.id] || { icon: Bot, color: 'slate', gradient: 'from-slate-500 to-slate-600' };
            const Icon = meta.icon;
            const isExpanded = expanded[uc.id] !== false; // default open

            return (
              <div key={uc.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Header */}
                <button
                  onClick={() => toggle(uc.id)}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${meta.gradient}`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-slate-900 dark:text-white">{uc.name}</h3>
                      <p className="text-xs text-slate-500">{uc.description} &middot; {uc.agentCount} agents</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-lg font-bold text-slate-900 dark:text-white">${fmt(ce.perRun.estimatedCost)}<span className="text-xs font-normal text-slate-500">/run</span></div>
                      <div className="text-xs text-slate-500">~${fmt(ce.monthly.totalMonthly ?? ce.monthly.estimatedCost)}/mo</div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>

                {/* Detail */}
                {isExpanded && (
                  <div className="px-6 pb-6 space-y-5">
                    {/* What triggers a run */}
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Per-Run Scenario</div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{ce.perRun.description}</p>
                      {ce.perRun.notes && (
                        <p className="text-xs text-slate-500 mt-1 flex items-start gap-1"><Info className="w-3 h-3 shrink-0 mt-0.5" />{ce.perRun.notes}</p>
                      )}
                    </div>

                    {/* Model calls table */}
                    <div>
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Model Calls per Run</div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-600">
                              <th className="text-left py-2 px-3 text-slate-500 font-medium">Model</th>
                              <th className="text-center py-2 px-3 text-slate-500 font-medium">Calls</th>
                              <th className="text-right py-2 px-3 text-slate-500 font-medium">Tokens In</th>
                              <th className="text-right py-2 px-3 text-slate-500 font-medium">Tokens Out</th>
                              <th className="text-right py-2 px-3 text-slate-500 font-medium">Input $/1M</th>
                              <th className="text-right py-2 px-3 text-slate-500 font-medium">Output $/1M</th>
                              <th className="text-right py-2 px-3 text-slate-500 font-medium">Fixed</th>
                              <th className="text-right py-2 px-3 text-slate-500 font-bold">Cost</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ce.perRun.modelCalls.map((mc, i) => {
                              const cost = calcModelCost(mc);
                              return (
                                <tr key={i} className="border-b border-slate-100 dark:border-slate-700">
                                  <td className="py-2 px-3 font-medium text-slate-700 dark:text-slate-300">{mc.model}</td>
                                  <td className="py-2 px-3 text-center text-slate-600 dark:text-slate-400">{mc.calls}</td>
                                  <td className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-400">{fmtTokens(mc.avgTokensIn * mc.calls)}</td>
                                  <td className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-400">{fmtTokens(mc.avgTokensOut * mc.calls)}</td>
                                  <td className="py-2 px-3 text-right text-slate-500">${mc.costPerMillion.input.toFixed(2)}</td>
                                  <td className="py-2 px-3 text-right text-slate-500">${mc.costPerMillion.output.toFixed(2)}</td>
                                  <td className="py-2 px-3 text-right text-slate-500">{mc.fixedCost ? `$${mc.fixedCost.toFixed(2)}` : '-'}</td>
                                  <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white">${cost.toFixed(4)}</td>
                                </tr>
                              );
                            })}
                            <tr className="bg-slate-50 dark:bg-slate-700/50 font-bold">
                              <td className="py-2 px-3 text-slate-700 dark:text-slate-300">Total</td>
                              <td className="py-2 px-3 text-center text-slate-600 dark:text-slate-400">
                                {ce.perRun.modelCalls.reduce((s, mc) => s + mc.calls, 0)}
                              </td>
                              <td className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-400">{fmtTokens(ce.perRun.totalTokens.input)}</td>
                              <td className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-400">{fmtTokens(ce.perRun.totalTokens.output)}</td>
                              <td colSpan={3} />
                              <td className="py-2 px-3 text-right text-emerald-700 dark:text-emerald-400">${fmt(ce.perRun.estimatedCost, 4)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Scaling projection */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <ProjectionCard
                        label="Per Run"
                        value={`$${fmt(ce.perRun.estimatedCost, 4)}`}
                        detail={`${fmtTokens(ce.perRun.totalTokens.input + ce.perRun.totalTokens.output)} tokens`}
                      />
                      <ProjectionCard
                        label="Daily"
                        value={`$${fmt(ce.daily.estimatedCost)}`}
                        detail={`${ce.daily.runsPerDay} runs/day`}
                        note={ce.daily.notes}
                      />
                      <ProjectionCard
                        label="Monthly"
                        value={`$${fmt(ce.monthly.totalMonthly ?? ce.monthly.estimatedCost)}`}
                        detail={`${ce.monthly.runsPerMonth} runs/month`}
                        note={ce.monthly.notes || ce.monthly.tenantsMultiplier}
                        extra={ce.monthly.weeklyDigestCost ? `Includes $${fmt(ce.monthly.weeklyDigestCost)}/wk digest` : undefined}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ━━━ Token Pricing Reference ━━━ */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Token Pricing Reference</h2>
          <p className="text-xs text-slate-500 mb-4">All prices are per 1 million tokens. These are the rates used in the cost calculations above.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-600">
                  <th className="text-left py-2 px-3 text-slate-500 font-medium">Model</th>
                  <th className="text-right py-2 px-3 text-slate-500 font-medium">Input $/1M tokens</th>
                  <th className="text-right py-2 px-3 text-slate-500 font-medium">Output $/1M tokens</th>
                  <th className="text-left py-2 px-3 text-slate-500 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(pricing).map(([model, p]) => (
                  <tr key={model} className="border-b border-slate-100 dark:border-slate-700">
                    <td className="py-2 px-3 font-medium font-mono text-slate-700 dark:text-slate-300">{model}</td>
                    <td className="py-2 px-3 text-right text-slate-600 dark:text-slate-400">
                      {p.input != null ? `$${p.input.toFixed(2)}` : '-'}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-600 dark:text-slate-400">
                      {p.output != null ? `$${p.output.toFixed(2)}` : '-'}
                    </td>
                    <td className="py-2 px-3 text-slate-500">{p.note || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ━━━ How Costs Are Calculated ━━━ */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">How Costs Are Calculated</h2>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2 text-xs uppercase tracking-wider">Per-Run Formula</h3>
                <div className="font-mono text-xs bg-white dark:bg-slate-800 rounded p-3 border border-slate-200 dark:border-slate-600">
                  <div>cost = <span className="text-blue-600 dark:text-blue-400">SUM</span> for each model call:</div>
                  <div className="pl-4 mt-1">
                    <div>(calls x avg_tokens_in / 1M) x input_price</div>
                    <div>+ (calls x avg_tokens_out / 1M) x output_price</div>
                    <div>+ fixed_cost x calls <span className="text-slate-400">(if any)</span></div>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2 text-xs uppercase tracking-wider">Monthly Projection</h3>
                <div className="font-mono text-xs bg-white dark:bg-slate-800 rounded p-3 border border-slate-200 dark:border-slate-600">
                  <div>monthly = per_run x runs_per_month</div>
                  <div className="mt-1 text-slate-400">+ weekly_digest_cost x 4 <span>(if applicable)</span></div>
                  <div className="mt-1 text-slate-400">x tenants <span>(for multi-tenant use cases)</span></div>
                </div>
              </div>
            </div>
            <div className="space-y-2 text-xs">
              <p><strong>Cost optimization strategies used:</strong></p>
              <ul className="list-disc pl-5 space-y-1 text-slate-500">
                <li><strong>Model routing</strong> — DeepSeek Reasoner ($0.14/1M in) for most agent tasks vs Claude Sonnet ($3.00/1M in) only for vision/complex tasks</li>
                <li><strong>Haiku fallback</strong> — Cheaper Claude Haiku ($0.25/1M in) for simple classification and extraction</li>
                <li><strong>Batch processing</strong> — Intelligence scans batch 50 articles per run instead of individual calls</li>
                <li><strong>Self-hosted GPU</strong> — ComfyUI image generation at ~$0.03/image (electricity only) vs $0.04-0.08 for cloud APIs</li>
                <li><strong>API-only sync</strong> — Daily ad data sync uses REST APIs (free), AI analysis only runs weekly</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────

function SummaryCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub: string; color: string;
}) {
  const colors: Record<string, string> = {
    emerald: 'from-emerald-500 to-emerald-600',
    purple: 'from-purple-500 to-purple-600',
    blue: 'from-blue-500 to-blue-600',
    amber: 'from-amber-500 to-amber-600',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color] || colors.emerald} rounded-xl shadow-lg p-5 text-white`}>
      <Icon className="w-6 h-6 mb-2 opacity-80" />
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs opacity-90 font-medium">{label}</div>
      <div className="text-[10px] opacity-70 mt-0.5">{sub}</div>
    </div>
  );
}

function ProjectionCard({ label, value, detail, note, extra }: {
  label: string; value: string; detail: string; note?: string; extra?: string;
}) {
  return (
    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-xl font-bold text-slate-900 dark:text-white">{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{detail}</div>
      {note && <div className="text-[10px] text-slate-400 mt-1">{note}</div>}
      {extra && <div className="text-[10px] text-blue-500 dark:text-blue-400 mt-0.5">{extra}</div>}
    </div>
  );
}
