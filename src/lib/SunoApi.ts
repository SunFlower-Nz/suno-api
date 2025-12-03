/**
 * Suno API Client - Compatibility Layer
 * 
 * This file re-exports from the new modular structure for backward compatibility.
 * The actual implementation is now in src/lib/suno/
 * 
 * New structure:
 * - src/lib/suno/types.ts - Type definitions
 * - src/lib/suno/AuthService.ts - Authentication
 * - src/lib/suno/CaptchaService.ts - CAPTCHA solving
 * - src/lib/suno/GenerationService.ts - Music generation
 * - src/lib/suno/SunoApi.ts - Main facade
 * - src/lib/http/HttpClient.ts - HTTP with TLS fingerprinting + proxy
 * - src/lib/fingerprints/index.ts - Fingerprint rotation
 */

// Re-export everything from the new structure
export type {
  // Types
  AudioInfo,
  PersonaResponse,
  CreditsInfo,
  ProxyConfig,
} from './suno';

export {
  // Error class
  SunoApiError,
  
  // Services
  AuthService,
  CaptchaService,
  GenerationService,
  
  // Main API
  SunoApi,
  sunoApi,
  clearSunoApiCache,
  DEFAULT_MODEL,
} from './suno';

export type { SunoApiConfig } from './suno';
