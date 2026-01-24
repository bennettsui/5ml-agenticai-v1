'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Home,
  Settings,
  LayoutDashboard,
  Radio,
  PlusCircle,
  Users,
  RefreshCw,
  Send,
  Eye,
  Filter,
  ChevronDown,
  ExternalLink,
  TrendingUp,
  Clock,
  Star,
  Loader2,
  FolderOpen,
  Sparkles,
  ChevronUp,
  Info,
  DollarSign,
  Cpu,
  FileText,
  Zap,
  Lightbulb,
  List,
} from 'lucide-react';

interface Topic {
  id?: number;
  topic_id: string;
  name: string;
  status: 'active' | 'paused' | 'archived';
  keywords?: string[];
  lastUpdated?: string;
  sourcesCount?: number;
}

interface Article {
  id: string;
  title: string;
  source_name: string;
  source_url: string;
  importance_score: number;
  content_summary: string;
  published_at?: string;
  tags: string[];
  key_insights: string[];
}

interface DailyStats {
  newArticles: number;
  highImportance: number;
  mediumImportance: number;
  lowImportance: number;
  topSources: Array<{ name: string; count: number }>;
}

interface SummaryItem {
  text: string;
  sources: number[];
}

interface ArticleRef {
  id: number;
  title: string;
  source_name: string;
  url: string;
}

interface SummaryData {
  breakingNews: SummaryItem[];
  practicalTips: SummaryItem[];
  keyPoints: SummaryItem[];
  overallTrend?: string;
  articles?: ArticleRef[];
}

