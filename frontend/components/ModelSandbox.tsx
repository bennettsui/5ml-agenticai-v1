'use client';

import React, { useState, useEffect } from 'react';
import { Beaker, Loader2, Clock, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, History, Trash2 } from 'lucide-react';

interface ModelResult {
  status: 'idle' | 'loading' | 'success' | 'error';
  data?: any;
  error?: string;
  duration?: number;
}

interface ModelResults {
  deepseek: ModelResult;
  haiku: ModelResult;
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
    perplexity: { status: 'idle' },
  });
  const [history, setHistory] = useState<TestHistory[]>([]);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);

  // Model pricing (per million tokens)
  const modelPricing: Record<string, { input: number; output: number }> = {
    'deepseek': { input: 0.03, output: 0.11 }, // DeepSeek V3.2
    'haiku': { input: 0.25, output: 1.25 }, // Claude 3 Haiku
    'perplexity': { input: 3.00, output: 15.00 }, // Perplexity Sonar Pro
  };

  const models = [
    { id: 'deepseek', name: 'DeepSeek Reasoner', color: 'orange' },
    { id: 'haiku', name: 'Claude 3 Haiku', color: 'blue' },
    { id: 'perplexity', name: 'Perplexity Sonar Pro', color: 'green' },
  ];

  const agents = [
    { id: 'creative', name: 'Creative Agent', icon: '🎨' },
    { id: 'seo', name: 'SEO Agent', icon: '🔍' },
    { id: 'social', name: 'Social Media Agent', icon: '📱' },
    { id: 'research', name: 'Research Agent', icon: '📊' },
  ];

  // Load history from database on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await fetch('/api/sandbox/tests');
      const data = await response.json();

      if (data.success && data.tests) {
        const loadedHistory: TestHistory[] = data.tests.map((test: any) => ({
          id: test.test_id,
          timestamp: new Date(test.created_at),
          agent: test.agent_type,
          agentName: agents.find(a => a.id === test.agent_type)?.name || test.agent_type,
          clientName: test.client_name,
          brief: test.brief,
          results: test.results
        }));
        setHistory(loadedHistory);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
      // Silently fail - history just won't be loaded
    }
  };

  const saveToDatabase = async (test: Omit<TestHistory, 'id' | 'timestamp'>) => {
    try {
      const response = await fetch('/api/sandbox/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_type: test.agent,
          client_name: test.clientName,
          brief: test.brief,
          results: test.results
        })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to save to database:', error);
      return null;
    }
  };

  const clearHistoryFromDatabase = async () => {
    try {
      await fetch('/api/sandbox/tests', { method: 'DELETE' });
    } catch (error) {
      console.error('Failed to clear history from database:', error);
    }
  };

  const deleteTest = async (testId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this test?')) {
      return;
    }

    try {
      const response = await fetch(`/api/sandbox/tests/${testId}`, { method: 'DELETE' });
      const data = await response.json();

      if (data.success) {
        setHistory(prev => prev.filter(entry => entry.id !== testId));
        if (expandedHistory === testId) {
          setExpandedHistory(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete test:', error);
      alert('Failed to delete test');
    }
  };

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

      // Check if response indicates N/A (like Perplexity with Creative Agent)
      const isNotApplicable = data.analysis?.status === 'not_applicable';

      setResults(prev => ({
        ...prev,
        [modelId]: {
          status: isNotApplicable ? 'idle' : 'success',
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
    setTimeout(async () => {
      setResults(latestResults => {
        const historyEntry: Omit<TestHistory, 'id' | 'timestamp'> = {
          agent: currentAgent,
          agentName: agentInfo?.name || currentAgent,
          clientName: currentClientName,
          brief: currentBrief,
          results: { ...latestResults }
        };

        // Save to database and update local state
        saveToDatabase(historyEntry).then(response => {
          if (response && response.success) {
            // Use the test_id from database as the id
            const fullHistoryEntry: TestHistory = {
              id: response.test_id,
              timestamp: new Date(response.created_at),
              ...historyEntry
            };
            setHistory(prev => [fullHistoryEntry, ...prev]);
          }
        });

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

  const calculateCost = (modelId: string, usage: any) => {
    if (!usage || !modelPricing[modelId]) return null;

    const pricing = modelPricing[modelId];
    let inputTokens = 0;
    let outputTokens = 0;

    // Handle different token field formats
    if (usage.input_tokens !== undefined) {
      inputTokens = usage.input_tokens;
      outputTokens = usage.output_tokens || 0;
    } else if (usage.prompt_tokens !== undefined) {
      inputTokens = usage.prompt_tokens;
      outputTokens = usage.completion_tokens || 0;
    }

    const inputCost = (inputTokens / 1000000) * pricing.input;
    const outputCost = (outputTokens / 1000000) * pricing.output;
    const totalCost = inputCost + outputCost;

    return {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      inputCost,
      outputCost,
      totalCost
    };
  };

  // Recursive function to render nested values
  const renderValue = (value: any, depth: number = 0): React.ReactElement => {
    if (value === null || value === undefined) {
      return <span className="text-slate-400 dark:text-slate-600 italic">N/A</span>;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-slate-400 dark:text-slate-600 italic">Empty list</span>;
      }
      // Check if array contains objects
      const hasObjects = value.some(item => typeof item === 'object' && item !== null && !Array.isArray(item));

      if (hasObjects) {
        // Render array of objects as cards
        return (
          <div className="space-y-3">
            {value.map((item, idx) => (
              <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                {typeof item === 'object' && item !== null ? (
                  <div className="space-y-2">
                    {Object.entries(item).map(([k, v]) => (
                      <div key={k}>
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{k.replace(/_/g, ' ')}: </span>
                        <span className="text-sm text-slate-800 dark:text-slate-200">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-slate-800 dark:text-slate-200">{String(item)}</span>
                )}
              </div>
            ))}
          </div>
        );
      } else {
        // Render simple array as bullet list
        return (
          <ul className="space-y-2">
            {value.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-slate-400 dark:text-slate-600 mt-0.5">•</span>
                <span className="flex-1 text-slate-800 dark:text-slate-200">{String(item)}</span>
              </li>
            ))}
          </ul>
        );
      }
    }

    if (typeof value === 'object' && value !== null) {
      // Render nested object
      return (
        <div className={`space-y-2 ${depth > 0 ? 'pl-4 border-l-2 border-slate-200 dark:border-slate-700' : ''}`}>
          {Object.entries(value).map(([k, v]) => (
            <div key={k}>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {k.replace(/_/g, ' ')}:
              </div>
              <div className="ml-2">
                {renderValue(v, depth + 1)}
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Render string/number/boolean
    return <p className="text-slate-800 dark:text-slate-200 leading-relaxed">{String(value)}</p>;
  };

  const formatOutput = (data: any, modelId?: string) => {
    if (!data) return null;

    // Handle N/A case (Perplexity with Creative Agent)
    if (data.status === 'not_applicable') {
      return (
        <div className="space-y-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
              ⓘ Not Applicable
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-400 leading-relaxed mb-3">
              {data.reason}
            </p>
            {data.recommendation && (
              <p className="text-sm text-blue-700 dark:text-blue-500 font-medium">
                💡 {data.recommendation}
              </p>
            )}
          </div>
        </div>
      );
    }

    // Handle raw text output
    if (data.raw) {
      return (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <pre className="whitespace-pre-wrap bg-white dark:bg-slate-800 p-4 rounded-lg text-xs leading-relaxed border border-slate-200 dark:border-slate-700">
            {data.raw}
          </pre>
        </div>
      );
    }

    const entries = Object.entries(data).filter(([key]) => key !== '_meta' && key !== 'status' && key !== 'reason' && key !== 'recommendation');

    // Get usage and cost info from _meta
    const meta = data._meta;
    const modelsUsed = meta?.models_used || [];
    let usage = null;
    let costInfo = null;

    if (modelsUsed.length > 0 && modelId) {
      usage = modelsUsed[0].usage;
      costInfo = calculateCost(modelId, usage);
    }

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
            <div className="ml-3.5 text-sm leading-relaxed">
              {renderValue(value)}
            </div>
          </div>
        ))}

        {/* Usage and Cost Information */}
        {costInfo && (
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 space-y-2">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-wide mb-2">
                Usage & Cost
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Input Tokens:</span>
                  <span className="ml-2 font-mono text-slate-900 dark:text-white">{costInfo.inputTokens.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Output Tokens:</span>
                  <span className="ml-2 font-mono text-slate-900 dark:text-white">{costInfo.outputTokens.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Total Tokens:</span>
                  <span className="ml-2 font-mono text-slate-900 dark:text-white">{costInfo.totalTokens.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Est. Cost:</span>
                  <span className="ml-2 font-mono font-semibold text-green-600 dark:text-green-400">
                    ${costInfo.totalCost.toFixed(6)}
                  </span>
                </div>
              </div>
              {modelsUsed.length > 0 && modelsUsed[0].model && (
                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
                  Model: {modelsUsed[0].model} ({modelsUsed[0].model_id})
                </div>
              )}
            </div>
          </div>
        )}
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
                    {formatOutput(result.data, model.id)}
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
                className="group border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden"
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
                  <div className="flex items-center gap-3">
                    {/* Success/Error counts */}
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-green-600 dark:text-green-400">
                        {Object.values(entry.results).filter(r => r.status === 'success').length} ✓
                      </span>
                      <span className="text-red-600 dark:text-red-400">
                        {Object.values(entry.results).filter(r => r.status === 'error').length} ✗
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => deleteTest(entry.id, e)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                        title="Delete test"
                      >
                        <Trash2 size={14} className="text-red-600 dark:text-red-400" />
                      </button>
                      {expandedHistory === entry.id ? (
                        <ChevronUp className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      )}
                    </div>
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
                                {formatOutput(result.data, model.id)}
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
                onClick={async () => {
                  if (confirm('Clear all test history?')) {
                    await clearHistoryFromDatabase();
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
