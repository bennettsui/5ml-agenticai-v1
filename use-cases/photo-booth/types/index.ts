// Photo Booth TypeScript Types

// Session Status
export type SessionStatus = 'created' | 'analyzing' | 'generating' | 'branding' | 'completed' | 'failed';

// Image Types
export type ImageType = 'original' | 'styled' | 'branded';

// Theme Names
export type ThemeName =
  | 'versailles-court'
  | 'georgian-england'
  | 'austro-hungarian'
  | 'russian-imperial'
  | 'italian-venetian'
  | 'spanish-colonial';

// Event
export interface PhotoBoothEvent {
  id: number;
  event_id: string;
  name: string;
  brand_name?: string;
  logo_path?: string;
  hashtag?: string;
  metadata_json: Record<string, unknown>;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Session
export interface PhotoBoothSession {
  id: number;
  session_id: string;
  event_id?: string;
  user_consent: boolean;
  language: string;
  theme_selected?: string;
  analysis_json?: AnalysisResult;
  status: SessionStatus;
  error_code?: string;
  error_message?: string;
  created_at: Date;
  completed_at?: Date;
  updated_at: Date;
}

// Image
export interface PhotoBoothImage {
  id: number;
  image_id: string;
  session_id: string;
  image_type: ImageType;
  image_path: string;
  image_hash?: string;
  theme?: string;
  comfyui_prompt?: string;
  generation_time_ms?: number;
  quality_check_json?: QualityCheckResult;
  metadata_json: Record<string, unknown>;
  created_at: Date;
}

// Error
export interface PhotoBoothError {
  id: number;
  error_id: string;
  session_id?: string;
  error_code: string;
  error_message: string;
  agent_name?: string;
  input_params?: Record<string, unknown>;
  stack_trace?: string;
  recovery_action?: string;
  created_at: Date;
}

// QR Code
export interface PhotoBoothQRCode {
  id: number;
  qr_id: string;
  session_id: string;
  image_id: string;
  qr_code_path?: string;
  short_link?: string;
  download_link?: string;
  share_link?: string;
  scan_count: number;
  created_at: Date;
}

// Analytics
export interface PhotoBoothAnalytics {
  id: number;
  event_id: string;
  date: Date;
  total_sessions: number;
  completed_count: number;
  failed_count: number;
  avg_generation_time_ms?: number;
  theme_distribution_json: Record<string, number>;
  created_at: Date;
  updated_at: Date;
}

// Theme Configuration
export interface Theme {
  id: ThemeName;
  name: string;
  country: string;
  description: string;
  era: string;
  image_url: string;
  prompt_keywords: string[];
  negative_keywords: string[];
  environment_description: string;
  costume_description: string;
}

// Quality Check Result
export interface QualityCheckResult {
  is_valid: boolean;
  face_detected: boolean;
  face_count: number;
  face_confidence: number;
  face_position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  lighting_quality: 'good' | 'moderate' | 'poor';
  lighting_score: number;
  composition_score: number;
  resolution_ok: boolean;
  warnings: string[];
  suggestions: string[];
}

// Analysis Result
export interface AnalysisResult {
  face_analysis: {
    detected: boolean;
    count: number;
    confidence: number;
    expression?: string;
    age_range?: string;
    gender_guess?: string;
  };
  environment_analysis: {
    scene_type: string;
    lighting: string;
    background_complexity: string;
    colors_dominant: string[];
  };
  style_compatibility: {
    recommended_themes: ThemeName[];
    compatibility_scores: Record<ThemeName, number>;
    reasoning: string;
  };
  generated_prompt?: string;
}

// ComfyUI Workflow
export interface ComfyUIWorkflow {
  nodes: Record<string, ComfyUINode>;
  connections: ComfyUIConnection[];
}

export interface ComfyUINode {
  inputs: Record<string, unknown>;
  class_type: string;
}

export interface ComfyUIConnection {
  from_node: string;
  from_output: number;
  to_node: string;
  to_input: string;
}

// ComfyUI API Response
export interface ComfyUIPromptResponse {
  prompt_id: string;
  number: number;
  node_errors: Record<string, string[]>;
}

export interface ComfyUIHistoryResponse {
  [prompt_id: string]: {
    prompt: unknown[];
    outputs: Record<string, {
      images: Array<{
        filename: string;
        subfolder: string;
        type: string;
      }>;
    }>;
    status: {
      status_str: string;
      completed: boolean;
      messages: unknown[];
    };
  };
}

// API Request/Response Types
export interface CreateSessionRequest {
  event_id?: string;
  language?: string;
  consent_agreed: boolean;
}

export interface CreateSessionResponse {
  success: boolean;
  session_id: string;
  created_at: string;
}

export interface UploadImageRequest {
  session_id: string;
  // File is sent as multipart/form-data
}

export interface UploadImageResponse {
  success: boolean;
  image_id: string;
  quality_check: QualityCheckResult;
}

export interface AnalyzeRequest {
  session_id: string;
}

// SSE Event Types
export interface SSEProgressEvent {
  type: 'progress';
  step: string;
  message: string;
  percentage?: number;
  timestamp: string;
}

export interface SSECompleteEvent {
  type: 'complete';
  analysis: AnalysisResult;
  timestamp: string;
}

export interface SSEErrorEvent {
  type: 'error';
  error: PhotoBoothErrorResponse;
  timestamp: string;
}

export type SSEEvent = SSEProgressEvent | SSECompleteEvent | SSEErrorEvent;

export interface GenerateRequest {
  session_id: string;
  theme_name: ThemeName;
}

export interface GenerateResponse {
  success: boolean;
  image_id: string;
  generated_image_url: string;
  generation_time_ms: number;
}

export interface FinalizeRequest {
  session_id: string;
  image_id: string;
}

export interface FinalizeResponse {
  success: boolean;
  qr_code_url: string;
  download_link: string;
  share_link: string;
  branded_image_url: string;
}

// Error Response
export interface PhotoBoothErrorResponse {
  error: string;
  code: string;
  message: string;
  details: {
    agent: string;
    session_id?: string;
    image_id?: string;
    input_params?: Record<string, unknown>;
    timestamp: string;
    suggestion?: string;
  };
  recovery_action?: string;
}

// Error Codes
export enum ErrorCode {
  // Upload errors
  FB_UPLOAD_001 = 'FB_UPLOAD_001', // File too large / invalid format
  FB_UPLOAD_002 = 'FB_UPLOAD_002', // Upload failed

