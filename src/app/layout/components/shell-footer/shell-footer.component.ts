import { Component, Input } from '@angular/core';

@Component({
  selector: 'octa-shell-footer',
  standalone: true,
  template: `
    <footer class="shell-footer">
      <span>{{ text }}</span>
      <span>Version: {{ version }}</span>
    </footer>
  `,
  styleUrls: ['./shell-footer.component.scss']
})
export class ShellFooterComponent {
  @Input() text = 'Octa microfrontends shell';
  @Input() version = 'v1';
}
