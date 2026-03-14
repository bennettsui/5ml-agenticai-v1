'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Link2, Plus, Copy, Trash2, BarChart2, QrCode, Zap,
  ExternalLink, Search, Check, RefreshCw, TrendingUp,
  Globe, Smartphone, Monitor, Tablet, ChevronDown, ChevronUp,
  AlertTriangle, Shield, Clock, Tag, ArrowUpRight, X,
  Sparkles, FileText, Layers, MousePointerClick,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Campaign {
  id: number;
  name: string;
  description: string | null;
  color: string;
  link_count: number;
  total_clicks: number;
  created_at: string;
}

interface Link {
  id: number;
  slug: string;
  original_url: string;
  title: string | null;
  campaign_id: number | null;
  campaign_name: string | null;
  campaign_color: string | null;
  is_active: boolean;
  expires_at: string | null;
  total_clicks: number;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  tags: string[] | null;
  created_at: string;
}

interface AnalyticsData {
  link: Link;
  daily: { date: string; clicks: number }[];
  devices: { device_type: string; cnt: number }[];
  browsers: { browser: string; cnt: number }[];
  referrers: { referrer_domain: string; cnt: number }[];
  recentClicks: { clicked_at: string; device_type: string; browser: string; os: string; referrer_domain: string | null; is_bot: boolean }[];
}

interface OverviewStats {
  totalLinks: number;
  totalClicks: number;
  todayClicks: number;
  topLinks: { id: number; slug: string; title: string | null; total_clicks: number }[];
  deviceBreakdown: { device_type: string; cnt: number }[];
  referrerBreakdown: { referrer_domain: string; cnt: number }[];
}

interface AuditEntry {
  id: number;
  entity_type: string;
  entity_id: number;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
}

interface ErrorEntry {
  id: number;
  endpoint: string;
  method: string;
  error_message: string;
  created_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DEVICE_ICONS: Record<string, typeof Monitor> = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
};

const PIE_COLORS = ['#6366f1', '#22d3ee', '#f59e0b', '#10b981', '#f43f5e', '#8b5cf6'];

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
function truncate(str: string, n: number) {
  return str.length > n ? str.slice(0, n) + '…' : str;
}

