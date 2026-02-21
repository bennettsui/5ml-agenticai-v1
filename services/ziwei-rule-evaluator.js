/**
 * Ziwei Rule Evaluator (紫微規則評估器)
 * Matches birth charts against rules
 */

class ZiweiRuleEvaluator {
  constructor(rules = []) {
    this.rules = rules;
  }

  evaluateChart(chart) {
    const results = [];

    if (!chart || !chart.palaces) {
      return results;
    }

    // Extract stars from chart
    const chartStars = new Set();
    const chartPalaces = {};

    chart.palaces.forEach(palace => {
      chartPalaces[palace.palace_name] = palace;
      if (palace.ziwei_star) chartStars.add(palace.ziwei_star);
      if (palace.tianfu_star) chartStars.add(palace.tianfu_star);
      if (palace.major_stars) {
        palace.major_stars.forEach(star => chartStars.add(star));
      }
    });

    // Evaluate each rule
    for (const rule of this.rules) {
      const matched = this.matchesRule(rule, chartStars, chartPalaces);

      if (matched) {
        results.push({
          ruleId: rule.id || Math.random().toString(36).substr(2, 9),
          ruleName: rule.name || 'Unknown Rule',
          matched: true,
          matchStrength: 0.8,
          interpretation: {
            zh: rule.interpretation?.zh || '',
            en: rule.interpretation?.en || ''
          },
          confidence: 0.8,
          consensusLabel: rule.consensus_label || 'consensus'
        });
      }
    }

    return results;
  }

  matchesRule(rule, stars, palaces) {
    if (!rule.condition) return false;

    // Check required stars
    if (rule.condition.requiredStars && Array.isArray(rule.condition.requiredStars)) {
      const hasAllRequired = rule.condition.requiredStars.every(star => stars.has(star));
      if (!hasAllRequired) return false;
    }

    // Check excluded stars
    if (rule.condition.excludedStars && Array.isArray(rule.condition.excludedStars)) {
      const hasExcluded = rule.condition.excludedStars.some(star => stars.has(star));
      if (hasExcluded) return false;
    }

    return true;
  }

  filterByConsensus(results, consensusLevel) {
    if (!consensusLevel || consensusLevel === 'minority_view') {
      return results;
    }

    const consensusMap = {
      'high': ['consensus'],
      'consensus': ['consensus', 'disputed'],
      'all': ['consensus', 'disputed', 'minority_view']
    };

    const allowedLabels = consensusMap[consensusLevel] || ['consensus'];
    return results.filter(r => allowedLabels.includes(r.consensusLabel));
  }

  filterByDimension(results, dimensions) {
    if (!dimensions || !Array.isArray(dimensions) || dimensions.length === 0) {
      return results;
    }

    return results.filter(r => {
      // If rule has dimension_tags, check if any match
      if (r.dimensionTags && Array.isArray(r.dimensionTags)) {
        return r.dimensionTags.some(tag => dimensions.includes(tag));
      }
      return true; // Include if no dimension tags
    });
  }
}

// Export for CommonJS
module.exports = ZiweiRuleEvaluator;
module.exports.ZiweiRuleEvaluator = ZiweiRuleEvaluator;
module.exports.default = ZiweiRuleEvaluator;
