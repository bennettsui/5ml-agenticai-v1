'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Home,
  Search,
  Settings,
  LayoutDashboard,
  Radio,
  PlusCircle,
  Users,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Loader2,
  Globe,
  ExternalLink,
  Zap,
  Brain,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  RefreshCw,
  Eye,
  Pause,
  Play,
  Database,
  Sparkles,
  FileSearch,
} from 'lucide-react';

// Preloader Component
function Preloader({
  message = 'Loading...',
  subMessage,
  variant = 'default'
}: {
  message?: string;
  subMessage?: string;
  variant?: 'default' | 'discovering' | 'database';
}) {
  const getIcon = () => {
    switch (variant) {
      case 'discovering':
        return <Sparkles className="w-8 h-8 text-teal-500" />;
      case 'database':
        return <Database className="w-8 h-8 text-teal-500" />;
      default:
        return <FileSearch className="w-8 h-8 text-teal-500" />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12">
      {/* Animated Icon Container */}
      <div className="relative">
        {/* Outer Ring */}
        <div className="absolute inset-0 rounded-full border-4 border-teal-100 dark:border-teal-900/30" />
        {/* Spinning Ring */}
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-teal-500 animate-spin" />
        {/* Icon */}
        <div className="w-20 h-20 flex items-center justify-center">
          <div className="animate-pulse">
            {getIcon()}
          </div>
        </div>
      </div>

      {/* Loading Text */}
      <div className="mt-6 text-center">
        <p className="text-lg font-medium text-slate-900 dark:text-white">{message}</p>
        {subMessage && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subMessage}</p>
        )}
      </div>

      {/* Progress Dots */}
      <div className="flex gap-1.5 mt-4">
        <div className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

// Source Discovery Preloader with Progress
function DiscoveryPreloader({
  mode,
  llm,
  topicName
}: {
  mode: string;
  llm: string;
  topicName: string;
}) {
  const [step, setStep] = useState(0);
  const steps = [
    { label: 'Initializing AI model', icon: Brain },
    { label: 'Searching for sources', icon: Search },
    { label: 'Analyzing relevance', icon: FileSearch },
    { label: 'Scoring authority', icon: Sparkles },
    { label: 'Compiling results', icon: Database },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep(s => (s + 1) % steps.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gradient-to-br from-teal-50 to-slate-50 dark:from-teal-900/20 dark:to-slate-800 rounded-xl p-8 border border-teal-200 dark:border-teal-800">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-100 dark:bg-teal-900/50 rounded-full text-teal-700 dark:text-teal-300 text-sm font-medium mb-4">
          <Sparkles className="w-4 h-4 animate-pulse" />
          AI-Powered Source Discovery
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
          Discovering sources for &quot;{topicName}&quot;
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
          Using {llm} in {mode} mode
        </p>
      </div>

      {/* Progress Steps */}
      <div className="space-y-3 max-w-md mx-auto">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === step;
          const isComplete = i < step;

          return (
            <div
              key={i}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                isActive
                  ? 'bg-teal-100 dark:bg-teal-900/50 scale-105'
                  : isComplete
                  ? 'bg-green-50 dark:bg-green-900/20'
                  : 'bg-white/50 dark:bg-slate-700/50'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isActive
                  ? 'bg-teal-500 text-white'
                  : isComplete
                  ? 'bg-green-500 text-white'
                  : 'bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400'
              }`}>
                {isComplete ? (
                  <Check className="w-4 h-4" />
                ) : isActive ? (
                  <Icon className="w-4 h-4 animate-pulse" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span className={`text-sm font-medium ${
                isActive
                  ? 'text-teal-700 dark:text-teal-300'
                  : isComplete
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-slate-500 dark:text-slate-400'
              }`}>
                {s.label}
              </span>
              {isActive && (
                <Loader2 className="w-4 h-4 ml-auto text-teal-500 animate-spin" />
              )}
            </div>
          );
        })}
      </div>

      {/* Animated Background Elements */}
      <div className="mt-8 flex justify-center gap-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-full bg-teal-400/50 animate-ping"
            style={{ animationDelay: `${i * 200}ms`, animationDuration: '1.5s' }}
          />
        ))}
      </div>
    </div>
  );
}

interface Source {
  source_id: string;
  name: string;
  title: string;
  primary_url: string;
  secondary_urls: string[];
  content_types: string[];
  posting_frequency: string;
  focus_areas: string[];
  authority_score: number;
  why_selected: string;
  isEditing?: boolean;
  isNew?: boolean;
}

interface Topic {
  id?: number;
  topic_id: string;
  name: string;
  keywords: string[];
  status: string;
  created_at?: string;
  sources?: Source[];
}

type ResearchMode = 'comprehensive' | 'quick' | 'trends';
type LLMProvider = 'perplexity' | 'claude-sonnet' | 'claude-haiku' | 'deepseek';

const RESEARCH_MODES = [
  {
    id: 'comprehensive' as ResearchMode,
    name: 'Comprehensive Research',
    description: 'Full source discovery with trend mapping and authority scoring',
    icon: Brain,
    color: 'purple',
  },
  {
    id: 'quick' as ResearchMode,
    name: 'Quick Scan',
    description: 'Fast overview of top sources for rapid setup',
    icon: Zap,
    color: 'yellow',
  },
  {
    id: 'trends' as ResearchMode,
    name: 'Trend Focus',
    description: 'Focus on emerging signals and trend tracking sources',
    icon: TrendingUp,
    color: 'green',
  },
];

const LLM_PROVIDERS = [
  { id: 'perplexity' as LLMProvider, name: 'Perplexity Sonar Pro', description: 'Best for web research', recommended: true },
  { id: 'claude-sonnet' as LLMProvider, name: 'Claude Sonnet', description: 'Balanced quality & speed' },
  { id: 'claude-haiku' as LLMProvider, name: 'Claude Haiku', description: 'Fast & cost-effective' },
  { id: 'deepseek' as LLMProvider, name: 'DeepSeek Reasoner', description: 'Deep reasoning capability' },
];

export default function TopicSetupPage() {
  // Existing topics state
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);
  const [topicSources, setTopicSources] = useState<Record<string, Source[]>>({});
  const [loadingSources, setLoadingSources] = useState<string | null>(null);

  // New topic creation state
  const [showNewTopicForm, setShowNewTopicForm] = useState(false);
  const [topicName, setTopicName] = useState('');
  const [keywords, setKeywords] = useState('');
  const [researchMode, setResearchMode] = useState<ResearchMode>('comprehensive');
  const [selectedLLM, setSelectedLLM] = useState<LLMProvider>('perplexity');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredSources, setDiscoveredSources] = useState<Source[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch existing topics on mount
  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    setLoadingTopics(true);
    try {
      const response = await fetch('/api/intelligence/topics');
      const data = await response.json();
      if (data.success) {
        setTopics(data.topics || []);
      }
    } catch (err) {
      console.error('Failed to fetch topics:', err);
    } finally {
      setLoadingTopics(false);
    }
  };

  const fetchTopicSources = async (topicId: string) => {
    setLoadingSources(topicId);
    try {
      const response = await fetch(`/api/intelligence/topics/${topicId}/sources`);
      const data = await response.json();
      if (data.success) {
        setTopicSources(prev => ({ ...prev, [topicId]: data.sources || [] }));
      }
    } catch (err) {
      console.error('Failed to fetch sources:', err);
    } finally {
      setLoadingSources(null);
    }
  };

  const toggleTopicExpand = (topicId: string) => {
    if (expandedTopicId === topicId) {
      setExpandedTopicId(null);
    } else {
      setExpandedTopicId(topicId);
      if (!topicSources[topicId]) {
        fetchTopicSources(topicId);
      }
    }
  };

  const handlePauseTopic = async (topicId: string) => {
    try {
      await fetch(`/api/intelligence/topics/${topicId}/pause`, { method: 'PUT' });
      fetchTopics();
    } catch (err) {
      setError('Failed to pause topic');
    }
  };

  const handleResumeTopic = async (topicId: string) => {
    try {
      await fetch(`/api/intelligence/topics/${topicId}/resume`, { method: 'PUT' });
      fetchTopics();
    } catch (err) {
      setError('Failed to resume topic');
    }
  };

  const handleDiscoverSources = async () => {
    if (!topicName.trim()) {
      setError('Please enter a topic name');
      return;
    }

    setIsDiscovering(true);
    setError(null);
    setDiscoveredSources([]);

    try {
      const response = await fetch('/api/intelligence/sources/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicName: topicName.trim(),
          keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
          mode: researchMode,
          llm: selectedLLM,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setDiscoveredSources(data.sources || []);
      } else {
        setError(data.error || 'Failed to discover sources');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleRemoveSource = (sourceId: string) => {
    setDiscoveredSources(sources => sources.filter(s => s.source_id !== sourceId));
  };

  const handleEditSource = (sourceId: string) => {
    setDiscoveredSources(sources =>
      sources.map(s => (s.source_id === sourceId ? { ...s, isEditing: true } : s))
    );
  };

  const handleSaveEdit = (sourceId: string, updates: Partial<Source>) => {
    setDiscoveredSources(sources =>
      sources.map(s =>
        s.source_id === sourceId ? { ...s, ...updates, isEditing: false } : s
      )
    );
  };

  const handleCancelEdit = (sourceId: string) => {
    setDiscoveredSources(sources =>
      sources.map(s => (s.source_id === sourceId ? { ...s, isEditing: false } : s))
    );
  };

  const handleAddCustomSource = () => {
    const newSource: Source = {
      source_id: `custom-${Date.now()}`,
      name: '',
      title: '',
      primary_url: '',
      secondary_urls: [],
      content_types: ['articles'],
      posting_frequency: 'weekly',
      focus_areas: [],
      authority_score: 50,
      why_selected: 'Custom source added by user',
      isEditing: true,
      isNew: true,
    };
    setDiscoveredSources(sources => [newSource, ...sources]);
  };

  const handleCreateTopic = async () => {
    if (discoveredSources.length === 0) {
      setError('Please discover or add at least one source');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/intelligence/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicName: topicName.trim(),
          keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
          sources: discoveredSources,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Topic "${topicName}" created successfully!`);
        setTopicName('');
        setKeywords('');
        setDiscoveredSources([]);
        setShowNewTopicForm(false);
        fetchTopics();
      } else {
        setError(data.error || 'Failed to create topic');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddSourcesToExistingTopic = async (topicId: string, sources: Source[]) => {
    try {
      const response = await fetch(`/api/intelligence/topics/${topicId}/sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sources }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(`Added ${sources.length} sources to topic`);
        fetchTopicSources(topicId);
      } else {
        setError(data.error || 'Failed to add sources');
      }
    } catch (err) {
      setError('Failed to connect to server');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              >
                <Home className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Topic Intelligence Setup
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Configure your topic monitoring and discover authoritative sources
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <Link
              href="/intelligence"
              className="flex items-center gap-2 px-3 py-4 border-b-2 border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300 font-medium text-sm transition-colors"
            >
              <Users size={18} />
              Overview
            </Link>
            <Link
              href="/intelligence/setup"
              className="flex items-center gap-2 px-3 py-4 border-b-2 border-teal-500 text-teal-600 dark:text-teal-400 font-medium text-sm"
            >
              <PlusCircle size={18} />
              Setup
            </Link>
            <Link
              href="/intelligence/live-scan"
              className="flex items-center gap-2 px-3 py-4 border-b-2 border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300 font-medium text-sm transition-colors"
            >
              <Radio size={18} />
              Live Scan
            </Link>
            <Link
              href="/intelligence/dashboard"
              className="flex items-center gap-2 px-3 py-4 border-b-2 border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300 font-medium text-sm transition-colors"
            >
              <LayoutDashboard size={18} />
              Dashboard
            </Link>
            <Link
              href="/intelligence/settings"
              className="flex items-center gap-2 px-3 py-4 border-b-2 border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300 font-medium text-sm transition-colors"
            >
              <Settings size={18} />
              Settings
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300 flex justify-between items-center">
            <span>{success}</span>
            <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Existing Topics Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-teal-500" />
              Your Topics ({topics.length})
            </h2>
            <div className="flex gap-2">
              <button
                onClick={fetchTopics}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={() => setShowNewTopicForm(!showNewTopicForm)}
                className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                New Topic
              </button>
            </div>
          </div>

          {loadingTopics ? (
            <Preloader
              message="Loading your topics"
              subMessage="Fetching data from database..."
              variant="database"
            />
          ) : topics.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-400 mb-4">No topics created yet</p>
              <button
                onClick={() => setShowNewTopicForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Your First Topic
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {topics.map(topic => (
                <div
                  key={topic.topic_id}
                  className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden"
                >
                  {/* Topic Header */}
                  <div
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                    onClick={() => toggleTopicExpand(topic.topic_id)}
                  >
                    <div className="flex items-center gap-3">
                      {expandedTopicId === topic.topic_id ? (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      )}
                      <div>
                        <h3 className="font-medium text-slate-900 dark:text-white">{topic.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            topic.status === 'active'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                          }`}>
                            {topic.status}
                          </span>
                          {topic.keywords && topic.keywords.length > 0 && (
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {topic.keywords.slice(0, 3).join(', ')}
                              {topic.keywords.length > 3 && ` +${topic.keywords.length - 3} more`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      {topic.status === 'active' ? (
                        <button
                          onClick={() => handlePauseTopic(topic.topic_id)}
                          className="p-2 text-slate-400 hover:text-yellow-500 transition-colors"
                          title="Pause monitoring"
                        >
                          <Pause className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleResumeTopic(topic.topic_id)}
                          className="p-2 text-slate-400 hover:text-green-500 transition-colors"
                          title="Resume monitoring"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                      <Link
                        href={`/intelligence/dashboard?topic=${topic.topic_id}`}
                        className="p-2 text-slate-400 hover:text-teal-500 transition-colors"
                        title="View dashboard"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>

                  {/* Topic Sources (Expanded) */}
                  {expandedTopicId === topic.topic_id && (
                    <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                      {loadingSources === topic.topic_id ? (
                        <div className="py-6">
                          <div className="flex flex-col items-center">
                            <div className="relative w-12 h-12">
                              <div className="absolute inset-0 rounded-full border-2 border-teal-100 dark:border-teal-900/30" />
                              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-teal-500 animate-spin" />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Globe className="w-5 h-5 text-teal-500 animate-pulse" />
                              </div>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">Loading sources...</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              Sources ({topicSources[topic.topic_id]?.length || 0})
                            </h4>
                            <button
                              onClick={() => {
                                setTopicName(topic.name);
                                setKeywords(topic.keywords?.join(', ') || '');
                                setShowNewTopicForm(true);
                              }}
                              className="text-xs text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                            >
                              <Search className="w-3 h-3" />
                              Discover More Sources
                            </button>
                          </div>
                          {topicSources[topic.topic_id]?.length > 0 ? (
                            <div className="grid gap-2">
                              {topicSources[topic.topic_id].map(source => (
                                <div
                                  key={source.source_id}
                                  className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                                >
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-slate-400" />
                                        <span className="font-medium text-sm text-slate-900 dark:text-white">
                                          {source.name}
                                        </span>
                                        <span className="px-1.5 py-0.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded text-xs">
                                          {source.authority_score}/100
                                        </span>
                                      </div>
                                      <a
                                        href={source.primary_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 mt-1"
                                      >
                                        {source.primary_url}
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                              No sources found for this topic
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* New Topic Form */}
        {showNewTopicForm && (
          <>
            {/* Topic Configuration */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {discoveredSources.length > 0 ? 'Step 2: Review & Approve Sources' : 'Step 1: Define Your Topic'}
                </h2>
                <button
                  onClick={() => {
                    setShowNewTopicForm(false);
                    setTopicName('');
                    setKeywords('');
                    setDiscoveredSources([]);
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {discoveredSources.length === 0 ? (
                isDiscovering ? (
                  /* Show Discovery Preloader when discovering sources */
                  <DiscoveryPreloader
                    mode={RESEARCH_MODES.find(m => m.id === researchMode)?.name || 'Comprehensive Research'}
                    llm={LLM_PROVIDERS.find(l => l.id === selectedLLM)?.name || 'Perplexity Sonar Pro'}
                    topicName={topicName}
                  />
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Topic Name *
                      </label>
                      <input
                        type="text"
                        value={topicName}
                        onChange={e => setTopicName(e.target.value)}
                        placeholder="e.g., IG Growth Hacking, AI Latest News"
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Keywords (optional, comma-separated)
                      </label>
                      <input
                        type="text"
                        value={keywords}
                        onChange={e => setKeywords(e.target.value)}
                        placeholder="e.g., instagram algorithm, reels, engagement"
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>

                    {/* Research Mode Selection */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                        Research Mode
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {RESEARCH_MODES.map((mode) => {
                          const Icon = mode.icon;
                          const isSelected = researchMode === mode.id;
                          return (
                            <button
                              key={mode.id}
                              type="button"
                              onClick={() => setResearchMode(mode.id)}
                              className={`p-4 rounded-lg border-2 text-left transition-all ${
                                isSelected
                                  ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <Icon className={`w-5 h-5 ${isSelected ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'}`} />
                                <span className={`font-medium ${isSelected ? 'text-teal-700 dark:text-teal-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                  {mode.name}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{mode.description}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* LLM Selection */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        AI Model
                      </label>
                      <div className="relative">
                        <select
                          value={selectedLLM}
                          onChange={(e) => setSelectedLLM(e.target.value as LLMProvider)}
                          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none cursor-pointer"
                        >
                          {LLM_PROVIDERS.map((llm) => (
                            <option key={llm.id} value={llm.id}>
                              {llm.name} {llm.recommended ? '(Recommended)' : ''} - {llm.description}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Perplexity is recommended for web research tasks with real-time internet access
                      </p>
                    </div>

                    <button
                      onClick={handleDiscoverSources}
                      disabled={!topicName.trim()}
                      className="flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-400 text-white font-medium rounded-lg transition-colors"
                    >
                      <Search className="w-5 h-5" />
                      Discover Information Sources
                    </button>
                  </div>
                )
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Found {discoveredSources.length} sources for &quot;{topicName}&quot;
                    </p>
                    <button
                      onClick={handleAddCustomSource}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add Custom Source
                    </button>
                  </div>

                  <div className="grid gap-4 mb-6">
                    {discoveredSources.map(source => (
                      <SourceCard
                        key={source.source_id}
                        source={source}
                        onRemove={handleRemoveSource}
                        onEdit={handleEditSource}
                        onSave={handleSaveEdit}
                        onCancel={handleCancelEdit}
                      />
                    ))}
                  </div>

                  <div className="flex justify-between">
                    <button
                      onClick={() => setDiscoveredSources([])}
                      className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                      <ChevronRight className="w-4 h-4 rotate-180" />
                      Back to Edit Topic
                    </button>
                    <button
                      onClick={handleCreateTopic}
                      disabled={isCreating}
                      className="flex items-center gap-2 px-8 py-3 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-400 text-white font-medium rounded-lg transition-colors"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Creating Topic...
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5" />
                          Create Topic & Start Monitoring
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function SourceCard({
  source,
  onRemove,
  onEdit,
  onSave,
  onCancel,
}: {
  source: Source;
  onRemove: (id: string) => void;
  onEdit: (id: string) => void;
  onSave: (id: string, updates: Partial<Source>) => void;
  onCancel: (id: string) => void;
}) {
  const [editName, setEditName] = useState(source.name);
  const [editUrl, setEditUrl] = useState(source.primary_url);

  if (source.isEditing) {
    return (
      <div className="p-4 border border-teal-300 dark:border-teal-700 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
        <div className="space-y-3">
          <input
            type="text"
            value={editName}
            onChange={e => setEditName(e.target.value)}
            placeholder="Source name"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm"
          />
          <input
            type="url"
            value={editUrl}
            onChange={e => setEditUrl(e.target.value)}
            placeholder="Primary URL"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={() => onSave(source.source_id, { name: editName, primary_url: editUrl })}
              className="flex items-center gap-1 px-3 py-1 bg-teal-500 text-white rounded text-sm"
            >
              <Check className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={() => onCancel(source.source_id)}
              className="flex items-center gap-1 px-3 py-1 bg-slate-500 text-white rounded text-sm"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-teal-300 dark:hover:border-teal-700 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-slate-400" />
            <h3 className="font-medium text-slate-900 dark:text-white">{source.name}</h3>
            <span className="px-2 py-0.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded text-xs">
              {source.authority_score}/100
            </span>
          </div>
          {source.title && (
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{source.title}</p>
          )}
          <a
            href={source.primary_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-teal-600 dark:text-teal-400 hover:underline mt-2"
          >
            {source.primary_url}
            <ExternalLink className="w-3 h-3" />
          </a>
          <div className="flex flex-wrap gap-1 mt-2">
            {source.content_types?.map(type => (
              <span
                key={type}
                className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded text-xs"
              >
                {type}
              </span>
            ))}
            {source.posting_frequency && (
              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded text-xs">
                {source.posting_frequency}
              </span>
            )}
          </div>
          {source.why_selected && (
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-2 italic">
              {source.why_selected}
            </p>
          )}
        </div>
        <div className="flex gap-2 ml-4">
          <button
            onClick={() => onEdit(source.source_id)}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onRemove(source.source_id)}
            className="p-2 text-slate-400 hover:text-red-500"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
