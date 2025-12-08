import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'octa-dashboard-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="dashboard">
      <header>
        <div>
          <p class="eyebrow">Multi-tenant shell</p>
          <h1>Welcome to Octa</h1>
          <p>
            This dashboard demonstrates the reusable host layout. Microfrontends load into the
            content area below based on the runtime client configuration.
          </p>
        </div>
        <div class="dashboard__actions">
          <button type="button">Create workspace</button>
          <button type="button" class="secondary">Invite team</button>
        </div>
      </header>
      <div class="dashboard__grid">
        <article>
          <h3>Branding status</h3>
          <p>Runtime theme variables applied via JSON configuration.</p>
        </article>
        <article>
          <h3>MFE orchestration</h3>
          <p>Web components receive tenant tokens through CSS custom properties.</p>
        </article>
        <article>
          <h3>Caching</h3>
          <p>Theme definitions cached in localStorage with version invalidation.</p>
        </article>
      </div>
    </section>
  `,
  styleUrls: ['./dashboard-page.component.scss']
})
export class DashboardPageComponent {}
