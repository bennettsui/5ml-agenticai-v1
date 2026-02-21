'use client';

import React, { useMemo } from 'react';
import { PalaceState, StarVisualConfig } from '@/types/ziwei';
import '@/styles/ziwei-theme.css';

interface PalaceCardProps {
  palace: PalaceState;
  visualConfig: StarVisualConfig;
  onStarClick?: (starId: string) => void;
}

/**
 * PalaceCard Component
 * Displays a single palace (宮) with its stars, metrics, and transformations
 *
 * Structure:
 * - Header: palace name + corner icon
 * - Body: star chips (wrapped)
 * - Footer: metric bar + hidden stars count
 */
export const PalaceCard: React.FC<PalaceCardProps> = ({
  palace,
  visualConfig,
  onStarClick,
}) => {
  // Filter visible stars — show all when metadata is missing (real API data uses Chinese IDs)
  const visibleStars = useMemo(() => {
    return palace.stars.filter((star) => {
      const starMeta = visualConfig.starMeta[star.starId];
      // If no metadata, show the star anyway (real API data won't be in static config)
      if (!starMeta) return true;

      return visualConfig.shouldShowInOverview({
        starId: star.starId,
        category: starMeta.category,
        magnitude: star.magnitude,
        huaTypes: star.hua || [],
      });
    });
  }, [palace.stars, visualConfig]);

  const hiddenStarCount = palace.stars.length - visibleStars.length;

  return (
    <div
      className="palace-card"
      data-palace-id={palace.palaceId}
      data-branch={palace.branch}
      role="article"
      aria-label={`${palace.nameZh} Palace`}
    >
      {/* HEADER: Branch + Palace Title */}
      <header className="palace-card__header mb-2">
        {/* Top row: branch (left) + stem-branch (right) */}
        <div className="flex items-center justify-between mb-1">
          {palace.branch && (
            <span className="text-[10px] font-mono text-slate-400 leading-none">
              {palace.branch}
            </span>
          )}
          {palace.stemBranch && (
            <span className="text-[10px] font-mono text-slate-500 leading-none">
              {palace.stemBranch}
            </span>
          )}
        </div>
        <h3 className={`palace-title ${palace.isLifePalace ? 'text-amber-400' : ''}`}>
          {palace.nameZh}
          {palace.nameEn && (
            <span className="text-xs text-slate-500 ml-1">({palace.nameEn})</span>
          )}
        </h3>
      </header>

      {/* BODY: Star Chips */}
      <div className="palace-card__body mb-2">
        <div className="flex flex-wrap gap-1">
          {visibleStars.length > 0 ? (
            visibleStars.map((star) => {
              const starMeta = visualConfig.starMeta[star.starId];
              // Fallback for stars not in static config (Chinese-ID stars from real API)
              const effectiveMeta = starMeta ?? {
                id: star.starId,
                nameZh: star.starId,
                nameEn: '',
                category: star.magnitude >= 3 ? 'main' : star.magnitude === 2 ? 'assist' : 'minor',
              } as any;

              const categoryStyle = visualConfig.categoryStyles[effectiveMeta.category]
                ?? visualConfig.categoryStyles['minor'];
              const magRule = visualConfig.magnitudeRules.find(
                (r) => r.level === star.magnitude
              );

              return (
                <StarChip
                  key={star.starId}
                  starId={star.starId}
                  starMeta={effectiveMeta}
                  magnitude={star.magnitude}
                  hua={star.hua}
                  categoryStyle={categoryStyle}
                  magRule={magRule}
                  huaBadges={visualConfig.huaBadges}
                  palaceId={palace.palaceId}
                  onClick={() => onStarClick?.(star.starId)}
                />
              );
            })
          ) : (
            <span className="text-xs text-slate-500">—</span>
          )}
        </div>
      </div>

      {/* FOOTER: Metric Bar + Hidden Stars Count */}
      <footer className="palace-card__footer text-xs text-slate-400">
        {palace.mainMetric && (
          <div className="mb-1">
            <div className="flex justify-between mb-0.5">
              <span>{palace.mainMetric.label}</span>
              <span className="font-semibold">{palace.mainMetric.value}</span>
            </div>
            <div className="metric-bar">
              <div
                className="metric-bar__fill"
                style={{
                  width: `${(palace.mainMetric.value / palace.mainMetric.max) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {hiddenStarCount > 0 && (
          <div className="text-slate-500">
            +{hiddenStarCount} 輔星
          </div>
        )}
      </footer>
    </div>
  );
};

// ============================================================
// STAR CHIP SUB-COMPONENT
// ============================================================

interface StarChipProps {
  starId: string;
  starMeta: any;
  magnitude: 1 | 2 | 3 | 4;
  hua?: ('lu' | 'quan' | 'ke' | 'ji')[];
  categoryStyle: any;
  magRule?: any;
  huaBadges: any;
  palaceId: string;
  onClick?: () => void;
}

const StarChip: React.FC<StarChipProps> = ({
  starId,
  starMeta,
  magnitude,
  hua,
  categoryStyle,
  magRule,
  huaBadges,
  palaceId,
  onClick,
}) => {
  const chipClass = `star-chip star-chip--${categoryStyle.chipShape}`;
  const backgroundColor = magRule?.colorVar
    ? `var(${magRule.colorVar})`
    : `var(${categoryStyle.baseColorVar})`;

  return (
    <button
      className={chipClass}
      style={{
        backgroundColor,
        borderStyle: categoryStyle.borderStyle,
        borderColor: 'currentColor',
        borderWidth: categoryStyle.borderStyle === 'none' ? 0 : '1px',
        color: 'white',
      }}
      data-star-id={starId}
      data-palace-id={palaceId}
      onClick={onClick}
      title={`${starMeta.nameZh} (${starMeta.nameEn}) - Magnitude ${magnitude}`}
    >
      {/* Star Label */}
      <div className="star-label">
        <span className="star-label__zh">{starMeta.nameZh}</span>
        {categoryStyle.size !== 'sm' && (
          <span className="star-label__en">{starMeta.nameEn}</span>
        )}
      </div>

      {/* Hua Badges */}
      {hua && hua.length > 0 && (
        <div className="flex gap-0.5 ml-0.5">
          {hua.map((huaType) => {
            const huaStyle = huaBadges[huaType];
            return (
              <div
                key={huaType}
                className={`hua-badge hua-badge--${huaType}`}
                title={huaStyle.label}
              >
                {huaStyle.label}
              </div>
            );
          })}
        </div>
      )}
    </button>
  );
};

StarChip.displayName = 'StarChip';
