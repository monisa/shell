import { HttpClient } from '@angular/common/http';
import { DOCUMENT } from '@angular/common';
import { Injectable, Signal, WritableSignal, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ShellBrandingConfig, ShellConfig, ShellThemeConfig } from '../models/shell-config.model';
import {
  ThemeAsset,
  ThemeCacheEntry,
  ThemeDefinition,
  ThemeMode,
  ThemeRequest,
  ThemeTokenGroup
} from '../models/theme.model';
import { deepFlattenTokens, toKebabCase } from '../utils/object.utils';
import { BrowserStorageService } from './browser-storage.service';
import { LoggerService } from './logger.service';

const THEME_CACHE_KEY = 'octa.shell.theme';
const MODE_STORAGE_KEY = 'octa.shell.themeMode';
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours
const VAR_PREFIX = 'octa';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(BrowserStorageService);
  private readonly logger = inject(LoggerService);
  private readonly document = inject(DOCUMENT);

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
    this.tenantSignal.set(config.tenant);
    this.brandingOverrides = config.branding;
    this.applyBrandingOverrides();
    const initialMode =
      this.storage.getItem<ThemeMode>(MODE_STORAGE_KEY) ?? config.defaultTheme.defaultMode;
    this.modeSignal.set(initialMode);

    await this.loadTheme(
      {
        tenant: config.tenant,
        mode: initialMode,
        version: config.defaultTheme.cacheVersion,
        url: this.resolveThemeUrl(config.defaultTheme, initialMode)
      },
      config.defaultTheme
    );

    this.attachOsPreferenceListener(config.defaultTheme);
  }

  async toggleMode(themeConfig: ShellThemeConfig): Promise<void> {
    const nextMode: ThemeMode = this.modeSignal() === 'light' ? 'dark' : 'light';
    await this.setMode(nextMode, themeConfig);
  }

  async setMode(mode: ThemeMode, themeConfig: ShellThemeConfig): Promise<void> {
    this.modeSignal.set(mode);
    this.storage.setItem(MODE_STORAGE_KEY, mode);

    await this.loadTheme(
      {
        tenant: this.tenantSignal(),
        mode,
        version: themeConfig?.cacheVersion,
        url: this.resolveThemeUrl(themeConfig, mode)
      },
      themeConfig
    );
  }

  async refresh(themeConfig: ShellThemeConfig, forceNetwork = false): Promise<void> {
    await this.loadTheme(
      {
        tenant: this.tenantSignal(),
        mode: this.modeSignal(),
        version: themeConfig?.cacheVersion,
        url: this.resolveThemeUrl(themeConfig, this.modeSignal()),
        forceNetwork
      },
      themeConfig
    );
  }

  getIconUrl(name: string): string | undefined {
    return this.iconSignal()[name]?.value;
  }

  getLogoUrl(name: string): string | undefined {
    return this.logoSignal()[name]?.value;
  }

  private async loadTheme(
    request: ThemeRequest & { forceNetwork?: boolean },
    themeConfig?: ShellThemeConfig
  ): Promise<void> {
    const themeUrl = request.url ?? this.buildThemeUrl(request);
    const cached = !request.forceNetwork
      ? this.readCache(themeUrl, request.version)
      : null;

    if (cached) {
      this.logger.info(`Applying cached theme from ${themeUrl}`);
      this.applyTheme(cached);
    }

    try {
      const theme = await firstValueFrom(this.http.get<ThemeDefinition>(themeUrl));
      this.applyTheme(theme);
      this.writeCache(themeUrl, request.version ?? theme.meta.version, theme);
    } catch (error) {
      this.logger.error(`Failed to load theme from ${themeUrl}`, error);
      if (!cached) {
        await this.applyFallbackTheme(themeConfig, request.mode);
      }
    }
  }

  private applyTheme(theme: ThemeDefinition): void {
    this.themeSignal.set(theme);
    this.iconSignal.set(theme.icons ?? {});
    this.logoSignal.set(theme.logos ?? {});
    this.applyCssVariables(theme);
    this.applyBrandingOverrides();
    this.setDocumentMode(theme.meta.mode);
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

  private readCache(themeUrl: string, version?: string): ThemeDefinition | null {
    const cache = this.storage.getItem<ThemeCacheEntry>(THEME_CACHE_KEY);
    if (!cache) {
      return null;
    }

    const isExpired = Date.now() - cache.timestamp > CACHE_TTL_MS;
    if (isExpired) {
      return null;
    }

    if (cache.themeUrl !== themeUrl) {
      return null;
    }

    if (version && cache.version !== version) {
      return null;
    }

    return cache.themeData;
  }

  private writeCache(themeUrl: string, version: string, theme: ThemeDefinition): void {
    const payload: ThemeCacheEntry = {
      themeUrl,
      version,
      themeData: theme,
      timestamp: Date.now()
    };

    this.storage.setItem(THEME_CACHE_KEY, payload);
  }

  private async applyFallbackTheme(
    themeConfig: ShellThemeConfig | undefined,
    mode: ThemeMode
  ): Promise<void> {
    const fallbackUrl = this.resolveFallbackUrl(themeConfig, mode);
    if (!fallbackUrl) {
      this.logger.warn('No fallback theme configured.');
      return;
    }

    try {
      const fallbackTheme = await firstValueFrom(this.http.get<ThemeDefinition>(fallbackUrl));
      this.applyTheme(fallbackTheme);
    } catch (fallbackError) {
      this.logger.error(`Failed to load fallback theme from ${fallbackUrl}`, fallbackError);
    }
  }

  private resolveThemeUrl(themeConfig: ShellThemeConfig | undefined, mode: ThemeMode): string {
    if (!themeConfig) {
      return `assets/themes/default_${mode}.json`;
    }

    return mode === 'dark' ? themeConfig.darkThemeUrl : themeConfig.lightThemeUrl;
  }

  private resolveFallbackUrl(themeConfig: ShellThemeConfig | undefined, mode: ThemeMode): string {
    if (!themeConfig) {
      return `assets/themes/fallback_${mode}.json`;
    }

    return mode === 'dark' ? themeConfig.fallbackDarkThemeUrl : themeConfig.fallbackLightThemeUrl;
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
