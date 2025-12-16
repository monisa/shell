import { inject, Injectable, Signal, computed } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ThemeService } from './theme.service';
import { ThemeAsset } from '../models/theme.model';
import { LoggerService } from './logger.service';

/**
 * Icon format types for rendering
 */
export type IconFormat = 'url' | 'css-var' | 'inline-svg' | 'background-image';

/**
 * Icon rendering options
 */
export interface IconOptions {
  /** Icon size (width & height) */
  size?: string;
  /** Icon color (for SVG currentColor) */
  color?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * IconService
 * 
 * Provides centralized access to theme icons for shell components and MFEs.
 * 
 * Features:
 * - Icons loaded from theme.json at runtime
 * - Exposed as CSS variables (--octa-icons-{name})
 * - Change automatically when tenant/theme changes
 * - MFEs can access without bundling local assets
 * 
 * Usage:
 * ```typescript
 * // Get icon URL
 * const url = iconService.getUrl('dashboard');
 * 
 * // Get as CSS variable reference
 * const cssVar = iconService.getCssVar('dashboard');
 * // Returns: var(--octa-icons-dashboard)
 * 
 * // Get as background-image CSS
 * const bgImage = iconService.getBackgroundImage('dashboard');
 * // Returns: url("assets/icons/dashboard.svg")
 * ```
 */
@Injectable({ providedIn: 'root' })
export class IconService {
  private readonly document = inject(DOCUMENT);
  private readonly themeService = inject(ThemeService);
  private readonly logger = inject(LoggerService);

  /**
   * All available icons from current theme
   */
  readonly icons: Signal<Record<string, ThemeAsset>> = this.themeService.icons;

  /**
   * List of available icon names
   */
  readonly availableIcons = computed(() => Object.keys(this.icons()));

  /**
   * Check if an icon exists in current theme
   */
  hasIcon(name: string): boolean {
    return name in this.icons();
  }

  /**
   * Get icon asset by name
   */
  getAsset(name: string): ThemeAsset | undefined {
    return this.icons()[name];
  }

  /**
   * Get icon URL (path to asset file)
   */
  getUrl(name: string): string | undefined {
    const asset = this.getAsset(name);
    if (!asset) {
      this.logger.warn(`Icon not found: ${name}`);
      return undefined;
    }
    return asset.value;
  }

  /**
   * Get CSS variable reference for icon
   * Use in CSS: background-image: var(--octa-icons-dashboard)
   */
  getCssVar(name: string): string {
    return `var(--octa-icons-${this.toKebabCase(name)})`;
  }

  /**
   * Get CSS variable name (without var() wrapper)
   */
  getCssVarName(name: string): string {
    return `--octa-icons-${this.toKebabCase(name)}`;
  }

  /**
   * Get background-image CSS value
   * Returns: url("assets/icons/name.svg")
   */
  getBackgroundImage(name: string): string | undefined {
    const url = this.getUrl(name);
    if (!url) return undefined;
    
    if (url.startsWith('url(')) {
      return url;
    }
    return `url("${url}")`;
  }

  /**
   * Get inline style object for use in Angular templates
   * 
   * Usage: <div [ngStyle]="iconService.getStyle('dashboard', { size: '24px' })">
   */
  getStyle(name: string, options: IconOptions = {}): Record<string, string> {
    const bgImage = this.getBackgroundImage(name);
    if (!bgImage) return {};

    const style: Record<string, string> = {
      'background-image': bgImage,
      'background-size': 'contain',
      'background-repeat': 'no-repeat',
      'background-position': 'center'
    };

    if (options.size) {
      style['width'] = options.size;
      style['height'] = options.size;
    }

    return style;
  }

  /**
   * Get all icons as CSS variable declarations
   * Useful for injecting into Shadow DOM
   */
  getAllCssVariables(): string {
    const icons = this.icons();
    const declarations: string[] = [];

    for (const [name, asset] of Object.entries(icons)) {
      const varName = `--octa-icons-${this.toKebabCase(name)}`;
      const value = this.formatAssetValue(asset);
      declarations.push(`${varName}: ${value};`);
    }

    return declarations.join('\n');
  }

  /**
   * Create an img element for the icon
   */
  createImgElement(name: string, options: IconOptions = {}): HTMLImageElement | null {
    const url = this.getUrl(name);
    if (!url) return null;

    const img = this.document.createElement('img');
    img.src = url;
    img.alt = name;
    
    if (options.size) {
      img.style.width = options.size;
      img.style.height = options.size;
    }
    
    if (options.className) {
      img.className = options.className;
    }

    return img;
  }

  /**
   * Preload all icons (for performance)
   */
  preloadIcons(): void {
    const icons = this.icons();
    
    for (const [name, asset] of Object.entries(icons)) {
      if (asset.type === 'svg' || asset.type === 'png' || asset.type === 'webp') {
        const link = this.document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = asset.value;
        this.document.head.appendChild(link);
      }
    }

    this.logger.info(`Preloaded ${Object.keys(icons).length} icons`);
  }

  private formatAssetValue(asset: ThemeAsset): string {
    if (asset.type === 'data-uri') {
      return `url("${asset.value}")`;
    }
    
    if (asset.value.startsWith('url(')) {
      return asset.value;
    }
    
    return `url("${asset.value}")`;
  }

  private toKebabCase(value: string): string {
    return value
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .replace(/[_\s]+/g, '-')
      .toLowerCase();
  }
}

