/**
 * Layer 4: Knowledge Management
 * Metric definitions, industry benchmarks, and client KBs
 */

// ===========================================
// Metric Definitions KB
// ===========================================

export interface MetricDefinition {
  id: string;
  name: string;
  formula: string;
  description: string;
  unit: 'currency' | 'percentage' | 'number' | 'ratio';
  interpretation: {
    high: string;
    low: string;
    typical: string;
  };
}

export const METRIC_DEFINITIONS: Record<string, MetricDefinition> = {
  cpc: {
    id: 'cpc',
    name: 'Cost Per Click',
    formula: 'Spend / Clicks',
    description: 'The average cost paid for each click on your ad.',
    unit: 'currency',
    interpretation: {
      high: 'Indicates high competition or poor relevance. Consider improving ad relevance or targeting.',
      low: 'Good efficiency in driving traffic. Ensure click quality by monitoring conversion rate.',
      typical: 'Varies by industry: $0.50-$2.00 for ecommerce, $2-$5 for B2B/lead gen.',
    },
  },
  cpm: {
    id: 'cpm',
    name: 'Cost Per Mille (1000 Impressions)',
    formula: '(Spend / Impressions) * 1000',
    description: 'The cost to show your ad 1,000 times.',
    unit: 'currency',
    interpretation: {
      high: 'Narrow audience or high competition. Consider broadening targeting.',
      low: 'Efficient reach. Verify that impressions are reaching quality audiences.',
      typical: '$5-$15 for Meta, $2-$10 for Google Display.',
    },
  },
  ctr: {
    id: 'ctr',
    name: 'Click-Through Rate',
    formula: '(Clicks / Impressions) * 100',
    description: 'The percentage of people who clicked after seeing your ad.',
    unit: 'percentage',
    interpretation: {
      high: 'Strong ad creative and relevance. Good audience-message match.',
      low: 'Creative may need refreshing, or targeting may be off. Test new variations.',
      typical: '0.5-1.5% for display, 2-5% for search, 0.8-1.5% for social.',
    },
  },
  cpa: {
    id: 'cpa',
    name: 'Cost Per Acquisition/Conversion',
    formula: 'Spend / Conversions',
    description: 'The average cost to acquire one conversion.',
    unit: 'currency',
    interpretation: {
      high: 'Acquisition costs eating into margins. Optimize funnel or targeting.',
      low: 'Efficient acquisition. Consider scaling spend while maintaining quality.',
      typical: 'Depends on product margins. Generally aim for 20-30% of customer LTV.',
    },
  },
  cvr: {
    id: 'cvr',
    name: 'Conversion Rate',
    formula: '(Conversions / Clicks) * 100',
    description: 'The percentage of clicks that result in a conversion.',
    unit: 'percentage',
    interpretation: {
      high: 'Strong landing page and offer. Traffic quality is good.',
      low: 'Landing page or offer may need optimization. Check audience intent alignment.',
      typical: '2-5% for ecommerce, 5-15% for lead gen.',
    },
  },
  roas: {
    id: 'roas',
    name: 'Return on Ad Spend',
    formula: 'Revenue / Spend',
    description: 'The revenue generated for every dollar spent on advertising.',
    unit: 'ratio',
    interpretation: {
      high: 'Highly profitable campaigns. Consider scaling budget.',
      low: 'Campaigns may be unprofitable. Review targeting, creative, and offers.',
      typical: '3-4x for breakeven (varies by margin), 5x+ is strong.',
    },
  },
  impressions: {
    id: 'impressions',
    name: 'Impressions',
    formula: 'Count of ad displays',
    description: 'The number of times your ad was shown.',
    unit: 'number',
    interpretation: {
      high: 'Good reach. Monitor frequency to avoid ad fatigue.',
      low: 'Limited reach. Consider increasing budget or broadening targeting.',
      typical: 'Depends on budget and audience size.',
    },
  },
  reach: {
    id: 'reach',
    name: 'Reach',
    formula: 'Unique users who saw ad',
    description: 'The number of unique people who saw your ad.',
    unit: 'number',
    interpretation: {
      high: 'Reaching a broad audience. Monitor frequency per person.',
      low: 'Narrow audience reach. May need to expand targeting.',
      typical: 'Typically 30-60% of impressions depending on frequency.',
    },
  },
  frequency: {
    id: 'frequency',
    name: 'Frequency',
    formula: 'Impressions / Reach',
    description: 'Average number of times each person saw your ad.',
    unit: 'number',
    interpretation: {
      high: 'Risk of ad fatigue. Rotate creatives or expand audience.',
      low: 'Good if intentional. Consider if more exposure would help.',
      typical: '1.5-3x for awareness, 3-5x for consideration, higher for retargeting.',
    },
  },
};

