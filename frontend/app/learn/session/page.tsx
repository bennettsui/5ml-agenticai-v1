'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ThumbsUp, ThumbsDown, ChevronRight, X, CheckCircle, XCircle } from 'lucide-react';
import { useStudentAuth } from '@/components/adaptive/useStudentAuth';

type Phase = 'SETUP' | 'LOADING' | 'QUESTION' | 'ANSWERED' | 'ENDED';

interface Question {
  question_id: string;
  type: string;
  stem: string;
  options: string[] | null;
  has_image: boolean;
  image_url: string | null;
  difficulty: number;
}

interface AnswerResult {
  correctness: 'CORRECT' | 'INCORRECT';
  correct_answer: string;
  explanation: any;
  mastery_delta: number;
}

const TOPIC_OPTIONS = [
  { code: 'MATH.S1.INT.BASIC',      label: 'Integers' },
  { code: 'MATH.S1.FRACTION.BASIC', label: 'Fractions — Concepts' },
  { code: 'MATH.S1.FRACTION.ADD',   label: 'Fraction Addition' },
  { code: 'MATH.S1.FRACTION.MULT',  label: 'Fraction Multiplication' },
  { code: 'MATH.S1.DECIMAL.OPS',    label: 'Decimals' },
  { code: 'MATH.S1.PERCENT.BASIC',  label: 'Percentages' },
  { code: 'MATH.S2.ALGEBRA.BASIC',  label: 'Algebra Basics' },
  { code: 'MATH.S2.EQUATION.LIN',   label: 'Linear Equations' },
];

const UNDERSTAND_LABELS = ['😕', '😐', '🙂', '😊', '🤩'];
const INTEREST_LABELS   = ['😕', '😐', '🙂', '😊', '🤩'];

