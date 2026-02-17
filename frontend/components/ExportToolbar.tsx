import { useState } from 'react';
import { Download, Copy, Share2, ChevronDown } from 'lucide-react';
import {
  exportAsJSON,
  exportAsCSV,
  exportAsText,
  copyToClipboard,
  generateShareableLink,
} from '@/lib/export-strategy';
import type { GeneratedBrandStrategy } from '@/lib/brand-strategy-generator';

interface ExportToolbarProps {
  strategy: GeneratedBrandStrategy;
}

export default function ExportToolbar({ strategy }: ExportToolbarProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showShareLink, setShowShareLink] = useState(false);

  const handleCopyToClipboard = async () => {
    const success = await copyToClipboard(strategy);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGenerateShareLink = () => {
    const link = generateShareableLink(strategy);
    navigator.clipboard.writeText(link);
    setShowShareLink(true);
    setTimeout(() => setShowShareLink(false), 3000);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors text-sm font-medium"
      >
        <Download className="w-4 h-4" />
        Export
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${showMenu ? 'rotate-180' : ''}`}
        />
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700/50 rounded-lg shadow-xl z-50 overflow-hidden">
          <button
            onClick={() => {
              exportAsJSON(strategy);
              setShowMenu(false);
            }}
            className="w-full px-4 py-2.5 text-left text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-2"
          >
            <span className="text-xs">📄</span> Export as JSON
          </button>
          <button
            onClick={() => {
              exportAsCSV(strategy);
              setShowMenu(false);
            }}
            className="w-full px-4 py-2.5 text-left text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-2 border-t border-slate-700/30"
          >
            <span className="text-xs">📊</span> Export as CSV
          </button>
          <button
            onClick={() => {
              exportAsText(strategy);
              setShowMenu(false);
            }}
            className="w-full px-4 py-2.5 text-left text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-2 border-t border-slate-700/30"
          >
            <span className="text-xs">📋</span> Export as Text
          </button>
          <button
            onClick={() => {
              handleCopyToClipboard();
              setShowMenu(false);
            }}
            className="w-full px-4 py-2.5 text-left text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-2 border-t border-slate-700/30"
          >
            <Copy className="w-4 h-4" />
            {copied ? 'Copied!' : 'Copy as JSON'}
          </button>
          <button
            onClick={() => {
              handleGenerateShareLink();
              setShowMenu(false);
            }}
            className="w-full px-4 py-2.5 text-left text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-2 border-t border-slate-700/30"
          >
            <Share2 className="w-4 h-4" />
            {showShareLink ? 'Link copied!' : 'Generate Share Link'}
          </button>
        </div>
      )}
    </div>
  );
}
