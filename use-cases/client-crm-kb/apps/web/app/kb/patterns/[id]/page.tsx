'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { patterns as patternsApi, clients as clientsApi } from '@/lib/api';
import type { Pattern, Client, PatternScope } from '@/types';

const SCOPE_STYLES: Record<string, string> = {
  global: 'bg-purple-100 text-purple-700',
  segment: 'bg-blue-100 text-blue-700',
  client: 'bg-green-100 text-green-700',
};

const CATEGORY_LABELS: Record<string, string> = {
  error_pattern: 'Error Pattern',
  best_practice: 'Best Practice',
  playbook: 'Playbook',
  standard: 'Standard',
};

const PROMOTE_LABELS: Record<string, string> = {
  client: 'Promote to Segment',
  segment: 'Promote to Global',
};

export default function PatternDetailPage() {
  const params = useParams();
  const patternId = params.id as string;
  const [pattern, setPattern] = useState<Pattern | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadPattern = useCallback(async () => {
    try {
      setLoading(true);
      const data = await patternsApi.get(patternId);
      setPattern(data);

      if (data.client_id) {
        try {
          const c = await clientsApi.get(data.client_id);
          setClient(c);
        } catch {
          // Client may not be accessible
        }
      }
    } catch {
      setError('Failed to load pattern');
    } finally {
      setLoading(false);
    }
  }, [patternId]);

  useEffect(() => {
    loadPattern();
  }, [loadPattern]);

  const handlePromote = async () => {
    if (!pattern) return;
    const nextScope: Record<string, PatternScope> = {
      client: 'segment',
      segment: 'global',
    };
    const newScope = nextScope[pattern.scope];
    if (!newScope) return;

    try {
      setPromoting(true);
      setError(null);
      await patternsApi.update(pattern.id, {
        scope: newScope,
        client_id: newScope === 'global' ? null : pattern.client_id,
      });
      await loadPattern();
      setSuccessMessage(`Pattern promoted to ${newScope} scope!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Promotion failed');
    } finally {
      setPromoting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!pattern) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 text-center">
        <h1 className="text-xl font-semibold text-gray-800">Pattern not found</h1>
        <Link href="/kb/patterns" className="text-blue-600 hover:underline mt-2 inline-block">
          Back to patterns
        </Link>
      </div>
    );
  }

  const exampleCases = pattern.example_cases as Record<string, unknown> | null;
  const canPromote = pattern.scope !== 'global';

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/kb" className="hover:text-blue-600 transition-colors">
          Knowledge Base
        </Link>
        <span>/</span>
        <Link href="/kb/patterns" className="hover:text-blue-600 transition-colors">
          Patterns
        </Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">{pattern.name}</span>
      </nav>

      {/* Messages */}
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700 mb-6">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="rounded-md bg-green-50 border border-green-200 p-4 text-sm text-green-700 mb-6">
          {successMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{pattern.name}</h1>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                SCOPE_STYLES[pattern.scope] || 'bg-gray-100 text-gray-600'
              }`}
            >
              {pattern.scope}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              {CATEGORY_LABELS[pattern.category] || pattern.category}
            </span>
            {client && (
              <Link href={`/clients/${client.id}`} className="text-blue-600 hover:underline">
                {client.name}
              </Link>
            )}
            <span>Created: {new Date(pattern.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        {canPromote && (
          <Button onClick={handlePromote} disabled={promoting} className="bg-purple-600 hover:bg-purple-700">
            {promoting ? 'Promoting...' : PROMOTE_LABELS[pattern.scope]}
          </Button>
        )}
      </div>

      <div className="space-y-8">
        {/* Description */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Description</h3>
          <p className="text-gray-700">{pattern.description}</p>
        </div>

        {/* Channels */}
        {pattern.applicable_channels && pattern.applicable_channels.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Applicable Channels</h3>
            <div className="flex flex-wrap gap-2">
              {pattern.applicable_channels.map((channel, i) => (
                <span
                  key={i}
                  className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-sm text-indigo-700"
                >
                  {channel}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Trigger Conditions */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Trigger Conditions</h3>
          {pattern.trigger_conditions ? (
            <p className="text-gray-700 whitespace-pre-wrap">{pattern.trigger_conditions}</p>
          ) : (
            <p className="text-sm text-gray-400 italic">No trigger conditions defined.</p>
          )}
        </div>

        {/* Recommended Actions */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Recommended Actions</h3>
          {pattern.recommended_actions && pattern.recommended_actions.length > 0 ? (
            <ol className="space-y-2">
              {pattern.recommended_actions.map((action, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  {action}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-gray-400 italic">No recommended actions defined.</p>
          )}
        </div>

        {/* Example Cases */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Example Cases</h3>
          {exampleCases && Object.keys(exampleCases).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(exampleCases).map(([key, value]) => (
                <div key={key} className="rounded-md border border-gray-100 bg-gray-50 p-4">
                  <h4 className="text-sm font-medium text-gray-600 mb-1">{key}</h4>
                  <p className="text-sm text-gray-700">
                    {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No example cases recorded.</p>
          )}
        </div>

        {/* Segment Tags */}
        {pattern.segment_tags && pattern.segment_tags.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Segment Tags</h3>
            <div className="flex flex-wrap gap-2">
              {pattern.segment_tags.map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Usage Stats & Effectiveness */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Usage & Effectiveness</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-800">{pattern.usage_count}</div>
              <div className="text-sm text-gray-500 mt-1">Times Used</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-800">
                {pattern.effectiveness_score !== null
                  ? `${(pattern.effectiveness_score * 100).toFixed(0)}%`
                  : 'N/A'}
              </div>
              <div className="text-sm text-gray-500 mt-1">Effectiveness</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-medium text-gray-800">
                {pattern.last_used_at
                  ? new Date(pattern.last_used_at).toLocaleDateString()
                  : 'Never'}
              </div>
              <div className="text-sm text-gray-500 mt-1">Last Used</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-medium text-gray-800">
                {new Date(pattern.created_at).toLocaleDateString()}
              </div>
              <div className="text-sm text-gray-500 mt-1">Created</div>
            </div>
          </div>

          {/* Effectiveness bar */}
          {pattern.effectiveness_score !== null && (
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                <span>Effectiveness Score</span>
                <span>{(pattern.effectiveness_score * 100).toFixed(0)}%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-gray-200 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    pattern.effectiveness_score >= 0.7
                      ? 'bg-green-500'
                      : pattern.effectiveness_score >= 0.4
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${pattern.effectiveness_score * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Metadata</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">ID:</span>{' '}
              <span className="text-gray-700 font-mono text-xs">{pattern.id}</span>
            </div>
            <div>
              <span className="text-gray-500">Scope:</span>{' '}
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  SCOPE_STYLES[pattern.scope]
                }`}
              >
                {pattern.scope}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Created by:</span>{' '}
              <span className="text-gray-700">{pattern.created_by || 'System'}</span>
            </div>
            <div>
              <span className="text-gray-500">Updated:</span>{' '}
              <span className="text-gray-700">
                {new Date(pattern.updated_at).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
