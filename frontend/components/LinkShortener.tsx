'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Link2, Plus, Copy, Trash2, BarChart2, QrCode, Zap, ExternalLink, Search, Check,
  RefreshCw, TrendingUp, Globe, Smartphone, Monitor, Tablet, ChevronDown, AlertTriangle,
  Shield, Clock, Tag, ArrowUpRight, X, Sparkles, FileText, Layers, MousePointerClick,
  MoreHorizontal, Lock, Download, Key, FlaskConical, Share2, Wifi
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

// ─────────────────── Types ───────────────────
interface Campaign {
  id: number; name: string; description: string | null; color: string;
  link_count: number; total_clicks: number; created_at: string;
}
interface Link {
  id: number; slug: string; original_url: string; title: string | null;
  campaign_id: number | null; campaign_name: string | null; campaign_color: string | null;
  is_active: boolean; expires_at: string | null; total_clicks: number;
  utm_source: string | null; utm_medium: string | null; utm_campaign: string | null;
  utm_term: string | null; utm_content: string | null; password_hash: string | null;
  tags: string[] | null; created_at: string;
}
interface Pixel { id: number; link_id: number; pixel_type: string; pixel_id: string; }
interface ABVariant {
  id: number; link_id: number; variant_url: string; weight: number;
  label: string | null; click_count: number;
}
interface ApiKey {
  id: number; name: string; key_prefix: string; tier: string;
  is_active: boolean; created_at: string; last_used_at: string | null;
}
interface OverviewStats {
  totalLinks: number; totalClicks: number; todayClicks: number;
  topLinks: {id:number;slug:string;title:string|null;total_clicks:number}[];
  deviceBreakdown: {device_type:string;cnt:number}[];
  referrerBreakdown: {referrer_domain:string;cnt:number}[];
}
interface AnalyticsData {
  link: Link;
  daily: {date:string;clicks:number}[];
  devices: {device_type:string;cnt:number}[];
  browsers: {browser:string;cnt:number}[];
  referrers: {referrer_domain:string;cnt:number}[];
  recentClicks: {clicked_at:string;device_type:string;browser:string;os:string;referrer_domain:string|null;is_bot:boolean}[];
}

// ─────────────────── Constants ───────────────────
const BASE_URL = typeof window !== 'undefined' ? window.location.origin : '';
const PIE_COLORS = ['#6366f1','#22d3ee','#f59e0b','#10b981','#f43f5e','#8b5cf6'];
const PIXEL_TYPES = [
  {value:'facebook',label:'Facebook Pixel'},
  {value:'google_analytics',label:'Google Analytics 4'},
  {value:'linkedin',label:'LinkedIn Insight'},
  {value:'google_ads',label:'Google Ads'},
];

// ─────────────────── Helpers ───────────────────
function shortDate(iso: string) { return new Date(iso).toLocaleDateString('en-US',{month:'short',day:'numeric'}); }
function relTime(iso: string) {
  const d = Date.now() - new Date(iso).getTime(), m = Math.floor(d/60000);
  if(m<1) return 'just now'; if(m<60) return m+'m ago';
  const h = Math.floor(m/60); if(h<24) return h+'h ago'; return Math.floor(h/24)+'d ago';
}
function trunc(s: string, n: number) { return s.length>n ? s.slice(0,n)+'…' : s; }

// ─────────────────── Small shared components ───────────────────
function TierBadge({tier}: {tier: string}) {
  const colors: Record<string,string> = {
    PRO:'bg-purple-900/30 text-purple-300 border-purple-800/40',
    BUSINESS:'bg-blue-900/30 text-blue-300 border-blue-800/40',
    AGENCY:'bg-amber-900/30 text-amber-300 border-amber-800/40',
  };
  const key = tier.toUpperCase();
  return <span className={`px-1.5 py-0.5 text-[10px] border rounded font-medium ${colors[key]||colors.PRO}`}>{key}</span>;
}

function StatCard({label,value,sub,color='indigo'}: {label:string;value:string|number;sub?:string;color?:string}) {
  const c: Record<string,string> = {
    indigo:'from-indigo-500/20 to-indigo-600/10 border-indigo-500/30',
    cyan:'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30',
    emerald:'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30',
    amber:'from-amber-500/20 to-amber-600/10 border-amber-500/30',
  };
  return (
    <div className={`bg-gradient-to-br ${c[color]||c.indigo} border rounded-xl p-4`}>
      <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{typeof value==='number'?value.toLocaleString():value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

function ModalWrapper({onClose, children, wide=false}: {onClose:()=>void;children:React.ReactNode;wide?:boolean}) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div className={`bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full ${wide?'max-w-2xl':'max-w-lg'} max-h-[90vh] overflow-y-auto`}>
        {children}
      </div>
    </div>
  );
}

function ModalHeader({title,icon:Icon,color='indigo',onClose}: {title:string;icon:React.ElementType;color?:string;onClose:()=>void}) {
  const iconColors: Record<string,string> = {indigo:'text-indigo-400',cyan:'text-cyan-400',amber:'text-amber-400',purple:'text-purple-400',emerald:'text-emerald-400'};
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
      <h3 className="font-semibold text-white flex items-center gap-2">
        <Icon className={`w-4 h-4 ${iconColors[color]||iconColors.indigo}`}/>{title}
      </h3>
      <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X className="w-4 h-4"/></button>
    </div>
  );
}

function Field({label,children}: {label:React.ReactNode;children:React.ReactNode}) {
  return <div><label className="block text-xs text-slate-400 mb-1">{label}</label>{children}</div>;
}
const inputCls = "w-full bg-white/[0.05] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500";