// ===========================================
// Industry Benchmarks KB
// ===========================================

export interface IndustryBenchmark {
  industry: string;
  platform: 'meta' | 'google' | 'all';
  funnelStage: 'awareness' | 'consideration' | 'conversion' | 'all';
  metrics: {
    ctr?: { min: number; max: number; median: number };
    cpc?: { min: number; max: number; median: number };
    cpm?: { min: number; max: number; median: number };
    cvr?: { min: number; max: number; median: number };
    roas?: { min: number; max: number; median: number };
  };
}

export const INDUSTRY_BENCHMARKS: IndustryBenchmark[] = [
  // Ecommerce
  {
    industry: 'ecommerce',
    platform: 'meta',
    funnelStage: 'all',
    metrics: {
      ctr: { min: 0.8, max: 2.0, median: 1.2 },
      cpc: { min: 0.4, max: 1.5, median: 0.8 },
      cpm: { min: 6, max: 15, median: 10 },
      cvr: { min: 1.5, max: 4.0, median: 2.5 },
      roas: { min: 2.0, max: 6.0, median: 3.5 },
    },
  },
  {
    industry: 'ecommerce',
    platform: 'google',
    funnelStage: 'all',
    metrics: {
      ctr: { min: 2.0, max: 5.0, median: 3.5 },
      cpc: { min: 0.5, max: 2.0, median: 1.0 },
      cpm: { min: 3, max: 10, median: 6 },
      cvr: { min: 2.0, max: 5.0, median: 3.0 },
      roas: { min: 3.0, max: 8.0, median: 4.5 },
    },
  },
  // Lead Generation
  {
    industry: 'lead_gen',
    platform: 'meta',
    funnelStage: 'all',
    metrics: {
      ctr: { min: 0.5, max: 1.5, median: 0.9 },
      cpc: { min: 1.0, max: 4.0, median: 2.0 },
      cpm: { min: 8, max: 20, median: 12 },
      cvr: { min: 5.0, max: 15.0, median: 9.0 },
    },
  },
  {
    industry: 'lead_gen',
    platform: 'google',
    funnelStage: 'all',
    metrics: {
      ctr: { min: 2.5, max: 6.0, median: 4.0 },
      cpc: { min: 2.0, max: 8.0, median: 4.0 },
      cpm: { min: 10, max: 30, median: 18 },
      cvr: { min: 4.0, max: 12.0, median: 7.0 },
    },
  },
  // App Install
  {
    industry: 'app_install',
    platform: 'meta',
    funnelStage: 'all',
    metrics: {
      ctr: { min: 0.8, max: 2.5, median: 1.5 },
      cpc: { min: 0.3, max: 1.5, median: 0.7 },
      cpm: { min: 5, max: 12, median: 8 },
      cvr: { min: 10.0, max: 30.0, median: 18.0 },
    },
  },
  {
    industry: 'app_install',
    platform: 'google',
    funnelStage: 'all',
    metrics: {
      ctr: { min: 1.0, max: 3.0, median: 2.0 },
      cpc: { min: 0.4, max: 2.0, median: 1.0 },
      cpm: { min: 4, max: 15, median: 8 },
      cvr: { min: 8.0, max: 25.0, median: 15.0 },
    },
  },
  // SaaS / B2B
  {
    industry: 'saas',
    platform: 'all',
    funnelStage: 'all',
    metrics: {
      ctr: { min: 1.0, max: 3.0, median: 2.0 },
      cpc: { min: 3.0, max: 15.0, median: 7.0 },
      cvr: { min: 2.0, max: 8.0, median: 4.0 },
    },
  },
  // Agency average (for internal use)
  {
    industry: 'agency',
    platform: 'all',
    funnelStage: 'all',
    metrics: {
      ctr: { min: 0.8, max: 2.5, median: 1.3 },
      cpc: { min: 0.5, max: 5.0, median: 1.5 },
      cpm: { min: 5, max: 20, median: 10 },
      cvr: { min: 2.0, max: 10.0, median: 4.0 },
      roas: { min: 2.5, max: 6.0, median: 3.5 },
    },
  },
];

