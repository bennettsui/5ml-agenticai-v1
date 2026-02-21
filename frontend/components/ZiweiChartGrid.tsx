'use client';

import { useState } from 'react';

// Matches the Python format_chart_output palace structure (snake_case)
interface PalaceData {
  name: string;
  branch: string;
  majorStars: string[];
  minorStars?: string[];
  transformations: string[];
  index: number;
  lifeStageStars?: string[];
}

interface ZiweiChartGridProps {
  houses: PalaceData[];
  lifeHouseIndex: number;
  bodyHouseIndex?: number;
  personName: string;
  lunarDate: string;     // e.g. "農曆 庚午年 六月 十五日 午時"
  solarDate?: string;    // e.g. "1990年7月7日"
  gender: string;
  fiveElementBureau: number | string;   // 2/3/4/5/6 or label string
  lifeHouseStem?: string;   // 命宮天干 (from 五虎遁年法)
  lifeHouseBranch?: string; // 命宮地支
  ziweiLifeBranch?: string; // 紫微所在地支
  yearStemBranch?: string;  // e.g. "庚午"
}

// Standard 4×4 ZWDS grid layout: branch → {row, col}
// 寅 always at bottom-left, going counter-clockwise
const branchGridLayout: Record<string, { row: number; col: number }> = {
  // Top row (left to right)
  "巳": { row: 0, col: 0 },
  "午": { row: 0, col: 1 },
  "未": { row: 0, col: 2 },
  "申": { row: 0, col: 3 },
  // Left & right sides
  "辰": { row: 1, col: 0 },
  "酉": { row: 1, col: 3 },
  "卯": { row: 2, col: 0 },
  "戌": { row: 2, col: 3 },
  // Bottom row (left to right)
  "寅": { row: 3, col: 0 },
  "丑": { row: 3, col: 1 },
  "子": { row: 3, col: 2 },
  "亥": { row: 3, col: 3 },
};

const bureauLabel: Record<number, string> = {
  2: "水二局",
  3: "木三局",
  4: "金四局",
  5: "土五局",
  6: "火六局",
};

const bureauColor: Record<number, string> = {
  2: "text-blue-400",
  3: "text-green-400",
  4: "text-yellow-400",
  5: "text-amber-600",
  6: "text-red-400",
};