const BASE_URL = typeof window !== 'undefined' ? window.location.origin : '';

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color = 'indigo' }: { label: string; value: string | number; sub?: string; color?: string }) {
  const colors: Record<string, string> = {
    indigo: 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/30',
    cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30',
    emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30',
    amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/30',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color] || colors.indigo} border rounded-xl p-4`}>
      <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Create Link Modal ────────────────────────────────────────────────────────

function CreateLinkModal({
  campaigns,
  onClose,
  onCreated,
}: {
  campaigns: Campaign[];
  onClose: () => void;
  onCreated: (link: Link) => void;
}) {
  const [url, setUrl] = useState('');
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [expires, setExpires] = useState('');
  const [loading, setLoading] = useState(false);
  const [slugSuggestions, setSlugSuggestions] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState('');

  async function suggestSlugs() {
    if (!url) return;
    setAiLoading(true);
    try {
      const r = await fetch('/api/links/ai-slug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, title }),
      });
      const d = await r.json();
      setSlugSuggestions(d.slugs || []);
    } catch {}
    setAiLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const r = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_url: url,
          slug: slug || undefined,
          title: title || undefined,
          campaign_id: campaignId ? parseInt(campaignId) : undefined,
          utm_source: utmSource || undefined,
          utm_medium: utmMedium || undefined,
          utm_campaign: utmCampaign || undefined,
          expires_at: expires || undefined,
        }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || 'Failed'); setLoading(false); return; }
      onCreated(d);
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Link2 className="w-4 h-4 text-indigo-400" />
            Create Short Link
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="text-red-400 text-sm bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">{error}</div>}

          <div>
            <label className="block text-xs text-slate-400 mb-1">Destination URL *</label>
            <input
              value={url} onChange={e => setUrl(e.target.value)} required
              className="w-full bg-white/[0.05] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              placeholder="https://example.com/long-url"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Custom Slug</label>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-1 bg-white/[0.05] border border-slate-700 rounded-lg px-3 py-2">
                <span className="text-slate-500 text-sm">{BASE_URL}/s/</span>
                <input
                  value={slug} onChange={e => setSlug(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none min-w-0"
                  placeholder="auto-generated"
                />
              </div>
              <button
                type="button" onClick={suggestSlugs} disabled={!url || aiLoading}
                className="flex items-center gap-1.5 px-3 py-2 bg-purple-600/20 border border-purple-500/30 text-purple-300 rounded-lg text-xs hover:bg-purple-600/30 disabled:opacity-50 whitespace-nowrap"
              >
                {aiLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                AI Suggest
              </button>
            </div>
            {slugSuggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {slugSuggestions.map(s => (
                  <button
                    key={s} type="button"
                    onClick={() => setSlug(s)}
                    className={`px-2 py-0.5 rounded text-xs border transition-colors ${slug === s ? 'bg-indigo-500/30 border-indigo-500/60 text-indigo-300' : 'bg-white/[0.04] border-slate-700 text-slate-300 hover:border-indigo-500/40'}`}
                  >{s}</button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                className="w-full bg-white/[0.05] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                placeholder="Campaign name" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Campaign</label>
              <select value={campaignId} onChange={e => setCampaignId(e.target.value)}
                className="w-full bg-white/[0.05] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
                <option value="">None</option>
                {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <details className="group">
            <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-300 list-none flex items-center gap-1">
              <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform" />
              UTM Parameters &amp; Expiry
            </summary>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">UTM Source</label>
                <input value={utmSource} onChange={e => setUtmSource(e.target.value)}
                  className="w-full bg-white/[0.05] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                  placeholder="instagram" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">UTM Medium</label>
                <input value={utmMedium} onChange={e => setUtmMedium(e.target.value)}
                  className="w-full bg-white/[0.05] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                  placeholder="social" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">UTM Campaign</label>
                <input value={utmCampaign} onChange={e => setUtmCampaign(e.target.value)}
                  className="w-full bg-white/[0.05] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                  placeholder="summer2024" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Expires At</label>
                <input type="datetime-local" value={expires} onChange={e => setExpires(e.target.value)}
                  className="w-full bg-white/[0.05] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none" />
              </div>
            </div>
          </details>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
            <button type="submit" disabled={loading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg disabled:opacity-60 flex items-center gap-2">
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              Create Link
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── QR Modal ────────────────────────────────────────────────────────────────

function QRModal({ link, onClose }: { link: Link; onClose: () => void }) {
  const [qr, setQr] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/links/${link.id}/qr`)
      .then(r => r.json())
      .then(d => { setQr(d.qr); setUrl(d.url); })
      .finally(() => setLoading(false));
  }, [link.id]);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <QrCode className="w-4 h-4 text-cyan-400" />
            QR Code
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 flex flex-col items-center gap-4">
          {loading ? (
            <div className="w-48 h-48 bg-white/[0.05] rounded-xl animate-pulse" />
          ) : (
            <img src={qr} alt="QR Code" className="w-48 h-48 rounded-xl bg-white p-2" />
          )}
          <p className="text-xs text-slate-400 text-center">{url}</p>
          <a
            href={qr} download={`qr-${link.slug}.png`}
            className="w-full text-center px-4 py-2 bg-cyan-600/20 border border-cyan-500/30 text-cyan-300 rounded-lg text-sm hover:bg-cyan-600/30"
          >
            Download PNG
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Analytics Panel ─────────────────────────────────────────────────────────

function AnalyticsPanel({ link, onClose }: { link: Link; onClose: () => void }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [summary, setSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/links/${link.id}/analytics?days=${days}`);
      setData(await r.json());
    } catch {}
    setLoading(false);
  }, [link.id, days]);

  useEffect(() => { load(); }, [load]);

  async function getAISummary() {
    setSummaryLoading(true);
    try {
      const r = await fetch('/api/links/ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkId: link.id, days }),
      });
      const d = await r.json();
      setSummary(d.summary || '');
    } catch {}
    setSummaryLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-start justify-end z-50">
      <div className="bg-slate-900 border-l border-slate-700 w-full max-w-2xl h-full overflow-y-auto">
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h3 className="font-semibold text-white flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-400" />
              Analytics: /{link.slug}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{truncate(link.original_url, 60)}</p>
          </div>
          <div className="flex items-center gap-3">
            <select value={days} onChange={e => setDays(parseInt(e.target.value))}
              className="bg-white/[0.05] border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none">
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
            </select>
            <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-white/[0.03] rounded-xl animate-pulse" />)}
            </div>
          ) : data && (
            <>
              {/* Stat Row */}
              <div className="grid grid-cols-3 gap-3">
                <StatCard label="Total Clicks" value={data.link.total_clicks} color="indigo" />
                <StatCard label={`Last ${days}d`} value={data.daily.reduce((s, d) => s + parseInt(String(d.clicks)), 0)} color="cyan" />
                <StatCard label="Top Referrer" value={data.referrers[0]?.referrer_domain || '—'} color="emerald" />
              </div>

              {/* AI Summary */}
              <div className="bg-white/[0.03] border border-slate-700/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    AI Performance Insight
                  </h4>
                  <button onClick={getAISummary} disabled={summaryLoading}
                    className="px-3 py-1 bg-purple-600/20 border border-purple-500/30 text-purple-300 rounded text-xs hover:bg-purple-600/30 disabled:opacity-50 flex items-center gap-1">
                    {summaryLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                    Generate
                  </button>
                </div>
                {summary ? (
                  <p className="text-sm text-slate-300 leading-relaxed">{summary}</p>
                ) : (
                  <p className="text-xs text-slate-500 italic">Click "Generate" to get an AI-powered performance analysis.</p>
                )}
              </div>

              {/* Click Trend Chart */}
              <div className="bg-white/[0.03] border border-slate-700/50 rounded-xl p-4">
                <h4 className="text-sm font-medium text-slate-300 mb-3">Click Trend</h4>
                {data.daily.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">No click data yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={data.daily.map(d => ({ date: shortDate(d.date), clicks: parseInt(String(d.clicks)) }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} labelStyle={{ color: '#e2e8f0' }} />
                      <Line type="monotone" dataKey="clicks" stroke="#6366f1" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Device + Browser */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/[0.03] border border-slate-700/50 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-slate-300 mb-3">Devices</h4>
                  {data.devices.length === 0 ? <p className="text-xs text-slate-500">No data</p> : (
                    <ResponsiveContainer width="100%" height={120}>
                      <PieChart>
                        <Pie data={data.devices} dataKey="cnt" nameKey="device_type" cx="50%" cy="50%" outerRadius={50} label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`} labelLine={false}>
                          {data.devices.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div className="bg-white/[0.03] border border-slate-700/50 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-slate-300 mb-3">Browsers</h4>
                  <div className="space-y-1.5">
                    {data.browsers.slice(0, 5).map((b, i) => {
                      const total = data.browsers.reduce((s, x) => s + parseInt(String(x.cnt)), 0);
                      const pct = total ? Math.round((parseInt(String(b.cnt)) / total) * 100) : 0;
                      return (
                        <div key={b.browser}>
                          <div className="flex justify-between text-xs text-slate-400 mb-0.5">
                            <span>{b.browser}</span><span>{pct}%</span>
                          </div>
                          <div className="h-1.5 bg-white/[0.05] rounded-full">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Top Referrers */}
              {data.referrers.length > 0 && (
                <div className="bg-white/[0.03] border border-slate-700/50 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-slate-300 mb-3">Top Referrers</h4>
                  <div className="space-y-2">
                    {data.referrers.map((r, i) => {
                      const total = data.referrers.reduce((s, x) => s + parseInt(String(x.cnt)), 0);
                      const pct = Math.round((parseInt(String(r.cnt)) / total) * 100);
                      return (
                        <div key={r.referrer_domain} className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] + '33' }}>
                            <Globe className="w-3 h-3 m-1" style={{ color: PIE_COLORS[i % PIE_COLORS.length] }} />
                          </div>
                          <span className="text-xs text-slate-300 flex-1">{r.referrer_domain}</span>
                          <span className="text-xs text-slate-400">{r.cnt} ({pct}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent Clicks Log */}
              <div className="bg-white/[0.03] border border-slate-700/50 rounded-xl p-4">
                <h4 className="text-sm font-medium text-slate-300 mb-3">Recent Clicks</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-700/50">
                        <th className="text-left pb-2">Time</th>
                        <th className="text-left pb-2">Device</th>
                        <th className="text-left pb-2">Browser</th>
                        <th className="text-left pb-2">Referrer</th>
                        <th className="text-left pb-2">Bot?</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/30">
                      {data.recentClicks.map((c, i) => (
                        <tr key={i} className="text-slate-400">
                          <td className="py-1.5">{relTime(c.clicked_at)}</td>
                          <td>{c.device_type}</td>
                          <td>{c.browser}</td>
                          <td>{c.referrer_domain || '—'}</td>
                          <td>{c.is_bot ? <span className="text-amber-400">⚠</span> : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── UTM Builder Tab ──────────────────────────────────────────────────────────

function UTMBuilder({ campaigns, onCreated }: { campaigns: Campaign[]; onCreated: (link: Link) => void }) {
  const [url, setUrl] = useState('');
  const [source, setSource] = useState('');
  const [medium, setMedium] = useState('');
  const [campaign, setCampaign] = useState('');
  const [term, setTerm] = useState('');
  const [content, setContent] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [built, setBuilt] = useState('');
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<Link | null>(null);

  const PRESET_SOURCES = ['instagram', 'facebook', 'linkedin', 'twitter', 'email', 'google', 'tiktok', 'youtube'];
  const PRESET_MEDIUMS = ['social', 'cpc', 'email', 'organic', 'referral', 'display', 'video'];

  useEffect(() => {
    if (!url) { setBuilt(''); return; }
    try {
      const u = new URL(url);
      if (source) u.searchParams.set('utm_source', source);
      if (medium) u.searchParams.set('utm_medium', medium);
      if (campaign) u.searchParams.set('utm_campaign', campaign);
      if (term) u.searchParams.set('utm_term', term);
      if (content) u.searchParams.set('utm_content', content);
      setBuilt(u.toString());
    } catch { setBuilt(''); }
  }, [url, source, medium, campaign, term, content]);

  async function copyBuilt() {
    await navigator.clipboard.writeText(built);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function shortenBuilt() {
    setCreating(true);
    setCreated(null);
    try {
      const r = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_url: url,
          slug: slug || undefined,
          title: title || undefined,
          campaign_id: campaignId ? parseInt(campaignId) : undefined,
          utm_source: source || undefined,
          utm_medium: medium || undefined,
          utm_campaign: campaign || undefined,
          utm_term: term || undefined,
          utm_content: content || undefined,
        }),
      });
      const d = await r.json();
      if (r.ok) { setCreated(d); onCreated(d); }
    } catch {}
    setCreating(false);
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/[0.03] border border-slate-700/50 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Tag className="w-4 h-4 text-amber-400" />
          UTM Parameter Builder
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Destination URL *</label>
            <input value={url} onChange={e => setUrl(e.target.value)}
              className="w-full bg-white/[0.05] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              placeholder="https://example.com/landing-page" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">UTM Source *</label>
              <input value={source} onChange={e => setSource(e.target.value)}
                className="w-full bg-white/[0.05] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                placeholder="instagram" />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {PRESET_SOURCES.map(s => (
                  <button key={s} type="button" onClick={() => setSource(s)}
                    className={`px-1.5 py-0.5 rounded text-xs border transition-colors ${source === s ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-white/[0.03] border-slate-700 text-slate-400 hover:text-slate-300'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">UTM Medium *</label>
              <input value={medium} onChange={e => setMedium(e.target.value)}
                className="w-full bg-white/[0.05] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                placeholder="social" />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {PRESET_MEDIUMS.map(m => (
                  <button key={m} type="button" onClick={() => setMedium(m)}
                    className={`px-1.5 py-0.5 rounded text-xs border transition-colors ${medium === m ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-white/[0.03] border-slate-700 text-slate-400 hover:text-slate-300'}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">UTM Campaign</label>
              <input value={campaign} onChange={e => setCampaign(e.target.value)}
                className="w-full bg-white/[0.05] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
                placeholder="summer2024" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">UTM Content</label>
              <input value={content} onChange={e => setContent(e.target.value)}
                className="w-full bg-white/[0.05] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
                placeholder="hero-banner" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">UTM Term</label>
              <input value={term} onChange={e => setTerm(e.target.value)}
                className="w-full bg-white/[0.05] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
                placeholder="running+shoes" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Campaign Group</label>
              <select value={campaignId} onChange={e => setCampaignId(e.target.value)}
                className="w-full bg-white/[0.05] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                <option value="">None</option>
                {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {built && (
            <div className="bg-white/[0.02] border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">Built URL</span>
                <button onClick={copyBuilt} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white">
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-xs text-indigo-300 break-all">{built}</p>
              <div className="mt-3 flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-xs text-slate-400 mb-1">Short Slug (optional)</label>
                  <input value={slug} onChange={e => setSlug(e.target.value)}
                    className="w-full bg-white/[0.05] border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none"
                    placeholder="auto" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-slate-400 mb-1">Title</label>
                  <input value={title} onChange={e => setTitle(e.target.value)}
                    className="w-full bg-white/[0.05] border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none"
                    placeholder="Link title" />
                </div>
                <button onClick={shortenBuilt} disabled={!url || creating}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-600/20 border border-amber-500/30 text-amber-300 rounded-lg text-sm hover:bg-amber-600/30 disabled:opacity-50 whitespace-nowrap">
                  {creating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                  Shorten
                </button>
              </div>
              {created && (
                <div className="mt-3 flex items-center gap-2 bg-emerald-900/20 border border-emerald-800/40 rounded-lg px-3 py-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span className="text-xs text-emerald-300">{BASE_URL}/s/{created.slug}</span>
                  <button onClick={() => { navigator.clipboard.writeText(`${BASE_URL}/s/${created.slug}`); }}
                    className="ml-auto text-slate-400 hover:text-white"><Copy className="w-3 h-3" /></button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Monetization pitch card */}
      <div className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border border-purple-500/20 rounded-xl p-5">
        <h4 className="text-sm font-semibold text-purple-300 mb-2 flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Pro Tips for Ad Campaigns
        </h4>
        <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
          <li>Always set <strong className="text-slate-300">utm_source</strong> = channel (facebook, google, email)</li>
          <li>Use <strong className="text-slate-300">utm_medium</strong> = cpc for paid ads, social for organic</li>
          <li>UTM campaign maps directly to your ad campaign name in GA4</li>
          <li>Use <strong className="text-slate-300">utm_content</strong> to A/B test different ad creatives</li>
          <li>Create a campaign group per client to segment analytics cleanly</li>
        </ul>
      </div>
    </div>
  );
}

// ─── Campaigns Tab ────────────────────────────────────────────────────────────

function CampaignsTab({ campaigns, onRefresh }: { campaigns: Campaign[]; onRefresh: () => void }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [creating, setCreating] = useState(false);

  const COLORS = ['#6366f1', '#22d3ee', '#f59e0b', '#10b981', '#f43f5e', '#8b5cf6', '#ec4899', '#14b8a6'];

  async function create() {
    if (!name.trim()) return;
    setCreating(true);
    await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description: desc, color }),
    });
    setName(''); setDesc(''); setColor('#6366f1');
    onRefresh();
    setCreating(false);
  }

  async function deleteCampaign(id: number) {
    if (!confirm('Delete this campaign? Links will be unassigned.')) return;
    await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
    onRefresh();
  }

  return (
    <div className="space-y-4">
      <div className="bg-white/[0.03] border border-slate-700/50 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          New Campaign Group
        </h3>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-slate-400 mb-1">Name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-white/[0.05] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
              placeholder="Summer Sale 2024" />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-slate-400 mb-1">Description</label>
            <input value={desc} onChange={e => setDesc(e.target.value)}
              className="w-full bg-white/[0.05] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
              placeholder="Q3 campaign…" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Color</label>
            <div className="flex gap-1.5">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-all ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800' : ''}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <button onClick={create} disabled={!name.trim() || creating}
            className="px-4 py-2 bg-cyan-600/20 border border-cyan-500/30 text-cyan-300 rounded-lg text-sm hover:bg-cyan-600/30 disabled:opacity-50 flex items-center gap-1.5">
            {creating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Create
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {campaigns.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">No campaigns yet. Create one above.</div>
        ) : campaigns.map(c => (
          <div key={c.id} className="flex items-center gap-4 bg-white/[0.03] border border-slate-700/50 rounded-xl px-5 py-4 hover:bg-white/[0.04] transition-colors">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{c.name}</p>
              {c.description && <p className="text-xs text-slate-400">{c.description}</p>}
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-white">{parseInt(String(c.total_clicks || 0)).toLocaleString()}</p>
              <p className="text-xs text-slate-400">clicks · {c.link_count} links</p>
            </div>
            <button onClick={() => deleteCampaign(c.id)} className="text-slate-600 hover:text-red-400 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Admin Logs Tab ───────────────────────────────────────────────────────────

function AdminLogs() {
  const [activeLog, setActiveLog] = useState<'audit' | 'errors'>('audit');
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  async function load() {
    setLoading(true);
    const [a, e] = await Promise.all([
      fetch('/api/admin/link-audit').then(r => r.json()),
      fetch('/api/admin/link-errors').then(r => r.json()),
    ]);
    setAudit(Array.isArray(a) ? a : []);
    setErrors(Array.isArray(e) ? e : []);
    setLoaded(true);
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['audit', 'errors'] as const).map(t => (
            <button key={t} onClick={() => setActiveLog(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeLog === t ? 'bg-white/[0.08] text-white' : 'text-slate-400 hover:text-slate-300'}`}>
              {t === 'audit' ? (
                <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" />Audit Trail</span>
              ) : (
                <span className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-amber-400" />Error Log</span>
              )}
            </button>
          ))}
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.05] border border-slate-700 text-slate-300 rounded-lg text-xs hover:bg-white/[0.08]">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Load Logs
        </button>
      </div>

      {!loaded ? (
        <div className="text-center py-16 text-slate-500 text-sm">
          <Shield className="w-8 h-8 mx-auto mb-3 opacity-30" />
          Click "Load Logs" to view admin logs (super admin only)
        </div>
      ) : activeLog === 'audit' ? (
        <div className="overflow-x-auto rounded-xl border border-slate-700/50">
          <table className="w-full text-xs">
            <thead className="bg-white/[0.03]">
              <tr className="text-slate-500 border-b border-slate-700/50">
                <th className="text-left px-4 py-3">Time</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">ID</th>
                <th className="text-left px-4 py-3">Action</th>
                <th className="text-left px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {audit.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-500">No audit entries</td></tr>
              ) : audit.map(e => (
                <tr key={e.id} className="text-slate-400 hover:bg-white/[0.02]">
                  <td className="px-4 py-2.5 whitespace-nowrap">{relTime(e.created_at)}</td>
                  <td className="px-4 py-2.5"><span className="px-1.5 py-0.5 bg-indigo-900/30 text-indigo-300 rounded">{e.entity_type}</span></td>
                  <td className="px-4 py-2.5">#{e.entity_id}</td>
                  <td className="px-4 py-2.5"><span className={`px-1.5 py-0.5 rounded font-medium ${e.action === 'delete' ? 'bg-red-900/30 text-red-300' : e.action === 'create' ? 'bg-emerald-900/30 text-emerald-300' : 'bg-blue-900/30 text-blue-300'}`}>{e.action}</span></td>
                  <td className="px-4 py-2.5 text-slate-500 max-w-xs truncate">{JSON.stringify(e.details)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-700/50">
          <table className="w-full text-xs">
            <thead className="bg-white/[0.03]">
              <tr className="text-slate-500 border-b border-slate-700/50">
                <th className="text-left px-4 py-3">Time</th>
                <th className="text-left px-4 py-3">Method</th>
                <th className="text-left px-4 py-3">Endpoint</th>
                <th className="text-left px-4 py-3">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {errors.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-emerald-400">No errors logged ✓</td></tr>
              ) : errors.map(e => (
                <tr key={e.id} className="text-slate-400 hover:bg-white/[0.02]">
                  <td className="px-4 py-2.5 whitespace-nowrap">{relTime(e.created_at)}</td>
                  <td className="px-4 py-2.5"><span className="px-1.5 py-0.5 bg-amber-900/30 text-amber-300 rounded font-mono">{e.method}</span></td>
                  <td className="px-4 py-2.5 font-mono text-slate-300">{e.endpoint}</td>
                  <td className="px-4 py-2.5 text-red-400 max-w-xs truncate">{e.error_message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LinkShortener() {
  const [activeTab, setActiveTab] = useState<'links' | 'analytics' | 'utm' | 'campaigns' | 'admin'>('links');
  const [links, setLinks] = useState<Link[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [analyticsLink, setAnalyticsLink] = useState<Link | null>(null);
  const [qrLink, setQrLink] = useState<Link | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [l, c, o] = await Promise.all([
        fetch('/api/links').then(r => r.json()),
        fetch('/api/campaigns').then(r => r.json()),
        fetch('/api/links/stats/overview').then(r => r.json()),
      ]);
      setLinks(Array.isArray(l) ? l : []);
      setCampaigns(Array.isArray(c) ? c : []);
      setOverview(o.totalLinks !== undefined ? o : null);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function copyLink(link: Link) {
    await navigator.clipboard.writeText(`${BASE_URL}/s/${link.slug}`);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function toggleActive(link: Link) {
    await fetch(`/api/links/${link.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !link.is_active }),
    });
    setLinks(prev => prev.map(l => l.id === link.id ? { ...l, is_active: !l.is_active } : l));
  }

  async function deleteLink(link: Link) {
    if (!confirm(`Delete /${link.slug}? This cannot be undone.`)) return;
    await fetch(`/api/links/${link.id}`, { method: 'DELETE' });
    setLinks(prev => prev.filter(l => l.id !== link.id));
    if (overview) setOverview({ ...overview, totalLinks: overview.totalLinks - 1 });
  }

  const filtered = links.filter(l =>
    !search || l.slug.includes(search) || (l.title || '').toLowerCase().includes(search.toLowerCase()) || l.original_url.includes(search)
  );

  const TABS = [
    { id: 'links' as const, label: 'Links', icon: Link2 },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart2 },
    { id: 'utm' as const, label: 'UTM Builder', icon: Tag },
    { id: 'campaigns' as const, label: 'Campaigns', icon: Layers },
    { id: 'admin' as const, label: 'Admin Logs', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Link2 className="w-5 h-5 text-indigo-400" />
            Link Shortener
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">Branded short links · Click analytics · UTM tracking · QR export</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadData} disabled={loading}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.05] transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors">
            <Plus className="w-4 h-4" />
            New Link
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total Links" value={overview.totalLinks} color="indigo" />
          <StatCard label="Total Clicks" value={overview.totalClicks} color="cyan" />
          <StatCard label="Today's Clicks" value={overview.todayClicks} color="emerald" />
          <StatCard label="Campaigns" value={campaigns.length} color="amber" sub="active groups" />
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-white/[0.03] border border-slate-700/50 rounded-xl p-1">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex-1 justify-center ${activeTab === t.id ? 'bg-white/[0.08] text-white' : 'text-slate-400 hover:text-slate-300'}`}>
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Links Tab ───────────────────────────────────────────────────────── */}
      {activeTab === 'links' && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/[0.04] border border-slate-700/50 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
              placeholder="Search links, slugs, URLs…" />
          </div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-white/[0.03] rounded-xl animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Link2 className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p>{search ? 'No links match your search' : 'No links yet — create your first!'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(link => (
                <div key={link.id}
                  className={`group flex items-center gap-4 bg-white/[0.03] border rounded-xl px-5 py-4 hover:bg-white/[0.04] transition-colors ${link.is_active ? 'border-slate-700/50' : 'border-slate-700/30 opacity-60'}`}>
                  {/* Color indicator */}
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: link.campaign_color || '#6366f1' }} />

                  {/* Slug + URL */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <a href={`/s/${link.slug}`} target="_blank" rel="noopener noreferrer"
                        className="text-sm font-mono font-semibold text-indigo-300 hover:text-indigo-200 flex items-center gap-1">
                        /{link.slug}
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                      {link.campaign_name && (
                        <span className="px-1.5 py-0.5 text-xs rounded border" style={{ color: link.campaign_color || '#6366f1', borderColor: (link.campaign_color || '#6366f1') + '40', backgroundColor: (link.campaign_color || '#6366f1') + '15' }}>
                          {link.campaign_name}
                        </span>
                      )}
                      {link.expires_at && new Date(link.expires_at) < new Date() && (
                        <span className="px-1.5 py-0.5 text-xs rounded bg-red-900/30 text-red-300 border border-red-800/40">expired</span>
                      )}
                      {(link.utm_source || link.utm_medium) && (
                        <span className="px-1.5 py-0.5 text-xs rounded bg-amber-900/20 text-amber-300 border border-amber-800/30">UTM</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{link.title ? <><span className="text-slate-400">{link.title}</span> · </> : ''}{truncate(link.original_url, 60)}</p>
                  </div>

                  {/* Click count */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-white">{link.total_clicks.toLocaleString()}</p>
                    <p className="text-xs text-slate-500">clicks</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => copyLink(link)} title="Copy short URL"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.05] transition-colors">
                      {copiedId === link.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button onClick={() => setAnalyticsLink(link)} title="Analytics"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-white/[0.05] transition-colors">
                      <BarChart2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setQrLink(link)} title="QR Code"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-400 hover:bg-white/[0.05] transition-colors">
                      <QrCode className="w-4 h-4" />
                    </button>
                    <button onClick={() => toggleActive(link)} title={link.is_active ? 'Deactivate' : 'Activate'}
                      className={`p-1.5 rounded-lg transition-colors hover:bg-white/[0.05] ${link.is_active ? 'text-emerald-400' : 'text-slate-600 hover:text-emerald-400'}`}>
                      <MousePointerClick className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteLink(link)} title="Delete"
                      className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-white/[0.05] transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Analytics Tab ───────────────────────────────────────────────────── */}
      {activeTab === 'analytics' && overview && (
        <div className="space-y-5">
          {/* Device breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white/[0.03] border border-slate-700/50 rounded-xl p-5">
              <h4 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
                <Monitor className="w-4 h-4 text-indigo-400" />
                Device Breakdown (All Links)
              </h4>
              {overview.deviceBreakdown.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">No click data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={overview.deviceBreakdown} dataKey="cnt" nameKey="device_type" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}>
                      {overview.deviceBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white/[0.03] border border-slate-700/50 rounded-xl p-5">
              <h4 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                Top Referrers (All Links)
              </h4>
              {overview.referrerBreakdown.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">No referrer data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={overview.referrerBreakdown.slice(0, 6).map(r => ({ name: r.referrer_domain, clicks: parseInt(String(r.cnt)) }))} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} width={90} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                    <Bar dataKey="clicks" fill="#22d3ee" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Top links */}
          <div className="bg-white/[0.03] border border-slate-700/50 rounded-xl p-5">
            <h4 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Top Performing Links
            </h4>
            <div className="space-y-2">
              {overview.topLinks.map((l, i) => (
                <div key={l.id} className="flex items-center gap-3 py-2">
                  <span className="text-xs text-slate-600 w-4 text-right">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-mono text-indigo-300">/{l.slug}</span>
                    {l.title && <span className="text-xs text-slate-500 ml-2">{l.title}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${Math.round((l.total_clicks / (overview.topLinks[0]?.total_clicks || 1)) * 100)}px`, minWidth: 4 }} />
                    <span className="text-sm font-semibold text-white w-16 text-right">{l.total_clicks.toLocaleString()}</span>
                  </div>
                  <button onClick={() => { const found = links.find(lk => lk.id === l.id); if (found) setAnalyticsLink(found); }}
                    className="p-1 text-slate-500 hover:text-indigo-400 transition-colors">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── UTM Builder Tab ─────────────────────────────────────────────────── */}
      {activeTab === 'utm' && (
        <UTMBuilder campaigns={campaigns} onCreated={link => { setLinks(prev => [link, ...prev]); }} />
      )}

      {/* ── Campaigns Tab ───────────────────────────────────────────────────── */}
      {activeTab === 'campaigns' && (
        <CampaignsTab campaigns={campaigns} onRefresh={loadData} />
      )}

      {/* ── Admin Logs Tab ───────────────────────────────────────────────────── */}
      {activeTab === 'admin' && <AdminLogs />}

      {/* Modals */}
      {showCreate && (
        <CreateLinkModal
          campaigns={campaigns}
          onClose={() => setShowCreate(false)}
          onCreated={link => { setLinks(prev => [link, ...prev]); setShowCreate(false); }}
        />
      )}
      {analyticsLink && <AnalyticsPanel link={analyticsLink} onClose={() => setAnalyticsLink(null)} />}
      {qrLink && <QRModal link={qrLink} onClose={() => setQrLink(null)} />}
    </div>
  );
}
