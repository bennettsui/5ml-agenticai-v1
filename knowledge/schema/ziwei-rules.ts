/**
 * Layer 4: Ziwei Astrology System - Rule Definitions & Examples
 * 紫微斗數 (Zhongzhou School) Rule Examples & Rule Structure
 *
 * Contains example interpretation rules demonstrating the consensus/dispute
 * tracking system and accuracy evaluation framework
 */

import {
  InterpretationRule,
  RuleSet,
  ChartType,
  LifeDimension,
  ConsensusLevel,
  AstrologySchool,
  Palace,
  PrimaryStar,
  Transformation,
  EarthlyBranch,
  Pattern,
  LifeStage,
  SourceReference,
  RuleCondition
} from './ziwei-types';

// ============================================================================
// EXAMPLE RULES - Zhongzhou School (王亭之中州派)
// ============================================================================

/**
 * Example Rule 1: 廉貞坐巳宮 & Career Fortune
 * 廉貞在巳 (Lianzheng in Si palace)
 *
 * Common interpretation: Indicates determination and conflict resolution ability
 * Used in: Base chart (本命盤)
 * Dimension: Career, Personality
 * Source: 王亭之《談星系列》
 */
export const RULE_LIANZHENG_SI_CAREER: InterpretationRule = {
  id: 'lz_si_career_001',
  version: 1,
  created_at: '2024-01-15',
  updated_at: '2024-01-15',
  title: '廉貞在巳 - 事業成就',
  description: '廉貞坐守巳宮時的事業運勢與性格特質',

  scope: ChartType.BASE,
  condition: {
    scope: ChartType.BASE,
    required_stars: [PrimaryStar.LIANZHENG],
    palace: Palace.SI,
    palace_branch: EarthlyBranch.SI,
  },

  interpretation: {
    zh: '廉貞居巳，性格剛毅，具有決斷力與執行力。事業上易有突破與轉變，但需警惕人際衝突。廉貞之煞氣配合巳火，易招惹是非，宜修養身心以化解。若有吉星輔佐，事業大展。',
    en: 'Lianzheng in Si indicates strong will and decisive action. Career shows breakthroughs and changes, but beware of interpersonal conflicts.',
    short_form: '廉貞在巳：決斷力強，事業有突破但需防人際衝突'
  },

  dimension_tags: [LifeDimension.CAREER, LifeDimension.PERSONALITY],
  keywords: ['廉貞', '巳宮', '決斷力', '事業', '人際'],

  school: AstrologySchool.ZHONGZHOU,
  consensus_label: ConsensusLevel.CONSENSUS,

  source_refs: [
    {
      type: 'book',
      author: '王亭之',
      work: '談星系列',
      publication_year: 1990,
      school: AstrologySchool.ZHONGZHOU,
      note: '中州派核心論著'
    },
    {
      type: 'website',
      url: 'https://xueyizone.com/share',
      teacher: '命理研究員',
      school: AstrologySchool.ZHONGZHOU
    }
  ],

  statistics: {
    sample_size: 45,
    match_rate: 0.82,
    confidence_level: 'high',
    last_evaluated_at: '2024-02-10',
    evaluation_note: '經過45個案例驗證，命中率82%，主要適用於事業轉變期'
  },

  related_rule_ids: ['tanlang_si_001', 'qisha_si_001'],
  conflicts_with: ['feixing_rule_lz_si_wealth'],
  is_active: true
};

/**
 * Example Rule 2: 太陰在巳 & Wealth Fortune (DISPUTED)
 * 太陰在巳 (Taiyin in Si palace)
 *
 * This rule shows DISPUTED consensus - different schools have different views
 * Zhongzhou: Generally auspicious for wealth
 * Feixing: More conservative, depends on other factors
 */
