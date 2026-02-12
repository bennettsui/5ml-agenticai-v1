'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PatternCard } from '@/components/patterns/PatternCard';
import { patterns as patternsApi } from '@/lib/api';
import type { Pattern, PatternScope, PatternCategory } from '@/types';

const SCOPES: PatternScope[] = ['global', 'segment', 'client'];
const CATEGORIES: PatternCategory[] = [
  'error_pattern',
  'best_practice',
  'playbook',
  'standard',
];
const CHANNELS = ['social', 'website', 'video', 'design', 'copy'];

const CATEGORY_LABELS: Record<string, string> = {
  error_pattern: 'Error Pattern',
  best_practice: 'Best Practice',
  playbook: 'Playbook',
  standard: 'Standard',
};

export default function PatternsListPage() {
  const [patternsList, setPatternsList] = useState<Pattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 24;

  // Filters
  const [search, setSearch] = useState('');
  const [filterScope, setFilterScope] = useState<PatternScope | ''>('');
  const [filterCategory, setFilterCategory] = useState<PatternCategory | ''>('');
  const [filterChannel, setFilterChannel] = useState('');

  const loadPatterns = useCallback(async () => {
    try {
      setLoading(true);
      const res = await patternsApi.list({
        scope: filterScope || undefined,
        category: filterCategory || undefined,
        page,
        size: pageSize,
      });
      setPatternsList(res.items);
      setTotal(res.total);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  }, [filterScope, filterCategory, page]);

  useEffect(() => {
    loadPatterns();
  }, [loadPatterns]);

  // Client-side filters for search and channel
  const filteredPatterns = patternsList.filter((p) => {
    if (
      search &&
      !p.name.toLowerCase().includes(search.toLowerCase()) &&
      !p.description.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    if (
      filterChannel &&
      (!p.applicable_channels ||
        !p.applicable_channels.some((ch) =>
          ch.toLowerCase().includes(filterChannel.toLowerCase())
        ))
    ) {
      return false;
    }
    return true;
  });

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/kb" className="hover:text-blue-600 transition-colors">
          Knowledge Base
        </Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">Patterns</span>
      </nav>

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Patterns</h1>
        <p className="mt-1 text-sm text-gray-500">
          Discovered patterns, best practices, and playbooks from across all client work.
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search patterns..."
          className="max-w-xl"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">Scope:</label>
          <div className="flex gap-1">
            <button
              onClick={() => {
                setFilterScope('');
                setPage(1);
              }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filterScope === ''
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {SCOPES.map((s) => {
              const scopeColors: Record<string, string> = {
                global: filterScope === s ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700 hover:bg-purple-200',
                segment: filterScope === s ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200',
                client: filterScope === s ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200',
              };
              return (
                <button
                  key={s}
                  onClick={() => {
                    setFilterScope(s);
                    setPage(1);
                  }}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${scopeColors[s]}`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">Category:</label>
          <select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value as PatternCategory | '');
              setPage(1);
            }}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c] || c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">Channel:</label>
          <select
            value={filterChannel}
            onChange={(e) => setFilterChannel(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            {CHANNELS.map((ch) => (
              <option key={ch} value={ch}>
                {ch}
              </option>
            ))}
          </select>
        </div>

        <span className="text-sm text-gray-400">
          {filteredPatterns.length} result{filteredPatterns.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Patterns Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : filteredPatterns.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <p className="text-gray-500 text-sm">No patterns found matching your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatterns.map((pattern) => (
            <PatternCard key={pattern.id} pattern={pattern} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
