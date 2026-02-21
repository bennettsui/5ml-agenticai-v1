'use client';

import React, { useState } from 'react';
import { BirthData } from '@/types/ziwei';

interface GenerationPanelProps {
  onGenerate?: (birthData: BirthData) => void;
  isLoading?: boolean;
}

/**
 * GenerationPanel Component
 * Form for generating new birth charts with history listing
 */
export const GenerationPanel: React.FC<GenerationPanelProps> = ({
  onGenerate,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<BirthData>({
    yearGregorian: 1984,
    monthLunar: 12,
    dayLunar: 3,
    hour: 21,
    location: 'Hong Kong',
    gender: 'M',
    name: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate?.(formData);
  };

  // Demo chart history
  const chartHistory = [
    {
      id: 1,
      name: '示例排盤 1',
      date: '甲子年 1984年12月3日 亥時',
      createdAt: '2026-02-20 14:32',
    },
    {
      id: 2,
      name: '示例排盤 2',
      date: '丙子年 1986年12月17日 酉時',
      createdAt: '2026-02-19 10:15',
    },
    {
      id: 3,
      name: '示例排盤 3',
      date: '己丑年 1989年12月2日 午時',
      createdAt: '2026-02-18 16:42',
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* GENERATION FORM */}
      <div className="lg:col-span-2">
        <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
          <h3 className="text-lg font-bold text-white mb-6">生成新排盤</h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm text-slate-300 mb-2">姓名</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter name"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Year, Month, Day */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-slate-300 mb-2">年份</label>
                <input
                  type="number"
                  value={formData.yearGregorian}
                  onChange={(e) =>
                    setFormData({ ...formData, yearGregorian: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 focus:border-amber-500 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">農曆月</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={formData.monthLunar}
                  onChange={(e) =>
                    setFormData({ ...formData, monthLunar: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 focus:border-amber-500 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">農曆日</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={formData.dayLunar}
                  onChange={(e) =>
                    setFormData({ ...formData, dayLunar: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 focus:border-amber-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Hour & Location */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-300 mb-2">出生時辰</label>
                <select
                  value={formData.hour}
                  onChange={(e) =>
                    setFormData({ ...formData, hour: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 focus:border-amber-500 focus:outline-none transition-colors"
                >
                  {Array.from({ length: 24 }).map((_, i) => (
                    <option key={i} value={i}>
                      {String(i).padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">地點</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="Hong Kong"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm text-slate-300 mb-2">性別</label>
              <div className="flex gap-4">
                {['M', 'F'].map((gender) => (
                  <label key={gender} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value={gender}
                      checked={formData.gender === gender}
                      onChange={(e) =>
                        setFormData({ ...formData, gender: e.target.value as 'M' | 'F' })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-slate-300">
                      {gender === 'M' ? '男' : '女'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-amber-600/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {isLoading ? '生成中...' : '生成排盤'}
            </button>
          </form>
        </div>
      </div>

      {/* CHART HISTORY */}
      <div>
        <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
          <h3 className="text-lg font-bold text-white mb-4">最近排盤</h3>
          <div className="space-y-2">
            {chartHistory.map((chart) => (
              <button
                key={chart.id}
                className="w-full text-left px-3 py-2 bg-slate-700/50 hover:bg-slate-700 rounded transition-colors group"
              >
                <div className="text-sm font-medium text-slate-200 group-hover:text-amber-400">
                  {chart.name}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{chart.date}</div>
                <div className="text-xs text-slate-600 mt-0.5">{chart.createdAt}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerationPanel;
