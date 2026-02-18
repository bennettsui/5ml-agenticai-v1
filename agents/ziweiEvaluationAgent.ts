/**
 * Ziwei Evaluation Agent (紫微評估引擎)
 *
 * Responsible for:
 * - Collecting user feedback on interpretation accuracy
 * - Tracking which rules were used in each interpretation
 * - Updating rule statistics (sample_size, match_rate)
 * - Identifying rules that need human review
 * - Generating accuracy reports and recommendations
 *
 * Input: Interpretation log + user feedback + actual outcomes
 * Output: Updated rule statistics, accuracy reports, review recommendations
 */

import {
  InterpretationRule,
  ConsensusLevel,
  LifeDimension
} from '../knowledge/schema/ziwei-types';

// ============================================================================
// AGENT INPUT/OUTPUT INTERFACES
// ============================================================================

/**
 * Represents a single interpretation that was provided to user
 */
export interface InterpretationLog {
  interpretation_id: string;
  chart_id: string;
  generated_at: string;              // ISO 8601 timestamp
  rules_used: string[];              // Rule IDs that were used
  dimensions_covered: LifeDimension[];
}

/**
 * User feedback on a specific interpretation
 */
export interface UserFeedback {
  interpretation_id: string;
  feedback_timestamp: string;        // ISO 8601 timestamp
  accuracy_rating: number;           // 1-5 scale (1=very inaccurate, 5=very accurate)
  feedback_text?: string;            // Optional narrative feedback
  relevant_to_dimensions?: LifeDimension[];  // Which dimensions was feedback about?
}

/**
 * Actual life event that occurred
 */
export interface LifeEventOutcome {
  event_type: 'career_change' | 'relationship_change' | 'health_event' | 'financial_change' | 'other';
  date_occurred: string;             // ISO 8601 date
  description?: string;
  dimension: LifeDimension;
  severity: 'minor' | 'moderate' | 'major';  // How significant was the event?
}

/**
 * Complete evaluation feedback for an interpretation
 */
export interface EvaluationInput {
  interpretation_log: InterpretationLog;
  user_feedback?: UserFeedback;
  life_event_outcomes?: LifeEventOutcome[];
  evaluator_notes?: string;          // Expert notes if evaluated by human
}

/**
 * Statistics update for a single rule
 */
export interface RuleStatisticsUpdate {
  rule_id: string;
  new_sample_size: number;
  new_match_rate: number;
  updated_at: string;
  delta_sample_size: number;         // How many new samples
  delta_match_rate: number;          // Change in match rate
}

/**
 * Rule requiring review
 */
