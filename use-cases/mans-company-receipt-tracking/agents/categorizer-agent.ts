/**
 * Man's Accounting Firm - Receipt Categorizer Agent
 *
 * Categorizes receipts based on HK compliance rules and business patterns.
 * Man's specific implementation using the reusable OCR agent output.
 */

import fs from 'fs/promises';
import path from 'path';
import type { ExtractedData } from '@/infrastructure/agents/receipt-ocr-agent/tools';

interface Category {
  id: string;
  name: string;
  name_zh: string;
  description: string;
  deductible: boolean;
  deduction_limit?: {
    amount: number;
    currency: string;
    per: string;
    description: string;
  };
  patterns: {
    vendors: string[];
    keywords: string[];
    exclude_keywords: string[];
  };
}

interface CategoryMapping {
  version: string;
  categories: Category[];
  default_category: {
    id: string;
    name: string;
    confidence_penalty: number;
  };
  matching_rules: {
    vendor_match_weight: number;
    keyword_match_weight: number;
    amount_pattern_weight: number;
    description_match_weight: number;
    minimum_confidence: number;
  };
}

interface ComplianceRule {
  rule_id: string;
  category: string;
  title: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  auto_fix: boolean;
}

interface ComplianceRules {
  version: string;
  rules: ComplianceRule[];
  compliance_checks: {
    pre_processing: string[];
    categorization: string[];
    post_processing: string[];
    reporting: string[];
  };
}

interface CategorizationResult {
  category_id: string;
  category_name: string;
  confidence: number;
  deductible: boolean;
  deductible_amount: number;
  non_deductible_amount: number;
  compliance_warnings: string[];
  compliance_errors: string[];
  requires_review: boolean;
  reasoning: string;
}

export class CategorizerAgent {
  private categoryMapping: CategoryMapping | null = null;
  private complianceRules: ComplianceRules | null = null;
  private kbPath: string;

  constructor(kbPath?: string) {
    this.kbPath = kbPath || path.join(__dirname, '../kb');
  }

  /**
   * Load category mapping from knowledge base
   */
  private async loadCategoryMapping(): Promise<CategoryMapping> {
    if (this.categoryMapping) {
      return this.categoryMapping;
    }

    const mappingPath = path.join(this.kbPath, 'category-mapping.json');
    const data = await fs.readFile(mappingPath, 'utf-8');
    this.categoryMapping = JSON.parse(data);
    return this.categoryMapping;
  }

  /**
   * Load HK compliance rules from knowledge base
   */
  private async loadComplianceRules(): Promise<ComplianceRules> {
    if (this.complianceRules) {
      return this.complianceRules;
    }

    const rulesPath = path.join(this.kbPath, 'hk-compliance-rules.json');
    const data = await fs.readFile(rulesPath, 'utf-8');
    this.complianceRules = JSON.parse(data);
    return this.complianceRules;
  }

  /**
   * Categorize a receipt based on extracted data
   *
   * @param extractedData - Output from Receipt OCR Agent
   * @returns Categorization result with HK compliance checks
   */
  async categorize(extractedData: ExtractedData): Promise<CategorizationResult> {
    // Load knowledge bases
    const mapping = await this.loadCategoryMapping();
    const rules = await this.loadComplianceRules();

    // Calculate match scores for each category
    const scores = mapping.categories.map(category => ({
      category,
      score: this.calculateMatchScore(extractedData, category, mapping.matching_rules),
    }));

    // Sort by score
    scores.sort((a, b) => b.score - a.score);

    // Select best match
    let bestMatch = scores[0];
    let confidence = bestMatch.score;

    // Use default category if confidence too low
    if (confidence < mapping.matching_rules.minimum_confidence) {
      const defaultCat = mapping.categories.find(
        c => c.id === mapping.default_category.id
      );
      if (defaultCat) {
        bestMatch = { category: defaultCat, score: confidence };
        confidence = confidence * (1 - mapping.default_category.confidence_penalty);
      }
    }

    // Apply HK compliance rules
    const complianceResult = this.applyComplianceRules(
      extractedData,
      bestMatch.category,
      rules
    );

    // Calculate deductible amounts
    const { deductibleAmount, nonDeductibleAmount } = this.calculateDeductibleAmount(
      extractedData.amount,
      bestMatch.category
    );

    // Determine if manual review required
    const requiresReview =
      complianceResult.errors.length > 0 ||
      confidence < 0.7 ||
      (bestMatch.category.id === '9999'); // Personal expenses always need review

    return {
      category_id: bestMatch.category.id,
      category_name: bestMatch.category.name,
      confidence,
      deductible: bestMatch.category.deductible,
      deductible_amount: deductibleAmount,
      non_deductible_amount: nonDeductibleAmount,
      compliance_warnings: complianceResult.warnings,
      compliance_errors: complianceResult.errors,
      requires_review: requiresReview,
      reasoning: this.generateReasoning(extractedData, bestMatch.category, confidence),
    };
  }