export default function SessionPage() {
  const router = useRouter();
  const { student } = useStudentAuth();
  const [phase, setPhase] = useState<Phase>('SETUP');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [questionNum, setQuestionNum] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [nextPayload, setNextPayload] = useState<any>(null);
  const [understanding, setUnderstanding] = useState<number | null>(null);
  const [interest, setInterest] = useState<number | null>(null);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [error, setError] = useState('');
  const startTime = useRef<number>(0);

  // Restore in-progress session from localStorage
  useEffect(() => {
    if (!student) return;
    const saved = localStorage.getItem('al_session');
    if (saved) {
      const { sessionId: sid, question: q, questionNum: n } = JSON.parse(saved);
      if (sid && q) { setSessionId(sid); setQuestion(q); setQuestionNum(n || 1); setPhase('QUESTION'); startTime.current = Date.now(); }
    }
  }, [student]);

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-slate-400 text-sm">Please sign in first.</p>
        <button onClick={() => router.push('/learn')} className="text-indigo-400 text-sm underline">Go to Home</button>
      </div>
    );
  }

  // ── SETUP ───────────────────────────────────────────────────────────────────

  const startSession = async () => {
    if (selectedTopics.length === 0) { setError('Please select at least one topic.'); return; }
    setError(''); setPhase('LOADING');
    try {
      const res = await fetch('/api/adaptive-learning/student/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Student-Id': student.id },
        body: JSON.stringify({ target_objective_codes: selectedTopics, language: student.language, mode: 'adaptive' }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setSessionId(data.session_id);
      setQuestion(data.initial_question);
      setQuestionNum(1);
      setPhase('QUESTION');
      startTime.current = Date.now();
      localStorage.setItem('al_session', JSON.stringify({ sessionId: data.session_id, question: data.initial_question, questionNum: 1 }));
    } catch (err: any) {
      setError(err.message); setPhase('SETUP');
    }
  };

  // ── ANSWER ──────────────────────────────────────────────────────────────────

  const submitAnswer = async () => {
    if (selected === null || !sessionId || !question) return;
    const timeTaken = Math.floor((Date.now() - startTime.current) / 1000);
    setPhase('LOADING');
    try {
      const res = await fetch(`/api/adaptive-learning/student/sessions/${sessionId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Student-Id': student.id },
        body: JSON.stringify({
          question_id: question.question_id,
          answer_payload: { selectedOptionIndex: selected },
          self_ratings: { understanding: understanding ?? 3, interest: interest ?? 3 },
          time_taken_seconds: timeTaken,
          language: student.language,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setResult(data.result);
      setNextPayload(data.next);
      setPhase('ANSWERED');
    } catch (err: any) {
      setError(err.message); setPhase('QUESTION');
    }
  };

  // ── NEXT ────────────────────────────────────────────────────────────────────

  const advance = () => {
    if (!nextPayload) return;
    if (nextPayload.type === 'END') {
      endSession(); return;
    }
    setQuestion(nextPayload.question);
    setQuestionNum(n => n + 1);
    setSelected(null); setResult(null); setNextPayload(null);
    setUnderstanding(null); setInterest(null); setFeedbackSent(false);
    setPhase('QUESTION');
    startTime.current = Date.now();
    localStorage.setItem('al_session', JSON.stringify({ sessionId, question: nextPayload.question, questionNum: questionNum + 1 }));
  };

  const endSession = async () => {
    if (!sessionId) return;
    setPhase('LOADING');
    try {
      const res = await fetch(`/api/adaptive-learning/student/sessions/${sessionId}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: student.language }),
      });
      const data = await res.json();
      localStorage.removeItem('al_session');
      localStorage.setItem('al_last_summary', JSON.stringify(data));
      router.push('/learn/session/summary');
    } catch (err: any) {
      setError(err.message); setPhase('ANSWERED');
    }
  };

  const sendExplanationFeedback = async (rating: 1 | -1) => {
    if (!question || !result || feedbackSent) return;
    setFeedbackSent(true);
    await fetch('/api/adaptive-learning/student/feedback/explanation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Student-Id': student.id },
      body: JSON.stringify({ question_id: question.question_id, rating }),
    }).catch(() => {});
  };

  // ── RENDER ──────────────────────────────────────────────────────────────────

  if (phase === 'SETUP') {
    return (
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-xl font-bold text-white">New Session</h1>
          <p className="text-slate-400 text-sm mt-0.5">Choose topics to practise</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {TOPIC_OPTIONS.map(t => (
            <button
              key={t.code}
              onClick={() => setSelectedTopics(s => s.includes(t.code) ? s.filter(c => c !== t.code) : [...s, t.code])}
              className={`p-3 rounded-xl border text-left text-sm font-medium transition-colors ${
                selectedTopics.includes(t.code)
                  ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                  : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:border-slate-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          onClick={startSession}
          disabled={selectedTopics.length === 0}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl font-semibold transition-colors"
        >
          Start Practice →
        </button>
      </div>
    );
  }

  if (phase === 'LOADING') {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Preparing your question…</p>
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className="flex flex-col gap-4">
      {/* Progress + exit */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, (questionNum / 10) * 100)}%` }}
          />
        </div>
        <span className="text-xs text-slate-400 whitespace-nowrap">Q {questionNum}/10</span>
        <button onClick={() => { if (confirm('End session?')) endSession(); }} className="text-slate-500 hover:text-red-400 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Difficulty dots */}
      <div className="flex gap-1">
        {[1,2,3,4,5].map(d => (
          <div key={d} className={`w-1.5 h-1.5 rounded-full ${d <= (question.difficulty || 2) ? 'bg-indigo-500' : 'bg-slate-700'}`} />
        ))}
      </div>

      {/* Question */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
        <p className="text-white text-base leading-relaxed font-medium">{question.stem}</p>
        {question.has_image && question.image_url && (
          <img src={question.image_url} alt="Question diagram" className="mt-3 rounded-lg max-w-full" />
        )}
      </div>

      {/* MCQ options */}
      {question.options && (
        <div className="space-y-2">
          {question.options.map((opt, i) => {
            const letter = ['A','B','C','D'][i];
            const isSelected = selected === i;
            const isCorrectAnswer = result && result.correct_answer === letter;
            const isWrong = result && isSelected && result.correctness === 'INCORRECT';

            let style = 'bg-slate-800/60 border-slate-700/50 text-slate-300';
            if (isSelected && !result) style = 'bg-indigo-600/20 border-indigo-500/50 text-indigo-200';
            if (isCorrectAnswer && result) style = 'bg-emerald-600/20 border-emerald-500/50 text-emerald-200';
            if (isWrong) style = 'bg-red-600/20 border-red-500/50 text-red-300';

            return (
              <button
                key={i}
                disabled={phase === 'ANSWERED'}
                onClick={() => setSelected(i)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-colors ${style}`}
              >
                <span className="text-xs font-bold w-5 text-center shrink-0 opacity-60">{letter}</span>
                <span className="text-sm">{opt}</span>
                {isCorrectAnswer && result && <CheckCircle className="w-4 h-4 ml-auto text-emerald-400 shrink-0" />}
                {isWrong && <XCircle className="w-4 h-4 ml-auto text-red-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Submit button (pre-answer) */}
      {phase === 'QUESTION' && (
        <button
          disabled={selected === null}
          onClick={submitAnswer}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white rounded-xl font-semibold transition-colors"
        >
          Submit Answer
        </button>
      )}

      {/* Post-answer */}
      {phase === 'ANSWERED' && result && (
        <div className="space-y-3">
          {/* Result badge */}
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${result.correctness === 'CORRECT' ? 'bg-emerald-600/15 border border-emerald-500/30' : 'bg-red-600/15 border border-red-500/30'}`}>
            {result.correctness === 'CORRECT'
              ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              : <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
            <span className={`text-sm font-medium ${result.correctness === 'CORRECT' ? 'text-emerald-300' : 'text-red-300'}`}>
              {result.correctness === 'CORRECT' ? 'Correct!' : `Incorrect — Answer: ${result.correct_answer}`}
            </span>
            {result.mastery_delta > 0 && <span className="ml-auto text-xs text-indigo-400">↑ Level up!</span>}
          </div>

          {/* AI Explanation */}
          {result.explanation && (
            <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">AI Explanation</p>
              <p className="text-sm text-slate-200 leading-relaxed">
                {student.language === 'ZH'
                  ? (result.explanation.explanation_zh || result.explanation.explanation_en || result.explanation.text)
                  : (result.explanation.explanation_en || result.explanation.text)}
              </p>
              {!feedbackSent && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-slate-500">Helpful?</span>
                  <button onClick={() => sendExplanationFeedback(1)} className="text-slate-500 hover:text-emerald-400 transition-colors"><ThumbsUp className="w-3.5 h-3.5" /></button>
                  <button onClick={() => sendExplanationFeedback(-1)} className="text-slate-500 hover:text-red-400 transition-colors"><ThumbsDown className="w-3.5 h-3.5" /></button>
                </div>
              )}
              {feedbackSent && <p className="text-xs text-slate-500">Thanks for your feedback!</p>}
            </div>
          )}

          {/* Self-ratings */}
          <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-4 space-y-3">
            <div>
              <p className="text-xs text-slate-400 mb-2">How well did you understand?</p>
              <div className="flex justify-between">
                {UNDERSTAND_LABELS.map((e, i) => (
                  <button key={i} onClick={() => setUnderstanding(i + 1)}
                    className={`text-xl transition-all ${understanding === i + 1 ? 'scale-125' : 'opacity-40 hover:opacity-80'}`}
                  >{e}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-2">How interesting was this?</p>
              <div className="flex justify-between">
                {INTEREST_LABELS.map((e, i) => (
                  <button key={i} onClick={() => setInterest(i + 1)}
                    className={`text-xl transition-all ${interest === i + 1 ? 'scale-125' : 'opacity-40 hover:opacity-80'}`}
                  >{e}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Next / End */}
          <button
            onClick={advance}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {nextPayload?.type === 'END' ? 'End Session' : 'Next Question'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && <p className="text-red-400 text-sm text-center">{error}</p>}
    </div>
  );
}
