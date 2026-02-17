'use client';

import { useState } from 'react';
import { FileText, Plus, Filter } from 'lucide-react';
import { useGrowthHackingStudio } from '../context';
import { AssetRoadmap } from '../components/AssetRoadmap';

export default function AssetsPage() {
  const { selectedBrand, currentPlan } = useGrowthHackingStudio();
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  const assetTypes = [
    { id: 'all', label: 'All Assets' },
    { id: 'copy', label: 'Ad Copy' },
    { id: 'email', label: 'Email' },
    { id: 'landing', label: 'Landing Pages' },
    { id: 'social', label: 'Social Content' },
    { id: 'video', label: 'Video Scripts' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <FileText className="w-8 h-8 text-amber-500" />
            Asset Library
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {selectedBrand} • Manage marketing assets and content
          </p>
        </div>
        <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Generate Asset
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {assetTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => setFilterType(type.id)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              filterType === type.id
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <Filter className="w-3 h-3" />
            {type.label}
          </button>
        ))}
      </div>

      {/* Empty State */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-12 text-center">
        <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-300 font-medium mb-2">No assets generated yet</p>
        <p className="text-slate-500 text-sm mb-4">
          Generate marketing assets from your growth plan to get started
        </p>
        <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors">
          Generate First Asset
        </button>
      </div>

      {/* Asset Roadmap */}
      <div className="mt-12 pt-8 border-t border-slate-700/50">
        <AssetRoadmap />
      </div>
    </div>
  );
}
