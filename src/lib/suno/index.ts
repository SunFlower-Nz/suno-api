/**
 * Suno Module Index
 * 
 * Main export point for the refactored Suno API
 */

// Types
export type {
  AudioInfo,
  AudioStatus,
  RawClipData,
  GenerationOptions,
  CustomGenerationOptions,
  ExtendAudioOptions,
  GenerationPayload,
  LyricsResponse,
  AlignedWord,
  Persona,
  PersonaResponse,
  CreditsInfo,
  RawBillingInfo,
  TokenInfo,
  SessionState,
  ClerkClientResponse,
  ProxyConfig,
  HttpRequestOptions,
  HttpResponse,
  CaptchaCheckResponse,
  CaptchaSolution,
  ApiError,
} from './types';

export { SunoApiError } from './types';

// Services
export { AuthService, createAuthService, CLERK_BASE_URL, DEFAULT_CLERK_VERSION } from './AuthService';
export { CaptchaService, createCaptchaService, SUNO_BASE_URL } from './CaptchaService';
export type { CaptchaServiceConfig } from './CaptchaService';
export { GenerationService, createGenerationService, DEFAULT_MODEL } from './GenerationService';

// Main API
export { SunoApi, sunoApi, clearSunoApiCache } from './SunoApi';
export type { SunoApiConfig } from './SunoApi';
