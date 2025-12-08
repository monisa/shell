import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

import { ShellMenuItem } from './core/models/shell-config.model';
import { ShellConfigService } from './core/services/shell-config.service';
import { ThemeService } from './core/services/theme.service';
import { NotificationBarComponent } from './layout/components/notification-bar/notification-bar.component';
import { ShellFooterComponent } from './layout/components/shell-footer/shell-footer.component';
import { ShellHeaderComponent } from './layout/components/shell-header/shell-header.component';
import { ShellSidebarComponent } from './layout/components/shell-sidebar/shell-sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ShellHeaderComponent, ShellSidebarComponent, ShellFooterComponent, NotificationBarComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent {
  private readonly configService = inject(ShellConfigService);
  private readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);

  protected readonly config = this.configService.configSignal;
  protected readonly menu = computed(() => this.config()?.menu ?? []);
  protected readonly notifications = computed(() => this.config()?.notifications ?? []);
  protected readonly layout = computed(() => this.config()?.layout);
  protected readonly tenant = computed(() => this.config()?.tenant ?? '');
  protected readonly appName = computed(() => this.config()?.appName ?? 'Octa Shell');
  protected readonly user = computed(() => this.config()?.developer?.dummyUser ?? null);
  protected readonly logoUrl = computed(() => {
    const logos = this.themeService.logos();
    return logos['main']?.value ?? this.config()?.branding?.logoUrl ?? '';
  });

  constructor() {
    effect(() => {
      document.body.dataset['tenant'] = this.tenant();
    });

    effect(() => {
      const sidebarWidth = this.layout()?.sidebarWidth ?? '280px';
      document.documentElement.style.setProperty('--octa-layout-sidebar-width', sidebarWidth);
    });
  }

  async onMenuSelected(item: ShellMenuItem): Promise<void> {
    if (!item.route || item.external) {
      return;
    }

    await this.router.navigateByUrl(item.route);
  }
}
