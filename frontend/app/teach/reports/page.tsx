'use client';
import { useState } from 'react';
import { FileText, Download, Loader2, AlertCircle } from 'lucide-react';
import { useTeacherAuth } from '@/components/adaptive/useTeacherAuth';

type ReportType = 'CLASS_REPORT' | 'TERM_REPORT' | 'GRADE_REPORT';

const REPORT_TYPES: { type: ReportType; label: string; desc: string }[] = [
  { type: 'CLASS_REPORT', label: 'Class Report', desc: 'Mastery summary + recommendations for one class' },
  { type: 'TERM_REPORT',  label: 'Term Report',  desc: 'End-of-term progress across all objectives' },
  { type: 'GRADE_REPORT', label: 'Grade Report', desc: 'Grade-wide comparison (S1 or S2)' },
];

export default function ReportsPage() {
  const { teacher } = useTeacherAuth();
  const [reportType, setReportType] = useState<ReportType>('CLASS_REPORT');
  const [grade, setGrade] = useState('S1');
  const [className, setClassName] = useState('A');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const generate = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/adaptive-learning/teacher-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: reportType,
          grade,
          class_name: className,
          teacher_id: teacher?.id,
          language: 'EN',
        }),
      });
      const data = await res.json();
      if (data.success || data.result) setResult(data.result || data);
      else {
        // Fallback: try admin report endpoint
        const r2 = await fetch('/api/adaptive-learning/demo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: reportType, grade, class_name: className, language: 'EN' }),
        });
        const d2 = await r2.json();
        if (d2.success) setResult(d2.result);
        else setError(d2.error || 'Report generation failed');
      }
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const downloadText = () => {
    const content = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `${reportType.toLowerCase()}-${grade}${className}-${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Generate Report</h1>
        <p className="text-slate-400 text-sm mt-0.5">AI-generated summaries for admin, parents, or planning.</p>
      </div>

      {/* Report type selector */}
      <div className="space-y-2">
        {REPORT_TYPES.map(rt => (
          <button
            key={rt.type}
            onClick={() => setReportType(rt.type)}
            className={`w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-colors ${
              reportType === rt.type
                ? 'bg-purple-600/15 border-purple-500/40'
                : 'bg-slate-800/60 border-slate-700/50 hover:border-slate-600'
            }`}
          >
            <div className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 ${reportType === rt.type ? 'border-purple-500 bg-purple-500' : 'border-slate-600'}`} />
            <div>
              <p className="text-sm font-medium text-white">{rt.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{rt.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Parameters */}
      <div className="flex gap-3">
        <div>
          <label className="text-xs text-slate-400 block mb-1.5">Grade</label>
          <select value={grade} onChange={e => setGrade(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
          >
            {['S1','S2'].map(g => <option key={g}>{g}</option>)}
          </select>
        </div>
        {reportType === 'CLASS_REPORT' && (
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Class</label>
            <select value={className} onChange={e => setClassName(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
            >
              {['A','B','C','D','E'].map(c => <option key={c} value={c}>Class {c}</option>)}
            </select>
          </div>
        )}
      </div>

      <button
        onClick={generate} disabled={loading}
        className="flex items-center justify-center gap-2 px-6 py-3.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-colors w-fit"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
        {loading ? 'Generating…' : 'Generate Report'}
      </button>

      {error && (
        <div className="flex items-start gap-2 text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {result && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-700/30 flex items-center justify-between">
            <p className="text-sm font-semibold text-white">
              {REPORT_TYPES.find(r => r.type === reportType)?.label} — {grade}{reportType === 'CLASS_REPORT' ? className : ''}
            </p>
            <button onClick={downloadText}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
          </div>
          <div className="p-5">
            {typeof result === 'string' ? (
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{result}</p>
            ) : (
              <pre className="text-xs text-slate-400 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                {JSON.stringify(result, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
