import { inject, Injectable } from '@angular/core';
import { LoggerService } from './logger.service';

type WebComponentName = 'formBuilder' | 'formSubmission' | 'formPreview';

interface WebComponentConfig {
  cssPath: string;
  jsPath: string;
}

const WEB_COMPONENT_PATHS: Record<WebComponentName, WebComponentConfig> = {
  formBuilder: {
    cssPath: 'assets/octa-form-builder-webcomponent/bundle.css',
    jsPath: 'assets/octa-form-builder-webcomponent/bundle.js'
  },
  formSubmission: {
    cssPath: 'assets/octa-form-submission-webcomponent/bundle.css',
    jsPath: 'assets/octa-form-submission-webcomponent/bundle.js'
  },
  formPreview: {
    cssPath: 'assets/octa-form-preview-webcomponent/bundle.css',
    jsPath: 'assets/octa-form-preview-webcomponent/bundle.js'
  }
};

@Injectable({ providedIn: 'root' })
export class WebComponentLoaderService {
  private readonly logger = inject(LoggerService);
  private readonly loaders = new Map<WebComponentName, Promise<void>>();
  private readonly loaded = new Set<WebComponentName>();

  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.type = 'text/javascript';
      script.onload = () => {
        this.logger.info(`Loaded script: ${src}`);
        resolve();
      };
      script.onerror = () => {
        this.logger.error(`Failed to load script: ${src}`);
        reject(new Error(`Failed to load script: ${src}`));
      };
      document.body.appendChild(script);
    });
  }

  private loadStyle(href: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`link[href="${href}"]`);
      if (existing) {
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = () => {
        this.logger.info(`Loaded style: ${href}`);
        resolve();
      };
      link.onerror = () => {
        this.logger.error(`Failed to load style: ${href}`);
        reject(new Error(`Failed to load style: ${href}`));
      };
      document.head.appendChild(link);
    });
  }

  private async load(name: WebComponentName): Promise<void> {
    if (this.loaded.has(name)) {
      return;
    }

    const existing = this.loaders.get(name);
    if (existing) {
      return existing;
    }

    const config = WEB_COMPONENT_PATHS[name];
    const loadPromise = (async () => {
      this.logger.info(`Loading web component: ${name}`);
      await this.loadStyle(config.cssPath);
      await this.loadScript(config.jsPath);
      this.loaded.add(name);
      this.logger.info(`Web component loaded: ${name}`);
    })();

    this.loaders.set(name, loadPromise);
    return loadPromise;
  }

  loadFormBuilder(): Promise<void> {
    return this.load('formBuilder');
  }

  loadFormSubmission(): Promise<void> {
    return this.load('formSubmission');
  }

  loadFormPreview(): Promise<void> {
    return this.load('formPreview');
  }

  isLoaded(name: WebComponentName): boolean {
    return this.loaded.has(name);
  }
}
