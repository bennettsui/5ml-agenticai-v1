'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Package, BarChart3, Users, LogOut, Search, Plus,
  AlertTriangle, CheckCircle, Clock, TrendingUp, DollarSign, Globe,
  X, ChevronDown, Activity, ShieldCheck, AlignLeft,
  Calendar, Mail, Phone, RefreshCw, Download, Boxes,
  Eye, Star, Tag, Flame, Edit2, ChevronRight, Layers,
  ArrowUpDown, MoreHorizontal, FileText, Settings, ImagePlus, Trash2, Upload,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────
type TabId = 'overview' | 'products' | 'inventory' | 'leads' | 'reports';
type LeadStatus = 'new' | 'contacted' | 'quoting' | 'negotiation' | 'won' | 'lost';

interface Lead {
  id: string;
  lead_no: string;
  status: LeadStatus;
  customer_name: string;
  customer_email: string;
  region_code: string;
  estimated_value: number | null;
  currency_code: string;
  item_count: number;
  assigned_to_name: string | null;
  created_at: string;
  updated_at: string;
}

interface StockRow {
  sku: string;
  brand_name: string;
  series: string;
  region_code: string;
  location_name: string;
  quantity: number;
  reserved_qty: number;
  available_qty: number;
  reorder_point: number;
  is_low_stock: boolean;
}

interface ProductRow {
  id: string;
  sku: string;
  brand_name: string;
  series: string;
  vitola: string;
  packaging_qty: number;
  strength: string;
  is_active: boolean;
  is_limited_edition: boolean;
  tags: string[];
}

interface ProductImage {
  id: string;
  url: string;
  is_primary: boolean;
  alt_text: string;
  filename: string;
  size_bytes: number;
}

interface MovementForm {
  movement_type: string;
  sku: string;
  location: string;
  quantity: string;
  reference_no: string;
  notes: string;
}

// ─── Palette ────────────────────────────────────────────────────────────────────
const C = {
  bg:       '#0a0807',
  sidebar:  '#0f0d0b',
  card:     'rgba(255,255,255,0.03)',
  cardHov:  'rgba(255,255,255,0.055)',
  border:   'rgba(212,175,55,0.12)',
  borderSub:'rgba(255,255,255,0.06)',
  gold:     '#D4AF37',
  goldDim:  '#9b7347',
  text:     '#e8dcc8',
  muted:    '#9b8c72',
  dim:      '#5c5040',
};

