import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';

import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'octa-style-guide',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './style-guide.component.html',
  styleUrls: ['./style-guide.component.scss']
})
export class StyleGuideComponent {
  private readonly themeService = inject(ThemeService);
  protected readonly colors = computed(() => {
    const theme = this.themeService.currentTheme();
    if (!theme?.colors) {
      return [];
    }

    return Object.entries(theme.colors).filter(([, value]) => typeof value === 'string');
  });
}
