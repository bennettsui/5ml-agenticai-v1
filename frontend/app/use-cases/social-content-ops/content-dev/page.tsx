'use client';

import { useState } from 'react';
import { Pencil, AlertCircle, Image, FileText, Video, Mic, Loader2, Sparkles } from 'lucide-react';
import { useBrandProject } from '@/lib/brand-context';

const CONTENT_TYPES = [
  { label: 'Static Post', icon: Image, desc: 'Image with caption for feed posts', formats: ['1080x1080', '1200x628', '1080x1920'] },
  { label: 'Carousel', icon: FileText, desc: 'Multi-slide educational or storytelling content', formats: ['Up to 10 slides'] },
  { label: 'Short Video', icon: Video, desc: 'Reels, TikTok, Shorts — 15-60 seconds', formats: ['9:16 vertical'] },
  { label: 'Long Video', icon: Video, desc: 'YouTube, IGTV — 3-15 minutes', formats: ['16:9 horizontal'] },
  { label: 'Audio/Podcast', icon: Mic, desc: 'Twitter Spaces, LinkedIn Audio clips', formats: ['1-5 min clips'] },
  { label: 'Story/Ephemeral', icon: Sparkles, desc: 'IG/FB Stories — 24hr content with interactive stickers', formats: ['1080x1920'] },
];

export default function ContentDevPage() {
  const { selectedBrand } = useBrandProject();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Pencil className="w-5 h-5 text-amber-400" />
          <h1 className="text-2xl font-bold text-white">Content Development</h1>
        </div>
        <p className="text-sm text-slate-400">
          Create and produce social media content with AI-assisted copywriting and creative direction
        </p>
      </div>

      {!selectedBrand && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-900/20 border border-amber-700/30 rounded-xl">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <p className="text-xs text-amber-300">Select a brand for brand-aligned content development.</p>
        </div>
      )}

      {/* Content Type Selector */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Content Type</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {CONTENT_TYPES.map(ct => {
            const Icon = ct.icon;
            const active = selectedType === ct.label;
            return (
              <button
                key={ct.label}
                onClick={() => setSelectedType(ct.label)}
                className={`text-left p-4 rounded-xl border transition-all ${
                  active
                    ? 'bg-amber-500/10 border-amber-500/30 ring-1 ring-amber-500/20'
                    : 'bg-slate-800/60 border-slate-700/50 hover:border-slate-600'
                }`}
              >
                <Icon className={`w-4 h-4 mb-2 ${active ? 'text-amber-400' : 'text-slate-500'}`} />
                <h3 className="text-sm font-medium text-white">{ct.label}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{ct.desc}</p>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {ct.formats.map(f => (
                    <span key={f} className="text-[10px] px-1.5 py-0.5 bg-white/[0.04] rounded text-slate-500">{f}</span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content workspace */}
      {selectedType && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Create {selectedType}</h2>
            <button
              disabled={!selectedBrand || generating}
              onClick={() => { setGenerating(true); setTimeout(() => setGenerating(false), 2000); }}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium disabled:opacity-40 transition-colors flex items-center gap-1.5"
            >
              {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              AI Generate
            </button>
          </div>
          <textarea
            placeholder={`Write your ${selectedType.toLowerCase()} copy here, or use AI to generate...`}
            className="w-full h-40 bg-white/[0.02] border border-slate-700/30 rounded-lg p-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/30 resize-none"
          />
          <div className="mt-3 flex gap-2">
            <button className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs transition-colors">
              Save Draft
            </button>
            <button className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs transition-colors">
              Add to Calendar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
