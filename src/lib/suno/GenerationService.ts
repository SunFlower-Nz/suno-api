/**
 * Generation Service
 * 
 * Handles music generation, lyrics, stems, and audio management
 * for the Suno API.
 */

import pino from 'pino';
import { HttpClient } from '../http';
import { AuthService } from './AuthService';
import { CaptchaService } from './CaptchaService';
import { sleep } from '../utils';
import {
  AudioInfo,
  RawClipData,
  GenerationOptions,
  CustomGenerationOptions,
  ExtendAudioOptions,
  GenerationPayload,
  LyricsResponse,
  AlignedWord,
  PersonaResponse,
  CreditsInfo,
  RawBillingInfo,
} from './types';

const logger = pino();

// =============================================================================
// CONSTANTS
// =============================================================================

export const SUNO_BASE_URL = 'https://studio-api.prod.suno.com';
export const DEFAULT_MODEL = 'chirp-v3-5';

// =============================================================================
// GENERATION SERVICE
// =============================================================================

export class GenerationService {
  private httpClient: HttpClient;
  private authService: AuthService;
  private captchaService: CaptchaService;

  constructor(
    httpClient: HttpClient,
    authService: AuthService,
    captchaService: CaptchaService
  ) {
    this.httpClient = httpClient;
    this.authService = authService;
    this.captchaService = captchaService;
  }

  // ==========================================================================
  // HTTP HELPERS
  // ==========================================================================

  /**
   * Make authenticated GET request
   */
  private async httpGet<T = any>(url: string, headers?: Record<string, string>) {
    return this.httpClient.requestWithRetry<T>(url, {
      method: 'get',
      headers,
      cookies: this.authService.getCookies(),
      token: this.authService.getToken(),
      deviceId: this.authService.getDeviceId(),
      timeout: 30,
    });
  }

  /**
   * Make authenticated POST request
   */
  private async httpPost<T = any>(
    url: string, 
    body?: any, 
    headers?: Record<string, string>
  ) {
    const response = await this.httpClient.requestWithRetry<T>(url, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body,
      cookies: this.authService.getCookies(),
      token: this.authService.getToken(),
      deviceId: this.authService.getDeviceId(),
      timeout: 30,
    });

    // Update cookies
    if (response.cookies) {
      this.authService.updateCookies(response.cookies);
    }

