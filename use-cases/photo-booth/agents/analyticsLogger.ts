// Analytics & Learning Agent
// Logs sessions, tracks completions, errors, and theme usage for reporting

import { Pool } from 'pg';
import { PhotoBoothAnalytics, ThemeName, ErrorCode } from '../types';
import { formatError } from '../lib/errorFormatter';

export interface AnalyticsSummary {
  event_id?: string;
  date: string;
  total_sessions: number;
  completed_count: number;
  failed_count: number;
  completion_rate: number;
  avg_generation_time_ms: number;
  theme_distribution: Record<string, number>;
  error_breakdown: Record<string, number>;
}

export interface SessionMetrics {
  session_id: string;
  event_id?: string;
  theme_selected?: string;
  generation_time_ms?: number;
  status: string;
  error_code?: string;
  created_at: Date;
  completed_at?: Date;
}

export class AnalyticsLoggerAgent {
  private pool: Pool;
  private agentName = 'Analytics Logger Agent';

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Log session completion
   */
  async logSessionComplete(
    sessionId: string,
    eventId?: string,
    themeSelected?: ThemeName,
    generationTimeMs?: number
  ): Promise<void> {
    try {
      // Update daily analytics
      await this.updateDailyAnalytics(eventId, true, themeSelected, generationTimeMs);

      console.log(`[${this.agentName}] Session ${sessionId} logged as completed`);
    } catch (error) {
      console.error(`[${this.agentName}] Failed to log session completion:`, error);
    }
  }

  /**
   * Log session failure
   */
  async logSessionFailed(
    sessionId: string,
    eventId?: string,
    errorCode?: string
  ): Promise<void> {
    try {
      // Update daily analytics
      await this.updateDailyAnalytics(eventId, false);

      console.log(`[${this.agentName}] Session ${sessionId} logged as failed: ${errorCode}`);
    } catch (error) {
      console.error(`[${this.agentName}] Failed to log session failure:`, error);
    }
  }

