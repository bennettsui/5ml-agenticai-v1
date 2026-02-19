'use client';

import { useState, useEffect } from 'react';
import { Loader2, TrendingUp, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';

interface Luck {
  year: number;
  month?: number;
  mainStar: string;
  fortuneLevel: 'excellent' | 'good' | 'moderate' | 'challenging';
  analysis: {
    career: string;
    love: string;
    finance: string;
    health: string;
  };
  riskPeriods: {start: string; end: string; risk: string}[];
  opportunityPeriods: {start: string; end: string; opportunity: string}[];
}

interface DecadeLuck {
  startAge: number;
  endAge: number;
  startYear: number;
  endYear: number;
  mainStar: string;
  theme: string;
  fortuneLevel: 'excellent' | 'good' | 'moderate' | 'challenging';
}

export default function ZiweiPredictions() {
  const [selectedChartId, setSelectedChartId] = useState<string | null>(null);
  const [selectedChart, setSelectedChart] = useState<any>(null);
  const [charts, setCharts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [predictionMode, setPredictionMode] = useState<'decade' | 'annual' | 'monthly'>('decade');
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [decadeLucks, setDecadeLucks] = useState<DecadeLuck[]>([]);
  const [selectedDecade, setSelectedDecade] = useState<DecadeLuck | null>(null);
  const [annualLucks, setAnnualLucks] = useState<Luck[]>([]);
  const [monthlyLucks, setMonthlyLucks] = useState<Luck[]>([]);
  const [expandedDimension, setExpandedDimension] = useState<'career' | 'love' | 'finance' | 'health' | null>('career');

  // Load charts
  useEffect(() => {
    const loadCharts = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/ziwei/charts');
        if (!response.ok) throw new Error('Failed to fetch charts');
        const data = await response.json();
        setCharts(data.charts || []);
        if (data.charts?.length > 0) {
          setSelectedChartId(data.charts[0].id);
        }
      } catch (err) {
        console.error('Error loading charts:', err);
      } finally {
        setLoading(false);
      }
    };
    loadCharts();
  }, []);

  // Load selected chart and generate predictions
  useEffect(() => {
    if (selectedChartId) {
      loadChartAndPredictions(selectedChartId);
    }
  }, [selectedChartId, currentYear]);

  const loadChartAndPredictions = async (chartId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/ziwei/charts/${chartId}`);
      if (!response.ok) throw new Error('Failed to fetch chart');
      const data = await response.json();
      const chart = data.chart || data;
      setSelectedChart(chart);

      // Generate decade luck based on birth year
      generateDecadeLucks(chart.birth_info?.lunarYear || 1990);

      // Generate annual and monthly lucks
      generateAnnualAndMonthlyLucks(chart.birth_info?.lunarYear || 1990, currentYear);
    } catch (err) {
      console.error('Error loading chart:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateDecadeLucks = (birthYear: number) => {
    // Simplified decade luck generation (for demo)
    const decades: DecadeLuck[] = [];
    const currentAge = new Date().getFullYear() - birthYear;

    for (let i = 0; i < 6; i++) {
      const age = i * 10;
      const year = birthYear + age;
      const fortuneLevels: ('excellent' | 'good' | 'moderate' | 'challenging')[] = ['excellent', 'good', 'moderate', 'challenging'];
      const stars = ['紫微', '天府', '武曲', '廉貞', '破軍', '天相'];

      decades.push({
        startAge: age,
        endAge: age + 10,
        startYear: year,
        endYear: year + 10,
        mainStar: stars[i % stars.length],
        theme: ['Early Growth', 'Establishment', 'Peak Power', 'Transformation', 'Consolidation', 'Legacy'][i] || 'Unknown',
        fortuneLevel: fortuneLevels[i % fortuneLevels.length],
      });
    }

    setDecadeLucks(decades);
    if (decades.length > 0) setSelectedDecade(decades[0]);
  };

  const generateAnnualAndMonthlyLucks = (birthYear: number, targetYear: number) => {
    // Simplified annual luck generation
    const annuals: Luck[] = [];
    for (let y = targetYear - 2; y <= targetYear + 5; y++) {
      const fortuneLevels: ('excellent' | 'good' | 'moderate' | 'challenging')[] = ['excellent', 'good', 'moderate', 'challenging'];
      const stars = ['紫微', '天府', '武曲', '廉貞', '破軍'];

      annuals.push({
        year: y,
        mainStar: stars[(y - targetYear + 2) % stars.length],
        fortuneLevel: fortuneLevels[(y - targetYear + 2) % fortuneLevels.length],
        analysis: {
          career: `${y} career outlook: Moderate growth expected in your profession.`,
          love: `${y} relationship focus: Stable period for existing bonds.`,
          finance: `${y} financial status: Conservative approach recommended.`,
          health: `${y} wellness: Regular exercise important this year.`,
        },
        riskPeriods: [
          { start: `${y}-03-15`, end: `${y}-05-20`, risk: 'Business/career challenges' },
        ],
        opportunityPeriods: [
          { start: `${y}-07-01`, end: `${y}-09-30`, opportunity: 'Major career advancement possible' },
        ],
      });
    }

    setAnnualLucks(annuals);

    // Generate monthly lucks for selected year
    const monthlies: Luck[] = [];
    for (let m = 1; m <= 12; m++) {
      const fortuneLevels: ('excellent' | 'good' | 'moderate' | 'challenging')[] = ['excellent', 'good', 'moderate', 'challenging'];
      monthlies.push({
        year: targetYear,
        month: m,
        mainStar: ['紫微', '天府', '武曲'][m % 3],
        fortuneLevel: fortuneLevels[m % fortuneLevels.length],
        analysis: {
          career: `Month ${m}: Focus on team collaboration and project completion.`,
          love: `Month ${m}: Good time for relationship development and communication.`,
          finance: `Month ${m}: Review investments and long-term financial plans.`,
          health: `Month ${m}: Pay attention to stress management and sleep quality.`,
        },
        riskPeriods: [],
        opportunityPeriods: [],
      });
    }

    setMonthlyLucks(monthlies);
  };

  const fortuneColors = {
    excellent: 'bg-green-500/20 border-green-500/50 text-green-400',
    good: 'bg-blue-500/20 border-blue-500/50 text-blue-400',
    moderate: 'bg-amber-500/20 border-amber-500/50 text-amber-400',
    challenging: 'bg-red-500/20 border-red-500/50 text-red-400',
  };

  const fortuneIcons = {
    excellent: <CheckCircle2 className="w-4 h-4" />,
    good: <TrendingUp className="w-4 h-4" />,
    moderate: <AlertCircle className="w-4 h-4" />,
    challenging: <AlertCircle className="w-4 h-4" />,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
          🔮 Predictions & Luck Analysis
        </h2>
        <p className="text-sm text-slate-400">大運 (Decade) • 流年 (Annual) • 流月 (Monthly) luck cycles</p>
      </div>

      {/* Chart Selector */}
      {charts.length > 0 && (
        <div className="rounded-lg border border-slate-700/50 bg-slate-800/60 p-4">
          <label className="text-xs font-semibold text-slate-300 mb-2 block">Select Chart</label>
          <select
            value={selectedChartId || ''}
            onChange={(e) => setSelectedChartId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded text-white text-sm"
          >
            {charts.map(chart => (
              <option key={chart.id} value={chart.id}>
                {chart.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {charts.length === 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <p className="text-sm text-amber-400">No saved charts found. Generate a chart in the <strong>Ziwei Generator</strong> tab first.</p>
        </div>
      )}

      {selectedChart && (
        <div className="space-y-6">
          {/* Prediction Mode Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setPredictionMode('decade')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                predictionMode === 'decade'
                  ? 'bg-amber-600/80 text-white'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              大運 Decade Luck
            </button>
            <button
              onClick={() => setPredictionMode('annual')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                predictionMode === 'annual'
                  ? 'bg-amber-600/80 text-white'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              流年 Annual Luck
            </button>
            <button
              onClick={() => setPredictionMode('monthly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                predictionMode === 'monthly'
                  ? 'bg-amber-600/80 text-white'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              流月 Monthly Luck
            </button>
          </div>

          {/* DECADE LUCK View */}
          {predictionMode === 'decade' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-700/50 bg-slate-800/60 p-4">
                <h3 className="text-sm font-semibold text-white mb-4">大運 Decade Luck Timeline</h3>

                <div className="space-y-2">
                  {decadeLucks.map((decade, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedDecade(decade)}
                      className={`w-full p-3 rounded-lg border text-left transition-colors ${
                        selectedDecade === decade
                          ? 'border-amber-400 bg-amber-950/40'
                          : `border-slate-700/50 bg-slate-700/30 hover:bg-slate-700/50 ${fortuneColors[decade.fortuneLevel]}`
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-bold text-white">
                            Age {decade.startAge}-{decade.endAge} ({decade.startYear}-{decade.endYear})
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            {decade.mainStar} • {decade.theme}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {fortuneIcons[decade.fortuneLevel]}
                          <span className="text-xs font-semibold capitalize">{decade.fortuneLevel}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {selectedDecade && (
                <div className="rounded-lg border border-slate-700/50 bg-slate-800/60 p-4">
                  <h4 className="text-sm font-semibold text-white mb-4">
                    {selectedDecade.theme} ({selectedDecade.startYear}-{selectedDecade.endYear})
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded bg-slate-700/30">
                      <p className="text-xs text-slate-500 font-semibold">Main Star</p>
                      <p className="text-sm text-white mt-1">{selectedDecade.mainStar}</p>
                    </div>
                    <div className="p-3 rounded bg-slate-700/30">
                      <p className="text-xs text-slate-500 font-semibold">Fortune Level</p>
                      <p className="text-sm text-white mt-1 capitalize">{selectedDecade.fortuneLevel}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-4">
                    This decade emphasizes <strong>{selectedDecade.theme.toLowerCase()}</strong>. The influence of <strong>{selectedDecade.mainStar}</strong> suggests a period marked by growth and transformation.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ANNUAL LUCK View */}
          {predictionMode === 'annual' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-700/50 bg-slate-800/60 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white">流年 Annual Luck Analysis</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentYear(currentYear - 1)}
                      className="p-1.5 hover:bg-slate-700 rounded transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-semibold text-white w-12 text-center">{currentYear}</span>
                    <button
                      onClick={() => setCurrentYear(currentYear + 1)}
                      className="p-1.5 hover:bg-slate-700 rounded transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {annualLucks.map((luck, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border ${fortuneColors[luck.fortuneLevel]}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-bold">{luck.year}</div>
                          <div className="text-xs mt-1">主星: {luck.mainStar}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          {fortuneIcons[luck.fortuneLevel]}
                          <span className="text-xs font-semibold capitalize">{luck.fortuneLevel}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Annual Details by Dimension */}
              <div className="rounded-lg border border-slate-700/50 bg-slate-800/60 p-4">
                <h3 className="text-sm font-semibold text-white mb-4">Life Dimensions - {currentYear}</h3>
                <div className="space-y-2">
                  {(['career', 'love', 'finance', 'health'] as const).map(dim => (
                    <div key={dim} className="border border-slate-700/30 rounded">
                      <button
                        onClick={() => setExpandedDimension(expandedDimension === dim ? null : dim)}
                        className="w-full p-3 flex items-center justify-between hover:bg-slate-700/40 transition-colors text-left"
                      >
                        <span className="text-sm font-medium text-white capitalize">{dim}</span>
                        <ChevronRight
                          className={`w-4 h-4 transition-transform ${
                            expandedDimension === dim ? 'rotate-90' : ''
                          }`}
                        />
                      </button>
                      {expandedDimension === dim && (
                        <div className="p-3 border-t border-slate-700/30 bg-slate-700/20 text-xs text-slate-300">
                          {annualLucks.find(l => l.year === currentYear)?.[`analysis`]?.[dim] ||
                            `Analysis for ${dim} in ${currentYear}.`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MONTHLY LUCK View */}
          {predictionMode === 'monthly' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-700/50 bg-slate-800/60 p-4">
                <h3 className="text-sm font-semibold text-white mb-4">流月 Monthly Luck - {currentYear}</h3>

                <div className="grid grid-cols-3 gap-2">
                  {monthlyLucks.map((luck, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border text-center ${fortuneColors[luck.fortuneLevel]}`}
                    >
                      <div className="text-sm font-bold">M{luck.month}</div>
                      <div className="text-xs mt-1">{luck.mainStar}</div>
                      <div className="flex justify-center mt-2">{fortuneIcons[luck.fortuneLevel]}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk & Opportunity for current month */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                  <h4 className="text-xs font-semibold text-red-400 mb-2">⚠️ Risk Periods</h4>
                  <p className="text-xs text-slate-400">
                    {monthlyLucks.find(l => l.month === currentMonth)?.riskPeriods?.[0]?.risk ||
                      'Monitor current month for potential challenges.'}
                  </p>
                </div>
                <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4">
                  <h4 className="text-xs font-semibold text-green-400 mb-2">✨ Opportunities</h4>
                  <p className="text-xs text-slate-400">
                    {monthlyLucks.find(l => l.month === currentMonth)?.opportunityPeriods?.[0]?.opportunity ||
                      'Good period for major decisions and initiatives.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
