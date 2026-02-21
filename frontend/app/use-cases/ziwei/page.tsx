'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight, ChevronRight, Sparkles, Brain, Zap, Database,
  GitBranch, BookOpen, TrendingUp, Users, Shield, Radar,
  Activity, Star, Newspaper, BarChart2, Moon,
  Layers, Eye, Compass, Clock,
} from 'lucide-react';
import GenerationPanel from '@/components/GenerationPanel';
import ZiweiChartAnalysis from '@/components/ZiweiChartAnalysis';
import ZiweiPredictions from '@/components/ZiweiPredictions';
import ZiweiKnowledgeManagement from '@/components/ZiweiKnowledgeManagement';
import ZiweiCelebrityValidation from '@/components/ZiweiCelebrityValidation';
import ErrorBoundary from '@/components/ErrorBoundary';
import ZiweiTabErrorBoundary from '@/components/ZiweiTabErrorBoundary';

// ── Dark teal/cyan theme tokens ───────────────────────────────────────────────
const P = {
  pageBg:      'bg-[#040c12]',
  headerBg:    'bg-[#061318]/90',
  navBg:       'bg-[#040c12]/95',
  cardBg:      'bg-teal-950/30',
  cardBorder:  'border-teal-800/30',
  activeTab:   'border-cyan-400 text-cyan-300',
  inactiveTab: 'border-transparent text-slate-400 hover:text-cyan-300 hover:border-teal-700/50',
  accentText:  'text-cyan-300',
  iconBg:      'bg-cyan-500/10',
  iconBorder:  'border-cyan-500/20',
  iconColor:   'text-cyan-400',
  primaryBtn:  'bg-teal-700 hover:bg-teal-600 text-white',
  ghostBtn:    'border border-teal-800/50 hover:border-teal-600/60 text-slate-300 hover:text-cyan-200',
  badge:       'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
  progressBar: 'from-teal-500 to-cyan-400',
  sectionDivider: 'border-teal-900/40',
};

type ZiweiTab = 'overview' | 'charts' | 'analysis' | 'predictions' | 'knowledge' | 'celebrity' | 'blog';

