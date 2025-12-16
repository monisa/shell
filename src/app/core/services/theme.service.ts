import { HttpClient } from '@angular/common/http';
import { DOCUMENT } from '@angular/common';
import { Injectable, Signal, WritableSignal, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ShellBrandingConfig, ShellConfig, ShellThemeConfig } from '../models/shell-config.model';
import {
  ThemeAsset,
  ThemeCacheEntry,
  ThemeCacheStatus,
  ThemeCacheStorage,
  ThemeDefinition,
  ThemeMode,
  ThemeRequest,
  ThemeTokenGroup
} from '../models/theme.model';
import { deepFlattenTokens, toKebabCase } from '../utils/object.utils';
import { BrowserStorageService } from './browser-storage.service';
import { LoggerService } from './logger.service';
import { ShadowDomThemeService } from './shadow-dom-theme.service';

const THEME_CACHE_KEY = 'octa.shell.themeCache';
const MODE_STORAGE_KEY = 'octa.shell.themeMode';
const VAR_PREFIX = 'octa';

/**
 * Cache Configuration
 * - CACHE_TTL_MS: How long until cache is considered stale (6 hours)
 * - CACHE_MAX_AGE_MS: Maximum age before cache is completely invalidated (24 hours)
 * - CLEANUP_INTERVAL_MS: How often to clean up old cache entries (1 hour)
 */
