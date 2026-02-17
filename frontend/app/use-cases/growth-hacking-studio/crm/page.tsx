'use client';

import { useState } from 'react';
import { Mail, Plus, Zap } from 'lucide-react';
import { useGrowthHackingStudio } from '../context';

export default function CRMPage() {
  const { selectedBrand, currentPlan } = useGrowthHackingStudio();
  const [flows, setFlows] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);

  const flowTypes = [
    { name: 'Lead Nurture', description: 'Automated email sequence for new leads' },
    { name: 'Onboarding', description: 'Welcome series for new customers' },
    { name: 'Win-back', description: 'Re-engagement for inactive users' },
    { name: 'Upsell', description: 'Cross-sell and upgrade sequences' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Mail className="w-8 h-8 text-blue-500" />
            CRM & Email Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {selectedBrand} • Design flows and campaigns
          </p>
        </div>
        <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Flow
        </button>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-6">
        {/* CRM Flows */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            CRM Flows
          </h2>
          <div className="space-y-3">
            {flowTypes.map((type, idx) => (
              <div key={idx} className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4 hover:border-slate-700 transition-colors cursor-pointer">
                <h3 className="text-sm font-semibold text-white mb-1">{type.name}</h3>
                <p className="text-xs text-slate-400 mb-3">{type.description}</p>
                <button className="w-full px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded text-xs font-medium transition-colors">
                  Design Flow
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Email Campaigns */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-400" />
            Email Campaigns
          </h2>
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-8 text-center">
            <Mail className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-300 font-medium mb-2">No campaigns yet</p>
            <p className="text-slate-500 text-sm mb-4">
              Create campaigns from CRM flows or generate with the Email Agent
            </p>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
              Create Campaign
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1">Active Flows</p>
          <p className="text-2xl font-bold text-white">0</p>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1">Total Campaigns</p>
          <p className="text-2xl font-bold text-white">0</p>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1">Emails Sent</p>
          <p className="text-2xl font-bold text-white">—</p>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1">Open Rate</p>
          <p className="text-2xl font-bold text-white">—</p>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <p className="text-sm text-blue-200">
          💡 <strong>Tip:</strong> Design your customer journey first in CRM flows, then generate email content using the email generation agent.
        </p>
      </div>
    </div>
  );
}
