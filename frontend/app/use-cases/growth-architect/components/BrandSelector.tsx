'use client';

import { useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import { useGrowthArchitect } from '../context';

export function BrandSelector() {
  const { selectedBrand, setSelectedBrand, brands, currentPlan } = useGrowthArchitect();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [customBrand, setCustomBrand] = useState('');

  const selectedBrandObj = brands.find((b) => b.name === selectedBrand);

  const handleSelectBrand = (brandName: string) => {
    setSelectedBrand(brandName);
    setIsDropdownOpen(false);
  };

  const handleAddCustomBrand = () => {
    if (customBrand.trim() && !brands.find((b) => b.name === customBrand)) {
      const newBrand = {
        name: customBrand,
        brief: 'Custom product brief',
        icp: 'Define your ICP',
      };
      setSelectedBrand(customBrand);
      setCustomBrand('');
      setIsDropdownOpen(false);
    }
  };

  return (
    <div className="mb-8 bg-slate-800/60 border border-slate-700/50 rounded-lg p-6 space-y-4">
      {/* Brand Selector Dropdown */}
      <div className="relative">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
          Select Brand
        </label>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-white/[0.02] border border-slate-700/50 rounded-lg text-white hover:bg-white/[0.04] transition-colors"
        >
          <span className="font-medium text-sm">{selectedBrand}</span>
          <ChevronDown className="w-4 h-4 text-slate-500" />
        </button>

        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700/50 rounded-lg shadow-lg z-50">
            {brands.map((brand) => (
              <button
                key={brand.name}
                onClick={() => handleSelectBrand(brand.name)}
                className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-400 border-b border-slate-700/30 last:border-0 transition-colors"
              >
                {brand.name}
              </button>
            ))}
            <div className="p-3 border-t border-slate-700/30">
              <div className="flex gap-2">
                <input
                  value={customBrand}
                  onChange={(e) => setCustomBrand(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCustomBrand()}
                  placeholder="Add custom brand…"
                  className="flex-1 bg-white/[0.02] border border-slate-700/50 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600"
                />
                <button
                  onClick={handleAddCustomBrand}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Brand Info */}
      {selectedBrandObj && (
        <div className="space-y-3 pt-2 border-t border-slate-700/50">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Product Brief</p>
            <p className="text-sm text-slate-300 line-clamp-2">{selectedBrandObj.brief}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">ICP</p>
            <p className="text-sm text-slate-300 line-clamp-2">{selectedBrandObj.icp}</p>
          </div>
        </div>
      )}

      {/* Plan Status */}
      {currentPlan && (
        <div className="pt-2 border-t border-slate-700/50">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Latest Plan</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-300 font-medium">{currentPlan.status}</p>
              <p className="text-xs text-slate-500">Phase: {currentPlan.phase}</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400">
              {new Date(currentPlan.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
