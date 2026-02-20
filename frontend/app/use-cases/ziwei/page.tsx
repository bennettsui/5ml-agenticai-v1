'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight, ChevronRight, Sparkles, Brain, Zap, Database,
  GitBranch, BookOpen, TrendingUp, Users, Shield, Radar,
  LayoutDashboard, Activity, Home, History, Wand2,
} from 'lucide-react';
import ZiweiChartCalculatorWrapper from '@/components/ZiweiChartCalculatorWrapper';
import ZiweiChartAnalysis from '@/components/ZiweiChartAnalysis';
import ZiweiPredictions from '@/components/ZiweiPredictions';
import ZiweiKnowledgeManagement from '@/components/ZiweiKnowledgeManagement';
import ZiweiCelebrityValidation from '@/components/ZiweiCelebrityValidation';
import ZiweiChartLibrary from '@/components/ZiweiChartLibrary';
import ZiweiRuleManagement from '@/components/ZiweiRuleManagement';
import ZiweiKnowledgeViewer from '@/components/ZiweiKnowledgeViewer';
import ErrorBoundary from '@/components/ErrorBoundary';
import ZiweiTabErrorBoundary from '@/components/ZiweiTabErrorBoundary';

type ZiweiTab = 'overview' | 'analytics' | 'analysis' | 'predictions' | 'knowledge' | 'reference' | 'celebrity' | 'charts' | 'rules';

