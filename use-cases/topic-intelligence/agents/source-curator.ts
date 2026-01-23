/**
 * Layer 3: Agent - Source Curator Agent
 * 源頭策展官 - Discovers and curates 20 authoritative sources for a given topic
 *
 * Persona: "5ML 既網絡偵探，發掘最權威既信息源"
 * Model: 5ml-source-curator-v1
 * Temperature: 0.3 (deterministic)
 * Max Tokens: 2000
 */

import { InternalLLMTool, internalLLMTool, type LLMResponse } from '../tools/internal-llm-tool';

export interface CuratedSource {
  source_id: string;
  name: string;
  title: string;
  primary_url: string;
  secondary_urls: string[];
  content_types: ('posts' | 'articles' | 'videos' | 'podcasts' | 'newsletters')[];
  posting_frequency: 'daily' | 'weekly' | 'monthly' | 'irregular';
  focus_areas: string[];
  authority_score: number;
  why_selected: string;
}

export interface SourceCuratorInput {
  topicName: string;
  keywords?: string[];
}

export interface SourceCuratorOutput {
  topic: string;
  keywords: string[];
  sources: CuratedSource[];
  _meta: {
    model: string;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    generatedAt: string;
  };
}

const SOURCE_CURATOR_PROMPT = `## Agent Prompt: SourceCuratorAgent

**代理身份：**
你係 5ML 既源頭策展官。你既職責係從互聯網上發掘 20 位最權威既「{topic}」信息源。
佢地定期發佈關於此主題既最新洞察、技巧、及行業動態。

**搜索準則：**

1. **官方 / 權威人士：**
   - 該領域既官方機構或領導人物
   - 擁有 100K+ followers 既內容創作者（如適用）
   - 優先級：最高

2. **獨立專家：**
   - 在「{topic}」領域有深度研究既人士
   - 定期發佈高質量內容
   - 優先級：高

3. **內容渠道多樣性：**
   - 個人 profiles（Instagram, Twitter, LinkedIn）
   - Blogs / Medium
   - YouTube channels
   - Podcasts / Newsletters
   - RSS feeds

4. **篩選條件：**
   - 過去 6 個月有發佈內容（活躍性）
   - 內容直接相關於「{topic}」
   - 有具體、可驗證既見解（非猜測）
   - 中英文皆可，優先英文（global reach）

**用戶提供既關鍵詞（如有）：**
{keywords}

**輸出 JSON 格式（必須是 20 個 sources）：**
\`\`\`json
[
  {
    "source_id": "unique_identifier",
    "name": "KOL 名字",
    "title": "職位 / 身份",
    "primary_url": "主要 URL (e.g., Instagram profile)",
    "secondary_urls": [
      "twitter_url",
      "blog_url",
      "linkedin_url"
    ],
    "content_types": ["posts", "articles", "videos"],
    "posting_frequency": "daily|weekly|monthly",
    "focus_areas": ["keyword1", "keyword2"],
    "authority_score": 95,
    "why_selected": "清晰既理由"
  }
]
\`\`\`

**約束條件：**
- 必須返回恰好 20 個 sources
- 每個 URL 必須可驗證（能實際訪問）
- 優先選擇「定期更新」既源
- 多樣性：混合官方 + 獨立專家 + 不同渠道
- authority_score 範圍：0-100
- 只返回 JSON 數組，不要其他文字`;

export class SourceCuratorAgent {
  private llmTool: InternalLLMTool;
  private agentName = 'SourceCuratorAgent';
  private cantoneseName = '源頭策展官';
  private model: '5ml-source-curator-v1' = '5ml-source-curator-v1';

  constructor(llmTool?: InternalLLMTool) {
    this.llmTool = llmTool || internalLLMTool;
  }

