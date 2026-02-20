'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2, Eye, Download, ArrowRight } from 'lucide-react';

interface SavedChart {
  id: string;
  name: string;
  birth_info?: any;
  gan_zhi?: any;
  created_at?: string;
}

export default function ZiweiChartLibrary() {
  const router = useRouter();
  const [charts, setCharts] = useState<SavedChart[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCharts();
  }, []);

  const loadCharts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ziwei/charts');
      if (!response.ok) throw new Error('Failed to fetch charts');
      const data = await response.json();
      setCharts(data.charts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load charts');
      console.error('Error loading charts:', err);
    } finally {
      setLoading(false);
    }
  };

  const viewChart = (chartId: string) => {
    // Navigate to the analytics/generator tab with chart ID
    router.push(`/use-cases/ziwei?tab=analytics&chartId=${chartId}`);
  };

  const exportChart = async (chart: SavedChart) => {
    try {
      const data = {
        name: chart.name,
        birth_info: chart.birth_info,
        gan_zhi: chart.gan_zhi,
        created_at: chart.created_at
      };
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${chart.name || 'chart'}-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export chart');
    }
  };

  const deleteChart = async (chartId: string) => {
    if (!confirm('Delete this chart?')) return;
    try {
      const response = await fetch(`/api/ziwei/charts/${chartId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete chart');
      setCharts(charts.filter(c => c.id !== chartId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete chart');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Chart History</h2>
          <p className="text-sm text-slate-400">View and manage your saved birth charts</p>
        </div>
        <button
          onClick={loadCharts}
          disabled={loading}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh'}
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && charts.length === 0 && (
        <div className="py-12 text-center border border-dashed border-slate-700/50 rounded-lg">
          <p className="text-slate-400 mb-4">No saved charts yet</p>
          <p className="text-xs text-slate-500">Generate a chart from the <a href="/use-cases/ziwei" className="text-amber-400 hover:underline">Ziwei Astrology</a> page to get started</p>
        </div>
      )}

      {/* Charts grid */}
      {!loading && charts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {charts.map(chart => {
            const birthInfo = typeof chart.birth_info === 'string'
              ? JSON.parse(chart.birth_info)
              : chart.birth_info;
            const ganZhi = typeof chart.gan_zhi === 'string'
              ? JSON.parse(chart.gan_zhi)
              : chart.gan_zhi;

            return (
              <div key={chart.id} className="rounded-lg border border-slate-700/50 bg-slate-800/60 hover:bg-white/[0.02] p-4 transition-colors">
                <div className="mb-3">
                  <h3 className="font-semibold text-white truncate">{chart.name}</h3>
                  <p className="text-xs text-slate-500">
                    {birthInfo?.lunarYear}/{birthInfo?.lunarMonth}/{birthInfo?.lunarDay}
                  </p>
                </div>

                <div className="text-xs space-y-1 mb-4 text-slate-400">
                  <p>Gender: {birthInfo?.gender}</p>
                  <p>Hour: {birthInfo?.hourBranch}</p>
                  {chart.created_at && (
                    <p className="text-slate-500">
                      {new Date(chart.created_at).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => viewChart(chart.id)}
                    className="flex-1 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ArrowRight className="w-3 h-3" />
                    View Details
                  </button>
                  <button
                    onClick={() => exportChart(chart)}
                    className="px-2 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium transition-colors"
                    title="Export as JSON"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => deleteChart(chart.id)}
                    className="px-2 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded text-xs font-medium transition-colors"
                    title="Delete chart"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
