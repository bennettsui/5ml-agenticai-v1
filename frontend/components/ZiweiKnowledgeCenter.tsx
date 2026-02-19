'use client';

import { useState, useEffect } from 'react';
import {
  Search, Filter, Download, Upload, RefreshCw, BookOpen, Database,
  TrendingUp, AlertCircle, CheckCircle, Clock, Zap, BarChart3,
  ChevronDown, Plus, Trash2, Edit2, Eye, Settings, Activity
} from 'lucide-react';

interface KnowledgeGap {
  id: string;
  category: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  coverage: number; // 0-100%
  itemsNeeded: number;
  itemsComplete: number;
  priority: number;
  estimatedTokens: number;
}

interface ScrapingSource {
  id: string;
  name: string;
  url: string;
  authority: '⭐⭐⭐⭐⭐' | '⭐⭐⭐⭐' | '⭐⭐⭐';
  status: 'pending' | 'scraping' | 'completed' | 'failed';
  progress: number;
  itemsFound: number;
  lastRun?: string;
  nextRun?: string;
}

export default function ZiweiKnowledgeCenter() {
  const [activeTab, setActiveTab] = useState<'overview' | 'gaps' | 'scraping' | 'sources' | 'settings'>('overview');
  const [knowledgeGaps, setKnowledgeGaps] = useState<KnowledgeGap[]>([]);
  const [scrapingSources, setScrapingSources] = useState<ScrapingSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [expandedGap, setExpandedGap] = useState<string | null>(null);

  useEffect(() => {
    loadKnowledgeData();
    loadScrapingSources();
  }, []);

  const loadKnowledgeData = async () => {
    try {
      const response = await fetch('/api/ziwei/knowledge/gaps');
      if (response.ok) {
        const data = await response.json();
        setKnowledgeGaps(data);
      }
    } catch (err) {
      console.error('Error loading knowledge gaps:', err);
    }
  };

  const loadScrapingSources = async () => {
    try {
      const response = await fetch('/api/ziwei/scraping/sources');
      if (response.ok) {
        const data = await response.json();
        setScrapingSources(data);
      }
    } catch (err) {
      console.error('Error loading scraping sources:', err);
    }
  };

  const severityColor = {
    CRITICAL: 'bg-red-500/20 text-red-300 border-red-500/30',
    HIGH: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    MEDIUM: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    LOW: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
  };

  const statusColor = {
    pending: 'bg-slate-500/20 text-slate-300',
    scraping: 'bg-blue-500/20 text-blue-300 animate-pulse',
    completed: 'bg-green-500/20 text-green-300',
    failed: 'bg-red-500/20 text-red-300'
  };

  const statusIcon = {
    pending: <Clock className="w-4 h-4" />,
    scraping: <RefreshCw className="w-4 h-4 animate-spin" />,
    completed: <CheckCircle className="w-4 h-4" />,
    failed: <AlertCircle className="w-4 h-4" />
  };

  // ====================================================================
  // OVERVIEW TAB
  // ====================================================================
  const OverviewTab = () => {
    const totalGaps = knowledgeGaps.length;
    const criticalGaps = knowledgeGaps.filter(g => g.severity === 'CRITICAL').length;
    const avgCoverage = Math.round(
      knowledgeGaps.reduce((sum, g) => sum + g.coverage, 0) / knowledgeGaps.length
    );
    const activeScraping = scrapingSources.filter(s => s.status === 'scraping').length;

    return (
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500 mb-1">Knowledge Coverage</div>
                <div className="text-2xl font-bold text-blue-400">{avgCoverage}%</div>
              </div>
              <Database className="w-8 h-8 text-slate-700" />
            </div>
          </div>

          <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500 mb-1">Knowledge Gaps</div>
                <div className="text-2xl font-bold text-orange-400">{totalGaps}</div>
                <div className="text-xs text-red-400 mt-1">{criticalGaps} critical</div>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
          </div>

          <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500 mb-1">Active Scraping</div>
                <div className="text-2xl font-bold text-green-400">{activeScraping}</div>
                <div className="text-xs text-slate-400 mt-1">{scrapingSources.length} sources</div>
              </div>
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500 mb-1">Target Completion</div>
                <div className="text-2xl font-bold text-purple-400">9 weeks</div>
                <div className="text-xs text-slate-400 mt-1">Phase 1-4</div>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Coverage Progress */}
        <div className="rounded-lg border border-slate-700/50 bg-slate-800/60 p-6">
          <h3 className="text-lg font-bold text-white mb-4">Knowledge Coverage by Category</h3>
          <div className="space-y-3">
            {knowledgeGaps.slice(0, 5).map(gap => (
              <div key={gap.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">{gap.category}</span>
                  <span className="text-slate-300">{gap.coverage}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-700/50 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                    style={{ width: `${gap.coverage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button className="rounded-lg border border-slate-700/50 bg-slate-900/30 hover:bg-slate-900/50 p-4 transition-colors text-center">
            <RefreshCw className="w-5 h-5 mx-auto mb-2 text-blue-400" />
            <div className="text-xs font-medium text-white">Start Scraping</div>
          </button>
          <button className="rounded-lg border border-slate-700/50 bg-slate-900/30 hover:bg-slate-900/50 p-4 transition-colors text-center">
            <BarChart3 className="w-5 h-5 mx-auto mb-2 text-green-400" />
            <div className="text-xs font-medium text-white">View Metrics</div>
          </button>
          <button className="rounded-lg border border-slate-700/50 bg-slate-900/30 hover:bg-slate-900/50 p-4 transition-colors text-center">
            <BookOpen className="w-5 h-5 mx-auto mb-2 text-amber-400" />
            <div className="text-xs font-medium text-white">Read Docs</div>
          </button>
          <button className="rounded-lg border border-slate-700/50 bg-slate-900/30 hover:bg-slate-900/50 p-4 transition-colors text-center">
            <Settings className="w-5 h-5 mx-auto mb-2 text-purple-400" />
            <div className="text-xs font-medium text-white">Settings</div>
          </button>
        </div>
      </div>
    );
  };

  // ====================================================================
  // KNOWLEDGE GAPS TAB
  // ====================================================================
  const GapsTab = () => {
    const filteredGaps = filterSeverity === 'all'
      ? knowledgeGaps
      : knowledgeGaps.filter(g => g.severity === filterSeverity);

    return (
      <div className="space-y-4">
        {/* Filter & Search */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search gaps..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-slate-600"
            />
          </div>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none"
          >
            <option value="all">All Severities</option>
            <option value="CRITICAL">🔴 CRITICAL</option>
            <option value="HIGH">🟠 HIGH</option>
            <option value="MEDIUM">🟡 MEDIUM</option>
            <option value="LOW">🔵 LOW</option>
          </select>
        </div>

        {/* Gaps List */}
        <div className="space-y-3">
          {filteredGaps.map(gap => (
            <div
              key={gap.id}
              className="rounded-lg border border-slate-700/50 bg-slate-900/30 hover:bg-slate-900/50 transition-colors"
            >
              <div
                onClick={() => setExpandedGap(expandedGap === gap.id ? null : gap.id)}
                className="p-4 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-white">{gap.category}</h4>
                      <span className={`inline-block px-2 py-1 text-xs rounded border ${severityColor[gap.severity]}`}>
                        {gap.severity}
                      </span>
                      <span className="text-xs text-slate-500 ml-auto">
                        Priority: {gap.priority}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400">{gap.description}</p>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-600 transition-transform ${
                      expandedGap === gap.id ? 'rotate-180' : ''
                    }`}
                  />
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Coverage</span>
                    <span className="text-slate-400">{gap.itemsComplete}/{gap.itemsNeeded}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-700/50 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                      style={{ width: `${gap.coverage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>{gap.coverage}% complete</span>
                    <span>~{gap.estimatedTokens}K tokens</span>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedGap === gap.id && (
                <div className="px-4 pb-4 border-t border-slate-700/30 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-slate-500">Items Needed</div>
                      <div className="text-lg font-bold text-white">{gap.itemsNeeded}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Items Complete</div>
                      <div className="text-lg font-bold text-green-400">{gap.itemsComplete}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Estimated Cost</div>
                      <div className="text-sm text-blue-400">~{gap.estimatedTokens}K tokens</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Status</div>
                      <div className="text-sm text-slate-300">In Queue</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 px-3 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
                      Start Scraping
                    </button>
                    <button className="flex-1 px-3 py-2 rounded border border-slate-600 hover:border-slate-500 text-white text-sm font-medium transition-colors">
                      View Sources
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ====================================================================
  // SCRAPING SOURCES TAB
  // ====================================================================
  const ScrapingTab = () => {
    return (
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Start Phase 1 Scraping
          </button>
          <button className="px-4 py-2 rounded-lg border border-slate-600 hover:border-slate-500 text-white text-sm font-medium transition-colors">
            Schedule
          </button>
          <button className="px-4 py-2 rounded-lg border border-slate-600 hover:border-slate-500 text-white text-sm font-medium transition-colors">
            Pause All
          </button>
        </div>

        {/* Sources List */}
        <div className="space-y-3">
          {scrapingSources.map(source => (
            <div key={source.id} className="rounded-lg border border-slate-700/50 bg-slate-900/30 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-white">{source.name}</h4>
                    <span className="text-xs text-slate-400">{source.authority}</span>
                  </div>
                  <p className="text-xs text-slate-500 break-all">{source.url}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${statusColor[source.status]}`}>
                    {statusIcon[source.status]}
                    {source.status}
                  </span>
                  <div className="flex gap-1">
                    <button className="p-1 hover:bg-slate-700/50 rounded text-slate-400 hover:text-white transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-1 hover:bg-slate-700/50 rounded text-slate-400 hover:text-white transition-colors">
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Progress</span>
                  <span className="text-slate-400">{source.progress}% ({source.itemsFound} items found)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-700/50 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                    style={{ width: `${source.progress}%` }}
                  />
                </div>
              </div>

              {/* Timing Info */}
              <div className="flex gap-4 mt-3 text-xs text-slate-500">
                {source.lastRun && <div>Last run: {source.lastRun}</div>}
                {source.nextRun && <div>Next run: {source.nextRun}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ====================================================================
  // SOURCES MANAGEMENT TAB
  // ====================================================================
  const SourcesTab = () => {
    const phases = [
      {
        phase: 1,
        name: 'Critical Foundation',
        sources: scrapingSources.filter(s => ['source-002', 'source-001', 'source-015', 'source-016'].includes(s.id)),
        weeks: '1-2',
        tokens: 50000
      },
      {
        phase: 2,
        name: 'Specialized Knowledge',
        sources: scrapingSources.filter(s => ['source-007', 'source-008', 'source-013', 'source-011'].includes(s.id)),
        weeks: '3-4',
        tokens: 20000
      }
    ];

    return (
      <div className="space-y-6">
        {phases.map(phaseData => (
          <div key={phaseData.phase} className="rounded-lg border border-slate-700/50 bg-slate-900/30 p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Phase {phaseData.phase}: {phaseData.name}</h3>
                <p className="text-sm text-slate-400">Weeks {phaseData.weeks} • ~{phaseData.tokens}K tokens</p>
              </div>
              <button className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-colors">
                Run Phase {phaseData.phase}
              </button>
            </div>

            <div className="space-y-2">
              {phaseData.sources.map(source => (
                <div key={source.id} className="flex items-center justify-between p-2 rounded bg-slate-800/50 hover:bg-slate-800 transition-colors">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">{source.name}</div>
                    <div className="text-xs text-slate-500">{source.authority}</div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${statusColor[source.status]}`}>
                    {statusIcon[source.status]}
                    {source.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ====================================================================
  // SETTINGS TAB
  // ====================================================================
  const SettingsTab = () => {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-slate-700/50 bg-slate-900/30 p-4">
          <h3 className="text-lg font-bold text-white mb-4">Scraping Configuration</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Daily Token Budget</label>
              <input
                type="number"
                defaultValue="50000"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-slate-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Minimum Confidence Threshold</label>
              <select className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none">
                <option>0.70 (Lower - faster integration)</option>
                <option selected>0.80 (Balanced)</option>
                <option>0.90 (Higher - thorough validation)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Devil's Advocate Engagement</label>
              <select className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none">
                <option>Always (Thorough - higher cost)</option>
                <option selected>Smart (Only for conflicts & low confidence)</option>
                <option>Minimal (Cost optimization)</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="autoIntegrate" defaultChecked className="rounded" />
              <label htmlFor="autoIntegrate" className="text-sm text-slate-400">Auto-integrate when confidence > 0.85</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="notifications" defaultChecked className="rounded" />
              <label htmlFor="notifications" className="text-sm text-slate-400">Notify on phase completion</label>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-700/50 bg-slate-900/30 p-4">
          <h3 className="text-lg font-bold text-white mb-4">Advanced Settings</h3>
          <div className="space-y-3">
            <button className="w-full px-4 py-2 text-left rounded-lg border border-slate-600 hover:border-slate-500 text-white text-sm transition-colors">
              Reset All Progress
            </button>
            <button className="w-full px-4 py-2 text-left rounded-lg border border-slate-600 hover:border-slate-500 text-white text-sm transition-colors">
              Export Knowledge Database
            </button>
            <button className="w-full px-4 py-2 text-left rounded-lg border border-red-600/50 hover:border-red-500 text-red-400 hover:text-red-300 text-sm transition-colors">
              Clear Cache & Restart
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">📚 Ziwei Knowledge Center</h2>
        <p className="text-slate-400">Manage knowledge gaps, scraping progress, and continuous improvement</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-700/50 overflow-x-auto">
        {[
          { id: 'overview', label: '📊 Overview', icon: Activity },
          { id: 'gaps', label: '⚠️ Knowledge Gaps', icon: AlertCircle },
          { id: 'scraping', label: '🔄 Scraping', icon: RefreshCw },
          { id: 'sources', label: '📖 Sources', icon: BookOpen },
          { id: 'settings', label: '⚙️ Settings', icon: Settings }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'gaps' && <GapsTab />}
        {activeTab === 'scraping' && <ScrapingTab />}
        {activeTab === 'sources' && <SourcesTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
}
