/**
 * Suno API Client - Facade
 * 
 * Main entry point for the Suno API. This is a facade that orchestrates
 * the various services (Auth, Generation, CAPTCHA, HTTP).
 * 
 * Features:
 * - TLS fingerprinting bypass (JA3/JA4)
 * - Proxy support
 * - Fingerprint rotation
 * - Smart Clerk token management
 * - CAPTCHA solving with 2captcha
 */

import pino from 'pino';
import { HttpClient, getHttpClient, HttpClientConfig } from '../http';
import { AuthService, createAuthService } from './AuthService';
import { CaptchaService, createCaptchaService, CaptchaServiceConfig } from './CaptchaService';
import { GenerationService, createGenerationService, DEFAULT_MODEL } from './GenerationService';
import {
  AudioInfo,
  GenerationOptions,
  CustomGenerationOptions,
  ExtendAudioOptions,
  LyricsResponse,
  AlignedWord,
  PersonaResponse,
  CreditsInfo,
  ProxyConfig,
} from './types';

const logger = pino();

// =============================================================================
// INSTANCE CACHING
// =============================================================================

const globalForSunoApi = global as unknown as { 
  sunoApiCache?: Map<string, Promise<SunoApi>>;
};
const cache = globalForSunoApi.sunoApiCache || new Map<string, Promise<SunoApi>>();
globalForSunoApi.sunoApiCache = cache;

// =============================================================================
// CONFIGURATION
// =============================================================================

export interface SunoApiConfig {
  /** Cookie string from Suno session */
  cookie?: string;
  /** Proxy configuration */
  proxy?: ProxyConfig;
  /** Enable fingerprint rotation */
  rotateFingerprints?: boolean;
  /** Fingerprint rotation strategy */
  rotationStrategy?: HttpClientConfig['rotationStrategy'];
  /** Preferred platform for fingerprints */
  preferredPlatform?: 'android' | 'ios';
  /** CAPTCHA service configuration */
  captcha?: CaptchaServiceConfig;
}

// =============================================================================
// SUNO API CLIENT
// =============================================================================

/**
 * Suno API Client
 * 
 * Main facade for all Suno operations.
 */
export class SunoApi {
  private httpClient!: HttpClient;
  private authService!: AuthService;
  private captchaService!: CaptchaService;
  private generationService!: GenerationService;
  private config: SunoApiConfig;

  constructor(config: SunoApiConfig = {}) {
    this.config = config;
  }

  /**
   * Initialize the API client
   */
  public async init(): Promise<SunoApi> {
    const cookie = this.resolveCookie();
    
    // Initialize HTTP client with proxy and fingerprint settings
    this.httpClient = await getHttpClient({
      proxy: this.config.proxy,
      rotateFingerprints: this.config.rotateFingerprints,
      rotationStrategy: this.config.rotationStrategy,
      preferredPlatform: this.config.preferredPlatform,
    });

    // Initialize auth service
    this.authService = await createAuthService(cookie);

    // Initialize CAPTCHA service
    this.captchaService = createCaptchaService(
      this.httpClient,
      this.authService,
      this.config.captcha
    );

    // Initialize generation service
    this.generationService = createGenerationService(
      this.httpClient,
      this.authService,
      this.captchaService
    );

    logger.info('SunoApi initialized successfully');
    return this;
  }

  /**
   * Resolve cookie from config or environment
   */
  private resolveCookie(): string {
    const cookie = this.config.cookie && this.config.cookie.includes('__client')
      ? this.config.cookie
      : process.env.SUNO_COOKIE;

    if (!cookie) {
      throw new Error('Please provide a cookie either in the config or in the .env file');
    }

    return cookie;
  }

  // ==========================================================================
  // PROXY MANAGEMENT
  // ==========================================================================

  /**
   * Set proxy for requests
   */
  public setProxy(proxy: ProxyConfig | undefined): void {
    this.httpClient.setProxy(proxy);
  }

  /**
   * Get current proxy
   */
  public getProxy(): ProxyConfig | undefined {
    return this.httpClient.getProxy();
  }

  // ==========================================================================
  // FINGERPRINT MANAGEMENT
  // ==========================================================================

  /**
   * Enable/disable fingerprint rotation
   */
  public setFingerprintRotation(enabled: boolean): void {
    this.httpClient.setFingerprintRotation(enabled);
  }

  /**
   * Force rotate to next fingerprint
   */
  public rotateFingerprint(): void {
    this.httpClient.rotateFingerprint();
  }

  /**
   * Get current fingerprint profile name
   */
  public getCurrentFingerprintProfile(): string {
    return this.httpClient.getCurrentProfile().name;
  }

  // ==========================================================================
  // SESSION MANAGEMENT
  // ==========================================================================

  /**
   * Keep session alive
   */
  public async keepAlive(force: boolean = false): Promise<void> {
    await this.authService.keepAlive(force);
  }

  /**
   * Get token expiration time
   */
  public getTokenExpiration(): Date | null {
    return this.authService.getTokenExpiration();
  }

  /**
   * Check if token is valid
   */
  public isTokenValid(): boolean {
    return this.authService.isTokenValid();
  }

  // ==========================================================================
  // CAPTCHA
  // ==========================================================================

  /**
   * Solve CAPTCHA (returns token)
   */
  public async getCaptcha(): Promise<string | null> {
    return this.captchaService.getToken();
  }

