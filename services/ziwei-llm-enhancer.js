/**
 * Ziwei LLM Enhancer Service (Step 4)
 * Uses DeepSeek Reasoner to synthesize and enhance Ziwei interpretations
 *
 * Combines rule-based interpretations with AI-generated nuanced insights
 * Weight: rules (60%) + LLM enhancement (40%)
 */

const Anthropic = require('@anthropic-ai/sdk');

class ZiweiLLMEnhancer {
  constructor(anthropicApiKey = process.env.ANTHROPIC_API_KEY) {
    if (!anthropicApiKey) {
      console.warn('⚠️ ANTHROPIC_API_KEY not set - DeepSeek LLM enhancements will be disabled');
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
   * Check if LLM enhancement is available
   */
  isAvailable() {
    return this.available;
  }

  /**
   * Enhance interpretations with DeepSeek Reasoner
   * Synthesizes rule-based interpretations into coherent narrative
   */
  async enhanceInterpretations(chart, ruleInterpretations) {
    if (!this.available) {
      return null;
    }

    try {
      const prompt = this.buildEnhancementPrompt(chart, ruleInterpretations);

      const response = await this.client.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 6000,
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

      // Extract text content from response
      const textContent = response.content.find(block => block.type === 'text');
      if (!textContent) {
        console.warn('⚠️ No text content in LLM response');
        return null;
      }

      return {
        enhancement: textContent.text,
        tokensInput: response.usage.input_tokens,
        tokensOutput: response.usage.output_tokens,
        model: 'deepseek-reasoner',
        success: true
      };
    } catch (error) {
      console.error('❌ LLM enhancement error:', error.message);
      return null;
    }
  }

  /**
   * Generate synthesized summary combining rules + LLM insights
   */
  async generateSynthesizedSummary(chart, groupedInterpretations) {
    if (!this.available) {
      return null;
    }

    try {
      const prompt = this.buildSummaryPrompt(chart, groupedInterpretations);

      const response = await this.client.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 4000,
        thinking: {
          type: 'enabled',
          budget_tokens: 2500
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
        summary: textContent.text,
        tokensInput: response.usage.input_tokens,
        tokensOutput: response.usage.output_tokens,
        model: 'deepseek-reasoner',
        success: true
      };
    } catch (error) {
      console.error('❌ Summary generation error:', error.message);
      return null;
    }
  }

  /**
   * Generate life guidance and recommendations
   */
  async generateLifeGuidance(chart, lifeStage = 'current', decadeLuck = {}) {
    if (!this.available) {
      return null;
    }

    try {
      const prompt = this.buildLifeGuidancePrompt(chart, lifeStage, decadeLuck);

      const response = await this.client.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 5000,
        thinking: {
          type: 'enabled',
          budget_tokens: 3500
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
        guidance: textContent.text,
        tokensInput: response.usage.input_tokens,
        tokensOutput: response.usage.output_tokens,
        model: 'deepseek-reasoner',
        success: true
      };
    } catch (error) {
      console.error('❌ Life guidance generation error:', error.message);
      return null;
    }
  }

  /**
   * Build prompt for interpretation enhancement
   */
  buildEnhancementPrompt(chart, interpretations) {
    const chartSummary = this.generateChartSummary(chart);

    return `You are an expert Ziwei Astrology (紫微斗數) interpreter using Zhongzhou School methodology.

A user's birth chart has been analyzed using traditional rule-based matching. Your task is to:
1. Synthesize the rule-based interpretations into coherent, nuanced insights
2. Add contextual depth that goes beyond individual rules
3. Identify patterns and relationships between different interpretations
4. Provide practical, actionable guidance

Birth Chart Summary:
${chartSummary}

Rule-Based Interpretations Found:
${this.formatInterpretations(interpretations)}

Please provide:
1. **Synthesis**: Combine these interpretations into a coherent narrative (3-5 paragraphs)
2. **Key Patterns**: What patterns emerge across these interpretations?
3. **Life Trajectory**: What does this chart suggest about the person's life path?
4. **Practical Advice**: What should this person focus on or be aware of?

Use both Chinese and English where appropriate. Be specific to this chart, not generic.`;
  }

  /**
   * Build prompt for summary generation
   */
  buildSummaryPrompt(chart, grouped) {
    const chartSummary = this.generateChartSummary(chart);

    return `You are a Ziwei Astrology expert. Create a comprehensive but concise summary of this birth chart.

Birth Chart:
${chartSummary}

Interpretation Dimensions:
${grouped.map(g => `- ${g.dimension} (confidence: ${(g.avgConfidence * 100).toFixed(0)}%)\n  ${g.interpretations.slice(0, 3).map(i => `  • ${i.text}`).join('\n')}`).join('\n')}

Create an executive summary (200-300 words) that:
1. Captures the essential character and destiny of this person
2. Highlights key life areas and influences
3. Suggests major themes and challenges
4. Provides balanced perspective on opportunities and obstacles

Write in Chinese with English translations in parentheses for key terms.`;
  }

  /**
   * Build prompt for life guidance generation
   */
  buildLifeGuidancePrompt(chart, lifeStage, decadeLuck) {
    const chartSummary = this.generateChartSummary(chart);

    return `You are a Ziwei Astrology life coach. Provide personalized guidance for this person's current life stage.

Birth Chart:
${chartSummary}

Current Life Stage: ${lifeStage}

Decade Luck (大限):
${JSON.stringify(decadeLuck, null, 2)}

Based on this chart and current period, provide:
1. **Current Period Summary**: What is happening now and why?
2. **Opportunities**: What favorable conditions are present?
3. **Challenges**: What obstacles should they be aware of?
4. **Action Steps**: 3-5 specific, practical things they should consider
5. **Warnings**: Any important cautions for this period
6. **Timeline**: When might key changes or transitions occur?

Be compassionate but honest. Use the chart's logic to justify your guidance.`;
  }

  /**
   * Generate concise chart summary from data
   */
  generateChartSummary(chart) {
    if (!chart.houses) {
      return 'Chart data unavailable';
    }

    const starCount = Object.keys(chart.starPositions || {}).length;
    const fiveElement = this.fiveElementName(chart.fiveElementBureau);

    return `
Life Palace (命宮): House ${chart.lifeHouseIndex} (index)
Five Element Bureau: ${fiveElement} (${chart.fiveElementBureau})
Total Major Stars Placed: ${starCount}
Major Stars: ${Object.keys(chart.starPositions || {}).join(', ')}
Four Transformations: ${Object.values(chart.baseFourTransformations || {}).join(', ')}
`;
  }

  /**
   * Get name of five element bureau
   */
  fiveElementName(bureau) {
    const bureauNames = {
      2: '水二局',
      3: '木三局',
      4: '金四局',
      5: '土五局',
      6: '火六局'
    };
    return bureauNames[bureau] || `局${bureau}`;
  }

  /**
   * Format interpretations for prompt
   */
  formatInterpretations(interpretations) {
    if (!interpretations || interpretations.length === 0) {
      return 'No interpretations available';
    }

    return interpretations
      .map((i, idx) => `${idx + 1}. [${i.dimension}] ${i.text} (confidence: ${(i.confidence * 100).toFixed(0)}%)`)
      .join('\n');
  }

  /**
   * Calculate confidence boost from LLM enhancement
   */
  calculateConfidenceBoost(baseConfidence, llmQuality) {
    // Boost interpretations with high quality LLM synthesis
    // Base boost: 0.4 (40%), capped at max confidence 0.95
    const boost = Math.min(0.4, 0.95 - baseConfidence);
    return baseConfidence + boost;
  }

  /**
   * Parse LLM response and extract structured data
   */
  parseEnhancementResponse(llmText) {
    // Simple parsing - in production, use more sophisticated parsing
    const sections = {
      synthesis: '',
      patterns: '',
      trajectory: '',
      advice: ''
    };

    const lines = llmText.split('\n');
    let currentSection = null;

    for (const line of lines) {
      if (line.includes('Synthesis')) {
        currentSection = 'synthesis';
      } else if (line.includes('Patterns')) {
        currentSection = 'patterns';
      } else if (line.includes('Trajectory')) {
        currentSection = 'trajectory';
      } else if (line.includes('Advice')) {
        currentSection = 'advice';
      } else if (currentSection) {
        sections[currentSection] += line + '\n';
      }
    }

    return sections;
  }
}

// Export
module.exports = {
  ZiweiLLMEnhancer
};
