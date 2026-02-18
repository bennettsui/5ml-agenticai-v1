/**
 * Layer 4: Ziwei Astrology System - Type Definitions
 * 紫微斗數 (Zhongzhou School - 王亭之中州派) Type Definitions
 *
 * Comprehensive schema for birth charts, interpretations, and accuracy tracking
 */

// ============================================================================
// SECTION 1: BIRTH INFORMATION & CALENDAR
// ============================================================================

/**
 * Birth datetime and location information
 */
export interface BirthInfo {
  birth_datetime: {
    year: number;          // 1900-2100
    month: number;         // 1-12
    day: number;           // 1-31
    hour: number;          // 0-23 (24-hour format)
    minute: number;        // 0-59
  };
  calendar_type: 'gregorian' | 'lunar';  // 陽曆 or 陰曆
  location: {
    city?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;    // e.g., 'Asia/Taipei', 'Asia/Hong_Kong'
  };
  gender: 'male' | 'female';
  is_daylight_saving?: boolean;
}

// ============================================================================
// SECTION 2: PALACE & HOUSE INFORMATION
// ============================================================================

/**
 * 十二宮 (12 Palaces)
 */
export enum Palace {
  MING = 'ming',              // 命宮 (Life)
  XIONGDI = 'xiongdi',        // 兄弟宮 (Siblings)
  FUQI = 'fuqi',              // 夫妻宮 (Spouse)
  ZINV = 'zinv',              // 子女宮 (Children)
  CAIBAI = 'caibai',          // 財帛宮 (Wealth)
  JIEHE = 'jiehe',            // 疾厄宮 (Health/Disease)
  QIANYI = 'qianyi',          // 遷移宮 (Travel/Migration)
  PUYI = 'puyi',              // 僕役宮 (Servants/Subordinates)
  GUANLU = 'guanlu',          // 官祿宮 (Career/Authority)
  TIANZHAI = 'tianzhai',      // 田宅宮 (Property)
  FUDE = 'fude',              // 福德宮 (Fortune/Blessings)
  FUMU = 'fumu'               // 父母宮 (Parents)
}

/**
 * Five Elements 五行
 */
export enum Element {
  METAL = 'metal',        // 金
  WOOD = 'wood',          // 木
  WATER = 'water',        // 水
  FIRE = 'fire',          // 火
  EARTH = 'earth'         // 土
}

/**
 * Five Phases / Lunaion Age 納音五行
 */
export enum NaYinElement {
  METAL_METAL = 'metal_metal',          // 金
  METAL_WATER = 'metal_water',          // 金
  WOOD_WOOD = 'wood_wood',              // 木
  WOOD_FIRE = 'wood_fire',              // 木
  WATER_WATER = 'water_water',          // 水
  WATER_GOLD = 'water_gold',            // 水
  FIRE_FIRE = 'fire_fire',              // 火
  FIRE_SOIL = 'fire_soil',              // 火
  EARTH_EARTH = 'earth_earth',          // 土
  EARTH_GOLD = 'earth_gold'             // 土
}

/**
 * Four Pillars Stems & Branches (Heavenly Stems & Earthly Branches)
 */
export enum HeavenlyStem {
  JIA = 'jia',    // 甲
  YI = 'yi',      // 乙
  BING = 'bing',  // 丙
  DING = 'ding',  // 丁
  WU = 'wu',      // 戊
  JI = 'ji',      // 己
  GENG = 'geng',  // 庚
  XIN = 'xin',    // 辛
  REN = 'ren',    // 壬
  GUI = 'gui'     // 癸
}

export enum EarthlyBranch {
  ZI = 'zi',       // 子 (Rat)
  CHOU = 'chou',   // 丑 (Ox)
  YIN = 'yin',     // 寅 (Tiger)
  MAO = 'mao',     // 卯 (Rabbit)
  CHEN = 'chen',   // 辰 (Dragon)
  SI = 'si',       // 巳 (Snake)
  WU = 'wu',       // 午 (Horse)
  WEI = 'wei',     // 未 (Goat)
  SHEN = 'shen',   // 申 (Monkey)
  YOU = 'you',     // 酉 (Rooster)
  XU = 'xu',       // 戌 (Dog)
  HAI = 'hai'      // 亥 (Pig)
}

