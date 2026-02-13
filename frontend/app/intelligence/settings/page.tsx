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
  Save,
  Trash2,
  Plus,
  Edit2,
  Check,
  X,
  Send,
  Loader2,
  Clock,
  Mail,
  Globe,
  Eye,
  History,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface TopicSettings {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'archived';
  keywords: string[];
  sources: Source[];
  dailyScanConfig: {
    enabled: boolean;
    time: string;
    timezone: string;
  };
  weeklyDigestConfig: {
    enabled: boolean;
    day: string;
    time: string;
    timezone: string;
    recipientList: string[];
  };
}

interface TopicListItem {
  id?: string;
  topic_id?: string;
  name: string;
  status: string;
}

// Helper to get topic ID from either format
const getTopicId = (topic: TopicListItem): string => topic.topic_id || topic.id || '';

interface Source {
  sourceId: string;
  name: string;
  primaryUrl: string;
  status: 'Active' | 'Inactive';
  authorityScore: number;
}

interface EdmPreview {
  subject: string;
  previewText: string;
  htmlContent: string;
  articlesIncluded: number;
  generatedAt: string;
}

interface EdmHistoryItem {
  id: string;
  subject: string;
  previewText: string;
  recipients: string[];
  articlesIncluded: number;
  status: string;
  sentAt: string;
}

