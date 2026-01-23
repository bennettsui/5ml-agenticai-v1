/**
 * Layer 3: Agent - News Analyst Agent
 * 新聞分析官 - Analyzes scraped news and scores importance
 *
 * Persona: "5ML 既新聞狙擊手，掃描全網新聞，判斷重要性"
 * Model: 5ml-news-analyst-v1
 * Temperature: 0.4 (consistent analysis)
 * Max Tokens: 1500
 */

import { EventEmitter } from 'events';
import { InternalLLMTool, internalLLMTool, type LLMResponse } from '../tools/internal-llm-tool';
import { type ScrapedArticle } from '../tools/multi-source-scraper';

export interface ScoreBreakdown {
  relevance: number;
  actionability: number;
  authority: number;
  timeliness: number;
  originality: number;
}

export interface AnalyzedArticle {
  article_id: string;
  title: string;
  source_name: string;
  source_url: string;
  published_at?: string;
  content_summary: string;
  importance_score: number;
  score_breakdown: ScoreBreakdown;
  key_insights: string[];
  action_items: string[];
  tags: string[];
}

export interface NewsAnalystInput {
  articles: ScrapedArticle[];
  topicName: string;
  keywords?: string[];
  minImportanceScore?: number;
}

export interface NewsAnalystOutput {
  topic: string;
  analyzedArticles: AnalyzedArticle[];
  totalAnalyzed: number;
  totalFiltered: number;
  highImportanceCount: number;
  _meta: {
    model: string;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    analyzedAt: string;
  };
}

const NEWS_ANALYST_PROMPT = `## Agent Prompt: NewsAnalystAgent

**代理身份：**
你係 5ML 既新聞分析官。你既工作係從爬蟲回來既「{topic}」相關新聞中，
快速判斷「呢條新聞既實際影響力」，並評分。

**評分維度（5 個，各自權重）：**

1. **相關性 (Relevance) - 權重 25%**
   - 內容係咪直接關於「{topic}」？
   - 評分：直接相關 100, 高度相關 75, 中度相關 50, 遠端相關 25

2. **實用性 (Actionability) - 權重 25%**
   - 內容係咪「可立即應用」？
   - 有無具體步驟或案例？
   - 評分：完整教程 100, 有例子 70, 概念性 40, 無法應用 10

3. **權威性 (Authority) - 權重 20%**
   - 係官方發佈定獨家分析？
   - 評分：官方首發 100, 獨家深度分析 80, 二手報導 50

4. **及時性 (Timeliness) - 權重 15%**
   - 發佈距離現在幾耐？
   - 評分：24h內 100, 7日內 80, 30日內 50

5. **創新性 (Originality) - 權重 15%**
   - 係新發現定老掉牙既信息？
   - 評分：全新洞察 100, 新穎角度 75, 常見信息 40

**計分邏輯：**
importance_score = relevance * 0.25 + actionability * 0.25 + authority * 0.20 + timeliness * 0.15 + originality * 0.15

Filter: 只返回 importance_score >= {min_score}

**待分析文章：**
{articles}

**輸出 JSON 格式（每篇文章一個對象）：**
\`\`\`json
[
  {
    "article_id": "文章ID",
    "title": "文章標題",
    "source_name": "來源名稱",
    "source_url": "文章 URL",
    "published_at": "ISO8601",
    "content_summary": "100-200 字摘要",
    "importance_score": 78,
    "score_breakdown": {
      "relevance": 85,
      "actionability": 75,
      "authority": 80,
      "timeliness": 70,
      "originality": 70
    },
    "key_insights": ["洞察1", "洞察2", "洞察3"],
    "action_items": ["可採取行動1", "可採取行動2"],
    "tags": ["#tag1", "#tag2"]
  }
]
\`\`\`

**約束條件：**
- 只返回 importance_score >= {min_score} 既文章
- 提供「action_items」讓用戶知道點樣應用
- 每篇文章需要 3 個 key_insights 和 2 個 action_items
- tags 需要以 # 開頭
- 只返回 JSON 數組，不要其他文字`;

export class NewsAnalystAgent extends EventEmitter {
  private llmTool: InternalLLMTool;
  private agentName = 'NewsAnalystAgent';
  private cantoneseName = '新聞分析官';
  private model: '5ml-news-analyst-v1' = '5ml-news-analyst-v1';
  private defaultMinScore = 60;
  private batchSize = 10; // Analyze in batches to avoid token limits

