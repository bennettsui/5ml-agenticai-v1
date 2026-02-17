'use client';

import { useState } from 'react';
import { BookOpen, Search, Plus, Tag } from 'lucide-react';
import { useGrowthArchitect } from '../context';

export default function KBPage() {
  const { selectedBrand, currentPlan } = useGrowthArchitect();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [entries, setEntries] = useState<any[]>([]);

  const categories = [
    { id: 'all', label: 'All Entries', count: 0 },
    { id: 'icp', label: 'ICP Segments', count: 0 },
    { id: 'experiment', label: 'Experiments', count: 0 },
    { id: 'playbook', label: 'Playbooks', count: 0 },
    { id: 'performance', label: 'Performance', count: 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-purple-500" />
            Knowledge Base
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {selectedBrand} • Browse and manage growth insights
          </p>
        </div>
        <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Entry
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search knowledge base…"
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 text-sm"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat.id
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {cat.label} {cat.count > 0 && <span className="ml-2">({cat.count})</span>}
          </button>
        ))}
      </div>

      {/* Empty State */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-12 text-center">
        <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-300 font-medium mb-2">Knowledge Base is Empty</p>
        <p className="text-slate-500 text-sm mb-4">
          Generate a growth plan to automatically seed the knowledge base with insights
        </p>
        <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors">
          Seed Knowledge Base
        </button>
      </div>

      {/* Information Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-4 h-4 text-purple-400" />
            <p className="text-sm font-semibold text-slate-300">KB Features</p>
          </div>
          <ul className="space-y-2 text-sm text-slate-400">
            <li>• Vector embeddings for semantic search</li>
            <li>• Category-based organization</li>
            <li>• Auto-seed from plans</li>
            <li>• Full-text search</li>
          </ul>
        </div>

        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
          <p className="text-sm text-purple-200">
            💡 <strong>Tip:</strong> The KB automatically organizes insights into ICPs, experiments, playbooks, and performance data.
            It powers the chatbot and growth analysis.
          </p>
        </div>
      </div>
    </div>
  );
}
