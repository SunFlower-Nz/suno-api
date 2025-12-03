/**
 * HTTP Client with TLS Fingerprinting and Proxy Support
 * 
 * Features:
 * - TLS fingerprinting bypass (JA3/JA4) using CycleTLS
 * - Proxy support (HTTP, SOCKS5)
 * - Fingerprint rotation
 * - Cloudflare protection bypass with automatic retry
 */

import initCycleTLS, { CycleTLSClient, CycleTLSRequestOptions } from 'cycletls';
import pino from 'pino';
import { 
  FingerprintProfile, 
  FingerprintManager, 
  getFingerprintManager,
  buildHeadersFromProfile,
  DEFAULT_PROFILE,
} from '../fingerprints';
import { HttpRequestOptions, HttpResponse, ProxyConfig } from '../suno/types';

const logger = pino();

// =============================================================================
// PROXY UTILS
// =============================================================================

/**
 * Parse proxy URL into components
 */
export function parseProxyUrl(proxyUrl: string): {
  protocol: string;
  host: string;
  port: number;
  username?: string;
  password?: string;
} {
  const url = new URL(proxyUrl);
  return {
    protocol: url.protocol.replace(':', ''),
    host: url.hostname,
    port: parseInt(url.port, 10) || (url.protocol === 'https:' ? 443 : 80),
    username: url.username || undefined,
    password: url.password || undefined,
  };
}

/**
 * Format proxy URL for CycleTLS
 * CycleTLS expects: http://user:pass@host:port or socks5://user:pass@host:port
 */
export function formatProxyForCycleTLS(proxy: ProxyConfig): string {
  if (proxy.username && proxy.password) {
    // If credentials in config, use them
    const parsed = parseProxyUrl(proxy.url);
    return `${parsed.protocol}://${proxy.username}:${proxy.password}@${parsed.host}:${parsed.port}`;
  }
  return proxy.url;
}

// =============================================================================
// HTTP CLIENT
// =============================================================================

export interface HttpClientConfig {
  /** Default proxy for all requests */
  proxy?: ProxyConfig;
  /** Enable fingerprint rotation */
  rotateFingerprints?: boolean;
  /** Fingerprint rotation strategy */
  rotationStrategy?: 'round-robin' | 'random' | 'least-used' | 'platform-sticky';
  /** Preferred platform for fingerprints */
  preferredPlatform?: 'android' | 'ios';
  /** Default request timeout in seconds */
  defaultTimeout?: number;
  /** Max retries on failure */
  maxRetries?: number;
}

/**
 * HTTP Client with TLS fingerprinting and proxy support
 */
export class HttpClient {
  private static instance: HttpClient | null = null;
  private static initPromise: Promise<HttpClient> | null = null;
  
  private client: CycleTLSClient | null = null;
  private fingerprintManager: FingerprintManager;
  private currentProfile: FingerprintProfile;
  private config: Required<HttpClientConfig>;
  private isClosing = false;

  private constructor(config: HttpClientConfig = {}) {
    this.config = {
      proxy: config.proxy!,
      rotateFingerprints: config.rotateFingerprints ?? false,
      rotationStrategy: config.rotationStrategy ?? 'round-robin',
      preferredPlatform: config.preferredPlatform!,
      defaultTimeout: config.defaultTimeout ?? 30,
      maxRetries: config.maxRetries ?? 3,
    };

    this.fingerprintManager = getFingerprintManager({
      strategy: this.config.rotationStrategy,
      preferredPlatform: this.config.preferredPlatform,
    });

    this.currentProfile = this.fingerprintManager.getCurrentProfile();
    this.registerCleanupHandlers();
  }

  // ==========================================================================
  // SINGLETON & LIFECYCLE
  // ==========================================================================

  /**
   * Get singleton instance
   */
  public static async getInstance(config?: HttpClientConfig): Promise<HttpClient> {
    if (HttpClient.instance && HttpClient.instance.client) {
      return HttpClient.instance;
    }

    if (HttpClient.initPromise) {
      return HttpClient.initPromise;
    }

    HttpClient.initPromise = (async () => {
      logger.info('Initializing HTTP Client with TLS fingerprinting...');
      
      const httpClient = new HttpClient(config);
      httpClient.client = await initCycleTLS();
      
      HttpClient.instance = httpClient;
      HttpClient.initPromise = null;
      
      logger.info(`HTTP Client initialized with profile: ${httpClient.currentProfile.name}`);
      return httpClient;
    })();

    return HttpClient.initPromise;
  }