  /**
   * Update daily analytics
   */
  private async updateDailyAnalytics(
    eventId?: string,
    completed: boolean = false,
    themeSelected?: string,
    generationTimeMs?: number
  ): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    try {
      // Get existing record or create new
      const existing = await this.pool.query<PhotoBoothAnalytics>(
        `SELECT * FROM photo_booth_analytics
         WHERE (event_id = $1 OR ($1 IS NULL AND event_id IS NULL))
         AND date = $2`,
        [eventId || null, today]
      );

      if (existing.rows.length > 0) {
        // Update existing
        const record = existing.rows[0];
        const newTotal = record.total_sessions + 1;
        const newCompleted = completed ? record.completed_count + 1 : record.completed_count;
        const newFailed = completed ? record.failed_count : record.failed_count + 1;

        // Update theme distribution
        let themeDistribution = record.theme_distribution_json || {};
        if (themeSelected && completed) {
          themeDistribution[themeSelected] = (themeDistribution[themeSelected] || 0) + 1;
        }

        // Update average generation time
        let newAvgTime = record.avg_generation_time_ms;
        if (generationTimeMs && completed) {
          const totalTime =
            (record.avg_generation_time_ms || 0) * record.completed_count + generationTimeMs;
          newAvgTime = Math.round(totalTime / newCompleted);
        }

        await this.pool.query(
          `UPDATE photo_booth_analytics
           SET total_sessions = $1,
               completed_count = $2,
               failed_count = $3,
               avg_generation_time_ms = $4,
               theme_distribution_json = $5,
               updated_at = NOW()
           WHERE id = $6`,
          [newTotal, newCompleted, newFailed, newAvgTime, JSON.stringify(themeDistribution), record.id]
        );
      } else {
        // Create new record
        const themeDistribution = themeSelected && completed ? { [themeSelected]: 1 } : {};

        await this.pool.query(
          `INSERT INTO photo_booth_analytics
           (event_id, date, total_sessions, completed_count, failed_count, avg_generation_time_ms, theme_distribution_json)
           VALUES ($1, $2, 1, $3, $4, $5, $6)`,
          [
            eventId || null,
            today,
            completed ? 1 : 0,
            completed ? 0 : 1,
            generationTimeMs || null,
            JSON.stringify(themeDistribution),
          ]
        );
      }
    } catch (error) {
      console.error(`[${this.agentName}] Failed to update daily analytics:`, error);
    }
  }

  /**
   * Get analytics summary for an event
   */
  async getEventAnalytics(eventId?: string, days: number = 7): Promise<AnalyticsSummary[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const result = await this.pool.query<PhotoBoothAnalytics>(
        `SELECT * FROM photo_booth_analytics
         WHERE (event_id = $1 OR ($1 IS NULL AND event_id IS NULL))
         AND date >= $2
         ORDER BY date DESC`,
        [eventId || null, startDate.toISOString().split('T')[0]]
      );

      return result.rows.map((row) => ({
        event_id: row.event_id,
        date: row.date.toISOString().split('T')[0],
        total_sessions: row.total_sessions,
        completed_count: row.completed_count,
        failed_count: row.failed_count,
        completion_rate:
          row.total_sessions > 0
            ? Math.round((row.completed_count / row.total_sessions) * 100)
            : 0,
        avg_generation_time_ms: row.avg_generation_time_ms || 0,
        theme_distribution: row.theme_distribution_json || {},
        error_breakdown: {}, // Would need to query error table
      }));
    } catch (error) {
      throw formatError({
        code: ErrorCode.FB_DB_001,
        agentName: this.agentName,
        customMessage: `Failed to get analytics: ${(error as Error).message}`,
      });
    }
  }

  /**
   * Get aggregated analytics summary
   */
  async getAggregatedAnalytics(eventId?: string, days: number = 7): Promise<AnalyticsSummary> {
    const dailyStats = await this.getEventAnalytics(eventId, days);

    const aggregated: AnalyticsSummary = {
      event_id: eventId,
      date: `Last ${days} days`,
      total_sessions: 0,
      completed_count: 0,
      failed_count: 0,
      completion_rate: 0,
      avg_generation_time_ms: 0,
      theme_distribution: {},
      error_breakdown: {},
    };

    let totalGenerationTime = 0;
    let sessionCount = 0;

    for (const day of dailyStats) {
      aggregated.total_sessions += day.total_sessions;
      aggregated.completed_count += day.completed_count;
      aggregated.failed_count += day.failed_count;

      if (day.avg_generation_time_ms > 0) {
        totalGenerationTime += day.avg_generation_time_ms * day.completed_count;
        sessionCount += day.completed_count;
      }

      // Merge theme distribution
      for (const [theme, count] of Object.entries(day.theme_distribution)) {
        aggregated.theme_distribution[theme] =
          (aggregated.theme_distribution[theme] || 0) + (count as number);
      }
    }

    aggregated.completion_rate =
      aggregated.total_sessions > 0
        ? Math.round((aggregated.completed_count / aggregated.total_sessions) * 100)
        : 0;

    aggregated.avg_generation_time_ms =
      sessionCount > 0 ? Math.round(totalGenerationTime / sessionCount) : 0;

    return aggregated;
  }

  /**
   * Get error statistics
   */
  async getErrorStatistics(eventId?: string, days: number = 7): Promise<Record<string, number>> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const result = await this.pool.query<{ error_code: string; count: string }>(
        `SELECT error_code, COUNT(*) as count
         FROM photo_booth_errors e
         LEFT JOIN photo_booth_sessions s ON e.session_id = s.session_id
         WHERE ($1 IS NULL OR s.event_id = $1)
         AND e.created_at >= $2
         GROUP BY error_code
         ORDER BY count DESC`,
        [eventId || null, startDate]
      );

      const errorStats: Record<string, number> = {};
      for (const row of result.rows) {
        errorStats[row.error_code] = parseInt(row.count, 10);
      }

      return errorStats;
    } catch (error) {
      console.error(`[${this.agentName}] Failed to get error statistics:`, error);
      return {};
    }
  }

  /**
   * Get popular themes
   */
  async getPopularThemes(eventId?: string, days: number = 7): Promise<Array<{ theme: string; count: number }>> {
    const analytics = await this.getAggregatedAnalytics(eventId, days);

    return Object.entries(analytics.theme_distribution)
      .map(([theme, count]) => ({ theme, count: count as number }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get sessions for an event (with pagination)
   */
  async getEventSessions(
    eventId?: string,
    options: { limit?: number; offset?: number; status?: string } = {}
  ): Promise<SessionMetrics[]> {
    const { limit = 50, offset = 0, status } = options;

    try {
      let query = `
        SELECT
          session_id,
          event_id,
          theme_selected,
          status,
          error_code,
          created_at,
          completed_at
        FROM photo_booth_sessions
        WHERE ($1 IS NULL OR event_id = $1)
      `;

      const params: unknown[] = [eventId || null];

      if (status) {
        query += ` AND status = $${params.length + 1}`;
        params.push(status);
      }

      query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await this.pool.query(query, params);

      // Get generation times for completed sessions
      const sessions: SessionMetrics[] = [];

      for (const row of result.rows) {
        let generationTimeMs: number | undefined;

        if (row.status === 'completed') {
          const imageResult = await this.pool.query(
            `SELECT generation_time_ms FROM photo_booth_images
             WHERE session_id = $1 AND image_type = 'styled'
             ORDER BY created_at DESC LIMIT 1`,
            [row.session_id]
          );

          if (imageResult.rows.length > 0) {
            generationTimeMs = imageResult.rows[0].generation_time_ms;
          }
        }

        sessions.push({
          session_id: row.session_id,
          event_id: row.event_id,
          theme_selected: row.theme_selected,
          generation_time_ms: generationTimeMs,
          status: row.status,
          error_code: row.error_code,
          created_at: row.created_at,
          completed_at: row.completed_at,
        });
      }

      return sessions;
    } catch (error) {
      throw formatError({
        code: ErrorCode.FB_DB_001,
        agentName: this.agentName,
        customMessage: `Failed to get sessions: ${(error as Error).message}`,
      });
    }
  }
}
