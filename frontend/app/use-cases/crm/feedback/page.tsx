"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  MessageSquare,
  FileText,
  Phone,
  MessageCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import {
  crmApi,
  type FeedbackEvent,
  type PaginatedResponse,
  type Sentiment,
  type FeedbackSeverity,
  type FeedbackStatus,
  type FeedbackSource,
} from "@/lib/crm-kb-api";
import { useCrmAi } from '../context';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sentimentColors: Record<Sentiment, string> = {
  positive:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  neutral:
    "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
  negative:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const severityColors: Record<FeedbackSeverity, string> = {
  info: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  minor:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  major:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const statusColors: Record<FeedbackStatus, string> = {
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  reviewed:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  converted_to_rule:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  converted_to_pattern:
    "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  ignored:
    "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
};

const sourceIcons: Record<FeedbackSource, React.ComponentType<{ className?: string }>> = {
  email: Mail,
  meeting_notes: FileText,
  form: FileText,
  chat: MessageCircle,
  phone: Phone,
  other: HelpCircle,
};

function formatStatusLabel(status: FeedbackStatus): string {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "\u2026";
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------------------
// Filter buttons
// ---------------------------------------------------------------------------

const SENTIMENT_OPTIONS: Array<{ label: string; value: string }> = [
  { label: "All", value: "" },
  { label: "Positive", value: "positive" },
  { label: "Neutral", value: "neutral" },
  { label: "Negative", value: "negative" },
];

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function FeedbackPage() {
  const { setPageState } = useCrmAi();

  useEffect(() => {
    setPageState({ pageType: 'feedback', pageTitle: 'Feedback' });
  }, []);

  const [sentiment, setSentiment] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedResponse<FeedbackEvent> | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await crmApi.feedback.list({
        page,
        size: 20,
        sentiment: sentiment || undefined,
      });
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load feedback events"
      );
    } finally {
      setLoading(false);
    }
  }, [page, sentiment]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setPage(1);
  }, [sentiment]);

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/use-cases/crm"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to CRM KB
          </Link>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-emerald-400" />
            Feedback
          </h1>
          <p className="text-slate-400 mt-2">
            Browse and filter client feedback events with AI-detected sentiment
            and topics.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Sentiment filter */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {SENTIMENT_OPTIONS.map((opt) => {
            const active =
              opt.value === sentiment ||
              (opt.value === "" && sentiment === "");
            return (
              <button
                key={opt.value}
                onClick={() => setSentiment(opt.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <span className="ml-3 text-slate-400">Loading feedback...</span>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <AlertTriangle className="w-10 h-10 text-red-400 mb-3" />
            <p className="text-red-400 font-medium mb-1">
              Something went wrong
            </p>
            <p className="text-slate-500 text-sm mb-4">{error}</p>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-slate-700 text-slate-200 rounded-lg text-sm hover:bg-slate-600 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && data && data.items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <MessageSquare className="w-10 h-10 text-slate-600 mb-3" />
            <p className="text-slate-400 font-medium">
              No feedback events found
            </p>
            <p className="text-slate-500 text-sm mt-1">
              {sentiment
                ? "Try changing the sentiment filter."
                : "Feedback events will appear here once collected."}
            </p>
          </div>
        )}

        {/* Cards list */}
        {!loading && !error && data && data.items.length > 0 && (
          <>
            <div className="grid grid-cols-1 gap-4">
              {data.items.map((event) => {
                const SourceIcon =
                  sourceIcons[event.source] || HelpCircle;

                return (
                  <div
                    key={event.id}
                    className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-colors"
                  >
                    {/* Top row: source icon, date, badges */}
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <div className="flex items-center gap-2 text-slate-400">
                        <SourceIcon className="w-4 h-4" />
                        <span className="text-xs font-medium capitalize">
                          {event.source.replace(/_/g, " ")}
                        </span>
                      </div>

                      <span className="text-xs text-slate-500">
                        {formatDate(event.date)}
                      </span>

                      {/* Sentiment badge */}
                      {event.sentiment && (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${sentimentColors[event.sentiment]}`}
                        >
                          {event.sentiment}
                        </span>
                      )}

                      {/* Severity badge */}
                      {event.severity && (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${severityColors[event.severity]}`}
                        >
                          {event.severity}
                        </span>
                      )}

                      {/* Status badge */}
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[event.status]}`}
                      >
                        {formatStatusLabel(event.status)}
                      </span>
                    </div>

                    {/* Excerpt */}
                    <p className="text-sm text-slate-300 leading-relaxed mb-3">
                      {truncate(event.raw_text, 150)}
                    </p>

                    {/* Topics */}
                    {event.topics && event.topics.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {event.topics.map((topic) => (
                          <span
                            key={topic}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-slate-700 text-slate-300 text-xs font-medium"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {data.pages > 1 && (
              <div className="flex items-center justify-between mt-8">
                <p className="text-sm text-slate-500">
                  Page {data.page} of {data.pages} &middot; {data.total}{" "}
                  total events
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="inline-flex items-center gap-1 px-3 py-2 text-sm rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Prev
                  </button>
                  <button
                    onClick={() =>
                      setPage((p) => Math.min(data.pages, p + 1))
                    }
                    disabled={page >= data.pages}
                    className="inline-flex items-center gap-1 px-3 py-2 text-sm rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
