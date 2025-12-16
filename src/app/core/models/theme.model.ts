export type ThemeMode = 'light' | 'dark';

export interface ThemeAsset {
  type: 'svg' | 'png' | 'webp' | 'lottie' | 'json' | 'data-uri';
  value: string;
  description?: string;
}

export interface ThemeMeta {
  tenant: string;
  name: string;
  version: string;
  mode: ThemeMode;
  updatedAt: string;
}

export interface ThemeTokenGroup {
  [key: string]: string | number | ThemeTokenGroup;
}
export type ThemeTokenValue = string | number | ThemeTokenGroup;

export interface ThemeDefinition {
  meta: ThemeMeta;
  colors: ThemeTokenGroup;
  typography: ThemeTokenGroup;
  spacing?: ThemeTokenGroup;
  radius?: ThemeTokenGroup;
  borders?: ThemeTokenGroup;
  layout?: ThemeTokenGroup;
  elevation?: ThemeTokenGroup;
  icons?: Record<string, ThemeAsset>;
  logos?: Record<string, ThemeAsset>;
  components?: Record<string, ThemeTokenGroup>;
  custom?: ThemeTokenGroup;
}

export interface ThemeRequest {
  tenant: string;
  mode: ThemeMode;
  version?: string;
  url?: string;
}

/**
 * Single theme cache entry
 */
export interface ThemeCacheEntry {
  themeUrl: string;
  themeData: ThemeDefinition;
  version: string;
  timestamp: number;
}

/**
 * Multi-theme cache storage structure
 * Supports caching both light and dark themes per tenant
 */
export interface ThemeCacheStorage {
  /** Cache entries keyed by theme URL */
  entries: Record<string, ThemeCacheEntry>;
  /** Last cleanup timestamp */
  lastCleanup: number;
}

/**
 * Cache status for debugging/logging
 */
export type ThemeCacheStatus = 
  | 'hit'           // Fresh cache found
  | 'stale'         // Cache found but expired (will background refresh)
  | 'miss'          // No cache found
  | 'version_mismatch'; // Cache version doesn't match
