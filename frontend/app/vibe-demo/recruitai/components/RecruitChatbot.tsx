'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Minimize2 } from 'lucide-react';

function getApiBase() {
  if (typeof window === 'undefined') return '';
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  return isLocal
    ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080')
    : (process.env.NEXT_PUBLIC_API_URL || '');
}
const API_BASE = getApiBase();

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

export default function RecruitChatbot() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [turnCount, setTurnCount] = useState(0);
  const [unread, setUnread] = useState(0);
  const [hasGreeted, setHasGreeted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Restore session from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recruitai_session_id');
    if (saved) setSessionId(saved);
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setUnread(0);
    }
  }, [open, minimized]);

  // Auto-greet on first open
  useEffect(() => {
    if (open && !hasGreeted && messages.length === 0) {
      setHasGreeted(true);
      const greeting: Message = {
        role: 'assistant',
        content: '你好！我係 Nora 👋\n\nRecruitAI Studio 的 AI 顧問，專幫香港中小企搵出最適合的 AI 自動化方案。\n\n你哋係做咩行業？有冇啲日常流程覺得好費時或者好想自動化？話俾我知，我幫你分析下 💡',
      };
      setMessages([greeting]);
    }
  }, [open, hasGreeted, messages.length]);

  // Pulse animation on bubble to attract attention (30s delay)
  const [pulsing, setPulsing] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setPulsing(true), 30000);
    return () => clearTimeout(timer);
  }, []);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const res = await fetch(`${API_BASE}/api/recruitai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          visitorId: localStorage.getItem('recruitai_visitor_id') || undefined,
          message: text,
          history,
          sourcePage: window.location.pathname,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const assistantMsg: Message = { role: 'assistant', content: data.reply };
        setMessages(prev => [...prev, assistantMsg]);
        setTurnCount(data.turnCount);
        if (data.sessionId && !sessionId) {
          setSessionId(data.sessionId);
          localStorage.setItem('recruitai_session_id', data.sessionId);
          // Also store a visitor ID
          if (!localStorage.getItem('recruitai_visitor_id')) {
            localStorage.setItem('recruitai_visitor_id', `v_${Date.now()}`);
          }
        }
        if (!open || minimized) {
          setUnread(prev => prev + 1);
        }
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: '唔好意思，出咗啲問題，請稍後再試。' }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '連接出現問題，請稍後再試，或直接 WhatsApp 我們。' }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const handleOpen = () => {
    setOpen(true);
    setMinimized(false);
    setUnread(0);
    setPulsing(false);
  };

  if (!open) {
    return (
      <button
        onClick={handleOpen}
        aria-label="與 Nora 對話"
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 ${pulsing ? 'animate-pulse' : ''}`}
      >
        <span className="text-sm font-bold tracking-wide">Nora</span>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
            {unread}
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 border border-slate-200 ${minimized ? 'w-64 h-14' : 'w-80 sm:w-96 h-[560px]'}`}
      style={{ background: '#fff' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white flex-none">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-white/25 flex items-center justify-center text-sm font-bold border border-white/30">
            N
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">Nora · AI 顧問</p>
            <p className="text-xs text-blue-200 mt-0.5">RecruitAI Studio · 隨時為您服務</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized(!minimized)}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
            aria-label={minimized ? '展開' : '最小化'}
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
            aria-label="關閉"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 flex-none mr-2 mt-0.5">
                    N
                  </div>
                )}
                <div
                  className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-white text-slate-800 border border-slate-200 shadow-sm rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 flex-none mr-2 mt-0.5">
                  AI
                </div>
                <div className="bg-white border border-slate-200 shadow-sm rounded-2xl rounded-bl-sm">
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Turn indicator */}
          {turnCount > 15 && (
            <div className="px-4 py-2 bg-amber-50 border-t border-amber-100 text-xs text-amber-700 text-center">
              💡 如想了解詳情，歡迎留下聯絡方式，我們安排免費諮詢
            </div>
          )}

          {/* Input */}
          <div className="flex-none px-3 py-3 border-t border-slate-100 bg-white">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="輸入訊息..."
                disabled={loading}
                className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50 text-slate-900 disabled:opacity-60"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white flex items-center justify-center flex-none transition-colors"
                aria-label="發送"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-center text-xs text-slate-400 mt-2">
              對話記錄保密 · AI 回覆不代表專業意見
            </p>
          </div>
        </>
      )}
    </div>
  );
}
