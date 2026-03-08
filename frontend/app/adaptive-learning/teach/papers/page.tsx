'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, Upload, RefreshCw, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useTeacherAuth } from '@/components/adaptive/useTeacherAuth';

interface Paper {
  id: string;
  exam_name: string;
  grade_band: string;
  year: number;
  status: string;
  file_url: string | null;
  created_at: string;
  draft_count: number;
  confirmed_count: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  UPLOADED:     { label: 'Processing',   color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',    icon: Clock },
  DRAFT_READY:  { label: 'Needs Review', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: AlertCircle },
  CONFIRMED:    { label: 'Live',         color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle },
  NEEDS_REVIEW: { label: 'OCR Issue',   color: 'text-red-400 bg-red-500/10 border-red-500/20',       icon: AlertCircle },
};

export default function PapersPage() {
  const { teacher } = useTeacherAuth();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/adaptive-learning/teachers/papers');
      const data = await res.json();
      if (data.success) setPapers(data.papers);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Past Papers</h1>
          <p className="text-slate-400 text-sm mt-0.5">{papers.length} papers uploaded</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className={`text-slate-400 hover:text-white transition-colors ${loading ? 'animate-spin' : ''}`}>
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link href="/adaptive-learning/teach/upload"
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Paper
          </Link>
        </div>
      </div>

      {loading && papers.length === 0 && (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <div className="space-y-3">
        {papers.map(p => {
          const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.UPLOADED;
          const Icon = cfg.icon;
          const reviewPending = p.draft_count > p.confirmed_count;

          return (
            <div key={p.id} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className="text-white font-medium text-sm">{p.exam_name}</p>
                      <p className="text-slate-500 text-xs mt-0.5">
                        {p.grade_band} · {p.year} · Uploaded {new Date(p.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`text-[10px] font-medium border rounded-full px-2 py-0.5 flex items-center gap-1 ${cfg.color} shrink-0`}>
                      <Icon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  </div>

                  {/* Progress bar */}
                  {p.draft_count > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span>{p.confirmed_count}/{p.draft_count} questions confirmed</span>
                        <span>{Math.round((p.confirmed_count / p.draft_count) * 100)}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full transition-all"
                          style={{ width: `${(p.confirmed_count / p.draft_count) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {reviewPending && (
                <div className="mt-3 pl-13">
                  <Link
                    href={`/adaptive-learning/teach/questions/pending?paper_id=${p.id}`}
                    className="inline-flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 transition-colors"
                  >
                    <AlertCircle className="w-3 h-3" />
                    {p.draft_count - p.confirmed_count} questions need review →
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!loading && papers.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm mb-3">No papers uploaded yet.</p>
          <Link href="/adaptive-learning/teach/upload" className="text-purple-400 text-sm underline">Upload your first paper →</Link>
        </div>
      )}
    </div>
  );
}