const STATUS_META: Record<LeadStatus, { label: string; color: string; bg: string }> = {
  new:         { label: 'New',         color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
  contacted:   { label: 'Contacted',   color: '#60a5fa', bg: 'rgba(96,165,250,0.12)'  },
  quoting:     { label: 'Quoting',     color: '#fbbf24', bg: 'rgba(251,191,36,0.12)'  },
  negotiation: { label: 'Negotiation', color: '#f97316', bg: 'rgba(249,115,22,0.12)'  },
  won:         { label: 'Won',         color: '#4ade80', bg: 'rgba(74,222,128,0.12)'  },
  lost:        { label: 'Lost',        color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
};

const LEAD_COLUMNS: LeadStatus[] = ['new', 'contacted', 'quoting', 'negotiation', 'won', 'lost'];

// ─── Mock Data ─────────────────────────────────────────────────────────────────
const MOCK_LEADS: Lead[] = [
  { id: '1', lead_no: 'LEAD-HK-2026-00001', status: 'quoting',     customer_name: 'Mr. David Chen',    customer_email: 'dchen@hkfinance.com',    region_code: 'HK', estimated_value: 48600,  currency_code: 'HKD', item_count: 3, assigned_to_name: 'Sarah Lam',    created_at: '2026-03-08T09:00:00Z', updated_at: '2026-03-10T14:30:00Z' },
  { id: '2', lead_no: 'LEAD-HK-2026-00002', status: 'negotiation', customer_name: 'Mrs. Grace Wong',   customer_email: 'grace.wong@luxehk.com',  region_code: 'HK', estimated_value: 126000, currency_code: 'HKD', item_count: 5, assigned_to_name: 'Michael Ng',   created_at: '2026-03-05T11:20:00Z', updated_at: '2026-03-11T09:00:00Z' },
  { id: '3', lead_no: 'LEAD-SG-2026-00001', status: 'new',         customer_name: 'Mr. Rajan Patel',   customer_email: 'rajan@sgcapital.sg',     region_code: 'SG', estimated_value: null,   currency_code: 'SGD', item_count: 0, assigned_to_name: null,            created_at: '2026-03-11T07:45:00Z', updated_at: '2026-03-11T07:45:00Z' },
  { id: '4', lead_no: 'LEAD-HK-2026-00003', status: 'won',         customer_name: 'Dr. James Liu',     customer_email: 'jliu@privatebank.hk',   region_code: 'HK', estimated_value: 89400,  currency_code: 'HKD', item_count: 4, assigned_to_name: 'Sarah Lam',    created_at: '2026-02-20T10:00:00Z', updated_at: '2026-03-07T16:00:00Z' },
  { id: '5', lead_no: 'LEAD-EU-2026-00001', status: 'contacted',   customer_name: 'Mr. Franz Weber',   customer_email: 'f.weber@zurichwealth.ch',region_code: 'EU', estimated_value: 42000,  currency_code: 'EUR', item_count: 2, assigned_to_name: 'Pierre Dubois', created_at: '2026-03-09T14:00:00Z', updated_at: '2026-03-10T10:30:00Z' },
  { id: '6', lead_no: 'LEAD-SG-2026-00002', status: 'lost',        customer_name: 'Mr. Vincent Tan',   customer_email: 'vtan@sg-corp.sg',        region_code: 'SG', estimated_value: 28000,  currency_code: 'SGD', item_count: 2, assigned_to_name: 'Michael Ng',   created_at: '2026-02-28T09:00:00Z', updated_at: '2026-03-05T12:00:00Z' },
  { id: '7', lead_no: 'LEAD-HK-2026-00004', status: 'quoting',     customer_name: 'Mr. Albert Ho',     customer_email: 'aho@conglomerate.hk',   region_code: 'HK', estimated_value: 22000,  currency_code: 'HKD', item_count: 1, assigned_to_name: 'Sarah Lam',    created_at: '2026-03-10T16:00:00Z', updated_at: '2026-03-11T08:00:00Z' },
  { id: '8', lead_no: 'LEAD-EU-2026-00002', status: 'contacted',   customer_name: 'Ms. Isabella Rossi',customer_email: 'i.rossi@milanprivate.it',region_code: 'EU', estimated_value: 58500,  currency_code: 'EUR', item_count: 3, assigned_to_name: 'Pierre Dubois', created_at: '2026-03-07T13:00:00Z', updated_at: '2026-03-09T17:00:00Z' },
];

const MOCK_STOCK: StockRow[] = [
  { sku: 'COH-50A-TH',  brand_name: 'Cohiba',         series: '50th Aniversario Travel Humidor', region_code: 'HK', location_name: 'CENTRAL Sanyard',       quantity: 8,  reserved_qty: 2, available_qty: 6,  reorder_point: 3, is_low_stock: false },
  { sku: 'COH-S6-25',   brand_name: 'Cohiba',         series: 'Siglo VI (25)',                   region_code: 'HK', location_name: 'CENTRAL Sanyard',       quantity: 12, reserved_qty: 1, available_qty: 11, reorder_point: 5, is_low_stock: false },
  { sku: 'COH-ROB-25',  brand_name: 'Cohiba',         series: 'Robustos',                        region_code: 'HK', location_name: 'CENTRAL Sanyard',       quantity: 4,  reserved_qty: 0, available_qty: 4,  reorder_point: 5, is_low_stock: true  },
  { sku: 'MON-NO2-25',  brand_name: 'Montecristo',    series: 'No. 2',                           region_code: 'HK', location_name: 'CENTRAL Sanyard',       quantity: 18, reserved_qty: 3, available_qty: 15, reorder_point: 8, is_low_stock: false },
  { sku: 'PAR-LUS-25',  brand_name: 'Partagás',       series: 'Lusitanias',                      region_code: 'HK', location_name: 'CENTRAL Sanyard',       quantity: 3,  reserved_qty: 1, available_qty: 2,  reorder_point: 4, is_low_stock: true  },
  { sku: 'BOL-BEL-25',  brand_name: 'Bolivar',        series: 'Belicosos Finos',                 region_code: 'HK', location_name: 'CENTRAL Sanyard',       quantity: 9,  reserved_qty: 0, available_qty: 9,  reorder_point: 4, is_low_stock: false },
  { sku: 'COH-S6-25',   brand_name: 'Cohiba',         series: 'Siglo VI (25)',                   region_code: 'SG', location_name: 'Raffles Hotel Boutique', quantity: 6,  reserved_qty: 0, available_qty: 6,  reorder_point: 3, is_low_stock: false },
  { sku: 'MON-NO2-25',  brand_name: 'Montecristo',    series: 'No. 2',                           region_code: 'SG', location_name: 'Raffles Hotel Boutique', quantity: 5,  reserved_qty: 0, available_qty: 5,  reorder_point: 3, is_low_stock: false },
  { sku: 'ROM-CEL-25',  brand_name: 'Romeo y Julieta',series: 'Celestino Vega LCDH',             region_code: 'EU', location_name: 'Geneva Boutique',       quantity: 5,  reserved_qty: 1, available_qty: 4,  reorder_point: 3, is_low_stock: false },
  { sku: 'MON-NO2-25',  brand_name: 'Montecristo',    series: 'No. 2',                           region_code: 'EU', location_name: 'Geneva Boutique',       quantity: 2,  reserved_qty: 0, available_qty: 2,  reorder_point: 5, is_low_stock: true  },
  { sku: 'TRI-REC-12',  brand_name: 'Trinidad',       series: 'Reyes',                           region_code: 'EU', location_name: 'Geneva Boutique',       quantity: 3,  reserved_qty: 0, available_qty: 3,  reorder_point: 2, is_low_stock: false },
];

const MOCK_PRODUCTS: ProductRow[] = [
  { id: '1',  sku: 'BOL-HAM-25',   brand_name: 'Bolivar',          series: 'Hamaki',                    vitola: 'Hamaki',       packaging_qty: 25, strength: 'full',   is_active: true,  is_limited_edition: true,  tags: ['LE']         },
  { id: '2',  sku: 'BOL-BEL-25',   brand_name: 'Bolivar',          series: 'Belicosos Finos',           vitola: 'Belicoso',     packaging_qty: 25, strength: 'full',   is_active: true,  is_limited_edition: false, tags: []             },
  { id: '3',  sku: 'COH-S6T-15',   brand_name: 'Cohiba',           series: 'Siglo VI Tubos',            vitola: 'Gran Corona',  packaging_qty: 15, strength: 'medium', is_active: true,  is_limited_edition: false, tags: ['Tubos']      },
  { id: '4',  sku: 'COH-ROB-25',   brand_name: 'Cohiba',           series: 'Robustos',                  vitola: 'Robusto',      packaging_qty: 25, strength: 'medium', is_active: true,  is_limited_edition: false, tags: []             },
  { id: '5',  sku: 'COH-S6-10',    brand_name: 'Cohiba',           series: 'Siglo VI',                  vitola: 'Gran Corona',  packaging_qty: 10, strength: 'medium', is_active: true,  is_limited_edition: false, tags: []             },
  { id: '6',  sku: 'COH-S6-25',    brand_name: 'Cohiba',           series: 'Siglo VI',                  vitola: 'Gran Corona',  packaging_qty: 25, strength: 'medium', is_active: true,  is_limited_edition: false, tags: []             },
  { id: '7',  sku: 'COH-50A-TH',   brand_name: 'Cohiba',           series: '50th Aniversario TH',       vitola: 'Various',      packaging_qty: 40, strength: 'medium', is_active: true,  is_limited_edition: true,  tags: ['LE','TH']    },
  { id: '8',  sku: 'CUA-GEN-25',   brand_name: 'Cuaba',            series: 'Generosos',                 vitola: 'Perfecto',     packaging_qty: 25, strength: 'medium', is_active: true,  is_limited_edition: false, tags: []             },
  { id: '9',  sku: 'ERD-CAS-25',   brand_name: 'El Rey del Mundo', series: 'Cañonazo',                  vitola: 'Cañonazo',     packaging_qty: 25, strength: 'mild',   is_active: true,  is_limited_edition: false, tags: []             },
  { id: '10', sku: 'HOY-EPI2-25',  brand_name: 'Hoyo de Monterrey',series: 'Epicure No.2',              vitola: 'Robusto',      packaging_qty: 25, strength: 'mild',   is_active: true,  is_limited_edition: false, tags: []             },
  { id: '11', sku: 'HUP-MAG-50',   brand_name: 'H. Upmann',        series: 'Magnum 50',                 vitola: 'Robusto Extra',packaging_qty: 50, strength: 'medium', is_active: true,  is_limited_edition: false, tags: []             },
  { id: '12', sku: 'MON-NO2-25',   brand_name: 'Montecristo',      series: 'No. 2',                     vitola: 'Piramide',     packaging_qty: 25, strength: 'medium', is_active: true,  is_limited_edition: false, tags: []             },
  { id: '13', sku: 'PAR-LUS-25',   brand_name: 'Partagás',         series: 'Lusitanias',                vitola: 'Prominente',   packaging_qty: 25, strength: 'full',   is_active: true,  is_limited_edition: false, tags: []             },
  { id: '14', sku: 'PAR-ELS-25',   brand_name: 'Partagás',         series: 'E.L. Salomones 2022',       vitola: 'Gran Piramide',packaging_qty: 25, strength: 'full',   is_active: true,  is_limited_edition: true,  tags: ['EL']         },
  { id: '15', sku: 'ROM-CEL-25',   brand_name: 'Romeo y Julieta',  series: 'Celestino Vega LCDH',       vitola: 'Hermoso No.4', packaging_qty: 25, strength: 'medium', is_active: true,  is_limited_edition: false, tags: ['LCDH']       },
  { id: '16', sku: 'TRI-REC-12',   brand_name: 'Trinidad',         series: 'Reyes',                     vitola: 'Laguito No.1', packaging_qty: 12, strength: 'medium', is_active: true,  is_limited_edition: false, tags: []             },
];

// ─── Helpers ────────────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-HK', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtValue(v: number | null, currency: string) {
  if (!v) return '—';
  const sym = currency === 'HKD' ? 'HK$' : currency === 'EUR' ? '€' : 'S$';
  return `${sym}${v.toLocaleString()}`;
}
function strengthColor(s: string) {
  return s === 'full' ? '#ef4444' : s === 'medium' ? '#f59e0b' : '#22c55e';
}

// ─── Sub-components ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: LeadStatus }) {
  const m = STATUS_META[status];
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
      style={{ color: m.color, background: m.bg, fontFamily: 'sans-serif' }}>
      {m.label}
    </span>
  );
}

