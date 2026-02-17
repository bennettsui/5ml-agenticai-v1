'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, X, ChevronDown } from 'lucide-react';
import { useGrowthArchitect } from '../context';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function ChatbotAssistant() {
  const { selectedBrand, currentPlan, chatbotOpen, setChatbotOpen } = useGrowthArchitect();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: currentPlan
        ? `Hi! I'm your Growth Architect assistant for ${selectedBrand}. I can help you evaluate your growth plan, suggest modifications, identify risks, and recommend optimizations. What would you like to discuss?`
        : `Hi! I'm your Growth Architect assistant. Generate a growth plan first to get started. I can help you evaluate strategies, suggest modifications, and answer questions about your growth approach.`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || loading || !currentPlan) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/growth/chatbot/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_name: selectedBrand,
          plan_id: currentPlan?.id,
          message: input,
          conversation_history: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.data?.response || 'Unable to generate response',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Chatbot error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error.message}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  if (!chatbotOpen) {
    return (
      <button
        onClick={() => setChatbotOpen(true)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
      >
        <Send className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="w-[350px] flex-shrink-0 bg-slate-800 border-l border-slate-700/50 flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between">
        <h3 className="font-bold text-white text-sm">Growth Assistant</h3>
        <button
          onClick={() => setChatbotOpen(false)}
          className="p-1 hover:bg-white/10 rounded transition-colors"
        >
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs rounded-lg px-3 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-700/50 text-slate-200'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-700/50 text-slate-200 rounded-lg px-3 py-2 text-sm">
              <span className="inline-block">Thinking</span>
              <span className="inline-block ml-1">
                <span className="animate-bounce">.</span>
                <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>
                  .
                </span>
                <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>
                  .
                </span>
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-4 border-t border-slate-700/50 space-y-3">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && currentPlan && handleSendMessage()}
            placeholder={currentPlan ? "Ask about your plan…" : "Generate a plan first"}
            disabled={loading || !currentPlan}
            className="flex-1 bg-slate-700/50 border border-slate-600/50 rounded px-3 py-2 text-xs text-white placeholder-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || loading || !currentPlan}
            title={!currentPlan ? "Generate a plan first" : ""}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-xs font-medium transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-xs text-slate-500">
          💡 Tip: Ask for plan critique, channel recommendations, or experiment ideas
        </p>
      </div>
    </div>
  );
}
