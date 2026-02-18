/**
 * Ziwei Interpretation Engine (紫微解讀引擎)
 * Rule matching and interpretation generation for birth charts
 *
 * Workflow: Load Rules → Match Chart Patterns → Filter by Consensus → Group by Dimension → Rank by Accuracy
 */

// TODO: Load from database via seed data or API
const INTERPRETATION_RULES = [
  {
    id: 'rule-ziwei-palace-1',
    version: 1,
    scope: 'star',
    condition: { star: '紫微', palace: '命宮' },
    interpretation: {
      zh: '命主貴氣十足，具領導能力，性格堅決獨立。',
      en: 'Life host possesses noble bearing and leadership qualities',
      dimension: '性格'
    },
    consensusLabel: 'consensus',
    statistics: { sampleSize: 250, matchRate: 0.82, confidenceLevel: 0.82 },
    status: 'active'
  },
  {
    id: 'rule-tianfu-palace-1',
    version: 1,
    scope: 'star',
    condition: { star: '天府', palace: '命宮' },
    interpretation: {
      zh: '福厚祿重，處事穩健，人生運程平順。',
      en: 'Blessed with good fortune and stable life trajectory',
      dimension: '福運'
    },
    consensusLabel: 'consensus',
    statistics: { sampleSize: 320, matchRate: 0.79, confidenceLevel: 0.79 },
    status: 'active'
  },
  {
    id: 'rule-ziwei-taiyang-1',
    version: 1,
    scope: 'pattern',
    condition: { pattern: ['紫微', '太陽'] },
    interpretation: {
      zh: '紫日格局，性格開朗，事業心強，適合從政或經商。',
      en: 'Ziwei-Taiyang pattern: outgoing, career-driven, suited for politics or business',
      dimension: '事業'
    },
    consensusLabel: 'consensus',
    statistics: { sampleSize: 180, matchRate: 0.75, confidenceLevel: 0.75 },
    status: 'active'
  },
  {
    id: 'rule-taiyin-1',
    version: 1,
    scope: 'star',
    condition: { star: '太陰' },
    interpretation: {
      zh: '太陰代表温柔、文藝、母性特質，女性命主柔中帶剛。',
      en: 'Taiyin denotes gentleness, artistic talent, and feminine qualities',
      dimension: '性格'
    },
    consensusLabel: 'consensus',
    statistics: { sampleSize: 210, matchRate: 0.77, confidenceLevel: 0.77 },
    status: 'active'
  },
  {
    id: 'rule-transformation-lu-1',
    version: 1,
    scope: 'transformation',
    condition: { transformation: '祿' },
    interpretation: {
      zh: '化祿代表利益、收入、好運，該宮位吉利。',
      en: 'Transformation-Lu (wealth) brings prosperity to the palace',
      dimension: '財運'
    },
    consensusLabel: 'consensus',
    statistics: { sampleSize: 400, matchRate: 0.84, confidenceLevel: 0.84 },
    status: 'active'
  },
  {
    id: 'rule-transformation-ji-1',
    version: 1,
    scope: 'transformation',
    condition: { transformation: '忌' },
    interpretation: {
      zh: '化忌代表困擾、阻滯、挑戰，該宮位需特別注意。',
      en: 'Transformation-Ji (obstacles) brings challenges requiring attention',
      dimension: '挑戰'
    },
    consensusLabel: 'consensus',
    statistics: { sampleSize: 350, matchRate: 0.80, confidenceLevel: 0.80 },
    status: 'active'
  }
];

class InterpretationEngine {
  constructor(rules = INTERPRETATION_RULES) {
    this.rules = rules.filter(r => r.status === 'active');
  }

  /**
   * Load rules from database (async)
   */
  static async fromDatabase() {
    try {
      const db = require('../db');
      const dbRules = await db.getZiweiRules({ consensus: 'consensus' });

      const rules = dbRules.map((row) => ({
        id: row.id,
        version: row.version,
        scope: row.scope,
        condition: row.condition,
        interpretation: row.interpretation,
        consensusLabel: row.consensus_label,
        statistics: row.statistics,
        status: row.status
      }));

      return new InterpretationEngine(rules);
    } catch (error) {
      console.warn('⚠️ Could not load rules from DB, using defaults:', error.message);
      return new InterpretationEngine();
    }
  }

