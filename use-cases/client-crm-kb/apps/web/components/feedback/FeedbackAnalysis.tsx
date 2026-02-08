'use client';

import React from 'react';
import { SentimentBadge } from '@/components/feedback/SentimentBadge';
import type { FeedbackEvent } from '@/types';

interface FeedbackAnalysisProps {
  feedback: FeedbackEvent;
}

export function FeedbackAnalysisDisplay({ feedback }: FeedbackAnalysisProps) {
  const hasAnalysis =
    feedback.sentiment !== null || (feedback.topics && feedback.topics.length > 0);

  if (!hasAnalysis) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
        <p className="text-sm text-gray-500">
          This feedback has not been analyzed yet. Click &quot;Analyze&quot; to run AI analysis.
        </p>
      </div>
    );
  }

  const requirements = feedback.extracted_requirements as Record<string, unknown> | null;

  return (
    <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-gray-800">AI Analysis</h3>

      {/* Sentiment */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-500">Sentiment</h4>
        <div className="flex items-center gap-4">
          <SentimentBadge
            sentiment={feedback.sentiment}
            score={feedback.sentiment_score}
            showScore
          />
          {feedback.sentiment_score !== null && feedback.sentiment_score !== undefined && (
            <div className="flex-1 max-w-xs">
              <div className="h-3 w-full rounded-full bg-gray-200 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    feedback.sentiment === 'positive'
                      ? 'bg-green-500'
                      : feedback.sentiment === 'negative'
                      ? 'bg-red-500'
                      : 'bg-gray-400'
                  }`}
                  style={{ width: `${Math.abs(feedback.sentiment_score) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Topics */}
      {feedback.topics && feedback.topics.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-500">Topics</h4>
          <div className="flex flex-wrap gap-2">
            {feedback.topics.map((topic, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Severity */}
      {feedback.severity && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-500">Severity</h4>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
              feedback.severity === 'critical'
                ? 'bg-red-100 text-red-700'
                : feedback.severity === 'major'
                ? 'bg-orange-100 text-orange-700'
                : feedback.severity === 'minor'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-blue-100 text-blue-700'
            }`}
          >
            {feedback.severity}
          </span>
        </div>
      )}

      {/* Extracted Requirements */}
      {requirements && Object.keys(requirements).length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-500">Extracted Requirements</h4>
          <div className="space-y-3">
            {/* Do's from requirements */}
            {Array.isArray(requirements.do) && (requirements.do as string[]).length > 0 && (
              <div>
                <h5 className="text-xs font-medium text-green-600 uppercase tracking-wide mb-1">
                  Should Do
                </h5>
                <ul className="space-y-1">
                  {(requirements.do as string[]).map((item, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
                      <span className="text-green-500">&#10003;</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Don'ts from requirements */}
            {Array.isArray(requirements.dont) && (requirements.dont as string[]).length > 0 && (
              <div>
                <h5 className="text-xs font-medium text-red-600 uppercase tracking-wide mb-1">
                  Should Not Do
                </h5>
                <ul className="space-y-1">
                  {(requirements.dont as string[]).map((item, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
                      <span className="text-red-500">&#10007;</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Changes from requirements */}
            {Array.isArray(requirements.changes) && (requirements.changes as string[]).length > 0 && (
              <div>
                <h5 className="text-xs font-medium text-orange-600 uppercase tracking-wide mb-1">
                  Requested Changes
                </h5>
                <ul className="space-y-1">
                  {(requirements.changes as string[]).map((item, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
                      <span className="text-orange-500">&#8227;</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
