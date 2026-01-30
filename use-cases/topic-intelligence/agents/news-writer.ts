/**
 * Layer 3: Agent - News Writer Agent
 * 新聞編寫官 - Generates HTML email newsletters from curated articles
 *
 * Persona: "5ML 既故事大師，將週訊寫成引人入勝既專業郵件"
 * Model: 5ml-news-writer-v1
 * Temperature: 0.7 (creative)
 * Max Tokens: 3000
 */

import { InternalLLMTool, internalLLMTool, type LLMResponse } from '../tools/internal-llm-tool';
import { type AnalyzedArticle } from './news-analyst';

export interface NewsWriterInput {
  topicId: string;
  topicName: string;
  articles: AnalyzedArticle[];
  weekDate: string; // ISO date of the Monday
  totalArticlesThisWeek: number;
  highImportanceCount: number;
  recipientCount?: number;
  dashboardUrl?: string;
}

export interface NewsWriterOutput {
  subject: string;
  previewText: string;
  htmlContent: string;
  plainTextContent?: string;
  articlesIncluded: number;
  _meta: {
    model: string;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    generatedAt: string;
    htmlSizeKb: number;
  };
}

const NEWS_WRITER_PROMPT = `## Agent Prompt: NewsWriterAgent

**代理身份：**
你係 5ML 既新聞編寫官。你既職責係將過去 7 日既「{topic}」精選新聞，
轉化成一份專業、引人入勝、高轉化率既 HTML 週訊。

**郵件元數據：**
- From: news@5ml.io
- Subject: 「{topic} Weekly Brief: {week_date} - {top_story_count} must-read insights」
- Preview: 「本週 {topic} 既重要發展...」

**郵件結構（5 部分）：**

**[1] 郵件頭（Header & Metadata）**
- Logo area (5ML branding)
- Week date display

**[2] 開場白（Intro Section）**
- 語氣：親切、專業、略帶興奮感
- 簡短問候
- 本週總結：「共發現 {total_articles} 條新聞，其中 {high_importance} 條高重要性」
- Preview：「點擊下方了解本週最重要既洞察」

**[3] 主體內容（Main Content）**

**Section 3.1 - 🔥 頂級洞察（Top 3）**
- 按 importance_score 降序
- 每個卡片：
  - 📌 Title + Category emoji
  - ⚡ 摘要（2 句）
  - 📊 Importance Score
  - 💡 可行動 insight（1 line）
  - 👤 來源 + 日期
  - 🔗 [Read Full Article] button

**Section 3.2 - 📚 本週精選（其餘文章）**
- 標題 + 一句摘要 + tags

**Section 3.3 - 📊 本週數據快照**
- 新文章總數
- 按重要性分佈
- 最活躍來源

**[4] 行動呼籲（CTA Section）**
- 主 CTA：「進入 Intelligence Hub 探索所有新聞」
  - Button color: #32B8C6
  - Link: {dashboard_url}
- 次 CTA：「有新發現? 回覆此郵件」

**[5] 結尾（Footer）**
- 發件資訊
- Unsubscribe link
- 社交媒體連結
- 簡單聲明

**待包含文章（Top 15）：**
{articles}

**HTML & 設計要點：**
- 寬度：600px
- 字體：Arial, Helvetica, sans-serif
- 背景色：white (#ffffff)
- 文本色：#333333
- 品牌色 CTA：#32B8C6
- 所有樣式 inline CSS
- 支援 dark mode (media queries)
- 不使用外部圖片

**輸出要求：**
- 完整 HTML（DOCTYPE to </html>）
- 郵件長度：Max 15KB
- 只返回 HTML，不要其他文字`;

export class NewsWriterAgent {
  private llmTool: InternalLLMTool;
  private agentName = 'NewsWriterAgent';
  private cantoneseName = '新聞編寫官';
  private model: '5ml-news-writer-v1' = '5ml-news-writer-v1';

  constructor(llmTool?: InternalLLMTool) {
    this.llmTool = llmTool || internalLLMTool;
  }

