"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Activity,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
  ExternalLink,
  AlertTriangle,
  Zap,
} from "lucide-react";
import {
  crmApi,
  type GmailStatus,
  type OrchestrationStatus,
} from "@/lib/crm-kb-api";
import { useCrmAi } from '../context';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateTime(iso: string | null): string {
  if (!iso) return "Never";
  try {
    return new Date(iso).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function circuitBreakerColor(
  state: OrchestrationStatus["circuit_breaker_state"]
): { bg: string; text: string; label: string } {
  switch (state) {
    case "CLOSED":
      return {
        bg: "bg-green-100 dark:bg-green-900/30",
        text: "text-green-800 dark:text-green-300",
        label: "Closed (Healthy)",
      };
    case "OPEN":
      return {
        bg: "bg-red-100 dark:bg-red-900/30",
        text: "text-red-800 dark:text-red-300",
        label: "Open (Tripped)",
      };
    case "HALF_OPEN":
      return {
        bg: "bg-yellow-100 dark:bg-yellow-900/30",
        text: "text-yellow-800 dark:text-yellow-300",
        label: "Half-Open (Testing)",
      };
  }
}

function pct(used: number, limit: number): number {
  if (limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function IntegrationsPage() {
  const { setPageState } = useCrmAi();

  useEffect(() => {
    setPageState({ pageType: 'integrations', pageTitle: 'Integrations' });
  }, []);

  // Gmail state
  const [gmail, setGmail] = useState<GmailStatus | null>(null);
  const [gmailLoading, setGmailLoading] = useState(true);
  const [gmailError, setGmailError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  // Orchestration state
  const [orch, setOrch] = useState<OrchestrationStatus | null>(null);
  const [orchLoading, setOrchLoading] = useState(true);
  const [orchError, setOrchError] = useState<string | null>(null);

  // Fetch Gmail status
  const fetchGmail = useCallback(async () => {
    setGmailLoading(true);
    setGmailError(null);
    try {
      const result = await crmApi.gmail.status();
      setGmail(result);
    } catch (err) {
      setGmailError(
        err instanceof Error ? err.message : "Failed to fetch Gmail status"
      );
    } finally {
      setGmailLoading(false);
    }
  }, []);

  // Fetch orchestration status
  const fetchOrch = useCallback(async () => {
    setOrchLoading(true);
    setOrchError(null);
    try {
      const result = await crmApi.orchestration.status();
      setOrch(result);
    } catch (err) {
      setOrchError(
        err instanceof Error
          ? err.message
          : "Failed to fetch orchestration status"
      );
    } finally {
      setOrchLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGmail();
    fetchOrch();
  }, [fetchGmail, fetchOrch]);

  // Connect Gmail
  const handleConnect = async () => {
    setConnecting(true);
    try {
      const { auth_url } = await crmApi.gmail.authUrl();
      window.open(auth_url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setGmailError(
        err instanceof Error
          ? err.message
          : "Failed to get Gmail auth URL"
      );
    } finally {
      setConnecting(false);
    }
  };

  // Sync Gmail
  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await crmApi.gmail.sync();
      setSyncResult(
        `Synced ${result.synced_count} emails, ${result.new_feedback_count} new feedback events created.`
      );
      // Refresh status after sync
      fetchGmail();
    } catch (err) {
      setSyncResult(
        err instanceof Error ? err.message : "Sync failed"
      );
    } finally {
      setSyncing(false);
    }
  };

  const tokenPct = orch
    ? pct(orch.daily_tokens_used, orch.daily_token_limit)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
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
            <Zap className="w-8 h-8 text-emerald-400" />
            Integrations
          </h1>
          <p className="text-slate-400 mt-2">
            Manage Gmail integration and AI orchestration settings.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ----------------------------------------------------------------- */}
          {/* Gmail Card                                                        */}
          {/* ----------------------------------------------------------------- */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-900/30 rounded-lg">
                <Mail className="w-5 h-5 text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Gmail</h2>
            </div>

            {/* Loading */}
            {gmailLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                <span className="ml-2 text-slate-400 text-sm">
                  Loading status...
                </span>
              </div>
            )}

            {/* Error */}
            {!gmailLoading && gmailError && (
              <div className="text-center py-8">
                <AlertTriangle className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <p className="text-slate-400 text-sm mb-1">
                  Not configured
                </p>
                <p className="text-slate-500 text-xs mb-4">{gmailError}</p>
                <button
                  onClick={fetchGmail}
                  className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg text-xs hover:bg-slate-600 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Content */}
            {!gmailLoading && !gmailError && gmail && (
              <div className="space-y-4">
                {/* Connection status */}
                <div className="flex items-center gap-2">
                  {gmail.connected ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      gmail.connected ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {gmail.connected ? "Connected" : "Disconnected"}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email</span>
                    <span className="text-slate-200">
                      {gmail.email || "---"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Last Sync</span>
                    <span className="text-slate-200">
                      {formatDateTime(gmail.last_sync_at)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Synced</span>
                    <span className="text-slate-200">
                      {gmail.total_synced.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Sync result banner */}
                {syncResult && (
                  <div className="bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-xs text-slate-300">
                    {syncResult}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  {!gmail.connected && (
                    <button
                      onClick={handleConnect}
                      disabled={connecting}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {connecting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ExternalLink className="w-4 h-4" />
                      )}
                      Connect Gmail
                    </button>
                  )}
                  {gmail.connected && (
                    <button
                      onClick={handleSync}
                      disabled={syncing}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {syncing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      Sync Now
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ----------------------------------------------------------------- */}
          {/* AI Orchestration Card                                             */}
          {/* ----------------------------------------------------------------- */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-900/30 rounded-lg">
                <Activity className="w-5 h-5 text-purple-400" />
              </div>
              <h2 className="text-xl font-bold text-white">
                AI Orchestration
              </h2>
            </div>

            {/* Loading */}
            {orchLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                <span className="ml-2 text-slate-400 text-sm">
                  Loading status...
                </span>
              </div>
            )}

            {/* Error */}
            {!orchLoading && orchError && (
              <div className="text-center py-8">
                <AlertTriangle className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <p className="text-slate-400 text-sm mb-1">
                  Not configured
                </p>
                <p className="text-slate-500 text-xs mb-4">{orchError}</p>
                <button
                  onClick={fetchOrch}
                  className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg text-xs hover:bg-slate-600 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Content */}
            {!orchLoading && !orchError && orch && (
              <div className="space-y-5">
                {/* Circuit breaker */}
                {(() => {
                  const cb = circuitBreakerColor(orch.circuit_breaker_state);
                  return (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">
                        Circuit Breaker
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cb.bg} ${cb.text}`}
                      >
                        {cb.label}
                      </span>
                    </div>
                  );
                })()}

                {/* Active model */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Active Model</span>
                  <span className="text-sm text-slate-200 font-mono">
                    {orch.active_model}
                  </span>
                </div>

                {/* Token usage */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-slate-400">
                      Daily Tokens
                    </span>
                    <span className="text-xs text-slate-400">
                      {orch.daily_tokens_used.toLocaleString()} /{" "}
                      {orch.daily_token_limit.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        tokenPct >= 90
                          ? "bg-red-500"
                          : tokenPct >= 70
                            ? "bg-yellow-500"
                            : "bg-emerald-500"
                      }`}
                      style={{ width: `${tokenPct}%` }}
                    />
                  </div>
                </div>

                {/* Cost usage */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Daily Cost</span>
                  <span className="text-sm text-slate-200">
                    ${orch.daily_cost_used_usd.toFixed(2)} / $
                    {orch.daily_cost_limit_usd.toFixed(2)}
                  </span>
                </div>

                {/* Budget warning */}
                {orch.budget_warning && (
                  <div className="flex items-center gap-2 bg-yellow-900/20 border border-yellow-800/40 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                    <span className="text-xs text-yellow-300">
                      Budget warning: approaching daily spending limit.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