  /**
   * Curate sources for a given topic
   */
  async curateSources(input: SourceCuratorInput): Promise<SourceCuratorOutput> {
    console.log(
      `[${this.agentName}] Starting source curation for topic: ${input.topicName}`
    );

    // Build the prompt
    const prompt = SOURCE_CURATOR_PROMPT
      .replace(/{topic}/g, input.topicName)
      .replace(
        /{keywords}/g,
        input.keywords?.length
          ? input.keywords.join(', ')
          : '（無特定關鍵詞，請根據主題自行判斷）'
      );

    // Call the LLM
    const response: LLMResponse = await this.llmTool.callLLM(
      this.model,
      prompt,
      { topic: input.topicName, keywords: input.keywords },
      { temperature: 0.3, maxTokens: 2000 }
    );

    // Parse the response
    const sources = this.parseSourcesResponse(response);

    // Validate and sanitize sources
    const validatedSources = this.validateSources(sources);

    console.log(
      `[${this.agentName}] Found ${validatedSources.length} valid sources`
    );

    return {
      topic: input.topicName,
      keywords: input.keywords || [],
      sources: validatedSources,
      _meta: {
        model: response.model,
        usage: response.usage,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Parse the LLM response to extract sources
   */
  private parseSourcesResponse(response: LLMResponse): CuratedSource[] {
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

      const sources = JSON.parse(jsonContent);

      if (!Array.isArray(sources)) {
        throw new Error('Response is not an array');
      }

      return sources;
    } catch (error) {
      console.error(
        `[${this.agentName}] Failed to parse sources response:`,
        error
      );
      throw new Error(
        `Failed to parse sources from LLM response: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Validate and sanitize sources
   */
  private validateSources(sources: unknown[]): CuratedSource[] {
    const validSources: CuratedSource[] = [];

    for (const source of sources) {
      if (!this.isValidSource(source)) {
        console.warn(
          `[${this.agentName}] Invalid source, skipping:`,
          JSON.stringify(source).slice(0, 100)
        );
        continue;
      }

      const s = source as Record<string, unknown>;

      validSources.push({
        source_id: String(s.source_id || this.generateSourceId(String(s.name))),
        name: String(s.name),
        title: String(s.title || ''),
        primary_url: String(s.primary_url),
        secondary_urls: Array.isArray(s.secondary_urls)
          ? s.secondary_urls.map(String).filter(Boolean)
          : [],
        content_types: this.validateContentTypes(s.content_types),
        posting_frequency: this.validateFrequency(s.posting_frequency),
        focus_areas: Array.isArray(s.focus_areas)
          ? s.focus_areas.map(String)
          : [],
        authority_score: this.normalizeScore(s.authority_score),
        why_selected: String(s.why_selected || ''),
      });
    }

    return validSources;
  }

  /**
   * Check if a source object is valid
   */
  private isValidSource(source: unknown): boolean {
    if (!source || typeof source !== 'object') return false;

    const s = source as Record<string, unknown>;
    return !!(s.name && s.primary_url);
  }

  /**
   * Generate a unique source ID
   */
  private generateSourceId(name: string): string {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 30);
    const timestamp = Date.now().toString(36);
    return `src-${slug}-${timestamp}`;
  }

  /**
   * Validate content types
   */
  private validateContentTypes(
    types: unknown
  ): ('posts' | 'articles' | 'videos' | 'podcasts' | 'newsletters')[] {
    const validTypes = ['posts', 'articles', 'videos', 'podcasts', 'newsletters'];

    if (!Array.isArray(types)) return ['articles'];

    return types
      .map(String)
      .filter(t => validTypes.includes(t.toLowerCase())) as (
      | 'posts'
      | 'articles'
      | 'videos'
      | 'podcasts'
      | 'newsletters'
    )[];
  }

  /**
   * Validate posting frequency
   */
  private validateFrequency(
    freq: unknown
  ): 'daily' | 'weekly' | 'monthly' | 'irregular' {
    const validFreqs = ['daily', 'weekly', 'monthly', 'irregular'];
    const f = String(freq).toLowerCase();
    return validFreqs.includes(f)
      ? (f as 'daily' | 'weekly' | 'monthly' | 'irregular')
      : 'irregular';
  }

  /**
   * Normalize authority score to 0-100
   */
  private normalizeScore(score: unknown): number {
    const num = Number(score);
    if (isNaN(num)) return 50;
    return Math.max(0, Math.min(100, Math.round(num)));
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
export function createSourceCuratorAgent(llmTool?: InternalLLMTool): SourceCuratorAgent {
  return new SourceCuratorAgent(llmTool);
}

export default SourceCuratorAgent;