// ─────────────────── CreateLinkModal ───────────────────
function CreateLinkModal({campaigns, onClose, onCreated}: {campaigns:Campaign[];onClose:()=>void;onCreated:(link:Link)=>void}) {
  const [url, setUrl] = useState('');
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [password, setPassword] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [utmTerm, setUtmTerm] = useState('');
  const [utmContent, setUtmContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [slugSuggestions, setSlugSuggestions] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  async function aiSuggest() {
    if (!url) return;
    setAiLoading(true);
    try {
      const r = await fetch('/api/links/ai-slug', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url,title})});
      const d = await r.json();
      if (d.suggestions) setSlugSuggestions(d.suggestions);
    } catch {}
    setAiLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url) { setError('URL is required'); return; }
    setLoading(true); setError('');
    try {
      const r = await fetch('/api/links', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          url, slug: slug||undefined, title: title||undefined,
          campaign_id: campaignId ? parseInt(campaignId) : undefined,
          password: password||undefined, expires_at: expiresAt||undefined,
          utm_source: utmSource||undefined, utm_medium: utmMedium||undefined,
          utm_campaign: utmCampaign||undefined, utm_term: utmTerm||undefined,
          utm_content: utmContent||undefined,
        }),
      });
      if (r.status === 429) {
        const d = await r.json();
        setError(`DAILY LIMIT REACHED: ${d.error||'You have reached your daily link creation limit.'}`);
        setLoading(false); return;
      }
      if (!r.ok) { const d = await r.json(); setError(d.error||'Failed'); setLoading(false); return; }
      const link = await r.json();
      onCreated(link);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed'); }
    setLoading(false);
  }

  return (
    <ModalWrapper onClose={onClose} wide>
      <ModalHeader title="Create Short Link" icon={Link2} color="indigo" onClose={onClose}/>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div className={`p-3 rounded-lg text-sm flex items-start gap-2 ${error.startsWith('DAILY LIMIT') ? 'bg-amber-900/30 border border-amber-700 text-amber-300' : 'bg-red-900/30 border border-red-700 text-red-300'}`}>
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5"/>
            <span>{error}</span>
          </div>
        )}
        <Field label="Destination URL *">
          <input className={inputCls} value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://example.com/your-long-url" required/>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Custom Slug (optional)">
            <input className={inputCls} value={slug} onChange={e=>setSlug(e.target.value)} placeholder="my-link"/>
          </Field>
          <Field label="Title (optional)">
            <input className={inputCls} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Friendly name"/>
          </Field>
        </div>
        {slugSuggestions.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs text-slate-400 self-center">AI suggestions:</span>
            {slugSuggestions.map(s => (
              <button key={s} type="button" onClick={()=>setSlug(s)}
                className="text-xs px-2 py-1 bg-indigo-900/40 border border-indigo-700/50 text-indigo-300 rounded-lg hover:bg-indigo-800/40">
                {s}
              </button>
            ))}
          </div>
        )}
        <button type="button" onClick={aiSuggest} disabled={!url||aiLoading}
          className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-50">
          <Sparkles className="w-3.5 h-3.5"/>
          {aiLoading ? 'Generating...' : 'AI suggest slugs'}
        </button>
        <Field label="Campaign (optional)">
          <select className={inputCls} value={campaignId} onChange={e=>setCampaignId(e.target.value)}>
            <option value="">No campaign</option>
            {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Password (PRO)">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500"/>
              <input className={inputCls + ' pl-8'} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="optional"/>
            </div>
          </Field>
          <Field label="Expires At (PRO)">
            <input className={inputCls} type="datetime-local" value={expiresAt} onChange={e=>setExpiresAt(e.target.value)}/>
          </Field>
        </div>
        <details className="group">
          <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-300 flex items-center gap-1 select-none">
            <ChevronDown className="w-3.5 h-3.5 group-open:rotate-180 transition-transform"/>
            UTM Parameters
          </summary>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="UTM Source"><input className={inputCls} value={utmSource} onChange={e=>setUtmSource(e.target.value)} placeholder="google"/></Field>
            <Field label="UTM Medium"><input className={inputCls} value={utmMedium} onChange={e=>setUtmMedium(e.target.value)} placeholder="cpc"/></Field>
            <Field label="UTM Campaign"><input className={inputCls} value={utmCampaign} onChange={e=>setUtmCampaign(e.target.value)} placeholder="spring-sale"/></Field>
            <Field label="UTM Term"><input className={inputCls} value={utmTerm} onChange={e=>setUtmTerm(e.target.value)} placeholder="running+shoes"/></Field>
            <Field label="UTM Content (colspan)"><input className={inputCls} value={utmContent} onChange={e=>setUtmContent(e.target.value)} placeholder="logolink"/></Field>
          </div>
        </details>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-white/[0.05] border border-slate-700 rounded-lg text-sm text-slate-300 hover:bg-white/[0.08]">Cancel</button>
          <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm text-white font-medium disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Link'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}


// ─────────────────── AnalyticsPanel ───────────────────
function AnalyticsPanel({link, onClose}: {link:Link;onClose:()=>void}) {
  const [data, setData] = useState<AnalyticsData|null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/links/${link.id}/analytics?days=${days}`)
      .then(r=>r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [link.id, days]);

  async function loadAiSummary() {
    setAiLoading(true);
    try {
      const r = await fetch('/api/links/ai-summary', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({link_id:link.id,days})});
      const d = await r.json();
      setAiSummary(d.summary||'');
    } catch {}
    setAiLoading(false);
  }

  function copyShort() {
    navigator.clipboard.writeText(`${BASE_URL}/s/${link.slug}`).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);});
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}/>
      <div className="relative bg-slate-900 border-l border-slate-700 w-full max-w-2xl h-full overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 shrink-0">
          <div>
            <h3 className="font-semibold text-white flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-400"/>Analytics
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">{BASE_URL}/s/{link.slug}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>window.open(`/api/links/${link.id}/analytics/export`,'_blank')}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white/[0.05] border border-slate-700 rounded-lg text-slate-300 hover:bg-white/[0.08]">
              <Download className="w-3.5 h-3.5"/>CSV
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5"/></button>
          </div>
        </div>

        <div className="p-6 space-y-6 flex-1">
          {/* Day selector */}
          <div className="flex items-center gap-2">
            {[7,30,90].map(d => (
              <button key={d} onClick={()=>setDays(d)}
                className={`px-3 py-1 rounded-lg text-xs font-medium border ${days===d?'bg-indigo-600 border-indigo-500 text-white':'bg-white/[0.03] border-slate-700 text-slate-400 hover:text-white'}`}>
                {d}d
              </button>
            ))}
            <button onClick={copyShort} className="ml-auto flex items-center gap-1.5 text-xs text-slate-400 hover:text-white">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400"/> : <Copy className="w-3.5 h-3.5"/>}
              {copied ? 'Copied!' : 'Copy link'}
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40 text-slate-500">Loading analytics…</div>
          ) : !data ? (
            <div className="text-slate-500 text-sm">No data available.</div>
          ) : (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-3 gap-3">
                <StatCard label="Total Clicks" value={data.link.total_clicks} color="indigo"/>
                <StatCard label="Last 30d" value={data.daily.reduce((a,b)=>a+b.clicks,0)} color="cyan"/>
                <StatCard label="Today" value={data.daily[data.daily.length-1]?.clicks||0} color="emerald"/>
              </div>

              {/* Line chart */}
              {data.daily.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider">Daily clicks</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={data.daily}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
                      <XAxis dataKey="date" tickFormatter={shortDate} tick={{fontSize:10,fill:'#64748b'}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fontSize:10,fill:'#64748b'}} axisLine={false} tickLine={false}/>
                      <Tooltip contentStyle={{background:'#0f172a',border:'1px solid #334155',borderRadius:'8px',fontSize:'12px'}} labelFormatter={shortDate}/>
                      <Line type="monotone" dataKey="clicks" stroke="#6366f1" strokeWidth={2} dot={false}/>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Devices */}
              {data.devices.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider">Devices</p>
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart>
                        <Pie data={data.devices} dataKey="cnt" nameKey="device_type" cx="50%" cy="50%" outerRadius={55} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                          {data.devices.map((_,i) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                        </Pie>
                        <Tooltip contentStyle={{background:'#0f172a',border:'1px solid #334155',borderRadius:'8px',fontSize:'11px'}}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider">Browsers</p>
                    <div className="space-y-1.5">
                      {data.browsers.slice(0,5).map(b => (
                        <div key={b.browser} className="flex items-center justify-between text-xs">
                          <span className="text-slate-300">{b.browser||'Unknown'}</span>
                          <span className="text-slate-400">{b.cnt.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Referrers */}
              {data.referrers.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider">Top Referrers</p>
                  <div className="space-y-1">
                    {data.referrers.slice(0,8).map(r => (
                      <div key={r.referrer_domain} className="flex items-center justify-between text-xs py-1 border-b border-slate-800">
                        <span className="text-slate-300">{r.referrer_domain||'Direct'}</span>
                        <span className="text-slate-400">{r.cnt.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent clicks */}
              {data.recentClicks.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider">Recent Clicks</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-slate-500 border-b border-slate-800">
                          <th className="text-left py-1.5">Time</th>
                          <th className="text-left py-1.5">Device</th>
                          <th className="text-left py-1.5">Browser</th>
                          <th className="text-left py-1.5">Referrer</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.recentClicks.slice(0,20).map((c,i) => (
                          <tr key={i} className="border-b border-slate-800/50 hover:bg-white/[0.02]">
                            <td className="py-1.5 text-slate-400">{relTime(c.clicked_at)}</td>
                            <td className="py-1.5 text-slate-300 capitalize">{c.device_type}</td>
                            <td className="py-1.5 text-slate-300">{c.browser}</td>
                            <td className="py-1.5 text-slate-400">{c.referrer_domain||'–'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* AI Summary */}
              <div className="border border-indigo-800/40 rounded-xl p-4 bg-indigo-900/10">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-indigo-300 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5"/>AI Summary</p>
                  <button onClick={loadAiSummary} disabled={aiLoading}
                    className="text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-50">
                    {aiLoading ? 'Generating…' : 'Generate'}
                  </button>
                </div>
                {aiSummary ? <p className="text-sm text-slate-300 leading-relaxed">{aiSummary}</p> : <p className="text-xs text-slate-500">Click Generate to get an AI analysis of this link&apos;s performance.</p>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


// ─────────────────── QRModal ───────────────────
function QRModal({link, onClose}: {link:Link;onClose:()=>void}) {
  const [qr, setQr] = useState('');
  const [darkColor, setDarkColor] = useState('#000000');
  const [lightColor, setLightColor] = useState('#ffffff');
  const [size, setSize] = useState(400);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout>|null>(null);

  const loadQr = useCallback(() => {
    setLoading(true);
    fetch(`/api/links/${link.id}/qr?dark=${encodeURIComponent(darkColor)}&light=${encodeURIComponent(lightColor)}&size=${size}`)
      .then(r=>r.json())
      .then(d => { setQr(d.dataUrl||d.url||''); setLoading(false); })
      .catch(() => setLoading(false));
  }, [link.id, darkColor, lightColor, size]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(loadQr, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [loadQr]);

  return (
    <ModalWrapper onClose={onClose}>
      <ModalHeader title="QR Code" icon={QrCode} color="cyan" onClose={onClose}/>
      <div className="p-6 space-y-5">
        <div className="flex justify-center">
          {loading ? (
            <div className="w-48 h-48 bg-white/[0.03] rounded-xl flex items-center justify-center text-slate-500 text-sm">Generating…</div>
          ) : qr ? (
            <img src={qr} alt="QR Code" className="rounded-xl border border-slate-700" style={{width:Math.min(size,240),height:Math.min(size,240)}}/>
          ) : (
            <div className="w-48 h-48 bg-white/[0.03] rounded-xl flex items-center justify-center text-slate-500 text-sm">Failed to load</div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label={<span className="flex items-center gap-1">Dark Color <TierBadge tier="BUSINESS"/></span>}>
            <div className="flex items-center gap-2">
              <input type="color" value={darkColor} onChange={e=>setDarkColor(e.target.value)} className="w-10 h-9 rounded border border-slate-700 bg-transparent cursor-pointer"/>
              <input className={inputCls} value={darkColor} onChange={e=>setDarkColor(e.target.value)} placeholder="#000000"/>
            </div>
          </Field>
          <Field label="Light Color">
            <div className="flex items-center gap-2">
              <input type="color" value={lightColor} onChange={e=>setLightColor(e.target.value)} className="w-10 h-9 rounded border border-slate-700 bg-transparent cursor-pointer"/>
              <input className={inputCls} value={lightColor} onChange={e=>setLightColor(e.target.value)} placeholder="#ffffff"/>
            </div>
          </Field>
        </div>

        <Field label={`Size: ${size}px`}>
          <input type="range" min={200} max={600} value={size} onChange={e=>setSize(parseInt(e.target.value))} className="w-full"/>
        </Field>

        <p className="text-xs text-slate-500 flex items-center gap-1"><Shield className="w-3 h-3"/>White-label colors require <TierBadge tier="BUSINESS"/></p>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-white/[0.05] border border-slate-700 rounded-lg text-sm text-slate-300 hover:bg-white/[0.08]">Close</button>
          {qr && (
            <a href={qr} download={`qr-${link.slug}.png`} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-sm text-white font-medium">
              <Download className="w-4 h-4"/>Download
            </a>
          )}
        </div>
      </div>
    </ModalWrapper>
  );
}

// ─────────────────── PixelsModal ───────────────────
function PixelsModal({link, onClose}: {link:Link;onClose:()=>void}) {
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const [pixelType, setPixelType] = useState('facebook');
  const [pixelId, setPixelId] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetch(`/api/links/${link.id}/pixels`).then(r=>r.json()).then(d=>{ setPixels(Array.isArray(d)?d:[]); setLoading(false); }).catch(()=>setLoading(false));
  }, [link.id]);

  async function addPixel() {
    if (!pixelId) return;
    setAdding(true);
    try {
      const r = await fetch(`/api/links/${link.id}/pixels`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pixel_type:pixelType,pixel_id:pixelId})});
      const d = await r.json();
      if (r.ok) { setPixels(p=>[...p,d]); setPixelId(''); }
    } catch {}
    setAdding(false);
  }

  async function deletePixel(pid: number) {
    await fetch(`/api/links/${link.id}/pixels/${pid}`, {method:'DELETE'});
    setPixels(p=>p.filter(x=>x.id!==pid));
  }

  const pixelColors: Record<string,string> = {facebook:'text-blue-300 bg-blue-900/20 border-blue-800/40',google_analytics:'text-amber-300 bg-amber-900/20 border-amber-800/40',linkedin:'text-sky-300 bg-sky-900/20 border-sky-800/40',google_ads:'text-green-300 bg-green-900/20 border-green-800/40'};

  return (
    <ModalWrapper onClose={onClose}>
      <ModalHeader title="Retargeting Pixels" icon={Zap} color="purple" onClose={onClose}/>
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2 p-3 bg-purple-900/10 border border-purple-800/30 rounded-lg text-xs text-purple-300">
          <Shield className="w-3.5 h-3.5 shrink-0"/><span>Business feature</span><TierBadge tier="BUSINESS"/>
        </div>
        {loading ? <p className="text-slate-500 text-sm">Loading…</p> : (
          <>
            {pixels.length === 0 && <p className="text-slate-500 text-sm">No pixels attached yet.</p>}
            {pixels.map(px => (
              <div key={px.id} className="flex items-center justify-between p-3 bg-white/[0.03] border border-slate-700 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 border rounded-full ${pixelColors[px.pixel_type]||'text-slate-300 bg-slate-800 border-slate-700'}`}>
                    {PIXEL_TYPES.find(t=>t.value===px.pixel_type)?.label||px.pixel_type}
                  </span>
                  <span className="text-sm text-slate-300 font-mono">{px.pixel_id}</span>
                </div>
                <button onClick={()=>deletePixel(px.id)} className="text-slate-500 hover:text-red-400"><Trash2 className="w-4 h-4"/></button>
              </div>
            ))}
          </>
        )}
        <div className="pt-2 space-y-3 border-t border-slate-800">
          <Field label="Pixel Type">
            <select className={inputCls} value={pixelType} onChange={e=>setPixelType(e.target.value)}>
              {PIXEL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="Pixel ID">
            <input className={inputCls} value={pixelId} onChange={e=>setPixelId(e.target.value)} placeholder="e.g. 123456789"/>
          </Field>
          <button onClick={addPixel} disabled={adding||!pixelId} className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm text-white font-medium disabled:opacity-50">
            {adding ? 'Adding…' : 'Add Pixel'}
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}


