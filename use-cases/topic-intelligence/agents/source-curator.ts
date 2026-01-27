/**
 * Layer 3: Agent - Source Curator Agent
 * 源頭策展官 - Discovers and curates authoritative sources for a given topic
 *
 * Persona: "5ML 既網絡偵探，發掘最權威既信息源"
 * Model: 5ml-source-curator-v1
 * Temperature: 0.3 (deterministic)
 * Max Tokens: 4000
 *
 * Supports multiple prompt modes:
 * - 'comprehensive': Full research sources + trends mapping (default)
 * - 'quick': Fast scan for quick overview
 * - 'trends': Focus on trend tracking and emerging signals
 */

import { InternalLLMTool, internalLLMTool, type LLMResponse } from '../tools/internal-llm-tool';

export interface CuratedSource {
  source_id: string;
  name: string;
  title: string;
  type: 'official' | 'academic' | 'report' | 'blog' | 'tool' | 'community' | 'event' | 'newsletter' | 'social';
  primary_url: string;
  secondary_urls: string[];
  content_types: ('posts' | 'articles' | 'videos' | 'podcasts' | 'newsletters' | 'reports' | 'datasets')[];
  posting_frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually' | 'irregular';
  focus_areas: string[];
  authority_score: number;
  why_selected: string;
  freshness?: string;
  priority: 'high' | 'medium' | 'nice-to-have';
  trend_signal_type?: 'quantitative' | 'expert_commentary' | 'early_signals' | 'mixed';
}

export type PromptMode = 'comprehensive' | 'quick' | 'trends';

export interface SourceCuratorInput {
  topicName: string;
  keywords?: string[];
  languages?: string[];
  regions?: string[];
  timeframe?: string;
  mode?: PromptMode;
}

