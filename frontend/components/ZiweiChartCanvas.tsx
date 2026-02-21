'use client';

import { useEffect, useRef } from 'react';

// Matches Python format_chart_output (snake_case)
interface PalaceData {
  palace_id:       number;
  palace_name:     string;
  branch:          string;
  stem:            string;
  stem_branch:     string;
  major_stars:     string[];
  transformations: Record<string, string>; // { starName: "hua_lu" | "hua_quan" | "hua_ke" | "hua_ji" }
}

const BUREAU_LABEL: Record<number, string> = {
  2: '水二局', 3: '木三局', 4: '金四局', 5: '土五局', 6: '火六局',
};

const HUA_LABEL: Record<string, string> = {
  hua_lu: '化祿', hua_quan: '化權', hua_ke: '化科', hua_ji: '化忌',
};
const HUA_COLOR: Record<string, string> = {
  hua_lu: '#4ade80', hua_quan: '#fbbf24', hua_ke: '#38bdf8', hua_ji: '#f87171',
};

// Standard 4×4 ZWDS grid: branch → [row, col]
// 寅 bottom-left, running clockwise: 寅→卯→辰→巳→午→未→申→酉→戌→亥→子→丑
const BRANCH_POS: Record<string, [number, number]> = {
  巳: [0, 0], 午: [0, 1], 未: [0, 2], 申: [0, 3],
  辰: [1, 0],                          酉: [1, 3],
  卯: [2, 0],                          戌: [2, 3],
  寅: [3, 0], 丑: [3, 1], 子: [3, 2], 亥: [3, 3],
};

