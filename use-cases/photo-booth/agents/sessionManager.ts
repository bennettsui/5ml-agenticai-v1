// Session Manager Agent
// Handles creation, reading, updating, and status tracking of photo booth sessions

import { Pool } from 'pg';
import {
  PhotoBoothSession,
  PhotoBoothEvent,
  SessionStatus,
  CreateSessionRequest,
  AnalysisResult,
  ErrorCode,
} from '../types';
import { formatError } from '../lib/errorFormatter';
import { photoBoothConfig } from '../config/photoBooth.config';

// Status tracking types
export interface StatusUpdate {
  session_id: string;
  status: SessionStatus;
  progress_percentage?: number;
  current_step?: string;
  substep?: string;
  message?: string;
  error_code?: string;
  error_message?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export interface SessionProgress {
  session_id: string;
  status: SessionStatus;
  steps_completed: string[];
  current_step: string | null;
  total_duration_ms: number;
  step_durations: Record<string, number>;
  error?: {
    code: string;
    message: string;
    step: string;
  };
}

// In-memory status tracking for real-time updates
const sessionStatusCache = new Map<string, StatusUpdate[]>();

export class SessionManagerAgent {
  private pool: Pool;
  private agentName = 'Session Manager Agent';

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Create a new photo booth session
   */
  async createSession(request: CreateSessionRequest): Promise<PhotoBoothSession> {
    const { event_id, language = 'en', consent_agreed } = request;

    if (!consent_agreed) {
      throw formatError({
        code: ErrorCode.FB_SESSION_002,
        agentName: this.agentName,
        customMessage: 'User consent is required to proceed',
      });
    }

    try {
      // Verify event exists if provided
      if (event_id) {
        const eventResult = await this.pool.query(
          'SELECT event_id FROM photo_booth_events WHERE event_id = $1 AND is_active = true',
          [event_id]
        );

        if (eventResult.rows.length === 0) {
          throw formatError({
            code: ErrorCode.FB_DB_002,
            agentName: this.agentName,
            customMessage: 'Event not found or inactive',
          });
        }
      }

      // Create session
      const result = await this.pool.query<PhotoBoothSession>(
        `INSERT INTO photo_booth_sessions
         (event_id, user_consent, language, status)
         VALUES ($1, $2, $3, 'created')
         RETURNING *`,
        [event_id || null, consent_agreed, language]
      );

      const session = result.rows[0];

      // Initialize status tracking
      this.trackStatus({
        session_id: session.session_id,
        status: 'created',
        current_step: 'session_created',
        message: 'Session initialized successfully',
        timestamp: new Date(),
      });

      console.log(`[${this.agentName}] Created session: ${session.session_id}`);

      return session;
    } catch (error) {
      if ((error as { code?: string }).code?.startsWith('FB_')) {
        throw error;
      }

      throw formatError({
        code: ErrorCode.FB_DB_001,
        agentName: this.agentName,
        customMessage: `Failed to create session: ${(error as Error).message}`,
      });
    }
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<PhotoBoothSession | null> {
    try {
      const result = await this.pool.query<PhotoBoothSession>(
        'SELECT * FROM photo_booth_sessions WHERE session_id = $1',
        [sessionId]
      );

      return result.rows[0] || null;
    } catch (error) {
      throw formatError({
        code: ErrorCode.FB_DB_001,
        agentName: this.agentName,
        sessionId,
        customMessage: `Failed to get session: ${(error as Error).message}`,
      });
    }
  }

  /**
   * Update session status with tracking
   */
  async updateStatus(
    sessionId: string,
    status: SessionStatus,
    additionalData?: {
      theme_selected?: string;
      analysis_json?: AnalysisResult;
      error_code?: string;
      error_message?: string;
    }
  ): Promise<PhotoBoothSession> {
    try {
      const updates: string[] = ['status = $2', 'updated_at = NOW()'];
      const values: unknown[] = [sessionId, status];
      let paramIndex = 3;

      if (status === 'completed') {
        updates.push('completed_at = NOW()');
      }

      if (additionalData?.theme_selected) {
        updates.push(`theme_selected = $${paramIndex++}`);
        values.push(additionalData.theme_selected);
      }

      if (additionalData?.analysis_json) {
        updates.push(`analysis_json = $${paramIndex++}`);
        values.push(JSON.stringify(additionalData.analysis_json));
      }

      if (additionalData?.error_code) {
        updates.push(`error_code = $${paramIndex++}`);
        values.push(additionalData.error_code);
      }

      if (additionalData?.error_message) {
        updates.push(`error_message = $${paramIndex++}`);
        values.push(additionalData.error_message);
      }

      const query = `
        UPDATE photo_booth_sessions
        SET ${updates.join(', ')}
        WHERE session_id = $1
        RETURNING *
      `;

      const result = await this.pool.query<PhotoBoothSession>(query, values);

      if (result.rows.length === 0) {
        throw formatError({
          code: ErrorCode.FB_DB_002,
          agentName: this.agentName,
          sessionId,
        });
      }

      const session = result.rows[0];

      // Track the status update
      this.trackStatus({
        session_id: sessionId,
        status,
        current_step: this.getStepNameForStatus(status),
        message: `Status updated to ${status}`,
        error_code: additionalData?.error_code,
        error_message: additionalData?.error_message,
        timestamp: new Date(),
      });

      console.log(`[${this.agentName}] Session ${sessionId} status: ${status}`);

      return session;
    } catch (error) {
      if ((error as { code?: string }).code?.startsWith('FB_')) {
        throw error;
      }

      throw formatError({
        code: ErrorCode.FB_DB_001,
        agentName: this.agentName,
        sessionId,
        customMessage: `Failed to update session: ${(error as Error).message}`,
      });
    }
  }

  /**
   * Track status update in memory for real-time updates
   */
  trackStatus(update: StatusUpdate): void {
    const updates = sessionStatusCache.get(update.session_id) || [];
    updates.push(update);
    sessionStatusCache.set(update.session_id, updates);

    // Limit cache size per session
    if (updates.length > 100) {
      sessionStatusCache.set(update.session_id, updates.slice(-50));
    }
  }

  /**
   * Get session progress with all status updates
   */
  getSessionProgress(sessionId: string): SessionProgress | null {
    const updates = sessionStatusCache.get(sessionId);
    if (!updates || updates.length === 0) {
      return null;
    }

    const firstUpdate = updates[0];
    const lastUpdate = updates[updates.length - 1];
    const stepsCompleted: string[] = [];
    const stepDurations: Record<string, number> = {};

    let prevTimestamp = firstUpdate.timestamp;
    let prevStep = firstUpdate.current_step;

    for (const update of updates) {
      if (update.current_step && update.current_step !== prevStep) {
        if (prevStep) {
          stepsCompleted.push(prevStep);
          stepDurations[prevStep] = update.timestamp.getTime() - prevTimestamp.getTime();
        }
        prevStep = update.current_step;
        prevTimestamp = update.timestamp;
      }
    }

    return {
      session_id: sessionId,
      status: lastUpdate.status,
      steps_completed: stepsCompleted,
      current_step: lastUpdate.current_step || null,
      total_duration_ms: lastUpdate.timestamp.getTime() - firstUpdate.timestamp.getTime(),
      step_durations: stepDurations,
      error: lastUpdate.error_code
        ? {
            code: lastUpdate.error_code,
            message: lastUpdate.error_message || 'Unknown error',
            step: lastUpdate.current_step || 'unknown',
          }
        : undefined,
    };
  }

  /**
   * Get all status updates for a session
   */
  getStatusUpdates(sessionId: string): StatusUpdate[] {
    return sessionStatusCache.get(sessionId) || [];
  }

  /**
   * Clear status cache for a session
   */
  clearStatusCache(sessionId: string): void {
    sessionStatusCache.delete(sessionId);
  }

  /**
   * Validate session state for a given operation
   */
  async validateSessionState(
    sessionId: string,
    allowedStatuses: SessionStatus[]
  ): Promise<PhotoBoothSession> {
    const session = await this.getSession(sessionId);

    if (!session) {
      throw formatError({
        code: ErrorCode.FB_DB_002,
        agentName: this.agentName,
        sessionId,
      });
    }

    // Check for session expiry
    const sessionAge = Date.now() - new Date(session.created_at).getTime();
    if (sessionAge > photoBoothConfig.session.timeout) {
      await this.updateStatus(sessionId, 'failed', {
        error_code: ErrorCode.FB_SESSION_001,
        error_message: 'Session expired',
      });

      throw formatError({
        code: ErrorCode.FB_SESSION_001,
        agentName: this.agentName,
        sessionId,
      });
    }

    // Check allowed statuses
    if (!allowedStatuses.includes(session.status)) {
      throw formatError({
        code: ErrorCode.FB_SESSION_002,
        agentName: this.agentName,
        sessionId,
        customMessage: `Invalid session state: ${session.status}. Expected: ${allowedStatuses.join(' or ')}`,
      });
    }

    return session;
  }

  /**
   * Get event details
   */
  async getEvent(eventId: string): Promise<PhotoBoothEvent | null> {
    try {
      const result = await this.pool.query<PhotoBoothEvent>(
        'SELECT * FROM photo_booth_events WHERE event_id = $1',
        [eventId]
      );

      return result.rows[0] || null;
    } catch (error) {
      throw formatError({
        code: ErrorCode.FB_DB_001,
        agentName: this.agentName,
        customMessage: `Failed to get event: ${(error as Error).message}`,
      });
    }
  }

  /**
   * Create a new event
   */
  async createEvent(event: Partial<PhotoBoothEvent>): Promise<PhotoBoothEvent> {
    try {
      const result = await this.pool.query<PhotoBoothEvent>(
        `INSERT INTO photo_booth_events
         (name, brand_name, logo_path, hashtag, metadata_json)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          event.name || 'Default Event',
          event.brand_name || '5ML',
          event.logo_path || null,
          event.hashtag || '#5ML',
          JSON.stringify(event.metadata_json || {}),
        ]
      );

      console.log(`[${this.agentName}] Created event: ${result.rows[0].event_id}`);

      return result.rows[0];
    } catch (error) {
      throw formatError({
        code: ErrorCode.FB_DB_001,
        agentName: this.agentName,
        customMessage: `Failed to create event: ${(error as Error).message}`,
      });
    }
  }

  /**
   * Get step name for status (for tracking)
   */
  private getStepNameForStatus(status: SessionStatus): string {
    const stepMap: Record<SessionStatus, string> = {
      created: 'session_created',
      analyzing: 'analyzing_image',
      generating: 'generating_styled_image',
      branding: 'applying_branding',
      completed: 'session_completed',
      failed: 'session_failed',
    };

    return stepMap[status] || 'unknown';
  }

  /**
   * Log session to errors table
   */
  async logError(
    sessionId: string,
    errorCode: string,
    errorMessage: string,
    agentName: string,
    inputParams?: Record<string, unknown>,
    stackTrace?: string
  ): Promise<void> {
    try {
      await this.pool.query(
        `INSERT INTO photo_booth_errors
         (session_id, error_code, error_message, agent_name, input_params, stack_trace, recovery_action)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          sessionId,
          errorCode,
          errorMessage,
          agentName,
          inputParams ? JSON.stringify(inputParams) : null,
          stackTrace || null,
          'RETRY',
        ]
      );
    } catch (error) {
      console.error(`[${this.agentName}] Failed to log error:`, error);
    }
  }
}
