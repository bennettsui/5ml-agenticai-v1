'use client';

import React from 'react';
import Link from 'next/link';
import type { Pattern } from '@/types';

interface PatternCardProps {
  pattern: Pattern;
  showLink?: boolean;
}

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

export function PatternCard({ pattern, showLink = true }: PatternCardProps) {
  const content = (
    <div className="rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-semibold text-gray-800">{pattern.name}</h3>
          <span
            className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              SCOPE_STYLES[pattern.scope] || 'bg-gray-100 text-gray-600'
            }`}
          >
            {pattern.scope}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-2">{pattern.description}</p>

        {/* Category and channels */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            {CATEGORY_LABELS[pattern.category] || pattern.category}
          </span>
          {pattern.applicable_channels &&
            pattern.applicable_channels.map((channel, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded bg-indigo-50 px-2 py-0.5 text-xs text-indigo-600"
              >
                {channel}
              </span>
            ))}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span>Used: {pattern.usage_count}x</span>
          {pattern.effectiveness_score !== null && (
            <span className="flex items-center gap-1">
              Effectiveness:
              <span
                className={`font-medium ${
                  pattern.effectiveness_score >= 0.7
                    ? 'text-green-600'
                    : pattern.effectiveness_score >= 0.4
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }`}
              >
                {(pattern.effectiveness_score * 100).toFixed(0)}%
              </span>
            </span>
          )}
          {pattern.last_used_at && (
            <span>Last: {new Date(pattern.last_used_at).toLocaleDateString()}</span>
          )}
        </div>

        {/* Segment tags */}
        {pattern.segment_tags && pattern.segment_tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {pattern.segment_tags.map((tag, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (showLink) {
    return <Link href={`/kb/patterns/${pattern.id}`}>{content}</Link>;
  }

  return content;
}
