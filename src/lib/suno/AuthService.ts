/**
 * Authentication Service
 * 
 * Handles Clerk session management, token renewal, and JWT tracking
 * for the Suno API.
 */

import pino from 'pino';
import * as cookie from 'cookie';
import { randomUUID } from 'node:crypto';
import { decode as jwtDecode } from 'jsonwebtoken';
import { HttpClient, getHttpClient } from '../http';
import { TokenInfo, SessionState, ClerkClientResponse } from './types';

const logger = pino();

// =============================================================================
// CONSTANTS
// =============================================================================

export const CLERK_BASE_URL = 'https://clerk.suno.com';
export const DEFAULT_CLERK_VERSION = '5.15.0';

// =============================================================================
// AUTH SERVICE
// =============================================================================

export class AuthService {
  private httpClient!: HttpClient;
  private clerkVersion: string = DEFAULT_CLERK_VERSION;
  private state: SessionState;
  
  // Token refresh callback
  private onTokenRefresh?: (token: string) => void;

  constructor(
    cookies: string,
    options: {
      onTokenRefresh?: (token: string) => void;
    } = {}
  ) {
    this.state = {
      cookies: cookie.parse(cookies),
      deviceId: '',
    };
    this.state.deviceId = this.state.cookies.ajs_anonymous_id || randomUUID();
    this.onTokenRefresh = options.onTokenRefresh;
  }

  /**
   * Initialize the auth service
   */
  public async init(): Promise<void> {
    this.httpClient = await getHttpClient();
    await this.fetchSessionId();
    await this.refreshToken();
  }

  // ==========================================================================
  // GETTERS
  // ==========================================================================

  /**
   * Get current auth token
   */
  public getToken(): string | undefined {
    return this.state.currentToken;
  }

  /**
   * Get device ID
   */
  public getDeviceId(): string {
    return this.state.deviceId;
  }

  /**
   * Get cookies
   */
  public getCookies(): Record<string, string | undefined> {
    return this.state.cookies;
  }

  /**
   * Get session ID
   */
  public getSessionId(): string | undefined {
    return this.state.sid;
  }

  /**
   * Check if token is valid (not expired)
   * @param bufferMs Buffer time before expiration (default: 60s)
   */
  public isTokenValid(bufferMs: number = 60000): boolean {
    if (!this.state.tokenInfo) {
      return false;
    }
    return Date.now() < this.state.tokenInfo.expiresAt - bufferMs;
  }

  /**
   * Get token expiration time
   */
  public getTokenExpiration(): Date | null {
    if (!this.state.tokenInfo) {
      return null;
    }
    return new Date(this.state.tokenInfo.expiresAt);
  }

  // ==========================================================================
  // SESSION MANAGEMENT
  // ==========================================================================

  /**
   * Fetch session ID from Clerk
   */
  private async fetchSessionId(): Promise<void> {
    logger.info('Getting session ID from Clerk...');
    
    const url = `${CLERK_BASE_URL}/v1/client?_is_native=true&_clerk_js_version=${this.clerkVersion}`;
    
    const response = await this.httpClient.request<ClerkClientResponse>(url, {
      method: 'get',
      headers: {
        'Authorization': this.state.cookies.__client || '',
      },
      cookies: this.state.cookies,
      deviceId: this.state.deviceId,
    });

    if (!response.body?.response?.last_active_session_id) {
      throw new Error('Failed to get session ID. Please update SUNO_COOKIE');
    }

    this.state.sid = response.body.response.last_active_session_id;
    logger.info('Session ID obtained successfully');
  }

  /**
   * Refresh the auth token
   * @param force Force refresh even if token is still valid
   */
  public async refreshToken(force: boolean = false): Promise<string> {
    // Check if token is still valid
    if (!force && this.isTokenValid()) {
      return this.state.currentToken!;
    }

    if (!this.state.sid) {
      throw new Error('Session ID is not set. Cannot refresh token.');
    }

    const url = `${CLERK_BASE_URL}/v1/client/sessions/${this.state.sid}/tokens?_is_native=true&_clerk_js_version=${this.clerkVersion}`;
    
    logger.info('Refreshing auth token...');
    
    const response = await this.httpClient.request(url, {
      method: 'post',
      headers: {
        'Authorization': this.state.cookies.__client || '',
        'Content-Type': 'application/json',
      },
      cookies: this.state.cookies,
      deviceId: this.state.deviceId,
    });

    const newToken = response.body?.jwt;
    if (!newToken) {
      throw new Error('Failed to refresh token');
    }

    this.state.currentToken = newToken;

    // Decode JWT to get expiration time
    try {
      const decoded = jwtDecode(newToken, { complete: false }) as { exp?: number };
      if (decoded?.exp) {
        this.state.tokenInfo = {
          jwt: newToken,
          expiresAt: decoded.exp * 1000,
        };
        logger.info(`Token refreshed, expires at: ${new Date(this.state.tokenInfo.expiresAt).toISOString()}`);
      }
    } catch (e) {
      logger.warn('Could not decode JWT expiration');
    }

    // Notify callback
    if (this.onTokenRefresh) {
      this.onTokenRefresh(newToken);
    }

    return newToken;
  }

  /**
   * Keep session alive (alias for refreshToken with check)
   */
  public async keepAlive(force: boolean = false): Promise<void> {
    await this.refreshToken(force);
  }

  /**
   * Update cookies from response
   */
  public updateCookies(cookies: Record<string, string>): void {
    for (const [key, value] of Object.entries(cookies)) {
      this.state.cookies[key] = value;
    }
  }

  /**
   * Set token directly (e.g., from browser CAPTCHA flow)
   */
  public setToken(token: string): void {
    this.state.currentToken = token;
    
    // Try to decode expiration
    try {
      const decoded = jwtDecode(token, { complete: false }) as { exp?: number };
      if (decoded?.exp) {
        this.state.tokenInfo = {
          jwt: token,
          expiresAt: decoded.exp * 1000,
        };
      }
    } catch (e) {
      // Ignore decode errors
    }
  }

  /**
   * Update Clerk version dynamically
   */
  public async updateClerkVersion(): Promise<void> {
    try {
      const response = await this.httpClient.request('https://suno.com/', {
        method: 'get',
        deviceId: this.state.deviceId,
      });
      
      const bodyStr = typeof response.body === 'string' ? response.body : '';
      const match = bodyStr.match(/clerk-js@(\d+\.\d+\.\d+)/);
      
      if (match?.[1]) {
        this.clerkVersion = match[1];
        logger.info(`Updated Clerk version to: ${this.clerkVersion}`);
      }
    } catch (e) {
      logger.debug('Could not update Clerk version, using default');
    }
  }

  /**
   * Get full state (for debugging)
   */
  public getState(): Readonly<SessionState> {
    return { ...this.state };
  }
}

// =============================================================================
// FACTORY
// =============================================================================

/**
 * Create and initialize an AuthService
 */
export async function createAuthService(
  cookies: string,
  options?: ConstructorParameters<typeof AuthService>[1]
): Promise<AuthService> {
  const service = new AuthService(cookies, options);
  await service.init();
  return service;
}
