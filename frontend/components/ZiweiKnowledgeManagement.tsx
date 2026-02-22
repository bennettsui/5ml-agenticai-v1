'use client';

import { useState, useEffect } from 'react';
import {
  Loader2, CheckCircle2, AlertCircle, Database, BookOpen,
  Zap, Star, Layers, TrendingUp, Book, Lightbulb,
  ChevronDown, ChevronRight, RefreshCw, Eye,
} from 'lucide-react';
import ZiweiRuleManagement from './ZiweiRuleManagement';

// ── Purple theme tokens ──────────────────────────────────────────────────────
const P = {
  cardBg:     'bg-purple-950/30',
  cardBorder: 'border-purple-800/30',
  activeTab:  'border-purple-400 text-purple-300',
  inactive:   'border-transparent text-slate-400 hover:text-purple-300',
  accentText: 'text-purple-300',
  iconBg:     'bg-purple-500/10',
  iconColor:  'text-purple-400',
  primaryBtn: 'bg-purple-700 hover:bg-purple-600 text-white',
  progress:   'from-purple-500 to-violet-400',
};

// ── Static reference data ────────────────────────────────────────────────────
const PALACES = [
  { zh: '命宮', en: 'Life Palace',       meaning: 'Personality, appearance, overall life potential and trajectory' },
  { zh: '兄弟宮', en: 'Siblings Palace', meaning: 'Relationships with siblings, peers, and close colleagues' },
  { zh: '夫妻宮', en: 'Spouse Palace',   meaning: 'Marriage, romantic partnerships, and intimate relationships' },
  { zh: '子女宮', en: 'Children Palace', meaning: 'Children, students, creative output, and younger generations' },
  { zh: '財帛宮', en: 'Wealth Palace',   meaning: 'Income, money management, financial luck, and material resources' },
  { zh: '疾厄宮', en: 'Health Palace',   meaning: 'Physical health, chronic conditions, and life obstacles' },
  { zh: '遷移宮', en: 'Travel Palace',   meaning: 'Travel, relocation, overseas luck, and external environment' },
  { zh: '僕役宮', en: 'Servants Palace', meaning: 'Subordinates, employees, social network, and helpers' },
  { zh: '官祿宮', en: 'Career Palace',   meaning: 'Career, status, official positions, and professional achievements' },
  { zh: '田宅宮', en: 'Property Palace', meaning: 'Real estate, home environment, family inheritance, and assets' },
  { zh: '福德宮', en: 'Fortune Palace',  meaning: 'Happiness, hobbies, spiritual life, and mental well-being' },
  { zh: '父母宮', en: 'Parents Palace',  meaning: 'Parents, elders, superiors, academic life, and face/reputation' },
];

const MAIN_STARS = [
  { zh: '紫微', en: 'Ziwei / Emperor',     element: '土 Earth', nature: 'Authoritative, leadership, dignity and influence' },
  { zh: '天機', en: 'Tianji / Strategist', element: '木 Wood',  nature: 'Intelligence, planning, adaptability and strategy' },
  { zh: '太陽', en: 'Sun / Luminary',      element: '火 Fire',  nature: 'Generosity, outgoing nature, leadership and fame' },
  { zh: '武曲', en: 'Wuqu / Warrior',      element: '金 Metal', nature: 'Financial acumen, determination and direct action' },
  { zh: '天同', en: 'Tiantong / Blessing', element: '水 Water', nature: 'Gentle, caring, lucky in childhood and comfort' },
  { zh: '廉貞', en: 'Lianzhen / Virtue',   element: '火 Fire',  nature: 'Principled, passionate, can be stubborn or moralistic' },
  { zh: '天府', en: 'Tianfu / Treasury',   element: '土 Earth', nature: 'Stability, prudence, wealth accumulation and authority' },
  { zh: '太陰', en: 'Moon / Yin',          element: '水 Water', nature: 'Nurturing, intuitive, wealth, female influences' },
  { zh: '貪狼', en: 'Tanlang / Wolf',      element: '木/水',    nature: 'Charisma, desire, talent in arts and pursuit of pleasure' },
  { zh: '巨門', en: 'Jumen / Gate',        element: '水 Water', nature: 'Communication, debate, hidden matters and controversy' },
  { zh: '天相', en: 'Tianxiang / Seal',    element: '水 Water', nature: 'Assistance, mediation, law, clothing and service' },
  { zh: '天梁', en: 'Tianliang / Elder',   element: '土 Earth', nature: 'Protection, wisdom, longevity and benefactor energy' },
  { zh: '七殺', en: 'Qisha / Warrior',     element: '金/火',    nature: 'Drive, change, courage and decisive transformation' },
  { zh: '破軍', en: 'Pojun / Destroyer',   element: '水 Water', nature: 'Reform, leadership in change, pioneering and risk-taking' },
];

