'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Home,
  Settings,
  LayoutDashboard,
  Pause,
  Square,
  Eye,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Radio,
  PlusCircle,
  Users,
  FolderOpen,
  ChevronDown,
  Globe,
  FileText,
  Brain,
  Wifi,
  WifiOff,
  Activity,
} from 'lucide-react';

interface Topic {
  id?: number;
  topic_id: string;
  name: string;
  status: string;
  keywords?: string[];
}

interface ScanProgress {
  sourcesScanned: number;
  totalSources: number;
  articlesFound: number;
  articlesAnalyzed: number;
  highImportanceCount: number;
  status: 'scanning' | 'analyzing' | 'syncing' | 'complete' | 'failed' | 'idle';
  currentSource?: string;
}

interface SourceStatus {
  sourceId: string;
  sourceName: string;
  status: 'active' | 'complete' | 'failed';
  articlesFound?: number;
  error?: string;
  step?: 'connecting' | 'fetching' | 'parsing' | 'analyzing' | 'complete';
  message?: string;
  url?: string;
}

interface ActivityLog {
  id: string;
  time: string;
  type: 'info' | 'source' | 'article' | 'success' | 'error';
  message: string;
  details?: string;
}

interface AnalyzedArticle {
  article_id: string;
  title: string;
  source_name: string;
  source_url: string;
  importance_score: number;
  content_summary: string;
  key_insights: string[];
  action_items: string[];
  tags: string[];
}

interface ErrorLog {
  time: string;
  sourceId?: string;
  message: string;
}

