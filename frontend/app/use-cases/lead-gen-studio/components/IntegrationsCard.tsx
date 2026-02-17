'use client';

import { useState, useEffect } from 'react';
import { Link as LinkIcon, ExternalLink, AlertCircle, CheckCircle } from 'lucide-react';
import { useLeadGenStudio } from '../context';

interface Integration {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'available' | 'coming_soon';
  category: 'data' | 'platform' | 'use_case';
  icon: string;
  link?: string;
  action?: string;
}

export function IntegrationsCard() {
  const { selectedBrand, currentPlan } = useLeadGenStudio();
  const [integrations] = useState<Integration[]>([
    // Data Sources (Available)
    {
      id: 'ads_performance',
      name: 'Ad Performance Dashboard',
      description: 'Real-time metrics from Facebook, Google, and LinkedIn ads',
      status: 'available',
      category: 'data',
      icon: '📊',
      link: '/ads-dashboard/client',
      action: 'View Performance',
    },
    // Use Cases (Available)
    {
      id: 'crm_flows',
      name: 'CRM & Email Workflows',
      description: 'Customer journey automation and email campaigns',
      status: 'available',
      category: 'use_case',
      icon: '📧',
      link: '/use-cases/crm',
      action: 'Manage CRM',
    },
    // Coming Soon
    {
      id: 'ecommerce',
      name: 'E-commerce Integration',
      description: 'Connect Shopify, WooCommerce, or custom stores for real-time sales data',
      status: 'coming_soon',
      category: 'platform',
      icon: '🛍️',
    },
    {
      id: 'lead_gen',
      name: 'Lead Generation Forms',
      description: 'Capture and track leads from your landing pages and forms',
      status: 'coming_soon',
      category: 'platform',
      icon: '📝',
    },
    {
      id: 'analytics',
      name: 'Web Analytics',
      description: 'Google Analytics, Mixpanel, and custom event tracking',
      status: 'coming_soon',
      category: 'data',
      icon: '📈',
    },
    {
      id: 'social_media',
      name: 'Social Media Platforms',
      description: 'TikTok, Instagram, YouTube native integrations',
      status: 'coming_soon',
      category: 'platform',
      icon: '📱',
    },
  ]);

  const connectedCount = integrations.filter((i) => i.status === 'connected').length;
  const availableCount = integrations.filter((i) => i.status === 'available').length;
  const comingSoonCount = integrations.filter((i) => i.status === 'coming_soon').length;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
          <p className="text-xs text-emerald-300 uppercase font-semibold mb-1">Connected</p>
          <p className="text-2xl font-bold text-emerald-400">{connectedCount}</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <p className="text-xs text-blue-300 uppercase font-semibold mb-1">Ready to Use</p>
          <p className="text-2xl font-bold text-blue-400">{availableCount}</p>
        </div>
        <div className="bg-slate-600/10 border border-slate-600/30 rounded-lg p-4">
          <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Coming Soon</p>
          <p className="text-2xl font-bold text-slate-400">{comingSoonCount}</p>
        </div>
      </div>

      {/* Integrations List */}
      <div className="space-y-3">
        {/* Available Now */}
        {availableCount > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-emerald-300 mb-3 uppercase tracking-wide">Ready to Use</h3>
            <div className="space-y-2">
              {integrations
                .filter((i) => i.status === 'available')
                .map((integration) => (
                  <div
                    key={integration.id}
                    className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4 hover:border-slate-700 transition-colors flex items-start justify-between"
                  >
                    <div className="flex gap-3 flex-1">
                      <div className="text-2xl">{integration.icon}</div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">{integration.name}</p>
                        <p className="text-xs text-slate-400 mt-1">{integration.description}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 text-xs rounded flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Ready
                      </span>
                      {integration.link && (
                        <a
                          href={integration.link}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded font-medium transition-colors flex items-center gap-1"
                        >
                          {integration.action} <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Coming Soon */}
        {comingSoonCount > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wide">Coming Soon (Phase 5+)</h3>
            <div className="space-y-2">
              {integrations
                .filter((i) => i.status === 'coming_soon')
                .map((integration) => (
                  <div
                    key={integration.id}
                    className="bg-slate-800/40 border border-slate-700/30 rounded-lg p-4 flex items-start justify-between opacity-75"
                  >
                    <div className="flex gap-3 flex-1">
                      <div className="text-2xl">{integration.icon}</div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-300">{integration.name}</p>
                        <p className="text-xs text-slate-500 mt-1">{integration.description}</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-slate-700/30 text-slate-400 text-xs rounded whitespace-nowrap ml-4">
                      Coming Soon
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <p className="text-sm text-blue-200">
          💡 <strong>Integration Benefits:</strong> Connect data sources to automatically populate your ROAS models, power
          chatbot recommendations, and feed the knowledge base with real performance insights.
        </p>
      </div>
    </div>
  );
}
