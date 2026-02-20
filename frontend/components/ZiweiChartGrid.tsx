'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface PalaceData {
  name: string;
  branch: string;
  majorStars: string[];
  transformations: string[];
  index: number;
}

interface ZiweiChartGridProps {
  houses: PalaceData[];
  lifeHouseIndex: number;
  personName: string;
  birthDate: string;
  hourBranch: string;
  gender: string;
  fiveElementBureau: string;
}

// Logical palace order (index 0-11)
const houseOrder = [
  '命宮', '兄弟宮', '夫妻宮', '子女宮',
  '財帛宮', '疾厄宮', '遷移宮', '僕役宮',
  '官祿宮', '田宅宮', '福德宮', '父母宮'
];

// 4x4 grid layout mapping: {row, col} for each logical index
const gridLayout: Record<number, {row: number; col: number}> = {
  11: {row: 0, col: 0},  // 父母宮 (top-left)
  0:  {row: 0, col: 1},  // 命宮 (top-center-left) ← LIFE PALACE
  1:  {row: 0, col: 2},  // 兄弟宮 (top-center-right)
  2:  {row: 0, col: 3},  // 夫妻宮 (top-right)

  10: {row: 1, col: 0},  // 福德宮 (middle-left)
  // (1,1), (1,2) reserved for center
  3:  {row: 1, col: 3},  // 子女宮 (middle-right)

  9:  {row: 2, col: 0},  // 田宅宮 (lower-left)
  // (2,1), (2,2) reserved for center
  4:  {row: 2, col: 3},  // 財帛宮 (lower-right)

  8:  {row: 3, col: 0},  // 官祿宮 (bottom-left)
  7:  {row: 3, col: 1},  // 僕役宮 (bottom-center-left)
  6:  {row: 3, col: 2},  // 遷移宮 (bottom-center-right)
  5:  {row: 3, col: 3},  // 疾厄宮 (bottom-right)
};

