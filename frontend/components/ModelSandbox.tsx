'use client';

import { useState } from 'react';
import { Beaker, Loader2, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

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
    setResults({
      deepseek: { status: 'idle' },
      haiku: { status: 'idle' },
      sonnet: { status: 'idle' },
      perplexity: { status: 'idle' },
    });

    // Test all models in parallel
    await Promise.all(models.map(model => testModel(model.id)));

    setIsTesting(false);
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

    const entries = Object.entries(data).filter(([key]) => key !== '_meta');

    return (
      <div className="space-y-3">
        {entries.map(([key, value]) => (
          <div key={key}>
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
              {key.replace(/_/g, ' ')}
            </div>
            <div className="text-sm text-slate-900 dark:text-white">
              {Array.isArray(value) ? (
                <ul className="list-disc list-inside space-y-1">
                  {value.map((item, idx) => (
                    <li key={idx}>{String(item)}</li>
                  ))}
                </ul>
              ) : typeof value === 'object' ? (
                <pre className="text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded overflow-auto">
                  {JSON.stringify(value, null, 2)}
                </pre>
              ) : (
                <p>{String(value)}</p>
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
    </div>
  );
}
