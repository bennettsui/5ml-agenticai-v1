'use client';

// Matches Python format_chart_output (snake_case)
interface PalaceData {
  palace_id:       number;
  palace_name:     string;
  branch:          string;
  stem:            string;
  stem_branch:     string;
  ziwei_star?:     string | null;   // "紫微星" if present
  tianfu_star?:    string | null;   // "天府星" if present
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

// Star classification
const ZIWEI_STARS  = new Set(['紫微', '天機', '太陽', '武曲', '天同', '廉貞']);
const TIANFU_STARS = new Set(['天府', '太陰', '貪狼', '巨門', '天相', '天梁', '七殺', '破軍']);
const AUX_STARS    = new Set(['左輔', '右弼', '天魁', '天鉞', '文昌', '文曲', '天馬', '祿存']);
const BAD_STARS    = new Set(['擎羊', '陀羅', '火星', '鈴星', '地空', '地劫']);

type StarCategory = 'ziwei-anchor' | 'tianfu-anchor' | 'ziwei' | 'tianfu' | 'aux' | 'bad' | 'other';

function categorize(star: string): StarCategory {
  if (star === '紫微') return 'ziwei-anchor';
  if (star === '天府') return 'tianfu-anchor';
  if (ZIWEI_STARS.has(star))  return 'ziwei';
  if (TIANFU_STARS.has(star)) return 'tianfu';
  if (AUX_STARS.has(star))    return 'aux';
  if (BAD_STARS.has(star))    return 'bad';
  return 'other';
}

function starColorClass(cat: StarCategory): string {
  switch (cat) {
    case 'ziwei-anchor': return 'text-violet-200';
    case 'tianfu-anchor': return 'text-cyan-200';
    case 'ziwei':  return 'text-violet-300';
    case 'tianfu': return 'text-cyan-300';
    case 'aux':    return 'text-emerald-400';
    case 'bad':    return 'text-orange-400';
    default:       return 'text-slate-300';
  }
}

// CSS grid row/col (1-indexed) for each branch
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
  lunarDate:           string;
  hourBranch:          string;
  gender:              string;
  fiveElementBureau:   number | string;
  lifeStemBranch?:     string;
  starCount?:          number;   // legacy compat
  birthDate?:          string;   // legacy compat
}

