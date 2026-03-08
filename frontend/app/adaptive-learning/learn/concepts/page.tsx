'use client';
import { useState, useEffect } from 'react';
import { Search, BookOpen } from 'lucide-react';

interface Objective {
  code: string;
  grade: string;
  topic: string;
  subtopic: string;
  name_en: string;
  name_zh: string;
  description_en: string;
  description_zh: string;
}

interface Strand {
  id: string;
  name_en: string;
  name_zh: string;
  objectives: Objective[];
}

export default function ConceptsPage() {
  const [strands, setStrands] = useState<Strand[]>([]);
  const [query, setQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('ALL');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [language, setLanguage] = useState<'EN' | 'ZH'>('ZH');

  useEffect(() => {
    try {
      const s = localStorage.getItem('al_student');
      if (s) setLanguage(JSON.parse(s).language || 'ZH');
    } catch {}
    fetch('/api/adaptive-learning/curriculum')
      .then(r => r.json())
      .then(d => { if (d.strands) setStrands(d.strands); })
      .catch(() => {});
  }, []);

  const allObjectives = strands.flatMap(s => s.objectives.map(o => ({ ...o, strand_en: s.name_en, strand_zh: s.name_zh })));
  const filtered = allObjectives.filter(o => {
    const matchGrade = gradeFilter === 'ALL' || o.grade === gradeFilter;
    const matchQuery = !query || o.name_en.toLowerCase().includes(query.toLowerCase()) || o.name_zh.includes(query) || o.code.toLowerCase().includes(query.toLowerCase());
    return matchGrade && matchQuery;
  });

  const grouped = filtered.reduce((acc, o) => {
    const key = language === 'ZH' ? (o as any).strand_zh : (o as any).strand_en;
    if (!acc[key]) acc[key] = [];
    acc[key].push(o);
    return acc;
  }, {} as Record<string, typeof allObjectives>);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-white">Browse Concepts</h1>
        <p className="text-slate-400 text-xs mt-0.5">HK EDB S1–S2 Mathematics Curriculum</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['ALL','S1','S2'].map(g => (
          <button
            key={g}
            onClick={() => setGradeFilter(g)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              gradeFilter === g ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700/50'
            }`}
          >{g}</button>
        ))}
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search…"
            className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700/50 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Results */}
      {Object.entries(grouped).map(([strandName, objectives]) => (
        <div key={strandName} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700/30">
            <p className="text-sm font-semibold text-white">{strandName}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{objectives.length} objectives</p>
          </div>
          <div className="divide-y divide-slate-700/20">
            {objectives.map(o => (
              <button
                key={o.code}
                onClick={() => setExpanded(expanded === o.code ? null : o.code)}
                className="w-full text-left px-4 py-3 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium">{language === 'ZH' ? o.name_zh : o.name_en}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-mono">{o.code} · {o.grade} · {o.subtopic}</p>
                  </div>
                  <span className="text-slate-600 text-lg">{expanded === o.code ? '−' : '+'}</span>
                </div>
                {expanded === o.code && (
                  <p className="text-xs text-slate-400 leading-relaxed mt-2">
                    {language === 'ZH' ? o.description_zh : o.description_en}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="text-center py-10 text-slate-500">
          <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No concepts match your search.</p>
        </div>
      )}
    </div>
  );
}
