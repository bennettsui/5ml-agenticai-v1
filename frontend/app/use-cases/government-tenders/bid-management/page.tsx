'use client';

import { Plus, FileText, CheckCircle2, AlertCircle, Upload, Send } from 'lucide-react';
import { useState } from 'react';

export default function BidManagement() {
  const [selectedBid, setSelectedBid] = useState<string | null>(null);

  const bids = [
    {
      id: 'bid-001',
      tenderRef: 'HK-IT-2024-001',
      title: 'Network Infrastructure Upgrade',
      status: 'drafting',
      progress: 60,
      dueDate: '2024-02-28',
      team: ['John Doe', 'Sarah Smith'],
      lastUpdated: '2024-02-15 14:30',
    },
    {
      id: 'bid-002',
      tenderRef: 'WA-FM-2024-002',
      title: 'Building Maintenance & Cleaning',
      status: 'review',
      progress: 85,
      dueDate: '2024-03-05',
      team: ['Mike Chen'],
      lastUpdated: '2024-02-14 10:15',
    },
    {
      id: 'bid-003',
      tenderRef: 'PHA-LEGAL-2024-003',
      title: 'Legal Advisory Services',
      status: 'submitted',
      progress: 100,
      dueDate: '2024-02-25',
      team: ['Alice Wong', 'Bob Lee'],
      lastUpdated: '2024-02-12 16:45',
    },
  ];

  const statusConfig = {
    drafting: { color: 'yellow', label: 'Drafting' },
    review: { color: 'blue', label: 'In Review' },
    submitted: { color: 'emerald', label: 'Submitted' },
    won: { color: 'green', label: 'Won' },
    lost: { color: 'red', label: 'Lost' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Bid Management</h1>
          <p className="text-slate-400">Create, track, and submit proposals</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors">
          <Plus className="w-4 h-4" /> New Bid
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bids List */}
        <div className="lg:col-span-2 space-y-3">
          {bids.map(bid => {
            const config = statusConfig[bid.status as keyof typeof statusConfig];
            return (
              <div
                key={bid.id}
                onClick={() => setSelectedBid(bid.id)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedBid === bid.id
                    ? 'border-indigo-500/50 bg-indigo-500/10'
                    : 'border-slate-700/50 bg-slate-800/60 hover:bg-white/[0.03]'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-slate-500">{bid.tenderRef}</span>
                      <span className={`text-xs px-2 py-0.5 rounded bg-${config.color}-500/20 text-${config.color}-400`}>
                        {config.label}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-white">{bid.title}</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-indigo-400">{bid.progress}%</div>
                    <p className="text-xs text-slate-500">Done</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400"
                    style={{ width: `${bid.progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <div className="flex gap-2">
                    <span>Due: {bid.dueDate}</span>
                    <span>|</span>
                    <span>{bid.team.length} team member{bid.team.length !== 1 ? 's' : ''}</span>
                  </div>
                  <span>Updated: {bid.lastUpdated}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bid Detail Panel */}
        <div className="space-y-4">
          {selectedBid ? (
            <>
              <div className="p-4 rounded-lg border border-slate-700/50 bg-slate-800/60">
                <h3 className="text-sm font-semibold text-white mb-4">Bid Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Tender Reference</label>
                    <input type="text" disabled className="w-full px-3 py-1.5 bg-slate-700/50 border border-slate-700/30 rounded text-xs text-slate-300" defaultValue={bids.find(b => b.id === selectedBid)?.tenderRef} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Team</label>
                    <div className="flex flex-wrap gap-1">
                      {bids.find(b => b.id === selectedBid)?.team.map(member => (
                        <span key={member} className="px-2 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded text-xs text-indigo-400">
                          {member}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-2 pt-4 border-t border-slate-700/30">
                    <button className="w-full flex items-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-700/50 rounded text-xs font-medium text-slate-300 transition-colors">
                      <FileText className="w-3 h-3" /> View Draft
                    </button>
                    <button className="w-full flex items-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-700/50 rounded text-xs font-medium text-slate-300 transition-colors">
                      <Upload className="w-3 h-3" /> Upload Docs
                    </button>
                    <button className="w-full flex items-center gap-2 px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded text-xs font-medium text-emerald-400 transition-colors">
                      <Send className="w-3 h-3" /> Submit Bid
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-slate-700/50 bg-slate-800/60">
                <h3 className="text-sm font-semibold text-white mb-3">Compliance Checklist</h3>
                <div className="space-y-2">
                  {['Financial info verified', 'Company documents attached', 'Declarations signed', 'All requirements met'].map((item, i) => (
                    <label key={i} className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer hover:text-slate-300">
                      <input type="checkbox" className="w-3 h-3 rounded" />
                      {item}
                    </label>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="p-6 rounded-lg border border-slate-700/50 bg-slate-800/60 text-center">
              <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Select a bid to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Coming Soon */}
      <div className="p-4 rounded-lg border border-slate-700/50 bg-slate-800/30">
        <p className="text-xs text-slate-400">
          ✨ AI-powered proposal generation, compliance checking, and win probability scoring coming soon!
        </p>
      </div>
    </div>
  );
}
