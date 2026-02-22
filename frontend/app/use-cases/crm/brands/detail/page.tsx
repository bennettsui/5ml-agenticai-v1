'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  FolderKanban,
  MessageSquare,
  Plus,
  Mail,
  Globe,
  Building2,
  Calendar,
  TrendingUp,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import {
  crmApi,
  type Brand,
  type Project,
  type FeedbackEvent,
} from '@/lib/crm-kb-api';
import { useCrmAi } from '../../context';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-900/40 text-green-300 border-green-700',
  prospect: 'bg-blue-900/40 text-blue-300 border-blue-700',
  dormant: 'bg-yellow-900/40 text-yellow-300 border-yellow-700',
  lost: 'bg-red-900/40 text-red-300 border-red-700',
};

const PROJECT_STATUS_COLORS: Record<string, string> = {
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

function BrandDetailInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const brandId = searchParams.get('id');
  const { setPageState } = useCrmAi();

  const [brand, setBrand] = useState<Brand | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [feedback, setFeedback] = useState<FeedbackEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'feedback' | 'strategy' | 'identity'>('overview');

  const fetchData = useCallback(async () => {
    if (!brandId) return;
    setLoading(true);
    setError(null);
    try {
      const [brandData, projectsData, feedbackData] = await Promise.all([
        crmApi.brands.get(brandId),
        crmApi.brands.projects(brandId),
        crmApi.brands.feedback(brandId),
      ]);
      setBrand(brandData);
      setProjects(projectsData.items ?? []);
      setFeedback(feedbackData.items ?? []);
      setPageState({
        pageType: 'brand-detail',
        pageTitle: brandData.name,
        hints: { brandId: brandData.id, brandName: brandData.name },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load brand');
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSyncEmails = async () => {
    if (!brandId) return;
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await crmApi.gmail.sync();
      setSyncResult(
        `Synced ${result.synced_count} emails, ${result.new_feedback_count} new feedback items created.`
      );
      const feedbackData = await crmApi.brands.feedback(brandId);
      setFeedback(feedbackData.items ?? []);
    } catch (err) {
      setSyncResult(
        err instanceof Error ? err.message : 'Sync failed'
      );
    } finally {
      setSyncing(false);
    }
  };

  if (!brandId) {
    return (
      <div className="py-12 text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-red-300 mb-4">No brand ID provided</p>
        <Link
          href="/use-cases/crm/brands"
          className="text-emerald-400 hover:text-emerald-300 text-sm"
        >
          Back to Brands
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        <span className="ml-3 text-slate-400 text-sm">Loading brand...</span>
      </div>
    );
  }

  if (error || !brand) {
    return (
      <div className="py-12 text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-red-300 mb-4">{error || 'Brand not found'}</p>
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
            href="/use-cases/crm/brands"
            className="hover:text-white transition-colors inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Brands
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-slate-300">{brand.name}</span>
        </nav>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{brand.name}</h1>
            {brand.legal_name && (
              <p className="text-sm text-slate-400 mt-0.5">{brand.legal_name}</p>
            )}
          </div>
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${
              STATUS_COLORS[brand.status] ?? 'bg-slate-700 text-slate-300 border-slate-600'
            }`}
          >
            {brand.status}
          </span>
        </div>
      </div>

      {/* Brand Info Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-slate-400">Health Score</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-white">{brand.health_score}%</span>
            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  brand.health_score >= 70
                    ? 'bg-green-500'
                    : brand.health_score >= 40
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
                style={{ width: `${brand.health_score}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-slate-400">Value Tier</span>
          </div>
          <span className="text-2xl font-bold text-white">
            {brand.client_value_tier ? `Tier ${brand.client_value_tier}` : '--'}
          </span>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <FolderKanban className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-slate-400">Projects</span>
          </div>
          <span className="text-2xl font-bold text-white">{projects.length}</span>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-slate-400">Feedback Items</span>
          </div>
          <span className="text-2xl font-bold text-white">{feedback.length}</span>
        </div>
      </div>

      {/* Brand Details */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-3">Brand Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-500" />
            <span className="text-slate-400">Industry:</span>
            <span className="text-slate-200">
              {brand.industry?.join(', ') || '--'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-slate-500" />
            <span className="text-slate-400">Region:</span>
            <span className="text-slate-200">
              {brand.region?.join(', ') || '--'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-500" />
            <span className="text-slate-400">Company Size:</span>
            <span className="text-slate-200">
              {brand.company_size || '--'}
            </span>
          </div>
          {brand.website_url && (
            <div className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-slate-500" />
              <span className="text-slate-400">Website:</span>
              <a
                href={brand.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:text-emerald-300 truncate"
              >
                {brand.website_url}
              </a>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-slate-400">Created:</span>
            <span className="text-slate-200">{formatDate(brand.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Tabs: Overview / Strategy / Identity / Projects / Feedback */}
      <div>
        <div className="flex items-center gap-1 border-b border-slate-700/50 mb-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-[1px] whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Overview
          </button>
          {brand && brand.client_profile?.strategy && (
            <button
              onClick={() => setActiveTab('strategy')}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-[1px] whitespace-nowrap ${
                activeTab === 'strategy'
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Strategy
            </button>
          )}
          {brand && (brand.client_profile?.voiceTone || brand.client_profile?.colorPalette) && (
            <button
              onClick={() => setActiveTab('identity')}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-[1px] whitespace-nowrap ${
                activeTab === 'identity'
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Brand Identity
            </button>
          )}
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-[1px] whitespace-nowrap ${
              activeTab === 'projects'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <FolderKanban className="w-4 h-4" />
              Projects ({projects.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-[1px] whitespace-nowrap ${
              activeTab === 'feedback'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Feedback ({feedback.length})
            </div>
          </button>

          <div className="ml-auto flex items-center gap-2">
            {activeTab === 'projects' && (
              <Link
                href={`/use-cases/crm/projects/new?client_id=${brandId}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-500 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                New Project
              </Link>
            )}
            {activeTab === 'feedback' && (
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
            )}
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

        {/* Overview Tab */}
        {activeTab === 'overview' && brand && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4">
                <p className="text-xs text-slate-400 mb-1">Status</p>
                <p className="text-sm font-semibold text-white capitalize">{brand.status}</p>
              </div>
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4">
                <p className="text-xs text-slate-400 mb-1">Health Score</p>
                <p className="text-sm font-semibold text-white">{brand.health_score || '—'}/100</p>
              </div>
            </div>
            {brand.legal_name && (
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4">
                <p className="text-xs text-slate-400 mb-1">Legal Name</p>
                <p className="text-sm font-semibold text-white">{brand.legal_name}</p>
              </div>
            )}
            {brand.industry && brand.industry.length > 0 && (
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4">
                <p className="text-xs text-slate-400 mb-2">Industries</p>
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(brand.industry) ? brand.industry : [brand.industry]).map((ind, i) => (
                    <span key={i} className="px-2.5 py-1 bg-slate-700 text-slate-200 text-xs rounded-full">
                      {typeof ind === 'string' ? ind : JSON.stringify(ind)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Strategy Tab */}
        {activeTab === 'strategy' && brand && brand.client_profile?.strategy && (
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Content Strategy</h3>
            <div className="text-xs text-slate-300 whitespace-pre-wrap max-h-96 overflow-y-auto">
              {typeof brand.client_profile.strategy === 'string'
                ? brand.client_profile.strategy
                : JSON.stringify(brand.client_profile.strategy, null, 2)}
            </div>
          </div>
        )}

        {/* Brand Identity Tab */}
        {activeTab === 'identity' && brand && (
          <div className="space-y-4">
            {brand.client_profile?.voiceTone && (
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4">
                <p className="text-xs text-slate-400 mb-2">Brand Voice & Tone</p>
                <p className="text-sm font-semibold text-white capitalize">{brand.client_profile.voiceTone.replace('-', ' ')}</p>
              </div>
            )}
            {brand.client_profile?.brandPersonality && brand.client_profile.brandPersonality.length > 0 && (
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4">
                <p className="text-xs text-slate-400 mb-2">Brand Personality</p>
                <div className="flex flex-wrap gap-2">
                  {brand.client_profile.brandPersonality.map((personality, i) => (
                    <span key={i} className="px-2.5 py-1 bg-emerald-600/20 text-emerald-300 text-xs rounded-full">
                      {personality}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {brand.client_profile?.visualStyle && (
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4">
                <p className="text-xs text-slate-400 mb-2">Visual Aesthetic</p>
                <p className="text-sm font-semibold text-white capitalize">{brand.client_profile.visualStyle.replace('-', ' ')}</p>
              </div>
            )}
            {brand.client_profile?.colorPalette && (
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4">
                <p className="text-xs text-slate-400 mb-3">Brand Colors</p>
                <div className="flex gap-3">
                  {brand.client_profile.colorPalette.primary && (
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className="w-12 h-12 rounded border border-slate-600"
                        style={{ backgroundColor: brand.client_profile.colorPalette.primary }}
                      />
                      <p className="text-xs text-slate-400">Primary</p>
                      <p className="text-xs font-mono text-slate-500">{brand.client_profile.colorPalette.primary}</p>
                    </div>
                  )}
                  {brand.client_profile.colorPalette.secondary && (
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className="w-12 h-12 rounded border border-slate-600"
                        style={{ backgroundColor: brand.client_profile.colorPalette.secondary }}
                      />
                      <p className="text-xs text-slate-400">Secondary</p>
                      <p className="text-xs font-mono text-slate-500">{brand.client_profile.colorPalette.secondary}</p>
                    </div>
                  )}
                  {brand.client_profile.colorPalette.accent && (
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className="w-12 h-12 rounded border border-slate-600"
                        style={{ backgroundColor: brand.client_profile.colorPalette.accent }}
                      />
                      <p className="text-xs text-slate-400">Accent</p>
                      <p className="text-xs font-mono text-slate-500">{brand.client_profile.colorPalette.accent}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            {!brand.client_profile?.voiceTone && !brand.client_profile?.colorPalette && (
              <div className="text-center py-8 text-slate-400">
                <p className="text-sm">No brand identity data available</p>
                <p className="text-xs mt-1">Add brand details in the setup wizard to see them here</p>
              </div>
            )}
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div>
            {projects.length === 0 ? (
              <div className="text-center py-12">
                <FolderKanban className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 mb-2">No projects yet</p>
                <Link
                  href={`/use-cases/crm/projects/new?client_id=${brandId}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-500 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create First Project
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-sm font-semibold text-white">{project.name}</h3>
                        <span className="text-xs text-slate-400 capitalize">{project.type.replace('_', ' ')}</span>
                      </div>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          PROJECT_STATUS_COLORS[project.status] ?? 'bg-slate-700 text-slate-300 border-slate-600'
                        }`}
                      >
                        {project.status.replace('_', ' ')}
                      </span>
                    </div>
                    {project.brief && (
                      <p className="text-xs text-slate-400 mb-2 line-clamp-2">{project.brief}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      {project.start_date && (
                        <span>Start: {formatDate(project.start_date)}</span>
                      )}
                      {project.end_date && (
                        <span>End: {formatDate(project.end_date)}</span>
                      )}
                      <span>Created: {formatDate(project.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Feedback Tab */}
        {activeTab === 'feedback' && (
          <div>
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
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700/50 text-slate-400 border border-slate-600"
                        >
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
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page (wraps inner component in Suspense for useSearchParams)
// ---------------------------------------------------------------------------

export default function BrandDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          <span className="ml-3 text-slate-400 text-sm">Loading...</span>
        </div>
      }
    >
      <BrandDetailInner />
    </Suspense>
  );
}