export const RULE_TAIYIN_SI_WEALTH_DISPUTED: InterpretationRule = {
  id: 'ty_si_wealth_002',
  version: 2,
  created_at: '2024-01-10',
  updated_at: '2024-02-14',
  title: '太陰在巳 - 財運分析 (有爭議)',
  description: '不同派別對太陰在巳的財運解讀存在差異',

  scope: ChartType.BASE,
  condition: {
    scope: ChartType.BASE,
    required_stars: [PrimaryStar.TAIYIN],
    palace: Palace.CAIBAI,  // 財帛宮
    palace_branch: EarthlyBranch.SI,
  },

  interpretation: {
    zh: '[中州派] 太陰在巳，財源不絕，但需防散財。主得祖業或女性貴人相助。若與祿星並現，財運更佳。',
    en: '[Zhongzhou School] Taiyin in Si indicates continuous wealth, but beware of overspending. Aided by ancestral fortune or helpful women.',
    short_form: '太陰在巳：財源穩定但需防散財'
  },

  dimension_tags: [LifeDimension.WEALTH, LifeDimension.FAMILY],
  keywords: ['太陰', '巳', '財運', '祖業'],

  school: AstrologySchool.ZHONGZHOU,
  consensus_label: ConsensusLevel.DISPUTED,  // ← Mark as disputed

  source_refs: [
    {
      type: 'book',
      author: '王亭之',
      work: '紫微斗數詳批',
      publication_year: 1995,
      school: AstrologySchool.ZHONGZHOU
    },
    {
      type: 'book',
      author: '盧懷孟',
      work: '飛星紫微',
      publication_year: 2005,
      school: AstrologySchool.FEIXING,
      note: '飛星派認為需配合空亡星才能確定'
    },
    {
      type: 'blog',
      url: 'https://home9000.wordpress.com',
      teacher: '飛星研究員',
      school: AstrologySchool.FEIXING
    }
  ],

  statistics: {
    sample_size: 28,
    match_rate: 0.68,
    confidence_level: 'medium',
    last_evaluated_at: '2024-02-01',
    evaluation_note: '樣本較少且準確率有限。飛星派案例與中州派有明顯差異，建議分別評估'
  },

  related_rule_ids: ['lianzheng_wealth_001'],
  conflicts_with: ['ty_si_wealth_feixing'],
  is_active: true,
  requires_human_review: true  // ← Requires review due to disputed nature
};

/**
 * Example Rule 3: 大限與流年交互作用 (Decade Luck + Annual Luck Interaction)
 * MINORITY VIEW - less widely accepted interpretation
 */
export const RULE_DECADE_ANNUAL_INTERACTION: InterpretationRule = {
  id: 'da_flow_interaction_003',
  version: 1,
  created_at: '2024-02-01',
  updated_at: '2024-02-01',
  title: '大限與流年共振現象 (少數派)',
  description: '某些特定組合中，大限與流年的同步性預示重要人生轉折',

  scope: ChartType.DECADE,
  condition: {
    scope: ChartType.DECADE,
    required_transformations: [Transformation.LU, Transformation.QUAN],
    time_context: {
      min_age: 20,
      max_age: 50,
      life_stage: LifeStage.YOUNG_ADULT
    }
  },

  interpretation: {
    zh: '[少數派觀點] 當大限與流年在同一宮位出現化祿與化權，預示該年度將有重大人生機遇與決定性轉折。此為較高級的預測技巧，需要深入理解四化流向。',
    en: '[Minority View] When decade luck and annual luck show Lu and Quan transformations in the same palace, it indicates major life opportunity and pivotal change.',
    short_form: '大限流年共振：重大轉折之年'
  },

  dimension_tags: [LifeDimension.CAREER, LifeDimension.RELATIONSHIP, LifeDimension.WEALTH],
  keywords: ['大限', '流年', '共振', '化祿', '化權', '轉折'],

  school: AstrologySchool.ZHONGZHOU,
  consensus_label: ConsensusLevel.MINORITY_VIEW,  // ← Mark as minority view

  source_refs: [
    {
      type: 'oral_teaching',
      teacher: '某位中州派老師',
      publication_year: 2010,
      school: AstrologySchool.ZHONGZHOU,
      note: '尚未見於正式出版著作，來自師傳'
    },
    {
      type: 'blog',
      url: 'https://xueyizone.com',
      teacher: '命理愛好者',
      publication_year: 2015
    }
  ],

  statistics: {
    sample_size: 8,
    match_rate: 0.75,
    confidence_level: 'low',
    last_evaluated_at: '2024-01-20',
    evaluation_note: '樣本非常有限，建議繼續收集數據。概念新穎但需更多案例驗證。'
  },

  related_rule_ids: ['lz_si_career_001'],
  conflicts_with: [],
  is_active: true,
  requires_human_review: true
};

/**
 * Example Rule 4: 紫微主星性質 (基本格局)
 * Base pattern interpretation - high consensus
 */
