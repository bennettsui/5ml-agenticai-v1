'use client';

import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, AlertCircle, Database, BookOpen, FileText, Zap } from 'lucide-react';

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

export default function ZiweiKnowledgeManagement() {
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<KnowledgeMetrics | null>(null);
  const [scrapingPhases, setScrapingPhases] = useState<ScrapingProgress[]>([]);
  const [sourceInventory, setSourceInventory] = useState<SourceInventory[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'scraping' | 'sources' | 'accuracy'>('overview');
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null);

  useEffect(() => {
    loadKnowledgeData();
  }, []);

  const loadKnowledgeData = async () => {
    setLoading(true);
    try {
      // Simulate fetching knowledge management data
      // In production, this would call /api/knowledge/metrics or similar

      setMetrics({
        totalRecords: 12847,
        totalStars: 108,
        totalPalaces: 12,
        totalRules: 2456,
        averageAccuracy: 87.3,
        lastUpdated: new Date().toISOString(),
      });

      setScrapingPhases([
        {
          phase: 1,
          name: 'Star System Foundation',
          description: 'Core star meanings, attributes, and basic interactions',
          status: 'completed',
          progress: 100,
          itemsCollected: 108,
          itemsTarget: 108,
          completedDate: '2024-12-15',
        },
        {
          phase: 2,
          name: 'Palace & House System',
          description: '12 palace definitions, ruler meanings, and house interpretations',
          status: 'completed',
          progress: 100,
          itemsCollected: 144,
          itemsTarget: 144,
          completedDate: '2025-01-10',
        },
        {
          phase: 3,
          name: 'Luck Cycles & Predictions',
          description: '大運, 流年, 流月 cycle patterns and analysis rules',
          status: 'in_progress',
          progress: 65,
          itemsCollected: 485,
          itemsTarget: 750,
          startDate: '2025-01-20',
        },
        {
          phase: 4,
          name: 'Advanced Rules & Patterns',
          description: '三方四正, 生克制化, and advanced interpretations',
          status: 'pending',
          progress: 0,
          itemsCollected: 0,
          itemsTarget: 1200,
        },
      ]);

      setSourceInventory([
        {
          source: 'Classical Ziwei Texts',
          category: 'Primary Sources',
          itemCount: 2847,
          reliability: 'high',
          lastSync: '2025-02-01',
        },
        {
          source: 'Contemporary Interpretations',
          category: 'Secondary Sources',
          itemCount: 4156,
          reliability: 'medium',
          lastSync: '2025-01-28',
        },
        {
          source: 'Case Study Database',
          category: 'Empirical Data',
          itemCount: 3245,
          reliability: 'high',
          lastSync: '2025-02-05',
        },
        {
          source: 'Rule Pattern Analysis',
          category: 'Calculated Data',
          itemCount: 2599,
          reliability: 'medium',
          lastSync: '2025-02-03',
        },
      ]);
    } catch (err) {
      console.error('Error loading knowledge data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400 bg-green-500/10';
      case 'in_progress':
        return 'text-amber-400 bg-amber-500/10';
      case 'pending':
        return 'text-slate-400 bg-slate-500/10';
      default:
        return 'text-slate-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'in_progress':
        return <Zap className="w-4 h-4" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getReliabilityColor = (reliability: string) => {
    switch (reliability) {
      case 'high':
        return 'bg-green-500/20 border-green-500/50 text-green-400';
      case 'medium':
        return 'bg-amber-500/20 border-amber-500/50 text-amber-400';
      case 'low':
        return 'bg-red-500/20 border-red-500/50 text-red-400';
      default:
        return '';
    }
  };

  if (loading && !metrics) {
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
          <Database className="w-5 h-5 text-amber-400" />
          Knowledge Management
        </h2>
        <p className="text-sm text-slate-400">Data inventory, scraping progress, and knowledge quality metrics</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-700/50">
        {(['overview', 'scraping', 'sources', 'accuracy'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            {tab === 'overview' && '📊 Overview'}
            {tab === 'scraping' && '🔄 Scraping Progress'}
            {tab === 'sources' && '📚 Sources'}
            {tab === 'accuracy' && '✅ Accuracy'}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && metrics && (
        <div className="space-y-4">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="rounded-lg border border-slate-700/50 bg-slate-800/60 p-4">
              <div className="text-xs text-slate-500 font-semibold">Total Records</div>
              <div className="text-2xl font-bold text-white mt-2">{metrics.totalRecords.toLocaleString()}</div>
              <div className="text-xs text-slate-400 mt-1">Knowledge items</div>
            </div>

            <div className="rounded-lg border border-slate-700/50 bg-slate-800/60 p-4">
              <div className="text-xs text-slate-500 font-semibold">Stars</div>
              <div className="text-2xl font-bold text-blue-400 mt-2">{metrics.totalStars}</div>
              <div className="text-xs text-slate-400 mt-1">Main stars</div>
            </div>

            <div className="rounded-lg border border-slate-700/50 bg-slate-800/60 p-4">
              <div className="text-xs text-slate-500 font-semibold">Palaces</div>
              <div className="text-2xl font-bold text-amber-400 mt-2">{metrics.totalPalaces}</div>
              <div className="text-xs text-slate-400 mt-1">Houses</div>
            </div>

            <div className="rounded-lg border border-slate-700/50 bg-slate-800/60 p-4">
              <div className="text-xs text-slate-500 font-semibold">Rules</div>
              <div className="text-2xl font-bold text-green-400 mt-2">{metrics.totalRules}</div>
              <div className="text-xs text-slate-400 mt-1">Patterns</div>
            </div>

            <div className="rounded-lg border border-slate-700/50 bg-slate-800/60 p-4">
              <div className="text-xs text-slate-500 font-semibold">Accuracy</div>
              <div className="text-2xl font-bold text-purple-400 mt-2">{metrics.averageAccuracy.toFixed(1)}%</div>
              <div className="text-xs text-slate-400 mt-1">Avg. quality</div>
            </div>
          </div>

          {/* System Status */}
          <div className="rounded-lg border border-slate-700/50 bg-slate-800/60 p-4">
            <h3 className="text-sm font-semibold text-white mb-3">System Status</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
                <span className="text-slate-300">Database Connection</span>
                <span className="text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Healthy
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
                <span className="text-slate-300">Data Consistency</span>
                <span className="text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Valid
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
                <span className="text-slate-300">Last Sync</span>
                <span className="text-slate-400">{new Date(metrics.lastUpdated).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCRAPING PROGRESS TAB */}
      {activeTab === 'scraping' && (
        <div className="space-y-4">
          {scrapingPhases.map((phase) => (
            <div key={phase.phase} className="rounded-lg border border-slate-700/50 bg-slate-800/60 overflow-hidden">
              <button
                onClick={() => setExpandedPhase(expandedPhase === phase.phase ? null : phase.phase)}
                className="w-full p-4 flex items-start justify-between hover:bg-slate-700/40 transition-colors text-left"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(phase.status)}
                    <span className="text-sm font-semibold text-white">
                      Phase {phase.phase}: {phase.name}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mb-3">{phase.description}</div>

                  {/* Progress Bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-700/50 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          phase.status === 'completed'
                            ? 'bg-green-500'
                            : phase.status === 'in_progress'
                            ? 'bg-amber-500'
                            : 'bg-slate-600'
                        }`}
                        style={{width: `${phase.progress}%`}}
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-300 w-8 text-right">{phase.progress}%</span>
                  </div>
                </div>

                <div className="ml-4 text-right">
                  <div className={`text-sm font-semibold px-2 py-1 rounded ${getStatusColor(phase.status)} inline-block`}>
                    {phase.status === 'completed' && 'Completed'}
                    {phase.status === 'in_progress' && 'In Progress'}
                    {phase.status === 'pending' && 'Pending'}
                  </div>
                </div>
              </button>

              {/* Expanded Details */}
              {expandedPhase === phase.phase && (
                <div className="p-4 border-t border-slate-700/50 bg-slate-700/20 space-y-3">
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500">Items Collected</span>
                      <div className="text-lg font-bold text-white mt-1">{phase.itemsCollected}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Target Items</span>
                      <div className="text-lg font-bold text-white mt-1">{phase.itemsTarget}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Collection Rate</span>
                      <div className="text-lg font-bold text-blue-400 mt-1">
                        {((phase.itemsCollected / phase.itemsTarget) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {phase.startDate && (
                    <div className="pt-3 border-t border-slate-700/30 space-y-1 text-xs">
                      <p className="text-slate-500">Start Date: <span className="text-slate-300">{new Date(phase.startDate).toLocaleDateString()}</span></p>
                      {phase.completedDate && (
                        <p className="text-slate-500">Completed: <span className="text-green-400">{new Date(phase.completedDate).toLocaleDateString()}</span></p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* SOURCES TAB */}
      {activeTab === 'sources' && (
        <div className="space-y-4">
          {sourceInventory.map((source, idx) => (
            <div key={idx} className={`rounded-lg border p-4 ${getReliabilityColor(source.reliability)}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="w-4 h-4" />
                    <span className="text-sm font-semibold text-white">{source.source}</span>
                  </div>
                  <div className="text-xs text-slate-400">{source.category}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{source.itemCount.toLocaleString()}</div>
                  <div className="text-xs mt-1">
                    <span className="capitalize font-semibold">
                      {source.reliability === 'high' && '⭐ High'}
                      {source.reliability === 'medium' && '⭐⭐ Medium'}
                      {source.reliability === 'low' && '⭐ Low'}
                    </span>
                  </div>
                </div>
              </div>
              {source.lastSync && (
                <div className="mt-2 text-xs text-slate-400">
                  Last synced: {new Date(source.lastSync).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}

          <div className="rounded-lg border border-slate-700/50 bg-slate-800/60 p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Total Source Coverage</h3>
            <div className="text-2xl font-bold text-amber-400">
              {sourceInventory.reduce((sum, s) => sum + s.itemCount, 0).toLocaleString()} items
            </div>
            <div className="text-xs text-slate-400 mt-2">
              From {sourceInventory.length} primary data sources
            </div>
          </div>
        </div>
      )}

      {/* ACCURACY TAB */}
      {activeTab === 'accuracy' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-700/50 bg-slate-800/60 p-4">
            <h3 className="text-sm font-semibold text-white mb-4">Knowledge Quality Metrics</h3>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Overall Accuracy</span>
                  <span className="text-sm font-bold text-green-400">87.3%</span>
                </div>
                <div className="bg-slate-700/50 rounded-full h-2 overflow-hidden">
                  <div className="bg-green-500 h-full" style={{width: '87.3%'}} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Star Definitions</span>
                  <span className="text-sm font-bold text-blue-400">92%</span>
                </div>
                <div className="bg-slate-700/50 rounded-full h-2 overflow-hidden">
                  <div className="bg-blue-500 h-full" style={{width: '92%'}} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Palace Meanings</span>
                  <span className="text-sm font-bold text-purple-400">89%</span>
                </div>
                <div className="bg-slate-700/50 rounded-full h-2 overflow-hidden">
                  <div className="bg-purple-500 h-full" style={{width: '89%'}} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Luck Cycle Patterns</span>
                  <span className="text-sm font-bold text-amber-400">76%</span>
                </div>
                <div className="bg-slate-700/50 rounded-full h-2 overflow-hidden">
                  <div className="bg-amber-500 h-full" style={{width: '76%'}} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Advanced Rules</span>
                  <span className="text-sm font-bold text-slate-400">-</span>
                </div>
                <div className="bg-slate-700/50 rounded-full h-2 overflow-hidden">
                  <div className="bg-slate-600 h-full" style={{width: '0%'}} />
                </div>
                <div className="text-xs text-slate-500 mt-1">Phase 4 pending</div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4">
            <h4 className="text-sm font-semibold text-green-400 mb-2">✅ Quality Assurance</h4>
            <ul className="space-y-1 text-xs text-slate-400">
              <li>• Daily consistency checks running</li>
              <li>• Cross-validation with historical data</li>
              <li>• Automated accuracy scoring</li>
              <li>• Manual review for critical data</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
