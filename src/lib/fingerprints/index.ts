/**
 * Fingerprint Profiles Module
 * 
 * Pool of Android/iOS device profiles with TLS fingerprints (JA3/JA4)
 * for rotation to avoid detection patterns.
 */

// =============================================================================
// TYPES
// =============================================================================

export interface FingerprintProfile {
  id: string;
  name: string;
  platform: 'android' | 'ios' | 'desktop';
  userAgent: string;
  clientHints: Record<string, string>;
  ja3Fingerprint: string;
  http2Fingerprint: string;
  sunoHeaders: Record<string, string>;
}

export interface ProfileRotationState {
  currentIndex: number;
  usageCount: Map<string, number>;
  lastRotation: number;
  blockedProfiles: Set<string>;
}

// =============================================================================
// ANDROID PROFILES
// =============================================================================

/**
 * Android Pixel 8 - Chrome 130
 */
const PIXEL_8_CHROME_130: FingerprintProfile = {
  id: 'pixel8-chrome130',
  name: 'Google Pixel 8 - Chrome 130',
  platform: 'android',
  userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/UQ1A.240105.004) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.6723.86 Mobile Safari/537.36',
  clientHints: {
    'sec-ch-ua': '"Chromium";v="130", "Android WebView";v="130", "Not?A_Brand";v="99"',
    'sec-ch-ua-mobile': '?1',
    'sec-ch-ua-platform': '"Android"',
    'sec-ch-ua-platform-version': '"14.0.0"',
    'sec-ch-ua-full-version': '"130.0.6723.86"',
    'sec-ch-ua-full-version-list': '"Chromium";v="130.0.6723.86", "Android WebView";v="130.0.6723.86", "Not?A_Brand";v="99.0.0.0"',
    'sec-ch-ua-model': '"Pixel 8"',
    'sec-ch-ua-arch': '""',
    'sec-ch-ua-bitness': '""',
  },
  ja3Fingerprint: '771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-13-18-51-45-43-27-17513,29-23-24,0',
  http2Fingerprint: '1:65536;2:0;4:6291456;6:262144|15663105|0|m,a,s,p',
  sunoHeaders: {
    'x-suno-client': 'Android prerelease-4nt180t 1.0.42',
    'X-Requested-With': 'com.suno.android',
    'Affiliate-Id': 'undefined',
  },
};

/**
 * Android Samsung Galaxy S24 - Chrome 130
 */
const GALAXY_S24_CHROME_130: FingerprintProfile = {
  id: 'galaxy-s24-chrome130',
  name: 'Samsung Galaxy S24 Ultra - Chrome 130',
  platform: 'android',
  userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S928B Build/UP1A.231005.007) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36',
  clientHints: {
    'sec-ch-ua': '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
    'sec-ch-ua-mobile': '?1',
    'sec-ch-ua-platform': '"Android"',
    'sec-ch-ua-platform-version': '"14.0.0"',
    'sec-ch-ua-full-version': '"130.0.6723.86"',
    'sec-ch-ua-full-version-list': '"Chromium";v="130.0.6723.86", "Google Chrome";v="130.0.6723.86", "Not?A_Brand";v="99.0.0.0"',
    'sec-ch-ua-model': '"SM-S928B"',
    'sec-ch-ua-arch': '""',
    'sec-ch-ua-bitness': '""',
  },
  ja3Fingerprint: '771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-13-18-51-45-43-27-17513,29-23-24,0',
  http2Fingerprint: '1:65536;2:0;4:6291456;6:262144|15663105|0|m,a,s,p',
  sunoHeaders: {
    'x-suno-client': 'Android prerelease-4nt180t 1.0.42',
    'X-Requested-With': 'com.suno.android',
    'Affiliate-Id': 'undefined',
  },
};

/**
 * Android OnePlus 12 - Chrome 130
 */
