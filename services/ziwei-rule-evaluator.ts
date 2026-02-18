/**
 * Ziwei Rule Evaluator (紫微規則評估器)
 * Matches birth charts against comprehensive rule database
 *
 * Workflow: Load Rules → Match Star Groups → Match Patterns → Evaluate Conditions → Score Confidence → Rank Results
 */

import type { BaseChart, PalaceInfo } from './ziwei-chart-engine';

// ============================================================================
// RULE TYPES
// ============================================================================

export interface ZiweiRule {
  id: string;
  name: string;
  ruleType: 'star_group' | 'major_pattern' | 'complex_pattern' | 'basic_pattern' | 'miscellaneous_combo';
  scope: 'base' | 'decade' | 'annual';
  condition: RuleCondition;
  interpretation: {
    zh: string;
    en: string;
    short?: string;
  };
  dimensionTags: string[];
  school: string;
  consensusLabel: 'consensus' | 'disputed' | 'minority_view';
  sources: SourceRef[];
  statistics: {
    sampleSize: number | null;
    matchRate: number | null;
    confidence: number | null;
  };
  notes?: string;
  relatedRuleIds?: string[];
}

export interface RuleCondition {
  scope: 'base' | 'decade' | 'annual' | 'monthly' | 'daily';
  involvedPalaces?: string[];
  requiredStars?: string[];
  excludedStars?: string[];
  starGroups?: StarGroup[];
  notes?: string;
  withAffections?: boolean;
  withBlessings?: boolean;
  palacePositions?: string[];
}

export interface StarGroup {
  groupId: string;
  stars: string[];
  relation?: 'same_palace' | 'tri_positional' | 'mutual_watch';
  description?: string;
}

export interface SourceRef {
  type: 'web' | 'book' | 'note' | 'tradition';
  id?: string;
  title?: string;
  author?: string;
  url?: string;
  note?: string;
}

export interface RuleEvaluationResult {
  ruleId: string;
  ruleName: string;
  matched: boolean;
  matchStrength: number; // 0-1
  relevantStars?: string[];
  relevantPalaces?: string[];
  interpretation: {
    zh: string;
    en: string;
  };
  confidence: number;
  consensusLabel: string;
}

export interface RuleEvaluationSet {
  chartId?: string;
  evaluationTime: string;
  totalRules: number;
  matchedRules: number;
  results: RuleEvaluationResult[];
  summary?: {
    dominantPatterns: string[];
    keyDalaces: string[];
    keyStars: string[];
    overallTone: 'auspicious' | 'neutral' | 'challenging';
  };
}

// ============================================================================
// STAR GROUP DEFINITIONS (星群)
// ============================================================================

const STAR_GROUPS: Record<string, StarGroup> = {
  ziwei_group: {
    groupId: 'ziwei_group',
    stars: ['紫微', '天機', '武曲', '廉貞'],
    relation: 'tri_positional',
    description: '紫微星群：紫微必伴天機，三方四正配置武曲、廉貞'
  },
  tianfu_group: {
    groupId: 'tianfu_group',
    stars: ['天府', '天相', '七殺', '破軍'],
    relation: 'tri_positional',
    description: '天府星群：天府+天相為主，三方配置七殺、破軍'
  },
  shapolang_group: {
    groupId: 'shapolang_group',
    stars: ['七殺', '破軍', '貪狼'],
    relation: 'tri_positional',
    description: '殺破狼：高度變動，輪流坐守命宮、官祿宮、財帛宮'
  },
  intellect_group: {
    groupId: 'intellect_group',
    stars: ['天機', '天同', '太陰', '天梁'],
    relation: 'mutual_watch',
    description: '智慧星群：人格智慧與谋划'
  },
  expression_group: {
    groupId: 'expression_group',
    stars: ['太陽', '巨門'],
    relation: 'mutual_watch',
    description: '表達星群：言語與影響力'
  }
};

// ============================================================================
// EVALUATOR CLASS
// ============================================================================

export class ZiweiRuleEvaluator {
  private rules: ZiweiRule[] = [];

  constructor(rules: ZiweiRule[] = []) {
    this.rules = rules;
  }

  /**
   * Add rules to evaluator
   */
  addRules(rules: ZiweiRule[]) {
    this.rules.push(...rules);
  }

