import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

import { ShellNotification } from '../../../core/models/shell-config.model';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';

interface UserSummary {
  name: string;
  title: string;
  avatarUrl?: string;
}

@Component({
  selector: 'octa-shell-header',
  standalone: true,
  imports: [CommonModule, ThemeToggleComponent],
  template: `
    <header class="shell-header">
      <div class="shell-header__brand">
        <img *ngIf="logoUrl" [src]="logoUrl" [alt]="appName" class="shell-header__logo" />
        <div>
          <p class="shell-header__app-name">{{ appName }}</p>
          <p class="shell-header__app-desc">{{ subtitle }}</p>
        </div>
      </div>

      <div class="shell-header__actions">
        <octa-theme-toggle></octa-theme-toggle>
        <button type="button" class="shell-header__notifications" *ngIf="showNotifications">
          🔔
          <span class="shell-header__notifications-count" *ngIf="notificationCount > 0">
            {{ notificationCount }}
          </span>
        </button>
        <div class="shell-header__user" *ngIf="user as currentUser">
          <img
            *ngIf="currentUser.avatarUrl"
            [src]="currentUser.avatarUrl"
            [alt]="currentUser.name"
            class="shell-header__avatar"
          />
          <div>
            <p class="shell-header__user-name">{{ currentUser.name }}</p>
            <p class="shell-header__user-title">{{ currentUser.title }}</p>
          </div>
        </div>
      </div>
    </header>
  `,
  styleUrls: ['./shell-header.component.scss']
})
export class ShellHeaderComponent {
  @Input({ required: true }) appName!: string;
  @Input() subtitle = 'Multi-tenant workspace';
  @Input() logoUrl?: string;
  @Input() showNotifications = true;
  @Input() notificationCount = 0;
  @Input() notifications: ShellNotification[] = [];
  @Input() user?: UserSummary;
}