function KpiCard({ icon: Icon, label, value, sub, highlight }: { icon: React.ElementType; label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg p-5 border" style={{ background: C.card, borderColor: highlight ? C.border : C.borderSub }}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs tracking-widest uppercase" style={{ color: C.muted, fontFamily: 'sans-serif' }}>{label}</span>
        <Icon className="w-4 h-4" style={{ color: highlight ? C.gold : C.muted }} />
      </div>
      <div className="text-2xl font-light" style={{ color: highlight ? C.gold : C.text, fontFamily: "'Georgia', serif" }}>{value}</div>
      {sub && <div className="mt-1 text-xs" style={{ color: C.dim, fontFamily: 'sans-serif' }}>{sub}</div>}
    </div>
  );
}

// ─── Overview Panel ──────────────────────────────────────────────────────────────
function OverviewPanel({ leads, stock }: { leads: Lead[]; stock: StockRow[] }) {
  const activePipeline = leads
    .filter(l => !['won','lost'].includes(l.status))
    .reduce((s, l) => s + (l.estimated_value || 0), 0);
  const wonThisMonth = leads.filter(l => l.status === 'won').reduce((s, l) => s + (l.estimated_value || 0), 0);
  const lowStock = stock.filter(s => s.is_low_stock);
  const recentLeads = [...leads].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Package}     label="Total SKUs"       value="49"                                   sub="Across 16 brands"           highlight />
        <KpiCard icon={Users}       label="Active Leads"     value={String(leads.filter(l => !['won','lost'].includes(l.status)).length)} sub="Open pipeline" />
        <KpiCard icon={DollarSign}  label="Pipeline Value"   value={`HK$${(activePipeline/1000).toFixed(0)}k`} sub="Excl. EUR/SGD"       highlight />
        <KpiCard icon={TrendingUp}  label="Won (30d)"        value={`HK$${(wonThisMonth/1000).toFixed(0)}k`}   sub="Closed deals"       />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 rounded-lg border overflow-hidden" style={{ borderColor: C.borderSub, background: C.card }}>
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: C.borderSub }}>
            <span className="text-sm tracking-wider uppercase" style={{ color: C.muted, fontFamily: 'sans-serif' }}>Recent Leads</span>
            <span className="text-xs" style={{ color: C.dim, fontFamily: 'sans-serif' }}>Updated ↓</span>
          </div>
          <div className="divide-y" style={{ borderColor: C.borderSub }}>
            {recentLeads.map(lead => (
              <div key={lead.id} className="px-5 py-3 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate" style={{ color: C.text, fontFamily: "'Georgia', serif" }}>{lead.customer_name}</div>
                  <div className="text-xs mt-0.5" style={{ color: C.muted, fontFamily: 'sans-serif' }}>{lead.lead_no} · {lead.region_code}</div>
                </div>
                <StatusBadge status={lead.status} />
                <div className="text-sm text-right" style={{ color: C.gold, fontFamily: 'sans-serif' }}>
                  {fmtValue(lead.estimated_value, lead.currency_code)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: lowStock.length ? 'rgba(251,191,36,0.25)' : C.borderSub, background: C.card }}>
          <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: C.borderSub }}>
            <AlertTriangle className="w-4 h-4" style={{ color: lowStock.length ? '#fbbf24' : C.muted }} />
            <span className="text-sm tracking-wider uppercase" style={{ color: C.muted, fontFamily: 'sans-serif' }}>
              Low Stock ({lowStock.length})
            </span>
          </div>
          {lowStock.length === 0 ? (
            <div className="px-5 py-6 text-center">
              <CheckCircle className="w-8 h-8 mx-auto mb-2" style={{ color: '#4ade80' }} />
              <div className="text-xs" style={{ color: C.muted, fontFamily: 'sans-serif' }}>All stock levels healthy</div>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: C.borderSub }}>
              {lowStock.map((s, i) => (
                <div key={i} className="px-5 py-3">
                  <div className="text-xs font-medium" style={{ color: C.text, fontFamily: 'sans-serif' }}>{s.sku}</div>
                  <div className="text-xs mt-0.5" style={{ color: C.muted, fontFamily: 'sans-serif' }}>{s.location_name} · {s.region_code}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="text-xs" style={{ color: '#fbbf24', fontFamily: 'sans-serif' }}>
                      {s.available_qty} avail / reorder at {s.reorder_point}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Region Breakdown */}
      <div className="rounded-lg border p-5" style={{ borderColor: C.borderSub, background: C.card }}>
        <div className="text-xs tracking-widest uppercase mb-4" style={{ color: C.muted, fontFamily: 'sans-serif' }}>Lead Pipeline by Region</div>
        <div className="grid grid-cols-3 gap-6">
          {['HK','SG','EU'].map(region => {
            const rLeads = leads.filter(l => l.region_code === region && !['won','lost'].includes(l.status));
            const rValue = rLeads.reduce((s, l) => s + (l.estimated_value || 0), 0);
            return (
              <div key={region} className="text-center">
                <div className="text-xs tracking-widest uppercase mb-1" style={{ color: C.muted, fontFamily: 'sans-serif' }}>{region}</div>
                <div className="text-lg font-light" style={{ color: C.gold, fontFamily: "'Georgia', serif" }}>{rLeads.length}</div>
                <div className="text-xs" style={{ color: C.dim, fontFamily: 'sans-serif' }}>{rValue > 0 ? fmtValue(rValue, region === 'EU' ? 'EUR' : region === 'SG' ? 'SGD' : 'HKD') : '—'}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Products Panel ──────────────────────────────────────────────────────────────
function ProductsPanel({ products, token }: { products: ProductRow[]; token: string }) {
  const [q, setQ] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [strengthFilter, setStrengthFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [images, setImages] = useState<Record<string, ProductImage[]>>({});
  const [loadingImages, setLoadingImages] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingForId, setUploadingForId] = useState<string | null>(null);

  const brands = [...new Set(products.map(p => p.brand_name))].sort();

  const filtered = products.filter(p => {
    if (brandFilter && p.brand_name !== brandFilter) return false;
    if (strengthFilter && p.strength !== strengthFilter) return false;
    if (q && !`${p.sku} ${p.brand_name} ${p.series} ${p.vitola}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const loadImages = async (productId: string) => {
    if (images[productId]) return; // already loaded
    setLoadingImages(productId);
    try {
      const res = await fetch(`/api/arrisonapps/v1/products/${productId}`);
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setImages(prev => ({ ...prev, [productId]: data.images || [] }));
    } catch {
      setImages(prev => ({ ...prev, [productId]: [] }));
    } finally {
      setLoadingImages(null);
    }
  };

  const toggleExpand = (productId: string) => {
    if (expandedId === productId) {
      setExpandedId(null);
    } else {
      setExpandedId(productId);
      loadImages(productId);
    }
    setUploadError(null);
  };

  const handleUpload = async (productId: string, file: File) => {
    setUploading(productId);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('alt_text', file.name.replace(/\.[^.]+$/, ''));
      const res = await fetch(`/api/arrisonapps/v1/admin/products/${productId}/images`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Upload failed (${res.status})`);
      }
      const data = await res.json();
      const newImage: ProductImage = {
        id: data.id,
        url: data.url,
        is_primary: images[productId]?.length === 0,
        alt_text: file.name.replace(/\.[^.]+$/, ''),
        filename: file.name,
        size_bytes: file.size,
      };
      setImages(prev => ({ ...prev, [productId]: [...(prev[productId] || []), newImage] }));
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(null);
      setUploadingForId(null);
    }
  };

  const handleDelete = async (productId: string, imageId: string) => {
    if (!confirm('Delete this image?')) return;
    setDeletingImageId(imageId);
    try {
      await fetch(`/api/arrisonapps/v1/admin/products/${productId}/images/${imageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setImages(prev => ({ ...prev, [productId]: prev[productId].filter(i => i.id !== imageId) }));
    } catch { /* ignore */ }
    finally { setDeletingImageId(null); }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: C.muted }} />
          <input
            value={q} onChange={e => setQ(e.target.value)}
            placeholder="Search SKU, brand, series…"
            className="w-full pl-9 pr-4 py-2 rounded text-sm outline-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.borderSub}`, color: C.text, fontFamily: 'sans-serif' }}
          />
        </div>
        <select
          value={brandFilter} onChange={e => setBrandFilter(e.target.value)}
          className="px-3 py-2 rounded text-sm outline-none"
          style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.borderSub}`, color: brandFilter ? C.text : C.muted, fontFamily: 'sans-serif' }}
        >
          <option value="">All Brands</option>
          {brands.map(b => <option key={b} value={b} style={{ background: '#1a1612' }}>{b}</option>)}
        </select>
        <select
          value={strengthFilter} onChange={e => setStrengthFilter(e.target.value)}
          className="px-3 py-2 rounded text-sm outline-none"
          style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.borderSub}`, color: strengthFilter ? C.text : C.muted, fontFamily: 'sans-serif' }}
        >
          <option value="">All Strengths</option>
          <option value="mild" style={{ background: '#1a1612' }}>Mild</option>
          <option value="medium" style={{ background: '#1a1612' }}>Medium</option>
          <option value="full" style={{ background: '#1a1612' }}>Full</option>
        </select>
        <div className="text-xs ml-auto" style={{ color: C.muted, fontFamily: 'sans-serif' }}>
          {filtered.length} of {products.length} SKUs
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file && uploadingForId) handleUpload(uploadingForId, file);
          e.target.value = '';
        }}
      />

      {/* Table */}
      <div className="rounded-lg border overflow-hidden" style={{ borderColor: C.borderSub }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: C.borderSub, background: 'rgba(255,255,255,0.02)' }}>
              {['','SKU','Brand','Series / Vitola','Pack','Strength','Tags','Status'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs tracking-wider uppercase" style={{ color: C.muted, fontFamily: 'sans-serif' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const isExpanded = expandedId === p.id;
              const productImages = images[p.id] || [];
              return (
                <>
                  <tr key={p.id} className="transition-colors border-b"
                    style={{ borderColor: C.borderSub, background: isExpanded ? 'rgba(212,175,55,0.04)' : 'transparent' }}
                    onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = C.cardHov; }}
                    onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td className="px-3 py-3 w-8">
                      <button
                        onClick={() => toggleExpand(p.id)}
                        className="w-6 h-6 rounded flex items-center justify-center transition-all"
                        style={{ color: isExpanded ? C.gold : C.dim, background: isExpanded ? 'rgba(212,175,55,0.1)' : 'transparent' }}
                        onMouseDown={e => e.stopPropagation()}
                      >
                        <ChevronRight className="w-3.5 h-3.5 transition-transform" style={{ transform: isExpanded ? 'rotate(90deg)' : 'none' }} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono" style={{ color: C.gold }}>{p.sku}</span>
                    </td>
                    <td className="px-4 py-3" style={{ color: C.text, fontFamily: 'sans-serif' }}>{p.brand_name}</td>
                    <td className="px-4 py-3">
                      <div style={{ color: C.text, fontFamily: 'sans-serif' }}>{p.series}</div>
                      <div className="text-xs mt-0.5" style={{ color: C.muted }}>{p.vitola}</div>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: C.muted, fontFamily: 'sans-serif' }}>{p.packaging_qty}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs capitalize" style={{ color: strengthColor(p.strength), fontFamily: 'sans-serif' }}>{p.strength}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {p.tags.map(t => (
                          <span key={t} className="text-xs px-1.5 py-0.5 rounded"
                            style={{ background: 'rgba(212,175,55,0.1)', color: C.gold, fontFamily: 'sans-serif', border: `1px solid rgba(212,175,55,0.2)` }}>
                            {t}
                          </span>
                        ))}
                        {p.is_limited_edition && !p.tags.includes('LE') && (
                          <span className="text-xs px-1.5 py-0.5 rounded"
                            style={{ background: 'rgba(212,175,55,0.1)', color: C.gold, fontFamily: 'sans-serif', border: `1px solid rgba(212,175,55,0.2)` }}>LE</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded"
                        style={{
                          background: p.is_active ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
                          color: p.is_active ? '#4ade80' : '#f87171',
                          fontFamily: 'sans-serif',
                        }}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${p.id}-images`}>
                      <td colSpan={8} className="px-6 py-4 border-b" style={{ borderColor: C.borderSub, background: 'rgba(212,175,55,0.02)' }}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs tracking-widest uppercase" style={{ color: C.muted, fontFamily: 'sans-serif' }}>
                            Product Images
                            {productImages.length > 0 && <span className="ml-2 px-1.5 py-0.5 rounded text-xs" style={{ background: 'rgba(212,175,55,0.1)', color: C.gold }}>{productImages.length}</span>}
                          </span>
                          <button
                            onClick={() => { setUploadingForId(p.id); fileInputRef.current?.click(); }}
                            disabled={uploading === p.id}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-all"
                            onMouseDown={e => e.stopPropagation()}
                            style={{ background: 'rgba(212,175,55,0.1)', color: C.gold, border: `1px solid rgba(212,175,55,0.2)`, opacity: uploading === p.id ? 0.5 : 1, fontFamily: 'sans-serif' }}
                          >
                            {uploading === p.id ? (
                              <><RefreshCw className="w-3 h-3 animate-spin" />Uploading…</>
                            ) : (
                              <><ImagePlus className="w-3.5 h-3.5" />Upload Image</>
                            )}
                          </button>
                        </div>

                        {uploadError && (
                          <div className="mb-3 text-xs px-3 py-2 rounded flex items-center gap-2" style={{ background: 'rgba(248,113,113,0.08)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)', fontFamily: 'sans-serif' }}>
                            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                            {uploadError}
                          </div>
                        )}

                        {loadingImages === p.id ? (
                          <div className="flex items-center gap-2 py-4 text-xs" style={{ color: C.muted, fontFamily: 'sans-serif' }}>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />Loading images…
                          </div>
                        ) : productImages.length === 0 ? (
                          <div className="py-6 flex flex-col items-center gap-2 rounded-lg border border-dashed" style={{ borderColor: C.borderSub }}>
                            <ImagePlus className="w-8 h-8" style={{ color: C.dim }} />
                            <p className="text-xs" style={{ color: C.muted, fontFamily: 'sans-serif' }}>No images yet — click Upload Image to add the first one</p>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-3">
                            {productImages.map(img => (
                              <div key={img.id} className="relative group rounded-lg overflow-hidden border" style={{ width: 120, height: 120, borderColor: img.is_primary ? C.border : C.borderSub, flexShrink: 0 }}>
                                <img
                                  src={img.url}
                                  alt={img.alt_text || p.sku}
                                  className="w-full h-full object-cover"
                                />
                                {img.is_primary && (
                                  <div className="absolute top-1 left-1 text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(212,175,55,0.85)', color: '#0a0807', fontFamily: 'sans-serif', fontWeight: 600 }}>
                                    PRIMARY
                                  </div>
                                )}
                                <button
                                  onClick={() => handleDelete(p.id, img.id)}
                                  disabled={deletingImageId === img.id}
                                  onMouseDown={e => e.stopPropagation()}
                                  className="absolute top-1 right-1 w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                  style={{ background: 'rgba(248,113,113,0.85)', color: '#fff' }}
                                >
                                  {deletingImageId === img.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm" style={{ color: C.muted, fontFamily: 'sans-serif' }}>No products match the current filter.</div>
        )}
      </div>
    </div>
  );
}

// ─── Inventory Panel ────────────────────────────────────────────────────────────
function InventoryPanel({ stock }: { stock: StockRow[] }) {
  const [regionFilter, setRegionFilter] = useState('');
  const [showMovement, setShowMovement] = useState(false);
  const [mvForm, setMvForm] = useState<MovementForm>({
    movement_type: 'purchase', sku: '', location: '', quantity: '', reference_no: '', notes: '',
  });
  const [mvSaving, setMvSaving] = useState(false);
  const [mvDone, setMvDone] = useState(false);

  const filtered = stock.filter(s => !regionFilter || s.region_code === regionFilter);
  const lowCount = filtered.filter(s => s.is_low_stock).length;

  const submitMovement = async () => {
    setMvSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setMvSaving(false);
    setMvDone(true);
    setTimeout(() => { setMvDone(false); setShowMovement(false); }, 1200);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {['','HK','SG','EU'].map(r => (
            <button key={r} onClick={() => setRegionFilter(r)}
              className="px-3 py-1.5 rounded text-xs tracking-wider uppercase transition-colors"
              style={{
                fontFamily: 'sans-serif',
                background: regionFilter === r ? C.gold : 'rgba(255,255,255,0.04)',
                color: regionFilter === r ? '#0a0807' : C.muted,
                border: `1px solid ${regionFilter === r ? C.gold : C.borderSub}`,
              }}>
              {r || 'All'}
            </button>
          ))}
        </div>
        {lowCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded"
            style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)', fontFamily: 'sans-serif' }}>
            <AlertTriangle className="w-3.5 h-3.5" />
            {lowCount} low stock {lowCount === 1 ? 'item' : 'items'}
          </div>
        )}
        <button onClick={() => setShowMovement(true)}
          className="ml-auto flex items-center gap-2 px-4 py-2 rounded text-sm transition-opacity hover:opacity-80"
          style={{ background: C.gold, color: '#0a0807', fontFamily: 'sans-serif' }}>
          <Plus className="w-4 h-4" />
          Record Movement
        </button>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden" style={{ borderColor: C.borderSub }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: C.borderSub, background: 'rgba(255,255,255,0.02)' }}>
              {['SKU','Brand / Series','Region','Location','On Hand','Reserved','Available','Reorder At','Status'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs tracking-wider uppercase" style={{ color: C.muted, fontFamily: 'sans-serif' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: C.borderSub }}>
            {filtered.map((s, i) => (
              <tr key={i} className="transition-colors"
                onMouseEnter={e => (e.currentTarget.style.background = C.cardHov)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td className="px-4 py-3"><span className="text-xs font-mono" style={{ color: C.gold }}>{s.sku}</span></td>
                <td className="px-4 py-3">
                  <div style={{ color: C.text, fontFamily: 'sans-serif' }}>{s.brand_name}</div>
                  <div className="text-xs" style={{ color: C.muted }}>{s.series}</div>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: C.muted, fontFamily: 'sans-serif' }}>{s.region_code}</td>
                <td className="px-4 py-3 text-xs" style={{ color: C.muted, fontFamily: 'sans-serif' }}>{s.location_name}</td>
                <td className="px-4 py-3 text-sm font-mono text-center" style={{ color: C.text }}>{s.quantity}</td>
                <td className="px-4 py-3 text-sm font-mono text-center" style={{ color: C.muted }}>{s.reserved_qty}</td>
                <td className="px-4 py-3 text-sm font-mono text-center"
                  style={{ color: s.is_low_stock ? '#fbbf24' : '#4ade80' }}>{s.available_qty}</td>
                <td className="px-4 py-3 text-sm font-mono text-center" style={{ color: C.dim }}>{s.reorder_point}</td>
                <td className="px-4 py-3">
                  {s.is_low_stock ? (
                    <span className="text-xs px-2 py-0.5 rounded flex items-center gap-1 w-fit"
                      style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24', fontFamily: 'sans-serif' }}>
                      <AlertTriangle className="w-3 h-3" /> Low
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded flex items-center gap-1 w-fit"
                      style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80', fontFamily: 'sans-serif' }}>
                      <CheckCircle className="w-3 h-3" /> OK
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Movement Modal */}
      {showMovement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.75)' }} onClick={() => setShowMovement(false)} />
          <div className="relative w-full max-w-md rounded-lg border p-6 space-y-4"
            style={{ background: '#13110e', borderColor: C.border, zIndex: 1 }}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base" style={{ color: C.gold, fontFamily: "'Georgia', serif" }}>Record Stock Movement</h3>
              <button onClick={() => setShowMovement(false)}><X className="w-4 h-4" style={{ color: C.muted }} /></button>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Movement Type', key: 'movement_type', type: 'select',
                  options: ['purchase','sale','transfer','consignment_in','consignment_out','adjustment'] },
                { label: 'SKU', key: 'sku', type: 'text', placeholder: 'e.g. COH-S6-25' },
                { label: 'Location', key: 'location', type: 'text', placeholder: 'e.g. CENTRAL Sanyard' },
                { label: 'Quantity', key: 'quantity', type: 'number', placeholder: '0' },
                { label: 'Reference No.', key: 'reference_no', type: 'text', placeholder: 'PO-2026-001' },
                { label: 'Notes', key: 'notes', type: 'text', placeholder: 'Optional' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-xs mb-1 tracking-wider uppercase" style={{ color: C.muted, fontFamily: 'sans-serif' }}>{field.label}</label>
                  {field.type === 'select' ? (
                    <select
                      value={mvForm[field.key as keyof MovementForm]}
                      onChange={e => setMvForm(f => ({ ...f, [field.key]: e.target.value }))}
                      className="w-full px-3 py-2 rounded text-sm outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.borderSub}`, color: C.text, fontFamily: 'sans-serif' }}
                    >
                      {field.options!.map(o => <option key={o} value={o} style={{ background: '#1a1612' }}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      type={field.type} placeholder={field.placeholder}
                      value={mvForm[field.key as keyof MovementForm]}
                      onChange={e => setMvForm(f => ({ ...f, [field.key]: e.target.value }))}
                      className="w-full px-3 py-2 rounded text-sm outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.borderSub}`, color: C.text, fontFamily: 'sans-serif' }}
                    />
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={submitMovement} disabled={mvSaving || mvDone}
              className="w-full py-2.5 rounded text-sm font-medium transition-opacity"
              style={{ background: mvDone ? '#4ade80' : C.gold, color: '#0a0807', fontFamily: 'sans-serif', opacity: mvSaving ? 0.7 : 1 }}>
              {mvDone ? '✓ Recorded' : mvSaving ? 'Recording…' : 'Record Movement'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Leads / CRM Panel ──────────────────────────────────────────────────────────
function LeadsPanel({ leads: initialLeads }: { leads: Lead[] }) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [noteText, setNoteText] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);

  const saveNote = async () => {
    if (!noteText.trim()) return;
    setNoteSaved(true);
    setTimeout(() => { setNoteSaved(false); setNoteText(''); }, 1500);
  };

  const changeStatus = (leadId: string, newStatus: LeadStatus) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
    if (activeLead?.id === leadId) setActiveLead(prev => prev ? { ...prev, status: newStatus } : null);
  };

  return (
    <div className="flex gap-6 h-full overflow-hidden" style={{ minHeight: '600px' }}>
      {/* Kanban */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-3 min-w-max pb-4">
          {LEAD_COLUMNS.map(col => {
            const colLeads = leads.filter(l => l.status === col);
            const meta = STATUS_META[col];
            return (
              <div key={col} className="w-56 flex-shrink-0">
                {/* Column header */}
                <div className="flex items-center justify-between px-3 py-2 rounded-t border-b mb-2"
                  style={{ background: meta.bg, borderColor: `${meta.color}33` }}>
                  <span className="text-xs font-medium tracking-wider uppercase" style={{ color: meta.color, fontFamily: 'sans-serif' }}>{meta.label}</span>
                  <span className="text-xs rounded-full px-1.5 py-0.5" style={{ background: `${meta.color}20`, color: meta.color, fontFamily: 'sans-serif' }}>{colLeads.length}</span>
                </div>
                {/* Cards */}
                <div className="space-y-2">
                  {colLeads.map(lead => (
                    <div
                      key={lead.id}
                      onClick={() => setActiveLead(lead)}
                      className="rounded-lg border p-3 cursor-pointer transition-all"
                      style={{
                        background: activeLead?.id === lead.id ? 'rgba(212,175,55,0.07)' : C.card,
                        borderColor: activeLead?.id === lead.id ? C.border : C.borderSub,
                      }}
                      onMouseEnter={e => { if (activeLead?.id !== lead.id) (e.currentTarget as HTMLElement).style.background = C.cardHov; }}
                      onMouseLeave={e => { if (activeLead?.id !== lead.id) (e.currentTarget as HTMLElement).style.background = C.card; }}
                    >
                      <div className="text-xs font-medium mb-1 truncate" style={{ color: C.text, fontFamily: "'Georgia', serif" }}>{lead.customer_name}</div>
                      <div className="text-xs mb-2" style={{ color: C.muted, fontFamily: 'sans-serif' }}>{lead.region_code} · {lead.item_count} item{lead.item_count !== 1 ? 's' : ''}</div>
                      {lead.estimated_value && (
                        <div className="text-xs" style={{ color: C.gold, fontFamily: 'sans-serif' }}>{fmtValue(lead.estimated_value, lead.currency_code)}</div>
                      )}
                      <div className="text-xs mt-2" style={{ color: C.dim, fontFamily: 'sans-serif' }}>{fmtDate(lead.updated_at)}</div>
                    </div>
                  ))}
                  {colLeads.length === 0 && (
                    <div className="text-xs text-center py-4" style={{ color: C.dim, fontFamily: 'sans-serif' }}>—</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lead Detail Drawer */}
      {activeLead && (
        <div className="w-72 flex-shrink-0 rounded-lg border overflow-y-auto"
          style={{ background: C.card, borderColor: C.border, maxHeight: '700px' }}>
          <div className="sticky top-0 px-4 py-3 border-b flex items-center justify-between"
            style={{ background: '#13110e', borderColor: C.borderSub }}>
            <span className="text-xs tracking-widest uppercase" style={{ color: C.muted, fontFamily: 'sans-serif' }}>Lead Detail</span>
            <button onClick={() => setActiveLead(null)}><X className="w-4 h-4" style={{ color: C.muted }} /></button>
          </div>

          <div className="p-4 space-y-4">
            {/* Customer */}
            <div>
              <div className="text-base" style={{ color: C.text, fontFamily: "'Georgia', serif" }}>{activeLead.customer_name}</div>
              <div className="text-xs mt-1 flex items-center gap-1.5" style={{ color: C.muted, fontFamily: 'sans-serif' }}>
                <Mail className="w-3 h-3" />{activeLead.customer_email}
              </div>
              <div className="text-xs mt-1" style={{ color: C.muted, fontFamily: 'sans-serif' }}>{activeLead.lead_no}</div>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-3 text-xs" style={{ fontFamily: 'sans-serif' }}>
              <div>
                <div style={{ color: C.dim }}>Region</div>
                <div style={{ color: C.text }}>{activeLead.region_code}</div>
              </div>
              <div>
                <div style={{ color: C.dim }}>Items</div>
                <div style={{ color: C.text }}>{activeLead.item_count}</div>
              </div>
              <div>
                <div style={{ color: C.dim }}>Value</div>
                <div style={{ color: C.gold }}>{fmtValue(activeLead.estimated_value, activeLead.currency_code)}</div>
              </div>
              <div>
                <div style={{ color: C.dim }}>Assigned</div>
                <div style={{ color: C.text }}>{activeLead.assigned_to_name || '—'}</div>
              </div>
            </div>

            {/* Status Change */}
            <div>
              <div className="text-xs mb-1.5 tracking-wider uppercase" style={{ color: C.muted, fontFamily: 'sans-serif' }}>Status</div>
              <select
                value={activeLead.status}
                onChange={e => changeStatus(activeLead.id, e.target.value as LeadStatus)}
                className="w-full px-3 py-2 rounded text-sm outline-none"
                style={{
                  background: STATUS_META[activeLead.status].bg,
                  border: `1px solid ${STATUS_META[activeLead.status].color}44`,
                  color: STATUS_META[activeLead.status].color,
                  fontFamily: 'sans-serif',
                }}>
                {LEAD_COLUMNS.map(s => (
                  <option key={s} value={s} style={{ background: '#1a1612', color: C.text }}>{STATUS_META[s].label}</option>
                ))}
              </select>
            </div>

            {/* Note */}
            <div>
              <div className="text-xs mb-1.5 tracking-wider uppercase" style={{ color: C.muted, fontFamily: 'sans-serif' }}>Add Note</div>
              <textarea
                value={noteText} onChange={e => setNoteText(e.target.value)}
                rows={3} placeholder="Internal note…"
                className="w-full px-3 py-2 rounded text-xs outline-none resize-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.borderSub}`, color: C.text, fontFamily: 'sans-serif' }}
              />
              <button onClick={saveNote}
                className="mt-2 w-full py-1.5 rounded text-xs transition-opacity hover:opacity-80"
                style={{ background: noteSaved ? '#4ade80' : 'rgba(212,175,55,0.15)', color: noteSaved ? '#0a0807' : C.gold, border: `1px solid ${C.border}`, fontFamily: 'sans-serif' }}>
                {noteSaved ? '✓ Saved' : 'Save Note'}
              </button>
            </div>

            {/* Dates */}
            <div className="text-xs space-y-1 pt-2 border-t" style={{ borderColor: C.borderSub, color: C.dim, fontFamily: 'sans-serif' }}>
              <div>Created: {fmtDate(activeLead.created_at)}</div>
              <div>Updated: {fmtDate(activeLead.updated_at)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Reports Panel ────────────────────────────────────────────────────────────────
function ReportsPanel({ leads, stock }: { leads: Lead[]; stock: StockRow[] }) {
  const byStatus = LEAD_COLUMNS.map(s => ({
    status: s,
    count: leads.filter(l => l.status === s).length,
    value: leads.filter(l => l.status === s).reduce((a, l) => a + (l.estimated_value || 0), 0),
  }));
  const maxCount = Math.max(...byStatus.map(s => s.count), 1);

  const lowStockItems = stock.filter(s => s.is_low_stock);

  return (
    <div className="space-y-6">
      {/* Lead Funnel */}
      <div className="rounded-lg border p-6" style={{ borderColor: C.borderSub, background: C.card }}>
        <div className="text-xs tracking-widest uppercase mb-5" style={{ color: C.muted, fontFamily: 'sans-serif' }}>Lead Funnel — Current State</div>
        <div className="space-y-3">
          {byStatus.map(({ status, count, value }) => {
            const meta = STATUS_META[status];
            const pct = (count / maxCount) * 100;
            return (
              <div key={status} className="flex items-center gap-4">
                <div className="w-24 text-xs text-right" style={{ color: meta.color, fontFamily: 'sans-serif' }}>{meta.label}</div>
                <div className="flex-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', height: '10px' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: meta.color, opacity: 0.7 }} />
                </div>
                <div className="w-6 text-xs text-center" style={{ color: C.text, fontFamily: 'sans-serif' }}>{count}</div>
                <div className="w-28 text-xs text-right" style={{ color: C.muted, fontFamily: 'sans-serif' }}>
                  {value > 0 ? `HK$${(value/1000).toFixed(0)}k` : '—'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lead Summary Table */}
      <div className="rounded-lg border overflow-hidden" style={{ borderColor: C.borderSub }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: C.borderSub, background: 'rgba(255,255,255,0.02)' }}>
          <span className="text-xs tracking-widest uppercase" style={{ color: C.muted, fontFamily: 'sans-serif' }}>Leads by Region × Status</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: C.borderSub }}>
              <th className="px-4 py-3 text-left text-xs tracking-wider uppercase" style={{ color: C.muted, fontFamily: 'sans-serif' }}>Region</th>
              {LEAD_COLUMNS.map(s => (
                <th key={s} className="px-4 py-3 text-center text-xs tracking-wider uppercase" style={{ color: STATUS_META[s].color, fontFamily: 'sans-serif' }}>{STATUS_META[s].label}</th>
              ))}
              <th className="px-4 py-3 text-right text-xs tracking-wider uppercase" style={{ color: C.muted, fontFamily: 'sans-serif' }}>Total</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: C.borderSub }}>
            {['HK','SG','EU'].map(region => (
              <tr key={region}
                onMouseEnter={e => (e.currentTarget.style.background = C.cardHov)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <td className="px-4 py-3 text-sm" style={{ color: C.gold, fontFamily: 'sans-serif' }}>{region}</td>
                {LEAD_COLUMNS.map(s => {
                  const n = leads.filter(l => l.region_code === region && l.status === s).length;
                  return (
                    <td key={s} className="px-4 py-3 text-center text-sm" style={{ color: n > 0 ? STATUS_META[s].color : C.dim, fontFamily: 'sans-serif' }}>{n || '—'}</td>
                  );
                })}
                <td className="px-4 py-3 text-right text-sm font-medium" style={{ color: C.text, fontFamily: 'sans-serif' }}>
                  {leads.filter(l => l.region_code === region).length}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Inventory Reorder Alerts */}
      <div className="rounded-lg border overflow-hidden" style={{ borderColor: lowStockItems.length ? 'rgba(251,191,36,0.2)' : C.borderSub }}>
        <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: C.borderSub, background: 'rgba(255,255,255,0.02)' }}>
          <AlertTriangle className="w-4 h-4" style={{ color: '#fbbf24' }} />
          <span className="text-xs tracking-widest uppercase" style={{ color: C.muted, fontFamily: 'sans-serif' }}>Reorder Required ({lowStockItems.length})</span>
        </div>
        {lowStockItems.length === 0 ? (
          <div className="py-8 text-center text-xs" style={{ color: C.muted, fontFamily: 'sans-serif' }}>No reorders required at this time.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: C.borderSub }}>
                {['SKU','Brand','Location','Region','Available','Reorder At'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs tracking-wider uppercase" style={{ color: C.muted, fontFamily: 'sans-serif' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: C.borderSub }}>
              {lowStockItems.map((s, i) => (
                <tr key={i}
                  onMouseEnter={e => (e.currentTarget.style.background = C.cardHov)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td className="px-4 py-3"><span className="text-xs font-mono" style={{ color: C.gold }}>{s.sku}</span></td>
                  <td className="px-4 py-3 text-xs" style={{ color: C.text, fontFamily: 'sans-serif' }}>{s.brand_name}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: C.muted, fontFamily: 'sans-serif' }}>{s.location_name}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: C.muted, fontFamily: 'sans-serif' }}>{s.region_code}</td>
                  <td className="px-4 py-3 text-sm font-mono" style={{ color: '#fbbf24' }}>{s.available_qty}</td>
                  <td className="px-4 py-3 text-sm font-mono" style={{ color: C.dim }}>{s.reorder_point}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Login Screen ────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (token: string, user: { name: string; role: string; email: string }) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const attemptLogin = async (demo = false) => {
    setLoading(true);
    setError('');
    if (demo) {
      await new Promise(r => setTimeout(r, 600));
      onLogin('demo_admin_token', { name: 'Demo Administrator', role: 'admin', email: 'admin@arrisonapps.com' });
      return;
    }
    try {
      const res = await fetch('/api/arrisonapps/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Login failed');
      const { token, user } = await res.json();
      onLogin(token, user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Use Demo Access below.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: C.bg }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="text-xs tracking-[0.4em] uppercase mb-1" style={{ color: C.muted, fontFamily: 'sans-serif' }}>Est. 2010</div>
          <div className="text-3xl tracking-[0.2em] font-light mb-1" style={{ color: C.gold, fontFamily: "'Georgia', serif" }}>ARRISONAPPS</div>
          <div className="text-xs tracking-[0.35em] uppercase" style={{ color: C.muted, fontFamily: 'sans-serif' }}>Admin Portal</div>
        </div>

        {/* Card */}
        <div className="rounded-lg border p-7 space-y-4" style={{ background: 'rgba(255,255,255,0.03)', borderColor: C.border }}>
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4" style={{ color: C.gold }} />
            <span className="text-xs tracking-widest uppercase" style={{ color: C.muted, fontFamily: 'sans-serif' }}>Secure Sign In</span>
          </div>

          <div>
            <label className="block text-xs mb-1.5 tracking-wider uppercase" style={{ color: C.muted, fontFamily: 'sans-serif' }}>Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@arrisonapps.com"
              onKeyDown={e => e.key === 'Enter' && attemptLogin()}
              className="w-full px-4 py-2.5 rounded text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.borderSub}`, color: C.text, fontFamily: 'sans-serif' }}
            />
          </div>
          <div>
            <label className="block text-xs mb-1.5 tracking-wider uppercase" style={{ color: C.muted, fontFamily: 'sans-serif' }}>Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={e => e.key === 'Enter' && attemptLogin()}
              className="w-full px-4 py-2.5 rounded text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.borderSub}`, color: C.text, fontFamily: 'sans-serif' }}
            />
          </div>

          {error && <div className="text-xs px-3 py-2 rounded" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', fontFamily: 'sans-serif' }}>{error}</div>}

          <button
            onClick={() => attemptLogin()} disabled={loading || !email}
            className="w-full py-2.5 rounded text-sm font-medium transition-opacity"
            style={{ background: C.gold, color: '#0a0807', fontFamily: 'sans-serif', opacity: loading || !email ? 0.5 : 1 }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

          <div className="relative flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: C.borderSub }} />
            <span className="text-xs" style={{ color: C.dim, fontFamily: 'sans-serif' }}>or</span>
            <div className="flex-1 h-px" style={{ background: C.borderSub }} />
          </div>

          <button
            onClick={() => attemptLogin(true)} disabled={loading}
            className="w-full py-2.5 rounded text-sm transition-all border"
            style={{
              background: 'transparent',
              borderColor: C.border,
              color: C.gold,
              fontFamily: 'sans-serif',
              opacity: loading ? 0.5 : 1,
            }}>
            Demo Admin Access
          </button>
          <p className="text-xs text-center" style={{ color: C.dim, fontFamily: 'sans-serif' }}>
            Demo mode uses mock data — no backend required
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Admin Shell ────────────────────────────────────────────────────────────
const NAV_ITEMS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'overview',   label: 'Overview',   icon: Activity  },
  { id: 'products',   label: 'Products',   icon: Package   },
  { id: 'inventory',  label: 'Inventory',  icon: Boxes     },
  { id: 'leads',      label: 'CRM Leads',  icon: Users     },
  { id: 'reports',    label: 'Reports',    icon: BarChart3 },
];

export default function ArrisonappsAdmin() {
  const [token, setToken]     = useState<string | null>(null);
  const [user, setUser]       = useState<{ name: string; role: string; email: string } | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [leads]     = useState<Lead[]>(MOCK_LEADS);
  const [stock]     = useState<StockRow[]>(MOCK_STOCK);
  const [products]  = useState<ProductRow[]>(MOCK_PRODUCTS);

  useEffect(() => {
    const t = localStorage.getItem('arr_admin_token');
    const u = localStorage.getItem('arr_admin_user');
    if (t && u) { setToken(t); setUser(JSON.parse(u)); }
  }, []);

  const handleLogin = useCallback((t: string, u: { name: string; role: string; email: string }) => {
    localStorage.setItem('arr_admin_token', t);
    localStorage.setItem('arr_admin_user', JSON.stringify(u));
    setToken(t); setUser(u);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('arr_admin_token');
    localStorage.removeItem('arr_admin_user');
    setToken(null); setUser(null);
  }, []);

  if (!token) return <LoginScreen onLogin={handleLogin} />;

  const lowStockCount = stock.filter(s => s.is_low_stock).length;

  return (
    <div className="min-h-screen flex" style={{ background: C.bg, color: C.text, fontFamily: "'Georgia', serif" }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────────────── */}
      <aside className="w-56 flex-shrink-0 flex flex-col border-r" style={{ background: C.sidebar, borderColor: C.borderSub, minHeight: '100vh' }}>
        {/* Logo */}
        <div className="px-6 py-6 border-b" style={{ borderColor: C.borderSub }}>
          <div className="text-xs tracking-[0.4em] uppercase mb-0.5" style={{ color: C.muted, fontFamily: 'sans-serif', fontSize: '9px' }}>Est. 2010</div>
          <div className="text-lg tracking-[0.2em] font-light" style={{ color: C.gold }}>ARRISONAPPS</div>
          <div className="text-xs tracking-[0.3em] uppercase mt-0.5" style={{ color: C.muted, fontFamily: 'sans-serif', fontSize: '9px' }}>Admin Portal</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-all relative"
                style={{
                  background: active ? 'rgba(212,175,55,0.1)' : 'transparent',
                  color: active ? C.gold : C.muted,
                  fontFamily: 'sans-serif',
                  borderLeft: active ? `2px solid ${C.gold}` : '2px solid transparent',
                }}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{label}</span>
                {id === 'inventory' && lowStockCount > 0 && (
                  <span className="ml-auto text-xs rounded-full px-1.5 py-0.5 leading-none"
                    style={{ background: 'rgba(251,191,36,0.2)', color: '#fbbf24', fontFamily: 'sans-serif' }}>
                    {lowStockCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick links */}
        <div className="px-3 pb-3 space-y-0.5 border-t pt-3" style={{ borderColor: C.borderSub }}>
          <a href="/vibe-demo/arrisonapps" target="_blank" rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-3 py-2 rounded text-xs transition-all"
            style={{ color: C.dim, fontFamily: 'sans-serif' }}
            onMouseEnter={e => (e.currentTarget.style.color = C.muted)}
            onMouseLeave={e => (e.currentTarget.style.color = C.dim)}>
            <Eye className="w-3.5 h-3.5" />
            View Catalogue
          </a>
          <a href="/dashboard" target="_blank" rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-3 py-2 rounded text-xs transition-all"
            style={{ color: C.dim, fontFamily: 'sans-serif' }}
            onMouseEnter={e => (e.currentTarget.style.color = C.muted)}
            onMouseLeave={e => (e.currentTarget.style.color = C.dim)}>
            <Settings className="w-3.5 h-3.5" />
            5ML Dashboard
          </a>
        </div>

        {/* User */}
        <div className="px-4 py-4 border-t" style={{ borderColor: C.borderSub }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs"
              style={{ background: 'rgba(212,175,55,0.15)', color: C.gold, fontFamily: 'sans-serif' }}>
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-xs truncate" style={{ color: C.text, fontFamily: 'sans-serif' }}>{user?.name}</div>
              <div className="text-xs capitalize" style={{ color: C.dim, fontFamily: 'sans-serif' }}>{user?.role}</div>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 text-xs py-1.5 px-2 rounded transition-all"
            style={{ color: C.dim, fontFamily: 'sans-serif' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
            onMouseLeave={e => (e.currentTarget.style.color = C.dim)}>
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <div className="sticky top-0 z-10 px-8 py-4 border-b flex items-center justify-between"
          style={{ background: `${C.bg}f0`, borderColor: C.borderSub, backdropFilter: 'blur(12px)' }}>
          <div>
            <h1 className="text-lg font-light" style={{ color: C.text }}>
              {NAV_ITEMS.find(n => n.id === activeTab)?.label}
            </h1>
            <p className="text-xs mt-0.5" style={{ color: C.dim, fontFamily: 'sans-serif' }}>
              {activeTab === 'overview'  && 'Platform snapshot and recent activity'}
              {activeTab === 'products'  && `${products.length} SKUs across 16 brands`}
              {activeTab === 'inventory' && `${stock.length} stock records · ${lowStockCount} low stock alert${lowStockCount !== 1 ? 's' : ''}`}
              {activeTab === 'leads'     && `${leads.filter(l => !['won','lost'].includes(l.status)).length} active leads in pipeline`}
              {activeTab === 'reports'   && 'Lead funnel · Inventory · Reorder alerts'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded"
              style={{ background: 'rgba(74,222,128,0.08)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)', fontFamily: 'sans-serif' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Live
            </div>
          </div>
        </div>

        {/* Panel */}
        <div className="p-8">
          {activeTab === 'overview'  && <OverviewPanel  leads={leads} stock={stock} />}
          {activeTab === 'products'  && <ProductsPanel  products={products} token={token!} />}
          {activeTab === 'inventory' && <InventoryPanel stock={stock} />}
          {activeTab === 'leads'     && <LeadsPanel     leads={leads} />}
          {activeTab === 'reports'   && <ReportsPanel   leads={leads} stock={stock} />}
        </div>
      </main>
    </div>
  );
}
