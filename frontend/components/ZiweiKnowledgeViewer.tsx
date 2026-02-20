'use client';

import { useState, useEffect } from 'react';
import { Loader2, Book, Lightbulb, AlertCircle, CheckCircle } from 'lucide-react';

interface Palace {
  id: string;
  number: number;
  chinese: string;
  english: string;
  meaning: string;
  governs: string[];
  positive_indicators: string;
  negative_indicators: string;
}

interface Star {
  id: string;
  number: number;
  chinese: string;
  english: string;
  meaning: string;
  element: string;
  archetype: string;
  general_nature: string;
  key_traits: string[];
  palace_meanings: Record<string, { positive: string; negative: string }>;
}

export default function ZiweiKnowledgeViewer() {
  const [activeTab, setActiveTab] = useState<'palaces' | 'stars'>('palaces');
  const [palaces, setPalaces] = useState<Palace[]>([]);
  const [stars, setStars] = useState<Star[]>([]);
  const [selectedPalace, setSelectedPalace] = useState<Palace | null>(null);
  const [selectedStar, setSelectedStar] = useState<Star | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load palaces on mount
  useEffect(() => {
    loadPalaces();
  }, []);

  // Load stars when switching to stars tab
  useEffect(() => {
    if (activeTab === 'stars' && stars.length === 0) {
      loadStars();
    }
  }, [activeTab]);

  const loadPalaces = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ziwei/palaces');
      const data = await response.json();
      if (data.success) {
        setPalaces(data.palaces);
        setSelectedPalace(data.palaces[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load palaces');
    } finally {
      setLoading(false);
    }
  };

  const loadStars = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ziwei/stars');
      const data = await response.json();
      if (data.success) {
        setStars(data.stars);
        setSelectedStar(data.stars[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stars');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
          <Book className="w-5 h-5 text-amber-400" />
          Ziwei Knowledge Reference
        </h2>
        <p className="text-sm text-slate-400">Explore palace and star meanings, interpretations, and characteristics</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('palaces')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'palaces'
              ? 'bg-amber-600/80 text-white'
              : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
          }`}
        >
          🏯 Palaces (12)
        </button>
        <button
          onClick={() => setActiveTab('stars')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'stars'
              ? 'bg-amber-600/80 text-white'
              : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
          }`}
        >
          ⭐ Stars (14)
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="rounded-lg border border-slate-700/50 bg-slate-800/60 p-4 h-[600px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
            </div>
          ) : activeTab === 'palaces' ? (
            <div className="space-y-2">
              {palaces.map(palace => (
                <button
                  key={palace.id}
                  onClick={() => setSelectedPalace(palace)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedPalace?.id === palace.id
                      ? 'bg-amber-600/80 text-white'
                      : 'bg-slate-700/30 text-slate-300 hover:bg-slate-700/50'
                  }`}
                >
                  <div className="font-semibold text-sm">{palace.number}. {palace.chinese}</div>
                  <div className="text-xs text-slate-400">{palace.english}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {stars.map(star => (
                <button
                  key={star.id}
                  onClick={() => setSelectedStar(star)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedStar?.id === star.id
                      ? 'bg-amber-600/80 text-white'
                      : 'bg-slate-700/30 text-slate-300 hover:bg-slate-700/50'
                  }`}
                >
                  <div className="font-semibold text-sm">{star.number}. {star.chinese}</div>
                  <div className="text-xs text-slate-400">{star.english}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="lg:col-span-2 space-y-4">
          {activeTab === 'palaces' && selectedPalace && (
            <>
              {/* Palace Header */}
              <div className="rounded-lg border border-slate-700/50 bg-slate-800/60 p-6">
                <div className="mb-4">
                  <div className="text-3xl font-bold text-amber-400">{selectedPalace.chinese}</div>
                  <div className="text-xl text-white mt-1">{selectedPalace.english}</div>
                  <p className="text-sm text-slate-400 mt-3">{selectedPalace.meaning}</p>
                </div>
              </div>

              {/* What it Governs */}
              <div className="rounded-lg border border-slate-700/50 bg-slate-800/60 p-6">
                <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  Governs
                </h3>
                <ul className="space-y-2">
                  {selectedPalace.governs.map((item, idx) => (
                    <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                      <span className="text-amber-400 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Positive Indicators */}
              <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-6">
                <h3 className="font-bold text-green-400 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Positive Indicators
                </h3>
                <p className="text-sm text-slate-300">{selectedPalace.positive_indicators}</p>
              </div>

              {/* Negative Indicators */}
              <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-6">
                <h3 className="font-bold text-red-400 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Negative Indicators
                </h3>
                <p className="text-sm text-slate-300">{selectedPalace.negative_indicators}</p>
              </div>
            </>
          )}

          {activeTab === 'stars' && selectedStar && (
            <>
              {/* Star Header */}
              <div className="rounded-lg border border-slate-700/50 bg-slate-800/60 p-6">
                <div className="mb-4">
                  <div className="text-3xl font-bold text-amber-400">{selectedStar.chinese}</div>
                  <div className="text-xl text-white mt-1">{selectedStar.english}</div>
                  <p className="text-sm text-slate-400 mt-3">{selectedStar.meaning}</p>
                </div>

                {/* Quick Info */}
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-700/50">
                  <div>
                    <div className="text-xs text-slate-500">Element</div>
                    <div className="text-white font-semibold">{selectedStar.element}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Archetype</div>
                    <div className="text-white font-semibold text-sm">{selectedStar.archetype}</div>
                  </div>
                </div>
              </div>

              {/* General Nature */}
              <div className="rounded-lg border border-slate-700/50 bg-slate-800/60 p-6">
                <h3 className="font-bold text-white mb-3">General Nature</h3>
                <p className="text-sm text-slate-300">{selectedStar.general_nature}</p>
              </div>

              {/* Key Traits */}
              <div className="rounded-lg border border-slate-700/50 bg-slate-800/60 p-6">
                <h3 className="font-bold text-white mb-3">Key Traits</h3>
                <div className="grid grid-cols-2 gap-2">
                  {selectedStar.key_traits.map((trait, idx) => (
                    <div key={idx} className="text-sm text-slate-300 flex items-center gap-2">
                      <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                      {trait}
                    </div>
                  ))}
                </div>
              </div>

              {/* Palace Meanings Summary */}
              <div className="rounded-lg border border-slate-700/50 bg-slate-800/60 p-6">
                <h3 className="font-bold text-white mb-3">This Star in Different Palaces</h3>
                <p className="text-xs text-slate-400 mb-3">Select a palace to see this star's meaning in that context</p>
                <div className="text-xs text-slate-400">
                  Available meanings for {Object.keys(selectedStar.palace_meanings).length} palaces
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