export const RULE_ZIWEI_MAIN_PERSONALITY: InterpretationRule = {
  id: 'ziwei_main_personality_004',
  version: 3,
  created_at: '2023-12-01',
  updated_at: '2024-02-10',
  title: '紫微主星 - 性格特質',
  description: '紫微星的基本性質與人格特徵',

  scope: ChartType.BASE,
  condition: {
    scope: ChartType.BASE,
    required_stars: [PrimaryStar.ZIWEI],
    palace: Palace.MING,  // 命宮
  },

  interpretation: {
    zh: '紫微為帝星，居命宮者具有領導氣質、責任心強。性格尊貴但易傲氣，人生運勢跌宕起伏。若廟旺，領導力強，眾星捧月；若陷落，則力不從心，易遭困頓。',
    en: 'Ziwei is the emperor star. In the Life Palace, it indicates leadership quality and strong sense of responsibility. Character is noble but prone to arrogance.',
    short_form: '紫微命宮：帝王之氣，領導特質明顯'
  },

  dimension_tags: [LifeDimension.PERSONALITY, LifeDimension.CAREER, LifeDimension.LEADERSHIP],
  keywords: ['紫微', '命宮', '領導', '帝星', '尊貴'],

  school: AstrologySchool.ZHONGZHOU,
  consensus_label: ConsensusLevel.CONSENSUS,  // ← Widely accepted

  source_refs: [
    {
      type: 'book',
      author: '王亭之',
      work: '談星系列',
      publication_year: 1988,
      school: AstrologySchool.ZHONGZHOU,
      note: '中州派經典論著'
    },
    {
      type: 'book',
      author: '鬼穀仙師',
      work: '紫微斗數全書',
      publication_year: 1982,
      school: AstrologySchool.CLASSICAL
    }
  ],

  statistics: {
    sample_size: 127,
    match_rate: 0.89,
    confidence_level: 'high',
    last_evaluated_at: '2024-02-12',
    evaluation_note: '經過大量案例驗證，命中率達89%。基本特質識別率極高。'
  },

  related_rule_ids: ['ziwei_wealth_001', 'ziwei_career_002'],
  conflicts_with: [],
  is_active: true
};

// ============================================================================
// RULE SET COLLECTION
// ============================================================================

/**
 * Complete rule set for Zhongzhou School base chart interpretation
 */
export const ZHONGZHOU_BASE_CHART_RULES: RuleSet = {
  id: 'ruleset_zhongzhou_base_001',
  name: 'Zhongzhou School - Base Chart Rules',
  description: '中州派命盤解讀規則集合 - 包含共識、有爭議、少數派看法',

  rules: [
    RULE_ZIWEI_MAIN_PERSONALITY,
    RULE_LIANZHENG_SI_CAREER,
    RULE_TAIYIN_SI_WEALTH_DISPUTED,
    RULE_DECADE_ANNUAL_INTERACTION
    // Additional rules would be added here in production
  ],

  created_at: '2024-01-01',
  updated_at: '2024-02-15',
  school: AstrologySchool.ZHONGZHOU,
  coverage: {
    chart_types: [ChartType.BASE, ChartType.XUAN],
    life_dimensions: [
      LifeDimension.PERSONALITY,
      LifeDimension.CAREER,
      LifeDimension.WEALTH,
      LifeDimension.RELATIONSHIP
    ]
  }
};

/**
 * Rule set for decade luck analysis
 */
export const ZHONGZHOU_DECADE_LUCK_RULES: RuleSet = {
  id: 'ruleset_zhongzhou_decade_001',
  name: 'Zhongzhou School - Decade Luck Rules',
  description: '大限運勢解讀規則集合',

  rules: [
    RULE_DECADE_ANNUAL_INTERACTION
    // More decade-specific rules would go here
  ],

  created_at: '2024-01-20',
  updated_at: '2024-02-15',
  school: AstrologySchool.ZHONGZHOU,
  coverage: {
    chart_types: [ChartType.DECADE, ChartType.ANNUAL],
    life_dimensions: [
      LifeDimension.CAREER,
      LifeDimension.WEALTH,
      LifeDimension.RELATIONSHIP
    ]
  }
};

/**
 * Get consensus rules only (for primary interpretations)
 */
export function getConsensusRules(rules: InterpretationRule[]): InterpretationRule[] {
  return rules.filter(rule => rule.consensus_label === ConsensusLevel.CONSENSUS);
}

/**
 * Get disputed rules (for alternative perspectives)
 */
export function getDisputedRules(rules: InterpretationRule[]): InterpretationRule[] {
  return rules.filter(rule => rule.consensus_label === ConsensusLevel.DISPUTED);
}

/**
 * Get high-accuracy rules (match_rate > threshold)
 */
export function getHighAccuracyRules(rules: InterpretationRule[], threshold: number = 0.8): InterpretationRule[] {
  return rules.filter(rule =>
    rule.statistics && rule.statistics.match_rate >= threshold
  );
}

/**
 * Get rules requiring review
 */
export function getRulesRequiringReview(rules: InterpretationRule[]): InterpretationRule[] {
  return rules.filter(rule => rule.requires_human_review === true);
}

/**
 * Get rules by life dimension
 */
export function getRulesByDimension(
  rules: InterpretationRule[],
  dimension: LifeDimension
): InterpretationRule[] {
  return rules.filter(rule => rule.dimension_tags.includes(dimension));
}

export default {
  RULE_LIANZHENG_SI_CAREER,
  RULE_TAIYIN_SI_WEALTH_DISPUTED,
  RULE_DECADE_ANNUAL_INTERACTION,
  RULE_ZIWEI_MAIN_PERSONALITY,
  ZHONGZHOU_BASE_CHART_RULES,
  ZHONGZHOU_DECADE_LUCK_RULES,
  getConsensusRules,
  getDisputedRules,
  getHighAccuracyRules,
  getRulesRequiringReview,
  getRulesByDimension
};
