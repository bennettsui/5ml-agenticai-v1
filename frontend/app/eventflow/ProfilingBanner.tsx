'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'ef_profile';

interface Profile {
  role?: string;
  interests?: string[];
  location?: string;
  how_heard?: string;
  _dismissed?: string[]; // question keys dismissed without answering
}

interface Question {
  key: keyof Omit<Profile, '_dismissed'>;
  prompt: string;
  type: 'single' | 'multi';
  options: string[];
}

const QUESTIONS: Question[] = [
  {
    key: 'role',
    prompt: 'What best describes you?',
    type: 'single',
    options: ['Professional', 'Student', 'Entrepreneur', 'Event Organizer', 'Other'],
  },
  {
    key: 'interests',
    prompt: 'What topics interest you most?',
    type: 'multi',
    options: ['Tech', 'Business', 'Arts & Culture', 'Health', 'Community', 'Education'],
  },
  {
    key: 'location',
    prompt: 'Where are you based?',
    type: 'single',
    options: ['Hong Kong', 'Taiwan', 'Singapore', 'Mainland China', 'Other Asia', 'Other'],
  },
  {
    key: 'how_heard',
    prompt: 'How did you hear about EventFlow?',
    type: 'single',
    options: ['Friend / Colleague', 'Social Media', 'Search Engine', 'Event Organizer', 'Other'],
  },
];

function getProfile(): Profile {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}
function saveProfile(p: Profile) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch {}
}

function nextQuestion(profile: Profile): Question | null {
  const dismissed = profile._dismissed ?? [];
  return QUESTIONS.find(
    (q) => profile[q.key] == null && !dismissed.includes(q.key)
  ) ?? null;
}

export default function ProfilingBanner() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show after a short delay so it doesn't pop instantly
    const timer = setTimeout(() => {
      const profile = getProfile();
      const q = nextQuestion(profile);
      if (q) { setQuestion(q); setVisible(true); }
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible || !question) return null;

  function dismiss() {
    const profile = getProfile();
    const dismissed = profile._dismissed ?? [];
    if (question) dismissed.push(question.key);
    saveProfile({ ...profile, _dismissed: dismissed });
    setVisible(false);
  }

  function submit() {
    if (selected.length === 0) { dismiss(); return; }
    const profile = getProfile();
    const value = question!.type === 'multi' ? selected : selected[0];
    saveProfile({ ...profile, [question!.key]: value, _dismissed: profile._dismissed ?? [] });
    setVisible(false);
    // Queue next question after delay
    setTimeout(() => {
      const updated = getProfile();
      const next = nextQuestion(updated);
      if (next) { setQuestion(next); setSelected([]); setVisible(true); }
    }, 8000);
  }

  function toggle(opt: string) {
    if (question!.type === 'single') {
      setSelected([opt]);
    } else {
      setSelected((s) => s.includes(opt) ? s.filter((x) => x !== opt) : [...s, opt]);
    }
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-slate-800 border border-white/[0.1] rounded-2xl shadow-2xl p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs text-amber-400 font-semibold uppercase tracking-wide mb-0.5">Quick question</p>
            <p className="text-white font-semibold text-sm">{question.prompt}</p>
          </div>
          <button onClick={dismiss} className="text-slate-500 hover:text-slate-300 text-lg leading-none ml-3 flex-shrink-0">×</button>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {question.options.map((opt) => {
            const active = selected.includes(opt);
            return (
              <button key={opt} type="button" onClick={() => toggle(opt)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                  active
                    ? 'bg-amber-500 border-amber-500 text-slate-950 font-semibold'
                    : 'bg-slate-900 border-white/[0.08] text-slate-300 hover:border-white/20'
                }`}>
                {opt}
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between">
          <button onClick={dismiss} className="text-xs text-slate-500 hover:text-slate-400">Skip</button>
          <button onClick={submit} disabled={selected.length === 0}
            className="text-xs bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold px-4 py-1.5 rounded-lg transition-colors">
            {question.type === 'multi' ? `Confirm (${selected.length})` : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
