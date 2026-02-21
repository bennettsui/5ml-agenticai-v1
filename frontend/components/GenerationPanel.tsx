'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Clock, MapPin, Calendar, User, Trash2, Sparkles, RefreshCw } from 'lucide-react';

// ── Purple theme tokens ──────────────────────────────────────────────────────
const P = {
  cardBg:     'bg-purple-950/30',
  cardBorder: 'border-purple-800/30',
  inputBg:    'bg-purple-950/50 border border-purple-800/40 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none',
  activeItem: 'bg-purple-700/40 border-purple-600/50 text-white',
  hoverItem:  'border-transparent text-slate-300 hover:bg-purple-950/60 hover:text-white',
  primaryBtn: 'bg-purple-700 hover:bg-purple-600 text-white',
  accentText: 'text-purple-300',
  iconBg:     'bg-purple-500/20 border-purple-500/30',
  iconColor:  'text-purple-300',
};

// ── Chinese calendar helpers ──────────────────────────────────────────────────
const STEMS   = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const getYearStem   = (y: number) => STEMS[((y - 4) % 10 + 10) % 10];
const getYearBranch = (y: number) => BRANCHES[((y - 4) % 12 + 12) % 12];

const HOUR_BRANCHES = [
  { value: '子', label: '子時 (23:00–01:00)' },
  { value: '丑', label: '丑時 (01:00–03:00)' },
  { value: '寅', label: '寅時 (03:00–05:00)' },
  { value: '卯', label: '卯時 (05:00–07:00)' },
  { value: '辰', label: '辰時 (07:00–09:00)' },
  { value: '巳', label: '巳時 (09:00–11:00)' },
  { value: '午', label: '午時 (11:00–13:00)' },
  { value: '未', label: '未時 (13:00–15:00)' },
  { value: '申', label: '申時 (15:00–17:00)' },
  { value: '酉', label: '酉時 (17:00–19:00)' },
  { value: '戌', label: '戌時 (19:00–21:00)' },
  { value: '亥', label: '亥時 (21:00–23:00)' },
];

// ── Types ─────────────────────────────────────────────────────────────────────
type CalendarType = 'lunar' | 'gregorian';

interface FormState {
  name: string;
  gender: 'M' | 'F';
  year: number;
  month: number;
  day: number;
  hourBranch: string;
  location: string;
  calendarType: CalendarType;
}

interface Visitor {
  id: string;
  name: string;
  form: FormState;
  createdAt: string;
}

interface GenerationPanelProps {
  onGenerate?: () => void;
}

const EMPTY_FORM: FormState = {
  name: '',
  gender: 'M',
  year: new Date().getFullYear(),
  month: 1,
  day: 1,
  hourBranch: '午',
  location: '',
  calendarType: 'lunar',
};