export interface ZiweiChartCanvasProps {
  houses:              PalaceData[];
  lifePalaceBranch?:   string;          // base_chart.life_palace.branch
  personName:          string;
  lunarDate:           string;          // e.g. "甲子年 12月 3日"
  hourBranch:          string;          // e.g. "亥"
  gender:              string;          // "男" | "女"
  fiveElementBureau:   number | string; // 3 or "木三局"
  lifeStemBranch?:     string;          // e.g. "己卯"
  // legacy compat
  starCount?:          number;
  birthDate?:          string;
}

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
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !houses?.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // HiDPI support
    const DPR  = Math.min(window.devicePixelRatio || 1, 2);
    const SIZE = 600;
    const CELL = SIZE / 4; // 150px per cell

    canvas.width        = SIZE * DPR;
    canvas.height       = SIZE * DPR;
    canvas.style.width  = `${SIZE}px`;
    canvas.style.height = `${SIZE}px`;
    ctx.scale(DPR, DPR);

    const CJK = "'PingFang SC','Noto Sans CJK SC','Microsoft YaHei',system-ui,sans-serif";
    const PAD = 6;

    // ── Colour palette ─────────────────────────────────────────────────────
    const C = {
      bg:         '#070f18',
      cellBg:     '#0b1a26',
      lifeBg:     '#120d00',
      lifeBorder: '#d97706',
      cellBorder: '#1e3344',
      centerBg:   '#08141e',
      palName:    '#e2e8f0',
      lifeLabel:  '#fbbf24',
      branch:     '#64748b',
      stem:       '#0ea5e9',
      star:       '#93c5fd',
      bodyMark:   '#60a5fa',
      centerName: '#f8fafc',
      centerSub:  '#94a3b8',
      bureau:     '#2dd4bf',
      dimLine:    '#1a2e3e',
    };

    const bureauNum  = typeof fiveElementBureau === 'number'
      ? fiveElementBureau : parseInt(String(fiveElementBureau));
    const bureauText = BUREAU_LABEL[bureauNum] ?? `${fiveElementBureau}局`;

    // ── Build branch lookup ────────────────────────────────────────────────
    const byBranch: Record<string, PalaceData> = {};
    for (const p of houses) if (p?.branch) byBranch[p.branch] = p;

    // ── Background ────────────────────────────────────────────────────────
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, SIZE, SIZE);

    // ── Grid dividers ─────────────────────────────────────────────────────
    ctx.strokeStyle = C.dimLine;
    ctx.lineWidth   = 0.5;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, SIZE); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(SIZE, i * CELL); ctx.stroke();
    }

    // ── Centre panel ──────────────────────────────────────────────────────
    {
      const cx = CELL, cy = CELL, cw = CELL * 2, ch = CELL * 2;
      ctx.fillStyle = C.centerBg;
      ctx.fillRect(cx, cy, cw, ch);

      // Subtle inner frame
      ctx.strokeStyle = '#1e4a60';
      ctx.lineWidth   = 0.5;
      ctx.strokeRect(cx + 6, cy + 6, cw - 12, ch - 12);

      const mx = cx + cw / 2;
      ctx.textAlign = 'center';

      // Name
      ctx.font = `bold 17px ${CJK}`;
      ctx.fillStyle = C.centerName;
      ctx.textBaseline = 'middle';
      ctx.fillText(personName, mx, cy + 46, cw - 20);

      // Gender
      ctx.font = `12px ${CJK}`;
      ctx.fillStyle = C.centerSub;
      ctx.fillText(gender, mx, cy + 70);

      // Separator line
      ctx.strokeStyle = C.dimLine;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(cx + 20, cy + 84); ctx.lineTo(cx + cw - 20, cy + 84);
      ctx.stroke();

      // Lunar date
      ctx.font = `10px ${CJK}`;
      ctx.fillStyle = C.centerSub;
      ctx.fillText(lunarDate, mx, cy + 100, cw - 20);
      ctx.fillText(`${hourBranch}時`, mx, cy + 116);

      // 五行局
      ctx.font = `bold 15px ${CJK}`;
      ctx.fillStyle = C.bureau;
      ctx.fillText(bureauText, mx, cy + 148);

      // 命宮 location
      if (lifeStemBranch) {
        ctx.font = `11px ${CJK}`;
        ctx.fillStyle = C.lifeLabel;
        ctx.fillText(`命宮  ${lifeStemBranch}`, mx, cy + 170);
      }

      if (lifePalaceBranch) {
        ctx.font = `10px ${CJK}`;
        ctx.fillStyle = C.centerSub;
        ctx.fillText(`(${lifePalaceBranch}宮位)`, mx, cy + 188);
      }
    }

    // ── Palace cell draw helper ────────────────────────────────────────────
    function drawPalace(
      cx: number, cy: number,
      palace: PalaceData,
      isLife: boolean,
    ) {
      const cw = CELL, ch = CELL;

      // Background
      ctx.fillStyle = isLife ? C.lifeBg : C.cellBg;
      ctx.fillRect(cx, cy, cw, ch);

      // Border — life palace gets amber highlight
      ctx.strokeStyle = isLife ? C.lifeBorder : C.cellBorder;
      ctx.lineWidth   = isLife ? 1.5 : 0.5;
      ctx.strokeRect(cx + 0.5, cy + 0.5, cw - 1, ch - 1);

      const tx = cx + PAD;
      ctx.textBaseline = 'top';

      // ── Top row: palace name (left) + branch (right) ───────────────
      ctx.font      = `bold 11px ${CJK}`;
      ctx.fillStyle = isLife ? C.lifeLabel : C.palName;
      ctx.textAlign = 'left';
      ctx.fillText(palace.palace_name, tx, cy + PAD, CELL - PAD * 2 - 22);

      ctx.font      = `10px ${CJK}`;
      ctx.fillStyle = C.branch;
      ctx.textAlign = 'right';
      ctx.fillText(palace.branch, cx + cw - PAD, cy + PAD);

      // ── Second row: stem ──────────────────────────────────────────
      ctx.font      = `9px ${CJK}`;
      ctx.fillStyle = C.stem;
      ctx.textAlign = 'left';
      ctx.fillText(palace.stem || '', tx, cy + PAD + 14, 24);

      // 命 badge
      if (isLife) {
        ctx.font      = `bold 8px ${CJK}`;
        ctx.fillStyle = C.lifeLabel;
        ctx.textAlign = 'right';
        ctx.fillText('命', cx + cw - PAD, cy + PAD + 14);
      }

      // ── Stars ─────────────────────────────────────────────────────
      const stars  = palace.major_stars ?? [];
      const huaMap = palace.transformations ?? {};
      const maxY   = cy + ch - 16; // reserve bottom 16px for 四化 summary

      let sy = cy + PAD + 30;
      for (const star of stars) {
        if (sy + 12 > maxY) break;
        const huaType = huaMap[star];
        ctx.font      = `10px ${CJK}`;
        ctx.fillStyle = huaType ? (HUA_COLOR[huaType] ?? C.star) : C.star;
        ctx.textAlign = 'left';
        ctx.fillText(star, tx, sy, CELL - PAD * 2 - (huaType ? 24 : 0));

        if (huaType) {
          const label = HUA_LABEL[huaType] ?? huaType;
          ctx.font      = `8px ${CJK}`;
          ctx.fillStyle = HUA_COLOR[huaType] ?? '#ffffff';
          ctx.textAlign = 'right';
          ctx.fillText(label, cx + cw - PAD, sy);
        }
        sy += 13;
      }

      // ── Bottom: 四化 summary ──────────────────────────────────────
      const huaEntries = Object.entries(huaMap);
      if (huaEntries.length > 0) {
        let hx = tx;
        const hy = cy + ch - 12;
        ctx.textBaseline = 'top';
        ctx.textAlign    = 'left';
        for (const [, huaType] of huaEntries) {
          const label = HUA_LABEL[huaType] ?? huaType;
          ctx.font      = `9px ${CJK}`;
          ctx.fillStyle = HUA_COLOR[huaType] ?? '#ffffff';
          ctx.fillText(label, hx, hy);
          hx += ctx.measureText(label).width + 3;
          if (hx > cx + cw - PAD) break;
        }
      }
    }

    // ── Draw all 12 palace cells ───────────────────────────────────────────
    for (const [branch, [row, col]] of Object.entries(BRANCH_POS)) {
      const palace = byBranch[branch];
      if (!palace) continue;
      drawPalace(col * CELL, row * CELL, palace, branch === lifePalaceBranch);
    }

  }, [houses, lifePalaceBranch, personName, lunarDate, hourBranch, gender, fiveElementBureau, lifeStemBranch]);

  return (
    <div className="flex justify-center">
      <canvas ref={ref} style={{ maxWidth: '100%', display: 'block' }} />
    </div>
  );
}

export default ZiweiChartCanvas;
