/**
 * Suno API Types
 * 
 * Centralized type definitions for the Suno API client
 */

// =============================================================================
// AUDIO TYPES
// =============================================================================

/**
 * Audio clip information returned by Suno API
 */
export interface AudioInfo {
  id: string;
  title?: string;
  image_url?: string;
  lyric?: string;
  audio_url?: string;
  video_url?: string;
  created_at: string;
  model_name: string;
  gpt_description_prompt?: string;
  prompt?: string;
  status: AudioStatus;
  type?: string;
  tags?: string;
  negative_tags?: string;
  duration?: string;
  error_message?: string;
  stem_from_id?: string;
}

/**
 * Possible audio statuses
 */
export type AudioStatus = 
  | 'submitted'
  | 'queued'
  | 'streaming'
  | 'complete'
  | 'error';

/**
 * Raw clip data from Suno API
 */
export interface RawClipData {
  id: string;
  title?: string;
  image_url?: string;
  audio_url?: string;
  video_url?: string;
  created_at: string;
  model_name: string;
  status: string;
  metadata: {
    prompt?: string;
    gpt_description_prompt?: string;
    type?: string;
    tags?: string;
    negative_tags?: string;
    duration?: string;
    error_message?: string;
    stem_from_id?: string;
  };
}

// =============================================================================
// GENERATION TYPES
// =============================================================================

/**
 * Options for music generation
 */
export interface GenerationOptions {
  /** The prompt for generation */
  prompt: string;
  /** Whether to generate instrumental only */
  make_instrumental?: boolean;
  /** Model to use (default: chirp-v3-5) */
  model?: string;
  /** Wait for audio to complete before returning */
  wait_audio?: boolean;
}

/**
 * Options for custom music generation
 */
export interface CustomGenerationOptions extends GenerationOptions {
  /** Music style tags */
  tags: string;
  /** Song title */
  title: string;
  /** Tags to avoid */
  negative_tags?: string;
}

/**
 * Options for extending audio
 */
export interface ExtendAudioOptions {
  /** ID of the audio to extend */
  audioId: string;
  /** Continue prompt */
  prompt?: string;
  /** Position to continue from (in seconds) */
  continueAt: number;
  /** Style tags */
  tags?: string;
  /** Tags to avoid */
  negative_tags?: string;
  /** Extended song title */
  title?: string;
  /** Model to use */
  model?: string;
  /** Wait for completion */
  wait_audio?: boolean;
}

/**
 * Internal payload for song generation
 */
export interface GenerationPayload {
  make_instrumental?: boolean;
  mv: string;
  prompt: string;
  generation_type: string;
  continue_at?: number;
  continue_clip_id?: string;
  task?: string;
  token?: string | null;
  tags?: string;
  title?: string;
  negative_tags?: string;
  gpt_description_prompt?: string;
}

// =============================================================================
// LYRICS TYPES
// =============================================================================

/**
 * Generated lyrics response
 */
export interface LyricsResponse {
  id: string;
  status: 'pending' | 'complete' | 'error';
  title?: string;
  text?: string;
}

/**
 * Aligned lyrics word
 */
export interface AlignedWord {
  word: string;
  start_s: number;
  end_s: number;
  success: boolean;
  p_align: number;
}

// =============================================================================
// PERSONA TYPES
// =============================================================================

/**
 * Persona information
 */
export interface Persona {
  id: string;
  name: string;
  description: string;
  image_s3_id: string;
  root_clip_id: string;
  clip: any;
  user_display_name: string;
  user_handle: string;
  user_image_url: string;
  persona_clips: Array<{ clip: any }>;
  is_suno_persona: boolean;
  is_trashed: boolean;
  is_owned: boolean;
  is_public: boolean;
  is_public_approved: boolean;
  is_loved: boolean;
  upvote_count: number;
  clip_count: number;
}

/**
 * Paginated persona response
 */
export interface PersonaResponse {
  persona: Persona;
  total_results: number;
  current_page: number;
  is_following: boolean;
}

// =============================================================================
// CREDITS/BILLING TYPES
// =============================================================================

/**
 * Credits/billing information
 */
export interface CreditsInfo {
  credits_left: number;
  period: string;
  monthly_limit: number;
  monthly_usage: number;
}

/**
 * Raw billing response from API
 */
export interface RawBillingInfo {
  total_credits_left: number;
  period: string;
  monthly_limit: number;
  monthly_usage: number;
}

// =============================================================================
// AUTH TYPES
// =============================================================================

/**
 * Token information with expiration tracking
 */
export interface TokenInfo {
  jwt: string;
  expiresAt: number;
}

/**
 * Session state
 */
export interface SessionState {
  sid?: string;
  currentToken?: string;
  tokenInfo?: TokenInfo;
  deviceId: string;
  cookies: Record<string, string | undefined>;
}

/**
 * Clerk client response
 */
export interface ClerkClientResponse {
  response: {
    last_active_session_id: string;
    sessions: Array<{
      id: string;
      status: string;
    }>;
  };
}

// =============================================================================
// HTTP/PROXY TYPES
// =============================================================================

/**
 * Proxy configuration
 */
export interface ProxyConfig {
  /** Proxy URL (http://user:pass@ip:port or socks5://user:pass@ip:port) */
  url: string;
  /** Optional proxy username (if not in URL) */
  username?: string;
  /** Optional proxy password (if not in URL) */
  password?: string;
}

/**
 * HTTP request options
 */
export interface HttpRequestOptions {
  method?: 'get' | 'post' | 'put' | 'delete' | 'patch';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  cookies?: Record<string, string | undefined>;
  token?: string;
  deviceId?: string;
  proxy?: ProxyConfig;
}

/**
 * HTTP response
 */
export interface HttpResponse<T = any> {
  status: number;
  body: T;
  headers: Record<string, string>;
  cookies?: Record<string, string>;
}

// =============================================================================
// CAPTCHA TYPES
// =============================================================================

/**
 * CAPTCHA check response
 */
export interface CaptchaCheckResponse {
  required: boolean;
  type?: 'hcaptcha' | 'turnstile';
}

/**
 * CAPTCHA solution result
 */
export interface CaptchaSolution {
  token: string;
  timestamp: number;
}

// =============================================================================
// ERROR TYPES
// =============================================================================

/**
 * API error response
 */
export interface ApiError {
  detail?: string;
  message?: string;
  error?: string;
  status?: number;
}

/**
 * Custom error class for Suno API
 */
export class SunoApiError extends Error {
  public readonly status?: number;
  public readonly detail?: string;
  public readonly isAuthError: boolean;
  public readonly isCaptchaRequired: boolean;
  public readonly isRateLimited: boolean;

  constructor(
    message: string,
    options: {
      status?: number;
      detail?: string;
      isAuthError?: boolean;
      isCaptchaRequired?: boolean;
      isRateLimited?: boolean;
    } = {}
  ) {
    super(message);
    this.name = 'SunoApiError';
    this.status = options.status;
    this.detail = options.detail;
    this.isAuthError = options.isAuthError ?? false;
    this.isCaptchaRequired = options.isCaptchaRequired ?? false;
    this.isRateLimited = options.isRateLimited ?? false;
  }
}