const CACHE_TTL_MS = 1000 * 60 * 60 * 6;      // 6 hours - stale threshold
const CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24; // 24 hours - hard expiry
const CLEANUP_INTERVAL_MS = 1000 * 60 * 60;   // 1 hour

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(BrowserStorageService);
  private readonly logger = inject(LoggerService);
  private readonly document = inject(DOCUMENT);
  private readonly shadowDomTheme = inject(ShadowDomThemeService);

  private readonly themeSignal: WritableSignal<ThemeDefinition | null> = signal<ThemeDefinition | null>(null);
  private readonly modeSignal: WritableSignal<ThemeMode> = signal('light');
  private readonly tenantSignal: WritableSignal<string> = signal('default');
  private readonly iconSignal: WritableSignal<Record<string, ThemeAsset>> = signal({});
  private readonly logoSignal: WritableSignal<Record<string, ThemeAsset>> = signal({});
  private brandingOverrides?: ShellBrandingConfig;

  readonly currentTheme: Signal<ThemeDefinition | null> = this.themeSignal.asReadonly();
  readonly currentMode: Signal<ThemeMode> = this.modeSignal.asReadonly();
  readonly icons = this.iconSignal.asReadonly();
  readonly logos = this.logoSignal.asReadonly();
  readonly isDarkMode = computed(() => this.modeSignal() === 'dark');

  private prefersDarkMediaQuery = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;

  async init(config: ShellConfig): Promise<void> {
    // Initialize Shadow DOM theme service for MFE support
    this.shadowDomTheme.init();
    
    // Expose theme utilities to console for debugging
    this.exposeToConsole();
    
    this.tenantSignal.set(config.tenant);
    this.brandingOverrides = config.branding;
    this.applyBrandingOverrides();
    const initialMode =
      this.storage.getItem<ThemeMode>(MODE_STORAGE_KEY) ?? config.defaultTheme.defaultMode;
    this.modeSignal.set(initialMode);

    await this.loadTheme({
      tenant: config.tenant,
      mode: initialMode,
      version: config.defaultTheme.cacheVersion,
      url: this.resolveThemeUrl(config.defaultTheme, initialMode)
    });

    this.attachOsPreferenceListener(config.defaultTheme);
  }

  /**
   * Expose theme utilities to browser console for debugging
   * 
   * Usage in console:
   *   OCTA.theme.clearCache()     - Clear theme cache
   *   OCTA.theme.getCacheStats()  - View cache statistics
   *   OCTA.theme.reload()         - Clear cache and reload page
   */
  private exposeToConsole(): void {
    if (typeof window === 'undefined') return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    win.OCTA = win.OCTA || {};
    win.OCTA.theme = {
      clearCache: () => {
        this.clearCache();
        console.log('✅ Theme cache cleared');
      },
      getCacheStats: () => {
        const stats = this.getCacheStats();
        console.table(stats.entries);
        return stats;
      },
      reload: () => {
        this.clearCache();
        console.log('🔄 Reloading...');
        window.location.reload();
      },
      getMode: () => this.currentMode(),
      getTheme: () => this.currentTheme()
    };

    this.logger.info('Theme console utils available: OCTA.theme.clearCache(), OCTA.theme.reload()');
  }

  async toggleMode(themeConfig: ShellThemeConfig): Promise<void> {
    const nextMode: ThemeMode = this.modeSignal() === 'light' ? 'dark' : 'light';
    await this.setMode(nextMode, themeConfig);
  }

  async setMode(mode: ThemeMode, themeConfig: ShellThemeConfig): Promise<void> {
    this.modeSignal.set(mode);
    this.storage.setItem(MODE_STORAGE_KEY, mode);

    await this.loadTheme({
      tenant: this.tenantSignal(),
      mode,
      version: themeConfig?.cacheVersion,
      url: this.resolveThemeUrl(themeConfig, mode)
    });
  }

  async refresh(themeConfig: ShellThemeConfig, forceNetwork = false): Promise<void> {
    await this.loadTheme({
      tenant: this.tenantSignal(),
      mode: this.modeSignal(),
      version: themeConfig?.cacheVersion,
      url: this.resolveThemeUrl(themeConfig, this.modeSignal()),
      forceNetwork
    });
  }

  getIconUrl(name: string): string | undefined {
    return this.iconSignal()[name]?.value;
  }

  getLogoUrl(name: string): string | undefined {
    return this.logoSignal()[name]?.value;
  }

  /**
   * Load theme with stale-while-revalidate caching strategy:
   * 
   * 1. Check cache status (hit/stale/miss/version_mismatch)
   * 2. If HIT: Apply cached theme, done
   * 3. If STALE: Apply cached theme immediately, then background refresh
   * 4. If MISS/MISMATCH: Fetch from network, apply, cache
   * 
   * This ensures fast initial load while keeping themes fresh.
   */
  private async loadTheme(request: ThemeRequest & { forceNetwork?: boolean }): Promise<void> {
    const themeUrl = request.url ?? this.buildThemeUrl(request);
    
    // Check cache (unless force network)
    const { status, entry } = !request.forceNetwork
      ? this.checkCache(themeUrl, request.version)
      : { status: 'miss' as ThemeCacheStatus, entry: null };

    this.logger.info(`Theme cache status for ${themeUrl}: ${status}`);

    switch (status) {
      case 'hit':
        // Fresh cache - apply and we're done
        this.applyTheme(entry!.themeData);
        return;

      case 'stale':
        // Stale cache - apply immediately, then background refresh
        this.applyTheme(entry!.themeData);
        this.backgroundRefresh(themeUrl, request.version);
        return;

      case 'miss':
      case 'version_mismatch':
        // No valid cache - must fetch from network
        await this.fetchAndApplyTheme(themeUrl, request.version);
        return;
    }
  }

  /**
   * Fetch theme from network, apply it, and update cache
   */
  private async fetchAndApplyTheme(themeUrl: string, version?: string): Promise<void> {
    try {
      const theme = await firstValueFrom(this.http.get<ThemeDefinition>(themeUrl));
      this.applyTheme(theme);
      this.writeCache(themeUrl, version ?? theme.meta.version, theme);
      this.logger.info(`Theme loaded and cached: ${themeUrl}`);
    } catch (error) {
      this.logger.error(`Failed to load theme from ${themeUrl}`, error);
      // CSS variable fallbacks in styles.scss will handle missing themes
    }
  }

  /**
   * Background refresh - fetches new theme without blocking UI
   * Updates cache silently; theme only changes if significantly different
   */
  private backgroundRefresh(themeUrl: string, version?: string): void {
    this.logger.info(`Background refreshing theme: ${themeUrl}`);
    
    // Use setTimeout to ensure this doesn't block the main thread
    setTimeout(async () => {
      try {
        const theme = await firstValueFrom(this.http.get<ThemeDefinition>(themeUrl));
        
        // Update cache
        this.writeCache(themeUrl, version ?? theme.meta.version, theme);
        
        // Check if theme actually changed (compare versions)
        const currentTheme = this.themeSignal();
        if (currentTheme?.meta.version !== theme.meta.version) {
          this.logger.info(`Theme updated in background: ${theme.meta.version}`);
          this.applyTheme(theme);
        } else {
          this.logger.info(`Background refresh complete, theme unchanged`);
        }
      } catch (error) {
        this.logger.warn(`Background theme refresh failed (cached version still active)`, error);
      }
    }, 100);
  }

  private applyTheme(theme: ThemeDefinition): void {
    this.themeSignal.set(theme);
    this.iconSignal.set(theme.icons ?? {});
    this.logoSignal.set(theme.logos ?? {});
    this.applyCssVariables(theme);
    this.applyBrandingOverrides();
    this.setDocumentMode(theme.meta.mode);
    
    // Update CSS variables in all tracked Shadow DOM elements (MFEs)
    this.shadowDomTheme.refreshAll();
  }

  private applyCssVariables(theme: ThemeDefinition): void {
    const root = this.document.documentElement;
    const sections: Array<[string, ThemeTokenGroup | undefined]> = [
      ['colors', theme.colors],
      ['typography', theme.typography],
      ['spacing', theme.spacing],
      ['radius', theme.radius],
      ['borders', theme.borders],
      ['layout', theme.layout],
      ['components', theme.components],
      ['custom', theme.custom]
    ];

    sections.forEach(([sectionName, tokens]) => {
      if (!tokens) {
        return;
      }

      deepFlattenTokens(`${VAR_PREFIX}-${sectionName}`, tokens, (key, value) => {
        root.style.setProperty(`--${key}`, String(value));
      });
    });

    this.applyAssetVariables('icons', theme.icons, root);
    this.applyAssetVariables('logos', theme.logos, root);
  }

  private applyAssetVariables(
    section: 'icons' | 'logos',
    assets: Record<string, ThemeAsset> | undefined,
    root: HTMLElement
  ): void {
    if (!assets) {
      return;
    }

    Object.entries(assets).forEach(([name, asset]) => {
      const cssVarName = `--${VAR_PREFIX}-${section}-${toKebabCase(name)}`;
      const cssValue = this.toCssAssetValue(asset);
      root.style.setProperty(cssVarName, cssValue);
    });
  }

  private applyBrandingOverrides(): void {
    if (!this.brandingOverrides) {
      return;
    }

    const root = this.document?.documentElement;
    if (!root) {
      return;
    }
    const { primaryColor, secondaryColor, fontFamily, fontSize, logoUrl } = this.brandingOverrides;

    if (primaryColor) {
      root.style.setProperty('--octa-colors-primary', primaryColor);
    }

    if (secondaryColor) {
      root.style.setProperty('--octa-colors-secondary', secondaryColor);
    }

    if (fontFamily) {
      root.style.setProperty('--octa-typography-font-family-base', fontFamily);
      root.style.setProperty('--octa-typography-font-family-headings', fontFamily);
      root.style.setProperty('font-family', fontFamily);
    }

    if (fontSize) {
      root.style.setProperty('--octa-typography-font-size-base', fontSize);
    }

    if (logoUrl) {
      const currentLogos = { ...(this.logoSignal() ?? {}) };
      currentLogos['main'] = {
        type: this.detectAssetType(logoUrl),
        value: logoUrl
      };
      this.logoSignal.set(currentLogos);
    }
  }

  private detectAssetType(path: string): ThemeAsset['type'] {
    if (path.startsWith('data:')) {
      return 'data-uri';
    }

    const extension = path.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'svg':
        return 'svg';
      case 'png':
        return 'png';
      case 'webp':
        return 'webp';
      case 'json':
        return 'json';
      default:
        return 'svg';
    }
  }

  private toCssAssetValue(asset: ThemeAsset): string {
    if (asset.type === 'lottie' || asset.type === 'json') {
      return asset.value;
    }

    if (asset.value.startsWith('url(')) {
      return asset.value;
    }

    return `url("${asset.value}")`;
  }

  private setDocumentMode(mode: ThemeMode): void {
    if (!this.document?.body) {
      return;
    }

    this.document.body.dataset['theme'] = mode;
  }

  /**
   * Check cache status and return entry if available
   * 
   * Returns:
   * - 'hit': Fresh cache, ready to use
   * - 'stale': Cache exists but expired (use with background refresh)
   * - 'miss': No cache found
   * - 'version_mismatch': Cache version doesn't match requested version
   */
  private checkCache(themeUrl: string, version?: string): { status: ThemeCacheStatus; entry: ThemeCacheEntry | null } {
    const storage = this.getCacheStorage();
    const entry = storage.entries[themeUrl];

    if (!entry) {
      return { status: 'miss', entry: null };
    }

    const age = Date.now() - entry.timestamp;

    // Hard expiry - cache too old, treat as miss
    if (age > CACHE_MAX_AGE_MS) {
      this.removeCacheEntry(themeUrl);
      return { status: 'miss', entry: null };
    }

    // Version mismatch - config updated, need fresh data
    if (version && entry.version !== version) {
      return { status: 'version_mismatch', entry };
    }

    // Stale but usable - apply immediately, refresh in background
    if (age > CACHE_TTL_MS) {
      return { status: 'stale', entry };
    }

    // Fresh cache
    return { status: 'hit', entry };
  }

  /**
   * Write theme to multi-theme cache
   * Supports caching both light and dark themes simultaneously
   */
  private writeCache(themeUrl: string, version: string, theme: ThemeDefinition): void {
    const storage = this.getCacheStorage();
    
    storage.entries[themeUrl] = {
      themeUrl,
      version,
      themeData: theme,
      timestamp: Date.now()
    };

    // Periodic cleanup of old entries
    this.cleanupCacheIfNeeded(storage);

    this.storage.setItem(THEME_CACHE_KEY, storage);
  }

  /**
   * Get or initialize the cache storage structure
   */
  private getCacheStorage(): ThemeCacheStorage {
    const existing = this.storage.getItem<ThemeCacheStorage>(THEME_CACHE_KEY);
    
    if (existing && existing.entries) {
      return existing;
    }

    // Initialize new cache storage
    return {
      entries: {},
      lastCleanup: Date.now()
    };
  }

  /**
   * Remove a specific cache entry
   */
  private removeCacheEntry(themeUrl: string): void {
    const storage = this.getCacheStorage();
    delete storage.entries[themeUrl];
    this.storage.setItem(THEME_CACHE_KEY, storage);
  }

  /**
   * Clean up expired cache entries periodically
   */
  private cleanupCacheIfNeeded(storage: ThemeCacheStorage): void {
    const now = Date.now();
    
    // Only cleanup once per interval
    if (now - storage.lastCleanup < CLEANUP_INTERVAL_MS) {
      return;
    }

    const urlsToRemove: string[] = [];

    for (const [url, entry] of Object.entries(storage.entries)) {
      if (now - entry.timestamp > CACHE_MAX_AGE_MS) {
        urlsToRemove.push(url);
      }
    }

    if (urlsToRemove.length > 0) {
      urlsToRemove.forEach(url => delete storage.entries[url]);
      this.logger.info(`Cleaned up ${urlsToRemove.length} expired cache entries`);
    }

    storage.lastCleanup = now;
  }

  /**
   * Clear all theme caches
   * Use this when tenant changes or for manual cache invalidation
   */
  clearCache(): void {
    this.storage.removeItem(THEME_CACHE_KEY);
    this.logger.info('Theme cache cleared');
  }

  /**
   * Clear cache for a specific theme URL
   */
  clearCacheForTheme(themeUrl: string): void {
    this.removeCacheEntry(themeUrl);
    this.logger.info(`Cache cleared for theme: ${themeUrl}`);
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats(): { totalEntries: number; entries: Array<{ url: string; age: string; version: string }> } {
    const storage = this.getCacheStorage();
    const now = Date.now();

    const entries = Object.entries(storage.entries).map(([url, entry]) => {
      const ageMs = now - entry.timestamp;
      const ageMinutes = Math.floor(ageMs / 60000);
      const ageHours = Math.floor(ageMinutes / 60);
      
      return {
        url,
        age: ageHours > 0 ? `${ageHours}h ${ageMinutes % 60}m` : `${ageMinutes}m`,
        version: entry.version
      };
    });

    return {
      totalEntries: entries.length,
      entries
    };
  }

  private resolveThemeUrl(themeConfig: ShellThemeConfig | undefined, mode: ThemeMode): string {
    if (!themeConfig) {
      return `assets/themes/default_${mode}.json`;
    }

    return mode === 'dark' ? themeConfig.darkThemeUrl : themeConfig.lightThemeUrl;
  }

  private buildThemeUrl(request: ThemeRequest): string {
    return request.url ?? `assets/themes/${request.tenant}_${request.mode}.json`;
  }

  private attachOsPreferenceListener(themeConfig: ShellThemeConfig): void {
    if (!this.prefersDarkMediaQuery) {
      return;
    }

    const listener = async (event: MediaQueryListEvent): Promise<void> => {
      const prefersDark = event.matches;
      const storedPreference = this.storage.getItem<ThemeMode>(MODE_STORAGE_KEY);
      if (storedPreference) {
        return; // respect explicit choice
      }

      await this.setMode(prefersDark ? 'dark' : 'light', themeConfig);
    };

    this.prefersDarkMediaQuery.addEventListener('change', listener);
  }
}
