'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, ShoppingBag, X, Search, SlidersHorizontal,
  MapPin, ChevronDown, Flame, Star, Package, ArrowUpRight,
  Send, Globe, Shield
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Product {
  id: string;
  sku: string;
  brand_name: string;
  series: string;
  vitola: string;
  packaging_qty: number;
  packaging_type: string;
  strength: 'mild' | 'medium' | 'full';
  is_limited_edition: boolean;
  is_travel_humidor: boolean;
  tags: string[];
  short_description: string;
  display_price: number | null;
  currency_symbol: string;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'enquiry_only';
  enquiry_only: boolean;
}

interface CartItem extends Product {
  qty: number;
}

// ─── Mock data (used when backend is unavailable) ─────────────────────────────
const MOCK_PRODUCTS: Product[] = [
  {
    id: '1', sku: 'COH-S6-25', brand_name: 'Cohiba', series: 'Siglo VI', vitola: 'Gran Corona',
    packaging_qty: 25, packaging_type: 'box', strength: 'medium',
    is_limited_edition: false, is_travel_humidor: false,
    tags: ['Best Seller'],
    short_description: 'The flagship Siglo VI — rich, complex and perfectly balanced. A box-pressed gran corona with cedar and cocoa.',
    display_price: 2800, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: false,
  },
  {
    id: '2', sku: 'MON-2-25', brand_name: 'Montecristo', series: 'No. 2', vitola: 'Torpedo',
    packaging_qty: 25, packaging_type: 'box', strength: 'medium',
    is_limited_edition: false, is_travel_humidor: false,
    tags: [],
    short_description: 'The iconic torpedo — one of the most acclaimed cigars in the world. Earthy, woody, with a creamy finish.',
    display_price: 1980, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: false,
  },
  {
    id: '3', sku: 'PAD-1926-10', brand_name: 'Padrón', series: '1926 Serie', vitola: 'No. 9',
    packaging_qty: 10, packaging_type: 'box', strength: 'full',
    is_limited_edition: false, is_travel_humidor: false,
    tags: ['Premium'],
    short_description: 'Aged Nicaraguan tobaccos pressed into a full-bodied masterpiece. Rich coffee, dark chocolate and spice.',
    display_price: 3200, currency_symbol: 'HK$', stock_status: 'low_stock', enquiry_only: false,
  },
  {
    id: '4', sku: 'ROY-LE-2023-25', brand_name: 'Romeo y Julieta', series: 'Limited Edition 2023', vitola: 'Petit Robusto',
    packaging_qty: 25, packaging_type: 'box', strength: 'medium',
    is_limited_edition: true, is_travel_humidor: false,
    tags: ['LE', 'Limited Availability'],
    short_description: 'A rare limited edition celebrating decades of Cuban craftsmanship. Honey, cedar and a silky draw.',
    display_price: null, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: true,
  },
  {
    id: '5', sku: 'COH-BHK-10', brand_name: 'Cohiba', series: 'Behike', vitola: 'BHK 54',
    packaging_qty: 10, packaging_type: 'box', strength: 'full',
    is_limited_edition: false, is_travel_humidor: false,
    tags: ['Ultra Premium', 'Collector'],
    short_description: 'The pinnacle of Cuban tobacco artistry. Incorporating the rare medio tiempo leaf for unparalleled depth.',
    display_price: null, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: true,
  },
  {
    id: '6', sku: 'TRI-TH-4', brand_name: 'Trinidad', series: 'Travel Humidor', vitola: 'Robusto Extra',
    packaging_qty: 4, packaging_type: 'travel-humidor', strength: 'medium',
    is_limited_edition: false, is_travel_humidor: true,
    tags: ['Travel Humidor', 'Gift'],
    short_description: 'Curated for the traveller — four hand-selected Trinidad Robustos in a luxury travel humidor.',
    display_price: 880, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: false,
  },
  {
    id: '7', sku: 'PAR-LUS-25', brand_name: 'Partagás', series: 'Lusitanias', vitola: 'Double Corona',
    packaging_qty: 25, packaging_type: 'box', strength: 'full',
    is_limited_edition: false, is_travel_humidor: false,
    tags: ['Classic'],
    short_description: 'A legendary double corona — intense and powerful, beloved by aficionados for over a century.',
    display_price: 2200, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: false,
  },
  {
    id: '8', sku: 'DAV-MIL-10', brand_name: 'Davidoff', series: 'Millennium', vitola: 'Short Robusto',
    packaging_qty: 10, packaging_type: 'box', strength: 'mild',
    is_limited_edition: false, is_travel_humidor: false,
    tags: ['Refined'],
    short_description: 'The Swiss master\'s signature blend — creamy, elegant with floral and cedar notes. For the refined palate.',
    display_price: 1560, currency_symbol: 'HK$', stock_status: 'in_stock', enquiry_only: false,
  },
];

