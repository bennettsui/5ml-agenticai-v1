// QR Code & Delivery Agent
// Generates QR codes, creates short links, and handles image delivery

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import QRCode from 'qrcode';
import { nanoid } from 'nanoid';
import { PhotoBoothQRCode, ErrorCode } from '../types';
import { formatError } from '../lib/errorFormatter';
import { photoBoothConfig } from '../config/photoBooth.config';
import { SessionManagerAgent, StatusUpdate } from './sessionManager';

export interface DeliveryResult {
  qr_id: string;
  qr_code_path: string;
  qr_code_data_url: string;
  short_link: string;
  download_link: string;
  share_link: string;
}

export interface DeliveryOptions {
  sessionId: string;
  imageId: string;
  brandedImagePath: string;
  onProgress?: (update: StatusUpdate) => void;
}

export class QRDeliveryAgent {
  private pool: Pool;
  private sessionManager: SessionManagerAgent;
  private agentName = 'QR & Delivery Agent';

  constructor(pool: Pool, sessionManager: SessionManagerAgent) {
    this.pool = pool;
    this.sessionManager = sessionManager;
  }

  /**
   * Generate QR code and delivery links
   */
  async generateDelivery(options: DeliveryOptions): Promise<DeliveryResult> {
    const { sessionId, imageId, brandedImagePath, onProgress } = options;

    const reportProgress = (message: string, substep?: string, percentage?: number) => {
      const update: StatusUpdate = {
        session_id: sessionId,
        status: 'branding', // Still in branding phase
        current_step: 'qr_delivery',
        substep,
        message,
        progress_percentage: percentage,
        timestamp: new Date(),
      };
      this.sessionManager.trackStatus(update);
      if (onProgress) onProgress(update);
    };

    try {
      reportProgress('📱 Generating QR code...', 'init', 10);

      // Step 1: Generate short link ID
      const shortId = nanoid(8);
      const baseUrl = photoBoothConfig.storage.publicBaseUrl;

      // Step 2: Create links
      reportProgress('🔗 Creating shareable links...', 'create_links', 30);

      const downloadLink = `${baseUrl}/api/photo-booth/download/${shortId}`;
      const shareLink = `${baseUrl}/photo-booth/share/${shortId}`;
      const shortLink = `${baseUrl}/pb/${shortId}`;

      // Step 3: Generate QR code
      reportProgress('📱 Rendering QR code...', 'render_qr', 50);

      const qrCodeDir = photoBoothConfig.storage.qrCodePath;
      if (!fs.existsSync(qrCodeDir)) {
        fs.mkdirSync(qrCodeDir, { recursive: true });
      }

      const qrFilename = `qr_${sessionId}_${shortId}.png`;
      const qrCodePath = path.join(qrCodeDir, qrFilename);

      // Generate QR code to file
      await QRCode.toFile(qrCodePath, shareLink, {
        width: photoBoothConfig.qrCode.size,
        errorCorrectionLevel: photoBoothConfig.qrCode.errorCorrectionLevel,
        margin: photoBoothConfig.qrCode.margin,
        color: {
          dark: photoBoothConfig.qrCode.darkColor,
          light: photoBoothConfig.qrCode.lightColor,
        },
      });

      // Also generate data URL for inline display
      const qrCodeDataUrl = await QRCode.toDataURL(shareLink, {
        width: photoBoothConfig.qrCode.size,
        errorCorrectionLevel: photoBoothConfig.qrCode.errorCorrectionLevel,
        margin: photoBoothConfig.qrCode.margin,
        color: {
          dark: photoBoothConfig.qrCode.darkColor,
          light: photoBoothConfig.qrCode.lightColor,
        },
      });

      reportProgress('✓ QR code generated', 'qr_complete', 70);

      // Step 4: Save to database
      reportProgress('💾 Saving delivery details...', 'save', 85);

      const qrId = await this.saveQRCode(
        sessionId,
        imageId,
        qrCodePath,
        shortLink,
        downloadLink,
        shareLink
      );

      reportProgress('✓ Delivery ready', 'complete', 100);

      console.log(`[${this.agentName}] QR code generated for session ${sessionId}`);

      return {
        qr_id: qrId,
        qr_code_path: qrCodePath,
        qr_code_data_url: qrCodeDataUrl,
        short_link: shortLink,
        download_link: downloadLink,
        share_link: shareLink,
      };
    } catch (error) {
      if ((error as { code?: string }).code?.startsWith('FB_')) {
        await this.sessionManager.logError(
          sessionId,
          (error as { code: string }).code,
          (error as { message: string }).message,
          this.agentName
        );
        throw error;
      }

      const formattedError = formatError({
        code: ErrorCode.FB_QR_001,
        agentName: this.agentName,
        sessionId,
        customMessage: `QR code generation failed: ${(error as Error).message}`,
        stackTrace: (error as Error).stack,
      });

      await this.sessionManager.logError(
        sessionId,
        formattedError.code,
        formattedError.message,
        this.agentName
      );

      throw formattedError;
    }
  }

