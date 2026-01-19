'use client';

import { useState } from 'react';
import { Sparkles, Search, Share2, TrendingUp, Loader2, BarChart3, PenTool, Image, Film } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  description: string;
  capabilities: string[];
}

const agents: Agent[] = [
  {
    id: 'social',
    name: 'Social Media Agent',
    icon: Share2,
    color: 'green',
    description: 'Creates comprehensive social media strategies with trending format analysis',
    capabilities: ['Platform selection', 'Content pillars', 'Posting frequency', 'Engagement strategy', 'Hashtag strategy'],
  },
  {
    id: 'research',
    name: 'Research Agent',
    icon: TrendingUp,
    color: 'orange',
    description: 'Deep brand research with 5-stage methodology (3Cs, SWOT, real-time insights)',
    capabilities: ['Brand analysis', 'Competitor intelligence', '3Cs framework', 'SWOT analysis', 'Market positioning'],
  },
  {
    id: 'seo',
    name: 'SEO Agent',
    icon: Search,
    color: 'blue',
    description: 'Comprehensive SEO analysis and optimization recommendations',
    capabilities: ['Keyword research', 'Content strategy', 'Technical SEO', 'Backlink opportunities', 'Trend analysis'],
  },
  {
    id: 'creative',
    name: 'Creative Agent',
    icon: Sparkles,
    color: 'purple',
    description: 'Creative content generation and campaign ideation',
    capabilities: ['Campaign concepts', 'Creative copy', 'Content ideas', 'Brand storytelling', 'Visual direction'],
  },
];

const models = [
  { id: 'deepseek', name: 'DeepSeek Reasoner', description: 'Fast & affordable (default)' },
  { id: 'haiku', name: 'Claude Haiku', description: 'General purpose fallback' },
  { id: 'perplexity', name: 'Perplexity Sonar Pro', description: 'Real-time web research' },
];

const colorClasses: Record<string, { bg: string; border: string; icon: string; button: string }> = {
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-700', icon: 'text-purple-600 dark:text-purple-400', button: 'bg-purple-600 hover:bg-purple-700' },
  blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-700', icon: 'text-blue-600 dark:text-blue-400', button: 'bg-blue-600 hover:bg-blue-700' },
  green: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-700', icon: 'text-green-600 dark:text-green-400', button: 'bg-green-600 hover:bg-green-700' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-700', icon: 'text-orange-600 dark:text-orange-400', button: 'bg-orange-600 hover:bg-orange-700' },
  indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-200 dark:border-indigo-700', icon: 'text-indigo-600 dark:text-indigo-400', button: 'bg-indigo-600 hover:bg-indigo-700' },
  pink: { bg: 'bg-pink-50 dark:bg-pink-900/20', border: 'border-pink-200 dark:border-pink-700', icon: 'text-pink-600 dark:text-pink-400', button: 'bg-pink-600 hover:bg-pink-700' },
  cyan: { bg: 'bg-cyan-50 dark:bg-cyan-900/20', border: 'border-cyan-200 dark:border-cyan-700', icon: 'text-cyan-600 dark:text-cyan-400', button: 'bg-cyan-600 hover:bg-cyan-700' },
};

export default function AgentTesting() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [model, setModel] = useState('deepseek');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [formData, setFormData] = useState({
    client_name: '',
    brief: '',
    industry: '',
    useWebResearch: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`/agents/${selectedAgent}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          model,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to execute agent' });
    } finally {
      setLoading(false);
    }
  };

  const selectedAgentData = agents.find(a => a.id === selectedAgent);

  return (
    <div className="space-y-6">
      {/* Agent Selection */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Select an Agent</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => {
            const Icon = agent.icon;
            const colors = colorClasses[agent.color];
            const isSelected = selectedAgent === agent.id;

            return (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent.id)}
                className={`
                  p-4 rounded-lg border-2 transition-all text-left
                  ${isSelected
                    ? `${colors.bg} ${colors.border} shadow-md`
                    : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-slate-300'
                  }
                `}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${colors.bg}`}>
                    <Icon className={colors.icon} size={20} />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">{agent.name}</h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">{agent.description}</p>
                <div className="flex flex-wrap gap-1">
                  {agent.capabilities.slice(0, 3).map((cap, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded text-xs">
                      {cap}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Testing Form */}
      {selectedAgent && selectedAgentData && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            {(() => {
              const Icon = selectedAgentData.icon;
              const colors = colorClasses[selectedAgentData.color];
              return (
                <>
                  <div className={`p-3 rounded-lg ${colors.bg}`}>
                    <Icon className={colors.icon} size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedAgentData.name}</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{selectedAgentData.description}</p>
                  </div>
                </>
              );
            })()}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Client Name
                </label>
                <input
                  type="text"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Tesla"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Industry
                </label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Electric Vehicles"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Project Brief
              </label>
              <textarea
                value={formData.brief}
                onChange={(e) => setFormData({ ...formData, brief: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 h-32"
                placeholder="Describe your project requirements..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                AI Model
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} - {m.description}
                  </option>
                ))}
              </select>
            </div>

            {(selectedAgent === 'seo' || selectedAgent === 'social' || selectedAgent === 'research') && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="useWebResearch"
                  checked={formData.useWebResearch}
                  onChange={(e) => setFormData({ ...formData, useWebResearch: e.target.checked })}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <label htmlFor="useWebResearch" className="text-sm text-slate-700 dark:text-slate-300">
                  Enable web research for real-time insights (uses Perplexity)
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`
                w-full py-3 px-4 rounded-lg text-white font-medium transition-colors
                ${loading ? 'bg-slate-400 cursor-not-allowed' : `${colorClasses[selectedAgentData.color].button}`}
              `}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={20} />
                  Processing...
                </span>
              ) : (
                `Run ${selectedAgentData.name}`
              )}
            </button>
          </form>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Analysis Results</h3>
          {result.error ? (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-300">
              {result.error}
            </div>
          ) : (
            <div className="space-y-4">
              <pre className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg overflow-x-auto text-sm text-slate-900 dark:text-slate-100">
                {JSON.stringify(result, null, 2)}
              </pre>
              {result._meta && (
                <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                  <span>Model: {result._meta.model}</span>
                  {result._meta.usage && (
                    <span>Tokens: {result._meta.usage.input_tokens + result._meta.usage.output_tokens}</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
