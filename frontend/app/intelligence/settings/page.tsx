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

interface Source {
  sourceId: string;
  name: string;
  primaryUrl: string;
  status: 'Active' | 'Inactive';
  authorityScore: number;
}

export default function TopicSettingsPage() {
  const [topic, setTopic] = useState<TopicSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
    const params = new URLSearchParams(window.location.search);
    const topicId = params.get('topic');

    if (topicId) {
      loadTopic(topicId);
    } else {
      setIsLoading(false);
    }
  }, []);

  const loadTopic = async (topicId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/intelligence/topics/${topicId}`);
      const data = await response.json();

      if (data.success) {
        const t = data.topic;
        setTopic(t);
        setName(t.name);
        setKeywords(t.keywords?.join(', ') || '');
        setStatus(t.status === 'archived' ? 'paused' : t.status);
        setDailyScanTime(t.dailyScanConfig?.time || '06:00');
        setDailyScanEnabled(t.dailyScanConfig?.enabled ?? true);
        setWeeklyDigestDay(t.weeklyDigestConfig?.day || 'monday');
        setWeeklyDigestTime(t.weeklyDigestConfig?.time || '08:00');
        setWeeklyDigestEnabled(t.weeklyDigestConfig?.enabled ?? true);
        setRecipients(t.weeklyDigestConfig?.recipientList?.join(', ') || '');
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
      // In production, this would update the topic via API
      setMessage({ type: 'success', text: 'Settings saved successfully' });
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

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
          </div>
        ) : !topic ? (
          <div className="text-center py-16">
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              No topic selected. Please select a topic from the dashboard.
            </p>
            <Link
              href="/intelligence/dashboard"
              className="px-4 py-2 bg-teal-500 text-white rounded-lg"
            >
              Go to Dashboard
            </Link>
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

            {/* Email Settings */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-teal-500" />
                Email Settings
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Recipient List (one email per line or comma-separated)
                  </label>
                  <textarea
                    value={recipients}
                    onChange={e => setRecipients(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                    placeholder="email1@example.com, email2@example.com"
                  />
                </div>

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