  /**
   * Calculate match score for a category
   */
  private calculateMatchScore(
    data: ExtractedData,
    category: Category,
    weights: CategoryMapping['matching_rules']
  ): number {
    let score = 0;

    const vendorLower = data.vendor.toLowerCase();
    const descLower = data.description.toLowerCase();
    const combinedText = `${vendorLower} ${descLower}`;

    // Vendor match
    const vendorMatch = category.patterns.vendors.some(v =>
      vendorLower.includes(v.toLowerCase())
    );
    if (vendorMatch) {
      score += weights.vendor_match_weight;
    }

    // Keyword match
    const keywordMatches = category.patterns.keywords.filter(k =>
      combinedText.includes(k.toLowerCase())
    );
    const keywordScore = Math.min(
      keywordMatches.length * 0.1,
      weights.keyword_match_weight
    );
    score += keywordScore;

    // Exclude keyword penalty
    const excludeMatches = category.patterns.exclude_keywords.filter(k =>
      combinedText.includes(k.toLowerCase())
    );
    if (excludeMatches.length > 0) {
      score -= 0.3; // Penalty for excluded keywords
    }

    // Amount pattern (category-specific thresholds)
    if (category.deduction_limit) {
      const withinLimit = data.amount <= category.deduction_limit.amount;
      if (withinLimit) {
        score += weights.amount_pattern_weight * 0.5;
      }
    }

    // Description match (more detailed than keywords)
    const descMatch = this.calculateDescriptionMatch(data.description, category);
    score += descMatch * weights.description_match_weight;

    return Math.min(score, 1.0); // Cap at 1.0
  }

  /**
   * Calculate description similarity
   */
  private calculateDescriptionMatch(description: string, category: Category): number {
    const descLower = description.toLowerCase();
    let matches = 0;
    const total = category.patterns.keywords.length;

    for (const keyword of category.patterns.keywords) {
      if (descLower.includes(keyword.toLowerCase())) {
        matches++;
      }
    }

    return total > 0 ? matches / total : 0;
  }

  /**
   * Apply HK compliance rules to categorization
   */
  private applyComplianceRules(
    data: ExtractedData,
    category: Category,
    rules: ComplianceRules
  ): { warnings: string[]; errors: string[] } {
    const warnings: string[] = [];
    const errors: string[] = [];

    // HK-001: Currency check
    if (data.currency !== 'HKD') {
      warnings.push(
        `Currency is ${data.currency}, not HKD. Consider converting to HKD for reporting.`
      );
    }

    // HK-002: Meal limit check
    if (category.id === '5300' && data.amount > 300) {
      warnings.push(
        `Meal amount HKD ${data.amount} exceeds deductible limit of HKD 300. ` +
        `Only HKD 300 will be deductible.`
      );
    }

    // HK-007: No GST in HK
    if (data.tax_amount && data.tax_amount > 0 && data.currency === 'HKD') {
      errors.push(
        `Tax amount detected (HKD ${data.tax_amount}) but Hong Kong has no GST/VAT. ` +
        `Please verify if this is a foreign receipt.`
      );
    }

    // HK-009: Amount validation
    const amountThresholds: Record<string, number> = {
      '5100': 5000,
      '5200': 10000,
      '5300': 2000,
      '5400': 50000,
      '5500': 20000,
    };

    const threshold = amountThresholds[category.id];
    if (threshold && data.amount > threshold) {
      warnings.push(
        `Amount HKD ${data.amount} exceeds typical threshold for ${category.name} ` +
        `(HKD ${threshold}). Manual approval recommended.`
      );
    }

    // HK-010: Vendor validation
    const invalidVendors = ['N/A', 'Unknown', '未知', '***', '---'];
    if (!data.vendor || data.vendor.length < 2 || invalidVendors.includes(data.vendor)) {
      errors.push('Invalid or missing vendor name. Please provide valid vendor.');
    }

    return { warnings, errors };
  }

