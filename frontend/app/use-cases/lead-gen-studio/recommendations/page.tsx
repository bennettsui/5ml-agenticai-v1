'use client';

import { useState } from 'react';
import { Lightbulb, Play, Square, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useLeadGenStudio } from '../context';

export default function RecommendationsPage() {
  const { selectedBrand, currentPlan } = useLeadGenStudio();
  const [experiments, setExperiments] = useState<any[]>([
    {
      id: 1,
      hypothesis: 'Personalized subject lines increase email open rates by 15%',
      status: 'pending',
      channel: 'Email',
    },
    {
      id: 2,
      hypothesis: 'Video ads outperform static on Facebook for this audience',
      status: 'pending',
      channel: 'Facebook',
    },
  ]);

  const recommendations = [
    {
      priority: 'high',
      title: 'Launch A/B Test: Landing Page Headlines',
      description: 'Test 3 different value prop headlines to improve CVR',
      expectedImpact: '+8-12% CTR',
      effort: 'Low',
    },
    {
      priority: 'high',
      title: 'Expand Email List Segment',
      description: 'Create high-engagement segment based on behavior',
      expectedImpact: '+15% email revenue',
      effort: 'Medium',
    },
    {
      priority: 'medium',
      title: 'Test LinkedIn Content Frequency',
      description: 'Increase from 1x to 3x weekly posts',
      expectedImpact: '+25% engagement',
      effort: 'Low',
    },
    {
      priority: 'medium',
      title: 'Launch CRM Automation Flow',
      description: 'Auto-nurture cold leads with educational content',
      expectedImpact: '+18% qualified leads',
      effort: 'High',
    },
  ];

  const statusColors = {
    pending: 'bg-slate-600',
    running: 'bg-blue-600',
    completed: 'bg-emerald-600',
    archived: 'bg-slate-700',
  };

  const priorityColors = {
    high: 'border-red-500/50 bg-red-500/10',
    medium: 'border-yellow-500/50 bg-yellow-500/10',
    low: 'border-green-500/50 bg-green-500/10',
  };

  const priorityText = {
    high: 'text-red-300',
    medium: 'text-yellow-300',
    low: 'text-green-300',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Lightbulb className="w-8 h-8 text-yellow-500" />
            Recommendations & Experiments
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {selectedBrand} • AI-powered optimization experiments
          </p>
        </div>
        <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
          <Play className="w-4 h-4" />
          Launch Experiment
        </button>
      </div>

      {/* Active Experiments */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Active Experiments</h2>
        {experiments.length === 0 ? (
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-8 text-center">
            <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-300 font-medium">No active experiments</p>
            <p className="text-slate-500 text-sm">Start an experiment to test your growth hypotheses</p>
          </div>
        ) : (
          experiments.map((exp) => (
            <div key={exp.id} className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white mb-1">{exp.hypothesis}</p>
                  <p className="text-xs text-slate-400">{exp.channel}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
                    statusColors[exp.status as keyof typeof statusColors]
                  }`}
                >
                  {exp.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* AI Recommendations */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Recommended Experiments</h2>
        <p className="text-sm text-slate-400">
          Based on your growth plan and market analysis. Prioritized by impact and effort.
        </p>

        <div className="space-y-3">
          {recommendations.map((rec, idx) => (
            <div
              key={idx}
              className={`border rounded-lg p-4 ${priorityColors[rec.priority as keyof typeof priorityColors]}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${priorityText[rec.priority as keyof typeof priorityText]}`}>
                    {rec.priority.toUpperCase()} PRIORITY
                  </p>
                  <h3 className="text-base font-semibold text-white mt-1">{rec.title}</h3>
                  <p className="text-sm text-slate-300 mt-2">{rec.description}</p>
                </div>
                <button className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium transition-colors whitespace-nowrap ml-4">
                  Launch
                </button>
              </div>

              <div className="flex gap-4 mt-3 pt-3 border-t border-white/10">
                <div>
                  <p className="text-xs text-slate-400 uppercase">Expected Impact</p>
                  <p className="text-sm font-semibold text-white">{rec.expectedImpact}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase">Effort</p>
                  <p className="text-sm font-semibold text-white">{rec.effort}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Experiment Templates */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Experiment Templates</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { name: 'A/B Test', desc: 'Compare two variations' },
            { name: 'Multivariate', desc: 'Test multiple variables' },
            { name: 'Cohort Analysis', desc: 'Segment and compare groups' },
            { name: 'Sequential', desc: 'Test changes over time' },
          ].map((template, idx) => (
            <button
              key={idx}
              className="p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded border border-slate-700/50 text-left transition-colors"
            >
              <p className="text-sm font-semibold text-white">{template.name}</p>
              <p className="text-xs text-slate-400 mt-1">{template.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Growth Framework */}
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          Build-Measure-Learn Cycle
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs font-semibold text-emerald-300 uppercase mb-2">Build</p>
            <p className="text-sm text-slate-200">Design hypothesis and set up experiment</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-300 uppercase mb-2">Measure</p>
            <p className="text-sm text-slate-200">Collect data and track metrics</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-300 uppercase mb-2">Learn</p>
            <p className="text-sm text-slate-200">Analyze results and iterate</p>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
        <p className="text-sm text-yellow-200">
          💡 <strong>Pro Tip:</strong> Run experiments in parallel on different channels to accelerate learning. Prioritize tests
          with high impact and low effort.
        </p>
      </div>
    </div>
  );
}