  /**
   * Get current instance without initialization
   */
  public static get currentInstance(): HttpClient | null {
    return HttpClient.instance;
  }

  /**
   * Register cleanup handlers
   */
  private registerCleanupHandlers(): void {
    const cleanup = async () => {
      if (!this.isClosing) {
        await this.close();
      }
    };

    process.on('beforeExit', cleanup);
    process.on('SIGINT', async () => {
      await cleanup();
      process.exit(0);
    });
    process.on('SIGTERM', async () => {
      await cleanup();
      process.exit(0);
    });
  }

  /**
   * Close the client and cleanup
   */
  public async close(): Promise<void> {
    if (this.isClosing || !this.client) {
      return;
    }

    this.isClosing = true;
    logger.info('Closing HTTP Client...');

    try {
      await this.client.exit();
      this.client = null;
      HttpClient.instance = null;
      logger.info('HTTP Client closed successfully');
    } catch (error) {
      logger.error('Error closing HTTP Client:', error);
    } finally {
      this.isClosing = false;
    }
  }

  // ==========================================================================
  // CONFIGURATION
  // ==========================================================================

  /**
   * Set default proxy
   */
  public setProxy(proxy: ProxyConfig | undefined): void {
    this.config.proxy = proxy!;
  }

  /**
   * Get current proxy
   */
  public getProxy(): ProxyConfig | undefined {
    return this.config.proxy;
  }

  /**
   * Enable/disable fingerprint rotation
   */
  public setFingerprintRotation(enabled: boolean): void {
    this.config.rotateFingerprints = enabled;
  }

  /**
   * Get current fingerprint profile
   */
  public getCurrentProfile(): FingerprintProfile {
    return this.currentProfile;
  }

  /**
   * Force rotate to next fingerprint
   */
  public rotateFingerprint(): FingerprintProfile {
    this.currentProfile = this.fingerprintManager.getNextProfile();
    logger.info(`Rotated to fingerprint: ${this.currentProfile.name}`);
    return this.currentProfile;
  }

  /**
   * Mark current profile as blocked
   */
  public blockCurrentProfile(): void {
    this.fingerprintManager.blockProfile(this.currentProfile.id);
    this.rotateFingerprint();
  }

  // ==========================================================================
  // HTTP METHODS
  // ==========================================================================

  /**
   * Make HTTP request with TLS fingerprinting
   */
  public async request<T = any>(
    url: string,
    options: HttpRequestOptions = {}
  ): Promise<HttpResponse<T>> {
    if (!this.client) {
      throw new Error('HTTP Client not initialized. Call getInstance() first.');
    }

    const {
      method = 'get',
      headers = {},
      body,
      timeout = this.config.defaultTimeout,
      cookies,
      token,
      deviceId = '',
      proxy = this.config.proxy,
    } = options;

    // Rotate fingerprint if enabled
    if (this.config.rotateFingerprints) {
      this.currentProfile = this.fingerprintManager.getNextProfile();
    }

    // Build headers with fingerprint profile
    const cookieString = cookies ? this.serializeCookies(cookies) : undefined;
    const requestHeaders = {
      ...buildHeadersFromProfile(this.currentProfile, {
        deviceId,
        token,
        cookies: cookieString,
      }),
      ...headers,
    };

    // Build CycleTLS options
    const cycleTlsOptions: CycleTLSRequestOptions = {
      ja3: this.currentProfile.ja3Fingerprint,
      userAgent: this.currentProfile.userAgent,
      headers: requestHeaders,
      body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : '',
      timeout,
      disableRedirect: false,
    };

    // Add proxy if configured
    if (proxy) {
      cycleTlsOptions.proxy = formatProxyForCycleTLS(proxy);
    }

    logger.debug(`HTTP Request: ${method.toUpperCase()} ${url} [${this.currentProfile.id}]`);

    try {
      const response = await this.client(url, cycleTlsOptions, method);
      
      // Parse response body
      let parsedBody: T;
      try {
        parsedBody = typeof response.body === 'string' 
          ? JSON.parse(response.body) 
          : response.body;
      } catch {
        parsedBody = response.body as T;
      }

      // Parse cookies
      const responseCookies = this.parseSetCookieHeader(response.headers);

      return {
        status: response.status,
        body: parsedBody,
        headers: response.headers as Record<string, string>,
        cookies: responseCookies,
      };
    } catch (error: any) {
      logger.error(`HTTP Request failed: ${method.toUpperCase()} ${url}`, error.message);
      throw error;
    }
  }