  /**
   * Generate the weekly digest email
   */
  async generateDigest(input: NewsWriterInput): Promise<NewsWriterOutput> {
    console.log(
      `[${this.agentName}] Generating weekly digest for topic: ${input.topicName}`
    );

    // Take top 15 articles
    const topArticles = input.articles.slice(0, 15);

    // Format articles for the prompt
    const articlesText = topArticles
      .map(
        (a, i) => `
### Article ${i + 1}
- Title: ${a.title}
- Source: ${a.source_name}
- URL: ${a.source_url}
- Published: ${a.published_at || 'N/A'}
- Importance Score: ${a.importance_score}
- Summary: ${a.content_summary}
- Key Insights: ${a.key_insights.join('; ')}
- Action Items: ${a.action_items.join('; ')}
- Tags: ${a.tags.join(', ')}
`
      )
      .join('\n');

    // Format week date
    const weekDate = this.formatWeekDate(input.weekDate);

    // Build the prompt
    const prompt = NEWS_WRITER_PROMPT
      .replace(/{topic}/g, input.topicName)
      .replace(/{week_date}/g, weekDate)
      .replace(/{top_story_count}/g, String(topArticles.length))
      .replace(/{total_articles}/g, String(input.totalArticlesThisWeek))
      .replace(/{high_importance}/g, String(input.highImportanceCount))
      .replace(
        /{dashboard_url}/g,
        input.dashboardUrl ||
          `https://dashboard.5ml.io/intelligence/dashboard?topic=${input.topicId}`
      )
      .replace('{articles}', articlesText);

    // Call the LLM
    const response: LLMResponse = await this.llmTool.callLLM(
      this.model,
      prompt,
      {
        topic: input.topicName,
        articleCount: topArticles.length,
        weekDate,
      },
      { temperature: 0.7, maxTokens: 3000 }
    );

    // Extract and validate HTML
    const htmlContent = this.extractHTML(response.content);
    const validatedHtml = this.validateHTML(htmlContent);

    // Generate subject and preview
    const subject = `${input.topicName} Weekly Brief: ${weekDate} - ${topArticles.length} must-read insights`;
    const previewText = `本週 ${input.topicName} 既重要發展：共發現 ${input.totalArticlesThisWeek} 條新聞，其中 ${input.highImportanceCount} 條高重要性`;

    console.log(`[${this.agentName}] Digest generated successfully`);

    return {
      subject,
      previewText,
      htmlContent: validatedHtml,
      plainTextContent: this.generatePlainText(input, topArticles),
      articlesIncluded: topArticles.length,
      _meta: {
        model: response.model,
        usage: response.usage,
        generatedAt: new Date().toISOString(),
        htmlSizeKb: Math.round(Buffer.byteLength(validatedHtml, 'utf8') / 1024 * 100) / 100,
      },
    };
  }

  /**
   * Extract HTML from LLM response
   */
  private extractHTML(content: string): string {
    // Try to extract HTML from code blocks
    const htmlMatch = content.match(/```(?:html)?\s*([\s\S]*?)\s*```/);
    if (htmlMatch) {
      return htmlMatch[1].trim();
    }

    // Try to find DOCTYPE
    const doctypeMatch = content.match(/<!DOCTYPE[\s\S]*<\/html>/i);
    if (doctypeMatch) {
      return doctypeMatch[0].trim();
    }

    // Try to find HTML tag
    const htmlTagMatch = content.match(/<html[\s\S]*<\/html>/i);
    if (htmlTagMatch) {
      return htmlTagMatch[0].trim();
    }

    // Return as-is if no clear HTML structure
    return content.trim();
  }

  /**
   * Validate and fix HTML if needed
   */
  private validateHTML(html: string): string {
    // Ensure DOCTYPE
    if (!html.toLowerCase().includes('<!doctype')) {
      html = '<!DOCTYPE html>\n' + html;
    }

    // Ensure basic structure
    if (!html.includes('<html')) {
      html = html.replace(
        '<!DOCTYPE html>',
        '<!DOCTYPE html>\n<html lang="en">'
      );
      html += '\n</html>';
    }

    // Add viewport meta if missing
    if (!html.includes('viewport')) {
      html = html.replace(
        '</head>',
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n</head>'
      );
    }

    // Ensure charset
    if (!html.includes('charset')) {
      html = html.replace(
        '<head>',
        '<head>\n<meta charset="utf-8">'
      );
    }

    return html;
  }

  /**
   * Generate plain text version
   */
  private generatePlainText(
    input: NewsWriterInput,
    articles: AnalyzedArticle[]
  ): string {
    const lines: string[] = [
      `${input.topicName} Weekly Brief`,
      `Week of ${this.formatWeekDate(input.weekDate)}`,
      '',
      `本週總結：共發現 ${input.totalArticlesThisWeek} 條新聞，其中 ${input.highImportanceCount} 條高重要性`,
      '',
      '=== 頂級洞察 ===',
      '',
    ];

    // Top 3 articles
    articles.slice(0, 3).forEach((article, i) => {
      lines.push(`[${i + 1}] ${article.title}`);
      lines.push(`    來源: ${article.source_name}`);
      lines.push(`    重要性: ${article.importance_score}/100`);
      lines.push(`    摘要: ${article.content_summary}`);
      lines.push(`    連結: ${article.source_url}`);
      lines.push('');
    });

    lines.push('=== 本週精選 ===');
    lines.push('');

    // Rest of articles
    articles.slice(3).forEach(article => {
      lines.push(`• ${article.title}`);
      lines.push(`  ${article.content_summary.slice(0, 100)}...`);
      lines.push(`  ${article.source_url}`);
      lines.push('');
    });

    lines.push('---');
    lines.push('5ML Intelligence Hub');
    lines.push(
      `${input.dashboardUrl || `https://dashboard.5ml.io/intelligence/dashboard?topic=${input.topicId}`}`
    );

    return lines.join('\n');
  }

