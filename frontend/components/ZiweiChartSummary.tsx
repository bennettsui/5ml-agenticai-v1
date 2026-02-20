'use client';

import { Calendar, User, MapPin, Clock, Zap } from 'lucide-react';

interface ChartSummaryProps {
  name: string;
  lunarYear: number;
  lunarMonth: number;
  lunarDay: number;
  hourBranch: string;
  gender: string;
  placeOfBirth?: string;
  gan_zhi?: {
    year: string;
    month: string;
    day: string;
    hour: string;
  };
  created_at?: string;
}

export default function ZiweiChartSummary({
  name,
  lunarYear,
  lunarMonth,
  lunarDay,
  hourBranch,
  gender,
  placeOfBirth,
  gan_zhi,
  created_at
}: ChartSummaryProps) {
  const age = new Date().getFullYear() - lunarYear;

  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-lg p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white">{name}</h3>
          <p className="text-amber-400/80 text-sm mt-1">
            {gender === '男' || gender === 'Male' ? '♂️ Male' : '♀️ Female'}
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-amber-400">{age}</div>
          <p className="text-xs text-slate-400">years old</p>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-slate-700/30"></div>

      {/* Birth Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Date */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-slate-400">
            <Calendar className="w-4 h-4 text-amber-400/60" />
            <span className="text-sm font-medium">Birth Date (Lunar)</span>
          </div>
          <div className="pl-6 text-white font-mono">
            {lunarYear}/{lunarMonth}/{lunarDay}
          </div>
        </div>

        {/* Hour */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-slate-400">
            <Clock className="w-4 h-4 text-amber-400/60" />
            <span className="text-sm font-medium">Hour of Birth</span>
          </div>
          <div className="pl-6 text-white font-mono">
            {hourBranch} Branch (時辰)
          </div>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-slate-400">
            <MapPin className="w-4 h-4 text-amber-400/60" />
            <span className="text-sm font-medium">Place of Birth</span>
          </div>
          <div className="pl-6 text-white">
            {placeOfBirth || 'Not specified'}
          </div>
        </div>

        {/* Gan Zhi (Heavenly Stems & Earthly Branches) */}
        {gan_zhi && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-400">
              <Zap className="w-4 h-4 text-amber-400/60" />
              <span className="text-sm font-medium">四柱 (Four Pillars)</span>
            </div>
            <div className="pl-6">
              <div className="text-xs text-slate-300 space-y-1">
                <div>
                  <span className="text-slate-500">Year: </span>
                  <span className="text-white font-mono">{gan_zhi.year}</span>
                </div>
                <div>
                  <span className="text-slate-500">Month: </span>
                  <span className="text-white font-mono">{gan_zhi.month}</span>
                </div>
                <div>
                  <span className="text-slate-500">Day: </span>
                  <span className="text-white font-mono">{gan_zhi.day}</span>
                </div>
                <div>
                  <span className="text-slate-500">Hour: </span>
                  <span className="text-white font-mono">{gan_zhi.hour}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Creation Date */}
      {created_at && (
        <div className="pt-4 border-t border-slate-700/30">
          <p className="text-xs text-slate-500">
            Created: {new Date(created_at).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}
