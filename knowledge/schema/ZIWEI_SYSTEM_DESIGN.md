# Ziwei Astrology Backend System Design
## 紫微斗數 (Zhongzhou School - 王亭之中州派)

**Version**: 1.0
**Date**: 2024-02-18
**Status**: Design Complete - Ready for Implementation

---

## 目錄 (Table of Contents)

1. [System Overview](#system-overview)
2. [Architecture & Components](#architecture--components)
3. [Data Models](#data-models)
4. [Agent Interfaces](#agent-interfaces)
5. [Example Data Flow](#example-data-flow)
6. [Statistical Accuracy Tracking](#statistical-accuracy-tracking)
7. [Rules & Consensus](#rules--consensus)
8. [Implementation Roadmap](#implementation-roadmap)

---

## System Overview

### Purpose
Create a programmable, data-driven Ziwei Astrology system based on the **Zhongzhou School (中州派)** and **Wang Tingzhi (王亭之)** teachings. The system focuses on:
- **Accuracy tracking** via statistical evaluation
- **Transparency** in rule sourcing and versioning
- **Flexibility** to accommodate consensus, disputed, and minority views
- **Scalability** for continuous learning and improvement

### Core Principles

| Principle | Definition |
|-----------|-----------|
| **Traceable** | Every rule has documented sources (books, teachers, blogs, etc.) |
| **Falsifiable** | Rules include sample_size and match_rate for empirical validation |
| **Layered** | Supports consensus, disputed, and minority interpretations |
| **Modular** | Three independent agents can operate together or separately |
| **Extensible** | Can incorporate other schools (Feixing, Classical, etc.) |

---

## Architecture & Components

### Three-Agent Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Ziwei System                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────┐  ┌─────────────────────┐             │
│  │  ChartEngineAgent  │  │ InterpretationAgent │             │
│  │  (排盤引擎)         │  │  (解讀引擎)         │             │
│  │                    │  │                     │             │
│  │ Input: Birth data  │  │ Input: Chart +      │             │
│  │ Output: BirthChart │  │        Rules +      │             │
│  │                    │  │        Preferences  │             │
│  │ - Date conversion  │  │ Output: Segments    │             │
│  │ - Calendar systems │  │         grouped by  │             │
│  │ - Four Pillars     │  │         dimension   │             │
│  │ - Star placement   │  │                     │             │
│  │ - Timing cycles    │  │ - Rule matching     │             │
│  │ - Pattern ID       │  │ - Consensus filter  │             │
│  └────────────────────┘  │ - Accuracy filter   │             │
│           ↓               │ - Interpretation    │             │
│      BirthChart           │   generation        │             │
│           ↓               └─────────────────────┘             │
│           ↓                           ↓                       │
│           └───────────────┬───────────┘                       │
│                           ↓                                   │
│                    ┌──────────────────┐                       │
│                    │ EvaluationAgent  │                       │
│                    │ (評估引擎)        │                       │
│                    │                  │                       │
│                    │ Input: Feedback  │                       │
│                    │        + Events  │                       │
│                    │ Output: Updates  │                       │
│                    │        + Review  │                       │
│                    │          Recs    │                       │
│                    │                  │                       │
│                    │ - Map feedback   │                       │
│                    │   to rules       │                       │
│                    │ - Update stats   │                       │
│                    │ - Identify       │                       │
│                    │   review items   │                       │
│                    └──────────────────┘                       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Birth Info
    ↓
ChartEngineAgent → BirthChart (JSON)
    ↓
[Store in Database]
    ↓
InterpretationAgent (with Rules DB) → InterpretationSegments
    ↓
[Serve to User UI]
    ↓
User provides feedback + real events
    ↓
EvaluationAgent → Updated Rule Statistics
    ↓
[Update Rules in Database]
    ↓
[Improve accuracy over time]
```

---

## Data Models

### 1. Birth Chart (BirthChart)

The complete representation of an individual's Ziwei astrology chart.

**Key Sections:**

#### A. Birth Information
```typescript
birth_info: {
  birth_datetime: { year, month, day, hour, minute },
  calendar_type: 'gregorian' | 'lunar',
  location: { city?, country?, latitude?, longitude?, timezone? },
  gender: 'male' | 'female',
  is_daylight_saving?: boolean
}
```

#### B. Four Pillars (八字)
```typescript
gan_zhi: {
  year_pillar: { stem: HeavenlyStem, branch: EarthlyBranch },
  month_pillar: { stem: HeavenlyStem, branch: EarthlyBranch },
  day_pillar: { stem: HeavenlyStem, branch: EarthlyBranch },
  hour_pillar: { stem: HeavenlyStem, branch: EarthlyBranch }
}
```

**Heavenly Stems (天干):** 甲(jia), 乙(yi), 丙(bing), 丁(ding), 戊(wu), 己(ji), 庚(geng), 辛(xin), 壬(ren), 癸(gui)

**Earthly Branches (地支):** 子(zi), 丑(chou), 寅(yin), 卯(mao), 辰(chen), 巳(si), 午(wu), 未(wei), 申(shen), 酉(you), 戌(xu), 亥(hai)

#### C. Base Chart (本命盤)
```typescript
base_chart: {
  palaces: PalaceInfo[],              // 12 palaces with star positions
  stars_by_palace: Map<Palace, StarInfo[]>,
  five_element_distribution: { metal, wood, water, fire, earth },
  ruling_element: Element,
  fundamental_pattern?: Pattern
}
```

**12 Palaces (十二宮):**
- 命宮 (Ming - Life)
- 兄弟 (Xiongdi - Siblings)
- 夫妻 (Fuqi - Spouse)
- 子女 (Zinv - Children)
- 財帛 (Caibai - Wealth)
- 疾厄 (Jiehe - Health)
- 遷移 (Qianyi - Travel)
- 僕役 (Puyi - Servants/Friends)
- 官祿 (Guanlu - Career)
- 田宅 (Tianzhai - Property)
- 福德 (Fude - Fortune/Blessings)
- 父母 (Fumu - Parents)

#### D. Xuan Configuration (玄局)
```typescript
xuan_patterns: {
  major_patterns: Pattern[],           // 殺破狼, 機月同梁, 紫府朝垣, etc.
  sixty_star_systems: SixtyStarSystem[],  // 六十星系 classification
  configuration_stability: 'stable' | 'changing' | 'extreme',
  description?: string
}
```

#### E. Timing Cycles

**Decade Luck (大限) - 10-year periods:**
```typescript
decade_luck: {
  decade_number: number,       // 1st, 2nd, 3rd decade, etc.
  age_start: number,          // e.g., 0, 10, 20
  age_end: number,            // e.g., 10, 20, 30
  palace_governing: Palace,   // Which palace dominates this decade
  stars_involved: StarInfo[],
  four_transformations_annual?: FourTransformations[],
  patterns_active?: Pattern[]
}
```

**Annual Luck (流年) - Yearly trends:**
```typescript
annual_luck: {
  year: number,
  year_stem: HeavenlyStem,
  year_branch: EarthlyBranch,
  palace_governing: Palace,
  flowing_stars: StarInfo[],
  four_transformations?: FourTransformations[],
  interaction_with_decade?: string
}
```

**Monthly Luck (流月) & Daily Luck (流日):**
- Similar structure, fine-grained timing resolution
- Optional (can be calculated on-demand due to data volume)

---

### 2. Interpretation Rule (InterpretationRule)

The core knowledge structure for divination logic.

```typescript
{
  // Identity & Versioning
  id: string,                           // e.g., 'lz_si_career_001'
  version: number,                      // For tracking updates
  created_at: string,
  updated_at: string,

  // Rule Details
  title?: string,                       // e.g., '廉貞在巳 - 事業成就'
  description?: string,

  // Scope & Conditions
  scope: ChartType,                     // 'base' | 'decade' | 'annual'
  condition: {
    scope: ChartType,
    required_stars?: PrimaryStar[],     // Must have these stars
    excluded_stars?: PrimaryStar[],     // Must NOT have these stars
    palace?: Palace,
    palace_stem?: HeavenlyStem,
    palace_branch?: EarthlyBranch,
    required_transformations?: Transformation[],  // 祿權科忌
    required_patterns?: Pattern[],
    time_context?: {
      min_age?: number,
      max_age?: number,
      life_stage?: LifeStage
    }
  },

  // Interpretation
  interpretation: {
    zh: string,                         // Primary Chinese interpretation
    en?: string,                        // Optional English translation
    short_form?: string                 // 1-2 sentence summary
  },

  // Categorization
  dimension_tags: LifeDimension[],      // e.g., ['career', 'personality']
  keywords?: string[],

  // School & Consensus
  school: AstrologySchool,              // 'zhongzhou' | 'feixing' | etc.
  consensus_label: ConsensusLevel,      // 'consensus' | 'disputed' | 'minority_view'

  // Source Tracking
  source_refs: SourceReference[],       // Books, blogs, teachers, etc.

  // Accuracy Statistics
  statistics?: {
    sample_size: number,                // How many cases tested
    match_rate: number,                 // 0-1 (e.g., 0.82 = 82%)
    confidence_level: 'high' | 'medium' | 'low',
    last_evaluated_at?: string,
    evaluation_note?: string
  },

  // Relationships
  related_rule_ids?: string[],          // Often appear together
  conflicts_with?: string[],            // Contradicts this rule

  // Flags
  is_active: boolean,
  requires_human_review?: boolean
}
```

**Example Rule: 廉貞在巳 - 事業成就**

```typescript
{
  id: 'lz_si_career_001',
  version: 1,
  title: '廉貞在巳 - 事業成就',
  scope: 'base',
  condition: {
    required_stars: ['LIANZHENG'],
    palace: 'SI'
  },
  interpretation: {
    zh: '廉貞居巳，性格剛毅，具有決斷力與執行力。事業上易有突破與轉變。',
    short_form: '廉貞在巳：決斷力強，事業有突破'
  },
  dimension_tags: ['career', 'personality'],
  school: 'zhongzhou',
  consensus_label: 'consensus',
  source_refs: [
    { type: 'book', author: '王亭之', work: '談星系列', year: 1990 }
  ],
  statistics: {
    sample_size: 45,
    match_rate: 0.82,
    confidence_level: 'high',
    last_evaluated_at: '2024-02-10'
  },
  is_active: true
}
```

---

### 3. Life Dimensions (人生維度)

Used to organize and categorize interpretations:

| Dimension | 中文 | Examples |
|-----------|------|----------|
| PERSONALITY | 性格 | 性質、氣質、個性特徵 |
| CAREER | 事業 | 工作、事業運勢、官位 |
| RELATIONSHIP | 感情 | 婚姻、感情、伴侶 |
| WEALTH | 財富 | 財運、金錢、資產 |
| HEALTH | 健康 | 身體、疾病、養生 |
| FAMILY | 家庭 | 親情、親關係、家人 |
| EDUCATION | 教育 | 學習、考試、才華 |
| SPIRITUALITY | 精神 | 修為、心靈、精神追求 |
| FRIENDSHIP | 友誼 | 人脈、朋友、人緣 |
| GENERAL | 一般 | 整體運勢 |

---

## Agent Interfaces

### Agent 1: ChartEngineAgent (排盤引擎)

**Purpose**: Convert birth data to complete Ziwei chart

**Input:**
```typescript
{
  birth_info: BirthInfo,
  options?: {
    include_decade_luck?: boolean,        // Default: true
    include_annual_luck?: boolean,        // Default: true
    include_monthly_luck?: boolean,       // Default: false
    include_daily_luck?: boolean,         // Default: false
    decade_luck_years?: number,           // Default: 8
    annual_luck_years?: number,           // Default: 20
    algorithm_version?: 'zhongzhou_1952' | 'zhongzhou_1953' | 'zhongzhou_modern'
  }
}
```

**Output (Success):**
```typescript
{
  status: 'success',
  chart: BirthChart,
  calculation_duration_ms: number,
  notes?: string[]
}
```

**Key Methods:**
- `generateChart()` - Main entry point
- `validateBirthInfo()` - Validate input completeness
- `convertToLunarCalendar()` - Gregorian ↔ Lunar conversion
- `calculateFourPillars()` - Generate 八字
- `calculateBaseChart()` - Generate 本命盤
- `calculateXuanPatterns()` - Identify 玄局 patterns
- `calculateDecadeLuck()` - Generate 大限
- `calculateAnnualLuck()` - Generate 流年
- `validateChart()` - Check chart integrity

**Example Usage:**
```typescript
const agent = new ChartEngineAgent();
const result = await agent.generateChart({
  birth_info: {
    birth_datetime: { year: 1985, month: 3, day: 15, hour: 14, minute: 30 },
    calendar_type: 'gregorian',
    location: { city: 'Beijing', timezone: 'Asia/Shanghai' },
    gender: 'male'
  },
  options: {
    include_decade_luck: true,
    include_annual_luck: true,
    algorithm_version: 'zhongzhou_modern'
  }
});
```

---

### Agent 2: InterpretationAgent (解讀引擎)

**Purpose**: Generate human-readable interpretations from chart

**Input:**
```typescript
{
  birth_chart: BirthChart,
  focus_dimensions?: LifeDimension[],
  life_stage?: LifeStage,
  current_age?: number,
  query_text?: string,
  options?: {
    include_disputed?: boolean,            // Default: true
    include_minority_views?: boolean,      // Default: true
    min_accuracy_threshold?: number,       // Default: 0.5
    language?: 'zh' | 'en',                // Default: 'zh'
    detailed_mode?: boolean                // Default: false
  }
}
```

**Output (Success):**
```typescript
{
  status: 'success',
  chart_id: string,
  interpretations: InterpretationByDimension[],  // Grouped by life dimension
  consensus_count: number,
  disputed_count: number,
  minority_view_count: number,
  high_accuracy_count: number,
  generation_time_ms: number,
  notes?: string[]
}

// InterpretationByDimension structure:
{
  dimension: LifeDimension,
  segments: InterpretationSegment[],      // Grouped interpretation pieces
  summary?: string
}

// InterpretationSegment structure:
{
  rule_id: string,
  title?: string,
  interpretation_text: string,
  life_dimensions: LifeDimension[],
  consensus_label: ConsensusLevel,
  school: AstrologySchool,
  accuracy_info?: {
    sample_size: number,
    match_rate: number,
    confidence_level: 'high' | 'medium' | 'low',
    note?: string
  },
  alternative_views?: {
    school: AstrologySchool,
    interpretation_text: string,
    consensus_label: ConsensusLevel
  }[],
  source_summary?: string
}
```

**Key Methods:**
- `generateInterpretation()` - Main entry point
- `matchRulesToChart()` - Find applicable rules
- `filterRules()` - Apply user preferences
- `generateSegments()` - Create interpretation text
- `organizeBytoDimension()` - Group by life dimension
- `getInterpretationForDimension()` - Filter specific dimension
- `getConsensusBreakdown()` - Show consensus/disputed breakdown

**Example Usage:**
```typescript
const agent = new InterpretationAgent();
const result = await agent.generateInterpretation({
  birth_chart: chart,
  focus_dimensions: [LifeDimension.CAREER, LifeDimension.WEALTH],
  life_stage: LifeStage.YOUNG_ADULT,
  current_age: 28,
  options: {
    include_disputed: true,
    min_accuracy_threshold: 0.7,
    language: 'zh',
    detailed_mode: true
  }
});

// Output example:
// {
//   status: 'success',
//   chart_id: 'chart-1708244400000-a1b2c3d4e',
//   interpretations: [
//     {
//       dimension: 'career',
//       segments: [
//         {
//           rule_id: 'lz_si_career_001',
//           interpretation_text: '廉貞居巳，性格剛毅...',
//           consensus_label: 'consensus',
//           accuracy_info: { sample_size: 45, match_rate: 0.82, ... }
//         },
//         ...
//       ]
//     },
//     {
//       dimension: 'wealth',
//       segments: [...]
//     }
//   ],
//   consensus_count: 12,
//   disputed_count: 3,
//   minority_view_count: 1,
//   high_accuracy_count: 11,
//   generation_time_ms: 245
// }
```

---

### Agent 3: EvaluationAgent (評估引擎)

**Purpose**: Track accuracy and update rule statistics based on user feedback

**Input:**
```typescript
{
  interpretation_log: {
    interpretation_id: string,
    chart_id: string,
    generated_at: string,
    rules_used: string[],
    dimensions_covered: LifeDimension[]
  },
  user_feedback?: {
    interpretation_id: string,
    feedback_timestamp: string,
    accuracy_rating: number,              // 1-5 scale
    feedback_text?: string,
    relevant_to_dimensions?: LifeDimension[]
  },
  life_event_outcomes?: [
    {
      event_type: 'career_change' | 'relationship_change' | 'health_event' | 'financial_change' | 'other',
      date_occurred: string,              // ISO 8601
      description?: string,
      dimension: LifeDimension,
      severity: 'minor' | 'moderate' | 'major'
    }
  ],
  evaluator_notes?: string
}
```

**Output (Success):**
```typescript
{
  status: 'success',
  interpretation_id: string,
  rules_updated: number,
  statistics_updates: RuleStatisticsUpdate[],
  rules_for_review: RuleReviewRecommendation[],
  accuracy_summary: {
    average_rating: number,
    'rules_with_accuracy_> 80': number,
    'rules_with_accuracy_< 60': number
  },
  processing_time_ms: number,
  notes?: string[]
}

// RuleStatisticsUpdate structure:
{
  rule_id: string,
  new_sample_size: number,
  new_match_rate: number,
  updated_at: string,
  delta_sample_size: number,              // How many new samples
  delta_match_rate: number                // Change in match rate
}

// RuleReviewRecommendation structure:
{
  rule_id: string,
  title?: string,
  reason: 'low_accuracy' | 'disputed_consensus' | 'minority_view' | 'low_sample_size' | 'conflicting_feedback',
  current_statistics: {
    sample_size: number,
    match_rate: number,
    confidence_level: string
  },
  recommendation: string,
  priority: 'high' | 'medium' | 'low'
}
```

**Key Methods:**
- `processEvaluation()` - Main entry point
- `mapFeedbackToRules()` - Associate feedback with specific rules
- `calculateStatisticsUpdates()` - Recalculate rule accuracy
- `identifyRulesForReview()` - Flag rules needing review
- `compileAccuracySummary()` - Generate summary report
- `generateAccuracyReport()` - Batch report generation

**Example Usage:**
```typescript
const agent = new EvaluationAgent();
const result = await agent.processEvaluation({
  interpretation_log: {
    interpretation_id: 'interp_001',
    chart_id: 'chart_001',
    generated_at: '2024-01-15T10:00:00Z',
    rules_used: ['lz_si_career_001', 'ty_si_wealth_002'],
    dimensions_covered: ['career', 'wealth']
  },
  user_feedback: {
    interpretation_id: 'interp_001',
    feedback_timestamp: '2024-02-15T10:00:00Z',
    accuracy_rating: 4,
    feedback_text: '事業解讀準確，財運部分有偏差',
    relevant_to_dimensions: ['career']
  },
  life_event_outcomes: [
    {
      event_type: 'career_change',
      date_occurred: '2024-02-01',
      dimension: LifeDimension.CAREER,
      severity: 'major'
    }
  ]
});

// Output example:
// {
//   status: 'success',
//   interpretation_id: 'interp_001',
//   rules_updated: 2,
//   statistics_updates: [
//     {
//       rule_id: 'lz_si_career_001',
//       new_sample_size: 46,
//       new_match_rate: 0.826,
//       delta_sample_size: 1,
//       delta_match_rate: +0.006
//     },
//     ...
//   ],
//   rules_for_review: [
//     {
//       rule_id: 'ty_si_wealth_002',
//       reason: 'low_accuracy',
//       current_statistics: { sample_size: 29, match_rate: 0.65, ... },
//       recommendation: 'Rule has low accuracy. Recommend review by domain expert.',
//       priority: 'high'
//     }
//   ],
//   accuracy_summary: {
//     average_rating: 4,
//     'rules_with_accuracy_> 80': 1,
//     'rules_with_accuracy_< 60': 1
//   }
// }
```

---

## Example Data Flow

### Scenario: User born 1985-03-15, 14:30, Beijing (male)

#### Step 1: Chart Generation

**Input to ChartEngineAgent:**
```json
{
  "birth_info": {
    "birth_datetime": {
      "year": 1985,
      "month": 3,
      "day": 15,
      "hour": 14,
      "minute": 30
    },
    "calendar_type": "gregorian",
    "location": {
      "city": "Beijing",
      "country": "China",
      "latitude": 39.9042,
      "longitude": 116.4074,
      "timezone": "Asia/Shanghai"
    },
    "gender": "male"
  },
  "options": {
    "include_decade_luck": true,
    "include_annual_luck": true,
    "algorithm_version": "zhongzhou_modern"
  }
}
```

**Output from ChartEngineAgent:**
```json
{
  "status": "success",
  "chart": {
    "id": "chart-1708244400000-a1b2c3d4e",
    "chart_id_code": "ZW-2024-7F8K9M2L",
    "created_at": "2024-02-18T10:00:00Z",
    "birth_info": { ... },
    "gan_zhi": {
      "year_pillar": { "stem": "jia", "branch": "zi" },
      "month_pillar": { "stem": "bing", "branch": "yin" },
      "day_pillar": { "stem": "wu", "branch": "chen" },
      "hour_pillar": { "stem": "geng", "branch": "wu" }
    },
    "base_chart": { ... },
    "xuan_patterns": { ... },
    "decade_luck": [ ... ],
    "annual_luck": [ ... ]
  },
  "calculation_duration_ms": 342
}
```

#### Step 2: Interpretation Generation

**Input to InterpretationAgent:**
```json
{
  "birth_chart": { ... },  // Output from ChartEngineAgent
  "focus_dimensions": ["career", "wealth"],
  "current_age": 39,
  "life_stage": "middle_age",
  "options": {
    "include_disputed": true,
    "min_accuracy_threshold": 0.7,
    "language": "zh",
    "detailed_mode": true
  }
}
```

**Output from InterpretationAgent:**
```json
{
  "status": "success",
  "chart_id": "chart-1708244400000-a1b2c3d4e",
  "interpretations": [
    {
      "dimension": "career",
      "segments": [
        {
          "rule_id": "lz_si_career_001",
          "title": "廉貞在巳 - 事業成就",
          "interpretation_text": "廉貞居巳，性格剛毅，具有決斷力與執行力...",
          "consensus_label": "consensus",
          "school": "zhongzhou",
          "accuracy_info": {
            "sample_size": 45,
            "match_rate": 0.82,
            "confidence_level": "high",
            "note": "經過45個案例驗證，命中率82%"
          },
          "source_summary": "王亭之, 命理研究員"
        }
      ]
    },
    {
      "dimension": "wealth",
      "segments": [
        {
          "rule_id": "ty_si_wealth_002",
          "title": "太陰在巳 - 財運分析 (有爭議)",
          "interpretation_text": "[中州派] 太陰在巳，財源不絕...",
          "consensus_label": "disputed",
          "school": "zhongzhou",
          "accuracy_info": {
            "sample_size": 28,
            "match_rate": 0.68,
            "confidence_level": "medium"
          },
          "alternative_views": [
            {
              "school": "feixing",
              "interpretation_text": "[飛星派] 太陰在巳需配合空亡星...",
              "consensus_label": "disputed"
            }
          ]
        }
      ]
    }
  ],
  "consensus_count": 8,
  "disputed_count": 2,
  "minority_view_count": 0,
  "high_accuracy_count": 7,
  "generation_time_ms": 156
}
```

#### Step 3: User Provides Feedback (1 month later)

**Input to EvaluationAgent:**
```json
{
  "interpretation_log": {
    "interpretation_id": "interp_001",
    "chart_id": "chart-1708244400000-a1b2c3d4e",
    "generated_at": "2024-01-15T10:00:00Z",
    "rules_used": ["lz_si_career_001", "ty_si_wealth_002", ...],
    "dimensions_covered": ["career", "wealth"]
  },
  "user_feedback": {
    "interpretation_id": "interp_001",
    "feedback_timestamp": "2024-02-15T10:00:00Z",
    "accuracy_rating": 4,
    "feedback_text": "事業解讀非常準確，今年確實有職務提升的機會。財運部分的解讀似乎有偏差，投資反而有所虧損。",
    "relevant_to_dimensions": ["career"]
  },
  "life_event_outcomes": [
    {
      "event_type": "career_change",
      "date_occurred": "2024-02-10",
      "description": "職位提升至部門經理",
      "dimension": "career",
      "severity": "major"
    },
    {
      "event_type": "financial_change",
      "date_occurred": "2024-02-01",
      "description": "投資虧損約15%",
      "dimension": "wealth",
      "severity": "moderate"
    }
  ]
}
```

**Output from EvaluationAgent:**
```json
{
  "status": "success",
  "interpretation_id": "interp_001",
  "rules_updated": 2,
  "statistics_updates": [
    {
      "rule_id": "lz_si_career_001",
      "new_sample_size": 46,
      "new_match_rate": 0.826,
      "updated_at": "2024-02-15T15:30:00Z",
      "delta_sample_size": 1,
      "delta_match_rate": 0.006
    },
    {
      "rule_id": "ty_si_wealth_002",
      "new_sample_size": 29,
      "new_match_rate": 0.62,
      "updated_at": "2024-02-15T15:30:00Z",
      "delta_sample_size": 1,
      "delta_match_rate": -0.06
    }
  ],
  "rules_for_review": [
    {
      "rule_id": "ty_si_wealth_002",
      "reason": "low_accuracy",
      "current_statistics": {
        "sample_size": 29,
        "match_rate": 0.62,
        "confidence_level": "medium"
      },
      "recommendation": "Rule has low accuracy (62%). Recommend review by domain expert or revision of interpretation criteria.",
      "priority": "high"
    }
  ],
  "accuracy_summary": {
    "average_rating": 4,
    "rules_with_accuracy_> 80": 1,
    "rules_with_accuracy_< 60": 1
  },
  "processing_time_ms": 87
}
```

---

## Statistical Accuracy Tracking

### Why Accuracy Matters

Each rule includes accuracy statistics to enable:
1. **Continuous improvement** - Track which rules work best
2. **Transparency** - Show users the confidence level of interpretations
3. **Research** - Identify which schools/methods are most effective
4. **Refinement** - Flag rules that need revision

### Key Metrics

| Metric | Definition | Usage |
|--------|-----------|-------|
| **sample_size** | Number of cases tested | Higher = more reliable |
| **match_rate** | Percentage of successful predictions (0-1) | 0.82 = 82% accuracy |
| **confidence_level** | high/medium/low | User-facing indicator |
| **last_evaluated_at** | ISO 8601 timestamp | Freshness indicator |

### Interpretation Thresholds

```
match_rate >= 0.80:  HIGH confidence     ✓ Use primary interpretation
match_rate >= 0.60:  MEDIUM confidence   ~ Show with caveat
match_rate >= 0.40:  LOW confidence      ⚠ Show as minority view only
match_rate < 0.40:   VERY LOW            ✗ Flag for review/revision
```

### Updating Statistics

When user provides feedback:
1. **Map feedback to rules** - Which rules contributed to the interpretation?
2. **Score accuracy** - Did the interpretation match reality? (1-5 scale)
3. **Update statistics** - Recalculate match_rate:
   ```
   new_match_rate = (old_matches + new_feedback) / new_sample_size
   ```
4. **Identify review items** - Rules with low accuracy or contradictory feedback

---

## Rules & Consensus

### Consensus Levels

#### 1. CONSENSUS (共識)
- Widely accepted across schools
- High sample_size and consistent match_rate
- Safe for primary interpretation
- Example: **紫微命宮 → 領導特質** (match_rate: 0.89)

#### 2. DISPUTED (有爭議)
- Different schools have different views
- Conflicting historical sources
- Moderate sample_size, variable match_rate
- Show alternative perspectives
- Example: **太陰在巳 → 財運** (Zhongzhou vs Feixing: 0.68 vs 0.52)

#### 3. MINORITY VIEW (少數派)
- Small subset of teachers/sources
- Very small sample_size
- Show with explicit caveat
- Example: **大限與流年共振 → 重大轉折** (sample_size: 8, match_rate: 0.75)

### Handling Conflicts

When rules conflict (e.g., Zhongzhou vs Feixing):

1. **Show both** if user requests it
2. **Prioritize consensus** in default view
3. **Mark source/school** clearly
4. **Provide accuracy stats** for each interpretation
5. **Let user choose** their preferred school

**Example Output:**
```json
{
  "dimension": "wealth",
  "segments": [
    {
      "rule_id": "ty_si_wealth_zhongzhou",
      "interpretation_text": "[中州派] 太陰在巳，財源不絕...",
      "school": "zhongzhou",
      "consensus_label": "disputed",
      "accuracy_info": { "match_rate": 0.68, "sample_size": 28 }
    },
    {
      "rule_id": "ty_si_wealth_feixing",
      "interpretation_text": "[飛星派] 太陰在巳需配合空亡星...",
      "school": "feixing",
      "consensus_label": "disputed",
      "accuracy_info": { "match_rate": 0.52, "sample_size": 18 }
    }
  ]
}
```

---

## Implementation Roadmap

### Phase 1: Foundation (Current)
- ✅ Type definitions & schemas
- ✅ Agent interface specifications
- ✅ Rule structure design
- ✅ Example data & documentation
- **Next**: Implement core algorithms

### Phase 2: Core Implementation
- [ ] Astronomical calculations (Four Pillars, calendar conversion)
- [ ] Star placement algorithms (Zhongzhou-specific)
- [ ] Timing cycle calculations (decade, annual, monthly, daily)
- [ ] Pattern recognition (60 star systems, major patterns)
- [ ] Database schema for rules storage

### Phase 3: Rule Database
- [ ] Digitize existing Zhongzhou rules from books/sources
- [ ] Systematically evaluate each rule with historical data
- [ ] Generate initial accuracy statistics
- [ ] Set up consensus/disputed/minority classifications
- [ ] Create comparison with Feixing and other schools

### Phase 4: Frontend Integration
- [ ] Birth chart visualization (12 palaces, star positions)
- [ ] Interactive interpretation explorer
- [ ] Consensus/disputed/minority view toggle
- [ ] Feedback collection interface
- [ ] Accuracy statistics dashboard

### Phase 5: Continuous Improvement
- [ ] User feedback loop
- [ ] Automated accuracy tracking
- [ ] Rule review workflows
- [ ] Statistical reporting
- [ ] Model refinement based on data

---

## Key Design Decisions

### 1. Three-Agent Architecture
**Why**: Separation of concerns - calculation, interpretation, evaluation
**Benefit**: Each agent can be tested, updated, or replaced independently

### 2. Explicit Consensus Tracking
**Why**: Accommodate multiple schools and viewpoints
**Benefit**: Transparency, allows users to choose their preferred approach

### 3. Statistical Accuracy Metrics
**Why**: Make divination empirical and testable
**Benefit**: Continuous improvement, credibility, research potential

### 4. Source Reference Tracking
**Why**: All rules must be traceable to sources
**Benefit**: Reproducibility, academic rigor, error correction

### 5. Modular Rule System
**Why**: Rules can be independently evaluated and versioned
**Benefit**: Easy to add new schools, update interpretations, retire inaccurate rules

---

## Next Steps

1. **Implement ChartEngineAgent** - Astronomical calculations
   - Use LuniSolar library for calendar conversion
   - Implement Heavenly Stem & Earthly Branch calculations
   - Build star placement algorithms per Zhongzhou school

2. **Build Rules Database**
   - Systematically transcribe existing Ziwei literature
   - Create evaluation pipeline
   - Generate initial accuracy metrics

3. **Connect to Frontend**
   - Create API endpoints for all three agents
   - Build chart visualization
   - Implement interpretation UI

4. **Launch Beta**
   - Collect user feedback
   - Monitor accuracy metrics
   - Iterate on rule base

---

## References & Sources

### Key Zhongzhou School Texts
- **王亭之** (Wang Tingzhi) - 《談星系列》(Tan Xing Series)
- **王亭之** - 《紫微斗數詳批》(Ziwei Detailed Interpretation)
- **李雁南** - 《中州派紫微斗數》(Zhongzhou Ziwei System)

### Related Resources
- Fortel project: https://github.com/airicyu/Fortel
- Xueyizone: https://xueyizone.com/share
- Scribd Zhongzhou documents: https://www.scribd.com/document/761380836/

### Academic References
- Ephemeris data for astronomical calculations
- LuniSolar calendar conversion algorithms
- Statistical analysis frameworks for accuracy evaluation

---

**Document Version**: 1.0
**Last Updated**: 2024-02-18
**Status**: Ready for Implementation Review
**Next Review**: Post-Phase 2 Implementation
