'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FeedbackAnalysisDisplay } from '@/components/feedback/FeedbackAnalysis';
import { RuleSuggestionsDisplay } from '@/components/feedback/RuleSuggestions';
import { SentimentBadge } from '@/components/feedback/SentimentBadge';
import {
  feedback as feedbackApi,
  clients as clientsApi,
  rules as rulesApi,
} from '@/lib/api';
import type {
  FeedbackEvent,
  FeedbackAnalysis,
  RuleSuggestion,
  Client,
} from '@/types';

const STATUS_STYLES: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  reviewed: 'bg-yellow-100 text-yellow-700',
  converted_to_rule: 'bg-green-100 text-green-700',
  converted_to_pattern: 'bg-purple-100 text-purple-700',
  ignored: 'bg-gray-100 text-gray-500',
};

const SOURCE_LABELS: Record<string, string> = {
  email: 'Email',
  meeting_notes: 'Meeting Notes',
  form: 'Form',
  chat: 'Chat',
  phone: 'Phone',
  other: 'Other',
};

export default function FeedbackDetailPage() {
  const params = useParams();
  const feedbackId = params.id as string;
  const [feedbackItem, setFeedbackItem] = useState<FeedbackEvent | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestingRules, setSuggestingRules] = useState(false);
  const [ruleSuggestions, setRuleSuggestions] = useState<RuleSuggestion[]>([]);
  const [approvingIndex, setApprovingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadFeedback = useCallback(async () => {
    try {
      setLoading(true);
      const fb = await feedbackApi.get(feedbackId);
      setFeedbackItem(fb);

      try {
        const c = await clientsApi.get(fb.client_id);
        setClient(c);
      } catch {
        // Client may not be accessible
      }
    } catch {
      setError('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  }, [feedbackId]);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  const handleAnalyze = async () => {
    if (!feedbackItem) return;
    try {
      setAnalyzing(true);
      setError(null);
      const analysis: FeedbackAnalysis = await feedbackApi.analyze(feedbackItem.id);
      // Refresh the feedback to get updated data
      await loadFeedback();
      // Store rule suggestions from analysis
      if (analysis.rule_suggestions) {
        setRuleSuggestions(analysis.rule_suggestions);
      }
      setSuccessMessage('Analysis completed successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSuggestRules = async () => {
    if (!feedbackItem) return;
    try {
      setSuggestingRules(true);
      setError(null);
      const analysis: FeedbackAnalysis = await feedbackApi.analyze(feedbackItem.id);
      if (analysis.rule_suggestions) {
        setRuleSuggestions(analysis.rule_suggestions);
      }
      setSuccessMessage('Rule suggestions generated!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to suggest rules');
    } finally {
      setSuggestingRules(false);
    }
  };

  const handleApproveRule = async (index: number) => {
    if (!feedbackItem) return;
    const suggestion = ruleSuggestions[index];
    try {
      setApprovingIndex(index);
      await rulesApi.create({
        client_id: feedbackItem.client_id,
        description: suggestion.description,
        rule_type: suggestion.rule_type,
        applies_to: suggestion.applies_to,
        priority: suggestion.priority,
        origin_feedback_ids: [feedbackItem.id],
      });
      // Remove the approved suggestion
      setRuleSuggestions(ruleSuggestions.filter((_, i) => i !== index));
      setSuccessMessage('Rule created successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create rule');
    } finally {
      setApprovingIndex(null);
    }
  };

  const handleRejectRule = (index: number) => {
    setRuleSuggestions(ruleSuggestions.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!feedbackItem) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 text-center">
        <h1 className="text-xl font-semibold text-gray-800">Feedback not found</h1>
        <Link href="/feedback" className="text-blue-600 hover:underline mt-2 inline-block">
          Back to feedback list
        </Link>
      </div>
    );
  }

  const hasAnalysis =
    feedbackItem.sentiment !== null ||
    (feedbackItem.topics && feedbackItem.topics.length > 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/feedback" className="hover:text-blue-600 transition-colors">
          Feedback
        </Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">Detail</span>
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
            <h1 className="text-2xl font-bold text-gray-900">Feedback Detail</h1>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                STATUS_STYLES[feedbackItem.status] || 'bg-gray-100 text-gray-500'
              }`}
            >
              {feedbackItem.status.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            {client && (
              <Link
                href={`/clients/${client.id}`}
                className="text-blue-600 hover:underline"
              >
                {client.name}
              </Link>
            )}
            <span>{SOURCE_LABELS[feedbackItem.source] || feedbackItem.source}</span>
            <span>{new Date(feedbackItem.date).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!hasAnalysis && (
            <Button onClick={handleAnalyze} disabled={analyzing}>
              {analyzing ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Analyzing...
                </span>
              ) : (
                'Analyze'
              )}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleSuggestRules}
            disabled={suggestingRules}
          >
            {suggestingRules ? 'Suggesting...' : 'Suggest Rules'}
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        {/* Raw Feedback Text */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Raw Feedback</h3>
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{feedbackItem.raw_text}</p>
          </div>
          {feedbackItem.attachments && feedbackItem.attachments.length > 0 && (
            <div className="mt-4 border-t border-gray-100 pt-3">
              <h4 className="text-xs font-medium text-gray-500 mb-2">Attachments</h4>
              <div className="flex flex-wrap gap-2">
                {feedbackItem.attachments.map((att, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center rounded bg-gray-100 px-2 py-1 text-xs text-gray-600"
                  >
                    {att}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* AI Analysis Section */}
        <FeedbackAnalysisDisplay feedback={feedbackItem} />

        {/* Rule Suggestions Section */}
        <RuleSuggestionsDisplay
          suggestions={ruleSuggestions}
          onApprove={handleApproveRule}
          onReject={handleRejectRule}
          approving={approvingIndex}
        />

        {/* Processing Info */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Processing Status</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Status:</span>{' '}
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  STATUS_STYLES[feedbackItem.status] || 'bg-gray-100 text-gray-500'
                }`}
              >
                {feedbackItem.status.replace(/_/g, ' ')}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Sentiment:</span>{' '}
              <SentimentBadge sentiment={feedbackItem.sentiment} size="sm" />
            </div>
            {feedbackItem.processed_by && (
              <div>
                <span className="text-gray-500">Processed by:</span>{' '}
                <span className="text-gray-700">{feedbackItem.processed_by}</span>
              </div>
            )}
            {feedbackItem.processed_at && (
              <div>
                <span className="text-gray-500">Processed at:</span>{' '}
                <span className="text-gray-700">
                  {new Date(feedbackItem.processed_at).toLocaleString()}
                </span>
              </div>
            )}
            <div>
              <span className="text-gray-500">Created:</span>{' '}
              <span className="text-gray-700">
                {new Date(feedbackItem.created_at).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Updated:</span>{' '}
              <span className="text-gray-700">
                {new Date(feedbackItem.updated_at).toLocaleString()}
              </span>
            </div>
          </div>
          {feedbackItem.processing_notes && (
            <div className="mt-4 border-t border-gray-100 pt-3">
              <h4 className="text-xs font-medium text-gray-500 mb-1">Processing Notes</h4>
              <p className="text-sm text-gray-700">{feedbackItem.processing_notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