  /**
   * Check if CAPTCHA is required
   */
  public async isCaptchaRequired(): Promise<boolean> {
    return this.captchaService.isRequired();
  }

  // ==========================================================================
  // MUSIC GENERATION
  // ==========================================================================

  /**
   * Generate music from a prompt
   */
  public async generate(
    prompt: string,
    make_instrumental: boolean = false,
    model?: string,
    wait_audio: boolean = false
  ): Promise<AudioInfo[]> {
    return this.generationService.generate({
      prompt,
      make_instrumental,
      model,
      wait_audio,
    });
  }

  /**
   * Generate music with custom parameters
   */
  public async custom_generate(
    prompt: string,
    tags: string,
    title: string,
    make_instrumental: boolean = false,
    model?: string,
    wait_audio: boolean = false,
    negative_tags?: string
  ): Promise<AudioInfo[]> {
    return this.generationService.customGenerate({
      prompt,
      tags,
      title,
      make_instrumental,
      model,
      wait_audio,
      negative_tags,
    });
  }

  /**
   * Concatenate clips into full song
   */
  public async concatenate(clip_id: string): Promise<AudioInfo> {
    return this.generationService.concatenate(clip_id);
  }

  /**
   * Extend an existing audio clip
   */
  public async extendAudio(
    audioId: string,
    prompt: string = '',
    continueAt: number,
    tags: string = '',
    negative_tags: string = '',
    title: string = '',
    model?: string,
    wait_audio?: boolean
  ): Promise<AudioInfo[]> {
    return this.generationService.extendAudio({
      audioId,
      prompt,
      continueAt,
      tags,
      negative_tags,
      title,
      model,
      wait_audio,
    });
  }

  /**
   * Generate stems for a song
   */
  public async generateStems(song_id: string): Promise<AudioInfo[]> {
    return this.generationService.generateStems(song_id);
  }

  // ==========================================================================
  // LYRICS
  // ==========================================================================

  /**
   * Generate lyrics from prompt
   */
  public async generateLyrics(prompt: string): Promise<LyricsResponse> {
    return this.generationService.generateLyrics(prompt);
  }

  /**
   * Get lyric alignment for a song
   */
  public async getLyricAlignment(song_id: string): Promise<AlignedWord[]> {
    return this.generationService.getLyricAlignment(song_id);
  }

  // ==========================================================================
  // AUDIO RETRIEVAL
  // ==========================================================================

  /**
   * Get audio information
   */
  public async get(songIds?: string[], page?: string | null): Promise<AudioInfo[]> {
    return this.generationService.get(songIds, page);
  }

  /**
   * Get specific clip information
   */
  public async getClip(clipId: string): Promise<object> {
    return this.generationService.getClip(clipId);
  }

  // ==========================================================================
  // CREDITS & BILLING
  // ==========================================================================

  /**
   * Get credits/billing information
   */
  public async get_credits(): Promise<CreditsInfo> {
    return this.generationService.getCredits();
  }

  // ==========================================================================
  // PERSONA
  // ==========================================================================

  /**
   * Get persona information (paginated)
   */
  public async getPersonaPaginated(personaId: string, page: number = 1): Promise<PersonaResponse> {
    return this.generationService.getPersonaPaginated(personaId, page);
  }

  // ==========================================================================
  // SERVICE ACCESS
  // ==========================================================================

  /**
   * Get the HTTP client (for advanced usage)
   */
  public getHttpClient(): HttpClient {
    return this.httpClient;
  }

  /**
   * Get the auth service (for advanced usage)
   */
  public getAuthService(): AuthService {
    return this.authService;
  }

  /**
   * Get the generation service (for advanced usage)
   */
  public getGenerationService(): GenerationService {
    return this.generationService;
  }

  /**
   * Get the CAPTCHA service (for advanced usage)
   */
  public getCaptchaService(): CaptchaService {
    return this.captchaService;
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Get or create SunoApi instance
 * Uses async cache to prevent race conditions during initialization
 */
export const sunoApi = async (
  cookieOrConfig?: string | SunoApiConfig
): Promise<SunoApi> => {
  // Normalize config
  const config: SunoApiConfig = typeof cookieOrConfig === 'string'
    ? { cookie: cookieOrConfig }
    : cookieOrConfig || {};

  const resolvedCookie = config.cookie && config.cookie.includes('__client')
    ? config.cookie
    : process.env.SUNO_COOKIE;

  if (!resolvedCookie) {
    logger.info('No cookie provided! Aborting...');
    throw new Error('Please provide a cookie either in the .env file or in the Cookie header of your request.');
  }

  // Create cache key from cookie and proxy
  const cacheKey = `${resolvedCookie}:${config.proxy?.url || 'no-proxy'}`;

  // Check if already in cache
  const cachedPromise = cache.get(cacheKey);
  if (cachedPromise) {
    return cachedPromise;
  }

  // Create initialization promise
  const initPromise = new SunoApi({ ...config, cookie: resolvedCookie }).init();
  
  // Cache the promise immediately
  cache.set(cacheKey, initPromise);

  try {
    const instance = await initPromise;
    return instance;
  } catch (error) {
    // Remove from cache on error
    cache.delete(cacheKey);
    throw error;
  }
};

/**
 * Clear the SunoApi cache
 */
export function clearSunoApiCache(): void {
  cache.clear();
}

// =============================================================================
// EXPORTS
// =============================================================================

export { DEFAULT_MODEL };
