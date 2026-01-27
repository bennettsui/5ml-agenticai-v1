// Photo Booth Error Formatter
// Standardized error responses for the Photo Booth API

import { ErrorCode, PhotoBoothErrorResponse } from '../types';

// Error definitions with suggestions
const errorDefinitions: Record<ErrorCode, { message: string; suggestion: string; recoveryAction?: string }> = {
  // Upload errors
  [ErrorCode.FB_UPLOAD_001]: {
    message: 'File too large or invalid format',
    suggestion: 'Please upload a JPEG, PNG, or WebP image under 10MB',
    recoveryAction: 'RETRY_UPLOAD',
  },
  [ErrorCode.FB_UPLOAD_002]: {
    message: 'Upload failed',
    suggestion: 'Please try uploading the image again',
    recoveryAction: 'RETRY_UPLOAD',
  },

  // Face detection errors
  [ErrorCode.FB_FACE_001]: {
    message: 'No faces detected in image',
    suggestion: 'Ensure your face is clearly visible with good lighting and frontal angle',
    recoveryAction: 'RETRY_UPLOAD',
  },
  [ErrorCode.FB_FACE_002]: {
    message: 'Multiple faces detected',
    suggestion: 'Phase 1 supports single-person photos only. Please upload a photo with one person',
    recoveryAction: 'RETRY_UPLOAD',
  },
  [ErrorCode.FB_FACE_003]: {
    message: 'Face is too small in the image',
    suggestion: 'Please take a closer photo or crop the image to focus on your face',
    recoveryAction: 'RETRY_UPLOAD',
  },

  // Lighting errors
  [ErrorCode.FB_LIGHT_001]: {
    message: 'Poor lighting detected',
    suggestion: 'Please ensure better lighting - avoid shadows and backlighting',
    recoveryAction: 'RETRY_UPLOAD',
  },

  // Theme errors
  [ErrorCode.FB_THEME_001]: {
    message: 'Theme not found',
    suggestion: 'Please select a valid theme from the available options',
    recoveryAction: 'SELECT_THEME',
  },

  // Generation errors
  [ErrorCode.FB_GENAI_001]: {
    message: 'Image generation timed out',
    suggestion: 'The AI took too long to generate. Please try again',
    recoveryAction: 'RETRY_GENERATE',
  },
  [ErrorCode.FB_GENAI_002]: {
    message: 'Image generation service unavailable',
    suggestion: 'Our AI service is temporarily unavailable. Please try again in a moment',
    recoveryAction: 'RETRY_GENERATE',
  },
  [ErrorCode.FB_GENAI_003]: {
    message: 'AI service out of resources',
    suggestion: 'Our AI service is currently busy. Please try again in a moment',
    recoveryAction: 'RETRY_GENERATE',
  },
  [ErrorCode.FB_GENAI_004]: {
    message: 'Image prompt was flagged by safety filter',
    suggestion: 'Please try a different pose or expression',
    recoveryAction: 'RETRY_UPLOAD',
  },

  // Branding errors
  [ErrorCode.FB_BRAND_001]: {
    message: 'Branding logo not found',
    suggestion: 'System configuration error. Please contact support',
    recoveryAction: 'CONTACT_SUPPORT',
  },
  [ErrorCode.FB_BRAND_002]: {
    message: 'Failed to apply branding overlay',
    suggestion: 'Please try again. If the issue persists, contact support',
    recoveryAction: 'RETRY_FINALIZE',
  },

  // QR errors
  [ErrorCode.FB_QR_001]: {
    message: 'Failed to generate QR code',
    suggestion: 'Please try again',
    recoveryAction: 'RETRY_FINALIZE',
  },

  // Database errors
  [ErrorCode.FB_DB_001]: {
    message: 'Database connection lost',
    suggestion: 'Temporary system issue. Please try again',
    recoveryAction: 'RETRY',
  },
  [ErrorCode.FB_DB_002]: {
    message: 'Session not found',
    suggestion: 'Your session may have expired. Please start a new session',
    recoveryAction: 'NEW_SESSION',
  },

  // Session errors
  [ErrorCode.FB_SESSION_001]: {
    message: 'Session expired',
    suggestion: 'Your session has expired. Please start a new session',
    recoveryAction: 'NEW_SESSION',
  },
  [ErrorCode.FB_SESSION_002]: {
    message: 'Invalid session state',
    suggestion: 'Please follow the correct flow: upload → analyze → generate → finalize',
    recoveryAction: 'CHECK_STATUS',
  },
};

export interface FormatErrorOptions {
  code: ErrorCode;
  agentName: string;
  sessionId?: string;
  imageId?: string;
  inputParams?: Record<string, unknown>;
  customMessage?: string;
  stackTrace?: string;
}

export function formatError(options: FormatErrorOptions): PhotoBoothErrorResponse {
  const { code, agentName, sessionId, imageId, inputParams, customMessage, stackTrace } = options;

  const definition = errorDefinitions[code] || {
    message: 'Unknown error occurred',
    suggestion: 'Please try again or contact support',
  };

  const response: PhotoBoothErrorResponse = {
    error: code,
    code,
    message: customMessage || definition.message,
    details: {
      agent: agentName,
      session_id: sessionId,
      image_id: imageId,
      input_params: inputParams,
      timestamp: new Date().toISOString(),
      suggestion: definition.suggestion,
    },
    recovery_action: definition.recoveryAction,
  };

  // Log error for debugging (in production, this would go to a logging service)
  console.error(`[PhotoBooth Error] ${code}:`, {
    ...response,
    stack_trace: stackTrace,
  });

  return response;
}

export function isPhotoBoothError(error: unknown): error is PhotoBoothErrorResponse {
  return (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    'code' in error &&
    'message' in error &&
    'details' in error
  );
}

export function createErrorFromException(
  exception: Error,
  agentName: string,
  sessionId?: string
): PhotoBoothErrorResponse {
  // Map common exceptions to error codes
  let code = ErrorCode.FB_DB_001;

  if (exception.message.includes('timeout') || exception.message.includes('ETIMEDOUT')) {
    code = ErrorCode.FB_GENAI_001;
  } else if (exception.message.includes('ECONNREFUSED') || exception.message.includes('unreachable')) {
    code = ErrorCode.FB_GENAI_002;
  } else if (exception.message.includes('ENOMEM') || exception.message.includes('out of memory')) {
    code = ErrorCode.FB_GENAI_003;
  }

  return formatError({
    code,
    agentName,
    sessionId,
    customMessage: exception.message,
    stackTrace: exception.stack,
  });
}