export interface SourceCuratorOutput {
  topic: string;
  keywords: string[];
  mode: PromptMode;
  executiveSummary?: string[];
  sources: CuratedSource[];
  searchQueries?: string[];
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

// ==========================================
// Prompt Templates
// ==========================================

/**
 * 1️⃣ Comprehensive Prompt - Full research sources + trends mapping
 */
const COMPREHENSIVE_PROMPT = `You are a senior research analyst.

Your task: Map out the BEST sources to research the topic: "{topic}".

Please:
1) Focus on:
   - Language(s): {languages}
   - Region(s): {regions}
   - Timeframe: especially sources updated since {timeframe}

2) Identify and list sources in these buckets:
   A. Official / Primary Sources
      - Official websites, documentation, standards bodies
      - Company / product blogs, transparency centers, APIs
   B. Academic & Data Sources
      - Key papers, journals, datasets, university labs
      - Where to search (e.g. Google Scholar keywords)
   C. Industry Reports & Market Research
      - Consulting firms, research houses, annual / benchmark reports
   D. High-Quality Blogs, Newsletters & Media
      - Practitioners' blogs, expert newsletters, niche publications
   E. Tools, Dashboards & Databases
      - Analytics tools, trackers, public dashboards, APIs
   F. Communities & Social Sources
      - Reddit, forums, Discord/Slack groups, Twitter/X, YouTube channels, key influencers
   G. Events & Organisations
      - Conferences, associations, meetups relevant to this topic

3) For EACH source, provide:
   - Name
   - URL
   - Type (official / academic / report / blog / tool / community / event etc.)
   - Why it's useful for this topic (1–2 lines)
   - Freshness (e.g. "updated 2025", "ongoing newsletter")
   - Priority: High / Medium / Nice-to-have

4) Trend-tracking focus:
   - Show where to monitor ongoing CHANGES and TRENDS for {topic}:
     • specific newsletters
     • recurring reports (annual / quarterly)
     • dashboards / trackers
     • social accounts (X/Twitter, LinkedIn, YouTube, Substack, etc.)
   - Suggest 5–10 concrete search queries I can reuse on Google or other search engines to keep tracking new developments about {topic}.

User-provided keywords (if any): {keywords}

{quality_filter}

Output format - MUST return valid JSON:
{
  "executive_summary": ["bullet point 1", "bullet point 2", ...5-7 key points],
  "sources": [
    {
      "source_id": "unique_id",
      "name": "Source Name",
      "title": "Description/Title",
      "type": "official|academic|report|blog|tool|community|event|newsletter|social",
      "primary_url": "https://...",
      "secondary_urls": [],
      "content_types": ["articles", "reports", "videos"],
      "posting_frequency": "daily|weekly|monthly|quarterly|annually",
      "focus_areas": ["keyword1", "keyword2"],
      "authority_score": 85,
      "why_selected": "Why this source is valuable",
      "freshness": "updated 2025",
      "priority": "high|medium|nice-to-have"
    }
  ],
  "search_queries": ["query 1", "query 2", ...5-10 queries]
}

Return ONLY the JSON object, no other text.`;

/**
 * 2️⃣ Quick Scan Prompt - Fast overview for meetings
 */
const QUICK_PROMPT = `Map out key research sources for the topic: "{topic}".

Constraints:
- Language: {languages}
- Region focus: {regions}
- Prioritise recent sources (since {timeframe}).

User-provided keywords (if any): {keywords}

Deliver:
1) Top 15-20 must-follow sources with:
   - Name, URL, type
   - One line: why this is valuable for understanding {topic}.

2) Group them into:
   - Official / primary
   - Academic / data
   - Industry reports
   - Blogs / newsletters / media
   - Tools / dashboards
   - Communities / key people

3) Add:
   - 5 search queries I should regularly use to track new updates on {topic}.

{quality_filter}

Output format - MUST return valid JSON:
{
  "sources": [
    {
      "source_id": "unique_id",
      "name": "Source Name",
      "title": "Brief description",
      "type": "official|academic|report|blog|tool|community|newsletter|social",
      "primary_url": "https://...",
      "secondary_urls": [],
      "content_types": ["articles"],
      "posting_frequency": "weekly",
      "focus_areas": ["keyword1"],
      "authority_score": 85,
      "why_selected": "One line reason",
      "priority": "high|medium|nice-to-have"
    }
  ],
  "search_queries": ["query 1", "query 2", ...5 queries]
}

Return ONLY the JSON object, no other text.`;

/**
 * 3️⃣ Trends-Focused Prompt - For tracking trends and emerging signals
 */
const TRENDS_PROMPT = `You are analysing current and emerging trends for the topic: "{topic}".

Tasks:
1) Identify where trends are visible:
   - Recurring reports (annual/quarterly) and who publishes them
   - Dashboards / trackers / datasets
   - Expert newsletters / Substacks / blogs
   - Active X/Twitter, LinkedIn, YouTube accounts shaping the discourse

2) For each source, give:
   - Name, URL, type
   - What kind of trend signal it gives (quantitative data, expert commentary, early-stage signals, etc.)
   - Update frequency (daily / weekly / monthly / annually)

3) Summarise:
   - 3–5 "best single places" to watch if I only have limited time
   - 5–10 search queries or RSS keywords I can use to continuously monitor trends in {topic}.

Focus:
- Language: {languages}
- Region/Market: {regions}
- Most recent 2–3 years of information.

User-provided keywords (if any): {keywords}

{quality_filter}

Output format - MUST return valid JSON:
{
  "executive_summary": ["best place 1", "best place 2", ...3-5 must-watch sources],
  "sources": [
    {
      "source_id": "unique_id",
      "name": "Source Name",
      "title": "Description",
      "type": "report|newsletter|blog|tool|social",
      "primary_url": "https://...",
      "secondary_urls": [],
      "content_types": ["reports", "data"],
      "posting_frequency": "quarterly",
      "focus_areas": ["trend1"],
      "authority_score": 90,
      "why_selected": "What trend signal it gives",
      "trend_signal_type": "quantitative|expert_commentary|early_signals|mixed",
      "priority": "high|medium|nice-to-have"
    }
  ],
  "search_queries": ["trend query 1", "trend query 2", ...5-10 queries]
}

Return ONLY the JSON object, no other text.`;

/**
 * Quality Filter Suffix - Added to all prompts
 */
const QUALITY_FILTER_SUFFIX = `When choosing sources:
- Prioritise credibility (official, peer-reviewed, established firms, recognised experts).
- Avoid low-quality SEO farm content and generic listicles unless they add unique value.
- Prefer sources with:
  • clear authorship,
  • methodological transparency,
  • and regular updates.
- If there are major disagreements between sources, briefly note them.`;

// ==========================================
// Agent Class
// ==========================================

export class SourceCuratorAgent {
  private llmTool: InternalLLMTool;
  private agentName = 'SourceCuratorAgent';
  private cantoneseName = '源頭策展官';
  private model: '5ml-source-curator-v1' = '5ml-source-curator-v1';

