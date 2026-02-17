'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Zap, Target, TrendingUp } from 'lucide-react';

interface GrowthFlowchartProps {
  plan: any;
}

export function GrowthFlowchart({ plan }: GrowthFlowchartProps) {
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    funnel: true,
    loops: true,
    metrics: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Extract data from plan
  const block1 = plan?.block_1 || {};
  const block2 = plan?.block_2 || {};
  const block4 = plan?.block_4 || {};

  const funnelStages = block2.funnel_stages || {
    awareness: { description: 'Build awareness', channels: ['facebook', 'google'] },
    acquisition: { description: 'Drive signups', channels: ['search', 'social'] },
    activation: { description: 'First value delivery', channels: ['email', 'onboarding'] },
    revenue: { description: 'Monetization', channels: ['product', 'sales'] },
    retention: { description: 'Keep engaged', channels: ['email', 'product'] },
    referral: { description: 'Word of mouth', channels: ['community', 'rewards'] },
  };

  const growthLoops = block2.growth_loops || [];
  const keyKpis = block4.key_kpis || ['ctr', 'cpc', 'cvr', 'cpa', 'roas'];

  return (
    <div className="space-y-6">
      {/* Growth Hacking Model Header */}
      <div className="bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="w-6 h-6 text-emerald-400" />
          <h2 className="text-xl font-bold text-white">Growth Hacking Model</h2>
        </div>
        <p className="text-sm text-slate-300">
          Data-driven system connecting customer journey, metrics, and continuous optimization
        </p>
      </div>

      {/* AARRR Funnel */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('funnel')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-700/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">AARRR Funnel & Customer Journey</h3>
          </div>
          {expandedSections.funnel ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>

        {expandedSections.funnel && (
          <div className="border-t border-slate-700/50 px-6 py-4">
            {/* SVG Funnel Visualization */}
            <svg viewBox="0 0 1000 300" className="w-full h-auto mb-6">
              {/* Awareness */}
              <rect x="50" y="50" width="150" height="60" fill="#3b82f6" opacity="0.2" stroke="#3b82f6" strokeWidth="2" rx="4" />
              <text x="125" y="80" textAnchor="middle" className="fill-blue-300 font-semibold" fontSize="14">
                Awareness
              </text>
              <text x="125" y="102" textAnchor="middle" className="fill-blue-200" fontSize="11">
                Reach audience
              </text>

              {/* Arrow 1 */}
              <path d="M 200 80 L 250 80" stroke="#60a5fa" strokeWidth="2" markerEnd="url(#arrowhead)" />

              {/* Acquisition */}
              <rect x="250" y="50" width="130" height="60" fill="#8b5cf6" opacity="0.2" stroke="#8b5cf6" strokeWidth="2" rx="4" />
              <text x="315" y="80" textAnchor="middle" className="fill-purple-300 font-semibold" fontSize="14">
                Acquisition
              </text>
              <text x="315" y="102" textAnchor="middle" className="fill-purple-200" fontSize="11">
                Drive signups
              </text>

              {/* Arrow 2 */}
              <path d="M 380 80 L 430 80" stroke="#a78bfa" strokeWidth="2" markerEnd="url(#arrowhead)" />

              {/* Activation */}
              <rect x="430" y="50" width="130" height="60" fill="#10b981" opacity="0.2" stroke="#10b981" strokeWidth="2" rx="4" />
              <text x="495" y="80" textAnchor="middle" className="fill-green-300 font-semibold" fontSize="14">
                Activation
              </text>
              <text x="495" y="102" textAnchor="middle" className="fill-green-200" fontSize="11">
                First value
              </text>

              {/* Arrow 3 */}
              <path d="M 560 80 L 610 80" stroke="#34d399" strokeWidth="2" markerEnd="url(#arrowhead)" />

              {/* Revenue */}
              <rect x="610" y="50" width="130" height="60" fill="#f59e0b" opacity="0.2" stroke="#f59e0b" strokeWidth="2" rx="4" />
              <text x="675" y="80" textAnchor="middle" className="fill-amber-300 font-semibold" fontSize="14">
                Revenue
              </text>
              <text x="675" y="102" textAnchor="middle" className="fill-amber-200" fontSize="11">
                Monetization
              </text>

              {/* Arrow 4 */}
              <path d="M 740 80 L 790 80" stroke="#fbbf24" strokeWidth="2" markerEnd="url(#arrowhead)" />

              {/* Retention & Referral */}
              <rect x="790" y="50" width="140" height="60" fill="#ec4899" opacity="0.2" stroke="#ec4899" strokeWidth="2" rx="4" />
              <text x="860" y="80" textAnchor="middle" className="fill-pink-300 font-semibold" fontSize="14">
                Retention &amp;
              </text>
              <text x="860" y="100" textAnchor="middle" className="fill-pink-300 font-semibold" fontSize="14">
                Referral
              </text>

              {/* Feedback loop */}
              <path
                d="M 860 110 Q 860 150 500 180 Q 140 150 125 110"
                stroke="#06b6d4"
                strokeWidth="2"
                fill="none"
                strokeDasharray="5,5"
                markerEnd="url(#arrowhead-cyan)"
              />
              <text x="500" y="200" textAnchor="middle" className="fill-cyan-300" fontSize="11">
                Feedback &amp; Insights Loop
              </text>

              {/* Arrow marker definitions */}
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                  <polygon points="0 0, 10 3, 0 6" fill="#60a5fa" />
                </marker>
                <marker id="arrowhead-cyan" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                  <polygon points="0 0, 10 3, 0 6" fill="#06b6d4" />
                </marker>
              </defs>
            </svg>

            {/* Funnel Stages Details */}
            <div className="grid grid-cols-3 gap-3 mt-6">
              {Object.entries(funnelStages).map(([stage, data]: [string, any]) => (
                <div key={stage} className="bg-slate-700/30 rounded p-3">
                  <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-2">{stage}</p>
                  <p className="text-sm text-slate-200 mb-2">{data.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {(data.channels || []).map((channel: string) => (
                      <span key={channel} className="text-xs px-2 py-1 rounded bg-slate-600 text-slate-100">
                        {channel}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Growth Loops */}
      {growthLoops.length > 0 && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('loops')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-700/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-semibold text-white">Growth Loops & Viral Mechanics</h3>
            </div>
            {expandedSections.loops ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {expandedSections.loops && (
            <div className="border-t border-slate-700/50 px-6 py-4 space-y-4">
              {growthLoops.map((loop: any, idx: number) => (
                <div key={idx} className="bg-slate-700/20 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-white mb-2">{loop.name || `Growth Loop ${idx + 1}`}</h4>
                  <p className="text-sm text-slate-300 mb-3">{loop.description}</p>

                  {/* Loop nodes visualization */}
                  {loop.nodes && loop.nodes.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {loop.nodes.map((node: any, nodeIdx: number) => (
                        <div key={nodeIdx} className="flex items-center gap-2">
                          <div className="bg-emerald-600/30 border border-emerald-500 rounded px-3 py-1">
                            <span className="text-xs text-emerald-200 font-medium">{node}</span>
                          </div>
                          {nodeIdx < loop.nodes.length - 1 && (
                            <span className="text-emerald-400">→</span>
                          )}
                        </div>
                      ))}
                      <span className="text-slate-500 text-xs ml-2">(repeats)</span>
                    </div>
                  )}

                  {/* Opportunities */}
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-600/30">
                    <div className="bg-green-500/10 border border-green-500/30 rounded p-2">
                      <p className="text-xs text-green-300 font-semibold">↗ Scale & Automate</p>
                      <p className="text-xs text-green-200 mt-1">Increase investment and automation</p>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/30 rounded p-2">
                      <p className="text-xs text-red-300 font-semibold">✕ Kill & Learn</p>
                      <p className="text-xs text-red-200 mt-1">Shut down and extract learnings</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Key Metrics & KPIs */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('metrics')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-700/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">Tracking & KPIs</h3>
          </div>
          {expandedSections.metrics ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>

        {expandedSections.metrics && (
          <div className="border-t border-slate-700/50 px-6 py-4">
            {/* KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {keyKpis.map((kpi: string, idx: number) => (
                <div key={idx} className="bg-gradient-to-br from-slate-700/30 to-slate-700/10 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                    <p className="text-xs font-semibold text-slate-300 uppercase">{kpi}</p>
                  </div>
                  <p className="text-sm text-slate-400">
                    {kpi === 'ctr'
                      ? 'Click-through rate'
                      : kpi === 'cpc'
                      ? 'Cost per click'
                      : kpi === 'cvr'
                      ? 'Conversion rate'
                      : kpi === 'cpa'
                      ? 'Cost per acquisition'
                      : kpi === 'roas'
                      ? 'Return on ad spend'
                      : 'Metric'}
                  </p>
                </div>
              ))}
            </div>

            {/* Tracking Events */}
            {block4.tracking_events && block4.tracking_events.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-700/50">
                <p className="text-sm font-semibold text-slate-300 mb-3">Key Tracking Events</p>
                <ul className="space-y-2">
                  {block4.tracking_events.slice(0, 5).map((event: string, idx: number) => (
                    <li key={idx} className="text-sm text-slate-400">
                      • {event}
                    </li>
                  ))}
                  {block4.tracking_events.length > 5 && (
                    <li className="text-sm text-slate-500">+ {block4.tracking_events.length - 5} more</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Growth Opportunity Assessment */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/30 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wide">Growth Framework Strategy</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800/60 rounded p-4">
            <p className="text-xs font-semibold text-emerald-300 mb-2">Primary Engine</p>
            <p className="text-sm text-white font-medium">{block2.primary_engine || 'Paid advertising'}</p>
          </div>
          <div className="bg-slate-800/60 rounded p-4">
            <p className="text-xs font-semibold text-blue-300 mb-2">Supporting Channels</p>
            <p className="text-sm text-slate-200">
              {(block2.supporting_channels || ['organic', 'social', 'community']).slice(0, 2).join(', ')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
