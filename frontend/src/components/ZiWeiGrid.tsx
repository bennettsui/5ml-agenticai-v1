'use client';

import React, { useMemo } from 'react';
import { ChartLayer, StarVisualConfig } from '@/types/ziwei';
import { PalaceCard } from './PalaceCard';
import '@/styles/ziwei-theme.css';

interface ZiWeiGridProps {
  layer: ChartLayer;
  visualConfig: StarVisualConfig;
  onStarClick?: (palaceId: string, starId: string) => void;
}

/**
 * ZiWeiGrid Component
 * Displays 12 palaces in a traditional Ziwei rectangular layout
 *
 * Layout (4x4 grid):
 * ┌────────┬─────────┬─────────┬────────┐
 * │  Top4  │  Top4   │  Top4   │  Top4  │  (4 palaces on top row)
 * ├────────┼─────────┼─────────┼────────┤
 * │ Mid3   │  CENTER │  CENTER │  Mid3  │  (3 left + 3 right + center)
 * │  (1)   │  (BIRTH │  (BIRTH │  (2)   │
 * │        │   DATA) │   DATA) │        │
 * ├────────┼─────────┼─────────┼────────┤
 * │ Mid3   │  CENTER │  CENTER │  Mid3  │  (3 left + 3 right + center)
 * │  (3)   │  (BIRTH │  (BIRTH │  (4)   │
 * │        │   DATA) │   DATA) │        │
 * ├────────┼─────────┼─────────┼────────┤
 * │  Bot4  │  Bot4   │  Bot4   │  Bot4  │  (4 palaces on bottom row)
 * └────────┴─────────┴─────────┴────────┘
 */

// Mapping of palace IDs to grid positions
// This hardcoded mapping follows the traditional Ziwei rectangular layout
const palaceGridMapping: Record<string, { row: number; col: number }> = {
  // TOP ROW
  ming: { row: 1, col: 1 },       // 命宮 (Life)
  xiongdi: { row: 1, col: 2 },    // 兄弟宮 (Siblings)
  fuqi: { row: 1, col: 3 },       // 夫妻宮 (Spouse)
  zinv: { row: 1, col: 4 },       // 子女宮 (Children)

  // SECOND ROW (LEFT & RIGHT)
  caibo: { row: 2, col: 1 },      // 財帛宮 (Wealth) - LEFT
  jixie: { row: 3, col: 1 },      // 疾厄宮 (Health) - LEFT

  qianyi: { row: 2, col: 4 },     // 遷移宮 (Travel) - RIGHT
  jiaoyou: { row: 3, col: 4 },    // 交友宮 (Friendship) - RIGHT

  // BOTTOM ROW
  guanlu: { row: 4, col: 4 },     // 官祿宮 (Career)
  tian: { row: 4, col: 3 },       // 田宅宮 (Residence)
  fude: { row: 4, col: 2 },       // 福德宮 (Virtue)
  fumu: { row: 4, col: 1 },       // 父母宮 (Parents)
};

export const ZiWeiGrid: React.FC<ZiWeiGridProps> = ({
  layer,
  visualConfig,
  onStarClick,
}) => {
  // Create a map of palaces by ID for quick lookup
  const palaceMap = useMemo(() => {
    const map: Record<string, any> = {};
    layer.palaces.forEach((palace) => {
      map[palace.palaceId] = palace;
    });
    return map;
  }, [layer.palaces]);

  // Sort palaces by grid position for rendering
  const sortedPalaces = useMemo(() => {
    return Object.entries(palaceGridMapping)
      .map(([palaceId, pos]) => ({
        palace: palaceMap[palaceId],
        ...pos,
      }))
      .filter((item) => item.palace); // Filter out unmapped palaces
  }, [palaceMap]);

  return (
    <div className="ziwei-grid-container" role="region" aria-label="Ziwei Natal Chart">
      {/* Grid Container */}
      <div className="ziwei-grid">
        {/* Render all palace cards with grid positioning */}
        {sortedPalaces.map(({ palace, row, col }) => (
          <div
            key={palace.palaceId}
            style={{
              gridRow: row,
              gridColumn: col,
            }}
          >
            <PalaceCard
              palace={palace}
              visualConfig={visualConfig}
              onStarClick={(starId) =>
                onStarClick?.(palace.palaceId, starId)
              }
            />
          </div>
        ))}

        {/* Central Info Strip - Placeholder for Birth Data */}
        <div
          style={{
            gridRow: '2 / 4',
            gridColumn: '2 / 4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CentralInfoStrip />
        </div>

        {/* SVG Overlay for Connection Lines (Future Use) */}
        <svg
          className="ziwei-grid__overlay"
          style={{ position: 'relative' }}
          viewBox="0 0 1000 562.5"
          preserveAspectRatio="none"
        >
          {/* Connection lines can be drawn here later */}
        </svg>
      </div>
    </div>
  );
};

// ============================================================
// CENTRAL INFO STRIP SUB-COMPONENT
// ============================================================

/**
 * Central Info Strip Component
 * Placeholder for birth data and basic chart information
 * Will be filled with real data in next phase
 */
const CentralInfoStrip: React.FC = () => {
  return (
    <div className="palace-card w-full h-full flex items-center justify-center p-6">
      <div className="text-center">
        <h3 className="palace-title mb-3">命盤資訊</h3>
        <div className="space-y-2 text-sm text-slate-400">
          <div>
            <span className="text-slate-500">出生年：</span>
            <span className="text-slate-300">甲子年 1984</span>
          </div>
          <div>
            <span className="text-slate-500">農曆日期：</span>
            <span className="text-slate-300">農曆12月3日</span>
          </div>
          <div>
            <span className="text-slate-500">出生時辰：</span>
            <span className="text-slate-300">亥時</span>
          </div>
          <div>
            <span className="text-slate-500">命主星：</span>
            <span className="text-amber-400 font-semibold">紫微星</span>
          </div>
        </div>
      </div>
    </div>
  );
};

CentralInfoStrip.displayName = 'CentralInfoStrip';

export default ZiWeiGrid;
