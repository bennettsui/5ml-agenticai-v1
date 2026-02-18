'use client';

import { Sparkles, AlertCircle, Zap, MessageCircle, Vote, Gamepad2, Camera } from 'lucide-react';
import { useBrandProject } from '@/lib/brand-context';

const INTERACTIVE_TYPES = [
  { label: 'Polls & Surveys', icon: Vote, desc: 'Engage audience with quick polls and multi-question surveys', platforms: ['IG Stories', 'X/Twitter', 'LinkedIn'], color: 'purple' },
  { label: 'Quizzes', icon: Gamepad2, desc: 'Create interactive quizzes for education and entertainment', platforms: ['IG Stories', 'Web embed'], color: 'pink' },
  { label: 'Q&A Sessions', icon: MessageCircle, desc: 'Host live or async Q&A with audience', platforms: ['IG Live', 'LinkedIn Live', 'X Spaces'], color: 'blue' },
  { label: 'AR Filters', icon: Camera, desc: 'Custom branded AR filters and effects', platforms: ['Instagram', 'TikTok', 'Snapchat'], color: 'amber' },
  { label: 'Interactive Stories', icon: Zap, desc: 'Story sequences with branching paths and CTAs', platforms: ['IG Stories', 'FB Stories'], color: 'emerald' },
  { label: 'Contests & UGC', icon: Sparkles, desc: 'User-generated content campaigns and contests', platforms: ['All platforms'], color: 'cyan' },
];

const colorClasses: Record<string, string> = {
  purple: 'border-purple-700/30 text-purple-400',
  pink: 'border-pink-700/30 text-pink-400',
  blue: 'border-blue-700/30 text-blue-400',
  amber: 'border-amber-700/30 text-amber-400',
  emerald: 'border-emerald-700/30 text-emerald-400',
  cyan: 'border-cyan-700/30 text-cyan-400',
};

export default function InteractiveContentPage() {
  const { selectedBrand } = useBrandProject();

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-pink-400" />
          <h1 className="text-2xl font-bold text-white">Interactive Content Planning</h1>
        </div>
        <p className="text-sm text-slate-400">
          Plan interactive experiences: polls, quizzes, AR filters, stories — campaign-based
        </p>
      </div>

      {!selectedBrand && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-900/20 border border-amber-700/30 rounded-xl">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <p className="text-xs text-amber-300">Select a brand to plan interactive content.</p>
        </div>
      )}

      {/* Interactive types grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {INTERACTIVE_TYPES.map(it => {
          const Icon = it.icon;
          const colors = colorClasses[it.color] || colorClasses.purple;
          return (
            <div key={it.label} className={`bg-slate-800/60 border ${colors.split(' ')[0]} rounded-xl p-5 hover:bg-slate-800/80 transition-colors cursor-pointer`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${colors.split(' ')[1]}`} />
                <h3 className="text-sm font-semibold text-white">{it.label}</h3>
              </div>
              <p className="text-xs text-slate-400 mb-3">{it.desc}</p>
              <div className="flex gap-1 flex-wrap">
                {it.platforms.map(p => (
                  <span key={p} className="text-[10px] px-1.5 py-0.5 bg-white/[0.04] rounded text-slate-500">{p}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Campaign planner */}
      <div className="bg-white/[0.02] border border-slate-700/30 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-white mb-3">Campaign Planner</h2>
        <p className="text-xs text-slate-500 mb-4">
          Select an interactive content type above, then use the AI assistant to plan your campaign.
        </p>
        <div className="h-32 flex items-center justify-center border border-dashed border-slate-700/50 rounded-lg">
          <p className="text-xs text-slate-600">Select a content type to start planning</p>
        </div>
      </div>
    </div>
  );
}