  /**
   * Set rules (replace all existing)
   */
  setRules(rules: ZiweiRule[]) {
    this.rules = rules;
  }

  /**
   * Main evaluation function - match chart against all rules
   */
  evaluateChart(chart: BaseChart): RuleEvaluationSet {
    const results: RuleEvaluationResult[] = [];

    for (const rule of this.rules) {
      const result = this.evaluateRule(chart, rule);
      if (result.matched) {
        results.push(result);
      }
    }

    // Sort by confidence and match strength
    results.sort((a, b) => {
      const scoreA = a.matchStrength * a.confidence;
      const scoreB = b.matchStrength * b.confidence;
      return scoreB - scoreA;
    });

    return {
      evaluationTime: new Date().toISOString(),
      totalRules: this.rules.length,
      matchedRules: results.length,
      results,
      summary: this.generateSummary(results, chart)
    };
  }

  /**
   * Evaluate single rule against chart
   */
  private evaluateRule(chart: BaseChart, rule: ZiweiRule): RuleEvaluationResult {
    let matched = false;
    let matchStrength = 0;
    let relevantStars: string[] = [];
    let relevantPalaces: string[] = [];

    // Match by rule type
    switch (rule.ruleType) {
      case 'star_group':
        ({ matched, matchStrength, relevantStars, relevantPalaces } =
          this.matchStarGroup(chart, rule));
        break;

      case 'major_pattern':
      case 'complex_pattern':
        ({ matched, matchStrength, relevantStars, relevantPalaces } =
          this.matchMajorPattern(chart, rule));
        break;

      case 'basic_pattern':
        ({ matched, matchStrength, relevantStars, relevantPalaces } =
          this.matchBasicPattern(chart, rule));
        break;

      case 'miscellaneous_combo':
        ({ matched, matchStrength, relevantStars, relevantPalaces } =
          this.matchMiscellaneousCombo(chart, rule));
        break;
    }

    // Calculate confidence from statistics
    const baseConfidence = rule.statistics.confidence ?? 0.7;
    const adjustedConfidence = baseConfidence * matchStrength;

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      matched,
      matchStrength,
      relevantStars,
      relevantPalaces,
      interpretation: {
        zh: rule.interpretation.zh,
        en: rule.interpretation.en
      },
      confidence: adjustedConfidence,
      consensusLabel: rule.consensusLabel
    };
  }

  /**
   * Match star group rules (星群)
   */
  private matchStarGroup(
    chart: BaseChart,
    rule: ZiweiRule
  ): { matched: boolean; matchStrength: number; relevantStars: string[]; relevantPalaces: string[] } {
    const { requiredStars = [] } = rule.condition;
    if (requiredStars.length === 0) {
      return { matched: false, matchStrength: 0, relevantStars: [], relevantPalaces: [] };
    }

    const foundStars: string[] = [];
    const palaces: Set<string> = new Set();

    // Check if all required stars are present
    for (const star of requiredStars) {
      const position = this.findStarPosition(chart, star);
      if (position) {
        foundStars.push(star);
        palaces.add(position);
      }
    }

    const matched = foundStars.length === requiredStars.length;
    const matchStrength = matched ? 1.0 : foundStars.length / requiredStars.length;

    return {
      matched,
      matchStrength,
      relevantStars: foundStars,
      relevantPalaces: Array.from(palaces)
    };
  }

  /**
   * Match major patterns (大格局/複合格局)
   */
  private matchMajorPattern(
    chart: BaseChart,
    rule: ZiweiRule
  ): { matched: boolean; matchStrength: number; relevantStars: string[]; relevantPalaces: string[] } {
    // Special handling for 殺破狼格
    if (rule.name.includes('殺破狼')) {
      return this.matchShaPoLangPattern(chart, rule);
    }

    // Special handling for 府相格
    if (rule.name.includes('府相')) {
      return this.matchFuXiangPattern(chart, rule);
    }

    // Default multi-star group matching
    const { requiredStars = [] } = rule.condition;
    return this.matchStarGroup(chart, rule);
  }

  /**
   * Match Sha Po Lang pattern (殺破狼格)
   * All three stars in Life/Career/Wealth Palaces
   */
  private matchShaPoLangPattern(
    chart: BaseChart,
    rule: ZiweiRule
  ): { matched: boolean; matchStrength: number; relevantStars: string[]; relevantPalaces: string[] } {
    const targetPalaces = ['命宮', '官祿宮', '財帛宮'];
    const requiredStars = ['七殺', '破軍', '貪狼'];
    const foundStars: string[] = [];
    const usedPalaces: string[] = [];

    for (const palace of targetPalaces) {
      const palaceInfo = this.getPalaceInfo(chart, palace);
      if (palaceInfo) {
        const matchedStars = palaceInfo.majorStars.filter(s => requiredStars.includes(s));
        if (matchedStars.length > 0) {
          foundStars.push(...matchedStars);
          usedPalaces.push(palace);
        }
      }
    }

    const matched = foundStars.length === 3 && usedPalaces.length === 3;
    const matchStrength = Math.min(foundStars.length / 3, usedPalaces.length / 3);

    return {
      matched,
      matchStrength,
      relevantStars: foundStars,
      relevantPalaces: usedPalaces
    };
  }

  /**
   * Match Fu Xiang pattern (府相格)
   * Tianfu + Tianxiang stable management combination
   */
  private matchFuXiangPattern(
    chart: BaseChart,
    rule: ZiweiRule
  ): { matched: boolean; matchStrength: number; relevantStars: string[]; relevantPalaces: string[] } {
    const requiredStars = ['天府', '天相'];
    const foundStars: string[] = [];
    const palaces: Set<string> = new Set();

    // Find both stars in chart
    for (const star of requiredStars) {
      const position = this.findStarPosition(chart, star);
      if (position) {
        foundStars.push(star);
        palaces.add(position);
      }
    }

    // Fu Xiang typically in Life or Career Palace
    const validPalaces = Array.from(palaces).filter(p =>
      p === '命宮' || p === '官祿宮'
    );

    const matched = foundStars.length === 2 && validPalaces.length > 0;
    const matchStrength = matched ? 1.0 : foundStars.length / 2;

    return {
      matched,
      matchStrength,
      relevantStars: foundStars,
      relevantPalaces: Array.from(palaces)
    };
  }

  /**
   * Match basic patterns (基本格局)
   * Sun-Moon Brilliance, etc.
   */
  private matchBasicPattern(
    chart: BaseChart,
    rule: ZiweiRule
  ): { matched: boolean; matchStrength: number; relevantStars: string[]; relevantPalaces: string[] } {
    // Sun-Moon Brilliance: Sun + Moon in unobstructed bright positions
    if (rule.name.includes('日月並明')) {
      return this.matchSunMoonBrilliance(chart, rule);
    }

    return this.matchStarGroup(chart, rule);
  }

  /**
   * Match Sun-Moon Brilliance pattern (日月並明格)
   */
  private matchSunMoonBrilliance(
    chart: BaseChart,
    rule: ZiweiRule
  ): { matched: boolean; matchStrength: number; relevantStars: string[]; relevantPalaces: string[] } {
    const sunPos = this.findStarPosition(chart, '太陽');
    const moonPos = this.findStarPosition(chart, '太陰');
    const foundStars: string[] = [];
    const palaces: Set<string> = new Set();

    if (sunPos) {
      foundStars.push('太陽');
      palaces.add(sunPos);
    }
    if (moonPos) {
      foundStars.push('太陰');
      palaces.add(moonPos);
    }

    // Check if there are no afflictions
    const hasAffections = this.checkAffections(chart);

    const matched = foundStars.length === 2 && !hasAffections;
    const matchStrength = foundStars.length === 2 ? (hasAffections ? 0.6 : 1.0) : 0.5;

    return {
      matched: matched && matchStrength > 0.7,
      matchStrength,
      relevantStars: foundStars,
      relevantPalaces: Array.from(palaces)
    };
  }

  /**
   * Match miscellaneous star combinations (雜曜組合)
   */
  private matchMiscellaneousCombo(
    chart: BaseChart,
    rule: ZiweiRule
  ): { matched: boolean; matchStrength: number; relevantStars: string[]; relevantPalaces: string[] } {
    const { requiredStars = [] } = rule.condition;

    if (requiredStars.length === 0) {
      return { matched: false, matchStrength: 0, relevantStars: [], relevantPalaces: [] };
    }

    const foundStars: string[] = [];
    const palaces: Set<string> = new Set();

    for (const star of requiredStars) {
      const position = this.findStarPosition(chart, star);
      if (position) {
        foundStars.push(star);
        palaces.add(position);
      }
    }

    const matched = foundStars.length >= Math.max(2, requiredStars.length - 1);
    const matchStrength = foundStars.length / requiredStars.length;

    return {
      matched,
      matchStrength,
      relevantStars: foundStars,
      relevantPalaces: Array.from(palaces)
    };
  }

  /**
   * Find which palace contains a star
   */
  private findStarPosition(chart: BaseChart, star: string): string | null {
    if (!chart.houses) return null;

    for (let i = 0; i < chart.houses.length; i++) {
      const house = chart.houses[i];
      if (house.majorStars?.includes(star)) {
        return house.name;
      }
    }

    return null;
  }

  /**
   * Get palace info by name
   */
  private getPalaceInfo(chart: BaseChart, palaceName: string): PalaceInfo | null {
    if (!chart.houses) return null;
    return chart.houses.find(h => h.name === palaceName) || null;
  }

  /**
   * Check if chart has afflictions (凶星)
   */
  private checkAffections(chart: BaseChart): boolean {
    const afflictionStars = [
      '火星', '鈴星', '陀羅', '擎羊',
      '地空', '地劫', '天傷', '天使'
    ];

    if (!chart.houses) return false;

    for (const house of chart.houses) {
      for (const star of house.majorStars || []) {
        if (afflictionStars.includes(star)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Generate summary of evaluation
   */
  private generateSummary(
    results: RuleEvaluationResult[],
    chart: BaseChart
  ): Record<string, any> {
    // Extract dominant patterns
    const patterns = results
      .filter(r => r.ruleType !== 'miscellaneous_combo')
      .slice(0, 3)
      .map(r => r.ruleName);

    // Extract key stars from results
    const keyStarsSet = new Set<string>();
    results.forEach(r => {
      r.relevantStars?.forEach(s => keyStarsSet.add(s));
    });

    // Extract key palaces
    const keyPalacesSet = new Set<string>();
    results.forEach(r => {
      r.relevantPalaces?.forEach(p => keyPalacesSet.add(p));
    });

    // Determine overall tone
    const auspiciousCount = results.filter(
      r => !r.ruleName.includes('凶') && !r.ruleName.includes('煞') && !r.ruleName.includes('訟')
    ).length;
    const challengingCount = results.length - auspiciousCount;

    let overallTone: 'auspicious' | 'neutral' | 'challenging' = 'neutral';
    if (auspiciousCount > challengingCount * 1.5) {
      overallTone = 'auspicious';
    } else if (challengingCount > auspiciousCount * 1.5) {
      overallTone = 'challenging';
    }

    return {
      dominantPatterns: patterns,
      keyStars: Array.from(keyStarsSet),
      keyPalaces: Array.from(keyPalacesSet),
      overallTone,
      matchSummary: `Found ${results.length} matching rules across ${keyPalacesSet.size} palaces`
    };
  }

  /**
   * Filter results by consensus level
   */
  filterByConsensus(results: RuleEvaluationSet, minConsensus: 'consensus' | 'disputed' | 'minority_view'): RuleEvaluationSet {
    const consensusLevels = ['consensus', 'disputed', 'minority_view'];
    const minIndex = consensusLevels.indexOf(minConsensus);

    const filtered = results.results.filter(r => {
      const rIndex = consensusLevels.indexOf(r.consensusLabel);
      return rIndex <= minIndex;
    });

    return {
      ...results,
      matchedRules: filtered.length,
      results: filtered
    };
  }

  /**
   * Filter results by dimension tag
   */
  filterByDimension(results: RuleEvaluationSet, dimensions: string[]): RuleEvaluationSet {
    const dimensionSet = new Set(dimensions);

    const filtered = results.results.filter(r => {
      // Find the rule to get its dimensions
      const rule = this.rules.find(ru => ru.id === r.ruleId);
      if (!rule) return false;

      return rule.dimensionTags.some(d => dimensionSet.has(d));
    });

    return {
      ...results,
      matchedRules: filtered.length,
      results: filtered
    };
  }

  /**
   * Get all rules
   */
  getRules(): ZiweiRule[] {
    return this.rules;
  }

  /**
   * Get rule by ID
   */
  getRuleById(id: string): ZiweiRule | undefined {
    return this.rules.find(r => r.id === id);
  }
}

export default ZiweiRuleEvaluator;