  /**
   * GET request
   */
  public async get<T = any>(
    url: string, 
    options?: Omit<HttpRequestOptions, 'method'>
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: 'get' });
  }

  /**
   * POST request
   */
  public async post<T = any>(
    url: string, 
    body?: any, 
    options?: Omit<HttpRequestOptions, 'method' | 'body'>
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { 
      ...options, 
      method: 'post', 
      body,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
  }

  /**
   * Request with automatic retry on Cloudflare challenges
   */
  public async requestWithRetry<T = any>(
    url: string,
    options: HttpRequestOptions = {},
    maxRetries?: number
  ): Promise<HttpResponse<T>> {
    const retries = maxRetries ?? this.config.maxRetries;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await this.request<T>(url, options);

        // Check for Cloudflare challenge
        if (this.isCloudflareChallenge(response)) {
          logger.warn(`Cloudflare challenge detected (attempt ${attempt}/${retries})`);
          
          // Block current profile and rotate
          this.blockCurrentProfile();
          
          if (attempt < retries) {
            const delay = Math.pow(2, attempt) * 1000;
            await this.sleep(delay);
            continue;
          }
          
          throw new Error('Cloudflare challenge - browser fallback required');
        }

        return response;
      } catch (error: any) {
        lastError = error;
        logger.error(`Request attempt ${attempt}/${retries} failed:`, error.message);

        if (attempt < retries) {
          // Rotate fingerprint on retry
          this.rotateFingerprint();
          const delay = Math.pow(2, attempt) * 1000;
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error('Request failed after max retries');
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  /**
   * Check if response is a Cloudflare challenge
   */
  private isCloudflareChallenge(response: HttpResponse): boolean {
    if (response.status === 403 || response.status === 503) {
      const cfRay = response.headers['cf-ray'];
      const server = response.headers['server'];
      
      if (cfRay || server?.toLowerCase().includes('cloudflare')) {
        return true;
      }

      const bodyStr = typeof response.body === 'string' 
        ? response.body 
        : JSON.stringify(response.body);
      
      if (bodyStr.includes('challenge-platform') || 
          bodyStr.includes('cf-browser-verification') ||
          bodyStr.includes('Just a moment')) {
        return true;
      }
    }

    return false;
  }

  /**
   * Parse Set-Cookie header
   */
  private parseSetCookieHeader(headers: Record<string, any>): Record<string, string> {
    const cookies: Record<string, string> = {};
    const setCookie = headers['set-cookie'] || headers['Set-Cookie'];

    if (!setCookie) {
      return cookies;
    }

    const cookieArray = Array.isArray(setCookie) ? setCookie : [setCookie];

    for (const cookieStr of cookieArray) {
      const parts = cookieStr.split(';')[0].split('=');
      if (parts.length >= 2) {
        const name = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        cookies[name] = value;
      }
    }

    return cookies;
  }

  /**
   * Serialize cookies object to string
   */
  private serializeCookies(cookies: Record<string, string | undefined>): string {
    return Object.entries(cookies)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

/**
 * Get HTTP Client instance
 */
export async function getHttpClient(config?: HttpClientConfig): Promise<HttpClient> {
  return HttpClient.getInstance(config);
}

/**
 * Close HTTP Client
 */
export async function closeHttpClient(): Promise<void> {
  const instance = HttpClient.currentInstance;
  if (instance) {
    await instance.close();
  }
}
