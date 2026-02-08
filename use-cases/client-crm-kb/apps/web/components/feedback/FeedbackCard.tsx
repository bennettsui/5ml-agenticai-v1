'use client';

import React from 'react';
import Link from 'next/link';
import { SentimentBadge } from '@/components/feedback/SentimentBadge';
import type { FeedbackEvent } from '@/types';

interface FeedbackCardProps {
  feedback: FeedbackEvent;
  clientName?: string;
}

const STATUS_STYLES: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  reviewed: 'bg-yellow-100 text-yellow-700',
  converted_to_rule: 'bg-green-100 text-green-700',
  converted_to_pattern: 'bg-purple-100 text-purple-700',
  ignored: 'bg-gray-100 text-gray-500',
};

const SEVERITY_STYLES: Record<string, string> = {
  info: 'bg-blue-50 text-blue-600',
  minor: 'bg-yellow-50 text-yellow-600',
  major: 'bg-orange-50 text-orange-600',
  critical: 'bg-red-50 text-red-600',
};

const SOURCE_LABELS: Record<string, string> = {
  email: 'Email',
  meeting_notes: 'Meeting Notes',
  form: 'Form',
  chat: 'Chat',
  phone: 'Phone',
  other: 'Other',
};

export function FeedbackCard({ feedback, clientName }: FeedbackCardProps) {
  return (
    <Link href={`/feedback/${feedback.id}`}>
      <div className="rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-2">
            {/* Header row */}
            <div className="flex items-center gap-2 flex-wrap">
              {clientName && (
                <span className="text-sm font-medium text-gray-800">{clientName}</span>
              )}
              <span className="text-xs text-gray-400">
                {SOURCE_LABELS[feedback.source] || feedback.source}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(feedback.date).toLocaleDateString()}
              </span>
            </div>

            {/* Raw text preview */}
            <p className="text-sm text-gray-600 line-clamp-2">{feedback.raw_text}</p>

            {/* Topics */}
            {feedback.topics && feedback.topics.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {feedback.topics.map((topic, i) => (
                  <span
                    key={i}
                    className="inline-block rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Right column badges */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <SentimentBadge sentiment={feedback.sentiment} size="sm" />
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                STATUS_STYLES[feedback.status] || 'bg-gray-100 text-gray-500'
              }`}
            >
              {feedback.status.replace(/_/g, ' ')}
            </span>
            {feedback.severity && (
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  SEVERITY_STYLES[feedback.severity] || 'bg-gray-50 text-gray-500'
                }`}
              >
                {feedback.severity}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
