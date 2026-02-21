'use client';

// Matches Python format_chart_output (snake_case)
interface PalaceData {
  palace_id:       number;
  palace_name:     string;
  branch:          string;
  stem:            string;
  stem_branch:     string;
  ziwei_star?:     string | null;
  tianfu_star?:    string | null;
  major_stars:     string[];
  transformations: Record<string, string>;
}

// ── Five element bureau — elemental colors ────────────────────────────────────
const BUREAU_CONFIG: Record<number, { label: string; color: string; shadow: string }> = {
  2: { label: '水二局', color: '#60a5fa', shadow: '0 0 16px rgba(96,165,250,0.35)'  }, // Water  — sky blue
  3: { label: '木三局', color: '#4ade80', shadow: '0 0 16px rgba(74,222,128,0.35)'  }, // Wood   — emerald
  4: { label: '金四局', color: '#fbbf24', shadow: '0 0 16px rgba(251,191,36,0.35)'  }, // Metal  — gold
  5: { label: '土五局', color: '#d4a46a', shadow: '0 0 16px rgba(212,164,106,0.35)' }, // Earth  — warm tan
  6: { label: '火六局', color: '#f87171', shadow: '0 0 16px rgba(248,113,113,0.35)' }, // Fire   — coral-red
};

const HUA_LABEL: Record<string, string> = {
  hua_lu: '化祿', hua_quan: '化權', hua_ke: '化科', hua_ji: '化忌',
};
const HUA_TEXT: Record<string, string> = {
  hua_lu:   '#6ee7b7',   // emerald-300
  hua_quan: '#fcd34d',   // amber-300
  hua_ke:   '#7dd3fc',   // sky-300
  hua_ji:   '#fca5a5',   // red-300
};

// ── Star classification ───────────────────────────────────────────────────────
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

// Inline colour values so we can use them in style={{}} (Tailwind purges dynamic classes)
const STAR_COLOR: Record<StarCategory, string> = {
  'ziwei-anchor':  '#c4b5fd',  // violet-300
  'tianfu-anchor': '#a5f3fc',  // cyan-200
  'ziwei':         '#a78bfa',  // violet-400
  'tianfu':        '#67e8f9',  // cyan-300
  'aux':           '#6ee7b7',  // emerald-300
  'bad':           '#fb923c',  // orange-400
  'other':         '#cbd5e1',  // slate-300
};

// CSS grid row/col (1-indexed)
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
  starCount?:          number;
  birthDate?:          string;
}

