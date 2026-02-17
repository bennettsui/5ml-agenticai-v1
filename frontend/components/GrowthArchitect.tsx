'use client';

import React, { useState } from 'react';
import {
  TrendingUp, Loader, CheckCircle2, Zap, FileText,
  Mail, LayoutList, FlaskConical, BookOpen, BarChart3,
} from 'lucide-react';

type SubTab = 'builder' | 'reviews' | 'experiments' | 'assets' | 'crm' | 'kb' | 'roas';

const ASSET_TYPES = ['fb_ad', 'gdn_banner', 'sem_ad', 'landing_hero', 'email_body', 'whatsapp', 'video_script'];
const CHANNELS    = ['facebook', 'instagram', 'google', 'linkedin', 'email', 'whatsapp', 'xiaohongshu'];
const PLATFORMS   = ['Instagram', 'Facebook', 'LinkedIn', 'Xiaohongshu', 'WhatsApp'];
const FORMATS     = ['feed_post', 'reel_script', 'carousel', 'story', 'kol_brief'];
const PILLARS     = ['education', 'inspiration', 'social_proof', 'entertainment', 'conversion'];
const TRIGGERS    = ['lead_captured', 'purchase_confirmed', 'trial_started', '7day_inactive', 'assessment_completed', 'cart_abandoned'];
const FLOW_TYPES  = ['lead_nurture', 'post_purchase', 're_engagement', 'upsell', 'weekly_digest'];
const EDM_TYPES   = ['lead_nurture', 're_engagement', 'upsell', 'weekly_update', 'announcement'];

const PRESET_BRANDS = [
  {
    name: 'ikigai Design & Research',
    brief: 'Comprehensive elderly home assessments service. We conduct detailed in-home evaluations assessing safety, accessibility, mobility, cognitive function, and care needs of seniors. Reports provide actionable recommendations for home modifications, care planning, and family discussions about elder care.',
    icp: 'Families of elderly parents (45-65 yo, Hong Kong), healthcare social workers, elder care coordinators',
  },
  {
    name: '5ML Agentic Solution',
    brief: '5ML is a creative + technical growth studio building productized agentic AI systems for growth. End-to-end solutions: agent orchestration, multi-LLM routing, RAG knowledge bases, paid media integration, content generation, CRM automation, and agentic workflow design.',
    icp: 'SaaS founders, marketing agency owners, enterprise growth leads (Hong Kong / SEA / global)',
  },
];

