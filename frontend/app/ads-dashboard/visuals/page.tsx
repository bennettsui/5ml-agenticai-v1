'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Megaphone,
  Image as ImageIcon,
  BarChart3,
  MousePointerClick,
  DollarSign,
  Eye,
  TrendingUp,
  ChevronDown,
  RefreshCw,
  Loader2,
  ExternalLink,
  Search,
  LayoutGrid,
  List,
} from 'lucide-react';

// ==========================================
// Types
// ==========================================

interface AdRow {
  platform: string;
  ad_id: string;
  ad_name: string;
  campaign_id: string;
  campaign_name: string;
  tenant_id: string;
  impressions: string;
  reach: string;
  clicks: string;
  spend: string;
  conversions: string;
  revenue: string;
  roas: string;
  avg_cpc: string;
  avg_cpm: string;
  avg_ctr: string;
  objective?: string;
  creative_title?: string;
  creative_body?: string;
  creative_image_url?: string;
  creative_thumbnail_url?: string;
  creative_link_url?: string;
  creative_cta?: string;
  creative_video_id?: string;
  ad_status?: string;
  ad_effective_status?: string;
}

interface TenantInfo {
  tenant_id: string;
  account_id: string;
  campaign_count: number;
  earliest_date: string;
  latest_date: string;
  total_spend: string;
}

// ==========================================
// Constants
// ==========================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

const ACCOUNT_BRAND_MAP: Record<string, string> = {
  '5ml-internal': '5 Miles Lab (Internal)',
  'act_1249401425701453': 'Brand A (Meta)',
  'act_46494346': 'Brand B (Meta)',
  'act_1358670397894732': 'Brand C (Meta)',
};

function getAccountDisplayName(accountId: string): string {
  return ACCOUNT_BRAND_MAP[accountId] || accountId;
}

function formatCurrency(val: string | number | null): string {
  if (val === null || val === undefined) return '$0.00';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatNumber(val: string | number | null): string {
  if (val === null || val === undefined) return '0';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  return num.toLocaleString('en-US');
}

function getDefaultDateRange(): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().split('T')[0];
  const fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const from = fromDate.toISOString().split('T')[0];
  return { from, to };
}

// ==========================================
// Component
// ==========================================