/**
 * Palace Stem-Branch information
 */
export interface PalaceInfo {
  palace: Palace;
  heavenly_stem: HeavenlyStem;
  earthly_branch: EarthlyBranch;
  element: Element;
  na_yin_element: NaYinElement;
}

// ============================================================================
// SECTION 3: STARS & LUMINARIES
// ============================================================================

/**
 * Star brightness levels in a palace (廟旺平陷)
 */
export enum StarBrightness {
  MIAO = 'miao',      // 廟 (Temple - Strong, auspicious)
  WANG = 'wang',      // 旺 (Prosperous)
  PING = 'ping',      // 平 (Balanced/Neutral)
  XIAN = 'xian',      // 閒 (Idle)
  XIAN_LI = 'xian_li',  // 閒(里) (Idle-detriment)
  XIA = 'xia',        // 陷 (Trapped - Weak, inauspicious)
  WANG_XIANG = 'wang_xiang'  // 旺鄉 (Secondary prosperity)
}

/**
 * 十四主星 (14 Primary Stars)
 * Core stars in Ziwei astrology system
 */
export enum PrimaryStar {
  // 紫微系 (Ziwei Group)
  ZIWEI = 'ziwei',            // 紫微
  TIANJI = 'tianji',          // 天機
  XINGLU = 'xinglu',          // 星祿
  LIANGYUE = 'liangyue',      // 廉貞

  // 宿曜系 (Nakshatra Group)
  WUQU = 'wuqu',              // 武曲
  TANLANG = 'tanlang',        // 貪狼
  JUQU = 'juqu',              // 巨門
  TIANZHU = 'tianzhu',        // 天住

  // 輔足系 (Auxiliary Group)
  JUMEN = 'jumen',            // 巨門
  YINYUE = 'yinyue',          // 陰月
  QISHA = 'qisha',            // 七殺
  POJUN = 'pojun',            // 破軍

  // Other major stars
  YOUBI = 'youbi',            // 右弼
  ZUOFU = 'zuofu'             // 左輔
}

/**
 * Secondary Stars (輔佐星)
 */
export enum SecondaryStar {
  ZUOFU = 'zuofu',            // 左輔
  YOUBI = 'youbi',            // 右弼
  WENCHANG = 'wenchang',      // 文昌
  WUXING = 'wuxing',          // 文曲
  TIANXING = 'tianxing',      // 天刑
  TIANKONG = 'tiankong',      // 天空
  LONCHI = 'lonchi',          // 龍池
  JIETAO = 'jietao'           // 劫刀
}

/**
 * Calamity Stars (煞星)
 */
export enum CalamityStar {
  HUAXING = 'huaxing',        // 化星
  HUALU = 'hualu',            // 化祿
  HUAQUAN = 'huaquan',        // 化權
  HUAKE = 'huake',            // 化科
  HUAJI = 'huaji',            // 化忌
  TIANTONG = 'tiantong',      // 天同
  TIANLIANG = 'tianliang',    // 天梁
  JIXING = 'jixing'           // 吉星
}

/**
 * Star information in a palace
 */
export interface StarInfo {
  star_name: string;
  star_type: 'primary' | 'secondary' | 'calamity' | 'miscellaneous';
  brightness_level: StarBrightness;
  is_void?: boolean;          // 空亡
  is_entering?: boolean;      // 入
  four_transformations?: FourTransformations;
}

// ============================================================================
// SECTION 4: FOUR TRANSFORMATIONS (四化)
// ============================================================================

/**
 * Four Transformations - the core divination mechanism
 * 四化: 祿 (Wealth), 權 (Power), 科 (Exam), 忌 (Disaster)
 */
