'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { PatternCard } from '@/components/patterns/PatternCard';
import { RuleCard } from '@/components/rules/RuleCard';
import {
  patterns as patternsApi,
  rules as rulesApi,
  clients as clientsApi,
} from '@/lib/api';
import type {
  Pattern,
  ClientRule,
  Client,
  PatternScope,
  PatternCategory,
} from '@/types';

type ActiveTab = 'patterns' | 'rules';

const SCOPES: PatternScope[] = ['global', 'segment', 'client'];
const CHANNELS = ['social', 'website', 'video', 'design', 'copy'];

export default function KnowledgeBasePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('patterns');
  const [patternsList, setPatternsList] = useState<Pattern[]>([]);
  const [rulesList, setRulesList] = useState<ClientRule[]>([]);
  const [clientMap, setClientMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [filterScope, setFilterScope] = useState<PatternScope | 'all'>('all');
  const [filterChannel, setFilterChannel] = useState('');

  const loadClients = useCallback(async () => {
    try {
      const res = await clientsApi.list({ size: 200 });
      const map: Record<string, string> = {};
      res.items.forEach((c) => {
        map[c.id] = c.name;
      });
      setClientMap(map);
    } catch {
      // Handle error
    }
  }, []);

  const loadPatterns = useCallback(async () => {
    try {
      const res = await patternsApi.list({
        scope: filterScope !== 'all' ? filterScope : undefined,
        size: 100,
      });
      setPatternsList(res.items);
    } catch {
      // Handle error
    }
  }, [filterScope]);

  const loadRules = useCallback(async () => {
    try {
      const res = await rulesApi.list({ status: 'active', size: 100 });
      setRulesList(res.items);
    } catch {
      // Handle error
    }
  }, []);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([loadClients(), loadPatterns(), loadRules()]);
      setLoading(false);
    }
    init();
  }, [loadClients, loadPatterns, loadRules]);

  // Filter patterns locally by search and channel
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

  // Filter rules locally by search
  const filteredRules = rulesList.filter((r) => {
    if (
      search &&
      !r.description.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  // Group rules by client
  const rulesGroupedByClient: Record<string, ClientRule[]> = {};
  filteredRules.forEach((rule) => {
    const key = rule.client_id;
    if (!rulesGroupedByClient[key]) {
      rulesGroupedByClient[key] = [];
    }
    rulesGroupedByClient[key].push(rule);
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
        <p className="mt-1 text-sm text-gray-500">
          Browse patterns, rules, and accumulated knowledge across all clients.
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search patterns and rules..."
          className="max-w-xl"
        />
      </div>

      {/* Filters Row */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">Scope:</label>
          <select
            value={filterScope}
            onChange={(e) =>
              setFilterScope(e.target.value as PatternScope | 'all')
            }
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            {SCOPES.map((s) => (
              <option key={s} value={s}>
                {s}
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

        <Link
          href="/kb/search"
          className="ml-auto text-sm text-blue-600 hover:underline"
        >
          Advanced Search
        </Link>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-1">
          <button
            onClick={() => setActiveTab('patterns')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'patterns'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Patterns ({filteredPatterns.length})
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'rules'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Rules ({filteredRules.length})
          </button>
        </nav>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Patterns Tab */}
          {activeTab === 'patterns' && (
            <>
              {filteredPatterns.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
                  <p className="text-gray-500 text-sm">No patterns found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPatterns.map((pattern) => (
                    <PatternCard key={pattern.id} pattern={pattern} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Rules Tab */}
          {activeTab === 'rules' && (
            <>
              {filteredRules.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
                  <p className="text-gray-500 text-sm">No rules found.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(rulesGroupedByClient).map(
                    ([cId, clientRules]) => (
                      <div key={cId}>
                        <h3 className="text-sm font-semibold text-gray-600 mb-3">
                          <Link
                            href={`/clients/${cId}`}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {clientMap[cId] || 'Unknown Client'}
                          </Link>
                          <span className="text-gray-400 font-normal ml-2">
                            ({clientRules.length} rules)
                          </span>
                        </h3>
                        <div className="space-y-2">
                          {clientRules.map((rule) => (
                            <RuleCard key={rule.id} rule={rule} />
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
