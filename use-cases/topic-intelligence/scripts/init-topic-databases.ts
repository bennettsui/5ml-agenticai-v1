/**
 * Layer 4: Knowledge - Initialize Topic Databases
 * Creates Notion database structure for a new topic
 *
 * Databases:
 * 1. Topics Master List - Main topic registry
 * 2. Topic Sources - Sources linked to topics
 * 3. Daily News - Daily scraped and analyzed news
 * 4. Weekly Digest - Weekly newsletter archives
 */

import { NotionTool, notionTool, type NotionProperty, type NotionDatabase } from '../tools/notion-tool';

export interface TopicDatabaseIds {
  topicsMaster: string;
  topicSources: string;
  dailyNews: string;
  weeklyDigest: string;
}

export interface InitDatabasesResult {
  success: boolean;
  databases: TopicDatabaseIds | null;
  error?: string;
}

/**
 * Database schema definitions
 */
const TOPICS_MASTER_SCHEMA: Record<string, NotionProperty> = {
  'Topic Name': { title: {} },
  'Status': {
    select: {
      options: [
        { name: 'Active', color: 'green' },
        { name: 'Paused', color: 'yellow' },
        { name: 'Archived', color: 'gray' },
      ],
    },
  },
  'Keywords': { rich_text: {} },
  'Created Date': { date: {} },
  'Created By': { rich_text: {} },
  'Daily Scan Time': { rich_text: {} },
  'Weekly Digest Day': {
    select: {
      options: [
        { name: 'Monday', color: 'blue' },
        { name: 'Tuesday', color: 'blue' },
        { name: 'Wednesday', color: 'blue' },
        { name: 'Thursday', color: 'blue' },
        { name: 'Friday', color: 'blue' },
        { name: 'Saturday', color: 'blue' },
        { name: 'Sunday', color: 'blue' },
      ],
    },
  },
  'Weekly Digest Time': { rich_text: {} },
  'Total Sources': { number: { format: 'number' } },
  'Last Scan': { date: {} },
  'Last Digest Sent': { date: {} },
};

const TOPIC_SOURCES_SCHEMA: Record<string, NotionProperty> = {
  'Source Name': { title: {} },
  'Primary URL': { url: {} },
  'Secondary URLs': { rich_text: {} },
  'Content Types': {
    multi_select: {
      options: [
        { name: 'Posts', color: 'blue' },
        { name: 'Articles', color: 'green' },
        { name: 'Videos', color: 'red' },
        { name: 'Podcasts', color: 'purple' },
        { name: 'Newsletters', color: 'orange' },
      ],
    },
  },
  'Authority Score': { number: { format: 'number' } },
  'Focus Areas': { multi_select: { options: [] } },
  'Posting Frequency': {
    select: {
      options: [
        { name: 'Daily', color: 'green' },
        { name: 'Weekly', color: 'blue' },
        { name: 'Monthly', color: 'yellow' },
        { name: 'Irregular', color: 'gray' },
      ],
    },
  },
  'Status': {
    select: {
      options: [
        { name: 'Active', color: 'green' },
        { name: 'Inactive', color: 'gray' },
      ],
    },
  },
  'Last Verified': { date: {} },
  'Why Selected': { rich_text: {} },
  'Title': { rich_text: {} },
};

const DAILY_NEWS_SCHEMA: Record<string, NotionProperty> = {
  'Title': { title: {} },
  'Source Name': { rich_text: {} },
  'Source URL': { url: {} },
  'Content Summary': { rich_text: {} },
  'Published Date': { date: {} },
  'Scraped Date': { date: {} },
  'Importance Score': { number: { format: 'number' } },
  'Key Insights': { rich_text: {} },
  'Action Items': { rich_text: {} },
  'Tags': { multi_select: { options: [] } },
  'Status': {
    select: {
      options: [
        { name: 'New', color: 'blue' },
        { name: 'Read', color: 'green' },
        { name: 'Archived', color: 'gray' },
      ],
    },
  },
  'Full Article URL': { url: {} },
  'Score Breakdown': { rich_text: {} },
};

