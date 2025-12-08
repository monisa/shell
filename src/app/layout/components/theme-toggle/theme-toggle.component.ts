import { Component, computed, inject } from '@angular/core';
import { TitleCasePipe } from '@angular/common';

import { ThemeService } from '../../../core/services/theme.service';
import { ShellConfigService } from '../../../core/services/shell-config.service';

@Component({
  selector: 'octa-theme-toggle',
  standalone: true,
  imports: [TitleCasePipe],
  template: `
    <button type="button" class="theme-toggle" (click)="toggleMode()">
      <span class="theme-toggle__icon" [attr.data-mode]="mode()">
        {{ mode() === 'dark' ? '🌙' : '☀️' }}
      </span>
      <span class="theme-toggle__label">{{ mode() | titlecase }} mode</span>
    </button>
  `,
  styles: [
    `
      .theme-toggle {
        align-items: center;
        background: var(--octa-components-toggle-background, transparent);
        border: 1px solid var(--octa-components-toggle-border, transparent);
        border-radius: var(--octa-radius-pill, 999px);
        color: var(--octa-colors-on-surface, currentColor);
        cursor: pointer;
        display: inline-flex;
        font-size: 0.875rem;
        gap: 0.5rem;
        padding: 0.4rem 1rem;
        transition: background 0.2s ease;
      }

      .theme-toggle:hover {
        background: var(--octa-components-toggle-hover, rgba(0, 0, 0, 0.04));
      }

      .theme-toggle__icon {
        font-size: 1rem;
      }
    `
  ]
})
export class ThemeToggleComponent {
  private readonly themeService = inject(ThemeService);
  private readonly configService = inject(ShellConfigService);

  protected readonly mode = computed(() => this.themeService.currentMode());

  async toggleMode(): Promise<void> {
    const config = this.configService.configSignal();
    if (!config) {
      return;
    }
    await this.themeService.toggleMode(config.defaultTheme);
  }
}