export default function ZiweiPage() {
  const getInitialTab = (): ZiweiTab => {
    if (typeof window === 'undefined') return 'overview';
    const p = new URLSearchParams(window.location.search).get('tab') as ZiweiTab | null;
    const valid: ZiweiTab[] = ['overview', 'analytics', 'analysis', 'predictions', 'knowledge', 'reference', 'celebrity', 'charts', 'rules'];
    return p && valid.includes(p) ? p : 'overview';
  };
  const [activeTab, setActiveTab] = useState<ZiweiTab>(getInitialTab());

  const tabs: { id: ZiweiTab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'analytics', label: '✨ Generator', icon: Sparkles },
    { id: 'analysis', label: '🔍 Analysis', icon: Brain },
    { id: 'predictions', label: '🔮 Predictions', icon: TrendingUp },
    { id: 'knowledge', label: '📚 Knowledge', icon: BookOpen },
    { id: 'reference', label: '📖 Reference', icon: BookOpen },
    { id: 'celebrity', label: '⭐ Celebrity', icon: Sparkles },
    { id: 'charts', label: '📊 Charts', icon: History },
    { id: 'rules', label: '🧿 Rules', icon: Wand2 },
  ];

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* HEADER */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Sparkles className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Ziwei Astrology</h1>
              <p className="text-xs text-slate-500">中州派紫微斗數</p>
            </div>
          </div>
          <Link href="/dashboard" className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-medium transition-colors">
            Dashboard <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* TAB NAVIGATION */}
      <nav className="bg-slate-800 border-b border-slate-700 sticky top-[65px] z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-6 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-1 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-amber-500 text-amber-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <main className={activeTab === 'overview' ? 'max-w-7xl mx-auto px-4 sm:px-6' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'}>
        {/* ================================================================ */}
        {/* OVERVIEW TAB                                                    */}
        {/* ================================================================ */}
        {activeTab === 'overview' && (
          <>
        {/* HERO */}
        <section className="py-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs text-amber-400 mb-4">
            <Sparkles className="w-3 h-3" /> Zhongzhou School (王亭之系統)
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            AI-Powered Birth Chart Analysis<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
              with Accuracy-Tracked Rules
            </span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
            Three-agent system for calculating 排盤 (birth charts), generating interpretations, and tracking accuracy<br />
            across traditional Chinese astrology rules with empirical validation.
          </p>
        </section>

        {/* CHART CALCULATOR */}
        <section className="py-12 mb-12">
          <ZiweiChartCalculatorWrapper />
        </section>

        {/* SYSTEM ARCHITECTURE */}
        <section className="py-12 mb-12">
          <h3 className="text-2xl font-bold text-white mb-8">Three-Agent Architecture</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Agent 1: Chart Engine */}
            <div className="group rounded-xl border border-slate-700/50 bg-slate-800/60 hover:bg-white/[0.02] p-6 transition-all">
              <div className="p-3 rounded-lg bg-blue-500/10 w-fit mb-4 group-hover:bg-blue-500/20 transition-colors">
                <Radar className="w-6 h-6 text-blue-400" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">ChartEngineAgent</h4>
              <p className="text-sm text-slate-400 mb-4">排盤引擎 - Birth chart calculation</p>
              <ul className="text-xs text-slate-500 space-y-2 mb-4">
                <li>✓ Calendar conversion (Gregorian ↔ Lunar)</li>
                <li>✓ Four Pillars (八字) calculation</li>
                <li>✓ Star placement (安星法)</li>
                <li>✓ Timing cycles (大限/流年)</li>
                <li>✓ Pattern identification</li>
              </ul>
              <div className="text-xs font-medium text-amber-400">~300 lines TypeScript</div>
            </div>

            {/* Agent 2: Interpretation */}
            <div className="group rounded-xl border border-slate-700/50 bg-slate-800/60 hover:bg-white/[0.02] p-6 transition-all">
              <div className="p-3 rounded-lg bg-teal-500/10 w-fit mb-4 group-hover:bg-teal-500/20 transition-colors">
                <Brain className="w-6 h-6 text-teal-400" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">InterpretationAgent</h4>
              <p className="text-sm text-slate-400 mb-4">解讀引擎 - Chart interpretation</p>
              <ul className="text-xs text-slate-500 space-y-2 mb-4">
                <li>✓ Rule matching & filtering</li>
                <li>✓ Consensus/disputed handling</li>
                <li>✓ Life dimension grouping</li>
                <li>✓ Accuracy metadata</li>
                <li>✓ Multi-language support</li>
              </ul>
              <div className="text-xs font-medium text-amber-400">~350 lines TypeScript</div>
            </div>

            {/* Agent 3: Evaluation */}
            <div className="group rounded-xl border border-slate-700/50 bg-slate-800/60 hover:bg-white/[0.02] p-6 transition-all">
              <div className="p-3 rounded-lg bg-green-500/10 w-fit mb-4 group-hover:bg-green-500/20 transition-colors">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">EvaluationAgent</h4>
              <p className="text-sm text-slate-400 mb-4">評估引擎 - Accuracy tracking</p>
              <ul className="text-xs text-slate-500 space-y-2 mb-4">
                <li>✓ Feedback processing</li>
                <li>✓ Statistics updates</li>
                <li>✓ Rule reviews</li>
                <li>✓ Accuracy reports</li>
                <li>✓ Continuous learning</li>
              </ul>
              <div className="text-xs font-medium text-amber-400">~350 lines TypeScript</div>
            </div>
          </div>

          {/* Data Flow Diagram */}
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-8">
            <p className="text-sm text-slate-400 font-medium mb-6">Data Flow & Integration</p>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <div className="px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded text-blue-300 font-medium">User Input</div>
                <ArrowRight className="w-4 h-4 text-slate-600" />
                <div className="px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded text-blue-300 font-medium">ChartEngine</div>
                <ArrowRight className="w-4 h-4 text-slate-600" />
                <div className="px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded text-green-300 font-medium">BirthChart</div>
              </div>
              <div className="flex items-center gap-3 text-sm ml-8">
                <ArrowRight className="w-4 h-4 text-slate-600 invisible" />
                <ArrowRight className="w-4 h-4 text-slate-600" />
                <div className="px-3 py-1.5 bg-teal-500/20 border border-teal-500/30 rounded text-teal-300 font-medium">Interpreter</div>
                <ArrowRight className="w-4 h-4 text-slate-600" />
                <div className="px-3 py-1.5 bg-orange-500/20 border border-orange-500/30 rounded text-orange-300 font-medium">Results</div>
              </div>
              <div className="flex items-center gap-3 text-sm ml-16">
                <ArrowRight className="w-4 h-4 text-slate-600 invisible" />
                <ArrowRight className="w-4 h-4 text-slate-600" />
                <div className="px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded text-green-300 font-medium">User Feedback</div>
                <ArrowRight className="w-4 h-4 text-slate-600" />
                <div className="px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded text-purple-300 font-medium">Evaluator</div>
              </div>
            </div>
          </div>
        </section>

        {/* KEY FEATURES */}
        <section className="py-12 mb-12">
          <h3 className="text-2xl font-bold text-white mb-8">System Features</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: Database,
                title: 'Comprehensive Rule Database',
                description: 'Digitized rules from Zhongzhou school with accuracy statistics (sample_size, match_rate, confidence_level)',
              },
              {
                icon: Shield,
                title: 'Consensus Tracking',
                description: 'Rules labeled as consensus, disputed, or minority view with source documentation and alternative interpretations',
              },
              {
                icon: Zap,
                title: 'Three Timing Cycles',
                description: 'Decade luck (大限), Annual luck (流年), Monthly luck (流月), and daily predictions with Four Transformations',
              },
              {
                icon: Brain,
                title: 'Intelligent Matching',
                description: 'Rules matched against birth chart features with dimension-based grouping and accuracy filtering',
              },
              {
                icon: Users,
                title: 'Feedback Integration',
                description: 'Collect user feedback (1-5 rating), track outcomes, and automatically update rule accuracy metrics',
              },
              {
                icon: TrendingUp,
                title: 'Statistical Validation',
                description: 'Empirical accuracy tracking enables continuous improvement and identifies rules needing review',
              },
            ].map((feature, i) => (
              <div key={i} className="rounded-lg border border-slate-700/50 bg-white/[0.02] p-6 hover:bg-white/[0.04] transition-colors">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <feature.icon className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">{feature.title}</h4>
                    <p className="text-xs text-slate-500">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* DATA MODELS */}
        <section className="py-12 mb-12">
          <h3 className="text-2xl font-bold text-white mb-8">Complete Data Models</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Birth Chart Model */}
            <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-6">
              <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                BirthChart Schema
              </h4>
              <div className="text-xs space-y-2 font-mono text-slate-400">
                <div>birth_info: {'{year, month, day, hour, minute}'}</div>
                <div>gan_zhi: {'{year, month, day, hour pillars}'}</div>
                <div>base_chart: {'{12 palaces, 14 primary stars}'}</div>
                <div>xuan_patterns: {'{patterns, 60-star-systems}'}</div>
                <div>decade_luck: {'[DecadeLuck[]]'}</div>
                <div>annual_luck: {'[AnnualLuck[]]'}</div>
                <div>monthly_luck: {'[MonthlyLuck[]] (optional)'}</div>
                <div>daily_luck: {'[DailyLuck[]] (optional)'}</div>
              </div>
              <div className="mt-4 text-xs text-slate-500">
                ~2-5MB per chart with all cycles
              </div>
            </div>

            {/* Interpretation Rule Model */}
            <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-6">
              <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-teal-400" />
                InterpretationRule Schema
              </h4>
              <div className="text-xs space-y-2 font-mono text-slate-400">
                <div>id, version, created_at</div>
                <div>scope: {'base|xuan|decade|annual'}</div>
                <div>condition: {'{stars, palaces, transforms}'}</div>
                <div>interpretation: {'{zh, en, short_form}'}</div>
                <div>dimension_tags: LifeDimension[]</div>
                <div>school: zhongzhou|feixing|etc</div>
                <div>consensus_label: consensus|disputed|minority</div>
                <div>source_refs: {'{books, blogs, teachers}'}</div>
                <div>statistics: {'{sample_size, match_rate}'}</div>
              </div>
              <div className="mt-4 text-xs text-slate-500">
                Full source tracking & accuracy metrics
              </div>
            </div>
          </div>
        </section>

        {/* RULES DATABASE */}
        <section className="py-12 mb-12">
          <h3 className="text-2xl font-bold text-white mb-8">Rules Database</h3>
          <p className="text-slate-400 mb-6">
            Comprehensive Zhongzhou school rules digitized from traditional texts and empirically validated:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
              <div className="text-sm font-medium text-green-400 mb-2">✓ Consensus Rules</div>
              <div className="text-xs text-slate-400">Widely accepted interpretations (match_rate ≥ 0.80)</div>
            </div>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
              <div className="text-sm font-medium text-amber-400 mb-2">⚠ Disputed Rules</div>
              <div className="text-xs text-slate-400">Different schools have alternate views (0.60-0.80)</div>
            </div>
            <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-4">
              <div className="text-sm font-medium text-purple-400 mb-2">◆ Minority Views</div>
              <div className="text-xs text-slate-400">Small subset of teachers (0.40-0.60)</div>
            </div>
            <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
              <div className="text-sm font-medium text-blue-400 mb-2">? Under Review</div>
              <div className="text-xs text-slate-400">Needs validation or revision (&lt; 0.40)</div>
            </div>
          </div>

          <button onClick={() => setActiveTab('rules')} className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors">
            View Rules Database <ChevronRight className="w-4 h-4" />
          </button>
        </section>

        {/* ROADMAP */}
        <section className="py-12 mb-12">
          <h3 className="text-2xl font-bold text-white mb-8">Implementation Roadmap</h3>

          <div className="space-y-4">
            {[
              { phase: 'Phase 1', label: '✅ Completed', desc: 'Backend design, type definitions, agent interfaces' },
              { phase: 'Phase 2', label: '🏗️ Building', desc: 'Frontend landing page, dashboard tab, chart visualizer' },
              { phase: 'Phase 3', label: '📋 Next', desc: 'Rules database, chart calculation algorithms, star placement' },
              { phase: 'Phase 4', label: '🎨 Next', desc: 'Chart visualization (12 palaces), interpretation UI' },
              { phase: 'Phase 5', label: '📊 Next', desc: 'Feedback loop, accuracy tracking, statistical reports' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-lg border border-slate-700/50 bg-white/[0.02]">
                <div className="text-xs font-bold text-amber-400 px-2 py-1 bg-amber-500/10 rounded border border-amber-500/20 w-fit">
                  {item.phase}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{item.label}</div>
                  <div className="text-xs text-slate-500">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* RESEARCH & SOURCES */}
        <section className="py-12 mb-12">
          <h3 className="text-2xl font-bold text-white mb-8">Research & Documentation</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-lg border border-slate-700/50 bg-white/[0.02] p-6">
              <h4 className="text-sm font-bold text-white mb-3">Zhongzhou School Resources</h4>
              <ul className="text-xs text-slate-400 space-y-2">
                <li>• 王亭之 《談星系列》 (Wang Tingzhi - Tan Xing Series)</li>
                <li>• 王亭之 《紫微斗數詳批》 (Detailed Interpretation)</li>
                <li>• Calendar-based month calculation method</li>
                <li>• Star placement method (安星法)</li>
                <li>• Four transformations (祿權科忌)</li>
              </ul>
            </div>

            <div className="rounded-lg border border-slate-700/50 bg-white/[0.02] p-6">
              <h4 className="text-sm font-bold text-white mb-3">Key Concepts</h4>
              <ul className="text-xs text-slate-400 space-y-2">
                <li>• 12 Palaces (十二宮) system</li>
                <li>• 14 Primary stars (十四主星)</li>
                <li>• Four Pillars (八字) calculation</li>
                <li>• Decade luck (大限) - 10-year cycles</li>
                <li>• Flow year (流年) annual analysis</li>
              </ul>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 mb-12">
          <div className="rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-3">Ready to Explore?</h3>
            <p className="text-slate-400 mb-6">
              Visit the dashboard to generate your birth chart and see interpretations based on our rule database
            </p>
            <button onClick={() => setActiveTab('analytics')} className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium transition-colors">
              Start Generator <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
          </>
        )}

        {/* ================================================================ */}
        {/* ZIWEI ANALYTICS TAB (GENERATOR)                                 */}
        {/* ================================================================ */}
        {activeTab === 'analytics' && (
          <ZiweiTabErrorBoundary tabName="Analytics">
            <ZiweiChartCalculatorWrapper />
          </ZiweiTabErrorBoundary>
        )}

        {/* ================================================================ */}
        {/* ZIWEI ANALYSIS TAB                                              */}
        {/* ================================================================ */}
        {activeTab === 'analysis' && (
          <ZiweiTabErrorBoundary tabName="Analysis">
            <ZiweiChartAnalysis />
          </ZiweiTabErrorBoundary>
        )}

        {/* ================================================================ */}
        {/* ZIWEI PREDICTIONS TAB                                           */}
        {/* ================================================================ */}
        {activeTab === 'predictions' && (
          <ZiweiTabErrorBoundary tabName="Predictions">
            <ZiweiPredictions />
          </ZiweiTabErrorBoundary>
        )}

        {/* ================================================================ */}
        {/* ZIWEI KNOWLEDGE MANAGEMENT TAB                                  */}
        {/* ================================================================ */}
        {activeTab === 'knowledge' && (
          <ZiweiTabErrorBoundary tabName="Knowledge">
            <ZiweiKnowledgeManagement />
          </ZiweiTabErrorBoundary>
        )}

        {/* ================================================================ */}
        {/* ZIWEI REFERENCE / KNOWLEDGE VIEWER TAB                           */}
        {/* ================================================================ */}
        {activeTab === 'reference' && (
          <ZiweiTabErrorBoundary tabName="Reference">
            <ZiweiKnowledgeViewer />
          </ZiweiTabErrorBoundary>
        )}

        {/* ================================================================ */}
        {/* ZIWEI CELEBRITY VALIDATION TAB                                  */}
        {/* ================================================================ */}
        {activeTab === 'celebrity' && (
          <ZiweiTabErrorBoundary tabName="Celebrity">
            <ZiweiCelebrityValidation />
          </ZiweiTabErrorBoundary>
        )}

        {/* ================================================================ */}
        {/* ZIWEI CHARTS TAB                                                */}
        {/* ================================================================ */}
        {activeTab === 'charts' && (
          <ZiweiTabErrorBoundary tabName="Charts">
            <ZiweiChartLibrary />
          </ZiweiTabErrorBoundary>
        )}

        {/* ================================================================ */}
        {/* ZIWEI RULES MANAGEMENT TAB                                     */}
        {/* ================================================================ */}
        {activeTab === 'rules' && (
          <ZiweiTabErrorBoundary tabName="Rules">
            <ZiweiRuleManagement />
          </ZiweiTabErrorBoundary>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-700/50 bg-slate-900/50 mt-20 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-xs text-slate-500">
          <p>Ziwei Astrology System • Based on Zhongzhou School (中州派) • Accuracy-tracked & empirically validated</p>
          <p className="mt-2">
            All interpretations include source documentation and statistical confidence metrics
          </p>
        </div>
      </footer>
    </div>
    </ErrorBoundary>
  );
}
