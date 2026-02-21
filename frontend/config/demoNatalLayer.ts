import { ChartLayer, PalaceState, StarInstance } from '@/types/ziwei';

/**
 * Demo natal chart (命盤) with 12 palaces
 * This is fake data for UI testing. In production, this will be replaced
 * with real calculated data from the backend.
 */

// Palace IDs and names in traditional Ziwei order
const palaceNames: Record<string, { nameZh: string; nameEn?: string }> = {
  ming: { nameZh: '命宮', nameEn: 'Life' },
  xiongdi: { nameZh: '兄弟宮', nameEn: 'Siblings' },
  fuqi: { nameZh: '夫妻宮', nameEn: 'Spouse' },
  zinv: { nameZh: '子女宮', nameEn: 'Children' },
  caibo: { nameZh: '財帛宮', nameEn: 'Wealth' },
  jixie: { nameZh: '疾厄宮', nameEn: 'Health' },
  qianyi: { nameZh: '遷移宮', nameEn: 'Travel' },
  jiaoyou: { nameZh: '交友宮', nameEn: 'Friendship' },
  guanlu: { nameZh: '官祿宮', nameEn: 'Career' },
  tian: { nameZh: '田宅宮', nameEn: 'Residence' },
  fude: { nameZh: '福德宮', nameEn: 'Virtue' },
  fumu: { nameZh: '父母宮', nameEn: 'Parents' },
};

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

// Create demo palaces with varying numbers of stars
const createDemoPalaces = (): PalaceState[] => [
  {
    palaceId: 'ming',
    ...palaceNames.ming,
    mainMetric: { label: '運勢', value: 85, max: 100 },
    stars: [
      star('ziwei', 3, ['lu']),
      star('youbi', 2),
      star('wenqu', 2),
    ],
  },
  {
    palaceId: 'xiongdi',
    ...palaceNames.xiongdi,
    mainMetric: { label: '親合度', value: 70, max: 100 },
    stars: [
      star('tanlang', 2),
      star('wenxing', 1),
    ],
  },
  {
    palaceId: 'fuqi',
    ...palaceNames.fuqi,
    mainMetric: { label: '感情運', value: 65, max: 100 },
    stars: [
      star('tianfu', 3, ['quan']),
      star('jiaonu', 2),
    ],
  },
  {
    palaceId: 'zinv',
    ...palaceNames.zinv,
    mainMetric: { label: '子女緣', value: 72, max: 100 },
    stars: [
      star('pojun', 2, ['ji']),
      star('lian', 1),
    ],
  },
  {
    palaceId: 'caibo',
    ...palaceNames.caibo,
    mainMetric: { label: '財運', value: 78, max: 100 },
    stars: [
      star('taiyang', 3),
      star('youbi', 2, ['lu']),
      star('jiufu', 1),
    ],
  },
  {
    palaceId: 'jixie',
    ...palaceNames.jixie,
    mainMetric: { label: '健康度', value: 82, max: 100 },
    stars: [
      star('tianjie', 2),
      star('wenqu', 1),
    ],
  },
  {
    palaceId: 'qianyi',
    ...palaceNames.qianyi,
    mainMetric: { label: '遠行運', value: 68, max: 100 },
    stars: [
      star('jumen', 2, ['ke']),
      star('lian', 2),
    ],
  },
  {
    palaceId: 'jiaoyou',
    ...palaceNames.jiaoyou,
    mainMetric: { label: '友誼運', value: 75, max: 100 },
    stars: [
      star('wenxing', 3),
      star('youbi', 1),
    ],
  },
  {
    palaceId: 'guanlu',
    ...palaceNames.guanlu,
    mainMetric: { label: '事業運', value: 80, max: 100 },
    stars: [
      star('tianjie', 3, ['lu', 'quan']),
      star('wenqu', 2),
      star('jiufu', 1),
    ],
  },
  {
    palaceId: 'tian',
    ...palaceNames.tian,
    mainMetric: { label: '置產運', value: 60, max: 100 },
    stars: [
      star('pojun', 2),
      star('lian', 2, ['ji']),
    ],
  },
  {
    palaceId: 'fude',
    ...palaceNames.fude,
    mainMetric: { label: '福報', value: 88, max: 100 },
    stars: [
      star('tianfu', 3, ['quan']),
      star('wenxing', 2, ['ke']),
      star('youbi', 1),
    ],
  },
  {
    palaceId: 'fumu',
    ...palaceNames.fumu,
    mainMetric: { label: '親情運', value: 76, max: 100 },
    stars: [
      star('taiyang', 2, ['lu']),
      star('wenqu', 2),
    ],
  },
];

/**
 * Demo natal chart layer with 12 palaces
 * All star placements and magnitudes are fictitious
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