export function ZiweiChartGrid({
  houses,
  lifeHouseIndex,
  personName,
  birthDate,
  hourBranch,
  gender,
  fiveElementBureau,
}: ZiweiChartGridProps) {
  const [expandedPalace, setExpandedPalace] = useState<number | null>(null);

  // Create 4x4 grid
  const grid: (PalaceData | null | 'center')[][] = Array(4)
    .fill(null)
    .map(() => Array(4).fill(null));

  // Place palaces in grid according to gridLayout
  Object.entries(gridLayout).forEach(([logicalIdx, {row, col}]) => {
    const idx = parseInt(logicalIdx);
    if (houses[idx]) {
      grid[row][col] = houses[idx];
    }
  });

  // Fill center (1,1), (1,2), (2,1), (2,2) with 'center' marker
  grid[1][1] = 'center';
  grid[1][2] = 'center';
  grid[2][1] = 'center';
  grid[2][2] = 'center';

  return (
    <div className="space-y-6">
      {/* Main Grid */}
      <div className="rounded-xl bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border border-slate-700/30 p-8 overflow-auto shadow-lg shadow-black/20">
        {/* Title */}
        <h3 className="text-sm font-semibold text-white mb-6">命盤 (4×4 Grid Layout)</h3>

        {/* 4x4 Grid Container */}
        <div className="grid gap-3" style={{gridTemplateColumns: 'repeat(4, 1fr)'}}>
          {grid.map((row, rowIdx) =>
            row.map((cell, colIdx) => {
              // Center cells
              if (cell === 'center') {
                return (
                  <div
                    key={`center-${rowIdx}-${colIdx}`}
                    className="aspect-square flex items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/30 shadow-md shadow-black/10 hover:shadow-lg hover:shadow-black/20 transition-all duration-300"
                  >
                    <div className="text-center">
                      {rowIdx === 1 && colIdx === 1 && (
                        <>
                          <div className="text-xs font-bold text-amber-300">{personName}</div>
                          <div className="text-xs text-slate-400 mt-1">{birthDate}</div>
                        </>
                      )}
                      {rowIdx === 2 && colIdx === 1 && (
                        <>
                          <div className="text-xs text-slate-400">{hourBranch}時</div>
                          <div className="text-xs text-slate-400">{gender}</div>
                        </>
                      )}
                      {rowIdx === 2 && colIdx === 2 && (
                        <div className="text-xs text-blue-400">五行: {fiveElementBureau}</div>
                      )}
                    </div>
                  </div>
                );
              }

              // Palace cells
              if (cell && cell !== 'center') {
                const palace = cell as PalaceData;
                const isLifePalace = palace.index === lifeHouseIndex;

                return (
                  <div
                    key={`palace-${palace.index}`}
                    className={`aspect-square rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden ${
                      isLifePalace
                        ? 'bg-gradient-to-br from-amber-900/40 to-amber-950/30 shadow-lg shadow-amber-900/20 hover:shadow-xl hover:shadow-amber-900/30'
                        : 'bg-gradient-to-br from-slate-700/30 to-slate-800/20 shadow-md shadow-black/10 hover:shadow-lg hover:shadow-slate-600/20'
                    }`}
                  >
                    {/* Palace content - expandable */}
                    <button
                      onClick={() => setExpandedPalace(expandedPalace === palace.index ? null : palace.index)}
                      className="w-full h-full p-3 flex flex-col items-center justify-center text-center hover:bg-white/[0.03] transition-colors duration-200"
                    >
                      {/* Palace Name */}
                      <div className={`text-xs font-bold ${isLifePalace ? 'text-amber-200' : 'text-slate-100'}`}>
                        {palace.name}
                      </div>

                      {/* Branch (Heavenly Stem) */}
                      <div className="text-xs text-slate-400 mt-1">{palace.branch}</div>

                      {/* Major Stars (up to 2) */}
                      {palace.majorStars.length > 0 && (
                        <div className="text-xs text-blue-300 mt-2 leading-tight">
                          {palace.majorStars.slice(0, 2).map((star) => (
                            <div key={star}>{star}</div>
                          ))}
                          {palace.majorStars.length > 2 && <div className="text-slate-500 text-xs mt-0.5">+{palace.majorStars.length - 2}</div>}
                        </div>
                      )}

                      {/* Transformations indicator */}
                      {palace.transformations.length > 0 && (
                        <div className="text-xs text-amber-300 mt-1.5 px-1.5 py-0.5 rounded-full bg-amber-900/30">四化</div>
                      )}

                      {/* Expand indicator */}
                      <ChevronDown
                        className={`w-3 h-3 text-slate-500 mt-2 transition-transform duration-200 ${
                          expandedPalace === palace.index ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {/* Expanded detail view */}
                    {expandedPalace === palace.index && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-gradient-to-br from-slate-900/95 to-slate-950/95 rounded-xl p-4 z-50 text-left text-xs space-y-2 w-56 shadow-xl shadow-black/50 border border-slate-700/30 backdrop-blur">
                        <div>
                          <span className="text-slate-500">All Stars:</span>
                          <div className="text-slate-300 mt-1">{palace.majorStars.join(', ') || 'None'}</div>
                        </div>
                        {palace.transformations.length > 0 && (
                          <div>
                            <span className="text-slate-500">四化:</span>
                            <div className="text-amber-300 mt-1">{palace.transformations.join(', ')}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              }

              // Empty cell
              return (
                <div key={`empty-${rowIdx}-${colIdx}`} className="aspect-square" />
              );
            })
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="rounded-xl bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/30 p-5 shadow-lg shadow-black/10">
        <h4 className="text-xs font-semibold text-slate-300 mb-4">Legend</h4>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-lg bg-gradient-to-br from-amber-900/40 to-amber-950/30 shadow-sm shadow-amber-900/20"></div>
            <span className="text-slate-300">Life Palace (命宮)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-lg bg-gradient-to-br from-slate-700/30 to-slate-800/20 shadow-sm shadow-black/10"></div>
            <span className="text-slate-400">Regular Palace</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-blue-300 text-xs">★ ★</span>
            <span className="text-slate-400">Major Stars</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-amber-300 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-900/30">四化</span>
            <span className="text-slate-400">Transformations</span>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="rounded-xl bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/30 p-5 shadow-lg shadow-black/10">
        <p className="text-xs text-slate-400 leading-relaxed">
          <strong className="text-slate-300">紫微斗數:</strong> The 12 palaces form the core of destiny analysis. Click any palace to see all stars and transformations in detail.
        </p>
      </div>
    </div>
  );
}
