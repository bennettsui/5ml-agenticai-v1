/**
 * Ziwei Interpretation Agent (紫微解讀引擎)
 *
 * Responsible for:
 * - Matching birth chart against interpretation rules
 * - Generating contextual Chinese language interpretations
 * - Handling consensus/disputed/minority view rules appropriately
 * - Providing accuracy statistics when available
 * - Supporting user follow-ups on specific dimensions
 *
 * Input: BirthChart + User query (dimensions of interest, life stage)
 * Output: Structured interpretation with rules used, accuracy info, alternative views
 */

import {
  BirthChart,
  InterpretationRule,
  RuleSet,
  LifeDimension,
  LifeStage,
  ConsensusLevel,
  AstrologySchool,
  ChartType
} from '../knowledge/schema/ziwei-types';

// ============================================================================
// AGENT INPUT/OUTPUT INTERFACES
// ============================================================================

/**
 * User's interpretation request
 */
export interface InterpretationQuery {
  birth_chart: BirthChart;
  focus_dimensions?: LifeDimension[];     // If not specified, analyze all
  life_stage?: LifeStage;                 // User's current life stage (for context)
  current_age?: number;                   // For matching decade luck, etc.
  query_text?: string;                    // Optional free-form question
  options?: {
    include_disputed?: boolean;           // Show disputed interpretations (default: true)
    include_minority_views?: boolean;     // Show minority views (default: true)
    min_accuracy_threshold?: number;      // Only show rules above this match rate (0-1, default: 0.5)
    language?: 'zh' | 'en';               // Chinese or English (default: 'zh')
    detailed_mode?: boolean;              // Include full rule metadata (default: false)
  };
}

/**
 * Single interpretation segment
 */
export interface InterpretationSegment {
  rule_id: string;
  title?: string;
  interpretation_text: string;
  life_dimensions: LifeDimension[];
  consensus_label: ConsensusLevel;
  school: AstrologySchool;
  accuracy_info?: {
    sample_size: number;
    match_rate: number;
    confidence_level: 'high' | 'medium' | 'low';
    note?: string;
  };
  alternative_views?: {
    school: AstrologySchool;
    interpretation_text: string;
    consensus_label: ConsensusLevel;
  }[];
  source_summary?: string;
}

/**
 * Grouping for interpretations by dimension
 */
export interface InterpretationByDimension {
  dimension: LifeDimension;
  segments: InterpretationSegment[];
  summary?: string;
}

/**
 * Output for InterpretationAgent - Success case
 */
export interface InterpretationSuccess {
  status: 'success';
  chart_id: string;
  interpretations: InterpretationByDimension[];
  consensus_count: number;
  disputed_count: number;
  minority_view_count: number;
  high_accuracy_count: number;        // Rules with match_rate > threshold
  generation_time_ms: number;
  notes?: string[];
}

/**
 * Output for InterpretationAgent - Error case
 */
export interface InterpretationError {
  status: 'error';
  error_code: string;
  error_message: string;
  details?: Record<string, any>;
}

export type InterpretationOutput = InterpretationSuccess | InterpretationError;

// ============================================================================
// INTERPRETATION AGENT CLASS
// ============================================================================

/**
 * InterpretationAgent - Generates human-readable interpretations from birth chart
 *
 * This agent:
 * 1. Receives a birth chart (already calculated by ChartEngineAgent)
 * 2. Loads applicable interpretation rules
 * 3. Matches chart features against rules
 * 4. Filters by user preferences (dimension, accuracy, consensus level)
 * 5. Generates organized interpretation output
 * 6. Tracks which rules were used for future evaluation
 */
export class InterpretationAgent {
  private rulesDatabase: InterpretationRule[] = [];

  constructor() {
    // In production, this would load rules from database
    // For now, stub initialization
    this.initializeRulesDatabase();
  }