export function ZiweiChartGrid({
  houses,
  lifeHouseIndex,
  bodyHouseIndex,
  personName,
  lunarDate,
  solarDate,
  gender,
  fiveElementBureau,
  lifeHouseStem,
  lifeHouseBranch,
  ziweiLifeBranch,
  yearStemBranch,
}: ZiweiChartGridProps) {
  const [expandedBranch, setExpandedBranch] = useState<string | null>(null);

  const bureauNum = typeof fiveElementBureau === 'number' ? fiveElementBureau : parseInt(String(fiveElementBureau));
  const bureauText = bureauLabel[bureauNum] ?? `${fiveElementBureau}局`;
  const bureauCls = bureauColor[bureauNum] ?? "text-amber-400";

  // Build branch → palace data map
  const branchMap: Record<string, PalaceData> = {};
  for (const house of houses) {
    branchMap[house.branch] = house;
  }

  // Build 4×4 grid (null = empty, 'center' = center panel)
  const grid: (PalaceData | null | 'center')[][] = Array(4)
    .fill(null)
    .map(() => Array(4).fill(null));

  for (const [branch, pos] of Object.entries(branchGridLayout)) {
    const palace = branchMap[branch];
    if (palace) {
      grid[pos.row][pos.col] = palace;
    }
  }
  // Center 2×2 cells
  grid[1][1] = 'center';
  grid[1][2] = 'center';
  grid[2][1] = 'center';
  grid[2][2] = 'center';

  return (
    <div className="space-y-6">

      {/* ── User Info Table ── */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-700/50">
          <span className="text-sm font-semibold text-white">命造資料</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y divide-slate-700/40">
          <InfoCell label="姓名" value={personName} highlight />
          <InfoCell label="性別" value={gender} />
          {solarDate && <InfoCell label="西曆" value={solarDate} />}
          <InfoCell label="農曆" value={lunarDate} />
          <InfoCell
            label="五行局"
            value={bureauText}
            valueCls={bureauCls}
          />
          <InfoCell
            label="命宮"
            value={
              lifeHouseStem && lifeHouseBranch
                ? `${lifeHouseStem}${lifeHouseBranch}`
                : lifeHouseBranch ?? '—'
            }
            valueCls="text-amber-300"
          />
          <InfoCell
            label="紫微位置"
            value={ziweiLifeBranch ? `${ziweiLifeBranch}宮` : '—'}
            valueCls="text-purple-400"
          />
          {yearStemBranch && <InfoCell label="生年天干地支" value={yearStemBranch} />}
        </div>
      </div>

      {/* ── 4×4 Grid ── */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-4">
        <h3 className="text-sm font-semibold text-white mb-4">命盤（4×4 宮位）</h3>

        <div
          className="grid gap-1.5"
          style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}
        >
          {grid.map((row, rowIdx) =>
            row.map((cell, colIdx) => {
              const key = `${rowIdx}-${colIdx}`;

              // Center cells
              if (cell === 'center') {
                return (
                  <div
                    key={key}
                    className="aspect-square flex items-center justify-center rounded-lg border border-slate-700/30 bg-slate-900/60"
                  >
                    {rowIdx === 1 && colIdx === 1 && (
                      <div className="text-center p-1">
                        <div className="text-sm font-bold text-white truncate">{personName}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{gender}</div>
                      </div>
                    )}
                    {rowIdx === 1 && colIdx === 2 && (
                      <div className="text-center p-1">
                        <div className={`text-sm font-bold ${bureauCls}`}>{bureauText}</div>
                        {yearStemBranch && (
                          <div className="text-xs text-slate-400 mt-0.5">{yearStemBranch}年</div>
                        )}
                      </div>
                    )}
                    {rowIdx === 2 && colIdx === 1 && (
                      <div className="text-center p-1">
                        <div className="text-xs text-slate-400">命宮</div>
                        <div className="text-sm font-bold text-amber-300">
                          {lifeHouseStem && lifeHouseBranch
                            ? `${lifeHouseStem}${lifeHouseBranch}`
                            : lifeHouseBranch ?? '—'}
                        </div>
                      </div>
                    )}
                    {rowIdx === 2 && colIdx === 2 && (
                      <div className="text-center p-1">
                        <div className="text-xs text-slate-400">紫微</div>
                        <div className="text-sm font-bold text-purple-400">
                          {ziweiLifeBranch ? `${ziweiLifeBranch}宮` : '—'}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              // Palace cells
              if (cell) {
                const palace = cell as PalaceData;
                const isLife = palace.index === lifeHouseIndex;
                const isBody = bodyHouseIndex !== undefined && palace.index === bodyHouseIndex;
                const isExpanded = expandedBranch === palace.branch;

                return (
                  <div
                    key={key}
                    className={`relative aspect-square rounded-lg border transition-colors cursor-pointer ${
                      isLife
                        ? 'border-amber-400/80 bg-amber-950/40'
                        : 'border-slate-700/50 bg-slate-700/25 hover:bg-slate-700/40'
                    }`}
                    onClick={() => setExpandedBranch(isExpanded ? null : palace.branch)}
                  >
                    <div className="h-full p-1.5 flex flex-col">
                      {/* Header row: palace name + branch */}
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-[10px] font-semibold leading-tight ${isLife ? 'text-amber-300' : 'text-slate-300'}`}>
                          {palace.name.replace('宮', '')}
                        </span>
                        <span className="text-[10px] text-slate-500">{palace.branch}</span>
                      </div>

                      {/* Tags */}
                      {(isLife || isBody) && (
                        <div className="flex gap-0.5 mb-0.5">
                          {isLife && <span className="text-[8px] bg-amber-500/20 text-amber-300 px-0.5 rounded">命</span>}
                          {isBody && <span className="text-[8px] bg-blue-500/20 text-blue-300 px-0.5 rounded">身</span>}
                        </div>
                      )}

                      {/* Major stars */}
                      <div className="flex-1 overflow-hidden">
                        {palace.majorStars.slice(0, 3).map((star) => (
                          <div key={star} className="text-[10px] text-blue-300 leading-tight truncate">
                            {star}
                          </div>
                        ))}
                        {palace.majorStars.length > 3 && (
                          <div className="text-[9px] text-slate-500">+{palace.majorStars.length - 3}</div>
                        )}
                      </div>

                      {/* Transformations */}
                      {palace.transformations.length > 0 && (
                        <div className="text-[9px] text-amber-300 leading-tight">
                          {palace.transformations.join(' ')}
                        </div>
                      )}
                    </div>

                    {/* Expanded overlay */}
                    {isExpanded && (
                      <div className="absolute top-0 left-0 z-50 w-52 rounded-xl border border-slate-600/60 bg-slate-900 shadow-2xl p-3 text-xs space-y-2"
                        style={{ transform: colIdx >= 2 ? 'translateX(calc(-100% + 100%))' : 'none' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="font-semibold text-white">
                          {palace.name} · {palace.branch}宮
                          {isLife && <span className="ml-1 text-amber-400">（命宮）</span>}
                          {isBody && <span className="ml-1 text-blue-400">（身宮）</span>}
                        </div>
                        {palace.majorStars.length > 0 && (
                          <div>
                            <div className="text-slate-500 mb-0.5">主星</div>
                            <div className="text-blue-300">{palace.majorStars.join('　')}</div>
                          </div>
                        )}
                        {palace.minorStars && palace.minorStars.length > 0 && (
                          <div>
                            <div className="text-slate-500 mb-0.5">輔星</div>
                            <div className="text-slate-300">{palace.minorStars.join('　')}</div>
                          </div>
                        )}
                        {palace.transformations.length > 0 && (
                          <div>
                            <div className="text-slate-500 mb-0.5">四化</div>
                            <div className="text-amber-300">{palace.transformations.join(' ')}</div>
                          </div>
                        )}
                        {palace.lifeStageStars && palace.lifeStageStars.length > 0 && (
                          <div>
                            <div className="text-slate-500 mb-0.5">長生</div>
                            <div className="text-slate-400">{palace.lifeStageStars.join(' ')}</div>
                          </div>
                        ))}
                        {stars.length > 2 && (
                          <div className="text-[9px] text-slate-500">+{stars.length - 2}</div>
                        )}
                        <button
                          className="text-slate-500 hover:text-slate-300 text-[10px] pt-1"
                          onClick={() => setExpandedBranch(null)}
                        >
                          收起 ▲
                        </button>
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

              // Empty cell
              return <div key={key} className="aspect-square" />;
            })
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded border border-amber-400/80 bg-amber-950/40" />
            命宮
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[8px] bg-blue-500/20 text-blue-300 px-1 rounded">身</span>
            身宮
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-blue-300">★</span>
            主星（點擊宮位展開詳情）
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-amber-300">祿/權/科/忌</span>
            四化
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCell({
  label,
  value,
  valueCls,
  highlight,
}: {
  label: string;
  value: string;
  valueCls?: string;
  highlight?: boolean;
}) {
  return (
    <div className="px-4 py-3 space-y-0.5">
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`text-sm font-semibold ${valueCls ?? 'text-white'} ${highlight ? 'text-base' : ''}`}>
        {value}
      </div>
    </div>
  );
}
