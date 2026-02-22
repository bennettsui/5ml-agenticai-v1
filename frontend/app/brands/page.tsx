'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus,
  Trash2,
  Edit3,
  Copy,
  Eye,
  Loader2,
  AlertCircle,
  Search,
  Filter,
  ChevronRight,
  MapPin,
  Users,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { INDUSTRY_TEMPLATES } from '@/lib/brand-setup-config';

interface BrandData {
  id: number;
  brand_id: string;
  brand_name: string;
  industry: string;
  brand_info: {
    profile: any;
    pillars: any[];
    calendar: any[];
    kpis: any;
    summary: any;
  };
  created_at: string;
  updated_at: string;
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<BrandData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<BrandData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Fetch all brands
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/brands');
        if (!response.ok) throw new Error('Failed to fetch brands');
        const data = await response.json();
        setBrands(data.brands || []);
      } catch (err) {
        console.error('Error fetching brands:', err);
        setError('Failed to load brands. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchBrands();
  }, []);

  // Filter brands
  const filteredBrands = brands.filter((brand) => {
    const matchesSearch = brand.brand_name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesIndustry = !selectedIndustry || brand.industry === selectedIndustry;
    return matchesSearch && matchesIndustry;
  });

  // Delete brand
  const handleDelete = async (brandName: string, brandId: string) => {
    if (!confirm(`Are you sure you want to delete "${brandName}"?`)) return;

    setDeletingId(brandId);
    try {
      const response = await fetch(`/api/brands/${brandName}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete brand');

      setBrands((prev) => prev.filter((b) => b.brand_id !== brandId));
      if (selectedBrand?.brand_id === brandId) {
        setShowDetailModal(false);
        setSelectedBrand(null);
      }
    } catch (err) {
      console.error('Error deleting brand:', err);
      alert('Failed to delete brand. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  // Duplicate brand
  const handleDuplicate = async (brand: BrandData) => {
    const newName = `${brand.brand_name} (Copy)`;
    try {
      const response = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_name: newName,
          industry: brand.industry,
          brand_info: brand.brand_info,
        }),
      });

      if (!response.ok) throw new Error('Failed to duplicate brand');

      const newBrand = await response.json();
      setBrands((prev) => [newBrand.brand, ...prev]);
      alert(`Brand duplicated as "${newName}"`);
    } catch (err) {
      console.error('Error duplicating brand:', err);
      alert('Failed to duplicate brand. Please try again.');
    }
  };

  const industryOptions = Array.from(
    new Set(brands.map((b) => b.industry).filter(Boolean))
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Your Brands</h1>
              <p className="text-xs text-slate-400 mt-1">
                Manage and organize your social media strategies
              </p>
            </div>
            <Link
              href="/brand-setup"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              New Brand
            </Link>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and filters */}
        <div className="mb-6 space-y-3">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search brands..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="pl-10 pr-4 py-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none cursor-pointer"
              >
                <option value="">All Industries</option>
                {industryOptions.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {searchTerm || selectedIndustry ? (
            <div className="text-xs text-slate-500">
              Found {filteredBrands.length} brand{filteredBrands.length !== 1 ? 's' : ''}
            </div>
          ) : null}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 text-slate-600 mx-auto mb-3 animate-spin" />
            <p className="text-slate-400">Loading brands...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-6">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredBrands.length === 0 && !error && (
          <div className="text-center py-16">
            <div className="inline-flex p-4 rounded-2xl bg-slate-800/50 mb-4">
              <TrendingUp className="w-8 h-8 text-slate-600" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No brands yet</h3>
            <p className="text-sm text-slate-400 mb-6">
              {searchTerm || selectedIndustry
                ? 'No brands match your filters. Try adjusting them.'
                : 'Get started by creating your first brand strategy.'}
            </p>
            {!searchTerm && !selectedIndustry && (
              <Link
                href="/brand-setup"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 transition-colors font-medium text-sm"
              >
                <Plus className="w-4 h-4" />
                Create First Brand
              </Link>
            )}
          </div>
        )}

        {/* Brands grid */}
        {!loading && filteredBrands.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBrands.map((brand) => (
              <div
                key={brand.brand_id}
                className="group bg-slate-900/60 border border-slate-700/50 rounded-xl overflow-hidden hover:border-slate-700 transition-colors"
              >
                {/* Card header */}
                <div className="p-4 border-b border-slate-700/30">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white truncate">{brand.brand_name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {brand.industry || 'N/A'}
                      </p>
                    </div>
                    <span className="ml-2 text-xs px-2 py-1 rounded-full bg-slate-800/50 text-slate-400 whitespace-nowrap">
                      {brand.brand_info?.profile?.postsPerWeek || '—'} posts/week
                    </span>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-4 space-y-3">
                  {/* Quick stats */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded bg-slate-800/30 border border-slate-700/30">
                      <div className="text-[10px] text-slate-600 mb-1">Channels</div>
                      <div className="text-xs font-medium text-slate-200">
                        {brand.brand_info?.profile?.primaryChannels?.length || 0}
                      </div>
                    </div>
                    <div className="p-2 rounded bg-slate-800/30 border border-slate-700/30">
                      <div className="text-[10px] text-slate-600 mb-1">Budget</div>
                      <div className="text-xs font-medium text-slate-200">
                        {brand.brand_info?.profile?.monthlyBudgetHKD
                          ? `HK$${(brand.brand_info.profile.monthlyBudgetHKD / 1000).toFixed(0)}K`
                          : '—'}
                      </div>
                    </div>
                  </div>

                  {/* Pillars preview */}
                  {brand.brand_info?.pillars && brand.brand_info.pillars.length > 0 && (
                    <div>
                      <div className="text-[10px] text-slate-600 mb-1.5">Top Pillars</div>
                      <div className="flex gap-1 flex-wrap">
                        {brand.brand_info.pillars.slice(0, 3).map((pillar: any, i: number) => (
                          <span
                            key={i}
                            className="text-[10px] px-2 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20"
                          >
                            {pillar.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="text-[10px] text-slate-600">
                    Updated {new Date(brand.updated_at).toLocaleDateString()}
                  </div>
                </div>

                {/* Card footer */}
                <div className="px-4 py-3 border-t border-slate-700/30 flex items-center justify-between gap-2 bg-slate-900/30">
                  <button
                    onClick={() => {
                      setSelectedBrand(brand);
                      setShowDetailModal(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View
                  </button>
                  <Link
                    href={`/brand-setup?edit=${brand.brand_name}`}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDuplicate(brand)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Clone
                  </button>
                  <button
                    onClick={() => handleDelete(brand.brand_name, brand.brand_id)}
                    disabled={deletingId === brand.brand_id}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                  >
                    {deletingId === brand.brand_id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {showDetailModal && selectedBrand && (
        <BrandDetailModal
          brand={selectedBrand}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedBrand(null);
          }}
        />
      )}
    </div>
  );
}

// Brand detail modal component
function BrandDetailModal({
  brand,
  onClose,
}: {
  brand: BrandData;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal header */}
        <div className="sticky top-0 border-b border-slate-700/30 bg-slate-900/95 backdrop-blur px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">{brand.brand_name}</h2>
            <p className="text-xs text-slate-400 mt-1">{brand.industry}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal body */}
        <div className="p-6 space-y-6">
          {/* Profile overview */}
          <section>
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              Brand Profile
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
                <div className="text-[10px] text-slate-600 mb-1">Posts/Week</div>
                <div className="font-medium text-white">
                  {brand.brand_info?.profile?.postsPerWeek || '—'}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
                <div className="text-[10px] text-slate-600 mb-1">Monthly Budget</div>
                <div className="font-medium text-white">
                  HK${brand.brand_info?.profile?.monthlyBudgetHKD?.toLocaleString() || '—'}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
                <div className="text-[10px] text-slate-600 mb-1">Channels</div>
                <div className="font-medium text-white text-sm">
                  {brand.brand_info?.profile?.primaryChannels?.join(', ') || '—'}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
                <div className="text-[10px] text-slate-600 mb-1">Approval Cycle</div>
                <div className="font-medium text-white">
                  {brand.brand_info?.profile?.approvalCycleDays &&
                    `${(brand.brand_info.profile.approvalCycleDays * 24).toFixed(0)}h` || '—'}
                </div>
              </div>
            </div>
          </section>

          {/* Content Pillars */}
          {brand.brand_info?.pillars && brand.brand_info.pillars.length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-white mb-3">Content Pillars</h3>
              <div className="space-y-2">
                {brand.brand_info.pillars.map((pillar: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-300">{pillar.name}</span>
                        <span className="text-xs font-bold text-purple-400">{pillar.allocation}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                          style={{ width: `${pillar.allocation}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* KPI Targets */}
          {brand.brand_info?.kpis && (
            <section>
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                KPI Targets
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
                  <div className="text-[10px] text-slate-600 mb-1">Engagement Rate</div>
                  <div className="text-lg font-bold text-green-400">
                    {brand.brand_info.kpis.engagementRate}%
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
                  <div className="text-[10px] text-slate-600 mb-1">Monthly Reach</div>
                  <div className="text-lg font-bold text-green-400">
                    {(brand.brand_info.kpis.reach / 1000).toFixed(0)}K
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
                  <div className="text-[10px] text-slate-600 mb-1">Ad ROAS</div>
                  <div className="text-lg font-bold text-green-400">
                    {brand.brand_info.kpis.adROAS}x
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
                  <div className="text-[10px] text-slate-600 mb-1">Conversion Rate</div>
                  <div className="text-lg font-bold text-green-400">
                    {brand.brand_info.kpis.conversionRate}%
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Strategy Summary */}
          {brand.brand_info?.summary && (
            <section>
              <h3 className="text-sm font-bold text-white mb-3">Strategy Summary</h3>
              <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
                <p className="text-sm text-slate-300 leading-relaxed">
                  {brand.brand_info.summary.keyInsights[0] || 'No summary available'}
                </p>
              </div>
            </section>
          )}
        </div>

        {/* Modal footer */}
        <div className="border-t border-slate-700/30 bg-slate-900/95 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors font-medium"
          >
            Close
          </button>
          <Link
            href={`/brand-setup?edit=${brand.brand_name}`}
            className="flex-1 px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 transition-colors text-white font-medium text-center"
          >
            Edit Brand
          </Link>
        </div>
      </div>
    </div>
  );
}
