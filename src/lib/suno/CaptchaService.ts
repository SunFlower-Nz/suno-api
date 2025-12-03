/**
 * CAPTCHA Service
 * 
 * Handles CAPTCHA detection, browser automation for solving,
 * and 2captcha integration.
 */

import pino from 'pino';
import yn from 'yn';
import { promises as fs } from 'fs';
import path from 'node:path';
import { Solver } from '@2captcha/captcha-solver';
import { paramsCoordinates } from '@2captcha/captcha-solver/dist/structs/2captcha';
import { BrowserContext, Page, Locator, chromium, firefox } from 'rebrowser-playwright-core';
import { createCursor, Cursor } from 'ghost-cursor-playwright';

import { isPage, sleep, waitForRequests } from '../utils';
import { HttpClient } from '../http';
import { AuthService } from './AuthService';
import { CaptchaCheckResponse, CaptchaSolution } from './types';
import { DEFAULT_PROFILE } from '../fingerprints';

const logger = pino();

// =============================================================================
// CONSTANTS
// =============================================================================

export const SUNO_BASE_URL = 'https://studio-api.prod.suno.com';

// =============================================================================
// CAPTCHA SERVICE
// =============================================================================

export interface CaptchaServiceConfig {
  /** 2Captcha API key */
  twoCaptchaKey?: string;
  /** Enable ghost cursor for mouse movements */
  ghostCursorEnabled?: boolean;
  /** Browser locale */
  browserLocale?: string;
  /** Run browser headless */
  headless?: boolean;
  /** Disable GPU acceleration */
  disableGpu?: boolean;
  /** Browser type: 'chromium' or 'firefox' */
  browserType?: 'chromium' | 'firefox';
}

export class CaptchaService {
  private httpClient: HttpClient;
  private authService: AuthService;
  private solver: Solver;
  private config: Required<CaptchaServiceConfig>;
  private cursor?: Cursor;

  constructor(
    httpClient: HttpClient,
    authService: AuthService,
    config: CaptchaServiceConfig = {}
  ) {
    this.httpClient = httpClient;
    this.authService = authService;
    
    this.config = {
      twoCaptchaKey: config.twoCaptchaKey || process.env.TWOCAPTCHA_KEY || '',
      ghostCursorEnabled: config.ghostCursorEnabled ?? yn(process.env.BROWSER_GHOST_CURSOR, { default: false }),
      browserLocale: config.browserLocale || process.env.BROWSER_LOCALE || 'en-US',
      headless: config.headless ?? yn(process.env.BROWSER_HEADLESS, { default: true }),
      disableGpu: config.disableGpu ?? yn(process.env.BROWSER_DISABLE_GPU, { default: false }),
      browserType: config.browserType || (process.env.BROWSER?.toLowerCase() === 'firefox' ? 'firefox' : 'chromium'),
    };

    this.solver = new Solver(this.config.twoCaptchaKey);
  }

  // ==========================================================================
  // CAPTCHA CHECK
  // ==========================================================================

  /**
   * Check if CAPTCHA is required for generation
   */
  public async isRequired(): Promise<boolean> {
    const response = await this.httpClient.post<CaptchaCheckResponse>(
      `${SUNO_BASE_URL}/api/c/check`,
      { ctype: 'generation' },
      {
        cookies: this.authService.getCookies(),
        token: this.authService.getToken(),
        deviceId: this.authService.getDeviceId(),
      }
    );

    logger.info('CAPTCHA check response:', response.body);
    return response.body?.required === true;
  }

  // ==========================================================================
  // BROWSER AUTOMATION
  // ==========================================================================

  /**
   * Get browser type from config
   */
  private getBrowserType() {
    return this.config.browserType === 'firefox' ? firefox : chromium;
  }