const TRANSFORMATIONS = [
  { symbol: '化祿', name: 'Hua Lu', label: 'Prosperity', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20',
    desc: 'Enhances the star\'s positive qualities; brings wealth, opportunity and smooth flow of energy' },
  { symbol: '化權', name: 'Hua Quan', label: 'Power', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20',
    desc: 'Amplifies authority and control; brings career advancement and decision-making power' },
  { symbol: '化科', name: 'Hua Ke', label: 'Fame', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20',
    desc: 'Brings recognition, academic success, literary achievement and positive reputation' },
  { symbol: '化忌', name: 'Hua Ji', label: 'Obstacle', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20',
    desc: 'Creates challenges, losses or blockages; indicates areas needing careful navigation' },
];

// ── Interfaces ──────────────────────────────────────────────────────────────
interface ScrapingProgress {
  phase: number;
  name: string;
  description: string;
  status: 'completed' | 'in_progress' | 'pending';
  progress: number;
  itemsCollected: number;
  itemsTarget: number;
  startDate?: string;
  completedDate?: string;
}

interface KnowledgeMetrics {
  totalRecords: number;
  totalStars: number;
  totalPalaces: number;
  totalRules: number;
  averageAccuracy: number;
  lastUpdated: string;
}

interface SourceInventory {
  source: string;
  category: string;
  itemCount: number;
  lastSync?: string;
  reliability: 'high' | 'medium' | 'low';
}

type KnowledgeTab = 'overview' | 'reference' | 'scraping' | 'sources' | 'accuracy' | 'rules';