  /**
   * Calculate deductible vs non-deductible amounts
   */
  private calculateDeductibleAmount(
    amount: number,
    category: Category
  ): { deductibleAmount: number; nonDeductibleAmount: number } {
    if (!category.deductible) {
      return {
        deductibleAmount: 0,
        nonDeductibleAmount: amount,
      };
    }

    // Apply deduction limits (e.g., HKD 300 meal limit)
    if (category.deduction_limit) {
      const limit = category.deduction_limit.amount;
      if (amount > limit) {
        return {
          deductibleAmount: limit,
          nonDeductibleAmount: amount - limit,
        };
      }
    }

    return {
      deductibleAmount: amount,
      nonDeductibleAmount: 0,
    };
  }

  /**
   * Generate human-readable reasoning for categorization
   */
  private generateReasoning(
    data: ExtractedData,
    category: Category,
    confidence: number
  ): string {
    const reasons: string[] = [];

    // Vendor match
    const vendorMatch = category.patterns.vendors.find(v =>
      data.vendor.toLowerCase().includes(v.toLowerCase())
    );
    if (vendorMatch) {
      reasons.push(`Vendor "${data.vendor}" matches category vendor pattern`);
    }

    // Keyword match
    const keywordMatches = category.patterns.keywords.filter(k =>
      data.description.toLowerCase().includes(k.toLowerCase())
    );
    if (keywordMatches.length > 0) {
      reasons.push(
        `Description contains keywords: ${keywordMatches.slice(0, 3).join(', ')}`
      );
    }

    // Default reasoning
    if (reasons.length === 0) {
      reasons.push(`Classified as ${category.name} based on general pattern matching`);
    }

    // Confidence note
    if (confidence < 0.7) {
      reasons.push(`⚠️  Low confidence (${(confidence * 100).toFixed(0)}%) - manual review recommended`);
    }

    return reasons.join('. ');
  }

  /**
   * Categorize multiple receipts in batch
   */
  async categorizeBatch(
    receipts: ExtractedData[],
    onProgress?: (current: number, total: number) => void
  ): Promise<CategorizationResult[]> {
    const results: CategorizationResult[] = [];

    for (let i = 0; i < receipts.length; i++) {
      if (onProgress) {
        onProgress(i + 1, receipts.length);
      }

      const result = await this.categorize(receipts[i]);
      results.push(result);
    }

    return results;
  }

  /**
   * Get category statistics from results
   */
  getCategoryStats(results: CategorizationResult[]): {
    totalAmount: number;
    deductibleAmount: number;
    nonDeductibleAmount: number;
    categoryBreakdown: Record<string, { count: number; amount: number }>;
    reviewRequired: number;
  } {
    const stats = {
      totalAmount: 0,
      deductibleAmount: 0,
      nonDeductibleAmount: 0,
      categoryBreakdown: {} as Record<string, { count: number; amount: number }>,
      reviewRequired: 0,
    };

    results.forEach(result => {
      stats.totalAmount += result.deductible_amount + result.non_deductible_amount;
      stats.deductibleAmount += result.deductible_amount;
      stats.nonDeductibleAmount += result.non_deductible_amount;

      if (result.requires_review) {
        stats.reviewRequired++;
      }

      const catKey = `${result.category_id} - ${result.category_name}`;
      if (!stats.categoryBreakdown[catKey]) {
        stats.categoryBreakdown[catKey] = { count: 0, amount: 0 };
      }
      stats.categoryBreakdown[catKey].count++;
      stats.categoryBreakdown[catKey].amount += result.deductible_amount;
    });

    return stats;
  }
}

// Export singleton instance
export const categorizerAgent = new CategorizerAgent();

// Export class for testing and custom instances
export default CategorizerAgent;
