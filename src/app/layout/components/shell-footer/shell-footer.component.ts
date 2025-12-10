import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'octa-shell-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="shell-footer">
      <div class="shell-footer__left">
        <span class="shell-footer__text">{{ text }}</span>
        <span class="shell-footer__separator">•</span>
        <span class="shell-footer__copyright">© {{ currentYear }}</span>
      </div>

      <nav class="shell-footer__links" *ngIf="showLinks">
        <a href="#" class="shell-footer__link">Privacy</a>
        <a href="#" class="shell-footer__link">Terms</a>
        <a href="#" class="shell-footer__link">Support</a>
      </nav>

      <div class="shell-footer__right">
        <span class="shell-footer__tenant" *ngIf="tenant">{{ tenant }}</span>
        <span class="shell-footer__version">v{{ version }}</span>
      </div>
    </footer>
  `,
  styleUrls: ['./shell-footer.component.scss']
})
export class ShellFooterComponent {
  @Input() text = 'Octa microfrontends shell';
  @Input() version = '1.0.0';
  @Input() tenant = '';
  @Input() showLinks = true;

  readonly currentYear = new Date().getFullYear();
}