export default function TopicSettingsPage() {
  const [topic, setTopic] = useState<TopicSettings | null>(null);
  const [topics, setTopics] = useState<TopicListItem[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [isLoadingTopics, setIsLoadingTopics] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // EDM Preview & History state
  const [edmPreview, setEdmPreview] = useState<EdmPreview | null>(null);
  const [edmHistory, setEdmHistory] = useState<EdmHistoryItem[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedEdmId, setSelectedEdmId] = useState<string | null>(null);
  const [selectedEdmHtml, setSelectedEdmHtml] = useState<string | null>(null);
  const [isSavingEdm, setIsSavingEdm] = useState(false);
  const [isSendingEdm, setIsSendingEdm] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [keywords, setKeywords] = useState('');
  const [status, setStatus] = useState<'active' | 'paused'>('active');
  const [dailyScanTime, setDailyScanTime] = useState('06:00');
  const [dailyScanEnabled, setDailyScanEnabled] = useState(true);
  const [weeklyDigestDay, setWeeklyDigestDay] = useState('monday');
  const [weeklyDigestTime, setWeeklyDigestTime] = useState('08:00');
  const [weeklyDigestEnabled, setWeeklyDigestEnabled] = useState(true);
  const [recipients, setRecipients] = useState('');

  useEffect(() => {
    loadTopicsList();
  }, []);

  useEffect(() => {
    if (selectedTopicId) {
      loadTopic(selectedTopicId);
      // Update URL without reload
      const url = new URL(window.location.href);
      url.searchParams.set('topic', selectedTopicId);
      window.history.replaceState({}, '', url.toString());
    }
  }, [selectedTopicId]);

  const parseRecipients = (value: string) => {
    const emails = value
      .split(/[,\n]/)
      .map(e => e.trim())
      .filter(e => e && e.includes('@'));
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const email of emails) {
      const key = email.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(email);
    }
    return unique;
  };

  const formatRecipients = (list: string[]) => list.join(', ');

  const saveRecipientList = async (recipientList: string[]) => {
    const topicId = topic?.id || selectedTopicId;
    if (!topicId) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/intelligence/topics/${topicId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weeklyDigestConfig: {
            enabled: weeklyDigestEnabled,
            day: weeklyDigestDay,
            time: weeklyDigestTime,
            timezone: 'Asia/Hong_Kong',
            recipientList,
          },
        }),
      });
      const data = await response.json();
      if (data.success) {
        if (data.topic) {
          setTopic(data.topic);
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save subscribers' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save subscribers' });
    } finally {
      setIsSaving(false);
    }
  };

  const loadTopicsList = async () => {
    setIsLoadingTopics(true);
    try {
      const response = await fetch('/api/intelligence/topics');
      const data = await response.json();

      if (data.success && data.topics) {
        setTopics(data.topics);

        // Check URL for topic param
        const params = new URLSearchParams(window.location.search);
        const topicIdFromUrl = params.get('topic');

        if (topicIdFromUrl && data.topics.some((t: TopicListItem) => getTopicId(t) === topicIdFromUrl)) {
          setSelectedTopicId(topicIdFromUrl);
        } else if (data.topics.length > 0) {
          // Select first topic by default
          setSelectedTopicId(getTopicId(data.topics[0]));
        }
      }
    } catch (error) {
      console.error('Failed to load topics:', error);
      setMessage({ type: 'error', text: 'Failed to load topics list' });
    } finally {
      setIsLoadingTopics(false);
    }
  };

  const loadTopic = async (topicId: string) => {
    setIsLoading(true);
    setTopic(null); // Reset topic while loading
    try {
      const response = await fetch(`/api/intelligence/topics/${topicId}`);
      const data = await response.json();

      if (data.success && data.topic) {
        const t = data.topic;

        // Normalize topic ID - prefer topic_id (UUID) over id (serial integer)
        const normalizedTopic = {
          ...t,
          id: t.topic_id || t.id,
        };
        setTopic(normalizedTopic);
        setName(t.name || '');
        // Handle keywords as array or JSONB
        const keywordsArray = Array.isArray(t.keywords) ? t.keywords : (t.keywords ? Object.values(t.keywords) : []);
        setKeywords(keywordsArray.join(', ') || '');
        setStatus(t.status === 'archived' ? 'paused' : t.status);
        // Handle config from either camelCase or snake_case
        const dailyConfig = t.dailyScanConfig || t.daily_scan_config || {};
        const weeklyConfig = t.weeklyDigestConfig || t.weekly_digest_config || {};

        setDailyScanTime(dailyConfig.time || '06:00');
        setDailyScanEnabled(dailyConfig.enabled ?? true);
        setWeeklyDigestDay(weeklyConfig.day || 'monday');
        setWeeklyDigestTime(weeklyConfig.time || '08:00');
        setWeeklyDigestEnabled(weeklyConfig.enabled ?? true);

        // Handle recipientList - could be array or might be missing in old configs
        let recipientArray: string[] = [];
        if (Array.isArray(weeklyConfig.recipientList)) {
          recipientArray = weeklyConfig.recipientList;
        } else if (Array.isArray(weeklyConfig.recipient_list)) {
          recipientArray = weeklyConfig.recipient_list;
        }
        setRecipients(formatRecipients(recipientArray));
      } else {
        console.error('API returned error:', data);
        setMessage({ type: 'error', text: data.error || 'Topic not found or failed to load' });
      }
    } catch (error) {
      console.error('Failed to load topic:', error);
      setMessage({ type: 'error', text: 'Failed to load topic settings' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!topic) return;
    setIsSaving(true);
    setMessage(null);

    try {
      // Parse recipients from text (comma or newline separated)
      const recipientList = parseRecipients(recipients);

      const response = await fetch(`/api/intelligence/topics/${topic.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
          dailyScanConfig: {
            enabled: dailyScanEnabled,
            time: dailyScanTime,
            timezone: 'Asia/Hong_Kong',
          },
          weeklyDigestConfig: {
            enabled: weeklyDigestEnabled,
            day: weeklyDigestDay,
            time: weeklyDigestTime,
            timezone: 'Asia/Hong_Kong',
            recipientList,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully' });
        // Update local topic state with saved data
        if (data.topic) {
          setTopic(data.topic);
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePause = async () => {
    if (!topic) return;

    try {
      const response = await fetch(`/api/intelligence/topics/${topic.id}/pause`, {
        method: 'PUT',
      });
      const data = await response.json();

      if (data.success) {
        setStatus('paused');
        setMessage({ type: 'success', text: 'Topic paused' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to pause topic' });
    }
  };

  const handleResume = async () => {
    if (!topic) return;

    try {
      const response = await fetch(`/api/intelligence/topics/${topic.id}/resume`, {
        method: 'PUT',
      });
      const data = await response.json();

      if (data.success) {
        setStatus('active');
        setMessage({ type: 'success', text: 'Topic resumed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to resume topic' });
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail || !topic) return;
    setIsSendingTest(true);
    setMessage(null);

    try {
      const response = await fetch('/api/intelligence/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, topicId: topic.id }),
      });
      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: `Test email sent to ${testEmail}` });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send test email' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to send test email' });
    } finally {
      setIsSendingTest(false);
    }
  };

  // Load EDM Preview
  const loadEdmPreview = async () => {
    if (!selectedTopicId) return;
    setIsLoadingPreview(true);
    setEdmPreview(null);

    try {
      const response = await fetch(`/api/intelligence/edm/preview/${selectedTopicId}`);
      const data = await response.json();

      if (data.success) {
        setEdmPreview(data.preview);
        setShowPreview(true);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to load preview' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load EDM preview' });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Load EDM History
  const loadEdmHistory = async () => {
    if (!selectedTopicId) return;
    setIsLoadingHistory(true);

    try {
      const response = await fetch(`/api/intelligence/edm/history/${selectedTopicId}`);
      const data = await response.json();

      if (data.success) {
        setEdmHistory(data.history);
        setShowHistory(true);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to load history' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load EDM history' });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Load specific EDM for preview
  const loadEdmById = async (edmId: string) => {
    setSelectedEdmId(edmId);
    setSelectedEdmHtml(null);

    try {
      const response = await fetch(`/api/intelligence/edm/${edmId}`);
      const data = await response.json();

      if (data.success) {
        setSelectedEdmHtml(data.edm.htmlContent);
      }
    } catch (error) {
      console.error('Failed to load EDM:', error);
    }
  };

  // Save EDM to database (draft)
  const handleSaveEdm = async () => {
    if (!selectedTopicId) return;
    setIsSavingEdm(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/intelligence/edm/save/${selectedTopicId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: `EDM saved to database (ID: ${data.edmId})` });
        // Reload history to show the new entry
        loadEdmHistory();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save EDM' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save EDM' });
    } finally {
      setIsSavingEdm(false);
    }
  };

  // Send EDM to recipients
  const handleSendEdm = async () => {
    if (!selectedTopicId) return;

    // Get recipient count
    const recipientList = parseRecipients(recipients);
    const recipientCount = recipientList.length;

    if (recipientCount === 0) {
      setMessage({ type: 'error', text: 'No recipients configured. Please add recipients first.' });
      return;
    }

    if (!confirm(`Send EDM to ${recipientCount} recipient(s)?`)) return;

    setIsSendingEdm(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/intelligence/edm/send/${selectedTopicId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipients: recipientList }),
      });
      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: `EDM sent to ${data.recipientCount} recipient(s)!` });
        // Reload history to show the new entry
        loadEdmHistory();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send EDM' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to send EDM' });
    } finally {
      setIsSendingEdm(false);
    }
  };

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
                  Topic Settings
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Configure monitoring and notification settings
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
            <Link href="/intelligence/dashboard" className="flex items-center gap-2 px-3 py-4 border-b-2 border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300 font-medium text-sm transition-colors">
              <LayoutDashboard size={18} />
              Dashboard
            </Link>
            <Link href="/intelligence/settings" className="flex items-center gap-2 px-3 py-4 border-b-2 border-teal-500 text-teal-600 dark:text-teal-400 font-medium text-sm">
              <Settings size={18} />
              Settings
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Topic Selector */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Select Topic:
            </label>
            {isLoadingTopics ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-teal-500 animate-spin" />
                <span className="text-sm text-slate-500">Loading topics...</span>
              </div>
            ) : topics.length === 0 ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-500">No topics found.</span>
                <Link
                  href="/intelligence/setup"
                  className="flex items-center gap-1 px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  Create Topic
                </Link>
              </div>
            ) : (
              <select
                value={selectedTopicId}
                onChange={e => setSelectedTopicId(e.target.value)}
                className="flex-1 max-w-md px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                {topics.map(t => (
                  <option key={getTopicId(t)} value={getTopicId(t)}>
                    {t.name} ({t.status})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
            <span className="ml-3 text-slate-500">Loading topic settings...</span>
          </div>
        ) : !topic && !isLoadingTopics && topics.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              No topics available. Create a topic to configure settings.
            </p>
            <Link
              href="/intelligence/setup"
              className="px-4 py-2 bg-teal-500 text-white rounded-lg"
            >
              Create Topic
            </Link>
          </div>
        ) : !topic && selectedTopicId ? (
          <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Could not load topic settings. The topic may not exist in the orchestrator yet.
            </p>
            <p className="text-sm text-slate-500 mb-4">
              Topic ID: {selectedTopicId}
            </p>
            <button
              onClick={() => loadTopic(selectedTopicId)}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg"
            >
              Retry Loading
            </button>
          </div>
        ) : !topic ? (
          <div className="text-center py-16">
            <p className="text-slate-600 dark:text-slate-400">
              Select a topic to view settings.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Topic Details */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-teal-500" />
                Topic Details
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Topic Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Keywords (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={keywords}
                    onChange={e => setKeywords(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Status:
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      status === 'active'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                    }`}
                  >
                    {status}
                  </span>
                  {status === 'active' ? (
                    <button
                      onClick={handlePause}
                      className="text-sm text-yellow-600 hover:underline"
                    >
                      Pause Monitoring
                    </button>
                  ) : (
                    <button
                      onClick={handleResume}
                      className="text-sm text-green-600 hover:underline"
                    >
                      Resume Monitoring
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Sources */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-teal-500" />
                  Managed Sources ({topic.sources?.length || 0})
                </h2>
                <button className="flex items-center gap-1 px-3 py-1 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded text-sm">
                  <Plus className="w-4 h-4" />
                  Add Source
                </button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {topic.sources?.map(source => (
                  <div
                    key={source.sourceId}
                    className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700/50 rounded"
                  >
                    <div className="flex-1">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        {source.name}
                      </span>
                      <span className="text-xs text-slate-500 ml-2">
                        Score: {source.authorityScore}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.5 text-xs rounded ${
                          source.status === 'Active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {source.status}
                      </span>
                      <button className="p-1 text-slate-400 hover:text-slate-600">
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button className="p-1 text-slate-400 hover:text-red-500">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
                {(!topic.sources || topic.sources.length === 0) && (
                  <p className="text-sm text-slate-500 text-center py-4">No sources configured</p>
                )}
              </div>
            </div>

            {/* Schedule Settings */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-500" />
                Schedule Settings
              </h2>

              <div className="space-y-6">
                {/* Daily Scan */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-900 dark:text-white">Daily Scan</span>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={dailyScanEnabled}
                        onChange={e => setDailyScanEnabled(e.target.checked)}
                        className="rounded border-slate-300"
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-400">Enabled</span>
                    </label>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="text-sm text-slate-600 dark:text-slate-400">Time (HKT):</label>
                    <input
                      type="time"
                      value={dailyScanTime}
                      onChange={e => setDailyScanTime(e.target.value)}
                      disabled={!dailyScanEnabled}
                      className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Weekly Digest */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-900 dark:text-white">Weekly Digest</span>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={weeklyDigestEnabled}
                        onChange={e => setWeeklyDigestEnabled(e.target.checked)}
                        className="rounded border-slate-300"
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-400">Enabled</span>
                    </label>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="text-sm text-slate-600 dark:text-slate-400">Day:</label>
                    <select
                      value={weeklyDigestDay}
                      onChange={e => setWeeklyDigestDay(e.target.value)}
                      disabled={!weeklyDigestEnabled}
                      className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 disabled:opacity-50"
                    >
                      <option value="monday">Monday</option>
                      <option value="tuesday">Tuesday</option>
                      <option value="wednesday">Wednesday</option>
                      <option value="thursday">Thursday</option>
                      <option value="friday">Friday</option>
                    </select>
                    <label className="text-sm text-slate-600 dark:text-slate-400">Time:</label>
                    <input
                      type="time"
                      value={weeklyDigestTime}
                      onChange={e => setWeeklyDigestTime(e.target.value)}
                      disabled={!weeklyDigestEnabled}
                      className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription Management */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-teal-500" />
                  Subscription Management
                </h2>
                <span className="px-3 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-full text-sm font-medium">
                  {parseRecipients(recipients).length} subscriber{parseRecipients(recipients).length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="space-y-4">
                {/* Subscriber List */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Recipient Emails
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    Enter email addresses separated by commas or new lines. These subscribers will receive the weekly digest.
                  </p>
                  <textarea
                    value={recipients}
                    onChange={e => setRecipients(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 font-mono text-sm"
                    placeholder="email1@example.com, email2@example.com, email3@example.com"
                  />
                </div>

                {/* Current Subscribers Preview */}
                {recipients.trim() && (
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                      Current Subscribers:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {parseRecipients(recipients).map((email, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded text-xs text-slate-700 dark:text-slate-200"
                          >
                            <Mail className="w-3 h-3" />
                            {email}
                            <button
                              type="button"
                              onClick={() => {
                                const emails = parseRecipients(recipients)
                                  .filter(e => e.toLowerCase() !== email.toLowerCase());
                                setRecipients(formatRecipients(emails));
                              }}
                              className="ml-1 text-slate-400 hover:text-red-500"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                    </div>
                  </div>
                )}

                {/* Quick Add */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Quick Add Subscriber
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="email"
                      placeholder="newsubscriber@example.com"
                      className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          const input = e.currentTarget;
                          const email = input.value.trim();
                          if (email && email.includes('@')) {
                            const currentEmails = parseRecipients(recipients);
                            if (!currentEmails.some(e => e.toLowerCase() === email.toLowerCase())) {
                              const nextRecipients = [...currentEmails, email];
                              setRecipients(formatRecipients(nextRecipients));
                              void saveRecipientList(nextRecipients);
                            }
                            input.value = '';
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={e => {
                        const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                        const email = input.value.trim();
                        if (email && email.includes('@')) {
                          const currentEmails = parseRecipients(recipients);
                          if (!currentEmails.some(e => e.toLowerCase() === email.toLowerCase())) {
                            const nextRecipients = [...currentEmails, email];
                            setRecipients(formatRecipients(nextRecipients));
                            void saveRecipientList(nextRecipients);
                          }
                          input.value = '';
                        }
                      }}
                      className="flex items-center gap-1 px-3 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-200 dark:border-slate-600 pt-4">
                  <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Test Email
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    Send a test digest email to verify your configuration.
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="email"
                      value={testEmail}
                      onChange={e => setTestEmail(e.target.value)}
                      placeholder="Enter email for test"
                      className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                    />
                    <button
                      onClick={handleSendTestEmail}
                      disabled={isSendingTest || !testEmail}
                      className="flex items-center gap-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-400 text-white rounded-lg"
                    >
                      {isSendingTest ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      Send Test
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* EDM Preview & History */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-500" />
                Email Newsletter Preview
              </h2>

              <div className="space-y-4">
                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={loadEdmPreview}
                    disabled={isLoadingPreview}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-slate-400 text-white rounded-lg text-sm"
                  >
                    {isLoadingPreview ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                    Generate Preview
                  </button>
                  <button
                    onClick={loadEdmHistory}
                    disabled={isLoadingHistory}
                    className="flex items-center gap-2 px-4 py-2 border border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg text-sm"
                  >
                    {isLoadingHistory ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <History className="w-4 h-4" />
                    )}
                    View History
                  </button>
                </div>

                {/* Preview Section */}
                {showPreview && edmPreview && (
                  <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                    <div className="bg-slate-50 dark:bg-slate-900 p-3 border-b border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {edmPreview.subject}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {edmPreview.articlesIncluded} articles included • Generated {new Date(edmPreview.generatedAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleSaveEdm}
                            disabled={isSavingEdm}
                            className="flex items-center gap-1 px-3 py-1.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm"
                          >
                            {isSavingEdm ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Save className="w-3 h-3" />
                            )}
                            Save Draft
                          </button>
                          <button
                            onClick={handleSendEdm}
                            disabled={isSendingEdm}
                            className="flex items-center gap-1 px-3 py-1.5 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-400 text-white rounded-lg text-sm"
                          >
                            {isSendingEdm ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Send className="w-3 h-3" />
                            )}
                            Send EDM
                          </button>
                          <button
                            onClick={() => setShowPreview(false)}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                          >
                            <X className="w-4 h-4 text-slate-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white">
                      <iframe
                        srcDoc={edmPreview.htmlContent}
                        title="EDM Preview"
                        className="w-full h-[600px] border-0"
                        sandbox="allow-same-origin"
                      />
                    </div>
                  </div>
                )}

                {/* History Section */}
                {showHistory && (
                  <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                    <div className="bg-slate-50 dark:bg-slate-900 p-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <h3 className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">
                        <History className="w-4 h-4 text-purple-500" />
                        Sent Email History
                      </h3>
                      <button
                        onClick={() => {
                          setShowHistory(false);
                          setSelectedEdmId(null);
                          setSelectedEdmHtml(null);
                        }}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                      >
                        <X className="w-4 h-4 text-slate-500" />
                      </button>
                    </div>

                    {edmHistory.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                        <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No emails sent yet.</p>
                        <p className="text-sm mt-1">Send your first weekly digest to see history here.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-200 dark:divide-slate-700">
                        {edmHistory.map(edm => (
                          <div
                            key={edm.id}
                            className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                            onClick={() => loadEdmById(edm.id)}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                  {edm.subject}
                                </p>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-xs text-slate-500 dark:text-slate-400">
                                    {new Date(edm.sentAt).toLocaleDateString()} {new Date(edm.sentAt).toLocaleTimeString()}
                                  </span>
                                  <span className="text-xs text-slate-400">•</span>
                                  <span className="text-xs text-slate-500 dark:text-slate-400">
                                    {edm.articlesIncluded} articles
                                  </span>
                                  <span className="text-xs text-slate-400">•</span>
                                  <span className="text-xs text-slate-500 dark:text-slate-400">
                                    {edm.recipients.length} recipient{edm.recipients.length !== 1 ? 's' : ''}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-xs ${
                                  edm.status === 'sent'
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                                }`}>
                                  {edm.status}
                                </span>
                                <Eye className="w-4 h-4 text-slate-400" />
                              </div>
                            </div>

                            {/* Expanded preview for selected EDM */}
                            {selectedEdmId === edm.id && selectedEdmHtml && (
                              <div className="mt-4 border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden">
                                <iframe
                                  srcDoc={selectedEdmHtml}
                                  title="EDM Preview"
                                  className="w-full h-[500px] border-0 bg-white"
                                  sandbox="allow-same-origin"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {!showPreview && !showHistory && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Generate a preview to see how your weekly digest will look, or view previously sent emails.
                  </p>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-4">
              <Link
                href={`/intelligence/dashboard?topic=${topic.id}`}
                className="px-6 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg"
              >
                Cancel
              </Link>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-400 text-white rounded-lg"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Settings
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
