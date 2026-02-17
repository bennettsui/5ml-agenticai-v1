'use client';

import { useState, useEffect } from 'react';
import { Loader, CheckCircle2, AlertCircle, Zap, BookOpen, BarChart3, Plug } from 'lucide-react';
import { useGrowthHackingStudio } from './context';
import { BrandSelector } from './components/BrandSelector';
import { DetailedPlanDisplay } from './components/DetailedPlanDisplay';
import { GrowthFlowchart } from './components/GrowthFlowchart';
import { IntegrationsCard } from './components/IntegrationsCard';

export default function GrowthHackingStudioPage() {
  const { selectedBrand, currentPlan, setCurrentPlan, isLoadingPlan, setIsLoadingPlan } =
    useGrowthHackingStudio();
  const [productBrief, setProductBrief] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(!currentPlan);
  const [activeTab, setActiveTab] = useState<'plan' | 'flowchart' | 'integrations'>('plan');

  useEffect(() => {
    // Auto-set product brief from selected brand
    const preset = [
      {
        name: 'ikigai Design & Research',
        brief:
          'Comprehensive elderly home assessments service. We conduct detailed in-home evaluations assessing safety, accessibility, mobility, cognitive function, and care needs of seniors. Reports provide actionable recommendations for home modifications, care planning, and family discussions about elder care.',
      },
      {
        name: '5ML Agentic Solution',
        brief:
          '5ML is a creative + technical growth studio building productized agentic AI systems for growth. End-to-end solutions: agent orchestration, multi-LLM routing, RAG knowledge bases, paid media integration, content generation, CRM automation, and agentic workflow design.',
      },
    ].find((b) => b.name === selectedBrand);

    if (preset) {
      setProductBrief(preset.brief);
    }
  }, [selectedBrand]);

  const handleGeneratePlan = async () => {
    if (!selectedBrand || !productBrief) {
      setError('Brand name and product brief are required');
      return;
    }

    setIsLoadingPlan(true);
    setError('');

    try {
      const r = await fetch('/api/growth/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_name: selectedBrand,
          product_brief: productBrief,
          channels: ['facebook', 'google', 'linkedin', 'email'],
        }),
      });

      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setCurrentPlan(data.data);
      setShowForm(false);

      // TODO: Seed KB on plan generation
      // const seedResponse = await fetch('/api/growth/kb/seed', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     brand_name: selectedBrand,
      //     plan_id: data.data.id,
      //   }),
      // });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoadingPlan(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Zap className="w-8 h-8 text-emerald-500" />
            Plan Builder
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Generate a 6-block growth strategy for any brand
          </p>
        </div>
        {currentPlan && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Generate New Plan
          </button>
        )}
      </div>

      {/* Brand Selector */}
      <BrandSelector />

      {/* Form or Plan Display */}
      {showForm || !currentPlan ? (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Product Brief
            </label>
            <textarea
              value={productBrief}
              onChange={(e) => setProductBrief(e.target.value)}
              rows={5}
              className="w-full bg-white/[0.02] border border-slate-700/50 rounded px-4 py-2.5 text-white placeholder-slate-500 text-sm"
              placeholder="Describe your product, key features, target customers, and unique value proposition…"
            />
          </div>

          {error && (
            <div className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <button
            onClick={handleGeneratePlan}
            disabled={isLoadingPlan}
            className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isLoadingPlan ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Generating Plan…
              </>
            ) : (
              'Generate 6-Block Plan'
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Plan Status */}
          <div className="flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-emerald-300">Plan Generated Successfully</p>
              <p className="text-xs text-emerald-200">
                Created on {new Date(currentPlan.created_at).toLocaleDateString()} •{' '}
                {currentPlan.status} • Phase: {currentPlan.phase}
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-slate-700/50">
            <button
              onClick={() => setActiveTab('plan')}
              className={`px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'plan'
                  ? 'text-emerald-400 border-b-2 border-emerald-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Detailed Plan
            </button>
            <button
              onClick={() => setActiveTab('flowchart')}
              className={`px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'flowchart'
                  ? 'text-emerald-400 border-b-2 border-emerald-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Lead Gen Studioure
            </button>
            <button
              onClick={() => setActiveTab('integrations')}
              className={`px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'integrations'
                  ? 'text-emerald-400 border-b-2 border-emerald-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Plug className="w-4 h-4" />
              Integrations
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'plan' && <DetailedPlanDisplay plan={currentPlan.plan_data} />}
          {activeTab === 'flowchart' && <GrowthFlowchart plan={currentPlan.plan_data} />}
          {activeTab === 'integrations' && <IntegrationsCard />}
        </div>
      )}
    </div>
  );
}
