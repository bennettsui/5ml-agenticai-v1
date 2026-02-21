'use client';

import React, { useState } from 'react';
import { Plus, ArrowRight, Clock, MapPin, Calendar } from 'lucide-react';
import { BirthData } from '@/types/ziwei';

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

/**
 * GenerationPanel Component — Visitor Management System
 * Part 1: Visitor list + Create button
 * Part 2: Form modal for new visitor input
 * Part 3: Progress bar on generation
 */
export const GenerationPanel: React.FC<GenerationPanelProps> = ({
  onGenerate,
  isLoading = false,
}) => {
  // ================================================================
  // STATE
  // ================================================================
  const [visitors, setVisitors] = useState<Visitor[]>([
    {
      id: '1',
      name: 'Bennett Sui',
      birthData: {
        yearGregorian: 1984,
        monthLunar: 12,
        dayLunar: 3,
        hour: 21,
        location: 'Hong Kong',
        gender: 'M',
        name: 'Bennett',
      },
      createdAt: '2026-02-20 14:32',
    },
    {
      id: '2',
      name: 'Sample User 2',
      birthData: {
        yearGregorian: 1986,
        monthLunar: 12,
        dayLunar: 17,
        hour: 17,
        location: 'Hong Kong',
        gender: 'M',
        name: 'Sample User 2',
      },
      createdAt: '2026-02-19 10:15',
    },
    {
      id: '3',
      name: 'Sample User 3',
      birthData: {
        yearGregorian: 1989,
        monthLunar: 12,
        dayLunar: 2,
        hour: 12,
        location: 'Hong Kong',
        gender: 'F',
        name: 'Sample User 3',
      },
      createdAt: '2026-02-18 16:42',
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<BirthData>({
    yearGregorian: new Date().getFullYear(),
    monthLunar: 1,
    dayLunar: 1,
    hour: 12,
    location: '',
    gender: 'M',
    name: '',
  });

  // ================================================================
  // HANDLERS
  // ================================================================
  const handleCreateNew = () => {
    setFormData({
      yearGregorian: new Date().getFullYear(),
      monthLunar: 1,
      dayLunar: 1,
      hour: 12,
      location: '',
      gender: 'M',
      name: '',
    });
    setShowForm(true);
  };

  const handleAddVisitor = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Please enter a name');
      return;
    }

    const newVisitor: Visitor = {
      id: Date.now().toString(),
      name: formData.name,
      birthData: formData,
      createdAt: new Date().toLocaleString('zh-HK', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    };

    setVisitors((prev) => [newVisitor, ...prev]);
    setShowForm(false);

    // Trigger generation
    onGenerate?.(formData);
  };

  const handleSelectVisitor = (visitor: Visitor) => {
    onGenerate?.(visitor.birthData);
  };

  const handleDeleteVisitor = (id: string) => {
    setVisitors((prev) => prev.filter((v) => v.id !== id));
  };

  // ================================================================
  // RENDER: LIST VIEW (default)
  // ================================================================
  if (!showForm) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        {/* HEADER */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">命盤排列系統</h2>
          <p className="text-slate-400 text-sm">
            選擇或建立新的訪客記錄，生成紫微斗數命盤
          </p>
        </div>

        {/* CREATE NEW BUTTON */}
        <button
          onClick={handleCreateNew}
          disabled={isLoading}
          className="w-full mb-6 px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          新建訪客記錄
        </button>

        {/* VISITOR LIST */}
        <div className="space-y-3">
          {visitors.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/30 rounded-lg border border-slate-700/50">
              <p className="text-slate-400 text-sm">沒有訪客記錄</p>
            </div>
          ) : (
            visitors.map((visitor) => (
              <VisitorCard
                key={visitor.id}
                visitor={visitor}
                isLoading={isLoading}
                onSelect={handleSelectVisitor}
                onDelete={handleDeleteVisitor}
              />
            ))
          )}
        </div>

        {/* PROGRESS INDICATOR */}
        {isLoading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 rounded-lg">
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-8 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="inline-block mb-4">
                  <div className="w-12 h-12 rounded-full border-4 border-slate-700 border-t-amber-500 animate-spin" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">排盤中...</h3>
                <p className="text-slate-400 text-sm">正在計算命盤及分析結果</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ================================================================
  // RENDER: FORM VIEW
  // ================================================================
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-slate-800/50 rounded-lg p-8 border border-slate-700/50">
        <h2 className="text-2xl font-bold text-white mb-6">新建訪客記錄</h2>

        <form onSubmit={handleAddVisitor} className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              姓名
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="請輸入姓名"
              autoFocus
              className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Birth Date */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              農曆出生日期
            </label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">年份</label>
                <input
                  type="number"
                  value={formData.yearGregorian}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      yearGregorian: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">月</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={formData.monthLunar}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      monthLunar: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">日</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={formData.dayLunar}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dayLunar: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Hour */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              出生時辰
            </label>
            <select
              value={formData.hour}
              onChange={(e) =>
                setFormData({ ...formData, hour: parseInt(e.target.value) })
              }
              className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:border-amber-500 focus:outline-none"
            >
              {Array.from({ length: 24 }).map((_, i) => (
                <option key={i} value={i}>
                  {String(i).padStart(2, '0')}:00 - {String(i + 1).padStart(2, '0')}:00
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              出生地點
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder="e.g. 香港、台北"
              className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              性別
            </label>
            <div className="flex gap-4">
              {[
                { value: 'M', label: '男' },
                { value: 'F', label: '女' },
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="gender"
                    value={option.value}
                    checked={formData.gender === option.value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        gender: e.target.value as 'M' | 'F',
                      })
                    }
                    className="w-4 h-4 accent-amber-500"
                  />
                  <span className="text-sm text-slate-300">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-lg transition-colors"
            >
              返回
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-amber-600/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? '生成中...' : '生成排盤'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ================================================================
// VISITOR CARD COMPONENT
// ================================================================
interface VisitorCardProps {
  visitor: Visitor;
  isLoading: boolean;
  onSelect: (visitor: Visitor) => void;
  onDelete: (id: string) => void;
}

const VisitorCard: React.FC<VisitorCardProps> = ({
  visitor,
  isLoading,
  onSelect,
  onDelete,
}) => {
  const { birthData, createdAt } = visitor;

  // Format date display
  const dateDisplay = `${birthData.yearGregorian}年${String(birthData.monthLunar).padStart(2, '0')}月${String(birthData.dayLunar).padStart(2, '0')}日`;
  const hourDisplay = `${String(birthData.hour).padStart(2, '0')}:00`;

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 hover:border-amber-500/30 transition-all group cursor-pointer">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/20 border border-amber-500/20 flex items-center justify-center">
          <span className="text-amber-400 font-bold text-lg">
            {visitor.name.charAt(0)}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-white group-hover:text-amber-400 transition-colors truncate">
            {visitor.name}
          </h3>
          <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{dateDisplay}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{hourDisplay}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{birthData.location || '—'}</span>
            </div>
            <div className="text-slate-500">{createdAt}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => onSelect(visitor)}
            disabled={isLoading}
            className="px-3 py-2 bg-amber-600/80 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-medium rounded transition-colors"
            title="生成排盤"
          >
            生成
          </button>
          <button
            onClick={() => onDelete(visitor.id)}
            disabled={isLoading}
            className="px-3 py-2 bg-slate-700/50 hover:bg-slate-700 disabled:opacity-50 text-slate-400 hover:text-red-400 text-xs font-medium rounded transition-colors"
            title="刪除"
          >
            刪除
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenerationPanel;
