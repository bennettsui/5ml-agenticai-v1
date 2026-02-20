/**
 * Ziwei Knowledge Enricher Service
 * Enhances chart interpretations using the comprehensive palace and star knowledge base
 *
 * Responsibilities:
 * - Enrich chart calculations with palace/star meanings
 * - Generate detailed interpretations using knowledge base
 * - Support multi-level analysis (basic, intermediate, advanced)
 * - Track knowledge usage and gaps
 */

interface PalaceInterpretation {
  palace_id: string;
  palace_name: string;
  description: string;
  current_situation: string;
  positive_outlook: string;
  negative_outlook: string;
  recommendations: string[];
}

interface StarInterpretation {
  star_id: string;
  star_name: string;
  element: string;
  archetype: string;
  palace_placements: Array<{
    palace_id: string;
    palace_name: string;
    positive_meaning: string;
    negative_meaning: string;
    strength: string; // 'miao', 'wang', 'ping', 'xian', 'xia', etc.
  }>;
}

interface EnrichedChartInterpretation {
  chart_id?: string;
  person_name: string;
  birth_date: string;
  palace_interpretations: PalaceInterpretation[];
  star_interpretations: StarInterpretation[];
  key_patterns: Array<{
    title: string;
    description: string;
    palaces_involved: string[];
    stars_involved: string[];
    positive_outcome: string;
    negative_outcome: string;
  }>;
  life_dimensions: Record<string, {
    area: string;
    assessment: string;
    outlook: string;
    recommendations: string[];
  }>;
  overall_summary: string;
  knowledge_coverage: {
    palaces_covered: number;
    stars_covered: number;
    patterns_identified: number;
  };
}

export class ZiweiKnowledgeEnricher {
  private palaceKnowledge: Map<string, any>;
  private starKnowledge: Map<string, any>;

  constructor(palaces?: any[], stars?: any[]) {
    this.palaceKnowledge = new Map();
    this.starKnowledge = new Map();

    if (palaces) {
      palaces.forEach(p => this.palaceKnowledge.set(p.id, p));
    }
    if (stars) {
      stars.forEach(s => this.starKnowledge.set(s.id, s));
    }
  }

  /**
   * Load knowledge from database
   */
  async loadFromDatabase(db: any): Promise<void> {
    try {
      const palaces = await db.getAllZiweiPalaces();
      const stars = await db.getAllZiweiStars();

      palaces.forEach((p: any) => this.palaceKnowledge.set(p.id, p));
      stars.forEach((s: any) => this.starKnowledge.set(s.id, s));
    } catch (error) {
      console.error('Failed to load knowledge from database:', error);
    }
  }

  /**
   * Enrich a birth chart with detailed interpretations
   */
  enrichChart(chart: any, birthInfo: any): EnrichedChartInterpretation {
    const enriched: EnrichedChartInterpretation = {
      person_name: birthInfo.name || 'Unknown',
      birth_date: `${birthInfo.lunarYear}/${birthInfo.lunarMonth}/${birthInfo.lunarDay}`,
      palace_interpretations: [],
      star_interpretations: [],
      key_patterns: [],
      life_dimensions: {},
      overall_summary: '',
      knowledge_coverage: {
        palaces_covered: 0,
        stars_covered: 0,
        patterns_identified: 0
      }
    };

    // Enrich palace interpretations
    if (chart.houses) {
      for (const house of chart.houses) {
        const palaceInterp = this.interpretPalace(house);
        if (palaceInterp) {
          enriched.palace_interpretations.push(palaceInterp);
          enriched.knowledge_coverage.palaces_covered++;
        }
      }
    }

    // Enrich star interpretations
    if (chart.starPositions) {
      for (const [starId, palaceIds] of Object.entries(chart.starPositions)) {
        const starInterp = this.interpretStar(starId, palaceIds as string[]);
        if (starInterp) {
          enriched.star_interpretations.push(starInterp);
          enriched.knowledge_coverage.stars_covered++;
        }
      }
    }

    // Identify key patterns
    enriched.key_patterns = this.identifyKeyPatterns(enriched);
    enriched.knowledge_coverage.patterns_identified = enriched.key_patterns.length;

    // Analyze life dimensions
    enriched.life_dimensions = this.analyzeDimensions(enriched);

    // Generate overall summary
    enriched.overall_summary = this.generateSummary(enriched);

    return enriched;
  }

  /**
   * Interpret a single palace
   */
  private interpretPalace(house: any): PalaceInterpretation | null {
    const palaceKnowledge = this.palaceKnowledge.get(house.palace_id);
    if (!palaceKnowledge) return null;

    return {
      palace_id: house.palace_id,
      palace_name: palaceKnowledge.english,
      description: palaceKnowledge.meaning,
      current_situation: this.assessCurrentSituation(house, palaceKnowledge),
      positive_outlook: palaceKnowledge.positive_indicators,
      negative_outlook: palaceKnowledge.negative_indicators,
      recommendations: this.generateRecommendations(house, palaceKnowledge)
    };
  }