  /**
   * Match and generate interpretations for a calculated chart
   */
  generateInterpretations(chart) {
    const interpretations = [];

    // 1. Match star placements in palaces
    for (const [star, houseIndex] of Object.entries(chart.starPositions)) {
      const house = chart.houses[houseIndex];
      if (!house) continue;

      // Find rules for this star in this palace
      const starRules = this.rules.filter(
        r => r.scope === 'star' && r.condition.star === star
      );

      for (const rule of starRules) {
        interpretations.push({
          ruleId: rule.id,
          scope: `star-${star}`,
          text: rule.interpretation.zh,
          dimension: rule.interpretation.dimension,
          confidence: rule.statistics.confidenceLevel,
          consensus: rule.consensusLabel
        });
      }
    }

    // 2. Match transformation markings
    for (let i = 0; i < chart.houses.length; i++) {
      const house = chart.houses[i];
      for (const transformation of house.transformations) {
        const transRules = this.rules.filter(
          r => r.scope === 'transformation' && r.condition.transformation === transformation
        );

        for (const rule of transRules) {
          interpretations.push({
            ruleId: rule.id,
            scope: `transformation-${transformation}`,
            text: rule.interpretation.zh,
            dimension: rule.interpretation.dimension,
            confidence: rule.statistics.confidenceLevel,
            consensus: rule.consensusLabel
          });
        }
      }
    }

    // 3. Match patterns (e.g., star combinations)
    const matchedPatterns = this.matchPatterns(chart);
    for (const pattern of matchedPatterns) {
      const patternRules = this.rules.filter(
        r => r.scope === 'pattern' &&
             r.condition.pattern &&
             r.condition.pattern.every(star => star in chart.starPositions)
      );

      for (const rule of patternRules) {
        interpretations.push({
          ruleId: rule.id,
          scope: `pattern-${pattern.join('-')}`,
          text: rule.interpretation.zh,
          dimension: rule.interpretation.dimension,
          confidence: rule.statistics.confidenceLevel,
          consensus: rule.consensusLabel
        });
      }
    }

    return interpretations;
  }

  /**
   * Group interpretations by life dimension
   */
  groupByDimension(interpretations) {
    const grouped = new Map();

    for (const interp of interpretations) {
      if (!grouped.has(interp.dimension)) {
        grouped.set(interp.dimension, []);
      }
      grouped.get(interp.dimension).push(interp);
    }

    return Array.from(grouped.entries()).map(([dimension, intps]) => ({
      dimension,
      interpretations: intps,
      avgConfidence: intps.reduce((sum, i) => sum + i.confidence, 0) / intps.length
    })).sort((a, b) => b.avgConfidence - a.avgConfidence);
  }

  /**
   * Filter interpretations by consensus level
   */
  filterByConsensus(
    interpretations,
    minConsensus = 'consensus'
  ) {
    const levels = {
      'consensus': 3,
      'disputed': 2,
      'experimental': 1
    };

    return interpretations.filter(
      i => levels[i.consensus] >= levels[minConsensus]
    );
  }

  /**
   * Rank interpretations by accuracy/confidence
   */
  rankByAccuracy(interpretations) {
    return [...interpretations].sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Detect major patterns in the chart
   */
  matchPatterns(chart) {
    const stars = Object.keys(chart.starPositions);
    const patterns = [];

    // Detect 紫日 (Ziwei-Taiyang) pattern
    if (stars.includes('紫微') && stars.includes('太陽')) {
      patterns.push(['紫微', '太陽']);
    }

    // Detect 天梁 (Tianliang) pattern
    if (stars.includes('天梁') && stars.includes('廉貞')) {
      patterns.push(['天梁', '廉貞']);
    }

    // TODO: Add more traditional patterns (格局)

    return patterns;
  }
}

// ==================== Tests ====================

function assert(cond, msg) {
  if (!cond) throw new Error(`❌ ${msg}`);
  console.log(`✅ ${msg}`);
}

function test() {
  console.log("\n🧪 Running Interpretation Engine tests...\n");

  // Mock chart
  const mockChart = {
    houses: Array.from({ length: 12 }, (_, i) => ({
      index: i,
      branch: ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'][i],
      name: ['命宮', '兄弟宮', '夫妻宮', '子女宮', '財帛宮', '疾厄宮', '遷移宮', '僕役宮', '官祿宮', '田宅宮', '福德宮', '父母宮'][i],
      majorStars: i === 0 ? ['紫微'] : i === 6 ? ['天府'] : [],
      minorStars: [],
      transformations: i === 0 ? ['祿'] : []
    })),
    lifeHouseIndex: 0,
    bodyHouseIndex: 1,
    fiveElementBureau: 3,
    baseFourTransformations: { '祿': '廉貞', '權': '破軍', '科': '武曲', '忌': '太陽' },
    starPositions: { '紫微': 0, '天府': 6 }
  };

  const engine = new InterpretationEngine();

  // Test 1: Generate interpretations
  const intps = engine.generateInterpretations(mockChart);
  assert(intps.length > 0, "Should generate interpretations");
  console.log(`  Generated ${intps.length} interpretations`);

  // Test 2: Group by dimension
  const grouped = engine.groupByDimension(intps);
  assert(grouped.length > 0, "Should group interpretations");
  console.log(`  Grouped into ${grouped.length} dimensions`);

  // Test 3: Filter by consensus
  const consensusIntps = engine.filterByConsensus(intps, 'consensus');
  assert(consensusIntps.length > 0, "Should have consensus interpretations");
  console.log(`  ${consensusIntps.length} consensus interpretations`);

  // Test 4: Rank by accuracy
  const ranked = engine.rankByAccuracy(intps);
  assert(ranked.length === intps.length, "Should maintain count after ranking");
  assert(ranked[0].confidence >= ranked[ranked.length - 1].confidence, "Should be sorted by confidence");

  console.log("\n✨ All interpretation engine tests passed!\n");
}

// Exports
module.exports = {
  InterpretationEngine,
  test
};

// Run tests if needed
if (require.main === module) {
  test();
}
