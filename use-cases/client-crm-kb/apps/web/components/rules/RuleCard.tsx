'use client';

import React from 'react';
import type { ClientRule } from '@/types';

interface RuleCardProps {
  rule: ClientRule;
  onEdit?: () => void;
  onDeprecate?: () => void;
  showClient?: boolean;
  clientName?: string;
}

const TYPE_STYLES: Record<string, string> = {
  hard: 'bg-red-100 text-red-700',
  soft: 'bg-amber-100 text-amber-700',
};

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  deprecated: 'bg-gray-100 text-gray-500',
};

export function RuleCard({
  rule,
  onEdit,
  onDeprecate,
  showClient = false,
  clientName,
}: RuleCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          {/* Description */}
          <p className="text-sm font-medium text-gray-800">{rule.description}</p>

          {/* Badges row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                TYPE_STYLES[rule.rule_type] || 'bg-gray-100 text-gray-600'
              }`}
            >
              {rule.rule_type}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                STATUS_STYLES[rule.status] || 'bg-gray-100 text-gray-500'
              }`}
            >
              {rule.status}
            </span>
            {showClient && clientName && (
              <span className="inline-flex items-center rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
                {clientName}
              </span>
            )}
          </div>

          {/* Applies to tags */}
          {rule.applies_to && rule.applies_to.length > 0 && (
            <div className="flex flex-wrap gap-1">
              <span className="text-xs text-gray-400 mr-1">Applies to:</span>
              {rule.applies_to.map((target, i) => (
                <span
                  key={i}
                  className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                >
                  {target}
                </span>
              ))}
            </div>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>Priority: {rule.priority}</span>
            <span>Used: {rule.usage_count}x</span>
            {rule.last_used_at && (
              <span>Last used: {new Date(rule.last_used_at).toLocaleDateString()}</span>
            )}
            {rule.origin_feedback_ids && rule.origin_feedback_ids.length > 0 && (
              <span>From {rule.origin_feedback_ids.length} feedback(s)</span>
            )}
          </div>

          {/* Deprecated reason */}
          {rule.status === 'deprecated' && rule.deprecated_reason && (
            <p className="text-xs text-gray-400 italic">
              Deprecated: {rule.deprecated_reason}
            </p>
          )}
        </div>

        {/* Action buttons */}
        {(onEdit || onDeprecate) && rule.status === 'active' && (
          <div className="flex items-center gap-1 shrink-0">
            {onEdit && (
              <button
                onClick={onEdit}
                className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              >
                Edit
              </button>
            )}
            {onDeprecate && (
              <button
                onClick={onDeprecate}
                className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
              >
                Deprecate
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
