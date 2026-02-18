'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  FolderKanban,
  Building2,
  Calendar,
  MessageSquare,
  Mail,
  RefreshCw,
  FileText,
  Tag,
  Zap,
} from 'lucide-react';
import type { Project, Brand, FeedbackEvent } from '@/lib/crm-kb-api';
import { useCrmAi } from '../../context';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<string, string> = {
  planning: 'bg-blue-900/40 text-blue-300 border-blue-700',
  in_progress: 'bg-emerald-900/40 text-emerald-300 border-emerald-700',
  on_hold: 'bg-yellow-900/40 text-yellow-300 border-yellow-700',
  completed: 'bg-green-900/40 text-green-300 border-green-700',
  cancelled: 'bg-red-900/40 text-red-300 border-red-700',
};

const SENTIMENT_COLORS: Record<string, string> = {
  positive: 'bg-green-900/40 text-green-300 border-green-700',
  neutral: 'bg-slate-700/40 text-slate-300 border-slate-600',
  negative: 'bg-red-900/40 text-red-300 border-red-700',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Inner component (needs Suspense boundary for useSearchParams)
// ---------------------------------------------------------------------------

function ProjectDetailInner() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('id');
  const { setPageState } = useCrmAi();

  const [project, setProject] = useState<Project | null>(null);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [feedback, setFeedback] = useState<FeedbackEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      // Fetch project data
      const projectRes = await fetch('/api/projects/' + projectId);
      if (!projectRes.ok) throw new Error('Failed to load project');
      const projectData: Project = await projectRes.json();
      setProject(projectData);

      // Fetch brand data if project has a client_id
      if (projectData.client_id) {
        try {
          const brandRes = await fetch('/api/brands/' + projectData.client_id);
          if (brandRes.ok) {
            const brandData: Brand = await brandRes.json();
            setBrand(brandData);
          }
        } catch {
          // Brand fetch is non-critical, ignore errors
        }
      }

      // Fetch feedback for this project
      try {
        const feedbackRes = await fetch('/api/feedback?project_id=' + projectId);
        if (feedbackRes.ok) {
          const feedbackData = await feedbackRes.json();
          setFeedback(feedbackData.items ?? feedbackData);
        }
      } catch {
        // Feedback fetch is non-critical, ignore errors
      }

      setPageState({
        pageType: 'project-detail',
        pageTitle: projectData.name,
        hints: { projectId: projectData.id, projectName: projectData.name },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [projectId, setPageState]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSyncEmails = async () => {
    if (!projectId) return;
    setSyncing(true);
    setSyncResult(null);
    try {
      const syncRes = await fetch('/api/gmail/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!syncRes.ok) throw new Error('Sync failed');
      const result = await syncRes.json();
      setSyncResult(
        `Synced ${result.synced_count} emails, ${result.new_feedback_count} new feedback items created.`
      );
      // Refresh feedback after sync
      const feedbackRes = await fetch('/api/feedback?project_id=' + projectId);
      if (feedbackRes.ok) {
        const feedbackData = await feedbackRes.json();
        setFeedback(feedbackData.items ?? feedbackData);
      }
    } catch (err) {
      setSyncResult(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  // --- No project ID ---
  if (!projectId) {
    return (
      <div className="py-12 text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-red-300 mb-4">No project ID provided</p>
        <Link
          href="/use-cases/crm/projects"
          className="text-emerald-400 hover:text-emerald-300 text-sm"
        >
          Back to Projects
        </Link>
      </div>
    );
  }

  // --- Loading ---
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        <span className="ml-3 text-slate-400 text-sm">Loading project...</span>
      </div>
    );
  }

  // --- Error ---
  if (error || !project) {
    return (
      <div className="py-12 text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-red-300 mb-4">{error || 'Project not found'}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-slate-700 text-slate-200 rounded-lg text-sm hover:bg-slate-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Header */}
      <div>
        <nav className="flex items-center gap-2 text-sm text-slate-400 mb-4">
          <Link
            href="/use-cases/crm/projects"
            className="hover:text-white transition-colors inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Projects
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-slate-300">{project.name}</span>
        </nav>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{project.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${
                STATUS_COLORS[project.status] ?? 'bg-slate-700 text-slate-300 border-slate-600'
              }`}
            >
              {project.status.replace('_', ' ')}
            </span>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium border bg-slate-700/50 text-slate-300 border-slate-600 capitalize">
              {project.type.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Info Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Brand */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-slate-400">Brand</span>
          </div>
          {brand ? (
            <Link
              href={`/use-cases/crm/brands/detail?id=${brand.id}`}
              className="text-lg font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              {brand.name}
            </Link>
          ) : (
            <span className="text-lg font-bold text-slate-500">--</span>
          )}
        </div>

        {/* Status */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <FolderKanban className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-slate-400">Status</span>
          </div>
          <span
            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${
              STATUS_COLORS[project.status] ?? 'bg-slate-700 text-slate-300 border-slate-600'
            }`}
          >
            {project.status.replace('_', ' ')}
          </span>
        </div>

        {/* Type */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-slate-400">Type</span>
          </div>
          <span className="text-lg font-bold text-white capitalize">
            {project.type.replace('_', ' ')}
          </span>
        </div>

        {/* Dates */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-slate-400">Dates</span>
          </div>
          <div className="space-y-1">
            {project.start_date && (
              <p className="text-xs text-slate-300">
                <span className="text-slate-500">Start:</span> {formatDate(project.start_date)}
              </p>
            )}
            {project.end_date && (
              <p className="text-xs text-slate-300">
                <span className="text-slate-500">End:</span> {formatDate(project.end_date)}
              </p>
            )}
            {!project.start_date && !project.end_date && (
              <span className="text-lg font-bold text-slate-500">--</span>
            )}
          </div>
        </div>
      </div>

      {/* Brief Section */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-white">Project Brief</h2>
        </div>
        {project.brief ? (
          <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
            {project.brief}
          </p>
        ) : (
          <p className="text-sm text-slate-500 italic">No brief provided for this project.</p>
        )}
      </div>

      {/* Social Content Ops Connection */}
      {(project.type === 'social_campaign' || project.type === 'content_production') && (
        <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-700/30 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Zap className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-white mb-1">Social Content Ops Available</h3>
              <p className="text-xs text-slate-400 mb-3">
                This {project.type === 'social_campaign' ? 'social campaign' : 'content production'} project can be connected to Social Content Ops for automated content calendar, publishing workflows, and performance tracking.
              </p>
              <div className="flex flex-wrap gap-2">
                {['Content Calendar', 'Auto Publishing', 'Performance Tracking', 'Brand Guidelines'].map((feature) => (
                  <span key={feature} className="px-2 py-0.5 bg-purple-500/10 border border-purple-700/30 rounded text-xs text-purple-300">
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-white">
              Feedback ({feedback.length})
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncEmails}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 text-slate-200 rounded-lg text-xs font-medium hover:bg-slate-600 disabled:opacity-50 transition-colors"
            >
              {syncing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Mail className="w-3.5 h-3.5" />
              )}
              Sync Emails
            </button>
            <button
              onClick={fetchData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 text-slate-200 rounded-lg text-xs font-medium hover:bg-slate-600 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
        </div>

        {syncResult && (
          <div className="mb-4 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-xs text-slate-300">
            {syncResult}
          </div>
        )}

        {feedback.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 mb-2">No feedback recorded yet</p>
            <p className="text-xs text-slate-500">
              Sync emails or add feedback through the AI assistant.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {feedback.map((item) => (
              <div
                key={item.id}
                className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 capitalize">{item.source}</span>
                    <span className="text-xs text-slate-600">|</span>
                    <span className="text-xs text-slate-500">{formatDate(item.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.sentiment && (
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${
                          SENTIMENT_COLORS[item.sentiment] ?? 'bg-slate-700 text-slate-300 border-slate-600'
                        }`}
                      >
                        {item.sentiment}
                      </span>
                    )}
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700/50 text-slate-400 border border-slate-600">
                      {item.status}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-slate-300 line-clamp-3">{item.raw_text}</p>
                {item.topics && item.topics.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2">
                    {item.topics.map((topic, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-xs"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page (wraps inner component in Suspense for useSearchParams)
// ---------------------------------------------------------------------------

export default function ProjectDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          <span className="ml-3 text-slate-400 text-sm">Loading...</span>
        </div>
      }
    >
      <ProjectDetailInner />
    </Suspense>
  );
}
