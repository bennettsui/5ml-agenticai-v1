'use brand';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, Plus, Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { crmApi, type Brand, type PaginatedResponse } from '@/lib/crm-kb-api';
import { useCrmAi } from '../context';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-900/40 text-green-300 border-green-700',
  prospect: 'bg-blue-900/40 text-blue-300 border-blue-700',
  dormant: 'bg-yellow-900/40 text-yellow-300 border-yellow-700',
  lost: 'bg-red-900/40 text-red-300 border-red-700',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
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
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Debounce search input
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
      setBrands(data.items);
      setTotalPages(data.pages);
      setTotal(data.total);
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
    <div className="bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-7 h-7 text-emerald-400" />
              <h1 className="text-2xl font-bold text-white">Brands</h1>
              {!loading && (
                <span className="text-sm text-slate-400 ml-2">
                  ({total} total)
                </span>
              )}
            </div>
            <Link
              href="/use-cases/crm/brands/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              New Client
            </Link>
          </div>

          {/* Search bar */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search brands by name, industry, or region..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error State */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-300 text-sm">{error}</p>
            <button
              onClick={fetchBrands}
              className="mt-2 text-sm text-red-200 underline hover:text-white"
            >
              Try again
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <span className="ml-3 text-slate-400 text-sm">Loading brands...</span>
          </div>
        )}

        {/* Empty State */}
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
                Add Client
              </Link>
            )}
          </div>
        )}

        {/* Brands Table */}
        {!loading && brands.length > 0 && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-800/80">
                    <th className="text-left px-6 py-3 text-slate-400 font-medium">Name</th>
                    <th className="text-left px-6 py-3 text-slate-400 font-medium">Industry</th>
                    <th className="text-left px-6 py-3 text-slate-400 font-medium">Status</th>
                    <th className="text-left px-6 py-3 text-slate-400 font-medium">Health Score</th>
                    <th className="text-left px-6 py-3 text-slate-400 font-medium">Value Tier</th>
                    <th className="text-left px-6 py-3 text-slate-400 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {brands.map((brand) => (
                    <tr
                      key={brand.id}
                      onClick={() => {
                        router.push(`/use-cases/crm/brands/detail?id=${brand.id}`);
                      }}
                      className={`border-b border-slate-700/50 cursor-pointer transition-colors ${
                        selectedId === brand.id
                          ? 'bg-emerald-900/20'
                          : 'hover:bg-slate-700/50'
                      }`}
                    >
                      <td className="px-6 py-4 text-white font-medium">{brand.name}</td>
                      <td className="px-6 py-4 text-slate-300">
                        {brand.industry?.join(', ') || <span className="text-slate-500">--</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            STATUS_COLORS[brand.status] ?? 'bg-slate-700 text-slate-300 border-slate-600'
                          }`}
                        >
                          {brand.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
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
                          <span className="text-slate-300 text-xs">{brand.health_score}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {brand.client_value_tier ? (
                          <span className="inline-block w-7 h-7 text-center leading-7 rounded-md bg-slate-700 text-white text-xs font-bold">
                            {brand.client_value_tier}
                          </span>
                        ) : (
                          <span className="text-slate-500">--</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs">
                        {formatDate(brand.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700">
                <p className="text-xs text-slate-400">
                  Page {page} of {totalPages} ({total} brands)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Prev
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
