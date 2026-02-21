'use client';

import React, { useState } from 'react';
import { Plus, ArrowRight, Clock, MapPin, Calendar, User, Trash2, Sparkles, ChevronRight } from 'lucide-react';
import { BirthData } from '@/types/ziwei';

// ── Purple theme tokens ──────────────────────────────────────────────────────
const P = {
  cardBg:     'bg-purple-950/30',
  cardBorder: 'border-purple-800/30',
  inputBg:    'bg-purple-950/50 border border-purple-800/40 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none',
  activeItem: 'bg-purple-700/40 border-purple-600/50 text-white',
  hoverItem:  'border-transparent text-slate-300 hover:bg-purple-950/60 hover:text-white',
  primaryBtn: 'bg-purple-700 hover:bg-purple-600 text-white',
  ghostBtn:   'border border-purple-800/50 hover:border-purple-600/60 text-slate-300 hover:text-purple-200',
  accentText: 'text-purple-300',
  iconBg:     'bg-purple-500/20 border-purple-500/30',
  iconColor:  'text-purple-300',
};

// ── Types ────────────────────────────────────────────────────────────────────
interface Visitor {
  id: string;
  name: string;
  birthData: BirthData;
  createdAt: string;
}

interface GenerationPanelProps {
  onGenerate?: (birthData: BirthData) => void;
  isLoading?: boolean;
}

// ── Hour branch labels ───────────────────────────────────────────────────────
const HOUR_BRANCHES = [
  { value: 0,  label: '子時 (23:00–01:00)' },
  { value: 1,  label: '丑時 (01:00–03:00)' },
  { value: 2,  label: '寅時 (03:00–05:00)' },
  { value: 3,  label: '卯時 (05:00–07:00)' },
  { value: 4,  label: '辰時 (07:00–09:00)' },
  { value: 5,  label: '巳時 (09:00–11:00)' },
  { value: 6,  label: '午時 (11:00–13:00)' },
  { value: 7,  label: '未時 (13:00–15:00)' },
  { value: 8,  label: '申時 (15:00–17:00)' },
  { value: 9,  label: '酉時 (17:00–19:00)' },
  { value: 10, label: '戌時 (19:00–21:00)' },
  { value: 11, label: '亥時 (21:00–23:00)' },
];

const INITIAL_VISITORS: Visitor[] = [
  {
    id: '1',
    name: 'Bennett Sui',
    birthData: { yearGregorian: 1984, monthLunar: 12, dayLunar: 3, hour: 9, location: 'Hong Kong', gender: 'M', name: 'Bennett Sui' },
    createdAt: '2026-02-20 14:32',
  },
  {
    id: '2',
    name: 'Sample Visitor',
    birthData: { yearGregorian: 1986, monthLunar: 12, dayLunar: 17, hour: 5, location: 'Hong Kong', gender: 'M', name: 'Sample Visitor' },
    createdAt: '2026-02-19 10:15',
  },
  {
    id: '3',
    name: 'Sample Visitor 2',
    birthData: { yearGregorian: 1989, monthLunar: 12, dayLunar: 2, hour: 6, location: 'Taipei', gender: 'F', name: 'Sample Visitor 2' },
    createdAt: '2026-02-18 16:42',
  },
];

const EMPTY_FORM: BirthData = {
  yearGregorian: new Date().getFullYear(),
  monthLunar: 1,
  dayLunar: 1,
  hour: 6,
  location: '',
  gender: 'M',
  name: '',
};

