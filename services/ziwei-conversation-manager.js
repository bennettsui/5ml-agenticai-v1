/**
 * Ziwei Conversation Manager Service (Step 5)
 * Manages chat sessions and conversational interactions with birth charts
 *
 * Uses DeepSeek Chat for real-time contextual responses
 */

const Anthropic = require('@anthropic-ai/sdk');

class ZiweiConversationManager {
  constructor(anthropicApiKey = process.env.ANTHROPIC_API_KEY) {
    if (!anthropicApiKey) {
      console.warn('⚠️ ANTHROPIC_API_KEY not set - DeepSeek chat disabled');
      this.available = false;
      return;
    }

    this.client = new Anthropic({
      apiKey: anthropicApiKey
    });
    this.available = true;
  }

  /**
   * Check if conversation feature is available
   */
  isAvailable() {
    return this.available;
  }

  /**
   * Create a new conversation for a chart
   * Returns conversation object with system prompt ready
   */
  createConversation(chart, userId = null) {
    if (!this.available) {
      return null;
    }

    const systemPrompt = this.buildSystemPrompt(chart);

    return {
      systemPrompt,
      chartContext: this.generateChartContext(chart),
      messageHistory: [],
      model: 'deepseek-chat',
      tokensUsed: 0
    };
  }

  /**
   * Generate a response for a user message
   * Maintains conversation context and chart awareness
   */
  async generateResponse(chart, messageHistory, userMessage) {
    if (!this.available) {
      return null;
    }

    try {
      const systemPrompt = this.buildSystemPrompt(chart);
      const messages = this.formatMessagesForAPI(messageHistory, userMessage);

      const response = await this.client.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 1500,
        system: systemPrompt,
        messages: messages
      });

      const textContent = response.content.find(block => block.type === 'text');
      if (!textContent) {
        console.warn('⚠️ No text content in response');
        return null;
      }