  /**
   * Main method: Generate interpretation from birth chart
   *
   * @param query - Birth chart + user preferences
   * @returns Structured interpretation or error
   *
   * @example
   * const agent = new InterpretationAgent();
   * const result = await agent.generateInterpretation({
   *   birth_chart: chart,
   *   focus_dimensions: [LifeDimension.CAREER, LifeDimension.WEALTH],
   *   life_stage: LifeStage.YOUNG_ADULT,
   *   current_age: 28,
   *   options: {
   *     include_disputed: true,
   *     min_accuracy_threshold: 0.7,
   *     language: 'zh'
   *   }
   * });
   */
  async generateInterpretation(query: InterpretationQuery): Promise<InterpretationOutput> {
    const startTime = Date.now();

    try {
      // Step 1: Validate input
      this.validateQuery(query);

      // Step 2: Parse options
      const options = {
        include_disputed: query.options?.include_disputed ?? true,
        include_minority_views: query.options?.include_minority_views ?? true,
        min_accuracy_threshold: query.options?.min_accuracy_threshold ?? 0.5,
        language: query.options?.language ?? 'zh',
        detailed_mode: query.options?.detailed_mode ?? false
      };

      // Step 3: Match rules against chart
      const matchedRules = await this.matchRulesToChart(
        query.birth_chart,
        query.focus_dimensions,
        query.current_age,
        options
      );

      // Step 4: Filter rules by user preferences
      const filteredRules = this.filterRules(matchedRules, options);

      // Step 5: Generate interpretation segments
      const segments = await this.generateSegments(filteredRules, options);

      // Step 6: Organize by dimension
      const interpretations = this.organizeBytoDimension(segments);

      // Step 7: Prepare response
      const consensusCount = filteredRules.filter(r => r.consensus_label === ConsensusLevel.CONSENSUS).length;
      const disputedCount = filteredRules.filter(r => r.consensus_label === ConsensusLevel.DISPUTED).length;
      const minorityCount = filteredRules.filter(r => r.consensus_label === ConsensusLevel.MINORITY_VIEW).length;
      const highAccuracyCount = filteredRules.filter(r =>
        r.statistics && r.statistics.match_rate >= options.min_accuracy_threshold
      ).length;

      const duration = Date.now() - startTime;

      return {
        status: 'success',
        chart_id: query.birth_chart.id,
        interpretations,
        consensus_count: consensusCount,
        disputed_count: disputedCount,
        minority_view_count: minorityCount,
        high_accuracy_count: highAccuracyCount,
        generation_time_ms: duration,
        notes: [
          `Generated interpretation for chart ${query.birth_chart.chart_id_code}`,
          `Matched ${filteredRules.length} rules out of ${matchedRules.length} candidates`,
          `Consensus rules: ${consensusCount}, Disputed: ${disputedCount}, Minority views: ${minorityCount}`
        ]
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        status: 'error',
        error_code: 'INTERPRETATION_GENERATION_FAILED',
        error_message: `Failed to generate interpretation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: {
          generation_time_ms: duration
        }
      };
    }
  }

  /**
   * Match rules to chart features
   * Returns rules that apply to the given chart
   */
  private async matchRulesToChart(
    chart: BirthChart,
    focusDimensions?: LifeDimension[],
    currentAge?: number,
    options?: any
  ): Promise<InterpretationRule[]> {
    const matches: InterpretationRule[] = [];

    for (const rule of this.rulesDatabase) {
      // Skip if rule is inactive
      if (!rule.is_active) continue;

      // Filter by dimension if specified
      if (focusDimensions && focusDimensions.length > 0) {
        const hasDimensionMatch = rule.dimension_tags.some(d => focusDimensions.includes(d));
        if (!hasDimensionMatch) continue;
      }

      // Check chart scope
      // (In real implementation, would check if chart has features matching rule.condition)
      // For now, accept all active rules

      // Check age context if available
      if (currentAge && rule.condition.time_context?.max_age) {
        if (currentAge > rule.condition.time_context.max_age) continue;
      }

      matches.push(rule);
    }

    return matches;
  }

  /**
   * Filter rules based on consensus/accuracy preferences
   */
  private filterRules(
    rules: InterpretationRule[],
    options: any
  ): InterpretationRule[] {
    return rules.filter(rule => {
      // Filter by consensus level
      if (rule.consensus_label === ConsensusLevel.DISPUTED && !options.include_disputed) {
        return false;
      }
      if (rule.consensus_label === ConsensusLevel.MINORITY_VIEW && !options.include_minority_views) {
        return false;
      }

      // Filter by accuracy threshold
      if (rule.statistics && rule.statistics.match_rate < options.min_accuracy_threshold) {
        return false;
      }

      return true;
    });
  }

  /**
   * Generate interpretation segments from matched rules
   */
  private async generateSegments(
    rules: InterpretationRule[],
    options: any
  ): Promise<InterpretationSegment[]> {
    const segments: InterpretationSegment[] = [];

    for (const rule of rules) {
      const segment: InterpretationSegment = {
        rule_id: rule.id,
        title: rule.title,
        interpretation_text: options.language === 'en'
          ? rule.interpretation.en || rule.interpretation.zh
          : rule.interpretation.zh,
        life_dimensions: rule.dimension_tags,
        consensus_label: rule.consensus_label,
        school: rule.school
      };

      // Add accuracy info if detailed mode
      if (options.detailed_mode && rule.statistics) {
        segment.accuracy_info = {
          sample_size: rule.statistics.sample_size,
          match_rate: rule.statistics.match_rate,
          confidence_level: rule.statistics.confidence_level,
          note: rule.statistics.evaluation_note
        };
      }

      // Include conflicting rules as alternative views
      if (rule.conflicts_with && rule.conflicts_with.length > 0) {
        // (In real implementation, would look up conflicting rules)
        segment.alternative_views = [];
      }

      // Add source summary
      if (rule.source_refs.length > 0) {
        const sourceAuthors = rule.source_refs
          .map(s => s.author || s.teacher || s.url)
          .filter(Boolean);
        segment.source_summary = sourceAuthors.slice(0, 2).join(', ');
      }

      segments.push(segment);
    }

    return segments;
  }

  /**
   * Organize segments by life dimension
   */
  private organizeBytoDimension(
    segments: InterpretationSegment[]
  ): InterpretationByDimension[] {
    const byDimension = new Map<LifeDimension, InterpretationSegment[]>();

    // Initialize all dimensions
    for (const dimension of Object.values(LifeDimension)) {
      byDimension.set(dimension, []);
    }

    // Distribute segments
    for (const segment of segments) {
      for (const dimension of segment.life_dimensions) {
        const existing = byDimension.get(dimension) || [];
        existing.push(segment);
        byDimension.set(dimension, existing);
      }
    }

    // Convert to array format, filtering empty dimensions
    const result: InterpretationByDimension[] = [];
    for (const [dimension, segs] of byDimension.entries()) {
      if (segs.length > 0) {
        result.push({
          dimension,
          segments: segs
        });
      }
    }

    return result;
  }

  /**
   * Validate interpretation query
   */
  private validateQuery(query: InterpretationQuery): void {
    if (!query.birth_chart) {
      throw new Error('Birth chart is required');
    }
    if (!query.birth_chart.id) {
      throw new Error('Birth chart must have an id');
    }
  }

  /**
   * Initialize rules database
   * In production, this would fetch from database or file system
   */
  private initializeRulesDatabase(): void {
    // Stub: Load example rules
    // In real implementation: await db.getRules() or import from rules files
  }

  /**
   * Get interpretation for specific dimension
   */
  async getInterpretationForDimension(
    interpretation: InterpretationSuccess,
    dimension: LifeDimension
  ): Promise<InterpretationSegment[]> {
    const dimensionData = interpretation.interpretations.find(i => i.dimension === dimension);
    return dimensionData?.segments || [];
  }

  /**
   * Get consensus vs disputed breakdown
   */
  getConsensusBreakdown(interpretation: InterpretationSuccess): {
    consensus: number;
    disputed: number;
    minorityViews: number;
    total: number;
  } {
    const total = interpretation.consensus_count + interpretation.disputed_count + interpretation.minority_view_count;
    return {
      consensus: interpretation.consensus_count,
      disputed: interpretation.disputed_count,
      minorityViews: interpretation.minority_view_count,
      total
    };
  }
}

export default InterpretationAgent;