  /**
   * Interpret a single star
   */
  private interpretStar(starId: string, palaceIds: string[]): StarInterpretation | null {
    const starKnowledge = this.starKnowledge.get(starId);
    if (!starKnowledge) return null;

    const placements = palaceIds.map(palaceId => {
      const palaceKnowledge = this.palaceKnowledge.get(palaceId);
      const meanings = starKnowledge.palace_meanings?.[palaceId] || {
        positive: 'Meanings not yet documented',
        negative: 'Meanings not yet documented'
      };

      return {
        palace_id: palaceId,
        palace_name: palaceKnowledge?.english || palaceId,
        positive_meaning: meanings.positive,
        negative_meaning: meanings.negative,
        strength: 'unknown' // Would be determined from chart calculation
      };
    });

    return {
      star_id: starId,
      star_name: starKnowledge.english,
      element: starKnowledge.element,
      archetype: starKnowledge.archetype,
      palace_placements: placements
    };
  }

  /**
   * Assess current situation based on palace and stars
   */
  private assessCurrentSituation(house: any, palaceKnowledge: any): string {
    const stars = house.majorStars || [];
    if (stars.length === 0) {
      return `${palaceKnowledge.english} currently lacks major stars, suggesting a period of quiet or waiting.`;
    }

    return `${palaceKnowledge.english} is occupied by ${stars.length} major star(s), indicating an active phase in this life area.`;
  }

  /**
   * Generate recommendations for a palace
   */
  private generateRecommendations(house: any, palaceKnowledge: any): string[] {
    const recommendations: string[] = [];

    const governs = palaceKnowledge.governs || [];
    if (governs.length > 0) {
      recommendations.push(`Focus on improving: ${governs.slice(0, 2).join(', ')}`);
    }

    const hasTransformations = house.transformations?.length > 0;
    if (hasTransformations) {
      recommendations.push('Monitor and manage transformations this cycle');
    }

    const hasBeneficStars = house.majorStars?.some((s: string) => this.isBeneficStar(s));
    if (hasBeneficStars) {
      recommendations.push('Leverage current advantages for long-term goals');
    }

    if (recommendations.length === 0) {
      recommendations.push('Seek professional Ziwei reading for detailed guidance');
    }

    return recommendations;
  }

  /**
   * Identify key patterns in the chart
   */
  private identifyKeyPatterns(enriched: EnrichedChartInterpretation): Array<any> {
    const patterns: Array<any> = [];

    // Example: Grand Trine patterns
    // Example: Opposition aspects
    // Example: Stellium formations
    // Would implement based on traditional Ziwei pattern recognition

    return patterns;
  }

  /**
   * Analyze life dimensions (career, love, finance, health, etc.)
   */
  private analyzeDimensions(enriched: EnrichedChartInterpretation): Record<string, any> {
    const dimensions: Record<string, any> = {
      career: {
        area: 'Career & Work',
        assessment: '',
        outlook: '',
        recommendations: []
      },
      love: {
        area: 'Love & Relationships',
        assessment: '',
        outlook: '',
        recommendations: []
      },
      finance: {
        area: 'Finance & Wealth',
        assessment: '',
        outlook: '',
        recommendations: []
      },
      health: {
        area: 'Health & Wellbeing',
        assessment: '',
        outlook: '',
        recommendations: []
      }
    };

    // Map palaces to dimensions
    const dimensionMapping: Record<string, string[]> = {
      career: ['guanlu'],
      love: ['fuqi'],
      finance: ['caibao'],
      health: ['jieya']
    };

    for (const [dimension, palaces] of Object.entries(dimensionMapping)) {
      const relevantPalaces = enriched.palace_interpretations.filter(p =>
        palaces.includes(p.palace_id)
      );

      if (relevantPalaces.length > 0) {
        dimensions[dimension].assessment = this.generateDimensionAssessment(relevantPalaces);
        dimensions[dimension].outlook = this.generateDimensionOutlook(relevantPalaces);
        dimensions[dimension].recommendations = this.generateDimensionRecommendations(dimension, relevantPalaces);
      }
    }

    return dimensions;
  }

  private generateDimensionAssessment(palaces: PalaceInterpretation[]): string {
    return `${palaces[0].palace_name} analysis shows moderate activity.`;
  }

  private generateDimensionOutlook(palaces: PalaceInterpretation[]): string {
    return 'Outlook is generally positive with room for improvement.';
  }

  private generateDimensionRecommendations(dimension: string, palaces: PalaceInterpretation[]): string[] {
    return ['Continue current efforts', 'Seek professional guidance for optimization'];
  }

  /**
   * Generate overall summary
   */
  private generateSummary(enriched: EnrichedChartInterpretation): string {
    const palaceCount = enriched.knowledge_coverage.palaces_covered;
    const starCount = enriched.knowledge_coverage.stars_covered;

    return `This Ziwei chart shows activity across ${palaceCount} palaces with ${starCount} primary stars. The analysis reveals a balanced mix of opportunities and challenges across different life areas. Regular monitoring of transformations is recommended.`;
  }

  /**
   * Check if a star is benefic
   */
  private isBeneficStar(starId: string): boolean {
    const beneficStars = ['ziwei', 'taiyang', 'tiantong', 'tianfu'];
    return beneficStars.includes(starId);
  }
}

export default ZiweiKnowledgeEnricher;