  constructor(llmTool?: InternalLLMTool) {
    this.llmTool = llmTool || internalLLMTool;
  }

  /**
   * Get the appropriate prompt template based on mode
   */
  private getPromptTemplate(mode: PromptMode): string {
    switch (mode) {
      case 'quick':
        return QUICK_PROMPT;
      case 'trends':
        return TRENDS_PROMPT;
      case 'comprehensive':
      default:
        return COMPREHENSIVE_PROMPT;
    }
  }

  /**
   * Build the prompt with all parameters
   */
  private buildPrompt(input: SourceCuratorInput): string {
    const mode = input.mode || 'comprehensive';
    const template = this.getPromptTemplate(mode);

    const languages = input.languages?.length
      ? input.languages.join(', ')
      : 'English, Traditional Chinese';

    const regions = input.regions?.length
      ? input.regions.join(', ')
      : 'Global, Hong Kong, Asia';

    const timeframe = input.timeframe || '2024';

    const keywords = input.keywords?.length
      ? input.keywords.join(', ')
      : '(No specific keywords provided, use topic to guide selection)';

    return template
      .replace(/{topic}/g, input.topicName)
      .replace(/{languages}/g, languages)
      .replace(/{regions}/g, regions)
      .replace(/{timeframe}/g, timeframe)
      .replace(/{keywords}/g, keywords)
      .replace(/{quality_filter}/g, QUALITY_FILTER_SUFFIX);
  }