const WEEKLY_DIGEST_SCHEMA: Record<string, NotionProperty> = {
  'Week': { title: {} },
  'Week Start': { date: {} },
  'Total Articles': { number: { format: 'number' } },
  'High Importance Count': { number: { format: 'number' } },
  'Top Stories Count': { number: { format: 'number' } },
  'Email Subject': { rich_text: {} },
  'Email HTML': { rich_text: {} },
  'Email Sent Date': { date: {} },
  'Sent To': { rich_text: {} },
  'Open Rate': { number: { format: 'percent' } },
  'Status': {
    select: {
      options: [
        { name: 'Draft', color: 'yellow' },
        { name: 'Sent', color: 'green' },
        { name: 'Failed', color: 'red' },
      ],
    },
  },
};

export class TopicDatabaseInitializer {
  private notionTool: NotionTool;

  constructor(notionTool?: NotionTool) {
    this.notionTool = notionTool || notionTool;
  }

  /**
   * Initialize all databases for the topic intelligence system
   */
  async initializeAllDatabases(parentPageId?: string): Promise<InitDatabasesResult> {
    console.log('[TopicDatabaseInitializer] Starting database initialization...');

    try {
      // Create Topics Master List
      const topicsMaster = await this.createDatabase(
        '📊 Topics Master List',
        TOPICS_MASTER_SCHEMA,
        parentPageId
      );
      console.log(`[TopicDatabaseInitializer] Created Topics Master: ${topicsMaster.id}`);

      // Create Topic Sources (with relation to Topics)
      const topicSourcesSchema = {
        ...TOPIC_SOURCES_SCHEMA,
        'Topic': {
          relation: {
            database_id: topicsMaster.id,
            type: 'single_property',
          },
        },
      };
      const topicSources = await this.createDatabase(
        '🔗 Topic Sources',
        topicSourcesSchema as Record<string, NotionProperty>,
        parentPageId
      );
      console.log(`[TopicDatabaseInitializer] Created Topic Sources: ${topicSources.id}`);

      // Create Daily News (with relation to Topics)
      const dailyNewsSchema = {
        ...DAILY_NEWS_SCHEMA,
        'Topic': {
          relation: {
            database_id: topicsMaster.id,
            type: 'single_property',
          },
        },
      };
      const dailyNews = await this.createDatabase(
        '📰 Daily News',
        dailyNewsSchema as Record<string, NotionProperty>,
        parentPageId
      );
      console.log(`[TopicDatabaseInitializer] Created Daily News: ${dailyNews.id}`);

      // Create Weekly Digest (with relation to Topics)
      const weeklyDigestSchema = {
        ...WEEKLY_DIGEST_SCHEMA,
        'Topic': {
          relation: {
            database_id: topicsMaster.id,
            type: 'single_property',
          },
        },
      };
      const weeklyDigest = await this.createDatabase(
        '📧 Weekly Digest',
        weeklyDigestSchema as Record<string, NotionProperty>,
        parentPageId
      );
      console.log(`[TopicDatabaseInitializer] Created Weekly Digest: ${weeklyDigest.id}`);

      console.log('[TopicDatabaseInitializer] All databases initialized successfully');

      return {
        success: true,
        databases: {
          topicsMaster: topicsMaster.id,
          topicSources: topicSources.id,
          dailyNews: dailyNews.id,
          weeklyDigest: weeklyDigest.id,
        },
      };
    } catch (error) {
      console.error('[TopicDatabaseInitializer] Failed to initialize databases:', error);
      return {
        success: false,
        databases: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Create a single database
   */
  private async createDatabase(
    title: string,
    schema: Record<string, NotionProperty>,
    parentPageId?: string
  ): Promise<NotionDatabase> {
    return this.notionTool.createDatabase(title, schema, parentPageId);
  }

  /**
   * Add a new topic to the master list
   */
  async createTopic(
    databaseId: string,
    topicData: {
      name: string;
      keywords: string[];
      createdBy?: string;
      dailyScanTime?: string;
      weeklyDigestDay?: string;
      weeklyDigestTime?: string;
    }
  ): Promise<{ id: string; url: string }> {
    const properties = {
      'Topic Name': this.notionTool.buildPropertyValue('title', topicData.name),
      'Status': this.notionTool.buildPropertyValue('select', 'Active'),
      'Keywords': this.notionTool.buildPropertyValue('rich_text', topicData.keywords.join(', ')),
      'Created Date': this.notionTool.buildPropertyValue('date', new Date().toISOString()),
      'Created By': this.notionTool.buildPropertyValue('rich_text', topicData.createdBy || 'System'),
      'Daily Scan Time': this.notionTool.buildPropertyValue('rich_text', topicData.dailyScanTime || '06:00 HKT'),
      'Weekly Digest Day': this.notionTool.buildPropertyValue('select', topicData.weeklyDigestDay || 'Monday'),
      'Weekly Digest Time': this.notionTool.buildPropertyValue('rich_text', topicData.weeklyDigestTime || '08:00 HKT'),
      'Total Sources': this.notionTool.buildPropertyValue('number', 0),
    };

    const page = await this.notionTool.createPage(databaseId, properties);
    return { id: page.id, url: page.url };
  }

  /**
   * Add sources to a topic
   */
  async addSourcesToTopic(
    sourcesDatabaseId: string,
    topicPageId: string,
    sources: Array<{
      name: string;
      title?: string;
      primaryUrl: string;
      secondaryUrls?: string[];
      contentTypes?: string[];
      authorityScore?: number;
      focusAreas?: string[];
      postingFrequency?: string;
      whySelected?: string;
    }>
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const source of sources) {
      try {
        const properties = {
          'Source Name': this.notionTool.buildPropertyValue('title', source.name),
          'Primary URL': this.notionTool.buildPropertyValue('url', source.primaryUrl),
          'Secondary URLs': this.notionTool.buildPropertyValue(
            'rich_text',
            source.secondaryUrls?.join('\n') || ''
          ),
          'Content Types': this.notionTool.buildPropertyValue(
            'multi_select',
            source.contentTypes || ['Articles']
          ),
          'Authority Score': this.notionTool.buildPropertyValue('number', source.authorityScore || 50),
          'Focus Areas': this.notionTool.buildPropertyValue(
            'multi_select',
            source.focusAreas || []
          ),
          'Posting Frequency': this.notionTool.buildPropertyValue(
            'select',
            source.postingFrequency || 'Irregular'
          ),
          'Status': this.notionTool.buildPropertyValue('select', 'Active'),
          'Last Verified': this.notionTool.buildPropertyValue('date', new Date().toISOString()),
          'Why Selected': this.notionTool.buildPropertyValue('rich_text', source.whySelected || ''),
          'Title': this.notionTool.buildPropertyValue('rich_text', source.title || ''),
          'Topic': this.notionTool.buildPropertyValue('relation', topicPageId),
        };

        await this.notionTool.createPage(sourcesDatabaseId, properties);
        success++;
      } catch (error) {
        console.error(`[TopicDatabaseInitializer] Failed to add source ${source.name}:`, error);
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * Add a news article to daily news
   */
  async addDailyNewsArticle(
    newsDatabaseId: string,
    topicPageId: string,
    article: {
      title: string;
      sourceName: string;
      sourceUrl: string;
      contentSummary: string;
      publishedDate?: string;
      importanceScore: number;
      keyInsights: string[];
      actionItems: string[];
      tags: string[];
      scoreBreakdown?: Record<string, number>;
    }
  ): Promise<{ id: string }> {
    const properties = {
      'Title': this.notionTool.buildPropertyValue('title', article.title),
      'Source Name': this.notionTool.buildPropertyValue('rich_text', article.sourceName),
      'Source URL': this.notionTool.buildPropertyValue('url', article.sourceUrl),
      'Content Summary': this.notionTool.buildPropertyValue('rich_text', article.contentSummary),
      'Published Date': article.publishedDate
        ? this.notionTool.buildPropertyValue('date', article.publishedDate)
        : undefined,
      'Scraped Date': this.notionTool.buildPropertyValue('date', new Date().toISOString()),
      'Importance Score': this.notionTool.buildPropertyValue('number', article.importanceScore),
      'Key Insights': this.notionTool.buildPropertyValue('rich_text', article.keyInsights.join('\n• ')),
      'Action Items': this.notionTool.buildPropertyValue('rich_text', article.actionItems.join('\n• ')),
      'Tags': this.notionTool.buildPropertyValue('multi_select', article.tags.map(t => t.replace('#', ''))),
      'Status': this.notionTool.buildPropertyValue('select', 'New'),
      'Full Article URL': this.notionTool.buildPropertyValue('url', article.sourceUrl),
      'Score Breakdown': article.scoreBreakdown
        ? this.notionTool.buildPropertyValue('rich_text', JSON.stringify(article.scoreBreakdown))
        : undefined,
      'Topic': this.notionTool.buildPropertyValue('relation', topicPageId),
    };

    // Remove undefined properties
    const cleanProperties = Object.fromEntries(
      Object.entries(properties).filter(([_, v]) => v !== undefined)
    );

    const page = await this.notionTool.createPage(newsDatabaseId, cleanProperties);
    return { id: page.id };
  }

  /**
   * Add a weekly digest record
   */
  async addWeeklyDigest(
    digestDatabaseId: string,
    topicPageId: string,
    digest: {
      weekStart: string;
      totalArticles: number;
      highImportanceCount: number;
      topStoriesCount: number;
      emailSubject: string;
      emailHtml?: string;
      sentTo?: string[];
      status: 'Draft' | 'Sent' | 'Failed';
    }
  ): Promise<{ id: string }> {
    const weekLabel = new Date(digest.weekStart).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const properties = {
      'Week': this.notionTool.buildPropertyValue('title', `Week of ${weekLabel}`),
      'Week Start': this.notionTool.buildPropertyValue('date', digest.weekStart),
      'Total Articles': this.notionTool.buildPropertyValue('number', digest.totalArticles),
      'High Importance Count': this.notionTool.buildPropertyValue('number', digest.highImportanceCount),
      'Top Stories Count': this.notionTool.buildPropertyValue('number', digest.topStoriesCount),
      'Email Subject': this.notionTool.buildPropertyValue('rich_text', digest.emailSubject),
      'Email HTML': digest.emailHtml
        ? this.notionTool.buildPropertyValue('rich_text', digest.emailHtml.slice(0, 2000)) // Notion limit
        : undefined,
      'Sent To': digest.sentTo
        ? this.notionTool.buildPropertyValue('rich_text', digest.sentTo.join(', '))
        : undefined,
      'Status': this.notionTool.buildPropertyValue('select', digest.status),
      'Topic': this.notionTool.buildPropertyValue('relation', topicPageId),
    };

    if (digest.status === 'Sent') {
      (properties as Record<string, unknown>)['Email Sent Date'] = this.notionTool.buildPropertyValue(
        'date',
        new Date().toISOString()
      );
    }

    // Remove undefined properties
    const cleanProperties = Object.fromEntries(
      Object.entries(properties).filter(([_, v]) => v !== undefined)
    );

    const page = await this.notionTool.createPage(digestDatabaseId, cleanProperties);
    return { id: page.id };
  }
}

// Export factory function
export function createTopicDatabaseInitializer(notionTool?: NotionTool): TopicDatabaseInitializer {
  return new TopicDatabaseInitializer(notionTool);
}

// CLI script for manual initialization
async function main() {
  const parentPageId = process.env.NOTION_PARENT_PAGE_ID;

  if (!parentPageId) {
    console.error('Error: NOTION_PARENT_PAGE_ID environment variable is required');
    process.exit(1);
  }

  const initializer = new TopicDatabaseInitializer();
  const result = await initializer.initializeAllDatabases(parentPageId);

  if (result.success) {
    console.log('\n✅ Database initialization complete!');
    console.log('Database IDs:');
    console.log(JSON.stringify(result.databases, null, 2));
    console.log('\nSave these IDs to your environment variables:');
    console.log(`NOTION_TOPICS_MASTER_DB=${result.databases?.topicsMaster}`);
    console.log(`NOTION_TOPIC_SOURCES_DB=${result.databases?.topicSources}`);
    console.log(`NOTION_DAILY_NEWS_DB=${result.databases?.dailyNews}`);
    console.log(`NOTION_WEEKLY_DIGEST_DB=${result.databases?.weeklyDigest}`);
  } else {
    console.error('\n❌ Database initialization failed:', result.error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export default TopicDatabaseInitializer;