// ── Palace cell ───────────────────────────────────────────────────────────────
function PalaceCell({ palace, isLife }: { palace: PalaceData; isLife: boolean }) {
  const hua = palace.transformations ?? {};

  // Build ordered star list
  interface StarEntry { name: string; cat: StarCategory }
  const entries: StarEntry[] = [];

  if (palace.ziwei_star)  entries.push({ name: palace.ziwei_star.replace('星', ''),  cat: 'ziwei-anchor' });
  if (palace.tianfu_star) entries.push({ name: palace.tianfu_star.replace('星', ''), cat: 'tianfu-anchor' });

  const maj  = (palace.major_stars ?? []).filter(s => ZIWEI_STARS.has(s) || TIANFU_STARS.has(s));
  const aux  = (palace.major_stars ?? []).filter(s => AUX_STARS.has(s));
  const bad  = (palace.major_stars ?? []).filter(s => BAD_STARS.has(s));
  const rest = (palace.major_stars ?? []).filter(
    s => !ZIWEI_STARS.has(s) && !TIANFU_STARS.has(s) && !AUX_STARS.has(s) && !BAD_STARS.has(s)
  );
  for (const s of maj)  entries.push({ name: s, cat: categorize(s) });
  for (const s of aux)  entries.push({ name: s, cat: 'aux' });
  for (const s of bad)  entries.push({ name: s, cat: 'bad' });
  for (const s of rest) entries.push({ name: s, cat: 'other' });

  const isAnchor = (e: StarEntry) => e.cat === 'ziwei-anchor' || e.cat === 'tianfu-anchor';
  const isMajor  = (e: StarEntry) => e.cat === 'ziwei' || e.cat === 'tianfu';

  // Transparent plate: dark glass with subtle coloured border for life palace
  const cellBg   = isLife ? 'rgba(120,53,15,0.22)' : 'rgba(15,23,42,0.52)';
  const cellBdr  = isLife ? '1px solid rgba(217,119,6,0.45)' : '1px solid rgba(255,255,255,0.05)';
  const cellGlow = isLife ? 'inset 0 0 28px rgba(217,119,6,0.06)' : 'none';

  return (
    <div
      className="h-full flex flex-col select-text overflow-hidden"
      style={{
        background:   cellBg,
        border:       cellBdr,
        boxShadow:    cellGlow,
        borderRadius: '10px',
        padding:      '10px 10px 8px',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        fontFamily:   "'Noto Sans TC', 'PingFang SC', 'Microsoft YaHei', sans-serif",
      }}
    >
      {/* Palace name + life badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
        <span
          style={{
            fontFamily: "'Noto Serif TC', 'PingFang TC', 'STSong', serif",
            fontSize:   '12px',
            fontWeight: 700,
            color:       isLife ? '#fcd34d' : '#e2e8f0',
            letterSpacing: '0.05em',
            lineHeight: 1.2,
          }}
        >
          {palace.palace_name}
        </span>
        {isLife && (
          <span style={{
            fontSize: '9px', fontWeight: 700, color: '#fbbf24',
            background: 'rgba(120,53,15,0.5)', border: '1px solid rgba(217,119,6,0.5)',
            borderRadius: '4px', padding: '0 4px', lineHeight: '14px',
          }}>命</span>
        )}
      </div>

      {/* 天干地支 combined */}
      <div style={{ fontSize: '10px', color: '#38bdf8', fontFamily: 'monospace', fontWeight: 600, letterSpacing: '0.12em', marginBottom: '6px' }}>
        {palace.stem_branch}
      </div>

      {/* Thin separator */}
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', marginBottom: '5px' }} />

      {/* Stars */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {entries.map((e, i) => {
          const huaType = hua[e.name];
          const anchor  = isAnchor(e);
          const major   = isMajor(e);

          const fontSize  = anchor ? '15px' : major ? '13px' : '11px';
          const fontWeight = anchor ? 800 : major ? 600 : 400;
          const color     = STAR_COLOR[e.cat];

          return (
            <div
              key={`${e.name}-${i}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', minWidth: 0 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', minWidth: 0, flex: 1 }}>
                {/* Anchor indicator diamond / major dot */}
                {anchor && (
                  <span style={{
                    width: '5px', height: '5px', borderRadius: '1px',
                    background: color, flexShrink: 0,
                    transform: 'rotate(45deg)',
                  }} />
                )}
                {major && !anchor && (
                  <span style={{
                    width: '4px', height: '4px', borderRadius: '50%',
                    background: color, opacity: 0.7, flexShrink: 0,
                  }} />
                )}
                <span style={{
                  fontSize, fontWeight, color,
                  lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {e.name}
                </span>
              </div>
              {/* 四化 inline */}
              {huaType && (
                <span style={{
                  fontSize: '9px', fontWeight: 700, flexShrink: 0,
                  color: HUA_TEXT[huaType] ?? '#94a3b8',
                  letterSpacing: '0em',
                }}>
                  {HUA_LABEL[huaType] ?? huaType}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Branch watermark */}
      <div style={{ fontSize: '9px', color: 'rgba(148,163,184,0.25)', fontFamily: 'monospace', textAlign: 'right', marginTop: '4px', userSelect: 'none' }}>
        {palace.branch}
      </div>
    </div>
  );
}

// ── Main chart ────────────────────────────────────────────────────────────────
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

  const bureauNum = typeof fiveElementBureau === 'number'
    ? fiveElementBureau : parseInt(String(fiveElementBureau));
  const bureau = BUREAU_CONFIG[bureauNum] ?? { label: `${fiveElementBureau}局`, color: '#94a3b8', shadow: 'none' };

  const byBranch: Record<string, PalaceData> = {};
  for (const p of houses) if (p?.branch) byBranch[p.branch] = p;

  return (
    <div
      className="w-full select-text"
      style={{
        display:             'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gridTemplateRows:    'repeat(4, 1fr)',
        gap:                 '6px',
        padding:             '6px',
        minHeight:           '640px',
        background:          '#050c19',
        borderRadius:        '14px',
        border:              '1px solid rgba(6,182,212,0.10)',
        fontFamily:          "'Noto Sans TC', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif",
      }}
    >
      {/* 12 palace cells */}
      {Object.entries(GRID_POS).map(([branch, [row, col]]) => {
        const palace = byBranch[branch];
        if (!palace) return null;
        return (
          <div key={branch} style={{ gridRow: row, gridColumn: col }} className="h-full">
            <PalaceCell palace={palace} isLife={branch === lifePalaceBranch} />
          </div>
        );
      })}

      {/* Centre 2×2 panel */}
      <div
        style={{
          gridRow: '2 / 4', gridColumn: '2 / 4',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '6px', textAlign: 'center',
          background: 'rgba(8,16,32,0.85)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '10px',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          padding: '20px',
        }}
      >
        {/* Name */}
        <div style={{
          fontFamily: "'Noto Serif TC', 'PingFang TC', serif",
          fontSize: '22px', fontWeight: 800, color: '#f1f5f9', letterSpacing: '0.12em',
        }}>
          {personName}
        </div>

        {/* Gender */}
        <div style={{ fontSize: '12px', color: '#94a3b8' }}>{gender}</div>

        {/* Divider */}
        <div style={{ width: '48px', height: '1px', background: 'rgba(6,182,212,0.25)' }} />

        {/* Date info */}
        <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.8 }}>
          {lunarDate && <div>{lunarDate}</div>}
          {hourBranch && <div>{hourBranch}時</div>}
        </div>

        {/* Five element bureau — coloured by element */}
        <div style={{
          fontFamily: "'Noto Serif TC', serif",
          fontSize: '18px', fontWeight: 700,
          color: bureau.color,
          textShadow: bureau.shadow,
          marginTop: '4px',
        }}>
          {bureau.label}
        </div>

        {/* 命宮 stem-branch */}
        {lifeStemBranch && (
          <div style={{ fontSize: '11px', color: '#fcd34d', fontWeight: 600 }}>
            命宮 {lifeStemBranch}
          </div>
        )}
        {lifePalaceBranch && (
          <div style={{ fontSize: '10px', color: '#475569' }}>({lifePalaceBranch}宮位)</div>
        )}
      </div>
    </div>
  );
}

export default ZiweiChartCanvas;