// ── Component ─────────────────────────────────────────────────────────────────
export const GenerationPanel: React.FC<GenerationPanelProps> = ({ onGenerate }) => {
  const [visitors, setVisitors]         = useState<Visitor[]>([]);
  const [selectedId, setSelectedId]     = useState<string | null>(null);
  const [isCreating, setIsCreating]     = useState(false);
  const [formData, setFormData]         = useState<FormState>(EMPTY_FORM);
  const [isLoading, setIsLoading]       = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [error, setError]               = useState<string | null>(null);

  useEffect(() => { loadCharts(); }, []);

  // ── Load charts from DB ──────────────────────────────────────────────────
  const loadCharts = async () => {
    setIsLoadingList(true);
    try {
      const res  = await fetch('/api/ziwei/charts');
      const data = await res.json();
      if (data.charts) {
        setVisitors(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data.charts.map((c: any) => ({
            id:   c.id.toString(),
            name: c.name,
            form: {
              name:         c.name,
              gender:       (['M','F'].includes(c.birth_info?.gender) ? c.birth_info.gender : 'M') as 'M' | 'F',
              year:         c.birth_info?.lunarYear  ?? new Date().getFullYear(),
              month:        c.birth_info?.lunarMonth ?? 1,
              day:          c.birth_info?.lunarDay   ?? 1,
              hourBranch:   BRANCHES.includes(c.birth_info?.hourBranch) ? c.birth_info.hourBranch : '午',
              location:     c.birth_info?.placeOfBirth ?? '',
              calendarType: (c.birth_info?.calendarType === 'gregorian' ? 'gregorian' : 'lunar') as CalendarType,
            },
            createdAt: c.created_at,
          }))
        );
      }
    } catch (err) {
      console.error('Failed to load charts', err);
    } finally {
      setIsLoadingList(false);
    }
  };

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSelectVisitor = (v: Visitor) => {
    setSelectedId(v.id);
    setIsCreating(false);
    setFormData(v.form);
    setError(null);
  };

  const handleNewVisitor = () => {
    setSelectedId(null);
    setIsCreating(true);
    setFormData(EMPTY_FORM);
    setError(null);
  };

  const handleSaveAndGenerate = async () => {
    if (!formData.name.trim()) { setError('Name is required'); return; }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ziwei/calculate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lunarYear:    formData.year,
          lunarMonth:   formData.month,
          lunarDay:     formData.day,
          hourBranch:   formData.hourBranch,
          yearStem:     getYearStem(formData.year),
          yearBranch:   getYearBranch(formData.year),
          gender:       formData.gender,
          name:         formData.name.trim(),
          placeOfBirth: formData.location,
          calendarType: formData.calendarType,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const detail = data.details?.[0]?.message || data.error || 'Generation failed';
        setError(detail);
        return;
      }
      await loadCharts();
      onGenerate?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteVisitor = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setVisitors(prev => prev.filter(v => v.id !== id));
    if (selectedId === id) { setSelectedId(null); setIsCreating(false); }
  };

  const selectedVisitor = visitors.find(v => v.id === selectedId);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex gap-5 h-[calc(100vh-180px)] min-h-[600px]">

      {/* ================================================================ */}
      {/* LEFT PANEL — Visitor list                                        */}
      {/* ================================================================ */}
      <div className={`w-72 flex-shrink-0 flex flex-col rounded-2xl border ${P.cardBorder} ${P.cardBg} overflow-hidden`}>

        <div className="p-4 border-b border-purple-900/40">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">命盤記錄</h3>
            <button
              onClick={loadCharts}
              disabled={isLoadingList}
              title="Refresh"
              className="p-1 rounded hover:bg-purple-900/40 text-slate-500 hover:text-purple-400 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingList ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <button
            onClick={handleNewVisitor}
            className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${P.primaryBtn}`}
          >
            <Plus className="w-4 h-4" /> New Chart
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {/* "New" placeholder item */}
          {isCreating && (
            <div className={`flex items-center gap-3 p-3 rounded-xl border ${P.activeItem}`}>
              <div className={`w-9 h-9 rounded-lg ${P.iconBg} border flex items-center justify-center flex-shrink-0`}>
                <Plus className={`w-4 h-4 ${P.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-purple-200">New Visitor</div>
                <div className="text-xs text-slate-500">Fill in the form →</div>
              </div>
            </div>
          )}

          {visitors.length === 0 && !isCreating && (
            <div className="text-center py-8 text-slate-500 text-xs">
              <Sparkles className="w-6 h-6 mx-auto mb-2 text-purple-700" />
              {isLoadingList ? 'Loading…' : 'No charts yet'}
            </div>
          )}

          {visitors.map((visitor) => {
            const isActive = selectedId === visitor.id && !isCreating;
            return (
              <div
                key={visitor.id}
                onClick={() => handleSelectVisitor(visitor)}
                className={`group flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  isActive ? P.activeItem : P.hoverItem
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-sm ${
                  isActive ? 'bg-purple-600/40 text-purple-100' : 'bg-purple-900/30 text-purple-400'
                }`}>
                  {visitor.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>
                    {visitor.name}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {visitor.form.year} {getYearStem(visitor.form.year)}{getYearBranch(visitor.form.year)} · {visitor.form.location || '—'}
                  </div>
                </div>
                <button
                  onClick={(e) => handleDeleteVisitor(visitor.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all flex-shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================================================================ */}
      {/* RIGHT PANEL — Form                                               */}
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

        {/* Form (new or existing) */}
        {(isCreating || selectedId) && (
          <div className={`flex-1 flex flex-col rounded-2xl border ${P.cardBorder} ${P.cardBg} overflow-hidden`}>

            {/* Header */}
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
                    {isCreating ? 'Enter birth data to generate chart' : 'Edit details and regenerate chart'}
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="space-y-5 max-w-xl">

                {/* ── Calendar type toggle ─────────────────────────── */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">曆法 Calendar Type</label>
                  <div className="flex gap-2">
                    {([
                      { v: 'lunar',     l: '農曆 Lunar' },
                      { v: 'gregorian', l: '西曆 Gregorian' },
                    ] as const).map(opt => (
                      <button
                        key={opt.v}
                        onClick={() => setFormData(f => ({ ...f, calendarType: opt.v }))}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          formData.calendarType === opt.v
                            ? 'bg-purple-700/60 text-white border border-purple-600/50'
                            : 'border border-purple-900/40 text-slate-400 hover:text-purple-300 hover:border-purple-700/40'
                        }`}
                      >
                        {opt.l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Name + Gender ────────────────────────────────── */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">姓名 Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                      placeholder="Enter name"
                      className={`w-full px-3 py-2.5 rounded-xl text-sm ${P.inputBg}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">性別 Gender</label>
                    <div className="flex gap-4 pt-2">
                      {([{ v: 'M', l: '男 Male' }, { v: 'F', l: '女 Female' }] as const).map(opt => (
                        <label key={opt.v} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="gender"
                            value={opt.v}
                            checked={formData.gender === opt.v}
                            onChange={() => setFormData(f => ({ ...f, gender: opt.v }))}
                            className="w-4 h-4 accent-purple-500"
                          />
                          <span className="text-sm text-slate-300">{opt.l}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── Year / Month / Day ───────────────────────────── */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">
                      <Calendar className="inline w-3.5 h-3.5 mr-1" />
                      年 Year {formData.calendarType === 'lunar' ? '(農曆)' : '(西曆)'}
                    </label>
                    <input
                      type="number"
                      value={formData.year}
                      onChange={e => setFormData(f => ({ ...f, year: parseInt(e.target.value) || f.year }))}
                      min="1900" max="2100"
                      className={`w-full px-3 py-2.5 rounded-xl text-sm ${P.inputBg}`}
                    />
                    {formData.year >= 1900 && formData.year <= 2100 && (
                      <div className={`text-xs ${P.accentText} mt-1`}>
                        {getYearStem(formData.year)}{getYearBranch(formData.year)} 年
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">
                      月 Month {formData.calendarType === 'lunar' ? '(農)' : '(西)'}
                    </label>
                    <select
                      value={formData.month}
                      onChange={e => setFormData(f => ({ ...f, month: parseInt(e.target.value) }))}
                      className={`w-full px-3 py-2.5 rounded-xl text-sm ${P.inputBg}`}
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1} 月</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">
                      日 Day {formData.calendarType === 'lunar' ? '(農)' : '(西)'}
                    </label>
                    <select
                      value={formData.day}
                      onChange={e => setFormData(f => ({ ...f, day: parseInt(e.target.value) }))}
                      className={`w-full px-3 py-2.5 rounded-xl text-sm ${P.inputBg}`}
                    >
                      {Array.from(
                        { length: formData.calendarType === 'lunar' ? 30 : 31 },
                        (_, i) => (
                          <option key={i + 1} value={i + 1}>{i + 1} 日</option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                {/* ── Hour branch ──────────────────────────────────── */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">
                    <Clock className="inline w-3.5 h-3.5 mr-1" />時辰 Hour Branch
                  </label>
                  <select
                    value={formData.hourBranch}
                    onChange={e => setFormData(f => ({ ...f, hourBranch: e.target.value }))}
                    className={`w-full px-3 py-2.5 rounded-xl text-sm ${P.inputBg}`}
                  >
                    {HOUR_BRANCHES.map(h => (
                      <option key={h.value} value={h.value}>{h.label}</option>
                    ))}
                  </select>
                </div>

                {/* ── Location ─────────────────────────────────────── */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">
                    <MapPin className="inline w-3.5 h-3.5 mr-1" />出生地 Place of Birth
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={e => setFormData(f => ({ ...f, location: e.target.value }))}
                    placeholder="e.g. Hong Kong / 香港 / 台北"
                    className={`w-full px-3 py-2.5 rounded-xl text-sm ${P.inputBg}`}
                  />
                </div>

                {/* ── Error ────────────────────────────────────────── */}
                {error && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                    ⚠ {error}
                  </div>
                )}

              </div>
            </div>

            {/* Footer — single action button, no Cancel */}
            <div className="p-5 border-t border-purple-900/40">
              <button
                onClick={handleSaveAndGenerate}
                disabled={isLoading || !formData.name.trim()}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${P.primaryBtn}`}
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    排盤中…
                  </>
                ) : isCreating ? (
                  <>
                    <Sparkles className="w-4 h-4" />
                    儲存並生成排盤 Save &amp; Generate
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    更新並生成排盤 Update &amp; Generate
                  </>
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