const ONEPLUS_12_CHROME_130: FingerprintProfile = {
  id: 'oneplus12-chrome130',
  name: 'OnePlus 12 - Chrome 130',
  platform: 'android',
  userAgent: 'Mozilla/5.0 (Linux; Android 14; CPH2573 Build/UKQ1.230924.001) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36',
  clientHints: {
    'sec-ch-ua': '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
    'sec-ch-ua-mobile': '?1',
    'sec-ch-ua-platform': '"Android"',
    'sec-ch-ua-platform-version': '"14.0.0"',
    'sec-ch-ua-full-version': '"130.0.6723.86"',
    'sec-ch-ua-full-version-list': '"Chromium";v="130.0.6723.86", "Google Chrome";v="130.0.6723.86", "Not?A_Brand";v="99.0.0.0"',
    'sec-ch-ua-model': '"CPH2573"',
    'sec-ch-ua-arch': '""',
    'sec-ch-ua-bitness': '""',
  },
  ja3Fingerprint: '771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-13-18-51-45-43-27-17513,29-23-24,0',
  http2Fingerprint: '1:65536;2:0;4:6291456;6:262144|15663105|0|m,a,s,p',
  sunoHeaders: {
    'x-suno-client': 'Android prerelease-4nt180t 1.0.42',
    'X-Requested-With': 'com.suno.android',
    'Affiliate-Id': 'undefined',
  },
};

/**
 * Android Xiaomi 14 Pro - Chrome 130
 */
const XIAOMI_14_CHROME_130: FingerprintProfile = {
  id: 'xiaomi14-chrome130',
  name: 'Xiaomi 14 Pro - Chrome 130',
  platform: 'android',
  userAgent: 'Mozilla/5.0 (Linux; Android 14; 23116PN5BC Build/UKQ1.231003.002) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36',
  clientHints: {
    'sec-ch-ua': '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
    'sec-ch-ua-mobile': '?1',
    'sec-ch-ua-platform': '"Android"',
    'sec-ch-ua-platform-version': '"14.0.0"',
    'sec-ch-ua-full-version': '"130.0.6723.86"',
    'sec-ch-ua-full-version-list': '"Chromium";v="130.0.6723.86", "Google Chrome";v="130.0.6723.86", "Not?A_Brand";v="99.0.0.0"',
    'sec-ch-ua-model': '"23116PN5BC"',
    'sec-ch-ua-arch': '""',
    'sec-ch-ua-bitness': '""',
  },
  ja3Fingerprint: '771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-13-18-51-45-43-27-17513,29-23-24,0',
  http2Fingerprint: '1:65536;2:0;4:6291456;6:262144|15663105|0|m,a,s,p',
  sunoHeaders: {
    'x-suno-client': 'Android prerelease-4nt180t 1.0.42',
    'X-Requested-With': 'com.suno.android',
    'Affiliate-Id': 'undefined',
  },
};

// =============================================================================
// iOS PROFILES
// =============================================================================

/**
 * iOS iPhone 15 Pro - Safari 17
 */
const IPHONE_15_SAFARI_17: FingerprintProfile = {
  id: 'iphone15-safari17',
  name: 'iPhone 15 Pro - Safari 17',
  platform: 'ios',
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
  clientHints: {
    'sec-ch-ua': '"Not A(Brand";v="99", "Safari";v="17"',
    'sec-ch-ua-mobile': '?1',
    'sec-ch-ua-platform': '"iOS"',
    'sec-ch-ua-platform-version': '"17.2.0"',
    'sec-ch-ua-full-version': '"17.2"',
    'sec-ch-ua-model': '"iPhone15,3"',
    'sec-ch-ua-arch': '""',
    'sec-ch-ua-bitness': '""',
  },
  ja3Fingerprint: '771,4865-4866-4867-49196-49195-52393-49200-49199-52392-49162-49161-49172-49171-157-156-53-47-49160-49170-10,65281-0-23-13-5-18-16-11-51-45-43-10-21,29-23-24-25,0',
  http2Fingerprint: '1:65536;3:100;4:2097152|10420225|0|m,s,a,p',
  sunoHeaders: {
    'x-suno-client': 'iOS 1.0.42',
    'X-Requested-With': 'com.suno.ios',
    'Affiliate-Id': 'undefined',
  },
};

/**
 * iOS iPhone 14 Pro Max - Safari 17
 */
