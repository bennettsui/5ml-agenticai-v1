import { ChartLayer, PalaceState, StarInstance } from '@/types/ziwei';

/**
 * Demo natal chart (命盤) — Bennett 甲子年 1984, 農曆12月3日, 亥時
 * Branch positions verified by Python ziwei-chart-calculator.py
 */

// Helper to create a demo star instance
const star = (
  starId: string,
  magnitude: 1 | 2 | 3 | 4,
  hua?: ('lu' | 'quan' | 'ke' | 'ji')[]
): StarInstance => ({
  starId,
  magnitude,
  hua,
});

// Create demo palaces — each with verified branch/stem from calculator
const createDemoPalaces = (): PalaceState[] => [
  {
    palaceId: 'ming',
    nameZh: '命宮', nameEn: 'Life',
    branch: '寅', stem: '丙', stemBranch: '丙寅',
    isLifePalace: true,
    mainMetric: { label: '運勢', value: 85, max: 100 },
    stars: [
      star('七殺', 3),
      star('祿存', 2),
    ],
  },
  {
    palaceId: 'xiongdi',
    nameZh: '兄弟宮', nameEn: 'Siblings',
    branch: '丑', stem: '丁', stemBranch: '丁丑',
    mainMetric: { label: '親合度', value: 70, max: 100 },
    stars: [
      star('廉貞', 3, ['lu']),
      star('貪狼', 2),
      star('擎羊', 1),
      star('左輔', 2),
      star('文曲', 2),
    ],
  },
  {
    palaceId: 'fuqi',
    nameZh: '夫妻宮', nameEn: 'Spouse',
    branch: '子', stem: '丙', stemBranch: '丙子',
    mainMetric: { label: '感情運', value: 65, max: 100 },
    stars: [
      star('太陰', 3),
    ],
  },
  {
    palaceId: 'zinv',
    nameZh: '子女宮', nameEn: 'Children',
    branch: '亥', stem: '乙', stemBranch: '乙亥',
    mainMetric: { label: '子女緣', value: 72, max: 100 },
    stars: [
      star('天府', 3),
    ],
  },
  {
    palaceId: 'caibao',
    nameZh: '財帛宮', nameEn: 'Wealth',
    branch: '戌', stem: '甲', stemBranch: '甲戌',
    mainMetric: { label: '財運', value: 78, max: 100 },
    stars: [
      star('天同', 3),
      star('巨門', 2),
    ],
  },
  {
    palaceId: 'jie',
    nameZh: '疾厄宮', nameEn: 'Health',
    branch: '酉', stem: '癸', stemBranch: '癸酉',
    mainMetric: { label: '健康度', value: 82, max: 100 },
    stars: [
      star('武曲', 3, ['ke']),
      star('天相', 2),
      star('天鉞', 2),
    ],
  },
  {
    palaceId: 'qianyi',
    nameZh: '遷移宮', nameEn: 'Travel',
    branch: '申', stem: '壬', stemBranch: '壬申',
    mainMetric: { label: '遠行運', value: 68, max: 100 },
    stars: [
      star('太陽', 3, ['ji']),
      star('天梁', 2),
      star('天馬', 2),
    ],
  },
  {
    palaceId: 'jiaoyu',
    nameZh: '交友宮', nameEn: 'Friendship',
    branch: '未', stem: '辛', stemBranch: '辛未',
    mainMetric: { label: '友誼運', value: 75, max: 100 },
    stars: [
      star('鈴星', 2),
    ],
  },
  {
    palaceId: 'guanlu',
    nameZh: '官祿宮', nameEn: 'Career',
    branch: '午', stem: '庚', stemBranch: '庚午',
    mainMetric: { label: '事業運', value: 80, max: 100 },
    stars: [
      star('天機', 3),
      star('地劫', 2),
    ],
  },
  {
    palaceId: 'tianzhai',
    nameZh: '田宅宮', nameEn: 'Residence',
    branch: '巳', stem: '己', stemBranch: '己巳',
    mainMetric: { label: '置產運', value: 60, max: 100 },
    stars: [
      star('紫微', 3),
      star('右弼', 2),
      star('文昌', 2),
    ],
  },
  {
    palaceId: 'fude',
    nameZh: '福德宮', nameEn: 'Virtue',
    branch: '辰', stem: '戊', stemBranch: '戊辰',
    mainMetric: { label: '福報', value: 88, max: 100 },
    stars: [
      star('地空', 2),
    ],
  },
  {
    palaceId: 'fumu',
    nameZh: '父母宮', nameEn: 'Parents',
    branch: '卯', stem: '丁', stemBranch: '丁卯',
    mainMetric: { label: '親情運', value: 76, max: 100 },
    stars: [
      star('破軍', 3, ['quan']),
      star('陀羅', 1),
      star('天魁', 2),
      star('火星', 2),
    ],
  },
];

/**
 * Demo natal chart layer — Bennett 甲子年 1984
 */
export const demoNatalLayer: ChartLayer = {
  layerId: 'mingpan',
  labelZh: '命盤',
  palaces: createDemoPalaces(),
};

/**
 * Demo birth data for testing
 */
export const demoBirthData = {
  yearGregorian: 1984,
  monthLunar: 12,
  dayLunar: 3,
  hour: 21,
  location: 'Hong Kong',
  gender: 'M' as const,
  name: '示例',
};
