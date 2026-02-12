'use client';

import { useState, useEffect, useCallback, useMemo, Fragment } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Megaphone,
  DollarSign,
  TrendingUp,
  MousePointerClick,
  BarChart3,
  RefreshCw,
  Users,
  ChevronDown,
  ChevronUp,
  Link2,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Target,
  Image as ImageIcon,
  ExternalLink,
  FileText,
  Download,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// ==========================================
// Types
// ==========================================

interface KpiData {
  total_spend: string | null;
  total_conversions: string | null;
  total_revenue: string | null;
  blended_roas: string | null;
  total_impressions: string | null;
  total_clicks: string | null;
  avg_ctr: string | null;
  avg_cpc: string | null;
  avg_cpm: string | null;
  previous_period: {
    total_spend: string | null;
    total_impressions: string | null;
    total_clicks: string | null;
    avg_ctr: string | null;
    avg_cpc: string | null;
    avg_cpm: string | null;
  } | null;
  previous_period_range: { from: string; to: string } | null;
  top_campaigns_by_spend: Array<{
    platform: string;
    campaign_name: string;
    spend: string;
    cpc: string;
    cpm: string;
  }>;
}

interface AggregatedRow {
  date: string;
  spend: string;
  conversions: string;
  revenue: string;
  roas: string;
  impressions: string;
  clicks: string;
}

interface CampaignRow {
  platform: string;
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
  // Campaign detail fields (from JOIN)
  objective?: string;
  campaign_status?: string;
  campaign_effective_status?: string;
  buying_type?: string;
  bid_strategy?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  budget_remaining?: string;
  start_time?: string;
  stop_time?: string;
}

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
  // Campaign info
  objective?: string;
  // Creative info
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

interface MetaAdAccount {
  id: string;
  name: string;
  account_id: string;
  account_status: number;
  currency: string;
  business_name?: string;
}

interface GoogleAdsAccount {
  id: string;
  raw_id: string;
  name: string;
  currency: string;
  status: number;
  manager: boolean;
}

interface MonthlyRow {
  month: string;
  impressions: string;
  clicks: string;
  spend: string;
  conversions: string;
  revenue: string;
  cpc: string;
  cpm: string;
  ctr: string;
}

interface SyncResult {
  accountId: string;
  status: 'syncing' | 'success' | 'error';
  message?: string;
  fetched?: number;
  upserted?: number;
}

interface TenantInfo {
  tenant_id: string;
  account_id: string;
  campaign_count: number;
  earliest_date: string;
  latest_date: string;
  total_spend: string;
}

interface AdSetRow {
  adset_id: string;
  adset_name: string;
  campaign_id: string;
  status: string;
  effective_status: string;
  optimization_goal: string;
  billing_event: string;
  bid_strategy: string;
  bid_amount: string | null;
  daily_budget: string | null;
  lifetime_budget: string | null;
  targeting: Record<string, unknown> | null;
  start_time: string | null;
  end_time: string | null;
}

interface CreativeRow {
  ad_id: string;
  ad_name: string;
  campaign_id: string;
  adset_id: string;
  creative_id: string;
  creative_name: string;
  title: string | null;
  body: string | null;
  image_url: string | null;
  thumbnail_url: string | null;
  video_id: string | null;
  link_url: string | null;
  call_to_action_type: string | null;
  status: string;
  effective_status: string;
}

// ==========================================
// Constants
// ==========================================

// Brand name mapping for ad accounts (customize as needed)
const ACCOUNT_BRAND_MAP: Record<string, string> = {
  '5ml-internal': '5 Miles Lab (Internal)',
  'act_1249401425701453': 'Brand A (Meta)',
  'act_46494346': 'Brand B (Meta)',
  'act_1358670397894732': 'Brand C (Meta)',
};

// Get display name for an account (falls back to account ID if no mapping)
function getAccountDisplayName(accountId: string): string {
  return ACCOUNT_BRAND_MAP[accountId] || accountId;
}