  /**
   * Curate sources for a given topic
   */
  async curateSources(input: SourceCuratorInput): Promise<SourceCuratorOutput> {
    const mode = input.mode || 'comprehensive';

    console.log(
      `[${this.agentName}] Starting source curation for topic: ${input.topicName} (mode: ${mode})`
    );

    // Build the prompt
    const prompt = this.buildPrompt(input);

    // Call the LLM with higher token limit for comprehensive mode
    const maxTokens = mode === 'comprehensive' ? 4000 : 2500;

    const response: LLMResponse = await this.llmTool.callLLM(
      this.model,
      prompt,
      { topic: input.topicName, keywords: input.keywords, mode },
      { temperature: 0.3, maxTokens }
    );

    // Parse the response
    const parsed = this.parseResponse(response);

    console.log(
      `[${this.agentName}] Found ${parsed.sources.length} sources`
    );

    return {
      topic: input.topicName,
      keywords: input.keywords || [],
      mode,
      executiveSummary: parsed.executiveSummary,
      sources: parsed.sources,
      searchQueries: parsed.searchQueries,
      _meta: {
        model: response.model,
        usage: response.usage,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Parse the LLM response
   */
  private parseResponse(response: LLMResponse): {
    executiveSummary?: string[];
    sources: CuratedSource[];
    searchQueries?: string[];
  } {
    try {
      const content = response.content;

      // Try to extract JSON from code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      let jsonContent = jsonMatch ? jsonMatch[1] : content;

      // Try to find JSON object in the content
      const objectMatch = jsonContent.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        jsonContent = objectMatch[0];
      }

      const parsed = JSON.parse(jsonContent);

      // Handle both array and object responses
      let sources: unknown[];
      if (Array.isArray(parsed)) {
        sources = parsed;
      } else if (parsed.sources && Array.isArray(parsed.sources)) {
        sources = parsed.sources;
      } else {
        throw new Error('Response does not contain valid sources array');
      }

      return {
        executiveSummary: parsed.executive_summary || parsed.executiveSummary,
        sources: this.validateSources(sources),
        searchQueries: parsed.search_queries || parsed.searchQueries,
      };
    } catch (error) {
      console.error(
        `[${this.agentName}] Failed to parse response:`,
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
        title: String(s.title || s.description || ''),
        type: this.validateType(s.type),
        primary_url: String(s.primary_url || s.url),
        secondary_urls: Array.isArray(s.secondary_urls)
          ? s.secondary_urls.map(String).filter(Boolean)
          : [],
        content_types: this.validateContentTypes(s.content_types),
        posting_frequency: this.validateFrequency(s.posting_frequency || s.update_frequency),
        focus_areas: Array.isArray(s.focus_areas)
          ? s.focus_areas.map(String)
          : [],
        authority_score: this.normalizeScore(s.authority_score),
        why_selected: String(s.why_selected || s.why_useful || s.reason || ''),
        freshness: s.freshness ? String(s.freshness) : undefined,
        priority: this.validatePriority(s.priority),
        trend_signal_type: s.trend_signal_type
          ? this.validateTrendSignal(s.trend_signal_type)
          : undefined,
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
    return !!(s.name && (s.primary_url || s.url));
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
   * Validate source type
   */
  private validateType(
    type: unknown
  ): CuratedSource['type'] {
    const validTypes = ['official', 'academic', 'report', 'blog', 'tool', 'community', 'event', 'newsletter', 'social'];
    const t = String(type).toLowerCase();
    return validTypes.includes(t) ? (t as CuratedSource['type']) : 'blog';
  }

  /**
   * Validate content types
   */
  private validateContentTypes(
    types: unknown
  ): CuratedSource['content_types'] {
    const validTypes = ['posts', 'articles', 'videos', 'podcasts', 'newsletters', 'reports', 'datasets'];

    if (!Array.isArray(types)) return ['articles'];

    return types
      .map(String)
      .map(t => t.toLowerCase())
      .filter(t => validTypes.includes(t)) as CuratedSource['content_types'];
  }

  /**
   * Validate posting frequency
   */
  private validateFrequency(
    freq: unknown
  ): CuratedSource['posting_frequency'] {
    const validFreqs = ['daily', 'weekly', 'monthly', 'quarterly', 'annually', 'irregular'];
    const f = String(freq).toLowerCase();
    return validFreqs.includes(f)
      ? (f as CuratedSource['posting_frequency'])
      : 'irregular';
  }

  /**
   * Validate priority
   */
  private validatePriority(priority: unknown): CuratedSource['priority'] {
    const p = String(priority).toLowerCase().replace(/-/g, '');
    if (p === 'high') return 'high';
    if (p === 'medium') return 'medium';
    return 'nice-to-have';
  }

  /**
   * Validate trend signal type
   */
  private validateTrendSignal(signal: unknown): CuratedSource['trend_signal_type'] {
    const validSignals = ['quantitative', 'expert_commentary', 'early_signals', 'mixed'];
    const s = String(signal).toLowerCase().replace(/ /g, '_');
    return validSignals.includes(s)
      ? (s as CuratedSource['trend_signal_type'])
      : 'mixed';
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
  getInfo(): { name: string; cantoneseName: string; model: string; modes: PromptMode[] } {
    return {
      name: this.agentName,
      cantoneseName: this.cantoneseName,
      model: this.model,
      modes: ['comprehensive', 'quick', 'trends'],
    };
  }
}

// Export factory function
export function createSourceCuratorAgent(llmTool?: InternalLLMTool): SourceCuratorAgent {
  return new SourceCuratorAgent(llmTool);
}

export default SourceCuratorAgent;