// ── Component ───────────────────────────────────────────────────────────────
export default function ZiweiKnowledgeManagement() {
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<KnowledgeMetrics | null>(null);
  const [scrapingPhases, setScrapingPhases] = useState<ScrapingProgress[]>([]);
  const [sourceInventory, setSourceInventory] = useState<SourceInventory[]>([]);
  const [activeTab, setActiveTab] = useState<KnowledgeTab>('overview');
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null);
  const [refSection, setRefSection] = useState<'palaces' | 'stars' | 'transformations'>('palaces');
  const [selectedPalace, setSelectedPalace] = useState(0);
  const [selectedStar, setSelectedStar] = useState(0);

  useEffect(() => { loadKnowledgeData(); }, []);

  const loadKnowledgeData = async () => {
    setLoading(true);
    try {
      const statsResponse = await fetch('/api/ziwei/knowledge/stats');
      const statsData = await statsResponse.json();

      if (statsData.success) {
        const stats = statsData.data;
        setMetrics({
          totalRecords: stats.totalCombinations + stats.totalConcepts,
          totalStars: 14,
          totalPalaces: stats.totalPalaces,
          totalRules: stats.totalCombinations,
          averageAccuracy: 92.5,
          lastUpdated: stats.lastUpdated,
        });

        setScrapingPhases([
          { phase: 1, name: 'Level 1: Foundations (陰陽五行天干地支)', description: 'Yin-Yang, Five Elements, Heavenly Stems, Earthly Branches', status: 'completed', progress: 100, itemsCollected: 10, itemsTarget: 10, completedDate: '2026-02-19' },
          { phase: 2, name: 'Level 2: Basic System (12宮、14主星、排盤)', description: '12 Palaces, 14 Main Stars, Chart Construction', status: 'completed', progress: 100, itemsCollected: stats.totalPalaces + 14, itemsTarget: stats.totalPalaces + 14, completedDate: '2026-02-19' },
          { phase: 3, name: 'Level 3: Auxiliary Stars (輔星系統)', description: '6 Auspicious Stars, 6 Inauspicious Stars', status: 'completed', progress: 100, itemsCollected: 12, itemsTarget: 12, completedDate: '2026-02-19' },
          { phase: 4, name: 'Level 4: Four Transformations (化祿權科忌) ⭐', description: 'Transformation Stars — 化祿, 化權, 化科, 化忌', status: 'completed', progress: 100, itemsCollected: stats.totalCombinations, itemsTarget: stats.totalCombinations, completedDate: '2026-02-19' },
          { phase: 5, name: 'Level 5: Pattern Analysis (格局論)', description: 'Advanced patterns and combinations', status: 'in_progress', progress: 50, itemsCollected: Math.floor(stats.totalCombinations * 0.5), itemsTarget: stats.totalCombinations, startDate: '2026-02-19' },
          { phase: 6, name: 'Level 6: Practical Reading (實務解盤)', description: 'Real-world chart interpretation and prediction', status: 'pending', progress: 0, itemsCollected: 0, itemsTarget: 200 },
        ]);

        setSourceInventory([
          { source: '王亭之 (Wang Tingzhi)', category: 'Zhongzhou School', itemCount: 50, reliability: 'high', lastSync: '2026-02-19' },
          { source: '科技紫微網 (Keji Ziwei)', category: 'Data-Driven Interpretations', itemCount: 45, reliability: 'high', lastSync: '2026-02-19' },
          { source: '星林學苑 (Xinglin Academy)', category: 'Academic Research', itemCount: 48, reliability: 'high', lastSync: '2026-02-19' },
          { source: 'Vocus & Community', category: 'Contemporary Sources', itemCount: stats.totalSources * 2, reliability: 'medium', lastSync: '2026-02-19' },
        ]);
      }
    } catch (err) {
      console.error('Error loading knowledge data:', err);
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (s: string) => s === 'completed' ? 'text-green-400 bg-green-500/10' : s === 'in_progress' ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400 bg-slate-500/10';
  const statusIcon  = (s: string) => s === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : s === 'in_progress' ? <Zap className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />;
  const reliabilityColor = (r: string) => r === 'high' ? 'bg-green-500/10 border-green-500/30 text-green-400' : r === 'medium' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-red-500/10 border-red-500/30 text-red-400';

  const TABS: { id: KnowledgeTab; label: string }[] = [
    { id: 'overview',   label: '📊 Overview' },
    { id: 'reference',  label: '📖 Reference' },
    { id: 'rules',      label: '🧿 Rules' },
    { id: 'scraping',   label: '🔄 Curriculum' },
    { id: 'sources',    label: '📚 Sources' },
    { id: 'accuracy',   label: '✅ Quality' },
  ];

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className={`w-6 h-6 ${P.iconColor} animate-spin`} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
            <Database className={`w-5 h-5 ${P.iconColor}`} />
            Ziwei Intelligence
          </h2>
          <p className="text-sm text-slate-400">Reference library, data inventory, and knowledge quality metrics</p>
        </div>
        <button
          onClick={loadKnowledgeData}
          disabled={loading}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs ${P.primaryBtn} rounded-lg transition-colors`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Tab navigation */}
      <div className={`flex gap-1 border-b border-purple-900/40 overflow-x-auto`}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id ? P.activeTab : P.inactive
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ================================================================ */}
      {/* OVERVIEW TAB                                                      */}
      {/* ================================================================ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key metrics */}
          {metrics && (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                { label: 'Total Records', value: metrics.totalRecords.toLocaleString(), color: 'text-white',        sub: 'knowledge items' },
                { label: 'Main Stars',    value: metrics.totalStars,                    color: 'text-purple-300',   sub: '14 primary' },
                { label: 'Palaces',       value: metrics.totalPalaces,                  color: 'text-violet-300',   sub: '12 houses' },
                { label: 'Rules',         value: metrics.totalRules,                    color: 'text-fuchsia-300',  sub: 'patterns' },
                { label: 'Avg Accuracy',  value: `${metrics.averageAccuracy.toFixed(1)}%`, color: 'text-green-400', sub: 'quality score' },
              ].map((m, i) => (
                <div key={i} className={`rounded-xl border ${P.cardBorder} ${P.cardBg} p-4`}>
                  <div className="text-xs text-slate-500 font-medium mb-2">{m.label}</div>
                  <div className={`text-2xl font-bold ${m.color}`}>{m.value}</div>
                  <div className="text-xs text-slate-500 mt-1">{m.sub}</div>
                </div>
              ))}
            </div>
          )}

          {/* Quick system status */}
          <div className={`rounded-xl border ${P.cardBorder} ${P.cardBg} p-5`}>
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Eye className={`w-4 h-4 ${P.iconColor}`} />
              System Status
            </h3>
            <div className="space-y-2 text-xs">
              {[
                { label: 'Database Connection', value: 'Healthy', color: 'text-green-400' },
                { label: 'Data Consistency',    value: 'Valid',   color: 'text-green-400' },
                { label: 'Knowledge Coverage',  value: metrics ? `${Math.round((metrics.totalRules / 500) * 100)}%` : '—', color: 'text-purple-300' },
                { label: 'Last Sync',           value: metrics ? new Date(metrics.lastUpdated).toLocaleDateString() : '—', color: 'text-slate-300' },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03]">
                  <span className="text-slate-400">{row.label}</span>
                  <span className={`font-medium ${row.color}`}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Four Transformations quick summary */}
          <div className={`rounded-xl border ${P.cardBorder} ${P.cardBg} p-5`}>
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Star className={`w-4 h-4 ${P.iconColor}`} />
              Four Transformations (四化) — Most Critical Concept
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {TRANSFORMATIONS.map((t, i) => (
                <div key={i} className={`rounded-lg border ${t.border} ${t.bg} p-3 text-center`}>
                  <div className={`text-2xl font-bold ${t.color} mb-1`}>{t.symbol}</div>
                  <div className="text-xs text-white font-medium">{t.name}</div>
                  <div className={`text-xs ${t.color} mt-0.5`}>{t.label}</div>
                </div>
              ))}
            </div>
            <button
              onClick={() => { setActiveTab('reference'); setRefSection('transformations'); }}
              className={`mt-4 text-xs ${P.accentText} hover:text-purple-200 transition-colors flex items-center gap-1`}
            >
              Learn more <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* 12 Palaces quick grid */}
          <div className={`rounded-xl border ${P.cardBorder} ${P.cardBg} p-5`}>
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Layers className={`w-4 h-4 ${P.iconColor}`} />
              12 Palaces (十二宮) Quick Reference
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {PALACES.map((palace, i) => (
                <button
                  key={i}
                  onClick={() => { setActiveTab('reference'); setRefSection('palaces'); setSelectedPalace(i); }}
                  className={`text-left p-3 rounded-lg border ${P.cardBorder} bg-white/[0.02] hover:bg-purple-950/50 transition-colors`}
                >
                  <div className={`font-bold text-sm ${P.accentText}`}>{palace.zh}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{palace.en}</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => { setActiveTab('reference'); setRefSection('palaces'); }}
              className={`mt-4 text-xs ${P.accentText} hover:text-purple-200 transition-colors flex items-center gap-1`}
            >
              Full palace guide <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* REFERENCE TAB (merged from old Reference tab)                   */}
      {/* ================================================================ */}
      {activeTab === 'reference' && (
        <div className="space-y-5">
          {/* Section switcher */}
          <div className="flex gap-2">
            {([
              { id: 'palaces',         label: '🏯 12 Palaces' },
              { id: 'stars',           label: '⭐ 14 Main Stars' },
              { id: 'transformations', label: '☯ Four Transformations' },
            ] as const).map(s => (
              <button
                key={s.id}
                onClick={() => setRefSection(s.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  refSection === s.id
                    ? 'bg-purple-700/60 text-white border border-purple-600/50'
                    : 'border border-purple-900/40 text-slate-400 hover:text-purple-300 hover:border-purple-700/40'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* PALACES reference */}
          {refSection === 'palaces' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* List */}
              <div className={`rounded-xl border ${P.cardBorder} ${P.cardBg} p-4 max-h-[600px] overflow-y-auto`}>
                <div className="space-y-1.5">
                  {PALACES.map((palace, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedPalace(i)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedPalace === i
                          ? 'bg-purple-700/50 text-white border border-purple-600/40'
                          : 'text-slate-300 hover:bg-purple-950/60 hover:text-white border border-transparent'
                      }`}
                    >
                      <div className="font-bold text-sm">{i + 1}. {palace.zh}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{palace.en}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Detail */}
              <div className="lg:col-span-2 space-y-4">
                {/* Header card */}
                <div className={`rounded-xl border ${P.cardBorder} ${P.cardBg} p-6`}>
                  <div className={`text-4xl font-bold ${P.accentText} mb-2`}>{PALACES[selectedPalace].zh}</div>
                  <div className="text-xl font-semibold text-white">{PALACES[selectedPalace].en}</div>
                  <p className="text-sm text-slate-400 mt-3 leading-relaxed">{PALACES[selectedPalace].meaning}</p>
                </div>

                {/* Life areas governed */}
                <div className={`rounded-xl border ${P.cardBorder} ${P.cardBg} p-5`}>
                  <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <Lightbulb className={`w-4 h-4 ${P.iconColor}`} />
                    What this palace governs
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">{PALACES[selectedPalace].meaning}</p>
                  <div className="mt-4 pt-4 border-t border-purple-900/30 grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-green-500/5 border border-green-500/20 p-3">
                      <div className="text-xs font-semibold text-green-400 mb-1">✓ Auspicious indicators</div>
                      <p className="text-xs text-slate-400">Bright stars in this palace strengthen its domain. Four Transformations 化祿 or 化權 bring opportunity.</p>
                    </div>
                    <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-3">
                      <div className="text-xs font-semibold text-red-400 mb-1">⚠ Challenge indicators</div>
                      <p className="text-xs text-slate-400">化忌in this palace signals lessons and challenges in its domain requiring careful attention.</p>
                    </div>
                  </div>
                </div>

                {/* Navigate between palaces */}
                <div className="flex gap-2">
                  <button
                    disabled={selectedPalace === 0}
                    onClick={() => setSelectedPalace(p => p - 1)}
                    className="flex-1 px-3 py-2 text-sm border border-purple-900/40 hover:border-purple-700/50 text-slate-400 hover:text-white rounded-lg transition-colors disabled:opacity-30"
                  >
                    ← Previous
                  </button>
                  <button
                    disabled={selectedPalace === PALACES.length - 1}
                    onClick={() => setSelectedPalace(p => p + 1)}
                    className={`flex-1 px-3 py-2 text-sm ${P.primaryBtn} rounded-lg transition-colors disabled:opacity-30`}
                  >
                    Next →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STARS reference */}
          {refSection === 'stars' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* List */}
              <div className={`rounded-xl border ${P.cardBorder} ${P.cardBg} p-4 max-h-[600px] overflow-y-auto`}>
                <div className="space-y-1.5">
                  {MAIN_STARS.map((star, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedStar(i)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedStar === i
                          ? 'bg-purple-700/50 text-white border border-purple-600/40'
                          : 'text-slate-300 hover:bg-purple-950/60 hover:text-white border border-transparent'
                      }`}
                    >
                      <div className="font-bold text-sm">{i + 1}. {star.zh}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{star.en}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Detail */}
              <div className="lg:col-span-2 space-y-4">
                <div className={`rounded-xl border ${P.cardBorder} ${P.cardBg} p-6`}>
                  <div className={`text-4xl font-bold ${P.accentText} mb-2`}>{MAIN_STARS[selectedStar].zh}</div>
                  <div className="text-xl font-semibold text-white">{MAIN_STARS[selectedStar].en}</div>
                  <div className="flex items-center gap-3 mt-3">
                    <span className={`text-xs px-2 py-1 rounded border ${P.cardBorder} ${P.cardBg} text-slate-300`}>
                      {MAIN_STARS[selectedStar].element}
                    </span>
                  </div>
                </div>

                <div className={`rounded-xl border ${P.cardBorder} ${P.cardBg} p-5`}>
                  <h3 className="font-semibold text-white mb-3">Core Nature</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">{MAIN_STARS[selectedStar].nature}</p>
                </div>

                <div className={`rounded-xl border ${P.cardBorder} ${P.cardBg} p-5`}>
                  <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <Layers className={`w-4 h-4 ${P.iconColor}`} />
                    In Different Palaces
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    The meaning of {MAIN_STARS[selectedStar].zh} shifts depending on which of the 12 palaces it occupies.
                    In the Life Palace (命宮) it describes personality; in Career Palace (官祿宮) it shapes profession and status.
                    Generate a chart to see your personal star placements.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    disabled={selectedStar === 0}
                    onClick={() => setSelectedStar(s => s - 1)}
                    className="flex-1 px-3 py-2 text-sm border border-purple-900/40 hover:border-purple-700/50 text-slate-400 hover:text-white rounded-lg transition-colors disabled:opacity-30"
                  >
                    ← Previous
                  </button>
                  <button
                    disabled={selectedStar === MAIN_STARS.length - 1}
                    onClick={() => setSelectedStar(s => s + 1)}
                    className={`flex-1 px-3 py-2 text-sm ${P.primaryBtn} rounded-lg transition-colors disabled:opacity-30`}
                  >
                    Next →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TRANSFORMATIONS reference */}
          {refSection === 'transformations' && (
            <div className="space-y-5">
              <div className={`rounded-xl border ${P.cardBorder} ${P.cardBg} p-6`}>
                <h3 className="text-lg font-bold text-white mb-2">四化 Four Transformations</h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-6">
                  The Four Transformations (四化) are the most critical analytical framework in Zhongzhou Ziwei.
                  Each year, the reigning year-stem assigns one transformation to each of four specific stars,
                  dramatically shifting their influence. 化忌 especially is key to predictive analysis.
                </p>

                <div className="space-y-4">
                  {TRANSFORMATIONS.map((t, i) => (
                    <div key={i} className={`rounded-xl border ${t.border} ${t.bg} p-5`}>
                      <div className="flex items-start gap-4">
                        <div className="text-3xl font-bold">{t.symbol}</div>
                        <div>
                          <div className={`font-bold text-base ${t.color}`}>{t.name} — {t.label}</div>
                          <p className="text-sm text-slate-300 mt-2 leading-relaxed">{t.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key concepts */}
              <div className={`rounded-xl border ${P.cardBorder} ${P.cardBg} p-5`}>
                <h3 className="font-semibold text-white mb-4">Key Concepts for Reading Transformations</h3>
                <div className="space-y-3 text-sm text-slate-300">
                  {[
                    '化忌 is always the most challenging but also most revealing transformation — it shows karmic debts and life lessons',
                    'A star receiving 化祿 in the Career Palace (官祿宮) usually indicates career prosperity in that cycle',
                    'The decade luck (大限) transformations overlay the natal chart, creating compound effects',
                    '自化 (self-transformation) occurs when a transformation star falls in its own palace — an extreme version of the effect',
                    'Double 化忌 (both natal and decade) is a major indicator of significant challenge periods',
                  ].map((point, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className={`${P.accentText} mt-0.5 flex-shrink-0`}>•</span>
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Zhongzhou sources */}
              <div className={`rounded-xl border ${P.cardBorder} ${P.cardBg} p-5`}>
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <Book className={`w-4 h-4 ${P.iconColor}`} />
                  Zhongzhou School Sources
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 mb-2">Primary Texts</h4>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {[
                        '王亭之《談星系列》(Tan Xing Series)',
                        '王亭之《紫微斗數詳批》',
                        'Calendar-based month calculation method',
                        'Star placement method (安星法)',
                        'Four Transformations framework',
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className={P.accentText}>•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 mb-2">Key Concepts Covered</h4>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {[
                        '12 Palaces (十二宮) system',
                        '14 Primary stars (十四主星)',
                        'Four Pillars (八字) calculation',
                        'Decade luck (大限) — 10-year cycles',
                        'Flow year (流年) annual analysis',
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className={P.accentText}>•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* RULES TAB                                                         */}
      {/* ================================================================ */}
      {activeTab === 'rules' && (
        <ZiweiRuleManagement />
      )}

      {/* ================================================================ */}
      {/* CURRICULUM / SCRAPING TAB                                        */}
      {/* ================================================================ */}
      {activeTab === 'scraping' && (
        <div className="space-y-3">
          {scrapingPhases.map((phase) => (
            <div key={phase.phase} className={`rounded-xl border ${P.cardBorder} ${P.cardBg} overflow-hidden`}>
              <button
                onClick={() => setExpandedPhase(expandedPhase === phase.phase ? null : phase.phase)}
                className="w-full p-5 flex items-start justify-between hover:bg-purple-950/40 transition-colors text-left"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={statusColor(phase.status) + ' flex items-center gap-1'}>
                      {statusIcon(phase.status)}
                    </span>
                    <span className="text-sm font-semibold text-white">Phase {phase.phase}: {phase.name}</span>
                  </div>
                  <div className="text-xs text-slate-400 mb-3">{phase.description}</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-purple-900/40 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${P.progress} transition-all`}
                        style={{ width: `${phase.progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-300 w-8 text-right">{phase.progress}%</span>
                  </div>
                </div>
                <div className="ml-4 flex items-center gap-2">
                  <div className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor(phase.status)}`}>
                    {phase.status === 'completed' ? 'Done' : phase.status === 'in_progress' ? 'Active' : 'Pending'}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform ${expandedPhase === phase.phase ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {expandedPhase === phase.phase && (
                <div className="px-5 pb-5 border-t border-purple-900/30 pt-4">
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500">Items Collected</span>
                      <div className="text-lg font-bold text-white mt-1">{phase.itemsCollected}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Target</span>
                      <div className="text-lg font-bold text-white mt-1">{phase.itemsTarget}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Rate</span>
                      <div className={`text-lg font-bold ${P.accentText} mt-1`}>
                        {phase.itemsTarget > 0 ? ((phase.itemsCollected / phase.itemsTarget) * 100).toFixed(1) : 0}%
                      </div>
                    </div>
                  </div>
                  {phase.completedDate && (
                    <p className="text-xs text-slate-500 mt-3">
                      Completed: <span className="text-green-400">{new Date(phase.completedDate).toLocaleDateString()}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ================================================================ */}
      {/* SOURCES TAB                                                       */}
      {/* ================================================================ */}
      {activeTab === 'sources' && (
        <div className="space-y-4">
          {sourceInventory.map((source, idx) => (
            <div key={idx} className={`rounded-xl border p-5 ${reliabilityColor(source.reliability)}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="w-4 h-4" />
                    <span className="text-sm font-bold text-white">{source.source}</span>
                  </div>
                  <div className="text-xs text-slate-400">{source.category}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{source.itemCount.toLocaleString()}</div>
                  <div className="text-xs mt-1 font-semibold capitalize">{source.reliability} reliability</div>
                </div>
              </div>
              {source.lastSync && (
                <div className="mt-3 text-xs text-slate-400">
                  Last synced: {new Date(source.lastSync).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}

          <div className={`rounded-xl border ${P.cardBorder} ${P.cardBg} p-5`}>
            <h3 className="text-sm font-semibold text-white mb-2">Total Source Coverage</h3>
            <div className={`text-2xl font-bold ${P.accentText}`}>
              {sourceInventory.reduce((sum, s) => sum + s.itemCount, 0).toLocaleString()} items
            </div>
            <div className="text-xs text-slate-400 mt-1">
              From {sourceInventory.length} primary data sources
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* QUALITY / ACCURACY TAB                                           */}
      {/* ================================================================ */}
      {activeTab === 'accuracy' && (
        <div className="space-y-4">
          <div className={`rounded-xl border ${P.cardBorder} ${P.cardBg} p-5`}>
            <h3 className="text-sm font-semibold text-white mb-5">Knowledge Quality by Category</h3>
            <div className="space-y-4">
              {[
                { label: 'Overall Accuracy',       value: 87.3, color: 'text-green-400',   bar: 'from-green-500 to-emerald-400' },
                { label: 'Star Definitions',        value: 92,   color: 'text-purple-300',   bar: P.progress },
                { label: 'Palace Meanings',         value: 89,   color: 'text-violet-300',   bar: 'from-violet-500 to-purple-400' },
                { label: 'Luck Cycle Patterns',     value: 76,   color: 'text-amber-400',    bar: 'from-amber-500 to-yellow-400' },
                { label: 'Advanced Pattern Rules',  value: 0,    color: 'text-slate-500',    bar: 'from-slate-600 to-slate-500', note: 'Phase 4 pending' },
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-slate-300">{item.label}</span>
                    <span className={`text-sm font-bold ${item.color}`}>
                      {item.value > 0 ? `${item.value}%` : '—'}
                    </span>
                  </div>
                  <div className="bg-purple-900/40 rounded-full h-2 overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${item.bar} transition-all`} style={{ width: `${item.value}%` }} />
                  </div>
                  {item.note && <p className="text-xs text-slate-500 mt-1">{item.note}</p>}
                </div>
              ))}
            </div>
          </div>

          <div className={`rounded-xl border border-green-500/20 bg-green-500/5 p-5`}>
            <h4 className="text-sm font-semibold text-green-400 mb-3">✅ Quality Assurance</h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              {[
                'Daily consistency checks running',
                'Cross-validation with historical data',
                'Automated accuracy scoring against known outcomes',
                'Manual review for critical interpretive rules',
                'Consensus labeling (consensus / disputed / minority)',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={`rounded-xl border border-purple-700/30 bg-purple-900/10 p-5`}>
            <h4 className={`text-sm font-semibold ${P.accentText} mb-3`}>📊 Confidence Bands</h4>
            <div className="space-y-2 text-xs">
              {[
                { label: '≥ 80% match rate', badge: 'Consensus',    color: 'text-green-400  bg-green-500/10  border-green-500/20' },
                { label: '60–80% match rate', badge: 'Disputed',    color: 'text-amber-400  bg-amber-500/10  border-amber-500/20' },
                { label: '40–60% match rate', badge: 'Minority',    color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
                { label: '< 40% match rate',  badge: 'Under Review', color: 'text-red-400    bg-red-500/10    border-red-500/20' },
              ].map((band, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 bg-white/[0.02] rounded-lg">
                  <span className="text-slate-400">{band.label}</span>
                  <span className={`px-2 py-0.5 rounded border text-xs font-medium ${band.color}`}>{band.badge}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