// ===========================================
// Knowledge Manager Class
// ===========================================

export class KnowledgeManager {
  /**
   * Get metric definition
   */
  getMetricDefinition(metricId: string): MetricDefinition | null {
    return METRIC_DEFINITIONS[metricId] || null;
  }

  /**
   * Get all metric definitions
   */
  getAllMetricDefinitions(): MetricDefinition[] {
    return Object.values(METRIC_DEFINITIONS);
  }

  /**
   * Get benchmarks for an industry
   */
  getBenchmarks(industry: string, platform?: 'meta' | 'google' | 'all'): IndustryBenchmark[] {
    return INDUSTRY_BENCHMARKS.filter((b) => {
      const industryMatch = b.industry === industry || b.industry === 'agency';
      const platformMatch = !platform || b.platform === platform || b.platform === 'all';
      return industryMatch && platformMatch;
    });
  }

  /**
   * Compare a metric value against benchmarks
   */
  compareToBenchmark(
    metricId: string,
    value: number,
    industry: string,
    platform: 'meta' | 'google'
  ): { status: 'above' | 'below' | 'within'; percentile: string; interpretation: string } {
    const benchmarks = this.getBenchmarks(industry, platform);

    if (benchmarks.length === 0) {
      return { status: 'within', percentile: 'N/A', interpretation: 'No benchmark data available' };
    }

    // Find the metric in benchmarks
    for (const benchmark of benchmarks) {
      const metricBenchmark = benchmark.metrics[metricId as keyof typeof benchmark.metrics];
      if (metricBenchmark) {
        if (value < metricBenchmark.min) {
          return {
            status: 'below',
            percentile: '<25th',
            interpretation: `Below industry average (median: ${metricBenchmark.median})`,
          };
        } else if (value > metricBenchmark.max) {
          return {
            status: 'above',
            percentile: '>75th',
            interpretation: `Above industry average (median: ${metricBenchmark.median})`,
          };
        } else {
          const range = metricBenchmark.max - metricBenchmark.min;
          const position = (value - metricBenchmark.min) / range;
          const percentile = Math.round(25 + position * 50);
          return {
            status: 'within',
            percentile: `${percentile}th`,
            interpretation: `Within industry range (median: ${metricBenchmark.median})`,
          };
        }
      }
    }

    return { status: 'within', percentile: 'N/A', interpretation: 'Metric not in benchmarks' };
  }

  /**
   * Get interpretation text for a metric value
   */
  getInterpretation(metricId: string, value: number, industry?: string): string {
    const definition = this.getMetricDefinition(metricId);
    if (!definition) return 'Unknown metric';

    // Get benchmark context if available
    if (industry) {
      const benchmarks = this.getBenchmarks(industry);
      for (const benchmark of benchmarks) {
        const metricBenchmark = benchmark.metrics[metricId as keyof typeof benchmark.metrics];
        if (metricBenchmark) {
          if (value < metricBenchmark.min) {
            return definition.interpretation.low;
          } else if (value > metricBenchmark.max) {
            return definition.interpretation.high;
          }
        }
      }
    }

    return definition.interpretation.typical;
  }

  /**
   * Format metric value with appropriate units
   */
  formatMetricValue(metricId: string, value: number): string {
    const definition = this.getMetricDefinition(metricId);
    if (!definition) return String(value);

    switch (definition.unit) {
      case 'currency':
        return `$${value.toFixed(2)}`;
      case 'percentage':
        return `${value.toFixed(2)}%`;
      case 'ratio':
        return `${value.toFixed(2)}x`;
      case 'number':
        return value.toLocaleString();
      default:
        return String(value);
    }
  }
}

// Singleton instance
let knowledgeManagerInstance: KnowledgeManager | null = null;

export function getKnowledgeManager(): KnowledgeManager {
  if (!knowledgeManagerInstance) {
    knowledgeManagerInstance = new KnowledgeManager();
  }
  return knowledgeManagerInstance;
}

export default KnowledgeManager;