// ─────────────────── VariantsModal ───────────────────
function VariantsModal({link, onClose}: {link:Link;onClose:()=>void}) {
  const [variants, setVariants] = useState<ABVariant[]>([]);
  const [variantUrl, setVariantUrl] = useState('');
  const [weight, setWeight] = useState(50);
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetch(`/api/links/${link.id}/variants`).then(r=>r.json()).then(d=>{ setVariants(Array.isArray(d)?d:[]); setLoading(false); }).catch(()=>setLoading(false));
  }, [link.id]);

  async function addVariant() {
    if (!variantUrl) return;
    setAdding(true);
    try {
      const r = await fetch(`/api/links/${link.id}/variants`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({variant_url:variantUrl,weight,label:label||undefined})});
      const d = await r.json();
      if (r.ok) { setVariants(v=>[...v,d]); setVariantUrl(''); setLabel(''); setWeight(50); }
    } catch {}
    setAdding(false);
  }

  async function deleteVariant(vid: number) {
    await fetch(`/api/links/${link.id}/variants/${vid}`, {method:'DELETE'});
    setVariants(v=>v.filter(x=>x.id!==vid));
  }

  async function updateWeight(vid: number, w: number) {
    await fetch(`/api/links/${link.id}/variants/${vid}`, {method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({weight:w})});
  }

  return (
    <ModalWrapper onClose={onClose} wide>
      <ModalHeader title="A/B Variants" icon={FlaskConical} color="amber" onClose={onClose}/>
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2 p-3 bg-blue-900/10 border border-blue-800/30 rounded-lg text-xs text-blue-300">
          <FlaskConical className="w-3.5 h-3.5 shrink-0"/><span>A/B weighted rotation requires</span><TierBadge tier="BUSINESS"/>
        </div>
        {/* Original URL (non-deletable) */}
        <div className="p-3 bg-white/[0.03] border border-slate-700 rounded-lg opacity-70">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Original (control)</p>
              <p className="text-sm text-slate-300 font-mono">{trunc(link.original_url,50)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Weight</p>
              <p className="text-sm text-slate-300 font-medium">100</p>
            </div>
          </div>
        </div>
        {loading ? <p className="text-slate-500 text-sm">Loading…</p> : (
          variants.map(v => (
            <div key={v.id} className="p-3 bg-white/[0.03] border border-slate-700 rounded-lg">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {v.label && <p className="text-xs text-slate-500 mb-0.5">{v.label}</p>}
                  <p className="text-sm text-slate-300 font-mono truncate">{v.variant_url}</p>
                  <p className="text-xs text-slate-500 mt-1">{v.click_count.toLocaleString()} clicks</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div>
                    <p className="text-xs text-slate-500 text-center mb-1">Weight</p>
                    <input type="number" min={1} max={100} defaultValue={v.weight}
                      onBlur={e=>updateWeight(v.id,parseInt(e.target.value)||v.weight)}
                      className="w-16 bg-white/[0.05] border border-slate-700 rounded px-2 py-1 text-sm text-white text-center focus:outline-none focus:border-indigo-500"/>
                  </div>
                  <button onClick={()=>deleteVariant(v.id)} className="text-slate-500 hover:text-red-400 mt-4"><Trash2 className="w-4 h-4"/></button>
                </div>
              </div>
            </div>
          ))
        )}
        <div className="pt-2 space-y-3 border-t border-slate-800">
          <Field label="Variant URL">
            <input className={inputCls} value={variantUrl} onChange={e=>setVariantUrl(e.target.value)} placeholder="https://example.com/variant"/>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Label">
              <input className={inputCls} value={label} onChange={e=>setLabel(e.target.value)} placeholder="Variant B"/>
            </Field>
            <Field label={`Weight: ${weight}`}>
              <input type="range" min={1} max={100} value={weight} onChange={e=>setWeight(parseInt(e.target.value))} className="w-full mt-2"/>
            </Field>
          </div>
          <button onClick={addVariant} disabled={adding||!variantUrl} className="w-full px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm text-white font-medium disabled:opacity-50">
            {adding ? 'Adding…' : 'Add Variant'}
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}

// ─────────────────── BulkCreateModal ───────────────────
function BulkCreateModal({campaigns, onClose, onCreated}: {campaigns:Campaign[];onClose:()=>void;onCreated:()=>void}) {
  const [urls, setUrls] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{created:number;failed:number}|null>(null);

  async function handleBulk() {
    const list = urls.split('\n').map(u=>u.trim()).filter(u=>u.startsWith('http'));
    if (!list.length) return;
    setLoading(true);
    try {
      const r = await fetch('/api/links/bulk', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({urls:list, campaign_id:campaignId?parseInt(campaignId):undefined, utm_source:utmSource||undefined, utm_medium:utmMedium||undefined}),
      });
      const d = await r.json();
      setResults({created:d.created||0,failed:d.failed||0});
      onCreated();
    } catch {}
    setLoading(false);
  }

  return (
    <ModalWrapper onClose={onClose} wide>
      <ModalHeader title="Bulk Create Links" icon={Layers} color="amber" onClose={onClose}/>
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2 p-3 bg-amber-900/10 border border-amber-800/30 rounded-lg text-xs text-amber-300">
          <Layers className="w-3.5 h-3.5 shrink-0"/><span>Bulk creation requires</span><TierBadge tier="AGENCY"/>
        </div>
        {results ? (
          <div className="text-center py-6">
            <p className="text-2xl font-bold text-white mb-1">{results.created.toLocaleString()}</p>
            <p className="text-sm text-slate-400">links created</p>
            {results.failed > 0 && <p className="text-sm text-red-400 mt-2">{results.failed} failed</p>}
            <button onClick={onClose} className="mt-6 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm text-white">Done</button>
          </div>
        ) : (
          <>
            <Field label="URLs (one per line)">
              <textarea className={inputCls} rows={8} value={urls} onChange={e=>setUrls(e.target.value)} placeholder={"https://example.com/page-1\nhttps://example.com/page-2"}/>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Campaign (optional)">
                <select className={inputCls} value={campaignId} onChange={e=>setCampaignId(e.target.value)}>
                  <option value="">None</option>
                  {campaigns.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="UTM Source (optional)">
                <input className={inputCls} value={utmSource} onChange={e=>setUtmSource(e.target.value)} placeholder="bulk-import"/>
              </Field>
            </div>
            <Field label="UTM Medium (optional)">
              <input className={inputCls} value={utmMedium} onChange={e=>setUtmMedium(e.target.value)} placeholder="direct"/>
            </Field>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 px-4 py-2 bg-white/[0.05] border border-slate-700 rounded-lg text-sm text-slate-300 hover:bg-white/[0.08]">Cancel</button>
              <button onClick={handleBulk} disabled={loading||!urls.trim()} className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm text-white font-medium disabled:opacity-50">
                {loading ? 'Creating…' : `Create ${urls.split('\n').filter(u=>u.trim().startsWith('http')).length} Links`}
              </button>
            </div>
          </>
        )}
      </div>
    </ModalWrapper>
  );
}


// ─────────────────── ApiKeysTab ───────────────────
function ApiKeysTab() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [name, setName] = useState('');
  const [tier, setTier] = useState<'pro'|'business'|'agency'>('pro');
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState('');
  const [creating, setCreating] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);

  useEffect(() => {
    fetch('/api/ls-keys').then(r=>r.json()).then(d=>{ setKeys(Array.isArray(d)?d:[]); setLoading(false); }).catch(()=>setLoading(false));
  }, []);

  async function createKey() {
    if (!name) return;
    setCreating(true);
    try {
      const r = await fetch('/api/ls-keys', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,tier})});
      const d = await r.json();
      if (r.ok) {
        setNewKey(d.key||'');
        setKeys(k=>[...k,d.apiKey||{id:d.id,name,key_prefix:d.key?.slice(0,8)||'ls_...',tier,is_active:true,created_at:new Date().toISOString(),last_used_at:null}]);
        setName('');
      }
    } catch {}
    setCreating(false);
  }

  async function revokeKey(id: number) {
    await fetch(`/api/ls-keys/${id}`, {method:'DELETE'});
    setKeys(k=>k.filter(x=>x.id!==id));
  }

  function copyKey() {
    navigator.clipboard.writeText(newKey).then(()=>{ setKeyCopied(true); setTimeout(()=>setKeyCopied(false),2000); });
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Key className="w-5 h-5 text-indigo-400"/>
        <div>
          <h3 className="font-semibold text-white">API Keys</h3>
          <p className="text-xs text-slate-400">Manage programmatic access to the Link Shortener API</p>
        </div>
      </div>

      {newKey && (
        <div className="p-4 bg-emerald-900/20 border border-emerald-700/50 rounded-xl space-y-2">
          <p className="text-xs text-emerald-400 font-medium flex items-center gap-1.5"><Check className="w-3.5 h-3.5"/>Key created — copy it now, it will not be shown again</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-black/30 px-3 py-2 rounded-lg text-emerald-300 font-mono break-all">{newKey}</code>
            <button onClick={copyKey} className="p-2 text-slate-400 hover:text-white">{keyCopied ? <Check className="w-4 h-4 text-emerald-400"/> : <Copy className="w-4 h-4"/>}</button>
          </div>
        </div>
      )}

      {/* Create form */}
      <div className="p-4 bg-white/[0.03] border border-slate-700 rounded-xl space-y-3">
        <p className="text-sm font-medium text-white">Create New Key</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Key Name">
            <input className={inputCls} value={name} onChange={e=>setName(e.target.value)} placeholder="My API Key"/>
          </Field>
          <Field label="Tier">
            <select className={inputCls} value={tier} onChange={e=>setTier(e.target.value as 'pro'|'business'|'agency')}>
              <option value="pro">Pro</option>
              <option value="business">Business</option>
              <option value="agency">Agency</option>
            </select>
          </Field>
        </div>
        <button onClick={createKey} disabled={creating||!name} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm text-white font-medium disabled:opacity-50">
          {creating ? 'Creating…' : 'Create Key'}
        </button>
      </div>

      {/* Keys table */}
      {loading ? <p className="text-slate-500 text-sm">Loading…</p> : keys.length === 0 ? (
        <p className="text-slate-500 text-sm">No API keys yet. Create one above.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-xs border-b border-slate-700/50">
                <th className="text-left py-2">Name</th>
                <th className="text-left py-2">Prefix</th>
                <th className="text-left py-2">Tier</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Created</th>
                <th className="text-left py-2">Last Used</th>
                <th className="text-right py-2"></th>
              </tr>
            </thead>
            <tbody>
              {keys.map(k => (
                <tr key={k.id} className="border-b border-slate-700/50 hover:bg-white/[0.02]">
                  <td className="py-2.5 text-white">{k.name}</td>
                  <td className="py-2.5 font-mono text-slate-400 text-xs">{k.key_prefix}…</td>
                  <td className="py-2.5"><TierBadge tier={k.tier}/></td>
                  <td className="py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${k.is_active?'bg-emerald-900/30 text-emerald-400':'bg-slate-800 text-slate-500'}`}>
                      {k.is_active ? 'Active' : 'Revoked'}
                    </span>
                  </td>
                  <td className="py-2.5 text-slate-400 text-xs">{shortDate(k.created_at)}</td>
                  <td className="py-2.5 text-slate-400 text-xs">{k.last_used_at ? relTime(k.last_used_at) : '–'}</td>
                  <td className="py-2.5 text-right">
                    {k.is_active && (
                      <button onClick={()=>revokeKey(k.id)} className="text-xs text-red-400 hover:text-red-300">Revoke</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─────────────────── AdminLogsTab ───────────────────
function AdminLogsTab() {
  const [activeLog, setActiveLog] = useState<'audit'|'errors'>('audit');
  const [audit, setAudit] = useState<Record<string,unknown>[]>([]);
  const [errors, setErrors] = useState<Record<string,unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  async function loadLogs() {
    setLoading(true);
    try {
      const [a, e] = await Promise.all([
        fetch('/api/admin/link-audit').then(r=>r.json()),
        fetch('/api/admin/link-errors').then(r=>r.json()),
      ]);
      setAudit(Array.isArray(a)?a:[]);
      setErrors(Array.isArray(e)?e:[]);
      setLoaded(true);
    } catch {}
    setLoading(false);
  }

  const data = activeLog === 'audit' ? audit : errors;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-red-400"/>
          <div>
            <h3 className="font-semibold text-white">Admin Logs</h3>
            <p className="text-xs text-slate-400">Audit trail and error logs</p>
          </div>
        </div>
        {!loaded && (
          <button onClick={loadLogs} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-white/[0.05] border border-slate-700 rounded-lg text-sm text-slate-300 hover:bg-white/[0.08] disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`}/>
            {loading ? 'Loading…' : 'Load Logs'}
          </button>
        )}
        {loaded && (
          <button onClick={loadLogs} disabled={loading} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white">
            <RefreshCw className={`w-3.5 h-3.5 ${loading?'animate-spin':''}`}/>Refresh
          </button>
        )}
      </div>

      {!loaded ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-3">
          <Shield className="w-8 h-8 opacity-30"/>
          <p className="text-sm">Click Load to view logs</p>
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            {(['audit','errors'] as const).map(t => (
              <button key={t} onClick={()=>setActiveLog(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border capitalize ${activeLog===t?'bg-indigo-600 border-indigo-500 text-white':'bg-white/[0.03] border-slate-700 text-slate-400 hover:text-white'}`}>
                {t === 'audit' ? 'Audit Trail' : 'Errors'} ({(t==='audit'?audit:errors).length})
              </button>
            ))}
          </div>
          {data.length === 0 ? <p className="text-slate-500 text-sm">No {activeLog} logs found.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-700/50">
                    {Object.keys(data[0]).map(k => (
                      <th key={k} className="text-left py-2 pr-4 capitalize">{k.replace(/_/g,' ')}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0,100).map((row, i) => (
                    <tr key={i} className="border-b border-slate-800/50 hover:bg-white/[0.02]">
                      {Object.values(row).map((v, j) => (
                        <td key={j} className="py-2 pr-4 text-slate-300 max-w-[200px] truncate">
                          {typeof v === 'string' ? trunc(v, 40) : typeof v === 'boolean' ? (v?'Yes':'No') : String(v??'–')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}


// ─────────────────── UTMBuilder ───────────────────
function UTMBuilder({campaigns}: {campaigns:Campaign[]}) {
  const [baseUrl, setBaseUrl] = useState('');
  const [source, setSource] = useState('');
  const [medium, setMedium] = useState('');
  const [campaign, setCampaign] = useState('');
  const [term, setTerm] = useState('');
  const [content, setContent] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [shortened, setShortened] = useState('');
  const [shortLoading, setShortLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const sourcePresets = ['google','facebook','twitter','linkedin','email','newsletter'];
  const mediumPresets = ['cpc','organic','social','email','referral','banner'];

  const builtUrl = (() => {
    if (!baseUrl) return '';
    try {
      const u = new URL(baseUrl.startsWith('http') ? baseUrl : 'https://'+baseUrl);
      if (source) u.searchParams.set('utm_source', source);
      if (medium) u.searchParams.set('utm_medium', medium);
      if (campaign) u.searchParams.set('utm_campaign', campaign);
      if (term) u.searchParams.set('utm_term', term);
      if (content) u.searchParams.set('utm_content', content);
      return u.toString();
    } catch { return ''; }
  })();

  async function shorten() {
    if (!builtUrl) return;
    setShortLoading(true);
    try {
      const r = await fetch('/api/links', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:builtUrl,campaign_id:campaignId?parseInt(campaignId):undefined,utm_source:source,utm_medium:medium,utm_campaign:campaign,utm_term:term,utm_content:content})});
      const d = await r.json();
      if (r.ok) setShortened(`${BASE_URL}/s/${d.slug}`);
    } catch {}
    setShortLoading(false);
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text).then(()=>{ setCopied(true); setTimeout(()=>setCopied(false),2000); });
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Share2 className="w-5 h-5 text-cyan-400"/>
        <div>
          <h3 className="font-semibold text-white">UTM Builder</h3>
          <p className="text-xs text-slate-400">Build and shorten UTM-tagged URLs</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4">
        <Field label="Base URL">
          <input className={inputCls} value={baseUrl} onChange={e=>setBaseUrl(e.target.value)} placeholder="https://yoursite.com/landing-page"/>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Field label="UTM Source">
              <input className={inputCls} value={source} onChange={e=>setSource(e.target.value)} placeholder="google"/>
            </Field>
            <div className="flex gap-1.5 flex-wrap mt-1.5">
              {sourcePresets.map(p => <button key={p} type="button" onClick={()=>setSource(p)} className="text-[10px] px-2 py-0.5 bg-white/[0.04] border border-slate-700 rounded text-slate-400 hover:text-white">{p}</button>)}
            </div>
          </div>
          <div>
            <Field label="UTM Medium">
              <input className={inputCls} value={medium} onChange={e=>setMedium(e.target.value)} placeholder="cpc"/>
            </Field>
            <div className="flex gap-1.5 flex-wrap mt-1.5">
              {mediumPresets.map(p => <button key={p} type="button" onClick={()=>setMedium(p)} className="text-[10px] px-2 py-0.5 bg-white/[0.04] border border-slate-700 rounded text-slate-400 hover:text-white">{p}</button>)}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Campaign"><input className={inputCls} value={campaign} onChange={e=>setCampaign(e.target.value)} placeholder="spring-sale"/></Field>
          <Field label="Term"><input className={inputCls} value={term} onChange={e=>setTerm(e.target.value)} placeholder="running+shoes"/></Field>
          <Field label="Content"><input className={inputCls} value={content} onChange={e=>setContent(e.target.value)} placeholder="logolink"/></Field>
        </div>
        <Field label="Campaign (optional)">
          <select className={inputCls} value={campaignId} onChange={e=>setCampaignId(e.target.value)}>
            <option value="">No campaign</option>
            {campaigns.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
      </div>

      {builtUrl && (
        <div className="space-y-3">
          <div>
            <p className="text-xs text-slate-400 mb-1">Built URL</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-white/[0.02] border border-slate-700 rounded-lg px-3 py-2 text-slate-300 break-all">{builtUrl}</code>
              <button onClick={()=>copy(builtUrl)} className="p-2 text-slate-400 hover:text-white shrink-0">{copied ? <Check className="w-4 h-4 text-emerald-400"/> : <Copy className="w-4 h-4"/>}</button>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={shorten} disabled={shortLoading} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm text-white font-medium disabled:opacity-50">
              <Zap className="w-4 h-4"/>
              {shortLoading ? 'Shortening…' : 'Shorten URL'}
            </button>
            {shortened && (
              <div className="flex items-center gap-2 flex-1">
                <a href={shortened} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-400 hover:underline">{shortened}</a>
                <button onClick={()=>copy(shortened)} className="text-slate-400 hover:text-white"><Copy className="w-4 h-4"/></button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────── CampaignsTab ───────────────────
function CampaignsTab({campaigns, onRefresh}: {campaigns:Campaign[];onRefresh:()=>void}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [loading, setLoading] = useState(false);

  async function createCampaign() {
    if (!name) return;
    setLoading(true);
    try {
      const r = await fetch('/api/campaigns', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,description:description||undefined,color})});
      if (r.ok) { setName(''); setDescription(''); onRefresh(); }
    } catch {}
    setLoading(false);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Tag className="w-5 h-5 text-emerald-400"/>
        <div>
          <h3 className="font-semibold text-white">Campaigns</h3>
          <p className="text-xs text-slate-400">Group links by campaign for bulk reporting</p>
        </div>
      </div>

      <div className="p-4 bg-white/[0.03] border border-slate-700 rounded-xl space-y-3">
        <p className="text-sm font-medium text-white">New Campaign</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name">
            <input className={inputCls} value={name} onChange={e=>setName(e.target.value)} placeholder="Spring Sale"/>
          </Field>
          <Field label="Color">
            <div className="flex items-center gap-2">
              <input type="color" value={color} onChange={e=>setColor(e.target.value)} className="w-10 h-9 rounded border border-slate-700 bg-transparent cursor-pointer"/>
              <input className={inputCls} value={color} onChange={e=>setColor(e.target.value)} placeholder="#6366f1"/>
            </div>
          </Field>
        </div>
        <Field label="Description (optional)">
          <input className={inputCls} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Brief description"/>
        </Field>
        <button onClick={createCampaign} disabled={loading||!name} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm text-white font-medium disabled:opacity-50">
          {loading ? 'Creating…' : 'Create Campaign'}
        </button>
      </div>

      <div className="space-y-2">
        {campaigns.length === 0 ? <p className="text-slate-500 text-sm">No campaigns yet.</p> : campaigns.map(c => (
          <div key={c.id} className="flex items-center gap-4 p-4 bg-white/[0.03] border border-slate-700 rounded-xl hover:bg-white/[0.04]">
            <div className="w-3 h-3 rounded-full shrink-0" style={{background:c.color}}/>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white">{c.name}</p>
              {c.description && <p className="text-xs text-slate-400">{c.description}</p>}
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm text-white font-medium">{c.total_clicks.toLocaleString()}</p>
              <p className="text-xs text-slate-400">{c.link_count} links</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


// ─────────────────── MoreMenu ───────────────────
function MoreMenu({link, onPixels, onVariants, onDelete}: {
  link: Link;
  onPixels: () => void;
  onVariants: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function shareReport() {
    try {
      const r = await fetch(`/api/links/${link.id}/report-token`, {method:'POST'});
      const d = await r.json();
      if (d.url) {
        navigator.clipboard.writeText(d.url);
        setToast('Report URL copied!');
        setTimeout(() => setToast(''), 3000);
      }
    } catch {}
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 bg-emerald-900/90 border border-emerald-700 text-emerald-300 text-xs px-4 py-2 rounded-lg">
          {toast}
        </div>
      )}
      <button onMouseDown={e=>e.stopPropagation()} onClick={()=>setOpen(o=>!o)}
        className="p-1.5 text-slate-500 hover:text-slate-300 rounded-md hover:bg-white/[0.04]">
        <MoreHorizontal className="w-4 h-4"/>
      </button>
      {open && (
        <div onMouseDown={e=>e.stopPropagation()} className="absolute right-0 top-8 z-40 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1 w-48">
          <button onClick={()=>{onPixels();setOpen(false);}} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.04] hover:text-white">
            <Zap className="w-3.5 h-3.5 text-purple-400"/>Retargeting Pixels
          </button>
          <button onClick={()=>{onVariants();setOpen(false);}} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.04] hover:text-white">
            <FlaskConical className="w-3.5 h-3.5 text-amber-400"/>A/B Variants
          </button>
          <button onClick={shareReport} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.04] hover:text-white">
            <Share2 className="w-3.5 h-3.5 text-cyan-400"/>Share Report
          </button>
          <div className="my-1 border-t border-slate-700/50"/>
          <button onClick={()=>{onDelete();setOpen(false);}} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-400 hover:bg-red-900/20 hover:text-red-300">
            <Trash2 className="w-3.5 h-3.5"/>Delete Link
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────── LinkRow ───────────────────
function LinkRow({link, onAnalytics, onQr, onPixels, onVariants, onDelete}: {
  link: Link;
  onAnalytics: () => void;
  onQr: () => void;
  onPixels: () => void;
  onVariants: () => void;
  onDelete: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const shortUrl = `${BASE_URL}/s/${link.slug}`;
  const dotColor = link.campaign_color || '#6366f1';

  const now = new Date();
  const expiresDate = link.expires_at ? new Date(link.expires_at) : null;
  const isExpired = expiresDate && expiresDate < now;
  const isExpiringSoon = expiresDate && !isExpired && (expiresDate.getTime()-now.getTime()) < 7*24*60*60*1000;

  function copy() {
    navigator.clipboard.writeText(shortUrl).then(()=>{ setCopied(true); setTimeout(()=>setCopied(false),2000); });
  }

  return (
    <tr className="border-b border-slate-700/50 hover:bg-white/[0.02] group">
      <td className="py-3 pl-4 pr-2">
        <div className="w-2.5 h-2.5 rounded-full" style={{background:dotColor}}/>
      </td>
      <td className="py-3 pr-3 min-w-[140px]">
        <div className="flex flex-col gap-0.5">
          <a href={`/s/${link.slug}`} target="_blank" rel="noopener noreferrer"
            className="text-sm font-mono text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1">
            {link.slug}<ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100"/>
          </a>
          <div className="flex items-center gap-1 flex-wrap">
            {link.campaign_name && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{background:dotColor+'30',color:dotColor}}>
                {link.campaign_name}
              </span>
            )}
            {(link.utm_source || link.utm_medium) && (
              <span className="text-[10px] px-1.5 py-0.5 bg-cyan-900/20 text-cyan-400 border border-cyan-800/30 rounded-full">UTM</span>
            )}
            {link.password_hash && (
              <span className="text-[10px] px-1.5 py-0.5 bg-purple-900/20 text-purple-400 border border-purple-800/30 rounded-full flex items-center gap-0.5">
                <Lock className="w-2.5 h-2.5"/>
              </span>
            )}
            {isExpired && <span className="text-[10px] px-1.5 py-0.5 bg-red-900/20 text-red-400 border border-red-800/30 rounded-full flex items-center gap-0.5"><Clock className="w-2.5 h-2.5"/>Expired</span>}
            {isExpiringSoon && <span className="text-[10px] px-1.5 py-0.5 bg-amber-900/20 text-amber-400 border border-amber-800/30 rounded-full flex items-center gap-0.5"><Clock className="w-2.5 h-2.5"/>Expiring</span>}
          </div>
        </div>
      </td>
      <td className="py-3 pr-4 max-w-[220px]">
        <p className="text-xs text-slate-400 truncate" title={link.original_url}>{trunc(link.original_url, 50)}</p>
        {link.title && <p className="text-[10px] text-slate-500">{link.title}</p>}
      </td>
      <td className="py-3 pr-4 text-right">
        <p className="text-sm font-medium text-white">{link.total_clicks.toLocaleString()}</p>
        <p className="text-[10px] text-slate-500">clicks</p>
      </td>
      <td className="py-3 pr-2">
        <p className="text-xs text-slate-500">{relTime(link.created_at)}</p>
      </td>
      <td className="py-3 pr-3">
        <div className="flex items-center gap-1">
          <button onClick={copy} className="p-1.5 text-slate-500 hover:text-slate-300 rounded-md hover:bg-white/[0.04]" title="Copy short URL">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400"/> : <Copy className="w-3.5 h-3.5"/>}
          </button>
          <button onClick={onAnalytics} className="p-1.5 text-slate-500 hover:text-indigo-400 rounded-md hover:bg-white/[0.04]" title="Analytics">
            <BarChart2 className="w-3.5 h-3.5"/>
          </button>
          <button onClick={onQr} className="p-1.5 text-slate-500 hover:text-cyan-400 rounded-md hover:bg-white/[0.04]" title="QR Code">
            <QrCode className="w-3.5 h-3.5"/>
          </button>
          <MoreMenu link={link} onPixels={onPixels} onVariants={onVariants} onDelete={onDelete}/>
        </div>
      </td>
    </tr>
  );
}


// ─────────────────── Main LinkShortener Component ───────────────────
export default function LinkShortener() {
  const [activeTab, setActiveTab] = useState<'links'|'analytics'|'utm'|'campaigns'|'apikeys'|'admin'>('links');
  const [links, setLinks] = useState<Link[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [overview, setOverview] = useState<OverviewStats|null>(null);
  const [dailyUsage, setDailyUsage] = useState<{used:number;limit:number}>({used:0,limit:10});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [analyticsLink, setAnalyticsLink] = useState<Link|null>(null);
  const [qrLink, setQrLink] = useState<Link|null>(null);
  const [pixelsLink, setPixelsLink] = useState<Link|null>(null);
  const [variantsLink, setVariantsLink] = useState<Link|null>(null);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [l, c, o, u] = await Promise.all([
        fetch('/api/links').then(r=>r.json()),
        fetch('/api/campaigns').then(r=>r.json()),
        fetch('/api/links/stats/overview').then(r=>r.json()),
        fetch('/api/links/stats/daily-usage').then(r=>r.json()),
      ]);
      setLinks(Array.isArray(l) ? l : []);
      setCampaigns(Array.isArray(c) ? c : []);
      setOverview(o.totalLinks !== undefined ? o : null);
      setDailyUsage(u.used !== undefined ? u : {used:0,limit:10});
    } catch {}
    setLoading(false);
  }

  async function deleteLink(id: number) {
    if (!confirm('Delete this link and all its click data?')) return;
    await fetch(`/api/links/${id}`, {method:'DELETE'});
    setLinks(l=>l.filter(x=>x.id!==id));
  }

  const filtered = links.filter(l => {
    if (!search) return true;
    const q = search.toLowerCase();
    return l.slug.includes(q) || l.original_url.toLowerCase().includes(q) || (l.title||'').toLowerCase().includes(q);
  });

  const usagePct = Math.min(100, (dailyUsage.used / Math.max(dailyUsage.limit, 1)) * 100);

  const tabs = [
    {id:'links' as const, label:'Links', icon:Link2, count:links.length},
    {id:'analytics' as const, label:'Analytics', icon:TrendingUp},
    {id:'utm' as const, label:'UTM Builder', icon:Share2},
    {id:'campaigns' as const, label:'Campaigns', icon:Tag, count:campaigns.length},
    {id:'apikeys' as const, label:'API Keys', icon:Key},
    {id:'admin' as const, label:'Admin Logs', icon:Shield},
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Modals */}
      {showCreate && <CreateLinkModal campaigns={campaigns} onClose={()=>setShowCreate(false)} onCreated={link=>{setLinks(l=>[link,...l]);setShowCreate(false);}}/>}
      {showBulk && <BulkCreateModal campaigns={campaigns} onClose={()=>setShowBulk(false)} onCreated={()=>{loadAll();setShowBulk(false);}}/>}
      {analyticsLink && <AnalyticsPanel link={analyticsLink} onClose={()=>setAnalyticsLink(null)}/>}
      {qrLink && <QRModal link={qrLink} onClose={()=>setQrLink(null)}/>}
      {pixelsLink && <PixelsModal link={pixelsLink} onClose={()=>setPixelsLink(null)}/>}
      {variantsLink && <VariantsModal link={variantsLink} onClose={()=>setVariantsLink(null)}/>}

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Link2 className="w-6 h-6 text-indigo-400"/>Link Shortener
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">Shorten, track, and optimize your links</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {/* Daily usage */}
            <div className="hidden md:flex flex-col items-end gap-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{dailyUsage.used}/{dailyUsage.limit} today</span>
                <TierBadge tier="PRO"/>
              </div>
              <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${usagePct >= 90 ? 'bg-red-500' : usagePct >= 70 ? 'bg-amber-500' : 'bg-indigo-500'}`} style={{width:`${usagePct}%`}}/>
              </div>
            </div>
            <button onClick={loadAll} disabled={loading} className="p-2 text-slate-400 hover:text-white rounded-lg bg-white/[0.03] border border-slate-700 hover:bg-white/[0.06]">
              <RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`}/>
            </button>
            <button onClick={()=>setShowBulk(true)} className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.05] border border-slate-700 rounded-lg text-sm text-slate-300 hover:bg-white/[0.08]">
              <Layers className="w-4 h-4"/><span className="hidden sm:inline">Bulk</span><TierBadge tier="AGENCY"/>
            </button>
            <button onClick={()=>setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm text-white font-medium">
              <Plus className="w-4 h-4"/>New Link
            </button>
          </div>
        </div>

        {/* Overview stats */}
        {overview && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Total Links" value={overview.totalLinks} color="indigo"/>
            <StatCard label="Total Clicks" value={overview.totalClicks} color="cyan"/>
            <StatCard label="Today" value={overview.todayClicks} color="emerald" sub="clicks today"/>
            <StatCard label="Top Link" value={overview.topLinks?.[0]?.total_clicks||0} sub={overview.topLinks?.[0]?.slug||'–'} color="amber"/>
          </div>
        )}

        {/* Tab bar */}
        <div className="flex items-center gap-1 border-b border-slate-800 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab===tab.id?'border-indigo-500 text-white':'border-transparent text-slate-500 hover:text-slate-300'}`}>
              <tab.icon className="w-4 h-4"/>
              {tab.label}
              {'count' in tab && tab.count !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab===tab.id?'bg-indigo-600 text-white':'bg-slate-800 text-slate-400'}`}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'links' && (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
              <input className="w-full bg-white/[0.03] border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by slug, URL, or title…"/>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20 text-slate-500 gap-2">
                <RefreshCw className="w-5 h-5 animate-spin"/>Loading links…
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
                <Link2 className="w-10 h-10 opacity-20"/>
                <p className="text-sm">{search ? 'No links match your search.' : 'No links yet. Create your first link!'}</p>
              </div>
            ) : (
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="text-slate-500 text-xs border-b border-slate-700/50">
                      <th className="py-3 pl-4 w-4"/>
                      <th className="py-3 text-left">Slug / Tags</th>
                      <th className="py-3 text-left">Destination</th>
                      <th className="py-3 text-right">Clicks</th>
                      <th className="py-3 text-left">Created</th>
                      <th className="py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(link => (
                      <LinkRow
                        key={link.id}
                        link={link}
                        onAnalytics={()=>setAnalyticsLink(link)}
                        onQr={()=>setQrLink(link)}
                        onPixels={()=>setPixelsLink(link)}
                        onVariants={()=>setVariantsLink(link)}
                        onDelete={()=>deleteLink(link.id)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {overview && (
              <>
                {/* Device breakdown */}
                {overview.deviceBreakdown.length > 0 && (
                  <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Smartphone className="w-3.5 h-3.5"/>Device Breakdown</p>
                    <div className="grid grid-cols-2 gap-6">
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie data={overview.deviceBreakdown} dataKey="cnt" nameKey="device_type" cx="50%" cy="50%" outerRadius={60}>
                            {overview.deviceBreakdown.map((_,i) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                          </Pie>
                          <Tooltip contentStyle={{background:'#0f172a',border:'1px solid #334155',borderRadius:'8px',fontSize:'11px'}}/>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-2 self-center">
                        {overview.deviceBreakdown.map((d,i) => (
                          <div key={d.device_type} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{background:PIE_COLORS[i%PIE_COLORS.length]}}/>
                              <span className="text-slate-300 capitalize">{d.device_type||'Unknown'}</span>
                            </div>
                            <span className="text-slate-400">{d.cnt.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Top links */}
                {overview.topLinks.length > 0 && (
                  <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><TrendingUp className="w-3.5 h-3.5"/>Top Links</p>
                    <div className="space-y-2">
                      {overview.topLinks.map((l,i) => (
                        <div key={l.id} className="flex items-center gap-3">
                          <span className="text-xs text-slate-600 w-4">{i+1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <a href={`/s/${l.slug}`} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-400 hover:underline font-mono">{l.slug}</a>
                              <span className="text-sm font-medium text-white">{l.total_clicks.toLocaleString()}</span>
                            </div>
                            {l.title && <p className="text-xs text-slate-500">{l.title}</p>}
                            <div className="mt-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500 rounded-full" style={{width:`${(l.total_clicks/(overview.topLinks[0].total_clicks||1))*100}%`}}/>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Referrers */}
                {overview.referrerBreakdown.length > 0 && (
                  <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Globe className="w-3.5 h-3.5"/>Top Referrers</p>
                    <div className="space-y-1.5">
                      {overview.referrerBreakdown.map(r => (
                        <div key={r.referrer_domain} className="flex items-center justify-between text-sm py-1 border-b border-slate-700/30">
                          <span className="text-slate-300">{r.referrer_domain||'Direct'}</span>
                          <span className="text-slate-400">{r.cnt.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
            {!overview && <p className="text-slate-500 text-sm">No overview data available.</p>}
          </div>
        )}

        {activeTab === 'utm' && <UTMBuilder campaigns={campaigns}/>}
        {activeTab === 'campaigns' && <CampaignsTab campaigns={campaigns} onRefresh={loadAll}/>}
        {activeTab === 'apikeys' && <ApiKeysTab/>}
        {activeTab === 'admin' && <AdminLogsTab/>}
      </div>
    </div>
  );
}