      return {
        response: textContent.text,
        tokensInput: response.usage.input_tokens,
        tokensOutput: response.usage.output_tokens,
        model: 'deepseek-chat',
        success: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error generating response:', error.message);
      return null;
    }
  }

  /**
   * Build system prompt with chart context
   */
  buildSystemPrompt(chart) {
    const chartContext = this.generateChartContext(chart);

    return `You are a compassionate and knowledgeable Ziwei Astrology (紫微斗數) expert using Zhongzhou School methodology.

The person you are talking to has the following birth chart:

${chartContext}

Your conversation guidelines:
1. **Be Personalized**: Always reference their specific chart, not generic advice
2. **Explain Concepts**: Use accessible language; explain Ziwei terms when first introduced
3. **Connect to Chart**: Relate every answer back to their specific stars, palaces, and patterns
4. **Be Practical**: Offer actionable insights, not vague mysticism
5. **Show Respect**: Acknowledge their free will while noting chart tendencies
6. **Use Both Languages**: Respond in both Chinese and English for key terms
7. **Be Encouraging**: Balance honest challenges with recognition of strengths

You have access to their:
- Major stars and their palaces
- Five element bureau (局)
- Four transformations (四化)
- Life house and palace configuration

When the user asks about:
- **Career/Work**: Reference their 官祿宮 (career palace) and relevant stars
- **Relationships**: Consult their 夫妻宮/子女宮 (marriage/children palaces)
- **Finance**: Look at their 財帛宮 (wealth palace) and 化祿 (wealth transformation)
- **Health**: Consider their 疾厄宮 (health palace)
- **Family**: Reference their 父母宮/兄弟宮 (family palaces)

Keep responses concise (200-400 words) but substantive. Ask clarifying questions if needed.`;
  }

  /**
   * Generate concise chart context for conversation
   */
  generateChartContext(chart) {
    if (!chart || !chart.houses) {
      return 'Chart data unavailable';
    }

    const fiveElementName = this.fiveElementName(chart.fiveElementBureau);
    const majorStars = Object.keys(chart.starPositions || {}).join(', ');
    const fourTransformations = Object.entries(chart.baseFourTransformations || {})
      .map(([key, val]) => `${key}: ${val}`)
      .join(', ');

    // Find which palaces have major stars
    const starsInPalaces = [];
    if (chart.houses) {
      chart.houses.slice(0, 3).forEach((house, idx) => {
        if (house.majorStars && house.majorStars.length > 0) {
          starsInPalaces.push(`${house.name}: ${house.majorStars.join(', ')}`);
        }
      });
    }

    return `
📊 Chart Overview:
- Five Element Bureau: ${fiveElementName} (${chart.fiveElementBureau})
- Life House (命宮): Index ${chart.lifeHouseIndex}
- Total Major Stars: ${Object.keys(chart.starPositions || {}).length}

⭐ Major Stars Placed:
${majorStars}

🔄 Four Transformations:
${fourTransformations}

🏠 Key Palaces:
${starsInPalaces.join('\n') || 'See detailed chart'}
`;
  }

  /**
   * Format message history for API call
   */
  formatMessagesForAPI(history, userMessage) {
    const formatted = [];

    // Include recent history (last 10 messages to avoid context bloat)
    const recentHistory = history.slice(-10);

    for (const msg of recentHistory) {
      if (msg.role && msg.content) {
        formatted.push({
          role: msg.role,
          content: msg.content
        });
      }
    }

    // Add current message
    formatted.push({
      role: 'user',
      content: userMessage
    });

    return formatted;
  }

  /**
   * Get name of five element bureau
   */
  fiveElementName(bureau) {
    const names = {
      2: '水二局',
      3: '木三局',
      4: '金四局',
      5: '土五局',
      6: '火六局'
    };
    return names[bureau] || `局${bureau}`;
  }

  /**
   * Summarize long conversation (when message count exceeds threshold)
   * Returns summary that can replace older messages
   */
  async summarizeConversation(chart, messages) {
    if (!this.available || messages.length < 15) {
      return null;
    }

    try {
      const conversationText = messages
        .slice(0, -5) // Exclude last 5 for context
        .map(m => `${m.role}: ${m.content}`)
        .join('\n\n');

      const response = await this.client.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: `Summarize this conversation about a Ziwei birth chart in 2-3 sentences:\n\n${conversationText}`
          }
        ]
      });

      const textContent = response.content.find(block => block.type === 'text');
      return textContent?.text || null;
    } catch (error) {
      console.error('❌ Error summarizing conversation:', error.message);
      return null;
    }
  }

  /**
   * Extract key topics from conversation
   */
  extractTopics(messages) {
    const topics = new Set();
    const topicKeywords = {
      career: ['career', '工作', 'work', '官祿', 'job'],
      relationship: ['relationship', '感情', 'love', '夫妻', 'partner'],
      finance: ['money', '財', 'wealth', '金錢', 'investment'],
      health: ['health', '健康', 'medical', '疾厄'],
      family: ['family', '家庭', 'parent', '父母'],
      destiny: ['destiny', '命', 'fate', '運'],
      personality: ['personality', '性格', 'character', 'trait']
    };

    const conversationText = messages
      .map(m => m.content.toLowerCase())
      .join(' ');

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(kw => conversationText.includes(kw))) {
        topics.add(topic);
      }
    }

    return Array.from(topics);
  }

  /**
   * Generate suggested follow-up questions based on conversation
   */
  generateFollowUpQuestions(chart, messages) {
    const topics = this.extractTopics(messages);
    const questions = [];

    // Generate contextual questions
    if (topics.includes('career')) {
      questions.push('What are the best career transitions for me in the next decade?');
    }
    if (topics.includes('relationship')) {
      questions.push('How compatible am I with someone else? (can share their birth date)');
    }
    if (topics.includes('finance')) {
      questions.push('When is the best time to make major financial investments?');
    }
    if (topics.includes('health')) {
      questions.push('Are there specific health concerns I should watch for?');
    }

    // Always include generic follow-ups
    questions.push('Tell me more about my personality based on this chart');
    questions.push('What challenges should I prepare for?');

    return questions.slice(0, 4); // Return top 4
  }

  /**
   * Calculate conversation quality score
   * Based on chart usage, personalization, and engagement
   */
  calculateQualityScore(messages, topics, tokensUsed) {
    let score = 0;

    // Message count (up to 30 points)
    score += Math.min(messages.length * 2, 30);

    // Topic diversity (up to 20 points)
    score += Math.min(topics.length * 3, 20);

    // Token efficiency (up to 20 points)
    const avgTokensPerMessage = tokensUsed / Math.max(messages.length, 1);
    if (avgTokensPerMessage < 500) {
      score += 20;
    } else if (avgTokensPerMessage < 1000) {
      score += 10;
    }

    // Chart-specific references (up to 30 points)
    // This would require parsing, so estimate based on message count
    if (messages.length > 5) {
      score += 30;
    } else {
      score += 15;
    }

    return Math.min(score, 100);
  }
}

// Export
module.exports = {
  ZiweiConversationManager
};
