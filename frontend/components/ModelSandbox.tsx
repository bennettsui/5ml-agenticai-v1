'use client';

import { useState } from 'react';
import { Beaker, Loader2, Clock, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, History } from 'lucide-react';

interface ModelResult {
  status: 'idle' | 'loading' | 'success' | 'error';
  data?: any;
  error?: string;
  duration?: number;
}

interface ModelResults {
  deepseek: ModelResult;
  haiku: ModelResult;
  sonnet: ModelResult;
  perplexity: ModelResult;
}

interface TestHistory {
  id: string;
  timestamp: Date;
  agent: string;
  agentName: string;
  clientName: string;
  brief: string;
  results: ModelResults;
}

export default function ModelSandbox() {
  const [agent, setAgent] = useState('social');
  const [clientName, setClientName] = useState('');
  const [brief, setBrief] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [results, setResults] = useState<ModelResults>({
    deepseek: { status: 'idle' },
    haiku: { status: 'idle' },
    sonnet: { status: 'idle' },
    perplexity: { status: 'idle' },
  });
  const [history, setHistory] = useState<TestHistory[]>([]);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);

  const models = [
    { id: 'deepseek', name: 'DeepSeek Reasoner', color: 'orange' },
    { id: 'haiku', name: 'Claude 3 Haiku', color: 'blue' },
    { id: 'sonnet', name: 'Claude 3.5 Sonnet', color: 'purple' },
    { id: 'perplexity', name: 'Perplexity Sonar Pro', color: 'green' },
  ];

  const agents = [
    { id: 'creative', name: 'Creative Agent', icon: '🎨' },
    { id: 'seo', name: 'SEO Agent', icon: '🔍' },
    { id: 'social', name: 'Social Media Agent', icon: '📱' },
    { id: 'research', name: 'Research Agent', icon: '📊' },
  ];

  const testModel = async (modelId: string) => {
    const startTime = Date.now();

    setResults(prev => ({
      ...prev,
      [modelId]: { status: 'loading' }
    }));

    try {
      const response = await fetch(`/agents/${agent}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: clientName,
          brief: brief,
          model: modelId,
          no_fallback: true
        })
      });

      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      setResults(prev => ({
        ...prev,
        [modelId]: {
          status: 'success',
          data: data.analysis,
          duration
        }
      }));
    } catch (error: any) {
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;

      setResults(prev => ({
        ...prev,
        [modelId]: {
          status: 'error',
          error: error.message,
          duration
        }
      }));
    }
  };

  const handleTestAll = async () => {
    if (!clientName || !brief) {
      alert('Please fill in both client name and brief');
      return;
    }

    setIsTesting(true);

    // Reset all results
    const freshResults: ModelResults = {
      deepseek: { status: 'idle' },
      haiku: { status: 'idle' },
      sonnet: { status: 'idle' },
      perplexity: { status: 'idle' },
    };
    setResults(freshResults);

    // Test all models in parallel
    await Promise.all(models.map(model => testModel(model.id)));

    setIsTesting(false);

    // Capture current test parameters for history
    const currentAgent = agent;
    const currentClientName = clientName;
    const currentBrief = brief;
    const agentInfo = agents.find(a => a.id === currentAgent);

    // Save to history after a delay to ensure results state is updated
    setTimeout(() => {
      setResults(latestResults => {
        const historyEntry: TestHistory = {
          id: `test-${Date.now()}`,
          timestamp: new Date(),
          agent: currentAgent,
          agentName: agentInfo?.name || currentAgent,
          clientName: currentClientName,
          brief: currentBrief,
          results: { ...latestResults }
        };

        setHistory(prev => [historyEntry, ...prev]);
        return latestResults;
      });
    }, 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'loading': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'success': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'error': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      default: return 'text-slate-600 bg-slate-50 dark:bg-slate-700/50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'loading': return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'success': return <CheckCircle2 className="w-4 h-4" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getModelColor = (color: string) => {
    const colors: Record<string, string> = {
      orange: 'text-orange-600 dark:text-orange-400',
      blue: 'text-blue-600 dark:text-blue-400',
      purple: 'text-purple-600 dark:text-purple-400',
      green: 'text-green-600 dark:text-green-400',
    };
    return colors[color] || 'text-slate-600 dark:text-slate-400';
  };

  const formatOutput = (data: any) => {
    if (!data) return null;

    // Handle raw text output
    if (data.raw) {
      return (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <pre className="whitespace-pre-wrap bg-slate-50 dark:bg-slate-900 p-4 rounded-lg text-xs leading-relaxed">
            {data.raw}
          </pre>
        </div>
      );
    }

    const entries = Object.entries(data).filter(([key]) => key !== '_meta');

    return (
      <div className="space-y-4">
        {entries.map(([key, value], index) => (
          <div
            key={key}
            className={`${index > 0 ? 'pt-4 border-t border-slate-100 dark:border-slate-700' : ''}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500 dark:bg-blue-400"></div>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                {key.replace(/_/g, ' ')}
              </div>
            </div>
            <div className="ml-3.5 text-sm text-slate-900 dark:text-white leading-relaxed">
              {Array.isArray(value) ? (
                <ul className="space-y-2">
                  {value.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-slate-400 dark:text-slate-600 mt-0.5">•</span>
                      <span className="flex-1">{String(item)}</span>
                    </li>
                  ))}
                </ul>
              ) : typeof value === 'object' && value !== null ? (
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                  <pre className="text-xs overflow-auto leading-relaxed">
                    {JSON.stringify(value, null, 2)}
                  </pre>
                </div>
              ) : (
                <p className="text-slate-800 dark:text-slate-200">{String(value)}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Beaker className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Model Sandbox</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Test and compare AI models side-by-side with the same brief
            </p>
          </div>
        </div>

        {/* Input Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Select Agent
            </label>
            <select
              value={agent}
              onChange={(e) => setAgent(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isTesting}
            >
              {agents.map(a => (
                <option key={a.id} value={a.id}>
                  {a.icon} {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Client Name
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g., Tech Startup Inc."
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isTesting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Project Brief
            </label>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="Enter your project brief here..."
              rows={4}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={isTesting}
            />
          </div>

          <button
            onClick={handleTestAll}
            disabled={isTesting}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            {isTesting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Testing All Models...
              </>
            ) : (
              <>
                <Beaker className="w-5 h-5" />
                Test All Models
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {models.map(model => {
          const result = results[model.id as keyof ModelResults];
          return (
            <div
              key={model.id}
              className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-6"
            >
              {/* Model Header */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className={`text-lg font-bold ${getModelColor(model.color)}`}>
                  {model.name}
                </h3>
                <div className="flex items-center gap-2">
                  {result.duration && (
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {result.duration.toFixed(2)}s
                    </span>
                  )}
                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
                    {getStatusIcon(result.status)}
                    <span className="capitalize">{result.status}</span>
                  </div>
                </div>
              </div>

              {/* Model Output */}
              <div className="max-h-96 overflow-y-auto">
                {result.status === 'idle' && (
                  <div className="text-center py-12 text-slate-400 dark:text-slate-600">
                    <Beaker className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Ready to test</p>
                  </div>
                )}

                {result.status === 'loading' && (
                  <div className="text-center py-12">
                    <Loader2 className="w-12 h-12 mx-auto mb-3 text-blue-600 dark:text-blue-400 animate-spin" />
                    <p className="text-sm text-slate-600 dark:text-slate-400">Testing {model.name}...</p>
                  </div>
                )}

                {result.status === 'success' && result.data && (
                  <div className="text-sm">
                    {formatOutput(result.data)}
                  </div>
                )}

                {result.status === 'error' && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">Error</h4>
                        <p className="text-sm text-red-700 dark:text-red-400">{result.error}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Test History */}
      {history.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <History className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Test History</h3>
            <span className="text-sm text-slate-500 dark:text-slate-400">({history.length} test{history.length !== 1 ? 's' : ''})</span>
          </div>

          <div className="space-y-3">
            {history.map((entry, index) => (
              <div
                key={entry.id}
                className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden"
              >
                {/* History Item Header */}
                <button
                  onClick={() => setExpandedHistory(expandedHistory === entry.id ? null : entry.id)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                        #{history.length - index}
                      </span>
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        {entry.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="h-4 w-px bg-slate-300 dark:bg-slate-600"></div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {entry.agentName}
                    </span>
                    <div className="h-4 w-px bg-slate-300 dark:bg-slate-600"></div>
                    <span className="text-sm text-slate-600 dark:text-slate-400 truncate max-w-xs">
                      {entry.clientName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Success/Error counts */}
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-green-600 dark:text-green-400">
                        {Object.values(entry.results).filter(r => r.status === 'success').length} ✓
                      </span>
                      <span className="text-red-600 dark:text-red-400">
                        {Object.values(entry.results).filter(r => r.status === 'error').length} ✗
                      </span>
                    </div>
                    {expandedHistory === entry.id ? (
                      <ChevronUp className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Expanded History Details */}
                {expandedHistory === entry.id && (
                  <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                    {/* Brief */}
                    <div className="mb-4">
                      <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                        Brief
                      </h4>
                      <p className="text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 p-3 rounded-lg">
                        {entry.brief}
                      </p>
                    </div>

                    {/* Model Results */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {models.map(model => {
                        const result = entry.results[model.id as keyof ModelResults];
                        return (
                          <div
                            key={model.id}
                            className="border border-slate-200 dark:border-slate-700 rounded-lg p-3"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h5 className={`text-sm font-bold ${getModelColor(model.color)}`}>
                                {model.name}
                              </h5>
                              <div className="flex items-center gap-2">
                                {result.duration && (
                                  <span className="text-xs text-slate-600 dark:text-slate-400">
                                    {result.duration.toFixed(2)}s
                                  </span>
                                )}
                                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${getStatusColor(result.status)}`}>
                                  {getStatusIcon(result.status)}
                                </div>
                              </div>
                            </div>

                            {result.status === 'success' && result.data && (
                              <div className="text-xs max-h-48 overflow-y-auto">
                                {formatOutput(result.data)}
                              </div>
                            )}

                            {result.status === 'error' && (
                              <div className="text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                                {result.error}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Clear History Button */}
          {history.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => {
                  if (confirm('Clear all test history?')) {
                    setHistory([]);
                    setExpandedHistory(null);
                  }
                }}
                className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
              >
                Clear History
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
