'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FeedbackCard } from '@/components/feedback/FeedbackCard';
import { feedback as feedbackApi, clients as clientsApi } from '@/lib/api';
import type {
  FeedbackEvent,
  Client,
  Sentiment,
  FeedbackStatus,
  FeedbackSeverity,
} from '@/types';

const SENTIMENTS: Sentiment[] = ['positive', 'neutral', 'negative'];
const STATUSES: FeedbackStatus[] = [
  'new',
  'reviewed',
  'converted_to_rule',
  'converted_to_pattern',
  'ignored',
];
const SEVERITIES: FeedbackSeverity[] = ['info', 'minor', 'major', 'critical'];

export default function FeedbackListPage() {
  const [feedbackItems, setFeedbackItems] = useState<FeedbackEvent[]>([]);
  const [clientMap, setClientMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Filters
  const [filterClientId, setFilterClientId] = useState('');
  const [filterSentiment, setFilterSentiment] = useState<Sentiment | ''>('');
  const [filterStatus, setFilterStatus] = useState<FeedbackStatus | ''>('');
  const [filterSeverity, setFilterSeverity] = useState<FeedbackSeverity | ''>('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [allClients, setAllClients] = useState<Client[]>([]);

  const loadClients = useCallback(async () => {
    try {
      const res = await clientsApi.list({ size: 100 });
      setAllClients(res.items);
      const map: Record<string, string> = {};
      res.items.forEach((c) => {
        map[c.id] = c.name;
      });
      setClientMap(map);
    } catch {
      // Handle error
    }
  }, []);

  const loadFeedback = useCallback(async () => {
    try {
      setLoading(true);
      const res = await feedbackApi.list({
        client_id: filterClientId || undefined,
        sentiment: filterSentiment || undefined,
        status: filterStatus || undefined,
        page,
        size: pageSize,
      });
      setFeedbackItems(res.items);
      setTotal(res.total);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  }, [filterClientId, filterSentiment, filterStatus, page]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  // Client-side filters for severity and date range
  const filteredItems = feedbackItems.filter((item) => {
    if (filterSeverity && item.severity !== filterSeverity) return false;
    if (filterDateFrom && item.date < filterDateFrom) return false;
    if (filterDateTo && item.date > filterDateTo) return false;
    return true;
  });

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feedback</h1>
          <p className="mt-1 text-sm text-gray-500">
            All client feedback across projects and channels.
          </p>
        </div>
        <Link href="/feedback/new">
          <Button>Log New Feedback</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Client</label>
            <select
              value={filterClientId}
              onChange={(e) => {
                setFilterClientId(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Clients</option>
              {allClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Sentiment</label>
            <select
              value={filterSentiment}
              onChange={(e) => {
                setFilterSentiment(e.target.value as Sentiment | '');
                setPage(1);
              }}
              className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              {SENTIMENTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value as FeedbackStatus | '');
                setPage(1);
              }}
              className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Severity</label>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value as FeedbackSeverity | '')}
              className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Date From</label>
            <Input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Date To</label>
            <Input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-500 mb-4">
        Showing {filteredItems.length} of {total} feedback items
      </div>

      {/* Feedback List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <p className="text-gray-500 text-sm">
            No feedback found matching your filters.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <FeedbackCard
              key={item.id}
              feedback={item}
              clientName={clientMap[item.client_id]}
            />
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