const IPHONE_14_SAFARI_17: FingerprintProfile = {
  id: 'iphone14-safari17',
  name: 'iPhone 14 Pro Max - Safari 17',
  platform: 'ios',
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1.2 Mobile/15E148 Safari/604.1',
  clientHints: {
    'sec-ch-ua': '"Not A(Brand";v="99", "Safari";v="17"',
    'sec-ch-ua-mobile': '?1',
    'sec-ch-ua-platform': '"iOS"',
    'sec-ch-ua-platform-version': '"17.1.2"',
    'sec-ch-ua-full-version': '"17.1.2"',
    'sec-ch-ua-model': '"iPhone14,8"',
    'sec-ch-ua-arch': '""',
    'sec-ch-ua-bitness': '""',
  },
  ja3Fingerprint: '771,4865-4866-4867-49196-49195-52393-49200-49199-52392-49162-49161-49172-49171-157-156-53-47-49160-49170-10,65281-0-23-13-5-18-16-11-51-45-43-10-21,29-23-24-25,0',
  http2Fingerprint: '1:65536;3:100;4:2097152|10420225|0|m,s,a,p',
  sunoHeaders: {
    'x-suno-client': 'iOS 1.0.42',
    'X-Requested-With': 'com.suno.ios',
    'Affiliate-Id': 'undefined',
  },
};

// =============================================================================
// PROFILE POOL
// =============================================================================

/**
 * All available fingerprint profiles
 */
export const FINGERPRINT_PROFILES: FingerprintProfile[] = [
  PIXEL_8_CHROME_130,
  GALAXY_S24_CHROME_130,
  ONEPLUS_12_CHROME_130,
  XIAOMI_14_CHROME_130,
  IPHONE_15_SAFARI_17,
  IPHONE_14_SAFARI_17,
];

/**
 * Default profile (Pixel 8 Chrome 130 - most compatible)
 */
export const DEFAULT_PROFILE = PIXEL_8_CHROME_130;

// =============================================================================
// FINGERPRINT MANAGER
// =============================================================================

/**
 * Fingerprint rotation strategies
 */
export type RotationStrategy = 
  | 'round-robin'      // Cycle through profiles in order
  | 'random'           // Random selection
  | 'least-used'       // Use least frequently used profile
  | 'platform-sticky'; // Stick to one platform type

/**
 * Fingerprint Manager for profile rotation
 */
export class FingerprintManager {
  private profiles: FingerprintProfile[];
  private state: ProfileRotationState;
  private strategy: RotationStrategy;
  private preferredPlatform: 'android' | 'ios' | null;

  constructor(options: {
    strategy?: RotationStrategy;
    preferredPlatform?: 'android' | 'ios';
    customProfiles?: FingerprintProfile[];
  } = {}) {
    this.profiles = options.customProfiles ?? [...FINGERPRINT_PROFILES];
    this.strategy = options.strategy ?? 'round-robin';
    this.preferredPlatform = options.preferredPlatform ?? null;
    
    this.state = {
      currentIndex: 0,
      usageCount: new Map(),
      lastRotation: Date.now(),
      blockedProfiles: new Set(),
    };

    // Initialize usage counts
    for (const profile of this.profiles) {
      this.state.usageCount.set(profile.id, 0);
    }
  }

  /**
   * Get current profile
   */
  public getCurrentProfile(): FingerprintProfile {
    const availableProfiles = this.getAvailableProfiles();
    if (availableProfiles.length === 0) {
      // All profiles blocked, reset and use default
      this.state.blockedProfiles.clear();
      return DEFAULT_PROFILE;
    }

    const index = this.state.currentIndex % availableProfiles.length;
    return availableProfiles[index];
  }

  /**
   * Get next profile based on rotation strategy
   */
  public getNextProfile(): FingerprintProfile {
    const availableProfiles = this.getAvailableProfiles();
    if (availableProfiles.length === 0) {
      this.state.blockedProfiles.clear();
      return this.getNextProfile();
    }

    let profile: FingerprintProfile;

    switch (this.strategy) {
      case 'random':
        profile = availableProfiles[Math.floor(Math.random() * availableProfiles.length)];
        break;

      case 'least-used':
        profile = this.getLeastUsedProfile(availableProfiles);
        break;

      case 'platform-sticky':
        profile = this.getPlatformStickyProfile(availableProfiles);
        break;

      case 'round-robin':
      default:
        this.state.currentIndex++;
        profile = availableProfiles[this.state.currentIndex % availableProfiles.length];
        break;
    }

    // Update usage count
    const currentCount = this.state.usageCount.get(profile.id) ?? 0;
    this.state.usageCount.set(profile.id, currentCount + 1);
    this.state.lastRotation = Date.now();

    return profile;
  }

