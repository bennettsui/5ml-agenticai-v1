# Ziwei Astrology System - Knowledge Schema

This directory contains the complete type definitions and schema for the Ziwei astrology system based on the **Zhongzhou School (中州派)** and **Wang Tingzhi (王亭之)** teachings.

## Files Overview

### 1. `ziwei-types.ts`
**Purpose**: Core type definitions for the entire Ziwei system

**Sections**:
- **Birth Information**: Birth datetime, calendar type, location, gender
- **Palaces & Houses**: 12 Palaces (十二宮), Elements, Stems & Branches
- **Stars & Luminaries**: Primary stars (14主星), secondary stars, calamity stars
- **Four Transformations**: 四化 (Wealth, Power, Exam, Disaster)
- **Chart Types**: Base chart, Xuan patterns, timing cycles
- **Luck Cycles**: Decade luck (大限), Annual luck (流年), Monthly (流月), Daily (流日)
- **Birth Chart**: Complete comprehensive chart structure
- **Interpretation & Analysis**: Life dimensions, stages, schools, consensus levels
- **Rules**: Condition structures and rule definitions

**Key Exports**:
- `BirthChart` - Complete birth chart structure
- `InterpretationRule` - Rule definition structure
- `Palace`, `PrimaryStar`, `Pattern`, `ChartType`, `LifeDimension`
- Enums: `HeavenlyStem`, `EarthlyBranch`, `Element`, `Transformation`, etc.

### 2. `ziwei-rules.ts`
**Purpose**: Example rules and rule utilities demonstrating the system

**Includes**:
- **Example Rules** (4 demonstrations):
  - `RULE_LIANZHENG_SI_CAREER` - Consensus rule (廉貞在巳 - 事業成就)
  - `RULE_TAIYIN_SI_WEALTH_DISPUTED` - Disputed rule with alternatives (太陰在巳 - 有爭議)
  - `RULE_DECADE_ANNUAL_INTERACTION` - Minority view (大限與流年共振)
  - `RULE_ZIWEI_MAIN_PERSONALITY` - High-consensus rule (紫微主星)

- **Rule Sets**:
  - `ZHONGZHOU_BASE_CHART_RULES` - Base chart interpretation rules
  - `ZHONGZHOU_DECADE_LUCK_RULES` - Decade luck rules

- **Utility Functions**:
  - `getConsensusRules()` - Filter by consensus
  - `getDisputedRules()` - Get disputed interpretations
  - `getHighAccuracyRules()` - Filter by accuracy threshold
  - `getRulesRequiringReview()` - Find rules needing attention
  - `getRulesByDimension()` - Filter by life dimension

**Key Exports**:
- All example rules and rule sets
- Helper functions for rule filtering

### 3. `ZIWEI_SYSTEM_DESIGN.md`
**Purpose**: Comprehensive design documentation

**Covers**:
1. System overview and core principles
2. Architecture overview (3-agent system)
3. Complete data model specifications
4. Agent interface definitions with examples
5. Detailed data flow scenarios
6. Statistical accuracy tracking methodology
7. Consensus level explanations
8. Implementation roadmap and phases
9. Key design decisions and rationale
10. References and sources

**Best For**: Understanding the "big picture" and design rationale

### 4. `knowledge-types.ts`
**Purpose**: General knowledge management types (existing)

**Includes**: Generic types for the broader knowledge system
- `KnowledgeDocument`
- `EmbeddingConfig`
- `VectorSearchQuery`
- Knowledge connector types

## Quick Start

### Importing Types

```typescript
// Import specific types
import { BirthChart, InterpretationRule, Palace, LifeDimension } from './ziwei-types';

// Import rules and examples
import { RULE_LIANZHENG_SI_CAREER, getRulesByDimension } from './ziwei-rules';

// Import from index
import { BirthChart, ZHONGZHOU_BASE_CHART_RULES } from './index';
```

### Creating a Birth Chart Object

```typescript
import { BirthChart, BirthInfo } from './ziwei-types';

const birthChart: BirthChart = {
  id: 'chart-001',
  chart_id_code: 'ZW-2024-ABC123',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),

  birth_info: {
    birth_datetime: {
      year: 1985,
      month: 3,
      day: 15,
      hour: 14,
      minute: 30
    },
    calendar_type: 'gregorian',
    location: {
      city: 'Beijing',
      country: 'China',
      timezone: 'Asia/Shanghai'
    },
    gender: 'male'
  },

  // ... rest of properties
};
```

### Working with Rules

