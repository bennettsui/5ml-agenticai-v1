'use client';

import { CheckCircle, Clock, Zap } from 'lucide-react';

interface AssetType {
  name: string;
  description: string;
  status: 'available' | 'coming_soon';
  phase?: string;
  examples?: string[];
}

const assetTypes: AssetType[] = [
  // Available Now
  {
    name: 'Copy Assets',
    description: 'Ad copy, landing page copy, email templates',
    status: 'available',
    examples: ['Headlines', 'Body copy', 'CTAs', 'Email sequences'],
  },
  {
    name: 'Social Content',
    description: 'LinkedIn posts, Twitter threads, Instagram captions',
    status: 'available',
    examples: ['Social posts', 'Carousel decks', 'Video scripts', 'Reels briefs'],
  },

  // Coming Soon - Phase 5
  {
    name: 'GDN Banner Assets',
    description: 'Google Display Network creatives and banner designs',
    status: 'coming_soon',
    phase: '5',
    examples: ['300x250 banners', '728x90 leaderboards', 'Responsive display ads'],
  },
  {
    name: 'SEM Creative',
    description: 'Search engine marketing ad variations',
    status: 'coming_soon',
    phase: '5',
    examples: ['Search ad headlines', 'Description lines', 'Landing page variants'],
  },
  {
    name: 'Facebook & Instagram Creatives',
    description: 'Image ads, video ads, carousel ads, collection ads',
    status: 'coming_soon',
    phase: '5',
    examples: ['Static images', 'Video ads', 'Carousel rotations', 'Collection templates'],
  },
  {
    name: 'TikTok & YouTube Creatives',
    description: 'Platform-native short and long-form video content',
    status: 'coming_soon',
    phase: '5',
    examples: ['TikTok scripts', 'YouTube thumbnails', 'Video hooks', 'Trend briefs'],
  },
  {
    name: 'Lead Magnet Assets',
    description: 'Ebooks, whitepapers, webinar landing pages',
    status: 'coming_soon',
    phase: '5',
    examples: ['PDF templates', 'Webinar decks', 'Resource pages', 'Gated content'],
  },
  {
    name: 'Landing Page Templates',
    description: 'Full landing page layouts optimized for conversion',
    status: 'coming_soon',
    phase: '5',
    examples: ['SaaS pages', 'E-commerce', 'Lead capture', 'Product showcase'],
  },
];

export function AssetRoadmap() {
  const availableAssets = assetTypes.filter((a) => a.status === 'available');
  const comingSoonAssets = assetTypes.filter((a) => a.status === 'coming_soon');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Asset Generation Roadmap</h2>
        <p className="text-sm text-slate-400 mb-6">
          5ML's agentic asset generation system supports multiple content types. Available now or coming in Phase 5+.
        </p>
      </div>

      {/* Available Assets */}
      {availableAssets.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-semibold text-emerald-300 uppercase tracking-wide">Available Now</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {availableAssets.map((asset) => (
              <div
                key={asset.name}
                className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4"
              >
                <p className="text-sm font-semibold text-emerald-300 mb-1">{asset.name}</p>
                <p className="text-xs text-slate-300 mb-2">{asset.description}</p>
                {asset.examples && (
                  <div className="flex flex-wrap gap-1">
                    {asset.examples.map((ex) => (
                      <span key={ex} className="px-2 py-0.5 bg-emerald-600/30 text-emerald-200 text-xs rounded">
                        {ex}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coming Soon Assets */}
      {comingSoonAssets.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-yellow-400" />
            <h3 className="text-sm font-semibold text-yellow-300 uppercase tracking-wide">
              Coming in Phase 5 (Media Buy Assets)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            Dedicated asset generation for paid advertising channels - launching as focused use cases
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {comingSoonAssets.map((asset) => (
              <div
                key={asset.name}
                className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4 opacity-75"
              >
                <p className="text-sm font-semibold text-slate-300 mb-1 flex items-center gap-2">
                  {asset.name}
                  <span className="px-1.5 py-0.5 bg-yellow-600/30 text-yellow-200 text-xs rounded">Phase {asset.phase}</span>
                </p>
                <p className="text-xs text-slate-400 mb-2">{asset.description}</p>
                {asset.examples && (
                  <div className="flex flex-wrap gap-1">
                    {asset.examples.map((ex) => (
                      <span key={ex} className="px-2 py-0.5 bg-slate-700/30 text-slate-400 text-xs rounded">
                        {ex}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strategy Box */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <div className="flex gap-3">
          <Zap className="w-5 h-5 text-blue-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-200 mb-1">Smart Asset Generation Strategy</p>
            <p className="text-xs text-blue-100">
              Available asset types use general-purpose agents (Copy, Social). Media buy assets (GDN, SEM, Facebook, TikTok,
              YouTube) will launch as specialized use cases optimized for each platform's unique requirements and formats.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