  // Face detection errors
  FB_FACE_001 = 'FB_FACE_001', // No faces detected
  FB_FACE_002 = 'FB_FACE_002', // Multiple faces (Phase 1 constraint)
  FB_FACE_003 = 'FB_FACE_003', // Face too small

  // Lighting errors
  FB_LIGHT_001 = 'FB_LIGHT_001', // Poor lighting detected

  // Theme errors
  FB_THEME_001 = 'FB_THEME_001', // Theme not found

  // Generation errors
  FB_GENAI_001 = 'FB_GENAI_001', // ComfyUI generation timeout (>5 sec)
  FB_GENAI_002 = 'FB_GENAI_002', // ComfyUI API unreachable
  FB_GENAI_003 = 'FB_GENAI_003', // Out of memory (VRAM)
  FB_GENAI_004 = 'FB_GENAI_004', // Invalid prompt (safety filter)

  // Branding errors
  FB_BRAND_001 = 'FB_BRAND_001', // 5ML logo not found
  FB_BRAND_002 = 'FB_BRAND_002', // Branding overlay failed

  // QR errors
  FB_QR_001 = 'FB_QR_001', // QR code generation failed

  // Database errors
  FB_DB_001 = 'FB_DB_001', // Database connection lost
  FB_DB_002 = 'FB_DB_002', // Session not found

  // Session errors
  FB_SESSION_001 = 'FB_SESSION_001', // Session expired
  FB_SESSION_002 = 'FB_SESSION_002', // Invalid session state
}

// Agent Context
export interface AgentContext {
  session_id: string;
  event_id?: string;
  language: string;
  theme?: ThemeName;
}

// Branding Options
export interface BrandingOptions {
  logo_path: string;
  logo_position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  logo_size_percent: number;
  hashtag?: string;
  hashtag_position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  event_name?: string;
  event_name_position?: 'top-left' | 'top-right';
}