  constructor(llmTool?: InternalLLMTool) {
    super();
    this.llmTool = llmTool || internalLLMTool;
  }

  /**
   * Analyze articles and score their importance
   */
  async analyzeArticles(input: NewsAnalystInput): Promise<NewsAnalystOutput> {
    console.log(
      `[${this.agentName}] Starting analysis of ${input.articles.length} articles for topic: ${input.topicName}`
    );

    const minScore = input.minImportanceScore ?? this.defaultMinScore;
    const allAnalyzedArticles: AnalyzedArticle[] = [];
    let totalUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

    // Process in batches
    for (let i = 0; i < input.articles.length; i += this.batchSize) {
      const batch = input.articles.slice(i, i + this.batchSize);

      try {
        const result = await this.analyzeBatch(batch, input.topicName, minScore);

        allAnalyzedArticles.push(...result.articles);

        if (result.usage) {
          totalUsage.promptTokens += result.usage.promptTokens;
          totalUsage.completionTokens += result.usage.completionTokens;
          totalUsage.totalTokens += result.usage.totalTokens;
        }

        // Emit progress event
        this.emit('batch_analyzed', {
          processedCount: Math.min(i + this.batchSize, input.articles.length),
          totalCount: input.articles.length,
          articlesFound: allAnalyzedArticles.length,
        });

        // Emit each analyzed article
        for (const article of result.articles) {
          this.emit('article_analyzed', article);
        }
      } catch (error) {
        console.error(
          `[${this.agentName}] Error analyzing batch ${i}-${i + this.batchSize}:`,
          error
        );
        // Continue with next batch
      }
    }

    // Sort by importance score
    allAnalyzedArticles.sort((a, b) => b.importance_score - a.importance_score);

    // Limit to max 50 articles per spec
    const limitedArticles = allAnalyzedArticles.slice(0, 50);

    console.log(
      `[${this.agentName}] Analysis complete. ${limitedArticles.length} articles passed threshold`
    );

    return {
      topic: input.topicName,
      analyzedArticles: limitedArticles,
      totalAnalyzed: input.articles.length,
      totalFiltered: limitedArticles.length,
      highImportanceCount: limitedArticles.filter(a => a.importance_score >= 80).length,
      _meta: {
        model: this.model,
        usage: totalUsage.totalTokens > 0 ? totalUsage : undefined,
        analyzedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Analyze a single article
   */
  async analyzeSingleArticle(
    article: ScrapedArticle,
    topicName: string,
    minScore?: number
  ): Promise<AnalyzedArticle | null> {
    const result = await this.analyzeBatch([article], topicName, minScore ?? this.defaultMinScore);
    return result.articles[0] || null;
  }

  /**
   * Analyze a batch of articles
   */
  private async analyzeBatch(
    articles: ScrapedArticle[],
    topicName: string,
    minScore: number
  ): Promise<{
    articles: AnalyzedArticle[];
    usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  }> {
    // Format articles for the prompt
    const articlesText = articles
      .map(
        (a, i) => `
### Article ${i + 1}
- ID: ${a.articleId}
- Title: ${a.title}
- Source: ${a.sourceName}
- URL: ${a.sourceUrl}
- Published: ${a.publishedAt || 'Unknown'}
- Content: ${a.content.slice(0, 500)}...
`
      )
      .join('\n');

    // Build the prompt
    const prompt = NEWS_ANALYST_PROMPT
      .replace(/{topic}/g, topicName)
      .replace(/{min_score}/g, String(minScore))
      .replace('{articles}', articlesText);

    // Call the LLM
    const response: LLMResponse = await this.llmTool.callLLM(
      this.model,
      prompt,
      { topic: topicName, articleCount: articles.length },
      { temperature: 0.4, maxTokens: 1500 }
    );

    // Parse the response
    const analyzedArticles = this.parseAnalysisResponse(response, articles);

    // Filter by minimum score
    const filteredArticles = analyzedArticles.filter(
      a => a.importance_score >= minScore
    );

    return {
      articles: filteredArticles,
      usage: response.usage,
    };
  }

  /**
   * Parse the LLM response to extract analyzed articles
   */
  private parseAnalysisResponse(
    response: LLMResponse,
    originalArticles: ScrapedArticle[]
  ): AnalyzedArticle[] {
    try {
      const content = response.content;

      // Try to extract JSON from code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      let jsonContent = jsonMatch ? jsonMatch[1] : content;

      // Try to find JSON array in the content
      const arrayMatch = jsonContent.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        jsonContent = arrayMatch[0];
      }

      const analyzed = JSON.parse(jsonContent);

      if (!Array.isArray(analyzed)) {
        throw new Error('Response is not an array');
      }

      // Map original article data for missing fields
      const articleMap = new Map(
        originalArticles.map(a => [a.articleId, a])
      );

      return analyzed.map(a => this.validateAnalyzedArticle(a, articleMap));
    } catch (error) {
      console.error(
        `[${this.agentName}] Failed to parse analysis response:`,
        error
      );
      // Return empty array on parse failure
      return [];
    }
  }

  /**
   * Validate and sanitize an analyzed article
   */
  private validateAnalyzedArticle(
    article: unknown,
    originalMap: Map<string, ScrapedArticle>
  ): AnalyzedArticle {
    const a = article as Record<string, unknown>;
    const original = originalMap.get(String(a.article_id));

    return {
      article_id: String(a.article_id || ''),
      title: String(a.title || original?.title || 'Untitled'),
      source_name: String(a.source_name || original?.sourceName || ''),
      source_url: String(a.source_url || original?.sourceUrl || ''),
      published_at: String(a.published_at || original?.publishedAt || ''),
      content_summary: String(a.content_summary || '').slice(0, 500),
      importance_score: this.normalizeScore(a.importance_score),
      score_breakdown: this.validateScoreBreakdown(a.score_breakdown),
      key_insights: this.validateStringArray(a.key_insights, 3),
      action_items: this.validateStringArray(a.action_items, 2),
      tags: this.validateTags(a.tags),
    };
  }

  /**
   * Validate score breakdown
   */
  private validateScoreBreakdown(breakdown: unknown): ScoreBreakdown {
    const defaultBreakdown: ScoreBreakdown = {
      relevance: 50,
      actionability: 50,
      authority: 50,
      timeliness: 50,
      originality: 50,
    };

    if (!breakdown || typeof breakdown !== 'object') {
      return defaultBreakdown;
    }

    const b = breakdown as Record<string, unknown>;

    return {
      relevance: this.normalizeScore(b.relevance),
      actionability: this.normalizeScore(b.actionability),
      authority: this.normalizeScore(b.authority),
      timeliness: this.normalizeScore(b.timeliness),
      originality: this.normalizeScore(b.originality),
    };
  }

  /**
   * Validate string array
   */
  private validateStringArray(arr: unknown, minItems: number): string[] {
    if (!Array.isArray(arr)) {
      return Array(minItems).fill('N/A');
    }
    return arr.map(String).slice(0, 5);
  }

  /**
   * Validate tags
   */
  private validateTags(tags: unknown): string[] {
    if (!Array.isArray(tags)) return [];

    return tags
      .map(String)
      .map(t => (t.startsWith('#') ? t : `#${t}`))
      .slice(0, 10);
  }

  /**
   * Normalize score to 0-100
   */
  private normalizeScore(score: unknown): number {
    const num = Number(score);
    if (isNaN(num)) return 50;
    return Math.max(0, Math.min(100, Math.round(num)));
  }

  /**
   * Calculate importance score from breakdown
   */
  calculateImportanceScore(breakdown: ScoreBreakdown): number {
    return Math.round(
      breakdown.relevance * 0.25 +
        breakdown.actionability * 0.25 +
        breakdown.authority * 0.2 +
        breakdown.timeliness * 0.15 +
        breakdown.originality * 0.15
    );
  }

  /**
   * Get agent info
   */
  getInfo(): { name: string; cantoneseName: string; model: string } {
    return {
      name: this.agentName,
      cantoneseName: this.cantoneseName,
      model: this.model,
    };
  }
}

// Export factory function
export function createNewsAnalystAgent(llmTool?: InternalLLMTool): NewsAnalystAgent {
  return new NewsAnalystAgent(llmTool);
}

export default NewsAnalystAgent;
