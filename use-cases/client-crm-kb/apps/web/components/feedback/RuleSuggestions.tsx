'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import type { RuleSuggestion } from '@/types';

interface RuleSuggestionsProps {
  suggestions: RuleSuggestion[];
  onApprove: (index: number) => void;
  onReject: (index: number) => void;
  approving?: number | null;
}

const TYPE_STYLES: Record<string, string> = {
  hard: 'bg-red-100 text-red-700 border-red-200',
  soft: 'bg-yellow-100 text-yellow-700 border-yellow-200',
};

export function RuleSuggestionsDisplay({
  suggestions,
  onApprove,
  onReject,
  approving = null,
}: RuleSuggestionsProps) {
  if (suggestions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
        <p className="text-sm text-gray-500">
          No rule suggestions available. Click &quot;Suggest Rules&quot; to generate suggestions from this feedback.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Rule Suggestions</h3>
      <div className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <div
            key={index}
            className="rounded-lg border border-gray-200 bg-white p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium text-gray-800">
                  {suggestion.description}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                      TYPE_STYLES[suggestion.rule_type] || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {suggestion.rule_type}
                  </span>
                  {suggestion.applies_to.map((target, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                    >
                      {target}
                    </span>
                  ))}
                  <span className="text-xs text-gray-400">
                    Priority: {suggestion.priority}
                  </span>
                  <span className="text-xs text-gray-400">
                    Confidence: {(suggestion.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Confidence bar */}
            <div className="space-y-1">
              <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{ width: `${suggestion.confidence * 100}%` }}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-1">
              <Button
                size="sm"
                onClick={() => onApprove(index)}
                disabled={approving === index}
                className="bg-green-600 hover:bg-green-700"
              >
                {approving === index ? 'Approving...' : 'Approve & Create Rule'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReject(index)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Reject
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
