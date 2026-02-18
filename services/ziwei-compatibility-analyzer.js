/**
 * Ziwei Compatibility Analyzer Service (Step 6)
 * Analyzes compatibility between two birth charts for relationships
 *
 * Uses DeepSeek Reasoner for deep compatibility analysis
 */

const Anthropic = require('@anthropic-ai/sdk');

class ZiweiCompatibilityAnalyzer {
  constructor(anthropicApiKey = process.env.ANTHROPIC_API_KEY) {
    if (!anthropicApiKey) {
      console.warn('⚠️ ANTHROPIC_API_KEY not set - Compatibility analysis disabled');
      this.available = false;
      return;
    }

    this.client = new Anthropic({
      apiKey: anthropicApiKey,
      defaultHeaders: {
        'anthropic-beta': 'interleaved-thinking-2025-05-14',
      },
    });
    this.available = true;
  }

  /**
   * Check if compatibility analysis is available
   */
  isAvailable() {
    return this.available;
  }

  /**
   * Analyze compatibility between two charts
   */
  async analyzeCompatibility(chart1, chart2, relationshipType = 'romantic') {
    if (!this.available) {
      return null;
    }

    try {
      const patterns = this.identifyPatterns(chart1, chart2);
      const score = this.calculateCompatibilityScore(chart1, chart2, patterns);

      const prompt = this.buildCompatibilityPrompt(chart1, chart2, relationshipType, patterns, score);

      const response = await this.client.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 5000,
        thinking: {
          type: 'enabled',
          budget_tokens: 4000
        },
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const textContent = response.content.find(block => block.type === 'text');
      if (!textContent) {
        return null;
      }

      return {
        compatibilityScore: score,
        patterns,
        harmoniousElements: patterns.harmonious,
        conflictingElements: patterns.conflicting,
        report: textContent.text,
        tokensInput: response.usage.input_tokens,
        tokensOutput: response.usage.output_tokens,
        model: 'deepseek-reasoner',
        success: true
      };
    } catch (error) {
      console.error('❌ Compatibility analysis error:', error.message);
      return null;
    }
  }

  /**
   * Identify harmonious and conflicting star patterns
   */
  identifyPatterns(chart1, chart2) {
    const stars1 = Object.keys(chart1.starPositions || {});
    const stars2 = Object.keys(chart2.starPositions || {});

    // Define harmonious and conflicting combinations
    const harmoniousCombos = [
      ['紫微', '天府'],
      ['天機', '太陽'],
      ['武曲', '天相'],
      ['太陰', '天梁'],
      ['貪狼', '巨門'],
    ];

    const conflictingCombos = [
      ['七殺', '破軍'],
      ['火星', '鈴星'],
      ['天刑', '天羅'],
      ['擎羊', '陀羅'],
    ];

    const harmoniousElements = [];
    const conflictingElements = [];

    // Check for shared major stars (very harmonious)
    for (const star of stars1) {
      if (stars2.includes(star)) {
        harmoniousElements.push(`Both have ${star} (strong connection)`);
      }
    }

    // Check for harmonious combinations
    for (const [star1, star2] of harmoniousCombos) {
      if ((stars1.includes(star1) && stars2.includes(star2)) ||
          (stars1.includes(star2) && stars2.includes(star1))) {
        harmoniousElements.push(`${star1} + ${star2} pattern (harmonious)`);
      }
    }

    // Check for conflicting combinations
    for (const [star1, star2] of conflictingCombos) {
      if ((stars1.includes(star1) && stars2.includes(star2)) ||
          (stars1.includes(star2) && stars2.includes(star1))) {
        conflictingElements.push(`${star1} + ${star2} pattern (challenging)`);
      }
    }

    // Check five element compatibility
    const fe1 = chart1.fiveElementBureau;
    const fe2 = chart2.fiveElementBureau;
    const feHarmony = this.checkFiveElementHarmony(fe1, fe2);
    if (feHarmony) {
      harmoniousElements.push(`Five Element: ${this.fiveElementName(fe1)} + ${this.fiveElementName(fe2)} (compatible)`);
    } else {
      conflictingElements.push(`Five Element: ${this.fiveElementName(fe1)} + ${this.fiveElementName(fe2)} (needs work)`);
    }

    return {
      harmonious: harmoniousElements,
      conflicting: conflictingElements,
      fiveElementCompatibility: feHarmony
    };
  }

  /**
   * Calculate compatibility score (0-100)
   */
  calculateCompatibilityScore(chart1, chart2, patterns) {
    let score = 50; // Base score

    // Harmonious elements boost
    score += Math.min(patterns.harmonious.length * 5, 20);

    // Conflicting elements penalty
    score -= Math.min(patterns.conflicting.length * 3, 15);

    // Five element bonus
    if (patterns.fiveElementCompatibility) {
      score += 10;
    }

    // Check life house compatibility (same palace = stronger connection)
    if (chart1.lifeHouseIndex === chart2.lifeHouseIndex) {
      score += 5;
    }

    // Check major star overlap
    const stars1 = Object.keys(chart1.starPositions || {});
    const stars2 = Object.keys(chart2.starPositions || {});
    const overlap = stars1.filter(s => stars2.includes(s)).length;
    score += Math.min(overlap * 2, 15);

    return Math.max(0, Math.min(score, 100));
  }

