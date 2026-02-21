'use client';

import { useState } from 'react';

// Matches Python format_chart_output (snake_case)
interface PalaceData {
  palace_id:      number;
  palace_name:    string;
  branch:         string;
  stem:           string;
  stem_branch:    string;
  major_stars:    string[];
  transformations: Record<string, string>; // { starName: type } e.g. { "廉貞": "化祿" }
  ziwei_star?:    string;
  tianfu_star?:   string;
}

interface ZiweiChartGridProps {
  houses:            PalaceData[];
  lifeHouseIndex:    number;        // palace_id of life palace
  bodyHouseIndex?:   number;
  personName:        string;
  lunarDate:         string;        // e.g. "甲子年 12月 3日 亥時"
  solarDate?:        string;
  gender:            string;
  fiveElementBureau: number | string;
  lifeHouseStem?:    string;
  lifeHouseBranch?:  string;
  ziweiLifeBranch?:  string;
  yearStemBranch?:   string;
}

// Standard 4×4 ZWDS grid layout: branch → {row, col}
const branchGridLayout: Record<string, { row: number; col: number }> = {
  "巳": { row: 0, col: 0 },
  "午": { row: 0, col: 1 },
  "未": { row: 0, col: 2 },
  "申": { row: 0, col: 3 },
  "辰": { row: 1, col: 0 },
  "酉": { row: 1, col: 3 },
  "卯": { row: 2, col: 0 },
  "戌": { row: 2, col: 3 },
  "寅": { row: 3, col: 0 },
  "丑": { row: 3, col: 1 },
  "子": { row: 3, col: 2 },
  "亥": { row: 3, col: 3 },
};

const bureauLabel: Record<number, string> = {
  2: "水二局", 3: "木三局", 4: "金四局", 5: "土五局", 6: "火六局",
};
const bureauColor: Record<number, string> = {
  2: "text-blue-400", 3: "text-green-400", 4: "text-yellow-400", 5: "text-amber-600", 6: "text-red-400",
};