  /**
   * Launch browser with session cookies
   */
  private async launchBrowser(): Promise<BrowserContext> {
    const args = [
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-features=site-per-process',
      '--disable-features=IsolateOrigins',
      '--disable-extensions',
      '--disable-infobars',
    ];

    if (this.config.disableGpu) {
      args.push(
        '--enable-unsafe-swiftshader',
        '--disable-gpu',
        '--disable-setuid-sandbox'
      );
    }

    const browser = await this.getBrowserType().launch({
      args,
      headless: this.config.headless,
    });

    const context = await browser.newContext({
      userAgent: DEFAULT_PROFILE.userAgent,
      locale: this.config.browserLocale,
      viewport: null,
    });

    // Add cookies
    const cookies: any[] = [];
    const lax: 'Lax' | 'Strict' | 'None' = 'Lax';

    // Add session token
    const token = this.authService.getToken();
    if (token) {
      cookies.push({
        name: '__session',
        value: token,
        domain: '.suno.com',
        path: '/',
        sameSite: lax,
      });
    }

    // Add all other cookies
    const sessionCookies = this.authService.getCookies();
    for (const key in sessionCookies) {
      if (sessionCookies[key]) {
        cookies.push({
          name: key,
          value: sessionCookies[key] + '',
          domain: '.suno.com',
          path: '/',
          sameSite: lax,
        });
      }
    }

    await context.addCookies(cookies);
    return context;
  }

  /**
   * Click helper for ghost cursor or regular click
   */
  private async click(
    target: Locator | Page, 
    position?: { x: number; y: number }
  ): Promise<void> {
    if (this.config.ghostCursorEnabled && this.cursor) {
      let pos: any = isPage(target) ? { x: 0, y: 0 } : await target.boundingBox();
      if (position) {
        pos = {
          ...pos,
          x: pos.x + position.x,
          y: pos.y + position.y,
          width: null,
          height: null,
        };
      }
      return this.cursor.actions.click({ target: pos });
    } else {
      if (isPage(target)) {
        return target.mouse.click(position?.x ?? 0, position?.y ?? 0);
      } else {
        return target.click({ force: true, position });
      }
    }
  }

  // ==========================================================================
  // SOLVE CAPTCHA
  // ==========================================================================

  /**
   * Solve CAPTCHA using browser automation and 2captcha
   * @returns hCaptcha token or null if not required
   */
  public async solve(): Promise<CaptchaSolution | null> {
    if (!(await this.isRequired())) {
      return null;
    }

    logger.info('CAPTCHA required. Launching browser...');
    const browser = await this.launchBrowser();
    const page = await browser.newPage();
    
    try {
      await page.goto('https://suno.com/create', {
        referer: 'https://www.google.com/',
        waitUntil: 'domcontentloaded',
        timeout: 0,
      });

      logger.info('Waiting for Suno interface to load...');
      await page.waitForResponse('**/api/project/**\\?**', { timeout: 60000 });

      if (this.config.ghostCursorEnabled) {
        this.cursor = await createCursor(page);
      }

      logger.info('Triggering the CAPTCHA...');
      
      // Close any modals
      try {
        await page.getByLabel('Close').click({ timeout: 2000 });
      } catch (e) {}

      // Trigger CAPTCHA by interacting with create form
      const textarea = page.locator('.custom-textarea');
      await this.click(textarea);
      await textarea.pressSequentially('Lorem ipsum', { delay: 80 });

      const button = page.locator('button[aria-label="Create"]').locator('div.flex');
      this.click(button);

      const controller = new AbortController();

      // Start CAPTCHA solving process
      this.solveCaptchaLoop(page, browser, controller).catch((e) => {
        browser.browser()?.close();
        throw e;
      });

      // Wait for the token
      return new Promise((resolve, reject) => {
        page.route('**/api/generate/v2/**', async (route: any) => {
          try {
            logger.info('hCaptcha token received. Closing browser...');
            route.abort();
            browser.browser()?.close();
            controller.abort();
            
            const request = route.request();
            const authHeader = request.headers().authorization;
            const newToken = authHeader?.split('Bearer ').pop();
            
            if (newToken) {
              this.authService.setToken(newToken);
            }

            resolve({
              token: request.postDataJSON().token,
              timestamp: Date.now(),
            });
          } catch (err) {
            reject(err);
          }
        });
      });
    } catch (error) {
      browser.browser()?.close();
      throw error;
    }
  }