    return response;
  }

  // ==========================================================================
  // MUSIC GENERATION
  // ==========================================================================

  /**
   * Generate music from a prompt
   */
  public async generate(options: GenerationOptions): Promise<AudioInfo[]> {
    await this.authService.keepAlive();
    const startTime = Date.now();
    
    const audios = await this.generateSongs({
      prompt: options.prompt,
      isCustom: false,
      make_instrumental: options.make_instrumental,
      model: options.model,
      wait_audio: options.wait_audio,
    });
    
    const costTime = Date.now() - startTime;
    logger.info('Generate Response:\n' + JSON.stringify(audios, null, 2));
    logger.info('Cost time: ' + costTime);
    
    return audios;
  }

  /**
   * Generate music with custom parameters
   */
  public async customGenerate(options: CustomGenerationOptions): Promise<AudioInfo[]> {
    await this.authService.keepAlive();
    const startTime = Date.now();
    
    const audios = await this.generateSongs({
      prompt: options.prompt,
      isCustom: true,
      tags: options.tags,
      title: options.title,
      make_instrumental: options.make_instrumental,
      model: options.model,
      wait_audio: options.wait_audio,
      negative_tags: options.negative_tags,
    });
    
    const costTime = Date.now() - startTime;
    logger.info('Custom Generate Response:\n' + JSON.stringify(audios, null, 2));
    logger.info('Cost time: ' + costTime);
    
    return audios;
  }

  /**
   * Internal method to generate songs
   */
  private async generateSongs(params: {
    prompt: string;
    isCustom: boolean;
    tags?: string;
    title?: string;
    make_instrumental?: boolean;
    model?: string;
    wait_audio?: boolean;
    negative_tags?: string;
    task?: string;
    continue_clip_id?: string;
    continue_at?: number;
  }): Promise<AudioInfo[]> {
    await this.authService.keepAlive();

    // Get CAPTCHA token if required
    const captchaToken = await this.captchaService.getToken();

    const payload: GenerationPayload = {
      make_instrumental: params.make_instrumental,
      mv: params.model || DEFAULT_MODEL,
      prompt: '',
      generation_type: 'TEXT',
      continue_at: params.continue_at,
      continue_clip_id: params.continue_clip_id,
      task: params.task,
      token: captchaToken,
    };

    if (params.isCustom) {
      payload.tags = params.tags;
      payload.title = params.title;
      payload.negative_tags = params.negative_tags;
      payload.prompt = params.prompt;
    } else {
      payload.gpt_description_prompt = params.prompt;
    }

    logger.info('generateSongs payload:\n' + JSON.stringify({
      ...params,
      payload,
    }, null, 2));

    const response = await this.httpPost(`${SUNO_BASE_URL}/api/generate/v2/`, payload);

    if (response.status !== 200) {
      throw new Error('Error response: ' + response.status);
    }

    const songIds = response.body.clips.map((audio: RawClipData) => audio.id);

    if (params.wait_audio) {
      return this.waitForAudio(songIds);
    }

    return this.mapClipsToAudioInfo(response.body.clips);
  }

  /**
   * Wait for audio to complete
   */
  private async waitForAudio(songIds: string[]): Promise<AudioInfo[]> {
    const startTime = Date.now();
    let lastResponse: AudioInfo[] = [];
    await sleep(5, 5);

    while (Date.now() - startTime < 100000) {
      const audioResponse = await this.get(songIds);
      
      const allCompleted = audioResponse.every(
        (audio) => audio.status === 'streaming' || audio.status === 'complete'
      );
      const allError = audioResponse.every((audio) => audio.status === 'error');

      if (allCompleted || allError) {
        return audioResponse;
      }

      lastResponse = audioResponse;
      await sleep(3, 6);
      await this.authService.keepAlive();
    }

    return lastResponse;
  }

  /**
   * Map raw clip data to AudioInfo
   */
  private mapClipsToAudioInfo(clips: RawClipData[]): AudioInfo[] {
    return clips.map((audio) => ({
      id: audio.id,
      title: audio.title,
      image_url: audio.image_url,
      lyric: audio.metadata.prompt,
      audio_url: audio.audio_url,
      video_url: audio.video_url,
      created_at: audio.created_at,
      model_name: audio.model_name,
      status: audio.status as AudioInfo['status'],
      gpt_description_prompt: audio.metadata.gpt_description_prompt,
      prompt: audio.metadata.prompt,
      type: audio.metadata.type,
      tags: audio.metadata.tags,
      negative_tags: audio.metadata.negative_tags,
      duration: audio.metadata.duration,
    }));
  }

  // ==========================================================================
  // AUDIO OPERATIONS
  // ==========================================================================

  /**
   * Concatenate clips into full song
   */
  public async concatenate(clipId: string): Promise<AudioInfo> {
    await this.authService.keepAlive();

    const response = await this.httpPost(`${SUNO_BASE_URL}/api/generate/concat/v2/`, {
      clip_id: clipId,
    });

    if (response.status !== 200) {
      throw new Error('Error response: ' + response.status);
    }

    return response.body;
  }

  /**
   * Extend an existing audio clip
   */
  public async extendAudio(options: ExtendAudioOptions): Promise<AudioInfo[]> {
    return this.generateSongs({
      prompt: options.prompt || '',
      isCustom: true,
      tags: options.tags,
      title: options.title,
      make_instrumental: false,
      model: options.model,
      wait_audio: options.wait_audio,
      negative_tags: options.negative_tags,
      task: 'extend',
      continue_clip_id: options.audioId,
      continue_at: options.continueAt,
    });
  }

  /**
   * Generate stems for a song
   */
  public async generateStems(songId: string): Promise<AudioInfo[]> {
    await this.authService.keepAlive();

    const response = await this.httpPost(`${SUNO_BASE_URL}/api/edit/stems/${songId}`, {});

    logger.info('generateStems response:\n', response.body);
    
    return response.body.clips.map((clip: any) => ({
      id: clip.id,
      status: clip.status,
      created_at: clip.created_at,
      title: clip.title,
      stem_from_id: clip.metadata.stem_from_id,
      duration: clip.metadata.duration,
    }));
  }

  // ==========================================================================
  // LYRICS
  // ==========================================================================

  /**
   * Generate lyrics from prompt
   */
  public async generateLyrics(prompt: string): Promise<LyricsResponse> {
    await this.authService.keepAlive();

    const generateResponse = await this.httpPost(`${SUNO_BASE_URL}/api/generate/lyrics/`, {
      prompt,
    });
    const generateId = generateResponse.body.id;

    let lyricsResponse = await this.httpGet<LyricsResponse>(
      `${SUNO_BASE_URL}/api/generate/lyrics/${generateId}`
    );
    
    while (lyricsResponse.body?.status !== 'complete') {
      await sleep(2);
      lyricsResponse = await this.httpGet<LyricsResponse>(
        `${SUNO_BASE_URL}/api/generate/lyrics/${generateId}`
      );
    }

    return lyricsResponse.body;
  }

  /**
   * Get lyric alignment for a song
   */
  public async getLyricAlignment(songId: string): Promise<AlignedWord[]> {
    await this.authService.keepAlive();

    const response = await this.httpGet(
      `${SUNO_BASE_URL}/api/gen/${songId}/aligned_lyrics/v2/`
    );

    logger.info('getLyricAlignment response:', response.body);
    
    return response.body?.aligned_words.map((word: any) => ({
      word: word.word,
      start_s: word.start_s,
      end_s: word.end_s,
      success: word.success,
      p_align: word.p_align,
    }));
  }

  // ==========================================================================
  // AUDIO RETRIEVAL
  // ==========================================================================

  /**
   * Get audio information
   */
  public async get(songIds?: string[], page?: string | null): Promise<AudioInfo[]> {
    await this.authService.keepAlive();

    const url = new URL(`${SUNO_BASE_URL}/api/feed/v2`);
    if (songIds) {
      url.searchParams.append('ids', songIds.join(','));
    }
    if (page) {
      url.searchParams.append('page', page);
    }

    logger.info('Get audio status: ' + url.href);
    const response = await this.httpGet(url.href);

    return this.mapFeedClipsToAudioInfo(response.body.clips);
  }

  /**
   * Get specific clip information
   */
  public async getClip(clipId: string): Promise<object> {
    await this.authService.keepAlive();

    const response = await this.httpGet(`${SUNO_BASE_URL}/api/clip/${clipId}`);
    return response.body;
  }

  /**
   * Map feed clips to AudioInfo (slightly different format)
   */
  private mapFeedClipsToAudioInfo(clips: any[]): AudioInfo[] {
    return clips.map((audio) => ({
      id: audio.id,
      title: audio.title,
      image_url: audio.image_url,
      lyric: audio.metadata.prompt ? this.parseLyrics(audio.metadata.prompt) : '',
      audio_url: audio.audio_url,
      video_url: audio.video_url,
      created_at: audio.created_at,
      model_name: audio.model_name,
      status: audio.status,
      gpt_description_prompt: audio.metadata.gpt_description_prompt,
      prompt: audio.metadata.prompt,
      type: audio.metadata.type,
      tags: audio.metadata.tags,
      duration: audio.metadata.duration,
      error_message: audio.metadata.error_message,
    }));
  }

  /**
   * Parse lyrics into readable format
   */
  private parseLyrics(prompt: string): string {
    const lines = prompt.split('\n').filter((line) => line.trim() !== '');
    return lines.join('\n');
  }

  // ==========================================================================
  // CREDITS & BILLING
  // ==========================================================================

  /**
   * Get credits/billing information
   */
  public async getCredits(): Promise<CreditsInfo> {
    await this.authService.keepAlive();

    const response = await this.httpGet<RawBillingInfo>(`${SUNO_BASE_URL}/api/billing/info/`);
    
    return {
      credits_left: response.body.total_credits_left,
      period: response.body.period,
      monthly_limit: response.body.monthly_limit,
      monthly_usage: response.body.monthly_usage,
    };
  }

  // ==========================================================================
  // PERSONA
  // ==========================================================================

  /**
   * Get persona information (paginated)
   */
  public async getPersonaPaginated(personaId: string, page: number = 1): Promise<PersonaResponse> {
    await this.authService.keepAlive();

    const url = `${SUNO_BASE_URL}/api/persona/get-persona-paginated/${personaId}/?page=${page}`;
    logger.info(`Fetching persona data: ${url}`);

    const response = await this.httpGet(url);

    if (response.status !== 200) {
      throw new Error('Error response: ' + response.status);
    }

    return response.body;
  }
}

// =============================================================================
// FACTORY
// =============================================================================

/**
 * Create a GenerationService
 */
export function createGenerationService(
  httpClient: HttpClient,
  authService: AuthService,
  captchaService: CaptchaService
): GenerationService {
  return new GenerationService(httpClient, authService, captchaService);
}
