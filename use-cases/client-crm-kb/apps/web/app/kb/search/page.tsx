'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { kb as kbApi, clients as clientsApi } from '@/lib/api';
import type { Client } from '@/types';

interface SearchResult {
  type: string;
  id: string;
  title: string;
  snippet: string;
  score: number;
}

export default function KBSearchPage() {
  const [query, setQuery] = useState('');
  const [clientId, setClientId] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [clientsLoaded, setClientsLoaded] = useState(false);

  const loadClients = useCallback(async () => {
    if (clientsLoaded) return;
    try {
      const res = await clientsApi.list({ size: 200 });
      setAllClients(res.items);
      setClientsLoaded(true);
    } catch {
      // Handle error
    }
  }, [clientsLoaded]);

  // Load clients on first interaction
  const handleFocus = () => {
    loadClients();
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;

    try {
      setLoading(true);
      setSearched(true);
      const res = await kbApi.search({
        query: query.trim(),
        client_id: clientId || undefined,
        limit: 50,
      });
      setResults(res.results);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getResultLink = (result: SearchResult): string => {
    switch (result.type) {
      case 'pattern':
        return `/kb/patterns/${result.id}`;
      case 'rule':
        return `/kb?tab=rules`;
      case 'feedback':
        return `/feedback/${result.id}`;
      default:
        return '#';
    }
  };

  const getTypeStyle = (type: string): string => {
    switch (type) {
      case 'pattern':
        return 'bg-purple-100 text-purple-700';
      case 'rule':
        return 'bg-amber-100 text-amber-700';
      case 'feedback':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Group results by type
  const groupedResults: Record<string, SearchResult[]> = {};
  results.forEach((r) => {
    if (!groupedResults[r.type]) {
      groupedResults[r.type] = [];
    }
    groupedResults[r.type].push(r);
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/kb" className="hover:text-blue-600 transition-colors">
          Knowledge Base
        </Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">Search</span>
      </nav>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Knowledge Base Search</h1>
        <p className="mt-1 text-sm text-gray-500">
          Search across all rules, patterns, and knowledge entries.
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="space-y-4 mb-8">
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={handleFocus}
              placeholder="Search for patterns, rules, best practices..."
              className="text-lg h-12"
              autoFocus
            />
          </div>
          <Button type="submit" disabled={loading || !query.trim()} className="h-12 px-6">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Searching...
              </span>
            ) : (
              'Search'
            )}
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600">Client context:</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              onFocus={handleFocus}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All (no client filter)</option>
              {allClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </form>

      {/* Results */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <p className="text-gray-500 text-sm">
            No results found for &quot;{query}&quot;. Try different keywords or broaden your search.
          </p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-8">
          <div className="text-sm text-gray-500">
            {results.length} result{results.length !== 1 ? 's' : ''} found
          </div>

          {Object.entries(groupedResults).map(([type, typeResults]) => (
            <div key={type}>
              <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getTypeStyle(
                    type
                  )}`}
                >
                  {type}
                </span>
                <span className="text-sm text-gray-400 font-normal">
                  ({typeResults.length})
                </span>
              </h2>

              <div className="space-y-3">
                {typeResults.map((result) => (
                  <Link key={`${result.type}-${result.id}`} href={getResultLink(result)}>
                    <div className="rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-1">
                          <h3 className="text-sm font-medium text-gray-800">
                            {result.title}
                          </h3>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {result.snippet}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getTypeStyle(
                              result.type
                            )}`}
                          >
                            {result.type}
                          </span>
                          <span className="text-xs text-gray-400">
                            {(result.score * 100).toFixed(0)}% match
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
