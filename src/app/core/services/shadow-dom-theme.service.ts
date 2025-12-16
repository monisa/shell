import { inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { LoggerService } from './logger.service';

/**
 * ShadowDomThemeService
 * 
 * Ensures CSS variables from the shell are available inside Shadow DOM components.
 * Shadow DOM encapsulation prevents automatic CSS variable inheritance in some browsers.
 * 
 * This service:
 * 1. Collects all --octa-* CSS variables from :root
 * 2. Injects them into Shadow DOM elements
 * 3. Updates them when theme changes
 */
@Injectable({ providedIn: 'root' })
export class ShadowDomThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly logger = inject(LoggerService);
  
  private readonly trackedShadowRoots = new Set<ShadowRoot>();
  private cachedVariables: string | null = null;
  private observer: MutationObserver | null = null;

  /**
   * Initialize the service - starts observing :root for CSS variable changes
   */
  init(): void {
    this.observeRootChanges();
    this.logger.info('ShadowDomThemeService initialized');
  }

  /**
   * Inject CSS variables into a Shadow DOM element
   * Call this after creating a web component with Shadow DOM
   */
  injectIntoShadowRoot(shadowRoot: ShadowRoot): void {
    if (!shadowRoot) {
      this.logger.warn('Cannot inject theme: shadowRoot is null');
      return;
    }

    // Track this shadow root for future updates
    this.trackedShadowRoots.add(shadowRoot);

    // Inject current CSS variables
    this.applyVariablesToShadowRoot(shadowRoot);
    
    this.logger.info(`Injected CSS variables into shadow root`);
  }

  /**
   * Inject CSS variables into a custom element (finds shadow root automatically)
   */
  injectIntoElement(element: HTMLElement): void {
    const shadowRoot = element.shadowRoot;
    
    if (shadowRoot) {
      this.injectIntoShadowRoot(shadowRoot);
    } else {
      // Element might not have shadow DOM yet, observe for it
      this.waitForShadowRoot(element);
    }
  }

  /**
   * Remove tracking for a shadow root (call on component destroy)
   */
  untrack(shadowRoot: ShadowRoot): void {
    this.trackedShadowRoots.delete(shadowRoot);
  }

  /**
   * Force refresh of CSS variables in all tracked shadow roots
   * Call this after theme changes
   */
  refreshAll(): void {
    this.cachedVariables = null; // Clear cache
    this.trackedShadowRoots.forEach(shadowRoot => {
      this.applyVariablesToShadowRoot(shadowRoot);
    });
    this.logger.info(`Refreshed CSS variables in ${this.trackedShadowRoots.size} shadow roots`);
  }

  /**
   * Get all CSS variables as a style string
   */
  getCssVariablesString(): string {
    if (this.cachedVariables) {
      return this.cachedVariables;
    }

    const root = this.document.documentElement;
    const computedStyles = getComputedStyle(root);
    const variables: string[] = [];

    // Get all CSS custom properties from :root
    for (const prop of Array.from(root.style)) {
      if (prop.startsWith('--octa-')) {
        const value = root.style.getPropertyValue(prop);
        variables.push(`${prop}: ${value};`);
      }
    }

    // Also get computed styles for variables set via stylesheets
    const allProperties = this.getAllCssVariables();
    for (const [prop, value] of allProperties) {
      if (!variables.some(v => v.startsWith(prop))) {
        variables.push(`${prop}: ${value};`);
      }
    }

    this.cachedVariables = `:host { ${variables.join(' ')} }`;
    return this.cachedVariables;
  }

  private getAllCssVariables(): Map<string, string> {
    const variables = new Map<string, string>();
    const root = this.document.documentElement;
    const computedStyles = getComputedStyle(root);

    // Iterate through all stylesheets to find CSS variables
    for (const sheet of Array.from(this.document.styleSheets)) {
      try {
        const rules = sheet.cssRules || sheet.rules;
        for (const rule of Array.from(rules)) {
          if (rule instanceof CSSStyleRule && rule.selectorText === ':root') {
            for (const prop of Array.from(rule.style)) {
              if (prop.startsWith('--octa-')) {
                variables.set(prop, rule.style.getPropertyValue(prop));
              }
            }
          }
        }
      } catch {
        // Cross-origin stylesheets will throw, ignore them
      }
    }

    // Add inline styles from root element
    for (const prop of Array.from(root.style)) {
      if (prop.startsWith('--octa-')) {
        variables.set(prop, root.style.getPropertyValue(prop));
      }
    }

    return variables;
  }

  private applyVariablesToShadowRoot(shadowRoot: ShadowRoot): void {
    const styleId = 'octa-theme-variables';
    
    // Remove existing style if present
    const existing = shadowRoot.getElementById(styleId);
    if (existing) {
      existing.remove();
    }

    // Create and inject new style element
    const style = this.document.createElement('style');
    style.id = styleId;
    style.textContent = this.getCssVariablesString();
    
    // Insert at the beginning of shadow root
    shadowRoot.insertBefore(style, shadowRoot.firstChild);
  }

  private waitForShadowRoot(element: HTMLElement): void {
    // Use MutationObserver to detect when shadow root is attached
    const observer = new MutationObserver(() => {
      if (element.shadowRoot) {
        observer.disconnect();
        this.injectIntoShadowRoot(element.shadowRoot);
      }
    });

    observer.observe(element, { childList: true, subtree: true });

    // Also check periodically for a short time (some frameworks delay shadow root creation)
    let attempts = 0;
    const maxAttempts = 10;
    const checkInterval = setInterval(() => {
      attempts++;
      if (element.shadowRoot) {
        clearInterval(checkInterval);
        observer.disconnect();
        this.injectIntoShadowRoot(element.shadowRoot);
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        observer.disconnect();
        this.logger.info('Element does not have shadow root after waiting');
      }
    }, 100);
  }

  private observeRootChanges(): void {
    const root = this.document.documentElement;
    
    this.observer = new MutationObserver((mutations) => {
      const hasStyleChange = mutations.some(
        m => m.type === 'attributes' && m.attributeName === 'style'
      );
      
      if (hasStyleChange) {
        this.cachedVariables = null;
        this.refreshAll();
      }
    });

    this.observer.observe(root, {
      attributes: true,
      attributeFilter: ['style', 'class', 'data-theme']
    });
  }

  /**
   * Cleanup - call when service is destroyed
   */
  destroy(): void {
    this.observer?.disconnect();
    this.trackedShadowRoots.clear();
    this.cachedVariables = null;
  }
}

