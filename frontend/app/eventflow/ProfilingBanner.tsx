'use client';

import { useState, useEffect } from 'react';

const API        = process.env.NEXT_PUBLIC_API_URL || '';
const SID_KEY    = 'ef_sid';       // localStorage: anonymous session ID (persists across visits)
const SHOWN_KEY  = 'ef_q_shown';  // sessionStorage: already showed a question this visit?

interface Profile {
  role?: string;
  interests?: string[];
  location?: string;
  how_heard?: string;
  dismissed?: string[];
}

interface Question {
  key: keyof Omit<Profile, 'dismissed'>;
  prompt: string;
  type: 'single' | 'multi';
  options: string[];
}

const QUESTIONS: Question[] = [
  { key: 'role',      prompt: 'What best describes you?',          type: 'single', options: ['Professional', 'Student', 'Entrepreneur', 'Event Organizer', 'Other'] },
  { key: 'location',  prompt: 'Where are you based?',              type: 'single', options: ['Hong Kong', 'Taiwan', 'Singapore', 'Mainland China', 'Other Asia', 'Other'] },
  { key: 'interests', prompt: 'What topics interest you most?',    type: 'multi',  options: ['Tech', 'Business', 'Arts & Culture', 'Health', 'Community', 'Education'] },
  { key: 'how_heard', prompt: 'How did you hear about EventFlow?', type: 'single', options: ['Friend / Colleague', 'Social Media', 'Search Engine', 'Event Organizer', 'Other'] },
];

function getSid(): string {
  if (typeof window === 'undefined') return '';
  let sid = localStorage.getItem(SID_KEY);
  if (!sid) { sid = crypto.randomUUID(); localStorage.setItem(SID_KEY, sid); }
  return sid;
}

function nextQuestion(profile: Profile): Question | null {
  const dismissed = profile.dismissed ?? [];
  return QUESTIONS.find(q => profile[q.key] == null && !dismissed.includes(q.key)) ?? null;
}

async function fetchProfile(sid: string): Promise<Profile> {
  try {
    const res  = await fetch(`${API}/api/eventflow/participant/profile?sid=${sid}`);
    const data = await res.json();
    return data.profile || {};
  } catch { return {}; }
}

async function saveKey(sid: string, key: string, value: unknown) {
  try {
    await fetch(`${API}/api/eventflow/participant/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sid, key, value }),
    });
  } catch {}
}

export default function ProfilingBanner() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [visible, setVisible]   = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Frequency cap: only 1 question per visit (page session)
    if (sessionStorage.getItem(SHOWN_KEY)) return;

    const sid = getSid();
    const timer = setTimeout(async () => {
      const profile = await fetchProfile(sid);
      const q = nextQuestion(profile);
      if (q) {
        setQuestion(q);
        setVisible(true);
        sessionStorage.setItem(SHOWN_KEY, '1');
      }
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  if (!visible || !question) return null;

  async function dismiss() {
    setVisible(false);
    const sid = getSid();
    const current = await fetchProfile(sid);
    const dismissed = [...(current.dismissed ?? []), question!.key];
    await saveKey(sid, 'dismissed', dismissed);
  }

  async function submit() {
    if (selected.length === 0) { dismiss(); return; }
    const sid   = getSid();
    const value = question!.type === 'multi' ? selected : selected[0];
    await saveKey(sid, question!.key as string, value);
    setVisible(false);
  }

  function toggle(opt: string) {
    if (question!.type === 'single') setSelected([opt]);
    else setSelected(s => s.includes(opt) ? s.filter(x => x !== opt) : [...s, opt]);
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white border border-blue-100 rounded-2xl shadow-2xl shadow-blue-500/10 p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs text-blue-500 font-semibold uppercase tracking-wide mb-0.5">Quick question</p>
            <p className="text-gray-900 font-semibold text-sm">{question.prompt}</p>
          </div>
          <button onClick={dismiss} className="text-gray-300 hover:text-gray-500 text-xl leading-none ml-3 flex-shrink-0">×</button>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {question.options.map(opt => {
            const active = selected.includes(opt);
            return (
              <button key={opt} type="button" onClick={() => toggle(opt)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                  active
                    ? 'bg-blue-500 border-blue-500 text-white font-semibold'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-blue-300'
                }`}>
                {opt}
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between">
          <button onClick={dismiss} className="text-xs text-gray-400 hover:text-gray-600">Skip</button>
          <button onClick={submit} disabled={selected.length === 0}
            className="text-xs bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white font-bold px-4 py-1.5 rounded-lg transition-colors">
            {question.type === 'multi' ? `Done (${selected.length})` : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
