'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Loader2, Plus, Trash2, Edit2, Eye } from 'lucide-react';

interface Rule {
  id: string;
  name: string;
  ruleType: string;
  interpretation: {
    zh: string;
    en: string;
  };
  dimensionTags: string[];
  consensusLabel: 'consensus' | 'disputed' | 'minority_view';
  statistics: {
    sampleSize: number | null;
    matchRate: number | null;
    confidence: number | null;
  };
}

export default function ZiweiRuleManagement() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterConsensus, setFilterConsensus] = useState<string>('all');
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Load rules on mount
  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    setLoading(true);
    try {
      const response = await fetch('/data/ziwei-rules-seed.json');
      if (!response.ok) throw new Error('Failed to load rules');

      const data = await response.json();
      const parsedRules: Rule[] = data.rules.map((r: any) => ({
        id: r.id,
        name: r.id.replace('rule-', '').replace('star-group-', '').replace('pattern-', '').replace('miscellaneous-', ''),
        ruleType: r.scope === 'base' ? 'basic_pattern' : r.scope === 'star_group' ? 'star_group' : r.scope === 'major_pattern' ? 'major_pattern' : 'miscellaneous_combo',
        interpretation: r.interpretation,
        dimensionTags: r.dimension_tags || [],
        consensusLabel: r.consensus_label,
        statistics: r.statistics || { sampleSize: null, matchRate: null, confidence: null }
      }));

      setRules(parsedRules);
    } catch (error) {
      console.error('Error loading rules:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter rules based on search and filters
  const filteredRules = rules.filter(rule => {
    const matchesSearch = rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rule.interpretation.zh.includes(searchTerm);
    const matchesType = filterType === 'all' || rule.ruleType === filterType;
    const matchesConsensus = filterConsensus === 'all' || rule.consensusLabel === filterConsensus;

    return matchesSearch && matchesType && matchesConsensus;
  });

  const ruleTypeIcon: Record<string, string> = {
    star_group: '⭐',
    major_pattern: '🎯',
    complex_pattern: '✨',
    basic_pattern: '📊',
    miscellaneous_combo: '🔮'
  };

  const consensusColor: Record<string, string> = {
    consensus: 'bg-green-500/20 text-green-300 border-green-500/30',
    disputed: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    minority_view: 'bg-red-500/20 text-red-300 border-red-500/30'
  };

  const dimensionIcons: Record<string, string> = {
    personality: '🧠',
    career: '💼',
    wealth: '💰',
    health: '🏥',
    relationships: '💑',
    family: '👨‍👩‍👧‍👦',
    education: '📚',
    spirituality: '🧘'
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Ziwei Rules Management</h2>
        <p className="text-slate-400">Manage and review Ziwei interpretation rules and patterns</p>
      </div>

      {/* Search and Filters */}
      <div className="rounded-lg border border-slate-700/50 bg-slate-900/30 p-4 space-y-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search rules by name or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-slate-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Rule Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-slate-600"
            >
              <option value="all">All Types</option>
              <option value="star_group">⭐ Star Groups</option>
              <option value="major_pattern">🎯 Major Patterns</option>
              <option value="complex_pattern">✨ Complex Patterns</option>
              <option value="basic_pattern">📊 Basic Patterns</option>
              <option value="miscellaneous_combo">🔮 Miscellaneous</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Consensus</label>
            <select
              value={filterConsensus}
              onChange={(e) => setFilterConsensus(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-slate-600"
            >
              <option value="all">All Levels</option>
              <option value="consensus">✓ Consensus</option>
              <option value="disputed">? Disputed</option>
              <option value="minority_view">⚠ Minority View</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg bg-slate-900/50 border border-slate-700/50 p-4">
          <div className="text-xs text-slate-500 mb-1">Total Rules</div>
          <div className="text-2xl font-bold text-purple-400">{rules.length}</div>
        </div>
        <div className="rounded-lg bg-slate-900/50 border border-slate-700/50 p-4">
          <div className="text-xs text-slate-500 mb-1">Consensus</div>
          <div className="text-2xl font-bold text-green-400">
            {rules.filter(r => r.consensusLabel === 'consensus').length}
          </div>
        </div>
        <div className="rounded-lg bg-slate-900/50 border border-slate-700/50 p-4">
          <div className="text-xs text-slate-500 mb-1">Disputed</div>
          <div className="text-2xl font-bold text-yellow-400">
            {rules.filter(r => r.consensusLabel === 'disputed').length}
          </div>
        </div>
        <div className="rounded-lg bg-slate-900/50 border border-slate-700/50 p-4">
          <div className="text-xs text-slate-500 mb-1">Filtered Results</div>
          <div className="text-2xl font-bold text-blue-400">{filteredRules.length}</div>
        </div>
      </div>

      {/* Rules List */}
      <div className="space-y-3">
        {loading && (
          <div className="flex items-center justify-center gap-2 p-8 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading rules...
          </div>
        )}

        {!loading && filteredRules.length === 0 && (
          <div className="p-8 text-center text-slate-400">
            No rules match your filters
          </div>
        )}

        {!loading && filteredRules.map((rule) => (
          <div
            key={rule.id}
            className="rounded-lg border border-slate-700/50 bg-slate-900/30 p-4 hover:bg-slate-900/50 transition-colors cursor-pointer"
            onClick={() => {
              setSelectedRule(rule);
              setShowDetails(true);
            }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{ruleTypeIcon[rule.ruleType]}</span>
                  <h3 className="font-semibold text-white">{rule.name}</h3>
                  <span className={`inline-block px-2 py-1 text-xs rounded border ${consensusColor[rule.consensusLabel]}`}>
                    {rule.consensusLabel === 'consensus' ? '✓' : rule.consensusLabel === 'disputed' ? '?' : '⚠'} {rule.consensusLabel}
                  </span>
                </div>
                <p className="text-sm text-slate-300 mb-2">{rule.interpretation.zh}</p>
                {rule.interpretation.en && (
                  <p className="text-xs text-slate-500">{rule.interpretation.en}</p>
                )}
              </div>
              <Eye
                className="w-5 h-5 text-slate-500 hover:text-white flex-shrink-0 ml-4"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedRule(rule);
                  setShowDetails(true);
                }}
              />
            </div>

            {/* Dimension Tags */}
            {rule.dimensionTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-slate-700/30">
                {rule.dimensionTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-slate-800/50 text-slate-300"
                  >
                    <span>{dimensionIcons[tag as keyof typeof dimensionIcons] || '📌'}</span>
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Statistics */}
            {rule.statistics.confidence !== null && (
              <div className="flex gap-4 mt-3 text-xs text-slate-500">
                {rule.statistics.sampleSize && (
                  <div>Sample Size: {rule.statistics.sampleSize}</div>
                )}
                {rule.statistics.matchRate !== null && (
                  <div>Match Rate: {(rule.statistics.matchRate * 100).toFixed(0)}%</div>
                )}
                {rule.statistics.confidence !== null && (
                  <div>Confidence: {(rule.statistics.confidence * 100).toFixed(0)}%</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Details Modal */}
      {showDetails && selectedRule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700/50 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-900 border-b border-slate-700/50 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{ruleTypeIcon[selectedRule.ruleType]}</span>
                <div>
                  <h3 className="font-bold text-white text-lg">{selectedRule.name}</h3>
                  <p className="text-xs text-slate-400">{selectedRule.id}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Interpretation */}
              <div>
                <h4 className="font-semibold text-white mb-2">Chinese Interpretation</h4>
                <p className="text-slate-300 mb-3">{selectedRule.interpretation.zh}</p>
                <h4 className="font-semibold text-white mb-2">English Interpretation</h4>
                <p className="text-slate-300">{selectedRule.interpretation.en}</p>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500">Rule Type</label>
                  <p className="text-white mt-1">{ruleTypeIcon[selectedRule.ruleType]} {selectedRule.ruleType}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500">Consensus Level</label>
                  <p className={`mt-1 inline-block px-2 py-1 text-xs rounded border ${consensusColor[selectedRule.consensusLabel]}`}>
                    {selectedRule.consensusLabel}
                  </p>
                </div>
              </div>

              {/* Dimensions */}
              {selectedRule.dimensionTags.length > 0 && (
                <div>
                  <label className="text-xs text-slate-500 block mb-2">Dimension Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedRule.dimensionTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-slate-800 text-slate-300"
                      >
                        <span>{dimensionIcons[tag as keyof typeof dimensionIcons] || '📌'}</span>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Statistics */}
              {(selectedRule.statistics.confidence !== null || selectedRule.statistics.matchRate !== null) && (
                <div>
                  <label className="text-xs text-slate-500 block mb-2">Statistics</label>
                  <div className="grid grid-cols-3 gap-3">
                    {selectedRule.statistics.sampleSize !== null && (
                      <div className="bg-slate-800/50 rounded p-3">
                        <div className="text-xs text-slate-500">Sample Size</div>
                        <div className="text-lg font-bold text-white mt-1">
                          {selectedRule.statistics.sampleSize}
                        </div>
                      </div>
                    )}
                    {selectedRule.statistics.matchRate !== null && (
                      <div className="bg-slate-800/50 rounded p-3">
                        <div className="text-xs text-slate-500">Match Rate</div>
                        <div className="text-lg font-bold text-blue-400 mt-1">
                          {(selectedRule.statistics.matchRate * 100).toFixed(1)}%
                        </div>
                      </div>
                    )}
                    {selectedRule.statistics.confidence !== null && (
                      <div className="bg-slate-800/50 rounded p-3">
                        <div className="text-xs text-slate-500">Confidence</div>
                        <div className="text-lg font-bold text-green-400 mt-1">
                          {(selectedRule.statistics.confidence * 100).toFixed(1)}%
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
