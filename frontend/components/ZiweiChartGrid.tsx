'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

// Matches the Python format_chart_output palace structure (snake_case)
interface PalaceData {
  palace_id:    number;
  palace_name:  string;
  branch:       string;
  stem:         string;
  stem_branch:  string;
  major_stars:  string[];
  transformations: Record<string, string>; // star_name → 化祿/化權/化科/化忌
}

interface ZiweiChartGridProps {
  houses:           PalaceData[];
  lifeHouseIndex:   number;
  personName:       string;
  birthDate:        string;
  hourBranch:       string;
  gender:           string;
  fiveElementBureau: string;
}

// Palace order display names (index 0-11 match Python's PALACE_NAMES order)
const PALACE_ORDER_NAMES = [
  '命宮','兄弟宮','夫妻宮','子女宮',
  '財帛宮','疾厄宮','遷移宮','僕役宮',
  '官祿宮','田宅宮','福德宮','父母宮',
];

// 4×4 grid layout: palace_id → {row, col}
const gridLayout: Record<number, { row: number; col: number }> = {
  11: { row: 0, col: 0 }, // 父母宮
  0:  { row: 0, col: 1 }, // 命宮 ← life palace
  1:  { row: 0, col: 2 }, // 兄弟宮
  2:  { row: 0, col: 3 }, // 夫妻宮
  10: { row: 1, col: 0 }, // 福德宮
  3:  { row: 1, col: 3 }, // 子女宮
  9:  { row: 2, col: 0 }, // 田宅宮
  4:  { row: 2, col: 3 }, // 財帛宮
  8:  { row: 3, col: 0 }, // 官祿宮
  7:  { row: 3, col: 1 }, // 僕役宮
  6:  { row: 3, col: 2 }, // 遷移宮
  5:  { row: 3, col: 3 }, // 疾厄宮
};

