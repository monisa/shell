import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

import { ShellMfeDefinition } from '../models/shell-config.model';
import { LoggerService } from './logger.service';

@Injectable({ providedIn: 'root' })
export class MfeLoaderService {
  private readonly document = inject(DOCUMENT);
  private readonly logger = inject(LoggerService);
  private readonly loadingScripts = new Map<string, Promise<void>>();

  async ensureLoaded(definition: ShellMfeDefinition, useLocal = false): Promise<void> {
    if (!definition.remoteEntry) {
      return;
    }

    const url = useLocal && definition.localDev?.remoteEntry
      ? definition.localDev.remoteEntry
      : definition.remoteEntry;

    if (!url) {
      return;
    }

    if (!this.loadingScripts.has(url)) {
      this.loadingScripts.set(url, this.appendScript(url));
    }

    await this.loadingScripts.get(url);
  }

  private async appendScript(url: string): Promise<void> {
    this.logger.info(`Loading remote entry: ${url}`);

    await new Promise<void>((resolve, reject) => {
      const script = this.document.createElement('script');
      script.src = url;
      script.type = 'text/javascript';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = (err) => reject(err);
      this.document.body.appendChild(script);
    });
  }
}
