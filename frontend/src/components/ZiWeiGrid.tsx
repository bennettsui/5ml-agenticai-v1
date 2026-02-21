'use client';

import React, { useMemo } from 'react';
import { ChartLayer, PalaceState, StarVisualConfig } from '@/types/ziwei';
import { PalaceCard } from './PalaceCard';
import '@/styles/ziwei-theme.css';

interface ZiWeiGridProps {
  layer: ChartLayer;
  visualConfig: StarVisualConfig;
  onStarClick?: (palaceId: string, starId: string) => void;
}

/**
 * ZiWeiGrid Component — Traditional Rectangular 4×4 Birth Chart (命盤)
 *
 * Branch positions are FIXED in the grid. Palace names (命宮, 財帛宮, …)
 * rotate based on the life palace calculation.
 *
 * Layout (branch → grid position):
 * ┌──────┬──────┬──────┬──────┐
 * │  巳  │  午  │  未  │  申  │  ← Row 1 (top)
 * ├──────┼──────┼──────┼──────┤
 * │  辰  │      CENTER      │  酉  │  ← Row 2
 * ├──────┤  (2×2 center)  ├──────┤
 * │  卯  │                │  戌  │  ← Row 3
 * ├──────┼──────┼──────┼──────┤
 * │  寅  │  丑  │  子  │  亥  │  ← Row 4 (bottom)
 * └──────┴──────┴──────┴──────┘
 */

// FIXED: Branch → grid position (traditional rectangular Ziwei layout)
const BRANCH_GRID_MAP: Record<string, { row: number; col: number }> = {
  // Top row (left to right)
  '巳': { row: 1, col: 1 },
  '午': { row: 1, col: 2 },
  '未': { row: 1, col: 3 },
  '申': { row: 1, col: 4 },
  // Right column
  '酉': { row: 2, col: 4 },
  '戌': { row: 3, col: 4 },
  // Bottom row (right to left)
  '亥': { row: 4, col: 4 },
  '子': { row: 4, col: 3 },
  '丑': { row: 4, col: 2 },
  '寅': { row: 4, col: 1 },
  // Left column
  '卯': { row: 3, col: 1 },
  '辰': { row: 2, col: 1 },
};

export const ZiWeiGrid: React.FC<ZiWeiGridProps> = ({
  layer,
  visualConfig,
  onStarClick,
}) => {
  // Build a map of branch → palace for O(1) lookup
  const branchToPalace = useMemo(() => {
    const map: Record<string, PalaceState> = {};
    layer.palaces.forEach((palace) => {
      if (palace.branch) {
        map[palace.branch] = palace;
      }
    });
    return map;
  }, [layer.palaces]);

  // Derive life-palace info for the center strip
  const lifePalace = useMemo(
    () => layer.palaces.find((p) => p.isLifePalace),
    [layer.palaces]
  );

  // Collect ordered cells (12 branches in grid order)
  const gridCells = useMemo(() => {
    return Object.entries(BRANCH_GRID_MAP).map(([branch, pos]) => ({
      branch,
      palace: branchToPalace[branch] ?? null,
      ...pos,
    }));
  }, [branchToPalace]);

  return (
    <div className="ziwei-grid-container" role="region" aria-label="Ziwei Natal Chart">
      <div className="ziwei-grid">
        {/* ── 12 Palace Cells ── */}
        {gridCells.map(({ branch, palace, row, col }) => (
          <div
            key={branch}
            style={{ gridRow: row, gridColumn: col }}
          >
            {palace ? (
              <PalaceCard
                palace={palace}
                visualConfig={visualConfig}
                onStarClick={(starId) =>
                  onStarClick?.(palace.palaceId, starId)
                }
              />
            ) : (
              <EmptyPalaceCell branch={branch} />
            )}
          </div>
        ))}

        {/* ── Centre 2×2 — Birth Info ── */}
        <div
          style={{
            gridRow: '2 / 4',
            gridColumn: '2 / 4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CentralInfoStrip lifePalace={lifePalace} />
        </div>

        {/* ── SVG Overlay — decorative structure lines ── */}
        <svg
          className="ziwei-grid__overlay"
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          viewBox="0 0 400 400"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {/* Corner accent marks on the centre box */}
          <g stroke="rgb(251 191 36 / 0.25)" strokeWidth="1.5" fill="none">
            {/* Top-left corner of centre */}
            <polyline points="100,108 100,100 108,100" />
            {/* Top-right corner of centre */}
            <polyline points="292,108 292,100 300,100" />
            {/* Bottom-left corner of centre */}
            <polyline points="100,292 100,300 108,300" />
            {/* Bottom-right corner of centre */}
            <polyline points="292,292 292,300 300,300" />
          </g>

          {/* Thin horizontal divider inside centre */}
          <line
            x1="110" y1="200" x2="290" y2="200"
            stroke="rgb(251 191 36 / 0.12)"
            strokeWidth="0.75"
            strokeDasharray="4,4"
          />
        </svg>
      </div>
    </div>
  );
};

// ============================================================
// EMPTY PALACE CELL (shown when no palace data for a branch)
// ============================================================
const EmptyPalaceCell: React.FC<{ branch: string }> = ({ branch }) => (
  <div className="palace-card opacity-30 flex items-start p-2">
    <span className="text-xs text-slate-500">{branch}</span>
  </div>
);

// ============================================================
// CENTRAL INFO STRIP
// ============================================================
interface CentralInfoStripProps {
  lifePalace?: PalaceState | null;
}

const CentralInfoStrip: React.FC<CentralInfoStripProps> = ({ lifePalace }) => {
  const palaceStemBranch = lifePalace?.stemBranch ?? '—';
  const palaceName = lifePalace?.nameZh ?? '命宮';

  // Find the 命主 star (主星 in life palace)
  const lifeMainStar = lifePalace?.stars.find((s) => s.magnitude >= 3);
  const lifeStarDisplay = lifeMainStar?.starId ?? '—';

  return (
    <div className="palace-card w-full h-full flex flex-col items-center justify-center gap-3 p-4 text-center">
      {/* Title */}
      <div>
        <div className="text-amber-400 font-bold text-base tracking-wider">命盤</div>
        <div className="text-slate-500 text-xs mt-0.5">紫微斗數</div>
      </div>

      {/* Divider */}
      <div className="w-16 h-px bg-amber-500/20" />

      {/* Life palace info */}
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">命宮干支</span>
          <span className="text-amber-300 font-mono font-semibold">{palaceStemBranch}</span>
        </div>

        {lifeMainStar && (
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">命主星</span>
            <span className="text-violet-300 font-semibold">{lifeStarDisplay}</span>
          </div>
        )}
      </div>
    </div>
  );
};

CentralInfoStrip.displayName = 'CentralInfoStrip';
EmptyPalaceCell.displayName = 'EmptyPalaceCell';

export default ZiWeiGrid;