export default function LiveScanPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [topicId, setTopicId] = useState<string>('');
  const [topicName, setTopicName] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [progress, setProgress] = useState<ScanProgress>({
    sourcesScanned: 0,
    totalSources: 0,
    articlesFound: 0,
    articlesAnalyzed: 0,
    highImportanceCount: 0,
    status: 'idle',
  });
  const [sourceStatuses, setSourceStatuses] = useState<Map<string, SourceStatus>>(new Map());
  const [analyzedArticles, setAnalyzedArticles] = useState<AnalyzedArticle[]>([]);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const activityLogRef = useRef<HTMLDivElement>(null);

  // Fetch all topics on mount
  useEffect(() => {
    fetchTopics();
  }, []);

  // Get topic from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('topic') || '';
    if (id) {
      setTopicId(id);
    }
  }, []);

  // Load topic name when topicId changes
  useEffect(() => {
    if (topicId) {
      fetch(`/api/intelligence/topics/${topicId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setTopicName(data.topic.name);
          }
        })
        .catch(console.error);

      // Update URL
      const url = new URL(window.location.href);
      url.searchParams.set('topic', topicId);
      window.history.replaceState({}, '', url.toString());

      // Connect to WebSocket
      connectWebSocket(topicId);
    }

    return () => {
      wsRef.current?.close();
    };
  }, [topicId]);

  const fetchTopics = async () => {
    setLoadingTopics(true);
    try {
      const response = await fetch('/api/intelligence/topics');
      const data = await response.json();
      if (data.success) {
        setTopics(data.topics || []);
        // Auto-select first topic if none selected
        if (!topicId && data.topics?.length > 0) {
          const params = new URLSearchParams(window.location.search);
          const urlTopicId = params.get('topic');
          if (urlTopicId) {
            setTopicId(urlTopicId);
          } else {
            setTopicId(data.topics[0].topic_id);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch topics:', error);
    } finally {
      setLoadingTopics(false);
    }
  };

  const handleTopicChange = (newTopicId: string) => {
    setTopicId(newTopicId);
    setProgress({
      sourcesScanned: 0,
      totalSources: 0,
      articlesFound: 0,
      articlesAnalyzed: 0,
      highImportanceCount: 0,
      status: 'idle',
    });
    setSourceStatuses(new Map());
    setAnalyzedArticles([]);
    setErrorLogs([]);
    setActivityLog([]);
  };

  const addActivityLog = (type: ActivityLog['type'], message: string, details?: string) => {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      time: new Date().toISOString(),
      type,
      message,
      details,
    };
    setActivityLog(prev => [newLog, ...prev].slice(0, 100));
  };

  const connectWebSocket = (topicId: string) => {
    // Connect to WebSocket on same host
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    // Subscribe to topic updates after connection
    ws.onopen = () => {
      setIsConnected(true);
      console.log('[WebSocket] Connected');
      addActivityLog('info', 'Connected to real-time updates server');
      // Subscribe to this topic's updates
      ws.send(JSON.stringify({ type: 'subscribe', batchId: topicId }));
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('[WebSocket] Disconnected');
      addActivityLog('info', 'Disconnected from server, reconnecting...');
      // Attempt reconnect after 3 seconds
      setTimeout(() => connectWebSocket(topicId), 3000);
    };

    ws.onerror = error => {
      console.error('[WebSocket] Error:', error);
    };

    ws.onmessage = event => {
      try {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
      } catch (err) {
        console.error('[WebSocket] Parse error:', err);
      }
    };

    wsRef.current = ws;
  };

  const handleWebSocketMessage = (message: { event?: string; type?: string; data?: unknown; batchId?: string }) => {
    // Handle different message formats
    const event = message.event || message.type;
    const data = message.data;

    switch (event) {
      case 'connected':
      case 'subscribed':
        addActivityLog('info', message.type === 'subscribed' ? 'Subscribed to topic updates' : 'WebSocket connected');
        break;

      case 'progress_update':
        setProgress(data as ScanProgress);
        break;

      case 'source_status_update':
        const sourceStatus = data as SourceStatus;
        setSourceStatuses(prev => {
          const newMap = new Map(prev);
          newMap.set(sourceStatus.sourceId, sourceStatus);
          return newMap;
        });
        // Add activity log based on step
        if (sourceStatus.step === 'connecting') {
          addActivityLog('source', `Connecting to ${sourceStatus.sourceName}`, sourceStatus.url);
        } else if (sourceStatus.step === 'fetching') {
          addActivityLog('source', `Fetching content from ${sourceStatus.sourceName}`, sourceStatus.message);
        } else if (sourceStatus.step === 'parsing') {
          addActivityLog('source', `Parsing articles from ${sourceStatus.sourceName}`, sourceStatus.message);
        } else if (sourceStatus.step === 'analyzing') {
          addActivityLog('source', `Analyzing with AI: ${sourceStatus.sourceName}`, sourceStatus.message);
        } else if (sourceStatus.step === 'complete') {
          addActivityLog('success', `Completed: ${sourceStatus.sourceName}`, `Found ${sourceStatus.articlesFound} articles`);
        }
        break;

      case 'article_analyzed':
        const article = data as AnalyzedArticle;
        setAnalyzedArticles(prev => [article, ...prev].slice(0, 50));
        addActivityLog('article', `Analyzed: ${article.title.substring(0, 50)}...`, `Score: ${article.importance_score}/100`);
        break;

      case 'error_occurred':
        const error = data as { sourceId?: string; message: string };
        setErrorLogs(prev => [
          { time: new Date().toISOString(), ...error },
          ...prev,
        ].slice(0, 100));
        addActivityLog('error', error.message);
        break;

      case 'scan_complete':
        setProgress(prev => ({ ...prev, status: 'complete' }));
        addActivityLog('success', 'Scan completed successfully!', `Analyzed ${(data as { articlesAnalyzed?: number })?.articlesAnalyzed || 0} articles`);
        break;

      case 'update':
        // Handle wrapped update messages
        if (message.data) {
          handleWebSocketMessage({ event: (message.data as { event: string }).event, data: (message.data as { data: unknown }).data });
        }
        break;
    }
  };

  const handleStartScan = async () => {
    if (!topicId) return;

    setProgress(prev => ({ ...prev, status: 'scanning' }));
    setSourceStatuses(new Map());
    setAnalyzedArticles([]);
    setErrorLogs([]);
    setActivityLog([]);

    addActivityLog('info', `Starting scan for topic: ${topicName}`);

    try {
      const response = await fetch('/api/intelligence/scan/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId }),
      });

      const data = await response.json();

      if (data.success) {
        addActivityLog('info', `Scan initiated with ${data.totalSources || 0} sources`, `Scan ID: ${data.scanId}`);
        setProgress(prev => ({
          ...prev,
          totalSources: data.totalSources || 0,
          status: 'scanning',
        }));
      } else {
        addActivityLog('error', `Failed to start scan: ${data.error}`);
        setProgress(prev => ({ ...prev, status: 'failed' }));
      }
    } catch (error) {
      console.error('Failed to start scan:', error);
      addActivityLog('error', 'Failed to connect to server');
      setProgress(prev => ({ ...prev, status: 'failed' }));
    }
  };

  const handlePauseScan = () => {
    // Would send pause command via WebSocket
    console.log('Pause scan');
  };

  const handleStopScan = () => {
    // Would send stop command via WebSocket
    setProgress(prev => ({ ...prev, status: 'idle' }));
  };

  const progressPercent = progress.totalSources > 0
    ? Math.round((progress.sourcesScanned / progress.totalSources) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-slate-600 hover:text-slate-900 dark:text-slate-400">
                <Home className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Live Scan: {topicName || 'Loading...'}
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Real-time news discovery and analysis
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <span className="flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs">
                  <Radio className="w-3 h-3 animate-pulse" />
                  Connected
                </span>
              ) : (
                <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs">
                  Disconnected
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <Link href="/intelligence" className="flex items-center gap-2 px-3 py-4 border-b-2 border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300 font-medium text-sm transition-colors">
              <Users size={18} />
              Overview
            </Link>
            <Link href="/intelligence/setup" className="flex items-center gap-2 px-3 py-4 border-b-2 border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300 font-medium text-sm transition-colors">
              <PlusCircle size={18} />
              Setup
            </Link>
            <Link href="/intelligence/live-scan" className="flex items-center gap-2 px-3 py-4 border-b-2 border-teal-500 text-teal-600 dark:text-teal-400 font-medium text-sm">
              <Radio size={18} />
              Live Scan
            </Link>
            <Link href="/intelligence/dashboard" className="flex items-center gap-2 px-3 py-4 border-b-2 border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300 font-medium text-sm transition-colors">
              <LayoutDashboard size={18} />
              Dashboard
            </Link>
            <Link href="/intelligence/settings" className="flex items-center gap-2 px-3 py-4 border-b-2 border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300 font-medium text-sm transition-colors">
              <Settings size={18} />
              Settings
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Topic Selector */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FolderOpen className="w-5 h-5 text-teal-500" />
              <span className="font-medium text-slate-700 dark:text-slate-300">Select Topic:</span>
              {loadingTopics ? (
                <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
              ) : topics.length > 0 ? (
                <div className="relative">
                  <select
                    value={topicId}
                    onChange={(e) => handleTopicChange(e.target.value)}
                    className="px-4 py-2 pr-8 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none cursor-pointer min-w-[250px]"
                  >
                    <option value="" disabled>Choose a topic...</option>
                    {topics.map((t) => (
                      <option key={t.topic_id} value={t.topic_id}>
                        {t.name} ({t.status})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              ) : (
                <span className="text-slate-500 dark:text-slate-400">No topics available</span>
              )}
            </div>
            <Link
              href="/intelligence/setup"
              className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm"
            >
              <PlusCircle className="w-4 h-4" />
              New Topic
            </Link>
          </div>
        </div>

        {!topicId && !loadingTopics && topics.length === 0 ? (
          <div className="text-center py-16">
            <FolderOpen className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
              No Topics Created Yet
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Create your first topic to start live scanning.
            </p>
            <Link
              href="/intelligence/setup"
              className="inline-flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg"
            >
              <PlusCircle className="w-5 h-5" />
              Create Your First Topic
            </Link>
          </div>
        ) : (
        <>
        {/* Progress Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Scan Progress</h2>
            <div className="flex gap-2">
              {progress.status === 'idle' && (
                <button
                  onClick={handleStartScan}
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-medium"
                >
                  Start Scan
                </button>
              )}
              {(progress.status === 'scanning' || progress.status === 'analyzing') && (
                <>
                  <button
                    onClick={handlePauseScan}
                    className="flex items-center gap-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm"
                  >
                    <Pause className="w-4 h-4" />
                    Pause
                  </button>
                  <button
                    onClick={handleStopScan}
                    className="flex items-center gap-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm"
                  >
                    <Square className="w-4 h-4" />
                    Stop
                  </button>
                </>
              )}
              <Link
                href={`/intelligence/dashboard?topic=${topicId}`}
                className="flex items-center gap-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm"
              >
                <Eye className="w-4 h-4" />
                View Dashboard
              </Link>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-1">
              <span>Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {progress.sourcesScanned}/{progress.totalSources}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Sources Scanned</div>
            </div>
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {progress.articlesFound}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Articles Found</div>
            </div>
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {progress.articlesAnalyzed}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Articles Analyzed</div>
            </div>
            <div className="text-center p-3 bg-teal-50 dark:bg-teal-900/30 rounded-lg">
              <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                {progress.highImportanceCount}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">High Importance</div>
            </div>
          </div>
        </div>

        {/* Activity Log - Shows during scanning */}
        {(progress.status === 'scanning' || progress.status === 'analyzing' || activityLog.length > 0) && (
          <div className="bg-slate-900 dark:bg-slate-950 rounded-xl shadow-sm border border-slate-700 p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-green-400 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Live Activity Log
              </h3>
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <span className="flex items-center gap-1 text-xs text-green-400">
                    <Wifi className="w-3 h-3" />
                    Live
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-red-400">
                    <WifiOff className="w-3 h-3" />
                    Disconnected
                  </span>
                )}
              </div>
            </div>
            <div
              ref={activityLogRef}
              className="font-mono text-xs space-y-1 max-h-[200px] overflow-y-auto bg-black/50 rounded p-3"
            >
              {activityLog.length === 0 ? (
                <p className="text-slate-500">Waiting for scan to start...</p>
              ) : (
                activityLog.slice(0, 30).map(log => (
                  <div key={log.id} className="flex items-start gap-2">
                    <span className="text-slate-500 shrink-0">
                      {new Date(log.time).toLocaleTimeString()}
                    </span>
                    {log.type === 'info' && <span className="text-blue-400">[INFO]</span>}
                    {log.type === 'source' && <span className="text-yellow-400">[SOURCE]</span>}
                    {log.type === 'article' && <span className="text-cyan-400">[ARTICLE]</span>}
                    {log.type === 'success' && <span className="text-green-400">[SUCCESS]</span>}
                    {log.type === 'error' && <span className="text-red-400">[ERROR]</span>}
                    <span className="text-slate-300">{log.message}</span>
                    {log.details && (
                      <span className="text-slate-500">- {log.details}</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          {/* Source Status Cards */}
          <div className="col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Source Status</h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {Array.from(sourceStatuses.values()).map(source => (
                  <div
                    key={source.sourceId}
                    className={`p-3 rounded-lg border transition-all ${
                      source.status === 'active'
                        ? 'border-teal-300 dark:border-teal-700 bg-teal-50 dark:bg-teal-900/20'
                        : source.status === 'complete'
                        ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                        : source.status === 'failed'
                        ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {source.status === 'active' && (
                        <Loader2 className="w-4 h-4 text-teal-500 animate-spin" />
                      )}
                      {source.status === 'complete' && (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      )}
                      {source.status === 'failed' && (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate flex-1">
                        {source.sourceName}
                      </span>
                      {source.articlesFound !== undefined && (
                        <span className="text-xs bg-slate-200 dark:bg-slate-600 px-2 py-0.5 rounded">
                          {source.articlesFound} articles
                        </span>
                      )}
                    </div>
                    {source.status === 'active' && source.step && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-teal-600 dark:text-teal-400">
                        {source.step === 'connecting' && <Globe className="w-3 h-3" />}
                        {source.step === 'fetching' && <FileText className="w-3 h-3" />}
                        {source.step === 'parsing' && <FileText className="w-3 h-3" />}
                        {source.step === 'analyzing' && <Brain className="w-3 h-3 animate-pulse" />}
                        <span className="capitalize">{source.step}...</span>
                      </div>
                    )}
                    {source.url && source.status === 'active' && (
                      <div className="mt-1 text-xs text-slate-500 truncate">
                        {source.url}
                      </div>
                    )}
                  </div>
                ))}
                {sourceStatuses.size === 0 && (
                  <p className="text-sm text-slate-500 text-center py-8">
                    No sources scanned yet. Click &quot;Start Scan&quot; to begin.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Real-time Analysis Feed */}
          <div className="col-span-2">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                Real-time Analysis Feed
              </h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {analyzedArticles.map(article => (
                  <div
                    key={article.article_id}
                    className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900 dark:text-white text-sm">
                          {article.title}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          {article.source_name}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          article.importance_score >= 80
                            ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
                            : article.importance_score >= 60
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {article.importance_score}/100
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
                      {article.content_summary}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {article.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                {analyzedArticles.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-8">
                    Waiting for articles to be analyzed...
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Error Log (Collapsible) */}
        {errorLogs.length > 0 && (
          <div className="mt-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-red-200 dark:border-red-900">
            <button
              onClick={() => setShowErrors(!showErrors)}
              className="w-full px-4 py-3 flex items-center justify-between text-left"
            >
              <span className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium">
                <AlertCircle className="w-4 h-4" />
                Error Log ({errorLogs.length})
              </span>
              <span className="text-sm text-slate-500">
                {showErrors ? 'Hide' : 'Show'}
              </span>
            </button>
            {showErrors && (
              <div className="px-4 pb-4 max-h-48 overflow-y-auto">
                {errorLogs.map((log, i) => (
                  <div key={i} className="text-xs text-red-600 dark:text-red-400 py-1 border-b border-red-100 dark:border-red-900/50">
                    <span className="text-slate-500">{new Date(log.time).toLocaleTimeString()}</span>
                    {' - '}
                    {log.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        </>
        )}
      </main>
    </div>
  );
}
