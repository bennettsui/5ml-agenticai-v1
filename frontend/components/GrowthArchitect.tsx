'use client';

import React, { useState } from 'react';
import { TrendingUp, Loader, CheckCircle2, AlertCircle, Zap } from 'lucide-react';

export default function GrowthArchitect() {
  const [activeTab, setActiveTab] = useState<'builder' | 'reviews' | 'experiments'>('builder');
  const [brandName, setBrandName] = useState('');
  const [productBrief, setProductBrief] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);
  const [error, setError] = useState('');
  const [reviews, setReviews] = useState<any[]>([]);
  const [experiments, setExperiments] = useState<any[]>([]);

  const handleGeneratePlan = async () => {
    if (!brandName || !productBrief) {
      setError('Please fill in brand name and product brief');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/growth/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_name: brandName,
          product_brief: productBrief,
          channels: ['facebook', 'google', 'linkedin', 'email'],
        }),
      });

      if (!response.ok) throw new Error('Failed to generate plan');

      const data = await response.json();
      setGeneratedPlan(data.data);
    } catch (err: any) {
      setError(err.message || 'Error generating plan');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchReviews = async () => {
    if (!brandName) {
      setError('Please select a brand first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/growth/weekly-reviews/${brandName}`);
      if (!response.ok) throw new Error('Failed to fetch reviews');

      const data = await response.json();
      setReviews(data.data || []);
    } catch (err: any) {
      setError(err.message || 'Error fetching reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchExperiments = async () => {
    if (!brandName) {
      setError('Please select a brand first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/growth/experiments/${brandName}`);
      if (!response.ok) throw new Error('Failed to fetch experiments');

      const data = await response.json();
      setExperiments(data.data || []);
    } catch (err: any) {
      setError(err.message || 'Error fetching experiments');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="w-8 h-8 text-emerald-500" />
        <div>
          <h2 className="text-2xl font-bold text-white">Growth Architect</h2>
          <p className="text-slate-400 text-sm">Generate 6-block growth strategies for your products</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700/50">
        <button
          onClick={() => setActiveTab('builder')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'builder'
              ? 'text-emerald-400 border-b-2 border-emerald-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          Plan Builder
        </button>
        <button
          onClick={() => {
            setActiveTab('reviews');
            if (reviews.length === 0) handleFetchReviews();
          }}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'reviews'
              ? 'text-emerald-400 border-b-2 border-emerald-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          Weekly Reviews
        </button>
        <button
          onClick={() => {
            setActiveTab('experiments');
            if (experiments.length === 0) handleFetchExperiments();
          }}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'experiments'
              ? 'text-emerald-400 border-b-2 border-emerald-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          Experiments
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="text-red-300 text-sm">{error}</div>
        </div>
      )}

      {/* Plan Builder Tab */}
      {activeTab === 'builder' && (
        <div className="space-y-4">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Brand Name</label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g., ikigai Design & Research"
                className="w-full bg-white/[0.02] border border-slate-700/50 rounded px-3 py-2 text-white placeholder-slate-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Product Brief</label>
              <textarea
                value={productBrief}
                onChange={(e) => setProductBrief(e.target.value)}
                placeholder="Describe what you sell, key features, and target customers..."
                rows={5}
                className="w-full bg-white/[0.02] border border-slate-700/50 rounded px-3 py-2 text-white placeholder-slate-500 text-sm"
              />
            </div>

            <button
              onClick={handleGeneratePlan}
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Generating Growth Plan...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Generate 6-Block Growth Plan
                </>
              )}
            </button>
          </div>

          {/* Generated Plan Display */}
          {generatedPlan && (
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-6 space-y-4">
              <div className="flex items-start gap-3 mb-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-white">Growth Plan Generated</h3>
                  <p className="text-slate-400 text-sm">
                    Plan ID: {generatedPlan.plan_id || 'Pending Save'}
                  </p>
                </div>
              </div>

              {/* Plan Blocks Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generatedPlan.plan?.block_1 && (
                  <div className="bg-white/[0.02] border border-slate-700/30 rounded p-4">
                    <h4 className="font-medium text-emerald-400 mb-2">Block 1: PMF & ICP</h4>
                    {generatedPlan.plan.block_1.value_prop && (
                      <p className="text-slate-300 text-sm mb-2">
                        <strong>Value Prop:</strong> {generatedPlan.plan.block_1.value_prop.substring(0, 100)}...
                      </p>
                    )}
                    {generatedPlan.plan.block_1.icp_segments?.length > 0 && (
                      <p className="text-slate-400 text-xs">
                        {generatedPlan.plan.block_1.icp_segments.length} ICP segments identified
                      </p>
                    )}
                  </div>
                )}

                {generatedPlan.plan?.block_2 && (
                  <div className="bg-white/[0.02] border border-slate-700/30 rounded p-4">
                    <h4 className="font-medium text-emerald-400 mb-2">Block 2: Funnel & Growth Loops</h4>
                    {generatedPlan.plan.block_2.primary_engine && (
                      <p className="text-slate-300 text-sm mb-2">
                        <strong>Primary Engine:</strong> {generatedPlan.plan.block_2.primary_engine}
                      </p>
                    )}
                    {generatedPlan.plan.block_2.growth_loops?.length > 0 && (
                      <p className="text-slate-400 text-xs">
                        {generatedPlan.plan.block_2.growth_loops.length} growth loops designed
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Full Plan JSON (Collapsed) */}
              <details className="bg-white/[0.02] border border-slate-700/30 rounded p-4">
                <summary className="cursor-pointer font-medium text-slate-300 hover:text-white transition-colors">
                  View Full 6-Block Plan (JSON)
                </summary>
                <pre className="mt-4 bg-slate-900/50 rounded p-3 overflow-x-auto text-xs text-slate-300 max-h-96 overflow-y-auto">
                  {JSON.stringify(generatedPlan.plan, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      )}

      {/* Weekly Reviews Tab */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          <button
            onClick={handleFetchReviews}
            disabled={loading}
            className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load Weekly Reviews'}
          </button>

          {reviews.length === 0 ? (
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-8 text-center">
              <p className="text-slate-400">No weekly reviews yet. Start by generating a growth plan!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm text-slate-400">
                        Week: {review.week_start} to {review.week_end}
                      </p>
                      <p className="text-sm font-medium text-emerald-400">
                        Status: <span className="text-white">{review.status}</span>
                      </p>
                    </div>
                    <span className="text-xs text-slate-500">{review.created_at?.substring(0, 10)}</span>
                  </div>
                  {review.summary?.week_summary && (
                    <p className="text-slate-300 text-sm mt-2">{review.summary.week_summary.substring(0, 150)}...</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Experiments Tab */}
      {activeTab === 'experiments' && (
        <div className="space-y-4">
          <button
            onClick={handleFetchExperiments}
            disabled={loading}
            className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load Experiments'}
          </button>

          {experiments.length === 0 ? (
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-8 text-center">
              <p className="text-slate-400">No experiments yet. Generate a growth plan to create experiments!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left px-4 py-2 text-slate-400 font-medium">Hypothesis</th>
                    <th className="text-left px-4 py-2 text-slate-400 font-medium">Channel</th>
                    <th className="text-left px-4 py-2 text-slate-400 font-medium">Status</th>
                    <th className="text-left px-4 py-2 text-slate-400 font-medium">Tags</th>
                  </tr>
                </thead>
                <tbody>
                  {experiments.map((exp) => (
                    <tr
                      key={exp.id}
                      className="border-b border-slate-700/50 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-3 text-slate-300">{exp.hypothesis.substring(0, 50)}...</td>
                      <td className="px-4 py-3 text-slate-400">{exp.channel || '—'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            exp.status === 'running'
                              ? 'bg-blue-500/20 text-blue-400'
                              : exp.status === 'completed'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-slate-500/20 text-slate-400'
                          }`}
                        >
                          {exp.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {exp.tags?.length > 0 ? exp.tags.join(', ') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