```typescript
import { InterpretationRule, LifeDimension, ConsensusLevel } from './ziwei-types';
import { getRulesByDimension, getHighAccuracyRules } from './ziwei-rules';

// Get rules for specific dimension
const careerRules = getRulesByDimension(allRules, LifeDimension.CAREER);

// Get high-accuracy rules
const highAccuracy = getHighAccuracyRules(allRules, 0.8);

// Filter by consensus
const consensusRules = allRules.filter(r => r.consensus_label === ConsensusLevel.CONSENSUS);
```

## Key Concepts

### Birth Chart Structure
```
BirthChart
├── Birth Information (birth_info)
├── Four Pillars (gan_zhi) - 八字
├── Base Chart (base_chart) - 本命盤
│   ├── 12 Palaces with star positions
│   ├── Element distribution
│   └── Fundamental patterns
├── Xuan Configuration (xuan_patterns) - 玄局
├── Decade Luck (decade_luck) - 大限
├── Annual Luck (annual_luck) - 流年
├── Monthly Luck (monthly_luck) - 流月
└── Daily Luck (daily_luck) - 流日
```

### Interpretation Rule Structure
```
InterpretationRule
├── Identity (id, version, created_at)
├── Scope & Conditions (scope, condition)
├── Interpretation (zh, en, short_form)
├── Categorization (dimension_tags, keywords)
├── School & Consensus (school, consensus_label)
├── Sources (source_refs)
├── Statistics (sample_size, match_rate, confidence_level)
└── Relationships (related_rule_ids, conflicts_with)
```

### Consensus Levels
- **CONSENSUS** (共識): Widely accepted, safe for primary interpretation
- **DISPUTED** (有爭議): Different schools have different views
- **MINORITY_VIEW** (少數派): Small subset of teachers/sources

### Accuracy Metrics
- **sample_size**: Number of cases tested
- **match_rate**: 0-1 (0.82 = 82% accuracy)
- **confidence_level**: high/medium/low based on match_rate

## Related Files

### Agent Implementations
- `agents/ziweiChartAgent.ts` - Chart generation agent
- `agents/ziweiInterpretationAgent.ts` - Interpretation generation agent
- `agents/ziweiEvaluationAgent.ts` - Evaluation and feedback agent
- `agents/ziwei-index.ts` - Agent exports index

## Database Considerations

### Rules Storage
Rules should be stored in a database (PostgreSQL recommended) with:
- Full rule object as JSON
- Indexed fields for efficient querying:
  - `school`, `consensus_label`, `scope`
  - `dimension_tags`, `is_active`, `requires_human_review`
  - `statistics.match_rate`, `statistics.sample_size`

### Chart Storage
Birth charts can be stored as:
- Complete JSON (1-2MB per chart with all cycles)
- Compressed with sampling (only requested cycles)
- With references to generated interpretations

## Extending the System

### Adding New Rules
1. Create new `InterpretationRule` object
2. Include all required fields
3. Set `source_refs` with proper citations
4. Initialize `statistics` with `null` or initial values
5. Set `consensus_label` appropriately
6. Add to appropriate `RuleSet`

### Adding Other Schools
1. Create new school in `AstrologySchool` enum
2. Add school-specific rule sets
3. Include comparative analysis in rules
4. Set `conflicts_with` for school-specific rules

### Updating Accuracy Metrics
Via the `EvaluationAgent`:
1. Collect user feedback (1-5 rating)
2. Track actual life events
3. Calculate accuracy change
4. Update rule statistics
5. Flag rules for review if needed

## Documentation

**For Implementation Details**: See `ZIWEI_SYSTEM_DESIGN.md`
- Complete system architecture
- Agent interface specifications
- Data flow examples
- Implementation roadmap

**For Type Reference**: See inline comments in `ziwei-types.ts` and `ziwei-rules.ts`

**For Examples**: See `ZIWEI_SYSTEM_DESIGN.md` "Example Data Flow" section

## Testing

When implementing the agents, test with:
1. Example birth data (from ZIWEI_SYSTEM_DESIGN.md)
2. Rule matching against test charts
3. Accuracy statistics calculations
4. Edge cases (invalid dates, missing data, etc.)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-02-18 | Initial design complete - types, rules, documentation |

## Next Steps

1. ✅ Complete schema design (THIS PHASE)
2. ⏭️ Implement ChartEngineAgent
3. ⏭️ Build rules database
4. ⏭️ Implement InterpretationAgent
5. ⏭️ Connect EvaluationAgent
6. ⏭️ Frontend integration
7. ⏭️ Beta launch and feedback collection

## Support

For questions about the Ziwei system design:
- Review `ZIWEI_SYSTEM_DESIGN.md` for comprehensive documentation
- Check example rules in `ziwei-rules.ts` for patterns
- Refer to type comments in `ziwei-types.ts` for field definitions

---

**Created**: 2024-02-18
**Author**: AI Engineering Team
**Status**: Design Complete - Ready for Implementation