export interface RuleReviewRecommendation {
  rule_id: string;
  title?: string;
  reason: 'low_accuracy' | 'disputed_consensus' | 'minority_view' | 'low_sample_size' | 'conflicting_feedback';
  current_statistics: {
    sample_size: number;
    match_rate: number;
    confidence_level: string;
  };
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Output for EvaluationAgent - Success case
 */
export interface EvaluationSuccess {
  status: 'success';
  interpretation_id: string;
  rules_updated: number;
  statistics_updates: RuleStatisticsUpdate[];
  rules_for_review: RuleReviewRecommendation[];
  accuracy_summary: {
    average_rating: number;           // From user feedback
    rules_with_accuracy_> 80: number;
    rules_with_accuracy_< 60: number;
  };
  processing_time_ms: number;
  notes?: string[];
}

/**
 * Output for EvaluationAgent - Error case
 */
export interface EvaluationError {
  status: 'error';
  error_code: string;
  error_message: string;
  details?: Record<string, any>;
}

export type EvaluationOutput = EvaluationSuccess | EvaluationError;

// ============================================================================
// EVALUATION AGENT CLASS
// ============================================================================

/**
 * EvaluationAgent - Updates rule accuracy statistics based on feedback
 *
 * This agent:
 * 1. Receives interpretation usage log + user feedback
 * 2. Associates feedback with specific rules that were used
 * 3. Updates rule statistics (sample_size, match_rate)
 * 4. Identifies rules needing human review
 * 5. Generates accuracy reports for continuous improvement
 */
export class EvaluationAgent {
  /**
   * Main method: Process evaluation feedback and update rules
   *
   * @param input - Evaluation feedback (interpretation log + user/event feedback)
   * @returns Updated statistics and review recommendations
   *
   * @example
   * const agent = new EvaluationAgent();
   * const result = await agent.processEvaluation({
   *   interpretation_log: {
   *     interpretation_id: 'interp_001',
   *     chart_id: 'chart_001',
   *     generated_at: '2024-01-15T10:00:00Z',
   *     rules_used: ['lz_si_career_001', 'ty_si_wealth_002'],
   *     dimensions_covered: ['career', 'wealth']
   *   },
   *   user_feedback: {
   *     interpretation_id: 'interp_001',
   *     feedback_timestamp: '2024-02-15T10:00:00Z',
   *     accuracy_rating: 4,
   *     feedback_text: 'The career interpretation was accurate, but wealth analysis seemed off',
   *     relevant_to_dimensions: ['career']
   *   },
   *   life_event_outcomes: [
   *     {
   *       event_type: 'career_change',
   *       date_occurred: '2024-02-01',
   *       dimension: LifeDimension.CAREER,
   *       severity: 'major'
   *     }
   *   ]
   * });
   */
  async processEvaluation(input: EvaluationInput): Promise<EvaluationOutput> {
    const startTime = Date.now();

    try {
      // Step 1: Validate input
      this.validateInput(input);

      // Step 2: Determine which rules should receive feedback
      const rulesForFeedback = this.mapFeedbackToRules(input);

      // Step 3: Calculate accuracy changes
      const statisticsUpdates = await this.calculateStatisticsUpdates(
        rulesForFeedback,
        input.user_feedback,
        input.life_event_outcomes
      );

      // Step 4: Identify rules for review
      const rulesForReview = this.identifyRulesForReview(
        rulesForFeedback,
        statisticsUpdates
      );

      // Step 5: Compile accuracy summary
      const accuracySummary = this.compileAccuracySummary(
        statisticsUpdates,
        input.user_feedback
      );

      // Step 6: Prepare response
      const duration = Date.now() - startTime;

      return {
        status: 'success',
        interpretation_id: input.interpretation_log.interpretation_id,
        rules_updated: statisticsUpdates.length,
        statistics_updates: statisticsUpdates,
        rules_for_review: rulesForReview,
        accuracy_summary: accuracySummary,
        processing_time_ms: duration,
        notes: [
          `Processed evaluation for interpretation ${input.interpretation_log.interpretation_id}`,
          `Updated statistics for ${statisticsUpdates.length} rules`,
          `Identified ${rulesForReview.length} rules for review`
        ]
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        status: 'error',
        error_code: 'EVALUATION_PROCESSING_FAILED',
        error_message: `Failed to process evaluation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: {
          processing_time_ms: duration
        }
      };
    }
  }

  /**
   * Map user feedback to specific rules
   * Determines which rules should be credited/debited based on feedback
   */
  private mapFeedbackToRules(input: EvaluationInput): {
    rule_id: string;
    feedback_relevance: 'direct' | 'indirect' | 'related';
  }[] {
    const rulesForFeedback: {
      rule_id: string;
      feedback_relevance: 'direct' | 'indirect' | 'related';
    }[] = [];

    const { user_feedback, life_event_outcomes } = input;
    const rulesUsed = input.interpretation_log.rules_used;

    // If user provided feedback on specific dimensions,
    // map it to rules that covered those dimensions
    if (user_feedback?.relevant_to_dimensions && user_feedback.relevant_to_dimensions.length > 0) {
      for (const ruleId of rulesUsed) {
        rulesForFeedback.push({
          rule_id: ruleId,
          feedback_relevance: 'direct'
        });
      }
    }

    // If there were actual life events, credit relevant rules
    if (life_event_outcomes && life_event_outcomes.length > 0) {
      for (const ruleId of rulesUsed) {
        rulesForFeedback.push({
          rule_id: ruleId,
          feedback_relevance: 'indirect'
        });
      }
    }

    return rulesForFeedback;
  }

  /**
   * Calculate statistics updates based on feedback
   */
  private async calculateStatisticsUpdates(
    rulesForFeedback: Array<{ rule_id: string; feedback_relevance: string }>,
    userFeedback?: UserFeedback,
    lifeEvents?: LifeEventOutcome[]
  ): Promise<RuleStatisticsUpdate[]> {
    const updates: RuleStatisticsUpdate[] = [];

    for (const ruleRef of rulesForFeedback) {
      const ruleId = ruleRef.rule_id;

      // In real implementation, would:
      // 1. Fetch current rule from database
      // 2. Get current sample_size and match_rate
      // 3. Calculate new match_rate based on feedback
      // 4. Save updated rule

      // Stub implementation: assume feedback is always positive
      const accuracyBoost = userFeedback?.accuracy_rating ? (userFeedback.accuracy_rating / 5) : 0.8;

      updates.push({
        rule_id: ruleId,
        new_sample_size: 50,  // Stub: would be incremented
        new_match_rate: 0.82,  // Stub: would be recalculated
        updated_at: new Date().toISOString(),
        delta_sample_size: 1,
        delta_match_rate: accuracyBoost * 0.05  // Example change
      });
    }

    return updates;
  }

  /**
   * Identify rules that need human review
   */
  private identifyRulesForReview(
    rulesForFeedback: Array<{ rule_id: string; feedback_relevance: string }>,
    statisticsUpdates: RuleStatisticsUpdate[]
  ): RuleReviewRecommendation[] {
    const recommendations: RuleReviewRecommendation[] = [];

    for (const update of statisticsUpdates) {
      const reasons: Array<'low_accuracy' | 'disputed_consensus' | 'minority_view' | 'low_sample_size' | 'conflicting_feedback'> = [];

      // Check for low accuracy
      if (update.new_match_rate < 0.6) {
        reasons.push('low_accuracy');
      }

      // Check for low sample size
      if (update.new_sample_size < 10) {
        reasons.push('low_sample_size');
      }

      // If any reasons found, create recommendation
      if (reasons.length > 0) {
        recommendations.push({
          rule_id: update.rule_id,
          reason: reasons[0],
          current_statistics: {
            sample_size: update.new_sample_size,
            match_rate: update.new_match_rate,
            confidence_level: this.getConfidenceLevel(update.new_match_rate)
          },
          recommendation: this.generateRecommendation(reasons, update.new_match_rate),
          priority: this.calculatePriority(update.new_match_rate, update.new_sample_size)
        });
      }
    }

    return recommendations;
  }

  /**
   * Compile accuracy summary
   */
  private compileAccuracySummary(
    statisticsUpdates: RuleStatisticsUpdate[],
    userFeedback?: UserFeedback
  ): {
    average_rating: number;
    rules_with_accuracy_> 80: number;
    rules_with_accuracy_< 60: number;
  } {
    let highAccuracy = 0;
    let lowAccuracy = 0;

    for (const update of statisticsUpdates) {
      if (update.new_match_rate > 0.8) highAccuracy++;
      if (update.new_match_rate < 0.6) lowAccuracy++;
    }

    return {
      average_rating: userFeedback?.accuracy_rating || 3.5,
      'rules_with_accuracy_> 80': highAccuracy,
      'rules_with_accuracy_< 60': lowAccuracy
    };
  }

  /**
   * Validate evaluation input
   */
  private validateInput(input: EvaluationInput): void {
    if (!input.interpretation_log) {
      throw new Error('Interpretation log is required');
    }
    if (!input.interpretation_log.interpretation_id) {
      throw new Error('Interpretation ID is required');
    }
    if (input.user_feedback?.accuracy_rating) {
      if (input.user_feedback.accuracy_rating < 1 || input.user_feedback.accuracy_rating > 5) {
        throw new Error('Accuracy rating must be between 1 and 5');
      }
    }
  }

  /**
   * Get confidence level based on match rate
   */
  private getConfidenceLevel(matchRate: number): 'high' | 'medium' | 'low' {
    if (matchRate >= 0.8) return 'high';
    if (matchRate >= 0.6) return 'medium';
    return 'low';
  }

  /**
   * Generate human-readable recommendation
   */
  private generateRecommendation(
    reasons: string[],
    matchRate: number
  ): string {
    const primaryReason = reasons[0];

    if (primaryReason === 'low_accuracy') {
      return `Rule has low accuracy (${(matchRate * 100).toFixed(1)}%). Recommend review by domain expert or revision.`;
    }
    if (primaryReason === 'low_sample_size') {
      return `Rule has insufficient samples. Collect more evaluation data before finalizing.`;
    }
    if (primaryReason === 'disputed_consensus') {
      return `Rule represents disputed interpretation. Consider adding alternative views.`;
    }

    return 'Rule requires human review.';
  }

  /**
   * Calculate review priority
   */
  private calculatePriority(
    matchRate: number,
    sampleSize: number
  ): 'high' | 'medium' | 'low' {
    if (matchRate < 0.5) return 'high';
    if (matchRate < 0.65 || sampleSize < 5) return 'medium';
    return 'low';
  }

  /**
   * Generate batch evaluation report
   */
  async generateAccuracyReport(rules: InterpretationRule[]): Promise<{
    total_rules: number;
    high_accuracy: number;
    medium_accuracy: number;
    low_accuracy: number;
    average_match_rate: number;
    recommendations_summary: string;
  }> {
    let highAccuracy = 0;
    let mediumAccuracy = 0;
    let lowAccuracy = 0;
    let totalMatchRate = 0;
    let rulesWithStats = 0;

    for (const rule of rules) {
      if (!rule.statistics) continue;

      rulesWithStats++;
      totalMatchRate += rule.statistics.match_rate;

      if (rule.statistics.match_rate >= 0.8) highAccuracy++;
      else if (rule.statistics.match_rate >= 0.6) mediumAccuracy++;
      else lowAccuracy++;
    }

    const averageMatchRate = rulesWithStats > 0 ? totalMatchRate / rulesWithStats : 0;

    return {
      total_rules: rules.length,
      high_accuracy: highAccuracy,
      medium_accuracy: mediumAccuracy,
      low_accuracy: lowAccuracy,
      average_match_rate: averageMatchRate,
      recommendations_summary: `Review ${lowAccuracy} low-accuracy rules. Collect more data for ${
        rules.filter(r => !r.statistics || r.statistics.sample_size < 10).length
      } rules with insufficient samples.`
    };
  }
}

export default EvaluationAgent;