  /**
   * Check if two five-element bureaus are compatible
   */
  checkFiveElementHarmony(bureau1, bureau2) {
    // Wood (3) - Fire (6): harmonious
    // Fire (6) - Earth (5): harmonious
    // Earth (5) - Metal (4): harmonious
    // Metal (4) - Water (2): harmonious
    // Water (2) - Wood (3): harmonious

    const harmonyMap = {
      '3-6': true, '6-3': true,
      '6-5': true, '5-6': true,
      '5-4': true, '4-5': true,
      '4-2': true, '2-4': true,
      '2-3': true, '3-2': true,
      '3-3': true, '6-6': true, '5-5': true, '4-4': true, '2-2': true, // Same element
    };

    const key = `${bureau1}-${bureau2}`;
    return harmonyMap[key] || false;
  }

  /**
   * Build compatibility analysis prompt
   */
  buildCompatibilityPrompt(chart1, chart2, relationshipType, patterns, score) {
    return `You are a Ziwei Astrology expert analyzing relationship compatibility.

Chart 1 Summary:
${this.generateChartSummary(chart1)}

Chart 2 Summary:
${this.generateChartSummary(chart2)}

Relationship Type: ${relationshipType}

Initial Compatibility Assessment:
- Calculated Score: ${score}/100
- Harmonious Elements Found: ${patterns.harmonious.join(', ') || 'None detected'}
- Conflicting Elements Found: ${patterns.conflicting.join(', ') || 'None detected'}

Using Zhongzhou School methodology, provide:

1. **Overall Compatibility**: Assess the relationship potential (0-100 scale rationale)
2. **Strengths**: What makes this pairing work well? Which specific stars/patterns support the relationship?
3. **Challenges**: What obstacles or tensions might arise? How can they be addressed?
4. **Communication Style**: How do these two people likely communicate? Any blind spots?
5. **Life Stages**: Are certain periods better for the relationship? When might tensions arise?
6. **Advice for Success**: 3-4 specific recommendations for making this relationship thrive
7. **Timeline**: Major relationship milestones or transition periods to watch for

For ${relationshipType} relationship specifically:
${this.getRelationshipGuidance(relationshipType)}

Be balanced and honest - not every pairing needs to be perfect, but potential areas of friction should be addressed.`;
  }

  /**
   * Get specific guidance based on relationship type
   */
  getRelationshipGuidance(type) {
    const guidance = {
      romantic: `Focus on emotional connection, attraction, and long-term partnership potential.
                Consider marriage compatibility, family building, and shared life goals.`,
      business: `Evaluate business partnership potential, complementary skills, decision-making styles,
                and financial compatibility. Consider how they handle conflict and risk.`,
      family: `Assess family dynamics, generational differences, support structures, and long-term relationships.
              Consider caregiving potential and family harmony.`,
      friendship: `Evaluate friendship longevity, shared interests, communication ease, and mutual support patterns.
                  Consider how they handle disagreements.`,
      default: `Assess general relationship dynamics and compatibility.`
    };

    return guidance[type] || guidance.default;
  }

  /**
   * Generate chart summary
   */
  generateChartSummary(chart) {
    const fiveElementName = this.fiveElementName(chart.fiveElementBureau);
    const majorStars = Object.keys(chart.starPositions || {}).join(', ');

    return `
Five Element Bureau: ${fiveElementName} (${chart.fiveElementBureau})
Life House Index: ${chart.lifeHouseIndex}
Major Stars: ${majorStars}
Four Transformations: ${Object.values(chart.baseFourTransformations || {}).join(', ')}
`;
  }

  /**
   * Get five element name
   */
  fiveElementName(bureau) {
    const names = {
      2: '水二局 (Water)',
      3: '木三局 (Wood)',
      4: '金四局 (Metal)',
      5: '土五局 (Earth)',
      6: '火六局 (Fire)'
    };
    return names[bureau] || `Bureau ${bureau}`;
  }

  /**
   * Generate suggested improvements for the relationship
   */
  generateImprovementSuggestions(chart1, chart2, relationshipType) {
    const suggestions = [];

    // Based on chart characteristics
    if (relationshipType === 'romantic') {
      suggestions.push('Schedule quality time during harmonious periods');
      suggestions.push('Develop clear communication about expectations');
      suggestions.push('Plan for major life transitions together');
    }

    if (relationshipType === 'business') {
      suggestions.push('Establish clear roles and responsibilities');
      suggestions.push('Create decision-making frameworks before conflicts arise');
      suggestions.push('Plan for handling financial disagreements');
    }

    return suggestions;
  }
}

// Export
module.exports = {
  ZiweiCompatibilityAnalyzer
};
