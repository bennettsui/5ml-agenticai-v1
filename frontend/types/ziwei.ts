/**
 * Ziwei Doushu (紫微斗數) Type Definitions
 * Base types for natal chart (命盤) data and visualization
 */

// ============================================================
// STAR DEFINITIONS
// ============================================================

export interface StarMeta {
  /** Unique identifier: 'ziwei', 'tianfu', 'tanlang', etc. */
  id: string;
  /** Chinese name: '紫微星', '天府星', etc. */
  nameZh: string;
  /** English transliteration or translation */
  nameEn: string;
  /** Star category: main stars, assist stars, minor/auxiliary stars */
  category: 'main' | 'assist' | 'minor';
}

/**
 * Magnitude level: how strong the star is in this palace
 * 1 = 弱 (weak), 2 = 平 (neutral), 3 = 旺 (strong), 4 = 極端 (extreme)
 */
export type StarMagnitudeLevel = 1 | 2 | 3 | 4;

/**
 * Four Transformations (四化) types
 * 祿 = wealth/prosperity
 * 權 = power/authority
 * 科 = luck/talent
 * 忌 = challenge/obstacle
 */
export type HuaType = 'lu' | 'quan' | 'ke' | 'ji';

export interface HuaBadgeStyle {
  id: HuaType;
  /** Display label: '祿', '權', '科', '忌' */
  label: string;
  /** CSS variable name for color, e.g. '--hua-lu' */
  colorVar: string;
}

export interface StarVisualStyle {
  /** CSS variable for base color, e.g. '--star-main-color' */
  baseColorVar: string;
  /** Shape of star chip: circle or pill-shaped */
  chipShape: 'circle' | 'pill';
  /** Border style: solid, dashed, or none */
  borderStyle: 'solid' | 'dashed' | 'none';
  /** Size: small, medium, large */
  size: 'sm' | 'md' | 'lg';
}

export interface MagnitudeVisualRule {
  level: StarMagnitudeLevel;
  /** CSS variable for magnitude color */
  colorVar: string;
  /** Glow intensity: 0 to 1 */
  glowIntensity: number;
}

export interface StarVisualConfig {
  /** Metadata for all stars in the system */
  starMeta: Record<string, StarMeta>;
  /** Visual styles by category */
  categoryStyles: Record<'main' | 'assist' | 'minor', StarVisualStyle>;
  /** Rules for magnitude-based styling */
  magnitudeRules: MagnitudeVisualRule[];
  /** Hua badge styles */
  huaBadges: Record<HuaType, HuaBadgeStyle>;
  /**
   * Determine if a star should be visible in palace overview
   * Main stars: always shown
   * Assist stars: only if magnitude >= 2
   * Minor stars: hidden in overview
   */
  shouldShowInOverview: (params: {
    starId: string;
    category: StarMeta['category'];
    magnitude: StarMagnitudeLevel;
    huaTypes: HuaType[];
  }) => boolean;
}

// ============================================================
// PALACE & CHART DEFINITIONS
// ============================================================

export interface StarInstance {
  /** Reference to star metadata */
  starId: string;
  /** How strong this star is in this palace */
  magnitude: StarMagnitudeLevel;
  /** Four Transformations affecting this star (optional) */
  hua?: HuaType[];
}

export interface MainMetric {
  label: string;
  value: number;
  max: number;
}

export interface PalaceState {
  /** Unique palace ID: 'ming' (命), 'cai' (財), 'guan' (官), etc. */
  palaceId: string;
  /** Chinese palace name: '命宮', '財帛宮', etc. */
  nameZh: string;
  /** English name (optional) */
  nameEn?: string;
  /** Optional metric to display in footer (e.g., luck level, compatibility) */
  mainMetric?: MainMetric;
  /** Stars in this palace, ordered by importance */
  stars: StarInstance[];
}

export interface ChartLayer {
  /** Layer ID: 'mingpan' for natal chart, potentially 'sanyuansizheng' for other layers */
  layerId: 'mingpan';
  /** Display label: '命盤' */
  labelZh: string;
  /** All 12 palaces */
  palaces: PalaceState[];
}

// ============================================================
// BIRTH DATA & CHART META
// ============================================================

export interface BirthData {
  /** Gregorian year (YYYY) */
  yearGregorian: number;
  /** Lunar month (1-12) */
  monthLunar: number;
  /** Lunar day (1-30) */
  dayLunar: number;
  /** Birth hour (0-23, Gregorian time) */
  hour: number;
  /** Location: city or coordinates */
  location?: string;
  /** Gender: 'M' or 'F' (affects palace meanings) */
  gender?: 'M' | 'F';
  /** Name (optional) */
  name?: string;
}

export interface NatalChart {
  /** Birth information */
  birth: BirthData;
  /** Main chart layer (命盤) */
  layer: ChartLayer;
  /** Calculated at timestamp */
  calculatedAt: number;
  /** Generation/version identifier */
  version?: string;
}

// ============================================================
// UI STATE
// ============================================================

export type ZiweiTab = 'generation' | 'analysis' | 'reference' | 'predictions';

export interface PalaceCardState {
  /** Which palace this card represents */
  palace: PalaceState;
  /** Is card currently hovered (for glow effect) */
  isHovered?: boolean;
  /** Selected star chip (for detail view) */
  selectedStarId?: string;
}