export enum Transformation {
  LU = 'lu',          // 祿 (Wealth/Prosperity)
  QUAN = 'quan',      // 權 (Power/Authority)
  KE = 'ke',          // 科 (Exam/Refinement)
  JI = 'ji'           // 忌 (Disaster/Obstacle)
}

/**
 * Four Transformations information
 */
export interface FourTransformations {
  transformation_type: Transformation;
  palace_affected?: Palace;
  flowing_direction?: 'forward' | 'backward' | 'stationary';
  strength: 'strong' | 'moderate' | 'weak';
}

// ============================================================================
// SECTION 5: CHART TYPES & TIMING CYCLES
// ============================================================================

/**
 * Chart Types
 */
export enum ChartType {
  BASE = 'base',              // 本命盤 (Base chart)
  XUAN = 'xuan',              // 玄局 (Xuan configuration)
  DECADE = 'decade',          // 大限盤 (Decade luck chart)
  ANNUAL = 'annual',          // 流年盤 (Annual luck chart)
  MONTHLY = 'monthly',        // 流月盤 (Monthly luck chart)
  DAILY = 'daily',            // 流日盤 (Daily luck chart)
  HOUR = 'hour'               // 流時盤 (Hourly luck chart)
}

/**
 * Pattern / Configuration Labels (格局/星系)
 * 中州派六十星系 examples
 */
export enum Pattern {
  // Major Patterns
  SHA_PO_LANG = 'sha_po_lang',              // 殺破狼 (Killer-Breaker-Wolf)
  JI_YUE_TONG_LIANG = 'ji_yue_tong_liang',  // 機月同梁
  ZI_FU_ZHAO_YUAN = 'zi_fu_zhao_yuan',      // 紫府朝垣
  LI_ZI_JU_YANG = 'li_zi_ju_yang',          // 廉貞坐命
  TIAN_TONG_JU_MEN = 'tian_tong_ju_men',    // 天同巨門
  ZI_WU_LANG_FU = 'zi_wu_lang_fu',          // 紫微武曲

  // Other notable patterns
  JIRANG = 'jirang',                        // 機梁
  XUANXIANG = 'xuanxiang',                  // 玄象
  QISHA_POJUN = 'qisha_pojun',              // 七殺破軍

  // Disputed/minority views
  QILANG_PATTERN = 'qilang_pattern',        // 七殺貪狼 (Disputed)
  JUMEN_EXCLUSIVE = 'jumen_exclusive'       // 巨門格 (Minority view)
}

/**
 * Sixty Star Systems (六十星系) Labels
 * Used for categorizing chart configurations
 */
export enum SixtyStarSystem {
  SYSTEM_1 = 'system_1',
  SYSTEM_2 = 'system_2',
  SYSTEM_3 = 'system_3',
  // ... up to 60 systems (simplified for example)
  SYSTEM_60 = 'system_60'
}

// ============================================================================
// SECTION 6: LUCK CYCLES
// ============================================================================

/**
 * Decade Luck (大限) - 10-year periods
 * Used for long-term trend analysis
 */
export interface DecadeLuck {
  decade_number: number;          // 1, 2, 3, ... (first decade, second decade, etc.)
  age_start: number;              // Starting age
  age_end: number;                // Ending age
  palace_governing: Palace;       // 宮位
  stars_involved: StarInfo[];
  four_transformations_annual?: FourTransformations[];
  patterns_active?: Pattern[];
}

/**
 * Annual Luck (流年) - Yearly trend
 */
export interface AnnualLuck {
  year: number;
  year_stem: HeavenlyStem;
  year_branch: EarthlyBranch;
  palace_governing: Palace;
  flowing_stars: StarInfo[];
  four_transformations?: FourTransformations[];
  interaction_with_decade?: string;  // Notes on decade luck interaction
}

/**
 * Monthly Luck (流月) - Monthly trend
 */
export interface MonthlyLuck {
  month_number: number;           // 1-12
  year_context: number;
  palace_governing: Palace;
  flowing_stars: StarInfo[];
  four_transformations?: FourTransformations[];
}

/**
 * Daily Luck (流日) - Daily trend
 */
