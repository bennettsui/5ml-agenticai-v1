'use client';

import React, { useState } from 'react';
import { ChevronDown, Calendar, Clock, MapPin, User } from 'lucide-react';
import { NatalChart, ZiweiTab } from '@/types/ziwei';
import ZiWeiGrid from './ZiWeiGrid';
import { defaultStarVisualConfig } from '@/config/starVisualConfig';
import '@/styles/ziwei-theme.css';

interface NatalChartViewProps {
  chart: NatalChart;
  activeTab?: ZiweiTab;
  onTabChange?: (tab: ZiweiTab) => void;
}

/**
 * NatalChartView Component — Dashboard Layout
 * Left: Birth Chart | Right: Visitor Details + Analysis Metrics
 */
export const NatalChartView: React.FC<NatalChartViewProps> = ({
  chart,
  activeTab = 'generation',
  onTabChange,
}) => {
  const [selectedStar, setSelectedStar] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const tabs: { id: ZiweiTab; label: string }[] = [
    { id: 'generation', label: '✨ Generation' },
    { id: 'analysis', label: '🔍 Analysis' },
    { id: 'reference', label: '📖 Reference' },
    { id: 'predictions', label: '🔮 Predictions' },
  ];

  const handleStarClick = (palaceId: string, starId: string) => {
    setSelectedStar(starId);
    console.log(`Selected: ${palaceId}/${starId}`);
  };

  // Calculate age from birth year
  const age = new Date().getFullYear() - chart.birth.yearGregorian;

  return (
    <div className="min-h-screen bg-slate-950">
      {/* ================================================================ */}
      {/* TOP BAR                                                           */}
      {/* ================================================================ */}
      <header className="bg-slate-900/80 border-b border-slate-700/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <span className="text-lg font-bold text-amber-400">紫</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">ZI WEI ANALYTICS</h1>
              <p className="text-xs text-slate-500">中州派紫微斗數排盤系統</p>
            </div>
          </div>
          {/* Birth Info */}
          <div className="text-right text-sm">
            <div className="text-slate-300 font-medium">{chart.birth.name || 'Demo Chart'}</div>
            <div className="text-slate-500 text-xs">
              {chart.birth.yearGregorian} · {chart.birth.location}
            </div>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <nav className="border-t border-slate-700/50 bg-slate-800/50">
          <div className="max-w-7xl mx-auto px-6 flex space-x-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange?.(tab.id)}
                className={`px-1 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </nav>
      </header>

      {/* ================================================================ */}
      {/* MAIN CONTENT                                                     */}
      {/* ================================================================ */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* GENERATION TAB */}
        {activeTab === 'generation' && (
          <div>
            <h2 className="text-xl font-bold text-white mb-6">Birth Chart (命盤)</h2>
            <ZiWeiGrid
              layer={chart.layer}
              visualConfig={defaultStarVisualConfig}
              onStarClick={handleStarClick}
            />
          </div>
        )}

        {/* ANALYSIS TAB — DASHBOARD LAYOUT */}
        {activeTab === 'analysis' && (
          <AnalysisDashboard
            chart={chart}
            age={age}
            expandedSection={expandedSection}
            setExpandedSection={setExpandedSection}
          />
        )}

        {/* REFERENCE TAB */}
        {activeTab === 'reference' && (
          <div className="bg-slate-800/50 rounded-lg p-8 border border-slate-700/50 text-center text-slate-400">
            <p>Reference guide coming soon...</p>
            <p className="text-xs mt-2">Star meanings, palace interpretations, and traditional rules</p>
          </div>
        )}

        {/* PREDICTIONS TAB */}
        {activeTab === 'predictions' && (
          <div className="bg-slate-800/50 rounded-lg p-8 border border-slate-700/50 text-center text-slate-400">
            <p>Predictions coming soon...</p>
            <p className="text-xs mt-2">Yearly forecasts and timing analysis</p>
          </div>
        )}
      </main>

      {/* Selected Star Info */}
      {selectedStar && (
        <div className="fixed bottom-4 right-4 bg-slate-800 border border-amber-500/30 rounded-lg p-4 text-sm text-slate-300 max-w-xs z-50">
          <p className="text-amber-400 font-semibold">Selected Star</p>
          <p>{selectedStar}</p>
          <button
            onClick={() => setSelectedStar(null)}
            className="text-xs mt-2 px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
};

// ================================================================
// ANALYSIS DASHBOARD — 2-COLUMN LAYOUT
// ================================================================
interface AnalysisDashboardProps {
  chart: NatalChart;
  age: number;
  expandedSection: string | null;
  setExpandedSection: (section: string | null) => void;
}

const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({
  chart,
  age,
  expandedSection,
  setExpandedSection,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* LEFT COLUMN: BIRTH CHART */}
      <div className="lg:col-span-1">
        <div className="sticky top-24">
          <h3 className="text-lg font-bold text-white mb-4">命盤</h3>
          <ZiWeiGrid
            layer={chart.layer}
            visualConfig={defaultStarVisualConfig}
            onStarClick={() => {}}
          />
        </div>
      </div>

      {/* RIGHT COLUMN: DETAILS + ANALYSIS */}
      <div className="lg:col-span-2 space-y-6">
        {/* ╔════════════════════════════════════════════════╗ */}
        {/* ║          VISITOR DETAILS CARD                 ║ */}
        {/* ╚════════════════════════════════════════════════╝ */}
        <VisitorDetailsCard chart={chart} age={age} />

        {/* ╔════════════════════════════════════════════════╗ */}
        {/* ║          AI ANALYSIS METRICS                  ║ */}
        {/* ╚════════════════════════════════════════════════╝ */}
        <AnalysisMetrics />

        {/* ╔════════════════════════════════════════════════╗ */}
        {/* ║          DETAILED ANALYSIS SECTIONS           ║ */}
        {/* ╚════════════════════════════════════════════════╝ */}
        <ExpandableSection
          title="生活軌跡"
          description="Life Trajectory & Overall Direction"
          isExpanded={expandedSection === 'life-trajectory'}
          onToggle={() =>
            setExpandedSection(
              expandedSection === 'life-trajectory' ? null : 'life-trajectory'
            )
          }
        >
          <p className="text-slate-400 text-sm leading-relaxed">
            Your life trajectory is marked by significant transformations and growth phases. Early career focus on
            building foundations, mid-life emphasis on achievement and recognition, with later years focused on
            wisdom and mentorship. Key turning points occur around age 30 and 42 based on traditional Ziwei cycles.
          </p>
        </ExpandableSection>

        <ExpandableSection
          title="事業運程"
          description="Career & Professional Development"
          isExpanded={expandedSection === 'career'}
          onToggle={() =>
            setExpandedSection(expandedSection === 'career' ? null : 'career')
          }
        >
          <p className="text-slate-400 text-sm leading-relaxed">
            Strong career potential with peaks during 30-40 age range. Best suited for leadership roles or independent
            entrepreneurship. Recommend leveraging interpersonal skills and strategic thinking. Potential challenges in
            mid-40s require proactive planning and continuous learning.
          </p>
        </ExpandableSection>

        <ExpandableSection
          title="感情婚姻"
          description="Romance & Relationships"
          isExpanded={expandedSection === 'romance'}
          onToggle={() =>
            setExpandedSection(expandedSection === 'romance' ? null : 'romance')
          }
        >
          <p className="text-slate-400 text-sm leading-relaxed">
            Relationship prospects show stability with compatible partners born in certain years. Marriage is favorable
            in 30s with long-term harmony. Important to maintain communication and trust. Family relationships remain
            strong throughout life.
          </p>
        </ExpandableSection>

        <ExpandableSection
          title="財務健康"
          description="Wealth & Health Analysis"
          isExpanded={expandedSection === 'wealth-health'}
          onToggle={() =>
            setExpandedSection(
              expandedSection === 'wealth-health' ? null : 'wealth-health'
            )
          }
        >
          <p className="text-slate-400 text-sm leading-relaxed">
            Moderate to strong wealth potential with steady accumulation. Health remains good with attention to stress
            management in 40s-50s. Recommend preventive health measures and lifestyle balance. Lucky years: 2026, 2027,
            2032 for major financial activities.
          </p>
        </ExpandableSection>
      </div>
    </div>
  );
};

// ================================================================
// VISITOR DETAILS CARD
// ================================================================
interface VisitorDetailsCardProps {
  chart: NatalChart;
  age: number;
}

const VisitorDetailsCard: React.FC<VisitorDetailsCardProps> = ({ chart, age }) => {
  const { birth } = chart;
  const genderLabel = birth.gender === 'M' ? '男' : '女';

  return (
    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/60 rounded-lg p-6 border border-slate-700/50">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-700/30">
        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-amber-500/30 to-amber-600/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
          <span className="text-3xl font-bold text-amber-400">
            {birth.name?.charAt(0) || '?'}
          </span>
        </div>
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-white">{birth.name || '—'}</h3>
          <p className="text-sm text-slate-400 mt-1">
            {birth.gender === 'M' ? 'Male' : 'Female'} · Age {age}
          </p>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Date of Birth */}
        <DetailItem
          icon={<Calendar className="w-4 h-4" />}
          label="出生日期"
          value={`${birth.yearGregorian}年${String(birth.monthLunar).padStart(2, '0')}月${String(birth.dayLunar).padStart(2, '0')}日`}
        />

        {/* Birth Time */}
        <DetailItem
          icon={<Clock className="w-4 h-4" />}
          label="出生時辰"
          value={`${String(birth.hour).padStart(2, '0')}:00`}
        />

        {/* Location */}
        <DetailItem
          icon={<MapPin className="w-4 h-4" />}
          label="出生地點"
          value={birth.location || '—'}
          span2
        />

        {/* Gender */}
        <DetailItem
          icon={<User className="w-4 h-4" />}
          label="性別"
          value={genderLabel}
        />
      </div>
    </div>
  );
};

// ================================================================
// DETAIL ITEM SUB-COMPONENT
// ================================================================
interface DetailItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  span2?: boolean;
}

const DetailItem: React.FC<DetailItemProps> = ({ icon, label, value, span2 }) => (
  <div className={`${span2 ? 'col-span-2' : ''}`}>
    <div className="flex items-center gap-2 mb-1">
      <span className="text-slate-500">{icon}</span>
      <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
        {label}
      </span>
    </div>
    <p className="text-sm font-semibold text-slate-200 ml-6">{value}</p>
  </div>
);

// ================================================================
// ANALYSIS METRICS GRID
// ================================================================
const AnalysisMetrics: React.FC = () => {
  const metrics = [
    {
      label: '命格評分',
      value: '8.2',
      subtitle: 'Life Quality',
      color: 'from-purple-500/20 to-purple-600/10',
    },
    {
      label: '事業運勢',
      value: '8.5',
      subtitle: 'Career Luck',
      color: 'from-blue-500/20 to-blue-600/10',
    },
    {
      label: '感情運勢',
      value: '7.8',
      subtitle: 'Romance Luck',
      color: 'from-pink-500/20 to-pink-600/10',
    },
    {
      label: '財務運勢',
      value: '7.5',
      subtitle: 'Wealth Luck',
      color: 'from-green-500/20 to-green-600/10',
    },
  ];

  return (
    <div>
      <h3 className="text-lg font-bold text-white mb-4">AI Analysis Metrics</h3>
      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric, idx) => (
          <div
            key={idx}
            className={`bg-gradient-to-br ${metric.color} rounded-lg p-4 border border-slate-700/30`}
          >
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
              {metric.label}
            </p>
            <p className="text-3xl font-bold text-white mb-1">{metric.value}</p>
            <p className="text-xs text-slate-500">{metric.subtitle}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ================================================================
// EXPANDABLE SECTION COMPONENT
// ================================================================
interface ExpandableSectionProps {
  title: string;
  description: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const ExpandableSection: React.FC<ExpandableSectionProps> = ({
  title,
  description,
  isExpanded,
  onToggle,
  children,
}) => (
  <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-800/80 transition-colors"
    >
      <div className="text-left flex-1">
        <h4 className="font-semibold text-white mb-1">{title}</h4>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
      <ChevronDown
        className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ml-4 ${
          isExpanded ? 'rotate-180' : ''
        }`}
      />
    </button>

    {isExpanded && (
      <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-700/30">
        {children}
      </div>
    )}
  </div>
);

export default NatalChartView;
