import {
  StarVisualConfig,
  StarMeta,
  StarVisualStyle,
  MagnitudeVisualRule,
  HuaBadgeStyle,
  HuaType,
} from '@/types/ziwei';

/**
 * Default visual configuration for Ziwei stars
 * Includes 10 example stars and reasonable styling rules
 */

// ============================================================
// STAR METADATA
// ============================================================

const starMetadata: Record<string, StarMeta> = {
  ziwei: {
    id: 'ziwei',
    nameZh: '紫微星',
    nameEn: 'Zi Wei',
    category: 'main',
  },
  tianfu: {
    id: 'tianfu',
    nameZh: '天府星',
    nameEn: 'Tian Fu',
    category: 'main',
  },
  tanlang: {
    id: 'tanlang',
    nameZh: '貪狼星',
    nameEn: 'Tan Lang',
    category: 'main',
  },
  pojun: {
    id: 'pojun',
    nameZh: '破軍星',
    nameEn: 'Po Jun',
    category: 'main',
  },
  taiyang: {
    id: 'taiyang',
    nameZh: '太陽星',
    nameEn: 'Tai Yang',
    category: 'main',
  },
  jumen: {
    id: 'jumen',
    nameZh: '巨門星',
    nameEn: 'Ju Men',
    category: 'main',
  },
  tianjie: {
    id: 'tianjie',
    nameZh: '天機星',
    nameEn: 'Tian Ji',
    category: 'main',
  },
  wenqu: {
    id: 'wenqu',
    nameZh: '文曲星',
    nameEn: 'Wen Qu',
    category: 'assist',
  },
  wenxing: {
    id: 'wenxing',
    nameZh: '文昌星',
    nameEn: 'Wen Chang',
    category: 'assist',
  },
  lian: {
    id: 'lian',
    nameZh: '廉貞星',
    nameEn: 'Lian Zhen',
    category: 'main',
  },
  jiufu: {
    id: 'jiufu',
    nameZh: '九符星',
    nameEn: 'Jiu Fu',
    category: 'minor',
  },
  youbi: {
    id: 'youbi',
    nameZh: '右弼星',
    nameEn: 'You Bi',
    category: 'assist',
  },
};

// ============================================================
// CATEGORY STYLES
// ============================================================

const categoryStyles: Record<'main' | 'assist' | 'minor', StarVisualStyle> = {
  main: {
    baseColorVar: '--star-main',
    chipShape: 'pill',
    borderStyle: 'solid',
    size: 'md',
  },
  assist: {
    baseColorVar: '--star-assist',
    chipShape: 'circle',
    borderStyle: 'dashed',
    size: 'sm',
  },
  minor: {
    baseColorVar: '--star-minor',
    chipShape: 'circle',
    borderStyle: 'none',
    size: 'sm',
  },
};

// ============================================================
// MAGNITUDE RULES
// ============================================================

const magnitudeRules: MagnitudeVisualRule[] = [
  { level: 1, colorVar: '--mag-l1', glowIntensity: 0 },    // 弱 (weak)
  { level: 2, colorVar: '--mag-l2', glowIntensity: 0.3 },  // 平 (neutral)
  { level: 3, colorVar: '--mag-l3', glowIntensity: 0.6 },  // 旺 (strong)
  { level: 4, colorVar: '--mag-l4', glowIntensity: 1 },    // 極端 (extreme)
];

// ============================================================
// HUA BADGES (FOUR TRANSFORMATIONS)
// ============================================================

const huaBadges: Record<HuaType, HuaBadgeStyle> = {
  lu: {
    id: 'lu',
    label: '祿',
    colorVar: '--hua-lu',
  },
  quan: {
    id: 'quan',
    label: '權',
    colorVar: '--hua-quan',
  },
  ke: {
    id: 'ke',
    label: '科',
    colorVar: '--hua-ke',
  },
  ji: {
    id: 'ji',
    label: '忌',
    colorVar: '--hua-ji',
  },
};

// ============================================================
// VISIBILITY RULE
// ============================================================

const shouldShowInOverview = (params: {
  starId: string;
  category: 'main' | 'assist' | 'minor';
  magnitude: 1 | 2 | 3 | 4;
  huaTypes: HuaType[];
}): boolean => {
  // Always show main stars
  if (params.category === 'main') return true;
  // Show assist stars only if magnitude >= 2
  if (params.category === 'assist') return params.magnitude >= 2;
  // Hide minor stars in overview
  if (params.category === 'minor') return false;
  return false;
};

// ============================================================
// EXPORT DEFAULT CONFIG
// ============================================================

export const defaultStarVisualConfig: StarVisualConfig = {
  starMeta: starMetadata,
  categoryStyles,
  magnitudeRules,
  huaBadges,
  shouldShowInOverview,
};