// ── Individual palace cell ────────────────────────────────────────────────────
function PalaceCell({ palace, isLife }: { palace: PalaceData; isLife: boolean }) {
  const hua = palace.transformations ?? {};

  // Build ordered star list: anchor stars first, then others by category
  interface StarEntry { name: string; cat: StarCategory; }
  const entries: StarEntry[] = [];

  // 紫微 anchor (stored in ziwei_star as "紫微星")
  if (palace.ziwei_star) {
    const name = palace.ziwei_star.replace('星', '');
    entries.push({ name, cat: 'ziwei-anchor' });
  }
  // 天府 anchor (stored in tianfu_star as "天府星")
  if (palace.tianfu_star) {
    const name = palace.tianfu_star.replace('星', '');
    entries.push({ name, cat: 'tianfu-anchor' });
  }
  // major_stars: classify and separate
  const majorStars  = (palace.major_stars ?? []).filter(s => ZIWEI_STARS.has(s) || TIANFU_STARS.has(s));
  const auxStars    = (palace.major_stars ?? []).filter(s => AUX_STARS.has(s));
  const badStars    = (palace.major_stars ?? []).filter(s => BAD_STARS.has(s));
  const otherStars  = (palace.major_stars ?? []).filter(
    s => !ZIWEI_STARS.has(s) && !TIANFU_STARS.has(s) && !AUX_STARS.has(s) && !BAD_STARS.has(s)
  );

  for (const s of majorStars)  entries.push({ name: s, cat: categorize(s) });
  for (const s of auxStars)    entries.push({ name: s, cat: 'aux' });
  for (const s of badStars)    entries.push({ name: s, cat: 'bad' });
  for (const s of otherStars)  entries.push({ name: s, cat: 'other' });

  const isAnchor = (e: StarEntry) => e.cat === 'ziwei-anchor' || e.cat === 'tianfu-anchor';
  const isMajor  = (e: StarEntry) => e.cat === 'ziwei' || e.cat === 'tianfu';

  return (
    <div className={`
      h-full flex flex-col p-2.5 overflow-hidden cursor-default select-text
      border transition-colors
      ${isLife
        ? 'bg-amber-950/30 border-amber-600/50 shadow-[inset_0_0_24px_rgba(217,119,6,0.08)]'
        : 'bg-[#050d1a]/70 border-cyan-900/30 hover:border-cyan-700/40 hover:bg-[#060f20]/80'
      }
    `}>
      {/* Palace name + life badge */}
      <div className="flex items-center justify-between gap-1 mb-0.5">
        <span
          className={`text-[12px] font-bold leading-tight tracking-wide
            ${isLife ? 'text-amber-300' : 'text-slate-100'}`}
          style={{ fontFamily: "'Noto Serif TC', 'PingFang TC', 'STSong', serif" }}
        >
          {palace.palace_name}
        </span>
        {isLife && (
          <span className="text-[9px] font-bold text-amber-400 bg-amber-900/50 border border-amber-700/50 rounded px-1 leading-4 flex-shrink-0">命</span>
        )}
      </div>

      {/* Stem-branch combined (天干地支) */}
      <div className="text-[10px] text-sky-400 font-mono font-semibold mb-1.5 tracking-widest">
        {palace.stem_branch}
      </div>

      {/* Stars section */}
      <div
        className="flex-1 space-y-0.5 overflow-hidden"
        style={{ fontFamily: "'Noto Sans TC', 'PingFang SC', 'Microsoft YaHei', sans-serif" }}
      >
        {entries.map((e, i) => {
          const huaType = hua[e.name];
          const anchor  = isAnchor(e);
          const major   = isMajor(e);

          return (
            <div key={`${e.name}-${i}`} className="flex items-center justify-between gap-1 min-w-0">
              <div className="flex items-center gap-0.5 min-w-0 flex-1">
                {/* Anchor / major star indicator dot */}
                {anchor && (
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${e.cat === 'ziwei-anchor' ? 'bg-violet-400' : 'bg-cyan-400'}`} />
                )}
                {major && !anchor && (
                  <span className={`w-1 h-1 rounded-full flex-shrink-0 ${e.cat === 'ziwei' ? 'bg-violet-500/70' : 'bg-cyan-500/70'}`} />
                )}
                <span
                  className={`leading-tight font-medium truncate
                    ${anchor ? 'text-[13px] font-bold' : major ? 'text-[12px]' : 'text-[11px]'}
                    ${starColorClass(e.cat)}
                  `}
                >
                  {e.name}
                </span>
              </div>
              {/* 四化 badge inline */}
              {huaType && (
                <span className={`text-[9px] font-bold leading-3 flex-shrink-0 ${HUA_TEXT[huaType] ?? 'text-slate-400'}`}>
                  {HUA_LABEL[huaType] ?? huaType}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Branch watermark */}
      <span className="mt-1 text-[9px] text-slate-700 font-mono self-end pointer-events-none">
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

  const byBranch: Record<string, PalaceData> = {};
  for (const p of houses) if (p?.branch) byBranch[p.branch] = p;

  return (
    <div
      className="w-full select-text overflow-hidden rounded-xl border border-cyan-900/20"
      style={{
        display:               'grid',
        gridTemplateColumns:   'repeat(4, 1fr)',
        gridTemplateRows:      'repeat(4, 1fr)',
        gap:                   '1px',
        minHeight:             '600px',
        background:            'rgba(0,20,42,0.95)',
        fontFamily:            "'Noto Sans TC', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif",
      }}
    >
      {/* 12 palace cells */}
      {Object.entries(GRID_POS).map(([branch, [row, col]]) => {
        const palace = byBranch[branch];
        if (!palace) return null;
        return (
          <div
            key={branch}
            style={{ gridRow: row, gridColumn: col }}
            className="h-full"
          >
            <PalaceCell palace={palace} isLife={branch === lifePalaceBranch} />
          </div>
        );
      })}

      {/* Centre 2×2 panel (rows 2–3, cols 2–3) */}
      <div
        style={{ gridRow: '2 / 4', gridColumn: '2 / 4' }}
        className="flex flex-col items-center justify-center gap-1.5 bg-[#030c18]/80 border border-cyan-900/20 p-5 text-center select-text"
      >
        <div
          className="text-2xl font-bold text-white tracking-widest"
          style={{ fontFamily: "'Noto Serif TC', 'PingFang TC', 'STSong', serif" }}
        >
          {personName}
        </div>
        <div className="text-sm text-slate-400">{gender}</div>
        <div className="w-16 h-px bg-cyan-900/50 my-0.5" />
        <div className="text-[11px] text-slate-400 leading-relaxed space-y-0.5">
          {lunarDate && <div>{lunarDate}</div>}
          {hourBranch && <div>{hourBranch}時</div>}
        </div>
        <div
          className="mt-1.5 text-lg font-bold text-teal-300"
          style={{ fontFamily: "'Noto Serif TC', serif" }}
        >
          {bureauText}
        </div>
        {lifeStemBranch && (
          <div className="text-xs text-amber-400 font-semibold">命宮 {lifeStemBranch}</div>
        )}
        {lifePalaceBranch && (
          <div className="text-[10px] text-slate-500">({lifePalaceBranch}宮位)</div>
        )}
      </div>
    </div>
  );
}

export default ZiweiChartCanvas;