export interface DailyLuck {
  date: string;                   // YYYY-MM-DD
  day_stem: HeavenlyStem;
  day_branch: EarthlyBranch;
  palace_governing: Palace;
  flowing_stars: StarInfo[];
  four_transformations?: FourTransformations[];
}

// ============================================================================
// SECTION 7: COMPREHENSIVE BIRTH CHART
// ============================================================================

/**
 * Complete Birth Chart (命盤) - The main data structure
 */
export interface BirthChart {
  // Metadata
  id: string;
  chart_id_code: string;                  // Unique identifier for this chart
  created_at: string;                     // ISO 8601 timestamp
  updated_at: string;

  // Birth Information
  birth_info: BirthInfo;

  // Calendar System Information
  lunar_date?: {                          // If gregorian, store lunar equivalent
    year: number;
    month: number;
    day: number;
  };
  gan_zhi: {                              // 八字 (Four Pillars)
    year_pillar: {
      stem: HeavenlyStem;
      branch: EarthlyBranch;
    };
    month_pillar: {
      stem: HeavenlyStem;
      branch: EarthlyBranch;
    };
    day_pillar: {
      stem: HeavenlyStem;
      branch: EarthlyBranch;
    };
    hour_pillar: {
      stem: HeavenlyStem;
      branch: EarthlyBranch;
    };
  };

  // Base Chart (本命盤)
  base_chart: {
    palaces: PalaceInfo[];
    stars_by_palace: Map<Palace, StarInfo[]>;
    five_element_distribution: Record<Element, number>;
    ruling_element: Element;
    fundamental_pattern?: Pattern;
  };

  // Xuan Configuration (玄局)
  xuan_patterns: {
    major_patterns: Pattern[];
    sixty_star_systems: SixtyStarSystem[];
    configuration_stability: 'stable' | 'changing' | 'extreme';
    description?: string;
  };

  // Decade Luck (大限) - Multiple entries for different life stages
  decade_luck: DecadeLuck[];

  // Annual Luck (流年)
  annual_luck?: AnnualLuck[];

  // Monthly Luck (流月)
  monthly_luck?: MonthlyLuck[];

  // Daily Luck (流日)
  daily_luck?: DailyLuck[];

  // Calculation metadata
  calculation_metadata: {
    used_algorithm: 'zhongzhou_1952' | 'zhongzhou_1953' | 'zhongzhou_modern';
    time_zone_applied: string;
    daylight_saving_applied: boolean;
    precision_level: 'high' | 'medium' | 'low';
  };
}

// ============================================================================
// SECTION 8: INTERPRETATION & ANALYSIS
// ============================================================================

/**
 * Life dimension tags for interpretations
 */
export enum LifeDimension {
  PERSONALITY = 'personality',    // 性格/性質
  CAREER = 'career',              // 事業/工作
  RELATIONSHIP = 'relationship',  // 感情/婚姻
  WEALTH = 'wealth',              // 財務/財富
  HEALTH = 'health',              // 健康/身體
  FAMILY = 'family',              // 家庭/親情
  EDUCATION = 'education',        // 教育/學習
  SPIRITUALITY = 'spirituality',  // 精神/修為
  FRIENDSHIP = 'friendship',      // 友誼/人脈
  GENERAL = 'general'             // 一般運勢
}

/**
 * Life Stage markers for context
 */
export enum LifeStage {
  CHILDHOOD = 'childhood',        // 幼年 (0-12)
  ADOLESCENCE = 'adolescence',    // 青年 (12-20)
  YOUNG_ADULT = 'young_adult',    // 青壯 (20-35)
  MIDDLE_AGE = 'middle_age',      // 中年 (35-50)
  MATURE = 'mature',              // 熟年 (50-65)
  ELDER = 'elder'                 // 晚年 (65+)
}

/**
 * School / School of Thought
 */
export enum AstrologySchool {
  ZHONGZHOU = 'zhongzhou',        // 中州派 (Zhongzhou school)
  FEIXING = 'feixing',            // 飛星派 (Flying star school)
  CLASSICAL = 'classical',        // 古典派 (Classical school)
  MODERN = 'modern',              // 當代派 (Contemporary school)
  HYBRID = 'hybrid'               // 混合派 (Hybrid approach)
}

