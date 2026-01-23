'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Home,
  Search,
  Settings,
  LayoutDashboard,
  Activity,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Loader2,
  Globe,
  ExternalLink,
} from 'lucide-react';

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

export default function TopicSetupPage() {
  const [topicName, setTopicName] = useState('');
  const [keywords, setKeywords] = useState('');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredSources, setDiscoveredSources] = useState<Source[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          window.location.href = `/intelligence/dashboard?topic=${data.topicId}`;
        }, 2000);
      } else {
        setError(data.error || 'Failed to create topic');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setIsCreating(false);
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
              href="/intelligence/setup"
              className="flex items-center gap-2 px-3 py-4 border-b-2 border-teal-500 text-teal-600 dark:text-teal-400 font-medium text-sm"
            >
              <Settings size={18} />
              Setup
            </Link>
            <Link
              href="/intelligence/live-scan"
              className="flex items-center gap-2 px-3 py-4 border-b-2 border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 font-medium text-sm"
            >
              <Activity size={18} />
              Live Scan
            </Link>
            <Link
              href="/intelligence/dashboard"
              className="flex items-center gap-2 px-3 py-4 border-b-2 border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 font-medium text-sm"
            >
              <LayoutDashboard size={18} />
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300">
            {success}
          </div>
        )}

        {/* Topic Configuration */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Step 1: Define Your Topic
          </h2>

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

            <button
              onClick={handleDiscoverSources}
              disabled={isDiscovering || !topicName.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-400 text-white font-medium rounded-lg transition-colors"
            >
              {isDiscovering ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Discovering Sources...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Discover Information Sources
                </>
              )}
            </button>
          </div>
        </div>

        {/* Discovered Sources */}
        {discoveredSources.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Step 2: Review & Approve Sources ({discoveredSources.length})
              </h2>
              <button
                onClick={handleAddCustomSource}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Custom Source
              </button>
            </div>

            <div className="grid gap-4">
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

            <div className="mt-6 flex justify-end">
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
          </div>
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
            {source.content_types.map(type => (
              <span
                key={type}
                className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded text-xs"
              >
                {type}
              </span>
            ))}
            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded text-xs">
              {source.posting_frequency}
            </span>
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
