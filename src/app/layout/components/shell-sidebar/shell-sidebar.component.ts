import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { ShellMenuItem } from '../../../core/models/shell-config.model';

@Component({
  selector: 'octa-shell-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './shell-sidebar.component.html',
  styleUrls: ['./shell-sidebar.component.scss'],
  host: {
    '[class.collapsed]': 'collapsed'
  }
})
export class ShellSidebarComponent {
  @Input() menu: ShellMenuItem[] = [];
  @Input() logoUrl?: string;
  @Input() appName = 'Octa shell';
  @Input() collapsed = false;
  @Output() itemSelected = new EventEmitter<ShellMenuItem>();
  @Output() toggleCollapse = new EventEmitter<void>();

  readonly currentYear = new Date().getFullYear();

  iconVar(icon?: string): string {
    if (!icon) {
      return 'none';
    }
    return `var(--octa-icons-${icon})`;
  }

  onNavigate(item: ShellMenuItem): void {
    if (item.external && item.route) {
      window.open(item.route, '_blank');
      return;
    }

    this.itemSelected.emit(item);
  }

  onToggleCollapse(): void {
    this.toggleCollapse.emit();
  }
}
