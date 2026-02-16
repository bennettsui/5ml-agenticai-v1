'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MinusCircle,
  Loader2,
  Wifi,
  WifiOff,
  Clock,
  Server,
  Database,
  Brain,
  Mail,
  Image,
  Globe,
  Key,
} from 'lucide-react';

interface ServiceResult {
  id: string;
  name: string;
  status: 'connected' | 'configured' | 'error' | 'not_configured';
  latencyMs?: number;
  detail?: string;
  error?: string;
}

interface HealthResponse {
  timestamp: string;
  summary: { total: number; connected: number; configured: number; errors: number; notConfigured: number };
  services: ServiceResult[];
}

const SERVICE_ICONS: Record<string, typeof Brain> = {
  anthropic: Brain,
  deepseek: Brain,
  perplexity: Brain,
  openai: Brain,
  database: Database,
  notion: Globe,
  resend: Mail,
  dropbox: Server,
  comfyui: Image,
  'meta-ads': Globe,
  'google-ads': Globe,
  gmail: Mail,
};

const SERVICE_GROUPS: Record<string, string[]> = {
  'LLM Providers': ['anthropic', 'deepseek', 'perplexity', 'openai'],
  'Database': ['database'],
  'External Services': ['notion', 'resend', 'dropbox', 'comfyui'],
  'Ads Integrations': ['meta-ads', 'google-ads', 'gmail'],
};

const STATUS_CONFIG = {
  connected:      { label: 'Connected',      color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-500/30', Icon: CheckCircle2 },
  configured:     { label: 'Configured',     color: 'text-blue-400',    bg: 'bg-blue-400/10',    border: 'border-blue-500/30',    Icon: Key },
  error:          { label: 'Error',          color: 'text-rose-400',    bg: 'bg-rose-400/10',    border: 'border-rose-500/30',    Icon: XCircle },
  not_configured: { label: 'Not Configured', color: 'text-slate-500',   bg: 'bg-slate-500/10',   border: 'border-slate-600/30',   Icon: MinusCircle },
};

export default function ApiHealthCheck() {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/health/services');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: HealthResponse = await res.json();
      setData(json);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHealth(); }, [fetchHealth]);

  const serviceMap = new Map((data?.services || []).map(s => [s.id, s]));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">API & Service Health</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Live connection status for all external services and API keys
          </p>
        </div>
        <button
          onClick={fetchHealth}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Testing...' : 'Re-test All'}
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-rose-500/10 border border-red-200 dark:border-rose-500/30 text-red-700 dark:text-rose-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Failed to reach health endpoint: {error}
        </div>
      )}

      {/* Summary cards */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <SummaryCard label="Total" value={data.summary.total} icon={Server} color="text-slate-400" />
          <SummaryCard label="Connected" value={data.summary.connected} icon={Wifi} color="text-emerald-400" />
          <SummaryCard label="Configured" value={data.summary.configured} icon={Key} color="text-blue-400" />
          <SummaryCard label="Errors" value={data.summary.errors} icon={WifiOff} color="text-rose-400" />
          <SummaryCard label="Not Set" value={data.summary.notConfigured} icon={MinusCircle} color="text-slate-500" />
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !data && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Testing API connections...</p>
          </div>
        </div>
      )}

      {/* Service groups */}
      {data && Object.entries(SERVICE_GROUPS).map(([groupName, serviceIds]) => {
        const groupServices = serviceIds
          .map(id => serviceMap.get(id))
          .filter((s): s is ServiceResult => !!s);

        if (groupServices.length === 0) return null;

        return (
          <div key={groupName} className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{groupName}</h3>
            <div className="space-y-3">
              {groupServices.map(service => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          </div>
        );
      })}

      {/* Timestamp */}
      {data && (
        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Last tested: {new Date(data.timestamp).toLocaleString()}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: typeof Server; color: string }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{label}</span>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className="text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
    </div>
  );
}

function ServiceCard({ service }: { service: ServiceResult }) {
  const cfg = STATUS_CONFIG[service.status] || STATUS_CONFIG.error;
  const StatusIcon = cfg.Icon;
  const SvcIcon = SERVICE_ICONS[service.id] || Server;

  return (
    <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${cfg.border} ${cfg.bg} transition-colors`}>
      <div className="flex items-center gap-3 min-w-0">
        <SvcIcon className="w-5 h-5 text-slate-500 dark:text-slate-400 shrink-0" />
        <div className="min-w-0">
          <div className="font-semibold text-sm text-slate-900 dark:text-white">{service.name}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {service.detail || service.error || service.id}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 ml-4">
        {service.latencyMs != null && (
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {service.latencyMs}ms
          </span>
        )}
        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          {cfg.label}
        </div>
      </div>
    </div>
  );
}