interface SummaryMeta {
  fetchingModel: string;
  analysisModel: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

export default function IntelligenceDashboardPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isSendingDigest, setIsSendingDigest] = useState(false);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium'>('all');
  const [page, setPage] = useState(1);

  // Summary state
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [summaryMeta, setSummaryMeta] = useState<SummaryMeta | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [showSummary, setShowSummary] = useState(true);

  // Fetch all topics on mount
  useEffect(() => {
    fetchTopics();
  }, []);

  // Load topic from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const topicId = params.get('topic');
    if (topicId) {
      setSelectedTopicId(topicId);
    }
  }, []);

  // Load selected topic details
  useEffect(() => {
    if (selectedTopicId) {
      loadTopic(selectedTopicId);
      loadArticles(selectedTopicId);
      // Update URL
      const url = new URL(window.location.href);
      url.searchParams.set('topic', selectedTopicId);
      window.history.replaceState({}, '', url.toString());
    }
  }, [selectedTopicId]);

  const fetchTopics = async () => {
    setLoadingTopics(true);
    try {
      const response = await fetch('/api/intelligence/topics');
      const data = await response.json();
      if (data.success) {
        setTopics(data.topics || []);
        // Auto-select first topic if none selected and topics exist
        if (!selectedTopicId && data.topics?.length > 0) {
          const params = new URLSearchParams(window.location.search);
          const topicId = params.get('topic');
          if (topicId) {
            setSelectedTopicId(topicId);
          } else {
            setSelectedTopicId(data.topics[0].topic_id);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch topics:', error);
    } finally {
      setLoadingTopics(false);
    }
  };

  const loadTopic = async (topicId: string) => {
    try {
      const response = await fetch(`/api/intelligence/topics/${topicId}`);
      const data = await response.json();
      if (data.success) {
        setTopic(data.topic);
      }
    } catch (error) {
      console.error('Failed to load topic:', error);
    }
  };

  const loadArticles = async (topicId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/intelligence/news?topicId=${topicId}`);
      const data = await response.json();
      if (data.success) {
        setArticles(data.news || []);
      }
      setStats({
        newArticles: data.news?.length || 0,
        highImportance: data.news?.filter((a: Article) => a.importance_score >= 80).length || 0,
        mediumImportance: data.news?.filter((a: Article) => a.importance_score >= 60 && a.importance_score < 80).length || 0,
        lowImportance: data.news?.filter((a: Article) => a.importance_score < 60).length || 0,
        topSources: [],
      });
    } catch (error) {
      console.error('Failed to load articles:', error);
      setStats({
        newArticles: 0,
        highImportance: 0,
        mediumImportance: 0,
        lowImportance: 0,
        topSources: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopicChange = (topicId: string) => {
    setSelectedTopicId(topicId);
    setArticles([]);
    setTopic(null);
  };

  const handleManualScan = () => {
    if (!topic) return;
    // Redirect to live scan with autostart parameter
    window.location.href = `/intelligence/live-scan?topic=${topic.topic_id}&autostart=true`;
  };

  const handleSendDigest = async () => {
    if (!topic) return;
    setIsSendingDigest(true);

    try {
      const response = await fetch('/api/orchestration/trigger-digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId: topic.topic_id }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`Digest sent to ${data.emailsSent} recipients!`);
      } else {
        alert(`Failed to send digest: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to send digest:', error);
    } finally {
      setIsSendingDigest(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!topic) return;
    setIsGeneratingSummary(true);
    setSummary(null);
    setSummaryMeta(null);

    try {
      const response = await fetch('/api/intelligence/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId: topic.topic_id, llm: 'claude-haiku' }),
      });

      const data = await response.json();
      if (data.success) {
        setSummary(data.summary);
        setSummaryMeta(data.meta);
        setShowSummary(true);
      } else {
        alert(`Failed to generate summary: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to generate summary:', error);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const filteredArticles = articles.filter(article => {
    if (filter === 'all') return true;
    if (filter === 'high') return article.importance_score >= 80;
    if (filter === 'medium') return article.importance_score >= 60 && article.importance_score < 80;
    return true;
  });

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
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {topic?.name || 'Intelligence Dashboard'}
                  </h1>
                  {topic && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        topic.status === 'active'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                      }`}
                    >
                      {topic.status}
                    </span>
                  )}
                </div>
                {topic?.lastUpdated && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Last updated: {new Date(topic.lastUpdated).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/intelligence/settings?topic=${topic?.topic_id}`}
                className="flex items-center gap-1 px-3 py-2 text-slate-600 hover:text-slate-900 dark:text-slate-400"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
              <button
                onClick={handleManualScan}
                disabled={isScanning}
                className="flex items-center gap-1 px-4 py-2 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-400 text-white rounded-lg text-sm"
              >
                {isScanning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Manual Scan
              </button>
              <button
                onClick={handleSendDigest}
                disabled={isSendingDigest}
                className="flex items-center gap-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-400 text-white rounded-lg text-sm"
              >
                {isSendingDigest ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Send Digest
              </button>
              <Link
                href={`/intelligence/live-scan?topic=${topic?.topic_id}`}
                className="flex items-center gap-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm"
              >
                <Eye className="w-4 h-4" />
                View Sources
              </Link>
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
            <Link href="/intelligence/live-scan" className="flex items-center gap-2 px-3 py-4 border-b-2 border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300 font-medium text-sm transition-colors">
              <Radio size={18} />
              Live Scan
            </Link>
            <Link href="/intelligence/dashboard" className="flex items-center gap-2 px-3 py-4 border-b-2 border-teal-500 text-teal-600 dark:text-teal-400 font-medium text-sm">
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
                    value={selectedTopicId || ''}
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

        {!topic && !loadingTopics && topics.length === 0 ? (
          <div className="text-center py-16">
            <FolderOpen className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
              No Topics Created Yet
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Create your first topic to start monitoring news and updates.
            </p>
            <Link
              href="/intelligence/setup"
              className="inline-flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg"
            >
              <PlusCircle className="w-5 h-5" />
              Create Your First Topic
            </Link>
          </div>
        ) : !topic && selectedTopicId ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
          </div>
        ) : topic ? (
          <div className="grid grid-cols-4 gap-6">
            {/* Main Content - News Feed */}
            <div className="col-span-3">
              {/* AI Summary Panel */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer"
                  onClick={() => setShowSummary(!showSummary)}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    <h3 className="font-semibold text-slate-900 dark:text-white">AI News Summary</h3>
                    {summaryMeta && (
                      <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full">
                        {summaryMeta.totalTokens.toLocaleString()} tokens
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateSummary();
                      }}
                      disabled={isGeneratingSummary || articles.length === 0}
                      className="flex items-center gap-1 px-3 py-1.5 bg-purple-500 hover:bg-purple-600 disabled:bg-slate-400 text-white rounded-lg text-sm"
                    >
                      {isGeneratingSummary ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      {isGeneratingSummary ? 'Generating...' : 'Generate Summary'}
                    </button>
                    {showSummary ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>

                {showSummary && (
                  <div className="px-4 pb-4 border-t border-slate-200 dark:border-slate-700">
                    {!summary && !isGeneratingSummary && (
                      <div className="py-6 text-center">
                        <Sparkles className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                          Click &quot;Generate Summary&quot; to create an AI-powered summary of the fetched articles
                        </p>
                      </div>
                    )}

                    {isGeneratingSummary && (
                      <div className="py-8 text-center">
                        <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-2" />
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                          Analyzing articles and generating summary...
                        </p>
                      </div>
                    )}

                    {summary && !isGeneratingSummary && (
                      <div className="pt-4 space-y-4">
                        {/* Summary Meta Info */}
                        {summaryMeta && (
                          <div className="flex flex-wrap gap-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-sm">
                            <div className="flex items-center gap-1.5">
                              <Cpu className="w-4 h-4 text-slate-400" />
                              <span className="text-slate-500">Model:</span>
                              <span className="font-medium text-slate-700 dark:text-slate-300">
                                {summaryMeta.analysisModel}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <FileText className="w-4 h-4 text-slate-400" />
                              <span className="text-slate-500">Tokens:</span>
                              <span className="font-medium text-slate-700 dark:text-slate-300">
                                {summaryMeta.inputTokens.toLocaleString()} in / {summaryMeta.outputTokens.toLocaleString()} out
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <DollarSign className="w-4 h-4 text-slate-400" />
                              <span className="text-slate-500">Cost:</span>
                              <span className="font-medium text-green-600 dark:text-green-400">
                                ${summaryMeta.estimatedCost.toFixed(6)}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Overall Trend */}
                        {summary.overallTrend && (
                          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                            <div className="flex items-center gap-2 mb-1">
                              <TrendingUp className="w-4 h-4 text-purple-500" />
                              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                                Overall Trend
                              </span>
                            </div>
                            <p className="text-sm text-purple-800 dark:text-purple-200">
                              {summary.overallTrend}
                            </p>
                          </div>
                        )}

                        {/* Breaking News Section */}
                        {summary.breakingNews && summary.breakingNews.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-red-700 dark:text-red-400 flex items-center gap-2">
                              <Zap className="w-4 h-4" />
                              Breaking News / Important Updates
                            </h4>
                            <ul className="space-y-2">
                              {summary.breakingNews.map((item, i) => (
                                <li key={i} className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 text-xs flex items-center justify-center font-medium">!</span>
                                  <div className="flex-1">
                                    <p className="text-sm text-slate-700 dark:text-slate-300">{item.text}</p>
                                    {item.sources?.length > 0 && (
                                      <div className="mt-1 flex flex-wrap gap-1">
                                        {item.sources.map(srcId => {
                                          const article = summary.articles?.find(a => a.id === srcId);
                                          return article ? (
                                            <a key={srcId} href={article.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded text-xs hover:bg-red-200 dark:hover:bg-red-800">
                                              [{srcId}] <ExternalLink className="w-2.5 h-2.5" />
                                            </a>
                                          ) : (
                                            <span key={srcId} className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded text-xs">[{srcId}]</span>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Practical Tips Section */}
                        {summary.practicalTips && summary.practicalTips.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-amber-700 dark:text-amber-400 flex items-center gap-2">
                              <Lightbulb className="w-4 h-4" />
                              Practical Tips
                            </h4>
                            <ul className="space-y-2">
                              {summary.practicalTips.map((item, i) => (
                                <li key={i} className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 text-xs flex items-center justify-center font-medium">{i + 1}</span>
                                  <div className="flex-1">
                                    <p className="text-sm text-slate-700 dark:text-slate-300">{item.text}</p>
                                    {item.sources?.length > 0 && (
                                      <div className="mt-1 flex flex-wrap gap-1">
                                        {item.sources.map(srcId => {
                                          const article = summary.articles?.find(a => a.id === srcId);
                                          return article ? (
                                            <a key={srcId} href={article.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded text-xs hover:bg-amber-200 dark:hover:bg-amber-800">
                                              [{srcId}] <ExternalLink className="w-2.5 h-2.5" />
                                            </a>
                                          ) : (
                                            <span key={srcId} className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded text-xs">[{srcId}]</span>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Key Points Section */}
                        {summary.keyPoints && summary.keyPoints.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-blue-700 dark:text-blue-400 flex items-center gap-2">
                              <List className="w-4 h-4" />
                              Key Points
                            </h4>
                            <ul className="space-y-2">
                              {summary.keyPoints.map((item, i) => (
                                <li key={i} className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs flex items-center justify-center font-medium">{i + 1}</span>
                                  <div className="flex-1">
                                    <p className="text-sm text-slate-700 dark:text-slate-300">{item.text}</p>
                                    {item.sources?.length > 0 && (
                                      <div className="mt-1 flex flex-wrap gap-1">
                                        {item.sources.map(srcId => {
                                          const article = summary.articles?.find(a => a.id === srcId);
                                          return article ? (
                                            <a key={srcId} href={article.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded text-xs hover:bg-blue-200 dark:hover:bg-blue-800">
                                              [{srcId}] <ExternalLink className="w-2.5 h-2.5" />
                                            </a>
                                          ) : (
                                            <span key={srcId} className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded text-xs">[{srcId}]</span>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Sources Reference */}
                        {summary.articles && summary.articles.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Sources Referenced</h4>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {summary.articles.map(article => (
                                <a key={article.id} href={article.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 truncate">
                                  <span className="font-medium">[{article.id}]</span>
                                  <span className="truncate">{article.title}</span>
                                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Filters */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Daily News Feed
                </h2>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <select
                    value={filter}
                    onChange={e => setFilter(e.target.value as typeof filter)}
                    className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm"
                  >
                    <option value="all">All Articles</option>
                    <option value="high">High Importance (80+)</option>
                    <option value="medium">Medium Importance (60-79)</option>
                  </select>
                </div>
              </div>

              {/* Article List */}
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
                </div>
              ) : filteredArticles.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center">
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    No articles found. Run a scan to discover new content.
                  </p>
                  <button
                    onClick={handleManualScan}
                    className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm"
                  >
                    Start Scan Now
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredArticles.map(article => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              )}

              {/* Load More */}
              {filteredArticles.length > 0 && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setPage(p => p + 1)}
                    className="px-6 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    Load More
                  </button>
                </div>
              )}
            </div>

            {/* Sidebar - Stats */}
            <div className="col-span-1 space-y-6">
              {/* Today's Stats */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal-500" />
                  Today's Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">New Articles</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {stats?.newArticles || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">High Importance</span>
                    <span className="font-medium text-teal-600">{stats?.highImportance || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Medium Importance</span>
                    <span className="font-medium text-blue-600">{stats?.mediumImportance || 0}</span>
                  </div>
                </div>
              </div>

              {/* Top Sources */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  Top Active Sources
                </h3>
                {stats?.topSources && stats.topSources.length > 0 ? (
                  <div className="space-y-2">
                    {stats.topSources.map((source, i) => (
                      <div key={source.name} className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400 truncate flex-1">
                          {i + 1}. {source.name}
                        </span>
                        <span className="text-slate-900 dark:text-white ml-2">{source.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">No data yet</p>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  Schedule Info
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Daily Scan</span>
                    <span className="text-slate-900 dark:text-white">06:00 HKT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Weekly Digest</span>
                    <span className="text-slate-900 dark:text-white">Mon 08:00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

function ArticleCard({ article }: { article: Article }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 hover:border-teal-300 dark:hover:border-teal-700 transition-colors">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium ${
                article.importance_score >= 80
                  ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
                  : article.importance_score >= 60
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
              }`}
            >
              Score: {article.importance_score}
            </span>
            <span className="text-xs text-slate-500">{article.source_name}</span>
            {article.published_at && (
              <span className="text-xs text-slate-500">
                {new Date(article.published_at).toLocaleDateString()}
              </span>
            )}
          </div>

          <h3 className="font-medium text-slate-900 dark:text-white mb-2">
            {article.title}
          </h3>

          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
            {article.content_summary}
          </p>

          {article.key_insights.length > 0 && (
            <div className="mb-3">
              <span className="text-xs font-medium text-slate-500 uppercase">Key Insights:</span>
              <ul className="mt-1 space-y-1">
                {article.key_insights.slice(0, 2).map((insight, i) => (
                  <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-1">
                    <span className="text-teal-500">•</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              {article.tags.slice(0, 4).map(tag => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
            <a
              href={article.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-teal-600 dark:text-teal-400 hover:underline"
            >
              Read Full
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
