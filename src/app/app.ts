import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal, HostListener } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

import { ShellMenuItem } from './core/models/shell-config.model';
import { ShellConfigService } from './core/services/shell-config.service';
import { ThemeService } from './core/services/theme.service';
import { NotificationBarComponent } from './layout/components/notification-bar/notification-bar.component';
import { ShellFooterComponent } from './layout/components/shell-footer/shell-footer.component';
import { ShellHeaderComponent } from './layout/components/shell-header/shell-header.component';
import { ShellSidebarComponent } from './layout/components/shell-sidebar/shell-sidebar.component';

const MOBILE_BREAKPOINT = 768;

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
  protected readonly description = computed(() => this.config()?.description ?? 'Multi-tenant workspace');
  protected readonly user = computed(() => this.config()?.developer?.dummyUser ?? null);
  protected readonly showNotifications = computed(() => this.layout()?.showNotifications ?? false);
  protected readonly showNotificationBar = computed(() => this.layout()?.showNotificationBar !== false); // default true
  protected readonly showSidebar = computed(() => this.layout()?.showSidebar !== false); // default true
  protected readonly showFooter = computed(() => this.layout()?.showFooter !== false); // default true
  protected readonly sidebarPosition = computed(() => this.layout()?.sidebar ?? 'left');
  protected readonly logoUrl = computed(() => {
    const logos = this.themeService.logos();
    return logos['main']?.value ?? this.config()?.branding?.logoUrl ?? '';
  });

  // Sidebar state management
  protected readonly isMobile = signal(typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT);
  protected readonly sidebarOpen = signal(false);
  protected readonly sidebarCollapsed = signal(false);

  constructor() {
    effect(() => {
      document.body.dataset['tenant'] = this.tenant();
    });

    effect(() => {
      const sidebarWidth = this.layout()?.sidebarWidth ?? '280px';
      document.documentElement.style.setProperty('--octa-layout-sidebar-width', sidebarWidth);
    });
  }

  @HostListener('window:resize')
  onResize(): void {
    const wasMobile = this.isMobile();
    const nowMobile = window.innerWidth < MOBILE_BREAKPOINT;
    this.isMobile.set(nowMobile);

    // Close sidebar when transitioning from mobile to desktop
    if (wasMobile && !nowMobile) {
      this.sidebarOpen.set(false);
    }
  }

  toggleSidebar(): void {
    if (this.isMobile()) {
      this.sidebarOpen.update((open) => !open);
    } else {
      this.sidebarCollapsed.update((collapsed) => !collapsed);
    }
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  async onMenuSelected(item: ShellMenuItem): Promise<void> {
    // Close mobile sidebar on navigation
    if (this.isMobile()) {
      this.closeSidebar();
    }

    if (!item.route || item.external) {
      return;
    }

    await this.router.navigateByUrl(item.route);
  }
}
