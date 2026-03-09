'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, RefreshCw, BookOpen } from 'lucide-react';

interface Question {
  id: string;
  stem_en: string;
  stem_zh: string | null;
  question_type: string;
  difficulty_estimate: number;
  source_type: string;
  is_active: boolean;
  grade: string | null;
  topic: string | null;
  code: string | null;
  name_en: string | null;
  total_attempts?: number;
  correct_attempts?: number;
}

const DIFF_COLORS = ['', 'text-emerald-400', 'text-blue-400', 'text-yellow-400', 'text-orange-400', 'text-red-400'];
const TYPE_COLOR: Record<string, string> = {
  MCQ: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  OPEN_ENDED: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
  FILL_IN: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  MULTI_STEP: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
};

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [pending, setPending] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [pendingRes] = await Promise.all([
        fetch('/api/adaptive-learning/teachers/questions/pending?limit=100'),
      ]);
      const pd = await pendingRes.json();
      if (pd.success) setPending(pd.questions || []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = pending.filter(q => {
    const matchGrade = gradeFilter === 'ALL' || q.grade === gradeFilter;
    const matchQuery = !query || (q.stem_en || '').toLowerCase().includes(query.toLowerCase());
    return matchGrade && matchQuery;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Question Bank</h1>
          <p className="text-slate-400 text-sm mt-0.5">AI-generated questions awaiting review</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/teach/questions/pending"
            className="px-3 py-1.5 bg-purple-600/20 border border-purple-500/30 text-purple-300 rounded-lg text-xs font-medium hover:bg-purple-600/30 transition-colors"
          >
            Pending Review ({pending.length})
          </Link>
          <button onClick={load} className="text-slate-400 hover:text-white transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['ALL','S1','S2'].map(g => (
          <button key={g} onClick={() => setGradeFilter(g)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${gradeFilter === g ? 'bg-purple-600 border-purple-500 text-white' : 'border-slate-700 text-slate-400 hover:text-white'}`}
          >{g}</button>
        ))}
        <div className="flex-1 relative min-w-40">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search questions…"
            className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700/50 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {error && <div className="text-red-300 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</div>}

      {loading && (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(q => (
          <div key={q.id} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 hover:bg-slate-800/80 transition-colors">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className={`text-[10px] border rounded-full px-2 py-0.5 font-medium ${TYPE_COLOR[q.question_type] || 'bg-slate-600/20 text-slate-400 border-slate-600/30'}`}>
                    {q.question_type}
                  </span>
                  {q.grade && <span className="text-[10px] text-slate-500">{q.grade}</span>}
                  {q.code && <span className="text-[10px] font-mono text-indigo-400">{q.code}</span>}
                  {!q.is_active && <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full px-2 py-0.5">Pending review</span>}
                </div>
                <p className="text-sm text-white leading-relaxed line-clamp-2">{q.stem_en}</p>
              </div>
              <div className={`text-xs font-medium ${DIFF_COLORS[q.difficulty_estimate] || 'text-slate-400'} shrink-0`}>
                D{q.difficulty_estimate}
              </div>
            </div>
          </div>
        ))}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm mb-3">No questions yet. Upload a past paper to get started.</p>
          <Link href="/teach/upload" className="text-purple-400 text-sm underline">Upload a paper →</Link>
        </div>
      )}
    </div>
  );
}
