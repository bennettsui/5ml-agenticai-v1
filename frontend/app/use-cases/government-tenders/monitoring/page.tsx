'use client';

import { Search, Filter, Plus } from 'lucide-react';
import { useState } from 'react';

export default function TenderMonitoring() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = ['All', 'IT', 'Facilities', 'Legal', 'Engineering', 'HR', 'Finance'];

  const mockTenders = [
    {
      id: 1,
      refNo: 'HK-IT-2024-001',
      title: 'Network Infrastructure Upgrade',
      authority: 'Government IT Department',
      category: 'IT',
      posted: '2024-02-01',
      closing: '2024-02-28',
      budget: '2,500,000',
      status: 'Open',
    },
    {
      id: 2,
      refNo: 'WA-FM-2024-002',
      title: 'Building Maintenance & Cleaning',
      authority: 'Water Authority',
      category: 'Facilities',
      posted: '2024-02-05',
      closing: '2024-03-05',
      budget: '1,200,000',
      status: 'Open',
    },
    {
      id: 3,
      refNo: 'PHA-LEGAL-2024-003',
      title: 'Legal Advisory Services',
      authority: 'Public Housing Authority',
      category: 'Legal',
      posted: '2024-02-08',
      closing: '2024-02-25',
      budget: '800,000',
      status: 'Closing Soon',
    },
  ];

  const filteredTenders = mockTenders.filter(t =>
    (selectedCategory === 'all' || t.category === selectedCategory) &&
    (searchQuery === '' || t.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Tender Monitoring</h1>
        <p className="text-slate-400">Search and track government tender opportunities</p>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by title, reference, or authority..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
            />
          </div>
          <button className="px-4 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-colors flex items-center gap-2">
            <Filter className="w-4 h-4" /> More Filters
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat.toLowerCase())}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.toLowerCase()
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-slate-400">
        Showing {filteredTenders.length} tender{filteredTenders.length !== 1 ? 's' : ''}
      </div>

      {/* Tenders List */}
      <div className="space-y-3">
        {filteredTenders.length > 0 ? (
          filteredTenders.map(tender => (
            <div
              key={tender.id}
              className="p-4 rounded-lg border border-slate-700/50 bg-slate-800/60 hover:bg-white/[0.03] transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-slate-500">{tender.refNo}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      tender.status === 'Closing Soon'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {tender.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1">{tender.title}</h3>
                  <p className="text-xs text-slate-400">{tender.authority}</p>
                </div>
                <button className="px-3 py-1.5 bg-indigo-600/20 border border-indigo-500/30 rounded text-xs font-medium text-indigo-400 hover:bg-indigo-600/30 transition-colors">
                  Start Bid
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 text-xs text-slate-400 pt-3 border-t border-slate-700/30">
                <div>
                  <span className="text-slate-500">Posted:</span> {tender.posted}
                </div>
                <div>
                  <span className="text-slate-500">Closing:</span> {tender.closing}
                </div>
                <div>
                  <span className="text-slate-500">Budget:</span> HKD {tender.budget}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-400 mb-4">No tenders found matching your criteria</p>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Coming Soon Banner */}
      <div className="p-4 rounded-lg border border-slate-700/50 bg-slate-800/30">
        <p className="text-xs text-slate-400">
          🚀 Real-time tender scraping from eTender, gov.cn, and other official portals coming soon!
        </p>
      </div>
    </div>
  );
}
