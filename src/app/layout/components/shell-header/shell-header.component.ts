import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

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
      <div class="shell-header__left">
        <button
          type="button"
          class="shell-header__menu-toggle"
          *ngIf="showMenuToggle"
          (click)="onMenuToggle()"
          [attr.aria-label]="sidebarCollapsed ? 'Open menu' : 'Close menu'"
        >
          <span class="shell-header__menu-icon" [class.open]="!sidebarCollapsed">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>

        <div class="shell-header__brand">
          <img *ngIf="logoUrl" [src]="logoUrl" [alt]="appName" class="shell-header__logo" />
          <div class="shell-header__brand-text">
            <p class="shell-header__app-name">{{ appName }}</p>
            <p class="shell-header__app-desc" *ngIf="subtitle">{{ subtitle }}</p>
          </div>
        </div>
      </div>

      <div class="shell-header__actions">
        <octa-theme-toggle></octa-theme-toggle>

        <button
          type="button"
          class="shell-header__notifications"
          *ngIf="showNotifications"
          [attr.aria-label]="'Notifications (' + notificationCount + ')'"
        >
          <svg class="shell-header__bell-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span class="shell-header__notifications-count" *ngIf="notificationCount > 0">
            {{ notificationCount > 99 ? '99+' : notificationCount }}
          </span>
        </button>

        <div class="shell-header__divider" *ngIf="user"></div>

        <div class="shell-header__user" *ngIf="user as currentUser">
          <div class="shell-header__avatar-wrapper">
            <img
              *ngIf="currentUser.avatarUrl"
              [src]="currentUser.avatarUrl"
              [alt]="currentUser.name"
              class="shell-header__avatar"
            />
            <span *ngIf="!currentUser.avatarUrl" class="shell-header__avatar-placeholder">
              {{ getInitials(currentUser.name) }}
            </span>
          </div>
          <div class="shell-header__user-info">
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
  @Input() showNotifications = false;
  @Input() notificationCount = 0;
  @Input() notifications: ShellNotification[] = [];
  @Input() user?: UserSummary;
  @Input() showMenuToggle = false;
  @Input() sidebarCollapsed = false;
  @Output() menuToggle = new EventEmitter<void>();

  onMenuToggle(): void {
    this.menuToggle.emit();
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }
}
