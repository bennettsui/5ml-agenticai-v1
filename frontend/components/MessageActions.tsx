'use client';

import { useState, useCallback } from 'react';
import { Copy, Check, Share2, Download } from 'lucide-react';

interface MessageActionsProps {
  content: string;
  /** Show on assistant messages (full bar) or user messages (copy only) */
  variant?: 'assistant' | 'user';
}

export default function MessageActions({ content, variant = 'assistant' }: MessageActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = content;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [content]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `message-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [content]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: content });
      } catch { /* user cancelled */ }
    } else {
      // Fallback: just copy
      handleCopy();
    }
  }, [content, handleCopy]);

  if (variant === 'user') {
    return (
      <div className="flex items-center gap-0.5 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
        <button
          onClick={handleCopy}
          className="p-1 rounded hover:bg-white/10 transition-colors"
          title={copied ? 'Copied!' : 'Copy'}
        >
          {copied
            ? <Check className="w-3 h-3 text-green-400" />
            : <Copy className="w-3 h-3 text-slate-500 hover:text-slate-300" />
          }
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        onClick={handleCopy}
        className="p-1 rounded hover:bg-white/10 transition-colors"
        title={copied ? 'Copied!' : 'Copy'}
      >
        {copied
          ? <Check className="w-3 h-3 text-green-400" />
          : <Copy className="w-3 h-3 text-slate-500 hover:text-slate-300" />
        }
      </button>
      <button
        onClick={handleDownload}
        className="p-1 rounded hover:bg-white/10 transition-colors"
        title="Download as text"
      >
        <Download className="w-3 h-3 text-slate-500 hover:text-slate-300" />
      </button>
      <button
        onClick={handleShare}
        className="p-1 rounded hover:bg-white/10 transition-colors"
        title="Share"
      >
        <Share2 className="w-3 h-3 text-slate-500 hover:text-slate-300" />
      </button>
    </div>
  );
}