  /**
   * CAPTCHA solving loop
   */
  private async solveCaptchaLoop(
    page: Page,
    browser: BrowserContext,
    controller: AbortController
  ): Promise<void> {
    const frame = page.frameLocator('iframe[title*="hCaptcha"]');
    const challenge = frame.locator('.challenge-container');
    const button = page.locator('button[aria-label="Create"]').locator('div.flex');
    
    try {
      let wait = true;
      while (true) {
        if (wait) {
          await waitForRequests(page, controller.signal);
        }
        
        // Check if this is a drag challenge
        const promptText = await challenge.locator('.prompt-text').first().innerText();
        const isDrag = promptText.toLowerCase().includes('drag');
        
        // Solve using 2captcha
        let captcha: any;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            logger.info('Sending CAPTCHA to 2Captcha...');
            
            const payload: paramsCoordinates = {
              body: (await challenge.screenshot({ timeout: 5000 })).toString('base64'),
              lang: this.config.browserLocale,
            };
            
            if (isDrag) {
              payload.textinstructions = 'CLICK on the shapes at their edge or center as shown above—please be precise!';
              payload.imginstructions = (
                await fs.readFile(path.join(process.cwd(), 'public', 'drag-instructions.jpg'))
              ).toString('base64');
            }
            
            captcha = await this.solver.coordinates(payload);
            break;
          } catch (err: any) {
            logger.info(err.message);
            if (attempt !== 2) {
              logger.info('Retrying...');
            } else {
              throw err;
            }
          }
        }

        // Apply solution
        if (isDrag) {
          await this.applyDragSolution(page, challenge, captcha);
          wait = true;
        } else {
          await this.applyClickSolution(challenge, captcha);
        }

        // Submit
        this.click(frame.locator('.button-submit')).catch((e) => {
          if (e.message.includes('viewport')) {
            this.click(button);
          } else {
            throw e;
          }
        });
      }
    } catch (e: any) {
      if (e.message.includes('been closed') || e.message === 'AbortError') {
        // Expected when CAPTCHA is solved
        return;
      }
      throw e;
    }
  }

  /**
   * Apply drag solution from 2captcha
   */
  private async applyDragSolution(
    page: Page,
    challenge: Locator,
    captcha: any
  ): Promise<void> {
    const challengeBox = await challenge.boundingBox();
    if (!challengeBox) {
      throw new Error('.challenge-container boundingBox is null!');
    }
    
    if (captcha.data.length % 2) {
      logger.info('Solution has odd number of points. Reporting bad solution...');
      this.solver.badReport(captcha.id);
      return;
    }
    
    for (let i = 0; i < captcha.data.length; i += 2) {
      const data1 = captcha.data[i];
      const data2 = captcha.data[i + 1];
      logger.info(JSON.stringify(data1) + JSON.stringify(data2));
      
      await page.mouse.move(challengeBox.x + +data1.x, challengeBox.y + +data1.y);
      await page.mouse.down();
      await sleep(1.1);
      await page.mouse.move(
        challengeBox.x + +data2.x, 
        challengeBox.y + +data2.y, 
        { steps: 30 }
      );
      await page.mouse.up();
    }
  }

  /**
   * Apply click solution from 2captcha
   */
  private async applyClickSolution(
    challenge: Locator,
    captcha: any
  ): Promise<void> {
    for (const data of captcha.data) {
      logger.info(data);
      await this.click(challenge, { x: +data.x, y: +data.y });
    }
  }

  /**
   * Get CAPTCHA token (alias for solve that returns just the token)
   */
  public async getToken(): Promise<string | null> {
    const solution = await this.solve();
    return solution?.token ?? null;
  }
}

// =============================================================================
// FACTORY
// =============================================================================

/**
 * Create a CaptchaService
 */
export function createCaptchaService(
  httpClient: HttpClient,
  authService: AuthService,
  config?: CaptchaServiceConfig
): CaptchaService {
  return new CaptchaService(httpClient, authService, config);
}