const ACCOUNT_STATUS_MAP: Record<number, { label: string; color: string }> = {
  1: { label: 'Active', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  2: { label: 'Disabled', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  3: { label: 'Unsettled', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  7: { label: 'Pending Risk Review', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  8: { label: 'Pending Settlement', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  9: { label: 'In Grace Period', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  100: { label: 'Pending Closure', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  101: { label: 'Closed', color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' },
  201: { label: 'Any Active', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  202: { label: 'Any Closed', color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' },
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

// ==========================================
// Helpers
// ==========================================

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
  const fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const from = fromDate.toISOString().split('T')[0];
  return { from, to };
}

function formatTargeting(targeting: Record<string, unknown> | null): string[] {
  if (!targeting) return [];
  const parts: string[] = [];

  const t = targeting as Record<string, unknown>;
  if (t.age_min || t.age_max) parts.push(`Age: ${t.age_min || '?'}-${t.age_max || '?'}`);
  if (t.genders && Array.isArray(t.genders)) {
    const gMap: Record<number, string> = { 1: 'Male', 2: 'Female' };
    parts.push(`Gender: ${(t.genders as number[]).map((g) => gMap[g] || 'All').join(', ')}`);
  }
  if (t.geo_locations && typeof t.geo_locations === 'object') {
    const geo = t.geo_locations as Record<string, unknown[]>;
    if (geo.countries) parts.push(`Countries: ${(geo.countries as string[]).join(', ')}`);
    if (geo.cities && Array.isArray(geo.cities)) {
      parts.push(`Cities: ${(geo.cities as Array<{ name?: string }>).map((c) => c.name || '?').join(', ')}`);
    }
    if (geo.regions && Array.isArray(geo.regions)) {
      parts.push(`Regions: ${(geo.regions as Array<{ name?: string }>).map((r) => r.name || '?').join(', ')}`);
    }
  }
  if (t.interests && Array.isArray(t.interests)) {
    parts.push(`Interests: ${(t.interests as Array<{ name?: string }>).map((i) => i.name || '?').join(', ')}`);
  }
  if (t.behaviors && Array.isArray(t.behaviors)) {
    parts.push(`Behaviors: ${(t.behaviors as Array<{ name?: string }>).map((b) => b.name || '?').join(', ')}`);
  }
  if (t.custom_audiences && Array.isArray(t.custom_audiences)) {
    parts.push(`Custom Audiences: ${(t.custom_audiences as Array<{ name?: string }>).map((a) => a.name || a).join(', ')}`);
  }
  if (t.publisher_platforms && Array.isArray(t.publisher_platforms)) {
    parts.push(`Platforms: ${(t.publisher_platforms as string[]).join(', ')}`);
  }
  if (t.facebook_positions && Array.isArray(t.facebook_positions)) {
    parts.push(`FB Positions: ${(t.facebook_positions as string[]).join(', ')}`);
  }
  if (t.instagram_positions && Array.isArray(t.instagram_positions)) {
    parts.push(`IG Positions: ${(t.instagram_positions as string[]).join(', ')}`);
  }

  return parts.length > 0 ? parts : ['No targeting details available'];
}

// ==========================================
// Component
// ==========================================

export default function AdsDashboardPage() {
  const defaults = getDefaultDateRange();
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [platform, setPlatform] = useState<'all' | 'meta' | 'google'>('all');
  const [selectedTenant, setSelectedTenant] = useState<string>('all');
  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [chartData, setChartData] = useState<AggregatedRow[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [ads, setAds] = useState<AdRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tenant list
  const [tenants, setTenants] = useState<TenantInfo[]>([]);

  // Ad Account Discovery state
  const [accountsPanelOpen, setAccountsPanelOpen] = useState(false);
  const [adAccounts, setAdAccounts] = useState<MetaAdAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [syncResults, setSyncResults] = useState<Record<string, SyncResult>>({});
  const [syncDateFrom, setSyncDateFrom] = useState(defaults.from);
  const [syncDateTo, setSyncDateTo] = useState(defaults.to);

  // Google Ads Account Discovery state
  const [googleAccounts, setGoogleAccounts] = useState<GoogleAdsAccount[]>([]);
  const [googleAccountsLoading, setGoogleAccountsLoading] = useState(false);
  const [googleAccountsError, setGoogleAccountsError] = useState<string | null>(null);
  const [googleAccountsFetched, setGoogleAccountsFetched] = useState(false);
  const [metaAccountsFetched, setMetaAccountsFetched] = useState(false);

  // Monthly data for chart
  const [monthlyData, setMonthlyData] = useState<MonthlyRow[]>([]);

  // Campaign detail expansion
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);
  const [adSets, setAdSets] = useState<AdSetRow[]>([]);
  const [creatives, setCreatives] = useState<CreativeRow[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Column sorting
  const [sortColumn, setSortColumn] = useState<string>('spend');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Report generation state
  const [reportPanelOpen, setReportPanelOpen] = useState(false);
  const [reportTenantId, setReportTenantId] = useState<string>('');
  const [reportMonthYear, setReportMonthYear] = useState<string>(() => {
    const now = new Date();
    return `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`;
  });
  const [reportFormat, setReportFormat] = useState<'pptx' | 'pdf' | 'both'>('both');
  const [reportClientName, setReportClientName] = useState<string>('');
  const [reportGenerating, setReportGenerating] = useState(false);
  const [reportResult, setReportResult] = useState<{
    success: boolean;
    message: string;
    pptxPath?: string;
    pdfPath?: string;
  } | null>(null);

  // Data fetchers
  const fetchTenants = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/ads/tenants`);
      if (res.ok) {
        const json = await res.json();
        setTenants(json.data || []);
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      from,
      to,
      platform,
      tenant_id: selectedTenant,
    });

    try {
      const [kpiRes, aggRes, campRes, monthlyRes, adsRes] = await Promise.all([
        fetch(`${API_BASE}/api/ads/performance/kpis?${params}`),
        fetch(`${API_BASE}/api/ads/performance/aggregated?${params}`),
        fetch(`${API_BASE}/api/ads/performance/campaigns?${params}`),
        fetch(`${API_BASE}/api/ads/performance/monthly?${params}`),
        fetch(`${API_BASE}/api/ads/performance/ads?${params}`),
      ]);

      if (kpiRes.ok) {
        const kpiJson = await kpiRes.json();
        setKpis(kpiJson.data);
      }
      if (aggRes.ok) {
        const aggJson = await aggRes.json();
        setChartData(aggJson.data || []);
      }
      if (campRes.ok) {
        const campJson = await campRes.json();
        setCampaigns(campJson.data || []);
      }
      if (monthlyRes.ok) {
        const monthlyJson = await monthlyRes.json();
        setMonthlyData(monthlyJson.data || []);
      }
      if (adsRes.ok) {
        const adsJson = await adsRes.json();
        setAds(adsJson.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [from, to, platform, selectedTenant]);

  useEffect(() => {
    fetchData();
    fetchTenants();
  }, [fetchData, fetchTenants]);

  // Ad Account Discovery functions
  const fetchAdAccounts = useCallback(async () => {
    setAccountsLoading(true);
    setAccountsError(null);
    setMetaAccountsFetched(true);
    try {
      const res = await fetch(`${API_BASE}/api/ads/meta/adaccounts`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(body.error || `Failed to fetch ad accounts (${res.status})`);
      }
      const json = await res.json();
      setAdAccounts(json.data || []);
    } catch (err) {
      setAccountsError(err instanceof Error ? err.message : 'Failed to fetch ad accounts');
    } finally {
      setAccountsLoading(false);
    }
  }, []);

  const syncAccount = useCallback(async (account: MetaAdAccount) => {
    const accountId = account.id;
    setSyncResults((prev) => ({
      ...prev,
      [accountId]: { accountId, status: 'syncing' },
    }));

    try {
      const res = await fetch(`${API_BASE}/api/ads/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Use the ad account ID as tenant_id for client separation
          tenant_id: accountId,
          since: syncDateFrom,
          until: syncDateTo,
          platforms: ['meta'],
          meta_account_id: accountId,
          sync_details: true,
        }),
      });

      const json = await res.json();

      if (json.success && json.data?.meta) {
        const details = json.data.meta.details;
        const detailMsg = details
          ? ` + ${details.campaigns} campaigns, ${details.adsets} ad sets, ${details.ads} ads`
          : '';
        setSyncResults((prev) => ({
          ...prev,
          [accountId]: {
            accountId,
            status: 'success',
            fetched: json.data.meta.fetched,
            upserted: json.data.meta.upserted,
            message: `Synced ${json.data.meta.upserted} perf rows${detailMsg}`,
          },
        }));
        // Refresh dashboard data and tenant list after successful sync
        fetchData();
        fetchTenants();
      } else {
        const errMsg = json.data?.errors?.[0]?.error || json.error || 'Sync returned no data';
        setSyncResults((prev) => ({
          ...prev,
          [accountId]: { accountId, status: 'error', message: errMsg },
        }));
      }
    } catch (err) {
      setSyncResults((prev) => ({
        ...prev,
        [accountId]: {
          accountId,
          status: 'error',
          message: err instanceof Error ? err.message : 'Sync failed',
        },
      }));
    }
  }, [syncDateFrom, syncDateTo, fetchData, fetchTenants]);

  const syncAllAccounts = useCallback(async () => {
    const activeAccounts = adAccounts.filter((a) => a.account_status === 1);
    for (const account of activeAccounts) {
      await syncAccount(account);
    }
  }, [adAccounts, syncAccount]);

  // Google Ads Account Discovery functions
  const fetchGoogleAccounts = useCallback(async () => {
    setGoogleAccountsLoading(true);
    setGoogleAccountsError(null);
    setGoogleAccountsFetched(true);
    try {
      const res = await fetch(`${API_BASE}/api/ads/google/accounts`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(body.error || `Failed to fetch Google accounts (${res.status})`);
      }
      const json = await res.json();
      setGoogleAccounts(json.data || []);
    } catch (err) {
      setGoogleAccountsError(err instanceof Error ? err.message : 'Failed to fetch Google accounts');
    } finally {
      setGoogleAccountsLoading(false);
    }
  }, []);

  const syncGoogleAccount = useCallback(async (account: GoogleAdsAccount) => {
    const accountKey = `google_${account.id}`;
    setSyncResults((prev) => ({
      ...prev,
      [accountKey]: { accountId: account.id, status: 'syncing' },
    }));

    try {
      const res = await fetch(`${API_BASE}/api/ads/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: account.id,
          since: syncDateFrom,
          until: syncDateTo,
          platforms: ['google'],
          google_customer_id: account.id,
          sync_details: true,
        }),
      });

      const json = await res.json();

      if (json.success && json.data?.google) {
        const details = json.data.google.details;
        const detailMsg = details ? ` + ${details.campaigns} campaigns` : '';
        setSyncResults((prev) => ({
          ...prev,
          [accountKey]: {
            accountId: account.id,
            status: 'success',
            fetched: json.data.google.fetched,
            upserted: json.data.google.upserted,
            message: `Synced ${json.data.google.upserted} perf rows${detailMsg}`,
          },
        }));
        fetchData();
        fetchTenants();
      } else {
        const errMsg = json.data?.errors?.[0]?.error || json.error || 'Sync returned no data';
        setSyncResults((prev) => ({
          ...prev,
          [accountKey]: { accountId: account.id, status: 'error', message: errMsg },
        }));
      }
    } catch (err) {
      setSyncResults((prev) => ({
        ...prev,
        [accountKey]: {
          accountId: account.id,
          status: 'error',
          message: err instanceof Error ? err.message : 'Sync failed',
        },
      }));
    }
  }, [syncDateFrom, syncDateTo, fetchData, fetchTenants]);

  const syncAllGoogleAccounts = useCallback(async () => {
    const enabledAccounts = googleAccounts.filter((a) => a.status === 1);
    for (const account of enabledAccounts) {
      await syncGoogleAccount(account);
    }
  }, [googleAccounts, syncGoogleAccount]);

  useEffect(() => {
    if (accountsPanelOpen && adAccounts.length === 0 && !accountsLoading && !metaAccountsFetched) {
      fetchAdAccounts();
    }
    if (accountsPanelOpen && googleAccounts.length === 0 && !googleAccountsLoading && !googleAccountsFetched) {
      fetchGoogleAccounts();
    }
  }, [accountsPanelOpen, adAccounts.length, accountsLoading, metaAccountsFetched, fetchAdAccounts, googleAccounts.length, googleAccountsLoading, googleAccountsFetched, fetchGoogleAccounts]);

  // Campaign detail expansion
  const toggleCampaignDetails = useCallback(async (campaignId: string) => {
    if (expandedCampaign === campaignId) {
      setExpandedCampaign(null);
      setAdSets([]);
      setCreatives([]);
      return;
    }

    setExpandedCampaign(campaignId);
    setDetailsLoading(true);

    try {
      const params = new URLSearchParams({ campaign_id: campaignId });

      const [adsetRes, creativeRes] = await Promise.all([
        fetch(`${API_BASE}/api/ads/adsets/details?${params}`),
        fetch(`${API_BASE}/api/ads/creatives/details?${params}`),
      ]);

      if (adsetRes.ok) {
        const json = await adsetRes.json();
        setAdSets(json.data || []);
      }
      if (creativeRes.ok) {
        const json = await creativeRes.json();
        setCreatives(json.data || []);
      }
    } catch {
      // ignore
    } finally {
      setDetailsLoading(false);
    }
  }, [expandedCampaign]);

  // Date preset handler
  const setDatePreset = (preset: string) => {
    const now = new Date();
    const toStr = now.toISOString().split('T')[0];
    let fromDate: Date;

    switch (preset) {
      case '7d':
        fromDate = new Date(now.getTime() - 7 * 86400000);
        break;
      case '30d':
        fromDate = new Date(now.getTime() - 30 * 86400000);
        break;
      case '90d':
        fromDate = new Date(now.getTime() - 90 * 86400000);
        break;
      case '180d':
        fromDate = new Date(now.getTime() - 180 * 86400000);
        break;
      case 'ytd':
        fromDate = new Date(now.getFullYear(), 0, 1);
        break;
      case '1y':
        fromDate = new Date(now.getTime() - 365 * 86400000);
        break;
      default:
        fromDate = new Date(now.getTime() - 30 * 86400000);
    }

    setFrom(fromDate.toISOString().split('T')[0]);
    setTo(toStr);
  };

  // Campaign type helper (works for both CampaignRow and AdRow)
  const getCampaignType = (item: { platform: string; objective?: string }): { label: string; color: string } => {
    if (item.platform === 'meta') {
      return { label: 'Meta Ad', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' };
    }
    // Google: derive from objective (advertising_channel_type stored in objective field)
    const obj = (item.objective || '').toUpperCase();
    if (obj === 'SEARCH' || obj.includes('SEARCH')) {
      return { label: 'SEM', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' };
    }
    if (obj === 'DISPLAY' || obj.includes('DISPLAY')) {
      return { label: 'GDN', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' };
    }
    if (obj === 'VIDEO' || obj.includes('VIDEO')) {
      return { label: 'Video', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300' };
    }
    if (obj === 'SHOPPING' || obj.includes('SHOPPING')) {
      return { label: 'Shopping', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' };
    }
    if (obj === 'PERFORMANCE_MAX') {
      return { label: 'PMax', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' };
    }
    return { label: 'Google Ad', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' };
  };

  // Period comparison helper
  const getPctChange = (current: string | null | undefined, previous: string | null | undefined): { pct: number; label: string; color: string } | null => {
    if (!current || !previous) return null;
    const curr = parseFloat(current) || 0;
    const prev = parseFloat(previous) || 0;
    if (prev === 0) return curr > 0 ? { pct: 100, label: '+100%', color: 'text-green-600 dark:text-green-400' } : null;
    const pct = ((curr - prev) / prev) * 100;
    const label = `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
    // For CPC/CPM, lower is better, so invert color
    return { pct, label, color: pct >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400' };
  };

  const getCostPctChange = (current: string | null | undefined, previous: string | null | undefined): { pct: number; label: string; color: string } | null => {
    const change = getPctChange(current, previous);
    if (!change) return null;
    // For cost metrics, lower is better
    return { ...change, color: change.pct <= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400' };
  };

  // Chart data transforms
  const lineChartData = chartData.map((row) => ({
    date: row.date,
    spend: parseFloat(row.spend) || 0,
    impressions: parseFloat(row.impressions) || 0,
    clicks: parseFloat(row.clicks) || 0,
  }));

  const monthlyChartData = monthlyData.map((row) => ({
    month: row.month,
    cpc: parseFloat(row.cpc) || 0,
    cpm: parseFloat(row.cpm) || 0,
    ctr: parseFloat(row.ctr) || 0,
    spend: parseFloat(row.spend) || 0,
  }));

  // Sorted campaigns
  const handleSort = (col: string) => {
    if (sortColumn === col) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      setSortDirection('desc');
    }
  };

  const sortedCampaigns = useMemo(() => {
    return [...campaigns].sort((a, b) => {
      const col = sortColumn as keyof CampaignRow;
      const aRaw = a[col];
      const bRaw = b[col];

      // String columns
      if (col === 'campaign_name' || col === 'platform') {
        const aStr = (aRaw || '').toString().toLowerCase();
        const bStr = (bRaw || '').toString().toLowerCase();
        return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
      }

      // Numeric columns
      const aNum = parseFloat(aRaw as string) || 0;
      const bNum = parseFloat(bRaw as string) || 0;
      return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
    });
  }, [campaigns, sortColumn, sortDirection]);

  const sortedAds = useMemo(() => {
    return [...ads].sort((a, b) => {
      const col = sortColumn as keyof AdRow;
      const aRaw = a[col];
      const bRaw = b[col];

      // String columns
      if (col === 'ad_name' || col === 'campaign_name' || col === 'platform') {
        const aStr = (aRaw || '').toString().toLowerCase();
        const bStr = (bRaw || '').toString().toLowerCase();
        return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
      }

      // Numeric columns
      const aNum = parseFloat(aRaw as string) || 0;
      const bNum = parseFloat(bRaw as string) || 0;
      return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
    });
  }, [ads, sortColumn, sortDirection]);

  // Separate Meta and Google ads for cleaner display
  const metaAds = useMemo(() => sortedAds.filter((ad) => ad.platform === 'meta'), [sortedAds]);
  const googleAds = useMemo(() => sortedAds.filter((ad) => ad.platform === 'google'), [sortedAds]);

  // Expanded ad for detail view
  const [expandedAd, setExpandedAd] = useState<string | null>(null);

  // Report generation function
  const generateReport = useCallback(async () => {
    if (!reportTenantId || !reportMonthYear) {
      setReportResult({
        success: false,
        message: 'Please select an account and enter the month/year',
      });
      return;
    }

    setReportGenerating(true);
    setReportResult(null);

    try {
      const res = await fetch(`${API_BASE}/api/ads/reports/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: reportTenantId,
          month_year: reportMonthYear,
          format: reportFormat,
          client_name: reportClientName || reportTenantId,
        }),
      });

      const json = await res.json();

      if (json.success) {
        setReportResult({
          success: true,
          message: 'Report generated successfully!',
          pptxPath: json.data?.pptxPath,
          pdfPath: json.data?.pdfPath,
        });
      } else {
        setReportResult({
          success: false,
          message: json.error || 'Failed to generate report',
        });
      }
    } catch (err) {
      setReportResult({
        success: false,
        message: err instanceof Error ? err.message : 'Failed to generate report',
      });
    } finally {
      setReportGenerating(false);
    }
  }, [reportTenantId, reportMonthYear, reportFormat, reportClientName]);

  const downloadReport = (filename: string) => {
    const downloadUrl = `${API_BASE}/api/ads/reports/download/${filename}`;
    window.open(downloadUrl, '_blank');
  };

  const SortIndicator = ({ col }: { col: string }) => (
    sortColumn === col ? (
      <span className="ml-1 text-orange-400">{sortDirection === 'asc' ? '\u2191' : '\u2193'}</span>
    ) : (
      <span className="ml-1 text-slate-500 opacity-0 group-hover:opacity-100">\u2195</span>
    )
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                  <Megaphone className="w-7 h-7 text-orange-500" />
                  Social Ad Performance
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Meta & Google Ads dashboard with per-account separation
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/ads-dashboard/overview"
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Client Overview
              </Link>
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
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Connect Ad Accounts Panel */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
          <button
            onClick={() => setAccountsPanelOpen(!accountsPanelOpen)}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Link2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Connect Ad Accounts
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Discover and sync your Meta & Google ad accounts (each synced as a separate client)
                </p>
              </div>
            </div>
            {accountsPanelOpen ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {accountsPanelOpen && (
            <div className="border-t border-slate-200 dark:border-slate-700 p-4">
              {/* Sync Date Range */}
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Sync From:</label>
                  <input
                    type="date"
                    value={syncDateFrom}
                    onChange={(e) => setSyncDateFrom(e.target.value)}
                    className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Sync To:</label>
                  <input
                    type="date"
                    value={syncDateTo}
                    onChange={(e) => setSyncDateTo(e.target.value)}
                    className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <button
                  onClick={fetchAdAccounts}
                  disabled={accountsLoading}
                  className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${accountsLoading ? 'animate-spin' : ''}`} />
                  Refresh Accounts
                </button>
                {adAccounts.filter((a) => a.account_status === 1).length > 0 && (
                  <button
                    onClick={syncAllAccounts}
                    className="px-3 py-1 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 transition-colors flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Sync All Active
                  </button>
                )}
              </div>

              {accountsError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {accountsError}
                </div>
              )}

              {/* Meta Ads Section */}
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Meta Ads</h4>
              {accountsLoading && adAccounts.length === 0 ? (
                <div className="flex items-center justify-center py-4 text-slate-400 text-sm gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading Meta ad accounts...
                </div>
              ) : adAccounts.length === 0 && !accountsLoading ? (
                <div className="text-center py-4 text-slate-400 text-sm">
                  No Meta ad accounts found. Make sure META_ACCESS_TOKEN is set.
                </div>
              ) : (
                <div className="grid gap-3 mb-6">
                  {adAccounts.map((account) => {
                    const status = ACCOUNT_STATUS_MAP[account.account_status] || {
                      label: `Status ${account.account_status}`,
                      color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
                    };
                    const sync = syncResults[account.id];
                    const isSyncing = sync?.status === 'syncing';

                    return (
                      <div
                        key={account.id}
                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-600"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Meta</span>
                            <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                              {account.name || 'Unnamed Account'}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${status.color}`}>
                              {status.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-mono">{account.id}</span>
                            {account.currency && <span>{account.currency}</span>}
                            {account.business_name && <span>{account.business_name}</span>}
                          </div>
                          {sync && sync.status !== 'syncing' && (
                            <div className={`flex items-center gap-1.5 mt-1.5 text-xs ${
                              sync.status === 'success'
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {sync.status === 'success' ? (
                                <CheckCircle2 className="w-3 h-3" />
                              ) : (
                                <XCircle className="w-3 h-3" />
                              )}
                              {sync.message}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => syncAccount(account)}
                          disabled={isSyncing}
                          className="ml-3 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600 transition-colors flex items-center gap-1.5 disabled:opacity-50 flex-shrink-0"
                        >
                          {isSyncing ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Syncing...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3 h-3" />
                              Sync Data
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Google Ads Section */}
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 mt-4 flex items-center gap-2">
                Google Ads
                {googleAccounts.filter((a) => a.status === 1).length > 0 && (
                  <button
                    onClick={syncAllGoogleAccounts}
                    className="px-2 py-0.5 bg-red-500 text-white rounded text-[10px] font-medium hover:bg-red-600 transition-colors flex items-center gap-1 normal-case tracking-normal"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    Sync All
                  </button>
                )}
              </h4>
              {googleAccountsError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-3 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {googleAccountsError}
                </div>
              )}
              {googleAccountsLoading && googleAccounts.length === 0 ? (
                <div className="flex items-center justify-center py-4 text-slate-400 text-sm gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading Google Ads accounts...
                </div>
              ) : googleAccounts.length === 0 && !googleAccountsLoading ? (
                <div className="text-center py-4 text-slate-400 text-sm">
                  No Google Ads accounts found. Make sure GOOGLE_ADS_* env vars are set.
                </div>
              ) : (
                <div className="grid gap-3">
                  {googleAccounts.map((account) => {
                    const accountKey = `google_${account.id}`;
                    const statusInfo = account.status === 1
                      ? { label: 'Enabled', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' }
                      : { label: 'Disabled', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' };
                    const sync = syncResults[accountKey];
                    const isSyncing = sync?.status === 'syncing';

                    return (
                      <div
                        key={account.id}
                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-600"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">Google</span>
                            <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                              {account.name || 'Unnamed Account'}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-mono">{account.id}</span>
                            {account.currency && <span>{account.currency}</span>}
                          </div>
                          {sync && sync.status !== 'syncing' && (
                            <div className={`flex items-center gap-1.5 mt-1.5 text-xs ${
                              sync.status === 'success'
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {sync.status === 'success' ? (
                                <CheckCircle2 className="w-3 h-3" />
                              ) : (
                                <XCircle className="w-3 h-3" />
                              )}
                              {sync.message}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => syncGoogleAccount(account)}
                          disabled={isSyncing}
                          className="ml-3 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-colors flex items-center gap-1.5 disabled:opacity-50 flex-shrink-0"
                        >
                          {isSyncing ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Syncing...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3 h-3" />
                              Sync Data
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Generate Monthly Report Panel */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
          <button
            onClick={() => setReportPanelOpen(!reportPanelOpen)}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Generate Monthly Report
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Export performance data as PPTX or PDF report
                </p>
              </div>
            </div>
            {reportPanelOpen ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {reportPanelOpen && (
            <div className="border-t border-slate-200 dark:border-slate-700 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* Account Selection */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Account *
                  </label>
                  <select
                    value={reportTenantId}
                    onChange={(e) => setReportTenantId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="">Select account...</option>
                    {tenants.map((t) => (
                      <option key={t.tenant_id} value={t.tenant_id}>
                        {getAccountDisplayName(t.tenant_id)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Month/Year */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Month/Year *
                  </label>
                  <input
                    type="text"
                    value={reportMonthYear}
                    onChange={(e) => setReportMonthYear(e.target.value)}
                    placeholder="e.g., January 2026"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Client Name (optional) */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Client Name (optional)
                  </label>
                  <input
                    type="text"
                    value={reportClientName}
                    onChange={(e) => setReportClientName(e.target.value)}
                    placeholder="Display name for report"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Format Selection */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Format
                  </label>
                  <select
                    value={reportFormat}
                    onChange={(e) => setReportFormat(e.target.value as 'pptx' | 'pdf' | 'both')}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="both">Both (PPTX + PDF)</option>
                    <option value="pptx">PowerPoint (PPTX)</option>
                    <option value="pdf">PDF</option>
                  </select>
                </div>
              </div>

              {/* Generate Button */}
              <div className="flex items-center gap-4">
                <button
                  onClick={generateReport}
                  disabled={reportGenerating || !reportTenantId || !reportMonthYear}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {reportGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      Generate Report
                    </>
                  )}
                </button>

                {/* Result Message */}
                {reportResult && (
                  <div
                    className={`flex items-center gap-2 text-sm ${
                      reportResult.success
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {reportResult.success ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    {reportResult.message}
                  </div>
                )}
              </div>

              {/* Download Links */}
              {reportResult?.success && (reportResult.pptxPath || reportResult.pdfPath) && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-2">
                    Download your report:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {reportResult.pptxPath && (
                      <button
                        onClick={() => downloadReport(reportResult.pptxPath!.split('/').pop()!)}
                        className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600 transition-colors flex items-center gap-1.5"
                      >
                        <Download className="w-3 h-3" />
                        Download PPTX
                      </button>
                    )}
                    {reportResult.pdfPath && (
                      <button
                        onClick={() => downloadReport(reportResult.pdfPath!.split('/').pop()!)}
                        className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-colors flex items-center gap-1.5"
                      >
                        <Download className="w-3 h-3" />
                        Download PDF
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Account Selector */}
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
                    {getAccountDisplayName(t.tenant_id)} ({t.campaign_count} campaigns, {formatCurrency(t.total_spend)})
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
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Platform:</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as 'all' | 'meta' | 'google')}
                className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="all">All Platforms</option>
                <option value="meta">Meta Ads</option>
                <option value="google">Google Ads</option>
              </select>
            </div>
          </div>
          {/* Date Range Presets */}
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
            <span className="text-xs text-slate-500 dark:text-slate-400">Quick:</span>
            {[
              { label: '7D', value: '7d' },
              { label: '30D', value: '30d' },
              { label: '90D', value: '90d' },
              { label: '180D', value: '180d' },
              { label: 'YTD', value: 'ytd' },
              { label: '1Y', value: '1y' },
            ].map((preset) => (
              <button
                key={preset.value}
                onClick={() => setDatePreset(preset.value)}
                className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-orange-100 hover:text-orange-700 dark:hover:bg-orange-900/30 dark:hover:text-orange-300 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6 text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-400">Total Spend</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {kpis ? formatCurrency(kpis.total_spend) : '--'}
            </div>
            {(() => {
              const change = getPctChange(kpis?.total_spend, kpis?.previous_period?.total_spend);
              return change ? (
                <div className={`text-xs mt-1 font-medium ${change.color}`}>
                  {change.label} vs prev period
                </div>
              ) : null;
            })()}
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <MousePointerClick className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-400">Avg CPC</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {kpis ? formatCurrency(kpis.avg_cpc) : '--'}
            </div>
            {(() => {
              const change = getCostPctChange(kpis?.avg_cpc, kpis?.previous_period?.avg_cpc);
              return change ? (
                <div className={`text-xs mt-1 font-medium ${change.color}`}>
                  {change.label} vs prev period
                </div>
              ) : null;
            })()}
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-400">Avg CPM</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {kpis ? formatCurrency(kpis.avg_cpm) : '--'}
            </div>
            {(() => {
              const change = getCostPctChange(kpis?.avg_cpm, kpis?.previous_period?.avg_cpm);
              return change ? (
                <div className={`text-xs mt-1 font-medium ${change.color}`}>
                  {change.label} vs prev period
                </div>
              ) : null;
            })()}
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <BarChart3 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-400">Avg CTR</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {kpis ? `${parseFloat(kpis.avg_ctr || '0').toFixed(2)}%` : '--'}
            </div>
            {(() => {
              const change = getPctChange(kpis?.avg_ctr, kpis?.previous_period?.avg_ctr);
              return change ? (
                <div className={`text-xs mt-1 font-medium ${change.color}`}>
                  {change.label} vs prev period
                </div>
              ) : null;
            })()}
          </div>
        </div>

        {/* Secondary KPI row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total Impressions</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">{kpis ? formatNumber(kpis.total_impressions) : '--'}</div>
            {(() => {
              const change = getPctChange(kpis?.total_impressions, kpis?.previous_period?.total_impressions);
              return change ? <span className={`text-xs font-medium ${change.color}`}>{change.label}</span> : null;
            })()}
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total Clicks</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">{kpis ? formatNumber(kpis.total_clicks) : '--'}</div>
            {(() => {
              const change = getPctChange(kpis?.total_clicks, kpis?.previous_period?.total_clicks);
              return change ? <span className={`text-xs font-medium ${change.color}`}>{change.label}</span> : null;
            })()}
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Target className="w-3.5 h-3.5 text-emerald-500" />
              <div className="text-xs text-slate-500 dark:text-slate-400">Leads / Conversions</div>
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">{kpis ? formatNumber(kpis.total_conversions) : '--'}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
              <div className="text-xs text-slate-500 dark:text-slate-400">Blended ROAS</div>
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              {kpis && parseFloat(kpis.blended_roas || '0') > 0 ? `${parseFloat(kpis.blended_roas || '0').toFixed(2)}x` : '--'}
            </div>
            {kpis && parseFloat(kpis.total_revenue || '0') > 0 && (
              <div className="text-xs text-slate-500 mt-0.5">Revenue: {formatCurrency(kpis.total_revenue)}</div>
            )}
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Top Campaign by Spend</div>
            {kpis?.top_campaigns_by_spend?.[0] ? (
              <div>
                <div className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(kpis.top_campaigns_by_spend[0].spend)}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{kpis.top_campaigns_by_spend[0].campaign_name}</div>
              </div>
            ) : (
              <div className="text-lg font-bold text-slate-900 dark:text-white">--</div>
            )}
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Spend & Clicks by Day Line Chart */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Daily Spend & Clicks
            </h3>
            {lineChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#f8fafc',
                    }}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="spend"
                    name="Spend ($)"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="clicks"
                    name="Clicks"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-400">
                {loading ? 'Loading...' : 'No data available for selected range'}
              </div>
            )}
          </div>

          {/* Monthly CPC / CPM / CTR Comparison */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Monthly CPC & CPM Trend
            </h3>
            {monthlyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#f8fafc',
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === 'CTR') return [`${value.toFixed(2)}%`, name];
                      return [`$${value.toFixed(2)}`, name];
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="cpc" name="CPC" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="left" dataKey="cpm" name="CPM" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="ctr" name="CTR" stroke="#f97316" strokeWidth={2} dot={{ r: 4 }} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-400">
                {loading ? 'Loading...' : 'No monthly data available'}
              </div>
            )}
          </div>
        </div>

        {/* Meta Ads Table */}
        {(platform === 'all' || platform === 'meta') && metaAds.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Meta</span>
              Meta Ads ({metaAds.length})
              <span className="text-sm font-normal text-slate-500 ml-2">Click headers to sort, rows to expand</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-2 font-medium text-slate-600 dark:text-slate-400 cursor-pointer group select-none" onClick={() => handleSort('ad_name')}>
                      <span className="flex items-center">Ad<SortIndicator col="ad_name" /></span>
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-slate-600 dark:text-slate-400 cursor-pointer group select-none" onClick={() => handleSort('campaign_name')}>
                      <span className="flex items-center">Campaign<SortIndicator col="campaign_name" /></span>
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-slate-600 dark:text-slate-400">
                      <span className="flex items-center">Status</span>
                    </th>
                    <th className="text-right py-3 px-2 font-medium text-slate-600 dark:text-slate-400 cursor-pointer group select-none" onClick={() => handleSort('impressions')}>
                      <span className="flex items-center justify-end">Impr.<SortIndicator col="impressions" /></span>
                    </th>
                    <th className="text-right py-3 px-2 font-medium text-slate-600 dark:text-slate-400 cursor-pointer group select-none" onClick={() => handleSort('clicks')}>
                      <span className="flex items-center justify-end">Clicks<SortIndicator col="clicks" /></span>
                    </th>
                    <th className="text-right py-3 px-2 font-medium text-slate-600 dark:text-slate-400 cursor-pointer group select-none" onClick={() => handleSort('avg_ctr')}>
                      <span className="flex items-center justify-end">CTR%<SortIndicator col="avg_ctr" /></span>
                    </th>
                    <th className="text-right py-3 px-2 font-medium text-slate-600 dark:text-slate-400 cursor-pointer group select-none" onClick={() => handleSort('avg_cpc')}>
                      <span className="flex items-center justify-end">CPC<SortIndicator col="avg_cpc" /></span>
                    </th>
                    <th className="text-right py-3 px-2 font-medium text-slate-600 dark:text-slate-400 cursor-pointer group select-none" onClick={() => handleSort('avg_cpm')}>
                      <span className="flex items-center justify-end">CPM<SortIndicator col="avg_cpm" /></span>
                    </th>
                    <th className="text-right py-3 px-2 font-medium text-slate-600 dark:text-slate-400 cursor-pointer group select-none" onClick={() => handleSort('spend')}>
                      <span className="flex items-center justify-end">Spend<SortIndicator col="spend" /></span>
                    </th>
                    <th className="text-right py-3 px-2 font-medium text-slate-600 dark:text-slate-400 cursor-pointer group select-none" onClick={() => handleSort('conversions')}>
                      <span className="flex items-center justify-end">Conv.<SortIndicator col="conversions" /></span>
                    </th>
                    <th className="text-right py-3 px-2 font-medium text-slate-600 dark:text-slate-400 cursor-pointer group select-none" onClick={() => handleSort('roas')}>
                      <span className="flex items-center justify-end">ROAS<SortIndicator col="roas" /></span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {metaAds.map((ad) => {
                    const isExpanded = expandedAd === ad.ad_id;
                    const adStatus = ad.ad_effective_status || ad.ad_status;
                    const imageUrl = ad.creative_image_url || ad.creative_thumbnail_url;

                    return (
                      <Fragment key={ad.ad_id}>
                        <tr
                          className={`border-b border-slate-100 dark:border-slate-700/50 cursor-pointer transition-colors ${
                            isExpanded
                              ? 'bg-blue-50 dark:bg-blue-900/10'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'
                          }`}
                          onClick={() => setExpandedAd(isExpanded ? null : ad.ad_id)}
                        >
                          <td className="py-2.5 px-2 text-slate-900 dark:text-white max-w-[220px]">
                            <div className="flex items-center gap-2">
                              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                              {imageUrl && (
                                <div className="w-8 h-8 rounded overflow-hidden bg-slate-100 dark:bg-slate-600 flex-shrink-0">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={imageUrl}
                                    alt=""
                                    className="w-full h-full object-cover"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                  />
                                </div>
                              )}
                              <span className="truncate text-xs font-medium">{ad.ad_name || 'Unnamed Ad'}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-xs text-slate-500 dark:text-slate-400 max-w-[150px]">
                            <span className="truncate block">{ad.campaign_name}</span>
                          </td>
                          <td className="py-2.5 px-2">
                            {adStatus ? (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                adStatus === 'ACTIVE'
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                  : adStatus === 'PAUSED'
                                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                              }`}>
                                {adStatus}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">--</span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-xs text-slate-700 dark:text-slate-300">
                            {formatNumber(ad.impressions)}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-xs text-slate-700 dark:text-slate-300">
                            {formatNumber(ad.clicks)}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-xs text-slate-700 dark:text-slate-300">
                            {parseFloat(ad.avg_ctr || '0').toFixed(2)}%
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-xs text-slate-700 dark:text-slate-300">
                            {formatCurrency(ad.avg_cpc)}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-xs text-slate-700 dark:text-slate-300">
                            {formatCurrency(ad.avg_cpm)}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-slate-700 dark:text-slate-300">
                            {formatCurrency(ad.spend)}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-slate-700 dark:text-slate-300">
                            {formatNumber(ad.conversions)}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-slate-700 dark:text-slate-300">
                            {parseFloat(ad.roas || '0') > 0 ? `${parseFloat(ad.roas).toFixed(2)}x` : '-'}
                          </td>
                        </tr>

                        {/* Expanded Creative Detail Row */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={11} className="p-0">
                              <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 p-4">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                  {/* Creative Preview */}
                                  {(ad.creative_image_url || ad.creative_thumbnail_url) && (
                                    <div>
                                      <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <ImageIcon className="w-3.5 h-3.5" />
                                        Creative Preview
                                      </h4>
                                      <div className="rounded-lg overflow-hidden bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                          src={ad.creative_image_url || ad.creative_thumbnail_url || ''}
                                          alt={ad.ad_name || 'Ad creative'}
                                          className="w-full max-h-[250px] object-contain"
                                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {/* Ad Copy */}
                                  <div className={ad.creative_image_url || ad.creative_thumbnail_url ? '' : 'lg:col-span-2'}>
                                    <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                      Ad Details
                                    </h4>
                                    <div className="bg-white dark:bg-slate-700 rounded-lg p-3 text-xs space-y-2">
                                      <div>
                                        <span className="text-slate-500">Ad Name:</span>{' '}
                                        <span className="text-slate-900 dark:text-white font-medium">{ad.ad_name || '--'}</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500">Campaign:</span>{' '}
                                        <span className="text-slate-900 dark:text-white font-medium">{ad.campaign_name}</span>
                                      </div>
                                      {ad.creative_title && (
                                        <div>
                                          <span className="text-slate-500">Title:</span>{' '}
                                          <span className="text-slate-900 dark:text-white font-medium">{ad.creative_title}</span>
                                        </div>
                                      )}
                                      {ad.creative_body && (
                                        <div>
                                          <span className="text-slate-500">Body:</span>{' '}
                                          <span className="text-slate-900 dark:text-white">{ad.creative_body}</span>
                                        </div>
                                      )}
                                      {ad.creative_cta && (
                                        <div>
                                          <span className="text-slate-500">CTA:</span>{' '}
                                          <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-[10px]">
                                            {ad.creative_cta.replace(/_/g, ' ')}
                                          </span>
                                        </div>
                                      )}
                                      {ad.creative_link_url && (
                                        <div>
                                          <span className="text-slate-500">Link:</span>{' '}
                                          <a
                                            href={ad.creative_link_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 dark:text-blue-400 hover:underline"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            {ad.creative_link_url}
                                          </a>
                                        </div>
                                      )}
                                      {ad.creative_video_id && (
                                        <div>
                                          <span className="text-slate-500">Video ID:</span>{' '}
                                          <span className="text-slate-900 dark:text-white font-mono">{ad.creative_video_id}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Performance Metrics */}
                                  <div>
                                    <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                      Performance
                                    </h4>
                                    <div className="bg-white dark:bg-slate-700 rounded-lg p-3 text-xs space-y-2">
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">Spend</span>
                                        <span className="text-slate-900 dark:text-white font-medium">{formatCurrency(ad.spend)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">Impressions</span>
                                        <span className="text-slate-900 dark:text-white">{formatNumber(ad.impressions)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">Reach</span>
                                        <span className="text-slate-900 dark:text-white">{formatNumber(ad.reach)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">Clicks</span>
                                        <span className="text-slate-900 dark:text-white">{formatNumber(ad.clicks)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">CTR</span>
                                        <span className="text-slate-900 dark:text-white">{parseFloat(ad.avg_ctr || '0').toFixed(2)}%</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">CPC</span>
                                        <span className="text-slate-900 dark:text-white">{formatCurrency(ad.avg_cpc)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">CPM</span>
                                        <span className="text-slate-900 dark:text-white">{formatCurrency(ad.avg_cpm)}</span>
                                      </div>
                                      {parseFloat(ad.conversions || '0') > 0 && (
                                        <div className="flex justify-between">
                                          <span className="text-slate-500">Conversions</span>
                                          <span className="text-slate-900 dark:text-white">{formatNumber(ad.conversions)}</span>
                                        </div>
                                      )}
                                      {parseFloat(ad.roas || '0') > 0 && (
                                        <div className="flex justify-between">
                                          <span className="text-slate-500">ROAS</span>
                                          <span className="text-slate-900 dark:text-white font-medium">{parseFloat(ad.roas || '0').toFixed(2)}x</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Google Ads Table */}
        {(platform === 'all' || platform === 'google') && googleAds.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">Google</span>
              Google Ads ({googleAds.length})
              <span className="text-sm font-normal text-slate-500 ml-2">Click headers to sort, rows to expand</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-2 font-medium text-slate-600 dark:text-slate-400 cursor-pointer group select-none" onClick={() => handleSort('ad_name')}>
                      <span className="flex items-center">Ad<SortIndicator col="ad_name" /></span>
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-slate-600 dark:text-slate-400 cursor-pointer group select-none" onClick={() => handleSort('campaign_name')}>
                      <span className="flex items-center">Campaign<SortIndicator col="campaign_name" /></span>
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-slate-600 dark:text-slate-400">
                      <span className="flex items-center">Type</span>
                    </th>
                    <th className="text-right py-3 px-2 font-medium text-slate-600 dark:text-slate-400 cursor-pointer group select-none" onClick={() => handleSort('impressions')}>
                      <span className="flex items-center justify-end">Impr.<SortIndicator col="impressions" /></span>
                    </th>
                    <th className="text-right py-3 px-2 font-medium text-slate-600 dark:text-slate-400 cursor-pointer group select-none" onClick={() => handleSort('clicks')}>
                      <span className="flex items-center justify-end">Clicks<SortIndicator col="clicks" /></span>
                    </th>
                    <th className="text-right py-3 px-2 font-medium text-slate-600 dark:text-slate-400 cursor-pointer group select-none" onClick={() => handleSort('avg_ctr')}>
                      <span className="flex items-center justify-end">CTR%<SortIndicator col="avg_ctr" /></span>
                    </th>
                    <th className="text-right py-3 px-2 font-medium text-slate-600 dark:text-slate-400 cursor-pointer group select-none" onClick={() => handleSort('avg_cpc')}>
                      <span className="flex items-center justify-end">CPC<SortIndicator col="avg_cpc" /></span>
                    </th>
                    <th className="text-right py-3 px-2 font-medium text-slate-600 dark:text-slate-400 cursor-pointer group select-none" onClick={() => handleSort('avg_cpm')}>
                      <span className="flex items-center justify-end">CPM<SortIndicator col="avg_cpm" /></span>
                    </th>
                    <th className="text-right py-3 px-2 font-medium text-slate-600 dark:text-slate-400 cursor-pointer group select-none" onClick={() => handleSort('spend')}>
                      <span className="flex items-center justify-end">Spend<SortIndicator col="spend" /></span>
                    </th>
                    <th className="text-right py-3 px-2 font-medium text-slate-600 dark:text-slate-400 cursor-pointer group select-none" onClick={() => handleSort('conversions')}>
                      <span className="flex items-center justify-end">Conv.<SortIndicator col="conversions" /></span>
                    </th>
                    <th className="text-right py-3 px-2 font-medium text-slate-600 dark:text-slate-400 cursor-pointer group select-none" onClick={() => handleSort('roas')}>
                      <span className="flex items-center justify-end">ROAS<SortIndicator col="roas" /></span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {googleAds.map((ad) => {
                    const isExpanded = expandedAd === ad.ad_id;
                    const campType = getCampaignType(ad);

                    return (
                      <Fragment key={ad.ad_id}>
                        <tr
                          className={`border-b border-slate-100 dark:border-slate-700/50 cursor-pointer transition-colors ${
                            isExpanded
                              ? 'bg-red-50 dark:bg-red-900/10'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'
                          }`}
                          onClick={() => setExpandedAd(isExpanded ? null : ad.ad_id)}
                        >
                          <td className="py-2.5 px-2 text-slate-900 dark:text-white max-w-[220px]">
                            <div className="flex items-center gap-2">
                              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                              <span className="truncate text-xs font-medium">{ad.ad_name || 'Unnamed Ad'}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-xs text-slate-500 dark:text-slate-400 max-w-[150px]">
                            <span className="truncate block">{ad.campaign_name}</span>
                          </td>
                          <td className="py-2.5 px-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${campType.color}`}>
                              {campType.label}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-xs text-slate-700 dark:text-slate-300">
                            {formatNumber(ad.impressions)}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-xs text-slate-700 dark:text-slate-300">
                            {formatNumber(ad.clicks)}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-xs text-slate-700 dark:text-slate-300">
                            {parseFloat(ad.avg_ctr || '0').toFixed(2)}%
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-xs text-slate-700 dark:text-slate-300">
                            {formatCurrency(ad.avg_cpc)}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-xs text-slate-700 dark:text-slate-300">
                            {formatCurrency(ad.avg_cpm)}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-slate-700 dark:text-slate-300">
                            {formatCurrency(ad.spend)}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-slate-700 dark:text-slate-300">
                            {formatNumber(ad.conversions)}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-slate-700 dark:text-slate-300">
                            {parseFloat(ad.roas || '0') > 0 ? `${parseFloat(ad.roas).toFixed(2)}x` : '-'}
                          </td>
                        </tr>

                        {/* Expanded Detail Row */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={11} className="p-0">
                              <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 p-4">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                  {/* Ad Details */}
                                  <div>
                                    <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                      Ad Details
                                    </h4>
                                    <div className="bg-white dark:bg-slate-700 rounded-lg p-3 text-xs space-y-2">
                                      <div>
                                        <span className="text-slate-500">Ad Name:</span>{' '}
                                        <span className="text-slate-900 dark:text-white font-medium">{ad.ad_name || '--'}</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500">Campaign:</span>{' '}
                                        <span className="text-slate-900 dark:text-white font-medium">{ad.campaign_name}</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500">Campaign Type:</span>{' '}
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${campType.color}`}>
                                          {campType.label}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Performance Metrics */}
                                  <div>
                                    <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                      Performance
                                    </h4>
                                    <div className="bg-white dark:bg-slate-700 rounded-lg p-3 text-xs space-y-2">
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">Spend</span>
                                        <span className="text-slate-900 dark:text-white font-medium">{formatCurrency(ad.spend)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">Impressions</span>
                                        <span className="text-slate-900 dark:text-white">{formatNumber(ad.impressions)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">Clicks</span>
                                        <span className="text-slate-900 dark:text-white">{formatNumber(ad.clicks)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">CTR</span>
                                        <span className="text-slate-900 dark:text-white">{parseFloat(ad.avg_ctr || '0').toFixed(2)}%</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">CPC</span>
                                        <span className="text-slate-900 dark:text-white">{formatCurrency(ad.avg_cpc)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">CPM</span>
                                        <span className="text-slate-900 dark:text-white">{formatCurrency(ad.avg_cpm)}</span>
                                      </div>
                                      {parseFloat(ad.conversions || '0') > 0 && (
                                        <div className="flex justify-between">
                                          <span className="text-slate-500">Conversions</span>
                                          <span className="text-slate-900 dark:text-white">{formatNumber(ad.conversions)}</span>
                                        </div>
                                      )}
                                      {parseFloat(ad.roas || '0') > 0 && (
                                        <div className="flex justify-between">
                                          <span className="text-slate-500">ROAS</span>
                                          <span className="text-slate-900 dark:text-white font-medium">{parseFloat(ad.roas || '0').toFixed(2)}x</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Fallback: show campaign table if no ad-level data (need to re-sync) */}
        {ads.length === 0 && campaigns.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Campaigns ({campaigns.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Ad-level data not yet available. Re-sync your accounts to see individual ad performance.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-2 font-medium text-slate-600 dark:text-slate-400 cursor-pointer group select-none" onClick={() => handleSort('campaign_name')}>
                      <span className="flex items-center">Campaign<SortIndicator col="campaign_name" /></span>
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-slate-600 dark:text-slate-400">Platform</th>
                    <th className="text-right py-3 px-2 font-medium text-slate-600 dark:text-slate-400 cursor-pointer group select-none" onClick={() => handleSort('impressions')}>
                      <span className="flex items-center justify-end">Impr.<SortIndicator col="impressions" /></span>
                    </th>
                    <th className="text-right py-3 px-2 font-medium text-slate-600 dark:text-slate-400 cursor-pointer group select-none" onClick={() => handleSort('clicks')}>
                      <span className="flex items-center justify-end">Clicks<SortIndicator col="clicks" /></span>
                    </th>
                    <th className="text-right py-3 px-2 font-medium text-slate-600 dark:text-slate-400 cursor-pointer group select-none" onClick={() => handleSort('spend')}>
                      <span className="flex items-center justify-end">Spend<SortIndicator col="spend" /></span>
                    </th>
                    <th className="text-right py-3 px-2 font-medium text-slate-600 dark:text-slate-400 cursor-pointer group select-none" onClick={() => handleSort('avg_cpc')}>
                      <span className="flex items-center justify-end">CPC<SortIndicator col="avg_cpc" /></span>
                    </th>
                    <th className="text-right py-3 px-2 font-medium text-slate-600 dark:text-slate-400 cursor-pointer group select-none" onClick={() => handleSort('avg_cpm')}>
                      <span className="flex items-center justify-end">CPM<SortIndicator col="avg_cpm" /></span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCampaigns.map((camp) => (
                    <tr key={camp.campaign_id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="py-2.5 px-2 text-slate-900 dark:text-white text-xs truncate max-w-[200px]">{camp.campaign_name}</td>
                      <td className="py-2.5 px-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          camp.platform === 'meta'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                          {camp.platform === 'meta' ? 'Meta' : 'Google'}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-xs text-slate-700 dark:text-slate-300">{formatNumber(camp.impressions)}</td>
                      <td className="py-2.5 px-2 text-right font-mono text-xs text-slate-700 dark:text-slate-300">{formatNumber(camp.clicks)}</td>
                      <td className="py-2.5 px-2 text-right font-mono text-xs text-slate-700 dark:text-slate-300">{formatCurrency(camp.spend)}</td>
                      <td className="py-2.5 px-2 text-right font-mono text-xs text-slate-700 dark:text-slate-300">{formatCurrency(camp.avg_cpc)}</td>
                      <td className="py-2.5 px-2 text-right font-mono text-xs text-slate-700 dark:text-slate-300">{formatCurrency(camp.avg_cpm)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