  /**
   * Save QR code record to database
   */
  private async saveQRCode(
    sessionId: string,
    imageId: string,
    qrCodePath: string,
    shortLink: string,
    downloadLink: string,
    shareLink: string
  ): Promise<string> {
    try {
      const result = await this.pool.query<PhotoBoothQRCode>(
        `INSERT INTO photo_booth_qr_codes
         (session_id, image_id, qr_code_path, short_link, download_link, share_link)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING qr_id`,
        [sessionId, imageId, qrCodePath, shortLink, downloadLink, shareLink]
      );

      return result.rows[0].qr_id;
    } catch (error) {
      throw formatError({
        code: ErrorCode.FB_DB_001,
        agentName: this.agentName,
        sessionId,
        customMessage: `Failed to save QR code: ${(error as Error).message}`,
      });
    }
  }

  /**
   * Get QR code by short link ID
   */
  async getByShortLink(shortId: string): Promise<PhotoBoothQRCode | null> {
    try {
      const shortLink = `${photoBoothConfig.storage.publicBaseUrl}/pb/${shortId}`;

      const result = await this.pool.query<PhotoBoothQRCode>(
        `SELECT * FROM photo_booth_qr_codes WHERE short_link = $1`,
        [shortLink]
      );

      return result.rows[0] || null;
    } catch (error) {
      throw formatError({
        code: ErrorCode.FB_DB_001,
        agentName: this.agentName,
        customMessage: `Failed to get QR code: ${(error as Error).message}`,
      });
    }
  }

  /**
   * Get QR code by session ID
   */
  async getBySessionId(sessionId: string): Promise<PhotoBoothQRCode | null> {
    try {
      const result = await this.pool.query<PhotoBoothQRCode>(
        `SELECT * FROM photo_booth_qr_codes
         WHERE session_id = $1
         ORDER BY created_at DESC LIMIT 1`,
        [sessionId]
      );

      return result.rows[0] || null;
    } catch (error) {
      throw formatError({
        code: ErrorCode.FB_DB_001,
        agentName: this.agentName,
        sessionId,
        customMessage: `Failed to get QR code: ${(error as Error).message}`,
      });
    }
  }

  /**
   * Increment scan count
   */
  async incrementScanCount(qrId: string): Promise<void> {
    try {
      await this.pool.query(
        `UPDATE photo_booth_qr_codes SET scan_count = scan_count + 1 WHERE qr_id = $1`,
        [qrId]
      );
    } catch (error) {
      console.error(`[${this.agentName}] Failed to increment scan count:`, error);
    }
  }

  /**
   * Generate QR code as data URL only (no file)
   */
  async generateQRCodeDataUrl(content: string): Promise<string> {
    return QRCode.toDataURL(content, {
      width: photoBoothConfig.qrCode.size,
      errorCorrectionLevel: photoBoothConfig.qrCode.errorCorrectionLevel,
      margin: photoBoothConfig.qrCode.margin,
      color: {
        dark: photoBoothConfig.qrCode.darkColor,
        light: photoBoothConfig.qrCode.lightColor,
      },
    });
  }

  /**
   * Validate QR code file exists
   */
  validateQRCodeFile(qrCodePath: string): boolean {
    return fs.existsSync(qrCodePath);
  }
}