// 四化 colour badges
const HUA_COLORS: Record<string, string> = {
  "化祿": "text-emerald-300 bg-emerald-900/40",
  "化權": "text-amber-300 bg-amber-900/40",
  "化科": "text-sky-300 bg-sky-900/40",
  "化忌": "text-rose-400 bg-rose-900/40",
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

  const bureauNum  = typeof fiveElementBureau === 'number' ? fiveElementBureau : parseInt(String(fiveElementBureau));
  const bureauText = bureauLabel[bureauNum] ?? `${fiveElementBureau}局`;
  const bureauCls  = bureauColor[bureauNum] ?? "text-amber-400";

  // Build branch → palace map
  const branchMap: Record<string, PalaceData> = {};
  for (const h of houses) {
    if (h.branch) branchMap[h.branch] = h;
  }

  // Build 4×4 grid
  const grid: (PalaceData | null | 'center')[][] = Array(4)
    .fill(null)
    .map(() => Array(4).fill(null));
  for (const [branch, pos] of Object.entries(branchGridLayout)) {
    const palace = branchMap[branch];
    if (palace) grid[pos.row][pos.col] = palace;
  }
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
          <InfoCell label="姓名"     value={personName} highlight />
          <InfoCell label="性別"     value={gender} />
          {solarDate && <InfoCell label="西曆" value={solarDate} />}
          <InfoCell label="農曆"     value={lunarDate} />
          <InfoCell label="五行局"   value={bureauText} valueCls={bureauCls} />
          <InfoCell
            label="命宮"
            value={lifeHouseStem && lifeHouseBranch ? `${lifeHouseStem}${lifeHouseBranch}` : lifeHouseBranch ?? '—'}
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

        <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {grid.map((row, rowIdx) =>
            row.map((cell, colIdx) => {
              const key = `${rowIdx}-${colIdx}`;

              // ── Centre panel ────────────────────────────────────────────
              if (cell === 'center') {
                return (
                  <div key={key}
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

              // ── Palace cell ─────────────────────────────────────────────
              if (cell) {
                const palace   = cell as PalaceData;
                const isLife   = palace.palace_id === lifeHouseIndex;
                const isBody   = bodyHouseIndex !== undefined && palace.palace_id === bodyHouseIndex;
                const isOpen   = expandedBranch === palace.branch;
                const hua      = palace.transformations ?? {};
                const huaKeys  = Object.keys(hua);
                const stars    = palace.major_stars ?? [];

                return (
                  <div
                    key={key}
                    className={`relative aspect-square rounded-lg border transition-colors cursor-pointer ${
                      isLife
                        ? 'border-amber-400/80 bg-amber-950/40'
                        : 'border-slate-700/50 bg-slate-700/25 hover:bg-slate-700/40'
                    }`}
                    onClick={() => setExpandedBranch(isOpen ? null : palace.branch)}
                  >
                    <div className="h-full p-1.5 flex flex-col">

                      {/* Header */}
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-[10px] font-semibold leading-tight ${isLife ? 'text-amber-300' : 'text-slate-300'}`}>
                          {palace.palace_name.replace('宮', '')}
                        </span>
                        <span className="text-[10px] text-slate-500">{palace.branch}</span>
                      </div>

                      {/* Life/Body tags */}
                      {(isLife || isBody) && (
                        <div className="flex gap-0.5 mb-0.5">
                          {isLife && <span className="text-[8px] bg-amber-500/20 text-amber-300 px-0.5 rounded">命</span>}
                          {isBody && <span className="text-[8px] bg-blue-500/20 text-blue-300 px-0.5 rounded">身</span>}
                        </div>
                      )}

                      {/* Major stars */}
                      <div className="flex-1 overflow-hidden">
                        {stars.slice(0, 3).map((star) => (
                          <div key={star} className="text-[10px] text-blue-300 leading-tight truncate">
                            {star}
                          </div>
                        ))}
                        {stars.length > 3 && (
                          <div className="text-[9px] text-slate-500">+{stars.length - 3}</div>
                        )}
                      </div>

                      {/* Inline 四化 */}
                      {huaKeys.length > 0 && (
                        <div className="text-[9px] text-amber-300 leading-tight">
                          {huaKeys.map(s => hua[s]).join(' ')}
                        </div>
                      )}
                    </div>

                    {/* Expanded popup */}
                    {isOpen && (
                      <div
                        className="absolute top-0 left-0 z-50 w-52 rounded-xl border border-slate-600/60 bg-slate-900 shadow-2xl p-3 text-xs space-y-2"
                        style={{ transform: colIdx >= 2 ? 'translateX(calc(-100% + 100%))' : 'none' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="font-semibold text-white">
                          {palace.palace_name} · {palace.branch}宮
                          {isLife && <span className="ml-1 text-amber-400">（命宮）</span>}
                          {isBody && <span className="ml-1 text-blue-400">（身宮）</span>}
                        </div>

                        {stars.length > 0 && (
                          <div>
                            <div className="text-slate-500 mb-0.5">主星</div>
                            <div className="text-blue-300">{stars.join('　')}</div>
                          </div>
                        )}

                        {huaKeys.length > 0 && (
                          <div>
                            <div className="text-slate-500 mb-0.5">四化</div>
                            <div className="flex flex-wrap gap-1">
                              {huaKeys.map(star => (
                                <span
                                  key={star}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${HUA_COLORS[hua[star]] ?? 'text-slate-400 bg-slate-800/40'}`}
                                >
                                  {star} {hua[star]}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <button
                          className="text-slate-500 hover:text-slate-300 text-[10px] pt-1"
                          onClick={() => setExpandedBranch(null)}
                        >
                          收起 ▲
                        </button>
                      </div>
                    )}

                    {/* 四化 badge strip on cell */}
                    {huaKeys.length > 0 && !isOpen && (
                      <div className="flex flex-wrap justify-center gap-0.5 px-1 pb-0.5">
                        {huaKeys.slice(0, 2).map(star => (
                          <span
                            key={star}
                            className={`text-[8px] px-0.5 py-px rounded font-medium ${HUA_COLORS[hua[star]] ?? 'text-slate-400 bg-slate-800/40'}`}
                          >
                            {hua[star]}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              // ── Empty cell ──────────────────────────────────────────────
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