/**
 * Consensus label
 */
export enum ConsensusLevel {
  CONSENSUS = 'consensus',        // 共識 (Widely accepted)
  DISPUTED = 'disputed',          // 有爭議 (Debated)
  MINORITY_VIEW = 'minority_view' // 少數意見 (Minority opinion)
}

// ============================================================================
// SECTION 9: INTERPRETATION RULES
// ============================================================================

/**
 * Source reference for a rule (e.g., from book, blog, teacher)
 */
export interface SourceReference {
  type: 'book' | 'blog' | 'website' | 'oral_teaching' | 'academic_paper';
  author?: string;
  teacher?: string;
  work?: string;                  // e.g., 談星, 紫微斗數詳批
  publication_year?: number;
  url?: string;
  page?: string;
  school?: AstrologySchool;
  note?: string;
}

/**
 * Condition structure for a rule
 */
export interface RuleCondition {
  // Which timing level does this apply to
  scope: ChartType;

  // Star configuration
  required_stars?: PrimaryStar[];  // Must have these stars
  excluded_stars?: PrimaryStar[];  // Must NOT have these stars
  star_brightness?: StarBrightness;

  // Palace information
  palace?: Palace;
  palace_stem?: HeavenlyStem;
  palace_branch?: EarthlyBranch;

  // Four Transformations
  required_transformations?: Transformation[];
  forbidden_transformations?: Transformation[];

  // Patterns
  required_patterns?: Pattern[];

  // Time context
  time_context?: {
    min_age?: number;
    max_age?: number;
    specific_years?: number[];
    life_stage?: LifeStage;
  };
}

/**
 * Interpretation Rule (解讀規則)
 * Core data structure for encapsulating Ziwei divination knowledge
 */
export interface InterpretationRule {
  // Identity & Versioning
  id: string;                         // Unique rule ID
  version: number;                    // For tracking updates
  created_at: string;
  updated_at: string;

  // Rule Metadata
  title?: string;                     // Short title
  description?: string;               // Longer description

  // Scope & Conditions
  scope: ChartType;                   // base | xuan | decade | annual | monthly | daily
  condition: RuleCondition;

  // Interpretation Content
  interpretation: {
    zh: string;                       // Chinese interpretation (primary)
    en?: string;                      // Optional English translation
    short_form?: string;              // 1-2 sentence summary
  };

  // Categorization
  dimension_tags: LifeDimension[];    // What life aspects does this cover
  keywords?: string[];                // Searchable keywords

  // School & Consensus
  school: AstrologySchool;
  consensus_label: ConsensusLevel;

  // Source Tracking
  source_refs: SourceReference[];

  // Accuracy Tracking (for statistical evaluation)
  statistics?: {
    sample_size: number;              // Number of cases tested
    match_rate: number;               // Percentage of matches (0-1)
    confidence_level: 'high' | 'medium' | 'low';
    last_evaluated_at?: string;
    evaluation_note?: string;
  };

  // Relationships to other rules
  related_rule_ids?: string[];        // Rules that often appear together
  conflicts_with?: string[];          // Rules that contradict this one

  // Flags for system use
  is_active: boolean;                 // Enable/disable rule
  requires_human_review?: boolean;    // Flag for manual inspection
}

/**
 * Batch of related interpretation rules
 */
export interface RuleSet {
  id: string;
  name: string;
  description?: string;
  rules: InterpretationRule[];
  created_at: string;
  updated_at: string;
  school: AstrologySchool;
  coverage: {
    chart_types: ChartType[];
    life_dimensions: LifeDimension[];
  };
}

// ============================================================================
// SECTION 9: COMPREHENSIVE RULE SYSTEM (星群、格局、雜曜組合)
// ============================================================================

/**
 * Consensus level for rule reliability
 */