// ---------------------------------------------------------------------------
// Shared brand bar
// ---------------------------------------------------------------------------
function BrandBar({ brandName, setBrandName }: { brandName: string; setBrandName: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2 flex-wrap mb-4">
      <span className="text-xs text-slate-500 uppercase tracking-wide mr-1">Brand:</span>
      {PRESET_BRANDS.map((b) => (
        <button key={b.name} onClick={() => setBrandName(b.name)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            brandName === b.name
              ? 'bg-emerald-500 text-white'
              : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.06] hover:text-slate-300'
          }`}>
          {b.name}
        </button>
      ))}
      <input
        value={!PRESET_BRANDS.find(b => b.name === brandName) ? brandName : ''}
        onChange={(e) => setBrandName(e.target.value)}
        placeholder="or type a brand…"
        className="flex-1 min-w-0 bg-white/[0.02] border border-slate-700/50 rounded-full px-3 py-1 text-xs text-white placeholder-slate-600"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Plan Builder
// ---------------------------------------------------------------------------
function PlanBuilder({ brandName, setBrandName }: { brandName: string; setBrandName: (v: string) => void }) {
  const preset = PRESET_BRANDS.find((b) => b.name === brandName);
  const [productBrief, setProductBrief] = useState(preset?.brief || '');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [error, setError] = useState('');

  React.useEffect(() => {
    const p = PRESET_BRANDS.find((b) => b.name === brandName);
    if (p) setProductBrief(p.brief);
  }, [brandName]);

  const handleGenerate = async () => {
    if (!brandName || !productBrief) { setError('Brand name and product brief are required'); return; }
    setLoading(true); setError('');
    try {
      const r = await fetch('/api/growth/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand_name: brandName, product_brief: productBrief, channels: ['facebook', 'google', 'linkedin', 'email'] }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setPlan(data.data);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-5 space-y-4">
        <BrandBar brandName={brandName} setBrandName={setBrandName} />
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Product Brief</label>
          <textarea value={productBrief} onChange={(e) => setProductBrief(e.target.value)} rows={4}
            className="w-full bg-white/[0.02] border border-slate-700/50 rounded px-3 py-2 text-white placeholder-slate-500 text-sm"
            placeholder="Describe what you sell, key features, target customers…" />
        </div>
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <button onClick={handleGenerate} disabled={loading}
          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">
          {loading ? <><Loader className="w-4 h-4 animate-spin" />Generating 6-block plan…</> : <><Zap className="w-4 h-4" />Generate Full Growth Plan</>}
        </button>
      </div>

      {plan && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-5 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-medium text-white text-sm">6-Block Growth Plan Generated</span>
            {plan.plan_id && <span className="text-xs text-slate-500 ml-auto">ID: {plan.plan_id}</span>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { key: 'block_1', label: 'Block 1 — PMF & ICP',       meta: (b: any) => `${b.icp_segments?.length || 0} ICP segments · ${b.hypotheses?.length || 0} hypotheses` },
              { key: 'block_2', label: 'Block 2 — Funnel & Loops',   meta: (b: any) => `${b.growth_loops?.length || 0} loops · engine: ${b.primary_engine || '—'}` },
              { key: 'block_3', label: 'Block 3 — Assets',           meta: (b: any) => `${b.copy_assets?.length || 0} copy · ${b.social_assets?.length || 0} social` },
              { key: 'block_4', label: 'Block 4 — ROAS & Metrics',   meta: (b: any) => (b.key_kpis || []).slice(0, 3).join(' · ') },
              { key: 'block_5', label: 'Block 5 — Infrastructure',   meta: (b: any) => (b.agents || []).slice(0, 4).join(', ') },
              { key: 'block_6', label: 'Block 6 — Weekly Loop',      meta: (b: any) => b.weekly_schedule || '' },
            ].map(({ key, label, meta }) => {
              const block = plan.plan?.[key];
              if (!block) return null;
              return (
                <div key={key} className="bg-white/[0.02] border border-slate-700/30 rounded p-3">
                  <p className="text-xs font-medium text-emerald-400 mb-1">{label}</p>
                  {block.value_prop && <p className="text-slate-300 text-xs mb-1 line-clamp-2">{block.value_prop}</p>}
                  <p className="text-slate-500 text-xs">{meta(block)}</p>
                </div>
              );
            })}
          </div>
          <details className="bg-white/[0.02] border border-slate-700/30 rounded p-3">
            <summary className="cursor-pointer text-xs text-slate-400 hover:text-slate-300">View raw JSON</summary>
            <pre className="mt-3 text-xs text-slate-300 max-h-72 overflow-auto">{JSON.stringify(plan.plan, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Asset Library
// ---------------------------------------------------------------------------
function AssetLibrary({ brandName, setBrandName }: { brandName: string; setBrandName: (v: string) => void }) {
  const preset = PRESET_BRANDS.find((b) => b.name === brandName);
  const [agentType, setAgentType] = useState<'copy' | 'social'>('copy');
  const [icp, setIcp] = useState(preset?.icp || '');
  const [productBrief, setProductBrief] = useState(preset?.brief || '');
  const [assetType, setAssetType] = useState('fb_ad');
  const [channel, setChannel] = useState('facebook');
  const [funnelStage, setFunnelStage] = useState('awareness');
  const [platform, setPlatform] = useState('Instagram');
  const [format, setFormat] = useState('feed_post');
  const [pillar, setPillar] = useState('education');
  const [theme, setTheme] = useState('');
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [error, setError] = useState('');

  React.useEffect(() => {
    const p = PRESET_BRANDS.find((b) => b.name === brandName);
    if (p) { setIcp(p.icp); setProductBrief(p.brief); }
  }, [brandName]);

  const handleGenerate = async () => {
    if (!brandName || !icp || !productBrief) { setError('Brand, ICP, and product brief required'); return; }
    setLoading(true); setError('');
    try {
      const body = agentType === 'copy'
        ? { brand_name: brandName, agent: 'copy', asset_type: assetType, channel, funnel_stage: funnelStage, icp, product_brief: productBrief, variants: 3 }
        : { brand_name: brandName, agent: 'social', platform, format, icp, product_brief: productBrief, campaign_theme: theme, pillar, count: 2 };
      const r = await fetch('/api/growth/assets/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setGenerated((await r.json()).data);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleLoadAssets = async () => {
    if (!brandName) return;
    try {
      const data = await fetch(`/api/growth/assets/${encodeURIComponent(brandName)}`).then(r => r.json());
      setAssets(data.data || []);
    } catch (e: any) { setError(e.message); }
  };

  const handleApprove = async (id: string) => {
    await fetch(`/api/growth/assets/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved' }),
    });
    setAssets(prev => prev.map(a => a.id === id ? { ...a, status: 'approved' } : a));
  };

  const allVariants = [...(generated?.variants || []), ...(generated?.assets || [])];

  return (
    <div className="space-y-4">
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-5 space-y-4">
        <BrandBar brandName={brandName} setBrandName={setBrandName} />
        <div className="flex gap-2">
          {(['copy', 'social'] as const).map(a => (
            <button key={a} onClick={() => setAgentType(a)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${agentType === a ? 'bg-emerald-500 text-white' : 'bg-white/[0.03] text-slate-400 hover:text-slate-300'}`}>
              {a === 'copy' ? '✏️ Copy Agent (nanobanana)' : '📱 Social Agent'}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">ICP</label>
            <input value={icp} onChange={e => setIcp(e.target.value)}
              className="w-full bg-white/[0.02] border border-slate-700/50 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600"
              placeholder="Target customer persona" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Product Brief</label>
            <input value={productBrief.substring(0, 100)} onChange={e => setProductBrief(e.target.value)}
              className="w-full bg-white/[0.02] border border-slate-700/50 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600"
              placeholder="What the product does…" />
          </div>
        </div>
        {agentType === 'copy' ? (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Asset Type', value: assetType, set: setAssetType, opts: ASSET_TYPES },
              { label: 'Channel', value: channel, set: setChannel, opts: CHANNELS },
              { label: 'Funnel Stage', value: funnelStage, set: setFunnelStage, opts: ['awareness', 'acquisition', 'activation', 'retention', 'referral'] },
            ].map(({ label, value, set, opts }) => (
              <div key={label}>
                <label className="block text-xs text-slate-400 mb-1">{label}</label>
                <select value={value} onChange={e => set(e.target.value)}
                  className="w-full bg-white/[0.02] border border-slate-700/50 rounded px-2.5 py-1.5 text-xs text-white">
                  {opts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Platform', value: platform, set: setPlatform, opts: PLATFORMS },
              { label: 'Format', value: format, set: setFormat, opts: FORMATS },
              { label: 'Pillar', value: pillar, set: setPillar, opts: PILLARS },
            ].map(({ label, value, set, opts }) => (
              <div key={label}>
                <label className="block text-xs text-slate-400 mb-1">{label}</label>
                <select value={value} onChange={e => set(e.target.value)}
                  className="w-full bg-white/[0.02] border border-slate-700/50 rounded px-2.5 py-1.5 text-xs text-white">
                  {opts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Theme</label>
              <input value={theme} onChange={e => setTheme(e.target.value)}
                className="w-full bg-white/[0.02] border border-slate-700/50 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600"
                placeholder="Campaign theme" />
            </div>
          </div>
        )}
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <div className="flex gap-2">
          <button onClick={handleGenerate} disabled={loading}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
            {loading ? <><Loader className="w-4 h-4 animate-spin" />Generating…</> : <><Zap className="w-4 h-4" />Generate Assets</>}
          </button>
          <button onClick={handleLoadAssets}
            className="px-4 py-2 bg-white/[0.03] hover:bg-white/[0.06] border border-slate-700/50 text-slate-400 hover:text-slate-300 rounded-lg text-xs transition-colors">
            Load Saved
          </button>
        </div>
      </div>

      {allVariants.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 uppercase tracking-wide">{allVariants.length} variants generated</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allVariants.map((v: any, i: number) => (
              <div key={i} className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">{v.tag || `V${i+1}`}</span>
                  <span className="text-xs text-slate-500">{v.angle || v.asset_type || ''}</span>
                </div>
                {v.content?.headline && <p className="text-sm font-semibold text-white">{v.content.headline}</p>}
                {v.content?.body && <p className="text-xs text-slate-300 line-clamp-3">{v.content.body}</p>}
                {v.content?.caption && <p className="text-xs text-slate-300 line-clamp-3">{v.content.caption}</p>}
                {v.content?.cta && <p className="text-xs text-emerald-400">CTA: {v.content.cta}</p>}
                {v.content?.hook_line && <p className="text-xs text-slate-500 italic">Hook: {v.content.hook_line}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {assets.length > 0 && (
        <div className="overflow-x-auto">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Saved Assets ({assets.length})</p>
          <table className="w-full text-xs">
            <thead><tr className="border-b border-slate-700/50">
              {['Tag', 'Type', 'Channel', 'Stage', 'Status', ''].map(h => (
                <th key={h} className="text-left px-3 py-2 text-slate-500 font-medium">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {assets.map(a => (
                <tr key={a.id} className="border-b border-slate-700/50 hover:bg-white/[0.02] transition-colors">
                  <td className="px-3 py-2 font-mono text-emerald-400">{a.tag}</td>
                  <td className="px-3 py-2 text-slate-300">{a.asset_type}</td>
                  <td className="px-3 py-2 text-slate-400">{a.channel}</td>
                  <td className="px-3 py-2 text-slate-400">{a.funnel_stage}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded ${a.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-400'}`}>{a.status}</span>
                  </td>
                  <td className="px-3 py-2">
                    {a.status !== 'approved' && (
                      <button onClick={() => handleApprove(a.id)} className="text-emerald-400 hover:text-emerald-300">Approve</button>
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

// ---------------------------------------------------------------------------
// CRM & EDM
// ---------------------------------------------------------------------------
function CrmEdm({ brandName, setBrandName }: { brandName: string; setBrandName: (v: string) => void }) {
  const preset = PRESET_BRANDS.find((b) => b.name === brandName);
  const [icp, setIcp] = useState(preset?.icp || '');
  const [productBrief, setProductBrief] = useState(preset?.brief || '');
  const [section, setSection] = useState<'flow' | 'edm'>('flow');
  const [trigger, setTrigger] = useState('lead_captured');
  const [flowType, setFlowType] = useState('lead_nurture');
  const [segment, setSegment] = useState('all leads');
  const [edmType, setEdmType] = useState('lead_nurture');
  const [theme, setTheme] = useState('');
  const [loading, setLoading] = useState(false);
  const [flowResult, setFlowResult] = useState<any>(null);
  const [edmResult, setEdmResult] = useState<any>(null);
  const [savedFlows, setSavedFlows] = useState<any[]>([]);
  const [savedEdms, setSavedEdms] = useState<any[]>([]);
  const [error, setError] = useState('');

  React.useEffect(() => {
    const p = PRESET_BRANDS.find((b) => b.name === brandName);
    if (p) { setIcp(p.icp); setProductBrief(p.brief); }
  }, [brandName]);

  const handleDesignFlow = async () => {
    if (!brandName || !icp || !productBrief) { setError('Brand, ICP, brief required'); return; }
    setLoading(true); setError('');
    try {
      const r = await fetch('/api/growth/crm-flows', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand_name: brandName, product_brief: productBrief, icp, trigger_event: trigger, audience_segment: segment, flow_type: flowType }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setFlowResult((await r.json()).data);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleGenerateEdm = async () => {
    if (!brandName || !icp || !productBrief) { setError('Brand, ICP, brief required'); return; }
    setLoading(true); setError('');
    try {
      const r = await fetch('/api/growth/edm/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand_name: brandName, product_brief: productBrief, icp, campaign_type: edmType, campaign_theme: theme || edmType }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setEdmResult((await r.json()).data);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleLoadData = async () => {
    if (!brandName) return;
    const bn = encodeURIComponent(brandName);
    const [flowsR, edmsR] = await Promise.all([
      fetch(`/api/growth/crm-flows/${bn}`).then(r => r.json()).catch(() => ({ data: [] })),
      fetch(`/api/growth/edm/${bn}`).then(r => r.json()).catch(() => ({ data: [] })),
    ]);
    setSavedFlows(flowsR.data || []);
    setSavedEdms(edmsR.data || []);
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-5 space-y-4">
        <BrandBar brandName={brandName} setBrandName={setBrandName} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">ICP</label>
            <input value={icp} onChange={e => setIcp(e.target.value)}
              className="w-full bg-white/[0.02] border border-slate-700/50 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Product Brief</label>
            <input value={productBrief.substring(0, 100)} onChange={e => setProductBrief(e.target.value)}
              className="w-full bg-white/[0.02] border border-slate-700/50 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600" />
          </div>
        </div>
        <div className="flex gap-2">
          {(['flow', 'edm'] as const).map(s => (
            <button key={s} onClick={() => setSection(s)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${section === s ? 'bg-emerald-500 text-white' : 'bg-white/[0.03] text-slate-400 hover:text-slate-300'}`}>
              {s === 'flow' ? '🔀 CRM Flow Designer' : '📧 EDM Generator'}
            </button>
          ))}
        </div>
        {section === 'flow' ? (
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Trigger Event</label>
              <select value={trigger} onChange={e => setTrigger(e.target.value)}
                className="w-full bg-white/[0.02] border border-slate-700/50 rounded px-2.5 py-1.5 text-xs text-white">
                {TRIGGERS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Flow Type</label>
              <select value={flowType} onChange={e => setFlowType(e.target.value)}
                className="w-full bg-white/[0.02] border border-slate-700/50 rounded px-2.5 py-1.5 text-xs text-white">
                {FLOW_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Audience Segment</label>
              <input value={segment} onChange={e => setSegment(e.target.value)}
                className="w-full bg-white/[0.02] border border-slate-700/50 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Campaign Type</label>
              <select value={edmType} onChange={e => setEdmType(e.target.value)}
                className="w-full bg-white/[0.02] border border-slate-700/50 rounded px-2.5 py-1.5 text-xs text-white">
                {EDM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Theme / Angle</label>
              <input value={theme} onChange={e => setTheme(e.target.value)}
                className="w-full bg-white/[0.02] border border-slate-700/50 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600"
                placeholder="e.g. Home safety for aging parents" />
            </div>
          </div>
        )}
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <div className="flex gap-2">
          <button onClick={section === 'flow' ? handleDesignFlow : handleGenerateEdm} disabled={loading}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
            {loading ? <><Loader className="w-4 h-4 animate-spin" />Generating…</> : <><Mail className="w-4 h-4" />{section === 'flow' ? 'Design CRM Flow' : 'Generate EDM'}</>}
          </button>
          <button onClick={handleLoadData}
            className="px-4 py-2 bg-white/[0.03] hover:bg-white/[0.06] border border-slate-700/50 text-slate-400 hover:text-slate-300 rounded-lg text-xs transition-colors">
            Load Saved
          </button>
        </div>
      </div>

      {flowResult?.flow?.steps?.length > 0 && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-5">
          <p className="text-sm font-medium text-white mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 inline mr-1" />
            {flowResult.flow?.flow_name || 'CRM Flow'}
          </p>
          <div className="space-y-2">
            {flowResult.flow.steps.map((step: any, i: number) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-medium">{step.step || i + 1}</div>
                  {i < flowResult.flow.steps.length - 1 && <div className="w-px flex-1 bg-slate-700/50 mt-1" />}
                </div>
                <div className="pb-3 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-slate-300">{step.delay}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400">{step.channel}</span>
                  </div>
                  {step.subject && <p className="text-xs text-slate-400">Subject: <span className="text-slate-300">{step.subject}</span></p>}
                  <p className="text-xs text-slate-400">{step.message_brief || step.purpose}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {edmResult?.html_content && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-5">
          <p className="text-sm font-medium text-white mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 inline mr-1" />
            EDM: {edmResult.subject}
          </p>
          <p className="text-xs text-slate-500 mb-3">{edmResult.preview_text}</p>
          <iframe srcDoc={edmResult.html_content} className="w-full rounded border border-slate-700/50 bg-white" style={{ height: 500 }} title="EDM Preview" />
        </div>
      )}

      {(savedFlows.length > 0 || savedEdms.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedFlows.length > 0 && (
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">Saved Flows ({savedFlows.length})</p>
              {savedFlows.map(f => (
                <div key={f.id} className="flex justify-between py-2 border-b border-slate-700/30 last:border-0">
                  <div>
                    <p className="text-xs text-slate-300">{f.flow_name}</p>
                    <p className="text-xs text-slate-500">{f.trigger_event} · {f.audience_segment}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-700/50 text-slate-400 self-start">{f.status}</span>
                </div>
              ))}
            </div>
          )}
          {savedEdms.length > 0 && (
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">EDM Campaigns ({savedEdms.length})</p>
              {savedEdms.map(e => (
                <div key={e.id} className="flex justify-between py-2 border-b border-slate-700/30 last:border-0">
                  <div>
                    <p className="text-xs text-slate-300">{e.campaign_name}</p>
                    <p className="text-xs text-slate-500">{e.campaign_type}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-700/50 text-slate-400 self-start">{e.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Weekly Reviews
// ---------------------------------------------------------------------------
function WeeklyReviews({ brandName, setBrandName }: { brandName: string; setBrandName: (v: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [error, setError] = useState('');

  const load = async () => {
    if (!brandName) { setError('Select a brand first'); return; }
    setLoading(true); setError('');
    try {
      const data = await fetch(`/api/growth/weekly-reviews/${encodeURIComponent(brandName)}`).then(r => r.json());
      setReviews(data.data || []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const triggerReview = async () => {
    if (!brandName) return;
    setTriggering(true);
    try {
      await fetch('/api/growth/weekly-review', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand_name: brandName }),
      });
      await load();
    } catch (e: any) { setError(e.message); }
    finally { setTriggering(false); }
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-5">
        <BrandBar brandName={brandName} setBrandName={setBrandName} />
        {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
        <div className="flex gap-2">
          <button onClick={load} disabled={loading}
            className="px-4 py-2 bg-white/[0.03] hover:bg-white/[0.06] border border-slate-700/50 text-slate-400 hover:text-slate-300 rounded-lg text-xs transition-colors">
            {loading ? 'Loading…' : 'Load Reviews'}
          </button>
          <button onClick={triggerReview} disabled={triggering}
            className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-medium transition-colors">
            {triggering ? 'Generating…' : "⚡ Generate This Week's Review"}
          </button>
        </div>
      </div>
      {reviews.length === 0
        ? <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-8 text-center"><p className="text-slate-400 text-sm">No reviews yet. Generate a plan first, then trigger a weekly review.</p></div>
        : reviews.map(r => (
          <div key={r.id} className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-medium text-white">{r.week_start} → {r.week_end}</p>
              <span className={`text-xs px-2 py-0.5 rounded ${r.status === 'actioned' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-400'}`}>{r.status}</span>
            </div>
            {r.summary?.week_summary && <p className="text-xs text-slate-300 mb-2">{r.summary.week_summary}</p>}
            {r.summary?.recommendations?.length > 0 && (
              <ul className="space-y-1">
                {r.summary.recommendations.slice(0, 3).map((rec: string, i: number) => (
                  <li key={i} className="text-xs text-slate-400 flex gap-2"><span className="text-emerald-500">→</span>{rec}</li>
                ))}
              </ul>
            )}
          </div>
        ))
      }
    </div>
  );
}

// ---------------------------------------------------------------------------
// Experiments
// ---------------------------------------------------------------------------
function Experiments({ brandName, setBrandName }: { brandName: string; setBrandName: (v: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [experiments, setExperiments] = useState<any[]>([]);
  const [error, setError] = useState('');

  const load = async () => {
    if (!brandName) { setError('Select a brand first'); return; }
    setLoading(true); setError('');
    try {
      const data = await fetch(`/api/growth/experiments/${encodeURIComponent(brandName)}`).then(r => r.json());
      setExperiments(data.data || []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/growth/experiments/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setExperiments(prev => prev.map(e => e.id === id ? { ...e, status } : e));
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-5">
        <BrandBar brandName={brandName} setBrandName={setBrandName} />
        {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
        <button onClick={load} disabled={loading}
          className="px-4 py-2 bg-white/[0.03] hover:bg-white/[0.06] border border-slate-700/50 text-slate-400 hover:text-slate-300 rounded-lg text-xs transition-colors">
          {loading ? 'Loading…' : 'Load Experiments'}
        </button>
      </div>
      {experiments.length === 0
        ? <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-8 text-center"><p className="text-slate-400 text-sm">No experiments yet. Generate a growth plan to create hypotheses!</p></div>
        : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-slate-700/50">
                {['Hypothesis', 'Channel', 'Status', 'Tags', ''].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-slate-500 font-medium">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {experiments.map(exp => (
                  <tr key={exp.id} className="border-b border-slate-700/50 hover:bg-white/[0.02] transition-colors">
                    <td className="px-3 py-3 text-slate-300 max-w-xs">{exp.hypothesis.substring(0, 70)}…</td>
                    <td className="px-3 py-3 text-slate-400">{exp.channel || '—'}</td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded ${exp.status === 'running' ? 'bg-blue-500/20 text-blue-400' : exp.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-400'}`}>{exp.status}</span>
                    </td>
                    <td className="px-3 py-3 text-slate-500">{exp.tags?.join(', ') || '—'}</td>
                    <td className="px-3 py-3">
                      {exp.status === 'pending' && <button onClick={() => updateStatus(exp.id, 'running')} className="text-blue-400 hover:text-blue-300 mr-2">▶ Run</button>}
                      {exp.status === 'running' && <button onClick={() => updateStatus(exp.id, 'completed')} className="text-emerald-400 hover:text-emerald-300">✓ Done</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
    </div>
  );
}

// ---------------------------------------------------------------------------
// Knowledge Base Browser
// ---------------------------------------------------------------------------
function KnowledgeBase({ brandName }: { brandName: string }) {
  const [kb, setKb] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleLoad = async () => {
    if (!brandName) { setError('Brand name required'); return; }
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (searchQuery) params.append('search', searchQuery);
      const r = await fetch(`/api/growth/kb/${brandName}?${params}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setKb(data.data || []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-5 space-y-4">
        <div className="flex items-center gap-3">
          <BookOpen className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-medium text-slate-400">BRAND: {brandName || 'N/A'}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="bg-white/[0.02] border border-slate-700/50 rounded px-3 py-2 text-white text-xs">
            <option value="">All categories</option>
            <option value="icp">ICP Segments</option>
            <option value="experiment">Growth Loops</option>
            <option value="playbook">Playbooks</option>
            <option value="performance">Performance</option>
          </select>
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search KB…"
            className="bg-white/[0.02] border border-slate-700/50 rounded px-3 py-2 text-white placeholder-slate-600 text-xs" />
        </div>
        <button onClick={handleLoad} disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors">
          {loading ? 'Searching…' : 'Search KB'}
        </button>
        {error && <p className="text-red-400 text-xs">{error}</p>}
      </div>

      {kb.length === 0
        ? <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-8 text-center"><p className="text-slate-400 text-sm">No KB entries yet. Generate a growth plan to seed KB!</p></div>
        : (
          <div className="space-y-3">
            {kb.map(entry => (
              <div key={entry.id} className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <span className="inline-block bg-slate-700/50 text-slate-300 text-xs px-2 py-0.5 rounded mb-2">{entry.category}</span>
                    <h3 className="text-sm font-medium text-white mb-1">{entry.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{typeof entry.content === 'string' ? entry.content.substring(0, 150) : JSON.stringify(entry.content).substring(0, 150)}…</p>
                  </div>
                  <button onClick={() => setKb(kb.filter(e => e.id !== entry.id))}
                    className="ml-3 text-xs text-red-400 hover:text-red-300">Remove</button>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}

// ---------------------------------------------------------------------------
// ROAS Financial Modeling
// ---------------------------------------------------------------------------
function RoasModeling({ brandName }: { brandName: string }) {
  const [productBrief, setProductBrief] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [spendMultiplier, setSpendMultiplier] = useState(1);

  const handleAnalyze = async () => {
    if (!brandName || !productBrief) { setError('Brand name and product brief required'); return; }
    setLoading(true); setError('');
    try {
      const r = await fetch('/api/growth/roas/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand_name: brandName, product_brief: productBrief }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setAnalysis(data.analysis);
      setScenarios(data.scenarios || []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const baseData = analysis?.historical_data?.summary;
  const customScenario = baseData ? {
    spend_multiplier: spendMultiplier,
    projected_spend: (baseData.total_spend || 0) * spendMultiplier,
    projected_roas: (baseData.overall_roas || 0) * (1 - 0.05 * Math.log(spendMultiplier + 1) / Math.log(2)),
    projected_revenue: ((baseData.total_spend || 0) * spendMultiplier) * ((baseData.overall_roas || 0) * (1 - 0.05 * Math.log(spendMultiplier + 1) / Math.log(2))),
  } : null;

  return (
    <div className="space-y-4">
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-5 space-y-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-4 h-4 text-orange-400" />
          <span className="text-xs font-medium text-slate-400">BRAND: {brandName || 'N/A'}</span>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Product Brief</label>
          <textarea value={productBrief} onChange={(e) => setProductBrief(e.target.value)} rows={3}
            className="w-full bg-white/[0.02] border border-slate-700/50 rounded px-3 py-2 text-white placeholder-slate-500 text-sm"
            placeholder="Describe your product for ROAS modeling…" />
        </div>
        <button onClick={handleAnalyze} disabled={loading}
          className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-medium transition-colors">
          {loading ? 'Analyzing…' : 'Analyze & Model'}
        </button>
        {error && <p className="text-red-400 text-xs">{error}</p>}
      </div>

      {analysis && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4">
              <p className="text-xs text-slate-400">Base ROAS</p>
              <p className="text-lg font-bold text-emerald-400">{(baseData?.overall_roas || 0).toFixed(2)}x</p>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4">
              <p className="text-xs text-slate-400">Total Spend (90d)</p>
              <p className="text-lg font-bold text-blue-400">${(baseData?.total_spend || 0).toFixed(0)}</p>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4">
              <p className="text-xs text-slate-400">Total Revenue</p>
              <p className="text-lg font-bold text-emerald-400">${(baseData?.total_revenue || 0).toFixed(0)}</p>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-5 space-y-4">
            <h3 className="text-sm font-medium text-white">Spending Scenarios</h3>
            {scenarios.map((s, idx) => (
              <div key={idx} className="p-3 bg-white/[0.02] border border-slate-700/30 rounded">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-slate-400">{s.spend_multiplier}x Spend</span>
                  <span className="text-sm font-bold text-emerald-400">${s.projected_revenue.toFixed(0)}</span>
                </div>
                <div className="w-full bg-slate-700/50 rounded-full h-1.5">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min((s.profit_margin_pct || 0) / 100 * 100, 100)}%` }}></div>
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1.5">
                  <span>ROAS: {s.projected_roas.toFixed(2)}x</span>
                  <span>Profit: {(s.profit_margin_pct || 0).toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>

          {customScenario && (
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-5 space-y-4">
              <h3 className="text-sm font-medium text-white">Custom Spend Slider</h3>
              <input type="range" min="0.5" max="5" step="0.1" value={spendMultiplier}
                onChange={(e) => setSpendMultiplier(parseFloat(e.target.value))}
                className="w-full" />
              <p className="text-xs text-slate-400">Multiplier: {spendMultiplier.toFixed(1)}x current spend</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white/[0.02] border border-slate-700/30 rounded">
                  <p className="text-xs text-slate-400">Projected Spend</p>
                  <p className="text-lg font-bold text-blue-400">${customScenario.projected_spend.toFixed(0)}</p>
                </div>
                <div className="p-3 bg-white/[0.02] border border-slate-700/30 rounded">
                  <p className="text-xs text-slate-400">Projected Revenue</p>
                  <p className="text-lg font-bold text-emerald-400">${customScenario.projected_revenue.toFixed(0)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------
export default function GrowthArchitect() {
  const [activeTab, setActiveTab] = useState<SubTab>('builder');
  const [brandName, setBrandName] = useState('ikigai Design & Research');

  const tabs = [
    { id: 'builder'     as SubTab, label: 'Plan Builder',   icon: Zap },
    { id: 'assets'      as SubTab, label: 'Asset Library',  icon: FileText },
    { id: 'crm'         as SubTab, label: 'CRM & EDM',      icon: Mail },
    { id: 'kb'          as SubTab, label: 'KB Browser',     icon: BookOpen },
    { id: 'roas'        as SubTab, label: 'ROAS Model',     icon: BarChart3 },
    { id: 'reviews'     as SubTab, label: 'Weekly Reviews', icon: LayoutList },
    { id: 'experiments' as SubTab, label: 'Experiments',    icon: FlaskConical },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <TrendingUp className="w-7 h-7 text-emerald-500" />
        <div>
          <h2 className="text-xl font-bold text-white">Growth Architect</h2>
          <p className="text-slate-500 text-xs">6-block agentic growth system · nanobanana · social content · CRM/EDM</p>
        </div>
        <div className="ml-auto flex gap-2">
          {PRESET_BRANDS.map(b => (
            <button key={b.name} onClick={() => setBrandName(b.name)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${brandName === b.name ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10' : 'border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-400'}`}>
              {b.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-1 border-b border-slate-700/50">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === id ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500 hover:text-slate-300'
            }`}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      {activeTab === 'builder'     && <PlanBuilder   brandName={brandName} setBrandName={setBrandName} />}
      {activeTab === 'assets'      && <AssetLibrary  brandName={brandName} setBrandName={setBrandName} />}
      {activeTab === 'crm'         && <CrmEdm        brandName={brandName} setBrandName={setBrandName} />}
      {activeTab === 'kb'          && <KnowledgeBase brandName={brandName} />}
      {activeTab === 'roas'        && <RoasModeling  brandName={brandName} />}
      {activeTab === 'reviews'     && <WeeklyReviews brandName={brandName} setBrandName={setBrandName} />}
      {activeTab === 'experiments' && <Experiments   brandName={brandName} setBrandName={setBrandName} />}
    </div>
  );
}
