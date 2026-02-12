/**
 * Layer 3: Agents - Base Agent Class
 * Abstract base class for all ads performance agents
 */

import Anthropic from '@anthropic-ai/sdk';

export interface AgentConfig {
  name: string;
  role: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface AgentInput {
  tenantId: string;
  [key: string]: any;
}

export interface AgentOutput {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    agentName: string;
    executionTime: number;
    tokensUsed?: number;
  };
}

export abstract class BaseAgent {
  protected client: Anthropic | null = null;
  protected config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = {
      model: 'claude-sonnet-4-20250514',
      temperature: 0.3,
      maxTokens: 4096,
      ...config,
    };
  }

  protected getClient(): Anthropic {
    if (!this.client) {
      this.client = new Anthropic();
    }
    return this.client;
  }

  /**
   * Execute the agent's main function
   */
  abstract execute(input: AgentInput): Promise<AgentOutput>;

  /**
   * Call the LLM with the agent's system prompt
   */
  protected async callLLM(userMessage: string, systemOverride?: string): Promise<string> {
    const client = this.getClient();

    const response = await client.messages.create({
      model: this.config.model!,
      max_tokens: this.config.maxTokens!,
      temperature: this.config.temperature!,
      system: systemOverride || this.config.systemPrompt || this.getDefaultSystemPrompt(),
      messages: [{ role: 'user', content: userMessage }],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    return textBlock ? textBlock.text : '';
  }

  /**
   * Parse JSON from LLM response
   */
  protected parseJSON<T>(text: string): T | null {
    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1].trim());
      }

      // Try to parse the entire text as JSON
      return JSON.parse(text);
    } catch {
      // Try to find JSON object in text
      const objectMatch = text.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        try {
          return JSON.parse(objectMatch[0]);
        } catch {
          return null;
        }
      }
      return null;
    }
  }

  /**
   * Get the agent's name
   */
  getName(): string {
    return this.config.name;
  }

  /**
   * Get the agent's role
   */
  getRole(): string {
    return this.config.role;
  }

  protected getDefaultSystemPrompt(): string {
    return `You are ${this.config.role}. Provide accurate, data-driven analysis.`;
  }
}

export default BaseAgent;