  /**
   * Mark a profile as blocked (e.g., after Cloudflare challenge)
   */
  public blockProfile(profileId: string): void {
    this.state.blockedProfiles.add(profileId);
  }

  /**
   * Unblock a profile
   */
  public unblockProfile(profileId: string): void {
    this.state.blockedProfiles.delete(profileId);
  }

  /**
   * Reset all blocked profiles
   */
  public resetBlockedProfiles(): void {
    this.state.blockedProfiles.clear();
  }

  /**
   * Get a specific profile by ID
   */
  public getProfileById(id: string): FingerprintProfile | undefined {
    return this.profiles.find(p => p.id === id);
  }

  /**
   * Set rotation strategy
   */
  public setStrategy(strategy: RotationStrategy): void {
    this.strategy = strategy;
  }

  /**
   * Get rotation statistics
   */
  public getStats(): {
    totalProfiles: number;
    blockedProfiles: number;
    usageStats: Record<string, number>;
    lastRotation: Date;
  } {
    const usageStats: Record<string, number> = {};
    for (const [id, count] of this.state.usageCount) {
      usageStats[id] = count;
    }

    return {
      totalProfiles: this.profiles.length,
      blockedProfiles: this.state.blockedProfiles.size,
      usageStats,
      lastRotation: new Date(this.state.lastRotation),
    };
  }

  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================

  private getAvailableProfiles(): FingerprintProfile[] {
    let available = this.profiles.filter(
      p => !this.state.blockedProfiles.has(p.id)
    );

    // Filter by platform if set
    if (this.preferredPlatform) {
      const platformFiltered = available.filter(
        p => p.platform === this.preferredPlatform
      );
      if (platformFiltered.length > 0) {
        available = platformFiltered;
      }
    }

    return available;
  }

  private getLeastUsedProfile(profiles: FingerprintProfile[]): FingerprintProfile {
    let minUsage = Infinity;
    let leastUsed = profiles[0];

    for (const profile of profiles) {
      const usage = this.state.usageCount.get(profile.id) ?? 0;
      if (usage < minUsage) {
        minUsage = usage;
        leastUsed = profile;
      }
    }

    return leastUsed;
  }

  private getPlatformStickyProfile(profiles: FingerprintProfile[]): FingerprintProfile {
    // Get current profile's platform
    const currentProfile = profiles[this.state.currentIndex % profiles.length];
    const currentPlatform = currentProfile?.platform ?? 'android';

    // Filter by same platform
    const samePlatform = profiles.filter(p => p.platform === currentPlatform);
    
    if (samePlatform.length > 0) {
      this.state.currentIndex++;
      return samePlatform[this.state.currentIndex % samePlatform.length];
    }

    // Fallback to round-robin
    this.state.currentIndex++;
    return profiles[this.state.currentIndex % profiles.length];
  }
}

// =============================================================================
// HEADER BUILDERS
// =============================================================================

/**
 * Build request headers from a fingerprint profile
 */
export function buildHeadersFromProfile(
  profile: FingerprintProfile,
  options: {
    deviceId: string;
    token?: string;
    cookies?: string;
  }
): Record<string, string> {
  const headers: Record<string, string> = {
    'User-Agent': profile.userAgent,
    ...profile.clientHints,
    ...profile.sunoHeaders,
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-site',
    'Origin': 'https://suno.com',
    'Referer': 'https://suno.com/',
    'Device-Id': `"${options.deviceId}"`,
  };

  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  if (options.cookies) {
    headers['Cookie'] = options.cookies;
  }

  return headers;
}

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

/**
 * Get singleton FingerprintManager instance
 */
let defaultManager: FingerprintManager | null = null;

export function getFingerprintManager(options?: ConstructorParameters<typeof FingerprintManager>[0]): FingerprintManager {
  if (!defaultManager) {
    defaultManager = new FingerprintManager(options);
  }
  return defaultManager;
}

export function resetFingerprintManager(): void {
  defaultManager = null;
}