const REGIONS = [
  { code: 'HK', name: 'Hong Kong', currency: 'HKD', symbol: 'HK$' },
  { code: 'SG', name: 'Singapore', currency: 'SGD', symbol: 'S$' },
  { code: 'EU', name: 'Europe', currency: 'EUR', symbol: '€' },
];

const BRANDS = ['All', 'Cohiba', 'Montecristo', 'Padrón', 'Romeo y Julieta', 'Trinidad', 'Partagás', 'Davidoff'];
const STRENGTHS = ['All', 'mild', 'medium', 'full'];

// ─── Component ────────────────────────────────────────────────────────────────
export default function ArrisonappsPage() {
  const [region, setRegion] = useState(REGIONS[0]);
  const [products, setProducts]  = useState<Product[]>(MOCK_PRODUCTS);
  const [cart, setCart]          = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen]  = useState(false);
  const [search, setSearch]      = useState('');
  const [filterBrand, setFilterBrand]    = useState('All');
  const [filterStrength, setFilterStrength] = useState('All');
  const [filterOpen, setFilterOpen]      = useState(false);
  const [enquiryOpen, setEnquiryOpen]    = useState(false);
  const [submitted, setSubmitted]        = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Filter products
  const filtered = products.filter(p => {
    const matchBrand    = filterBrand === 'All'    || p.brand_name === filterBrand;
    const matchStrength = filterStrength === 'All' || p.strength === filterStrength;
    const matchSearch   = !search ||
      p.brand_name.toLowerCase().includes(search.toLowerCase()) ||
      p.series.toLowerCase().includes(search.toLowerCase()) ||
      p.vitola.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    return matchBrand && matchStrength && matchSearch;
  });

  const addToCart = (product: Product) => {
    setCart(prev => {
      const exists = prev.find(i => i.id === product.id);
      if (exists) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
    setCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev =>
      prev
        .map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i)
        .filter(i => i.qty > 0)
    );
  };

  const cartTotal = cart.reduce((sum, item) =>
    sum + ((item.display_price || 0) * item.qty), 0
  );

  const strengthLabel = (s: string) => ({ mild: 'Mild', medium: 'Medium', full: 'Full' }[s] || s);
  const stockBadge = (status: string, enquiry_only: boolean) => {
    if (enquiry_only) return { label: 'Enquiry Only', cls: 'text-amber-400 border-amber-400/30 bg-amber-400/10' };
    if (status === 'in_stock')  return { label: 'In Stock',  cls: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10' };
    if (status === 'low_stock') return { label: 'Low Stock', cls: 'text-amber-400 border-amber-400/30 bg-amber-400/10' };
    return { label: 'Unavailable', cls: 'text-slate-500 border-slate-500/30 bg-slate-500/10' };
  };

  return (
    <div className="min-h-screen" style={{ background: '#0f0d0b', color: '#e8dcc8', fontFamily: "'Georgia', serif" }}>

      {/* ── HEADER ─────────────────────────────────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300"
        style={{
          borderColor: scrollY > 40 ? 'rgba(212,175,55,0.15)' : 'transparent',
          background: scrollY > 40 ? 'rgba(15,13,11,0.95)' : 'transparent',
          backdropFilter: scrollY > 40 ? 'blur(20px)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Back */}
          <Link
            href="/vibe-demo"
            className="flex items-center gap-2 text-sm transition-colors"
            style={{ color: '#9b8c72', fontFamily: 'sans-serif' }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Link>

          {/* Logo */}
          <div className="text-center">
            <div className="text-xs tracking-[0.35em] uppercase mb-0.5" style={{ color: '#9b8c72', fontFamily: 'sans-serif', fontSize: '10px' }}>
              Est. 2010
            </div>
            <div className="text-xl tracking-[0.2em] font-light" style={{ color: '#D4AF37' }}>
              ARRISONAPPS
            </div>
            <div className="text-xs tracking-[0.3em] uppercase" style={{ color: '#9b8c72', fontFamily: 'sans-serif', fontSize: '9px' }}>
              Fine Cigars & Humidors
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {/* Region Selector */}
            <div className="relative">
              <button
                onClick={() => setFilterOpen(v => !v)}
                className="flex items-center gap-1.5 text-xs tracking-widest uppercase transition-colors"
                style={{ color: '#9b8c72', fontFamily: 'sans-serif' }}
              >
                <MapPin className="w-3.5 h-3.5" />
                {region.code}
                <ChevronDown className="w-3 h-3" />
              </button>
              {filterOpen && (
                <div
                  className="absolute right-0 top-8 rounded border py-1 z-50 min-w-[140px]"
                  style={{ background: '#1a1612', borderColor: 'rgba(212,175,55,0.15)' }}
                >
                  {REGIONS.map(r => (
                    <button
                      key={r.code}
                      onClick={() => { setRegion(r); setFilterOpen(false); }}
                      className="w-full text-left px-4 py-2 text-xs tracking-wider transition-colors hover:text-amber-300"
                      style={{
                        color: region.code === r.code ? '#D4AF37' : '#9b8c72',
                        fontFamily: 'sans-serif',
                      }}
                    >
                      {r.name} ({r.symbol})
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cart */}
            <button
              onClick={() => setCartOpen(v => !v)}
              className="relative flex items-center gap-1.5 transition-colors"
              style={{ color: '#e8dcc8' }}
            >
              <ShoppingBag className="w-5 h-5" />
              {cart.length > 0 && (
                <span
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-xs flex items-center justify-center"
                  style={{ background: '#D4AF37', color: '#0f0d0b', fontFamily: 'sans-serif' }}
                >
                  {cart.reduce((s, i) => s + i.qty, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative flex items-end overflow-hidden"
        style={{ height: '90vh', minHeight: '560px' }}
      >
        {/* Background */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #1a0f08 0%, #2a1a0e 40%, #1a1209 70%, #0f0d0b 100%)',
            transform: `translateY(${scrollY * 0.25}px)`,
          }}
        />
        {/* Texture overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        {/* Gold gradient accent */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 70% 60%, rgba(212,175,55,0.08) 0%, transparent 60%)',
          }}
        />

        {/* Hero Content */}
        <div
          className="relative z-10 max-w-7xl mx-auto px-6 pb-20 w-full"
          style={{ transform: `translateY(${scrollY * -0.1}px)` }}
        >
          <div className="max-w-2xl">
            <div
              className="text-xs tracking-[0.5em] uppercase mb-6"
              style={{ color: '#D4AF37', fontFamily: 'sans-serif' }}
            >
              {region.name} Collection · {new Date().getFullYear()}
            </div>
            <h1
              className="font-light mb-6"
              style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', lineHeight: 1.1, color: '#e8dcc8', letterSpacing: '0.02em' }}
            >
              The Art of the<br />
              <span style={{ color: '#D4AF37', fontStyle: 'italic' }}>Perfect Smoke</span>
            </h1>
            <p
              className="mb-10 leading-relaxed font-light"
              style={{ color: '#9b8c72', fontSize: '1.05rem', maxWidth: '480px', fontFamily: 'sans-serif' }}
            >
              A curated selection of the world's most distinguished cigars,
              sourced directly from master torcedores across Cuba, Nicaragua and the Dominican Republic.
            </p>
            <div className="flex items-center gap-6">
              <button
                onClick={() => document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-3 px-8 py-4 text-sm tracking-widest uppercase transition-all duration-300 hover:gap-4"
                style={{
                  background: '#D4AF37',
                  color: '#0f0d0b',
                  fontFamily: 'sans-serif',
                  letterSpacing: '0.15em',
                }}
              >
                Explore Catalogue
                <ArrowUpRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setEnquiryOpen(true)}
                className="text-sm tracking-widest uppercase transition-colors border-b pb-0.5"
                style={{ color: '#9b8c72', fontFamily: 'sans-serif', borderColor: '#9b8c72', letterSpacing: '0.12em' }}
              >
                Private Enquiry
              </button>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          style={{ color: '#9b8c72', fontFamily: 'sans-serif', fontSize: '10px', letterSpacing: '0.2em' }}
        >
          <span className="uppercase tracking-widest">Scroll</span>
          <div className="w-px h-12 animate-pulse" style={{ background: 'linear-gradient(to bottom, #D4AF37, transparent)' }} />
        </div>
      </section>

      {/* ── VALUES BAR ─────────────────────────────────────────────────────────── */}
      <section
        className="border-y py-8"
        style={{ borderColor: 'rgba(212,175,55,0.1)', background: 'rgba(212,175,55,0.03)' }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {[
              { icon: Shield, label: 'Authenticity Guaranteed', sub: 'Direct-source provenance documentation' },
              { icon: Globe, label: 'Multi-Region Service', sub: `${REGIONS.length} regions · ${region.symbol} pricing available` },
              { icon: Star, label: 'Private Client Membership', sub: 'Exclusive allocations for VIP members' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <Icon className="w-5 h-5 mb-1" style={{ color: '#D4AF37' }} />
                <div className="text-sm tracking-wider" style={{ color: '#e8dcc8', fontFamily: 'sans-serif' }}>{label}</div>
                <div className="text-xs" style={{ color: '#9b8c72', fontFamily: 'sans-serif' }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATALOGUE ──────────────────────────────────────────────────────────── */}
      <section id="catalogue" className="py-20 max-w-7xl mx-auto px-6">

        {/* Section header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <div
              className="text-xs tracking-[0.4em] uppercase mb-2"
              style={{ color: '#D4AF37', fontFamily: 'sans-serif' }}
            >
              Current Selection
            </div>
            <h2 className="text-3xl font-light" style={{ color: '#e8dcc8', letterSpacing: '0.05em' }}>
              {region.name} Catalogue
            </h2>
          </div>
          <div style={{ color: '#9b8c72', fontFamily: 'sans-serif', fontSize: '13px' }}>
            {filtered.length} {filtered.length === 1 ? 'cigar' : 'cigars'} available
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9b8c72' }} />
            <input
              type="text"
              placeholder="Search by brand, series, or vitola…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-transparent border text-sm outline-none transition-colors"
              style={{
                borderColor: 'rgba(212,175,55,0.2)',
                color: '#e8dcc8',
                fontFamily: 'sans-serif',
                letterSpacing: '0.02em',
              }}
              onFocus={e => (e.target.style.borderColor = 'rgba(212,175,55,0.5)')}
              onBlur={e  => (e.target.style.borderColor = 'rgba(212,175,55,0.2)')}
            />
          </div>

          {/* Brand filter */}
          <div className="relative">
            <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9b8c72' }} />
            <select
              value={filterBrand}
              onChange={e => setFilterBrand(e.target.value)}
              className="pl-9 pr-8 py-3 bg-transparent border appearance-none text-sm cursor-pointer outline-none min-w-[160px]"
              style={{ borderColor: 'rgba(212,175,55,0.2)', color: '#e8dcc8', fontFamily: 'sans-serif' }}
            >
              {BRANDS.map(b => <option key={b} value={b} style={{ background: '#1a1612' }}>{b}</option>)}
            </select>
          </div>

          {/* Strength filter */}
          <div className="relative">
            <Flame className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9b8c72' }} />
            <select
              value={filterStrength}
              onChange={e => setFilterStrength(e.target.value)}
              className="pl-9 pr-8 py-3 bg-transparent border appearance-none text-sm cursor-pointer outline-none"
              style={{ borderColor: 'rgba(212,175,55,0.2)', color: '#e8dcc8', fontFamily: 'sans-serif' }}
            >
              {STRENGTHS.map(s => (
                <option key={s} value={s} style={{ background: '#1a1612' }}>
                  {s === 'All' ? 'All Strengths' : strengthLabel(s)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20" style={{ color: '#9b8c72', fontFamily: 'sans-serif' }}>
            No cigars match your current filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map(product => {
              const badge = stockBadge(product.stock_status, product.enquiry_only);
              return (
                <article
                  key={product.id}
                  className="group relative flex flex-col cursor-pointer transition-all duration-300"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(212,175,55,0.08)' }}
                  onClick={() => setActiveProduct(product)}
                >
                  {/* Image placeholder — rich tobacco brown gradient */}
                  <div
                    className="relative overflow-hidden"
                    style={{ height: '200px', background: 'linear-gradient(135deg, #2a1a0e 0%, #1a1209 100%)' }}
                  >
                    {/* Decorative cigar silhouette */}
                    <div
                      className="absolute inset-0 flex items-center justify-center opacity-30 group-hover:opacity-40 transition-opacity duration-500"
                      style={{ transform: 'rotate(-5deg)' }}
                    >
                      <div
                        className="rounded-full"
                        style={{
                          width: '180px', height: '28px',
                          background: 'linear-gradient(90deg, #5c3a1e, #8b5c2e, #6b4520, #3a2010)',
                          boxShadow: '0 4px 20px rgba(212,175,55,0.15)',
                        }}
                      />
                    </div>

                    {/* Gold shimmer on hover */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{ background: 'radial-gradient(circle at 50% 50%, rgba(212,175,55,0.06) 0%, transparent 70%)' }}
                    />

                    {/* Tags */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                      {product.is_limited_edition && (
                        <span
                          className="px-2 py-0.5 text-xs tracking-wider"
                          style={{ background: 'rgba(212,175,55,0.15)', color: '#D4AF37', fontFamily: 'sans-serif', border: '1px solid rgba(212,175,55,0.3)' }}
                        >
                          LE
                        </span>
                      )}
                      {product.is_travel_humidor && (
                        <span
                          className="px-2 py-0.5 text-xs tracking-wider"
                          style={{ background: 'rgba(147,112,71,0.15)', color: '#9b7347', fontFamily: 'sans-serif', border: '1px solid rgba(147,112,71,0.3)' }}
                        >
                          Travel
                        </span>
                      )}
                    </div>

                    {/* Stock badge */}
                    <div className="absolute top-3 right-3">
                      <span
                        className={`px-2 py-0.5 text-xs tracking-wider border rounded-full ${badge.cls}`}
                        style={{ fontFamily: 'sans-serif' }}
                      >
                        {badge.label}
                      </span>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="flex flex-col flex-1 p-5">
                    {/* Brand */}
                    <div
                      className="text-xs tracking-[0.25em] uppercase mb-1"
                      style={{ color: '#D4AF37', fontFamily: 'sans-serif' }}
                    >
                      {product.brand_name}
                    </div>

                    {/* Name */}
                    <h3
                      className="font-light mb-1 leading-tight"
                      style={{ fontSize: '1.05rem', color: '#e8dcc8', letterSpacing: '0.02em' }}
                    >
                      {product.series}
                    </h3>
                    <div
                      className="text-sm mb-3"
                      style={{ color: '#9b8c72', fontFamily: 'sans-serif' }}
                    >
                      {product.vitola} · {product.packaging_qty}s
                    </div>

                    {/* Description */}
                    <p
                      className="text-xs leading-relaxed flex-1 mb-4"
                      style={{ color: '#7a6d5a', fontFamily: 'sans-serif', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                    >
                      {product.short_description}
                    </p>

                    {/* Strength indicator */}
                    <div className="flex items-center gap-2 mb-4">
                      <Flame className="w-3.5 h-3.5" style={{ color: product.strength === 'full' ? '#D4AF37' : '#9b8c72' }} />
                      <div className="flex gap-1">
                        {['mild','medium','full'].map((s, i) => (
                          <div
                            key={s}
                            className="w-8 h-1 rounded-full transition-all duration-300"
                            style={{
                              background: ['mild','medium','full'].indexOf(product.strength) >= i
                                ? '#D4AF37' : 'rgba(212,175,55,0.15)',
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-xs" style={{ color: '#9b8c72', fontFamily: 'sans-serif' }}>
                        {strengthLabel(product.strength)}
                      </span>
                    </div>

                    {/* Footer: price + CTA */}
                    <div className="flex items-end justify-between pt-4" style={{ borderTop: '1px solid rgba(212,175,55,0.08)' }}>
                      <div>
                        {product.display_price ? (
                          <>
                            <div className="text-xs mb-0.5" style={{ color: '#7a6d5a', fontFamily: 'sans-serif' }}>
                              From
                            </div>
                            <div style={{ color: '#D4AF37', fontSize: '1.1rem', letterSpacing: '0.03em' }}>
                              {product.currency_symbol}{product.display_price.toLocaleString()}
                            </div>
                          </>
                        ) : (
                          <div className="text-xs" style={{ color: '#9b8c72', fontFamily: 'sans-serif' }}>
                            Price on Request
                          </div>
                        )}
                      </div>

                      <button
                        onClick={e => { e.stopPropagation(); product.enquiry_only ? setEnquiryOpen(true) : addToCart(product); }}
                        className="px-4 py-2 text-xs tracking-widest uppercase transition-all duration-300"
                        style={{
                          background: product.enquiry_only ? 'transparent' : '#D4AF37',
                          color: product.enquiry_only ? '#D4AF37' : '#0f0d0b',
                          border: '1px solid rgba(212,175,55,0.4)',
                          fontFamily: 'sans-serif',
                          letterSpacing: '0.1em',
                        }}
                        onMouseEnter={e => {
                          if (!product.enquiry_only) return;
                          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(212,175,55,0.1)';
                        }}
                        onMouseLeave={e => {
                          if (!product.enquiry_only) return;
                          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                        }}
                      >
                        {product.enquiry_only ? 'Enquire' : 'Add'}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ── CART DRAWER ────────────────────────────────────────────────────────── */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setCartOpen(false)} />
          <div
            className="relative flex flex-col w-full max-w-md h-full overflow-y-auto"
            style={{ background: '#1a1612', borderLeft: '1px solid rgba(212,175,55,0.15)' }}
          >
            <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
              <div>
                <div className="text-xs tracking-[0.35em] uppercase mb-0.5" style={{ color: '#D4AF37', fontFamily: 'sans-serif' }}>
                  Enquiry
                </div>
                <h3 className="text-lg font-light" style={{ color: '#e8dcc8' }}>Your Selection</h3>
              </div>
              <button onClick={() => setCartOpen(false)}>
                <X className="w-5 h-5" style={{ color: '#9b8c72' }} />
              </button>
            </div>

            <div className="flex-1 p-6">
              {cart.length === 0 ? (
                <div className="text-center py-12" style={{ color: '#9b8c72', fontFamily: 'sans-serif', fontSize: '14px' }}>
                  Your selection is empty.
                </div>
              ) : (
                <div className="space-y-5">
                  {cart.map(item => (
                    <div
                      key={item.id}
                      className="flex gap-4 pb-5"
                      style={{ borderBottom: '1px solid rgba(212,175,55,0.08)' }}
                    >
                      <div
                        className="w-16 h-16 flex-shrink-0 flex items-center justify-center"
                        style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.1)' }}
                      >
                        <Package className="w-6 h-6" style={{ color: '#D4AF37', opacity: 0.5 }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs tracking-wider uppercase mb-0.5" style={{ color: '#D4AF37', fontFamily: 'sans-serif' }}>
                          {item.brand_name}
                        </div>
                        <div className="font-light" style={{ color: '#e8dcc8', fontSize: '0.9rem' }}>{item.series}</div>
                        <div className="text-xs mb-2" style={{ color: '#7a6d5a', fontFamily: 'sans-serif' }}>{item.vitola}</div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQty(item.id, -1)}
                              className="w-6 h-6 flex items-center justify-center text-sm transition-colors hover:text-amber-300"
                              style={{ color: '#9b8c72', border: '1px solid rgba(212,175,55,0.2)', fontFamily: 'sans-serif' }}
                            >
                              −
                            </button>
                            <span style={{ color: '#e8dcc8', fontFamily: 'sans-serif', fontSize: '13px', minWidth: '20px', textAlign: 'center' }}>
                              {item.qty}
                            </span>
                            <button
                              onClick={() => updateQty(item.id, 1)}
                              className="w-6 h-6 flex items-center justify-center text-sm transition-colors hover:text-amber-300"
                              style={{ color: '#9b8c72', border: '1px solid rgba(212,175,55,0.2)', fontFamily: 'sans-serif' }}
                            >
                              +
                            </button>
                          </div>
                          {item.display_price && (
                            <span style={{ color: '#D4AF37', fontFamily: 'sans-serif', fontSize: '13px' }}>
                              {item.currency_symbol}{(item.display_price * item.qty).toLocaleString()}
                            </span>
                          )}
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="ml-auto transition-colors hover:text-red-400"
                            style={{ color: '#7a6d5a' }}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6" style={{ borderTop: '1px solid rgba(212,175,55,0.1)' }}>
                {cartTotal > 0 && (
                  <div className="flex justify-between mb-4">
                    <span style={{ color: '#9b8c72', fontFamily: 'sans-serif', fontSize: '13px' }}>Indicative Total</span>
                    <span style={{ color: '#D4AF37', fontFamily: 'sans-serif' }}>
                      {region.symbol}{cartTotal.toLocaleString()}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => { setCartOpen(false); setEnquiryOpen(true); }}
                  className="w-full py-4 text-sm tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2"
                  style={{
                    background: '#D4AF37',
                    color: '#0f0d0b',
                    fontFamily: 'sans-serif',
                    letterSpacing: '0.15em',
                  }}
                >
                  Submit Enquiry
                  <Send className="w-4 h-4" />
                </button>
                <p className="text-center text-xs mt-3" style={{ color: '#7a6d5a', fontFamily: 'sans-serif' }}>
                  Our team will contact you within 24 hours.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PRODUCT DETAIL MODAL ───────────────────────────────────────────────── */}
      {activeProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.8)' }} onClick={() => setActiveProduct(null)} />
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            style={{ background: '#1a1612', border: '1px solid rgba(212,175,55,0.15)' }}
          >
            <div className="p-8">
              <button
                onClick={() => setActiveProduct(null)}
                className="absolute top-6 right-6 transition-colors hover:text-amber-300"
                style={{ color: '#9b8c72' }}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-xs tracking-[0.35em] uppercase mb-1" style={{ color: '#D4AF37', fontFamily: 'sans-serif' }}>
                {activeProduct.brand_name}
              </div>
              <h2
                className="font-light mb-1"
                style={{ fontSize: '1.8rem', color: '#e8dcc8', letterSpacing: '0.03em' }}
              >
                {activeProduct.series}
              </h2>
              <p className="mb-6" style={{ color: '#9b8c72', fontFamily: 'sans-serif', fontSize: '14px' }}>
                {activeProduct.vitola} · {activeProduct.packaging_qty} cigars per box · {activeProduct.packaging_type}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { label: 'Strength', value: strengthLabel(activeProduct.strength) },
                  { label: 'Packaging', value: `${activeProduct.packaging_qty}'s ${activeProduct.packaging_type}` },
                  { label: 'SKU', value: activeProduct.sku },
                  { label: 'Region', value: region.name },
                ].map(({ label, value }) => (
                  <div key={label} style={{ borderTop: '1px solid rgba(212,175,55,0.1)', paddingTop: '12px' }}>
                    <div className="text-xs tracking-wider uppercase mb-1" style={{ color: '#9b8c72', fontFamily: 'sans-serif' }}>
                      {label}
                    </div>
                    <div style={{ color: '#e8dcc8', fontFamily: 'sans-serif', fontSize: '14px' }}>{value}</div>
                  </div>
                ))}
              </div>

              <p className="leading-relaxed mb-6" style={{ color: '#9b8c72', fontFamily: 'sans-serif', fontSize: '14px' }}>
                {activeProduct.short_description}
              </p>

              {activeProduct.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {activeProduct.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-3 py-1 text-xs tracking-wider"
                      style={{ border: '1px solid rgba(212,175,55,0.2)', color: '#D4AF37', fontFamily: 'sans-serif' }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-6" style={{ borderTop: '1px solid rgba(212,175,55,0.1)' }}>
                <div>
                  {activeProduct.display_price ? (
                    <div style={{ color: '#D4AF37', fontSize: '1.3rem' }}>
                      {activeProduct.currency_symbol}{activeProduct.display_price.toLocaleString()}
                    </div>
                  ) : (
                    <div style={{ color: '#9b8c72', fontFamily: 'sans-serif', fontSize: '13px' }}>Price on Request</div>
                  )}
                </div>
                <button
                  onClick={() => {
                    activeProduct.enquiry_only ? setEnquiryOpen(true) : addToCart(activeProduct);
                    setActiveProduct(null);
                  }}
                  className="px-8 py-3 text-xs tracking-widest uppercase transition-all duration-300"
                  style={{
                    background: activeProduct.enquiry_only ? 'transparent' : '#D4AF37',
                    color: activeProduct.enquiry_only ? '#D4AF37' : '#0f0d0b',
                    border: '1px solid rgba(212,175,55,0.4)',
                    fontFamily: 'sans-serif',
                    letterSpacing: '0.12em',
                  }}
                >
                  {activeProduct.enquiry_only ? 'Private Enquiry' : 'Add to Selection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ENQUIRY MODAL ──────────────────────────────────────────────────────── */}
      {enquiryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.8)' }} onClick={() => setEnquiryOpen(false)} />
          <div
            className="relative w-full max-w-lg"
            style={{ background: '#1a1612', border: '1px solid rgba(212,175,55,0.15)' }}
          >
            <div className="p-8">
              <button
                onClick={() => setEnquiryOpen(false)}
                className="absolute top-6 right-6 transition-colors"
                style={{ color: '#9b8c72' }}
              >
                <X className="w-5 h-5" />
              </button>

              {submitted ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4" style={{ color: '#D4AF37' }}>✦</div>
                  <h3 className="text-xl font-light mb-3" style={{ color: '#e8dcc8' }}>Enquiry Received</h3>
                  <p style={{ color: '#9b8c72', fontFamily: 'sans-serif', fontSize: '14px', lineHeight: 1.7 }}>
                    Our private client advisor will be in touch within 24 hours
                    to discuss your selection and arrange delivery to {region.name}.
                  </p>
                </div>
              ) : (
                <>
                  <div className="text-xs tracking-[0.35em] uppercase mb-2" style={{ color: '#D4AF37', fontFamily: 'sans-serif' }}>
                    Private Client Enquiry
                  </div>
                  <h3 className="text-xl font-light mb-6" style={{ color: '#e8dcc8' }}>
                    Begin Your Consultation
                  </h3>

                  <form
                    onSubmit={e => { e.preventDefault(); setSubmitted(true); setCart([]); }}
                    className="space-y-4"
                  >
                    {[
                      { label: 'Full Name', type: 'text', placeholder: 'Your name', name: 'name' },
                      { label: 'Email Address', type: 'email', placeholder: 'email@example.com', name: 'email' },
                      { label: 'Phone (optional)', type: 'tel', placeholder: '+852 xxxx xxxx', name: 'phone' },
                    ].map(({ label, type, placeholder, name }) => (
                      <div key={name}>
                        <label
                          className="block text-xs tracking-wider uppercase mb-2"
                          style={{ color: '#9b8c72', fontFamily: 'sans-serif' }}
                        >
                          {label}
                        </label>
                        <input
                          type={type}
                          name={name}
                          placeholder={placeholder}
                          required={name !== 'phone'}
                          className="w-full px-4 py-3 bg-transparent border text-sm outline-none transition-colors"
                          style={{
                            borderColor: 'rgba(212,175,55,0.2)',
                            color: '#e8dcc8',
                            fontFamily: 'sans-serif',
                          }}
                          onFocus={e => (e.target.style.borderColor = 'rgba(212,175,55,0.5)')}
                          onBlur={e  => (e.target.style.borderColor = 'rgba(212,175,55,0.2)')}
                        />
                      </div>
                    ))}

                    <div>
                      <label
                        className="block text-xs tracking-wider uppercase mb-2"
                        style={{ color: '#9b8c72', fontFamily: 'sans-serif' }}
                      >
                        Notes / Preferences
                      </label>
                      <textarea
                        name="notes"
                        rows={3}
                        placeholder="Budget range, preferred brands, occasion, delivery address…"
                        className="w-full px-4 py-3 bg-transparent border text-sm outline-none transition-colors resize-none"
                        style={{ borderColor: 'rgba(212,175,55,0.2)', color: '#e8dcc8', fontFamily: 'sans-serif' }}
                        onFocus={e => (e.target.style.borderColor = 'rgba(212,175,55,0.5)')}
                        onBlur={e  => (e.target.style.borderColor = 'rgba(212,175,55,0.2)')}
                      />
                    </div>

                    {cart.length > 0 && (
                      <div className="py-3 px-4" style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.1)' }}>
                        <div className="text-xs tracking-wider uppercase mb-2" style={{ color: '#D4AF37', fontFamily: 'sans-serif' }}>
                          Selected items ({cart.reduce((s, i) => s + i.qty, 0)})
                        </div>
                        {cart.map(item => (
                          <div key={item.id} className="flex justify-between text-xs" style={{ color: '#9b8c72', fontFamily: 'sans-serif' }}>
                            <span>{item.brand_name} {item.series} × {item.qty}</span>
                            {item.display_price && (
                              <span>{item.currency_symbol}{(item.display_price * item.qty).toLocaleString()}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-4 mt-2 text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                      style={{ background: '#D4AF37', color: '#0f0d0b', fontFamily: 'sans-serif', letterSpacing: '0.15em' }}
                    >
                      Submit Enquiry
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER ─────────────────────────────────────────────────────────────── */}
      <footer
        className="py-16"
        style={{ borderTop: '1px solid rgba(212,175,55,0.1)', marginTop: '80px' }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div>
              <div className="text-lg tracking-[0.2em] font-light mb-3" style={{ color: '#D4AF37' }}>
                ARRISONAPPS
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#7a6d5a', fontFamily: 'sans-serif' }}>
                For over a decade, Arrisonapps has been the trusted partner for
                discerning collectors and connoisseurs seeking the world's finest cigars.
              </p>
            </div>
            <div>
              <div className="text-xs tracking-[0.35em] uppercase mb-4" style={{ color: '#9b8c72', fontFamily: 'sans-serif' }}>
                Regions
              </div>
              <ul className="space-y-2">
                {REGIONS.map(r => (
                  <li key={r.code}>
                    <button
                      onClick={() => setRegion(r)}
                      className="text-sm transition-colors hover:text-amber-300"
                      style={{ color: region.code === r.code ? '#D4AF37' : '#7a6d5a', fontFamily: 'sans-serif' }}
                    >
                      {r.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs tracking-[0.35em] uppercase mb-4" style={{ color: '#9b8c72', fontFamily: 'sans-serif' }}>
                Contact
              </div>
              <ul className="space-y-2 text-sm" style={{ color: '#7a6d5a', fontFamily: 'sans-serif' }}>
                <li>enquiries@arrisonapps.com</li>
                <li>Private client line: +852 3xxx xxxx</li>
                <li>By appointment only</li>
              </ul>
            </div>
          </div>
          <div
            className="flex flex-col sm:flex-row items-center justify-between pt-8 text-xs gap-4"
            style={{ borderTop: '1px solid rgba(212,175,55,0.08)', color: '#7a6d5a', fontFamily: 'sans-serif' }}
          >
            <div>© {new Date().getFullYear()} Arrisonapps. All rights reserved.</div>
            <div>
              Built on{' '}
              <Link href="/vibe-demo" className="transition-colors hover:text-amber-300" style={{ color: '#9b8c72' }}>
                5ML Agentic Platform
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
