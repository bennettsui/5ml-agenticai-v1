/**
 * Ziwei Doushu Data Conversion Utilities
 * Converts between frontend format and API format
 */

import { ChartLayer, PalaceState, StarInstance, HuaType } from '@/types/ziwei';

// 60-year Jiazi (甲子) cycle starting from 1924
const JIAZI_CYCLE = [
  // 1924-1933
  '甲子', '乙丑', '丙寅', '丁卯', '戊辰', '己巳', '庚午', '辛未', '壬申', '癸酉',
  // 1934-1943
  '甲戌', '乙亥', '丙子', '丁丑', '戊寅', '己卯', '庚辰', '辛巳', '壬午', '癸未',
  // 1944-1953
  '甲申', '乙酉', '丙戌', '丁亥', '戊子', '己丑', '庚寅', '辛卯', '壬辰', '癸巳',
  // 1954-1963
  '甲午', '乙未', '丙申', '丁酉', '戊戌', '己亥', '庚子', '辛丑', '壬寅', '癸卯',
  // 1964-1973
  '甲辰', '乙巳', '丙午', '丁未', '戊申', '己酉', '庚戌', '辛亥', '壬子', '癸丑',
  // 1974-1983
  '甲寅', '乙卯', '丙辰', '丁巳', '戊午', '己未', '庚申', '辛酉', '壬戌', '癸亥',
];

// Hour mappings (0-23 military time to 12 earthly branches)
const HOUR_BRANCHES = [
  '子', '子', // 0-1 (23:00-1:00)
  '丑', '丑', // 2-3 (1:00-3:00)
  '寅', '寅', // 4-5 (3:00-5:00)
  '卯', '卯', // 6-7 (5:00-7:00)
  '辰', '辰', // 8-9 (7:00-9:00)
  '巳', '巳', // 10-11 (9:00-11:00)
  '午', '午', // 12-13 (11:00-13:00)
  '未', '未', // 14-15 (13:00-15:00)
  '申', '申', // 16-17 (15:00-17:00)
  '酉', '酉', // 18-19 (17:00-19:00)
  '戌', '戌', // 20-21 (19:00-21:00)
  '亥', '亥', // 22-23 (21:00-23:00)
];

// Palace ID mappings (Chinese name to ID)
const PALACE_ID_MAP: Record<string, string> = {
  '命宮': 'ming',
  '兄弟宮': 'xiongdi',
  '夫妻宮': 'fuqi',
  '子女宮': 'zinv',
  '財帛宮': 'caibao',
  '疾厄宮': 'jie',
  '遷移宮': 'qianyi',
  '交友宮': 'jiaoyu',
  '官祿宮': 'guanlu',
  '田宅宮': 'tianzhai',
  '福德宮': 'fude',
  '父母宮': 'fumu',
};

// Transformation type conversion (API format to frontend format)
function convertTransformationType(apiType: string): HuaType | null {
  const mapping: Record<string, HuaType> = {
    'hua_lu': 'lu',
    'hua_quan': 'quan',
    'hua_ke': 'ke',
    'hua_ji': 'ji',
  };
  return mapping[apiType] || null;
}

// Star ID generation from star name
function getStarId(starName: string): string {
  // Remove the 星 suffix if present
  const clean = starName.replace(/星$/, '');
  // Convert to pinyin-like ID (simplified version)
  return clean.toLowerCase();
}

/**
 * Get year stem and branch from Gregorian year
 * Based on 60-year Jiazi cycle starting from 1924
 */
export function getYearStemBranch(gregorianYear: number): {
  year_stem: string;
  year_branch: string;
} {
  const cycleIndex = (gregorianYear - 1924) % 60;
  const stemBranchPair = JIAZI_CYCLE[cycleIndex];

  if (!stemBranchPair) {
    throw new Error(`Cannot determine stem-branch for year ${gregorianYear}`);
  }

  return {
    year_stem: stemBranchPair[0],
    year_branch: stemBranchPair[1],
  };
}

/**
 * Get hour branch from 24-hour format
 * Each hour branch covers 2 hours
 */
export function getHourBranch(hour: number): string {
  if (hour < 0 || hour > 23) {
    throw new Error(`Invalid hour: ${hour}`);
  }
  return HOUR_BRANCHES[hour];
}

/**
 * Convert frontend BirthData to API format
 */
export function convertBirthDataToAPI(birthData: any): {
  year_stem: string;
  year_branch: string;
  lunar_month: number;
  lunar_day: number;
  hour_branch: string;
  gender: string;
  name?: string;
  location?: string;
} {
  const { year_stem, year_branch } = getYearStemBranch(
    birthData.yearGregorian
  );
  const hour_branch = getHourBranch(birthData.hour);

  return {
    year_stem,
    year_branch,
    lunar_month: birthData.monthLunar,
    lunar_day: birthData.dayLunar,
    hour_branch,
    gender: birthData.gender || 'M',
    name: birthData.name,
    location: birthData.location,
  };
}

/**
 * Convert API response to ChartLayer format
 */
export function convertAPIResponseToChartLayer(apiChart: any): ChartLayer {
  const palaces: PalaceState[] = apiChart.palaces.map((palace: any) => {
    const stars: StarInstance[] = [];

    // Add Ziwei star if present
    if (palace.ziwei_star) {
      stars.push({
        starId: getStarId(palace.ziwei_star),
        magnitude: 3, // Major star
        hua: palace.transformations?.[palace.ziwei_star?.replace(/星$/, '')]
          ? [convertTransformationType(palace.transformations[palace.ziwei_star?.replace(/星$/, '')])!].filter(Boolean)
          : undefined,
      });
    }

    // Add Tianfu star if present
    if (palace.tianfu_star) {
      stars.push({
        starId: getStarId(palace.tianfu_star),
        magnitude: 3, // Major star
        hua: palace.transformations?.[palace.tianfu_star?.replace(/星$/, '')]
          ? [convertTransformationType(palace.transformations[palace.tianfu_star?.replace(/星$/, '')])!].filter(Boolean)
          : undefined,
      });
    }

    // Add major stars
    if (palace.major_stars && Array.isArray(palace.major_stars)) {
      palace.major_stars.forEach((starName: string) => {
        stars.push({
          starId: getStarId(starName),
          magnitude: 2, // Medium importance
          hua: palace.transformations?.[starName]
            ? [convertTransformationType(palace.transformations[starName])!].filter(Boolean)
            : undefined,
        });
      });
    }

    return {
      palaceId: PALACE_ID_MAP[palace.palace_name] || palace.palace_name.toLowerCase(),
      nameZh: palace.palace_name,
      stars,
    };
  });

  return {
    layerId: 'mingpan',
    labelZh: '命盤',
    palaces,
  };
}
