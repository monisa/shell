import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ShellConfigService } from '../../../core/services/shell-config.service';
import { MfeLoaderService } from '../../../core/services/mfe-loader.service';
import { LoggerService } from '../../../core/services/logger.service';
import { ShellMfeDefinition } from '../../../core/models/shell-config.model';

@Component({
  selector: 'octa-mfe-host',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mfe-host.component.html',
  styleUrls: ['./mfe-host.component.scss']
})
export class MfeHostComponent {
  @ViewChild('mount', { static: true }) mountPoint?: ElementRef<HTMLDivElement>;

  private readonly route = inject(ActivatedRoute);
  private readonly configService = inject(ShellConfigService);
  private readonly mfeLoader = inject(MfeLoaderService);
  private readonly logger = inject(LoggerService);

  protected readonly status = signal<'loading' | 'ready' | 'error'>('loading');
  protected readonly title = signal<string>('');
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe(async (params) => {
      const mfeId = params.get('mfeId');
      if (!mfeId) {
        this.status.set('error');
        this.error.set('Missing microfrontend id.');
        return;
      }

      const definition = this.configService.findMfe(mfeId);
      if (!definition) {
        this.status.set('error');
        this.error.set(`Unknown microfrontend: ${mfeId}`);
        return;
      }

      await this.loadDefinition(definition);
    });
  }

  private async loadDefinition(definition: ShellMfeDefinition): Promise<void> {
    this.status.set('loading');
    this.error.set(null);
    this.title.set(definition.displayName);

    try {
      await this.mfeLoader.ensureLoaded(definition);
      this.mount(definition);
      this.status.set('ready');
    } catch (err) {
      this.logger.error(`Failed to load ${definition.id}`, err);
      this.status.set('error');
      this.error.set('Unable to load remote module. Check console for details.');
    }
  }

  private mount(definition: ShellMfeDefinition): void {
    if (!this.mountPoint?.nativeElement) {
      return;
    }

    const mountElement = this.mountPoint.nativeElement;
    mountElement.innerHTML = '';

    const tagName = definition.tagName ?? definition.elementName;
    if (!tagName) {
      this.error.set('Microfrontend does not expose a custom element.');
      return;
    }

    const customElement = document.createElement(tagName);
    customElement.setAttribute('data-tenant', this.configService.configSignal()?.tenant ?? 'default');
    customElement.setAttribute('data-theme-mode', this.configService.configSignal()?.defaultTheme.defaultMode ?? 'light');
    mountElement.appendChild(customElement);
  }
}
