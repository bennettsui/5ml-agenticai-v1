'use client';

import React from 'react';
import type { Sentiment } from '@/types';

interface SentimentBadgeProps {
  sentiment: Sentiment | null;
  score?: number | null;
  showScore?: boolean;
  size?: 'sm' | 'md';
}

const SENTIMENT_STYLES: Record<Sentiment, string> = {
  positive: 'bg-green-100 text-green-700 border-green-200',
  neutral: 'bg-gray-100 text-gray-700 border-gray-200',
  negative: 'bg-red-100 text-red-700 border-red-200',
};

const SENTIMENT_LABELS: Record<Sentiment, string> = {
  positive: 'Positive',
  neutral: 'Neutral',
  negative: 'Negative',
};

export function SentimentBadge({
  sentiment,
  score,
  showScore = false,
  size = 'md',
}: SentimentBadgeProps) {
  if (!sentiment) {
    return (
      <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-400">
        Unanalyzed
      </span>
    );
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${SENTIMENT_STYLES[sentiment]} ${sizeClasses}`}
    >
      {SENTIMENT_LABELS[sentiment]}
      {showScore && score !== null && score !== undefined && (
        <span className="opacity-70">({(score * 100).toFixed(0)}%)</span>
      )}
    </span>
  );
}
