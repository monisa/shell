import { Component } from '@angular/core';

@Component({
  selector: 'octa-not-found',
  standalone: true,
  template: `
    <section class="not-found">
      <h2>404</h2>
      <p>The page you are looking for does not exist.</p>
    </section>
  `,
  styles: [
    `
      .not-found {
        align-items: center;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 2rem;
      }

      h2 {
        font-size: 3rem;
        margin: 0;
      }
    `
  ]
})
export class NotFoundComponent {}
