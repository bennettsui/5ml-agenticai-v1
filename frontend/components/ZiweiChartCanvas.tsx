'use client';

// Matches Python format_chart_output (snake_case)
interface PalaceData {
  palace_id:       number;
  palace_name:     string;
  branch:          string;
  stem:            string;
  stem_branch:     string;
  major_stars:     string[];
  transformations: Record<string, string>; // { starName: "hua_lu" | ... }
}

const BUREAU_LABEL: Record<number, string> = {
  2: '水二局', 3: '木三局', 4: '金四局', 5: '土五局', 6: '火六局',
};

const HUA_LABEL: Record<string, string> = {
  hua_lu: '化祿', hua_quan: '化權', hua_ke: '化科', hua_ji: '化忌',
};
const HUA_TEXT: Record<string, string> = {
  hua_lu:   'text-emerald-300',
  hua_quan: 'text-amber-300',
  hua_ke:   'text-sky-300',
  hua_ji:   'text-rose-400',
};
const HUA_BADGE: Record<string, string> = {
  hua_lu:   'bg-emerald-900/60 border-emerald-600/40 text-emerald-300',
  hua_quan: 'bg-amber-900/60 border-amber-600/40 text-amber-300',
  hua_ke:   'bg-sky-900/60 border-sky-600/40 text-sky-300',
  hua_ji:   'bg-rose-900/60 border-rose-600/40 text-rose-400',
};

// Star classification for color coding
const ZIWEI_STARS  = new Set(['紫微', '天機', '太陽', '武曲', '天同', '廉貞']);
const TIANFU_STARS = new Set(['天府', '太陰', '貪狼', '巨門', '天相', '天梁', '七殺', '破軍']);
const AUX_STARS    = new Set(['左輔', '右弼', '天魁', '天鉞', '文昌', '文曲', '天馬', '祿存']);
const BAD_STARS    = new Set(['擎羊', '陀羅', '火星', '鈴星', '地空', '地劫']);

function starColor(star: string): string {
  if (ZIWEI_STARS.has(star))  return 'text-violet-300';
  if (TIANFU_STARS.has(star)) return 'text-cyan-300';
  if (AUX_STARS.has(star))    return 'text-emerald-400';
  if (BAD_STARS.has(star))    return 'text-orange-400';
  return 'text-slate-300';
}

// CSS grid row/col (1-indexed) for each branch
// Layout: 巳午未申 top row, 辰/酉 sides, 卯/戌 sides, 寅丑子亥 bottom
const GRID_POS: Record<string, [number, number]> = {
  巳: [1, 1], 午: [1, 2], 未: [1, 3], 申: [1, 4],
  辰: [2, 1],                          酉: [2, 4],
  卯: [3, 1],                          戌: [3, 4],
  寅: [4, 1], 丑: [4, 2], 子: [4, 3], 亥: [4, 4],
};

export interface ZiweiChartCanvasProps {
  houses:              PalaceData[];
  lifePalaceBranch?:   string;
  personName:          string;
  lunarDate:           string;   // e.g. "甲子年 12月 3日"
  hourBranch:          string;   // e.g. "亥"
  gender:              string;   // "男" | "女"
  fiveElementBureau:   number | string;
  lifeStemBranch?:     string;   // e.g. "己卯"
  // legacy compat
  starCount?:          number;
  birthDate?:          string;
}