export default function ZiweiPage() {
  const getInitialTab = (): ZiweiTab => {
    if (typeof window === 'undefined') return 'overview';
    const p = new URLSearchParams(window.location.search).get('tab') as ZiweiTab | null;
    const valid: ZiweiTab[] = ['overview', 'charts', 'analysis', 'predictions', 'knowledge', 'celebrity', 'blog'];
    return p && valid.includes(p) ? p : 'overview';
  };
  const [activeTab, setActiveTab] = useState<ZiweiTab>(getInitialTab());

  // Called by GenerationPanel after a successful chart save + generate
  const handleGenerate = () => setActiveTab('analysis');

  const tabs: { id: ZiweiTab; label: string; icon: typeof Activity }[] = [
    { id: 'overview',     label: 'Overview',      icon: Activity },
    { id: 'charts',       label: '✨ Charts',      icon: Sparkles },
    { id: 'analysis',     label: '🔍 Analysis',   icon: Brain },
    { id: 'predictions',  label: '🔮 Predictions',icon: TrendingUp },
    { id: 'knowledge',    label: '🧠 Intelligence', icon: BookOpen },
    { id: 'celebrity',    label: '⭐ Celebrity',  icon: Star },
    { id: 'blog',         label: '📝 Blog',       icon: Newspaper },
  ];

  return (
    <ErrorBoundary>
      <div
        className={`min-h-screen ${P.pageBg}`}
        style={{ background: 'linear-gradient(160deg, #040c12 0%, #061a20 45%, #030e14 100%)' }}
      >
        {/* ================================================================ */}
        {/* HEADER                                                           */}
        {/* ================================================================ */}
        <header className={`border-b border-purple-900/50 ${P.headerBg} backdrop-blur-sm sticky top-0 z-40`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${P.iconBg} border ${P.iconBorder}`}>
                <Moon className={`w-6 h-6 ${P.iconColor}`} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-wide">紫微斗數 Ziwei</h1>
                <p className="text-xs text-teal-400/60">AI-Powered Astrology • 中州派 Zhongzhou</p>
              </div>
            </div>
            <Link
              href="/dashboard"
              className={`flex items-center gap-1.5 px-3 py-1.5 ${P.primaryBtn} rounded-lg text-xs font-medium transition-colors`}
            >
              Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* ================================================================ */}
        {/* TAB NAVIGATION                                                   */}
        {/* ================================================================ */}
        <nav className={`${P.navBg} border-b border-purple-900/40 sticky top-[65px] z-30 backdrop-blur-sm`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-5 overflow-x-auto scrollbar-none">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-1 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                      activeTab === tab.id ? P.activeTab : P.inactiveTab
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

        {/* ================================================================ */}
        {/* MAIN CONTENT                                                     */}
        {/* ================================================================ */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* ============================================================ */}
          {/* OVERVIEW TAB                                                  */}
          {/* ============================================================ */}
          {activeTab === 'overview' && (
            <div className="space-y-16">

              {/* Hero */}
              <section className="text-center pt-4">
                <div className={`inline-flex items-center gap-2 px-3 py-1 ${P.badge} rounded-full text-xs mb-5`}>
                  <Sparkles className="w-3 h-3" /> 王亭之系統 · Zhongzhou School
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight tracking-tight">
                  AI Birth Chart Analysis<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-teal-400">
                    with Empirical Accuracy
                  </span>
                </h2>
                <p className="text-lg text-slate-400 max-w-3xl mx-auto mb-10">
                  Three-agent system for calculating 排盤 (birth charts), generating AI interpretations,
                  and tracking rule accuracy across traditional Chinese astrology with empirical validation.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => setActiveTab('charts')}
                    className={`inline-flex items-center gap-2 px-6 py-3 ${P.primaryBtn} rounded-xl font-medium transition-colors`}
                  >
                    <Sparkles className="w-4 h-4" />
                    Generate Chart
                  </button>
                  <button
                    onClick={() => setActiveTab('knowledge')}
                    className={`inline-flex items-center gap-2 px-6 py-3 ${P.ghostBtn} rounded-xl font-medium transition-colors`}
                  >
                    <BookOpen className="w-4 h-4" />
                    Ziwei Intelligence
                  </button>
                </div>
              </section>

              {/* System Stats */}
              <section>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: '14', sub: 'Primary Stars', icon: Star,   color: 'text-cyan-300' },
                    { label: '12', sub: 'Palaces',       icon: Layers, color: 'text-teal-300' },
                    { label: '3',  sub: 'AI Agents',     icon: Brain,  color: 'text-sky-300' },
                    { label: '∞',  sub: 'Timing Cycles', icon: Clock,  color: 'text-cyan-200' },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      className={`rounded-xl border ${P.cardBorder} ${P.cardBg} p-5 text-center`}
                    >
                      <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                      <div className={`text-3xl font-bold ${stat.color} mb-1`}>{stat.label}</div>
                      <div className="text-xs text-slate-500">{stat.sub}</div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Three-Agent Architecture */}
              <section>
                <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
                  <Radar className="w-6 h-6 text-teal-400" />
                  Three-Agent Architecture
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                  {[
                    {
                      icon: Radar, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20',
                      title: 'ChartEngineAgent', sub: '排盤引擎 · Birth Chart Calculation',
                      features: ['Calendar conversion (Gregorian ↔ Lunar)', 'Four Pillars (八字) calculation', 'Star placement (安星法)', 'Timing cycles (大限/流年)', 'Pattern identification'],
                    },
                    {
                      icon: Brain, color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20',
                      title: 'InterpretationAgent', sub: '解讀引擎 · Chart Interpretation',
                      features: ['Rule matching & filtering', 'Consensus/disputed handling', 'Life dimension grouping', 'Accuracy metadata', 'Multi-language support'],
                    },
                    {
                      icon: TrendingUp, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20',
                      title: 'EvaluationAgent', sub: '評估引擎 · Accuracy Tracking',
                      features: ['Feedback processing', 'Statistics updates', 'Rule reviews', 'Accuracy reports', 'Continuous learning'],
                    },
                  ].map((agent, i) => (
                    <div key={i} className={`group rounded-xl border ${P.cardBorder} ${P.cardBg} hover:bg-teal-950/50 p-6 transition-all`}>
                      <div className={`p-3 rounded-lg ${agent.bg} border ${agent.border} w-fit mb-4`}>
                        <agent.icon className={`w-6 h-6 ${agent.color}`} />
                      </div>
                      <h4 className="text-lg font-bold text-white mb-1">{agent.title}</h4>
                      <p className={`text-xs ${agent.color} mb-4`}>{agent.sub}</p>
                      <ul className="text-xs text-slate-500 space-y-1.5">
                        {agent.features.map((f, j) => (
                          <li key={j}>✓ {f}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {/* Data flow */}
                <div className={`rounded-xl border ${P.cardBorder} ${P.cardBg} p-6`}>
                  <p className="text-sm text-slate-500 font-medium mb-5">Data Flow & Integration</p>
                  <div className="space-y-3">
                    {[
                      [
                        { label: 'User Input',  cls: 'bg-teal-500/20  border-teal-500/30  text-teal-300'  },
                        { label: 'ChartEngine', cls: 'bg-cyan-500/20  border-cyan-500/30  text-cyan-300'  },
                        { label: 'BirthChart',  cls: 'bg-sky-500/20   border-sky-500/30   text-sky-300'   },
                      ],
                      [
                        { label: 'Interpreter', cls: 'bg-teal-500/20  border-teal-500/30  text-teal-300'  },
                        { label: 'Results',     cls: 'bg-cyan-500/20  border-cyan-500/30  text-cyan-300'  },
                      ],
                      [
                        { label: 'User Feedback', cls: 'bg-sky-500/20 border-sky-500/30 text-sky-300'  },
                        { label: 'Evaluator',     cls: 'bg-teal-500/20 border-teal-500/30 text-teal-300' },
                      ],
                    ].map((row, ri) => (
                      <div key={ri} className={`flex items-center gap-3 text-sm ${ri > 0 ? `ml-${ri * 8}` : ''}`}>
                        {row.map((node, ni) => (
                          <div key={ni} className="flex items-center gap-2">
                            <div className={`px-3 py-1.5 border rounded font-medium text-xs ${node.cls}`}>{node.label}</div>
                            {ni < row.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-slate-700 flex-shrink-0" />}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Key Features */}
              <section>
                <h3 className="text-2xl font-bold text-white mb-8">System Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {[
                    { icon: Database, title: 'Comprehensive Rule Database', desc: 'Digitized rules from Zhongzhou school with accuracy statistics (sample_size, match_rate, confidence_level)' },
                    { icon: Shield, title: 'Consensus Tracking', desc: 'Rules labeled as consensus, disputed, or minority view with source documentation and alternative interpretations' },
                    { icon: Zap, title: 'Three Timing Cycles', desc: 'Decade luck (大限), Annual luck (流年), Monthly luck (流月), and daily predictions with Four Transformations' },
                    { icon: Brain, title: 'Intelligent Matching', desc: 'Rules matched against birth chart features with dimension-based grouping and accuracy filtering' },
                    { icon: Users, title: 'Feedback Integration', desc: 'Collect user feedback (1-5 rating), track outcomes, and automatically update rule accuracy metrics' },
                    { icon: TrendingUp, title: 'Statistical Validation', desc: 'Empirical accuracy tracking enables continuous improvement and identifies rules needing review' },
                  ].map((f, i) => (
                    <div key={i} className={`rounded-xl border ${P.cardBorder} bg-white/[0.01] hover:bg-purple-950/20 p-5 transition-colors`}>
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${P.iconBg}`}>
                          <f.icon className={`w-5 h-5 ${P.iconColor} flex-shrink-0`} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white mb-1">{f.title}</h4>
                          <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Rules Confidence */}
              <section>
                <h3 className="text-2xl font-bold text-white mb-6">Rules Confidence System</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {[
                    { label: '✓ Consensus Rules', desc: 'Widely accepted interpretations (match_rate ≥ 0.80)', color: 'border-teal-500/30 bg-teal-500/5 text-teal-300' },
                    { label: '⚠ Disputed Rules', desc: 'Different schools have alternate views (0.60–0.80)', color: 'border-cyan-500/30 bg-cyan-500/5 text-cyan-300' },
                    { label: '◆ Minority Views', desc: 'Small subset of teachers (0.40–0.60)', color: 'border-sky-500/30 bg-sky-500/5 text-sky-300' },
                    { label: '? Under Review', desc: 'Needs validation or revision (< 0.40)', color: 'border-slate-500/30 bg-slate-500/5 text-slate-400' },
                  ].map((r, i) => (
                    <div key={i} className={`rounded-lg border p-4 ${r.color}`}>
                      <div className="text-sm font-semibold mb-1">{r.label}</div>
                      <div className="text-xs text-slate-400">{r.desc}</div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setActiveTab('knowledge')}
                  className={`inline-flex items-center gap-2 px-4 py-2 ${P.primaryBtn} rounded-lg text-sm font-medium transition-colors`}
                >
                  View Rules Database <ChevronRight className="w-4 h-4" />
                </button>
              </section>

              {/* Roadmap */}
              <section>
                <h3 className="text-2xl font-bold text-white mb-8">Implementation Roadmap</h3>
                <div className="space-y-3">
                  {[
                    { phase: 'Phase 1', label: '✅ Completed', desc: 'Backend design, type definitions, agent interfaces' },
                    { phase: 'Phase 2', label: '🏗️ Building',  desc: 'Frontend landing page, dashboard tab, chart visualizer' },
                    { phase: 'Phase 3', label: '📋 Next',      desc: 'Rules database, chart calculation algorithms, star placement' },
                    { phase: 'Phase 4', label: '🎨 Next',      desc: 'Chart visualization (12 palaces), interpretation UI' },
                    { phase: 'Phase 5', label: '📊 Next',      desc: 'Feedback loop, accuracy tracking, statistical reports' },
                  ].map((item, i) => (
                    <div key={i} className={`flex items-start gap-4 p-4 rounded-xl border ${P.cardBorder} bg-white/[0.01]`}>
                      <div className={`text-xs font-bold ${P.accentText} px-2 py-1 ${P.iconBg} rounded border ${P.iconBorder} w-fit whitespace-nowrap`}>
                        {item.phase}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{item.label}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* CTA */}
              <section>
                <div className={`rounded-2xl border border-teal-700/30 bg-gradient-to-r from-teal-900/20 to-cyan-900/20 p-10 text-center`}>
                  <h3 className="text-2xl font-bold text-white mb-3">Ready to Explore?</h3>
                  <p className="text-slate-400 mb-8 max-w-xl mx-auto">
                    Generate your birth chart and discover interpretations from our empirically-validated rule database
                  </p>
                  <button
                    onClick={() => setActiveTab('charts')}
                    className={`inline-flex items-center gap-2 px-8 py-3 ${P.primaryBtn} rounded-xl font-medium transition-colors`}
                  >
                    ✨ Start Chart Generation <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </section>
            </div>
          )}

          {/* ============================================================ */}
          {/* CHARTS TAB — split panel: visitor list left, form right      */}
          {/* ============================================================ */}
          {activeTab === 'charts' && (
            <ZiweiTabErrorBoundary tabName="Charts">
              <GenerationPanel onGenerate={handleGenerate} />
            </ZiweiTabErrorBoundary>
          )}

          {/* ============================================================ */}
          {/* ANALYSIS TAB                                                  */}
          {/* ============================================================ */}
          {activeTab === 'analysis' && (
            <ZiweiTabErrorBoundary tabName="Analysis">
              <ZiweiChartAnalysis />
            </ZiweiTabErrorBoundary>
          )}

          {/* ============================================================ */}
          {/* PREDICTIONS TAB                                               */}
          {/* ============================================================ */}
          {activeTab === 'predictions' && (
            <ZiweiTabErrorBoundary tabName="Predictions">
              <ZiweiPredictions />
            </ZiweiTabErrorBoundary>
          )}

          {/* ============================================================ */}
          {/* KNOWLEDGE TAB (includes reference content)                   */}
          {/* ============================================================ */}
          {activeTab === 'knowledge' && (
            <ZiweiTabErrorBoundary tabName="Knowledge">
              <ZiweiKnowledgeManagement />
            </ZiweiTabErrorBoundary>
          )}

          {/* ============================================================ */}
          {/* CELEBRITY TAB                                                 */}
          {/* ============================================================ */}
          {activeTab === 'celebrity' && (
            <ZiweiTabErrorBoundary tabName="Celebrity">
              <ZiweiCelebrityValidation />
            </ZiweiTabErrorBoundary>
          )}

          {/* ============================================================ */}
          {/* BLOG TAB — coming up                                         */}
          {/* ============================================================ */}
          {activeTab === 'blog' && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              {/* Decorative backdrop */}
              <div className="relative mb-10">
                <div className="absolute inset-0 rounded-full bg-teal-600/10 blur-3xl scale-150" />
                <div className={`relative w-24 h-24 rounded-2xl ${P.iconBg} border ${P.iconBorder} flex items-center justify-center mx-auto`}>
                  <Newspaper className={`w-12 h-12 ${P.iconColor}`} />
                </div>
              </div>

              <div className={`inline-flex items-center gap-2 px-3 py-1 ${P.badge} rounded-full text-xs mb-5`}>
                <Sparkles className="w-3 h-3" /> In Development
              </div>

              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
                Ziwei Insights Blog
              </h2>
              <p className="text-slate-400 max-w-md mx-auto text-base mb-8 leading-relaxed">
                Deep dives into 紫微斗數 astrology — chart interpretation guides,
                star profiles, palace interactions, and real-world case studies.
                <br /><span className="text-teal-400 font-medium">Coming up.</span>
              </p>

              {/* Teaser topics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl w-full mb-10">
                {[
                  { icon: Star, title: '14 Main Stars', sub: 'Character deep-dives' },
                  { icon: Layers, title: '12 Palaces', sub: 'Life domain analysis' },
                  { icon: Eye, title: 'Case Studies', sub: 'Celebrity chart reviews' },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`rounded-xl border ${P.cardBorder} ${P.cardBg} p-4 text-center opacity-60`}
                  >
                    <item.icon className={`w-6 h-6 mx-auto mb-2 ${P.iconColor}`} />
                    <div className="text-sm font-semibold text-white">{item.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{item.sub}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 ${P.ghostBtn} rounded-lg text-sm font-medium transition-colors`}
                >
                  ← Back to Overview
                </button>
                <button
                  onClick={() => setActiveTab('charts')}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 ${P.primaryBtn} rounded-lg text-sm font-medium transition-colors`}
                >
                  Generate a Chart <Sparkles className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </main>

        {/* ================================================================ */}
        {/* FOOTER                                                           */}
        {/* ================================================================ */}
        <footer className={`border-t ${P.sectionDivider} bg-purple-950/20 mt-20 py-8`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-xs text-slate-500">
            <p className={`text-sm ${P.accentText} font-medium mb-1`}>紫微斗數 · Ziwei Doushu</p>
            <p>Based on Zhongzhou School (中州派) · Accuracy-tracked & empirically validated</p>
            <p className="mt-2">All interpretations include source documentation and statistical confidence metrics</p>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}
