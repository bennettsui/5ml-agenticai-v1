'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bot,
  Send,
  X,
  Sparkles,
  Copy,
  Check,
  Loader2,
  ChevronDown,
  Terminal,
} from 'lucide-react';
import MessageActions from '@/components/MessageActions';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface AdsAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  context?: {
    selectedTenant: string;
    dateRange: { from: string; to: string };
    platform: string;
    kpis: Record<string, unknown> | null;
    campaignCount: number;
    adCount: number;
  };
}

const SUGGESTION_CHIPS = [
  { label: 'Analyze my ad performance', prompt: 'Analyze my current ad performance and give me 3 actionable recommendations to improve ROAS.' },
  { label: 'Compare campaigns', prompt: 'Compare my top performing campaigns. Which ones should I scale and which should I pause?' },
  { label: 'Budget optimization', prompt: 'Based on my current CPC and CPM, how should I reallocate my budget across campaigns?' },
  { label: 'CTR improvement tips', prompt: 'My CTR seems low. What creative and targeting changes could improve it?' },
  { label: 'Weekly report summary', prompt: 'Write a short weekly performance summary I can share with my team.' },
  { label: 'Audience targeting ideas', prompt: 'Suggest new audience targeting strategies based on my current campaign objectives.' },
];

const CLAUDE_CODE_SUGGESTIONS = [
  {
    label: 'Add A/B test tracking',
    prompt: 'claude "Add A/B test variant tracking to the ads dashboard. Create a new DB column for variant_id in ads_daily_performance and show variant comparison in the UI."',
  },
  {
    label: 'Custom report template',
    prompt: 'claude "Create a custom report template for the monthly PPTX generator that includes our brand colors and logo. Update use-cases/5ml-ads-performance-internal/reports/slide-templates.ts"',
  },
  {
    label: 'Add conversion funnel',
    prompt: 'claude "Add a conversion funnel visualization to the ads dashboard showing impressions → clicks → conversions → revenue flow for each campaign."',
  },
  {
    label: 'Automated alerts',
    prompt: 'claude "Add automated performance alerts: notify when CPC exceeds threshold, CTR drops below baseline, or daily spend anomaly detected. Add to services/schedule-registry.js"',
  },
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export default function AdsAssistant({ isOpen, onClose, context }: AdsAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showClaudePrompts, setShowClaudePrompts] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: text.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Build context string for the assistant
      const contextInfo = context ? [
        `Current dashboard context:`,
        `- Account: ${context.selectedTenant === 'all' ? 'All accounts' : context.selectedTenant}`,
        `- Date range: ${context.dateRange.from} to ${context.dateRange.to}`,
        `- Platform: ${context.platform}`,
        `- Campaigns loaded: ${context.campaignCount}`,
        `- Ads loaded: ${context.adCount}`,
        context.kpis ? `- Total Spend: $${parseFloat(String(context.kpis.total_spend || '0')).toFixed(2)}` : '',
        context.kpis ? `- Avg CPC: $${parseFloat(String(context.kpis.avg_cpc || '0')).toFixed(2)}` : '',
        context.kpis ? `- Avg CPM: $${parseFloat(String(context.kpis.avg_cpm || '0')).toFixed(2)}` : '',
        context.kpis ? `- Avg CTR: ${parseFloat(String(context.kpis.avg_ctr || '0')).toFixed(2)}%` : '',
        context.kpis ? `- Total Clicks: ${context.kpis.total_clicks || 0}` : '',
        context.kpis ? `- Total Impressions: ${context.kpis.total_impressions || 0}` : '',
        context.kpis ? `- Conversions: ${context.kpis.total_conversions || 0}` : '',
        context.kpis ? `- ROAS: ${parseFloat(String(context.kpis.blended_roas || '0')).toFixed(2)}x` : '',
      ].filter(Boolean).join('\n') : '';

      const systemPrompt = `You are an expert digital advertising analyst assistant for the 5ML Ad Performance Dashboard. You help users understand their Meta Ads and Google Ads performance data, provide actionable optimization recommendations, and suggest budget allocations.

${contextInfo}

Guidelines:
- Be concise and actionable. Use bullet points.
- Reference specific metrics from the dashboard context when available.
- If the user asks about something that can't be done in the web UI, suggest a Claude Code prompt they can run to implement it, formatted as: \`claude "...prompt..."\`
- Focus on practical, data-driven recommendations.
- When suggesting budget changes, be specific with percentages.
- Use $ formatting for monetary values.`;

      const allMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: text.trim() },
      ];

      const res = await fetch(`${API_BASE}/api/ads/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: allMessages }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(errBody.error || `Failed to get response (${res.status})`);
      }

      const data = await res.json();
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.content || 'No response received.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `Sorry, I couldn't process that request. ${err instanceof Error ? err.message : 'Unknown error'}.\n\nMake sure the DEEPSEEK_API_KEY environment variable is set on the backend.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, [loading, context, messages]);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-[420px] bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-900/20 dark:to-purple-900/20">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg">
            <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Ad Performance Assistant</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Powered by DeepSeek</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-4">
            {/* Welcome */}
            <div className="text-center py-4">
              <Sparkles className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
              <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-1">How can I help?</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ask about your ad performance, get optimization tips, or request analysis.
              </p>
            </div>

            {/* Suggestion chips */}
            <div>
              <h5 className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 font-medium">Suggestions</h5>
              <div className="space-y-1.5">
                {SUGGESTION_CHIPS.map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => sendMessage(chip.prompt)}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors border border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-700"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Claude Code prompts */}
            <div>
              <button
                onClick={() => setShowClaudePrompts(!showClaudePrompts)}
                className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 font-medium hover:text-indigo-500 transition-colors"
              >
                <Terminal className="w-3 h-3" />
                Claude Code Prompts
                <ChevronDown className={`w-3 h-3 transition-transform ${showClaudePrompts ? 'rotate-180' : ''}`} />
              </button>
              {showClaudePrompts && (
                <div className="space-y-1.5">
                  {CLAUDE_CODE_SUGGESTIONS.map((item, idx) => (
                    <div
                      key={item.label}
                      className="px-3 py-2 text-xs bg-slate-900 dark:bg-slate-950 rounded-lg border border-slate-700"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-400 font-medium">{item.label}</span>
                        <button
                          onClick={() => copyToClipboard(item.prompt, idx + 100)}
                          className="p-1 hover:bg-slate-700 rounded transition-colors"
                        >
                          {copiedIndex === idx + 100 ? (
                            <Check className="w-3 h-3 text-green-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-500" />
                          )}
                        </button>
                      </div>
                      <code className="text-[10px] text-emerald-400 font-mono break-all leading-relaxed">
                        {item.prompt}
                      </code>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chat messages */}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm ${
                msg.role === 'user'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-700/70 text-slate-900 dark:text-slate-100'
              }`}
            >
              <div className="whitespace-pre-wrap text-xs leading-relaxed">{msg.content}</div>
              <MessageActions content={msg.content} variant={msg.role === 'user' ? 'user' : 'assistant'} />
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 dark:bg-slate-700/70 rounded-xl px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your ad performance..."
            rows={1}
            className="flex-1 resize-none px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            style={{ maxHeight: '120px' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 120) + 'px';
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="p-2.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-1.5 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
