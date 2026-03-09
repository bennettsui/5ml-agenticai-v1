'use client';
import { useState, useEffect } from 'react';
import { CheckCircle, SkipForward, RefreshCw, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import { useTeacherAuth } from '@/components/adaptive/useTeacherAuth';

interface DraftQuestion {
  id: string;
  stem_en: string | null;
  stem_zh: string | null;
  has_image: boolean;
  suggested_type: string;
  suggested_difficulty: number;
  candidate_objectives: Array<{ code: string; name_en: string }> | null;
  raw_ocr_text: string | null;
  status: string;
  code?: string;
  name_en?: string;
  name_zh?: string;
}

const DIFF_LABELS = ['', 'Easy', 'Medium-Low', 'Medium', 'Medium-High', 'Hard'];

export default function PendingQuestionsPage() {
  const { teacher } = useTeacherAuth();
  const [questions, setQuestions] = useState<DraftQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<Record<string, Partial<DraftQuestion>>>({});
  const [done, setDone] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    // Check URL param for specific paper
    const paperId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('paper_id') : null;
    const url = paperId
      ? `/api/adaptive-learning/teachers/papers/${paperId}/draft-questions`
      : '/api/adaptive-learning/teachers/questions/pending';
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.success || data.draft_questions) {
        setQuestions(data.draft_questions || data.questions || []);
      } else setError(data.error || 'Failed to load');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const approve = async (q: DraftQuestion) => {
    const ed = editing[q.id] || {};
    try {
      await fetch('/api/adaptive-learning/teachers/questions/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions: [{
            draft_id:           q.id,
            stem_en:            ed.stem_en ?? q.stem_en,
            stem_zh:            ed.stem_zh ?? q.stem_zh,
            answer:             'A',
            question_type:      q.suggested_type || 'MCQ',
            difficulty_estimate: q.suggested_difficulty || 2,
            objective_codes:    q.candidate_objectives?.map(o => o.code) || [],
          }],
        }),
      });
      setDone(d => new Set([...d, q.id]));
    } catch (e: any) { setError(e.message); }
  };

  const pending = questions.filter(q => !done.has(q.id) && q.status !== 'CONFIRMED' && q.status !== 'SKIPPED');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Review Questions</h1>
          <p className="text-slate-400 text-sm mt-0.5">{pending.length} pending · Approve, edit, or skip each question</p>
        </div>
        <button onClick={load} className="text-slate-400 hover:text-white transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && <div className="text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm">{error}</div>}

      {loading && (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && pending.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">All caught up! No pending questions.</p>
        </div>
      )}

      <div className="space-y-3">
        {pending.map(q => {
          const ed = editing[q.id] || {};
          const stemEn = ed.stem_en ?? q.stem_en ?? q.raw_ocr_text ?? '';
          const stemZh = ed.stem_zh ?? q.stem_zh ?? '';
          const isOpen = expanded === q.id;

          return (
            <div key={q.id} className={`bg-slate-800/60 border rounded-2xl overflow-hidden transition-all ${
              done.has(q.id) ? 'border-emerald-500/30 opacity-60' : 'border-slate-700/50'
            }`}>
              {/* Header */}
              <div className="px-5 py-4 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-[10px] font-mono bg-slate-700/50 text-slate-400 rounded px-2 py-0.5">{q.suggested_type}</span>
                    <span className="text-[10px] text-slate-500">Difficulty {DIFF_LABELS[q.suggested_difficulty] || q.suggested_difficulty}</span>
                    {q.code && <span className="text-[10px] font-mono text-indigo-400">{q.code}</span>}
                  </div>
                  <p className="text-sm text-white leading-relaxed font-medium">{stemEn || '(No English stem)'}</p>
                  {stemZh && <p className="text-xs text-slate-400 mt-1 leading-relaxed">{stemZh}</p>}
                  {q.candidate_objectives && q.candidate_objectives.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {q.candidate_objectives.map(o => (
                        <span key={o.code} className="text-[10px] bg-indigo-600/15 text-indigo-300 border border-indigo-500/20 rounded-full px-2 py-0.5">{o.code}</span>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => setExpanded(isOpen ? null : q.id)} className="text-slate-500 hover:text-white transition-colors shrink-0">
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {/* Expanded edit */}
              {isOpen && (
                <div className="px-5 pb-4 space-y-3 border-t border-slate-700/30 pt-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">English stem (editable)</label>
                    <textarea
                      rows={3}
                      value={stemEn}
                      onChange={e => setEditing(prev => ({ ...prev, [q.id]: { ...prev[q.id], stem_en: e.target.value } }))}
                      className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Chinese stem (optional)</label>
                    <textarea
                      rows={2}
                      value={stemZh}
                      onChange={e => setEditing(prev => ({ ...prev, [q.id]: { ...prev[q.id], stem_zh: e.target.value } }))}
                      className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  {q.raw_ocr_text && (
                    <div>
                      <label className="text-xs text-slate-500 block mb-1">Raw OCR text</label>
                      <p className="text-xs text-slate-600 bg-slate-900/40 rounded-lg px-3 py-2 font-mono leading-relaxed">{q.raw_ocr_text}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="px-5 pb-4 flex gap-2">
                <button
                  onClick={() => approve(q)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-medium transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  {isOpen ? 'Approve with edits' : 'Approve'}
                </button>
                <button
                  onClick={() => setExpanded(isOpen ? null : q.id)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-700/40 hover:bg-slate-700/60 text-slate-400 rounded-xl text-xs font-medium transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => setDone(d => new Set([...d, q.id]))}
                  className="flex items-center gap-1.5 px-3 py-2 text-slate-500 hover:text-slate-300 text-xs transition-colors ml-auto"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  Skip
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