// ── Individual palace cell ────────────────────────────────────────────────────
function PalaceCell({ palace, isLife }: { palace: PalaceData; isLife: boolean }) {
  const stars     = palace.major_stars ?? [];
  const hua       = palace.transformations ?? {};
  const huaValues = Object.values(hua);

  // Separate major from minor stars for display priority
  const majorStars = stars.filter(s => ZIWEI_STARS.has(s) || TIANFU_STARS.has(s));
  const otherStars = stars.filter(s => !ZIWEI_STARS.has(s) && !TIANFU_STARS.has(s));
  const orderedStars = [...majorStars, ...otherStars];

  return (
    <div
      className={`
        relative flex flex-col p-2.5 overflow-hidden cursor-default select-text
        border transition-colors duration-150
        ${isLife
          ? 'bg-amber-950/30 border-amber-600/50 shadow-[inset_0_0_24px_rgba(217,119,6,0.08)]'
          : 'bg-[#050d1a]/70 border-cyan-900/30 hover:border-cyan-700/40 hover:bg-[#060f20]/80'
        }
      `}
    >
      {/* Header: palace name + life badge */}
      <div className="flex items-center justify-between gap-1 mb-0.5">
        <span
          className={`text-[13px] font-bold leading-tight tracking-wide
            ${isLife ? 'text-amber-300' : 'text-slate-100'}`}
          style={{ fontFamily: "'Noto Serif TC', 'PingFang TC', 'STSong', serif" }}
        >
          {palace.palace_name}
        </span>
        {isLife && (
          <span className="text-[9px] font-bold text-amber-400 bg-amber-900/50 border border-amber-700/50 rounded px-1 leading-4 flex-shrink-0">
            命
          </span>
        )}
      </div>

      {/* 天干地支 combined */}
      <div className="text-[11px] text-sky-400 font-mono font-semibold mb-2 tracking-widest">
        {palace.stem_branch}
      </div>

      {/* Stars list */}
      <div
        className="flex-1 space-y-0.5 overflow-hidden"
        style={{ fontFamily: "'Noto Sans TC', 'PingFang SC', 'Microsoft YaHei', sans-serif" }}
      >
        {orderedStars.map(star => {
          const huaType = hua[star];
          return (
            <div key={star} className="flex items-center justify-between gap-1 min-w-0">
              <span className={`text-[12px] font-medium leading-tight flex-shrink-0 ${starColor(star)}`}>
                {star}
              </span>
              {huaType && (
                <span className={`text-[9px] font-bold leading-3 px-0.5 rounded flex-shrink-0 ${HUA_TEXT[huaType] ?? 'text-slate-400'}`}>
                  {HUA_LABEL[huaType] ?? huaType}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* 四化 summary badges at bottom */}
      {huaValues.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-0.5">
          {huaValues.map((huaType, i) => (
            <span
              key={i}
              className={`text-[8px] px-1 py-px rounded border leading-3 ${HUA_BADGE[huaType] ?? 'bg-slate-800 border-slate-600 text-slate-400'}`}
            >
              {HUA_LABEL[huaType] ?? huaType}
            </span>
          ))}
        </div>
      )}

      {/* Branch watermark (bottom-right) */}
      <span className="absolute bottom-1 right-1.5 text-[10px] text-slate-700 font-mono pointer-events-none">
        {palace.branch}
      </span>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function ZiweiChartCanvas({
  houses,
  lifePalaceBranch,
  personName,
  lunarDate,
  hourBranch,
  gender,
  fiveElementBureau,
  lifeStemBranch,
}: ZiweiChartCanvasProps) {
  if (!houses?.length) return null;

  const bureauNum  = typeof fiveElementBureau === 'number'
    ? fiveElementBureau : parseInt(String(fiveElementBureau));
  const bureauText = BUREAU_LABEL[bureauNum] ?? `${fiveElementBureau}局`;

  // Index palaces by branch for fast lookup
  const byBranch: Record<string, PalaceData> = {};
  for (const p of houses) if (p?.branch) byBranch[p.branch] = p;

  return (
    <div
      className="w-full select-text overflow-hidden rounded-xl border border-cyan-900/20"
      style={{
        display:               'grid',
        gridTemplateColumns:   'repeat(4, 1fr)',
        gridTemplateRows:      'repeat(4, minmax(140px, auto))',
        gap:                   '1px',
        background:            'rgba(0,20,42,0.95)',
        fontFamily:            "'Noto Sans TC', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif",
      }}
    >
      {/* ── 12 palace cells ─────────────────────────────────────────────── */}
      {Object.entries(GRID_POS).map(([branch, [row, col]]) => {
        const palace = byBranch[branch];
        if (!palace) return null;
        return (
          <div key={branch} style={{ gridRow: row, gridColumn: col }}>
            <PalaceCell palace={palace} isLife={branch === lifePalaceBranch} />
          </div>
        );
      })}

      {/* ── Centre 2×2 panel (rows 2–3, cols 2–3) ─────────────────────── */}
      <div
        style={{ gridRow: '2 / 4', gridColumn: '2 / 4' }}
        className="flex flex-col items-center justify-center gap-1.5 bg-[#030c18]/80 border border-cyan-900/20 p-5 text-center select-text"
      >
        {/* Name */}
        <div
          className="text-2xl font-bold text-white tracking-widest"
          style={{ fontFamily: "'Noto Serif TC', 'PingFang TC', 'STSong', serif" }}
        >
          {personName}
        </div>

        {/* Gender */}
        <div className="text-sm text-slate-400">{gender}</div>

        {/* Divider */}
        <div className="w-16 h-px bg-cyan-900/50 my-0.5" />

        {/* Lunar date + hour */}
        <div className="text-[11px] text-slate-400 leading-relaxed space-y-0.5">
          {lunarDate && <div>{lunarDate}</div>}
          {hourBranch && <div>{hourBranch}時</div>}
        </div>

        {/* 五行局 */}
        <div
          className="mt-1 text-lg font-bold text-teal-300"
          style={{ fontFamily: "'Noto Serif TC', serif" }}
        >
          {bureauText}
        </div>

        {/* 命宮 stem-branch */}
        {lifeStemBranch && (
          <div className="text-xs text-amber-400 font-semibold">
            命宮 {lifeStemBranch}
          </div>
        )}

        {/* Life palace branch label */}
        {lifePalaceBranch && (
          <div className="text-[10px] text-slate-500">
            ({lifePalaceBranch}宮位)
          </div>
        )}
      </div>
    </div>
  );
}

export default ZiweiChartCanvas;
