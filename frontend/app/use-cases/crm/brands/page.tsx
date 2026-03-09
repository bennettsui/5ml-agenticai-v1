'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  Plus,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Building2,
  TrendingUp,
  FolderKanban,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { crmApi, type Brand, type PaginatedResponse } from '@/lib/crm-kb-api';
import { useCrmAi } from '../context';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-900/40 text-green-300 border-green-700',
  prospect: 'bg-blue-900/40 text-blue-300 border-blue-700',
  dormant: 'bg-yellow-900/40 text-yellow-300 border-yellow-700',
  lost: 'bg-red-900/40 text-red-300 border-red-700',
};

const STATUS_DOT: Record<string, string> = {
  active: 'bg-green-400',
  prospect: 'bg-blue-400',
  dormant: 'bg-yellow-400',
  lost: 'bg-red-400',
};

const TIER_COLORS: Record<string, string> = {
  A: 'bg-amber-500/20 text-amber-300 border-amber-600/50',
  B: 'bg-slate-500/20 text-slate-300 border-slate-500/50',
  C: 'bg-slate-600/20 text-slate-400 border-slate-600/50',
  D: 'bg-slate-700/20 text-slate-500 border-slate-600/50',
};

function healthColor(score: number): string {
  if (score >= 70) return 'bg-green-500';
  if (score >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
}

function healthTextColor(score: number): string {
  if (score >= 70) return 'text-green-400';
  if (score >= 40) return 'text-yellow-400';
  return 'text-red-400';
}

export default function BrandsPage() {
  const router = useRouter();
  const { setPageState } = useCrmAi();

  useEffect(() => {
    setPageState({ pageType: 'brands-list', pageTitle: 'Brands' });
  }, []);

  const [brands, setBrands] = useState<Brand[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = useCallback(async (e: React.MouseEvent, brand: Brand) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm(`Delete "${brand.name}"? This cannot be undone.`)) return;
    setDeletingId(brand.id);
    try {
      await crmApi.brands.delete(brand.id);
      setBrands((prev) => prev.filter((b) => b.id !== brand.id));
      setTotal((t) => t - 1);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete brand');
    } finally {
      setDeletingId(null);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data: PaginatedResponse<Brand> = await crmApi.brands.list({
        page,
        size: 20,
        search: debouncedSearch || undefined,
      });
      setBrands(data.items ?? []);
      setTotalPages(data.pages ?? 1);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load brands');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-800/80 rounded-xl">
            <Users className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Brands</h1>
            {!loading && (
              <p className="text-xs text-slate-400 mt-0.5">{total} brand{total !== 1 ? 's' : ''} total</p>
            )}
          </div>
        </div>
        <Link
          href="/use-cases/crm/brands/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          New Brand
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search brands by name, industry, or region..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 text-sm transition-colors"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-4 mb-6">
          <p className="text-red-300 text-sm">{error}</p>
          <button
            onClick={fetchBrands}
            className="mt-2 text-sm text-red-200 underline hover:text-white"
          >
            Try again
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-7 h-7 text-emerald-400 animate-spin" />
        </div>
      )}

      {/* Empty */}
      {!loading && !error && brands.length === 0 && (
        <div className="text-center py-20">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg mb-2">No brands found</p>
          <p className="text-slate-500 text-sm mb-6">
            {debouncedSearch
              ? 'Try adjusting your search terms.'
              : 'Get started by adding your first brand.'}
          </p>
          {!debouncedSearch && (
            <Link
              href="/use-cases/crm/brands/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Brand
            </Link>
          )}
        </div>
      )}

      {/* Brand Cards Grid */}
      {!loading && brands.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {brands.map((brand) => (
              <div
                key={brand.id}
                onClick={() => router.push(`/use-cases/crm/brands/detail?id=${brand.id}`)}
                className="group relative bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 hover:border-slate-600 hover:bg-slate-800/80 cursor-pointer transition-all"
              >
                {/* Delete button */}
                <button
                  onClick={(e) => handleDelete(e, brand)}
                  disabled={deletingId === brand.id}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-all disabled:opacity-40"
                  title="Delete brand"
                >
                  {deletingId === brand.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Trash2 className="w-3.5 h-3.5" />
                  }
                </button>

                {/* Brand name + status */}
                <div className="mb-3 pr-6">
                  <div className="flex items-start gap-2 mb-1">
                    <div className="p-1.5 bg-slate-700/60 rounded-lg flex-shrink-0">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-white leading-tight line-clamp-1">
                      {brand.name}
                    </h3>
                  </div>
                  {brand.legal_name && brand.legal_name !== brand.name && (
                    <p className="text-xs text-slate-500 truncate ml-7">{brand.legal_name}</p>
                  )}
                </div>

                {/* Status + tier row */}
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                      STATUS_COLORS[brand.status] ?? 'bg-slate-700 text-slate-300 border-slate-600'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[brand.status] ?? 'bg-slate-500'}`} />
                    {brand.status}
                  </span>
                  {brand.client_value_tier && (
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${
                        TIER_COLORS[brand.client_value_tier] ?? 'bg-slate-700 text-slate-300 border-slate-600'
                      }`}
                    >
                      Tier {brand.client_value_tier}
                    </span>
                  )}
                </div>

                {/* Industry tags */}
                {brand.industry && brand.industry.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {brand.industry.slice(0, 3).map((ind, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-slate-700/50 text-slate-400 text-[11px] rounded-full border border-slate-600/50"
                      >
                        {ind}
                      </span>
                    ))}
                    {brand.industry.length > 3 && (
                      <span className="px-2 py-0.5 text-slate-500 text-[11px]">
                        +{brand.industry.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Health score */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-3 h-3 text-slate-500" />
                      <span className="text-[11px] text-slate-400">Health</span>
                    </div>
                    <span className={`text-[11px] font-semibold ${healthTextColor(brand.health_score)}`}>
                      {brand.health_score}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${healthColor(brand.health_score)}`}
                      style={{ width: `${brand.health_score}%` }}
                    />
                  </div>
                </div>

                {/* Footer: website + region */}
                <div className="flex items-center gap-3 pt-3 border-t border-slate-700/40">
                  {brand.region && brand.region.length > 0 && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Globe className="w-3 h-3" />
                      {brand.region.slice(0, 2).join(', ')}
                    </div>
                  )}
                  {brand.website_url && (
                    <a
                      href={brand.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="ml-auto flex items-center gap-1 text-[11px] text-slate-500 hover:text-emerald-400 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Website
                    </a>
                  )}
                  <Link
                    href={`/use-cases/crm/projects?brand=${brand.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="ml-auto flex items-center gap-1 text-[11px] text-slate-500 hover:text-emerald-400 transition-colors"
                  >
                    <FolderKanban className="w-3 h-3" />
                    Projects
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-1">
              <p className="text-xs text-slate-400">
                Page {page} of {totalPages} ({total} brands)
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Prev
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