  /**
   * Format week date for display
   */
  private formatWeekDate(isoDate: string): string {
    const date = new Date(isoDate);
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  }

  /**
   * Generate a fallback template if LLM fails
   */
  generateFallbackTemplate(input: NewsWriterInput): string {
    const articles = input.articles.slice(0, 15);
    const weekDate = this.formatWeekDate(input.weekDate);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${input.topicName} Weekly Brief</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f4f4f4;">
  <table role="presentation" style="width:100%;border:none;border-spacing:0;">
    <tr>
      <td align="center" style="padding:20px 0;">
        <table role="presentation" style="width:600px;border:none;border-spacing:0;background-color:#ffffff;">
          <!-- Header -->
          <tr>
            <td style="padding:30px;background-color:#32B8C6;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;">5ML Intelligence</h1>
              <p style="margin:10px 0 0;color:#ffffff;font-size:14px;">Week of ${weekDate}</p>
            </td>
          </tr>

          <!-- Intro -->
          <tr>
            <td style="padding:30px;">
              <h2 style="margin:0 0 15px;color:#333333;font-size:20px;">${input.topicName} Weekly Brief</h2>
              <p style="margin:0;color:#666666;font-size:14px;line-height:1.6;">
                共發現 ${input.totalArticlesThisWeek} 條新聞，其中 ${input.highImportanceCount} 條高重要性。
                以下係本週最重要既洞察：
              </p>
            </td>
          </tr>

          <!-- Top Stories -->
          ${articles.slice(0, 3).map((article, i) => `
          <tr>
            <td style="padding:0 30px 20px;">
              <table style="width:100%;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
                <tr>
                  <td style="padding:20px;">
                    <span style="color:#32B8C6;font-size:12px;font-weight:bold;">#${i + 1} TOP STORY</span>
                    <h3 style="margin:10px 0;color:#333333;font-size:16px;">${article.title}</h3>
                    <p style="margin:0 0 15px;color:#666666;font-size:14px;line-height:1.5;">${article.content_summary}</p>
                    <p style="margin:0 0 15px;color:#999999;font-size:12px;">
                      📊 Score: ${article.importance_score}/100 | 👤 ${article.source_name}
                    </p>
                    <a href="${article.source_url}" style="display:inline-block;padding:10px 20px;background-color:#32B8C6;color:#ffffff;text-decoration:none;border-radius:4px;font-size:14px;">Read Article →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          `).join('')}

          <!-- More Stories -->
          <tr>
            <td style="padding:0 30px 30px;">
              <h3 style="margin:0 0 15px;color:#333333;font-size:18px;">📚 More This Week</h3>
              ${articles.slice(3).map(article => `
              <div style="padding:15px 0;border-bottom:1px solid #e0e0e0;">
                <a href="${article.source_url}" style="color:#333333;text-decoration:none;font-size:14px;font-weight:bold;">${article.title}</a>
                <p style="margin:5px 0 0;color:#666666;font-size:13px;">${article.tags.join(' ')}</p>
              </div>
              `).join('')}
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:30px;background-color:#f8f8f8;text-align:center;">
              <a href="${input.dashboardUrl || `https://dashboard.5ml.io/intelligence/dashboard?topic=${input.topicId}`}" style="display:inline-block;padding:15px 40px;background-color:#32B8C6;color:#ffffff;text-decoration:none;border-radius:4px;font-size:16px;font-weight:bold;">Explore All News →</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:30px;text-align:center;">
              <p style="margin:0 0 10px;color:#999999;font-size:12px;">
                You received this email because you subscribed to ${input.topicName} updates.
              </p>
              <p style="margin:0;color:#999999;font-size:12px;">
                <a href="#" style="color:#999999;">Unsubscribe</a> | <a href="#" style="color:#999999;">Manage Preferences</a>
              </p>
              <p style="margin:15px 0 0;color:#cccccc;font-size:11px;">© 2026 5ML. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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
export function createNewsWriterAgent(llmTool?: InternalLLMTool): NewsWriterAgent {
  return new NewsWriterAgent(llmTool);
}

export default NewsWriterAgent;
