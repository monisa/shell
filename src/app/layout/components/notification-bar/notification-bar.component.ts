import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

import { ShellNotification } from '../../../core/models/shell-config.model';

@Component({
  selector: 'octa-notification-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-bar.component.html',
  styleUrls: ['./notification-bar.component.scss']
})
export class NotificationBarComponent {
  @Input() notifications: ShellNotification[] = [];
}