// ── Transformation label → colour ──────────────────────────────────────────
const HUA_COLORS: Record<string, string> = {
  '化祿': 'text-emerald-300 bg-emerald-900/30',
  '化權': 'text-amber-300  bg-amber-900/30',
  '化科': 'text-sky-300    bg-sky-900/30',
  '化忌': 'text-rose-300   bg-rose-900/30',
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
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Build 4×4 grid
  const grid: (PalaceData | null | 'center')[][] = Array(4)
    .fill(null)
    .map(() => Array(4).fill(null));

  Object.entries(gridLayout).forEach(([id, { row, col }]) => {
    const palace = houses.find(h => h.palace_id === parseInt(id));
    if (palace) grid[row][col] = palace;
  });

  // Fill 2×2 centre
  grid[1][1] = grid[1][2] = grid[2][1] = grid[2][2] = 'center';

  return (
    <div className="space-y-4">
      {/* ── Main grid ───────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-[#040c12] border border-teal-700/40 p-4 sm:p-6 overflow-auto shadow-xl shadow-black/40">
        <h3 className="text-xs font-semibold text-teal-400/70 mb-4 tracking-widest uppercase">
          命盤 · Birth Chart
        </h3>

        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {grid.map((row, ri) =>
            row.map((cell, ci) => {

              /* ── Centre cells ──────────────────────────────────────── */
              if (cell === 'center') {
                return (
                  <div
                    key={`c-${ri}-${ci}`}
                    className="aspect-square flex items-center justify-center rounded-xl bg-[#071420]/80 border border-teal-900/40"
                  >
                    <div className="text-center px-1">
                      {ri === 1 && ci === 1 && (
                        <>
                          <div className="text-xs font-bold text-cyan-300 leading-tight">{personName}</div>
                          <div className="text-[10px] text-slate-400 mt-1 leading-tight">{birthDate}</div>
                        </>
                      )}
                      {ri === 2 && ci === 1 && (
                        <>
                          <div className="text-[10px] text-slate-400 leading-tight">{hourBranch}時</div>
                          <div className="text-[10px] text-slate-400 leading-tight">{gender === 'M' ? '男' : gender === 'F' ? '女' : gender}</div>
                        </>
                      )}
                      {ri === 1 && ci === 2 && (
                        <div className="text-[10px] text-teal-400 leading-tight">五行</div>
                      )}
                      {ri === 2 && ci === 2 && (
                        <div className="text-[10px] text-teal-300 leading-tight font-medium">{fiveElementBureau}</div>
                      )}
                    </div>
                  </div>
                );
              }

              /* ── Empty cell ────────────────────────────────────────── */
              if (!cell) {
                return <div key={`e-${ri}-${ci}`} className="aspect-square" />;
              }

              /* ── Palace cell ───────────────────────────────────────── */
              const palace = cell as PalaceData;
              const stars   = palace.major_stars   || [];
              const hua     = palace.transformations || {};
              const huaKeys = Object.keys(hua);
              const isLife  = palace.palace_id === lifeHouseIndex;
              const isOpen  = expandedId === palace.palace_id;

              return (
                <div
                  key={`p-${palace.palace_id}`}
                  className={`aspect-square rounded-xl transition-all duration-200 relative cursor-pointer ${
                    isLife
                      ? 'bg-gradient-to-br from-cyan-950/70 to-teal-950/50 border border-cyan-600/60 shadow-lg shadow-cyan-900/30'
                      : 'bg-gradient-to-br from-slate-900/60 to-slate-950/40 border border-teal-900/40 hover:border-teal-700/50'
                  }`}
                  onClick={() => setExpandedId(isOpen ? null : palace.palace_id)}
                >
                  <div className="w-full h-full p-2 flex flex-col items-center justify-center text-center">
                    {/* Palace name */}
                    <div className={`text-xs font-bold leading-tight ${isLife ? 'text-cyan-200' : 'text-slate-100'}`}>
                      {palace.palace_name}
                    </div>

                    {/* Stem-branch */}
                    <div className={`text-[10px] mt-0.5 ${isLife ? 'text-teal-400/80' : 'text-slate-500'}`}>
                      {palace.stem_branch}
                    </div>

                    {/* Stars (max 2 shown) */}
                    {stars.length > 0 && (
                      <div className="mt-1.5 space-y-0.5">
                        {stars.slice(0, 2).map(star => (
                          <div key={star} className={`text-[10px] leading-tight ${isLife ? 'text-cyan-300' : 'text-sky-300'}`}>
                            {star}
                          </div>
                        ))}
                        {stars.length > 2 && (
                          <div className="text-[9px] text-slate-500">+{stars.length - 2}</div>
                        )}
                      </div>
                    )}

                    {/* 四化 badges */}
                    {huaKeys.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-0.5 mt-1">
                        {huaKeys.slice(0, 2).map(star => (
                          <span
                            key={star}
                            className={`text-[9px] px-1 py-0.5 rounded font-medium ${HUA_COLORS[hua[star]] ?? 'text-slate-400 bg-slate-800/40'}`}
                          >
                            {hua[star]}
                          </span>
                        ))}
                      </div>
                    )}

                    <ChevronDown className={`w-3 h-3 text-slate-600 mt-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </div>

                  {/* Expanded detail popup */}
                  {isOpen && (
                    <div
                      className="absolute top-full left-0 mt-1 z-50 w-52 bg-[#071420] border border-teal-700/50 rounded-xl p-3 shadow-2xl shadow-black/70 text-left text-xs space-y-2 backdrop-blur"
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="font-bold text-cyan-300">{palace.palace_name} · {palace.stem_branch}</div>
                      {stars.length > 0 ? (
                        <div>
                          <div className="text-slate-500 mb-1">Major Stars</div>
                          <div className="flex flex-wrap gap-1">
                            {stars.map(star => (
                              <span key={star} className="px-1.5 py-0.5 rounded bg-sky-900/40 text-sky-300 border border-sky-800/40">{star}</span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-600">No major stars</div>
                      )}
                      {huaKeys.length > 0 && (
                        <div>
                          <div className="text-slate-500 mb-1">四化 Transformations</div>
                          <div className="space-y-0.5">
                            {huaKeys.map(star => (
                              <div key={star} className="flex justify-between">
                                <span className="text-slate-300">{star}</span>
                                <span className={`font-medium ${(HUA_COLORS[hua[star]] ?? '').split(' ')[0]}`}>{hua[star]}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Legend ──────────────────────────────────────────────────────── */}
      <div className="rounded-xl bg-[#071420]/60 border border-teal-900/40 p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-br from-cyan-950/70 to-teal-950/50 border border-cyan-600/60 flex-shrink-0" />
            <span className="text-slate-400">Life Palace 命宮</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-br from-slate-900/60 to-slate-950/40 border border-teal-900/40 flex-shrink-0" />
            <span className="text-slate-500">Regular Palace</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sky-300 text-xs">★</span>
            <span className="text-slate-500">Major Star</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-300 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-900/30">化祿</span>
            <span className="text-amber-300  text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-900/30">化權</span>
            <span className="text-sky-300    text-[10px] font-semibold px-1.5 py-0.5 rounded bg-sky-900/30">化科</span>
            <span className="text-rose-300   text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-900/30">化忌</span>
          </div>
        </div>
      </div>
    </div>
  );
}