export enum ConsensusLabel {
  CONSENSUS = 'consensus',              // 廣泛共識
  DISPUTED = 'disputed',                // 有爭議
  MINORITY_VIEW = 'minority_view'       // 少數派
}

/**
 * Rule source reference
 */
export interface RuleSourceRef {
  type: 'web' | 'book' | 'note' | 'tradition';
  id?: string;              // e.g., 'web:81', 'book:123'
  title?: string;
  author?: string;
  url?: string;
  note?: string;
}

/**
 * Star group definition (星群)
 */
export interface StarGroup {
  groupId: string;
  stars: (string | PrimaryStar)[];
  relation?: 'same_palace' | 'tri_positional' | 'mutual_watch';  // 同宮、三方四正、互會
  description?: string;
}

/**
 * Comprehensive rule condition
 */
export interface ZiweiRuleCondition {
  scope: 'base' | 'decade' | 'annual' | 'monthly' | 'daily';  // 本命、大限、流年等
  involvedPalaces?: Palace[];
  requiredStars?: (PrimaryStar | string)[];
  excludedStars?: (PrimaryStar | string)[];

  /**
   * Star groups requirement: for fixed configurations, patterns, or combinations
   */
  starGroups?: StarGroup[];

  /**
   * Custom condition description in human language
   */
  notes?: string;

  /**
   * Afflictions or blessings (凶星、吉星)
   */
  withAffections?: boolean;  // Must have afflictions
  withBlessings?: boolean;   // Must have blessings

  /**
   * Optional palace position constraints
   */
  palacePositions?: ('zi' | 'chou' | 'yin' | 'mao' | 'chen' | 'si' | 'wu' | 'wei' | 'shen' | 'you' | 'xu' | 'hai')[];
}

/**
 * Rule statistics and confidence
 */
export interface RuleStatistics {
  sampleSize: number | null;           // Number of samples analyzed
  matchRate: number | null;             // Success/accuracy rate (0-1)
  confidence: number | null;            // Confidence level (0-1)
  lastUpdatedAt?: string;               // ISO date
}

/**
 * Comprehensive Ziwei interpretation rule
 */
export interface ZiweiRule {
  id: string;
  name: string;

  // Rule classification
  ruleType: 'star_group' | 'major_pattern' | 'complex_pattern' | 'basic_pattern' | 'miscellaneous_combo';
  scope: 'base' | 'decade' | 'annual' | 'monthly' | 'daily';

  // Condition & interpretation
  condition: ZiweiRuleCondition;
  interpretation: {
    zh: string;        // 中文解釋
    en: string;        // English explanation
    short?: string;    // Short summary
  };

  // Metadata
  dimensionTags: LifeDimension[];
  school: AstrologySchool;
  consensusLabel: ConsensusLabel;
  sources: RuleSourceRef[];

  // Statistics
  statistics: RuleStatistics;

  // Additional context
  notes?: string;
  relatedRuleIds?: string[];  // Cross-references to related rules
}

/**
 * Rule evaluation result for a given birth chart
 */
export interface RuleEvaluationResult {
  ruleId: string;
  ruleName: string;
  matched: boolean;           // Does chart match rule condition?
  matchStrength: number;      // 0-1, confidence in match
  relevantStars?: string[];   // Stars that triggered this rule
  relevantPalaces?: Palace[];  // Palaces involved
  interpretation: {
    zh?: string;
    en?: string;
  };
}

/**
 * Batch of related rules (rule set)
 */
export interface RuleEvaluationSet {
  chartId: string;
  evaluationTime: string;     // ISO timestamp
  totalRules: number;
  matchedRules: number;
  results: RuleEvaluationResult[];
  summary?: {
    dominantPatterns: string[];      // Major patterns found
    keyDimensions: LifeDimension[];
    overallTone: 'auspicious' | 'neutral' | 'challenging';
  };
}

export default {
  BirthInfo,
  BirthChart,
  InterpretationRule,
  RuleSet,
  Palace,
  Pattern,
  PrimaryStar,
  ChartType,
  LifeDimension,
  ConsensusLevel,
  AstrologySchool
};
