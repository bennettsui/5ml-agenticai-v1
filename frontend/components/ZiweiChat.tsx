'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface ZiweiChatProps {
  chartId?: string;
  chartData?: any;
}

export default function ZiweiChat({ chartId, chartData }: ZiweiChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'success'>('idle');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize conversation on component mount
  useEffect(() => {
    if (!chartId) return;

    const initConversation = async () => {
      try {
        const response = await fetch('/api/ziwei/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chartId })
        });

        if (response.ok) {
          const data = await response.json();
          setConversationId(data.conversationId);
          setStatus('success');

          // Add welcome message
          setMessages([{
            role: 'assistant',
            content: `Welcome to your Ziwei Astrology chatbot! 🌟\n\nI've loaded your birth chart and I'm ready to answer questions about your destiny, personality, career, relationships, and more.\n\n${data.chartContext || 'Ask me anything about your chart!'}`,
            timestamp: new Date().toISOString()
          }]);
        } else {
          setError('Failed to initialize conversation');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Connection error');
      }
    };

    initConversation();
  }, [chartId]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !conversationId || loading) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);

    // Add user message immediately
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await fetch(`/api/ziwei/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: userMessage,
          messages: newMessages.slice(0, -1) // Send history without latest user message
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.response,
          timestamp: data.timestamp
        }]);
        setStatus('success');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to get response');
        setMessages(prev => prev.slice(0, -1)); // Remove user message on error
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection error');
      setMessages(prev => prev.slice(0, -1)); // Remove user message on error
    } finally {
      setLoading(false);
    }
  };

  const suggestedQuestions = [
    "What does my chart say about my personality?",
    "What career paths suit me best?",
    "Tell me about my romantic prospects",
    "What challenges should I prepare for?",
    "When is a good time for major changes?"
  ];

  if (!chartId) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-900/40 rounded-lg border border-slate-700/50">
        <div className="text-center">
          <MessageSquare className="mx-auto mb-4 w-12 h-12 text-slate-400" />
          <p className="text-slate-400">No chart selected for conversation</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] bg-slate-900/40 rounded-lg border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-700/50 bg-gradient-to-r from-purple-900/20 to-transparent">
        <div className="flex items-center gap-3 mb-2">
          <MessageSquare className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Ziwei Chart Conversation</h3>
        </div>
        <p className="text-sm text-slate-400">Ask questions about your birth chart and destiny</p>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
      >
        {error && (
          <div className="flex gap-3 p-3 rounded-lg bg-red-900/20 border border-red-700/50">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-purple-600/40 text-purple-100 border border-purple-500/50'
                  : 'bg-slate-700/40 text-slate-100 border border-slate-600/50'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              {msg.timestamp && (
                <p className="text-xs text-slate-400 mt-1 opacity-60">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-700/40 text-slate-100 px-4 py-3 rounded-lg border border-slate-600/50">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Consulting your chart...</span>
              </div>
            </div>
          </div>
        )}

        {/* Suggested questions on first load */}
        {messages.length === 1 && !loading && (
          <div className="mt-6 pt-4 border-t border-slate-700/50">
            <p className="text-xs text-slate-400 mb-3">Try asking:</p>
            <div className="space-y-2">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInput(q);
                  }}
                  className="block w-full text-left text-sm p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/30 hover:border-slate-500/50 text-slate-300 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-slate-700/50 bg-slate-900/60">
        <form onSubmit={sendMessage} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your chart..."
            disabled={loading || !conversationId}
            className="flex-1 px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !conversationId || !input.trim()}
            className="px-4 py-2 bg-purple-600/60 hover:bg-purple-500/60 disabled:opacity-50 border border-purple-500/50 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