export default function AdVisualsPage() {
  const defaults = getDefaultDateRange();
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [selectedTenant, setSelectedTenant] = useState<string>('all');
  const [ads, setAds] = useState<AdRow[]>([]);
  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'spend' | 'clicks' | 'impressions' | 'avg_ctr' | 'roas'>('spend');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [expandedAd, setExpandedAd] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      from,
      to,
      platform: 'meta',
      tenant_id: selectedTenant,
    });

    try {
      const [adsRes, tenantRes] = await Promise.all([
        fetch(`${API_BASE}/api/ads/performance/ads?${params}`),
        fetch(`${API_BASE}/api/ads/tenants`),
      ]);

      if (adsRes.ok) {
        const json = await adsRes.json();
        setAds(json.data || []);
      }
      if (tenantRes.ok) {
        const json = await tenantRes.json();
        setTenants(json.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [from, to, selectedTenant]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter to only ads with visuals
  const visualAds = useMemo(() => {
    let filtered = ads.filter(ad => ad.creative_image_url || ad.creative_thumbnail_url);

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(ad =>
        (ad.ad_name || '').toLowerCase().includes(q) ||
        (ad.campaign_name || '').toLowerCase().includes(q) ||
        (ad.creative_title || '').toLowerCase().includes(q) ||
        (ad.creative_body || '').toLowerCase().includes(q)
      );
    }

    return filtered.sort((a, b) => {
      const aVal = parseFloat(a[sortBy] || '0');
      const bVal = parseFloat(b[sortBy] || '0');
      return bVal - aVal;
    });
  }, [ads, searchQuery, sortBy]);

  const totalAdsWithVisuals = ads.filter(ad => ad.creative_image_url || ad.creative_thumbnail_url).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/ads-dashboard"
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                  <ImageIcon className="w-7 h-7 text-pink-500" />
                  Ad Visuals & Performance
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Facebook & Instagram ad creatives with performance metrics
                </p>
              </div>
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Submenu */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 -mb-px">
            <Link
              href="/ads-dashboard"
              className="px-4 py-2.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 border-b-2 border-transparent hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </span>
            </Link>
            <span className="px-4 py-2.5 text-sm font-medium text-orange-600 dark:text-orange-400 border-b-2 border-orange-500">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4" />
                Ad Visuals
              </span>
            </span>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Account:</label>
              <select
                value={selectedTenant}
                onChange={(e) => setSelectedTenant(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white min-w-[200px]"
              >
                <option value="all">All Accounts</option>
                {tenants.map((t) => (
                  <option key={t.tenant_id} value={t.tenant_id}>
                    {getAccountDisplayName(t.tenant_id)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">From:</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">To:</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex-1" />
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ads..."
                className="pl-9 pr-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white w-[200px]"
              />
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 dark:text-slate-400">Sort by:</span>
              {[
                { value: 'spend', label: 'Spend' },
                { value: 'clicks', label: 'Clicks' },
                { value: 'impressions', label: 'Impressions' },
                { value: 'avg_ctr', label: 'CTR' },
                { value: 'roas', label: 'ROAS' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSortBy(opt.value as typeof sortBy)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    sortBy === opt.value
                      ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-slate-200 dark:bg-slate-600 text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-slate-200 dark:bg-slate-600 text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Showing <span className="font-medium text-slate-900 dark:text-white">{visualAds.length}</span> ads with visuals
            {totalAdsWithVisuals !== visualAds.length && ` (${totalAdsWithVisuals} total)`}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6 text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading ad visuals...
          </div>
        )}

        {!loading && visualAds.length === 0 && (
          <div className="text-center py-20">
            <ImageIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {ads.length === 0 ? 'No ad data found. Sync your Meta accounts first.' : 'No ads with visual creatives found.'}
            </p>
          </div>
        )}

        {/* Grid View */}
        {!loading && viewMode === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visualAds.map((ad) => {
              const imageUrl = ad.creative_image_url || ad.creative_thumbnail_url || '';
              const isExpanded = expandedAd === ad.ad_id;
              const adStatus = ad.ad_effective_status || ad.ad_status;

              return (
                <div
                  key={ad.ad_id}
                  className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setExpandedAd(isExpanded ? null : ad.ad_id)}
                >
                  {/* Image */}
                  <div className="relative aspect-square bg-slate-100 dark:bg-slate-700">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt={ad.ad_name || 'Ad creative'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '';
                        (e.target as HTMLImageElement).className = 'hidden';
                      }}
                    />
                    {/* Status badge */}
                    {adStatus && (
                      <span className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-medium backdrop-blur-sm ${
                        adStatus === 'ACTIVE'
                          ? 'bg-green-500/80 text-white'
                          : adStatus === 'PAUSED'
                            ? 'bg-yellow-500/80 text-white'
                            : 'bg-slate-500/80 text-white'
                      }`}>
                        {adStatus}
                      </span>
                    )}
                    {/* Spend overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
                      <span className="text-white font-bold text-sm">{formatCurrency(ad.spend)}</span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <h4 className="text-xs font-medium text-slate-900 dark:text-white truncate mb-1.5">
                      {ad.ad_name || 'Unnamed Ad'}
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mb-2">
                      {ad.campaign_name}
                    </p>

                    {/* Metrics row */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-[10px] text-slate-400 flex items-center justify-center gap-0.5">
                          <Eye className="w-2.5 h-2.5" />
                          Impr
                        </div>
                        <div className="text-xs font-medium text-slate-900 dark:text-white">{formatNumber(ad.impressions)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 flex items-center justify-center gap-0.5">
                          <MousePointerClick className="w-2.5 h-2.5" />
                          Clicks
                        </div>
                        <div className="text-xs font-medium text-slate-900 dark:text-white">{formatNumber(ad.clicks)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 flex items-center justify-center gap-0.5">
                          <TrendingUp className="w-2.5 h-2.5" />
                          CTR
                        </div>
                        <div className="text-xs font-medium text-slate-900 dark:text-white">{parseFloat(ad.avg_ctr || '0').toFixed(2)}%</div>
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500">CPC</span>
                            <span className="text-slate-900 dark:text-white font-medium">{formatCurrency(ad.avg_cpc)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">CPM</span>
                            <span className="text-slate-900 dark:text-white font-medium">{formatCurrency(ad.avg_cpm)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Reach</span>
                            <span className="text-slate-900 dark:text-white">{formatNumber(ad.reach)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Conv.</span>
                            <span className="text-slate-900 dark:text-white">{formatNumber(ad.conversions)}</span>
                          </div>
                          {parseFloat(ad.roas || '0') > 0 && (
                            <div className="flex justify-between col-span-2">
                              <span className="text-slate-500">ROAS</span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">{parseFloat(ad.roas).toFixed(2)}x</span>
                            </div>
                          )}
                        </div>

                        {ad.creative_title && (
                          <div className="text-[10px] text-slate-600 dark:text-slate-300">
                            <span className="text-slate-400">Title:</span> {ad.creative_title}
                          </div>
                        )}
                        {ad.creative_body && (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-3">
                            {ad.creative_body}
                          </div>
                        )}
                        {ad.creative_cta && (
                          <span className="inline-block px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-[10px]">
                            {ad.creative_cta.replace(/_/g, ' ')}
                          </span>
                        )}
                        {ad.creative_link_url && (
                          <a
                            href={ad.creative_link_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            {ad.creative_link_url.replace(/^https?:\/\//, '').slice(0, 40)}...
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* List View */}
        {!loading && viewMode === 'list' && visualAds.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {visualAds.map((ad) => {
                const imageUrl = ad.creative_image_url || ad.creative_thumbnail_url || '';
                const adStatus = ad.ad_effective_status || ad.ad_status;

                return (
                  <div key={ad.ad_id} className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    {/* Thumbnail */}
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrl}
                        alt={ad.ad_name || ''}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="text-sm font-medium text-slate-900 dark:text-white truncate">{ad.ad_name || 'Unnamed Ad'}</h4>
                        {adStatus && (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 ${
                            adStatus === 'ACTIVE'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                              : adStatus === 'PAUSED'
                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                          }`}>
                            {adStatus}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{ad.campaign_name}</p>
                      {ad.creative_body && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">{ad.creative_body}</p>
                      )}
                    </div>

                    {/* Metrics */}
                    <div className="flex items-center gap-6 text-xs flex-shrink-0">
                      <div className="text-center">
                        <div className="text-slate-400 mb-0.5">Spend</div>
                        <div className="font-medium text-slate-900 dark:text-white">{formatCurrency(ad.spend)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-slate-400 mb-0.5">Impr.</div>
                        <div className="font-medium text-slate-900 dark:text-white">{formatNumber(ad.impressions)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-slate-400 mb-0.5">Clicks</div>
                        <div className="font-medium text-slate-900 dark:text-white">{formatNumber(ad.clicks)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-slate-400 mb-0.5">CTR</div>
                        <div className="font-medium text-slate-900 dark:text-white">{parseFloat(ad.avg_ctr || '0').toFixed(2)}%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-slate-400 mb-0.5">CPC</div>
                        <div className="font-medium text-slate-900 dark:text-white">{formatCurrency(ad.avg_cpc)}</div>
                      </div>
                      {parseFloat(ad.roas || '0') > 0 && (
                        <div className="text-center">
                          <div className="text-slate-400 mb-0.5">ROAS</div>
                          <div className="font-medium text-emerald-600 dark:text-emerald-400">{parseFloat(ad.roas).toFixed(2)}x</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