// ── Component ────────────────────────────────────────────────────────────────
export const GenerationPanel: React.FC<GenerationPanelProps> = ({
  onGenerate,
  isLoading = false,
}) => {
  const [visitors, setVisitors] = useState<Visitor[]>(INITIAL_VISITORS);
  const [selectedId, setSelectedId] = useState<string | 'new' | null>(null);
  const [formData, setFormData] = useState<BirthData>(EMPTY_FORM);
  const [isCreating, setIsCreating] = useState(false);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSelectVisitor = (visitor: Visitor) => {
    setSelectedId(visitor.id);
    setIsCreating(false);
    setFormData(visitor.birthData);
  };

  const handleNewVisitor = () => {
    setSelectedId('new');
    setIsCreating(true);
    setFormData(EMPTY_FORM);
  };

  const handleGenerate = () => {
    if (!formData.name.trim()) return;
    if (isCreating) {
      // Save to visitor list
      const newVisitor: Visitor = {
        id: Date.now().toString(),
        name: formData.name,
        birthData: formData,
        createdAt: new Date().toLocaleString('zh-HK', {
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', hour12: false,
        }),
      };
      setVisitors(prev => [newVisitor, ...prev]);
      setSelectedId(newVisitor.id);
      setIsCreating(false);
    }
    onGenerate?.(formData);
  };

  const handleDeleteVisitor = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setVisitors(prev => prev.filter(v => v.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const selectedVisitor = visitors.find(v => v.id === selectedId);
  const hourLabel = HOUR_BRANCHES.find(h => h.value === formData.hour)?.label || '';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex gap-5 h-[calc(100vh-180px)] min-h-[600px]">

      {/* ================================================================ */}
      {/* LEFT PANEL — Visitor list                                        */}
      {/* ================================================================ */}
      <div className={`w-72 flex-shrink-0 flex flex-col rounded-2xl border ${P.cardBorder} ${P.cardBg} overflow-hidden`}>

        {/* List header */}
        <div className="p-4 border-b border-purple-900/40">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">命盤記錄</h3>
            <span className="text-xs text-slate-500">{visitors.length} charts</span>
          </div>
          <button
            onClick={handleNewVisitor}
            className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${P.primaryBtn}`}
          >
            <Plus className="w-4 h-4" />
            New Chart
          </button>
        </div>

        {/* Visitor list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {/* "New" item when creating */}
          {isCreating && (
            <div className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer ${P.activeItem}`}>
              <div className={`w-9 h-9 rounded-lg ${P.iconBg} border flex items-center justify-center flex-shrink-0`}>
                <Plus className={`w-4 h-4 ${P.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-purple-200">New Visitor</div>
                <div className="text-xs text-slate-500 truncate">Fill in the form →</div>
              </div>
            </div>
          )}

          {visitors.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              <Sparkles className="w-6 h-6 mx-auto mb-2 text-purple-600" />
              No charts yet
            </div>
          ) : (
            visitors.map((visitor) => {
              const isActive = selectedId === visitor.id && !isCreating;
              return (
                <div
                  key={visitor.id}
                  onClick={() => handleSelectVisitor(visitor)}
                  className={`group flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    isActive ? P.activeItem : P.hoverItem
                  }`}
                >
                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-sm ${
                    isActive ? 'bg-purple-600/40 text-purple-100' : 'bg-purple-900/30 text-purple-400'
                  }`}>
                    {visitor.name.charAt(0)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>
                      {visitor.name}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {visitor.birthData.yearGregorian} · {visitor.birthData.location || '—'}
                    </div>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={(e) => handleDeleteVisitor(visitor.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ================================================================ */}
      {/* RIGHT PANEL — Form / Visitor details                             */}
      {/* ================================================================ */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Nothing selected */}
        {!selectedId && !isCreating && (
          <div className={`flex-1 flex flex-col items-center justify-center rounded-2xl border ${P.cardBorder} ${P.cardBg}`}>
            <div className={`w-16 h-16 rounded-2xl ${P.iconBg} border flex items-center justify-center mb-4`}>
              <Sparkles className={`w-8 h-8 ${P.iconColor}`} />
            </div>
            <h3 className="text-white font-semibold mb-2">紫微斗數 命盤排列</h3>
            <p className="text-slate-400 text-sm text-center max-w-xs mb-6">
              Select an existing visitor from the left, or create a new chart
            </p>
            <button
              onClick={handleNewVisitor}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${P.primaryBtn}`}
            >
              <Plus className="w-4 h-4" /> New Chart
            </button>
          </div>
        )}

        {/* Form (new or editing) */}
        {(isCreating || selectedId) && (
          <div className={`flex-1 flex flex-col rounded-2xl border ${P.cardBorder} ${P.cardBg} overflow-hidden`}>
            {/* Right panel header */}
            <div className="p-5 border-b border-purple-900/40">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${P.iconBg} border flex items-center justify-center flex-shrink-0`}>
                  {isCreating
                    ? <Plus className={`w-5 h-5 ${P.iconColor}`} />
                    : <User className={`w-5 h-5 ${P.iconColor}`} />
                  }
                </div>
                <div>
                  <h3 className="font-semibold text-white">
                    {isCreating ? 'New Visitor' : selectedVisitor?.name || 'Visitor Details'}
                  </h3>
                  <p className="text-xs text-purple-400/60">
                    {isCreating ? 'Enter birth data to generate chart' : 'Birth data & chart generation'}
                  </p>
                </div>
              </div>
            </div>

            {/* Form body */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="space-y-5 max-w-xl">

                {/* Name + Gender */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">姓名 Name *</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter name"
                      className={`w-full px-3 py-2.5 rounded-xl text-sm ${P.inputBg}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">性別 Gender</label>
                    <div className="flex gap-3 pt-1">
                      {[{ v: 'M', l: '男 Male' }, { v: 'F', l: '女 Female' }].map(opt => (
                        <label key={opt.v} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="gender"
                            value={opt.v}
                            checked={formData.gender === opt.v}
                            onChange={e => setFormData({ ...formData, gender: e.target.value as 'M' | 'F' })}
                            className="w-4 h-4 accent-purple-500"
                          />
                          <span className="text-sm text-slate-300">{opt.l}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Birth year */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">
                      <Calendar className="inline w-3.5 h-3.5 mr-1" />年 Year (農曆)
                    </label>
                    <input
                      type="number"
                      value={formData.yearGregorian}
                      onChange={e => setFormData({ ...formData, yearGregorian: parseInt(e.target.value) })}
                      min="1900" max="2100"
                      className={`w-full px-3 py-2.5 rounded-xl text-sm ${P.inputBg}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">月 Month</label>
                    <select
                      value={formData.monthLunar}
                      onChange={e => setFormData({ ...formData, monthLunar: parseInt(e.target.value) })}
                      className={`w-full px-3 py-2.5 rounded-xl text-sm ${P.inputBg}`}
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}月</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">日 Day</label>
                    <select
                      value={formData.dayLunar}
                      onChange={e => setFormData({ ...formData, dayLunar: parseInt(e.target.value) })}
                      className={`w-full px-3 py-2.5 rounded-xl text-sm ${P.inputBg}`}
                    >
                      {Array.from({ length: 30 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}日</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Hour */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">
                    <Clock className="inline w-3.5 h-3.5 mr-1" />時辰 Hour Branch
                  </label>
                  <select
                    value={formData.hour}
                    onChange={e => setFormData({ ...formData, hour: parseInt(e.target.value) })}
                    className={`w-full px-3 py-2.5 rounded-xl text-sm ${P.inputBg}`}
                  >
                    {HOUR_BRANCHES.map(h => (
                      <option key={h.value} value={h.value}>{h.label}</option>
                    ))}
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">
                    <MapPin className="inline w-3.5 h-3.5 mr-1" />出生地 Place of Birth
                  </label>
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Hong Kong / 香港 / 台北"
                    className={`w-full px-3 py-2.5 rounded-xl text-sm ${P.inputBg}`}
                  />
                </div>

                {/* Summary card for existing visitors */}
                {!isCreating && selectedVisitor && (
                  <div className={`rounded-xl border ${P.cardBorder} bg-purple-900/10 p-4`}>
                    <h4 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wide">Birth Details</h4>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <div className="text-slate-500">Added</div>
                      <div className="text-slate-300">{selectedVisitor.createdAt}</div>
                      <div className="text-slate-500">Year</div>
                      <div className="text-slate-300">{selectedVisitor.birthData.yearGregorian}</div>
                      <div className="text-slate-500">Lunar Date</div>
                      <div className="text-slate-300">
                        {selectedVisitor.birthData.monthLunar}月{selectedVisitor.birthData.dayLunar}日
                      </div>
                      <div className="text-slate-500">Hour Branch</div>
                      <div className="text-slate-300">
                        {HOUR_BRANCHES.find(h => h.value === selectedVisitor.birthData.hour)?.label || '—'}
                      </div>
                      <div className="text-slate-500">Location</div>
                      <div className="text-slate-300">{selectedVisitor.birthData.location || '—'}</div>
                      <div className="text-slate-500">Gender</div>
                      <div className="text-slate-300">{selectedVisitor.birthData.gender === 'M' ? '男 Male' : '女 Female'}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer action */}
            <div className="p-5 border-t border-purple-900/40 flex gap-3">
              {isCreating && (
                <button
                  type="button"
                  onClick={() => { setIsCreating(false); setSelectedId(null); }}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${P.ghostBtn}`}
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleGenerate}
                disabled={isLoading || !formData.name?.trim()}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${P.primaryBtn}`}
              >
                {isLoading ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />排盤中...</>
                ) : (
                  <><Sparkles className="w-4 h-4" />生成排盤 Generate Chart</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerationPanel;
