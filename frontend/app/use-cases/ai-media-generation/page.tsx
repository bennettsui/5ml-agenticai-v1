'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight, Film, ImageIcon, Video, Library,
  Cpu, Wand2, CheckCircle2, Layers, Palette,
  Activity, Home,
} from 'lucide-react';
import MediaGenerationWorkflow from '@/components/MediaGenerationWorkflow';
import MultimediaLibrary from '@/components/MultimediaLibrary';

type MediaTab = 'overview' | 'workflow' | 'library';

export default function AiMediaGenerationPage() {
  const getInitialTab = (): MediaTab => {
    if (typeof window === 'undefined') return 'overview';
    const p = new URLSearchParams(window.location.search).get('tab') as MediaTab | null;
    const valid: MediaTab[] = ['overview', 'workflow', 'library'];
    return p && valid.includes(p) ? p : 'overview';
  };
  const [activeTab, setActiveTab] = useState<MediaTab>(getInitialTab);

  const tabs: { id: MediaTab; label: string; icon: typeof Activity }[] = [
    { id: 'overview',  label: 'Overview',             icon: Activity  },
    { id: 'workflow',  label: '🎨 Generation Workflow', icon: Wand2    },
    { id: 'library',   label: '📚 Multimedia Library',  icon: Library  },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">

      {/* HEADER */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-slate-400 hover:text-white transition-colors mr-1">
              <Home className="w-4 h-4" />
            </Link>
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <Film className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">AI Media Generation</h1>
              <p className="text-xs text-slate-500">Agency brief → SDXL / ComfyUI / AnimateDiff pipeline</p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Dashboard <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* TAB NAVIGATION */}
      <nav className="bg-slate-800 border-b border-slate-700 sticky top-[65px] z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-6 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-1 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-rose-500 text-rose-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ================================================================ */}
        {/* OVERVIEW TAB                                                     */}
        {/* ================================================================ */}
        {activeTab === 'overview' && (
          <div className="space-y-10">

            {/* HERO */}
            <section className="py-10 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full text-xs text-rose-400 mb-4">
                <Film className="w-3 h-3" /> MediaChannel · AI-native creative pipeline
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                Brief to Deliverable<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-400">
                  in One Agentic Workflow
                </span>
              </h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
                Eight specialised agents translate a creative brief into ComfyUI / AnimateDiff
                workflow configs, run QC, track brand history, and manage your multimedia asset library.
              </p>
              <button
                onClick={() => setActiveTab('workflow')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-medium transition-colors"
              >
                Open Generation Workflow <ArrowRight className="w-4 h-4" />
              </button>
            </section>

            {/* AGENT ARCHITECTURE */}
            <section>
              <h3 className="text-2xl font-bold text-white mb-6">Eight-Agent Architecture</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { icon: Wand2,       color: 'rose',   name: 'BriefTranslatorAgent',  desc: 'Parses creative briefs into structured spec JSON with deliverables, constraints, and brand context.' },
                  { icon: Palette,     color: 'pink',   name: 'StyleManagerAgent',     desc: 'Builds and persists per-project style guides, LoRA recommendations, and negative-prompt rules.' },
                  { icon: Cpu,         color: 'orange', name: 'PromptEngineerAgent',   desc: 'Generates SDXL / SD1.5 positive and negative prompts, sampler settings, and CFG tuning per deliverable.' },
                  { icon: Layers,      color: 'amber',  name: 'WorkflowDesignerAgent', desc: 'Emits ComfyUI node-graph configs and AnimateDiff / SVD pipeline configs ready to load.' },
                  { icon: CheckCircle2,color: 'green',  name: 'QualityCheckerAgent',   desc: 'Vision QC on completed renders — checks brand compliance, artifact score, and negative-prompt leakage.' },
                  { icon: Library,     color: 'teal',   name: 'AssetLibrarianAgent',   desc: 'Tags, indexes, and searches the multimedia asset library; tracks performance data for learning loop.' },
                  { icon: ImageIcon,   color: 'blue',   name: 'ClientFeedbackAgent',   desc: 'Parses natural-language revision notes into concrete parameter deltas and prompt edits.' },
                  { icon: Video,       color: 'violet', name: 'BrandHistoryAgent',     desc: 'Maintains brand memory across projects — colours, styles, approved looks, past performance.' },
                ].map(({ icon: Icon, color, name, desc }) => (
                  <div key={name} className={`group rounded-xl border border-slate-700/50 bg-slate-800/60 hover:bg-white/[0.02] p-5 transition-all`}>
                    <div className={`p-2.5 rounded-lg bg-${color}-500/10 w-fit mb-3 group-hover:bg-${color}-500/20 transition-colors`}>
                      <Icon className={`w-5 h-5 text-${color}-400`} />
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1">{name}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* WORKFLOW STAGES */}
            <section>
              <h3 className="text-2xl font-bold text-white mb-6">Production Pipeline</h3>
              <div className="relative">
                <div className="absolute left-3.5 top-4 bottom-4 w-px bg-slate-700/50 hidden sm:block" />
                <div className="space-y-3">
                  {[
                    { stage: '1',  label: 'brief',               desc: 'Client submits creative brief — format, channel, brand, mood' },
                    { stage: '2',  label: 'prompt_design',        desc: 'BriefTranslator + StyleManager + PromptEngineer generate prompts' },
                    { stage: '3',  label: 'preview_generation',   desc: 'WorkflowDesigner emits ComfyUI config; operator runs 4-image batch' },
                    { stage: '4',  label: 'review',               desc: 'Client or operator selects hero frame, records feedback' },
                    { stage: '5',  label: 'refined_generation',   desc: 'WorkflowDesigner emits final-pass config with upscaler' },
                    { stage: '6',  label: 'quality_check',        desc: 'Vision QC agent scores renders against brand spec' },
                    { stage: '7',  label: 'client_approval',      desc: 'ClientFeedbackAgent parses revision notes into prompt deltas' },
                    { stage: '8',  label: 'delivery',             desc: 'Asset tagged, indexed in library, performance tracking begins' },
                  ].map(({ stage, label, desc }) => (
                    <div key={stage} className="flex items-start gap-4 pl-1 sm:pl-10 relative">
                      <div className="absolute left-0 w-7 h-7 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-xs font-bold text-rose-400 shrink-0 hidden sm:flex">
                        {stage}
                      </div>
                      <div className="flex-1 rounded-lg border border-slate-700/50 bg-white/[0.02] px-4 py-3">
                        <span className="text-xs font-mono text-rose-400 mr-2">{label}</span>
                        <span className="text-xs text-slate-400">{desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* TECHNICAL SPECS */}
            <section>
              <h3 className="text-2xl font-bold text-white mb-6">Technical Specs</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-5">
                  <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-rose-400" /> Image Generation
                  </h4>
                  <ul className="text-xs text-slate-400 space-y-1.5">
                    <li>• SDXL 1.0 base + refiner</li>
                    <li>• SD 1.5 for portrait / compact formats</li>
                    <li>• Resolutions: 512→1344px (6 profiles)</li>
                    <li>• Preview 20 steps · Final 50 steps</li>
                    <li>• RealESRGAN ×4 upscale on final pass</li>
                    <li>• LoRA stack (style + character)</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-5">
                  <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <Video className="w-4 h-4 text-orange-400" /> Video Generation
                  </h4>
                  <ul className="text-xs text-slate-400 space-y-1.5">
                    <li>• AnimateDiff v2 motion module</li>
                    <li>• SVD-XT image-to-video (25 frames)</li>
                    <li>• 8–16 fps, 16–32 frames default</li>
                    <li>• Context window 16 frames</li>
                    <li>• MP4 output via ffmpeg muxer</li>
                    <li>• Optimised for 16 GB VRAM</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-5">
                  <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-amber-400" /> Model Routing
                  </h4>
                  <ul className="text-xs text-slate-400 space-y-1.5">
                    <li>• Brief translation → DeepSeek R1</li>
                    <li>• Prompt engineering → DeepSeek R1</li>
                    <li>• Style extraction → Claude Haiku</li>
                    <li>• Vision QC → Claude Sonnet</li>
                    <li>• ~$0.011 / brief (LLM cost)</li>
                    <li>• GPU compute self-hosted (~$0.03/img)</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* CTA */}
            <section className="pb-8">
              <div className="rounded-xl border border-rose-500/20 bg-gradient-to-r from-rose-500/10 to-orange-500/10 p-8 text-center">
                <h3 className="text-2xl font-bold text-white mb-3">Ready to generate?</h3>
                <p className="text-slate-400 mb-6">Create a project, submit a brief, and the agent pipeline builds your full workflow config.</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => setActiveTab('workflow')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-medium transition-colors"
                  >
                    Generation Workflow <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActiveTab('library')}
                    className="inline-flex items-center gap-2 px-6 py-3 border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white rounded-lg font-medium transition-colors"
                  >
                    Multimedia Library <Library className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </section>

          </div>
        )}

        {/* ================================================================ */}
        {/* WORKFLOW TAB                                                     */}
        {/* ================================================================ */}
        {activeTab === 'workflow' && <MediaGenerationWorkflow />}

        {/* ================================================================ */}
        {/* LIBRARY TAB                                                      */}
        {/* ================================================================ */}
        {activeTab === 'library' && <MultimediaLibrary />}

      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-700/50 bg-slate-900/50 mt-20 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-xs text-slate-500">
          <p>AI Media Generation · MediaChannel · ComfyUI + AnimateDiff + SVD pipeline</p>
          <p className="mt-2">Self-hosted GPU · LLM cost ~$0.66/month · GPU electricity only</p>
        </div>
      </footer>
    </div>
  );
}
